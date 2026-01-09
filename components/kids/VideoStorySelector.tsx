import React, { useState } from 'react';
import KidsVideoPlayer from './KidsVideoPlayer';
import kidsStories from '../../data/kidsStories';

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

interface VideoStorySelectorProps {
  onBack: () => void;
  onEarnStar?: () => void;
}

const VideoStorySelector: React.FC<VideoStorySelectorProps> = ({ onBack, onEarnStar }) => {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [watchedStories, setWatchedStories] = useState<Set<string>>(new Set());

  const handleStoryComplete = () => {
    if (selectedStoryId && !watchedStories.has(selectedStoryId)) {
      setWatchedStories(prev => new Set([...prev, selectedStoryId]));
      onEarnStar?.();
    }
  };

  const handleBackFromPlayer = () => {
    setSelectedStoryId(null);
  };

  // If a story is selected, show the video player
  if (selectedStoryId) {
    return (
      <KidsVideoPlayer
        storyId={selectedStoryId}
        onBack={handleBackFromPlayer}
        onComplete={handleStoryComplete}
      />
    );
  }

  // Show story selection grid
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: KIDS_COLORS.cream }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-bold text-stone-700">Video Stories</h1>
        <div className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center">
          <span className="text-amber-500 font-bold">{watchedStories.size}/{kidsStories.length}</span>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 py-2 text-center">
        <p className="text-lg text-stone-600">
          Watch beautiful animated stories with pictures and sounds!
        </p>
      </div>

      {/* Story Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {kidsStories.map((story) => (
            <button
              key={story.id}
              onClick={() => setSelectedStoryId(story.id)}
              className={`relative p-6 rounded-3xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform ${
                watchedStories.has(story.id) ? 'ring-4 ring-green-400' : ''
              }`}
              style={{ backgroundColor: KIDS_COLORS[story.colorKey] }}
            >
              {/* Watched badge */}
              {watchedStories.has(story.id) && (
                <div className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">⭐</span>
                </div>
              )}

              {/* Content */}
              <div className="text-center">
                <div className="text-6xl mb-3">{story.emoji}</div>
                <h3 className="text-2xl font-bold text-white mb-1">{story.prophet}</h3>
                <p className="text-3xl font-arabic text-white/90 mb-2">{story.prophetArabic}</p>
                <p className="text-lg text-white/80 mb-3">{story.title}</p>

                {/* Scene count */}
                <div className="flex items-center justify-center gap-2 text-white/70">
                  <i className="fas fa-film"></i>
                  <span className="text-sm">{story.scenes.length} scenes</span>
                </div>

                {/* Play icon */}
                <div className="mt-4 w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mx-auto">
                  <i className="fas fa-play text-2xl text-white pl-1"></i>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-4 bg-white border-t border-stone-200">
        <div className="max-w-4xl mx-auto text-center text-sm text-stone-500">
          <p className="mb-2">
            <i className="fas fa-info-circle mr-2"></i>
            Tip: Videos work offline once downloaded!
          </p>
          <p className="flex items-center justify-center gap-4 flex-wrap">
            <span><i className="fas fa-play mr-1"></i> Watch in app</span>
            <span><i className="fas fa-download mr-1"></i> Download video</span>
            <span><i className="fas fa-star mr-1"></i> Earn stars</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoStorySelector;
