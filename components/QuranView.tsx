import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generateSurahStory, speakText, generateStoryImage } from '../services/geminiService';
import { getSurahWithTranslation, getSurahTajweedText, TRANSLATIONS } from '../services/quranDataService';
import { audioManager, RECITERS, DEFAULT_RECITER } from '../services/quranAudioService';
import { getVerseWordBreakdown, getPosColor, getGrammarLabel, getUniqueRoots, getGrammarStats, VerseWordBreakdown, WordMorphology } from '../services/quranWordService';
import { VerseDisplay } from './VerseDisplay';
import { AudioPlayer, FloatingAudioPlayer } from './AudioPlayer';
import { TranslationSelector, ReciterSelector, FontSizeSelector } from './TranslationSelector';
import VoiceSearch from './VoiceSearch';
import RecitationChecker from './RecitationChecker';
import MemorizationMode from './MemorizationMode';
import ShareButton from './ShareButton';
import { AlayaTutorWrapper } from './AlayaTutor';
import { Verse, Surah as SurahType, VisualConfig } from '../types';

interface SurahDef {
  number: number;
  nameEn: string;
  nameAr: string;
  meaning: string;
  verses?: number;
  revelationType?: 'Meccan' | 'Medinan';
}

type TabType = 'read' | 'story' | 'listen' | 'study' | 'practice';
type ThemeType = 'classic' | 'calm' | 'vibrant';

const THEMES: Record<ThemeType, {
  name: string;
  colors: {
    headerBg: string;
    headerText: string;
    subText: string;
    bodyBg: string;
    bodyText: string;
    prose: string;
    primaryBtn: string;
    secondaryBtnActive: string;
    secondaryBtnInactive: string;
    backBtnHover: string;
    audioBtnIdle: string;
    audioBtnActive: string;
    loadingIcon: string;
    tabActive: string;
    tabInactive: string;
  }
}> = {
  classic: {
    name: 'Classic (Rose)',
    colors: {
      headerBg: 'bg-rose-950',
      headerText: 'text-rose-50',
      subText: 'text-rose-300',
      bodyBg: 'bg-stone-50',
      bodyText: 'text-stone-800',
      prose: 'prose-rose',
      primaryBtn: 'bg-rose-700 hover:bg-rose-800',
      secondaryBtnActive: 'bg-rose-100 text-rose-900',
      secondaryBtnInactive: 'text-rose-300 hover:text-white',
      backBtnHover: 'hover:bg-rose-800',
      audioBtnIdle: 'bg-rose-800 hover:bg-rose-700',
      audioBtnActive: 'bg-amber-500 text-white',
      loadingIcon: 'text-rose-800',
      tabActive: 'bg-white text-rose-900 shadow-sm',
      tabInactive: 'text-rose-200 hover:text-white hover:bg-rose-800/50'
    }
  },
  calm: {
    name: 'Calm',
    colors: {
      headerBg: 'bg-slate-800',
      headerText: 'text-slate-50',
      subText: 'text-slate-300',
      bodyBg: 'bg-slate-50',
      bodyText: 'text-slate-800',
      prose: 'prose-slate',
      primaryBtn: 'bg-blue-600 hover:bg-blue-700',
      secondaryBtnActive: 'bg-blue-100 text-blue-900',
      secondaryBtnInactive: 'text-slate-400 hover:text-white',
      backBtnHover: 'hover:bg-slate-700',
      audioBtnIdle: 'bg-slate-700 hover:bg-slate-600',
      audioBtnActive: 'bg-indigo-500 text-white',
      loadingIcon: 'text-blue-800',
      tabActive: 'bg-white text-slate-900 shadow-sm',
      tabInactive: 'text-slate-400 hover:text-white hover:bg-slate-700/50'
    }
  },
  vibrant: {
    name: 'Vibrant',
    colors: {
      headerBg: 'bg-purple-900',
      headerText: 'text-purple-50',
      subText: 'text-purple-300',
      bodyBg: 'bg-rose-50',
      bodyText: 'text-gray-900',
      prose: 'prose-purple',
      primaryBtn: 'bg-purple-600 hover:bg-purple-700',
      secondaryBtnActive: 'bg-purple-100 text-purple-900',
      secondaryBtnInactive: 'text-purple-300 hover:text-white',
      backBtnHover: 'hover:bg-purple-800',
      audioBtnIdle: 'bg-purple-800 hover:bg-purple-700',
      audioBtnActive: 'bg-orange-500 text-white',
      loadingIcon: 'text-purple-800',
      tabActive: 'bg-white text-purple-900 shadow-sm',
      tabInactive: 'text-purple-300 hover:text-white hover:bg-purple-800/50'
    }
  }
};

