export interface Story {
  id: string;
  title: string;
  prophet: string;
  summary: string;
}

// ============================================
// Quran Data Types
// ============================================

export interface WordBreakdown {
  arabic: string;
  transliteration: string;
  translation: string;
  rootWord?: string;
  position: number;
}

export interface Verse {
  number: number;           // Global verse number (1-6236)
  numberInSurah: number;    // Verse number within surah
  arabic: string;           // Arabic text
  translation?: string;     // Translated text
  transliteration?: string; // Romanized pronunciation
  audioUrl?: string;        // Audio recitation URL
  wordByWord?: WordBreakdown[];
  juz: number;              // Juz number (1-30)
  page: number;             // Mushaf page number
}

export interface Surah {
  number: number;
  name: string;             // Arabic name
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
  verses: Verse[];
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
}

export interface Translation {
  identifier: string;       // e.g., 'en.sahih'
  language: string;
  name: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
}

export interface Reciter {
  identifier: string;       // e.g., 'ar.alafasy'
  name: string;
  englishName: string;
  format: string;
  bitrate: string;
}

// ============================================
// User Progress & Gamification Types
// ============================================

export interface ReadingProgress {
  userId: string;
  surahNumber: number;
  lastVerse: number;
  completed: boolean;
  updatedAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  surahNumber: number;
  verseNumber: number;
  note?: string;
  createdAt: Date;
}

export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalDays: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'reading' | 'streak' | 'memorization' | 'engagement';
  requirement: number;
  xpReward: number;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  preferredTranslation: string;
  preferredReciter: string;
  xp: number;
  level: number;
  createdAt: Date;
}

export interface MemorizationProgress {
  userId: string;
  surahNumber: number;
  verseNumber: number;
  status: 'learning' | 'memorized' | 'reviewing';
  accuracyHistory: number[];
  updatedAt: Date;
}

// ============================================
// Search Types
// ============================================

export interface SearchResult {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  arabic: string;
  translation: string;
  matchScore: number;
}

export interface VoiceSearchResult extends SearchResult {
  confidence: number;
}

// ============================================
// Recitation Check Types
// ============================================

export interface RecitationWord {
  word: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  feedback?: string;
}

export interface RecitationResult {
  accuracy: number;
  words: RecitationWord[];
  overallFeedback: string;
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  groundingSources?: {
    title: string;
    url: string;
  }[];
  mapLocations?: {
    title: string;
    uri: string;
  }[];
}

export interface VisualConfig {
  aspectRatio: "1:1" | "16:9" | "9:16";
  resolution: "1K" | "2K" | "4K";
}

// Global type for AI Studio Key Selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

// This export makes this file a module
export {};