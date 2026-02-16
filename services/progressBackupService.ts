/**
 * Local Progress Backup Service
 * Creates/restores encrypted-at-rest browser backups for kids progress data.
 * This reduces risk of progress loss after app updates or account issues.
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
  type KidsProgress,
  type KidsLetterProgress,
  type KidsSurahProgress,
  type KidsStoryProgress,
} from './offlineDatabase';

const BACKUP_STORAGE_KEY = 'alayasoad_local_progress_backup_v1';

export interface ProgressBackupPayload {
  version: 1;
  createdAt: string;
  source: 'local-device';
  data: {
    progress: KidsProgress;
    letters: KidsLetterProgress[];
    surahs: KidsSurahProgress[];
    stories: KidsStoryProgress[];
  };
}

export interface ProgressBackupMeta {
  exists: boolean;
  createdAt: string | null;
  sizeBytes: number;
}

export async function createLocalProgressBackup(): Promise<ProgressBackupPayload> {
  const [progress, letters, surahs, stories] = await Promise.all([
    getKidsProgress(),
    getAllKidsLetterProgress(),
    getAllKidsSurahProgress(),
    getAllKidsStoryProgress(),
  ]);

  const payload: ProgressBackupPayload = {
    version: 1,
    createdAt: new Date().toISOString(),
    source: 'local-device',
    data: {
      progress,
      letters,
      surahs,
      stories,
    },
  };

  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function getLocalBackupMeta(): ProgressBackupMeta {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) {
      return { exists: false, createdAt: null, sizeBytes: 0 };
    }

    const parsed = JSON.parse(raw) as ProgressBackupPayload;
    return {
      exists: true,
      createdAt: parsed.createdAt || null,
      sizeBytes: raw.length,
    };
  } catch {
    return { exists: false, createdAt: null, sizeBytes: 0 };
  }
}

export function clearLocalBackup(): void {
  localStorage.removeItem(BACKUP_STORAGE_KEY);
}

export async function restoreLocalProgressBackup(): Promise<{ success: boolean; error?: string }> {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) {
      return { success: false, error: 'No local backup found' };
    }

    const parsed = JSON.parse(raw) as ProgressBackupPayload;
    if (parsed.version !== 1 || !parsed.data) {
      return { success: false, error: 'Backup format is invalid' };
    }

    const { progress, letters, surahs, stories } = parsed.data;

    // Restore main progress first.
    await updateKidsProgress({
      childName: progress.childName,
      totalStars: progress.totalStars,
      level: progress.level,
      badges: progress.badges,
      currentStreak: progress.currentStreak,
      lastPlayDate: progress.lastPlayDate,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
    });

    // Restore granular progress.
    for (const letter of letters) {
      await updateKidsLetterProgress(letter.id, letter.letterArabic, {
        timesPlayed: letter.timesPlayed,
        mastered: letter.mastered,
        starsEarned: letter.starsEarned,
        lastPracticed: letter.lastPracticed,
      });
    }

    for (const surah of surahs) {
      await updateKidsSurahProgress(surah.surahNumber, {
        versesHeard: surah.versesHeard,
        completed: surah.completed,
        starsEarned: surah.starsEarned,
        totalListens: surah.totalListens,
        lastPracticed: surah.lastPracticed,
      });
    }

    for (const story of stories) {
      await updateKidsStoryProgress(story.storyId, {
        timesViewed: story.timesViewed,
        completed: story.completed,
        starsEarned: story.starsEarned,
        lastViewed: story.lastViewed,
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message || 'Restore failed' };
  }
}
