/**
 * Adult Story Service
 *
 * Loads and manages pre-generated adult prophet stories from adultStoriesPreloaded.json
 * These stories work offline and load instantly without API calls.
 */

import adultStories from '../data/adultStoriesPreloaded.json';

export interface StoryScene {
  sceneTitle: string;
  text: string;
  quranReference: string | null;
  sceneTitleArabic?: string;
  textArabic?: string;
}

export interface AdultStory {
  id: string;
  prophet: string;
  prophetArabic: string;
  title: string;
  titleArabic: string;
  theme: string;
  themeArabic?: string;
  estimatedReadTime: number;
  scenes: StoryScene[];
  keyLessons: string[];
  keyLessonsArabic?: string[];
  summaryArabic?: string;
  relatedVerses: string[];
}

// Cache for quick lookups
let storiesCache: AdultStory[] | null = null;
let storiesByIdCache: Map<string, AdultStory> | null = null;
let storiesByNameCache: Map<string, AdultStory> | null = null;

// Normalize common spelling variants so clicks always map to preloaded stories
const normalizeProphetName = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  const aliases: Record<string, string> = {
    zakariyah: 'zakariya',
    zakariyya: 'zakariya',
  };
  return aliases[normalized] || normalized;
};

/**
 * Get all preloaded adult stories
 */
export const getAllAdultStories = (): AdultStory[] => {
  if (!storiesCache) {
    storiesCache = adultStories as AdultStory[];
  }
  return storiesCache;
};

/**
 * Get a story by prophet ID (e.g., 'adam', 'musa')
 */
export const getAdultStoryById = (id: string): AdultStory | null => {
  if (!storiesByIdCache) {
    storiesByIdCache = new Map();
    getAllAdultStories().forEach(story => {
      storiesByIdCache!.set(normalizeProphetName(story.id), story);
    });
  }
  return storiesByIdCache.get(normalizeProphetName(id)) || null;
};

/**
 * Get a story by prophet name (handles variations like "Adam", "Musa (Moses)", etc.)
 */
export const getAdultStoryByName = (prophetName: string): AdultStory | null => {
  if (!storiesByNameCache) {
    storiesByNameCache = new Map();
    getAllAdultStories().forEach(story => {
      const addNameKey = (name: string) => {
        storiesByNameCache!.set(normalizeProphetName(name), story);
      };

      // Map various name formats to the same story
      addNameKey(story.prophet);

      // Also map by ID
      addNameKey(story.id);

      // Extract name without parenthetical (e.g., "Musa" from "Musa (Moses)")
      const baseName = story.prophet.split('(')[0].trim();
      if (baseName !== story.prophet) {
        addNameKey(baseName);
      }

      // Extract English name from parenthetical (e.g., "Moses" from "Musa (Moses)")
      const match = story.prophet.match(/\(([^)]+)\)/);
      if (match) {
        addNameKey(match[1]);
      }
    });
  }

  const searchName = normalizeProphetName(prophetName);

  // Try exact match first
  if (storiesByNameCache.has(searchName)) {
    return storiesByNameCache.get(searchName)!;
  }

  // Try extracting base name from input
  const baseName = normalizeProphetName(prophetName.split('(')[0]);
  if (storiesByNameCache.has(baseName)) {
    return storiesByNameCache.get(baseName)!;
  }

  // Try extracting parenthetical from input
  const match = prophetName.match(/\(([^)]+)\)/);
  const parenthetical = match ? normalizeProphetName(match[1]) : null;
  if (parenthetical && storiesByNameCache.has(parenthetical)) {
    return storiesByNameCache.get(parenthetical)!;
  }

  return null;
};

/**
 * Search stories by keyword (searches title, theme, lessons)
 */
export const searchAdultStories = (query: string): AdultStory[] => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return getAllAdultStories();

  return getAllAdultStories().filter(story => {
    return (
      story.title.toLowerCase().includes(searchTerm) ||
      story.titleArabic.includes(searchTerm) ||
      story.theme.toLowerCase().includes(searchTerm) ||
      story.prophet.toLowerCase().includes(searchTerm) ||
      story.prophetArabic.includes(searchTerm) ||
      story.keyLessons.some(lesson => lesson.toLowerCase().includes(searchTerm))
    );
  });
};

/**
 * Get stories by theme (e.g., "Patience", "Faith", "Repentance")
 */
export const getStoriesByTheme = (theme: string): AdultStory[] => {
  const searchTheme = theme.toLowerCase().trim();
  return getAllAdultStories().filter(story =>
    story.theme.toLowerCase().includes(searchTheme)
  );
};

/**
 * Get a random story
 */
