import React, { useState } from 'react';
import { NarrationState } from '../types';
import { RECITERS, formatTime } from '../services/quranAudioService';

interface ProphetAudioPlayerProps {
  narrationState: NarrationState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onSpeedChange: (speed: number) => void;
  onReciterChange: (reciterId: string) => void;
  currentSpeed: number;
  currentReciter: string;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5];

const ProphetAudioPlayer: React.FC<ProphetAudioPlayerProps> = ({
  narrationState,
  onPlay,
  onPause,
  onStop,
  onSkipForward,
  onSkipBack,
  onSpeedChange,
  onReciterChange,
  currentSpeed,
  currentReciter,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const {
    isPlaying,
    isPaused,
    isLoading,
    currentItem,
    currentIndex,
    totalItems,
    progress,
    currentTime,
    duration,
    currentProphetName,
    error,
  } = narrationState;

  // Don't show if nothing is playing
  if (!isPlaying && !isPaused && !isLoading) {
    return null;
  }

  const getCurrentItemLabel = () => {
    if (!currentItem) return 'Loading...';

    switch (currentItem.type) {
      case 'quran-recitation':
        return `Quran - Surah ${currentItem.surah}:${currentItem.verse}`;
      case 'tts':
        if (currentItem.metadata?.isTranslation) {
          return `Translation - Surah ${currentItem.surah}:${currentItem.verse}`;
        }
        if (currentItem.metadata?.isHadith) {
          return `Hadith - ${currentItem.metadata.source}`;
        }
        if (currentItem.metadata?.sectionTitle) {
          return currentItem.metadata.sectionTitle;
        }
        return 'Narration';
      case 'prebaked':
        return currentItem.metadata?.sectionTitle || 'Section';
      default:
        return 'Playing...';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-white/20">
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Prophet info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider text-rose-200">
                  {currentProphetName || 'Prophet Story'}
                </span>
                <span className="text-xs text-rose-300">
                  {currentIndex + 1} / {totalItems}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium truncate">
                  {getCurrentItemLabel()}
                </p>
                {currentItem?.type === 'quran-recitation' && (
                  <span className="px-2 py-0.5 text-xs bg-amber-500/30 rounded-full">
                    <i className="fas fa-quran mr-1"></i>
                    Recitation
                  </span>
                )}
              </div>
            </div>

            {/* Time display */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-rose-200">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-2">
              {/* Skip back */}
              <button
                onClick={onSkipBack}
                disabled={currentIndex === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous"
              >
                <i className="fas fa-step-backward text-sm"></i>
              </button>

              {/* Play/Pause */}
              <button
                onClick={isPlaying ? onPause : onPlay}
                disabled={isLoading}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-rose-900 hover:bg-rose-50 transition-colors shadow-lg"
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : isPlaying ? (
                  <i className="fas fa-pause"></i>
                ) : (
                  <i className="fas fa-play ml-0.5"></i>
                )}
              </button>

              {/* Skip forward */}
              <button
                onClick={onSkipForward}
                disabled={currentIndex >= totalItems - 1}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next"
              >
                <i className="fas fa-step-forward text-sm"></i>
              </button>
            </div>

            {/* Speed control */}
            <div className="hidden md:flex items-center">
              <select
                value={currentSpeed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {SPEED_OPTIONS.map((speed) => (
                  <option key={speed} value={speed} className="bg-rose-900">
                    {speed}x
                  </option>
                ))}
              </select>
            </div>

            {/* Settings toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <i className={`fas fa-${showSettings ? 'times' : 'cog'} text-sm`}></i>
            </button>

            {/* Stop/Close */}
            <button
              onClick={onStop}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              title="Stop"
            >
              <i className="fas fa-stop text-sm"></i>
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-2 text-sm text-amber-300">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {error}
            </div>
          )}
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="border-t border-white/10 bg-rose-950/50">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Reciter selection */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-rose-200 mb-2">
                    Quran Reciter
                  </label>
                  <select
                    value={currentReciter}
                    onChange={(e) => onReciterChange(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {RECITERS.map((reciter) => (
                      <option
                        key={reciter.identifier}
                        value={reciter.identifier}
                        className="bg-rose-900"
                      >
                        {reciter.englishName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed selection (mobile) */}
                <div className="md:hidden">
                  <label className="block text-xs uppercase tracking-wider text-rose-200 mb-2">
                    Playback Speed
                  </label>
                  <div className="flex gap-2">
                    {SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => onSpeedChange(speed)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentSpeed === speed
                            ? 'bg-amber-500 text-white'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audio type legend */}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-rose-200">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Quran Recitation
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Story Narration
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Translation
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProphetAudioPlayer;
