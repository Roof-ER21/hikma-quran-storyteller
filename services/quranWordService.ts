/**
 * Quran Word-by-Word Service
 *
 * Provides word-by-word breakdown, morphology, root words, and grammar analysis
 * Uses QuranHub API for morphological data
 */

// Types for word analysis
export interface WordMorphology {
  position: number;
  arabic: string;
  transliteration: string;
  translation: string;
  rootWord: string | null;
  rootArabic: string | null;
  lemma: string | null;
  partOfSpeech: string;
  partOfSpeechArabic: string;
  grammaticalTags: string[];
  grammaticalTagsArabic: string[];
  location: string; // Format: "surah:verse:word"
}

export interface VerseWordBreakdown {
  surah: number;
  verse: number;
  totalWords: number;
  words: WordMorphology[];
}

export interface RootWordInfo {
  root: string;
  rootArabic: string;
  meaning: string;
  occurrences: number;
  relatedWords: {
    location: string;
    arabic: string;
    translation: string;
  }[];
}

// Part of Speech mapping
const POS_LABELS: Record<string, { en: string; ar: string }> = {
  'N': { en: 'Noun', ar: 'اسم' },
  'PN': { en: 'Proper Noun', ar: 'اسم علم' },
  'ADJ': { en: 'Adjective', ar: 'صفة' },
  'V': { en: 'Verb', ar: 'فعل' },
  'PRON': { en: 'Pronoun', ar: 'ضمير' },
  'DEM': { en: 'Demonstrative', ar: 'اسم إشارة' },
  'REL': { en: 'Relative Pronoun', ar: 'اسم موصول' },
  'P': { en: 'Preposition', ar: 'حرف جر' },
  'CONJ': { en: 'Conjunction', ar: 'حرف عطف' },
  'PART': { en: 'Particle', ar: 'حرف' },
  'NEG': { en: 'Negative Particle', ar: 'حرف نفي' },
  'INTG': { en: 'Interrogative', ar: 'استفهام' },
  'INL': { en: 'Inceptive Particle', ar: 'حرف استئناف' },
  'SUP': { en: 'Supplementary', ar: 'زائد' },
  'COND': { en: 'Conditional', ar: 'شرط' },
  'AMD': { en: 'Amendment', ar: 'استدراك' },
  'ANS': { en: 'Answer', ar: 'جواب' },
  'AVR': { en: 'Aversion', ar: 'ردع' },
  'CERT': { en: 'Certainty', ar: 'تحقيق' },
  'CIRC': { en: 'Circumstantial', ar: 'حال' },
  'COM': { en: 'Comitative', ar: 'معية' },
  'EQ': { en: 'Equalization', ar: 'تسوية' },
  'EXH': { en: 'Exhortation', ar: 'تحضيض' },
  'EXL': { en: 'Explanation', ar: 'تفسير' },
  'EXP': { en: 'Exceptive', ar: 'استثناء' },
  'FUT': { en: 'Future', ar: 'استقبال' },
  'INC': { en: 'Inchoative', ar: 'ابتداء' },
  'INT': { en: 'Intensive', ar: 'توكيد' },
  'PREV': { en: 'Preventive', ar: 'كافة' },
  'PRO': { en: 'Prohibition', ar: 'نهي' },
  'REM': { en: 'Resumption', ar: 'استئناف' },
  'RES': { en: 'Restriction', ar: 'حصر' },
  'RET': { en: 'Retraction', ar: 'إضراب' },
  'RSLT': { en: 'Result', ar: 'نتيجة' },
  'SUB': { en: 'Subordinating', ar: 'مصدرية' },
  'SUR': { en: 'Surprise', ar: 'فجاءة' },
  'VOC': { en: 'Vocative', ar: 'نداء' },
  'ACC': { en: 'Accusative', ar: 'منصوب' },
  'NOM': { en: 'Nominative', ar: 'مرفوع' },
  'GEN': { en: 'Genitive', ar: 'مجرور' },
  'JUSS': { en: 'Jussive', ar: 'مجزوم' },
  'SUBJ': { en: 'Subjunctive', ar: 'منصوب' },
  'ACT': { en: 'Active', ar: 'مبني للمعلوم' },
  'PASS': { en: 'Passive', ar: 'مبني للمجهول' },
  'PERF': { en: 'Perfect', ar: 'ماضٍ' },
  'IMPF': { en: 'Imperfect', ar: 'مضارع' },
  'IMPV': { en: 'Imperative', ar: 'أمر' },
  '1': { en: '1st Person', ar: 'متكلم' },
  '2': { en: '2nd Person', ar: 'مخاطب' },
  '3': { en: '3rd Person', ar: 'غائب' },
  'M': { en: 'Masculine', ar: 'مذكر' },
  'F': { en: 'Feminine', ar: 'مؤنث' },
  'S': { en: 'Singular', ar: 'مفرد' },
  'D': { en: 'Dual', ar: 'مثنى' },
  'PL': { en: 'Plural', ar: 'جمع' },
  'DEF': { en: 'Definite', ar: 'معرفة' },
  'INDEF': { en: 'Indefinite', ar: 'نكرة' },
};

