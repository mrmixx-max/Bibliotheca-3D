import { ParsedBook } from '../types/epub';

/**
 * Generates and downloads a complete, self-contained single-file HTML
 * with embedded Three.js, CSS styles, procedural textures, and book reader.
 *
 * Fully offline: Three.js is inlined (no CDN) and only system font stacks are
 * used (no Google Fonts request), so the exported file renders on a machine
 * with no network connection.
 *
 * The inlined Three.js bundle is ~726 kB and is only needed when a book is
 * actually exported, so it is loaded via dynamic import. Vite splits it into
 * its own chunk and the reader itself never pays for it.
 */
export async function exportStandaloneHtmlFile(book: ParsedBook) {
  const { THREE_BUNDLE_JS } = await import('./threeBundle.generated');
  // Only metadata + pages are needed by the exported reader. The chapters array
  // holds the full chapter HTML including base64-inlined EPUB images, which the
  // exporter never renders — dropping it keeps exported files small.
  const serializedBook = JSON.stringify({
    metadata: book.metadata,
    pages: book.pages
  }).replace(/</g, '\\u003c');

  const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(book.metadata.title)} - Bibliotheca 3D</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #120d0a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, serif; color: #f0e6d2; user-select: none; }
    #canvas-container { position: absolute; inset: 0; width: 100%; height: 100%; }
    .hud-top { position: absolute; top: 0; left: 0; right: 0; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%); z-index: 10; }
    .brand { font-size: 18px; font-weight: 700; letter-spacing: 0.05em; color: #dfba5a; text-transform: uppercase; }
    .hud-bottom { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 16px; background: rgba(18, 14, 11, 0.85); backdrop-filter: blur(12px); border: 1px solid rgba(223, 186, 90, 0.2); border-radius: 9999px; padding: 8px 24px; z-index: 10; box-shadow: 0 12px 32px rgba(0,0,0,0.6); }
    .btn { background: none; border: none; color: #d0c0a0; font-size: 14px; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.2s; }
    .btn:hover { background: rgba(223, 186, 90, 0.15); color: #fff; }
    .page-info { font-size: 13px; color: #a09078; font-variant-numeric: tabular-nums; }
    .side-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 60px; height: 120px; background: rgba(0,0,0,0.2); border: none; color: rgba(255,255,255,0.4); font-size: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 10; }
    .side-nav:hover { background: rgba(0,0,0,0.5); color: #fff; }
    .side-left { left: 0; border-radius: 0 12px 12px 0; }
    .side-right { right: 0; border-radius: 12px 0 0 12px; }
  </style>
  <script>${THREE_BUNDLE_JS}</script>
</head>
<body>
  <div id="canvas-container"></div>
  <header class="hud-top">
    <div class="brand">BIBLIOTHECA 3D</div>
    <div style="font-size: 14px; color: #c4b59d;">${escapeHtml(book.metadata.title)} · ${escapeHtml(book.metadata.author)}</div>
  </header>

  <button class="side-nav side-left" id="prev-btn">‹</button>
  <button class="side-nav side-right" id="next-btn">›</button>

  <footer class="hud-bottom">
    <button class="btn" id="btn-2d" title="Zwischen 3D-Buch und flacher 2D-Lesung wechseln">2D Modus</button>
    <button class="btn" id="btn-toc">Inhalt</button>
    <div class="page-info" id="page-counter">Seite 1 von ${book.pages.length}</div>
    <button class="btn" id="btn-cam">Kamera wechseln</button>
    <button class="btn" id="btn-bionic" title="Bionic Reading (Wortanker)">Bionic</button>
    <button class="btn" id="btn-iso" title="Isochrone Gehirnwellen-Töne (15.4Hz / 10Hz / 40Hz)">Isochron (15.4 Hz)</button>
  </footer>

  <script>
    const bookData = ${serializedBook};
    let currentSpread = 0;
    const pages = bookData.pages;

    // Procedural Wood
    function createWoodTexture() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#22140e'; ctx.fillRect(0,0,512,512);
      ctx.strokeStyle = '#140b07'; ctx.lineWidth = 1;
      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * 512);
        ctx.lineTo(512, Math.random() * 512);
        ctx.globalAlpha = 0.08;
        ctx.stroke();
      }
      return new THREE.CanvasTexture(c);
    }

    // Procedural Page Render
    function renderPage(page, isLeft) {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 1448;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fcf8f0'; ctx.fillRect(0,0,1024,1448);

      // Spine Gutter
      const g = ctx.createLinearGradient(isLeft ? 900 : 0, 0, isLeft ? 1024 : 124, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = g;
      ctx.fillRect(isLeft ? 900 : 0, 0, 124, 1448);

      if (!page) return c;

      // Header
      ctx.fillStyle = '#554332';
      ctx.font = 'italic 20px serif';
      ctx.textAlign = 'center';
      ctx.fillText(isLeft ? page.bookTitle : page.chapterTitle, 512, 90);

      // Body
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1c1611';
      ctx.font = '26px Georgia, serif';

      const div = document.createElement('div');
      // SAFE: page.htmlContent was passed through DOMPurify at parse time
      // (see BOOK_SANITIZE_CONFIG in epubParser.ts), so this markup contains no
      // scripts, event handlers or external references. The detached div is
      // only ever read via textContent below — it is never inserted into the
      // live document. The exported HTML string additionally escapes every
      // less-than sign in the serialized book data (see serializedBook above).
      div.innerHTML = page.htmlContent || '';
      div.querySelectorAll('script, style, h1, h2, h3').forEach(el => el.remove());

      const paragraphs = [];
      const images = [];
      const pEls = div.querySelectorAll('p, blockquote, div');
      if (pEls.length > 0) {
        pEls.forEach(el => {
          const t = (el.textContent || '').trim();
          if (t) paragraphs.push(t);
        });
      } else {
        const t = (div.textContent || '').trim();
        if (t) paragraphs.push(...t.split(/\n+/).map(s => s.trim()).filter(Boolean));
      }

      // Collect embedded images (data URLs from the EPUB) in document order
      div.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('data:image/')) images.push(src);
      });

      let y = 170;
      const margin = isLeft ? 110 : 130;
      const maxW = 1024 - margin - (isLeft ? 130 : 110);
      const maxY = 1340;

      for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
        if (y + 40 > maxY) break;
        const pText = paragraphs[pIdx];
        const words = pText.split(/\s+/).filter(Boolean);
        const indent = pIdx > 0 ? 32 : 0;

        if (!isBionic) {
          let line = '';
          let isFirstLine = true;
          for (let w of words) {
            let test = line ? line + ' ' + w : w;
            const curIndent = isFirstLine ? indent : 0;
            if (ctx.measureText(test).width > maxW - curIndent && line) {
              ctx.fillText(line, margin + curIndent, y);
              line = w;
              y += 40;
              isFirstLine = false;
              if (y > maxY) break;
            } else {
              line = test;
            }
          }
          if (line && y <= maxY) {
            ctx.fillText(line, margin + (isFirstLine ? indent : 0), y);
            y += 40;
          }
        } else {
          let curX = margin + indent;
          let isFirstLine = true;
          for (let w of words) {
            ctx.font = '26px Georgia, serif';
            const wWidth = ctx.measureText(w + ' ').width;
            if (curX + wWidth > margin + maxW) {
              curX = margin;
              y += 40;
              isFirstLine = false;
              if (y > maxY) break;
            }
            const anchor = w.length <= 3 ? 1 : (w.length <= 6 ? 2 : 3);
            const partA = w.slice(0, anchor);
            const partB = w.slice(anchor);

            ctx.font = 'bold 26px Georgia, serif';
            ctx.fillText(partA, curX, y);
            const partAW = ctx.measureText(partA).width;

            ctx.font = 'normal 26px Georgia, serif';
            ctx.fillText(partB + ' ', curX + partAW, y);
            curX += wWidth;
          }
          y += 40;
        }
        y += 14; // Paragraph gap
      }

      // Draw any embedded illustrations below the text block
      const imgHeight = 340;
      const imgWidth = Math.min(maxW, 480);
      for (const src of images) {
        if (y + imgHeight > maxY) break;
        const im = new Image();
        im.src = src;
        try {
          const scale = Math.min(imgWidth / im.width, imgHeight / im.height) || 1;
          const dw = (im.width || imgWidth) * scale;
          const dh = (im.height || imgHeight) * scale;
          ctx.drawImage(im, margin + (maxW - dw) / 2, y + 10, dw, dh);
          y += dh + 30;
        } catch (e) {
          // Image not decodable — skip it rather than aborting the page
        }
      }

      // Footer
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(page.pageNumber), 512, 1370);

      return c;
    }

    // Three.js Scene Setup
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#100b08');

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.set(0, 4.0, 2.0);
    camera.lookAt(0, 0, 0.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Desk
    const deskGeom = new THREE.PlaneGeometry(16, 14);
    const deskMat = new THREE.MeshStandardMaterial({ map: createWoodTexture(), roughness: 0.65 });
    const desk = new THREE.Mesh(deskGeom, deskMat);
    desk.rotation.x = -Math.PI / 2;
    desk.position.y = -0.15;
    desk.receiveShadow = true;
    scene.add(desk);

    // Lights
    const amb = new THREE.AmbientLight('#fff3df', 0.85);
    scene.add(amb);
    const key = new THREE.DirectionalLight('#ffe8c4', 1.8);
    key.position.set(2.5, 6, 3.5);
    key.castShadow = true;
    scene.add(key);

    const candle = new THREE.PointLight('#ff9933', 1.2, 8);
    candle.position.set(-2.8, 1.6, -1.2);
    scene.add(candle);

    // Book
    const book = new THREE.Group();
    scene.add(book);

    const coverGeom = new THREE.BoxGeometry(2.48, 0.05, 3.5);
    const coverMat = new THREE.MeshStandardMaterial({ color: '#2b1216', roughness: 0.45 });
    const leftCover = new THREE.Mesh(coverGeom, coverMat);
    leftCover.position.set(-1.24, -0.12, 0);
    leftCover.receiveShadow = true;
    book.add(leftCover);

    const rightCover = new THREE.Mesh(coverGeom, coverMat);
    rightCover.position.set(1.24, -0.12, 0);
    rightCover.receiveShadow = true;
    book.add(rightCover);

    const pageGeom = new THREE.PlaneGeometry(2.4, 3.4);
    const leftPageMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
    const leftPage = new THREE.Mesh(pageGeom, leftPageMat);
    leftPage.rotation.x = -Math.PI / 2;
    leftPage.position.set(-1.2, 0.005, 0);
    leftPage.receiveShadow = true;
    book.add(leftPage);

    const rightPageMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
    const rightPage = new THREE.Mesh(pageGeom, rightPageMat);
    rightPage.rotation.x = -Math.PI / 2;
    rightPage.position.set(1.2, 0.005, 0);
    rightPage.receiveShadow = true;
    book.add(rightPage);

    function updatePages() {
      const pLeft = pages[currentSpread] || null;
      const pRight = pages[currentSpread + 1] || null;
      leftPageMat.map = new THREE.CanvasTexture(renderPage(pLeft, true));
      leftPageMat.needsUpdate = true;
      rightPageMat.map = new THREE.CanvasTexture(renderPage(pRight, false));
      rightPageMat.needsUpdate = true;
      document.getElementById('page-counter').innerText = 'Seite ' + (currentSpread + 1) + ' von ' + pages.length;
    }

    updatePages();

    // Controls
    document.getElementById('next-btn').onclick = () => {
      if (currentSpread + 2 < pages.length) {
        currentSpread += 2;
        updatePages();
      }
    };
    document.getElementById('prev-btn').onclick = () => {
      if (currentSpread > 0) {
        currentSpread -= 2;
        updatePages();
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') document.getElementById('next-btn').click();
      if (e.key === 'ArrowLeft') document.getElementById('prev-btn').click();
    });

    let camMode = 0;
    document.getElementById('btn-cam').onclick = () => {
      camMode = (camMode + 1) % 2;
      if (camMode === 0) {
        camera.position.set(0, 3.8, 2.2);
        camera.lookAt(0, 0, 0.2);
      } else {
        camera.position.set(1.4, 3.2, 3.1);
        camera.lookAt(0, 0, 0.1);
      }
    };

    // Isochronic Brainwave Tones (15.4 Hz Beta / 10 Hz Alpha / 40 Hz Gamma)
    let audioCtx = null;
    let isoOsc = null;
    let isoLfo = null;
    let isoMaster = null;
    const isoFreqs = [15.4, 10.0, 40.0, 7.83, 0];
    let isoIndex = 4; // Start off

    document.getElementById('btn-iso').onclick = () => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      isoIndex = (isoIndex + 1) % isoFreqs.length;
      const targetFreq = isoFreqs[isoIndex];

      if (targetFreq === 0) {
        if (isoOsc) { isoOsc.stop(); isoOsc = null; }
        if (isoLfo) { isoLfo.stop(); isoLfo = null; }
        document.getElementById('btn-iso').innerText = 'Isochron: Aus';
        document.getElementById('btn-iso').style.color = '#d0c0a0';
      } else {
        if (!isoOsc) {
          const now = audioCtx.currentTime;
          isoMaster = audioCtx.createGain();
          isoMaster.gain.setValueAtTime(0.25, now);
          isoMaster.connect(audioCtx.destination);

          const pulseGain = audioCtx.createGain();
          pulseGain.gain.setValueAtTime(0.5, now);

          isoLfo = audioCtx.createOscillator();
          isoLfo.frequency.setValueAtTime(targetFreq, now);

          const lfoGain = audioCtx.createGain();
          lfoGain.gain.setValueAtTime(0.45, now);
          isoLfo.connect(lfoGain);
          lfoGain.connect(pulseGain.gain);

          isoOsc = audioCtx.createOscillator();
          isoOsc.frequency.setValueAtTime(216, now);
          isoOsc.connect(pulseGain);
          pulseGain.connect(isoMaster);

          isoOsc.start(now);
          isoLfo.start(now);
        } else {
          isoLfo.frequency.setValueAtTime(targetFreq, audioCtx.currentTime);
        }
        document.getElementById('btn-iso').innerText = 'Isochron: ' + targetFreq + ' Hz';
        document.getElementById('btn-iso').style.color = '#dfba5a';
      }
    };

    let isBionic = false;
    document.getElementById('btn-bionic').onclick = () => {
      isBionic = !isBionic;
      document.getElementById('btn-bionic').style.color = isBionic ? '#dfba5a' : '#d0c0a0';
      document.getElementById('btn-bionic').style.fontWeight = isBionic ? 'bold' : 'normal';
      updatePages();
    };

    let is2DMode = false;
    document.getElementById('btn-2d').onclick = () => {
      is2DMode = !is2DMode;
      document.getElementById('btn-2d').innerText = is2DMode ? '3D Modus' : '2D Modus';
      document.getElementById('btn-2d').style.color = is2DMode ? '#dfba5a' : '#d0c0a0';
      document.getElementById('btn-2d').style.fontWeight = is2DMode ? 'bold' : 'normal';
      if (is2DMode) {
        camera.position.set(0, 4.3, 0.001);
        camera.lookAt(0, 0, 0);
      } else {
        camera.position.set(0, 4.0, 2.0);
        camera.lookAt(0, 0, 0);
      }
    };

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate(t) {
      requestAnimationFrame(animate);
      candle.intensity = 1.1 + Math.sin(t * 0.008) * 0.08;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  </script>
</body>
</html>`;

  // Trigger download of standalone HTML file
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${book.metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_3d_reader.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
