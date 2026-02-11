import React, { useState } from 'react';
import { Verse } from '../types';
import { audioManager } from '../services/quranAudioService';

interface VerseDisplayProps {
  verse: Verse;
  surahNumber: number;
  isPlaying?: boolean;
  isCurrentVerse?: boolean;
  showTranslation?: boolean;
  showVerseNumber?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  onPlayClick?: (verseNumber: number) => void;
  onBookmark?: (verseNumber: number) => void;
  isBookmarked?: boolean;
}

const FONT_SIZES = {
  small: { arabic: 'text-xl', translation: 'text-sm' },
  medium: { arabic: 'text-2xl', translation: 'text-base' },
  large: { arabic: 'text-3xl', translation: 'text-lg' },
  xlarge: { arabic: 'text-4xl', translation: 'text-xl' },
};

export const VerseDisplay: React.FC<VerseDisplayProps> = ({
  verse,
  surahNumber,
  isPlaying = false,
  isCurrentVerse = false,
  showTranslation = true,
  showVerseNumber = true,
  fontSize = 'medium',
  onPlayClick,
  onBookmark,
  isBookmarked = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handlePlayClick = () => {
    if (onPlayClick) {
      onPlayClick(verse.numberInSurah);
    } else {
      audioManager.playVerse(surahNumber, verse.numberInSurah);
    }
  };

  const sizes = FONT_SIZES[fontSize];

  return (
    <div
      className={`
        relative p-4 rounded-xl transition-all duration-300
        ${isCurrentVerse
          ? 'bg-gradient-to-r from-rose-100/80 to-amber-100/80 border-2 border-rose-300 shadow-lg'
          : 'bg-white/60 hover:bg-white/80 border border-stone-200'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Verse Number Badge */}
      {showVerseNumber && (
        <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-rose-600 to-rose-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
          {verse.numberInSurah}
        </div>
      )}

      {/* Action Buttons - Show on hover or always on mobile */}
      <div className={`
        absolute top-2 right-2 flex gap-2 transition-opacity duration-200
        ${isHovered || isCurrentVerse ? 'opacity-100' : 'opacity-0 md:opacity-0'}
      `}>
        {/* Play Button */}
        <button
          onClick={handlePlayClick}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center transition-all
            ${isPlaying && isCurrentVerse
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-600'
            }
          `}
          title={isPlaying ? 'Playing' : 'Play recitation'}
          aria-label={isPlaying && isCurrentVerse ? 'Pause recitation' : 'Play verse'}
        >
          {isPlaying && isCurrentVerse ? (
            <i className="fas fa-pause text-sm" aria-hidden="true"></i>
          ) : (
            <i className="fas fa-play text-sm" aria-hidden="true"></i>
          )}
        </button>

        {/* Bookmark Button */}
        {onBookmark && (
          <button
            onClick={() => onBookmark(verse.numberInSurah)}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${isBookmarked
                ? 'bg-amber-500 text-white'
                : 'bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-600'
              }
            `}
            title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <i className={`${isBookmarked ? 'fas' : 'far'} fa-bookmark text-sm`} aria-hidden="true"></i>
          </button>
        )}

        {/* Copy Button */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${verse.arabic}\n\n${verse.translation || ''}`);
          }}
          className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-all"
          title="Copy verse"
          aria-label="Copy verse to clipboard"
        >
          <i className="far fa-copy text-sm" aria-hidden="true"></i>
        </button>
      </div>

      {/* Arabic Text */}
      <div className="mt-4 mb-4">
        <p
          className={`
            font-amiri text-right leading-loose text-stone-800
            ${sizes.arabic}
            ${isCurrentVerse ? 'text-rose-900' : ''}
          `}
          dir="rtl"
          lang="ar"
        >
          {verse.arabic}
          {/* Arabic verse end marker */}
          <span className="text-rose-600 mx-2">۝</span>
        </p>
      </div>

      {/* Translation */}
      {showTranslation && verse.translation && (
        <div className="mt-4 pt-4 border-t border-stone-200">
          <p className={`text-stone-600 leading-relaxed ${sizes.translation}`}>
            {verse.translation}
          </p>
        </div>
      )}

      {/* Verse Metadata */}
      <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
        <span>Juz {verse.juz} | Page {verse.page}</span>
        <span>Verse {verse.numberInSurah}</span>
      </div>

      {/* Playing Indicator */}
      {isPlaying && isCurrentVerse && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-amber-400 rounded-b-xl">
          <div className="h-full bg-rose-600 animate-pulse" style={{ width: '100%' }}></div>
        </div>
      )}
    </div>
  );
};

// Compact version for list view
export const VerseCompact: React.FC<{
  verse: Verse;
  surahNumber: number;
  isCurrentVerse?: boolean;
  onClick?: () => void;
}> = ({ verse, surahNumber, isCurrentVerse = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg cursor-pointer transition-all
        ${isCurrentVerse
          ? 'bg-rose-100 border-l-4 border-rose-500'
          : 'bg-white/50 hover:bg-white/80 border-l-4 border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-rose-600 bg-rose-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
          {verse.numberInSurah}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-amiri text-right text-stone-800 truncate" dir="rtl">
            {verse.arabic.slice(0, 50)}...
          </p>
          {verse.translation && (
            <p className="text-sm text-stone-500 truncate mt-1">
              {verse.translation.slice(0, 60)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Word by word display
export const WordByWordDisplay: React.FC<{
  verse: Verse;
}> = ({ verse }) => {
  if (!verse.wordByWord || verse.wordByWord.length === 0) {
    return (
      <div className="text-center text-stone-500 py-8">
        <i className="fas fa-book-open text-4xl mb-3 opacity-50"></i>
        <p>Word-by-word breakdown not available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center" dir="rtl">
      {verse.wordByWord.map((word, index) => (
        <div
          key={index}
          className="bg-white/80 rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-shadow min-w-[100px]"
        >
          <p className="text-2xl font-amiri text-stone-800 mb-2">{word.arabic}</p>
          <p className="text-xs text-rose-600 mb-1">{word.transliteration}</p>
          <p className="text-sm text-stone-600">{word.translation}</p>
          {word.rootWord && (
            <p className="text-xs text-stone-400 mt-1">Root: {word.rootWord}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default VerseDisplay;
