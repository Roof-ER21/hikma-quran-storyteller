import React, { useState, useEffect } from 'react';
import { offlineAssetManifest } from '../data/offlineAssets';
import {
  db,
  getStorageInfo,
  getEnhancedStorageInfo,
  cacheSurah,
  cacheAudio,
  getCachedSurah,
  clearAllData,
  clearAudioCache,
  clearStoryCache,
  updateDownloadProgress,
  getDownloadProgress,
  cacheStory,
  getCachedStory,
  StoryLanguage
} from '../services/offlineDatabase';
import { getSurahWithTranslation, getAllSurahs } from '../services/quranDataService';
import { getVerseAudioUrl, DEFAULT_RECITER } from '../services/quranAudioService';
import { generateStory, extractScenes, cleanStoryText } from '../services/geminiService';

interface DownloadManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StorageStats {
  surahCount: number;
  audioCount: number;
  audioSizeMB: number;
  bookmarkCount: number;
  storyCount: number;
  storyImageCount: number;
  estimatedTotalMB: number;
}

type DownloadType = 'all-text' | 'juz' | 'surah' | 'stories';

// Story generation configuration
const PROPHETS = [
  "Adam", "Idris", "Nuh (Noah)", "Hud", "Saleh",
  "Ibrahim (Abraham)", "Lut (Lot)", "Ishmael", "Ishaq (Isaac)", "Yaqub (Jacob)",
  "Yusuf (Joseph)", "Ayyub (Job)", "Shu'aib", "Musa (Moses)", "Harun (Aaron)",
  "Dhul-Kifl", "Dawud (David)", "Sulaiman (Solomon)", "Ilyas (Elijah)", "Al-Yasa (Elisha)",
  "Yunus (Jonah)", "Zakariyah", "Yahya (John)", "Isa (Jesus)"
];

const TOPICS = [
  "General Life", "Patience", "Trust in God", "Leadership",
  "Family", "Miracles", "Justice"
];

const STORY_LANGUAGES: StoryLanguage[] = ['english', 'arabic_egyptian'];

const JUZS = [
  { number: 1, name: 'Alif Lam Mim', surahs: [1, 2], verseRange: '1:1-2:141' },
  { number: 2, name: "Sayaqul", surahs: [2], verseRange: '2:142-2:252' },
  { number: 3, name: 'Tilka ar-Rusul', surahs: [2, 3], verseRange: '2:253-3:92' },
  { number: 4, name: "Lan Tana Lu", surahs: [3, 4], verseRange: '3:93-4:23' },
  { number: 5, name: 'Wal Muhsanat', surahs: [4], verseRange: '4:24-4:147' },
  { number: 6, name: "La Yuhibbullah", surahs: [4, 5], verseRange: '4:148-5:81' },
  { number: 7, name: 'Wa Iza Samiu', surahs: [5, 6], verseRange: '5:82-6:110' },
  { number: 8, name: "Wa Lau Annana", surahs: [6, 7], verseRange: '6:111-7:87' },
  { number: 9, name: 'Qal al-Mala', surahs: [7, 8], verseRange: '7:88-8:40' },
  { number: 10, name: "Wa A'lamu", surahs: [8, 9], verseRange: '8:41-9:92' },
  // Short surahs Juz (most commonly memorized)
  { number: 30, name: "'Amma", surahs: Array.from({length: 37}, (_, i) => 78 + i), verseRange: '78:1-114:6' },
];

