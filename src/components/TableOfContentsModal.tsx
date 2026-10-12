import React, { useState } from 'react';
import { Chapter, RenderedPage } from '../types/epub';

interface TableOfContentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  pages: RenderedPage[];
  currentSpreadIndex: number;
  onSelectPage: (pageIndex: number) => void;
  bookTitle: string;
}

export const TableOfContentsModal: React.FC<TableOfContentsModalProps> = ({
  isOpen,
  onClose,
  chapters,
  pages,
  currentSpreadIndex,
  onSelectPage,
  bookTitle
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'fulltext'>('chapters');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Chapter mapping
  const chaptersWithPages = chapters.map((chapter, cIdx) => {
    const pageIndex = pages.findIndex(p => p.chapterIndex === cIdx);
    return {
      chapter,
      startPage: pageIndex >= 0 ? pageIndex : 0
    };
  });

  const filteredChapters = chaptersWithPages.filter(item =>
    item.chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fulltext search results across all pages
  const fullTextResults: { pageIndex: number; chapterTitle: string; excerpt: string }[] = [];
  if (activeTab === 'fulltext' && searchQuery.trim().length >= 2) {
    const q = searchQuery.toLowerCase();
    pages.forEach((page, pIdx) => {
      const div = document.createElement('div');
      div.innerHTML = page.htmlContent;
      const plainText = div.textContent || div.innerText || '';
      const lower = plainText.toLowerCase();

      const matchIdx = lower.indexOf(q);
      if (matchIdx >= 0) {
        const start = Math.max(0, matchIdx - 40);
        const end = Math.min(plainText.length, matchIdx + q.length + 60);
        const excerpt = (start > 0 ? '...' : '') + plainText.slice(start, end).trim() + (end < plainText.length ? '...' : '');
        fullTextResults.push({
          pageIndex: pIdx,
          chapterTitle: page.chapterTitle,
          excerpt
        });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg max-h-[82vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-100 font-serif">Inhalt & Volltextsuche</h2>
            <p className="text-xs text-stone-400 mt-0.5 truncate max-w-xs">{bookTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab switch & Search */}
        <div className="p-4 border-b border-stone-800/80 bg-stone-950/40 space-y-3">
          {/* Segmented Tab */}
          <div className="flex items-center p-0.5 bg-stone-900 rounded-lg border border-stone-800 text-xs">
            <button
              onClick={() => setActiveTab('chapters')}
              className={`flex-1 py-1.5 text-center font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'chapters'
                  ? 'bg-amber-400/20 text-amber-200 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Kapitel ({chapters.length})
            </button>
            <button
              onClick={() => setActiveTab('fulltext')}
              className={`flex-1 py-1.5 text-center font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'fulltext'
                  ? 'bg-amber-400/20 text-amber-200 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Volltextsuche
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={activeTab === 'chapters' ? 'Kapitel filtern...' : 'Suchbegriff im gesamten Buchtext eingeben...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-800/70 border border-stone-700/60 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="p-4 overflow-y-auto space-y-1.5 flex-1 divide-y divide-stone-800/40">
          {activeTab === 'chapters' ? (
            filteredChapters.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                Keine Kapitel gefunden
              </div>
            ) : (
              filteredChapters.map(({ chapter, startPage }) => {
                const isActive =
                  currentSpreadIndex >= startPage &&
                  (startPage === chaptersWithPages[chaptersWithPages.length - 1]?.startPage ||
                    currentSpreadIndex <
                      (chaptersWithPages.find(c => c.startPage > startPage)?.startPage ?? Infinity));

                return (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      const targetSpread = startPage % 2 === 0 ? startPage : startPage - 1;
                      onSelectPage(Math.max(0, targetSpread));
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-400/10 text-amber-200 font-medium'
                        : 'text-stone-300 hover:bg-stone-800/50 hover:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <span className="font-serif text-sm truncate">
                        {chapter.title}
                      </span>
                    </div>
                    <div className="text-xs font-mono tabular-nums text-stone-500 shrink-0">
                      S. {startPage + 1}
                    </div>
                  </button>
                );
              })
            )
          ) : (
            // Fulltext Search Results
            searchQuery.trim().length < 2 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                Geben Sie mindestens 2 Zeichen ein, um das gesamte Buch zu durchsuchen
              </div>
            ) : fullTextResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                Keine Treffer für »{searchQuery}« gefunden
              </div>
            ) : (
              fullTextResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const targetSpread = res.pageIndex % 2 === 0 ? res.pageIndex : res.pageIndex - 1;
                    onSelectPage(Math.max(0, targetSpread));
                    onClose();
                  }}
                  className="w-full p-3 rounded-lg text-left transition-colors hover:bg-stone-800/50 cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-serif font-semibold text-amber-300 truncate">
                      {res.chapterTitle}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-stone-500 shrink-0">
                      Seite {res.pageIndex + 1}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-serif line-clamp-2 leading-relaxed">
                    {res.excerpt}
                  </p>
                </button>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
