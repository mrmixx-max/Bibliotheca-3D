import * as THREE from 'three';
import { BookMetadata, RenderedPage } from '../types/epub';

export interface PageRenderOptions {
  paperTone?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  bionicReading?: boolean;
}

/**
 * Creates a procedural high-res wood texture for the reading desk.
 */
export function createWoodTexture(baseColorHex = '#2b1a13', grainColorHex = '#1a0f0a'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const numPlanks = 6;
  const plankHeight = canvas.height / numPlanks;

  for (let p = 0; p < numPlanks; p++) {
    const yStart = p * plankHeight;

    ctx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.08})`;
    ctx.fillRect(0, yStart, canvas.width, plankHeight);

    ctx.strokeStyle = grainColorHex;
    ctx.lineWidth = 1.2;

    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      const y = yStart + Math.random() * plankHeight;
      ctx.globalAlpha = 0.05 + Math.random() * 0.12;

      let currentX = 0;
      let currentY = y;
      ctx.moveTo(currentX, currentY);

      while (currentX < canvas.width) {
        currentX += 15 + Math.random() * 25;
        currentY += (Math.random() - 0.5) * 3;
        ctx.lineTo(currentX, currentY);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#0a0604';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, yStart + plankHeight);
    ctx.lineTo(canvas.width, yStart + plankHeight);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yStart + plankHeight + 1);
    ctx.lineTo(canvas.width, yStart + plankHeight + 1);
    ctx.stroke();
  }

  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 200,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.75
  );
  grad.addColorStop(0, 'rgba(255,255,255,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * Creates realistic paper edge texture for the stacked book pages
 */
export function createPaperEdgeTexture(tone = '#f3eedf'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = tone;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 2) {
    ctx.fillStyle = Math.random() > 0.4 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.02)';
    ctx.fillRect(0, y, canvas.width, 1);
  }

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.15)');
  grad.addColorStop(0.1, 'rgba(0,0,0,0.02)');
  grad.addColorStop(0.9, 'rgba(0,0,0,0.02)');
  grad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Creates an ornate vintage leather hardcover texture with embossed gold lettering and borders.
 */
export function createCoverTexture(metadata: BookMetadata, isBack = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1448;
  const ctx = canvas.getContext('2d')!;

  let baseColor = '#241416';
  if (metadata.coverTexture === 'leather-dark') baseColor = '#181617';
  if (metadata.coverTexture === 'leather-navy') baseColor = '#0f1826';
  if (metadata.coverTexture === 'leather-forest') baseColor = '#122319';
  if (metadata.coverTexture === 'linen-cream') baseColor = '#3a2d21';

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const margin = 50;
  const w = canvas.width;
  const h = canvas.height;

  ctx.strokeStyle = '#dfba5a';
  ctx.lineWidth = 4;
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

  ctx.strokeStyle = '#c59d3f';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin + 16, margin + 16, w - (margin + 16) * 2, h - (margin + 16) * 2);

  drawCornerOrnament(ctx, margin + 20, margin + 20, 1, 1);
  drawCornerOrnament(ctx, w - (margin + 20), margin + 20, -1, 1);
  drawCornerOrnament(ctx, margin + 20, h - (margin + 20), 1, -1);
  drawCornerOrnament(ctx, w - (margin + 20), h - (margin + 20), -1, -1);

  if (!isBack) {
    ctx.textAlign = 'center';

    ctx.fillStyle = '#dfba5a';
    ctx.beginPath();
    ctx.arc(w / 2, 280, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#dfba5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, 280, 36, 0, Math.PI * 2);
    ctx.stroke();

    drawStar(ctx, w / 2, 280, 5, 14, 7);

    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#f5d681';
    ctx.font = 'bold 54px "Cinzel", "Cormorant Garamond", serif';
    wrapText(ctx, metadata.title.toUpperCase(), w / 2, 480, w - 240, 68);

    ctx.shadowBlur = 4;
    ctx.font = '600 32px "Cinzel", "Cormorant Garamond", serif';
    ctx.fillStyle = '#e8c46c';
    ctx.fillText(metadata.author.toUpperCase(), w / 2, 860);

    ctx.strokeStyle = '#c59d3f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, 930);
    ctx.lineTo(w / 2 + 120, 930);
    ctx.stroke();

    ctx.font = 'italic 20px "Cormorant Garamond", serif';
    ctx.fillStyle = '#bda05e';
    ctx.fillText('BIBLIOTHECA CLASSICA · 3D EDITION', w / 2, 1260);
  } else {
    ctx.strokeStyle = '#c59d3f';
    ctx.lineWidth = 2;
    ctx.strokeRect(w / 2 - 200, h / 2 - 140, 400, 280);

    ctx.textAlign = 'center';
    ctx.font = 'italic 22px "Cormorant Garamond", serif';
    ctx.fillStyle = '#d5b259';
    if (metadata.description) {
      wrapText(ctx, metadata.description, w / 2, h / 2 - 70, 340, 36);
    } else {
      ctx.fillText('FINIS', w / 2, h / 2 + 10);
    }
  }

  const creaseGrad = ctx.createLinearGradient(0, 0, 80, 0);
  creaseGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  creaseGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = creaseGrad;
  ctx.fillRect(0, 0, 80, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

function drawCornerOrnament(ctx: CanvasRenderingContext2D, x: number, y: number, scaleX: number, scaleY: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.strokeStyle = '#dfba5a';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(40, 0);
  ctx.lineTo(40, 10);
  ctx.lineTo(10, 10);
  ctx.lineTo(10, 40);
  ctx.lineTo(0, 40);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(20, 20, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#dfba5a';
  ctx.fill();

  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = '#241416';
  ctx.fill();
}

/**
 * Renders a razor-sharp book page onto an HTML5 Canvas for Three.js texture
 * Supports high DPI resolution, custom fonts, paper tones, and Bionic Reading!
 */
export function renderPageToCanvas(
  page: RenderedPage | null,
  isLeftPage: boolean,
  options: PageRenderOptions = {}
): HTMLCanvasElement {
  // Ultra-crisp high-DPI canvas (1536 x 2172 px)
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 2172;
  const ctx = canvas.getContext('2d')!;

  const paperTone = options.paperTone || '#fbf7ee';
  const textColor = options.textColor || '#1c1611';
  const rawFontFamily = options.fontFamily || '"Source Serif 4", "Cormorant Garamond", Georgia, serif';
  const baseFontSize = (options.fontSize || 26) * 1.5; // Scale up for 1536px canvas
  const baseLineHeight = (options.lineHeight || 44) * 1.5;
  const bionicReading = options.bionicReading ?? false;

  // Paper base color
  ctx.fillStyle = paperTone;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle paper grain noise
  ctx.fillStyle = 'rgba(0,0,0,0.012)';
  for (let i = 0; i < 25000; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 1.5);
  }

  // Spine gutter shadow
  const gutterWidth = 190;
  if (isLeftPage) {
    const gutterGrad = ctx.createLinearGradient(canvas.width - gutterWidth, 0, canvas.width, 0);
    gutterGrad.addColorStop(0, 'rgba(0,0,0,0)');
    gutterGrad.addColorStop(0.7, 'rgba(0,0,0,0.03)');
    gutterGrad.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = gutterGrad;
    ctx.fillRect(canvas.width - gutterWidth, 0, gutterWidth, canvas.height);
  } else {
    const gutterGrad = ctx.createLinearGradient(0, 0, gutterWidth, 0);
    gutterGrad.addColorStop(0, 'rgba(0,0,0,0.16)');
    gutterGrad.addColorStop(0.3, 'rgba(0,0,0,0.03)');
    gutterGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gutterGrad;
    ctx.fillRect(0, 0, gutterWidth, canvas.height);
  }

  // Outer edge subtle curvature vignette
  const outerEdgeWidth = 60;
  if (isLeftPage) {
    const outerGrad = ctx.createLinearGradient(0, 0, outerEdgeWidth, 0);
    outerGrad.addColorStop(0, 'rgba(0,0,0,0.06)');
    outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = outerGrad;
    ctx.fillRect(0, 0, outerEdgeWidth, canvas.height);
  } else {
    const outerGrad = ctx.createLinearGradient(canvas.width - outerEdgeWidth, 0, canvas.width, 0);
    outerGrad.addColorStop(0, 'rgba(0,0,0,0)');
    outerGrad.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = outerGrad;
    ctx.fillRect(canvas.width - outerEdgeWidth, 0, outerEdgeWidth, canvas.height);
  }

  // Generous, comfortable reading margins
  const marginLeft = isLeftPage ? 175 : 205;
  const marginRight = isLeftPage ? 205 : 175;
  const contentWidth = canvas.width - marginLeft - marginRight;

  if (!page) {
    // Endpaper / flyleaf
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.25;
    ctx.font = 'italic 28px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillText('· Bibliotheca 3D ·', canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 1.0;
    return canvas;
  }

  if (!page.htmlContent || !page.htmlContent.trim()) {
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.55;
    ctx.font = `italic ${Math.round(20 * 1.5)}px "Cormorant Garamond", serif`;
    ctx.textAlign = 'center';
    const hText = isLeftPage ? page.bookTitle : page.chapterTitle;
    if (hText) {
      ctx.fillText(hText.toUpperCase(), marginLeft + contentWidth / 2, 135);
    }
    ctx.font = `500 ${Math.round(20 * 1.5)}px "Source Serif 4", serif`;
    ctx.fillText(String(page.pageNumber), marginLeft + contentWidth / 2, canvas.height - 110);
    ctx.font = '28px "Cinzel", serif';
    ctx.fillText('· ❦ ·', marginLeft + contentWidth / 2, canvas.height / 2);
    ctx.globalAlpha = 1.0;
    return canvas;
  }

  // Running Header
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.6;
  ctx.font = `italic ${Math.round(20 * 1.5)}px "Cormorant Garamond", serif`;
  ctx.textAlign = 'center';

  const headerY = 135;
  const headerText = isLeftPage ? page.bookTitle : page.chapterTitle;
  if (headerText) {
    ctx.fillText(headerText.toUpperCase(), marginLeft + contentWidth / 2, headerY);

    ctx.strokeStyle = textColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginLeft + 60, headerY + 26);
    ctx.lineTo(marginLeft + contentWidth - 60, headerY + 26);
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;

  // Chapter Heading
  const isChapterStart = Boolean(
    page.isChapterStart ||
    page.pageNumber === 1 ||
    page.htmlContent.includes('<h1') ||
    page.htmlContent.includes('<h2')
  );

  let currentY = 230;

  if (isChapterStart && page.chapterTitle) {
    currentY = 270;
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(36 * 1.5)}px "Cinzel", "Cormorant Garamond", serif`;
    ctx.fillStyle = textColor;
    ctx.fillText(page.chapterTitle, marginLeft + contentWidth / 2, currentY);

    ctx.strokeStyle = textColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginLeft + contentWidth / 2 - 90, currentY + 30);
    ctx.lineTo(marginLeft + contentWidth / 2 + 90, currentY + 30);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    currentY += 120; // Text starts at ~390
  }

  // Extract clean paragraphs: strip any h1-h6 tags first so title is not repeated in body
  const cleanHtml = page.htmlContent.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cleanHtml;

  const paragraphs: string[] = [];
  const pElements = tempDiv.querySelectorAll('p, blockquote, div, li');
  if (pElements.length > 0) {
    pElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text) paragraphs.push(text);
    });
  } else {
    const text = tempDiv.textContent?.trim();
    if (text) {
      paragraphs.push(...text.split(/\n+/).map(s => s.trim()).filter(Boolean));
    }
  }

  // Body text formatting
  ctx.textAlign = 'left';
  ctx.fillStyle = textColor;
  const fontStyle = `${Math.round(baseFontSize)}px ${rawFontFamily}`;
  ctx.font = fontStyle;
  const maxBottomY = canvas.height - 170; // Leave comfortable room for footer page number

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const pText = paragraphs[pIdx];
    if (currentY + baseLineHeight > maxBottomY) {
      break;
    }

    // Drop cap on first paragraph of a chapter start
    if (isChapterStart && pIdx === 0 && pText.length > 25) {
      const dropCapLetter = pText[0];
      const remainingPText = pText.slice(1).trim();

      const dcFontSize = Math.round(72 * 1.5); // 108px
      ctx.font = `bold ${dcFontSize}px "Cinzel", "Cormorant Garamond", serif`;
      const dropCapWidth = ctx.measureText(dropCapLetter).width + 20;

      // Wrap remaining text: lines 0 and 1 have indent (dropCapWidth), lines 2+ full width
      ctx.font = fontStyle;
      const words = remainingPText.split(/\s+/).filter(Boolean);
      const lines: { text: string; indent: number }[] = [];
      let curWords: string[] = [];
      let lineIdx = 0;

      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        const maxW = lineIdx < 2 ? contentWidth - dropCapWidth : contentWidth;
        const testLine = curWords.length > 0 ? curWords.join(' ') + ' ' + word : word;

        if (ctx.measureText(testLine).width > maxW && curWords.length > 0) {
          lines.push({
            text: curWords.join(' '),
            indent: lineIdx < 2 ? dropCapWidth : 0
          });
          curWords = [word];
          lineIdx++;
        } else {
          curWords.push(word);
        }
      }
      if (curWords.length > 0) {
        lines.push({
          text: curWords.join(' '),
          indent: lineIdx < 2 ? dropCapWidth : 0
        });
      }

      // Draw drop cap letter (aligned vertically with the top lines)
      ctx.font = `bold ${dcFontSize}px "Cinzel", "Cormorant Garamond", serif`;
      ctx.fillStyle = textColor;
      ctx.fillText(dropCapLetter, marginLeft, currentY + baseLineHeight * 0.95);

      // Draw all lines of this first paragraph
      ctx.font = fontStyle;
      for (const l of lines) {
        if (currentY + baseLineHeight > maxBottomY) break;
        drawLine(ctx, l.text, marginLeft + l.indent, currentY, rawFontFamily, baseFontSize, textColor, bionicReading);
        currentY += baseLineHeight;
      }
      currentY += 26; // Paragraph spacing
      continue;
    }

    // Standard paragraph with first-line indent
    ctx.font = fontStyle;
    const indentWidth = pIdx > 0 ? 44 : 0;
    const words = pText.split(/\s+/).filter(Boolean);
    const lines: { text: string; indent: number }[] = [];
    let curWords: string[] = [];
    let lineIdx = 0;

    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      const maxW = lineIdx === 0 ? contentWidth - indentWidth : contentWidth;
      const testLine = curWords.length > 0 ? curWords.join(' ') + ' ' + word : word;

      if (ctx.measureText(testLine).width > maxW && curWords.length > 0) {
        lines.push({
          text: curWords.join(' '),
          indent: lineIdx === 0 ? indentWidth : 0
        });
        curWords = [word];
        lineIdx++;
      } else {
        curWords.push(word);
      }
    }
    if (curWords.length > 0) {
      lines.push({
        text: curWords.join(' '),
        indent: lineIdx === 0 ? indentWidth : 0
      });
    }

    for (const l of lines) {
      if (currentY + baseLineHeight > maxBottomY) break;
      drawLine(ctx, l.text, marginLeft + l.indent, currentY, rawFontFamily, baseFontSize, textColor, bionicReading);
      currentY += baseLineHeight;
    }
    currentY += 22; // Paragraph spacing
  }

  // Page number footer
  const footerY = canvas.height - 110;
  ctx.textAlign = 'center';
  ctx.font = `500 ${Math.round(20 * 1.5)}px "Source Serif 4", serif`;
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = textColor;
  ctx.fillText(String(page.pageNumber), marginLeft + contentWidth / 2, footerY);
  ctx.globalAlpha = 1.0;

  return canvas;
}

