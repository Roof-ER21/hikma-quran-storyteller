import React, { useState } from 'react';
import VideoStorySelector from './VideoStorySelector';

/**
 * Demo component to test the Kids Video Player
 *
 * To use this demo:
 * 1. Import this component into your main app
 * 2. Add a route or button to render it
 * 3. Click on any story to watch the video
 *
 * Example integration:
 *
 * import VideoPlayerDemo from './components/kids/VideoPlayerDemo';
 *
 * // In your component
 * <button onClick={() => setView('video-demo')}>Test Video Player</button>
 * {view === 'video-demo' && <VideoPlayerDemo />}
 */

const VideoPlayerDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(true);
  const [starsEarned, setStarsEarned] = useState(0);

  const handleEarnStar = () => {
    setStarsEarned(prev => prev + 1);
    console.log('⭐ Star earned! Total:', starsEarned + 1);
  };

  const handleBack = () => {
    console.log('Back button pressed');
    setShowDemo(false);
    // In a real app, you'd navigate back to the previous screen
  };

  if (!showDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-4">Video Player Demo</h1>
          <p className="text-lg text-stone-600 mb-6">
            You earned {starsEarned} star{starsEarned !== 1 ? 's' : ''}!
          </p>
          <button
            onClick={() => setShowDemo(true)}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Stars counter (floating) */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
        <span className="text-2xl">⭐</span>
        <span className="font-bold text-lg text-amber-500">{starsEarned}</span>
      </div>

      {/* Video Story Selector */}
      <VideoStorySelector onBack={handleBack} onEarnStar={handleEarnStar} />
    </div>
  );
};

export default VideoPlayerDemo;

/**
 * Quick Start Guide:
 *
 * 1. Import and render this component:
 *    <VideoPlayerDemo />
 *
 * 2. Or integrate into KidsHome.tsx:
 *    Add to ACTIVITIES array:
 *    {
 *      id: 'videos',
 *      title: 'Video Stories',
 *      titleArabic: 'قصص فيديو',
 *      icon: 'fa-film',
 *      color: KIDS_COLORS.orange,
 *      description: 'Watch animated stories!',
 *    }
 *
 *    Then in the activity handler:
 *    if (activity === 'videos') {
 *      return <VideoStorySelector onBack={() => setActivity('home')} onEarnStar={earnStar} />;
 *    }
 *
 * 3. Test features:
 *    - Click on a story card
 *    - Press play to watch the video
 *    - Pause and resume
 *    - Watch until completion to earn a star
 *    - Try the download button to export video
 *    - Press back to return to selection
 *
 * 4. Verify assets:
 *    - Check /public/assets/kids/illustrations/ for images
 *    - Check /public/assets/kids/audio/ for MP3 files
 *    - Ensure naming matches: story-{id}-{index}.png/mp3
 *
 * 5. Console logs:
 *    - Watch for "Star earned!" messages
 *    - Check for asset loading errors
 *    - Monitor playback state changes
 */
