import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  AtmosphereTheme,
  BookMetadata,
  FontFamily,
  HighlightColor,
  PaperTonePreset,
  RenderedPage,
  TextHighlight
} from '../types/epub';
import { playPageTurnSound } from '../utils/audioEffects';
import { speechReader } from '../utils/speechReader';

interface Book2DViewProps {
  metadata: BookMetadata;
  pages: RenderedPage[];
  currentSpreadIndex: number;
  onTurnPage: (direction: 'next' | 'prev') => void;
  onPageSelect: (pageIndex: number) => void;
  atmosphere: AtmosphereTheme;
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  paperTonePreset: PaperTonePreset;
  bionicReading: boolean;
  twoPageSpread: boolean;
  onToggleTwoPageSpread: () => void;
  readingZoom: number;
  soundEnabled: boolean;
  onSwitchTo3D: () => void;
  highlights?: TextHighlight[];
  onAddHighlight?: (highlight: Omit<TextHighlight, 'id' | 'timestamp'>) => void;
  searchHighlightTerm?: string;
  onClearSearchHighlight?: () => void;
}

export const Book2DView: React.FC<Book2DViewProps> = ({
  metadata,
  pages,
  currentSpreadIndex,
  onTurnPage,
  atmosphere,
  fontFamily,
  fontSize,
  lineHeight,
  paperTonePreset,
  bionicReading,
  twoPageSpread,
  onToggleTwoPageSpread,
  readingZoom,
  soundEnabled,
  onSwitchTo3D,
  highlights = [],
  onAddHighlight,
  searchHighlightTerm,
  onClearSearchHighlight
}) => {
  // Safe page retrieval
  const leftPage = pages[currentSpreadIndex] || null;
  const rightPage = twoPageSpread ? pages[currentSpreadIndex + 1] || null : null;

  // Floating text selection toolbar state
  const [selectionToolbar, setSelectionToolbar] = useState<{
    x: number;
    y: number;
    text: string;
    pageIndex: number;
    chapterTitle: string;
  } | null>(null);

  const [notePromptOpen, setNotePromptOpen] = useState(false);
  const [pendingColor, setPendingColor] = useState<HighlightColor>('amber');
  const [noteInput, setNoteInput] = useState('');

  // Paper styling
  const paperColors: Record<PaperTonePreset, { bg: string; text: string; border: string; subText: string }> = {
    creme: {
      bg: '#fbf7ee',
      text: '#1c1611',
      border: 'rgba(120, 90, 60, 0.2)',
      subText: '#786858'
    },
    white: {
      bg: '#ffffff',
      text: '#111111',
      border: 'rgba(0, 0, 0, 0.12)',
      subText: '#666666'
    },
    sepia: {
      bg: '#f4ecd8',
      text: '#2b1f14',
      border: 'rgba(140, 105, 70, 0.25)',
      subText: '#7d6954'
    },
    dark: {
      bg: '#1c1a18',
      text: '#e6ded1',
      border: 'rgba(255, 255, 255, 0.12)',
      subText: '#999083'
    }
  };

  const activePaper = paperColors[paperTonePreset] || paperColors.creme;

  const fontFamilies: Record<FontFamily, string> = {
    cormorant: '"Cormorant Garamond", Georgia, serif',
    'source-serif': '"Source Serif 4", Georgia, serif',
    lora: '"Lora", Georgia, serif',
    literata: '"Literata", Georgia, serif',
    sans: '"Plus Jakarta Sans", -apple-system, sans-serif',
    mono: '"JetBrains Mono", monospace'
  };

  const activeFont = fontFamilies[fontFamily] || fontFamilies.cormorant;

  // Atmosphere backgrounds
  const atmosphereStyles: Record<AtmosphereTheme, { bg: string; glow: string }> = {
    candlelight: {
      bg: '#100b08',
      glow: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(255, 150, 50, 0.08) 0%, transparent 80%)'
    },
    midnight: {
      bg: '#080a0f',
      glow: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(100, 160, 255, 0.06) 0%, transparent 80%)'
    },
    banker: {
      bg: '#09120b',
      glow: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(52, 211, 153, 0.06) 0%, transparent 80%)'
    },
    daylight: {
      bg: '#e8e4db',
      glow: 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255, 255, 255, 0.6) 0%, transparent 90%)'
    }
  };

  const activeAtmosphere = atmosphereStyles[atmosphere] || atmosphereStyles.candlelight;

  // Handle page turns with sound
  const handleTurn = useCallback(
    (direction: 'next' | 'prev') => {
      if (soundEnabled) {
        playPageTurnSound(0.55);
      }
      setSelectionToolbar(null);
      setNotePromptOpen(false);
      onTurnPage(direction);
    },
    [onTurnPage, soundEnabled]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.code === 'Space') {
        e.preventDefault();
        handleTurn('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handleTurn('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurn]);

  // Handle text selection on mouse up
  const handleMouseUp = (pageIndex: number, chapterTitle: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      if (!notePromptOpen) {
        setSelectionToolbar(null);
      }
      return;
    }

    const selectedText = sel.toString().trim();
    if (selectedText.length < 2) {
      if (!notePromptOpen) setSelectionToolbar(null);
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionToolbar({
        x: Math.max(10, rect.left + rect.width / 2),
        y: Math.max(10, rect.top - 12),
        text: selectedText,
        pageIndex,
        chapterTitle
      });
    } catch {
      // ignore
    }
  };

  const handleApplyHighlight = (color: HighlightColor) => {
    if (!selectionToolbar || !onAddHighlight) return;
    onAddHighlight({
      pageIndex: selectionToolbar.pageIndex,
      text: selectionToolbar.text,
      color,
      chapterTitle: selectionToolbar.chapterTitle
    });
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
    setNotePromptOpen(false);
  };

  const handleSaveWithNote = () => {
    if (!selectionToolbar || !onAddHighlight) return;
    onAddHighlight({
      pageIndex: selectionToolbar.pageIndex,
      text: selectionToolbar.text,
      color: pendingColor,
      note: noteInput.trim() || undefined,
      chapterTitle: selectionToolbar.chapterTitle
    });
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
    setNotePromptOpen(false);
    setNoteInput('');
  };

  const handleSpeakSelection = () => {
    if (!selectionToolbar) return;
    speechReader.speak(selectionToolbar.text);
    setSelectionToolbar(null);
  };

  const handleCopySelection = () => {
    if (!selectionToolbar) return;
    navigator.clipboard.writeText(selectionToolbar.text);
    setSelectionToolbar(null);
  };

  // Color classes for highlights
  const highlightStyles: Record<HighlightColor, string> = {
    amber: 'bg-amber-300/40 text-amber-950 dark:text-amber-100 rounded px-0.5 shadow-sm',
    emerald: 'bg-emerald-300/40 text-emerald-950 dark:text-emerald-100 rounded px-0.5 shadow-sm',
    rose: 'bg-rose-300/40 text-rose-950 dark:text-rose-100 rounded px-0.5 shadow-sm',
    sky: 'bg-sky-300/40 text-sky-950 dark:text-sky-100 rounded px-0.5 shadow-sm'
  };

  // Render text with highlights, search terms, and optional Bionic Reading
  const renderFormattedParagraph = (pText: string, pageIndex: number, isFirstInChapter = false) => {
    // Current highlights on this page
    const pageHighlights = highlights.filter((h) => h.pageIndex === pageIndex);

    // If search term is active, highlight search term first
    const hasSearchMatch =
      searchHighlightTerm &&
      searchHighlightTerm.trim().length >= 2 &&
      pText.toLowerCase().includes(searchHighlightTerm.trim().toLowerCase());

    if (isFirstInChapter && pText.length > 20) {
      const dropCap = pText[0];
      const rest = pText.slice(1).trim();

      return (
        <p className="leading-relaxed relative mt-2 mb-4">
          <span
            className="float-left text-5xl sm:text-6xl font-serif font-bold leading-none pr-3 pt-1 text-amber-500/90 select-none"
            style={{ fontFamily: '"Cinzel", "Cormorant Garamond", serif' }}
          >
            {dropCap}
          </span>
          {renderTextWithHighlightsAndBionic(rest, pageHighlights, searchHighlightTerm)}
        </p>
      );
    }

    return (
      <p className="leading-relaxed mb-4 text-justify" style={{ textIndent: '1.8em' }}>
        {renderTextWithHighlightsAndBionic(pText, pageHighlights, searchHighlightTerm)}
      </p>
    );
  };

  const renderTextWithHighlightsAndBionic = (
    text: string,
    pageHighlights: TextHighlight[],
    searchTerm?: string
  ) => {
    // If search term matches
    if (searchTerm && searchTerm.trim().length >= 2 && text.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
      const parts = text.split(new RegExp(`(${searchTerm.trim()})`, 'gi'));
      return parts.map((part, pI) =>
        part.toLowerCase() === searchTerm.trim().toLowerCase() ? (
          <mark
            key={pI}
            className="bg-amber-400 text-stone-950 font-bold px-1 py-0.5 rounded shadow-sm ring-1 ring-amber-500/60 animate-pulse"
          >
            {part}
          </mark>
        ) : (
          <span key={pI}>{bionicReading ? renderBionicWords(part) : part}</span>
        )
      );
    }

    // Check for saved user highlights in this paragraph
    for (const hl of pageHighlights) {
      if (text.includes(hl.text)) {
        const parts = text.split(hl.text);
        return (
          <span>
            {parts.map((part, pI) => (
              <React.Fragment key={pI}>
                {pI > 0 && (
                  <mark
                    className={`${highlightStyles[hl.color]} cursor-pointer`}
                    title={hl.note ? `Notiz: ${hl.note}` : 'Markierte Textstelle'}
                  >
                    {hl.text}
                  </mark>
                )}
                {bionicReading ? renderBionicWords(part) : part}
              </React.Fragment>
            ))}
          </span>
        );
      }
    }

    return bionicReading ? renderBionicWords(text) : text;
  };

  const renderBionicWords = (text: string) => {
    const words = text.split(/\s+/).filter(Boolean);
    return words.map((w, idx) => {
      const len = w.length;
      let anchor = 1;
      if (len <= 3) anchor = 1;
      else if (len <= 6) anchor = 2;
      else if (len <= 9) anchor = 3;
      else anchor = 4;

      const boldPart = w.slice(0, anchor);
      const regularPart = w.slice(anchor);

      return (
        <span key={idx} className="inline">
          <strong className="font-bold">{boldPart}</strong>
          <span>{regularPart}</span>{' '}
        </span>
      );
    });
  };

  // Extract paragraphs from page html
  const extractParagraphs = (html: string) => {
    const clean = html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, '');
    const div = document.createElement('div');
    div.innerHTML = clean;

    const list: string[] = [];
    const pEls = div.querySelectorAll('p, blockquote, div, li');
    if (pEls.length > 0) {
      pEls.forEach((el) => {
        const t = el.textContent?.trim();
        if (t) list.push(t);
      });
    } else {
      const t = div.textContent?.trim();
      if (t) list.push(...t.split(/\n+/).map((s) => s.trim()).filter(Boolean));
    }
    return list;
  };

  const renderSinglePageContent = (
    page: RenderedPage | null,
    isLeft: boolean,
    pageIdx: number
  ) => {
    if (!page) {
      return (
        <div className="flex-1 flex items-center justify-center text-stone-500/40 italic font-serif select-none">
          · Finis ·
        </div>
      );
    }

    const paragraphs = extractParagraphs(page.htmlContent);
    const isChapterStart = Boolean(
      page.isChapterStart ||
      page.pageNumber === 1 ||
      page.htmlContent.includes('<h1') ||
      page.htmlContent.includes('<h2')
    );

    return (
      <div
        className="flex-1 flex flex-col justify-between p-6 sm:p-10 md:p-12 relative overflow-hidden select-text"
        onMouseUp={() => handleMouseUp(pageIdx, page.chapterTitle)}
      >
        {/* Running Header */}
        <header
          className="flex items-center justify-between pb-3 mb-6 border-b border-stone-400/20 text-[11px] uppercase tracking-widest font-serif italic select-none"
          style={{ color: activePaper.subText }}
        >
          <span>{isLeft ? page.bookTitle : page.chapterTitle}</span>
          <span className="font-mono text-[10px] tracking-normal not-italic">{page.pageNumber}</span>
        </header>

        {/* Page Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Chapter Title Banner on Chapter Start */}
          {isChapterStart && page.chapterTitle && (
            <div className="text-center my-6 pb-4 border-b border-stone-400/20 select-none">
              <h2
                className="text-xl sm:text-2xl font-bold tracking-wide"
                style={{ fontFamily: '"Cinzel", "Cormorant Garamond", serif', color: activePaper.text }}
              >
                {page.chapterTitle}
              </h2>
              <div className="w-16 h-0.5 mx-auto mt-3 bg-amber-500/40 rounded-full" />
            </div>
          )}

          {/* Paragraphs */}
          <div
            style={{
              fontFamily: activeFont,
              fontSize: `${fontSize}px`,
              lineHeight: `${lineHeight}px`,
              color: activePaper.text
            }}
          >
            {paragraphs.map((p, idx) => (
              <React.Fragment key={idx}>
                {renderFormattedParagraph(p, pageIdx, isChapterStart && idx === 0)}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer
          className="pt-4 mt-4 border-t border-stone-400/15 flex items-center justify-center text-xs font-mono tabular-nums select-none"
          style={{ color: activePaper.subText }}
        >
          <span>— {page.pageNumber} —</span>
        </footer>
      </div>
    );
  };

  return (
    <div
      className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 select-none"
      style={{ backgroundColor: activeAtmosphere.bg }}
    >
      {/* Atmosphere radial glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: activeAtmosphere.glow }}
      />

      {/* Floating Search Match Banner if search term is active */}
      {searchHighlightTerm && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-400/90 text-stone-950 shadow-lg text-xs font-medium backdrop-blur">
          <svg className="w-3.5 h-3.5 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Suchtreffer hervorgehoben: <strong>&quot;{searchHighlightTerm}&quot;</strong></span>
          {onClearSearchHighlight && (
            <button
              onClick={onClearSearchHighlight}
              className="ml-1 p-0.5 hover:bg-black/10 rounded-full cursor-pointer"
              title="Suchmarkierung ausblenden"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 2D Reading View Header Bar */}
      <div className="absolute top-16 left-0 right-0 z-20 flex items-center justify-between px-6 py-2 max-w-5xl mx-auto w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-stone-900/70 border border-stone-800 text-[11px] font-mono text-amber-300">
            2D E-Reader Modus
          </span>
          <button
            onClick={onToggleTwoPageSpread}
            className="px-2.5 py-1 rounded-md bg-stone-900/60 hover:bg-stone-900 border border-stone-800 text-[11px] font-medium text-stone-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Zwischen Doppelseite und Einzelseite wechseln"
          >
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{twoPageSpread ? '2-Seiten' : '1-Seite'}</span>
          </button>
        </div>

        <button
          onClick={onSwitchTo3D}
          className="px-3 py-1 rounded-md bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-xs font-semibold text-amber-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          title="Zurück zum fotorealistischen 3D-Buch wechseln"
        >
          <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          <span>3D Buch Öffnen</span>
        </button>
      </div>

      {/* Main Reading Spread Container */}
      <main
        className="relative z-10 w-[95vw] max-w-5xl h-[78vh] max-h-[880px] rounded-2xl shadow-2xl transition-all duration-300 flex overflow-hidden border pointer-events-auto"
        style={{
          backgroundColor: activePaper.bg,
          borderColor: activePaper.border,
          boxShadow: '0 24px 60px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.2)',
          transform: `scale(${readingZoom})`
        }}
      >
        {/* Left Page */}
        <div className="flex-1 flex flex-col relative border-r border-stone-400/15">
          {renderSinglePageContent(leftPage, true, currentSpreadIndex)}
        </div>

        {/* Center Spine Crease (when dual-page spread) */}
        {twoPageSpread && (
          <div className="w-[1px] h-full relative z-10 select-none pointer-events-none">
            <div className="absolute top-0 bottom-0 -left-6 w-12 bg-gradient-to-r from-black/10 via-black/25 to-black/10 pointer-events-none" />
            <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-stone-900/20" />
          </div>
        )}

        {/* Right Page (if twoPageSpread) */}
        {twoPageSpread && (
          <div className="flex-1 flex flex-col relative">
            {renderSinglePageContent(rightPage, false, currentSpreadIndex + 1)}
          </div>
        )}

        {/* Click zones for convenient flipping */}
        <button
          onClick={() => handleTurn('prev')}
          disabled={currentSpreadIndex <= 0}
          aria-label="Vorherige Seite"
          className="absolute left-0 top-0 bottom-0 w-16 opacity-0 hover:opacity-100 bg-gradient-to-r from-black/15 to-transparent transition-opacity flex items-center justify-start pl-3 text-stone-700/80 hover:text-stone-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-0"
        >
          <span className="text-3xl font-serif">‹</span>
        </button>

        <button
          onClick={() => handleTurn('next')}
          disabled={currentSpreadIndex + (twoPageSpread ? 2 : 1) >= pages.length}
          aria-label="Nächste Seite"
          className="absolute right-0 top-0 bottom-0 w-16 opacity-0 hover:opacity-100 bg-gradient-to-l from-black/15 to-transparent transition-opacity flex items-center justify-end pr-3 text-stone-700/80 hover:text-stone-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-0"
        >
          <span className="text-3xl font-serif">›</span>
        </button>
      </main>

      {/* Floating Side Chevrons for Desktop */}
      <button
        onClick={() => handleTurn('prev')}
        disabled={currentSpreadIndex <= 0}
        aria-label="Vorherige Seite"
        className="fixed left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-20 rounded-xl bg-stone-900/60 hover:bg-stone-900/90 text-stone-300 hover:text-amber-200 border border-stone-800 backdrop-blur-md flex items-center justify-center text-3xl font-serif shadow-xl transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed hidden lg:flex"
      >
        ‹
      </button>

      <button
        onClick={() => handleTurn('next')}
        disabled={currentSpreadIndex + (twoPageSpread ? 2 : 1) >= pages.length}
        aria-label="Nächste Seite"
        className="fixed right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-20 rounded-xl bg-stone-900/60 hover:bg-stone-900/90 text-stone-300 hover:text-amber-200 border border-stone-800 backdrop-blur-md flex items-center justify-center text-3xl font-serif shadow-xl transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed hidden lg:flex"
      >
        ›
      </button>

      {/* Floating Highlighter / Selection Popover Toolbar */}
      {selectionToolbar && (
        <div
          className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 bg-stone-900/95 border border-stone-700/80 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1.5 text-stone-200 backdrop-blur-md pointer-events-auto"
          style={{
            left: `${selectionToolbar.x}px`,
            top: `${selectionToolbar.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {!notePromptOpen ? (
            <div className="flex items-center gap-1.5">
              {/* Color swatches */}
              <div className="flex items-center gap-1 pr-1.5 border-r border-stone-700/60">
                <button
                  onClick={() => handleApplyHighlight('amber')}
                  className="w-5 h-5 rounded-full bg-amber-400 hover:scale-110 transition-transform shadow-sm cursor-pointer"
                  title="Gold markieren"
                />
                <button
                  onClick={() => handleApplyHighlight('emerald')}
                  className="w-5 h-5 rounded-full bg-emerald-400 hover:scale-110 transition-transform shadow-sm cursor-pointer"
                  title="Smaragdgrün markieren"
                />
                <button
                  onClick={() => handleApplyHighlight('rose')}
                  className="w-5 h-5 rounded-full bg-rose-400 hover:scale-110 transition-transform shadow-sm cursor-pointer"
                  title="Korallrosa markieren"
                />
                <button
                  onClick={() => handleApplyHighlight('sky')}
                  className="w-5 h-5 rounded-full bg-sky-400 hover:scale-110 transition-transform shadow-sm cursor-pointer"
                  title="Azurblau markieren"
                />
              </div>

              {/* Add Note Button */}
              <button
                onClick={() => {
                  setPendingColor('amber');
                  setNotePromptOpen(true);
                }}
                className="px-2 py-1 text-xs hover:bg-stone-800 rounded-lg text-stone-300 hover:text-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Notiz zum Zitat anheften"
              >
                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Notiz</span>
              </button>

              {/* Speak Selection */}
              <button
                onClick={handleSpeakSelection}
                className="p-1 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-amber-200 transition-colors cursor-pointer"
                title="Ausgewählten Text vorlesen"
              >
                <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>

              {/* Copy Selection */}
              <button
                onClick={handleCopySelection}
                className="p-1 hover:bg-stone-800 rounded-lg text-stone-300 hover:text-amber-200 transition-colors cursor-pointer"
                title="In Zwischenablage kopieren"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Close Toolbar */}
              <button
                onClick={() => setSelectionToolbar(null)}
                className="p-1 text-stone-400 hover:text-stone-100 rounded-lg cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-1 min-w-[240px]">
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Notiz zum Zitat:</span>
                <div className="flex items-center gap-1">
                  {(['amber', 'emerald', 'rose', 'sky'] as HighlightColor[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setPendingColor(c)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        c === 'amber' ? 'bg-amber-400' : c === 'emerald' ? 'bg-emerald-400' : c === 'rose' ? 'bg-rose-400' : 'bg-sky-400'
                      } ${pendingColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70'}`}
                    />
                  ))}
                </div>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Gedanke oder Anmerkung..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveWithNote();
                }}
                className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setNotePromptOpen(false)}
                  className="px-2 py-1 text-[11px] text-stone-400 hover:text-stone-200 cursor-pointer"
                >
                  Zurück
                </button>
                <button
                  onClick={handleSaveWithNote}
                  className="px-2.5 py-1 text-[11px] bg-amber-400 text-stone-950 font-bold rounded-md hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  Speichern
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
