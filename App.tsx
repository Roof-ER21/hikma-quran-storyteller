import React, { useState, useEffect } from 'react';
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

const PROPHETS = [
  "Adam", "Nuh (Noah)", "Ibrahim (Abraham)", "Yusuf (Joseph)", "Musa (Moses)", "Isa (Jesus)", "Muhammad"
];

const TOPICS = [
  "General Life", "Patience", "Trust in God", "Leadership", "Family", "Miracles", "Justice"
];

function App() {
  const [view, setView] = useState<'home' | 'story' | 'live' | 'quran' | 'kids'>('home');
  const [mode, setMode] = useState<'gate' | 'kid' | 'parent'>('gate');
  const [selectedProphet, setSelectedProphet] = useState<string>("");
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
    const storedToken = localStorage.getItem('hikma_parent_token');
    const storedName = localStorage.getItem('hikma_parent_name');
    if (storedToken && storedName) {
      setParentName(storedName);
      setParentToken(storedToken);
      setMode('parent');
    }
  }, []);

  const handleParentAuthed = (token: string, name: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem('hikma_parent_token', token);
      localStorage.setItem('hikma_parent_name', name);
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
            const foundProphet = PROPHETS.find(p => text.toLowerCase().includes(p.toLowerCase().split(' ')[0]));
            if (foundProphet) setSelectedProphet(foundProphet);

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
    if (mode === 'kid' && target !== 'kids' && target !== 'quran') {
      return true;
    }
    return false;
  };

  const renderGate = () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-stone-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-10">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-rose-600 font-semibold">Bismillah</p>
          <h1 className="text-4xl md:text-5xl font-serif text-rose-900 leading-tight">
            Choose your path into <span className="text-amber-600">Noor Soad</span>
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            A calm space for families: kids go straight to their stories, parents can unlock everything with a PIN.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={enterKids}
            className="rounded-3xl bg-amber-500 text-white py-8 px-6 shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex flex-col gap-3"
          >
            <div className="flex items-center justify-center gap-3 text-2xl font-bold">
              <i className="fas fa-rocket"></i> Kids Mode
            </div>
            <p className="text-sm text-white/90">Jump right into stories, songs, and Quran—no login needed.</p>
          </button>
          <div className="rounded-3xl bg-white border border-stone-100 py-8 px-6 shadow-lg flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-xs uppercase text-stone-500 font-semibold">Parents</p>
                <p className="text-2xl font-bold text-rose-900">Unlock everything</p>
              </div>
              <i className="fas fa-user-shield text-rose-600 text-2xl"></i>
            </div>
            <p className="text-sm text-stone-600">Enter your name + PIN to manage settings, Learn with Soso, and full stories.</p>
            <button
              onClick={() => setShowParentGate(true)}
              className="w-full rounded-2xl bg-rose-900 text-white py-3 font-semibold hover:bg-rose-800 transition-colors"
            >
              I’m a Parent
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === 'gate') {
    return (
      <>
        {renderGate()}
        <ParentGate
          isOpen={showParentGate}
          onClose={() => setShowParentGate(false)}
          onAuthed={handleParentAuthed}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-800">
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
          <div className="w-10 h-10 bg-rose-700 rounded-lg flex items-center justify-center text-white text-xl">
            <i className="fas fa-quran"></i>
          </div>
          <h1 className="text-2xl font-serif font-bold text-rose-900 tracking-wide">Noor Soad</h1>
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
                        {PROPHETS.map(p => <option key={p} value={p}>{p}</option>)}
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

              {/* Quick Pick Story Cards */}
              <div className="mt-8">
                <h3 className="text-lg font-serif text-stone-600 mb-4 flex items-center gap-2">
                  <i className="fas fa-star text-amber-500"></i>
                  Quick Pick
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {PROPHETS.slice(0, 4).map(prophet => (
                    <StoryCard
                      key={prophet}
                      prophet={prophet}
                      topic={selectedTopic}
                      onSelect={(p) => {
                        setSelectedProphet(p);
                        setView('story');
                      }}
                      isSelected={selectedProphet === prophet}
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
  );
}

export default App;
