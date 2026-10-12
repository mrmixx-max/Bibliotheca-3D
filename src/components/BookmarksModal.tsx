import React, { useState } from 'react';
import { Bookmark, RenderedPage, TextHighlight } from '../types/epub';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  highlights?: TextHighlight[];
  onAddBookmark: (pageIndex: number, note?: string) => void;
  onDeleteBookmark: (id: string) => void;
  onDeleteHighlight?: (id: string) => void;
  onJumpToBookmark: (pageIndex: number) => void;
  currentSpreadIndex: number;
  currentPage: RenderedPage | null;
  /** Shown in the header so it is clear which title these entries belong to. */
  bookTitle?: string;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  highlights = [],
  onAddBookmark,
  onDeleteBookmark,
  onDeleteHighlight,
  onJumpToBookmark,
  currentSpreadIndex,
  bookTitle
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'highlights'>('bookmarks');
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onAddBookmark(currentSpreadIndex, newNote.trim() || undefined);
    setNewNote('');
    setShowAddForm(false);
  };

  const highlightColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    amber: { bg: 'bg-amber-400/20', border: 'border-amber-400/50', text: 'text-amber-200', label: 'Gold' },
    emerald: { bg: 'bg-emerald-400/20', border: 'border-emerald-400/50', text: 'text-emerald-200', label: 'Smaragd' },
    rose: { bg: 'bg-rose-400/20', border: 'border-rose-400/50', text: 'text-rose-200', label: 'Koralle' },
    sky: { bg: 'bg-sky-400/20', border: 'border-sky-400/50', text: 'text-sky-200', label: 'Azur' }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-100 font-serif">Lesezeichen & Markierungen</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {bookTitle ? <>Nur für <span className="text-amber-300/90 font-serif italic">{bookTitle}</span></> : 'Ihre gemerkten Seiten und markierten Zitate'}
            </p>
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

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bookmarks'
                ? 'border-amber-400 text-amber-200'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Lesezeichen</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] font-mono text-stone-300">
              {bookmarks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('highlights')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'highlights'
                ? 'border-amber-400 text-amber-200'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>Farbige Textstellen</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-800 text-[10px] font-mono text-stone-300">
              {highlights.length}
            </span>
          </button>
        </div>

        {activeTab === 'bookmarks' ? (
          <>
            {/* Add Bookmark Action */}
            <div className="p-4 border-b border-stone-800/60 bg-stone-950/40">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700/80 text-amber-200 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer border border-stone-700/60"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>Lesezeichen auf aktueller Seite ({currentSpreadIndex + 1}) anheften</span>
                </button>
              ) : (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Optionale Notiz eingeben (z. B. 'Wichtiges Zitat')..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-3.5 py-1.5 text-xs bg-amber-400 text-stone-950 font-bold rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
                    >
                      Speichern
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bookmark List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh]">
              {bookmarks.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500">
                  Noch keine Lesezeichen vorhanden. Klicken Sie oben auf &quot;Lesezeichen anheften&quot;.
                </div>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="p-3.5 rounded-xl border border-stone-800 bg-stone-950/40 hover:border-stone-700 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div
                      onClick={() => {
                        onJumpToBookmark(bm.pageIndex);
                        onClose();
                      }}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] text-amber-400 font-semibold">
                          Seite {bm.pageIndex + 1}
                        </span>
                        <span className="text-stone-600 text-xs">·</span>
                        <span className="text-[11px] text-stone-400 font-serif truncate">
                          {bm.chapterTitle}
                        </span>
                      </div>
                      {bm.note && (
                        <div className="text-xs text-amber-100 font-medium mb-1">
                          {bm.note}
                        </div>
                      )}
                      <p className="text-[11px] text-stone-400 line-clamp-2 italic font-serif">
                        »{bm.excerpt}«
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      title="Lesezeichen löschen"
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-500 hover:text-red-400 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Highlights List */
          <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[60vh]">
            {highlights.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 space-y-2">
                <p>Noch keine markierten Textstellen vorhanden.</p>
                <p className="text-[11px] text-stone-600">
                  Tipp: Markieren Sie im 2D-Lesemodus einfach beliebigen Text mit der Maus, um ihn farbig hervorzuheben oder mit einer Notiz zu versehen.
                </p>
              </div>
            ) : (
              highlights.map((hl) => {
                const col = highlightColors[hl.color] || highlightColors.amber;
                return (
                  <div
                    key={hl.id}
                    className={`p-3.5 rounded-xl border ${col.border} ${col.bg} transition-all flex items-start justify-between gap-3 group`}
                  >
                    <div
                      onClick={() => {
                        onJumpToBookmark(hl.pageIndex);
                        onClose();
                      }}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-semibold text-stone-300">
                          Seite {hl.pageIndex + 1}
                        </span>
                        <span className="text-stone-600 text-xs">·</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-900/60 text-stone-400">
                          {col.label}
                        </span>
                        {hl.chapterTitle && (
                          <>
                            <span className="text-stone-600 text-xs">·</span>
                            <span className="text-[11px] text-stone-400 font-serif truncate">
                              {hl.chapterTitle}
                            </span>
                          </>
                        )}
                      </div>

                      <p className={`text-xs font-serif italic ${col.text} line-clamp-3 my-1 leading-relaxed`}>
                        &ldquo;{hl.text}&rdquo;
                      </p>

                      {hl.note && (
                        <div className="text-[11px] text-stone-300 font-sans mt-1 bg-stone-900/70 p-2 rounded-lg border border-stone-800">
                          <span className="text-stone-500 text-[10px] block font-mono">Notiz:</span>
                          {hl.note}
                        </div>
                      )}
                    </div>

                    {onDeleteHighlight && (
                      <button
                        onClick={() => onDeleteHighlight(hl.id)}
                        title="Markierung löschen"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
