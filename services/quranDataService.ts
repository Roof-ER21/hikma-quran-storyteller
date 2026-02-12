/**
 * Quran Data Service
 * Integrates with AlQuran.cloud API (free, unlimited, no auth required)
 *
 * API Documentation: https://alquran.cloud/api
 */

import { Verse, Surah, SurahMeta, Translation, SearchResult } from '../types';

const BASE_URL = 'https://api.alquran.cloud/v1';

// Available translations
export const TRANSLATIONS: Record<string, { name: string; language: string }> = {
  'en.sahih': { name: 'Sahih International', language: 'English' },
  'en.yusufali': { name: 'Yusuf Ali', language: 'English' },
  'en.pickthall': { name: 'Pickthall', language: 'English' },
  'en.asad': { name: 'Muhammad Asad', language: 'English' },
  'ur.ahmedali': { name: 'Ahmed Ali', language: 'Urdu' },
  'fr.hamidullah': { name: 'Hamidullah', language: 'French' },
  'es.cortes': { name: 'Julio Cortes', language: 'Spanish' },
  'de.aburida': { name: 'Abu Rida', language: 'German' },
  'id.indonesian': { name: 'Indonesian Ministry', language: 'Indonesian' },
  'tr.diyanet': { name: 'Diyanet', language: 'Turkish' },
  'ru.kuliev': { name: 'Kuliev', language: 'Russian' },
  'bn.bengali': { name: 'Bengali', language: 'Bengali' },
  'hi.hindi': { name: 'Hindi', language: 'Hindi' },
  'ml.malayalam': { name: 'Malayalam', language: 'Malayalam' },
  'ta.tamil': { name: 'Tamil', language: 'Tamil' },
};

// Multi-language translations for secondary translation feature
export const MULTI_LANG_TRANSLATIONS = [
  { id: 'en.sahih', name: 'English (Sahih International)', lang: 'en', source: 'alquran' },
  { id: 'en.yusufali', name: 'English (Yusuf Ali)', lang: 'en', source: 'alquran' },
  { id: 'en.pickthall', name: 'English (Pickthall)', lang: 'en', source: 'alquran' },
  { id: 'ur.jalandhry', name: 'Urdu (Jalandhry)', lang: 'ur', source: 'alquran' },
  { id: 'fr.hamidullah', name: 'French (Hamidullah)', lang: 'fr', source: 'alquran' },
  { id: 'tr.diyanet', name: 'Turkish (Diyanet)', lang: 'tr', source: 'alquran' },
  { id: 'id.indonesian', name: 'Indonesian', lang: 'id', source: 'alquran' },
  { id: 'bn.bengali', name: 'Bengali', lang: 'bn', source: 'alquran' },
  { id: 'de.bubenheim', name: 'German (Bubenheim)', lang: 'de', source: 'alquran' },
  { id: 'es.cortes', name: 'Spanish (Cortes)', lang: 'es', source: 'alquran' },
  { id: 'ru.kuliev', name: 'Russian (Kuliev)', lang: 'ru', source: 'alquran' },
  { id: 'ml.abdulhameed', name: 'Malayalam', lang: 'ml', source: 'alquran' },
  { id: 'zh.majian', name: 'Chinese (Ma Jian)', lang: 'zh', source: 'alquran' },
  { id: 'ja.japanese', name: 'Japanese', lang: 'ja', source: 'alquran' },
  { id: 'ko.korean', name: 'Korean', lang: 'ko', source: 'alquran' },
  { id: 'hi.hindi', name: 'Hindi', lang: 'hi', source: 'alquran' },
];

// Simple in-memory cache
const cache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch all surahs metadata (114 chapters)
 */
export async function getAllSurahs(): Promise<SurahMeta[]> {
  const cacheKey = 'all-surahs';
  const cached = getCached<SurahMeta[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${BASE_URL}/surah`);
    const result = await response.json();

    if (result.code !== 200) {
      throw new Error(result.data || 'Failed to fetch surahs');
    }

    const surahs: SurahMeta[] = result.data.map((s: any) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      revelationType: s.revelationType,
      numberOfAyahs: s.numberOfAyahs,
    }));

    setCache(cacheKey, surahs);
    return surahs;
  } catch (error) {
    console.error('Error fetching surahs:', error);
    throw error;
  }
}

/**
 * Fetch a complete surah with Arabic text
 */
export async function getSurah(surahNumber: number): Promise<Surah> {
  const cacheKey = `surah-${surahNumber}`;
  const cached = getCached<Surah>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}`);
    const result = await response.json();

    if (result.code !== 200) {
      throw new Error(result.data || 'Failed to fetch surah');
    }

    const surah: Surah = {
      number: result.data.number,
      name: result.data.name,
      englishName: result.data.englishName,
      englishNameTranslation: result.data.englishNameTranslation,
      revelationType: result.data.revelationType,
      numberOfAyahs: result.data.numberOfAyahs,
      verses: result.data.ayahs.map((ayah: any) => ({
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        arabic: ayah.text,
        juz: ayah.juz,
        page: ayah.page,
      })),
    };

    setCache(cacheKey, surah);
    return surah;
  } catch (error) {
    console.error(`Error fetching surah ${surahNumber}:`, error);
    throw error;
  }
}

