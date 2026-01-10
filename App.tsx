import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import StoryView from './components/StoryView';
import StoryCard from './components/StoryCard';
import LiveMode from './components/LiveMode';
import QuranView from './components/QuranView';
import KidsHome from './components/kids/KidsHome';
import MediaGenerator from './components/kids/MediaGenerator';
import DownloadManager from './components/DownloadManager';
import { OfflineIndicator, PWAInstallPrompt } from './components/OfflineIndicator';
import { transcribeAudio } from './services/geminiService';
import ParentGate from './components/ParentGate';
import AdultAudioStories from './components/AdultAudioStories';
import ProphetStoriesLibrary from './components/ProphetStoriesLibrary';
import DedicationPage from './components/DedicationPage';
import RTLProvider from './src/components/RTLProvider';
import LanguageSelectorModal from './src/i18n/LanguageSelectorModal';
import { isLanguageSelected, isArabic } from './src/i18n';

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

function App() {
  const { t, i18n } = useTranslation(['common', 'home']);
  const [view, setView] = useState<'home' | 'story' | 'live' | 'quran' | 'kids' | 'library' | 'dedication'>('home');
  const [mode, setMode] = useState<'gate' | 'kid' | 'parent'>('gate');
  const [selectedProphet, setSelectedProphet] = useState<string>("");
  const [showLanguageSelector, setShowLanguageSelector] = useState(!isLanguageSelected());
  const [selectedTopic, setSelectedTopic] = useState<string>("General Life");
  const [transcribing, setTranscribing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [showMediaGenerator, setShowMediaGenerator] = useState(false);
  const [showParentGate, setShowParentGate] = useState(false);
  const [parentName, setParentName] = useState<string | null>(null);
  const [parentToken, setParentToken] = useState<string | null>(null);

  // Check for admin mode via URL query parameter
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
  }, []);

  const handleParentAuthed = (token: string, name: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem('alayasoad_parent_token', token);
      localStorage.setItem('alayasoad_parent_name', name);
    }
    setParentName(name);
    setParentToken(token);
    setMode('parent');
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-stone-50 flex flex-col items-center justify-center p-6 relative">
      {/* Language Toggle on Gate */}
      <button
        onClick={() => {
          const newLang = i18n.language === 'ar-EG' ? 'en' : 'ar-EG';
          i18n.changeLanguage(newLang);
          localStorage.setItem('alayasoad_language', newLang);
        }}
        className="absolute top-4 right-4 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-stone-600 hover:text-rose-700 hover:bg-white transition-colors shadow-sm border border-stone-200 flex items-center gap-2"
        title={i18n.language === 'ar-EG' ? 'Switch to English' : 'التبديل للعربية'}
      >
        <i className="fas fa-globe"></i>
        <span className="text-sm font-medium">{i18n.language === 'ar-EG' ? 'English' : 'العربية'}</span>
      </button>

      <div className="max-w-4xl w-full text-center space-y-10">
        <div className="space-y-4">
          <p className={`text-sm uppercase tracking-[0.3em] text-rose-600 font-semibold ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.bismillah')}</p>
          <h1 className={`text-4xl md:text-5xl font-serif text-rose-900 leading-tight ${isArabic() ? 'font-arabic' : ''}`}>
            {t('home:gate.welcome')} <span className="text-amber-600">{t('common:app.name')}</span>
          </h1>
          <p className={`text-stone-600 max-w-2xl mx-auto ${isArabic() ? 'font-arabic' : ''}`}>
            {t('home:gate.subtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={enterKids}
            className="rounded-3xl bg-amber-500 text-white py-8 px-6 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex flex-col gap-3"
          >
            <div className={`flex items-center justify-center gap-3 text-2xl font-bold ${isArabic() ? 'font-arabic' : ''}`}>
              <i className="fas fa-rocket"></i> {t('home:gate.kidsMode')}
            </div>
            <p className={`text-sm text-white/90 ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.kidsDescription')}</p>
          </button>
          <div className={`rounded-3xl bg-white border border-stone-100 py-8 px-6 shadow-lg flex flex-col gap-4 ${isArabic() ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center justify-between ${isArabic() ? 'flex-row-reverse' : ''}`}>
              <div className={isArabic() ? 'text-right' : 'text-left'}>
                <p className={`text-xs uppercase text-stone-500 font-semibold ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.parents')}</p>
                <p className={`text-2xl font-bold text-rose-900 ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.unlockEverything')}</p>
              </div>
              <i className="fas fa-user-shield text-rose-600 text-2xl"></i>
            </div>
            <p className={`text-sm text-stone-600 ${isArabic() ? 'font-arabic' : ''}`}>{t('home:gate.parentDescription')}</p>
            <button
              onClick={() => setShowParentGate(true)}
              className={`w-full rounded-2xl bg-rose-900 text-white py-3 font-semibold hover:bg-rose-800 transition-colors ${isArabic() ? 'font-arabic' : ''}`}
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
      <RTLProvider>
        {renderGate()}
        <ParentGate
          isOpen={showParentGate}
          onClose={() => setShowParentGate(false)}
          onAuthed={handleParentAuthed}
        />
      </RTLProvider>
    );
  }

  return (
    <RTLProvider>
    <div
      className="min-h-screen bg-stone-100 flex flex-col text-stone-800"
      dir={i18n.language === 'ar-EG' ? 'rtl' : 'ltr'}
    >
      {/* PWA Components */}
      <OfflineIndicator onDownloadClick={() => setShowDownloadManager(true)} />
      <PWAInstallPrompt />
      <DownloadManager
        isOpen={showDownloadManager}
        onClose={() => setShowDownloadManager(false)}
      />
      <ParentGate
        isOpen={showParentGate}
        onClose={() => setShowParentGate(false)}
        onAuthed={handleParentAuthed}
      />

      {/* Navbar */}
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('dedication')}
            className="w-10 h-10 bg-rose-700 rounded-lg flex items-center justify-center text-white text-xl hover:bg-rose-600 transition-colors"
            title={t('common:nav.inLovingMemory')}
          >
            <i className="fas fa-heart"></i>
          </button>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-rose-900 tracking-wide">{t('common:app.name')}</h1>
        </div>
        <div className="flex gap-2 md:gap-4 text-sm font-medium overflow-x-auto items-center">
            <button
                onClick={() => !isLocked('home') && setView('home')}
                disabled={isLocked('home')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'home' || view === 'story' ? 'bg-rose-50 text-rose-800' : 'text-stone-500 hover:text-rose-700'} ${isLocked('home') ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <i className="fas fa-book-open md:mr-2"></i>
                <span className="hidden md:inline">Stories</span>
            </button>
            <button
                onClick={() => setView('quran')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'quran' ? 'bg-rose-50 text-rose-800' : 'text-stone-500 hover:text-rose-700'}`}
            >
                <i className="fas fa-quran md:mr-2"></i>
                <span className="hidden md:inline">The Quran</span>
            </button>
            <button
                onClick={() => !isLocked('live') && setView('live')}
                disabled={isLocked('live')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'live' ? 'bg-rose-50 text-rose-800' : 'text-stone-500 hover:text-rose-700'} ${isLocked('live') ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <i className="fas fa-microphone md:mr-2"></i>
                <span className="hidden md:inline">Learn with Soso</span>
            </button>
            <button
                onClick={() => setView('kids')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'kids' ? 'bg-amber-100 text-amber-800' : 'text-stone-500 hover:text-amber-600'}`}
            >
                <i className="fas fa-child md:mr-2"></i>
                <span className="hidden md:inline">Kids</span>
            </button>
            <button
                onClick={() => !isLocked('library') && setView('library')}
                disabled={isLocked('library')}
                className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${view === 'library' ? 'bg-emerald-100 text-emerald-800' : 'text-stone-500 hover:text-emerald-600'} ${isLocked('library') ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                <i className="fas fa-book-reader md:mr-2"></i>
                <span className="hidden md:inline">Library</span>
            </button>
            {/* Language Toggle Button */}
            <button
                onClick={() => {
                  const newLang = i18n.language === 'ar-EG' ? 'en' : 'ar-EG';
                  i18n.changeLanguage(newLang);
                  localStorage.setItem('alayasoad_language', newLang);
                }}
                className="px-3 py-2 rounded-full text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title={i18n.language === 'ar-EG' ? 'Switch to English' : 'التبديل للعربية'}
            >
                <i className="fas fa-globe"></i>
                <span className="hidden sm:inline ml-1 text-xs">{i18n.language === 'ar-EG' ? 'EN' : 'ع'}</span>
            </button>
            {/* Download Manager Button */}
            <button
                onClick={() => setShowDownloadManager(true)}
                className="px-3 py-2 rounded-full text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Offline Downloads"
            >
                <i className="fas fa-download"></i>
            </button>
            <button
                onClick={() => setShowParentGate(true)}
                className="px-3 py-2 rounded-full text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-2"
            >
                <i className="fas fa-user-shield"></i>
                <span className="hidden md:inline">{parentName ? `Hi, ${parentName}` : 'Parent'}</span>
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {view === 'home' && mode !== 'kid' && (
            <div className="grid md:grid-cols-2 gap-12 items-center h-full animate-in fade-in duration-500">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-serif text-rose-950 leading-tight">
                  Explore the timeless <br/>
                  <span className="text-rose-600">stories of the Prophets.</span>
                </h2>
                <p className="text-lg text-stone-600 max-w-md">
                  Experience the Quran's narratives through interactive storytelling, visualizations, and historical insights.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-500 mb-2 uppercase tracking-wider">Choose a Prophet</label>
                  <div className="relative">
                      <select
                        className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500 text-lg font-serif"
                        value={selectedProphet}
                        onChange={(e) => setSelectedProphet(e.target.value)}
                      >
                        <option value="">Select a guide...</option>
                        {PROPHETS.map(p => <option key={p.name} value={p.name}>{p.name} ({p.arabicName})</option>)}
                      </select>
                      <i className="fas fa-chevron-down absolute right-4 top-5 text-stone-400 pointer-events-none"></i>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-stone-500 mb-2 uppercase tracking-wider">Or Ask via Audio</label>
                   <div className="flex gap-2">
                       <input
                            type="text"
                            value={searchQuery}
                            readOnly
                            placeholder="Tap mic to say a name..."
                            className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl"
                       />
                       <button
                            onClick={handleAudioSearch}
                            disabled={transcribing}
                            className={`w-12 rounded-xl flex items-center justify-center text-white transition-colors ${transcribing ? 'bg-red-500 animate-pulse' : 'bg-rose-600 hover:bg-rose-700'}`}
                       >
                           <i className={`fas ${transcribing ? 'fa-ellipsis-h' : 'fa-microphone'}`}></i>
                       </button>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-stone-500 mb-3 uppercase tracking-wider">Focus Theme</label>
                   <div className="flex flex-wrap gap-2">
                      {TOPICS.map(topic => (
                        <button
                          key={topic}
                          onClick={() => setSelectedTopic(topic)}
                          className={`px-4 py-2 rounded-full text-sm transition-all ${selectedTopic === topic ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
                        >
                          {topic}
                        </button>
                      ))}
                   </div>
                </div>

                <button
                  onClick={handleStartStory}
                  disabled={!selectedProphet}
                  className="w-full py-4 bg-rose-900 text-white rounded-xl font-medium text-lg hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-900/20"
                >
                  Begin Journey
                </button>
              </div>

              {/* Quick Pick Story Cards - All 24 Prophets */}
              <div className="mt-8">
                <h3 className="text-lg font-serif text-stone-600 mb-4 flex items-center gap-2">
                  <i className="fas fa-star text-amber-500"></i>
                  Quick Pick
                  <span className="text-sm text-stone-400 font-sans">({PROPHETS.length} Prophets)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-2 pb-2 scrollbar-thin scrollbar-thumb-stone-300 scrollbar-track-stone-100">
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
               <div className="absolute inset-0 bg-rose-500/5 rounded-full blur-3xl transform scale-90"></div>
               <img
                 src="https://images.unsplash.com/photo-1519817914152-22d216bb9170?q=80&w=1600&auto=format&fit=crop"
                 alt="Abstract Islamic Art"
                 className="rounded-t-[200px] rounded-b-[50px] shadow-2xl w-3/4 object-cover h-[600px] z-10"
               />
               <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-2xl shadow-xl z-20 max-w-xs">
                   <p className="font-serif italic text-rose-900">"We relate to you, [O Muhammad], the best of stories in what We have revealed to you of this Qur'an..."</p>
                   <p className="text-right text-xs text-stone-500 mt-2 font-bold">Surah Yusuf 12:3</p>
               </div>
            </div>
          </div>
        )}

        {view === 'story' && selectedProphet && (
            <div className="h-[calc(100vh-140px)]">
                <StoryView
                    prophet={selectedProphet}
                    topic={selectedTopic}
                    onBack={() => setView('home')}
                    onNavigateToLibrary={(prophetId) => {
                      setView('library');
                      // ProphetStoriesLibrary will auto-scroll to prophet if needed
                    }}
                />
            </div>
        )}

        {view === 'live' && (
            <div className="h-[calc(100vh-140px)]">
                <LiveMode />
            </div>
        )}

        {view === 'quran' && (
            <div className="h-[calc(100vh-140px)]">
                <QuranView />
            </div>
        )}

        {view === 'kids' && (
            <div className="h-[calc(100vh-140px)]">
                <KidsHome onBack={() => setView('home')} />
            </div>
        )}

        {view === 'library' && (
            <div className="h-[calc(100vh-140px)] overflow-auto">
                <ProphetStoriesLibrary />
            </div>
        )}

        {view === 'dedication' && (
            <div className="fixed inset-0 z-40">
                <DedicationPage onClose={() => setView('home')} />
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
                    <MediaGenerator />
                </div>
            </div>
        )}
      </main>
    </div>
    </RTLProvider>
  );
}

export default App;
