import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  AtmosphereTheme,
  BookMetadata,
  FontFamily,
  PaperTonePreset,
  RenderedPage
} from '../types/epub';
import {
  createCoverTexture,
  createPaperEdgeTexture,
  createWoodTexture,
  renderPageToCanvas,
  PageRenderOptions
} from '../utils/proceduralTextures';
import { playPageTurnSound } from '../utils/audioEffects';

interface Book3DSceneProps {
  metadata: BookMetadata;
  pages: RenderedPage[];
  currentSpreadIndex: number; // Index of the left page (0, 2, 4, 6...)
  onTurnPage: (direction: 'next' | 'prev') => void;
  atmosphere: AtmosphereTheme;
  cameraMode: 'reader' | 'perspective' | 'orbit';
  soundEnabled: boolean;
  bionicReading?: boolean;
  fontFamily?: FontFamily;
  fontSize?: number;
  lineHeight?: number;
  paperTonePreset?: PaperTonePreset;
  readingZoom?: number;
}

const PAGE_WIDTH = 2.4;
const PAGE_HEIGHT = 3.4;
const COVER_THICKNESS = 0.05;

export const Book3DScene: React.FC<Book3DSceneProps> = ({
  metadata,
  pages,
  currentSpreadIndex,
  onTurnPage,
  atmosphere,
  cameraMode,
  soundEnabled,
  bionicReading = false,
  fontFamily = 'cormorant',
  fontSize = 26,
  lineHeight = 44,
  paperTonePreset = 'creme',
  readingZoom = 1.0
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 3D Objects refs
  const bookGroupRef = useRef<THREE.Group | null>(null);
  const leftPageMeshRef = useRef<THREE.Mesh | null>(null);
  const rightPageMeshRef = useRef<THREE.Mesh | null>(null);
  const leftStackMeshRef = useRef<THREE.Mesh | null>(null);
  const rightStackMeshRef = useRef<THREE.Mesh | null>(null);
  const turningPageMeshRef = useRef<THREE.Mesh | null>(null);
  const deskMeshRef = useRef<THREE.Mesh | null>(null);
  const candleLightRef = useRef<THREE.PointLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Flipping animation state
  const flipStateRef = useRef<{
    isFlipping: boolean;
    direction: 'next' | 'prev';
    progress: number;
    startTime: number;
    duration: number;
    frontTexture: THREE.CanvasTexture | null;
    backTexture: THREE.CanvasTexture | null;
  }>({
    isFlipping: false,
    direction: 'next',
    progress: 0,
    startTime: 0,
    duration: 650,
    frontTexture: null,
    backTexture: null
  });

  // Camera animation targets
  const targetCamPos = useRef(new THREE.Vector3(0, 4.0, 2.0));
  const targetCamLook = useRef(new THREE.Vector3(0, 0, 0.0));
  const currentCamPos = useRef(new THREE.Vector3(0, 4.0, 2.0));
  const currentCamLook = useRef(new THREE.Vector3(0, 0, 0.0));

  // Orbit drag state
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const orbitAngle = useRef({ theta: 0, phi: Math.PI / 4, radius: 4.8 });

  // Textures cache
  const coverTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const backCoverTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const paperEdgeTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Helper to get page by index
  const getPage = useCallback((idx: number) => {
    return pages[idx] || null;
  }, [pages]);

  // Memoized page render options (typography, contrast, bionic reading)
  const getRenderOptions = useCallback((): PageRenderOptions => {
    const paperColors: Record<PaperTonePreset, { paper: string; text: string }> = {
      creme: { paper: '#fbf7ee', text: '#1c1611' },
      white: { paper: '#ffffff', text: '#111111' },
      sepia: { paper: '#f4ecd8', text: '#2b1f14' },
      dark: { paper: '#1c1a18', text: '#e6ded1' }
    };

    const fontFamilies: Record<FontFamily, string> = {
      cormorant: '"Cormorant Garamond", Georgia, serif',
      'source-serif': '"Source Serif 4", Georgia, serif',
      sans: '"Plus Jakarta Sans", -apple-system, sans-serif',
      mono: '"JetBrains Mono", monospace'
    };

    const activeTone = paperColors[paperTonePreset] || paperColors.creme;
    return {
      paperTone: activeTone.paper,
      textColor: activeTone.text,
      fontFamily: fontFamilies[fontFamily] || fontFamilies.cormorant,
      fontSize,
      lineHeight,
      bionicReading
    };
  }, [bionicReading, fontFamily, fontSize, lineHeight, paperTonePreset]);

  // Update page textures on static meshes
  const updateStaticPageTextures = useCallback(() => {
    if (!leftPageMeshRef.current || !rightPageMeshRef.current) return;

    const leftPage = getPage(currentSpreadIndex);
    const rightPage = getPage(currentSpreadIndex + 1);
    const opts = getRenderOptions();

    // Render left canvas
    const leftCanvas = renderPageToCanvas(leftPage, true, opts);
    const leftTex = new THREE.CanvasTexture(leftCanvas);
    leftTex.anisotropy = 16;
    const leftMat = leftPageMeshRef.current.material as THREE.MeshStandardMaterial;
    if (leftMat.map) leftMat.map.dispose();
    leftMat.map = leftTex;
    leftMat.needsUpdate = true;

    // Render right canvas
    const rightCanvas = renderPageToCanvas(rightPage, false, opts);
    const rightTex = new THREE.CanvasTexture(rightCanvas);
    rightTex.anisotropy = 16;
    const rightMat = rightPageMeshRef.current.material as THREE.MeshStandardMaterial;
    if (rightMat.map) rightMat.map.dispose();
    rightMat.map = rightTex;
    rightMat.needsUpdate = true;

    if (turningPageMeshRef.current && !flipStateRef.current.isFlipping) {
      turningPageMeshRef.current.visible = false;
    }

    // Adjust stack thickness based on progress
    const total = Math.max(pages.length, 1);
    const progress = Math.min(Math.max(currentSpreadIndex / total, 0), 1);
    const maxThickness = 0.16;
    const minThickness = 0.02;

    const leftThickness = minThickness + progress * (maxThickness - minThickness);
    const rightThickness = maxThickness - progress * (maxThickness - minThickness);

    if (leftStackMeshRef.current) {
      // Scale along Y (vertical thickness), NOT Z!
      leftStackMeshRef.current.scale.set(1, leftThickness / 0.1, 1);
      leftStackMeshRef.current.position.set(-PAGE_WIDTH / 2, -leftThickness / 2, 0);
    }
    if (rightStackMeshRef.current) {
      // Scale along Y (vertical thickness), NOT Z!
      rightStackMeshRef.current.scale.set(1, rightThickness / 0.1, 1);
      rightStackMeshRef.current.position.set(PAGE_WIDTH / 2, -rightThickness / 2, 0);
    }

    if (leftPageMeshRef.current) {
      leftPageMeshRef.current.position.y = 0.005;
    }
    if (rightPageMeshRef.current) {
      rightPageMeshRef.current.position.y = 0.005;
    }
  }, [currentSpreadIndex, getPage, getRenderOptions, pages.length]);

  // Handle page turn trigger
  const triggerPageFlip = useCallback(
    (direction: 'next' | 'prev') => {
      if (flipStateRef.current.isFlipping) return;

      if (direction === 'next' && currentSpreadIndex + 2 >= pages.length) return;
      if (direction === 'prev' && currentSpreadIndex <= 0) return;

      if (soundEnabled) {
        playPageTurnSound(0.65);
      }

      const opts = getRenderOptions();

      // Dispose old turning page textures if any
      if (flipStateRef.current.frontTexture) flipStateRef.current.frontTexture.dispose();
      if (flipStateRef.current.backTexture) flipStateRef.current.backTexture.dispose();

      // Prepare flip meshes
      if (direction === 'next') {
        const currentRight = getPage(currentSpreadIndex + 1);
        const nextLeft = getPage(currentSpreadIndex + 2);
        const nextRight = getPage(currentSpreadIndex + 3);

        const frontCanvas = renderPageToCanvas(currentRight, false, opts);
        const backCanvas = renderPageToCanvas(nextLeft, true, opts);

        const frontTex = new THREE.CanvasTexture(frontCanvas);
        const backTex = new THREE.CanvasTexture(backCanvas);
        frontTex.anisotropy = 16;
        backTex.anisotropy = 16;

        // Reveal the next right page under the turning right page immediately
        if (rightPageMeshRef.current) {
          const underCanvas = renderPageToCanvas(nextRight, false, opts);
          const underTex = new THREE.CanvasTexture(underCanvas);
          underTex.anisotropy = 16;
          const oldMat = rightPageMeshRef.current.material as THREE.MeshStandardMaterial;
          if (oldMat.map) oldMat.map.dispose();
          oldMat.map = underTex;
          oldMat.needsUpdate = true;
        }

        flipStateRef.current = {
          isFlipping: true,
          direction: 'next',
          progress: 0,
          startTime: performance.now(),
          duration: 620,
          frontTexture: frontTex,
          backTexture: backTex
        };

        if (turningPageMeshRef.current) {
          turningPageMeshRef.current.rotation.y = 0;
          turningPageMeshRef.current.position.y = 0.015;
          turningPageMeshRef.current.visible = true;
          const materials = turningPageMeshRef.current.material as THREE.Material[];
          (materials[0] as THREE.MeshStandardMaterial).map = frontTex;
          (materials[0] as THREE.MeshStandardMaterial).needsUpdate = true;
          (materials[1] as THREE.MeshStandardMaterial).map = backTex;
          (materials[1] as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      } else {
        const currentLeft = getPage(currentSpreadIndex);
        const prevRight = getPage(currentSpreadIndex - 1);
        const prevLeft = getPage(currentSpreadIndex - 2);

        const frontCanvas = renderPageToCanvas(prevRight, false, opts);
        const backCanvas = renderPageToCanvas(currentLeft, true, opts);

        const frontTex = new THREE.CanvasTexture(frontCanvas);
        const backTex = new THREE.CanvasTexture(backCanvas);
        frontTex.anisotropy = 16;
        backTex.anisotropy = 16;

        // Reveal previous left page under the turning left page immediately
        if (leftPageMeshRef.current) {
          const underCanvas = renderPageToCanvas(prevLeft, true, opts);
          const underTex = new THREE.CanvasTexture(underCanvas);
          underTex.anisotropy = 16;
          const oldMat = leftPageMeshRef.current.material as THREE.MeshStandardMaterial;
          if (oldMat.map) oldMat.map.dispose();
          oldMat.map = underTex;
          oldMat.needsUpdate = true;
        }

        flipStateRef.current = {
          isFlipping: true,
          direction: 'prev',
          progress: 1,
          startTime: performance.now(),
          duration: 620,
          frontTexture: frontTex,
          backTexture: backTex
        };

        if (turningPageMeshRef.current) {
          turningPageMeshRef.current.rotation.y = -Math.PI;
          turningPageMeshRef.current.position.y = 0.015;
          turningPageMeshRef.current.visible = true;
          const materials = turningPageMeshRef.current.material as THREE.Material[];
          (materials[0] as THREE.MeshStandardMaterial).map = frontTex;
          (materials[0] as THREE.MeshStandardMaterial).needsUpdate = true;
          (materials[1] as THREE.MeshStandardMaterial).map = backTex;
          (materials[1] as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      }
    },
    [currentSpreadIndex, getPage, getRenderOptions, pages.length, soundEnabled]
  );

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#100c0a');

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 4.0, 2.0);
    camera.lookAt(0, 0, 0.0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Desk surface
    const deskGeometry = new THREE.PlaneGeometry(16, 14);
    const deskTexture = createWoodTexture('#24150f', '#130a07');
    const deskMaterial = new THREE.MeshStandardMaterial({
      map: deskTexture,
      roughness: 0.65,
      metalness: 0.08
    });
    const deskMesh = new THREE.Mesh(deskGeometry, deskMaterial);
    deskMesh.rotation.x = -Math.PI / 2;
    deskMesh.position.y = -0.15;
    deskMesh.receiveShadow = true;
    scene.add(deskMesh);
    deskMeshRef.current = deskMesh;

    // Book Group
    const bookGroup = new THREE.Group();
    scene.add(bookGroup);
    bookGroupRef.current = bookGroup;

    // Cover textures
    const coverTex = createCoverTexture(metadata, false);
    coverTextureRef.current = coverTex;
    const backCoverTex = createCoverTexture(metadata, true);
    backCoverTextureRef.current = backCoverTex;
    const paperEdgeTex = createPaperEdgeTexture('#f2ebdc');
    paperEdgeTextureRef.current = paperEdgeTex;

    // Hardcover boards (Left board, right board, spine)
    const coverMat = new THREE.MeshStandardMaterial({
      map: coverTex,
      roughness: 0.45,
      metalness: 0.15
    });

    const coverGeom = new THREE.BoxGeometry(PAGE_WIDTH + 0.08, COVER_THICKNESS, PAGE_HEIGHT + 0.1);

    // Left cover board
    const leftCover = new THREE.Mesh(coverGeom, coverMat);
    leftCover.position.set(-(PAGE_WIDTH / 2 + 0.04), -0.12, 0);
    leftCover.receiveShadow = true;
    leftCover.castShadow = true;
    bookGroup.add(leftCover);

    // Right cover board
    const rightCover = new THREE.Mesh(coverGeom, coverMat);
    rightCover.position.set(PAGE_WIDTH / 2 + 0.04, -0.12, 0);
    rightCover.receiveShadow = true;
    rightCover.castShadow = true;
    bookGroup.add(rightCover);

    // Spine (running along Z axis, curving downwards underneath the binding)
    const spineGeom = new THREE.CylinderGeometry(0.12, 0.12, PAGE_HEIGHT + 0.08, 16, 1, true, Math.PI, Math.PI);
    const spineMesh = new THREE.Mesh(spineGeom, coverMat);
    spineMesh.rotation.x = Math.PI / 2;
    spineMesh.position.set(0, -0.12, 0);
    bookGroup.add(spineMesh);

    // Paper stack blocks (simulate pages thickness)
    const paperStackMat = new THREE.MeshStandardMaterial({
      map: paperEdgeTex,
      roughness: 0.8
    });
    const stackGeom = new THREE.BoxGeometry(PAGE_WIDTH, 0.1, PAGE_HEIGHT);

    const leftStack = new THREE.Mesh(stackGeom, paperStackMat);
    leftStack.position.set(-PAGE_WIDTH / 2, -0.05, 0);
    leftStack.castShadow = true;
    leftStack.receiveShadow = true;
    bookGroup.add(leftStack);
    leftStackMeshRef.current = leftStack;

    const rightStack = new THREE.Mesh(stackGeom, paperStackMat);
    rightStack.position.set(PAGE_WIDTH / 2, -0.05, 0);
    rightStack.castShadow = true;
    rightStack.receiveShadow = true;
    bookGroup.add(rightStack);
    rightStackMeshRef.current = rightStack;

    // Static Left Page
    const pageGeom = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT);
    const leftPageMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const leftPageMesh = new THREE.Mesh(pageGeom, leftPageMat);
    leftPageMesh.rotation.x = -Math.PI / 2;
    leftPageMesh.position.set(-PAGE_WIDTH / 2, 0.005, 0);
    leftPageMesh.receiveShadow = true;
    bookGroup.add(leftPageMesh);
    leftPageMeshRef.current = leftPageMesh;

    // Static Right Page
    const rightPageMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const rightPageMesh = new THREE.Mesh(pageGeom, rightPageMat);
    rightPageMesh.rotation.x = -Math.PI / 2;
    rightPageMesh.position.set(PAGE_WIDTH / 2, 0.005, 0);
    rightPageMesh.receiveShadow = true;
    bookGroup.add(rightPageMesh);
    rightPageMeshRef.current = rightPageMesh;

    // Turning Page (Dynamic Curling Mesh with multi-segment geometry)
    const turningGeom = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, 32, 6);
    // Shift origin of turning page to its left hinge (spine)
    turningGeom.translate(PAGE_WIDTH / 2, 0, 0);

    const frontMat = new THREE.MeshStandardMaterial({
      roughness: 0.88,
      side: THREE.FrontSide
    });
    const backMat = new THREE.MeshStandardMaterial({
      roughness: 0.88,
      side: THREE.BackSide
    });

    // Create group for turning page to support double-sided front/back rendering
    const turningPageGroup = new THREE.Group();
    const frontMesh = new THREE.Mesh(turningGeom, frontMat);
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;

    const backMesh = new THREE.Mesh(turningGeom, backMat);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;

    turningPageGroup.add(frontMesh);
    turningPageGroup.add(backMesh);
    turningPageGroup.rotation.x = -Math.PI / 2;
    turningPageGroup.position.set(0, 0.012, 0);
    turningPageGroup.visible = false;
    bookGroup.add(turningPageGroup);

    // Save compound ref:
    (turningPageGroup as unknown as { material: THREE.Material[] }).material = [frontMat, backMat];
    turningPageMeshRef.current = turningPageGroup as unknown as THREE.Mesh;

    // Silken Ribbon Bookmark (Leseband) - elegantly hangs below the bottom edge onto the desk
    const ribbonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.02, -0.05, PAGE_HEIGHT / 2 - 0.05),
      new THREE.Vector3(0.08, -0.11, PAGE_HEIGHT / 2 + 0.2),
      new THREE.Vector3(0.14, -0.14, PAGE_HEIGHT / 2 + 0.45),
      new THREE.Vector3(0.22, -0.148, PAGE_HEIGHT / 2 + 0.75)
    ]);
    const ribbonGeom = new THREE.TubeGeometry(ribbonCurve, 24, 0.022, 8, false);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: '#9e1b24',
      roughness: 0.4,
      metalness: 0.08
    });
    const ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
    ribbonMesh.castShadow = true;
    bookGroup.add(ribbonMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight('#fff4e0', 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight('#fff0d8', 1.8);
    keyLight.position.set(2.5, 6.0, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    // Candle / Desk Lamp point light
    const candleLight = new THREE.PointLight('#ff9d3b', 1.2, 8, 1.8);
    candleLight.position.set(-2.8, 1.6, -1.2);
    candleLight.castShadow = true;
    scene.add(candleLight);
    candleLightRef.current = candleLight;

    // Fill rim light
    const rimLight = new THREE.DirectionalLight('#8db4ff', 0.4);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // Initial texture update
    updateStaticPageTextures();

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let lastTime = performance.now();

    const animate = (time: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Candle flicker effect
      if (candleLightRef.current) {
        const noise = Math.sin(time * 0.008) * 0.08 + Math.sin(time * 0.023) * 0.05;
        candleLightRef.current.intensity = 1.1 + noise;
      }

      // Smooth camera interpolation towards target
      if (cameraRef.current) {
        currentCamPos.current.lerp(targetCamPos.current, 0.07);
        currentCamLook.current.lerp(targetCamLook.current, 0.07);
        cameraRef.current.position.copy(currentCamPos.current);
        cameraRef.current.lookAt(currentCamLook.current);
      }

      // Handle page flip animation
      const flip = flipStateRef.current;
      if (flip.isFlipping && turningPageMeshRef.current) {
        const elapsed = time - flip.startTime;
        const norm = Math.min(elapsed / flip.duration, 1);

        // Smooth easeInOutCubic
        const ease = norm < 0.5 ? 4 * norm * norm * norm : 1 - Math.pow(-2 * norm + 2, 3) / 2;

        if (flip.direction === 'next') {
          // Angle rotates from 0 to -PI
          const angle = -ease * Math.PI;
          turningPageMeshRef.current.rotation.y = angle;

          // Realistic dynamic page curvature along arc
          const curlFactor = Math.sin(ease * Math.PI) * 0.45;
          // Apply gentle lifting wave
          turningPageMeshRef.current.position.y = 0.015 + curlFactor * 0.2;

          if (norm >= 1) {
            // Flip completed
            flip.isFlipping = false;
            turningPageMeshRef.current.visible = false;
            onTurnPage('next');
          }
        } else {
          // Backward flip (left to right): angle rotates from -PI to 0
          const angle = -(1 - ease) * Math.PI;
          turningPageMeshRef.current.rotation.y = angle;

          const curlFactor = Math.sin(ease * Math.PI) * 0.45;
          turningPageMeshRef.current.position.y = 0.015 + curlFactor * 0.2;

          if (norm >= 1) {
            flip.isFlipping = false;
            turningPageMeshRef.current.visible = false;
            onTurnPage('prev');
          }
        }
      }

      renderer.render(scene, camera);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update static textures whenever spread or book changes
  useEffect(() => {
    updateStaticPageTextures();
  }, [currentSpreadIndex, updateStaticPageTextures]);

  // Atmosphere updates
  useEffect(() => {
    if (!sceneRef.current) return;

    if (atmosphere === 'candlelight') {
      sceneRef.current.background = new THREE.Color('#100b08');
      if (ambientLightRef.current) {
        ambientLightRef.current.color.set('#fdeed3');
        ambientLightRef.current.intensity = 0.85;
      }
      if (keyLightRef.current) {
        keyLightRef.current.color.set('#ffe6c4');
        keyLightRef.current.intensity = 1.7;
      }
      if (candleLightRef.current) {
        candleLightRef.current.visible = true;
        candleLightRef.current.color.set('#ff9933');
      }
    } else if (atmosphere === 'midnight') {
      sceneRef.current.background = new THREE.Color('#080a0f');
      if (ambientLightRef.current) {
        ambientLightRef.current.color.set('#b4c6e7');
        ambientLightRef.current.intensity = 0.55;
      }
      if (keyLightRef.current) {
        keyLightRef.current.color.set('#d0e0ff');
        keyLightRef.current.intensity = 1.2;
      }
      if (candleLightRef.current) {
        candleLightRef.current.visible = true;
        candleLightRef.current.color.set('#7a9fff');
      }
    } else if (atmosphere === 'banker') {
      sceneRef.current.background = new THREE.Color('#0b120c');
      if (ambientLightRef.current) {
        ambientLightRef.current.color.set('#e8f5e9');
        ambientLightRef.current.intensity = 0.75;
      }
      if (keyLightRef.current) {
        keyLightRef.current.color.set('#fff8e1');
        keyLightRef.current.intensity = 1.6;
      }
      if (candleLightRef.current) {
        candleLightRef.current.visible = true;
        candleLightRef.current.color.set('#81c784');
      }
    } else if (atmosphere === 'daylight') {
      sceneRef.current.background = new THREE.Color('#ece7de');
      if (ambientLightRef.current) {
        ambientLightRef.current.color.set('#ffffff');
        ambientLightRef.current.intensity = 1.2;
      }
      if (keyLightRef.current) {
        keyLightRef.current.color.set('#fffaf0');
        keyLightRef.current.intensity = 1.9;
      }
      if (candleLightRef.current) {
        candleLightRef.current.visible = false;
      }
    }
  }, [atmosphere]);

  // Camera Mode updates & Reading Zoom
  useEffect(() => {
    const zoom = Math.max(0.75, Math.min(1.5, readingZoom));
    if (cameraMode === 'reader') {
      targetCamPos.current.set(0, 4.0 / zoom, 2.0 / zoom);
      targetCamLook.current.set(0, 0, 0.0);
    } else if (cameraMode === 'perspective') {
      targetCamPos.current.set(1.5 / zoom, 3.4 / zoom, 2.8 / zoom);
      targetCamLook.current.set(0, 0, 0.0);
    } else if (cameraMode === 'orbit') {
      // Keep current orbit angle
      const r = orbitAngle.current.radius;
      const theta = orbitAngle.current.theta;
      const phi = orbitAngle.current.phi;
      targetCamPos.current.set(
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta)
      );
      targetCamLook.current.set(0, 0, 0);
    }
  }, [cameraMode, readingZoom]);

  const pointerStartPos = useRef({ x: 0, y: 0 });
  const totalDragDistance = useRef(0);

  // Click / Drag handlers on Canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    totalDragDistance.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;
    totalDragDistance.current += Math.hypot(deltaX, deltaY);
    previousMousePosition.current = { x: e.clientX, y: e.clientY };

    if (cameraMode === 'orbit') {
      orbitAngle.current.theta -= deltaX * 0.008;
      orbitAngle.current.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, orbitAngle.current.phi - deltaY * 0.008));

      const r = orbitAngle.current.radius;
      const theta = orbitAngle.current.theta;
      const phi = orbitAngle.current.phi;
      targetCamPos.current.set(
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta)
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;

    // Detect horizontal swipe in reader or perspective mode
    if (cameraMode !== 'orbit') {
      const swipeX = e.clientX - pointerStartPos.current.x;
      const swipeY = e.clientY - pointerStartPos.current.y;

      if (Math.abs(swipeX) > 50 && Math.abs(swipeX) > Math.abs(swipeY) * 1.5) {
        if (swipeX < -50) {
          triggerPageFlip('next');
        } else if (swipeX > 50) {
          triggerPageFlip('prev');
        }
      }
    }
  };

  // Direct Click on Page edge to turn page
  const handleClick = (e: React.MouseEvent) => {
    // If pointer was dragging or swiping, do not treat as click
    if (totalDragDistance.current > 10) return;

    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to check if left or right page was clicked
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(
      [leftPageMeshRef.current, rightPageMeshRef.current].filter(Boolean) as THREE.Object3D[]
    );

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit === rightPageMeshRef.current) {
        triggerPageFlip('next');
      } else if (hit === leftPageMeshRef.current) {
        triggerPageFlip('prev');
      }
    }
  };

  // Wheel zoom in orbit mode
  const handleWheel = (e: React.WheelEvent) => {
    if (cameraMode === 'orbit') {
      orbitAngle.current.radius = Math.max(2.5, Math.min(8.0, orbitAngle.current.radius + e.deltaY * 0.004));
      const r = orbitAngle.current.radius;
      const theta = orbitAngle.current.theta;
      const phi = orbitAngle.current.phi;
      targetCamPos.current.set(
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(theta)
      );
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        triggerPageFlip('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        triggerPageFlip('prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerPageFlip]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      {/* Subtle interactive page turn click regions */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          triggerPageFlip('prev');
        }}
        disabled={currentSpreadIndex <= 0}
        aria-label="Vorherige Seite"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-24 rounded-r-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-black/25 transition-all disabled:opacity-0 disabled:pointer-events-none focus:outline-none"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          triggerPageFlip('next');
        }}
        disabled={currentSpreadIndex + 2 >= pages.length}
        aria-label="Nächste Seite"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-24 rounded-l-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-black/25 transition-all disabled:opacity-0 disabled:pointer-events-none focus:outline-none"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Floating 3D Hint for Camera Mode */}
      {cameraMode === 'orbit' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-xs text-stone-300 font-sans tracking-wide">
          Ziehen zum Rotieren · Scrollen zum Zoomen
        </div>
      )}
    </div>
  );
};