const SURAHS: SurahDef[] = [
  { number: 1, nameEn: "Al-Fatihah", nameAr: "الفاتحة", meaning: "The Opening", verses: 7, revelationType: "Meccan" },
  { number: 2, nameEn: "Al-Baqarah", nameAr: "البقرة", meaning: "The Cow", verses: 286, revelationType: "Medinan" },
  { number: 3, nameEn: "Ali 'Imran", nameAr: "آل عمران", meaning: "Family of Imran", verses: 200, revelationType: "Medinan" },
  { number: 4, nameEn: "An-Nisa", nameAr: "النساء", meaning: "The Women", verses: 176, revelationType: "Medinan" },
  { number: 5, nameEn: "Al-Ma'idah", nameAr: "المائدة", meaning: "The Table Spread", verses: 120, revelationType: "Medinan" },
  { number: 6, nameEn: "Al-An'am", nameAr: "الأنعام", meaning: "The Cattle", verses: 165, revelationType: "Meccan" },
  { number: 7, nameEn: "Al-A'raf", nameAr: "الأعراف", meaning: "The Heights", verses: 206, revelationType: "Meccan" },
  { number: 8, nameEn: "Al-Anfal", nameAr: "الأنفال", meaning: "The Spoils of War", verses: 75, revelationType: "Medinan" },
  { number: 9, nameEn: "At-Tawbah", nameAr: "التوبة", meaning: "The Repentance", verses: 129, revelationType: "Medinan" },
  { number: 10, nameEn: "Yunus", nameAr: "يونس", meaning: "Jonah", verses: 109, revelationType: "Meccan" },
  { number: 11, nameEn: "Hud", nameAr: "هود", meaning: "Hud", verses: 123, revelationType: "Meccan" },
  { number: 12, nameEn: "Yusuf", nameAr: "يوسف", meaning: "Joseph", verses: 111, revelationType: "Meccan" },
  { number: 13, nameEn: "Ar-Ra'd", nameAr: "الرعد", meaning: "The Thunder", verses: 43, revelationType: "Medinan" },
  { number: 14, nameEn: "Ibrahim", nameAr: "إبراهيم", meaning: "Abraham", verses: 52, revelationType: "Meccan" },
  { number: 15, nameEn: "Al-Hijr", nameAr: "الحجر", meaning: "The Rocky Tract", verses: 99, revelationType: "Meccan" },
  { number: 16, nameEn: "An-Nahl", nameAr: "النحل", meaning: "The Bee", verses: 128, revelationType: "Meccan" },
  { number: 17, nameEn: "Al-Isra", nameAr: "الإسراء", meaning: "The Night Journey", verses: 111, revelationType: "Meccan" },
  { number: 18, nameEn: "Al-Kahf", nameAr: "الكهف", meaning: "The Cave", verses: 110, revelationType: "Meccan" },
  { number: 19, nameEn: "Maryam", nameAr: "مريم", meaning: "Mary", verses: 98, revelationType: "Meccan" },
  { number: 20, nameEn: "Ta-Ha", nameAr: "طه", meaning: "Ta-Ha", verses: 135, revelationType: "Meccan" },
  { number: 21, nameEn: "Al-Anbiya", nameAr: "الأنبياء", meaning: "The Prophets", verses: 112, revelationType: "Meccan" },
  { number: 22, nameEn: "Al-Hajj", nameAr: "الحج", meaning: "The Pilgrimage", verses: 78, revelationType: "Medinan" },
  { number: 23, nameEn: "Al-Mu'minun", nameAr: "المؤمنون", meaning: "The Believers", verses: 118, revelationType: "Meccan" },
  { number: 24, nameEn: "An-Nur", nameAr: "النور", meaning: "The Light", verses: 64, revelationType: "Medinan" },
  { number: 25, nameEn: "Al-Furqan", nameAr: "الفرقان", meaning: "The Criterion", verses: 77, revelationType: "Meccan" },
  { number: 26, nameEn: "Ash-Shu'ara", nameAr: "الشعراء", meaning: "The Poets", verses: 227, revelationType: "Meccan" },
  { number: 27, nameEn: "An-Naml", nameAr: "النمل", meaning: "The Ant", verses: 93, revelationType: "Meccan" },
  { number: 28, nameEn: "Al-Qasas", nameAr: "القصص", meaning: "The Stories", verses: 88, revelationType: "Meccan" },
  { number: 29, nameEn: "Al-Ankabut", nameAr: "العنكبوت", meaning: "The Spider", verses: 69, revelationType: "Meccan" },
  { number: 30, nameEn: "Ar-Rum", nameAr: "الروم", meaning: "The Romans", verses: 60, revelationType: "Meccan" },
  { number: 31, nameEn: "Luqman", nameAr: "لقمان", meaning: "Luqman", verses: 34, revelationType: "Meccan" },
  { number: 32, nameEn: "As-Sajdah", nameAr: "السجدة", meaning: "The Prostration", verses: 30, revelationType: "Meccan" },
  { number: 33, nameEn: "Al-Ahzab", nameAr: "الأحزاب", meaning: "The Combined Forces", verses: 73, revelationType: "Medinan" },
  { number: 34, nameEn: "Saba", nameAr: "سبأ", meaning: "Sheba", verses: 54, revelationType: "Meccan" },
  { number: 35, nameEn: "Fatir", nameAr: "فاطر", meaning: "Originator", verses: 45, revelationType: "Meccan" },
  { number: 36, nameEn: "Ya-Sin", nameAr: "يس", meaning: "Ya Sin", verses: 83, revelationType: "Meccan" },
  { number: 37, nameEn: "As-Saffat", nameAr: "الصافات", meaning: "Those Who Set The Ranks", verses: 182, revelationType: "Meccan" },
  { number: 38, nameEn: "Sad", nameAr: "ص", meaning: "The Letter 'Saad'", verses: 88, revelationType: "Meccan" },
  { number: 39, nameEn: "Az-Zumar", nameAr: "الزمر", meaning: "The Troops", verses: 75, revelationType: "Meccan" },
  { number: 40, nameEn: "Ghafir", nameAr: "غافر", meaning: "The Forgiver", verses: 85, revelationType: "Meccan" },
  { number: 41, nameEn: "Fussilat", nameAr: "فصلت", meaning: "Explained in Detail", verses: 54, revelationType: "Meccan" },
  { number: 42, nameEn: "Ash-Shura", nameAr: "الشورى", meaning: "The Consultation", verses: 53, revelationType: "Meccan" },
  { number: 43, nameEn: "Az-Zukhruf", nameAr: "الزخرف", meaning: "The Ornaments of Gold", verses: 89, revelationType: "Meccan" },
  { number: 44, nameEn: "Ad-Dukhan", nameAr: "الدخان", meaning: "The Smoke", verses: 59, revelationType: "Meccan" },
  { number: 45, nameEn: "Al-Jathiyah", nameAr: "الجاثية", meaning: "The Crouching", verses: 37, revelationType: "Meccan" },
  { number: 46, nameEn: "Al-Ahqaf", nameAr: "الأحقاف", meaning: "The Wind-Curved Sandhills", verses: 35, revelationType: "Meccan" },
  { number: 47, nameEn: "Muhammad", nameAr: "محمد", meaning: "Muhammad", verses: 38, revelationType: "Medinan" },
  { number: 48, nameEn: "Al-Fath", nameAr: "الفتح", meaning: "The Victory", verses: 29, revelationType: "Medinan" },
  { number: 49, nameEn: "Al-Hujurat", nameAr: "الحجرات", meaning: "The Rooms", verses: 18, revelationType: "Medinan" },
  { number: 50, nameEn: "Qaf", nameAr: "ق", meaning: "The Letter 'Qaf'", verses: 45, revelationType: "Meccan" },
  { number: 51, nameEn: "Ad-Dhariyat", nameAr: "الذاريات", meaning: "The Winnowing Winds", verses: 60, revelationType: "Meccan" },
  { number: 52, nameEn: "At-Tur", nameAr: "الطور", meaning: "The Mount", verses: 49, revelationType: "Meccan" },
  { number: 53, nameEn: "An-Najm", nameAr: "النجم", meaning: "The Star", verses: 62, revelationType: "Meccan" },
  { number: 54, nameEn: "Al-Qamar", nameAr: "القمر", meaning: "The Moon", verses: 55, revelationType: "Meccan" },
  { number: 55, nameEn: "Ar-Rahman", nameAr: "الرحمن", meaning: "The Beneficent", verses: 78, revelationType: "Medinan" },
  { number: 56, nameEn: "Al-Waqi'ah", nameAr: "الواقعة", meaning: "The Inevitable", verses: 96, revelationType: "Meccan" },
  { number: 57, nameEn: "Al-Hadid", nameAr: "الحديد", meaning: "The Iron", verses: 29, revelationType: "Medinan" },
  { number: 58, nameEn: "Al-Mujadila", nameAr: "المجادلة", meaning: "The Pleading Woman", verses: 22, revelationType: "Medinan" },
  { number: 59, nameEn: "Al-Hashr", nameAr: "الحشر", meaning: "The Exile", verses: 24, revelationType: "Medinan" },
  { number: 60, nameEn: "Al-Mumtahanah", nameAr: "الممتحنة", meaning: "She That Is to Be Examined", verses: 13, revelationType: "Medinan" },
  { number: 61, nameEn: "As-Saff", nameAr: "الصف", meaning: "The Ranks", verses: 14, revelationType: "Medinan" },
  { number: 62, nameEn: "Al-Jumu'ah", nameAr: "الجمعة", meaning: "The Congregation", verses: 11, revelationType: "Medinan" },
  { number: 63, nameEn: "Al-Munafiqun", nameAr: "المنافقون", meaning: "The Hypocrites", verses: 11, revelationType: "Medinan" },
  { number: 64, nameEn: "At-Taghabun", nameAr: "التغابن", meaning: "The Mutual Disillusion", verses: 18, revelationType: "Medinan" },
  { number: 65, nameEn: "At-Talaq", nameAr: "الطلاق", meaning: "The Divorce", verses: 12, revelationType: "Medinan" },
  { number: 66, nameEn: "At-Tahrim", nameAr: "التحريم", meaning: "The Prohibition", verses: 12, revelationType: "Medinan" },
  { number: 67, nameEn: "Al-Mulk", nameAr: "الملك", meaning: "The Sovereignty", verses: 30, revelationType: "Meccan" },
  { number: 68, nameEn: "Al-Qalam", nameAr: "القلم", meaning: "The Pen", verses: 52, revelationType: "Meccan" },
  { number: 69, nameEn: "Al-Haqqah", nameAr: "الحاقة", meaning: "The Reality", verses: 52, revelationType: "Meccan" },
  { number: 70, nameEn: "Al-Ma'arij", nameAr: "المعارج", meaning: "The Ascending Stairways", verses: 44, revelationType: "Meccan" },
  { number: 71, nameEn: "Nuh", nameAr: "نوح", meaning: "Noah", verses: 28, revelationType: "Meccan" },
  { number: 72, nameEn: "Al-Jinn", nameAr: "الجن", meaning: "The Jinn", verses: 28, revelationType: "Meccan" },
  { number: 73, nameEn: "Al-Muzzammil", nameAr: "المزمل", meaning: "The Enshrouded One", verses: 20, revelationType: "Meccan" },
  { number: 74, nameEn: "Al-Muddathir", nameAr: "المدثر", meaning: "The Cloaked One", verses: 56, revelationType: "Meccan" },
  { number: 75, nameEn: "Al-Qiyamah", nameAr: "القيامة", meaning: "The Resurrection", verses: 40, revelationType: "Meccan" },
  { number: 76, nameEn: "Al-Insan", nameAr: "الانسان", meaning: "The Man", verses: 31, revelationType: "Medinan" },
  { number: 77, nameEn: "Al-Mursalat", nameAr: "المرسلات", meaning: "The Emissaries", verses: 50, revelationType: "Meccan" },
  { number: 78, nameEn: "An-Naba", nameAr: "النبأ", meaning: "The Tidings", verses: 40, revelationType: "Meccan" },
  { number: 79, nameEn: "An-Nazi'at", nameAr: "النازعات", meaning: "Those Who Drag Forth", verses: 46, revelationType: "Meccan" },
  { number: 80, nameEn: "Abasa", nameAr: "عبس", meaning: "He Frowned", verses: 42, revelationType: "Meccan" },
  { number: 81, nameEn: "At-Takwir", nameAr: "التكوير", meaning: "The Overthrowing", verses: 29, revelationType: "Meccan" },
  { number: 82, nameEn: "Al-Infitar", nameAr: "الإنفطار", meaning: "The Cleaving", verses: 19, revelationType: "Meccan" },
  { number: 83, nameEn: "Al-Mutaffifin", nameAr: "المطففين", meaning: "The Defrauding", verses: 36, revelationType: "Meccan" },
  { number: 84, nameEn: "Al-Inshiqaq", nameAr: "الإنشقاق", meaning: "The Sundering", verses: 25, revelationType: "Meccan" },
  { number: 85, nameEn: "Al-Buruj", nameAr: "البروج", meaning: "The Mansions of the Stars", verses: 22, revelationType: "Meccan" },
  { number: 86, nameEn: "At-Tariq", nameAr: "الطارق", meaning: "The Morning Star", verses: 17, revelationType: "Meccan" },
  { number: 87, nameEn: "Al-A'la", nameAr: "الأعلى", meaning: "The Most High", verses: 19, revelationType: "Meccan" },
  { number: 88, nameEn: "Al-Ghashiyah", nameAr: "الغاشية", meaning: "The Overwhelming", verses: 26, revelationType: "Meccan" },
  { number: 89, nameEn: "Al-Fajr", nameAr: "الفجر", meaning: "The Dawn", verses: 30, revelationType: "Meccan" },
  { number: 90, nameEn: "Al-Balad", nameAr: "البلد", meaning: "The City", verses: 20, revelationType: "Meccan" },
  { number: 91, nameEn: "Ash-Shams", nameAr: "الشمس", meaning: "The Sun", verses: 15, revelationType: "Meccan" },
  { number: 92, nameEn: "Al-Layl", nameAr: "الليل", meaning: "The Night", verses: 21, revelationType: "Meccan" },
  { number: 93, nameEn: "Ad-Duhaa", nameAr: "الضحى", meaning: "The Morning Hours", verses: 11, revelationType: "Meccan" },
  { number: 94, nameEn: "Ash-Sharh", nameAr: "الشرح", meaning: "The Relief", verses: 8, revelationType: "Meccan" },
  { number: 95, nameEn: "At-Tin", nameAr: "التين", meaning: "The Fig", verses: 8, revelationType: "Meccan" },
  { number: 96, nameEn: "Al-Alaq", nameAr: "العلق", meaning: "The Clot", verses: 19, revelationType: "Meccan" },
  { number: 97, nameEn: "Al-Qadr", nameAr: "القدر", meaning: "The Power", verses: 5, revelationType: "Meccan" },
  { number: 98, nameEn: "Al-Bayyinah", nameAr: "البينة", meaning: "The Clear Proof", verses: 8, revelationType: "Medinan" },
  { number: 99, nameEn: "Az-Zalzalah", nameAr: "الزلزلة", meaning: "The Earthquake", verses: 8, revelationType: "Medinan" },
  { number: 100, nameEn: "Al-Adiyat", nameAr: "العاديات", meaning: "The Courser", verses: 11, revelationType: "Meccan" },
  { number: 101, nameEn: "Al-Qari'ah", nameAr: "القارعة", meaning: "The Calamity", verses: 11, revelationType: "Meccan" },
  { number: 102, nameEn: "At-Takathur", nameAr: "التكاثر", meaning: "The Rivalry in World Increase", verses: 8, revelationType: "Meccan" },
  { number: 103, nameEn: "Al-Asr", nameAr: "العصر", meaning: "The Declining Day", verses: 3, revelationType: "Meccan" },
  { number: 104, nameEn: "Al-Humazah", nameAr: "الهمزة", meaning: "The Traducer", verses: 9, revelationType: "Meccan" },
  { number: 105, nameEn: "Al-Fil", nameAr: "الفيل", meaning: "The Elephant", verses: 5, revelationType: "Meccan" },
  { number: 106, nameEn: "Quraysh", nameAr: "قريش", meaning: "Quraysh", verses: 4, revelationType: "Meccan" },
  { number: 107, nameEn: "Al-Ma'un", nameAr: "الماعون", meaning: "The Small Kindnesses", verses: 7, revelationType: "Meccan" },
  { number: 108, nameEn: "Al-Kawthar", nameAr: "الكوثر", meaning: "The Abundance", verses: 3, revelationType: "Meccan" },
  { number: 109, nameEn: "Al-Kafirun", nameAr: "الكافرون", meaning: "The Disbelievers", verses: 6, revelationType: "Meccan" },
  { number: 110, nameEn: "An-Nasr", nameAr: "النصر", meaning: "The Divine Support", verses: 3, revelationType: "Medinan" },
  { number: 111, nameEn: "Al-Masad", nameAr: "المسد", meaning: "The Palm Fiber", verses: 5, revelationType: "Meccan" },
  { number: 112, nameEn: "Al-Ikhlas", nameAr: "الإخلاص", meaning: "The Sincerity", verses: 4, revelationType: "Meccan" },
  { number: 113, nameEn: "Al-Falaq", nameAr: "الفلق", meaning: "The Daybreak", verses: 5, revelationType: "Meccan" },
  { number: 114, nameEn: "An-Nas", nameAr: "الناس", meaning: "Mankind", verses: 6, revelationType: "Meccan" }
];

