/**
 * Procedural Web Audio API sound synthesizers
 * Including page flips, ambient backgrounds, and Isochronic Brainwave Entrainment tones
 * (15.4 Hz Beta/SMR, 10.0 Hz Alpha, 40.0 Hz Gamma, 7.83 Hz Schumann, etc.)
 */

import { IsochronicConfig } from '../types/epub';

let audioCtx: AudioContext | null = null;

// Ambient background nodes
let ambientSourceNode: AudioNode | null = null;
let ambientGainNode: GainNode | null = null;

// Isochronic tone nodes
let isochronicCarrierOsc: OscillatorNode | null = null;
let isochronicHarmonicOsc: OscillatorNode | null = null;
let isochronicLfoOsc: OscillatorNode | null = null;
let isochronicLfoGain: GainNode | null = null;
let isochronicPulseGain: GainNode | null = null;
let isochronicMasterGain: GainNode | null = null;
let isochronicFilter: BiquadFilterNode | null = null;
let isochronicNoiseSource: AudioBufferSourceNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a realistic crisp paper page turn sound
 */
export function playPageTurnSound(volume = 0.6) {
  try {
    const ctx = getAudioContext();
    const duration = 0.35;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(800, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume * 0.45, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(volume * 0.25, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(450, now);

    noise.connect(filter);
    filter.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  } catch (err) {
    console.warn('Audio play failed:', err);
  }
}

/**
 * Starts procedural ambient atmosphere sound (fireplace, rain, library)
 */
export function startAmbientSound(type: 'fireplace' | 'rain' | 'library', volume = 0.25) {
  stopAmbientSound();
  if (type === 'none' as unknown as string) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 1.5);
    masterGain.connect(ctx.destination);
    ambientGainNode = masterGain;

    if (type === 'rain') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      ambientSourceNode = noise;
    } else if (type === 'fireplace') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const r = Math.random();
        if (r > 0.998) {
          data[i] = (Math.random() - 0.5) * 4.0;
        } else {
          data[i] = (Math.random() * 2 - 1) * 0.2;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(0.8, now);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      ambientSourceNode = noise;
    } else if (type === 'library') {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      ambientSourceNode = noise;
    }
  } catch (err) {
    console.warn('Ambient start failed:', err);
  }
}

export function updateAmbientVolume(volume: number) {
  if (ambientGainNode && audioCtx) {
    ambientGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), audioCtx.currentTime);
  }
}

export function stopAmbientSound() {
  if (ambientSourceNode) {
    try {
      (ambientSourceNode as AudioScheduledSourceNode).stop();
      ambientSourceNode.disconnect();
    } catch {
      // ignore
    }
    ambientSourceNode = null;
  }
  if (ambientGainNode) {
    try {
      ambientGainNode.disconnect();
    } catch {
      // ignore
    }
    ambientGainNode = null;
  }
}

/**
 * ============================================================
 * ISOCHRONIC BRAINWAVE ENTRAINMENT SYNTHESIZER
 * ============================================================
 * Rhythmic pulsing tone that synchronizes brainwaves to:
 * - 15.4 Hz (Beta/SMR - Focus, Reading Speed & Cognitive Clarity)
 * - 10.0 Hz (Alpha - Calm Flow & Deep Absorption)
 * - 40.0 Hz (Gamma - Hyperfocus, Memory & High-Order Synthesis)
 * - 7.83 Hz (Schumann Earth Resonance - Dreamy Creativity)
 * - 4.0 Hz (Delta - Meditative Relaxation)
 */
