import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getKidsProgress, addKidsStars } from '../../services/offlineDatabase';
import kidsStories from '../../data/kidsStories';
import { speakWithWebSpeech } from '../../services/kidsAssetLoader';
import { speakArabicLetter, speakArabicLetterWithExample } from '../../services/geminiService';

// Kids-friendly color palette
const KIDS_COLORS = {
  coral: '#FF6B6B',
  teal: '#4ECDC4',
  yellow: '#FFE66D',
  green: '#7ED321',
  purple: '#A29BFE',
  cream: '#FFF8E7',
  orange: '#F39C12',
};

type KidsActivity = 'home' | 'alphabet' | 'quran' | 'stories' | 'rewards';

interface KidsHomeProps {
  onBack: () => void;
}

// Activity cards configuration
const ACTIVITIES = [
  {
    id: 'alphabet' as const,
    title: 'Arabic Letters',
    titleArabic: 'الحروف',
    icon: 'fa-font',
    color: KIDS_COLORS.coral,
    description: 'Learn the Arabic alphabet!',
  },
  {
    id: 'quran' as const,
    title: 'Short Surahs',
    titleArabic: 'سور قصيرة',
    icon: 'fa-book-quran',
    color: KIDS_COLORS.teal,
    description: 'Listen and memorize!',
  },
  {
    id: 'stories' as const,
    title: 'Prophet Stories',
    titleArabic: 'قصص الأنبياء',
    icon: 'fa-book-open',
    color: KIDS_COLORS.purple,
    description: 'Amazing stories!',
  },
  {
    id: 'rewards' as const,
    title: 'My Stars',
    titleArabic: 'نجومي',
    icon: 'fa-star',
    color: KIDS_COLORS.yellow,
    description: 'See your progress!',
  },
];