/**
 * Fetch a surah with a specific translation
 */
export async function getSurahWithTranslation(
  surahNumber: number,
  translationId: string = 'en.sahih'
): Promise<Surah> {
  const cacheKey = `surah-${surahNumber}-${translationId}`;
  const cached = getCached<Surah>(cacheKey);
  if (cached) return cached;

  try {
    // Fetch both Arabic and translation in parallel
    const [arabicResponse, translationResponse] = await Promise.all([
      fetch(`${BASE_URL}/surah/${surahNumber}`),
      fetch(`${BASE_URL}/surah/${surahNumber}/${translationId}`),
    ]);

    const arabicResult = await arabicResponse.json();
    const translationResult = await translationResponse.json();

    if (arabicResult.code !== 200 || translationResult.code !== 200) {
      throw new Error('Failed to fetch surah with translation');
    }

    const surah: Surah = {
      number: arabicResult.data.number,
      name: arabicResult.data.name,
      englishName: arabicResult.data.englishName,
      englishNameTranslation: arabicResult.data.englishNameTranslation,
      revelationType: arabicResult.data.revelationType,
      numberOfAyahs: arabicResult.data.numberOfAyahs,
      verses: arabicResult.data.ayahs.map((ayah: any, index: number) => ({
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        arabic: ayah.text,
        translation: translationResult.data.ayahs[index]?.text || '',
        juz: ayah.juz,
        page: ayah.page,
      })),
    };

    setCache(cacheKey, surah);
    return surah;
  } catch (error) {
    console.error(`Error fetching surah ${surahNumber} with translation:`, error);
    throw error;
  }
}

/**
 * Fetch a specific verse with translation
 */
export async function getVerse(
  surahNumber: number,
  verseNumber: number,
  translationId: string = 'en.sahih'
): Promise<Verse> {
  const cacheKey = `verse-${surahNumber}-${verseNumber}-${translationId}`;
  const cached = getCached<Verse>(cacheKey);
  if (cached) return cached;

  try {
    const [arabicResponse, translationResponse] = await Promise.all([
      fetch(`${BASE_URL}/ayah/${surahNumber}:${verseNumber}`),
      fetch(`${BASE_URL}/ayah/${surahNumber}:${verseNumber}/${translationId}`),
    ]);

    const arabicResult = await arabicResponse.json();
    const translationResult = await translationResponse.json();

    if (arabicResult.code !== 200) {
      throw new Error('Failed to fetch verse');
    }

    const verse: Verse = {
      number: arabicResult.data.number,
      numberInSurah: arabicResult.data.numberInSurah,
      arabic: arabicResult.data.text,
      translation: translationResult.data?.text || '',
      juz: arabicResult.data.juz,
      page: arabicResult.data.page,
    };

    setCache(cacheKey, verse);
    return verse;
  } catch (error) {
    console.error(`Error fetching verse ${surahNumber}:${verseNumber}:`, error);
    throw error;
  }
}

/**
 * Search the Quran for keywords
 */
export async function searchQuran(
  query: string,
  translationId: string = 'en.sahih',
  surahFilter?: number
): Promise<SearchResult[]> {
  try {
    const scope = surahFilter ? surahFilter.toString() : 'all';
    const response = await fetch(
      `${BASE_URL}/search/${encodeURIComponent(query)}/${scope}/${translationId}`
    );
    const result = await response.json();

    if (result.code !== 200) {
      return [];
    }

    return result.data.matches.map((match: any) => ({
      surahNumber: match.surah.number,
      surahName: match.surah.englishName,
      verseNumber: match.numberInSurah,
      arabic: '', // Arabic not included in search results
      translation: match.text,
      matchScore: 1,
    }));
  } catch (error) {
    console.error('Error searching Quran:', error);
    return [];
  }
}

/**
 * Fetch available translations
 */