export function startIsochronicTone(config: IsochronicConfig) {
  stopIsochronicTone();
  if (!config.enabled || config.frequency <= 0) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const carrierFreq = config.carrierFrequency || 216;
    const pulseFreq = config.frequency;
    const depth = config.depth ?? 0.88;
    const volume = config.volume ?? 0.3;

    // Master Isochronic Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 1.2);
    masterGain.connect(ctx.destination);
    isochronicMasterGain = masterGain;

    // Pulse Gain Node (where the LFO amplitude modulation happens)
    const pulseGain = ctx.createGain();
    const dcOffset = 1.0 - depth * 0.5;
    pulseGain.gain.setValueAtTime(dcOffset, now);
    isochronicPulseGain = pulseGain;

    // LFO Oscillator to modulate the amplitude at isochronic pulse rate
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(pulseFreq, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(depth * 0.5, now);

    lfo.connect(lfoGain);
    lfoGain.connect(pulseGain.gain);
    lfo.start(now);
    isochronicLfoOsc = lfo;
    isochronicLfoGain = lfoGain;

    // Filter to keep carrier velvety and warm (cut harsh high frequencies)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(carrierFreq * 2.5, now);
    filter.Q.setValueAtTime(1.0, now);
    filter.connect(masterGain);
    pulseGain.connect(filter);
    isochronicFilter = filter;

    // Primary Carrier Tone (warm sine)
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(carrierFreq, now);

    // Subtle Harmonic overtone for organic warmth (octave or fifth)
    const harmonic = ctx.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(carrierFreq * 1.5, now);
    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.12, now);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(pulseGain);

    carrier.connect(pulseGain);

    carrier.start(now);
    harmonic.start(now);
    isochronicCarrierOsc = carrier;
    isochronicHarmonicOsc = harmonic;

    // Subtle warm pink noise cushion bed
    const noiseBufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < noiseBufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.1702428;
      b2 = 0.57000 * b2 + white * 0.5500000;
      noiseData[i] = (b0 + b1 + b2) * 0.04;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(400, now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(masterGain);
    noiseSource.start(now);
    isochronicNoiseSource = noiseSource;

  } catch (err) {
    console.warn('Isochronic start failed:', err);
  }
}

export function updateIsochronicFrequency(pulseFreq: number) {
  if (isochronicLfoOsc && audioCtx) {
    isochronicLfoOsc.frequency.setValueAtTime(Math.max(0.5, Math.min(60, pulseFreq)), audioCtx.currentTime);
  }
}

export function updateIsochronicCarrier(carrierFreq: number) {
  if (isochronicCarrierOsc && audioCtx) {
    const now = audioCtx.currentTime;
    isochronicCarrierOsc.frequency.setValueAtTime(carrierFreq, now);
    if (isochronicHarmonicOsc) {
      isochronicHarmonicOsc.frequency.setValueAtTime(carrierFreq * 1.5, now);
    }
    if (isochronicFilter) {
      isochronicFilter.frequency.setValueAtTime(carrierFreq * 2.5, now);
    }
  }
}

export function updateIsochronicVolume(volume: number) {
  if (isochronicMasterGain && audioCtx) {
    isochronicMasterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), audioCtx.currentTime);
  }
}

export function stopIsochronicTone() {
  if (isochronicLfoOsc) {
    try {
      isochronicLfoOsc.stop();
      isochronicLfoOsc.disconnect();
    } catch {
      // ignore
    }
    isochronicLfoOsc = null;
  }
  if (isochronicCarrierOsc) {
    try {
      isochronicCarrierOsc.stop();
      isochronicCarrierOsc.disconnect();
    } catch {
      // ignore
    }
    isochronicCarrierOsc = null;
  }
  if (isochronicHarmonicOsc) {
    try {
      isochronicHarmonicOsc.stop();
      isochronicHarmonicOsc.disconnect();
    } catch {
      // ignore
    }
    isochronicHarmonicOsc = null;
  }
  if (isochronicNoiseSource) {
    try {
      isochronicNoiseSource.stop();
      isochronicNoiseSource.disconnect();
    } catch {
      // ignore
    }
    isochronicNoiseSource = null;
  }
  if (isochronicMasterGain) {
    try {
      isochronicMasterGain.disconnect();
    } catch {
      // ignore
    }
    isochronicMasterGain = null;
  }
}
