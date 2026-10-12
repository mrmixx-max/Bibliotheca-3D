/**
 * Web Speech API text-to-speech reader for Bibliotheca 3D
 */

class SpeechReader {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private listeners: Set<(speaking: boolean, paused: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public subscribe(callback: (speaking: boolean, paused: boolean) => void) {
    this.listeners.add(callback);
    callback(this.isSpeaking, this.isPaused);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isSpeaking, this.isPaused));
  }

  public speak(text: string, onEnd?: () => void, rate = 1.0, lang = 'de-DE') {
    if (!this.synth) return;

    this.stop();

    // Clean HTML tags and excessive whitespace
    const cleanText = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.lang = lang;

    // Prefer a voice matching the book's language, falling back to any voice
    // whose language tag starts with the same primary subtag (de-DE -> de).
    const voices = this.synth.getVoices();
    const primary = lang.split('-')[0].toLowerCase();
    const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
    const sameLanguage = voices.find((v) => v.lang.toLowerCase().startsWith(primary));
    const chosen = exact || sameLanguage;
    if (chosen) {
      utterance.voice = chosen;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.notify();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notify();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notify();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  public resume() {
    if (this.synth && this.isSpeaking && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.notify();
    }
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notify();
    }
  }

  public toggle(text: string, onEnd?: () => void, rate = 1.0, lang = 'de-DE') {
    if (this.isSpeaking && !this.isPaused) {
      this.pause();
    } else if (this.isSpeaking && this.isPaused) {
      this.resume();
    } else {
      this.speak(text, onEnd, rate, lang);
    }
  }

  public getState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      supported: Boolean(this.synth)
    };
  }
}

export const speechReader = new SpeechReader();
