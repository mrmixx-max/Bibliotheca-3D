import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ParsedBook } from '../types/epub';

interface SpeedReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: ParsedBook;
  currentSpreadIndex: number;
  onSyncSpread: (spreadIndex: number) => void;
}

export const SpeedReaderModal: React.FC<SpeedReaderModalProps> = ({
  isOpen,
  onClose,
  book,
  currentSpreadIndex,
  onSyncSpread
}) => {
  // Extract all words from current book, mapping each word to its page index
  const [words, setWords] = useState<{ text: string; pageIndex: number; isPunctuationPause: boolean }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(380); // Default comfortable speed reading pace
  const [highlightORP, setHighlightORP] = useState(true);

  const timerRef = useRef<number | null>(null);

  // Parse words whenever book or starting page changes
  useEffect(() => {
    if (!isOpen) return;

    const extracted: { text: string; pageIndex: number; isPunctuationPause: boolean }[] = [];

    book.pages.forEach((p, pIdx) => {
      // Clean HTML tags
      const div = document.createElement('div');
      div.innerHTML = p.htmlContent;
      const text = div.textContent || div.innerText || '';

      const tokens = text.split(/\s+/).filter(t => t.trim().length > 0);
      tokens.forEach(token => {
        const hasMajorPunctuation = /[.!?]$/.test(token);
        const hasMinorPunctuation = /[,;:]$/.test(token);
        extracted.push({
          text: token,
          pageIndex: pIdx,
          isPunctuationPause: hasMajorPunctuation || hasMinorPunctuation
        });
      });
    });

    setWords(extracted);

    // Find starting word index matching currentSpreadIndex
    const startIdx = extracted.findIndex(w => w.pageIndex >= currentSpreadIndex);
    setCurrentIndex(startIdx >= 0 ? startIdx : 0);
    setIsPlaying(false);
  }, [book, currentSpreadIndex, isOpen]);

  // Main RSVP loop
  const step = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= words.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [words.length]);

  useEffect(() => {
    if (!isPlaying || words.length === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentWord = words[currentIndex];
    const baseInterval = (60 / wpm) * 1000;

    // Intelligent pause multiplier on sentence boundaries and commas
    let delay = baseInterval;
    if (currentWord?.isPunctuationPause) {
      delay = baseInterval * 1.6;
    } else if (currentWord?.text.length > 9) {
      delay = baseInterval * 1.25;
    }

    timerRef.current = window.setTimeout(() => {
      step();
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPlaying, step, words, wpm]);

  // Sync back to 3D book when paused or closed
  const handleClose = () => {
    setIsPlaying(false);
    const activeWord = words[currentIndex];
    if (activeWord) {
      const spread = activeWord.pageIndex % 2 === 0 ? activeWord.pageIndex : activeWord.pageIndex - 1;
      onSyncSpread(Math.max(0, spread));
    }
    onClose();
  };

  // Keyboard navigation (Space to toggle, arrows to seek)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex(i => Math.min(words.length - 1, i + 10));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(i => Math.max(0, i - 10));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWpm(w => Math.min(1000, w + 25));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWpm(w => Math.max(150, w - 25));
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, words.length]);

  if (!isOpen) return null;

  const currentWord = words[currentIndex]?.text || '';

  // Calculate ORP (Optimal Recognition Point)
  let orpIndex = 0;
  const wordLen = currentWord.length;
  if (wordLen <= 1) orpIndex = 0;
  else if (wordLen <= 5) orpIndex = 1;
  else if (wordLen <= 9) orpIndex = 2;
  else if (wordLen <= 13) orpIndex = 3;
  else orpIndex = 4;

  const leftPart = currentWord.slice(0, orpIndex);
  const orpLetter = currentWord[orpIndex] || '';
  const rightPart = currentWord.slice(orpIndex + 1);

  const progressPercent = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
  const activePage = words[currentIndex]?.pageIndex ? words[currentIndex].pageIndex + 1 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-xl select-none">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <span className="font-serif font-semibold text-sm text-amber-200">
              RSVP Speed-Reader
            </span>
            <span className="text-stone-500 text-xs">·</span>
            <span className="text-xs text-stone-400 font-serif italic truncate max-w-[200px]">
              {book.metadata.title}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Speed Reading Focal Box with Reticle Guides */}
        <div className="py-20 px-8 flex flex-col items-center justify-center relative bg-stone-950/70 border-b border-stone-800/80">
          {/* Top & Bottom ORP Focal Markers */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-0.5 h-4 bg-amber-400/80 rounded" />
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-0.5 h-4 bg-amber-400/80 rounded" />
          </div>

          {/* Word Display with Fixed ORP Alignment */}
          <div className="relative w-full flex items-center h-24">
            {/* Left part aligned to right edge of focal column */}
            <div className="flex-1 text-right text-3xl sm:text-4xl font-serif text-stone-300 tracking-normal pr-0.5">
              {leftPart}
            </div>

            {/* Centered ORP Anchor letter */}
            <div className="text-3xl sm:text-4xl font-serif font-bold text-amber-400 px-0.5 shrink-0">
              {orpLetter}
            </div>

            {/* Right part aligned to left edge of focal column */}
            <div className="flex-1 text-left text-3xl sm:text-4xl font-serif text-stone-300 tracking-normal pl-0.5">
              {rightPart}
            </div>
          </div>

          {/* Context Snippet preview */}
          <div className="mt-4 text-xs font-serif italic text-stone-500 max-w-md text-center truncate">
            {words.slice(Math.max(0, currentIndex - 3), currentIndex + 4).map(w => w.text).join(' ')}
          </div>
        </div>

        {/* Speed & Playback Controls */}
        <div className="p-6 space-y-5 bg-stone-900/90">
          {/* Primary Action Button & WPM */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(p => !p)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    <span>Pause (Leertaste)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Starten (Leertaste)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentIndex(i => Math.max(0, i - 15))}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="-15 Wörter (Pfeil Links)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>

              <button
                onClick={() => setCurrentIndex(i => Math.min(words.length - 1, i + 15))}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="+15 Wörter (Pfeil Rechts)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            </div>

            {/* WPM badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">Geschwindigkeit:</span>
              <span className="font-mono tabular-nums text-sm font-bold text-amber-300 bg-stone-950 px-2.5 py-1 rounded-md border border-stone-800">
                {wpm} WPM
              </span>
            </div>
          </div>

          {/* WPM Slider & Presets */}
          <div className="space-y-2">
            <input
              type="range"
              min="150"
              max="900"
              step="25"
              value={wpm}
              onChange={(e) => setWpm(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-300"
            />
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <div className="flex items-center gap-2">
                {[250, 350, 450, 600, 750].map((presetWpm) => (
                  <button
                    key={presetWpm}
                    onClick={() => setWpm(presetWpm)}
                    className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      wpm === presetWpm
                        ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {presetWpm}
                  </button>
                ))}
              </div>
              <span className="font-mono tabular-nums text-stone-500">
                Seite {activePage} · {Math.round(progressPercent)}%
              </span>
            </div>
          </div>

          {/* Book progress scrub line */}
          <div className="pt-2 border-t border-stone-800/80">
            <input
              type="range"
              min="0"
              max={Math.max(0, words.length - 1)}
              value={currentIndex}
              onChange={(e) => setCurrentIndex(parseInt(e.target.value, 10))}
              className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
