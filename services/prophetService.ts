import { AdultProphetStory } from '../types';

// Prophet stories data will be loaded from JSON
let prophetStoriesCache: AdultProphetStory[] | null = null;

/**
 * Load all prophet stories from the JSON file
 */
export async function loadProphetStories(): Promise<AdultProphetStory[]> {
  if (prophetStoriesCache) {
    return prophetStoriesCache;
  }

  try {
    const response = await fetch('/data/prophetStoriesAdults.json');
    if (!response.ok) {
      throw new Error('Failed to load prophet stories');
    }
    const stories = await response.json();
    prophetStoriesCache = stories;
    return stories;
  } catch (error) {
    console.error('Error loading prophet stories:', error);
    return [];
  }
}

/**
 * Get a single prophet story by ID
 */
export async function getProphetStory(id: string): Promise<AdultProphetStory | null> {
  const stories = await loadProphetStories();
  return stories.find(story => story.id === id) || null;
}

/**
 * Search prophet stories by name or keywords
 */
export async function searchProphetStories(query: string): Promise<AdultProphetStory[]> {
  const stories = await loadProphetStories();

  if (!query.trim()) {
    return stories;
  }

  const lowerQuery = query.toLowerCase();

  return stories.filter(story => {
    // Search in prophet name (English and Arabic)
    if (story.prophetName.toLowerCase().includes(lowerQuery)) return true;
    if (story.arabicName.includes(query)) return true;

    // Search in summary
    if (story.summary.toLowerCase().includes(lowerQuery)) return true;
    if (story.summaryArabic?.includes(query)) return true;

    // Search in key lessons
    if (story.keyLessons.some(lesson => lesson.toLowerCase().includes(lowerQuery))) return true;
    if (story.keyLessonsArabic?.some(lesson => lesson.includes(query))) return true;

    // Search in section titles and content
    if (story.sections.some(section =>
      section.title.toLowerCase().includes(lowerQuery) ||
      section.content.toLowerCase().includes(lowerQuery)
    )) return true;
    if (story.sections.some(section =>
      section.titleArabic?.includes(query) ||
      section.contentArabic?.includes(query)
    )) return true;

    if (story.locationArabic?.includes(query)) return true;
    if (story.eraArabic?.includes(query)) return true;
    if (story.periodArabic?.includes(query)) return true;

    return false;
  });
}

/**
 * Get prophet stories filtered by location/region
 */
export async function getProphetsByLocation(location: string): Promise<AdultProphetStory[]> {
  const stories = await loadProphetStories();
  return stories.filter(story =>
    story.location.toLowerCase().includes(location.toLowerCase()) ||
    story.locationArabic?.includes(location)
  );
}

/**
 * Get prophet stories filtered by era/period
 */
export async function getProphetsByEra(era: string): Promise<AdultProphetStory[]> {
  const stories = await loadProphetStories();
  return stories.filter(story =>
    story.era.toLowerCase().includes(era.toLowerCase()) ||
    story.period.toLowerCase().includes(era.toLowerCase()) ||
    story.eraArabic?.includes(era) ||
    story.periodArabic?.includes(era)
  );
}

/**
 * Get related prophet stories
 */
export async function getRelatedProphets(prophetId: string): Promise<AdultProphetStory[]> {
  const stories = await loadProphetStories();
  const prophet = stories.find(s => s.id === prophetId);

  if (!prophet || !prophet.relatedProphets) {
    return [];
  }

  return stories.filter(s =>
    prophet.relatedProphets?.includes(s.id)
  );
}

/**
 * Clear the cache (useful for refreshing data)
 */
export function clearProphetStoriesCache(): void {
  prophetStoriesCache = null;
}
