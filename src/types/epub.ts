/**
 * Core types for Bibliotheca 3D EPUB Reader
 */

export interface Chapter {
  id: string;
  title: string;
  content: string; // Plain/formatted HTML content
  order: number;
}

export interface BookMetadata {
  title: string;
  author: string;
  language: string;
  description?: string;
  coverColor?: string;
  coverTexture?: 'leather-dark' | 'leather-burgundy' | 'leather-navy' | 'leather-forest' | 'linen-cream';
  coverTitle?: string;
  coverSubtitle?: string;
}

export interface RenderedPage {
  pageNumber: number;
  totalPages: number;
  chapterTitle: string;
  chapterIndex: number;
  bookTitle: string;
  htmlContent: string;
  isCover?: boolean;
  isBackCover?: boolean;
  isChapterStart?: boolean;
}

export interface ParsedBook {
  metadata: BookMetadata;
  chapters: Chapter[];
  pages: RenderedPage[]; // Paired into spreads: [Left page, Right page]
}

export interface Bookmark {
  id: string;
  /** Scopes the bookmark to its book; without it entries leak across titles. */
  bookId: string;
  pageIndex: number;
  chapterTitle: string;
  excerpt: string;
  timestamp: number;
  note?: string;
}

export type AtmosphereTheme = 'candlelight' | 'midnight' | 'banker' | 'daylight';

export interface AtmosphereConfig {
  id: AtmosphereTheme;
  name: string;
  subname: string;
  tableColor: string;
  tableRoughness: number;
  ambientLightColor: string;
  ambientIntensity: number;
  keyLightColor: string;
  keyLightIntensity: number;
  pointLightColor: string;
  pointLightIntensity: number;
  paperTone: string;
  textColor: string;
  sceneBackground: string;
}

export type FontFamily = 'cormorant' | 'source-serif' | 'lora' | 'literata' | 'sans' | 'mono';

export type AmbientSoundType = 'none' | 'fireplace' | 'rain' | 'library';

export type IsochronicPreset = 'none' | '10hz_alpha' | '15.4hz_beta' | '40hz_gamma' | '7.83hz_schumann' | '4hz_delta' | 'custom';

export interface IsochronicConfig {
  enabled: boolean;
  preset: IsochronicPreset;
  frequency: number; // in Hz, e.g. 15.4, 10.0, 40.0
  carrierFrequency: number; // in Hz, e.g. 216, 432, 528, 136.1
  volume: number; // 0..1
  depth: number; // modulation depth 0..1 (default ~0.85)
}

export type PaperTonePreset = 'creme' | 'white' | 'sepia' | 'dark';

/** Decorative backdrop behind the book — the "room" the reader sits in. */
export type BackgroundTexture =
  | 'none'
  | 'parchment'
  | 'old-paper'
  | 'leather'
  | 'linen'
  | 'marble'
  | 'dark-wood';

export type SpeedReaderState = {
  isOpen: boolean;
  isPlaying: boolean;
  wpm: number; // Words per minute (150 - 1000)
  currentWordIndex: number;
  highlightORP: boolean; // Optimal Recognition Point
}

export type ViewMode = '3d' | '2d';

export interface ReadingSettings {
  viewMode: ViewMode;
  twoPageSpread2D: boolean;
  /** Fit page content to the viewport (no scrolling, like a Kindle Paperwhite). */
  fitToPage: boolean;
  fontFamily: FontFamily;
  fontSize: number; // in pt/px (18..36)
  lineHeight: number; // in px (32..54)
  bionicReading: boolean; // Bionic reading bold anchors
  paperTonePreset: PaperTonePreset;
  readingZoom: number; // 0.8..1.35
  atmosphere: AtmosphereTheme;
  cameraMode: 'reader' | 'perspective' | 'orbit';
  soundEnabled: boolean;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  isochronic: IsochronicConfig;
  /** Decorative backdrop texture behind the book. */
  backgroundTexture: BackgroundTexture;
  /** Custom text colour; empty string = derive from the paper tone. */
  customTextColor: string;
}

export type HighlightColor = 'amber' | 'emerald' | 'rose' | 'sky';

export interface TextHighlight {
  id: string;
  /** Scopes the highlight to its book; without it entries leak across titles. */
  bookId: string;
  pageIndex: number;
  text: string;
  color: HighlightColor;
  note?: string;
  timestamp: number;
  chapterTitle?: string;
}

export interface SearchResultItem {
  pageIndex: number;
  chapterIndex: number;
  chapterTitle: string;
  pageNumber: number;
  matchSnippet: string;
  exactTerm: string;
}
