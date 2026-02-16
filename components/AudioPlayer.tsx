import React, { useState, useEffect, useCallback } from 'react';
import { audioManager, RECITERS, formatTime, DEFAULT_RECITER } from '../services/quranAudioService';
import { Reciter } from '../types';

interface AudioPlayerProps {
  surahNumber: number;
  surahName: string;
  totalVerses: number;
  currentVerse?: number;
  onVerseChange?: (verse: number) => void;
  minimal?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  surahNumber,
  surahName,
  totalVerses,
  currentVerse = 1,
  onVerseChange,
  minimal = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playingVerse, setPlayingVerse] = useState(currentVerse);
  const [selectedReciter, setSelectedReciter] = useState<string>(DEFAULT_RECITER);
  const [showReciterDropdown, setShowReciterDropdown] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [repeatMode, setRepeatMode] = useState<'none' | 'verse' | 'surah'>('none');

  useEffect(() => {
    // Set up audio manager callbacks
    audioManager.onTimeUpdate((time, dur) => {
      setCurrentTime(time);
      setDuration(dur);
    });

    audioManager.onVerseChange((surah, verse) => {
      if (surah === surahNumber) {
        setPlayingVerse(verse);
        onVerseChange?.(verse);
      }
    });

    audioManager.onEnded(() => {
      if (repeatMode === 'verse') {
        audioManager.playVerse(surahNumber, playingVerse);
      } else if (repeatMode === 'surah') {
        audioManager.playSurah(surahNumber, 1, totalVerses);
      } else {
        setIsPlaying(false);
      }
    });

    return () => {
      audioManager.stop();
    };
  }, [surahNumber, totalVerses, repeatMode, playingVerse, onVerseChange]);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      await audioManager.playSurah(surahNumber, playingVerse, totalVerses);
      setIsPlaying(true);
    }
  }, [isPlaying, surahNumber, playingVerse, totalVerses]);

  const handlePrevious = useCallback(async () => {
    if (playingVerse > 1) {
      await audioManager.playVerse(surahNumber, playingVerse - 1);
      setIsPlaying(true);
    }
  }, [surahNumber, playingVerse]);

  const handleNext = useCallback(async () => {
    if (playingVerse < totalVerses) {
      await audioManager.playVerse(surahNumber, playingVerse + 1);
      setIsPlaying(true);
    }
  }, [surahNumber, playingVerse, totalVerses]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    audioManager.seek(time);
    setCurrentTime(time);
  }, []);

  const handleReciterChange = useCallback((reciterId: string) => {
    setSelectedReciter(reciterId);
    audioManager.setReciter(reciterId);
    setShowReciterDropdown(false);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    audioManager.setVolume(vol);
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    audioManager.setSpeed(speed);
  }, []);

  const currentReciter = RECITERS.find(r => r.identifier === selectedReciter) || RECITERS[0];

  // Minimal player (just controls)
  if (minimal) {
    return (
      <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        <button
          onClick={handlePrevious}
          disabled={playingVerse <= 1}
          className="text-stone-600 hover:text-rose-600 disabled:opacity-30 transition-colors"
          aria-label="Previous verse"
        >
          <i className="fas fa-step-backward" aria-hidden="true"></i>
        </button>

        <button
          onClick={handlePlay}
          className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm`} aria-hidden="true"></i>
        </button>

        <button
          onClick={handleNext}
          disabled={playingVerse >= totalVerses}
          className="text-stone-600 hover:text-rose-600 disabled:opacity-30 transition-colors"
          aria-label="Next verse"
        >
          <i className="fas fa-step-forward" aria-hidden="true"></i>
        </button>

        <span className="text-sm text-stone-500 ml-2">
          {playingVerse}/{totalVerses}
        </span>
      </div>
    );
  }

  // Full player
  return (
    <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-2xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">{surahName}</h3>
          <p className="text-sm text-stone-400">
            Verse {playingVerse} of {totalVerses}
          </p>
        </div>

        {/* Reciter Selector */}
        <div className="relative">
          <button
            onClick={() => setShowReciterDropdown(!showReciterDropdown)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm transition-colors"
          >
            <i className="fas fa-microphone"></i>
            <span className="hidden sm:inline">{currentReciter.englishName}</span>
            <i className="fas fa-chevron-down text-xs"></i>
          </button>

          {showReciterDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-stone-800 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
              {RECITERS.map((reciter) => (
                <button
                  key={reciter.identifier}
                  onClick={() => handleReciterChange(reciter.identifier)}
                  className={`
                    w-full text-left px-4 py-3 hover:bg-white/10 transition-colors
                    ${reciter.identifier === selectedReciter ? 'bg-rose-600/30' : ''}
                  `}
                >
                  <p className="font-medium">{reciter.englishName}</p>
                  <p className="text-sm text-stone-400">{reciter.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-lg"
        />
        <div className="flex justify-between text-xs text-stone-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-6 mb-4">
        {/* Repeat */}
        <button
          onClick={() => {
            const modes: Array<'none' | 'verse' | 'surah'> = ['none', 'verse', 'surah'];
            const currentIndex = modes.indexOf(repeatMode);
            setRepeatMode(modes[(currentIndex + 1) % modes.length]);
          }}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-colors
            ${repeatMode !== 'none' ? 'bg-rose-600 text-white' : 'text-stone-400 hover:text-white'}
          `}
          title={`Repeat: ${repeatMode}`}
          aria-label={`Repeat mode: ${repeatMode}`}
        >
          <i className={`fas ${repeatMode === 'verse' ? 'fa-redo-alt' : 'fa-redo'}`} aria-hidden="true"></i>
          {repeatMode === 'verse' && <span className="absolute text-[8px] mt-3" aria-hidden="true">1</span>}
        </button>

        {/* Previous */}
        <button
          onClick={handlePrevious}
          disabled={playingVerse <= 1}
          className="w-12 h-12 text-white hover:text-rose-400 disabled:opacity-30 transition-colors"
          aria-label="Previous verse"
        >
          <i className="fas fa-step-backward text-xl" aria-hidden="true"></i>
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlay}
          className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-2xl ${!isPlaying && 'ml-1'}`} aria-hidden="true"></i>
        </button>

        {/* Next */}
        <button
          onClick={handleNext}
          disabled={playingVerse >= totalVerses}
          className="w-12 h-12 text-white hover:text-rose-400 disabled:opacity-30 transition-colors"
          aria-label="Next verse"
        >
          <i className="fas fa-step-forward text-xl" aria-hidden="true"></i>
        </button>

        {/* Speed */}
        <div className="relative group">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-white transition-colors text-sm font-bold"
          >
            {playbackSpeed}x
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block">
            <div className="bg-stone-700 rounded-lg p-2 flex gap-1">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`
                    px-2 py-1 rounded text-xs transition-colors
                    ${playbackSpeed === speed ? 'bg-rose-600 text-white' : 'hover:bg-white/10'}
                  `}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3">
        <i className={`fas ${volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'} text-stone-400`}></i>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>
    </div>
  );
};

