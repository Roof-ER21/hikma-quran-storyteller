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
}

export interface AdultStory {
  id: string;
  prophet: string;
  prophetArabic: string;
  title: string;
  titleArabic: string;
  theme: string;
  estimatedReadTime: number;
  scenes: StoryScene[];
  keyLessons: string[];
  relatedVerses: string[];
}

// Cache for quick lookups
let storiesCache: AdultStory[] | null = null;
let storiesByIdCache: Map<string, AdultStory> | null = null;
let storiesByNameCache: Map<string, AdultStory> | null = null;

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
      storiesByIdCache!.set(story.id.toLowerCase(), story);
    });
  }
  return storiesByIdCache.get(id.toLowerCase()) || null;
};

/**
 * Get a story by prophet name (handles variations like "Adam", "Musa (Moses)", etc.)
 */
export const getAdultStoryByName = (prophetName: string): AdultStory | null => {
  if (!storiesByNameCache) {
    storiesByNameCache = new Map();
    getAllAdultStories().forEach(story => {
      // Map various name formats to the same story
      const name = story.prophet.toLowerCase();
      storiesByNameCache!.set(name, story);

      // Also map by ID
      storiesByNameCache!.set(story.id.toLowerCase(), story);

      // Extract name without parenthetical (e.g., "Musa" from "Musa (Moses)")
      const baseName = name.split('(')[0].trim();
      if (baseName !== name) {
        storiesByNameCache!.set(baseName, story);
      }

      // Extract English name from parenthetical (e.g., "Moses" from "Musa (Moses)")
      const match = name.match(/\(([^)]+)\)/);
      if (match) {
        storiesByNameCache!.set(match[1].toLowerCase(), story);
      }
    });
  }

  const searchName = prophetName.toLowerCase().trim();

  // Try exact match first
  if (storiesByNameCache.has(searchName)) {
    return storiesByNameCache.get(searchName)!;
  }

  // Try extracting base name from input
  const baseName = searchName.split('(')[0].trim();
  if (storiesByNameCache.has(baseName)) {
    return storiesByNameCache.get(baseName)!;
  }

  // Try extracting parenthetical from input
  const match = searchName.match(/\(([^)]+)\)/);
  if (match && storiesByNameCache.has(match[1].toLowerCase())) {
    return storiesByNameCache.get(match[1].toLowerCase())!;
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
export const formatStoryForDisplay = (story: AdultStory): string => {
  return story.scenes.map(scene => {
    let text = `## ${scene.sceneTitle}\n\n${scene.text}`;
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
