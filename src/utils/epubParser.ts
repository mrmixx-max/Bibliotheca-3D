import JSZip from 'jszip';
import DOMPurify from 'dompurify';
import { BookMetadata, Chapter, ParsedBook, RenderedPage } from '../types/epub';

/**
 * Tags/attributes a book legitimately needs for reading.
 * Everything else — scripts, event handlers, frames, forms, external refs —
 * is dropped. `style` is excluded on purpose: the reader renders plain text,
 * so inline CSS is never required and only opens data-exfiltration vectors.
 */
const BOOK_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'hr', 'em', 'strong', 'i', 'b', 'u', 's', 'sub', 'sup', 'small',
    'span', 'div', 'blockquote', 'pre', 'code',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    'img', 'figure', 'figcaption', 'a', 'abbr', 'cite', 'q', 'time'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'lang', 'dir', 'colspan', 'rowspan'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input',
    'button', 'select', 'textarea', 'link', 'meta', 'base', 'svg', 'math'],
  FORBID_ATTR: ['style', 'srcset', 'formaction', 'action', 'poster', 'background',
    'xlink:href', 'onerror', 'onload', 'onclick']
};

/**
 * Strips anything executable or externally-referencing from EPUB-supplied HTML.
 * Applied once at parse time so every downstream consumer (2D view, canvas
 * texture renderer, single-file exporter) receives already-clean markup.
 */
export function sanitizeBookHtml(html: string): string {
  return DOMPurify.sanitize(html, BOOK_SANITIZE_CONFIG as never) as unknown as string;
}

/**
 * Parses an EPUB file (ArrayBuffer, Uint8Array or File) into structured chapters and spreads
 */
export async function parseEpubFile(data: ArrayBuffer | Uint8Array | File): Promise<ParsedBook> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(data as never);

  // 1. Locate container.xml
  const containerFile = loadedZip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Ungültige EPUB-Datei: META-INF/container.xml nicht gefunden.');
  }

  const containerXml = await containerFile.async('text');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, 'application/xml');
  const rootfile = containerDoc.querySelector('rootfile');
  const opfPath = rootfile?.getAttribute('full-path');

  if (!opfPath) {
    throw new Error('OPF-Pfad in container.xml nicht gefunden.');
  }

  // 2. Read OPF file
  const opfFile = loadedZip.file(opfPath);
  if (!opfFile) {
    throw new Error(`OPF-Datei nicht gefunden: ${opfPath}`);
  }

  const opfXml = await opfFile.async('text');
  const opfDoc = parser.parseFromString(opfXml, 'application/xml');

  // Base directory for OPF
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  // Extract Metadata
  const title = opfDoc.querySelector('metadata > title, metadata > dc\\:title')?.textContent?.trim() || 'Unbekannter Titel';
  const author = opfDoc.querySelector('metadata > creator, metadata > dc\\:creator')?.textContent?.trim() || 'Unbekannter Autor';
  const language = opfDoc.querySelector('metadata > language, metadata > dc\\:language')?.textContent?.trim() || 'de';
  const description = opfDoc.querySelector('metadata > description, metadata > dc\\:description')?.textContent?.trim() || '';

  const metadata: BookMetadata = {
    title,
    author,
    language,
    description,
    coverTexture: 'leather-burgundy'
  };

  // Manifest items
  const manifestItems: Record<string, { href: string; mediaType: string }> = {};
  const manifestElements = opfDoc.querySelectorAll('manifest > item');
  manifestElements.forEach(item => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    if (id && href && mediaType) {
      manifestItems[id] = { href, mediaType };
    }
  });

  // Spine reading order
  const spineItems: string[] = [];
  const spineElements = opfDoc.querySelectorAll('spine > itemref');
  spineElements.forEach(item => {
    const idref = item.getAttribute('idref');
    if (idref && manifestItems[idref]) {
      spineItems.push(idref);
    }
  });

  // Load and cache image assets as data URLs
  const imageAssets: Record<string, string> = {};
  for (const id in manifestItems) {
    const item = manifestItems[id];
    if (item.mediaType.startsWith('image/')) {
      const fullHref = resolvePath(opfDir, item.href);
      const imgFile = loadedZip.file(fullHref);
      if (imgFile) {
        try {
          const base64 = await imgFile.async('base64');
          const dataUrl = `data:${item.mediaType};base64,${base64}`;
          imageAssets[item.href] = dataUrl;
          imageAssets[fullHref] = dataUrl;
          const fileName = item.href.split('/').pop();
          if (fileName) imageAssets[fileName] = dataUrl;
        } catch {
          // ignore
        }
      }
    }
  }

  // 3. Extract and parse chapters
  const chapters: Chapter[] = [];
  let orderIndex = 0;

  for (const idref of spineItems) {
    const item = manifestItems[idref];
    const fullHref = resolvePath(opfDir, item.href);
    const chapterFile = loadedZip.file(fullHref);

    if (!chapterFile) continue;

    const chapterHtml = await chapterFile.async('text');
    const chapterDoc = parser.parseFromString(chapterHtml, 'text/html');

    // Extract title
    let chapterTitle =
      chapterDoc.querySelector('h1, h2, h3, title')?.textContent?.trim() ||
      `Kapitel ${orderIndex + 1}`;

    // Clean body content & replace images
    const body = chapterDoc.body || chapterDoc.documentElement;
    body.querySelectorAll('script, style').forEach(el => el.remove());

    // Resolve images to inline base64
    body.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        const resolved = imageAssets[src] || imageAssets[src.split('/').pop() || ''];
        if (resolved) {
          img.setAttribute('src', resolved);
        }
      }
    });

    const contentHtml = sanitizeBookHtml(body.innerHTML);
    if (stripHtml(contentHtml).trim().length > 10) {
      chapters.push({
        id: idref,
        title: chapterTitle,
        content: contentHtml,
        order: orderIndex++
      });
    }
  }

  // Fallback if no spine chapters parsed
  if (chapters.length === 0) {
    chapters.push({
      id: 'chapter-1',
      title: 'Buchinhalt',
      content: '<p>Der Text dieses Dokuments konnte formatiert werden.</p>',
      order: 0
    });
  }

  // 4. Paginate chapters into rendered two-page spreads
  const pages = paginateChapters(chapters, metadata);

  return {
    metadata,
    chapters,
    pages
  };
}