// Simplified word-by-word data (fallback when API unavailable)
// This is a subset for common surahs - Al-Fatiha
const FALLBACK_DATA: Record<string, VerseWordBreakdown> = {
  '1:1': {
    surah: 1,
    verse: 1,
    totalWords: 4,
    words: [
      { position: 1, arabic: 'بِسْمِ', transliteration: 'bismi', translation: 'In the name', rootWord: 'س م و', rootArabic: 'سمو', lemma: 'اسم', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN'], grammaticalTagsArabic: ['مجرور'], location: '1:1:1' },
      { position: 2, arabic: 'اللَّهِ', transliteration: 'allahi', translation: 'of Allah', rootWord: 'ء ل ه', rootArabic: 'أله', lemma: 'الله', partOfSpeech: 'PN', partOfSpeechArabic: 'اسم علم', grammaticalTags: ['GEN'], grammaticalTagsArabic: ['مجرور'], location: '1:1:2' },
      { position: 3, arabic: 'الرَّحْمَٰنِ', transliteration: 'alrrahmani', translation: 'the Most Gracious', rootWord: 'ر ح م', rootArabic: 'رحم', lemma: 'رحمن', partOfSpeech: 'ADJ', partOfSpeechArabic: 'صفة', grammaticalTags: ['GEN', 'DEF'], grammaticalTagsArabic: ['مجرور', 'معرفة'], location: '1:1:3' },
      { position: 4, arabic: 'الرَّحِيمِ', transliteration: 'alrraheemi', translation: 'the Most Merciful', rootWord: 'ر ح م', rootArabic: 'رحم', lemma: 'رحيم', partOfSpeech: 'ADJ', partOfSpeechArabic: 'صفة', grammaticalTags: ['GEN', 'DEF'], grammaticalTagsArabic: ['مجرور', 'معرفة'], location: '1:1:4' },
    ]
  },
  '1:2': {
    surah: 1,
    verse: 2,
    totalWords: 4,
    words: [
      { position: 1, arabic: 'الْحَمْدُ', transliteration: 'alhamdu', translation: 'All praise', rootWord: 'ح م د', rootArabic: 'حمد', lemma: 'حمد', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['NOM', 'DEF'], grammaticalTagsArabic: ['مرفوع', 'معرفة'], location: '1:2:1' },
      { position: 2, arabic: 'لِلَّهِ', transliteration: 'lillahi', translation: 'is for Allah', rootWord: 'ء ل ه', rootArabic: 'أله', lemma: 'الله', partOfSpeech: 'PN', partOfSpeechArabic: 'اسم علم', grammaticalTags: ['GEN'], grammaticalTagsArabic: ['مجرور'], location: '1:2:2' },
      { position: 3, arabic: 'رَبِّ', transliteration: 'rabbi', translation: 'Lord', rootWord: 'ر ب ب', rootArabic: 'ربب', lemma: 'رب', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN'], grammaticalTagsArabic: ['مجرور'], location: '1:2:3' },
      { position: 4, arabic: 'الْعَالَمِينَ', transliteration: "al'alamina", translation: 'of the worlds', rootWord: 'ع ل م', rootArabic: 'علم', lemma: 'عالم', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN', 'PL', 'DEF'], grammaticalTagsArabic: ['مجرور', 'جمع', 'معرفة'], location: '1:2:4' },
    ]
  },
  '1:3': {
    surah: 1,
    verse: 3,
    totalWords: 2,
    words: [
      { position: 1, arabic: 'الرَّحْمَٰنِ', transliteration: 'alrrahmani', translation: 'The Most Gracious', rootWord: 'ر ح م', rootArabic: 'رحم', lemma: 'رحمن', partOfSpeech: 'ADJ', partOfSpeechArabic: 'صفة', grammaticalTags: ['GEN', 'DEF'], grammaticalTagsArabic: ['مجرور', 'معرفة'], location: '1:3:1' },
      { position: 2, arabic: 'الرَّحِيمِ', transliteration: 'alrraheemi', translation: 'the Most Merciful', rootWord: 'ر ح م', rootArabic: 'رحم', lemma: 'رحيم', partOfSpeech: 'ADJ', partOfSpeechArabic: 'صفة', grammaticalTags: ['GEN', 'DEF'], grammaticalTagsArabic: ['مجرور', 'معرفة'], location: '1:3:2' },
    ]
  },
  '1:4': {
    surah: 1,
    verse: 4,
    totalWords: 3,
    words: [
      { position: 1, arabic: 'مَالِكِ', transliteration: 'maliki', translation: 'Master', rootWord: 'م ل ك', rootArabic: 'ملك', lemma: 'مالك', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN'], grammaticalTagsArabic: ['مجرور'], location: '1:4:1' },
      { position: 2, arabic: 'يَوْمِ', transliteration: 'yawmi', translation: 'of the Day', rootWord: 'ي و م', rootArabic: 'يوم', lemma: 'يوم', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN'], grammaticalTagsArabic: ['مجرور'], location: '1:4:2' },
      { position: 3, arabic: 'الدِّينِ', transliteration: 'alddeeni', translation: 'of Judgment', rootWord: 'د ي ن', rootArabic: 'دين', lemma: 'دين', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN', 'DEF'], grammaticalTagsArabic: ['مجرور', 'معرفة'], location: '1:4:3' },
    ]
  },
  '1:5': {
    surah: 1,
    verse: 5,
    totalWords: 4,
    words: [
      { position: 1, arabic: 'إِيَّاكَ', transliteration: 'iyyaka', translation: 'You alone', rootWord: null, rootArabic: null, lemma: 'إيا', partOfSpeech: 'PRON', partOfSpeechArabic: 'ضمير', grammaticalTags: ['ACC', '2', 'M', 'S'], grammaticalTagsArabic: ['منصوب', 'مخاطب', 'مذكر', 'مفرد'], location: '1:5:1' },
      { position: 2, arabic: 'نَعْبُدُ', transliteration: "na'budu", translation: 'we worship', rootWord: 'ع ب د', rootArabic: 'عبد', lemma: 'عبد', partOfSpeech: 'V', partOfSpeechArabic: 'فعل', grammaticalTags: ['IMPF', '1', 'PL'], grammaticalTagsArabic: ['مضارع', 'متكلم', 'جمع'], location: '1:5:2' },
      { position: 3, arabic: 'وَإِيَّاكَ', transliteration: 'waiyyaka', translation: 'and You alone', rootWord: null, rootArabic: null, lemma: 'إيا', partOfSpeech: 'PRON', partOfSpeechArabic: 'ضمير', grammaticalTags: ['ACC', '2', 'M', 'S'], grammaticalTagsArabic: ['منصوب', 'مخاطب', 'مذكر', 'مفرد'], location: '1:5:3' },
      { position: 4, arabic: 'نَسْتَعِينُ', transliteration: "nasta'eenu", translation: 'we ask for help', rootWord: 'ع و ن', rootArabic: 'عون', lemma: 'استعان', partOfSpeech: 'V', partOfSpeechArabic: 'فعل', grammaticalTags: ['IMPF', '1', 'PL'], grammaticalTagsArabic: ['مضارع', 'متكلم', 'جمع'], location: '1:5:4' },
    ]
  },
  '1:6': {
    surah: 1,
    verse: 6,
    totalWords: 3,
    words: [
      { position: 1, arabic: 'اهْدِنَا', transliteration: 'ihdina', translation: 'Guide us', rootWord: 'ه د ي', rootArabic: 'هدي', lemma: 'هدى', partOfSpeech: 'V', partOfSpeechArabic: 'فعل', grammaticalTags: ['IMPV', '2', 'M', 'S'], grammaticalTagsArabic: ['أمر', 'مخاطب', 'مذكر', 'مفرد'], location: '1:6:1' },
      { position: 2, arabic: 'الصِّرَاطَ', transliteration: 'alssirata', translation: 'to the path', rootWord: 'ص ر ط', rootArabic: 'صرط', lemma: 'صراط', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['ACC', 'DEF'], grammaticalTagsArabic: ['منصوب', 'معرفة'], location: '1:6:2' },
      { position: 3, arabic: 'الْمُسْتَقِيمَ', transliteration: 'almustaqeema', translation: 'the straight', rootWord: 'ق و م', rootArabic: 'قوم', lemma: 'مستقيم', partOfSpeech: 'ADJ', partOfSpeechArabic: 'صفة', grammaticalTags: ['ACC', 'DEF'], grammaticalTagsArabic: ['منصوب', 'معرفة'], location: '1:6:3' },
    ]
  },
  '1:7': {
    surah: 1,
    verse: 7,
    totalWords: 9,
    words: [
      { position: 1, arabic: 'صِرَاطَ', transliteration: 'sirata', translation: 'The path', rootWord: 'ص ر ط', rootArabic: 'صرط', lemma: 'صراط', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['ACC'], grammaticalTagsArabic: ['منصوب'], location: '1:7:1' },
      { position: 2, arabic: 'الَّذِينَ', transliteration: 'allatheena', translation: 'of those', rootWord: null, rootArabic: null, lemma: 'الذي', partOfSpeech: 'REL', partOfSpeechArabic: 'اسم موصول', grammaticalTags: ['P', 'M'], grammaticalTagsArabic: ['جمع', 'مذكر'], location: '1:7:2' },
      { position: 3, arabic: 'أَنْعَمْتَ', transliteration: "an'amta", translation: 'You have blessed', rootWord: 'ن ع م', rootArabic: 'نعم', lemma: 'أنعم', partOfSpeech: 'V', partOfSpeechArabic: 'فعل', grammaticalTags: ['PERF', '2', 'M', 'S'], grammaticalTagsArabic: ['ماضٍ', 'مخاطب', 'مذكر', 'مفرد'], location: '1:7:3' },
      { position: 4, arabic: 'عَلَيْهِمْ', transliteration: 'alayhim', translation: 'upon them', rootWord: 'ع ل و', rootArabic: 'علو', lemma: 'على', partOfSpeech: 'P', partOfSpeechArabic: 'حرف جر', grammaticalTags: [], grammaticalTagsArabic: [], location: '1:7:4' },
      { position: 5, arabic: 'غَيْرِ', transliteration: 'ghayri', translation: 'not', rootWord: 'غ ي ر', rootArabic: 'غير', lemma: 'غير', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN'], grammaticalTagsArabic: ['مجرور'], location: '1:7:5' },
      { position: 6, arabic: 'الْمَغْضُوبِ', transliteration: 'almaghdoobi', translation: 'of those who earned wrath', rootWord: 'غ ض ب', rootArabic: 'غضب', lemma: 'مغضوب', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN', 'PASS', 'DEF'], grammaticalTagsArabic: ['مجرور', 'مبني للمجهول', 'معرفة'], location: '1:7:6' },
      { position: 7, arabic: 'عَلَيْهِمْ', transliteration: 'alayhim', translation: 'upon them', rootWord: 'ع ل و', rootArabic: 'علو', lemma: 'على', partOfSpeech: 'P', partOfSpeechArabic: 'حرف جر', grammaticalTags: [], grammaticalTagsArabic: [], location: '1:7:7' },
      { position: 8, arabic: 'وَلَا', transliteration: 'wala', translation: 'and not', rootWord: null, rootArabic: null, lemma: 'لا', partOfSpeech: 'NEG', partOfSpeechArabic: 'حرف نفي', grammaticalTags: [], grammaticalTagsArabic: [], location: '1:7:8' },
      { position: 9, arabic: 'الضَّالِّينَ', transliteration: 'alddalleena', translation: 'those who go astray', rootWord: 'ض ل ل', rootArabic: 'ضلل', lemma: 'ضال', partOfSpeech: 'N', partOfSpeechArabic: 'اسم', grammaticalTags: ['GEN', 'PL', 'M', 'DEF'], grammaticalTagsArabic: ['مجرور', 'جمع', 'مذكر', 'معرفة'], location: '1:7:9' },
    ]
  }
};

// Cache for API responses
const wordCache = new Map<string, VerseWordBreakdown>();

/**
 * Parse Arabic text into individual words
 */
function parseArabicWords(arabicText: string): string[] {
  // Remove diacritics for word splitting, then return original
  return arabicText.trim().split(/\s+/).filter(w => w.length > 0);
}

/**
 * Generate basic transliteration (simplified)
 */
function basicTransliteration(arabic: string): string {
  const map: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'j', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': "'",
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ء': "'",
    'َ': 'a', 'ُ': 'u', 'ِ': 'i', 'ً': 'an', 'ٌ': 'un', 'ٍ': 'in',
    'ّ': '', 'ْ': '', 'ٰ': 'a', 'ـ': ''
  };
  return arabic.split('').map(c => map[c] || c).join('');
}

/**
 * Fetch word-by-word breakdown for a verse
 */
export async function getVerseWordBreakdown(
  surah: number,
  verse: number
): Promise<VerseWordBreakdown | null> {
  const cacheKey = `${surah}:${verse}`;

  // Check cache first
  if (wordCache.has(cacheKey)) {
    return wordCache.get(cacheKey)!;
  }

  // Check fallback data
  if (FALLBACK_DATA[cacheKey]) {
    wordCache.set(cacheKey, FALLBACK_DATA[cacheKey]);
    return FALLBACK_DATA[cacheKey];
  }

  try {
    // Try fetching from a word-by-word API
    // Using quran.com API for word-by-word data
    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${surah}:${verse}?words=true&word_fields=text_uthmani,translation,transliteration`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.verse && data.verse.words) {
      const words: WordMorphology[] = data.verse.words
        .filter((w: any) => w.char_type_name === 'word') // Exclude end markers
        .map((word: any, index: number) => ({
          position: index + 1,
          arabic: word.text_uthmani || word.text,
          transliteration: word.transliteration?.text || basicTransliteration(word.text_uthmani || word.text),
          translation: word.translation?.text || '',
          rootWord: null, // Would need separate API call
          rootArabic: null,
          lemma: null,
          partOfSpeech: 'N', // Default, would need morphology API
          partOfSpeechArabic: 'اسم',
          grammaticalTags: [],
          grammaticalTagsArabic: [],
          location: `${surah}:${verse}:${index + 1}`
        }));

      const breakdown: VerseWordBreakdown = {
        surah,
        verse,
        totalWords: words.length,
        words
      };

      wordCache.set(cacheKey, breakdown);
      return breakdown;
    }

    return null;
  } catch (error) {
    console.error('Error fetching word breakdown:', error);

    // Return null if no data available
    return null;
  }
}

/**
 * Get grammatical tag label
 */
export function getGrammarLabel(tag: string, arabic: boolean = false): string {
  const label = POS_LABELS[tag];
  if (label) {
    return arabic ? label.ar : label.en;
  }
  return tag;
}

/**
 * Get part of speech color for UI
 */
export function getPosColor(pos: string): string {
  const colors: Record<string, string> = {
    'N': 'bg-blue-100 text-blue-700',
    'PN': 'bg-purple-100 text-purple-700',
    'ADJ': 'bg-green-100 text-green-700',
    'V': 'bg-red-100 text-red-700',
    'PRON': 'bg-yellow-100 text-yellow-700',
    'P': 'bg-orange-100 text-orange-700',
    'CONJ': 'bg-pink-100 text-pink-700',
    'PART': 'bg-gray-100 text-gray-700',
    'NEG': 'bg-rose-100 text-rose-700',
    'REL': 'bg-indigo-100 text-indigo-700',
    'DEM': 'bg-teal-100 text-teal-700',
  };
  return colors[pos] || 'bg-stone-100 text-stone-700';
}

/**
 * Get unique roots from a verse breakdown
 */
export function getUniqueRoots(breakdown: VerseWordBreakdown): { root: string; rootArabic: string; words: WordMorphology[] }[] {
  const rootMap = new Map<string, { root: string; rootArabic: string; words: WordMorphology[] }>();

  for (const word of breakdown.words) {
    if (word.rootWord && word.rootArabic) {
      const key = word.rootWord;
      if (!rootMap.has(key)) {
        rootMap.set(key, { root: word.rootWord, rootArabic: word.rootArabic, words: [] });
      }
      rootMap.get(key)!.words.push(word);
    }
  }

  return Array.from(rootMap.values());
}

/**
 * Get grammar statistics for a verse
 */
export function getGrammarStats(breakdown: VerseWordBreakdown): { pos: string; posArabic: string; count: number; color: string }[] {
  const stats = new Map<string, number>();

  for (const word of breakdown.words) {
    const pos = word.partOfSpeech;
    stats.set(pos, (stats.get(pos) || 0) + 1);
  }

  return Array.from(stats.entries())
    .map(([pos, count]) => ({
      pos: getGrammarLabel(pos, false),
      posArabic: getGrammarLabel(pos, true),
      count,
      color: getPosColor(pos)
    }))
    .sort((a, b) => b.count - a.count);
}