// Floating player for bottom of screen
export const FloatingAudioPlayer: React.FC<{
  surahNumber: number;
  surahName: string;
  totalVerses: number;
  currentVerse: number;
  isVisible: boolean;
  onClose: () => void;
  onVerseChange?: (verse: number) => void;
}> = ({ surahNumber, surahName, totalVerses, currentVerse, isVisible, onClose, onVerseChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVerse, setPlayingVerse] = useState(currentVerse);

  useEffect(() => {
    audioManager.onVerseChange((surah, verse) => {
      if (surah === surahNumber) {
        setPlayingVerse(verse);
        onVerseChange?.(verse);
      }
    });
  }, [surahNumber, onVerseChange]);

  if (!isVisible) return null;

  const handlePlay = async () => {
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      await audioManager.playSurah(surahNumber, playingVerse, totalVerses);
      setIsPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4 px-safe pb-safe shadow-2xl z-50 animate-slide-up">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={handlePlay}
            className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full flex items-center justify-center shadow-lg"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} aria-hidden="true"></i>
          </button>
          <div className="min-w-0">
            <h4 className="font-semibold truncate">{surahName}</h4>
            <p className="text-sm text-stone-400 truncate">
              Verse {playingVerse} of {totalVerses}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <button
            onClick={() => playingVerse > 1 && audioManager.playVerse(surahNumber, playingVerse - 1)}
            disabled={playingVerse <= 1}
            className="text-stone-400 hover:text-white disabled:opacity-30"
            aria-label="Previous verse"
          >
            <i className="fas fa-step-backward" aria-hidden="true"></i>
          </button>
          <button
            onClick={() => playingVerse < totalVerses && audioManager.playVerse(surahNumber, playingVerse + 1)}
            disabled={playingVerse >= totalVerses}
            className="text-stone-400 hover:text-white disabled:opacity-30"
            aria-label="Next verse"
          >
            <i className="fas fa-step-forward" aria-hidden="true"></i>
          </button>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white ml-4"
            aria-label="Close audio player"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
