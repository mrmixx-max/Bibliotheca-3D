import React, { useState } from 'react';
import { Bookmark, RenderedPage } from '../types/epub';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Bookmark[];
  onAddBookmark: (pageIndex: number, note?: string) => void;
  onDeleteBookmark: (id: string) => void;
  onJumpToBookmark: (pageIndex: number) => void;
  currentSpreadIndex: number;
  currentPage: RenderedPage | null;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  onJumpToBookmark,
  currentSpreadIndex,
  currentPage
}) => {
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onAddBookmark(currentSpreadIndex, newNote.trim() || undefined);
    setNewNote('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-md max-h-[80vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-100 font-serif">Lesezeichen & Notizen</h2>
            <p className="text-xs text-stone-400 mt-0.5">Ihre gemerkten Textstellen</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add Bookmark Action */}
        <div className="p-4 border-b border-stone-800/60 bg-stone-950/40">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700/80 text-amber-200 text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Lesezeichen auf aktueller Seite ({currentSpreadIndex + 1}) anheften</span>
            </button>
          ) : (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Optionale Notiz eingeben..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-xs bg-amber-400 text-stone-950 font-medium rounded-lg hover:bg-amber-300 transition-colors"
                >
                  Speichern
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bookmark List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {bookmarks.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              Noch keine Lesezeichen vorhanden
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="p-3 rounded-xl border border-stone-800 bg-stone-950/40 hover:border-stone-700 transition-all flex items-start justify-between gap-3 group"
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
                    <div className="text-xs text-stone-200 font-medium mb-1">
                      {bm.note}
                    </div>
                  )}
                  <p className="text-[11px] text-stone-500 line-clamp-2 italic font-serif">
                    »{bm.excerpt}«
                  </p>
                </div>

                <button
                  onClick={() => onDeleteBookmark(bm.id)}
                  title="Löschen"
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-500 hover:text-red-400 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
