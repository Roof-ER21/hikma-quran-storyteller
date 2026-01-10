/**
 * Prophet Narration Service
 *
 * Orchestrates scholarly narration for the Prophet Stories Library.
 * Combines Gemini TTS for story content with Islamic Network CDN for Quran recitation.
 *
 * Audio Flow per Section:
 * 1. Story content (TTS or prebaked MP3)
 * 2. For each verse: intro → Arabic recitation (CDN) → translation (TTS)
 * 3. For each hadith: source intro → hadith text (TTS)
 */

import {
  NarrationQueueItem,
  NarrationState,
  AdultProphetStory,
  StorySection,
  QuranVerse,
  HadithReference
} from '../types';
import { audioManager, RECITERS, DEFAULT_RECITER, formatTime } from './quranAudioService';
import { getGlobalVerseNumber } from './quranDataService';

// ============================================
// Configuration
// ============================================

const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio';
const SCHOLAR_VOICE = 'Charon'; // Calm, scholarly voice
const TRANSITION_DELAY = 800; // ms between audio segments
const TTS_RATE_LIMIT_DELAY = 1000; // ms delay before TTS calls to avoid rate limits
const PREBAKED_BASE_PATH = '/assets/prophets/audio';

// ============================================
// Service State
// ============================================

type StateListener = (state: NarrationState) => void;

class ProphetNarrationService {
  private queue: NarrationQueueItem[] = [];
  private currentIndex: number = 0;
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private reciter: string = DEFAULT_RECITER;
  private playbackSpeed: number = 1.0;
  private stateListeners: Set<StateListener> = new Set();
  private isInitialized: boolean = false;

