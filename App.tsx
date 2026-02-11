import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import StoryCard from './components/StoryCard';
import { OfflineIndicator, PWAInstallPrompt } from './components/OfflineIndicator';
import { transcribeAudio } from './services/geminiService';
import ParentGate from './components/ParentGate';
import AdultAudioStories from './components/AdultAudioStories';
import RTLProvider from './src/components/RTLProvider';
import LanguageSelectorModal from './src/i18n/LanguageSelectorModal';
import ShareButton from './components/ShareButton';
import { initProgressSync, cleanupProgressSync } from './services/progressSyncService';
import { initSubscription } from './services/subscriptionService';
import { isLanguageSelected, isArabic } from './src/i18n';
import { AISettingsWrapper } from './components/settings/AIProviderSettings';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { isOmnia } from './services/omniaSecretService';

// Lazy load major view components for code splitting
const StoryView = lazy(() => import('./components/StoryView'));
const LiveMode = lazy(() => import('./components/LiveMode'));
const QuranView = lazy(() => import('./components/QuranView'));
const KidsHome = lazy(() => import('./components/kids/KidsHome'));
const MediaGenerator = lazy(() => import('./components/kids/MediaGenerator'));
const DownloadManager = lazy(() => import('./components/DownloadManager'));
const ProphetStoriesLibrary = lazy(() => import('./components/ProphetStoriesLibrary'));
const DedicationPage = lazy(() => import('./components/DedicationPage'));
const IslamicTools = lazy(() => import('./components/IslamicTools'));
const ParentProfile = lazy(() => import('./components/ParentProfile'));
const OmniaLovePage = lazy(() => import('./components/OmniaLovePage'));
const OmniaSecretModal = lazy(() => import('./components/OmniaSecretModal'));

// Loading Spinner Component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="inline-block w-12 h-12 border-4 border-rose-200 dark:border-amber-900/30 border-t-rose-600 dark:border-t-accent-gold rounded-full animate-spin"></div>
        <p className="text-stone-600 dark:text-stone-300 text-sm">Loading...</p>
      </div>
    </div>
  );
}

const PROPHETS = [
  { name: 'Adam', arabicName: 'آدم' },
  { name: 'Idris', arabicName: 'إدريس' },
  { name: 'Nuh (Noah)', arabicName: 'نوح' },
  { name: 'Hud', arabicName: 'هود' },
  { name: 'Saleh', arabicName: 'صالح' },
  { name: 'Ibrahim (Abraham)', arabicName: 'إبراهيم' },
  { name: 'Lut (Lot)', arabicName: 'لوط' },
  { name: 'Ishmael', arabicName: 'إسماعيل' },
  { name: 'Ishaq (Isaac)', arabicName: 'إسحاق' },
  { name: 'Yaqub (Jacob)', arabicName: 'يعقوب' },
  { name: 'Yusuf (Joseph)', arabicName: 'يوسف' },
  { name: 'Ayyub (Job)', arabicName: 'أيوب' },
  { name: "Shu'aib", arabicName: 'شعيب' },
  { name: 'Musa (Moses)', arabicName: 'موسى' },
  { name: 'Harun (Aaron)', arabicName: 'هارون' },
  { name: 'Dhul-Kifl', arabicName: 'ذو الكفل' },
  { name: 'Dawud (David)', arabicName: 'داوود' },
  { name: 'Sulaiman (Solomon)', arabicName: 'سليمان' },
  { name: 'Ilyas (Elijah)', arabicName: 'إلياس' },
  { name: 'Al-Yasa (Elisha)', arabicName: 'اليسع' },
  { name: 'Yunus (Jonah)', arabicName: 'يونس' },
  { name: 'Zakariyah', arabicName: 'زكريا' },
  { name: 'Yahya (John)', arabicName: 'يحيى' },
  { name: 'Isa (Jesus)', arabicName: 'عيسى' },
];

const TOPICS = [
  "General Life", "Patience", "Trust in God", "Leadership", "Family", "Miracles", "Justice"
];

const getTopicLabel = (topic: string, t: (key: string, def?: string) => string) => {
  return t(`topics.${topic}`, topic);
};

// Theme Toggle Component
function ThemeToggle() {
  const { theme, toggleTheme, themeIcon, getLabel } = useTheme();
  const { i18n } = useTranslation();
  const isArabicLang = i18n.language === 'ar-EG';

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle flex items-center gap-1"
      title={getLabel(isArabicLang)}
    >
      <i className={`fas ${themeIcon}`}></i>
      <span className="hidden sm:inline text-xs">{getLabel(isArabicLang)}</span>
    </button>
  );
}