export async function getAvailableTranslations(): Promise<Translation[]> {
  const cacheKey = 'translations';
  const cached = getCached<Translation[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${BASE_URL}/edition/type/translation`);
    const result = await response.json();

    if (result.code !== 200) {
      throw new Error('Failed to fetch translations');
    }

    const translations: Translation[] = result.data.map((t: any) => ({
      identifier: t.identifier,
      language: t.language,
      name: t.name,
      englishName: t.englishName,
      direction: t.direction,
    }));

    setCache(cacheKey, translations);
    return translations;
  } catch (error) {
    console.error('Error fetching translations:', error);
    // Return default translations on error
    return Object.entries(TRANSLATIONS).map(([id, info]) => ({
      identifier: id,
      language: info.language,
      name: info.name,
      englishName: info.name,
      direction: id.startsWith('ur') || id.startsWith('ar') ? 'rtl' as const : 'ltr' as const,
    }));
  }
}

/**
 * Get Juz (para) information
 */
export async function getJuz(juzNumber: number, translationId: string = 'en.sahih'): Promise<Verse[]> {
  try {
    const [arabicResponse, translationResponse] = await Promise.all([
      fetch(`${BASE_URL}/juz/${juzNumber}/quran-uthmani`),
      fetch(`${BASE_URL}/juz/${juzNumber}/${translationId}`),
    ]);

    const arabicResult = await arabicResponse.json();
    const translationResult = await translationResponse.json();

    if (arabicResult.code !== 200) {
      throw new Error('Failed to fetch juz');
    }

    return arabicResult.data.ayahs.map((ayah: any, index: number) => ({
      number: ayah.number,
      numberInSurah: ayah.numberInSurah,
      arabic: ayah.text,
      translation: translationResult.data?.ayahs[index]?.text || '',
      juz: ayah.juz,
      page: ayah.page,
    }));
  } catch (error) {
    console.error(`Error fetching juz ${juzNumber}:`, error);
    throw error;
  }
}

/**
 * Get page of the Quran (Mushaf page)
 */
export async function getPage(pageNumber: number, translationId: string = 'en.sahih'): Promise<Verse[]> {
  try {
    const [arabicResponse, translationResponse] = await Promise.all([
      fetch(`${BASE_URL}/page/${pageNumber}/quran-uthmani`),
      fetch(`${BASE_URL}/page/${pageNumber}/${translationId}`),
    ]);

    const arabicResult = await arabicResponse.json();
    const translationResult = await translationResponse.json();

    if (arabicResult.code !== 200) {
      throw new Error('Failed to fetch page');
    }

    return arabicResult.data.ayahs.map((ayah: any, index: number) => ({
      number: ayah.number,
      numberInSurah: ayah.numberInSurah,
      arabic: ayah.text,
      translation: translationResult.data?.ayahs[index]?.text || '',
      juz: ayah.juz,
      page: ayah.page,
    }));
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error);
    throw error;
  }
}

/**
 * Utility: Get verse count for calculating global verse numbers
 */
const VERSE_COUNTS = [
  0, 7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83,
  182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96,
  29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31,
  50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5,
  8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

export function getGlobalVerseNumber(surahNumber: number, verseNumber: number): number {
  let total = 0;
  for (let i = 1; i < surahNumber; i++) {
    total += VERSE_COUNTS[i];
  }
  return total + verseNumber;
}

export function getSurahAndVerseFromGlobal(globalNumber: number): { surah: number; verse: number } {
  let remaining = globalNumber;
  for (let surah = 1; surah <= 114; surah++) {
    if (remaining <= VERSE_COUNTS[surah]) {
      return { surah, verse: remaining };
    }
    remaining -= VERSE_COUNTS[surah];
  }
  return { surah: 114, verse: 6 }; // Last verse of Quran
}

/**
 * Fetch tajweed-annotated text for a surah from AlQuran.cloud tajweed edition.
 * Returns a map of verseNumberInSurah -> tajweed HTML string.
 */
export async function getSurahTajweedText(surahNumber: number): Promise<Map<number, string>> {
  const cacheKey = `tajweed-${surahNumber}`;
  const cached = getCached<Map<number, string>>(cacheKey);
  if (cached) return cached;

  try {
    const { Tajweed } = await import('tajweed');
    const tajweedParser = new Tajweed();

    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/quran-tajweed`);
    const result = await response.json();

    if (result.code !== 200) {
      return new Map();
    }

    const tajweedMap = new Map<number, string>();
    for (const ayah of result.data.ayahs) {
      tajweedMap.set(ayah.numberInSurah, tajweedParser.parse(ayah.text, true));
    }

    setCache(cacheKey, tajweedMap);
    return tajweedMap;
  } catch (error) {
    console.error('Error fetching tajweed text:', error);
    return new Map();
  }
}

/**
 * Get a specific translation for a surah (for secondary translations)
 * Returns a Map of verseNumberInSurah -> translation text
 */
export async function getMultiLangTranslation(
  surahNumber: number,
  translationId: string
): Promise<Map<number, string>> {
  const cacheKey = `translation-${surahNumber}-${translationId}`;
  const cached = getCached<Map<number, string>>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/${translationId}`);
    const result = await response.json();

    if (result.code !== 200) {
      console.error(`Failed to fetch translation ${translationId} for surah ${surahNumber}`);
      return new Map();
    }

    const translationMap = new Map<number, string>();
    for (const ayah of result.data.ayahs) {
      translationMap.set(ayah.numberInSurah, ayah.text);
    }

    setCache(cacheKey, translationMap);
    return translationMap;
  } catch (error) {
    console.error(`Error fetching translation ${translationId} for surah ${surahNumber}:`, error);
    return new Map();
  }
}

/**
 * Pre-fetch popular surahs for better UX
 */
export async function prefetchPopularSurahs(): Promise<void> {
  const popularSurahs = [1, 2, 18, 36, 55, 67, 112, 113, 114]; // Fatiha, Baqarah, Kahf, Yasin, Rahman, Mulk, Ikhlas, Falaq, Nas

  // Fetch in background without blocking
  Promise.all(
    popularSurahs.map(num => getSurahWithTranslation(num, 'en.sahih').catch(() => null))
  );
}