  private state: NarrationState = {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentItem: null,
    currentIndex: 0,
    totalItems: 0,
    progress: 0,
    duration: 0,
    currentTime: 0,
    currentSectionId: undefined,
    currentStoryId: undefined,
    currentProphetName: undefined,
    error: undefined,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupAudioListeners();
    }
  }

  private setupAudioListeners(): void {
    if (!this.audio) return;

    this.audio.addEventListener('ended', () => {
      this.onItemEnded();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.updateState({
          currentTime: this.audio.currentTime,
          duration: this.audio.duration || 0,
          progress: this.audio.duration ? (this.audio.currentTime / this.audio.duration) * 100 : 0,
        });
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Prophet narration audio error:', e);
      this.updateState({ error: 'Audio playback error', isLoading: false });
      // Try next item in queue
      this.onItemEnded();
    });

    this.audio.addEventListener('loadstart', () => {
      this.updateState({ isLoading: true });
    });

    this.audio.addEventListener('canplay', () => {
      this.updateState({ isLoading: false });
    });
  }

  // ============================================
  // State Management
  // ============================================

  private updateState(partial: Partial<NarrationState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.stateListeners) {
      listener(this.state);
    }
  }

  /**
   * Subscribe to state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    // Immediately notify with current state
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  getState(): NarrationState {
    return { ...this.state };
  }

  // ============================================
  // Queue Building
  // ============================================

  /**
   * Build narration queue for a single section
   */
  private buildSectionQueue(
    section: StorySection,
    storyId: string,
    prophetName: string
  ): NarrationQueueItem[] {
    const queue: NarrationQueueItem[] = [];

    // 1. Section content (check for prebaked first, with TTS fallback text)
    const prebakedPath = `${PREBAKED_BASE_PATH}/sections/${storyId}-${section.id}.mp3`;
    queue.push({
      type: 'prebaked',
      content: prebakedPath,
      metadata: {
        sectionId: section.id,
        sectionTitle: section.title,
        fallbackText: section.content, // Store original text for TTS fallback
      },
    });

    // 2. Quranic verses
    if (section.verses && section.verses.length > 0) {
      for (const verse of section.verses) {
        // Verse intro (TTS) - needs to be longer for Gemini TTS to work reliably
        queue.push({
          type: 'tts',
          content: `Now, let us listen to the recitation from Surah ${verse.surah}, Verse ${verse.verse}.`,
          surah: verse.surah,
          verse: verse.verse,
          metadata: { sectionId: section.id },
        });

        // Arabic recitation (CDN)
        const globalVerse = getGlobalVerseNumber(verse.surah, verse.verse);
        const reciter = RECITERS.find(r => r.identifier === this.reciter) || RECITERS[0];
        const cdnUrl = `${AUDIO_CDN}/${reciter.bitrate}/${this.reciter}/${globalVerse}.mp3`;

        queue.push({
          type: 'quran-recitation',
          content: cdnUrl,
          surah: verse.surah,
          verse: verse.verse,
          metadata: { sectionId: section.id },
        });

        // Translation (TTS)
        queue.push({
          type: 'tts',
          content: verse.translation,
          surah: verse.surah,
          verse: verse.verse,
          metadata: {
            isTranslation: true,
            sectionId: section.id
          },
        });
      }
    }

    // 3. Hadith references
    if (section.hadiths && section.hadiths.length > 0) {
      for (const hadith of section.hadiths) {
        const hadithText = this.formatHadithNarration(hadith);
        queue.push({
          type: 'tts',
          content: hadithText,
          metadata: {
            isHadith: true,
            source: hadith.source,
            sectionId: section.id,
          },
        });
      }
    }

    return queue;
  }

  /**
   * Build queue for an entire story
   */
  private buildFullStoryQueue(story: AdultProphetStory): NarrationQueueItem[] {
    const queue: NarrationQueueItem[] = [];

    // Introduction
    queue.push({
      type: 'tts',
      content: `The Story of Prophet ${story.prophetName}, ${story.arabicName}. ${story.summary}`,
      metadata: { sectionTitle: 'Introduction' },
    });

    // Each section
    for (const section of story.sections) {
      const sectionQueue = this.buildSectionQueue(section, story.id, story.prophetName);
      queue.push(...sectionQueue);
    }

    // Key lessons
    if (story.keyLessons && story.keyLessons.length > 0) {
      const lessonsText = `Key lessons from the story of Prophet ${story.prophetName}: ${story.keyLessons.join('. ')}`;
      queue.push({
        type: 'tts',
        content: lessonsText,
        metadata: { sectionTitle: 'Key Lessons' },
      });
    }

    return queue;
  }

  private formatHadithNarration(hadith: HadithReference): string {
    const gradeNote = hadith.grade ? ` This hadith is graded ${hadith.grade}.` : '';
    return `As narrated in ${hadith.source}, ${hadith.book}: "${hadith.text}"${gradeNote}`;
  }

  // ============================================
  // Playback Control
  // ============================================

  /**
   * Narrate a single section
   */
  async narrateSection(
    section: StorySection,
    story: AdultProphetStory
  ): Promise<void> {
    this.queue = this.buildSectionQueue(section, story.id, story.prophetName);
    this.currentIndex = 0;

    this.updateState({
      currentStoryId: story.id,
      currentProphetName: story.prophetName,
      currentSectionId: section.id,
      totalItems: this.queue.length,
      currentIndex: 0,
    });

    await this.playCurrentItem();
  }

  /**
   * Narrate the full story from the beginning
   */
  async narrateFullStory(story: AdultProphetStory): Promise<void> {
    this.queue = this.buildFullStoryQueue(story);
    this.currentIndex = 0;

    this.updateState({
      currentStoryId: story.id,
      currentProphetName: story.prophetName,
      currentSectionId: story.sections[0]?.id,
      totalItems: this.queue.length,
      currentIndex: 0,
    });

    await this.playCurrentItem();
  }

  /**
   * Narrate from a specific section index
   */
  async narrateFromSection(
    story: AdultProphetStory,
    sectionIndex: number
  ): Promise<void> {
    // Build queue starting from specific section
    const queue: NarrationQueueItem[] = [];

    for (let i = sectionIndex; i < story.sections.length; i++) {
      const section = story.sections[i];
      const sectionQueue = this.buildSectionQueue(section, story.id, story.prophetName);
      queue.push(...sectionQueue);
    }

    // Add key lessons at the end
    if (story.keyLessons && story.keyLessons.length > 0) {
      const lessonsText = `Key lessons from the story of Prophet ${story.prophetName}: ${story.keyLessons.join('. ')}`;
      queue.push({
        type: 'tts',
        content: lessonsText,
        metadata: { sectionTitle: 'Key Lessons' },
      });
    }

    this.queue = queue;
    this.currentIndex = 0;

    this.updateState({
      currentStoryId: story.id,
      currentProphetName: story.prophetName,
      currentSectionId: story.sections[sectionIndex]?.id,
      totalItems: this.queue.length,
      currentIndex: 0,
    });

    await this.playCurrentItem();
  }

  /**
   * Play the current item in the queue
   */
  private async playCurrentItem(): Promise<void> {
    if (this.currentIndex >= this.queue.length) {
      this.updateState({
        isPlaying: false,
        isPaused: false,
        currentItem: null,
      });
      return;
    }

    const item = this.queue[this.currentIndex];
    this.updateState({
      isPlaying: true,
      isPaused: false,
      isLoading: true,
      currentItem: item,
      currentIndex: this.currentIndex,
      error: undefined,
    });

    try {
      switch (item.type) {
        case 'prebaked':
          await this.playPrebakedAudio(item.content);
          break;
        case 'quran-recitation':
          await this.playQuranRecitation(item.content);
          break;
        case 'tts':
          await this.playTTS(item.content);
          break;
      }
    } catch (error) {
      console.error('Error playing narration item:', error);
      // If prebaked fails, try TTS fallback for section content
      if (item.type === 'prebaked') {
        await this.playTTSFallback(item);
      } else {
        this.updateState({ error: 'Playback error, skipping to next' });
        this.onItemEnded();
      }
    }
  }

  private async playPrebakedAudio(url: string): Promise<void> {
    if (!this.audio) return;

    // Check if prebaked file exists
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('Prebaked audio not found');
      }
    } catch {
      throw new Error('Prebaked audio not available');
    }

    this.audio.src = url;
    this.audio.playbackRate = this.playbackSpeed;
    await this.audio.play();
    this.updateState({ isLoading: false });
  }

  private async playQuranRecitation(url: string): Promise<void> {
    if (!this.audio) return;

    this.audio.src = url;
    this.audio.playbackRate = this.playbackSpeed;
    await this.audio.play();
    this.updateState({ isLoading: false });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async playTTS(text: string): Promise<void> {
    try {
      // Add delay before TTS to avoid rate limits
      await this.sleep(TTS_RATE_LIMIT_DELAY);

      const { speakText } = await import('./geminiService');

      // Gemini TTS struggles with very short text - pad if needed
      let processedText = text;
      if (text.length < 30) {
        processedText = `${text}. Please listen carefully.`;
      }

      // Truncate long text for TTS (API limit)
      const truncatedText = processedText.length > 500 ? processedText.slice(0, 497) + '...' : processedText;

      console.log('[ProphetNarration] Calling TTS for:', truncatedText.slice(0, 40) + '...');
      const audioBuffer = await speakText(truncatedText, { voice: SCHOLAR_VOICE });

      if (!audioBuffer) {
        throw new Error('TTS returned no audio - check API key configuration');
      }

      // Convert AudioBuffer to playable audio
      await this.playAudioBuffer(audioBuffer);
    } catch (error) {
      console.error('TTS error:', error);
      this.updateState({ error: 'Voice narration unavailable - check API settings' });
      throw error;
    }
  }

  private async playTTSFallback(item: NarrationQueueItem): Promise<void> {
    // For prebaked content that failed, try TTS with the fallback text
    const fallbackText = item.metadata?.fallbackText;

    if (fallbackText) {
      console.log('Prebaked audio not found, using TTS fallback');
      try {
        await this.playTTS(fallbackText);
        return;
      } catch (error) {
        console.error('TTS fallback also failed:', error);
      }
    } else {
      console.log('Prebaked audio not found and no fallback text, skipping');
    }

    this.onItemEnded();
  }

  private async playAudioBuffer(buffer: AudioBuffer): Promise<void> {
    // Stop any existing playback
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }

    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.playbackRate.value = this.playbackSpeed;
    this.currentSource.connect(this.audioContext.destination);

    // Track progress
    const startTime = this.audioContext.currentTime;
    const duration = buffer.duration;

    const updateProgress = () => {
      if (!this.audioContext || !this.state.isPlaying || this.state.isPaused) return;

      const elapsed = this.audioContext.currentTime - startTime;
      this.updateState({
        currentTime: elapsed,
        duration: duration,
        progress: (elapsed / duration) * 100,
      });

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      }
    };

    this.currentSource.onended = () => {
      this.updateState({ isLoading: false });
      this.onItemEnded();
    };

    this.currentSource.start();
    this.updateState({ isLoading: false });
    requestAnimationFrame(updateProgress);
  }

  private onItemEnded(): void {
    // Add transition delay between items
    setTimeout(() => {
      this.currentIndex++;
      if (this.currentIndex < this.queue.length) {
        this.playCurrentItem();
      } else {
        // Queue complete
        this.updateState({
          isPlaying: false,
          isPaused: false,
          currentItem: null,
          progress: 100,
        });
      }
    }, TRANSITION_DELAY);
  }

  // ============================================
  // Playback Controls
  // ============================================

  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
    this.updateState({ isPlaying: false, isPaused: true });
  }

  async resume(): Promise<void> {
    if (this.audio && this.audio.paused && this.audio.src) {
      await this.audio.play();
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.updateState({ isPlaying: true, isPaused: false });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }
    this.queue = [];
    this.currentIndex = 0;
    this.updateState({
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      currentItem: null,
      currentIndex: 0,
      totalItems: 0,
      progress: 0,
      currentTime: 0,
      duration: 0,
    });
  }

  async skipToNext(): Promise<void> {
    if (this.currentIndex < this.queue.length - 1) {
      if (this.audio) {
        this.audio.pause();
      }
      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch {}
        this.currentSource = null;
      }
      this.currentIndex++;
      await this.playCurrentItem();
    }
  }

  async skipToPrevious(): Promise<void> {
    if (this.currentIndex > 0) {
      if (this.audio) {
        this.audio.pause();
      }
      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch {}
        this.currentSource = null;
      }
      this.currentIndex--;
      await this.playCurrentItem();
    }
  }

  /**
   * Skip to a specific section in the queue
   */
  async skipToSection(sectionId: string): Promise<void> {
    const sectionIndex = this.queue.findIndex(
      item => item.metadata?.sectionId === sectionId
    );
    if (sectionIndex >= 0) {
      if (this.audio) {
        this.audio.pause();
      }
      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch {}
        this.currentSource = null;
      }
      this.currentIndex = sectionIndex;
      await this.playCurrentItem();
    }
  }

  // ============================================
  // Settings
  // ============================================

  setReciter(reciterId: string): void {
    const reciter = RECITERS.find(r => r.identifier === reciterId);
    if (reciter) {
      this.reciter = reciterId;
    }
  }

  getReciter(): string {
    return this.reciter;
  }

  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.5, Math.min(2.0, speed));
    if (this.audio) {
      this.audio.playbackRate = this.playbackSpeed;
    }
    if (this.currentSource) {
      this.currentSource.playbackRate.value = this.playbackSpeed;
    }
  }

  getSpeed(): number {
    return this.playbackSpeed;
  }

  // ============================================
  // Utilities
  // ============================================

  /**
   * Estimate duration for a story in minutes
   */
  estimateStoryDuration(story: AdultProphetStory): number {
    let totalSeconds = 0;

    // Summary intro: ~10 seconds
    totalSeconds += 10;

    for (const section of story.sections) {
      // Content: ~150 words per minute reading speed
      const wordCount = section.content.split(/\s+/).length;
      totalSeconds += (wordCount / 150) * 60;

      // Verses: ~20 seconds each (intro + recitation + translation)
      totalSeconds += (section.verses?.length || 0) * 20;

      // Hadiths: ~15 seconds each
      totalSeconds += (section.hadiths?.length || 0) * 15;

      // Transition delays
      totalSeconds += 2;
    }

    // Key lessons: ~15 seconds
    totalSeconds += 15;

    return Math.ceil(totalSeconds / 60);
  }

  /**
   * Format estimated duration for display
   */
  formatDuration(minutes: number): string {
    if (minutes < 1) return '< 1 min';
    if (minutes === 1) return '1 min';
    return `${minutes} mins`;
  }
}

// Export singleton instance
export const prophetNarrationService = new ProphetNarrationService();

// Export utilities
export { RECITERS, DEFAULT_RECITER, formatTime };
