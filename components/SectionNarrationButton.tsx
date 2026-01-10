import React from 'react';
import { NarrationState } from '../types';

interface SectionNarrationButtonProps {
  sectionId: string;
  narrationState: NarrationState | null;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  compact?: boolean;
}

const SectionNarrationButton: React.FC<SectionNarrationButtonProps> = ({
  sectionId,
  narrationState,
  onPlay,
  onPause,
  onResume,
  compact = false,
}) => {
  const isThisSection = narrationState?.currentSectionId === sectionId;
  const isPlaying = isThisSection && narrationState?.isPlaying;
  const isPaused = isThisSection && narrationState?.isPaused;
  const isLoading = isThisSection && narrationState?.isLoading;
  const progress = isThisSection ? narrationState?.progress || 0 : 0;
  const tooltip = isLoading
    ? 'Preparing narration...'
    : isPlaying
      ? 'Pause narration'
      : isPaused
        ? 'Resume narration'
        : 'Listen to this section';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent section expand/collapse

    if (isLoading) return;

    if (isPlaying) {
      onPause();
    } else if (isPaused) {
      onResume();
    } else {
      onPlay();
    }
  };

  // SVG progress ring
  const size = compact ? 32 : 40;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        relative flex items-center justify-center
        rounded-full transition-all duration-200
        ${compact ? 'w-8 h-8' : 'w-10 h-10'}
        ${isPlaying || isPaused
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
          : 'bg-stone-100 text-stone-600 hover:bg-rose-50 hover:text-rose-600'
        }
        ${isLoading ? 'cursor-wait opacity-70' : 'cursor-pointer'}
      `}
      title={tooltip}
      aria-busy={isLoading}
      aria-live="polite"
      aria-label={tooltip}
    >
      {/* Progress ring */}
      {(isPlaying || isPaused) && progress > 0 && (
        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            opacity={0.2}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-300"
          />
        </svg>
      )}

      {/* Icon */}
      <div className="relative z-10">
        {isLoading ? (
          <i className="fas fa-spinner fa-spin text-sm"></i>
        ) : isPlaying ? (
          <i className="fas fa-pause text-sm"></i>
        ) : (
          <i className="fas fa-headphones text-sm"></i>
        )}
      </div>
    </button>
  );
};

export default SectionNarrationButton;