export const getRandomAdultStory = (): AdultStory => {
  const stories = getAllAdultStories();
  return stories[Math.floor(Math.random() * stories.length)];
};

/**
 * Get total reading time for all stories (in minutes)
 */
export const getTotalReadingTime = (): number => {
  return getAllAdultStories().reduce((total, story) => total + story.estimatedReadTime, 0);
};

/**
 * Check if preloaded stories are available
 */
export const hasPreloadedStories = (): boolean => {
  return getAllAdultStories().length > 0;
};

/**
 * Get story count
 */
export const getStoryCount = (): number => {
  return getAllAdultStories().length;
};

/**
 * Format story for display (converts scene text to clean paragraphs)
 */
export type StoryLanguage = 'english' | 'arabic' | 'arabic_egyptian';

export const formatStoryForDisplay = (story: AdultStory, language: StoryLanguage = 'english'): string => {
  const useArabic = language === 'arabic' || language === 'arabic_egyptian';

  const getSceneTitle = (scene: StoryScene) => useArabic ? (scene.sceneTitleArabic || scene.sceneTitle) : scene.sceneTitle;
  const getSceneText = (scene: StoryScene) => useArabic ? (scene.textArabic || scene.text) : scene.text;

  return story.scenes.map(scene => {
    let text = `## ${getSceneTitle(scene)}\n\n${getSceneText(scene)}`;
    if (scene.quranReference) {
      text += `\n\n📖 *${scene.quranReference}*`;
    }
    return text;
  }).join('\n\n---\n\n');
};

/**
 * Get all prophet names (useful for UI dropdowns)
 */
export const getProphetNames = (): { name: string; arabic: string; id: string }[] => {
  return getAllAdultStories().map(story => ({
    name: story.prophet,
    arabic: story.prophetArabic,
    id: story.id
  }));
};

/**
 * Get the preloaded image path for a prophet story
 * Returns the path to the abstract/environmental image (no human figures)
 */
export const getProphetImagePath = (prophetId: string): string => {
  // Normalize the ID (handle variations)
  const normalizedId = prophetId.toLowerCase()
    .replace(/[()]/g, '')
    .split(' ')[0]
    .trim();

  // Map common variations to image file names
  const idMap: Record<string, string> = {
    'adam': 'adam',
    'idris': 'idris',
    'nuh': 'nuh',
    'noah': 'nuh',
    'hud': 'hud',
    'saleh': 'saleh',
    'ibrahim': 'ibrahim',
    'abraham': 'ibrahim',
    'lut': 'lut',
    'lot': 'lut',
    'ismail': 'ismail',
    'ishmael': 'ismail',
    'ishaq': 'ishaq',
    'isaac': 'ishaq',
    'yaqub': 'yaqub',
    'jacob': 'yaqub',
    'yusuf': 'yusuf',
    'joseph': 'yusuf',
    'ayyub': 'ayyub',
    'job': 'ayyub',
    "shu'aib": 'shuaib',
    'shuaib': 'shuaib',
    'musa': 'musa',
    'moses': 'musa',
    'harun': 'harun',
    'aaron': 'harun',
    'dhul-kifl': 'dhulkifl',
    'dhulkifl': 'dhulkifl',
    'dawud': 'dawud',
    'david': 'dawud',
    'sulaiman': 'sulaiman',
    'solomon': 'sulaiman',
    'ilyas': 'ilyas',
    'elijah': 'ilyas',
    'al-yasa': 'alyasa',
    'alyasa': 'alyasa',
    'elisha': 'alyasa',
    'yunus': 'yunus',
    'jonah': 'yunus',
    'zakariya': 'zakariya',
    'zakariyah': 'zakariya',
    'zechariah': 'zakariya',
    'yahya': 'yahya',
    'john': 'yahya',
    'isa': 'isa',
    'jesus': 'isa',
  };

  const imageId = idMap[normalizedId] || normalizedId;
  return `/images/prophets/${imageId}.png`;
};

/**
 * Check if a preloaded image exists for a prophet
 */
export const hasProphetImage = (prophetId: string): boolean => {
  // In production, we can't check if file exists client-side
  // This is a simple check based on known prophets
  const knownProphets = [
    'adam', 'idris', 'nuh', 'hud', 'saleh', 'ibrahim', 'lut', 'ismail',
    'ishaq', 'yaqub', 'yusuf', 'ayyub', 'shuaib', 'musa', 'harun',
    'dhulkifl', 'dawud', 'sulaiman', 'ilyas', 'alyasa', 'yunus',
    'zakariya', 'yahya', 'isa'
  ];

  const normalizedId = prophetId.toLowerCase()
    .replace(/[()]/g, '')
    .split(' ')[0]
    .trim();

  return knownProphets.includes(normalizedId);
};
