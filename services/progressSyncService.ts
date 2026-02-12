/**
 * Progress Sync Service
 * Syncs kids' progress between local IndexedDB and server
 */

import {
  getKidsProgress,
  getAllKidsLetterProgress,
  getAllKidsSurahProgress,
  getAllKidsStoryProgress,
  updateKidsProgress,
  updateKidsLetterProgress,
  updateKidsSurahProgress,
  updateKidsStoryProgress,
  KidsProgress,
  KidsLetterProgress,
  KidsSurahProgress,
  KidsStoryProgress
} from './offlineDatabase';

// Debounce timer for sync
let syncDebounceTimer: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 2000;

// Track if sync is in progress
let isSyncing = false;

// Online/offline event listeners
let cleanupFn: (() => void) | null = null;

/**
 * Get the auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('alayasoad_parent_token');
}

/**
 * Check if user is logged in as parent
 */
export function isParentLoggedIn(): boolean {
  return !!getAuthToken();
}

/**
 * Fetch progress from server
 */
export async function fetchServerProgress(): Promise<{
  progress: any;
  letters: any[];
  surahs: any[];
  stories: any[];
} | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/parent/kids-progress', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch server progress:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching server progress:', error);
    return null;
  }
}

/**
 * Sync local progress to server
 */
export async function syncProgressToServer(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return false;
  }

  isSyncing = true;

  try {
    // Get all local progress
    const [progress, letters, surahs, stories] = await Promise.all([
      getKidsProgress(),
      getAllKidsLetterProgress(),
      getAllKidsSurahProgress(),
      getAllKidsStoryProgress()
    ]);

    const response = await fetch('/api/parent/kids-progress/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        progress: {
          childName: progress.childName,
          totalStars: progress.totalStars,
          level: progress.level,
          badges: progress.badges,
          currentStreak: progress.currentStreak,
          lastPlayDate: progress.lastPlayDate
        },
        letters: letters.map(l => ({
          letterId: l.id,
          letterArabic: l.letterArabic,
          timesPlayed: l.timesPlayed,
          mastered: l.mastered,
          starsEarned: l.starsEarned,
          lastPracticed: l.lastPracticed
        })),
        surahs: surahs.map(s => ({
          surahNumber: s.surahNumber,
          versesHeard: s.versesHeard,
          completed: s.completed,
          starsEarned: s.starsEarned,
          totalListens: s.totalListens,
          lastPracticed: s.lastPracticed
        })),
        stories: stories.map(st => ({
          storyId: st.storyId,
          timesViewed: st.timesViewed,
          completed: st.completed,
          starsEarned: st.starsEarned,
          lastViewed: st.lastViewed
        }))
      })
    });

    if (!response.ok) {
      console.error('Failed to sync progress to server:', response.status);
      return false;
    }

    console.log('Progress synced to server successfully');
    return true;
  } catch (error) {
    console.error('Error syncing progress to server:', error);
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Load progress from server and merge with local data
 * Server data takes precedence for higher values (stars, levels, etc.)
 */
export async function loadAndMergeServerProgress(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const serverData = await fetchServerProgress();
    if (!serverData) return false;

    // Merge main progress
    if (serverData.progress) {
      const localProgress = await getKidsProgress();
      await updateKidsProgress({
        totalStars: Math.max(localProgress.totalStars, serverData.progress.total_stars || 0),
        level: Math.max(localProgress.level, serverData.progress.level || 1),
        badges: [...new Set([...localProgress.badges, ...(serverData.progress.badges || [])])],
        currentStreak: Math.max(localProgress.currentStreak, serverData.progress.current_streak || 0),
        lastPlayDate: localProgress.lastPlayDate > (serverData.progress.last_play_date || '')
          ? localProgress.lastPlayDate
          : serverData.progress.last_play_date || localProgress.lastPlayDate
      });
    }

    // Merge letter progress
    if (serverData.letters && serverData.letters.length > 0) {
      for (const serverLetter of serverData.letters) {
        const localLetters = await getAllKidsLetterProgress();
        const localLetter = localLetters.find(l => l.id === serverLetter.letter_id);

        await updateKidsLetterProgress(serverLetter.letter_id, serverLetter.letter_arabic, {
          timesPlayed: Math.max(localLetter?.timesPlayed || 0, serverLetter.times_played || 0),
          mastered: (localLetter?.mastered || false) || (serverLetter.mastered || false),
          starsEarned: Math.max(localLetter?.starsEarned || 0, serverLetter.stars_earned || 0),
          lastPracticed: Math.max(localLetter?.lastPracticed || 0, new Date(serverLetter.last_practiced || 0).getTime())
        });
      }
    }

    // Merge surah progress
    if (serverData.surahs && serverData.surahs.length > 0) {
      for (const serverSurah of serverData.surahs) {
        const localSurahs = await getAllKidsSurahProgress();
        const localSurah = localSurahs.find(s => s.surahNumber === serverSurah.surah_number);

        await updateKidsSurahProgress(serverSurah.surah_number, {
          versesHeard: [...new Set([...(localSurah?.versesHeard || []), ...(serverSurah.verses_heard || [])])],
          completed: (localSurah?.completed || false) || (serverSurah.completed || false),
          starsEarned: Math.max(localSurah?.starsEarned || 0, serverSurah.stars_earned || 0),
          totalListens: Math.max(localSurah?.totalListens || 0, serverSurah.total_listens || 0),
          lastPracticed: Math.max(localSurah?.lastPracticed || 0, new Date(serverSurah.last_practiced || 0).getTime())
        });
      }
    }

    // Merge story progress
    if (serverData.stories && serverData.stories.length > 0) {
      for (const serverStory of serverData.stories) {
        const localStories = await getAllKidsStoryProgress();
        const localStory = localStories.find(s => s.storyId === serverStory.story_id);

        await updateKidsStoryProgress(serverStory.story_id, {
          timesViewed: Math.max(localStory?.timesViewed || 0, serverStory.times_viewed || 0),
          completed: (localStory?.completed || false) || (serverStory.completed || false),
          starsEarned: Math.max(localStory?.starsEarned || 0, serverStory.stars_earned || 0),
          lastViewed: Math.max(localStory?.lastViewed || 0, new Date(serverStory.last_viewed || 0).getTime())
        });
      }
    }

    console.log('Server progress merged with local data');
    return true;
  } catch (error) {
    console.error('Error merging server progress:', error);
    return false;
  }
}