/**
 * Draws a line of text, optionally applying Bionic Reading bold anchors
 */
function drawLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  startX: number,
  y: number,
  fontFamily: string,
  fontSize: number,
  textColor: string,
  bionicReading: boolean
) {
  if (!bionicReading) {
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.fillText(line, startX, y);
    return;
  }

  // Bionic Reading: Bold the initial anchor letters of each word
  let currentX = startX;
  const words = line.split(' ');
  const spaceWidth = ctx.measureText(' ').width;

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    if (!word) {
      currentX += spaceWidth;
      continue;
    }

    // Determine fixation anchor length
    const len = word.length;
    let anchorLen = 1;
    if (len === 1) anchorLen = 1;
    else if (len <= 3) anchorLen = 1;
    else if (len <= 6) anchorLen = 2;
    else if (len <= 9) anchorLen = 3;
    else anchorLen = 4;

    const boldPart = word.slice(0, anchorLen);
    const regularPart = word.slice(anchorLen);

    // Draw bold anchor
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.fillText(boldPart, currentX, y);
    const boldWidth = ctx.measureText(boldPart).width;
    currentX += boldWidth;

    // Draw regular part
    if (regularPart) {
      ctx.font = `normal ${fontSize}px ${fontFamily}`;
      ctx.fillText(regularPart, currentX, y);
      const regularWidth = ctx.measureText(regularPart).width;
      currentX += regularWidth;
    }

    // Space
    currentX += spaceWidth;
  }
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, firstLineIndent = 0) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  let wordIdx = 0;

  for (; wordIdx < words.length; wordIdx++) {
    const word = words[wordIdx];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width + (lines.length === 0 ? firstLineIndent : 0);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return {
    lines,
    remainingText: words.slice(wordIdx).join(' ')
  };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}

