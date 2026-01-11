import React, { useRef, useState } from 'react';
import stories from '../data/adultStories.json';

type Story = typeof stories[number];

const ADULT_AUDIO_VERSION = '2026-01-10d';

const AdultAudioStories: React.FC = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [openStory, setOpenStory] = useState<Story | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Warm the browser cache with pre-recorded audio so playback starts instantly.
  React.useEffect(() => {
    const map = preloadedAudiosRef.current;
    stories.forEach((story) => {
      const src = `/assets/adult/audio/${story.id}.mp3?v=${ADULT_AUDIO_VERSION}`;
      if (map.has(story.id)) return;
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;
      audio.load();
      map.set(story.id, audio);
    });

    return () => {
      map.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      map.clear();
    };
  }, []);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingId(null);
    setIsPlaying(false);
  };

  const play = (story: Story) => {
    // Toggle stop if already playing this story
    if (playingId === story.id && isPlaying) {
      stop();
      return;
    }

    const src = `/assets/adult/audio/${story.id}.mp3?v=${ADULT_AUDIO_VERSION}`;
    const cached = preloadedAudiosRef.current.get(story.id);
    const audio = cached && cached.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA ? cached : (audioRef.current || new Audio());

    audio.src = src;
    audio.preload = 'auto';
    audioRef.current = audio;

    audioRef.current.onended = () => {
      setPlayingId(null);
      setIsPlaying(false);
    };
    audioRef.current.onerror = () => {
      setPlayingId(null);
      setIsPlaying(false);
    };

    audioRef.current
      .play()
      .then(() => {
        setPlayingId(story.id);
        setIsPlaying(true);
        setOpenStory(story);
      })
      .catch(() => {
        setPlayingId(null);
        setIsPlaying(false);
      });
  };

  return (
    <div className="mt-12 bg-white/60 rounded-3xl p-6 shadow-sm border border-amber-50">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
          <i className="fas fa-headphones text-lg"></i>
        </div>
        <div>
          <h3 className="text-xl font-bold text-rose-900">Immersive Seerah Audio</h3>
          <p className="text-sm text-stone-500">Pre-recorded, offline-ready reflections to set the tone.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {stories.map((story) => (
          <div key={story.id} className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-amber-700 font-semibold uppercase">{story.title}</p>
                <p className="text-sm text-stone-600">{story.summary}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpenStory(story)}
                  className="w-10 h-10 rounded-full bg-white text-amber-700 hover:bg-amber-50 shadow flex items-center justify-center"
                  title="Read along"
                >
                  <i className="fas fa-book-open text-sm"></i>
                </button>
                <button
                  onClick={() => play(story)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow ${
                    playingId === story.id && isPlaying ? 'bg-rose-700 text-white' : 'bg-white text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <i className={`fas ${playingId === story.id && isPlaying ? 'fa-stop' : 'fa-play'}`}></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Read-along modal */}
      {openStory && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpenStory(null)}></div>
          <div className="relative z-50 max-w-3xl w-full bg-gradient-to-br from-rose-900 via-amber-900 to-stone-900 text-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-5 flex items-center justify-between border-b border-white/10 bg-white/5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Read along</p>
                <h4 className="text-2xl font-serif font-semibold">{openStory.title}</h4>
              </div>
              <div className="flex gap-2">
                {isPlaying && playingId === openStory.id ? (
                  <button
                    onClick={stop}
                    className="px-3 py-2 rounded-full bg-white/15 hover:bg-white/25 text-sm font-semibold"
                  >
                    Stop audio
                  </button>
                ) : (
                  <button
                    onClick={() => play(openStory)}
                    className="px-3 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-sm font-semibold text-stone-900"
                  >
                    Play audio
                  </button>
                )}
                <button
                  onClick={() => setOpenStory(null)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-white/5">
              <p className="text-amber-100 text-sm mb-3">{openStory.summary}</p>
              <div className="space-y-4 leading-relaxed text-white/90">
                {openStory.text.split('\n').map((p, idx) => (
                  <p key={idx}>{p.trim()}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdultAudioStories;