function App() {
  const { t, i18n } = useTranslation(['common', 'home']);
  const [view, setView] = useState<'home' | 'story' | 'live' | 'quran' | 'kids' | 'library' | 'dedication' | 'tools'>('home');
  const [mode, setMode] = useState<'gate' | 'kid' | 'parent'>('gate');
  const [selectedProphet, setSelectedProphet] = useState<string>("");
  const [showLanguageSelector, setShowLanguageSelector] = useState(!isLanguageSelected());
  const [selectedTopic, setSelectedTopic] = useState<string>("General Life");
  const [transcribing, setTranscribing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [showMediaGenerator, setShowMediaGenerator] = useState(false);
  const [showParentGate, setShowParentGate] = useState(false);
  const [showParentMenu, setShowParentMenu] = useState(false);
  const [showParentProfile, setShowParentProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Omnia special page state
  const [showOmniaQuestion, setShowOmniaQuestion] = useState(false);
  const [showOmniaLovePage, setShowOmniaLovePage] = useState(false);
  const [parentName, setParentName] = useState<string | null>(null);
  const [parentToken, setParentToken] = useState<string | null>(null);
  // Deep link state
  const [initialDeepLink, setInitialDeepLink] = useState<{ type: string; data: any } | null>(null);

  // Parse deep links from URL hash
  const parseDeepLink = () => {
    const hash = window.location.hash;
    if (!hash || hash === '#') return null;

    // #/story/{prophetName}
    const storyMatch = hash.match(/^#\/story\/(.+)$/);
    if (storyMatch) {
      return { type: 'story', data: { prophet: decodeURIComponent(storyMatch[1]) } };
    }

    // #/verse/{surah}:{verse}
    const verseMatch = hash.match(/^#\/verse\/(\d+):(\d+)$/);
    if (verseMatch) {
      return { type: 'verse', data: { surah: parseInt(verseMatch[1]), verse: parseInt(verseMatch[2]) } };
    }

    // #/quran/{surahNumber}
    const quranMatch = hash.match(/^#\/quran\/(\d+)$/);
    if (quranMatch) {
      return { type: 'quran', data: { surah: parseInt(quranMatch[1]) } };
    }

    // #/kids
    if (hash === '#/kids') {
      return { type: 'kids', data: {} };
    }

    return null;
  };

  // Initialize RevenueCat subscription system on mount
  useEffect(() => {
    initSubscription().catch(console.error);
  }, []);

  // Check for admin mode via URL query parameter and handle deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'media') {
      setShowMediaGenerator(true);
    }

    // Migrate from old localStorage keys to new ones
    const oldToken = localStorage.getItem('hikma_parent_token');
    const oldName = localStorage.getItem('hikma_parent_name');
    if (oldToken) {
      localStorage.setItem('alayasoad_parent_token', oldToken);
      localStorage.removeItem('hikma_parent_token');
    }
    if (oldName) {
      localStorage.setItem('alayasoad_parent_name', oldName);
      localStorage.removeItem('hikma_parent_name');
    }

    const storedToken = localStorage.getItem('alayasoad_parent_token');
    const storedName = localStorage.getItem('alayasoad_parent_name');
    if (storedToken && storedName) {
      setParentName(storedName);
      setParentToken(storedToken);
      setMode('parent');
    }

    // Handle deep links
    const deepLink = parseDeepLink();
    if (deepLink) {
      setInitialDeepLink(deepLink);
      // Auto-enter parent mode for deep links to allow access
      if (!storedToken) {
        setMode('parent'); // Allow viewing shared content without login
      }

      switch (deepLink.type) {
        case 'story':
          setSelectedProphet(deepLink.data.prophet);
          setView('story');
          break;
        case 'verse':
        case 'quran':
          setView('quran');
          // The QuranView will need to handle the initial surah/verse from initialDeepLink
          break;
        case 'kids':
          setMode('kid');
          setView('kids');
          break;
      }
    }
  }, []);

  // Initialize progress sync when parent is logged in
  useEffect(() => {
    if (parentToken) {
      const cleanup = initProgressSync();
      return cleanup;
    }
  }, [parentToken]);

  // Update URL hash when view changes
  useEffect(() => {
    if (view === 'story' && selectedProphet) {
      window.history.replaceState(null, '', `#/story/${encodeURIComponent(selectedProphet)}`);
    } else if (view === 'quran') {
      // QuranView will manage its own hash updates for specific surahs/verses
      if (!window.location.hash.startsWith('#/verse/') && !window.location.hash.startsWith('#/quran/')) {
        window.history.replaceState(null, '', '#/quran');
      }
    } else if (view === 'kids') {
      window.history.replaceState(null, '', '#/kids');
    } else if (view === 'home') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [view, selectedProphet]);

  const handleParentAuthed = (token: string, name: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem('alayasoad_parent_token', token);
      localStorage.setItem('alayasoad_parent_name', name);
    }
    setParentName(name);
    setParentToken(token);
    setMode('parent');

    // Special flow for Omnia - ask secret question
    if (isOmnia(name)) {
      setShowOmniaQuestion(true);
    } else {
      setView('home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('alayasoad_parent_token');
    localStorage.removeItem('alayasoad_parent_name');
    setParentName(null);
    setParentToken(null);
    setMode('gate');
    setView('home');
    setShowParentMenu(false);
  };

  // Omnia secret question handlers
  const handleOmniaCorrect = () => {
    setShowOmniaQuestion(false);
    setShowOmniaLovePage(true);
  };

  const handleOmniaWrong = () => {
    setShowOmniaQuestion(false);
    setView('home');
  };

  const handleOmniaContinue = () => {
    setShowOmniaLovePage(false);
    setView('home');
  };

  const handleStartStory = () => {
    if (mode === 'kid') return; // locked for kids
    if (selectedProphet) setView('story');
  };

  const handleAudioSearch = async () => {
    try {
        setTranscribing(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' }); // Chrome uses webm usually
            // Transcribe
            const text = await transcribeAudio(blob);
            setSearchQuery(text);
            setTranscribing(false);

            // Basic "Smart" selection based on transcription (Demo logic)
            const foundProphet = PROPHETS.find(p => text.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
            if (foundProphet) setSelectedProphet(foundProphet.name);

            stream.getTracks().forEach(t => t.stop());
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 3000); // Record for 3 seconds for search
    } catch (e) {
        console.error(e);
        setTranscribing(false);
    }
  };

  const enterKids = () => {
    setMode('kid');
    setView('kids');
  };

  const isLocked = (target: typeof view) => {
    if (mode === 'kid' && target !== 'kids' && target !== 'quran' && target !== 'library' && target !== 'dedication') {
      return true;
    }
    return false;
  };

  const renderGate = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-stone-50 dark:from-dark-bg dark:via-dark-card dark:to-dark-surface flex flex-col items-center justify-center p-6 relative transition-colors duration-300">
      {/* Theme Toggle on Gate */}
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>
      {/* Language Toggle on Gate */}
      <button
        onClick={() => {
          const newLang = i18n.language === 'ar-EG' ? 'en' : 'ar-EG';
          i18n.changeLanguage(newLang);
          localStorage.setItem('alayasoad_language', newLang);
        }}
        className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm text-stone-600 dark:text-stone-300 hover:text-rose-700 dark:hover:text-accent-gold hover:bg-white dark:hover:bg-dark-elevated transition-colors shadow-sm dark:shadow-dark-lg border border-stone-200 dark:border-dark-border flex items-center gap-2"
        title={i18n.language === 'ar-EG' ? 'Switch to English' : 'التبديل للعربية'}
      >
        <i className="fas fa-globe"></i>
        <span className="text-sm font-medium">{i18n.language === 'ar-EG' ? 'English' : 'العربية'}</span>
      </button>

      <div className="max-w-4xl w-full text-center space-y-10">
        <div className="space-y-4">
          <p className={`text-sm uppercase tracking-[0.3em] text-rose-600 dark:text-accent-gold font-semibold ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.bismillah')}</p>
          <h1 className={`text-4xl md:text-5xl font-serif text-rose-900 dark:text-stone-100 leading-tight ${isArabic() ? 'font-arabic' : ''}`}>
            {t('home:gate.welcome')} <span className="text-amber-600 dark:text-accent-gold">{t('common:app.name')}</span>
          </h1>
          <p className={`text-stone-600 dark:text-stone-300 max-w-2xl mx-auto ${isArabic() ? 'font-arabic' : ''}`}>
            {t('home:gate.subtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={enterKids}
            className="rounded-3xl bg-amber-500 dark:bg-amber-600 text-white py-8 px-6 shadow-xl dark:shadow-dark-lg hover:shadow-2xl hover:scale-[1.01] transition-all flex flex-col gap-3"
          >
            <div className={`flex items-center justify-center gap-3 text-2xl font-bold ${isArabic() ? 'font-arabic' : ''}`}>
              <i className="fas fa-rocket"></i> {t('home:gate.kidsMode')}
            </div>
            <p className={`text-sm text-white/90 ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.kidsDescription')}</p>
          </button>
          <div className={`rounded-3xl bg-white dark:bg-dark-card border border-stone-100 dark:border-dark-border py-8 px-6 shadow-lg dark:shadow-dark-lg flex flex-col gap-4 transition-colors duration-300 ${isArabic() ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center justify-between ${isArabic() ? 'flex-row-reverse' : ''}`}>
              <div className={isArabic() ? 'text-right' : 'text-left'}>
                <p className={`text-xs uppercase text-stone-500 dark:text-stone-400 font-semibold ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.parents')}</p>
                <p className={`text-2xl font-bold text-rose-900 dark:text-accent-gold ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.unlockEverything')}</p>
              </div>
              <i className="fas fa-user-shield text-rose-600 dark:text-accent-gold text-2xl"></i>
            </div>
            <p className={`text-sm text-stone-600 dark:text-stone-300 ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.parentDescription')}</p>
            <button
              onClick={() => setShowParentGate(true)}
              className={`w-full rounded-2xl bg-rose-900 dark:bg-accent-gold text-white dark:text-dark-bg py-3 font-semibold hover:bg-rose-800 dark:hover:bg-amber-500 transition-colors ${isArabic() ? 'font-arabic' : ''}`}
            >
              {t('home:gate.imAParent')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Show language selector on first launch
  if (showLanguageSelector) {
    return (
      <LanguageSelectorModal
        isOpen={showLanguageSelector}
        onComplete={() => setShowLanguageSelector(false)}
      />
    );
  }

  if (mode === 'gate') {
    return (
      <ThemeProvider>
      <RTLProvider>
        {renderGate()}
        <ParentGate
          isOpen={showParentGate}
          onClose={() => setShowParentGate(false)}
          onAuthed={handleParentAuthed}
        />
      </RTLProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
    <RTLProvider>
    <div
      className="min-h-screen-safe bg-stone-100 dark:bg-dark-bg flex flex-col text-stone-800 dark:text-stone-100 overflow-x-hidden transition-colors duration-300"
      dir={i18n.language === 'ar-EG' ? 'rtl' : 'ltr'}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* PWA Components */}
      <OfflineIndicator onDownloadClick={() => setShowDownloadManager(true)} />
      <PWAInstallPrompt />
      <Suspense fallback={null}>
        <DownloadManager
          isOpen={showDownloadManager}
          onClose={() => setShowDownloadManager(false)}
        />
      </Suspense>
      <ParentGate
        isOpen={showParentGate}
        onClose={() => setShowParentGate(false)}
        onAuthed={handleParentAuthed}
      />
      <Suspense fallback={null}>
        <ParentProfile
          isOpen={showParentProfile}
          onClose={() => setShowParentProfile(false)}
          parentName={parentName || ''}
          onLogout={handleLogout}
        />
      </Suspense>

      {/* Omnia Special Love Page */}
      {showOmniaLovePage && (
        <Suspense fallback={<LoadingSpinner />}>
          <OmniaLovePage onContinue={handleOmniaContinue} />
        </Suspense>
      )}

      {/* Omnia Secret Question Modal */}
      {showOmniaQuestion && (
        <Suspense fallback={null}>
          <OmniaSecretModal
            onCorrect={handleOmniaCorrect}
            onWrong={handleOmniaWrong}
          />
        </Suspense>
      )}

      {/* Navbar - with safe area padding for notched phones */}
      <nav className="bg-white dark:bg-dark-card border-b border-stone-200 dark:border-dark-border px-4 md:px-6 py-3 md:py-4 pt-safe flex justify-between items-center shadow-sm dark:shadow-dark-lg transition-colors duration-300 relative sticky top-0 z-30">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setView('dedication')}
            className="w-9 h-9 md:w-10 md:h-10 bg-rose-700 dark:bg-accent-gold rounded-lg flex items-center justify-center text-white dark:text-dark-bg text-lg md:text-xl hover:bg-rose-600 dark:hover:bg-amber-500 transition-colors"
            title={t('common:nav.inLovingMemory')}
            aria-label={t('common:nav.inLovingMemory')}
          >
            <i className="fas fa-heart" aria-hidden="true"></i>
          </button>
          <h1 className="text-lg md:text-2xl font-serif font-bold text-rose-900 dark:text-accent-gold tracking-wide">{t('common:app.name')}</h1>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-rose-700 dark:hover:text-accent-gold transition-colors"
          aria-label="Toggle menu"
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`} aria-hidden="true"></i>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 md:gap-4 text-sm font-medium items-center flex-1 justify-end">
            <button
                onClick={() => !isLocked('home') && setView('home')}
                disabled={isLocked('home')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'home' || view === 'story' ? 'bg-rose-50 dark:bg-amber-900/30 text-rose-800 dark:text-accent-gold' : 'text-stone-500 dark:text-stone-400 hover:text-rose-700 dark:hover:text-accent-gold'} ${isLocked('home') ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <i className="fas fa-book-open md:mr-2"></i>
                <span className="hidden md:inline">Stories</span>
            </button>
            <button
                onClick={() => setView('quran')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'quran' ? 'bg-rose-50 dark:bg-amber-900/30 text-rose-800 dark:text-accent-gold' : 'text-stone-500 dark:text-stone-400 hover:text-rose-700 dark:hover:text-accent-gold'}`}
            >
                <i className="fas fa-quran md:mr-2"></i>
                <span className="hidden md:inline">The Quran</span>
            </button>
            <button
                onClick={() => !isLocked('live') && setView('live')}
                disabled={isLocked('live')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'live' ? 'bg-rose-50 dark:bg-amber-900/30 text-rose-800 dark:text-accent-gold' : 'text-stone-500 dark:text-stone-400 hover:text-rose-700 dark:hover:text-accent-gold'} ${isLocked('live') ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <i className="fas fa-user-graduate md:mr-2"></i>
                <span className="hidden md:inline">{isArabic() ? 'المعلّم الشخصي' : 'Personal Tutor'}</span>
            </button>
            <button
                onClick={() => setView('kids')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'kids' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' : 'text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400'}`}
            >
                <i className="fas fa-child md:mr-2"></i>
                <span className="hidden md:inline">Kids</span>
            </button>
            <button
                onClick={() => !isLocked('library') && setView('library')}
                disabled={isLocked('library')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'library' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'text-stone-500 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400'} ${isLocked('library') ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <i className="fas fa-book-reader md:mr-2"></i>
                <span className="hidden md:inline">Library</span>
            </button>
            <button
                onClick={() => setView('tools')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'tools' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' : 'text-stone-500 dark:text-stone-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
            >
                <i className="fas fa-compass md:mr-2"></i>
                <span className="hidden md:inline">Tools</span>
            </button>
            {/* Theme Toggle Button */}
            <ThemeToggle />
            {/* Language Toggle Button */}
            <button
                onClick={() => {
                  const newLang = i18n.language === 'ar-EG' ? 'en' : 'ar-EG';
                  i18n.changeLanguage(newLang);
                  localStorage.setItem('alayasoad_language', newLang);
                }}
                className="px-3 py-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-rose-700 dark:hover:text-accent-gold hover:bg-rose-50 dark:hover:bg-dark-elevated transition-colors"
                title={i18n.language === 'ar-EG' ? 'Switch to English' : 'التبديل للعربية'}
                aria-label={i18n.language === 'ar-EG' ? 'Switch to English' : 'Switch to Arabic'}
            >
                <i className="fas fa-globe" aria-hidden="true"></i>
                <span className="hidden sm:inline ml-1 text-xs">{i18n.language === 'ar-EG' ? 'EN' : 'ع'}</span>
            </button>
            {/* Download Manager Button */}
            <button
                onClick={() => setShowDownloadManager(true)}
                className="px-3 py-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-rose-700 dark:hover:text-accent-gold hover:bg-rose-50 dark:hover:bg-dark-elevated transition-colors"
                title="Offline Downloads"
                aria-label="Offline Downloads"
            >
                <i className="fas fa-download" aria-hidden="true"></i>
            </button>
            {/* AI Settings Button */}
            <AISettingsWrapper />
        </div>
        {/* Parent Button with Dropdown - Outside overflow container */}
        <div className="relative ml-2">
          <button
            onClick={() => parentName ? setShowParentMenu(!showParentMenu) : setShowParentGate(true)}
            className="px-3 py-2 rounded-full text-stone-500 dark:text-stone-400 hover:text-rose-700 dark:hover:text-accent-gold hover:bg-rose-50 dark:hover:bg-dark-elevated transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <i className="fas fa-user-shield"></i>
            <span className="hidden md:inline">{parentName ? `Hi, ${parentName}` : 'Parent'}</span>
            {parentName && <i className={`fas fa-chevron-${showParentMenu ? 'up' : 'down'} text-xs`}></i>}
          </button>
          {/* Parent Dropdown Menu */}
          {showParentMenu && parentName && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowParentMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-lg dark:shadow-dark-lg border border-stone-200 dark:border-dark-border py-2 z-50">
                <div className="px-4 py-2 border-b border-stone-100 dark:border-dark-border">
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-100">{parentName}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Parent Account</p>
                </div>
                <button
                  onClick={() => {
                    setShowParentMenu(false);
                    setShowParentProfile(true);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated flex items-center gap-2"
                >
                  <i className="fas fa-user-circle w-4"></i>
                  Profile & Settings
                </button>
                <ShareButton
                  type="app"
                  className="w-full px-4 py-2 text-left text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated flex items-center gap-2"
                />
                <hr className="my-2 border-stone-100 dark:border-dark-border" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <i className="fas fa-sign-out-alt w-4"></i>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Dropdown Panel - scrollable for landscape mode */}
            <div className="fixed top-[calc(env(safe-area-inset-top,0px)+56px)] left-0 right-0 bottom-0 bg-white dark:bg-dark-card border-b border-stone-200 dark:border-dark-border shadow-lg dark:shadow-dark-lg z-50 md:hidden animate-in slide-in-from-top-2 duration-200 overflow-y-auto overscroll-contain">
              <div className="p-4 space-y-1 pb-safe">
                {/* Navigation Items */}
                <button
                  onClick={() => { !isLocked('home') && setView('home'); setMobileMenuOpen(false); }}
                  disabled={isLocked('home')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'home' || view === 'story' ? 'bg-rose-50 dark:bg-amber-900/30 text-rose-800 dark:text-accent-gold' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated'} ${isLocked('home') ? 'opacity-40' : ''}`}
                >
                  <i className="fas fa-book-open w-5"></i>
                  <span>Stories</span>
                </button>
                <button
                  onClick={() => { setView('quran'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'quran' ? 'bg-rose-50 dark:bg-amber-900/30 text-rose-800 dark:text-accent-gold' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated'}`}
                >
                  <i className="fas fa-quran w-5"></i>
                  <span>The Quran</span>
                </button>
                <button
                  onClick={() => { !isLocked('live') && setView('live'); setMobileMenuOpen(false); }}
                  disabled={isLocked('live')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'live' ? 'bg-rose-50 dark:bg-amber-900/30 text-rose-800 dark:text-accent-gold' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated'} ${isLocked('live') ? 'opacity-40' : ''}`}
                >
                  <i className="fas fa-user-graduate w-5"></i>
                  <span>{isArabic() ? 'المعلّم الشخصي' : 'Personal Tutor'}</span>
                </button>
                <button
                  onClick={() => { setView('kids'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'kids' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated'}`}
                >
                  <i className="fas fa-child w-5"></i>
                  <span>Kids Mode</span>
                </button>
                <button
                  onClick={() => { !isLocked('library') && setView('library'); setMobileMenuOpen(false); }}
                  disabled={isLocked('library')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'library' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated'} ${isLocked('library') ? 'opacity-40' : ''}`}
                >
                  <i className="fas fa-book-reader w-5"></i>
                  <span>Library</span>
                </button>
                <button
                  onClick={() => { setView('tools'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'tools' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated'}`}
                >
                  <i className="fas fa-compass w-5"></i>
                  <span>Tools</span>
                </button>

                {/* Divider */}
                <hr className="my-3 border-stone-200 dark:border-dark-border" />

                {/* Settings Row */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-stone-500 dark:text-stone-400">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-stone-500 dark:text-stone-400">Language</span>
                  <button
                    onClick={() => {
                      const newLang = i18n.language === 'ar-EG' ? 'en' : 'ar-EG';
                      i18n.changeLanguage(newLang);
                      localStorage.setItem('alayasoad_language', newLang);
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-dark-elevated transition-colors"
                  >
                    {i18n.language === 'ar-EG' ? 'English' : 'العربية'}
                  </button>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-stone-500 dark:text-stone-400">Downloads</span>
                  <button
                    onClick={() => { setShowDownloadManager(true); setMobileMenuOpen(false); }}
                    className="px-3 py-1.5 rounded-lg text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-dark-elevated transition-colors"
                    aria-label="Open download manager"
                  >
                    <i className="fas fa-download" aria-hidden="true"></i>
                  </button>
                </div>

                {/* Parent Section */}
                <hr className="my-3 border-stone-200 dark:border-dark-border" />
                <button
                  onClick={() => {
                    if (parentName) {
                      setShowParentProfile(true);
                    } else {
                      setShowParentGate(true);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-dark-elevated transition-colors"
                >
                  <i className="fas fa-user-shield w-5"></i>
                  <span>{parentName ? `Hi, ${parentName}` : 'Parent Login'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Main Content - scrollable on mobile */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden pb-safe">
        {view === 'home' && mode !== 'kid' && (
            <div className="grid md:grid-cols-2 gap-12 items-center h-full animate-in fade-in duration-500">
            <div className="space-y-8">
              <div className={`space-y-4 ${isArabic() ? 'text-right font-arabic' : ''}`}>
                <h2 className="text-4xl md:text-5xl font-serif text-rose-950 dark:text-stone-100 leading-tight">
                  {isArabic() ? (
                    <>
                      اكتشف روائع <br />
                      <span className="text-rose-600 dark:text-accent-gold">قصص الأنبياء</span>
                    </>
                  ) : (
                    <>
                      Explore the timeless <br />
                      <span className="text-rose-600 dark:text-accent-gold">stories of the Prophets.</span>
                    </>
                  )}
                </h2>
                <p className="text-lg text-stone-600 dark:text-stone-300 max-w-md">
                  {isArabic()
                    ? 'عش حكايات القرآن عبر سرد تفاعلي، بصري، وتاريخي.'
                    : "Experience the Quran's narratives through interactive storytelling, visualizations, and historical insights."}
                </p>
              </div>

              <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg dark:shadow-dark-lg border border-stone-100 dark:border-dark-border space-y-6 transition-colors duration-300">
                <div>
                  <label className={`block text-sm font-medium text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wider ${isArabic() ? 'text-right font-arabic' : ''}`}>
                    {isArabic() ? 'اختر نبيًّا' : 'Choose a Prophet'}
                  </label>
                  <div className="relative">
                      <select
                        className="w-full p-4 bg-stone-50 dark:bg-dark-surface border border-stone-200 dark:border-dark-border rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-accent-gold text-lg font-serif text-stone-800 dark:text-stone-100"
                        value={selectedProphet}
                        onChange={(e) => setSelectedProphet(e.target.value)}
                      >
                        <option value="">{isArabic() ? 'اختر دليلك...' : 'Select a guide...'}</option>
                        {PROPHETS.map(p => <option key={p.name} value={p.name}>{p.name} ({p.arabicName})</option>)}
                      </select>
                      <i className="fas fa-chevron-down absolute right-4 top-5 text-stone-400 dark:text-stone-500 pointer-events-none"></i>
                  </div>
                </div>

                <div>
                   <label className={`block text-sm font-medium text-stone-500 dark:text-stone-400 mb-2 uppercase tracking-wider ${isArabic() ? 'text-right font-arabic' : ''}`}>
                    {isArabic() ? 'أو اسأل بالصوت' : 'Or Ask via Audio'}
                   </label>
                   <div className="flex gap-2">
                       <input
                            type="text"
                            value={searchQuery}
                            readOnly
                            placeholder={isArabic() ? 'اضغط على الميكروفون لذكر الاسم...' : 'Tap mic to say a name...'}
                            className="flex-1 p-3 bg-stone-50 dark:bg-dark-surface border border-stone-200 dark:border-dark-border rounded-xl text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
                       />
                       <button
                            onClick={handleAudioSearch}
                            disabled={transcribing}
                            className={`w-12 rounded-xl flex items-center justify-center text-white transition-colors ${transcribing ? 'bg-red-500 animate-pulse' : 'bg-rose-600 dark:bg-accent-gold dark:text-dark-bg hover:bg-rose-700 dark:hover:bg-amber-500'}`}
                       >
                           <i className={`fas ${transcribing ? 'fa-ellipsis-h' : 'fa-microphone'}`}></i>
                       </button>
                   </div>
                </div>

                <div>
                   <label className={`block text-sm font-medium text-stone-500 dark:text-stone-400 mb-3 uppercase tracking-wider ${isArabic() ? 'text-right font-arabic' : ''}`}>
                    {isArabic() ? 'الموضوع المراد' : 'Focus Theme'}
                   </label>
                   <div className="flex flex-wrap gap-2">
                      {TOPICS.map(topic => (
                        <button
                          key={topic}
                          onClick={() => setSelectedTopic(topic)}
                          className={`px-4 py-2 rounded-full text-sm transition-all ${selectedTopic === topic ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-700' : 'bg-stone-50 dark:bg-dark-surface text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-dark-elevated'}`}
                        >
                          {getTopicLabel(topic, t)}
                        </button>
                      ))}
                   </div>
                </div>

                <button
                  onClick={handleStartStory}
                  disabled={!selectedProphet}
                  className="w-full py-4 bg-rose-900 dark:bg-accent-gold text-white dark:text-dark-bg rounded-xl font-medium text-lg hover:bg-rose-800 dark:hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-900/20 dark:shadow-dark-glow"
                >
                  {isArabic() ? 'ابدأ الرحلة' : 'Begin Journey'}
                </button>
              </div>

              {/* Quick Pick Story Cards - All 24 Prophets */}
              <div className="mt-8">
                <h3 className={`text-lg font-serif text-stone-600 dark:text-stone-300 mb-4 flex items-center gap-2 ${isArabic() ? 'flex-row-reverse text-right font-arabic' : ''}`}>
                  <i className="fas fa-star text-amber-500 dark:text-accent-gold"></i>
                  {isArabic() ? 'اختيار سريع' : 'Quick Pick'}
                  <span className="text-sm text-stone-400 dark:text-stone-500 font-sans">
                    ({PROPHETS.length} {isArabic() ? 'نبيًّا' : 'Prophets'})
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-dark-elevated scrollbar-track-stone-100 dark:scrollbar-track-dark-surface">
                  {PROPHETS.map(prophet => (
                    <StoryCard
                      key={prophet.name}
                      prophet={prophet.name}
                      arabicName={prophet.arabicName}
                      topic={selectedTopic}
                      onSelect={(p) => {
                        setSelectedProphet(p);
                        setView('story');
                      }}
                      isSelected={selectedProphet === prophet.name}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <AdultAudioStories />
              </div>
            </div>

            {/* Decorative Side */}
            <div className="hidden md:flex justify-center relative">
               <div className="absolute inset-0 bg-rose-500/5 dark:bg-accent-gold/5 rounded-full blur-3xl transform scale-90"></div>
               <img
                 src="https://images.unsplash.com/photo-1519817914152-22d216bb9170?q=80&w=1600&auto=format&fit=crop"
                 alt="Abstract Islamic Art"
                 className="rounded-t-[200px] rounded-b-[50px] shadow-2xl dark:shadow-dark-lg w-3/4 object-cover h-[600px] z-10"
               />
               <div className="absolute -bottom-10 -right-10 bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl dark:shadow-dark-lg border border-transparent dark:border-dark-border z-20 max-w-xs transition-colors duration-300">
                   <p className="font-serif italic text-rose-900 dark:text-accent-gold">"We relate to you, [O Muhammad], the best of stories in what We have revealed to you of this Qur'an..."</p>
                   <p className="text-right text-xs text-stone-500 dark:text-stone-400 mt-2 font-bold">Surah Yusuf 12:3</p>
               </div>
            </div>
          </div>
        )}

        {view === 'story' && selectedProphet && (
            <div className="min-h-[50vh] md:h-[calc(100vh-140px)]">
                <Suspense fallback={<LoadingSpinner />}>
                  <StoryView
                      prophet={selectedProphet}
                      topic={selectedTopic}
                      onBack={() => setView('home')}
                      onNavigateToLibrary={(prophetId) => {
                        setView('library');
                        // ProphetStoriesLibrary will auto-scroll to prophet if needed
                      }}
                  />
                </Suspense>
            </div>
        )}

        {view === 'live' && (
            <div className="min-h-[50vh] md:h-[calc(100vh-140px)]">
                <Suspense fallback={<LoadingSpinner />}>
                  <LiveMode />
                </Suspense>
            </div>
        )}

        {view === 'quran' && (
            <div className="min-h-[50vh] md:h-[calc(100vh-140px)]">
                <Suspense fallback={<LoadingSpinner />}>
                  <QuranView
                    initialSurah={initialDeepLink?.type === 'verse' || initialDeepLink?.type === 'quran' ? initialDeepLink.data.surah : undefined}
                    initialVerse={initialDeepLink?.type === 'verse' ? initialDeepLink.data.verse : undefined}
                  />
                </Suspense>
            </div>
        )}

        {view === 'kids' && (
            <div className="min-h-[50vh] md:h-[calc(100vh-140px)]">
                <Suspense fallback={<LoadingSpinner />}>
                  <KidsHome onBack={() => setView('home')} />
                </Suspense>
            </div>
        )}

        {view === 'library' && (
            <div className="min-h-[50vh] md:h-[calc(100vh-140px)] overflow-auto">
                <Suspense fallback={<LoadingSpinner />}>
                  <ProphetStoriesLibrary />
                </Suspense>
            </div>
        )}

        {view === 'dedication' && (
            <div className="fixed inset-0 z-40 overflow-y-auto">
                <Suspense fallback={<LoadingSpinner />}>
                  <DedicationPage onClose={() => setView('home')} />
                </Suspense>
            </div>
        )}

        {view === 'tools' && (
            <div className="min-h-[50vh] md:h-[calc(100vh-140px)]">
                <Suspense fallback={<LoadingSpinner />}>
                  <IslamicTools onBack={() => setView('home')} />
                </Suspense>
            </div>
        )}

        {/* Admin: Media Generator (access via ?admin=media) */}
        {showMediaGenerator && (
            <div className="fixed inset-0 z-50 overflow-auto">
                <div className="min-h-screen">
                    <div className="absolute top-4 right-4 z-50">
                        <button
                            onClick={() => {
                                setShowMediaGenerator(false);
                                window.history.replaceState({}, '', window.location.pathname);
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg"
                        >
                            Close Generator
                        </button>
                    </div>
                    <Suspense fallback={<LoadingSpinner />}>
                      <MediaGenerator />
                    </Suspense>
                </div>
            </div>
        )}
      </main>
    </div>
    </RTLProvider>
    </ThemeProvider>
  );
}

export default App;