/**
 * Builds a decorative backdrop for the reading room as a data URL, so it can be
 * used as a CSS background (2D view) and as a Three.js texture (3D view)
 * without shipping any image assets.
 *
 * All motifs are drawn procedurally on a canvas: no network, no files, and
 * nothing that a strict CSP would block.
 */
export function createBackgroundDataUrl(kind: string, size = 1024): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const w = size;
  const h = size;

  const noise = (count: number, light: string, dark: string, alpha: number) => {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? light : dark;
      ctx.globalAlpha = Math.random() * alpha;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  };

  const vignette = (strength = 0.45) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w * 0.72);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };

  switch (kind) {
    case 'parchment': {
      // Warm aged parchment with fibre grain and darker, worn edges.
      const g = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.1, w * 0.5, h * 0.5, w * 0.75);
      g.addColorStop(0, '#f3e2bd');
      g.addColorStop(0.55, '#e8d2a6');
      g.addColorStop(1, '#c9a970');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Fibres
      for (let i = 0; i < 900; i++) {
        ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(120,90,50,0.10)';
        ctx.lineWidth = 0.6 + Math.random();
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 12);
        ctx.stroke();
      }

      // Foxing (age spots)
      for (let i = 0; i < 120; i++) {
        const r = 2 + Math.random() * 14;
        const x = Math.random() * w;
        const y = Math.random() * h;
        const spot = ctx.createRadialGradient(x, y, 0, x, y, r);
        spot.addColorStop(0, 'rgba(150,110,60,0.16)');
        spot.addColorStop(1, 'rgba(150,110,60,0)');
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      noise(30000, 'rgba(255,255,255,0.5)', 'rgba(90,60,30,0.5)', 0.05);

      // Deckled edges
      const edge = ctx.createRadialGradient(w / 2, h / 2, w * 0.42, w / 2, h / 2, w * 0.62);
      edge.addColorStop(0, 'rgba(120,85,40,0)');
      edge.addColorStop(1, 'rgba(105,72,32,0.5)');
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'old-paper': {
      // Cooler, greyed newsprint with visible laid lines.
      ctx.fillStyle = '#ded5c2';
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < h; y += 5) {
        ctx.fillStyle = `rgba(120,110,95,${0.03 + Math.random() * 0.05})`;
        ctx.fillRect(0, y, w, 1);
      }
      for (let x = 0; x < w; x += 90) {
        ctx.fillStyle = 'rgba(120,110,95,0.05)';
        ctx.fillRect(x, 0, 1, h);
      }

      noise(45000, 'rgba(255,255,255,0.6)', 'rgba(80,70,55,0.6)', 0.07);

      for (let i = 0; i < 60; i++) {
        const r = 3 + Math.random() * 18;
        const x = Math.random() * w;
        const y = Math.random() * h;
        const spot = ctx.createRadialGradient(x, y, 0, x, y, r);
        spot.addColorStop(0, 'rgba(130,110,75,0.13)');
        spot.addColorStop(1, 'rgba(130,110,75,0)');
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      vignette(0.42);
      break;
    }

    case 'leather': {
      // Embossed leather grain with pebble cells.
      ctx.fillStyle = '#3a1f18';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 7000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 3 + Math.random() * 9;
        const cell = ctx.createRadialGradient(x, y, 0, x, y, r);
        cell.addColorStop(0, 'rgba(255,200,160,0.05)');
        cell.addColorStop(0.6, 'rgba(0,0,0,0.05)');
        cell.addColorStop(1, 'rgba(0,0,0,0.12)');
        ctx.fillStyle = cell;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      noise(35000, 'rgba(255,220,190,0.5)', 'rgba(20,8,4,0.7)', 0.08);
      vignette(0.55);
      break;
    }

    case 'linen': {
      // Woven cloth: two crossed thread directions.
      ctx.fillStyle = '#4a4437';
      ctx.fillRect(0, 0, w, h);

      for (let x = 0; x < w; x += 4) {
        ctx.fillStyle = `rgba(255,250,235,${0.02 + Math.random() * 0.05})`;
        ctx.fillRect(x, 0, 2, h);
      }
      for (let y = 0; y < h; y += 4) {
        ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.05})`;
        ctx.fillRect(0, y, w, 2);
      }

      noise(28000, 'rgba(255,255,255,0.5)', 'rgba(20,18,12,0.6)', 0.06);
      vignette(0.5);
      break;
    }

    case 'marble': {
      // Veined stone: pale base with meandering mineral veins.
      ctx.fillStyle = '#e9e6df';
      ctx.fillRect(0, 0, w, h);

      for (let v = 0; v < 26; v++) {
        ctx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let s = 0; s < 90; s++) {
          x += (Math.random() - 0.5) * 40;
          y += 10 + Math.random() * 18;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(110,112,120,0.16)' : 'rgba(160,150,140,0.20)';
        ctx.lineWidth = 0.6 + Math.random() * 2.4;
        ctx.stroke();
      }

      noise(40000, 'rgba(255,255,255,0.6)', 'rgba(90,90,95,0.5)', 0.05);
      vignette(0.35);
      break;
    }

    case 'dark-wood': {
      // Dark planks with grain, matching the 3D reading desk.
      ctx.fillStyle = '#2b1a13';
      ctx.fillRect(0, 0, w, h);

      const planks = 6;
      const plankH = h / planks;
      for (let p = 0; p < planks; p++) {
        const y0 = p * plankH;
        ctx.fillStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.08})`;
        ctx.fillRect(0, y0, w, plankH);

        for (let i = 0; i < 80; i++) {
          ctx.strokeStyle = '#1a0f0a';
          ctx.globalAlpha = 0.05 + Math.random() * 0.12;
          ctx.lineWidth = 1.2;
          let x = 0;
          let y = y0 + Math.random() * plankH;
          ctx.beginPath();
          ctx.moveTo(x, y);
          while (x < w) {
            x += 15 + Math.random() * 25;
            y += (Math.random() - 0.5) * 3;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = '#0a0604';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y0 + plankH);
        ctx.lineTo(w, y0 + plankH);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      vignette(0.5);
      break;
    }

    default:
      return '';
  }

  return canvas.toDataURL('image/png');
}
