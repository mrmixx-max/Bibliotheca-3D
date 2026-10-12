import React, { useEffect } from 'react';
import { AtmosphereTheme, BookMetadata, FontFamily, IsochronicConfig, ReadingSettings, ViewMode } from '../types/epub';

interface ReaderHUDProps {
  metadata: BookMetadata;
  currentSpreadIndex: number;
  totalPages: number;
  onPageSelect: (pageIndex: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  cameraMode: 'reader' | 'perspective' | 'orbit';
  onCameraModeChange: (mode: 'reader' | 'perspective' | 'orbit') => void;
  atmosphere: AtmosphereTheme;
  isochronic: IsochronicConfig;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenLibrary: () => void;
  onOpenTOC: () => void;
  onOpenSettings: () => void;
  onOpenTypography: () => void;
  onOpenBookmarks: () => void;
  onOpenSpeedReader: () => void;
  onOpenSearch: () => void;
  bionicReading: boolean;
  onToggleBionic: () => void;
  onUploadEpub: () => void;
  onExportHtml: () => void;
  fontFamily: FontFamily;
  fontSize: number;
  onUpdateSettings: (partial: Partial<ReadingSettings>) => void;
  isSpeaking?: boolean;
  isSpeakingPaused?: boolean;
  onToggleSpeech?: () => void;
}

export const ReaderHUD: React.FC<ReaderHUDProps> = ({
  metadata,
  currentSpreadIndex,
  totalPages,
  onPageSelect,
  viewMode,
  onViewModeChange,
  cameraMode,
  onCameraModeChange,
  atmosphere,
  isochronic,
  soundEnabled,
  onToggleSound,
  onOpenLibrary,
  onOpenTOC,
  onOpenSettings,
  onOpenTypography,
  onOpenBookmarks,
  onOpenSpeedReader,
  onOpenSearch,
  bionicReading,
  onToggleBionic,
  onUploadEpub,
  onExportHtml,
  fontFamily,
  fontSize,
  onUpdateSettings,
  isSpeaking = false,
  isSpeakingPaused = false,
  onToggleSpeech
}) => {
  const currentLeftPage = currentSpreadIndex + 1;
  const currentRightPage = Math.min(currentSpreadIndex + 2, totalPages);
  const percentRead = Math.round((currentRightPage / Math.max(totalPages, 1)) * 100);

  // Global keyboard shortcut for search (Cmd+F / Ctrl+F or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onOpenSearch();
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onOpenSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const fontLabels: Record<FontFamily, { label: string; sub: string }> = {
    'source-serif': { label: 'Source Serif 4', sub: 'Moderne Buchschrift' },
    cormorant: { label: 'Cormorant Garamond', sub: 'Klassische Antiqua' },
    lora: { label: 'Lora', sub: 'Atmosphärisch' },
    literata: { label: 'Literata', sub: 'E-Book Meisterschrift' },
    sans: { label: 'Plus Jakarta Sans', sub: 'Klare Serifenlose' },
    mono: { label: 'JetBrains Mono', sub: 'Fokus-Monospace' }
  };

  return (
    <>
      {/* Top Bar: Brand, Navigation & Search */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-6 px-6 py-3.5 bg-stone-950/80 backdrop-blur-md border-b border-stone-800/60 select-none">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-serif font-bold text-lg tracking-wider text-amber-200/90 uppercase whitespace-nowrap">
            Bibliotheca 3D
          </span>
          <span className="text-xs text-stone-500 font-sans hidden sm:inline">
            · {viewMode === '2d' ? '2D E-Reader' : 'Voll-3D EPUB'}
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 text-xs font-medium text-stone-300">
          {/* Dedicated 2D / 3D Mode Switcher Button */}
          <button
            onClick={() => onViewModeChange(viewMode === '3d' ? '2d' : '3d')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === '2d'
                ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md font-bold'
                : 'bg-stone-900/90 text-amber-200/90 border-amber-500/30 hover:bg-stone-800 hover:text-amber-100'
            }`}
            title={viewMode === '3d' ? 'Zu flachem 2D-Lesemodus wechseln' : 'Zurück zum 3D-Buch wechseln'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {viewMode === '3d' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              )}
            </svg>
            <span>{viewMode === '3d' ? '2D Modus' : '3D Modus'}</span>
          </button>

          {/* Volltextsuche (Meilenstein 2) */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/90 hover:bg-stone-800 border border-stone-800 hover:border-amber-400/50 text-stone-200 hover:text-amber-200 transition-colors cursor-pointer group shadow-sm"
            title="Volltextsuche im Buch öffnen (Tastenkürzel: Strg+F oder /)"
          >
            <svg className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="font-semibold">Suche</span>
            <span className="text-[10px] text-stone-500 font-mono bg-stone-950 px-1 rounded border border-stone-800">
              ⌘F
            </span>
          </button>

          {/* Quick Font Family Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900/90 border border-stone-800 text-stone-300 hover:text-amber-200 hover:border-amber-500/40 text-xs transition-colors cursor-pointer"
              title="Schriftart direkt wechseln"
            >
              <span className="text-stone-500 text-[11px]">Schrift:</span>
              <span className="font-semibold text-amber-200">
                {fontLabels[fontFamily]?.label || 'Schrift'}
              </span>
              <svg className="w-3 h-3 text-stone-500 group-hover:text-amber-200 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-1.5 min-w-[200px] z-50">
              {(Object.keys(fontLabels) as FontFamily[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onUpdateSettings({ fontFamily: f })}
                  className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer flex flex-col ${
                    fontFamily === f
                      ? 'bg-amber-400 text-stone-950 font-bold'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-amber-200'
                  }`}
                >
                  <span className="font-medium">{fontLabels[f].label}</span>
                  <span className={`text-[10px] ${fontFamily === f ? 'text-stone-900/80 font-normal' : 'text-stone-500'}`}>
                    {fontLabels[f].sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Font Size Controls */}
          <div className="flex items-center bg-stone-900/90 border border-stone-800 rounded-lg p-0.5" title="Schriftgröße anpassen">
            <button
              onClick={() => onUpdateSettings({ fontSize: Math.max(18, fontSize - 2) })}
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
              title="Schrift kleiner (A-)"
            >
              A-
            </button>
            <button
              onClick={onOpenTypography}
              className="px-2 text-xs font-mono font-semibold text-amber-300 hover:text-amber-100 cursor-pointer"
              title="Typografie-Menü öffnen"
            >
              {fontSize}pt
            </button>
            <button
              onClick={() => onUpdateSettings({ fontSize: Math.min(38, fontSize + 2) })}
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
              title="Schrift größer (A+)"
            >
              A+
            </button>
          </div>

          {/* Vorlesefunktion (TTS Audio) */}
          {onToggleSpeech && (
            <button
              onClick={onToggleSpeech}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isSpeaking
                  ? 'bg-amber-400 text-stone-950 border-amber-300 font-bold shadow-sm'
                  : 'bg-stone-900/90 text-stone-300 border-stone-800 hover:border-amber-400/40 hover:text-amber-200'
              }`}
              title={isSpeaking ? (isSpeakingPaused ? 'Vorlesen fortsetzen' : 'Vorlesen pausieren') : 'Aktuelle Doppelseite vorlesen'}
            >
              <svg className={`w-3.5 h-3.5 ${isSpeaking && !isSpeakingPaused ? 'animate-bounce text-stone-950' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span>{isSpeaking ? (isSpeakingPaused ? 'Fortsetzen' : 'Pause') : 'Vorlesen'}</span>
            </button>
          )}

          <button
            onClick={onOpenBookmarks}
            className="hover:text-amber-200 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
            title="Lesezeichen & Text-Markierungen öffnen"
          >
            <span>Markierungen</span>
          </button>
          <button
            onClick={onOpenSpeedReader}
            className="hover:text-amber-200 text-amber-300/90 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 font-semibold"
            title="RSVP Speed-Reading mit ORP-Fokuspunkt öffnen"
          >
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Speed</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="hover:text-amber-200 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span>Atmosphäre</span>
            {isochronic.enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={onOpenLibrary}
            className="hover:text-amber-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Bibliothek
          </button>
          <button
            onClick={onOpenTOC}
            className="hover:text-amber-200 transition-colors whitespace-nowrap cursor-pointer"
          >
            Inhalt
          </button>
          <button
            onClick={onExportHtml}
            className="hover:text-amber-200 transition-colors whitespace-nowrap text-amber-400/90 cursor-pointer"
            title="Diesen 3D-Reader als reine, eigenständige Single-File-HTML-Datei exportieren"
          >
            Export
          </button>
        </nav>

        {/* Zone 3: Primary CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onUploadEpub}
            className="px-3.5 py-1.5 text-xs font-medium text-stone-900 bg-amber-200 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>EPUB Öffnen</span>
          </button>
        </div>
      </header>

      {/* Floating Bottom HUD */}
      <footer className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-2xl w-[94vw] pointer-events-auto select-none">
        <div className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 bg-stone-950/85 backdrop-blur-md border border-stone-800/80 rounded-2xl shadow-2xl text-xs text-stone-300">
          {/* Metadata & Page count */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-serif italic text-amber-100/90 truncate max-w-[120px] sm:max-w-[180px]">
              {metadata.title}
            </span>
            <span className="text-stone-600 hidden sm:inline">·</span>
            <span className="font-mono tabular-nums text-stone-400 shrink-0">
              S. {currentLeftPage}-{currentRightPage} / {totalPages}
            </span>
            <span className="text-stone-600 hidden md:inline">·</span>
            <span className="font-mono tabular-nums text-amber-400/80 hidden md:inline">
              {percentRead}%
            </span>
          </div>

          {/* Quick Readability, Search & Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              title="Volltextsuche im Buch (Strg+F)"
              className="px-2 py-1 text-[11px] font-medium rounded-md bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-200 hover:border-amber-400/40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Suche</span>
            </button>

            {/* Quick Speech Button */}
            {onToggleSpeech && (
              <button
                onClick={onToggleSpeech}
                title={isSpeaking ? 'Vorlesen anhalten' : 'Vorlesen starten'}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  isSpeaking
                    ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                    : 'bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-200'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="hidden sm:inline">{isSpeaking ? 'Audio' : 'Lesen'}</span>
              </button>
            )}

            {/* Bionic Reading Quick Toggle */}
            <button
              onClick={onToggleBionic}
              title={bionicReading ? 'Bionic Reading deaktivieren' : 'Bionic Reading aktivieren (Wortanker hervorheben)'}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                bionicReading
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              Bionic
            </button>

            {/* Quick Font Size Stepper */}
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-md p-0.5 text-stone-300">
              <button
                onClick={() => onUpdateSettings({ fontSize: Math.max(18, fontSize - 2) })}
                title="Schriftgröße verkleinern (A-)"
                className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded transition-colors cursor-pointer"
              >
                A-
              </button>
              <button
                onClick={onOpenTypography}
                title="Typografie öffnen"
                className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-300 hover:text-amber-100 cursor-pointer"
              >
                {fontSize}pt
              </button>
              <button
                onClick={() => onUpdateSettings({ fontSize: Math.min(38, fontSize + 2) })}
                title="Schriftgröße vergrößern (A+)"
                className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded transition-colors cursor-pointer"
              >
                A+
              </button>
            </div>
          </div>

          {/* Quick 2D / 3D Mode Switcher */}
          <div className="flex items-center p-0.5 bg-stone-900/90 rounded-lg border border-stone-800 shrink-0">
            <button
              onClick={() => onViewModeChange('2d')}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="2D E-Reader Ansicht"
            >
              2D
            </button>
            <button
              onClick={() => {
                onViewModeChange('3d');
                onCameraModeChange('reader');
              }}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === '3d' && cameraMode === 'reader'
                  ? 'bg-amber-200/20 text-amber-200 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="3D Frontale Leseansicht"
            >
              3D
            </button>
            <button
              onClick={() => {
                onViewModeChange('3d');
                onCameraModeChange('orbit');
              }}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer hidden sm:block ${
                viewMode === '3d' && cameraMode === 'orbit'
                  ? 'bg-amber-200/20 text-amber-200 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title="360° Frei drehbarer Orbit"
            >
              Orbit
            </button>
          </div>

          {/* Audio Indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isochronic.enabled && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-amber-400/10 border border-amber-400/30 text-[10px] font-mono text-amber-300 hover:bg-amber-400/20 transition-colors cursor-pointer"
                title="Isochrone Gehirnwellen aktiv"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{isochronic.frequency.toFixed(1)}Hz</span>
              </button>
            )}

            <button
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Ton stummschalten' : 'Ton aktivieren'}
              className={`p-1.5 rounded-lg border border-stone-800 transition-colors cursor-pointer ${
                soundEnabled ? 'text-amber-300 bg-stone-900' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {soundEnabled ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Page Scrubber Range Slider */}
        <div className="w-full px-4 py-1.5 bg-stone-950/60 backdrop-blur-sm rounded-xl border border-stone-800/40 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(totalPages - 2, 0)}
            step={2}
            value={currentSpreadIndex}
            onChange={(e) => onPageSelect(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-300"
          />
        </div>
      </footer>
    </>
  );
};
