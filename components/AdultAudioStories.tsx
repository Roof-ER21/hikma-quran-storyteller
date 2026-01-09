import React, { useRef, useState } from 'react';
import stories from '../data/adultStories.json';

const AdultAudioStories: React.FC = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = (id: string) => {
    const src = `/assets/adult/audio/${id}.mp3`;
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    } else {
      audioRef.current.src = src;
    }
    audioRef.current.onended = () => setPlayingId(null);
    audioRef.current.onerror = () => setPlayingId(null);
    setPlayingId(id);
    audioRef.current.play().catch(() => setPlayingId(null));
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
              <button
                onClick={() => play(story.id)}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow ${playingId === story.id ? 'bg-rose-700 text-white' : 'bg-white text-rose-700 hover:bg-rose-50'}`}
              >
                <i className={`fas ${playingId === story.id ? 'fa-stop' : 'fa-play'}`}></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdultAudioStories;
