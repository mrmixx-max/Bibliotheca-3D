import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ParsedBook, SearchResultItem } from '../types/epub';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: ParsedBook;
  currentSpreadIndex: number;
  onSelectPage: (pageIndex: number) => void;
  onHighlightTerm?: (term: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  book,
  currentSpreadIndex,
  onSelectPage,
  onHighlightTerm
}) => {
  const [query, setQuery] = useState('');
  const [filterChapterOnly, setFilterChapterOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Current active chapter title
  const currentChapterTitle = book.pages[currentSpreadIndex]?.chapterTitle || '';

  // Execute search across pages
  const results = useMemo<SearchResultItem[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];

    const matches: SearchResultItem[] = [];

    book.pages.forEach((page, pageIdx) => {
      if (filterChapterOnly && page.chapterTitle !== currentChapterTitle) {
        return;
      }

      // Strip HTML tags for clean text search
      const rawText = page.htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const lowerText = rawText.toLowerCase();

      let startIndex = 0;
      let occurrenceCount = 0;

      while ((startIndex = lowerText.indexOf(trimmed, startIndex)) !== -1) {
        if (occurrenceCount >= 3) break; // Limit to 3 snippets per page to prevent spam

        const matchStart = startIndex;
        const matchEnd = startIndex + trimmed.length;

        // Context excerpt
        const snippetStart = Math.max(0, matchStart - 60);
        const snippetEnd = Math.min(rawText.length, matchEnd + 80);

        let snippet = rawText.slice(snippetStart, snippetEnd);
        if (snippetStart > 0) snippet = '...' + snippet;
        if (snippetEnd < rawText.length) snippet = snippet + '...';

        matches.push({
          pageIndex: pageIdx,
          chapterIndex: page.chapterIndex,
          chapterTitle: page.chapterTitle,
          pageNumber: page.pageNumber,
          matchSnippet: snippet,
          exactTerm: rawText.slice(matchStart, matchEnd)
        });

        occurrenceCount++;
        startIndex = matchEnd;
      }
    });

    return matches;
  }, [query, book.pages, filterChapterOnly, currentChapterTitle]);

  if (!isOpen) return null;

  const handleSelectResult = (pageIndex: number, term: string) => {
    onSelectPage(pageIndex);
    if (onHighlightTerm) {
      onHighlightTerm(term);
    }
    onClose();
  };

  const sampleSearchQueries = ['Prinz', 'Rose', 'Fuchs', 'Sterne', 'König', 'Geheimnis'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="text-base font-semibold text-stone-100 font-serif">Volltextsuche im Buch</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-500 font-mono px-2 py-0.5 rounded bg-stone-800 border border-stone-700/60 hidden sm:inline">
                ESC schließen
              </span>
              <button
                onClick={onClose}
                className="p-1 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Wort oder Textpassage eingeben (z. B. 'Rose', 'Fuchs')..."
              className="w-full pl-10 pr-10 py-3 bg-stone-900/90 border border-stone-700 focus:border-amber-400 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none transition-colors"
            />
            <svg
              className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 text-stone-400 hover:text-stone-200 rounded cursor-pointer"
                title="Suchbegriff löschen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between mt-3 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterChapterOnly(false)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                  !filterChapterOnly
                    ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 font-semibold'
                    : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                Ganzes Buch ({book.pages.length} Seiten)
              </button>
              {currentChapterTitle && (
                <button
                  onClick={() => setFilterChapterOnly(true)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] truncate max-w-[200px] ${
                    filterChapterOnly
                      ? 'bg-amber-400/20 text-amber-200 border border-amber-400/40 font-semibold'
                      : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                  title={currentChapterTitle}
                >
                  Nur: {currentChapterTitle}
                </button>
              )}
            </div>

            {query.trim().length >= 2 && (
              <span className="font-mono text-[11px] text-amber-400">
                {results.length} Treffer
              </span>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 max-h-[55vh]">
          {query.trim().length < 2 ? (
            <div className="py-8 text-center space-y-4">
              <p className="text-xs text-stone-400">
                Geben Sie mindestens 2 Zeichen ein, um das Buch blitzschnell zu durchsuchen.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-sm mx-auto">
                <span className="text-[11px] text-stone-500 w-full mb-1">Beliebte Suchbegriffe:</span>
                {sampleSearchQueries.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs transition-colors cursor-pointer border border-stone-700/60"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <svg className="w-10 h-10 mx-auto mb-2 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-stone-400">Keine Fundstellen für &quot;{query}&quot; gefunden</p>
              <p className="text-[11px] text-stone-600 mt-1">Prüfen Sie die Schreibweise oder suchen Sie nach einem Wortteil</p>
            </div>
          ) : (
            results.map((res, idx) => {
              // Highlight query term in the snippet
              const parts = res.matchSnippet.split(new RegExp(`(${query.trim()})`, 'gi'));

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(res.pageIndex, query.trim())}
                  className="w-full text-left p-3.5 rounded-xl bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-serif font-semibold text-amber-300 group-hover:text-amber-200 truncate max-w-[70%]">
                      {res.chapterTitle || book.metadata.title}
                    </span>
                    <span className="font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800 group-hover:border-stone-700">
                      Seite {res.pageNumber}
                    </span>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed font-serif line-clamp-2">
                    {parts.map((part, pI) =>
                      part.toLowerCase() === query.trim().toLowerCase() ? (
                        <mark
                          key={pI}
                          className="bg-amber-400/30 text-amber-100 font-semibold px-1 py-0.5 rounded"
                        >
                          {part}
                        </mark>
                      ) : (
                        <span key={pI}>{part}</span>
                      )
                    )}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-[11px] text-stone-500">
          <span>Klick auf ein Ergebnis springt direkt zur Buchseite</span>
          <span className="font-serif italic text-stone-400">{book.metadata.title}</span>
        </div>
      </div>
    </div>
  );
};
