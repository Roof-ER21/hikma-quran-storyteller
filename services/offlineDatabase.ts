import Dexie, { Table } from 'dexie';
import { Surah, Verse, SurahMeta } from '../types';

// ============================================
// Database Schema
// ============================================

export interface CachedSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
  verses: Verse[];
  translationId: string;
  cachedAt: number;
}

export interface CachedAudio {
  id: string; // `${surahNumber}-${verseNumber}-${reciterId}`
  surahNumber: number;
  verseNumber: number;
  reciterId: string;
  audioBlob: Blob;
  cachedAt: number;
}

export interface UserPreferences {
  id: string; // 'default'
  preferredTranslation: string;
  preferredReciter: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  showTranslation: boolean;
  theme: 'classic' | 'calm' | 'vibrant';
  lastSurah?: number;
  lastVerse?: number;
  updatedAt: number;
}

export interface DownloadProgress {
  id: string; // 'quran-text' | 'audio-juz-1' | etc.
  type: 'text' | 'audio';
  totalItems: number;
  completedItems: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  startedAt: number;
  completedAt?: number;
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  verseNumber: number;
  note?: string;
  createdAt: number;
}

export interface ReadingHistory {
  id: string; // `${surahNumber}-${date}`
  surahNumber: number;
  verseNumber: number;
  date: string; // YYYY-MM-DD
  duration: number; // seconds spent
  updatedAt: number;
}

// Story Language Type
export type StoryLanguage = 'english' | 'arabic' | 'arabic_egyptian';

export interface CachedStory {
  id: string; // `${prophet}-${topic}-${language}`
  prophet: string;
  topic: string;
  language: StoryLanguage;
  content: string; // Full markdown story
  cleanContent: string; // Story without scene markers
  images: string[]; // Base64 image data URLs
  scenePrompts: string[]; // Scene descriptions for regeneration
  audioBlob?: Blob; // Cached TTS audio
  locations?: string; // Cached locations data
  context?: string; // Cached deep dive data
  cachedAt: number;
  version: number;
}

export interface CachedStoryImage {
  id: string; // `${storyId}-${sceneIndex}`
  storyId: string;
  sceneIndex: number;
  prompt: string;
  imageData: string; // Base64 data URL
  cachedAt: number;
}

export interface StoryReadingPosition {
  id: string; // `story-${prophet}-${topic}-${language}`
  prophet: string;
  topic: string;
  language: StoryLanguage;
  scrollPercent: number; // 0-100
  lastReadAt: number;
}

// ============================================
// Kids Section Schema
// ============================================

export interface KidsProgress {
  id: string; // 'default'
  childName?: string;
  totalStars: number;
  level: number; // 1-10
  badges: string[];
  currentStreak: number;
  lastPlayDate: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
}

export interface KidsLetterProgress {
  id: string; // Letter ID e.g., 'alif', 'baa'
  letterArabic: string;
  timesPlayed: number;
  mastered: boolean;
  starsEarned: number; // 0-3
  lastPracticed: number;
}

export interface KidsSurahProgress {
  id: string; // Surah number as string
  surahNumber: number;
  versesHeard: number[];
  completed: boolean;
  starsEarned: number; // 0-3
  totalListens: number;
  lastPracticed: number;
}

export interface KidsStoryProgress {
  id: string; // Story ID e.g., 'adam', 'nuh'
  storyId: string;
  timesViewed: number;
  completed: boolean;
  starsEarned: number; // 0-3
  lastViewed: number;
}

// ============================================
// Dexie Database Class
// ============================================

class HikmaDatabase extends Dexie {
  surahs!: Table<CachedSurah, number>;
  audio!: Table<CachedAudio, string>;
  preferences!: Table<UserPreferences, string>;
  downloads!: Table<DownloadProgress, string>;
  bookmarks!: Table<Bookmark, string>;
  history!: Table<ReadingHistory, string>;
  stories!: Table<CachedStory, string>;
  storyImages!: Table<CachedStoryImage, string>;
  storyReadingPositions!: Table<StoryReadingPosition, string>;
  // Kids tables
  kidsProgress!: Table<KidsProgress, string>;
  kidsLetterProgress!: Table<KidsLetterProgress, string>;
  kidsSurahProgress!: Table<KidsSurahProgress, string>;
  kidsStoryProgress!: Table<KidsStoryProgress, string>;