const KidsHome: React.FC<KidsHomeProps> = ({ onBack }) => {
  const [activity, setActivity] = useState<KidsActivity>('home');
  const [totalStars, setTotalStars] = useState(0);
  const [level, setLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load progress from database on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progress = await getKidsProgress();
        setTotalStars(progress.totalStars);
        setLevel(progress.level);
      } catch (error) {
        console.error('Failed to load kids progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, []);

  // Earn a star and persist to database
  const earnStar = useCallback(async () => {
    try {
      const newTotal = await addKidsStars(1);
      setTotalStars(newTotal);
      // Update level based on new total
      const newLevel = newTotal >= 100 ? 5 : newTotal >= 50 ? 4 : newTotal >= 25 ? 3 : newTotal >= 10 ? 2 : 1;
      setLevel(newLevel);
    } catch (error) {
      console.error('Failed to save star:', error);
      // Fallback to local state only
      setTotalStars(s => s + 1);
    }
  }, []);

  // Initialize audio context for feedback sounds
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Play tap sound feedback
  const playTapSound = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  // Handle activity selection with sound
  const handleActivityClick = (activityId: KidsActivity) => {
    playTapSound();
    setActivity(activityId);
  };

  // Level info
  const LEVELS = [
    { level: 1, name: 'Seedling', emoji: '🌱', starsRequired: 0 },
    { level: 2, name: 'Sprout', emoji: '🌿', starsRequired: 10 },
    { level: 3, name: 'Flower', emoji: '🌸', starsRequired: 25 },
    { level: 4, name: 'Tree', emoji: '🌳', starsRequired: 50 },
    { level: 5, name: 'Garden', emoji: '🏡', starsRequired: 100 },
  ];

  const currentLevel = LEVELS.find(l => l.level === level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === level + 1);
  const starsToNextLevel = nextLevel ? nextLevel.starsRequired - totalStars : 0;

  // Render the home hub with activity cards
  if (activity === 'home') {
    return (
      <div
        className="min-h-full flex flex-col"
        style={{ backgroundColor: KIDS_COLORS.cream }}
      >
        {/* Kids Header */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => {
              playTapSound();
              onBack();
            }}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>

          {/* Level & Stars Display */}
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-lg">
            <span className="text-3xl">{currentLevel.emoji}</span>
            <div className="text-left">
              <div className="text-xs text-stone-500">{currentLevel.name}</div>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <i className="fas fa-star text-sm"></i>
                <span>{totalStars}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center px-6 py-4">
          <h1 className="text-3xl font-bold text-stone-700 mb-2">
            Assalamu Alaikum! 👋
          </h1>
          <p className="text-lg text-stone-500">
            What do you want to learn today?
          </p>
        </div>

        {/* Activity Cards Grid */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {ACTIVITIES.map((act) => (
              <button
                key={act.id}
                onClick={() => handleActivityClick(act.id)}
                className="aspect-square rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-transform"
                style={{ backgroundColor: act.color }}
              >
                <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center">
                  <i className={`fas ${act.icon} text-3xl text-white`}></i>
                </div>
                <span className="text-white font-bold text-lg">{act.title}</span>
                <span className="text-white/80 text-2xl font-arabic">{act.titleArabic}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextLevel && (
          <div className="p-6">
            <div className="bg-white rounded-2xl p-4 shadow-lg max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-500">Next level: {nextLevel.emoji} {nextLevel.name}</span>
                <span className="text-sm font-bold text-amber-500">{starsToNextLevel} ⭐ to go!</span>
              </div>
              <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((totalStars - (LEVELS[level - 1]?.starsRequired || 0)) / (nextLevel.starsRequired - (LEVELS[level - 1]?.starsRequired || 0))) * 100)}%`,
                    backgroundColor: KIDS_COLORS.green
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Alphabet Learning Activity
  if (activity === 'alphabet') {
    return (
      <AlphabetActivity
        onBack={() => setActivity('home')}
        onEarnStar={earnStar}
      />
    );
  }

  // Surah Memorization Activity
  if (activity === 'quran') {
    return (
      <SurahActivity
        onBack={() => setActivity('home')}
        onEarnStar={earnStar}
      />
    );
  }

  // Prophet Stories Activity
  if (activity === 'stories') {
    return (
      <StoriesActivity
        onBack={() => setActivity('home')}
        onEarnStar={earnStar}
      />
    );
  }

  // Rewards/Progress Activity
  if (activity === 'rewards') {
    return (
      <RewardsActivity
        onBack={() => setActivity('home')}
        totalStars={totalStars}
        level={level}
      />
    );
  }

  return null;
};

// ============================================
// ALPHABET ACTIVITY COMPONENT
// ============================================

interface ActivityProps {
  onBack: () => void;
  onEarnStar: () => void;
}

// Arabic Alphabet Data
const ARABIC_LETTERS = [
  { id: 'alif', letter: 'ا', name: 'Alif', example: 'أسد', exampleMeaning: 'Lion', emoji: '🦁' },
  { id: 'baa', letter: 'ب', name: 'Baa', example: 'بطة', exampleMeaning: 'Duck', emoji: '🦆' },
  { id: 'taa', letter: 'ت', name: 'Taa', example: 'تفاح', exampleMeaning: 'Apple', emoji: '🍎' },
  { id: 'thaa', letter: 'ث', name: 'Thaa', example: 'ثعلب', exampleMeaning: 'Fox', emoji: '🦊' },
  { id: 'jeem', letter: 'ج', name: 'Jeem', example: 'جمل', exampleMeaning: 'Camel', emoji: '🐪' },
  { id: 'haa', letter: 'ح', name: 'Haa', example: 'حصان', exampleMeaning: 'Horse', emoji: '🐴' },
  { id: 'khaa', letter: 'خ', name: 'Khaa', example: 'خروف', exampleMeaning: 'Sheep', emoji: '🐑' },
  { id: 'dal', letter: 'د', name: 'Dal', example: 'دب', exampleMeaning: 'Bear', emoji: '🐻' },
  { id: 'thal', letter: 'ذ', name: 'Thal', example: 'ذرة', exampleMeaning: 'Corn', emoji: '🌽' },
  { id: 'raa', letter: 'ر', name: 'Raa', example: 'رمان', exampleMeaning: 'Pomegranate', emoji: '🍎' },
  { id: 'zay', letter: 'ز', name: 'Zay', example: 'زرافة', exampleMeaning: 'Giraffe', emoji: '🦒' },
  { id: 'seen', letter: 'س', name: 'Seen', example: 'سمكة', exampleMeaning: 'Fish', emoji: '🐟' },
  { id: 'sheen', letter: 'ش', name: 'Sheen', example: 'شمس', exampleMeaning: 'Sun', emoji: '☀️' },
  { id: 'saad', letter: 'ص', name: 'Saad', example: 'صقر', exampleMeaning: 'Falcon', emoji: '🦅' },
  { id: 'daad', letter: 'ض', name: 'Daad', example: 'ضفدع', exampleMeaning: 'Frog', emoji: '🐸' },
  { id: 'taa2', letter: 'ط', name: 'Taa', example: 'طائر', exampleMeaning: 'Bird', emoji: '🐦' },
  { id: 'thaa2', letter: 'ظ', name: 'Thaa', example: 'ظبي', exampleMeaning: 'Gazelle', emoji: '🦌' },
  { id: 'ayn', letter: 'ع', name: 'Ayn', example: 'عنب', exampleMeaning: 'Grapes', emoji: '🍇' },
  { id: 'ghayn', letter: 'غ', name: 'Ghayn', example: 'غزال', exampleMeaning: 'Deer', emoji: '🦌' },
  { id: 'faa', letter: 'ف', name: 'Faa', example: 'فيل', exampleMeaning: 'Elephant', emoji: '🐘' },
  { id: 'qaaf', letter: 'ق', name: 'Qaaf', example: 'قمر', exampleMeaning: 'Moon', emoji: '🌙' },
  { id: 'kaaf', letter: 'ك', name: 'Kaaf', example: 'كتاب', exampleMeaning: 'Book', emoji: '📖' },
  { id: 'laam', letter: 'ل', name: 'Laam', example: 'ليمون', exampleMeaning: 'Lemon', emoji: '🍋' },
  { id: 'meem', letter: 'م', name: 'Meem', example: 'موز', exampleMeaning: 'Banana', emoji: '🍌' },
  { id: 'noon', letter: 'ن', name: 'Noon', example: 'نجمة', exampleMeaning: 'Star', emoji: '⭐' },
  { id: 'haa2', letter: 'ه', name: 'Haa', example: 'هلال', exampleMeaning: 'Crescent', emoji: '🌙' },
  { id: 'waw', letter: 'و', name: 'Waw', example: 'وردة', exampleMeaning: 'Rose', emoji: '🌹' },
  { id: 'yaa', letter: 'ي', name: 'Yaa', example: 'يد', exampleMeaning: 'Hand', emoji: '✋' },
];

const AlphabetActivity: React.FC<ActivityProps> = ({ onBack, onEarnStar }) => {
  const [selectedLetter, setSelectedLetter] = useState<typeof ARABIC_LETTERS[0] | null>(null);
  const [playedLetters, setPlayedLetters] = useState<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => audioContextRef.current?.close();
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Play Arabic letter sound using Gemini TTS
  const playLetterSound = async (letter: typeof ARABIC_LETTERS[0]) => {
    if (isPlaying) return; // Prevent overlapping audio
    setIsPlaying(true);

    try {
      // Use Gemini TTS for Arabic pronunciation
      const audioBuffer = await speakArabicLetterWithExample(
        letter.letter,
        letter.example,
        letter.exampleMeaning
      );

      if (audioBuffer && audioContextRef.current) {
        // Stop any currently playing audio
        if (currentAudioSourceRef.current) {
          try {
            currentAudioSourceRef.current.stop();
          } catch (e) {
            // Ignore if already stopped
          }
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        currentAudioSourceRef.current = source;

        source.onended = () => {
          setIsPlaying(false);
          currentAudioSourceRef.current = null;
        };

        source.start();

        // Track played letters and earn star
        if (!playedLetters.has(letter.id)) {
          setPlayedLetters(prev => new Set([...prev, letter.id]));
          onEarnStar();
        }
      } else {
        // Fallback to Web Speech API if Gemini fails
        console.log('Gemini TTS failed, falling back to Web Speech');
        await speakWithWebSpeech(`${letter.name}. ${letter.letter}`, 'ar-SA');
        setIsPlaying(false);

        if (!playedLetters.has(letter.id)) {
          setPlayedLetters(prev => new Set([...prev, letter.id]));
          onEarnStar();
        }
      }
    } catch (error) {
      console.error('Error playing letter sound:', error);
      // Fallback to Web Speech API
      try {
        await speakWithWebSpeech(`${letter.name}. ${letter.letter}`, 'ar-SA');
      } catch (e) {
        console.error('Web Speech fallback also failed:', e);
      }
      setIsPlaying(false);

      // Still track and earn star even on error
      if (!playedLetters.has(letter.id)) {
        setPlayedLetters(prev => new Set([...prev, letter.id]));
        onEarnStar();
      }
    }
  };

  // Letter detail view
  if (selectedLetter) {
    return (
      <div
        className="min-h-full flex flex-col"
        style={{ backgroundColor: KIDS_COLORS.cream }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => setSelectedLetter(null)}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <div className="text-3xl">{selectedLetter.emoji}</div>
        </div>

        {/* Large Letter Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <button
            onClick={() => playLetterSound(selectedLetter)}
            className="w-48 h-48 rounded-3xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform mb-6"
            style={{ backgroundColor: KIDS_COLORS.coral }}
          >
            <span className="text-9xl text-white font-arabic">{selectedLetter.letter}</span>
          </button>

          <h2 className="text-3xl font-bold text-stone-700 mb-2">{selectedLetter.name}</h2>

          {/* Example word */}
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center mt-4">
            <div className="text-6xl mb-2">{selectedLetter.emoji}</div>
            <div className="text-4xl font-arabic text-stone-700 mb-1">{selectedLetter.example}</div>
            <div className="text-lg text-stone-500">{selectedLetter.exampleMeaning}</div>
          </div>

          {/* Tap to hear instruction */}
          <div className="mt-6 flex items-center gap-2 text-stone-500">
            <i className="fas fa-hand-pointer animate-bounce"></i>
            <span>Tap the letter to hear it!</span>
          </div>
        </div>
      </div>
    );
  }

  // Letter grid view
  return (
    <div
      className="min-h-full flex flex-col"
      style={{ backgroundColor: KIDS_COLORS.cream }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-bold text-stone-700">Arabic Letters</h1>
        <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-amber-500 font-bold">{playedLetters.size}/28</span>
        </div>
      </div>

      {/* Letter Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
          {ARABIC_LETTERS.map((letter) => (
            <button
              key={letter.id}
              onClick={() => setSelectedLetter(letter)}
              className={`aspect-square rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform ${
                playedLetters.has(letter.id) ? 'ring-4 ring-green-400' : ''
              }`}
              style={{ backgroundColor: playedLetters.has(letter.id) ? KIDS_COLORS.green : KIDS_COLORS.coral }}
            >
              <span className="text-4xl text-white font-arabic">{letter.letter}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SURAH ACTIVITY COMPONENT
// ============================================

const KIDS_SURAHS = [
  { number: 112, name: 'Al-Ikhlas', nameArabic: 'الإخلاص', meaning: 'The Sincerity', emoji: '💎', color: KIDS_COLORS.teal, verses: 4 },
  { number: 113, name: 'Al-Falaq', nameArabic: 'الفلق', meaning: 'The Daybreak', emoji: '🌅', color: KIDS_COLORS.yellow, verses: 5 },
  { number: 114, name: 'An-Nas', nameArabic: 'الناس', meaning: 'Mankind', emoji: '👨‍👩‍👧‍👦', color: KIDS_COLORS.purple, verses: 6 },
  { number: 1, name: 'Al-Fatiha', nameArabic: 'الفاتحة', meaning: 'The Opening', emoji: '🚪', color: KIDS_COLORS.coral, verses: 7 },
];

const SurahActivity: React.FC<ActivityProps> = ({ onBack, onEarnStar }) => {
  const [selectedSurah, setSelectedSurah] = useState<typeof KIDS_SURAHS[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(0);
  const [listenedSurahs, setListenedSurahs] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseAudiosRef = useRef<string[]>([]);

  // Arabic verses for each surah (with Bismillah)
  const SURAH_VERSES: Record<number, { arabic: string; translation: string }[]> = {
    112: [
      { arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Most Kind' },
      { arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', translation: 'Say: He is Allah, the One' },
      { arabic: 'اللَّهُ الصَّمَدُ', translation: 'Allah needs nothing' },
      { arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', translation: 'He has no children' },
      { arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', translation: 'Nothing is like Him' },
    ],
    113: [
      { arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Most Kind' },
      { arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', translation: 'Say: I ask Allah to protect me' },
      { arabic: 'مِن شَرِّ مَا خَلَقَ', translation: 'From bad things' },
      { arabic: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', translation: 'From the dark night' },
      { arabic: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', translation: 'From those who do bad magic' },
      { arabic: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', translation: 'From jealous people' },
    ],
    114: [
      { arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Most Kind' },
      { arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', translation: 'Say: I ask Allah to protect me' },
      { arabic: 'مَلِكِ النَّاسِ', translation: 'The King of all people' },
      { arabic: 'إِلَٰهِ النَّاسِ', translation: 'The God of all people' },
      { arabic: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', translation: 'From the sneaky whisperer' },
      { arabic: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', translation: 'Who whispers bad thoughts' },
      { arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ', translation: 'From jinn and from people' },
    ],
    1: [
      { arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', translation: 'In the name of Allah, the Most Kind' },
      { arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', translation: 'All thanks to Allah' },
      { arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', translation: 'The Most Kind, the Most Caring' },
      { arabic: 'مَالِكِ يَوْمِ الدِّينِ', translation: 'King of the Day we return' },
      { arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', translation: 'Only You we worship' },
      { arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', translation: 'Show us the right path' },
      { arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ', translation: 'The path of those You blessed' },
    ],
  };

  // Build audio URLs for the surah (using Islamic Network CDN)
  useEffect(() => {
    if (selectedSurah) {
      const surahNum = selectedSurah.number;
      const verseCount = SURAH_VERSES[surahNum]?.length || 0;
      const urls: string[] = [];

      // Get global verse numbers for this surah
      // Surah 1: verses 1-7, Surah 112: verses 6222-6225, etc.
      const SURAH_START_VERSE: Record<number, number> = {
        1: 1,
        112: 6222,
        113: 6226,
        114: 6231,
      };

      const startVerse = SURAH_START_VERSE[surahNum] || 1;
      for (let i = 0; i < verseCount; i++) {
        urls.push(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${startVerse + i}.mp3`);
      }
      verseAudiosRef.current = urls;
    }
  }, [selectedSurah]);

  const playVerse = (verseIndex: number) => {
    if (verseAudiosRef.current[verseIndex]) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(verseAudiosRef.current[verseIndex]);
      audioRef.current.play();
      setCurrentVerse(verseIndex);
      setIsPlaying(true);

      audioRef.current.onended = () => {
        // Auto-play next verse
        if (verseIndex < verseAudiosRef.current.length - 1) {
          playVerse(verseIndex + 1);
        } else {
          setIsPlaying(false);
          if (selectedSurah && !listenedSurahs.has(selectedSurah.number)) {
            setListenedSurahs(prev => new Set([...prev, selectedSurah.number]));
            onEarnStar();
          }
        }
      };
    }
  };

  const handlePlayAll = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      playVerse(0);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Surah detail view with verse-by-verse display
  if (selectedSurah) {
    const verses = SURAH_VERSES[selectedSurah.number] || [];

    return (
      <div
        className="min-h-full flex flex-col"
        style={{ backgroundColor: KIDS_COLORS.cream }}
      >
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => {
              audioRef.current?.pause();
              setSelectedSurah(null);
              setCurrentVerse(0);
              setIsPlaying(false);
            }}
            className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-stone-700">{selectedSurah.name}</h2>
            <p className="text-2xl font-arabic text-stone-600">{selectedSurah.nameArabic}</p>
          </div>
          <span className="text-3xl">{selectedSurah.emoji}</span>
        </div>

        {/* Verse List */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3 max-w-md mx-auto">
            {verses.map((verse, index) => (
              <button
                key={index}
                onClick={() => playVerse(index)}
                className={`w-full p-4 rounded-2xl shadow-md text-center transition-all ${
                  currentVerse === index && isPlaying
                    ? 'ring-4 ring-amber-400 scale-[1.02]'
                    : 'bg-white hover:bg-stone-50'
                }`}
                style={{
                  backgroundColor: currentVerse === index && isPlaying ? selectedSurah.color + '20' : undefined
                }}
              >
                <p className="text-2xl font-arabic text-stone-800 leading-loose mb-2">
                  {verse.arabic}
                </p>
                <p className="text-sm text-stone-500">
                  {verse.translation}
                </p>
                {currentVerse === index && isPlaying && (
                  <div className="mt-2 flex justify-center">
                    <div className="flex gap-1">
                      <div className="w-2 h-4 bg-amber-400 rounded animate-pulse"></div>
                      <div className="w-2 h-6 bg-amber-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-4 bg-amber-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Play All Button */}
        <div className="p-4 bg-white shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="text-sm text-stone-500">
              Verse {currentVerse + 1} of {verses.length}
            </div>
            <button
              onClick={handlePlayAll}
              className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
              style={{ backgroundColor: isPlaying ? KIDS_COLORS.orange : KIDS_COLORS.green }}
            >
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-2xl text-white`}></i>
            </button>
            <div>
              {listenedSurahs.has(selectedSurah.number) && (
                <span className="text-2xl">⭐</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Surah selection view
  return (
    <div
      className="min-h-full flex flex-col"
      style={{ backgroundColor: KIDS_COLORS.cream }}
    >
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-bold text-stone-700">Short Surahs</h1>
        <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-amber-500 font-bold">{listenedSurahs.size}/4</span>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-4 max-w-md mx-auto">
          {KIDS_SURAHS.map((surah) => (
            <button
              key={surah.number}
              onClick={() => setSelectedSurah(surah)}
              className={`w-full p-4 rounded-2xl shadow-lg flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-transform ${
                listenedSurahs.has(surah.number) ? 'ring-4 ring-green-400' : ''
              }`}
              style={{ backgroundColor: surah.color }}
            >
              <div className="w-16 h-16 bg-white/30 rounded-xl flex items-center justify-center">
                <span className="text-3xl">{surah.emoji}</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold text-white">{surah.name}</h3>
                <p className="text-2xl font-arabic text-white/90">{surah.nameArabic}</p>
              </div>
              {listenedSurahs.has(surah.number) && (
                <div className="text-2xl">⭐</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// STORIES ACTIVITY COMPONENT
// ============================================

const StoriesActivity: React.FC<ActivityProps> = ({ onBack, onEarnStar }) => {
  const [selectedStory, setSelectedStory] = useState<typeof kidsStories[0] | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [completedStories, setCompletedStories] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const playSceneAudio = async () => {
    if (!selectedStory) return;
    const scene = selectedStory.scenes[currentScene];
    const audioUrl = `/assets/kids/audio/story-${selectedStory.id}-scene-${currentScene}.mp3`;
    const audio = audioRef.current;
    if (!audio) return;

    setIsNarrating(true);
    let fallbackUsed = false;

    const playFallback = async () => {
      fallbackUsed = true;
      await speakWithWebSpeech(scene.text, 0.95);
      setIsNarrating(false);
    };

    audio.onended = () => setIsNarrating(false);
    audio.onerror = async () => {
      if (!fallbackUsed) {
        await playFallback();
      }
    };

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = audioUrl;
      await audio.play();
    } catch (e) {
      await playFallback();
    }
  };

  const handleNextScene = () => {
    if (!selectedStory) return;
    if (currentScene < selectedStory.scenes.length - 1) {
      setCurrentScene(prev => prev + 1);
    } else {
      // Story completed
      if (!completedStories.has(selectedStory.id)) {
        setCompletedStories(prev => new Set([...prev, selectedStory.id]));
        onEarnStar();
      }
    }
  };

  const handlePrevScene = () => {
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1);
    }
  };

  // Story view
  if (selectedStory) {
    const scene = selectedStory.scenes[currentScene];
    const isLastScene = currentScene === selectedStory.scenes.length - 1;

    return (
      <div
        className="min-h-full flex flex-col"
        style={{ backgroundColor: KIDS_COLORS[selectedStory.colorKey] }}
      >
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedStory(null);
              setCurrentScene(0);
            }}
            className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
          <div className="flex gap-1">
            {selectedStory.scenes.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${i === currentScene ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
          <div className="w-14"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-8xl mb-6 animate-bounce">{scene.emoji}</div>
          <p className="text-2xl text-white font-medium max-w-xs leading-relaxed">
            {scene.text}
          </p>
          <button
            onClick={playSceneAudio}
            className="mt-4 px-4 py-2 rounded-full bg-white text-stone-700 shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
          >
            <i className={`fas ${isNarrating ? 'fa-stop' : 'fa-play'} text-sm`}></i>
            <span>{isNarrating ? 'Playing...' : 'Play narration'}</span>
          </button>

          {isLastScene && (
            <div className="mt-8 bg-white/20 rounded-2xl p-4">
              <p className="text-lg text-white/80">Lesson:</p>
              <p className="text-xl text-white font-bold">{selectedStory.lesson}</p>
              {completedStories.has(selectedStory.id) && (
                <div className="mt-2 text-2xl">⭐ You earned a star!</div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 flex justify-between">
          <button
            onClick={handlePrevScene}
            disabled={currentScene === 0}
            className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform ${
              currentScene === 0 ? 'opacity-30' : 'hover:scale-105 active:scale-95 bg-white/30'
            }`}
          >
            <i className="fas fa-arrow-left text-2xl text-white"></i>
          </button>
          <button
            onClick={handleNextScene}
            className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <i className={`fas ${isLastScene ? 'fa-check' : 'fa-arrow-right'} text-2xl`} style={{ color: KIDS_COLORS[selectedStory.colorKey] }}></i>
          </button>
        </div>
      </div>
    );
  }

  // Story selection view
  return (
    <div
      className="min-h-full flex flex-col"
      style={{ backgroundColor: KIDS_COLORS.cream }}
    >
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-bold text-stone-700">Prophet Stories</h1>
        <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-amber-500 font-bold">{completedStories.size}/5</span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {kidsStories.map((story) => (
            <button
              key={story.id}
              onClick={() => setSelectedStory(story)}
              className={`aspect-square rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform ${
                completedStories.has(story.id) ? 'ring-4 ring-green-400' : ''
              }`}
              style={{ backgroundColor: KIDS_COLORS[story.colorKey] }}
            >
              <span className="text-5xl mb-2">{story.emoji}</span>
              <h3 className="text-lg font-bold text-white">{story.prophet}</h3>
              <p className="text-2xl font-arabic text-white/90">{story.prophetArabic}</p>
              {completedStories.has(story.id) && (
                <span className="text-xl mt-1">⭐</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// REWARDS ACTIVITY COMPONENT
// ============================================

interface RewardsProps {
  onBack: () => void;
  totalStars: number;
  level: number;
}

const BADGES = [
  { id: 'first-letter', name: 'Letter Explorer', emoji: '🔤', requirement: 'Learn 1 letter', unlocked: false },
  { id: 'alphabet-10', name: 'Alphabet Star', emoji: '🏆', requirement: 'Learn 10 letters', unlocked: false },
  { id: 'first-surah', name: 'Quran Listener', emoji: '🎧', requirement: 'Listen to 1 surah', unlocked: false },
  { id: 'first-story', name: 'Story Lover', emoji: '📖', requirement: 'Read 1 story', unlocked: false },
  { id: 'star-10', name: 'Star Collector', emoji: '🌟', requirement: 'Earn 10 stars', unlocked: false },
  { id: 'star-50', name: 'Super Star', emoji: '✨', requirement: 'Earn 50 stars', unlocked: false },
];

const RewardsActivity: React.FC<RewardsProps> = ({ onBack, totalStars, level }) => {
  const LEVELS = [
    { level: 1, name: 'Seedling', emoji: '🌱', starsRequired: 0 },
    { level: 2, name: 'Sprout', emoji: '🌿', starsRequired: 10 },
    { level: 3, name: 'Flower', emoji: '🌸', starsRequired: 25 },
    { level: 4, name: 'Tree', emoji: '🌳', starsRequired: 50 },
    { level: 5, name: 'Garden', emoji: '🏡', starsRequired: 100 },
    { level: 6, name: 'Rainbow', emoji: '🌈', starsRequired: 150 },
    { level: 7, name: 'Star', emoji: '⭐', starsRequired: 200 },
    { level: 8, name: 'Moon', emoji: '🌙', starsRequired: 300 },
    { level: 9, name: 'Sun', emoji: '☀️', starsRequired: 400 },
    { level: 10, name: 'Universe', emoji: '🌌', starsRequired: 500 },
  ];

  const currentLevel = LEVELS.find(l => l.level === level) || LEVELS[0];

  // Unlock badges based on stars
  const unlockedBadges = BADGES.map(badge => ({
    ...badge,
    unlocked: (badge.id === 'star-10' && totalStars >= 10) ||
              (badge.id === 'star-50' && totalStars >= 50) ||
              badge.unlocked
  }));

  return (
    <div
      className="min-h-full flex flex-col"
      style={{ backgroundColor: KIDS_COLORS.cream }}
    >
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-bold text-stone-700">My Stars</h1>
        <div className="w-14"></div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Current Level */}
        <div className="bg-white rounded-3xl p-6 shadow-lg text-center mb-6">
          <div className="text-7xl mb-2">{currentLevel.emoji}</div>
          <h2 className="text-2xl font-bold text-stone-700">{currentLevel.name}</h2>
          <p className="text-lg text-stone-500">Level {level}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-4xl">⭐</span>
            <span className="text-3xl font-bold text-amber-500">{totalStars}</span>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-stone-600 mb-3">Level Progress</h3>
          <div className="flex gap-2 flex-wrap justify-center">
            {LEVELS.map((lvl) => (
              <div
                key={lvl.level}
                className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${
                  totalStars >= lvl.starsRequired ? 'bg-amber-100' : 'bg-stone-100'
                }`}
              >
                <span className={`text-2xl ${totalStars >= lvl.starsRequired ? '' : 'grayscale opacity-30'}`}>
                  {lvl.emoji}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div>
          <h3 className="text-lg font-bold text-stone-600 mb-3">My Badges</h3>
          <div className="grid grid-cols-3 gap-3">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-xl text-center shadow-md ${
                  badge.unlocked ? 'bg-amber-100' : 'bg-stone-100'
                }`}
              >
                <span className={`text-3xl ${badge.unlocked ? '' : 'grayscale opacity-30'}`}>
                  {badge.emoji}
                </span>
                <p className={`text-xs mt-1 ${badge.unlocked ? 'text-stone-700' : 'text-stone-400'}`}>
                  {badge.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidsHome;
