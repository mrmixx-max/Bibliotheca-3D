import React from 'react';
import { BackgroundTexture, FontFamily, PaperTonePreset, ReadingSettings } from '../types/epub';

interface TypographySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReadingSettings;
  onUpdateSettings: (partial: Partial<ReadingSettings>) => void;
  onOpenSpeedReader: () => void;
}

export const TypographySettingsModal: React.FC<TypographySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenSpeedReader
}) => {
  if (!isOpen) return null;

  const fontOptions: { id: FontFamily; label: string; preview: string; styleName: string }[] = [
    { id: 'cormorant', label: 'Cormorant Garamond', preview: 'Klassische Antiqua (Elegant)', styleName: '"Cormorant Garamond", serif' },
    { id: 'source-serif', label: 'Source Serif 4', preview: 'Moderne Buchschrift (Leserlich)', styleName: '"Source Serif 4", serif' },
    { id: 'lora', label: 'Lora', preview: 'Zeitgenössische Serif (Atmosphärisch)', styleName: '"Lora", serif' },
    { id: 'literata', label: 'Literata', preview: 'E-Book Meisterschrift (Exzellenter Kontrast)', styleName: '"Literata", serif' },
    { id: 'sans', label: 'Plus Jakarta Sans', preview: 'Klare Serifenlose (Modern)', styleName: '"Plus Jakarta Sans", sans-serif' },
    { id: 'mono', label: 'JetBrains Mono', preview: 'Fokus-Monospace (Dyslexie-Freundlich)', styleName: '"JetBrains Mono", monospace' }
  ];

  const paperTones: { id: PaperTonePreset; label: string; bg: string; text: string }[] = [
    { id: 'creme', label: 'Creme-Papier', bg: '#fbf7ee', text: '#1c1611' },
    { id: 'white', label: 'Reinweiß', bg: '#ffffff', text: '#111111' },
    { id: 'sepia', label: 'Antik Sepia', bg: '#f4ecd8', text: '#2b1f14' },
    { id: 'dark', label: 'Obsidian Nacht', bg: '#1c1a18', text: '#e6ded1' }
  ];

  // Decorative backdrop motifs. `swatch` is a CSS gradient that previews the
  // look; the real texture is generated procedurally at render time.
  const backgroundOptions: { id: BackgroundTexture; label: string; swatch: string }[] = [
    { id: 'none', label: 'Keine', swatch: 'linear-gradient(135deg,#1c1917,#292524)' },
    { id: 'parchment', label: 'Pergament', swatch: 'linear-gradient(135deg,#f3e2bd,#c9a970)' },
    { id: 'old-paper', label: 'Altes Papier', swatch: 'linear-gradient(135deg,#e6dfcf,#bdb3a0)' },
    { id: 'leather', label: 'Leder', swatch: 'linear-gradient(135deg,#5a3327,#2a1510)' },
    { id: 'linen', label: 'Leinen', swatch: 'linear-gradient(135deg,#6b6350,#3a352a)' },
    { id: 'marble', label: 'Marmor', swatch: 'linear-gradient(135deg,#f2f0eb,#b9b6ae)' },
    { id: 'dark-wood', label: 'Dunkles Holz', swatch: 'linear-gradient(135deg,#3d2519,#150c07)' }
  ];

  const textColors: { value: string; label: string }[] = [
    { value: '', label: 'Automatisch' },
    { value: '#1c1611', label: 'Tinte' },
    { value: '#3a2c1e', label: 'Sepia' },
    { value: '#5c2f1a', label: 'Ziegel' },
    { value: '#1e3a5f', label: 'Nachtblau' },
    { value: '#1f3d2b', label: 'Waldgrün' },
    { value: '#5a1f3d', label: 'Bordeaux' },
    { value: '#4a4238', label: 'Graubraun' },
    { value: '#e6ded1', label: 'Creme (hell)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg max-h-[85vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-100 font-serif">Lesbarkeit & Typografie</h2>
            <p className="text-xs text-stone-400 mt-0.5">Schrift, Kontrast, Bionic Reading & Speed-Reading</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 3D vs 2D Reader Mode Switcher */}
          <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-serif font-semibold text-xs text-stone-200">
                  Ansichtsmodus
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Wähle zwischen fotorealistischem 3D-Buch und flachem 2D-E-Reader
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ viewMode: '3d' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  settings.viewMode === '3d'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/30'
                    : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Voll-3D Buch</span>
                  <span className="text-[10px] font-mono opacity-80">WebGL</span>
                </div>
                <p className="text-[10px] opacity-75 mt-1 leading-relaxed">
                  Realistischer Ledereinband, Seitenkrümmung, Schatten & 360° Orbit
                </p>
              </button>

              <button
                onClick={() => onUpdateSettings({ viewMode: '2d' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  settings.viewMode === '2d'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/30'
                    : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">2D E-Reader</span>
                  <span className="text-[10px] font-mono opacity-80">Flach</span>
                </div>
                <p className="text-[10px] opacity-75 mt-1 leading-relaxed">
                  Kristallklare Schriftdarstellung, ressourcenschonend & ablenkungsfrei
                </p>
              </button>
            </div>

            {settings.viewMode === '2d' && (
              <div className="mt-3 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <span className="text-xs text-stone-300">2D Seitenlayout</span>
                <div className="flex items-center p-0.5 bg-stone-900 rounded-lg border border-stone-800">
                  <button
                    onClick={() => onUpdateSettings({ twoPageSpread2D: true })}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      settings.twoPageSpread2D
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Doppelseite
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ twoPageSpread2D: false })}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      !settings.twoPageSpread2D
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Einzelseite
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Bionic Reading Hero Banner */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif font-bold text-xs text-amber-200">
                  Bionic Reading (Blickanker)
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  Wissenschaftlicher Fokus
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Hebt die <strong>ers</strong>ten <strong>Buch</strong>staben <strong>je</strong>des <strong>Wor</strong>tes <strong>her</strong>vor.
                Das Gehirn vervollständigt Wörter schneller und die Lesegeschwindigkeit steigt spürbar.
              </p>
            </div>

            <button
              onClick={() => onUpdateSettings({ bionicReading: !settings.bionicReading })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                settings.bionicReading
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {settings.bionicReading ? 'Aktiv' : 'Einschalten'}
            </button>
          </div>

          {/* Quick Launch Speed-Reading RSVP */}
          <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/50 flex items-center justify-between gap-4">
            <div>
              <div className="font-serif font-semibold text-xs text-stone-200">
                RSVP Speed-Reader Modus
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Wörter rasend schnell im festen Blickfeld lesen (150 - 900+ WPM)
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenSpeedReader();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-medium border border-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Öffnen</span>
            </button>
          </div>

          {/* Paper Tone & Contrast */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              Papier-Tönung & Kontrast
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paperTones.map(tone => (
                <button
                  key={tone.id}
                  onClick={() => onUpdateSettings({ paperTonePreset: tone.id })}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    settings.paperTonePreset === tone.id
                      ? 'border-amber-400 shadow-md ring-1 ring-amber-400/40'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                  style={{ backgroundColor: tone.bg, color: tone.text }}
                >
                  <div className="font-serif font-semibold text-xs truncate">
                    {tone.label}
                  </div>
                  <div className="text-[10px] opacity-75 font-serif mt-0.5">
                    Aa Bb Cc
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Background Texture */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              Hintergrund-Motiv
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {backgroundOptions.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => onUpdateSettings({ backgroundTexture: bg.id })}
                  className={`rounded-xl border overflow-hidden transition-all cursor-pointer ${
                    settings.backgroundTexture === bg.id
                      ? 'border-amber-400 ring-1 ring-amber-400/40 shadow-md'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="h-10 w-full" style={{ backgroundImage: bg.swatch }} />
                  <div className="text-[11px] text-stone-300 py-1.5 px-1 truncate bg-stone-900">
                    {bg.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Text Colour */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              Schriftfarbe
            </div>
            <div className="flex flex-wrap gap-2">
              {textColors.map(tc => {
                const isActive = (settings.customTextColor || '') === tc.value;
                return (
                  <button
                    key={tc.label}
                    onClick={() => onUpdateSettings({ customTextColor: tc.value })}
                    title={tc.label}
                    className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                      isActive
                        ? 'border-amber-400 bg-amber-400/10 text-amber-100'
                        : 'border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-800/50'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                      style={{
                        backgroundColor: tc.value || '#9ca3af',
                        backgroundImage: tc.value
                          ? undefined
                          : 'linear-gradient(135deg,#1c1611 50%,#e6ded1 50%)'
                      }}
                    />
                    {tc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2.5">
              Schriftart
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fontOptions.map(font => (
                <button
                  key={font.id}
                  onClick={() => onUpdateSettings({ fontFamily: font.id })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.fontFamily === font.id
                      ? 'border-amber-400 bg-amber-400/10 shadow-sm'
                      : 'border-stone-800 bg-stone-950/40 hover:bg-stone-800/60'
                  }`}
                >
                  <div className="text-xs font-medium text-stone-200">
                    {font.label}
                  </div>
                  <div className="text-[11px] text-stone-400 italic mt-0.5">
                    {font.preview}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Line Height Sliders */}
          <div className="space-y-4 pt-2 border-t border-stone-800/80">
            {/* Font size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Schriftgröße:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateSettings({ fontSize: Math.max(18, settings.fontSize - 2) })}
                    className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                    title="Schrift verkleinern"
                  >
                    A-
                  </button>
                  <span className="font-mono tabular-nums text-amber-300 font-bold min-w-[50px] text-center">
                    {settings.fontSize} pt
                  </span>
                  <button
                    onClick={() => onUpdateSettings({ fontSize: Math.min(38, settings.fontSize + 2) })}
                    className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                    title="Schrift vergrößern"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-5 gap-1.5">
                {[20, 24, 28, 32, 36].map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateSettings({ fontSize: size })}
                    className={`py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                      settings.fontSize === size
                        ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    {size} pt
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="18"
                max="38"
                step="1"
                value={settings.fontSize}
                onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-300 mt-1"
              />
            </div>

            {/* Line height */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Zeilenabstand:</span>
                <span className="font-mono tabular-nums text-amber-300 font-semibold">
                  {settings.lineHeight} px
                </span>
              </div>
              <input
                type="range"
                min="34"
                max="56"
                step="2"
                value={settings.lineHeight}
                onChange={(e) => onUpdateSettings({ lineHeight: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-300"
              />
            </div>

            {/* Reading Zoom / Camera Distance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Buch-Zoom (Leseabstand):</span>
                <span className="font-mono tabular-nums text-amber-300 font-semibold">
                  {Math.round(settings.readingZoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.4"
                step="0.05"
                value={settings.readingZoom}
                onChange={(e) => onUpdateSettings({ readingZoom: parseFloat(e.target.value) })}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-300"
              />
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>Übersicht (85%)</span>
                <span>Standard (100%)</span>
                <span>Nahfokus (140%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