interface QuranViewProps {
  initialSurah?: number;
  initialVerse?: number;
}

const QuranView: React.FC<QuranViewProps> = ({ initialSurah, initialVerse }) => {
  const { t, i18n } = useTranslation('quran');
  const isArabic = i18n.language === 'ar-EG';

  // Surah selection state - use initialSurah if provided
  const [selectedSurah, setSelectedSurah] = useState<SurahDef | null>(() => {
    if (initialSurah) {
      return SURAHS.find(s => s.number === initialSurah) || null;
    }
    return null;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [theme, setTheme] = useState<ThemeType>('classic');

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('read');

  // Read tab state
  const [surahData, setSurahData] = useState<SurahType | null>(null);
  const [loadingQuran, setLoadingQuran] = useState(false);
  const [selectedTranslation, setSelectedTranslation] = useState('en.sahih');
  const [selectedReciter, setSelectedReciter] = useState(DEFAULT_RECITER);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTajweed, setShowTajweed] = useState(false);
  const [tajweedData, setTajweedData] = useState<Map<number, string>>(new Map());
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Story tab state (existing)
  const [story, setStory] = useState<string>("");
  const [language, setLanguage] = useState<'english' | 'arabic'>('english');
  const [loadingStory, setLoadingStory] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [generatingImage, setGeneratingImage] = useState<boolean>(false);

  // TTS State for story
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // UI state
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Phase 2: Voice Search & Practice state
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [jumpVerse, setJumpVerse] = useState<number | ''>('');
  const [showAudioInfo, setShowAudioInfo] = useState(() => {
    // Show info banner once per session, dismiss persists in localStorage
    return !localStorage.getItem('quran-audio-info-dismissed');
  });
  const listenVerseRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [practiceMode, setPracticeMode] = useState<'recitation' | 'memorization'>('recitation');
  const [practiceVerse, setPracticeVerse] = useState<Verse | null>(null);

  // Study tab state
  const [studyMode, setStudyMode] = useState<'word-by-word' | 'grammar' | 'roots'>('word-by-word');
  const [selectedStudyVerse, setSelectedStudyVerse] = useState<number | null>(null);
  const [wordBreakdown, setWordBreakdown] = useState<VerseWordBreakdown | null>(null);
  const [loadingStudy, setLoadingStudy] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordMorphology | null>(null);

  const filteredSurahs = SURAHS.filter(s =>
    s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nameAr.includes(searchTerm) ||
    s.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.number.toString().includes(searchTerm)
  );

  const themeStyles = THEMES[theme].colors;

  // Load Quran data when surah is selected
  useEffect(() => {
    if (!selectedSurah) return;

    const loadQuranData = async () => {
      setLoadingQuran(true);
      try {
        const data = await getSurahWithTranslation(selectedSurah.number, selectedTranslation);
        setSurahData(data);
      } catch (e) {
        console.error('Failed to load Quran data:', e);
      } finally {
        setLoadingQuran(false);
      }
    };

    loadQuranData();
  }, [selectedSurah, selectedTranslation]);

  // Load tajweed data when toggle is on
  useEffect(() => {
    if (!showTajweed || !selectedSurah) {
      setTajweedData(new Map());
      return;
    }
    getSurahTajweedText(selectedSurah.number).then(setTajweedData);
  }, [showTajweed, selectedSurah]);

  // Handle deep link to specific verse
  useEffect(() => {
    if (initialVerse && surahData && surahData.verses.some(v => v.numberInSurah === initialVerse)) {
      setActiveTab('study');
      setSelectedStudyVerse(initialVerse);
    }
  }, [initialVerse, surahData]);

  // Load story when story tab is active
  useEffect(() => {
    if (!selectedSurah || activeTab !== 'story') return;
    if (story) return; // Don't reload if story exists

    const loadStory = async () => {
      setLoadingStory(true);
      setStory("");
      stopAudio();
      try {
        const text = await generateSurahStory(selectedSurah.nameEn, language);
        setStory(text || "Could not generate content.");
      } catch (e) {
        console.error(e);
        setStory("Error loading narrative. Please try again.");
      } finally {
        setLoadingStory(false);
      }
    };
    loadStory();
  }, [selectedSurah, activeTab, language]);

  // Load word-by-word data when study tab is active and verse is selected
  useEffect(() => {
    if (!selectedSurah || activeTab !== 'study' || !selectedStudyVerse) return;

    const loadWordData = async () => {
      setLoadingStudy(true);
      setWordBreakdown(null);
      setSelectedWord(null);
      try {
        const data = await getVerseWordBreakdown(selectedSurah.number, selectedStudyVerse);
        setWordBreakdown(data);
      } catch (e) {
        console.error('Failed to load word breakdown:', e);
      } finally {
        setLoadingStudy(false);
      }
    };

    loadWordData();
  }, [selectedSurah, activeTab, selectedStudyVerse]);

  // Reset study verse when surah changes
  useEffect(() => {
    setSelectedStudyVerse(null);
    setWordBreakdown(null);
    setSelectedWord(null);
  }, [selectedSurah]);

  // Set up audio manager callbacks
  useEffect(() => {
    audioManager.onVerseChange((surah, verse) => {
      if (selectedSurah && surah === selectedSurah.number) {
        setCurrentPlayingVerse(verse);
      }
    });

    audioManager.onEnded(() => {
      setIsAudioPlaying(false);
      setCurrentPlayingVerse(null);
    });

    return () => {
      audioManager.stop();
      stopAudio();
    };
  }, [selectedSurah]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  const handleGenerateImage = async () => {
    if (!story) return;
    setGeneratingImage(true);
    const config: VisualConfig = { aspectRatio: "16:9", resolution: "2K" };
    try {
      const prompt = `A spiritual and atmospheric illustration representing the themes of Surah ${selectedSurah?.nameEn} (${selectedSurah?.meaning}): ${story.slice(0, 150)}`;
      const img = await generateStoryImage(prompt, config);
      if (img) setImages(prev => [img, ...prev]);
    } catch (e) {
      console.error("Image generation failed", e);
    } finally {
      setGeneratingImage(false);
    }
  };

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!story) return;

    setIsPlaying(true);
    try {
      const buffer = await speakText(story);
      if (buffer) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
        sourceNodeRef.current = source;
      }
    } catch (e) {
      console.error("TTS Failed", e);
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlayVerse = async (verseNumber: number) => {
    if (selectedSurah) {
      if (isAudioPlaying && currentPlayingVerse === verseNumber) {
        audioManager.pause();
        setIsAudioPlaying(false);
      } else {
        await audioManager.playVerse(selectedSurah.number, verseNumber);
        setIsAudioPlaying(true);
        setShowFloatingPlayer(true);
      }
    }
  };

  const handlePlayAllFromVerse = async (startVerse: number) => {
    if (selectedSurah && surahData) {
      await audioManager.playSurah(selectedSurah.number, startVerse, surahData.numberOfAyahs);
      setIsAudioPlaying(true);
      setShowFloatingPlayer(true);
    }
  };

  // Tab content renderers
  const renderReadTab = () => {
    if (loadingQuran) {
      return (
        <div className={`flex flex-col items-center justify-center h-64 ${themeStyles.loadingIcon} animate-pulse`}>
          <i className="fas fa-quran text-4xl mb-4"></i>
          <p className="text-xl font-serif">Loading verses...</p>
        </div>
      );
    }

    if (!surahData) {
      return (
        <div className="text-center text-stone-500 py-12">
          <i className="fas fa-exclamation-circle text-4xl mb-4"></i>
          <p>Failed to load Quran data. Please try again.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Bismillah (except for Surah 9) */}
        {selectedSurah?.number !== 9 && (
          <div className="text-center py-6 mb-4">
            <p className="text-3xl font-amiri text-rose-900" dir="rtl">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-sm text-stone-500 mt-2">In the name of Allah, the Most Gracious, the Most Merciful</p>
          </div>
        )}

        {/* Verses */}
        {surahData.verses.map((verse) => (
          <VerseDisplay
            key={verse.numberInSurah}
            verse={verse}
            surahNumber={selectedSurah!.number}
            isPlaying={isAudioPlaying}
            isCurrentVerse={currentPlayingVerse === verse.numberInSurah}
            showTranslation={showTranslation}
            fontSize={fontSize}
            onPlayClick={handlePlayVerse}
            tajweedHtml={showTajweed ? tajweedData.get(verse.numberInSurah) : undefined}
          />
        ))}
      </div>
    );
  };

  const renderStoryTab = () => {
    if (loadingStory) {
      return (
        <div className={`flex flex-col items-center justify-center h-64 ${themeStyles.loadingIcon} animate-pulse`}>
          <i className="fas fa-quran text-4xl mb-4"></i>
          <p className="text-xl font-serif">{t('loading.story')}</p>
        </div>
      );
    }

    return (
      <div className={`${immersiveMode ? 'max-w-2xl' : 'max-w-4xl'} mx-auto transition-all`}>
        {images.length > 0 && (
          <div className={`mb-8 ${immersiveMode ? 'rounded-lg opacity-80' : 'rounded-xl shadow-lg'} overflow-hidden`}>
            <img src={images[0]} alt="Visualization" className="w-full h-64 md:h-96 object-cover" />
          </div>
        )}

        <div
          dir={language === 'arabic' ? 'rtl' : 'ltr'}
          className={`prose prose-xl ${themeStyles.prose} max-w-none ${themeStyles.bodyText} leading-loose ${language === 'arabic' ? 'text-right font-[Amiri]' : 'font-serif'}`}
        >
          {story.split('\n').map((line, i) => {
            if (line.startsWith('**') || line.startsWith('#')) {
              return <h3 key={i} className="mt-8 mb-4 font-bold opacity-80">{line.replace(/[#*]/g, '')}</h3>;
            }
            return <p key={i} className="mb-6">{line}</p>;
          })}
        </div>

        {!immersiveMode && (
          <div className="mt-12 flex justify-center gap-4 pb-8 border-t border-black/10 pt-8">
            <button
              onClick={playAudio}
              className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all ${isPlaying ? themeStyles.audioBtnActive : themeStyles.audioBtnIdle} text-white`}
            >
              <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>
              {isPlaying ? t('actions.stop') : t('actions.listenToStory')}
            </button>
            <button
              onClick={handleGenerateImage}
              disabled={generatingImage}
              className={`${themeStyles.primaryBtn} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all disabled:opacity-50`}
            >
              <i className={`fas ${generatingImage ? 'fa-spinner fa-spin' : 'fa-image'}`}></i>
              {generatingImage ? t('actions.creating') : t('actions.visualize')}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderListenTab = () => {
    if (!surahData) {
      return (
        <div className="text-center text-stone-500 py-12">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p>{t('loading.audio')}</p>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        {/* Audio streaming info banner */}
        {showAudioInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">{t('listen.audioInfo')}</p>
                <p className="text-sm text-blue-700 mt-1">{t('listen.audioInfoMessage')}</p>
              </div>
              <button
                onClick={() => {
                  setShowAudioInfo(false);
                  localStorage.setItem('quran-audio-info-dismissed', 'true');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap"
              >
                {t('listen.audioInfoDismiss')}
              </button>
            </div>
          </div>
        )}

        {/* Jump to verse */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-sm text-stone-600 mb-1">{t('listen.jumpTo')}</label>
            <input
              type="number"
              min={1}
              max={surahData.numberOfAyahs}
              value={jumpVerse}
              onChange={(e) => {
                const val = e.target.value;
                setJumpVerse(val === '' ? '' : Number(val));
              }}
              className="w-full p-2.5 border rounded-lg text-sm"
              placeholder={`1 - ${surahData.numberOfAyahs}`}
            />
          </div>
          <button
            onClick={() => {
              if (!jumpVerse || jumpVerse < 1 || jumpVerse > surahData.numberOfAyahs) return;
              handlePlayVerse(jumpVerse);
              listenVerseRefs.current[jumpVerse]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg shadow hover:bg-rose-700 transition-colors"
          >
            {t('listen.go')}
          </button>
        </div>

        {/* Audio Player */}
        <AudioPlayer
          surahNumber={selectedSurah!.number}
          surahName={isArabic ? selectedSurah!.nameAr : selectedSurah!.nameEn}
          totalVerses={surahData.numberOfAyahs}
          currentVerse={currentPlayingVerse || 1}
          onVerseChange={(verse) => setCurrentPlayingVerse(verse)}
        />

        {/* Verse List with Play Buttons */}
        <div className="mt-8 space-y-2">
          <h3 className="font-semibold text-stone-700 mb-4">{t('listen.verses')}</h3>
          {surahData.verses.map((verse) => (
            <button
              key={verse.numberInSurah}
              onClick={() => handlePlayVerse(verse.numberInSurah)}
              className={`
                w-full p-3 rounded-lg text-left transition-all flex items-center gap-3
                ${currentPlayingVerse === verse.numberInSurah
                  ? 'bg-rose-100 border-l-4 border-rose-500'
                  : 'bg-white/80 hover:bg-white border-l-4 border-transparent'
                }
              `}
              ref={(el) => {
                listenVerseRefs.current[verse.numberInSurah] = el;
              }}
            >
              <span className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 text-sm font-bold flex-shrink-0">
                {verse.numberInSurah}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-amiri text-right truncate" dir="rtl">
                  {verse.arabic.slice(0, 60)}...
                </p>
              </div>
              <i className={`fas ${currentPlayingVerse === verse.numberInSurah && isAudioPlaying ? 'fa-pause' : 'fa-play'} text-rose-600`}></i>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStudyTab = () => {
    // Verse selector when no verse is selected
    if (!selectedStudyVerse) {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <i className="fas fa-list text-rose-600"></i>
              {t('study.selectVerse')}
            </h3>
            <p className="text-stone-500 text-sm mb-4">
              {t('study.chooseVerse', { surah: isArabic ? selectedSurah?.nameAr : selectedSurah?.nameEn })}
            </p>
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-2 max-h-64 overflow-y-auto p-2">
              {surahData?.verses.map((verse) => (
                <button
                  key={verse.numberInSurah}
                  onClick={() => setSelectedStudyVerse(verse.numberInSurah)}
                  className="w-9 h-9 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition-all hover:scale-105 flex items-center justify-center text-sm"
                >
                  {verse.numberInSurah}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Loading state
    if (loadingStudy) {
      return (
        <div className={`flex flex-col items-center justify-center h-64 ${themeStyles.loadingIcon} animate-pulse`}>
          <i className="fas fa-book text-4xl mb-4"></i>
          <p className="text-xl font-serif">{t('study.analyzing')}</p>
        </div>
      );
    }

    // Get current verse data
    const currentVerse = surahData?.verses.find(v => v.numberInSurah === selectedStudyVerse);

    return (
      <div className="max-w-4xl mx-auto">
        {/* Verse Navigation & Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setSelectedStudyVerse(null)}
              className="text-stone-500 hover:text-rose-600 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-arrow-left"></i>
              <span className="text-sm">{t('study.allVerses')}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedStudyVerse(Math.max(1, selectedStudyVerse - 1))}
                disabled={selectedStudyVerse <= 1}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </button>
              <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-medium">
                {t('study.verseNumber', { number: selectedStudyVerse })}
              </span>
              <button
                onClick={() => setSelectedStudyVerse(Math.min(surahData?.verses.length || 1, selectedStudyVerse + 1))}
                disabled={selectedStudyVerse >= (surahData?.verses.length || 1)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
              {/* Share Verse Button */}
              <ShareButton
                type="verse"
                surah={selectedSurah?.number}
                verse={selectedStudyVerse}
                verseText={currentVerse?.translation}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-600 flex items-center justify-center transition-colors"
                iconOnly
              />
            </div>
          </div>

          {/* Full verse display */}
          {currentVerse && (
            <div className="space-y-2">
              <p className="text-2xl font-amiri text-right leading-loose text-stone-800" dir="rtl">
                {currentVerse.arabic}
              </p>
              {currentVerse.translation && (
                <p className="text-stone-600 text-sm italic">
                  {currentVerse.translation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Study Mode Tabs */}
        <div className="flex bg-stone-100 rounded-xl p-1 mb-4">
          <button
            onClick={() => setStudyMode('word-by-word')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              studyMode === 'word-by-word'
                ? 'bg-white shadow-md text-rose-700'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-align-right"></i>
            {t('study.wordByWord')}
          </button>
          <button
            onClick={() => setStudyMode('grammar')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              studyMode === 'grammar'
                ? 'bg-white shadow-md text-rose-700'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-graduation-cap"></i>
            {t('study.grammar')}
          </button>
          <button
            onClick={() => setStudyMode('roots')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              studyMode === 'roots'
                ? 'bg-white shadow-md text-rose-700'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-tree"></i>
            {t('study.rootWords')}
          </button>
        </div>

        {/* Content based on study mode */}
        {wordBreakdown ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            {studyMode === 'word-by-word' && (
              <div>
                <h4 className="text-sm font-medium text-stone-500 mb-4 flex items-center gap-2">
                  <i className="fas fa-info-circle"></i>
                  {t('practice.tapWord', { count: wordBreakdown.totalWords })}
                </h4>
                <div className="flex flex-wrap gap-3 justify-center" dir="rtl">
                  {wordBreakdown.words.map((word, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedWord(selectedWord?.position === word.position ? null : word)}
                      className={`bg-gradient-to-b from-stone-50 to-stone-100 rounded-xl p-3 text-center shadow-sm hover:shadow-md transition-all min-w-[90px] border-2 ${
                        selectedWord?.position === word.position
                          ? 'border-rose-400 ring-2 ring-rose-200'
                          : 'border-transparent hover:border-rose-200'
                      }`}
                    >
                      <p className="text-2xl font-amiri text-stone-800 mb-1">{word.arabic}</p>
                      <p className="text-xs text-rose-600 mb-0.5">{word.transliteration}</p>
                      <p className="text-xs text-stone-600">{word.translation}</p>
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${getPosColor(word.partOfSpeech)}`}>
                        {getGrammarLabel(word.partOfSpeech)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected word detail panel */}
                {selectedWord && (
                  <div className="mt-6 p-4 bg-rose-50 rounded-xl border border-rose-200">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-rose-800 flex items-center gap-2">
                        <i className="fas fa-search"></i>
                        {t('study.wordDetails')}
                      </h4>
                      <button
                        onClick={() => setSelectedWord(null)}
                        className="text-rose-400 hover:text-rose-600"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-2xl font-amiri text-stone-800">{selectedWord.arabic}</p>
                        <p className="text-xs text-stone-500 mt-1">{t('study.labels.arabic')}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-lg text-rose-700">{selectedWord.transliteration}</p>
                        <p className="text-xs text-stone-500 mt-1">{t('study.labels.transliteration')}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-lg text-stone-700">{selectedWord.translation}</p>
                        <p className="text-xs text-stone-500 mt-1">{t('study.labels.translation')}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getPosColor(selectedWord.partOfSpeech)}`}>
                          {getGrammarLabel(selectedWord.partOfSpeech)}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">{t('study.labels.partOfSpeech')}</p>
                      </div>
                    </div>
                    {selectedWord.rootWord && (
                      <div className="mt-3 p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2 text-stone-600">
                          <i className="fas fa-tree text-green-600"></i>
                          <span className="text-sm">{t('study.labels.root')}:</span>
                          <span className="font-amiri text-lg text-stone-800">{selectedWord.rootArabic}</span>
                          <span className="text-stone-500">({selectedWord.rootWord})</span>
                        </div>
                      </div>
                    )}
                    {selectedWord.grammaticalTags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedWord.grammaticalTags.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-white rounded-full text-xs text-stone-600">
                            {getGrammarLabel(tag)} ({selectedWord.grammaticalTagsArabic[i]})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {studyMode === 'grammar' && (
              <div>
                <h4 className="text-sm font-medium text-stone-500 mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-pie"></i>
                  {t('study.grammarAnalysis')}
                </h4>
                {/* Grammar stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {getGrammarStats(wordBreakdown).map((stat, index) => (
                    <div key={index} className="bg-stone-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-stone-700">{stat.count}</p>
                      <p className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${stat.color}`}>
                        {stat.pos}
                      </p>
                      <p className="text-xs text-stone-400 mt-1 font-amiri">{stat.posArabic}</p>
                    </div>
                  ))}
                </div>

                {/* Word list with grammar */}
                <div className="space-y-2">
                  {wordBreakdown.words.map((word, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-medium">
                        {word.position}
                      </span>
                      <span className="font-amiri text-xl text-stone-800 min-w-[80px] text-right" dir="rtl">
                        {word.arabic}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPosColor(word.partOfSpeech)}`}>
                        {getGrammarLabel(word.partOfSpeech)}
                      </span>
                      <span className="text-stone-500 text-sm flex-1">{word.translation}</span>
                      {word.grammaticalTags.length > 0 && (
                        <div className="hidden md:flex gap-1">
                          {word.grammaticalTags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-stone-200 rounded text-[10px] text-stone-600">
                              {getGrammarLabel(tag)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {studyMode === 'roots' && (
              <div>
                <h4 className="text-sm font-medium text-stone-500 mb-4 flex items-center gap-2">
                  <i className="fas fa-tree"></i>
                  {t('roots.title')}
                </h4>
                {getUniqueRoots(wordBreakdown).length > 0 ? (
                  <div className="space-y-4">
                    {getUniqueRoots(wordBreakdown).map((rootInfo, index) => (
                      <div key={index} className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="font-amiri text-xl text-green-700">{rootInfo.rootArabic}</span>
                          </div>
                          <div>
                            <p className="font-medium text-green-800">{rootInfo.root}</p>
                            <p className="text-sm text-green-600">{t('roots.wordsFromRoot', { count: rootInfo.words.length })}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {rootInfo.words.map((word, i) => (
                            <div key={i} className="bg-white rounded-lg px-3 py-2 text-center">
                              <p className="font-amiri text-lg text-stone-800">{word.arabic}</p>
                              <p className="text-xs text-stone-500">{word.translation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    <i className="fas fa-tree text-4xl mb-3 opacity-30"></i>
                    <p className={isArabic ? 'font-arabic' : ''}>{t('roots.notAvailable')}</p>
                    <p className={`text-sm mt-1 ${isArabic ? 'font-arabic' : ''}`}>{t('roots.tryHint')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 rounded-2xl p-8 text-center border border-amber-200">
            <i className="fas fa-exclamation-circle text-4xl text-amber-500 mb-3"></i>
            <h4 className={`font-semibold text-amber-800 mb-2 ${isArabic ? 'font-arabic' : ''}`}>{t('roots.wordAnalysisUnavailable')}</h4>
            <p className={`text-amber-700 text-sm ${isArabic ? 'font-arabic' : ''}`}>
              {t('roots.moreComing')}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderPracticeTab = () => {
    if (!surahData) {
      return (
        <div className="text-center text-stone-500 py-12">
          <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p className={isArabic ? 'font-arabic' : ''}>{t('practice.loading')}</p>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto">
        {/* Practice Mode Selector */}
        <div className="flex bg-stone-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setPracticeMode('recitation')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              practiceMode === 'recitation'
                ? 'bg-white shadow-md text-rose-700'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-microphone"></i>
            {t('practice.recitationCheck')}
          </button>
          <button
            onClick={() => setPracticeMode('memorization')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              practiceMode === 'memorization'
                ? 'bg-white shadow-md text-rose-700'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <i className="fas fa-brain"></i>
            {t('practice.memorization')}
          </button>
        </div>

        {/* Verse Selector */}
        {!practiceVerse ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
            <h3 className={`font-semibold text-stone-800 mb-4 flex items-center gap-2 ${isArabic ? 'font-arabic flex-row-reverse' : ''}`}>
              <i className="fas fa-list text-rose-600"></i>
              {t('practice.selectVerse')}
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2 max-h-64 overflow-y-auto">
              {surahData.verses.map((verse) => (
                <button
                  key={verse.numberInSurah}
                  onClick={() => setPracticeVerse(verse)}
                  className="w-10 h-10 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium transition-all hover:scale-105 flex items-center justify-center"
                >
                  {verse.numberInSurah}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Back Button */}
            <button
              onClick={() => setPracticeVerse(null)}
              className={`mb-4 text-rose-600 hover:text-rose-700 flex items-center gap-2 transition-colors ${isArabic ? 'flex-row-reverse font-arabic' : ''}`}
            >
              <i className={`fas fa-arrow-${isArabic ? 'right' : 'left'}`}></i>
              {t('practice.chooseDifferent')}
            </button>

            {/* Practice Component */}
            {practiceMode === 'recitation' ? (
              <RecitationChecker
                verse={practiceVerse}
                surahNumber={selectedSurah!.number}
                onComplete={(accuracy) => {
                  console.log('Recitation completed with accuracy:', accuracy);
                }}
                onNext={() => {
                  // Move to next verse
                  if (surahData) {
                    const nextVerse = surahData.verses.find(v => v.numberInSurah === practiceVerse.numberInSurah + 1);
                    if (nextVerse) {
                      setPracticeVerse(nextVerse);
                    } else {
                      setPracticeVerse(null);
                    }
                  }
                }}
              />
            ) : (
              <MemorizationMode
                verses={[practiceVerse]}
                surahNumber={selectedSurah!.number}
                surahName={isArabic ? selectedSurah!.nameAr : selectedSurah!.nameEn}
                onProgress={(completed, total) => {
                  console.log(`Memorization progress: ${completed}/${total}`);
                  if (completed === total) {
                    setPracticeVerse(null);
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // Surah detail view
  if (selectedSurah) {
    return (
      <div className={`flex flex-col h-full bg-white transition-all duration-700 ${immersiveMode ? 'fixed inset-0 z-50' : 'rounded-lg shadow-xl overflow-hidden animate-in fade-in'}`}>
        {/* Header */}
        <div className={`${themeStyles.headerBg} ${themeStyles.headerText} ${immersiveMode ? 'p-4 backdrop-blur-md bg-opacity-90' : 'p-4'} flex flex-col sticky top-0 z-10 shadow-md transition-colors duration-500`}>
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => immersiveMode ? setImmersiveMode(false) : (setSelectedSurah(null), setStory(""), setImages([]), setSurahData(null))}
                className={`${themeStyles.backBtnHover} p-2 rounded-full transition-colors`}
              >
                <i className={`fas ${immersiveMode ? 'fa-compress' : isArabic ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
              </button>
              <div>
                <h2 className={`text-xl font-serif ${isArabic ? 'font-arabic' : ''}`}>{isArabic ? selectedSurah.nameAr : selectedSurah.nameEn}</h2>
                {!immersiveMode && (
                  <p className={`${themeStyles.subText} text-xs font-arabic`}>
                    {selectedSurah.nameAr} • {isArabic ? '' : selectedSurah.meaning} • {selectedSurah.verses} {t('surah.verses')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {/* Voice Search Button */}
              <button
                onClick={() => setShowVoiceSearch(true)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title={t('search.voiceTooltip')}
              >
                <i className="fas fa-search"></i>
              </button>

              {/* Settings Button */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <i className="fas fa-cog"></i>
                </button>

                {showSettings && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl z-50 p-4 text-stone-800">
                      <h4 className="font-semibold mb-3">{t('settings.title')}</h4>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-stone-600 mb-2 block">{t('settings.fontSize')}</label>
                          <FontSizeSelector selectedSize={fontSize} onSizeChange={setFontSize} />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm text-stone-600">{t('settings.showTranslation')}</label>
                          <button
                            onClick={() => setShowTranslation(!showTranslation)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${showTranslation ? 'bg-rose-600' : 'bg-stone-300'}`}
                          >
                            <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform shadow-sm ${showTranslation ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm text-stone-600 flex items-center gap-1.5">
                            <i className="fas fa-palette text-xs text-rose-500"></i>
                            Tajweed Colors
                          </label>
                          <button
                            onClick={() => setShowTajweed(!showTajweed)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${showTajweed ? 'bg-rose-600' : 'bg-stone-300'}`}
                          >
                            <span className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform shadow-sm ${showTajweed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>

                        <div>
                          <label className="text-sm text-stone-600 mb-2 block">{t('settings.translation')}</label>
                          <select
                            value={selectedTranslation}
                            onChange={(e) => setSelectedTranslation(e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm"
                          >
                            {Object.entries(TRANSLATIONS).map(([id, info]) => (
                              <option key={id} value={id}>{info.name} ({info.language})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm text-stone-600 mb-2 block">{t('settings.reciter')}</label>
                          <select
                            value={selectedReciter}
                            onChange={(e) => {
                              setSelectedReciter(e.target.value);
                              audioManager.setReciter(e.target.value);
                            }}
                            className="w-full p-2 border rounded-lg text-sm"
                          >
                            {RECITERS.map((r) => (
                              <option key={r.identifier} value={r.identifier}>{r.englishName}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-sm text-stone-600 mb-2 block">{t('settings.theme')}</label>
                          <div className="flex gap-2">
                            {Object.keys(THEMES).map((themeKey) => (
                              <button
                                key={themeKey}
                                onClick={() => setTheme(themeKey as ThemeType)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  theme === themeKey ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                }`}
                              >
                                {t(`themes.${themeKey}`)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setImmersiveMode(!immersiveMode)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title={t('actions.focusMode')}
              >
                <i className="fas fa-expand"></i>
              </button>
            </div>
          </div>

          {/* Tabs */}
          {!immersiveMode && (
            <div className="flex bg-black/20 rounded-lg p-1">
              {[
                { id: 'read' as TabType, label: t('tabs.read'), icon: 'fa-book-open' },
                { id: 'story' as TabType, label: t('tabs.story'), icon: 'fa-scroll' },
                { id: 'listen' as TabType, label: t('tabs.listen'), icon: 'fa-headphones' },
                { id: 'study' as TabType, label: t('tabs.study'), icon: 'fa-graduation-cap' },
                { id: 'practice' as TabType, label: t('tabs.practice'), icon: 'fa-microphone-alt' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === tab.id ? themeStyles.tabActive : themeStyles.tabInactive
                  }`}
                >
                  <i className={`fas ${tab.icon} text-xs`}></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${immersiveMode ? 'p-12 md:p-24' : 'p-4 md:p-6'} ${themeStyles.bodyBg} transition-colors duration-500 scroll-smooth`}>
          {activeTab === 'read' && renderReadTab()}
          {activeTab === 'story' && renderStoryTab()}
          {activeTab === 'listen' && renderListenTab()}
          {activeTab === 'study' && renderStudyTab()}
          {activeTab === 'practice' && renderPracticeTab()}
        </div>

        {/* Floating Audio Player */}
        <FloatingAudioPlayer
          surahNumber={selectedSurah.number}
          surahName={isArabic ? selectedSurah.nameAr : selectedSurah.nameEn}
          totalVerses={selectedSurah.verses || 0}
          currentVerse={currentPlayingVerse || 1}
          isVisible={showFloatingPlayer && activeTab !== 'listen'}
          onClose={() => {
            setShowFloatingPlayer(false);
            audioManager.stop();
            setIsAudioPlaying(false);
          }}
          onVerseChange={(verse) => setCurrentPlayingVerse(verse)}
        />

        {/* Voice Search Modal */}
        {showVoiceSearch && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-stone-100">
                <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                  <i className="fas fa-search text-rose-600"></i>
                  {t('search.voiceSearch')}
                </h3>
                <button
                  onClick={() => setShowVoiceSearch(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <i className="fas fa-times text-stone-500"></i>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
                <VoiceSearch
                  onNavigateToVerse={(surahNumber, verseNumber) => {
                    // Navigate to the surah and verse
                    const surahDef = SURAHS.find(s => s.number === surahNumber);
                    if (surahDef) {
                      setSelectedSurah(surahDef);
                      setActiveTab('read');
                    }
                    setShowVoiceSearch(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Alaya Tutor - AI Learning Companion */}
        <AlayaTutorWrapper
          context={{
            activity: 'quran',
            currentSurah: selectedSurah.number,
            currentAyah: currentPlayingVerse || selectedStudyVerse || practiceVerse?.numberInSurah,
            language: isArabic ? 'ar' : 'en'
          }}
        />
      </div>
    );
  }

  // Surah list view
  return (
    <div className="h-full overflow-y-auto" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={`mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 ${isArabic ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h2 className={`text-3xl font-serif text-rose-900 mb-2 ${isArabic ? 'font-arabic' : ''}`}>{t('title')}</h2>
          <p className={`text-stone-600 ${isArabic ? 'font-arabic' : ''}`}>{t('subtitle')}</p>
        </div>
        <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className="relative flex-1 md:flex-none">
            <i className={`fas fa-search absolute ${isArabic ? 'right-3' : 'left-3'} top-3.5 text-stone-400`}></i>
            <input
              type="text"
              placeholder={t('search.placeholder')}
              className={`${isArabic ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'} py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 w-full md:w-64 ${isArabic ? 'font-arabic' : ''}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              dir={isArabic ? 'rtl' : 'ltr'}
            />
          </div>
          <button
            onClick={() => setShowVoiceSearch(true)}
            className={`px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm ${isArabic ? 'flex-row-reverse' : ''}`}
            title={t('search.voiceTooltip')}
          >
            <i className="fas fa-microphone"></i>
            <span className={`hidden sm:inline ${isArabic ? 'font-arabic' : ''}`}>{t('search.voiceSearch')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSurahs.map((s) => (
          <button
            key={s.number}
            onClick={() => setSelectedSurah(s)}
            className={`bg-white p-5 rounded-xl shadow-sm border border-stone-100 hover:shadow-md hover:border-rose-300 hover:scale-[1.01] transition-all group ${isArabic ? 'text-right' : 'text-left'}`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white font-bold flex items-center justify-center text-sm">
                  {s.number}
                </div>
                <div className={`${isArabic ? 'text-right' : ''}`}>
                  <h3 className="font-bold text-stone-800 group-hover:text-rose-800">
                    {isArabic ? s.nameAr : s.nameEn}
                  </h3>
                  <p className="text-sm text-stone-500">
                    {isArabic ? '' : s.meaning}
                  </p>
                </div>
              </div>
              <div className={`${isArabic ? 'text-left' : 'text-right'}`}>
                {!isArabic && <span className="font-arabic text-xl text-rose-900">{s.nameAr}</span>}
                <p className="text-xs text-stone-400 mt-1">
                  {s.verses} {t('surah.verses', 'verses')}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
              <span className={`px-2 py-0.5 rounded-full ${s.revelationType === 'Meccan' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {s.revelationType === 'Meccan' ? t('surah.meccan', 'Meccan') : t('surah.medinan', 'Medinan')}
              </span>
            </div>
          </button>
        ))}
        {filteredSurahs.length === 0 && (
          <div className={`col-span-full text-center py-12 text-stone-500 ${isArabic ? 'font-arabic' : ''}`}>
            {t('search.noResults')} "{searchTerm}"
          </div>
        )}
      </div>

      <div className="mt-12 bg-gradient-to-r from-rose-50 to-amber-50 p-6 rounded-xl border border-rose-100 text-center">
        <p className={`text-rose-800 italic text-lg ${isArabic ? 'font-arabic' : ''}`}>"{t('quote.text')}"</p>
        <p className={`text-rose-600 text-sm font-bold mt-2 ${isArabic ? 'font-arabic' : ''}`}>{t('quote.reference')}</p>
      </div>

      {/* Voice Search Modal in List View */}
      {showVoiceSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
                <i className="fas fa-microphone text-rose-600"></i>
                {t('search.voiceSearch')}
              </h3>
              <button
                onClick={() => setShowVoiceSearch(false)}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <i className="fas fa-times text-stone-500"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
              <VoiceSearch
                onNavigateToVerse={(surahNumber, verseNumber) => {
                  // Navigate to the surah and verse
                  const surahDef = SURAHS.find(s => s.number === surahNumber);
                  if (surahDef) {
                    setSelectedSurah(surahDef);
                    setActiveTab('read');
                  }
                  setShowVoiceSearch(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuranView;