  constructor() {
    super('HikmaQuranDB');

    // Version 1: Original schema
    this.version(1).stores({
      surahs: 'number, translationId, cachedAt',
      audio: 'id, surahNumber, verseNumber, reciterId, cachedAt',
      preferences: 'id',
      downloads: 'id, type, status',
      bookmarks: 'id, surahNumber, verseNumber, createdAt',
      history: 'id, surahNumber, date, updatedAt'
    });

    // Version 2: Add stories and storyImages tables
    this.version(2).stores({
      surahs: 'number, translationId, cachedAt',
      audio: 'id, surahNumber, verseNumber, reciterId, cachedAt',
      preferences: 'id',
      downloads: 'id, type, status',
      bookmarks: 'id, surahNumber, verseNumber, createdAt',
      history: 'id, surahNumber, date, updatedAt',
      stories: 'id, prophet, topic, language, cachedAt',
      storyImages: 'id, storyId, sceneIndex, cachedAt'
    });

    // Version 3: Add storyReadingPositions table
    this.version(3).stores({
      surahs: 'number, translationId, cachedAt',
      audio: 'id, surahNumber, verseNumber, reciterId, cachedAt',
      preferences: 'id',
      downloads: 'id, type, status',
      bookmarks: 'id, surahNumber, verseNumber, createdAt',
      history: 'id, surahNumber, date, updatedAt',
      stories: 'id, prophet, topic, language, cachedAt',
      storyImages: 'id, storyId, sceneIndex, cachedAt',
      storyReadingPositions: 'id, prophet, topic, language, lastReadAt'
    });

    // Version 4: Add kids section tables
    this.version(4).stores({
      surahs: 'number, translationId, cachedAt',
      audio: 'id, surahNumber, verseNumber, reciterId, cachedAt',
      preferences: 'id',
      downloads: 'id, type, status',
      bookmarks: 'id, surahNumber, verseNumber, createdAt',
      history: 'id, surahNumber, date, updatedAt',
      stories: 'id, prophet, topic, language, cachedAt',
      storyImages: 'id, storyId, sceneIndex, cachedAt',
      storyReadingPositions: 'id, prophet, topic, language, lastReadAt',
      kidsProgress: 'id',
      kidsLetterProgress: 'id, mastered, lastPracticed',
      kidsSurahProgress: 'id, surahNumber, completed',
      kidsStoryProgress: 'id, storyId, completed'
    });
  }
}

// Singleton instance
export const db = new HikmaDatabase();

// ============================================
// Surah Cache Operations
// ============================================

export async function getCachedSurah(
  surahNumber: number,
  translationId: string = 'en.sahih'
): Promise<CachedSurah | undefined> {
  try {
    const cached = await db.surahs
      .where({ number: surahNumber, translationId })
      .first();

    if (cached) {
      // Check if cache is still valid (30 days)
      const isValid = Date.now() - cached.cachedAt < 30 * 24 * 60 * 60 * 1000;
      if (isValid) return cached;
    }
    return undefined;
  } catch (error) {
    console.error('Error getting cached surah:', error);
    return undefined;
  }
}

export async function cacheSurah(surah: Surah, translationId: string): Promise<void> {
  try {
    const cachedSurah: CachedSurah = {
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      revelationType: surah.revelationType,
      numberOfAyahs: surah.numberOfAyahs,
      verses: surah.verses,
      translationId,
      cachedAt: Date.now()
    };

    await db.surahs.put(cachedSurah);
  } catch (error) {
    console.error('Error caching surah:', error);
  }
}

export async function getCachedSurahCount(): Promise<number> {
  try {
    return await db.surahs.count();
  } catch (error) {
    console.error('Error getting cached surah count:', error);
    return 0;
  }
}

export async function clearSurahCache(): Promise<void> {
  try {
    await db.surahs.clear();
  } catch (error) {
    console.error('Error clearing surah cache:', error);
  }
}

// ============================================
// Audio Cache Operations
// ============================================

export async function getCachedAudio(
  surahNumber: number,
  verseNumber: number,
  reciterId: string
): Promise<Blob | undefined> {
  try {
    const id = `${surahNumber}-${verseNumber}-${reciterId}`;
    const cached = await db.audio.get(id);
    return cached?.audioBlob;
  } catch (error) {
    console.error('Error getting cached audio:', error);
    return undefined;
  }
}

