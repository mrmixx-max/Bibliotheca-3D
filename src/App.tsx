/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Bookmark, ParsedBook, ReadingSettings, TextHighlight } from './types/epub';
import { bookId, progressKey } from './utils/bookIdentity';
import { getParsedSampleBook } from './utils/sampleBooks';
import { paginateChapters, parseEpubFile } from './utils/epubParser';
import { Book3DScene } from './components/Book3DScene';
import { Book2DView } from './components/Book2DView';
import { ReaderHUD } from './components/ReaderHUD';
import { LibraryModal } from './components/LibraryModal';
import { TableOfContentsModal } from './components/TableOfContentsModal';
import { AtmosphereSettingsModal } from './components/AtmosphereSettingsModal';
import { TypographySettingsModal } from './components/TypographySettingsModal';
import { SpeedReaderModal } from './components/SpeedReaderModal';
import { BookmarksModal } from './components/BookmarksModal';
import { SearchModal } from './components/SearchModal';
import { exportStandaloneHtmlFile } from './utils/singleFileExporter';
import { speechReader } from './utils/speechReader';
import { isDesktop, pickEpubBytes, pickEpubFile, saveTextFile } from './utils/platform';
import {
  getAudioContext,
  startAmbientSound,
  stopAmbientSound,
  updateAmbientVolume,
  startIsochronicTone,
  stopIsochronicTone,
  updateIsochronicFrequency,
  updateIsochronicCarrier,
  updateIsochronicVolume
} from './utils/audioEffects';

const STORAGE_KEY_BOOKMARKS = 'bibliotheca_3d_bookmarks_v1';
const STORAGE_KEY_SETTINGS = 'bibliotheca_3d_settings_v1';
const STORAGE_KEY_HIGHLIGHTS = 'bibliotheca_3d_highlights_v1';