const DownloadManager: React.FC<DownloadManagerProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadType, setDownloadType] = useState<DownloadType>('all-text');
  const [selectedJuz, setSelectedJuz] = useState<number>(30);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [offlinePackProgress, setOfflinePackProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen]);

  const loadStats = async () => {
    const info = await getEnhancedStorageInfo();
    setStats(info);
  };

  const downloadOfflinePack = async () => {
    setOfflinePackProgress({ current: 0, total: offlineAssetManifest.length, status: 'Caching assets...' });
    try {
      const cache = await caches.open('hikma-offline');
      let done = 0;
      for (const asset of offlineAssetManifest) {
        try {
          await cache.add(asset);
        } catch {
          // ignore missing assets (partial reciter coverage)
        }
        done++;
        setOfflinePackProgress({
          current: done,
          total: offlineAssetManifest.length,
          status: `Cached ${done}/${offlineAssetManifest.length}`
        });
      }
      setOfflinePackProgress({ current: offlineAssetManifest.length, total: offlineAssetManifest.length, status: 'Offline pack ready' });
      setTimeout(() => setOfflinePackProgress(null), 1500);
    } catch {
      setOfflinePackProgress({ current: 0, total: offlineAssetManifest.length, status: 'Failed to cache offline pack' });
    }
  };

  // Download all stories (24 prophets × 7 topics × 2 languages = 336 stories)
  const downloadAllStories = async () => {
    if (!isOnline) {
      alert('You need to be online to download stories.');
      return;
    }

    setLoading(true);
    const totalStories = PROPHETS.length * TOPICS.length * STORY_LANGUAGES.length;
    let downloaded = 0;

    setDownloadProgress({
      current: 0,
      total: totalStories,
      status: 'Generating stories...'
    });

    try {
      for (const prophet of PROPHETS) {
        for (const topic of TOPICS) {
          for (const language of STORY_LANGUAGES) {
            // Check if already cached
            const cached = await getCachedStory(prophet, topic, language);
            if (!cached) {
              try {
                // Generate story
                const content = await generateStory(prophet, topic, language);
                if (content) {
                  const scenePrompts = extractScenes(content);
                  const cleanContent = cleanStoryText(content);

                  // Cache story (without images for now to save time)
                  await cacheStory(
                    prophet,
                    topic,
                    language,
                    content,
                    cleanContent,
                    [], // images generated on-demand
                    scenePrompts
                  );
                }
              } catch (e) {
                console.error(`Failed to generate story: ${prophet} - ${topic} (${language})`);
              }
            }

            downloaded++;
            setDownloadProgress({
              current: downloaded,
              total: totalStories,
              status: `${prophet} - ${topic} (${language === 'arabic_egyptian' ? 'مصري' : 'EN'})`
            });

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      await loadStats();
      setDownloadProgress({ current: totalStories, total: totalStories, status: 'Stories downloaded!' });
      setTimeout(() => setDownloadProgress(null), 2000);
    } catch (error) {
      console.error('Story download failed:', error);
      setDownloadProgress({ current: downloaded, total: totalStories, status: 'Download failed.' });
    } finally {
      setLoading(false);
    }
  };

  const downloadAllText = async () => {
    if (!isOnline) {
      alert('You need to be online to download content.');
      return;
    }

    setLoading(true);
    setDownloadProgress({ current: 0, total: 114, status: 'Downloading Quran text...' });

    try {
      for (let i = 1; i <= 114; i++) {
        // Check if already cached
        const cached = await getCachedSurah(i, 'en.sahih');
        if (!cached) {
          const surah = await getSurahWithTranslation(i, 'en.sahih');
          await cacheSurah(surah, 'en.sahih');
        }
        setDownloadProgress({ current: i, total: 114, status: `Downloaded Surah ${i}/114` });
      }

      await loadStats();
      setDownloadProgress({ current: 114, total: 114, status: 'Download complete!' });

      setTimeout(() => setDownloadProgress(null), 2000);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadProgress({ current: 0, total: 114, status: 'Download failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const downloadJuzAudio = async (juzNumber: number) => {
    if (!isOnline) {
      alert('You need to be online to download content.');
      return;
    }

    const juz = JUZS.find(j => j.number === juzNumber);
    if (!juz) return;

    setLoading(true);
    let downloaded = 0;
    let total = 0;

    // Calculate total verses
    for (const surahNum of juz.surahs) {
      const surah = await getSurahWithTranslation(surahNum, 'en.sahih');
      total += surah.numberOfAyahs;
    }

    setDownloadProgress({ current: 0, total, status: `Downloading Juz ${juzNumber} audio...` });

    try {
      for (const surahNum of juz.surahs) {
        const surah = await getSurahWithTranslation(surahNum, 'en.sahih');

        for (let verse = 1; verse <= surah.numberOfAyahs; verse++) {
          const audioUrl = getVerseAudioUrl(surahNum, verse, DEFAULT_RECITER);

          try {
            const response = await fetch(audioUrl);
            const blob = await response.blob();
            await cacheAudio(surahNum, verse, DEFAULT_RECITER, blob);
          } catch (e) {
            console.error(`Failed to download audio for ${surahNum}:${verse}`);
          }

          downloaded++;
          setDownloadProgress({
            current: downloaded,
            total,
            status: `Downloaded ${downloaded}/${total} verses`
          });
        }
      }

      await loadStats();
      setDownloadProgress({ current: total, total, status: 'Download complete!' });
      setTimeout(() => setDownloadProgress(null), 2000);
    } catch (error) {
      console.error('Audio download failed:', error);
      setDownloadProgress({ current: downloaded, total, status: 'Download failed.' });
    } finally {
      setLoading(false);
    }
  };

  const downloadSurahAudio = async (surahNumber: number) => {
    if (!isOnline) {
      alert('You need to be online to download content.');
      return;
    }

    setLoading(true);

    try {
      const surah = await getSurahWithTranslation(surahNumber, 'en.sahih');
      const total = surah.numberOfAyahs;

      setDownloadProgress({ current: 0, total, status: `Downloading ${surah.englishName}...` });

      for (let verse = 1; verse <= total; verse++) {
        const audioUrl = getVerseAudioUrl(surahNumber, verse, DEFAULT_RECITER);

        try {
          const response = await fetch(audioUrl);
          const blob = await response.blob();
          await cacheAudio(surahNumber, verse, DEFAULT_RECITER, blob);
        } catch (e) {
          console.error(`Failed to download audio for ${surahNumber}:${verse}`);
        }

        setDownloadProgress({
          current: verse,
          total,
          status: `Downloaded ${verse}/${total} verses`
        });
      }

      await loadStats();
      setDownloadProgress({ current: total, total, status: 'Download complete!' });
      setTimeout(() => setDownloadProgress(null), 2000);
    } catch (error) {
      console.error('Audio download failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async (type: 'all' | 'audio' | 'stories') => {
    const messages: Record<string, string> = {
      all: 'This will delete all offline data including bookmarks and reading history. Continue?',
      audio: 'This will delete all cached audio files. Continue?',
      stories: 'This will delete all cached stories. Continue?'
    };

    const confirm = window.confirm(messages[type]);

    if (confirm) {
      if (type === 'all') {
        await clearAllData();
      } else if (type === 'audio') {
        await clearAudioCache();
      } else if (type === 'stories') {
        await clearStoryCache();
      }
      await loadStats();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-screen-safe overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 to-rose-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="fas fa-download"></i>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Offline Downloads</h2>
              <p className="text-rose-200 text-xs">
                {isOnline ? 'Connected' : 'Offline Mode'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close download manager"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc((var(--app-vh,1vh)*100)-180px)]">
          {/* Storage Stats */}
          {stats && (
            <div className="bg-stone-50 rounded-xl p-4 mb-4">
              <h3 className="font-medium text-stone-700 mb-3 flex items-center gap-2">
                <i className="fas fa-database text-rose-600"></i>
                Storage Usage
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-rose-700">{stats.surahCount}</p>
                  <p className="text-xs text-stone-500">Surahs</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-rose-700">{stats.audioCount}</p>
                  <p className="text-xs text-stone-500">Audio</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-amber-600">{stats.storyCount || 0}</p>
                  <p className="text-xs text-stone-500">Stories</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-rose-700">{stats.audioSizeMB}</p>
                  <p className="text-xs text-stone-500">MB Audio</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-rose-700">{stats.bookmarkCount}</p>
                  <p className="text-xs text-stone-500">Bookmarks</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xl font-bold text-stone-600">{stats.estimatedTotalMB}</p>
                  <p className="text-xs text-stone-500">Total MB</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleClearData('stories')}
                  className="text-amber-600 hover:text-amber-700"
                >
                  Clear Stories
                </button>
                <button
                  onClick={() => handleClearData('audio')}
                  className="text-rose-600 hover:text-rose-700"
                >
                  Clear Audio
                </button>
                <button
                  onClick={() => handleClearData('all')}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-800 font-semibold">Offline Pack</p>
                <p className="text-sm text-amber-700">Kids narrations + short surahs (multiple reciters) + Seerah audio.</p>
              </div>
              <button
                onClick={downloadOfflinePack}
                className="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm shadow hover:bg-amber-700"
              >
                Download
              </button>
            </div>
            {offlinePackProgress && (
              <div className="text-sm text-amber-800 mt-2">
                {offlinePackProgress.status} ({offlinePackProgress.current}/{offlinePackProgress.total})
                <div className="w-full bg-white rounded-full h-2 mt-1">
                  <div
                    className="h-2 bg-amber-500 rounded-full"
                    style={{ width: `${(offlinePackProgress.current / offlineAssetManifest.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Download Progress */}
          {downloadProgress && (
            <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
              <div className="flex items-center gap-3 mb-2">
                <i className="fas fa-spinner fa-spin text-amber-600"></i>
                <span className="text-amber-800 font-medium">{downloadProgress.status}</span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-amber-700 mt-1 text-right">
                {downloadProgress.current} / {downloadProgress.total}
              </p>
            </div>
          )}

          {/* Download Options */}
          <div className="space-y-4">
            {/* Download Type Selector */}
            <div className="flex bg-stone-100 rounded-lg p-1 flex-wrap gap-1">
              <button
                onClick={() => setDownloadType('stories')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors min-w-[70px] ${
                  downloadType === 'stories'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <i className="fas fa-book-open mr-1"></i>
                Stories
              </button>
              <button
                onClick={() => setDownloadType('all-text')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors min-w-[70px] ${
                  downloadType === 'all-text'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <i className="fas fa-book mr-1"></i>
                Quran
              </button>
              <button
                onClick={() => setDownloadType('juz')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors min-w-[70px] ${
                  downloadType === 'juz'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <i className="fas fa-layer-group mr-1"></i>
                Juz
              </button>
              <button
                onClick={() => setDownloadType('surah')}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors min-w-[70px] ${
                  downloadType === 'surah'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <i className="fas fa-file-alt mr-1"></i>
                Surah
              </button>
            </div>

            {/* Download Stories */}
            {downloadType === 'stories' && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-book-open text-white text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900">Prophet Stories</h4>
                    <p className="text-sm text-amber-700 mb-2">
                      Download 336 stories (24 prophets × 7 topics × 2 languages)
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">English</span>
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">مصري</span>
                    </div>
                    <p className="text-xs text-amber-600 mb-3">
                      <i className="fas fa-info-circle mr-1"></i>
                      Stories are AI-generated and cached. Images load on-demand.
                    </p>
                    <button
                      onClick={downloadAllStories}
                      disabled={loading || !isOnline}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Generating Stories...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download"></i>
                          Download All Stories
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Download All Text */}
            {downloadType === 'all-text' && (
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-book-quran text-rose-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-stone-800">Complete Quran Text</h4>
                    <p className="text-sm text-stone-500 mb-3">
                      Download all 114 Surahs with English translation (~2 MB)
                    </p>
                    <button
                      onClick={downloadAllText}
                      disabled={loading || !isOnline}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download"></i>
                          Download All Text
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Download Juz Audio */}
            {downloadType === 'juz' && (
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <h4 className="font-semibold text-stone-800 mb-3">Download Juz Audio</h4>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {JUZS.map(juz => (
                    <button
                      key={juz.number}
                      onClick={() => setSelectedJuz(juz.number)}
                      className={`w-full p-3 rounded-lg text-left transition-all flex items-center justify-between ${
                        selectedJuz === juz.number
                          ? 'bg-rose-100 border-2 border-rose-500'
                          : 'bg-stone-50 hover:bg-stone-100 border-2 border-transparent'
                      }`}
                    >
                      <div>
                        <span className="font-medium">Juz {juz.number}</span>
                        <span className="text-stone-500 ml-2 text-sm">{juz.name}</span>
                      </div>
                      {juz.number === 30 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => downloadJuzAudio(selectedJuz)}
                  disabled={loading || !isOnline}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-volume-up"></i>
                      Download Juz {selectedJuz} Audio
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Download Single Surah */}
            {downloadType === 'surah' && (
              <div className="bg-white border border-stone-200 rounded-xl p-4">
                <h4 className="font-semibold text-stone-800 mb-3">Download Surah Audio</h4>
                <select
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(Number(e.target.value))}
                  className="w-full p-3 border border-stone-200 rounded-lg mb-4 text-stone-700"
                >
                  {Array.from({ length: 114 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      {num}. {getSurahName(num)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => downloadSurahAudio(selectedSurah)}
                  disabled={loading || !isOnline}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-volume-up"></i>
                      Download Audio
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Offline Mode Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How Offline Mode Works</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• Downloaded content is available without internet</li>
                  <li>• Text and audio are stored locally on your device</li>
                  <li>• AI features require internet connection</li>
                  <li>• Reading history syncs when back online</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for surah names
function getSurahName(num: number): string {
  const names: Record<number, string> = {
    1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Ali 'Imran", 4: "An-Nisa", 5: "Al-Ma'idah",
    6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Tawbah", 10: "Yunus",
    11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
    16: "An-Nahl", 17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Ta-Ha",
    // Add more as needed, or fetch dynamically
    112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas"
  };
  return names[num] || `Surah ${num}`;
}

export default DownloadManager;