export async function cacheAudio(
  surahNumber: number,
  verseNumber: number,
  reciterId: string,
  audioBlob: Blob
): Promise<void> {
  try {
    const id = `${surahNumber}-${verseNumber}-${reciterId}`;
    await db.audio.put({
      id,
      surahNumber,
      verseNumber,
      reciterId,
      audioBlob,
      cachedAt: Date.now()
    });
  } catch (error) {
    console.error('Error caching audio:', error);
  }
}

export async function getCachedAudioCount(): Promise<number> {
  try {
    return await db.audio.count();
  } catch (error) {
    console.error('Error getting cached audio count:', error);
    return 0;
  }
}

export async function getAudioCacheSize(): Promise<number> {
  try {
    let totalSize = 0;
    await db.audio.each(item => {
      totalSize += item.audioBlob.size;
    });
    return totalSize;
  } catch (error) {
    console.error('Error calculating audio cache size:', error);
    return 0;
  }
}

export async function clearAudioCache(): Promise<void> {
  try {
    await db.audio.clear();
  } catch (error) {
    console.error('Error clearing audio cache:', error);
  }
}

// ============================================
// User Preferences Operations
// ============================================

export async function getPreferences(): Promise<UserPreferences | undefined> {
  try {
    return await db.preferences.get('default');
  } catch (error) {
    console.error('Error getting preferences:', error);
    return undefined;
  }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<void> {
  try {
    const existing = await getPreferences();
    const updated: UserPreferences = {
      id: 'default',
      preferredTranslation: prefs.preferredTranslation || existing?.preferredTranslation || 'en.sahih',
      preferredReciter: prefs.preferredReciter || existing?.preferredReciter || 'ar.alafasy',
      fontSize: prefs.fontSize || existing?.fontSize || 'medium',
      showTranslation: prefs.showTranslation ?? existing?.showTranslation ?? true,
      theme: prefs.theme || existing?.theme || 'classic',
      lastSurah: prefs.lastSurah ?? existing?.lastSurah,
      lastVerse: prefs.lastVerse ?? existing?.lastVerse,
      updatedAt: Date.now()
    };
    await db.preferences.put(updated);
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

// ============================================
// Bookmark Operations
// ============================================

export async function getBookmarks(): Promise<Bookmark[]> {
  try {
    return await db.bookmarks.orderBy('createdAt').reverse().toArray();
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    return [];
  }
}

export async function addBookmark(
  surahNumber: number,
  verseNumber: number,
  note?: string
): Promise<void> {
  try {
    const id = `${surahNumber}-${verseNumber}`;
    await db.bookmarks.put({
      id,
      surahNumber,
      verseNumber,
      note,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
  }
}

export async function removeBookmark(surahNumber: number, verseNumber: number): Promise<void> {
  try {
    const id = `${surahNumber}-${verseNumber}`;
    await db.bookmarks.delete(id);
  } catch (error) {
    console.error('Error removing bookmark:', error);
  }
}

export async function isBookmarked(surahNumber: number, verseNumber: number): Promise<boolean> {
  try {
    const id = `${surahNumber}-${verseNumber}`;
    const bookmark = await db.bookmarks.get(id);
    return !!bookmark;
  } catch (error) {
    console.error('Error checking bookmark:', error);
    return false;
  }
}

// ============================================
// Reading History Operations
// ============================================

export async function updateReadingHistory(
  surahNumber: number,
  verseNumber: number,
  durationSeconds: number
): Promise<void> {
  try {
    const date = new Date().toISOString().split('T')[0];
    const id = `${surahNumber}-${date}`;

    const existing = await db.history.get(id);

    await db.history.put({
      id,
      surahNumber,
      verseNumber: Math.max(verseNumber, existing?.verseNumber || 0),
      date,
      duration: (existing?.duration || 0) + durationSeconds,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating reading history:', error);
  }
}

export async function getReadingStreak(): Promise<number> {
  try {
    const history = await db.history.orderBy('date').reverse().toArray();
    if (history.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    const dateSet = new Set(history.map(h => h.date));

    // Check if read today or yesterday
    if (!dateSet.has(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!dateSet.has(checkDate.toISOString().split('T')[0])) {
        return 0;
      }
    }

    // Count consecutive days
    while (dateSet.has(checkDate.toISOString().split('T')[0])) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  } catch (error) {
    console.error('Error calculating reading streak:', error);
    return 0;
  }
}

// ============================================
// Download Progress Operations
// ============================================

export async function getDownloadProgress(id: string): Promise<DownloadProgress | undefined> {
  try {
    return await db.downloads.get(id);
  } catch (error) {
    console.error('Error getting download progress:', error);
    return undefined;
  }
}

export async function updateDownloadProgress(progress: DownloadProgress): Promise<void> {
  try {
    await db.downloads.put(progress);
  } catch (error) {
    console.error('Error updating download progress:', error);
  }
}

// ============================================
// Storage Info
// ============================================

export async function getStorageInfo(): Promise<{
  surahCount: number;
  audioCount: number;
  audioSizeMB: number;
  bookmarkCount: number;
  estimatedTotalMB: number;
}> {
  try {
    const [surahCount, audioCount, audioSize, bookmarkCount] = await Promise.all([
      getCachedSurahCount(),
      getCachedAudioCount(),
      getAudioCacheSize(),
      db.bookmarks.count()
    ]);

    const audioSizeMB = audioSize / (1024 * 1024);
    // Estimate surah text at ~50KB each
    const textSizeMB = (surahCount * 50) / 1024;

    return {
      surahCount,
      audioCount,
      audioSizeMB: Math.round(audioSizeMB * 10) / 10,
      bookmarkCount,
      estimatedTotalMB: Math.round((audioSizeMB + textSizeMB) * 10) / 10
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      surahCount: 0,
      audioCount: 0,
      audioSizeMB: 0,
      bookmarkCount: 0,
      estimatedTotalMB: 0
    };
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await Promise.all([
      db.surahs.clear(),
      db.audio.clear(),
      db.bookmarks.clear(),
      db.history.clear(),
      db.downloads.clear(),
      db.stories.clear(),
      db.storyImages.clear()
    ]);
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
}

// ============================================
// Story Cache Operations
// ============================================

/**
 * Generate a unique ID for a story
 */
export function getStoryId(prophet: string, topic: string, language: StoryLanguage): string {
  return `${prophet.toLowerCase().replace(/\s+/g, '-')}-${topic.toLowerCase().replace(/\s+/g, '-')}-${language}`;
}

/**
 * Get a cached story
 */
export async function getCachedStory(
  prophet: string,
  topic: string,
  language: StoryLanguage
): Promise<CachedStory | undefined> {
  try {
    const id = getStoryId(prophet, topic, language);
    const cached = await db.stories.get(id);

    if (cached) {
      // Check if cache is still valid (30 days)
      const isValid = Date.now() - cached.cachedAt < 30 * 24 * 60 * 60 * 1000;
      if (isValid) return cached;
    }
    return undefined;
  } catch (error) {
    console.error('Error getting cached story:', error);
    return undefined;
  }
}

/**
 * Cache a story
 */
export async function cacheStory(
  prophet: string,
  topic: string,
  language: StoryLanguage,
  content: string,
  cleanContent: string,
  images: string[],
  scenePrompts: string[],
  audioBlob?: Blob,
  locations?: string,
  context?: string
): Promise<void> {
  try {
    const id = getStoryId(prophet, topic, language);
    const story: CachedStory = {
      id,
      prophet,
      topic,
      language,
      content,
      cleanContent,
      images,
      scenePrompts,
      audioBlob,
      locations,
      context,
      cachedAt: Date.now(),
      version: 1
    };

    await db.stories.put(story);
  } catch (error) {
    console.error('Error caching story:', error);
  }
}

/**
 * Update a cached story with additional data (images, audio, etc.)
 */
export async function updateCachedStory(
  storyId: string,
  updates: Partial<CachedStory>
): Promise<void> {
  try {
    const existing = await db.stories.get(storyId);
    if (existing) {
      await db.stories.put({
        ...existing,
        ...updates,
        cachedAt: Date.now()
      });
    }
  } catch (error) {
    console.error('Error updating cached story:', error);
  }
}

/**
 * Get count of cached stories
 */
export async function getCachedStoryCount(): Promise<number> {
  try {
    return await db.stories.count();
  } catch (error) {
    console.error('Error getting cached story count:', error);
    return 0;
  }
}

/**
 * Get all cached stories for a prophet
 */
export async function getCachedStoriesForProphet(prophet: string): Promise<CachedStory[]> {
  try {
    return await db.stories.where('prophet').equals(prophet).toArray();
  } catch (error) {
    console.error('Error getting cached stories for prophet:', error);
    return [];
  }
}

/**
 * Get all cached stories
 */
export async function getAllCachedStories(): Promise<CachedStory[]> {
  try {
    return await db.stories.toArray();
  } catch (error) {
    console.error('Error getting all cached stories:', error);
    return [];
  }
}

/**
 * Clear all story cache
 */
export async function clearStoryCache(): Promise<void> {
  try {
    await Promise.all([
      db.stories.clear(),
      db.storyImages.clear()
    ]);
  } catch (error) {
    console.error('Error clearing story cache:', error);
  }
}

// ============================================
// Story Image Cache Operations
// ============================================

/**
 * Cache a story scene image
 */
export async function cacheStoryImage(
  storyId: string,
  sceneIndex: number,
  prompt: string,
  imageData: string
): Promise<void> {
  try {
    const id = `${storyId}-${sceneIndex}`;
    await db.storyImages.put({
      id,
      storyId,
      sceneIndex,
      prompt,
      imageData,
      cachedAt: Date.now()
    });
  } catch (error) {
    console.error('Error caching story image:', error);
  }
}

/**
 * Get a cached story scene image
 */
export async function getCachedStoryImage(
  storyId: string,
  sceneIndex: number
): Promise<string | undefined> {
  try {
    const id = `${storyId}-${sceneIndex}`;
    const cached = await db.storyImages.get(id);
    return cached?.imageData;
  } catch (error) {
    console.error('Error getting cached story image:', error);
    return undefined;
  }
}

/**
 * Get all cached images for a story
 */
export async function getCachedStoryImages(storyId: string): Promise<CachedStoryImage[]> {
  try {
    return await db.storyImages.where('storyId').equals(storyId).toArray();
  } catch (error) {
    console.error('Error getting cached story images:', error);
    return [];
  }
}

// ============================================
// Enhanced Storage Info
// ============================================

export async function getEnhancedStorageInfo(): Promise<{
  surahCount: number;
  audioCount: number;
  audioSizeMB: number;
  bookmarkCount: number;
  storyCount: number;
  storyImageCount: number;
  estimatedTotalMB: number;
}> {
  try {
    const [surahCount, audioCount, audioSize, bookmarkCount, storyCount, storyImageCount] = await Promise.all([
      getCachedSurahCount(),
      getCachedAudioCount(),
      getAudioCacheSize(),
      db.bookmarks.count(),
      getCachedStoryCount(),
      db.storyImages.count()
    ]);

    const audioSizeMB = audioSize / (1024 * 1024);
    // Estimate surah text at ~50KB each
    const textSizeMB = (surahCount * 50) / 1024;
    // Estimate story at ~100KB each (with images)
    const storySizeMB = (storyCount * 100) / 1024;
    // Estimate story images at ~200KB each
    const storyImageSizeMB = (storyImageCount * 200) / 1024;

    return {
      surahCount,
      audioCount,
      audioSizeMB: Math.round(audioSizeMB * 10) / 10,
      bookmarkCount,
      storyCount,
      storyImageCount,
      estimatedTotalMB: Math.round((audioSizeMB + textSizeMB + storySizeMB + storyImageSizeMB) * 10) / 10
    };
  } catch (error) {
    console.error('Error getting enhanced storage info:', error);
    return {
      surahCount: 0,
      audioCount: 0,
      audioSizeMB: 0,
      bookmarkCount: 0,
      storyCount: 0,
      storyImageCount: 0,
      estimatedTotalMB: 0
    };
  }
}

// ============================================
// Story Reading Position Operations
// ============================================

/**
 * Get reading position ID
 */
function getReadingPositionId(prophet: string, topic: string, language: StoryLanguage): string {
  return `story-${prophet.toLowerCase().replace(/[^a-z0-9]/g, '')}-${topic.toLowerCase().replace(/[^a-z0-9]/g, '')}-${language}`;
}

/**
 * Save reading position for a story
 */
export async function saveStoryReadingPosition(
  prophet: string,
  topic: string,
  language: StoryLanguage,
  scrollPercent: number
): Promise<void> {
  try {
    const id = getReadingPositionId(prophet, topic, language);
    await db.storyReadingPositions.put({
      id,
      prophet,
      topic,
      language,
      scrollPercent: Math.round(scrollPercent * 100) / 100,
      lastReadAt: Date.now()
    });
  } catch (error) {
    console.error('Error saving story reading position:', error);
  }
}

/**
 * Get reading position for a story
 */
export async function getStoryReadingPosition(
  prophet: string,
  topic: string,
  language: StoryLanguage
): Promise<StoryReadingPosition | undefined> {
  try {
    const id = getReadingPositionId(prophet, topic, language);
    return await db.storyReadingPositions.get(id);
  } catch (error) {
    console.error('Error getting story reading position:', error);
    return undefined;
  }
}

/**
 * Get all reading positions (for "Continue Reading" feature)
 */
export async function getAllReadingPositions(): Promise<StoryReadingPosition[]> {
  try {
    return await db.storyReadingPositions
      .orderBy('lastReadAt')
      .reverse()
      .toArray();
  } catch (error) {
    console.error('Error getting all reading positions:', error);
    return [];
  }
}

/**
 * Get most recent reading position
 */
export async function getMostRecentReadingPosition(): Promise<StoryReadingPosition | undefined> {
  try {
    return await db.storyReadingPositions
      .orderBy('lastReadAt')
      .reverse()
      .first();
  } catch (error) {
    console.error('Error getting most recent reading position:', error);
    return undefined;
  }
}

/**
 * Clear reading position for a story
 */
export async function clearStoryReadingPosition(
  prophet: string,
  topic: string,
  language: StoryLanguage
): Promise<void> {
  try {
    const id = getReadingPositionId(prophet, topic, language);
    await db.storyReadingPositions.delete(id);
  } catch (error) {
    console.error('Error clearing story reading position:', error);
  }
}

/**
 * Clear all reading positions
 */
export async function clearAllReadingPositions(): Promise<void> {
  try {
    await db.storyReadingPositions.clear();
  } catch (error) {
    console.error('Error clearing all reading positions:', error);
  }
}

// ============================================
// Kids Section Operations
// ============================================

/**
 * Get or create kids progress
 */
export async function getKidsProgress(): Promise<KidsProgress> {
  try {
    const existing = await db.kidsProgress.get('default');
    if (existing) return existing;

    // Create default progress
    const newProgress: KidsProgress = {
      id: 'default',
      totalStars: 0,
      level: 1,
      badges: [],
      currentStreak: 0,
      lastPlayDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.kidsProgress.put(newProgress);
    return newProgress;
  } catch (error) {
    console.error('Error getting kids progress:', error);
    return {
      id: 'default',
      totalStars: 0,
      level: 1,
      badges: [],
      currentStreak: 0,
      lastPlayDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

/**
 * Update kids progress
 */
export async function updateKidsProgress(updates: Partial<KidsProgress>): Promise<void> {
  try {
    const existing = await getKidsProgress();
    await db.kidsProgress.put({
      ...existing,
      ...updates,
      id: 'default',
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Error updating kids progress:', error);
  }
}

/**
 * Add stars to kids progress
 */
export async function addKidsStars(count: number = 1): Promise<number> {
  try {
    const progress = await getKidsProgress();
    const newTotal = progress.totalStars + count;

    // Calculate new level based on stars
    const LEVEL_THRESHOLDS = [0, 10, 25, 50, 100, 150, 200, 300, 400, 500];
    let newLevel = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (newTotal >= LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
        break;
      }
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = progress.currentStreak;
    if (progress.lastPlayDate === yesterday) {
      newStreak = progress.currentStreak + 1;
    } else if (progress.lastPlayDate !== today) {
      newStreak = 1;
    }

    await updateKidsProgress({
      totalStars: newTotal,
      level: newLevel,
      currentStreak: newStreak,
      lastPlayDate: today
    });

    return newTotal;
  } catch (error) {
    console.error('Error adding kids stars:', error);
    return 0;
  }
}

/**
 * Add badge to kids progress
 */
export async function addKidsBadge(badgeId: string): Promise<void> {
  try {
    const progress = await getKidsProgress();
    if (!progress.badges.includes(badgeId)) {
      await updateKidsProgress({
        badges: [...progress.badges, badgeId]
      });
    }
  } catch (error) {
    console.error('Error adding kids badge:', error);
  }
}

/**
 * Get letter progress
 */
export async function getKidsLetterProgress(letterId: string): Promise<KidsLetterProgress | undefined> {
  try {
    return await db.kidsLetterProgress.get(letterId);
  } catch (error) {
    console.error('Error getting letter progress:', error);
    return undefined;
  }
}

/**
 * Update letter progress
 */
export async function updateKidsLetterProgress(
  letterId: string,
  letterArabic: string,
  updates: Partial<KidsLetterProgress>
): Promise<void> {
  try {
    const existing = await getKidsLetterProgress(letterId);
    const progress: KidsLetterProgress = {
      id: letterId,
      letterArabic,
      timesPlayed: existing?.timesPlayed || 0,
      mastered: existing?.mastered || false,
      starsEarned: existing?.starsEarned || 0,
      lastPracticed: Date.now(),
      ...updates
    };
    await db.kidsLetterProgress.put(progress);
  } catch (error) {
    console.error('Error updating letter progress:', error);
  }
}

/**
 * Get all letter progress
 */
export async function getAllKidsLetterProgress(): Promise<KidsLetterProgress[]> {
  try {
    return await db.kidsLetterProgress.toArray();
  } catch (error) {
    console.error('Error getting all letter progress:', error);
    return [];
  }
}

/**
 * Get surah progress
 */
export async function getKidsSurahProgress(surahNumber: number): Promise<KidsSurahProgress | undefined> {
  try {
    return await db.kidsSurahProgress.get(String(surahNumber));
  } catch (error) {
    console.error('Error getting surah progress:', error);
    return undefined;
  }
}

/**
 * Update surah progress
 */
export async function updateKidsSurahProgress(
  surahNumber: number,
  updates: Partial<KidsSurahProgress>
): Promise<void> {
  try {
    const existing = await getKidsSurahProgress(surahNumber);
    const progress: KidsSurahProgress = {
      id: String(surahNumber),
      surahNumber,
      versesHeard: existing?.versesHeard || [],
      completed: existing?.completed || false,
      starsEarned: existing?.starsEarned || 0,
      totalListens: existing?.totalListens || 0,
      lastPracticed: Date.now(),
      ...updates
    };
    await db.kidsSurahProgress.put(progress);
  } catch (error) {
    console.error('Error updating surah progress:', error);
  }
}

/**
 * Get all surah progress
 */
export async function getAllKidsSurahProgress(): Promise<KidsSurahProgress[]> {
  try {
    return await db.kidsSurahProgress.toArray();
  } catch (error) {
    console.error('Error getting all surah progress:', error);
    return [];
  }
}

/**
 * Get story progress
 */
export async function getKidsStoryProgress(storyId: string): Promise<KidsStoryProgress | undefined> {
  try {
    return await db.kidsStoryProgress.get(storyId);
  } catch (error) {
    console.error('Error getting story progress:', error);
    return undefined;
  }
}

/**
 * Update story progress
 */
export async function updateKidsStoryProgress(
  storyId: string,
  updates: Partial<KidsStoryProgress>
): Promise<void> {
  try {
    const existing = await getKidsStoryProgress(storyId);
    const progress: KidsStoryProgress = {
      id: storyId,
      storyId,
      timesViewed: existing?.timesViewed || 0,
      completed: existing?.completed || false,
      starsEarned: existing?.starsEarned || 0,
      lastViewed: Date.now(),
      ...updates
    };
    await db.kidsStoryProgress.put(progress);
  } catch (error) {
    console.error('Error updating story progress:', error);
  }
}

/**
 * Get all story progress
 */
export async function getAllKidsStoryProgress(): Promise<KidsStoryProgress[]> {
  try {
    return await db.kidsStoryProgress.toArray();
  } catch (error) {
    console.error('Error getting all story progress:', error);
    return [];
  }
}

/**
 * Reset all kids progress
 */
export async function resetAllKidsProgress(): Promise<void> {
  try {
    await Promise.all([
      db.kidsProgress.clear(),
      db.kidsLetterProgress.clear(),
      db.kidsSurahProgress.clear(),
      db.kidsStoryProgress.clear()
    ]);
  } catch (error) {
    console.error('Error resetting kids progress:', error);
  }
}