export default function App() {
  // Current active parsed book
  const [book, setBook] = useState<ParsedBook>(() => getParsedSampleBook('der-kleine-prinz'));

  // Reading spread index (even number: 0, 2, 4...)
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);

  // Search and highlighting state (Meilenstein 2)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHighlightTerm, setSearchHighlightTerm] = useState('');

  // Settings
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    const defaults: ReadingSettings = {
      viewMode: '3d',
      twoPageSpread2D: true,
      fontFamily: 'source-serif',
      fontSize: 28,
      lineHeight: 46,
      bionicReading: false,
      paperTonePreset: 'creme',
      readingZoom: 1.0,
      atmosphere: 'candlelight',
      cameraMode: 'reader',
      soundEnabled: true,
      ambientSound: 'none',
      ambientVolume: 0.25,
      isochronic: {
        enabled: false,
        preset: '15.4hz_beta',
        frequency: 15.4,
        carrierFrequency: 216,
        volume: 0.35,
        depth: 0.88
      }
    };

    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaults,
          ...parsed,
          isochronic: {
            ...defaults.isochronic,
            ...(parsed.isochronic || {})
          }
        };
      }
    } catch {
      // ignore
    }
    return defaults;
  });

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Text Highlights (Meilenstein 2)
  const [highlights, setHighlights] = useState<TextHighlight[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Text-to-Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingPaused, setIsSpeakingPaused] = useState(false);

  useEffect(() => {
    const unsub = speechReader.subscribe((speaking, paused) => {
      setIsSpeaking(speaking);
      setIsSpeakingPaused(paused);
    });
    return unsub;
  }, []);

  // Modal states
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTOCOpen, setIsTOCOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);
  const [isSpeedReaderOpen, setIsSpeedReaderOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  // Persist highlights
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(highlights));
    } catch {
      // ignore
    }
  }, [highlights]);

  // Identity of the book currently open — scopes bookmarks, highlights and progress
  const activeBookId = useMemo(() => bookId(book.metadata), [book.metadata]);

  // Bookmarks/highlights for the open book only. The full arrays stay in state so
  // switching books never discards the other titles' entries.
  const activeBookmarks = useMemo(
    () => bookmarks.filter((b) => b.bookId === activeBookId),
    [bookmarks, activeBookId]
  );
  const activeHighlights = useMemo(
    () => highlights.filter((h) => h.bookId === activeBookId),
    [highlights, activeBookId]
  );

  // Audio ambience controller
  useEffect(() => {
    if (settings.ambientSound !== 'none' && settings.soundEnabled) {
      startAmbientSound(settings.ambientSound, settings.ambientVolume);
    } else {
      stopAmbientSound();
    }
    return () => {
      stopAmbientSound();
    };
  }, [settings.ambientSound, settings.soundEnabled]);

  useEffect(() => {
    updateAmbientVolume(settings.ambientVolume);
  }, [settings.ambientVolume]);

  // Isochronic tones controller
  useEffect(() => {
    if (settings.isochronic.enabled && settings.soundEnabled) {
      startIsochronicTone(settings.isochronic);
    } else {
      stopIsochronicTone();
    }
    return () => {
      stopIsochronicTone();
    };
  }, [settings.isochronic.enabled, settings.soundEnabled]);

  useEffect(() => {
    if (settings.isochronic.enabled) {
      updateIsochronicFrequency(settings.isochronic.frequency);
    }
  }, [settings.isochronic.frequency, settings.isochronic.enabled]);

  useEffect(() => {
    if (settings.isochronic.enabled) {
      updateIsochronicCarrier(settings.isochronic.carrierFrequency);
    }
  }, [settings.isochronic.carrierFrequency, settings.isochronic.enabled]);

  useEffect(() => {
    if (settings.isochronic.enabled) {
      updateIsochronicVolume(settings.isochronic.volume);
    }
  }, [settings.isochronic.volume, settings.isochronic.enabled]);

  // Page turning handler
  const handleTurnPage = useCallback(
    (direction: 'next' | 'prev') => {
      setCurrentSpreadIndex((prev) => {
        if (direction === 'next') {
          const nextIdx = Math.min(prev + 2, Math.max(book.pages.length - 2, 0));
          if (nextIdx >= book.pages.length - 2 && prev < book.pages.length - 2) {
            // Book finished! Celebrate with subtle elegant golden confetti
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.75 },
              colors: ['#dfba5a', '#f5d681', '#c59d3f']
            });
          }
          return nextIdx;
        } else {
          return Math.max(prev - 2, 0);
        }
      });
    },
    [book.pages.length]
  );

  // Restore saved reading progress when book changes
  useEffect(() => {
    try {
      const savedPage = localStorage.getItem(progressKey(book.metadata));
      if (savedPage !== null) {
        const parsedIdx = parseInt(savedPage, 10);
        if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < book.pages.length) {
          setCurrentSpreadIndex(parsedIdx % 2 === 0 ? parsedIdx : parsedIdx - 1);
          return;
        }
      }
      setCurrentSpreadIndex(0);
    } catch {
      setCurrentSpreadIndex(0);
    }
  }, [book.metadata, book.pages.length]);

  // Persist current page for active book
  useEffect(() => {
    try {
      localStorage.setItem(progressKey(book.metadata), String(currentSpreadIndex));
    } catch {
      // ignore
    }
  }, [book.metadata, currentSpreadIndex]);

  // Unlock browser audio context on first user interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      getAudioContext();
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    return () => window.removeEventListener('pointerdown', handleFirstGesture);
  }, []);

  const handleSelectPage = (pageIndex: number) => {
    const validEvenIndex = pageIndex % 2 === 0 ? pageIndex : pageIndex - 1;
    setCurrentSpreadIndex(Math.max(0, Math.min(validEvenIndex, book.pages.length - 2)));
  };

  const handleSelectSampleBook = (bookId: string) => {
    const newBook = getParsedSampleBook(bookId);
    setBook(newBook);
  };

  const handleLoadCustomBook = (newBook: ParsedBook) => {
    setBook(newBook);
  };

  // Open an EPUB through the native dialog. Falls back to the in-app library
  // modal in the browser, where no native picker exists.
  const handleOpenNative = useCallback(async () => {
    if (!isDesktop()) {
      setIsLibraryOpen(true);
      return;
    }
    try {
      const opened = await pickEpubFile();
      if (!opened) return;
      const parsed = await parseEpubFile(opened.bytes.buffer as ArrayBuffer);
      handleLoadCustomBook(parsed);
    } catch (err) {
      console.error('EPUB konnte nicht geöffnet werden:', err);
    }
  }, []);

  const handleAddBookmark = (pageIndex: number, note?: string) => {
    const page = book.pages[pageIndex] || book.pages[0];
    const excerpt = page
      ? page.htmlContent.replace(/<[^>]+>/g, '').trim().slice(0, 140) + '...'
      : 'Seite ' + (pageIndex + 1);

    const newBm: Bookmark = {
      id: 'bm_' + Date.now(),
      bookId: activeBookId,
      pageIndex,
      chapterTitle: page ? page.chapterTitle : 'Lesezeichen',
      excerpt,
      timestamp: Date.now(),
      note
    };

    setBookmarks((prev) => [newBm, ...prev]);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddHighlight = (hl: Omit<TextHighlight, 'id' | 'timestamp' | 'bookId'>) => {
    const newHl: TextHighlight = {
      ...hl,
      bookId: activeBookId,
      id: 'hl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now()
    };
    setHighlights((prev) => [newHl, ...prev]);
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const handleToggleSpeech = useCallback(() => {
    const leftP = book.pages[currentSpreadIndex];
    const rightP = book.pages[currentSpreadIndex + 1];
    const combinedText = [leftP?.htmlContent, rightP?.htmlContent].filter(Boolean).join(' ');
    speechReader.toggle(
      combinedText,
      () => {
        handleTurnPage('next');
      },
      1.0,
      book.metadata.language || 'de-DE'
    );
  }, [book.pages, book.metadata.language, currentSpreadIndex, handleTurnPage]);

  // Clean up speech on book change
  useEffect(() => {
    speechReader.stop();
  }, [activeBookId]);

  const handleExportHtml = useCallback(() => {
    void exportStandaloneHtmlFile(book, async (suggestedName, contents) => {
      // Desktop: let the user choose the destination. Browser: keep the
      // existing download behaviour.
      if (isDesktop()) {
        await saveTextFile(suggestedName, contents);
      }
    });
  }, [book]);

  const handleUpdateSettings = useCallback((partial: Partial<ReadingSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (partial.fontSize && !partial.lineHeight) {
        next.lineHeight = Math.round(partial.fontSize * 1.62);
      }
      return next;
    });

    if (partial.fontSize !== undefined) {
      const newSize = partial.fontSize;
      setBook((prev) => {
        if (!prev.chapters || prev.chapters.length === 0) return prev;
        return {
          ...prev,
          pages: paginateChapters(prev.chapters, prev.metadata, newSize)
        };
      });
    }
  }, []);

  // Window drag & drop handler for EPUB files
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith('.epub')) {
          try {
            const parsed = await parseEpubFile(file);
            handleLoadCustomBook(parsed);
          } catch (err) {
            console.error('Drop EPUB failed:', err);
          }
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Native drop handling: Tauri reports dropped files by path rather than as
  // File objects, so the webview's own drop event never fires in the shell.
  useEffect(() => {
    if (!isDesktop()) return;
    let unlisten: (() => void) | undefined;

    void (async () => {
      const { getCurrentWebview } = await import('@tauri-apps/api/webview');
      unlisten = await getCurrentWebview().onDragDropEvent(async (event) => {
        if (event.payload.type !== 'drop') return;
        const first = event.payload.paths?.[0];
        if (!first || !first.toLowerCase().endsWith('.epub')) return;
        try {
          const bytes = await pickEpubBytes(first);
          if (!bytes) return;
          const parsed = await parseEpubFile(bytes.buffer as ArrayBuffer);
          handleLoadCustomBook(parsed);
        } catch (err) {
          console.error('Drop EPUB failed:', err);
        }
      });
    })();

    return () => {
      unlisten?.();
    };
  }, []);

  // Menu bar actions. The native menu lives in Rust; it forwards clicks here so
  // the behaviour stays in one place with the rest of the UI state.
  useEffect(() => {
    if (!isDesktop()) return;
    let unlisten: (() => void) | undefined;

    void (async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen<string>('menu-action', (event) => {
        switch (event.payload) {
          case 'open_epub':
            void handleOpenNative();
            break;
          case 'open_library':
            setIsLibraryOpen(true);
            break;
          case 'export_html':
            handleExportHtml();
            break;
          case 'open_search':
            setIsSearchOpen(true);
            break;
          case 'open_bookmarks':
            setIsBookmarksOpen(true);
            break;
          case 'open_settings':
            setIsSettingsOpen(true);
            break;
          case 'open_typography':
            setIsTypographyOpen(true);
            break;
          case 'open_speed_reader':
            setIsSpeedReaderOpen(true);
            break;
          case 'toggle_view':
            setSettings((s) => ({ ...s, viewMode: s.viewMode === '3d' ? '2d' : '3d' }));
            break;
          case 'toggle_speech':
            handleToggleSpeech();
            break;
          default:
            break;
        }
      });
    })();

    return () => {
      unlisten?.();
    };
  }, [handleOpenNative, handleExportHtml, handleToggleSpeech]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* Active Reader View: 3D WebGL vs. 2D E-Reader */}
      {settings.viewMode === '3d' ? (
        <Book3DScene
          metadata={book.metadata}
          pages={book.pages}
          currentSpreadIndex={currentSpreadIndex}
          onTurnPage={handleTurnPage}
          atmosphere={settings.atmosphere}
          cameraMode={settings.cameraMode}
          soundEnabled={settings.soundEnabled}
          bionicReading={settings.bionicReading}
          fontFamily={settings.fontFamily}
          fontSize={settings.fontSize}
          lineHeight={settings.lineHeight}
          paperTonePreset={settings.paperTonePreset}
          readingZoom={settings.readingZoom}
        />
      ) : (
        <Book2DView
          metadata={book.metadata}
          pages={book.pages}
          currentSpreadIndex={currentSpreadIndex}
          onTurnPage={handleTurnPage}
          onPageSelect={handleSelectPage}
          atmosphere={settings.atmosphere}
          fontFamily={settings.fontFamily}
          fontSize={settings.fontSize}
          lineHeight={settings.lineHeight}
          paperTonePreset={settings.paperTonePreset}
          bionicReading={settings.bionicReading}
          twoPageSpread={settings.twoPageSpread2D}
          onToggleTwoPageSpread={() =>
            setSettings((s) => ({ ...s, twoPageSpread2D: !s.twoPageSpread2D }))
          }
          readingZoom={settings.readingZoom}
          soundEnabled={settings.soundEnabled}
          onSwitchTo3D={() => setSettings((s) => ({ ...s, viewMode: '3d' }))}
          highlights={activeHighlights}
          onAddHighlight={handleAddHighlight}
          searchHighlightTerm={searchHighlightTerm}
          onClearSearchHighlight={() => setSearchHighlightTerm('')}
        />
      )}

      {/* Reader HUD Overlays */}
      <ReaderHUD
        metadata={book.metadata}
        currentSpreadIndex={currentSpreadIndex}
        totalPages={book.pages.length}
        onPageSelect={handleSelectPage}
        viewMode={settings.viewMode}
        onViewModeChange={(mode) => setSettings((s) => ({ ...s, viewMode: mode }))}
        cameraMode={settings.cameraMode}
        onCameraModeChange={(mode) => setSettings((s) => ({ ...s, cameraMode: mode }))}
        atmosphere={settings.atmosphere}
        isochronic={settings.isochronic}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenTOC={() => setIsTOCOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTypography={() => setIsTypographyOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenSpeedReader={() => setIsSpeedReaderOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        bionicReading={settings.bionicReading}
        onToggleBionic={() => setSettings((s) => ({ ...s, bionicReading: !s.bionicReading }))}
        onUploadEpub={handleOpenNative}
        onExportHtml={handleExportHtml}
        fontFamily={settings.fontFamily}
        fontSize={settings.fontSize}
        onUpdateSettings={handleUpdateSettings}
        isSpeaking={isSpeaking}
        isSpeakingPaused={isSpeakingPaused}
        onToggleSpeech={handleToggleSpeech}
      />

      {/* Modals */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectSampleBook={handleSelectSampleBook}
        onLoadCustomBook={handleLoadCustomBook}
        activeBookTitle={book.metadata.title}
      />

      <TableOfContentsModal
        isOpen={isTOCOpen}
        onClose={() => setIsTOCOpen(false)}
        chapters={book.chapters}
        pages={book.pages}
        currentSpreadIndex={currentSpreadIndex}
        onSelectPage={handleSelectPage}
        bookTitle={book.metadata.title}
      />

      <TypographySettingsModal
        isOpen={isTypographyOpen}
        onClose={() => setIsTypographyOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSpeedReader={() => setIsSpeedReaderOpen(true)}
      />

      <SpeedReaderModal
        isOpen={isSpeedReaderOpen}
        onClose={() => setIsSpeedReaderOpen(false)}
        book={book}
        currentSpreadIndex={currentSpreadIndex}
        onSyncSpread={handleSelectPage}
      />

      <AtmosphereSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onExportHtml={handleExportHtml}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={activeBookmarks}
        highlights={activeHighlights}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onDeleteHighlight={handleDeleteHighlight}
        onJumpToBookmark={handleSelectPage}
        currentSpreadIndex={currentSpreadIndex}
        currentPage={book.pages[currentSpreadIndex] || null}
        bookTitle={book.metadata.title}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        book={book}
        currentSpreadIndex={currentSpreadIndex}
        onSelectPage={handleSelectPage}
        onHighlightTerm={(term) => setSearchHighlightTerm(term)}
      />
    </div>
  );
}