/**
 * Debounced sync - call this after any progress change
 */
export function debouncedSync(): void {
  if (!isParentLoggedIn()) return;

  // COPPA: Only sync if parent has opted in
  if (localStorage.getItem('alayasoad_sync_enabled') !== 'true') return;

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(() => {
    if (navigator.onLine) {
      syncProgressToServer();
    }
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Get parent profile from server
 */
export async function getParentProfile(): Promise<{
  parent: { id: number; name: string };
  progress: {
    totalStars: number;
    level: number;
    badges: string[];
    currentStreak: number;
    lastPlayDate: string | null;
  };
  summary: {
    lettersMastered: number;
    surahsCompleted: number;
    storiesCompleted: number;
  };
} | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/parent/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch parent profile:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    return null;
  }
}

/**
 * Change parent PIN
 */
export async function changeParentPin(currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Not logged in' };

  try {
    const response = await fetch('/api/parent/pin', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPin, newPin })
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to change PIN' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error changing PIN:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Initialize progress sync - call on parent login
 * Sets up online/offline event listeners
 */
export function initProgressSync(): () => void {
  // Load and merge server progress on init
  if (navigator.onLine && isParentLoggedIn()) {
    loadAndMergeServerProgress();
  }

  // Handle coming online
  const handleOnline = () => {
    console.log('App came online, syncing progress...');
    if (isParentLoggedIn()) {
      syncProgressToServer();
    }
  };

  // Handle visibility change (app resume)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && navigator.onLine && isParentLoggedIn()) {
      console.log('App resumed, syncing progress...');
      syncProgressToServer();
    }
  };

  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  cleanupFn = () => {
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }
  };

  return cleanupFn;
}

/**
 * Cleanup progress sync listeners
 */
export function cleanupProgressSync(): void {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
}
