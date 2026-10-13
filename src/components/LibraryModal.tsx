import React, { useRef, useState } from 'react';
import { SAMPLE_BOOKS, SampleBookDef } from '../utils/sampleBooks';
import { parseEpubFile } from '../utils/epubParser';
import { ParsedBook, BookMetadata } from '../types/epub';
import { pickEpubBytes, isDesktop } from '../utils/platform';

interface LibraryBook {
  metadata: BookMetadata;
  sourcePath: string;
  addedAt: number;
}

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSampleBook: (bookId: string) => void;
  onLoadCustomBook: (book: ParsedBook) => void;
  activeBookTitle: string;
  library: LibraryBook[];
  onRemoveFromLibrary: (sourcePath: string) => void;
  onAddEpubFiles: (multiple: boolean) => Promise<void>;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectSampleBook,
  onLoadCustomBook,
  activeBookTitle,
  library,
  onRemoveFromLibrary,
  onAddEpubFiles
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Import via the native picker: only that path gives us a real file path,
  // which the library needs to re-open the book later.
  const handleBrowse = async () => {
    if (isDesktop()) {
      setErrorMsg(null);
      setLoading(true);
      try {
        await onAddEpubFiles(false);
      } finally {
        setLoading(false);
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.epub')) {
      setErrorMsg('Bitte laden Sie eine gültige .epub Datei hoch.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const parsed = await parseEpubFile(file);
      onLoadCustomBook(parsed);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Fehler beim Lesen der EPUB-Datei.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (isDesktop()) {
        await handleBrowse();
      } else {
        handleFile(e.dataTransfer.files[0]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-100 font-serif">Bibliothek & EPUB Import</h2>
            <p className="text-xs text-stone-400 mt-0.5">Wählen Sie einen Klassiker oder laden Sie ein eigenes E-Book</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => { void handleBrowse(); }}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-400/5'
                : 'border-stone-700/80 hover:border-stone-600 bg-stone-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".epub"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-amber-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="text-sm font-medium text-stone-200">
                {loading ? 'EPUB wird dekomprimiert & gerendert...' : 'Eigene EPUB-Datei hier ablegen'}
              </div>
              <p className="text-xs text-stone-500">
                Oder klicken zum Durchsuchen Ihres Computers (.epub Format)
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          {/* Curated Classics Grid */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Vorinstallierte Meisterwerke
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_BOOKS.map((book: SampleBookDef) => {
                const isSelected = activeBookTitle === book.metadata.title;
                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      onSelectSampleBook(book.id);
                      onClose();
                    }}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-400/80 bg-stone-800/90 shadow-md'
                        : 'border-stone-800 bg-stone-950/50 hover:bg-stone-800/60 hover:border-stone-700'
                    }`}
                  >
                    {/* Simulated miniature leather book cover */}
                    <div
                      className="w-12 h-16 rounded shadow-md shrink-0 flex flex-col justify-between p-1 border border-white/10"
                      style={{ backgroundColor: book.metadata.coverColor || '#221417' }}
                    >
                      <div className="text-[7px] text-amber-200/80 font-serif uppercase tracking-widest text-center truncate">
                        {book.metadata.author.split(' ').pop()}
                      </div>
                      <div className="text-[8px] text-amber-100 font-serif font-bold text-center line-clamp-2">
                        {book.metadata.title}
                      </div>
                      <div className="h-0.5 bg-amber-400/30 rounded" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-serif font-semibold text-sm text-stone-100 truncate">
                        {book.metadata.title}
                      </div>
                      <div className="text-xs text-stone-400 truncate">
                        {book.metadata.author}
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-snug">
                        {book.metadata.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
                      </div>

                      {/* User Library Grid */}
                                            {library.length > 0 && (
                                              <div>
                                                <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                                                  Meine Bibliothek
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                  {library.map((entry: LibraryBook) => {
                                                    const isSelected = activeBookTitle === entry.metadata.title;
                                                    return (
                                                      <div
                                                        key={entry.sourcePath}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={async () => {
                                                          try {
                                                            const bytes = await pickEpubBytes(entry.sourcePath);
                                                            if (bytes) {
                                                              const parsed = await parseEpubFile(bytes);
                                                              onLoadCustomBook(parsed);
                                                              onClose();
                                                            }
                                                          } catch (err) {
                                                            console.error('Failed to load library book:', err);
                                                          }
                                                        }}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            (e.currentTarget as HTMLElement).click();
                                                          }
                                                        }}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                                                          isSelected
                                                            ? 'border-amber-400/80 bg-stone-800/90 shadow-md'
                                                            : 'border-stone-800 bg-stone-950/50 hover:bg-stone-800/60 hover:border-stone-700'
                                                        }`}
                                                      >
                                                        {/* Simulated miniature leather book cover */}
                                                        <div
                                                          className="w-12 h-16 rounded shadow-md shrink-0 flex flex-col justify-between p-1 border border-white/10"
                                                          style={{ backgroundColor: entry.metadata.coverColor || '#221417' }}
                                                        >
                                                          <div className="text-[7px] text-amber-200/80 font-serif uppercase tracking-widest text-center truncate">
                                                            {entry.metadata.author.split(' ').pop()}
                                                          </div>
                                                          <div className="text-[8px] text-amber-100 font-serif font-bold text-center line-clamp-2">
                                                            {entry.metadata.title}
                                                          </div>
                                                          <div className="h-0.5 bg-amber-400/30 rounded" />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                          <div className="font-serif font-semibold text-sm text-stone-100 truncate">
                                                            {entry.metadata.title}
                                                          </div>
                                                          <div className="text-xs text-stone-400 truncate">
                                                            {entry.metadata.author}
                                                          </div>
                                                          <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 leading-snug">
                                                            {entry.metadata.description || 'Keine Beschreibung verfügbar'}
                                                          </p>
                                                        </div>

                                                        {/* Delete button */}
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRemoveFromLibrary(entry.sourcePath);
                                                          }}
                                                          className="p-1 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors ml-2"
                                                          title="Aus Bibliothek entfernen"
                                                        >
                                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                          </svg>
                                                        </button>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
                    </div>
                  </div>
                </div>
              );
            };
