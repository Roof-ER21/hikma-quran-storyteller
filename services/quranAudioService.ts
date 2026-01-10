/**
 * Quran Audio Service
 * Handles audio recitation streaming from Islamic Network CDN
 *
 * Audio CDN: https://cdn.islamic.network/quran/audio
 * Formats: 64kbps, 128kbps, 192kbps
 */

import { Reciter } from '../types';
import { getGlobalVerseNumber } from './quranDataService';

// Audio CDN Base URL
const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio';
const OFFLINE_SURAHS = new Set([105, 106, 107, 108, 109, 110, 111, 112, 113, 114]);
const OFFLINE_RECITERS = new Set(['ar.alafasy', 'ar.husary', 'ar.minshawimujawwad']);

// Available reciters with their identifiers
export const RECITERS: Reciter[] = [
  { identifier: 'ar.alafasy', name: 'مشاري العفاسي', englishName: 'Mishary Rashid Alafasy', format: 'mp3', bitrate: '128' },
  { identifier: 'ar.abdulbasitmurattal', name: 'عبد الباسط', englishName: 'Abdul Basit (Murattal)', format: 'mp3', bitrate: '128' },
  { identifier: 'ar.abdulsamad', name: 'عبد الباسط عبد الصمد', englishName: 'Abdul Basit Abdul Samad', format: 'mp3', bitrate: '64' },
  { identifier: 'ar.hudhaify', name: 'علي الحذيفي', englishName: 'Ali Al-Hudhaify', format: 'mp3', bitrate: '128' },
  { identifier: 'ar.husary', name: 'محمود خليل الحصري', englishName: 'Mahmoud Khalil Al-Husary', format: 'mp3', bitrate: '128' },
  { identifier: 'ar.husarymujawwad', name: 'الحصري (مجود)', englishName: 'Al-Husary (Mujawwad)', format: 'mp3', bitrate: '128' },
  { identifier: 'ar.maaborani', name: 'ماهر المعيقلي', englishName: 'Maher Al-Muaiqly', format: 'mp3', bitrate: '128' },
  { identifier: 'ar.minshawi', name: 'محمد صديق المنشاوي', englishName: 'Muhammad Siddiq Al-Minshawi', format: 'mp3', bitrate: '128' },
  { identifier: 'ar.minshawimujawwad', name: 'المنشاوي (مجود)', englishName: 'Al-Minshawi (Mujawwad)', format: 'mp3', bitrate: '64' },
  { identifier: 'ar.shaatree', name: 'أبو بكر الشاطري', englishName: 'Abu Bakr Al-Shatri', format: 'mp3', bitrate: '128' },
];

// Default reciter
export const DEFAULT_RECITER = 'ar.alafasy';

/**
 * Get the audio URL for a specific verse
 * @param surahNumber - Surah number (1-114)
 * @param verseNumber - Verse number within the surah
 * @param reciterId - Reciter identifier (default: ar.alafasy)
 * @returns Full URL to the audio file
 */
export function getVerseAudioUrl(
  surahNumber: number,
  verseNumber: number,
  reciterId: string = DEFAULT_RECITER
): string {
  const reciter = RECITERS.find(r => r.identifier === reciterId);
  const bitrate = reciter?.bitrate || '128';

  // Get global verse number (ayah number across entire Quran)
  const globalVerseNumber = getGlobalVerseNumber(surahNumber, verseNumber);

  return `${AUDIO_CDN}/${bitrate}/${reciterId}/${globalVerseNumber}.mp3`;
}