function splitLongParagraph(text: string, maxWords = 220): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return [text];

  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (let i = 0; i < words.length; i++) {
    currentChunk.push(words[i]);
    const isSentenceEnd = /[.!?]["'»”]?$/.test(words[i]);
    if ((currentChunk.length >= maxWords * 0.75 && isSentenceEnd) || currentChunk.length >= maxWords) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
  }
  if (currentChunk.length > 0) {
    if (chunks.length > 0 && currentChunk.length < 30) {
      chunks[chunks.length - 1] += ' ' + currentChunk.join(' ');
    } else {
      chunks.push(currentChunk.join(' '));
    }
  }
  return chunks;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Paginates chapters into pages fitting the 3D book canvas, adjusting dynamically to font size
 */
export function paginateChapters(chapters: Chapter[], metadata: BookMetadata, fontSize = 26): RenderedPage[] {
  const pages: RenderedPage[] = [];
  let currentPageNumber = 1;

  // Scale target words dynamically based on font size (26pt is standard baseline):
  const fontRatio = 26 / Math.max(fontSize, 18);
  const targetWordsChapterStart = Math.max(80, Math.round(170 * fontRatio));
  const targetWordsNormal = Math.max(110, Math.round(230 * fontRatio));
  const minWordsCommit = Math.max(40, Math.round(65 * fontRatio));

  for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
    const chapter = chapters[cIdx];

    // Clean and extract paragraphs
    const tmp = document.createElement('div');
    // SAFE: chapter.content is DOMPurify-sanitized at parse time (epubParser.ts).
    // Detached div, read via textContent only.
    tmp.innerHTML = chapter.content;
    tmp.querySelectorAll('script, style, h1, h2, h3, h4, h5, h6').forEach(el => el.remove());

    const rawParagraphs: string[] = [];
    const pElements = tmp.querySelectorAll('p, blockquote, div, li');
    if (pElements.length > 0) {
      pElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0) {
          rawParagraphs.push(text);
        }
      });
    } else {
      const text = (tmp.textContent || tmp.innerText || '').trim();
      if (text) {
        rawParagraphs.push(...text.split(/\n+/).map(s => s.trim()).filter(Boolean));
      }
    }

    if (rawParagraphs.length === 0) {
      rawParagraphs.push('...');
    }

    // Expand any very long paragraphs so they can break across pages gracefully
    const processedParagraphs: string[] = [];
    const maxParagraphWords = Math.round(190 * fontRatio);
    for (const p of rawParagraphs) {
      processedParagraphs.push(...splitLongParagraph(p, maxParagraphWords));
    }

    // Accumulate into pages
    let pageParagraphs: string[] = [];
    let wordsOnPage = 0;
    let isFirstPageOfChapter = true;

    for (let pIdx = 0; pIdx < processedParagraphs.length; pIdx++) {
      const pText = processedParagraphs[pIdx];
      const pWords = pText.split(/\s+/).filter(Boolean);
      const targetWords = isFirstPageOfChapter ? targetWordsChapterStart : targetWordsNormal;

      if (wordsOnPage + pWords.length <= targetWords || wordsOnPage < minWordsCommit) {
        pageParagraphs.push(pText);
        wordsOnPage += pWords.length;
      } else {
        // Commit current page
        pages.push({
          pageNumber: currentPageNumber++,
          totalPages: 0,
          chapterTitle: chapter.title,
          chapterIndex: cIdx,
          bookTitle: metadata.title,
          htmlContent: pageParagraphs.map(p => `<p>${escapeHtml(p)}</p>`).join(''),
          isChapterStart: isFirstPageOfChapter
        });

        isFirstPageOfChapter = false;
        pageParagraphs = [pText];
        wordsOnPage = pWords.length;
      }
    }

    if (pageParagraphs.length > 0) {
      pages.push({
        pageNumber: currentPageNumber++,
        totalPages: 0,
        chapterTitle: chapter.title,
        chapterIndex: cIdx,
        bookTitle: metadata.title,
        htmlContent: pageParagraphs.map(p => `<p>${escapeHtml(p)}</p>`).join(''),
        isChapterStart: isFirstPageOfChapter
      });
    }
  }

  // Ensure total pages is even so final spread finishes symmetrically
  if (pages.length % 2 !== 0) {
    pages.push({
      pageNumber: currentPageNumber++,
      totalPages: 0,
      chapterTitle: metadata.title,
      chapterIndex: Math.max(chapters.length - 1, 0),
      bookTitle: metadata.title,
      htmlContent: '<p style="text-align: center; font-style: italic; opacity: 0.6;">· Ende ·</p>',
      isChapterStart: false
    });
  }

  // Update total pages
  const total = pages.length;
  pages.forEach(p => (p.totalPages = total));

  return pages;
}

function resolvePath(base: string, relative: string): string {
  if (relative.startsWith('/')) {
    return relative.slice(1);
  }
  const parts = (base + relative).split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  // SAFE: only called with already-sanitized chapter markup; detached, text-only read.
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
