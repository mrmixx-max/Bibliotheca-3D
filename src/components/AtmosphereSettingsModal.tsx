import React from 'react';
import { AtmosphereTheme, IsochronicConfig, IsochronicPreset, ReadingSettings } from '../types/epub';

interface AtmosphereSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReadingSettings;
  onUpdateSettings: (partial: Partial<ReadingSettings>) => void;
  onExportHtml: () => void;
}

export const AtmosphereSettingsModal: React.FC<AtmosphereSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportHtml
}) => {
  if (!isOpen) return null;

  const themes: { id: AtmosphereTheme; title: string; subtitle: string; color: string }[] = [
    {
      id: 'candlelight',
      title: 'Kerzenschein & Mahagoni',
      subtitle: 'Warmes, flackerndes Kerzenlicht auf poliertem Edelholz',
      color: '#f59e0b'
    },
    {
      id: 'midnight',
      title: 'Mitternachtsstille',
      subtitle: 'Dunkler Schreibtisch mit kühlem Mondlicht & Sternenglanz',
      color: '#60a5fa'
    },
    {
      id: 'banker',
      title: 'Klassischer Lesesaal',
      subtitle: 'Historische Messing-Bankierslampe mit grünem Schirmglanz',
      color: '#34d399'
    },
    {
      id: 'daylight',
      title: 'Tageslicht Atelier',
      subtitle: 'Helles, augenschonendes Nordlicht im minimalistischen Studio',
      color: '#f3f4f6'
    }
  ];

  const isochronicPresets: {
    id: IsochronicPreset;
    freq: number;
    title: string;
    description: string;
    tag: string;
  }[] = [
    {
      id: '15.4hz_beta',
      freq: 15.4,
      title: '15.4 Hz · Beta / SMR',
      description: 'Aktiver Lesefokus, Lesegeschwindigkeit & kognitive Schärfe',
      tag: 'Lesefokus'
    },
    {
      id: '10hz_alpha',
      freq: 10.0,
      title: '10.0 Hz · Alpha Flow',
      description: 'Entspannte wache Aufmerksamkeit, bildhaftes Eintauchen',
      tag: 'Flow'
    },
    {
      id: '40hz_gamma',
      freq: 40.0,
      title: '40.0 Hz · Gamma Peak',
      description: 'Höchste Informationsverarbeitung, Gedächtnis & neuronale Kohärenz',
      tag: 'Hyperfokus'
    },
    {
      id: '7.83hz_schumann',
      freq: 7.83,
      title: '7.83 Hz · Schumann-Resonanz',
      description: 'Natürliche elektromagnetische Erdfrequenz für kreative Ruhe',
      tag: 'Erdung'
    },
    {
      id: '4hz_delta',
      freq: 4.0,
      title: '4.0 Hz · Delta Calm',
      description: 'Beruhigende Frequenz für entspanntes abendliches Schmökern',
      tag: 'Schlaf'
    }
  ];

  const carrierPitches = [
    { freq: 216, label: '216 Hz (Bariton warm)' },
    { freq: 432, label: '432 Hz (Naturton A)' },
    { freq: 528, label: '528 Hz (Solfeggio)' },
    { freq: 136.1, label: '136.1 Hz (OM / Erde)' }
  ];

  const handleSelectIsochronicPreset = (preset: typeof isochronicPresets[0]) => {
    onUpdateSettings({
      isochronic: {
        ...settings.isochronic,
        enabled: true,
        preset: preset.id,
        frequency: preset.freq
      }
    });
  };

  const handleToggleIsochronic = () => {
    onUpdateSettings({
      isochronic: {
        ...settings.isochronic,
        enabled: !settings.isochronic.enabled
      }
    });
  };

  const handleFrequencyChange = (freq: number) => {
    onUpdateSettings({
      isochronic: {
        ...settings.isochronic,
        frequency: freq,
        preset: 'custom'
      }
    });
  };

  const handleCarrierChange = (carrierFreq: number) => {
    onUpdateSettings({
      isochronic: {
        ...settings.isochronic,
        carrierFrequency: carrierFreq
      }
    });
  };

  const handleIsoVolumeChange = (vol: number) => {
    onUpdateSettings({
      isochronic: {
        ...settings.isochronic,
        volume: vol
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[88vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div>
            <h2 className="text-base font-semibold text-stone-100 font-serif">Atmosphäre & Frequenzen</h2>
            <p className="text-xs text-stone-400 mt-0.5">3D-Lichtstimmung, Raumakustik und isochrone Töne</p>
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
          {/* Lighting Themes */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Licht- & Raumstimmung
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ atmosphere: t.id })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.atmosphere === t.id
                      ? 'border-amber-400 bg-amber-400/10 shadow-sm'
                      : 'border-stone-800 bg-stone-950/40 hover:bg-stone-800/60 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <div className="font-serif font-medium text-xs text-stone-200">
                      {t.title}
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-400 leading-snug">
                    {t.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Isochronic Brainwave Entrainment Section */}
          <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-semibold text-xs text-amber-200 uppercase tracking-wider">
                    Isochrone Töne (Brainwave Entrainment)
                  </span>
                  {settings.isochronic.enabled && (
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-amber-400"
                      style={{
                        animation: `pulse ${Math.max(0.04, 1 / settings.isochronic.frequency)}s infinite ease-in-out`
                      }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Rhythmische Schallimpulse zur gezielten Synchronisation der Gehirnwellen beim Lesen
                </p>
              </div>

              {/* Master Toggle */}
              <button
                onClick={handleToggleIsochronic}
                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  settings.isochronic.enabled
                    ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                    : 'border-stone-800 bg-stone-900 text-stone-500 hover:text-stone-300'
                }`}
              >
                {settings.isochronic.enabled ? 'Aktiv' : 'Inaktiv'}
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {isochronicPresets.map(preset => {
                const isSelected =
                  settings.isochronic.enabled &&
                  settings.isochronic.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectIsochronicPreset(preset)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/15 shadow-sm'
                        : 'border-stone-800/80 bg-stone-900/60 hover:bg-stone-800/50 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-medium text-xs text-stone-200 tabular-nums">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-amber-300/80 font-sans">
                        {preset.tag}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 leading-snug">
                      {preset.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Frequency fine slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Puls-Frequenz stufenlos:</span>
                <span className="font-mono tabular-nums text-amber-300 font-semibold">
                  {settings.isochronic.frequency.toFixed(1)} Hz
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="50.0"
                step="0.1"
                value={settings.isochronic.frequency}
                onChange={(e) => handleFrequencyChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-300"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>1 Hz (Delta)</span>
                <span>10 Hz (Alpha)</span>
                <span>15.4 Hz (Beta/SMR)</span>
                <span>40 Hz (Gamma)</span>
                <span>50 Hz</span>
              </div>
            </div>

            {/* Carrier Frequency & Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-800/80">
              <div className="space-y-1">
                <label className="text-xs text-stone-400 block">
                  Träger-Grundton:
                </label>
                <select
                  value={settings.isochronic.carrierFrequency}
                  onChange={(e) => handleCarrierChange(parseFloat(e.target.value))}
                  className="w-full py-1.5 px-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                >
                  {carrierPitches.map(c => (
                    <option key={c.freq} value={c.freq}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Lautstärke:</span>
                  <span className="font-mono tabular-nums text-stone-300">
                    {Math.round(settings.isochronic.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.isochronic.volume}
                  onChange={(e) => handleIsoVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 mt-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-300"
                />
              </div>
            </div>
          </div>

          {/* Ambient Sound Synthesizer */}
          <div>
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Natürliche Hintergrundgeräusche
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'Aus' },
                { id: 'fireplace', label: 'Kaminfeuer' },
                { id: 'rain', label: 'Regen' },
                { id: 'library', label: 'Lesesaal' }
              ].map(sound => (
                <button
                  key={sound.id}
                  onClick={() =>
                    onUpdateSettings({
                      ambientSound: sound.id as ReadingSettings['ambientSound'],
                      soundEnabled: sound.id !== 'none' || settings.isochronic.enabled
                    })
                  }
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                    settings.ambientSound === sound.id
                      ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                      : 'border-stone-800 bg-stone-950/40 text-stone-300 hover:bg-stone-800/60'
                  }`}
                >
                  {sound.label}
                </button>
              ))}
            </div>

            {settings.ambientSound !== 'none' && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-stone-400 shrink-0">Hintergrund-Lautstärke:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.ambientVolume}
                  onChange={(e) => onUpdateSettings({ ambientVolume: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-300"
                />
              </div>
            )}
          </div>

          {/* Standalone Single File HTML Export Banner */}
          <div className="pt-2 border-t border-stone-800">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-semibold text-xs text-amber-200">
                  Reines HTML / 1-File Export
                </span>
                <span className="text-[10px] text-amber-300/80 font-mono">
                  100% Offline-fähig
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Exportiert diesen kompletten 3D-Reader mitsamt dem geladenen Buch und integriertem
                Sound-Synthesizer in eine einzige eigenständige HTML-Datei.
              </p>
              <button
                onClick={() => {
                  onExportHtml();
                  onClose();
                }}
                className="mt-1 w-full py-2 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Jetzt als 1-File HTML herunterladen</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
