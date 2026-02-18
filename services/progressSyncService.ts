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
import { createLocalProgressBackup } from './progressBackupService';

// Debounce timer for sync
let syncDebounceTimer: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 2000;

// Track if sync is in progress
let isSyncing = false;

// Online/offline event listeners
let cleanupFn: (() => void) | null = null;
const AUTH_EXPIRED_EVENT = 'alayasoad:parent-auth-expired';

/**
 * Get the auth token from localStorage
 */
function getAuthToken(): string | null {
  const token = localStorage.getItem('alayasoad_parent_token');
  if (!token) return null;

  // Tokens are JWTs (header.payload.signature). Drop malformed values eagerly.
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    localStorage.removeItem('alayasoad_parent_token');
    localStorage.removeItem('alayasoad_parent_name');
    return null;
  }

  return token;
}

/**
 * Clear stale parent auth and notify app listeners
 */
function handleUnauthorizedResponse(endpoint: string, status: number): void {
  if (status !== 401 && status !== 403) return;

  const hadToken = !!getAuthToken();
  localStorage.removeItem('alayasoad_parent_token');
  localStorage.removeItem('alayasoad_parent_name');

  if (hadToken) {
    console.info(`Parent auth expired for ${endpoint}; signed out locally.`);
  }

  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
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
      handleUnauthorizedResponse('/api/parent/kids-progress', response.status);
      if (response.status === 401 || response.status === 403) return null;
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
    // Create a local safety snapshot before any remote sync operation.
    try {
      await createLocalProgressBackup();
    } catch (backupError) {
      console.warn('Pre-sync local backup failed:', backupError);
    }

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
      handleUnauthorizedResponse('/api/parent/kids-progress/sync', response.status);
      if (response.status === 401 || response.status === 403) return false;
      console.error('Failed to sync progress to server:', response.status);
      return false;
    }

    localStorage.setItem('alayasoad_last_sync_at', new Date().toISOString());
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

    localStorage.setItem('alayasoad_last_sync_at', new Date().toISOString());
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
      handleUnauthorizedResponse('/api/parent/profile', response.status);
      if (response.status === 401 || response.status === 403) return null;
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
      handleUnauthorizedResponse('/api/parent/pin', response.status);
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Session expired. Please log in again.' };
      }
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
 * Export all parent data as JSON (COPPA: parental right to review data)
 */
export async function exportParentData(): Promise<Blob | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/parent/data-export', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      handleUnauthorizedResponse('/api/parent/data-export', response.status);
      return null;
    }

    const data = await response.json();
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
}

/**
 * Delete parent account and all associated data (COPPA: parental right to delete)
 */
export async function deleteParentAccount(currentPin: string): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Not logged in' };

  try {
    const response = await fetch('/api/parent/account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPin })
    });

    if (!response.ok) {
      handleUnauthorizedResponse('/api/parent/account', response.status);
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Session expired. Please log in again.' };
      }
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to delete account' };
    }

    // Clear all local data
    localStorage.removeItem('alayasoad_parent_token');
    localStorage.removeItem('alayasoad_parent_name');
    localStorage.removeItem('alayasoad_coppa_consent');
    localStorage.removeItem('alayasoad_ai_tutor_enabled');
    localStorage.removeItem('alayasoad_sync_enabled');
    localStorage.removeItem('alayasoad_kids_mode');

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Log an AI tutor question for parental review (COPPA audit trail)
 */
export async function logTutorQuestion(questionSummary: string): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await fetch('/api/parent/ai-tutor-log', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ questionSummary: questionSummary.slice(0, 200) })
    });

    if (!response.ok) {
      handleUnauthorizedResponse('/api/parent/ai-tutor-log', response.status);
    }
  } catch (error) {
    // Non-critical, don't block the UI
    console.error('Error logging tutor question:', error);
  }
}

/**
 * Get AI tutor question log for parental review
 */
export async function getTutorLog(): Promise<Array<{ question_summary: string; created_at: string }>> {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const response = await fetch('/api/parent/ai-tutor-log', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      handleUnauthorizedResponse('/api/parent/ai-tutor-log', response.status);
      return [];
    }

    const data = await response.json();
    return data.logs || [];
  } catch (error) {
    console.error('Error fetching tutor log:', error);
    return [];
  }
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