// Audio state management
class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentVerse: { surah: number; verse: number } | null = null;
  private reciter: string = DEFAULT_RECITER;
  private isPlaying: boolean = false;
  private lastSourceOffline: boolean = false;
  private onEndedCallback: (() => void) | null = null;
  private onTimeUpdateCallback: ((currentTime: number, duration: number) => void) | null = null;
  private onVerseChangeCallback: ((surah: number, verse: number) => void) | null = null;
  private playlist: { surah: number; verse: number }[] = [];
  private playlistIndex: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener('ended', () => {
      if (this.playlistIndex < this.playlist.length - 1) {
        this.playlistIndex++;
        this.playVerse(this.playlist[this.playlistIndex].surah, this.playlist[this.playlistIndex].verse);
      } else {
        this.isPlaying = false;
        this.onEndedCallback?.();
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.onTimeUpdateCallback?.(this.audio.currentTime, this.audio.duration);
      }
    });

    this.audio.addEventListener('error', async (e) => {
      console.error('Audio playback error:', e);
      // If offline asset failed, retry with CDN
      if (this.lastSourceOffline && this.currentVerse) {
        const { surah, verse } = this.currentVerse;
        const remoteUrl = this.buildRemoteUrl(surah, verse);
        this.lastSourceOffline = false;
        try {
          this.audio!.src = remoteUrl;
          await this.audio!.play();
          this.isPlaying = true;
          return;
        } catch (err) {
          console.error('Fallback to CDN failed:', err);
        }
      }
      this.isPlaying = false;
    });
  }

  /**
   * Get the audio URL for a specific verse
   */
  getAudioUrl(surahNumber: number, verseNumber: number, reciterId: string = this.reciter): string {
    if (OFFLINE_SURAHS.has(surahNumber) && OFFLINE_RECITERS.has(reciterId)) {
      this.lastSourceOffline = true;
      // Prefer reciter-specific offline path, then default legacy path
      const reciterPath = `/assets/quran/offline/${reciterId}/${surahNumber}/${verseNumber}.mp3`;
      return reciterPath;
    }
    if (OFFLINE_SURAHS.has(surahNumber) && reciterId === DEFAULT_RECITER) {
      this.lastSourceOffline = true;
      return `/assets/quran/offline/${surahNumber}/${verseNumber}.mp3`; // legacy path for default
    }
    this.lastSourceOffline = false;
    return this.buildRemoteUrl(surahNumber, verseNumber, reciterId);
  }

  private buildRemoteUrl(surahNumber: number, verseNumber: number, reciterId: string = this.reciter): string {
    const globalVerseNumber = getGlobalVerseNumber(surahNumber, verseNumber);
    const reciter = RECITERS.find(r => r.identifier === reciterId) || RECITERS[0];
    return `${AUDIO_CDN}/${reciter.bitrate}/${reciter.identifier}/${globalVerseNumber}.mp3`;
  }

  /**
   * Play a specific verse
   */
  async playVerse(surahNumber: number, verseNumber: number): Promise<void> {
    if (!this.audio) return;

    const url = this.getAudioUrl(surahNumber, verseNumber);
    this.audio.src = url;
    this.currentVerse = { surah: surahNumber, verse: verseNumber };
    this.onVerseChangeCallback?.(surahNumber, verseNumber);

    try {
      await this.audio.play();
      this.isPlaying = true;
    } catch (error: any) {
      // Some browsers throw AbortError if play is interrupted; retry once
      if (error?.name === 'AbortError') {
        try {
          await this.audio.play();
          this.isPlaying = true;
          return;
        } catch (err2) {
          console.error('Failed to play audio after retry:', err2);
          throw err2;
        }
      }
      // If the chosen reciter/URL fails (404/NotSupported), fallback to default reciter
      if (this.reciter !== DEFAULT_RECITER) {
        try {
          const fallbackUrl = this.buildRemoteUrl(surahNumber, verseNumber, DEFAULT_RECITER);
          this.audio.src = fallbackUrl;
          this.reciter = DEFAULT_RECITER;
          await this.audio.play();
          this.isPlaying = true;
          return;
        } catch (err3) {
          console.error('Fallback to default reciter failed:', err3);
        }
      }
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Play multiple verses (surah or range)
   */
  async playSurah(surahNumber: number, startVerse: number = 1, endVerse?: number): Promise<void> {
    this.playlist = [];

    // Build playlist
    const totalVerses = endVerse || 286; // Max verses in any surah (Baqarah)
    for (let v = startVerse; v <= totalVerses; v++) {
      this.playlist.push({ surah: surahNumber, verse: v });
    }

    this.playlistIndex = 0;
    if (this.playlist.length > 0) {
      await this.playVerse(this.playlist[0].surah, this.playlist[0].verse);
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.audio) {
      try {
        await this.audio.play();
        this.isPlaying = true;
      } catch (error) {
        console.error('Failed to resume audio:', error);
      }
    }
  }

  /**
   * Toggle play/pause
   */
  async toggle(): Promise<void> {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.resume();
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.playlist = [];
      this.playlistIndex = 0;
    }
  }

  /**
   * Skip to next verse
   */
  async next(): Promise<void> {
    if (this.playlistIndex < this.playlist.length - 1) {
      this.playlistIndex++;
      await this.playVerse(this.playlist[this.playlistIndex].surah, this.playlist[this.playlistIndex].verse);
    }
  }

  /**
   * Go to previous verse
   */
  async previous(): Promise<void> {
    if (this.playlistIndex > 0) {
      this.playlistIndex--;
      await this.playVerse(this.playlist[this.playlistIndex].surah, this.playlist[this.playlistIndex].verse);
    }
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    if (this.audio) {
      this.audio.playbackRate = speed;
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Change reciter
   */
  setReciter(reciterId: string): void {
    const reciter = RECITERS.find(r => r.identifier === reciterId);
    if (reciter) {
      this.reciter = reciterId;
      // If currently playing, reload with new reciter
      if (this.isPlaying && this.currentVerse) {
        this.playVerse(this.currentVerse.surah, this.currentVerse.verse);
      }
    }
  }

  /**
   * Get current state
   */
  getState(): {
    isPlaying: boolean;
    currentVerse: { surah: number; verse: number } | null;
    reciter: string;
    currentTime: number;
    duration: number;
  } {
    return {
      isPlaying: this.isPlaying,
      currentVerse: this.currentVerse,
      reciter: this.reciter,
      currentTime: this.audio?.currentTime || 0,
      duration: this.audio?.duration || 0,
    };
  }

  /**
   * Set callbacks
   */
  onEnded(callback: () => void): void {
    this.onEndedCallback = callback;
  }

  onTimeUpdate(callback: (currentTime: number, duration: number) => void): void {
    this.onTimeUpdateCallback = callback;
  }

  onVerseChange(callback: (surah: number, verse: number) => void): void {
    this.onVerseChangeCallback = callback;
  }

  /**
   * Preload audio for faster playback
   */
  preload(surahNumber: number, verseNumber: number): void {
    const url = this.getAudioUrl(surahNumber, verseNumber);
    const preloadAudio = new Audio();
    preloadAudio.preload = 'auto';
    preloadAudio.src = url;
  }

  /**
   * Preload multiple verses
   */
  preloadRange(surahNumber: number, startVerse: number, count: number = 5): void {
    for (let i = 0; i < count; i++) {
      this.preload(surahNumber, startVerse + i);
    }
  }
}

// Export singleton instance
export const audioManager = new AudioManager();

/**
 * Utility function to download audio for offline use
 */
export async function downloadAudio(
  surahNumber: number,
  verseNumber: number,
  reciterId: string = DEFAULT_RECITER
): Promise<Blob> {
  const globalVerseNumber = getGlobalVerseNumber(surahNumber, verseNumber);
  const reciter = RECITERS.find(r => r.identifier === reciterId) || RECITERS[0];
  const url = `${AUDIO_CDN}/${reciter.bitrate}/${reciter.identifier}/${globalVerseNumber}.mp3`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Download entire surah audio
 */
export async function downloadSurahAudio(
  surahNumber: number,
  totalVerses: number,
  reciterId: string = DEFAULT_RECITER,
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, Blob>> {
  const audioBlobs = new Map<number, Blob>();

  for (let v = 1; v <= totalVerses; v++) {
    try {
      const blob = await downloadAudio(surahNumber, v, reciterId);
      audioBlobs.set(v, blob);
      onProgress?.(v, totalVerses);
    } catch (error) {
      console.error(`Failed to download verse ${v}:`, error);
    }
  }

  return audioBlobs;
}

/**
 * Get estimated download size for a surah
 */
export function estimateSurahSize(totalVerses: number, bitrate: '64' | '128' | '192' = '128'): string {
  // Average verse duration ~10 seconds, bitrate in kbps
  const bitrateKbps = parseInt(bitrate);
  const avgDurationSeconds = 10;
  const sizeBytes = (bitrateKbps * 1000 / 8) * avgDurationSeconds * totalVerses;

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }
  return `${Math.round(sizeBytes / (1024 * 1024))} MB`;
}

/**
 * Format time for display (seconds to MM:SS)
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
