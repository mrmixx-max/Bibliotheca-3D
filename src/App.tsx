/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Bookmark, ParsedBook, ReadingSettings } from './types/epub';
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
import { exportStandaloneHtmlFile } from './utils/singleFileExporter';
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

export default function App() {
  // Current active parsed book
  const [book, setBook] = useState<ParsedBook>(() => getParsedSampleBook('der-kleine-prinz'));

  // Reading spread index (even number: 0, 2, 4...)
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);

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
      const savedPage = localStorage.getItem(`bibliotheca_progress_${book.metadata.title}`);
      if (savedPage !== null) {
        const parsedIdx = parseInt(savedPage, 10);
        if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < book.pages.length) {
          setCurrentSpreadIndex(parsedIdx % 2 === 0 ? parsedIdx : parsedIdx - 1);
        }
      } else {
        setCurrentSpreadIndex(0);
      }
    } catch {
      setCurrentSpreadIndex(0);
    }
  }, [book.metadata.title, book.pages.length]);

  // Persist current page for active book
  useEffect(() => {
    try {
      localStorage.setItem(`bibliotheca_progress_${book.metadata.title}`, String(currentSpreadIndex));
    } catch {
      // ignore
    }
  }, [book.metadata.title, currentSpreadIndex]);

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

  const handleAddBookmark = (pageIndex: number, note?: string) => {
    const page = book.pages[pageIndex] || book.pages[0];
    const excerpt = page
      ? page.htmlContent.replace(/<[^>]+>/g, '').trim().slice(0, 140) + '...'
      : 'Seite ' + (pageIndex + 1);

    const newBm: Bookmark = {
      id: 'bm_' + Date.now(),
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

  const handleExportHtml = () => {
    exportStandaloneHtmlFile(book);
  };

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
        bionicReading={settings.bionicReading}
        onToggleBionic={() => setSettings((s) => ({ ...s, bionicReading: !s.bionicReading }))}
        onUploadEpub={() => setIsLibraryOpen(true)}
        onExportHtml={handleExportHtml}
        fontFamily={settings.fontFamily}
        fontSize={settings.fontSize}
        onUpdateSettings={handleUpdateSettings}
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
        bookmarks={bookmarks}
        onAddBookmark={handleAddBookmark}
        onDeleteBookmark={handleDeleteBookmark}
        onJumpToBookmark={handleSelectPage}
        currentSpreadIndex={currentSpreadIndex}
        currentPage={book.pages[currentSpreadIndex] || null}
      />
    </div>
  );
}
