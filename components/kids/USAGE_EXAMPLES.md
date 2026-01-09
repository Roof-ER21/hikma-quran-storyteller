# Kids Video Player - Usage Examples

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Integration Examples](#integration-examples)
3. [Advanced Customization](#advanced-customization)
4. [Real-World Scenarios](#real-world-scenarios)
5. [Troubleshooting Examples](#troubleshooting-examples)

---

## Basic Usage

### Example 1: Standalone Video Player

```typescript
import React from 'react';
import KidsVideoPlayer from './components/kids/KidsVideoPlayer';

function App() {
  return (
    <KidsVideoPlayer
      storyId="adam"
      onBack={() => window.history.back()}
      onComplete={() => console.log('Story completed!')}
    />
  );
}
```

### Example 2: Story Selection with Video Player

```typescript
import React, { useState } from 'react';
import VideoStorySelector from './components/kids/VideoStorySelector';

function StoriesPage() {
  return (
    <VideoStorySelector
      onBack={() => {
        // Navigate back to home
        window.location.href = '/';
      }}
      onEarnStar={() => {
        // Award star to user
        console.log('User earned a star!');
      }}
    />
  );
}
```

---

## Integration Examples

### Example 3: Integration with KidsHome Component

Add video stories as a new activity in the kids section:

```typescript
// In components/kids/KidsHome.tsx

// 1. Add to ACTIVITIES array
const ACTIVITIES = [
  // ... existing activities
  {
    id: 'videos' as const,
    title: 'Video Stories',
    titleArabic: 'قصص فيديو',
    icon: 'fa-film',
    color: KIDS_COLORS.orange,
    description: 'Watch animated stories!',
  },
];

// 2. Update KidsActivity type
type KidsActivity = 'home' | 'alphabet' | 'quran' | 'stories' | 'videos' | 'rewards';

// 3. Add activity handler
import VideoStorySelector from './VideoStorySelector';

// In KidsHome component, before the return statement:
if (activity === 'videos') {
  return (
    <VideoStorySelector
      onBack={() => setActivity('home')}
      onEarnStar={earnStar}
    />
  );
}
```

### Example 4: Progressive Web App Integration

Add video player to PWA manifest for offline capability:

```typescript
// In vite.config.ts or PWA config

import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      workbox: {
        // Cache video assets
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
          'assets/kids/illustrations/*.png',
          'assets/kids/audio/*.mp3',
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-audio-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
};
```

### Example 5: React Router Integration

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import KidsVideoPlayer from './components/kids/KidsVideoPlayer';
import VideoStorySelector from './components/kids/VideoStorySelector';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/kids/videos" element={<VideoStorySelector onBack={() => navigate('/kids')} />} />
        <Route path="/kids/videos/:storyId" element={<VideoPlayerRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

function VideoPlayerRoute() {
  const { storyId } = useParams();
  const navigate = useNavigate();

  return (
    <KidsVideoPlayer
      storyId={storyId || 'adam'}
      onBack={() => navigate('/kids/videos')}
      onComplete={() => {
        // Award achievement
        awardStar();
        // Optional: auto-navigate after delay
        setTimeout(() => navigate('/kids/videos'), 2000);
      }}
    />
  );
}
```

---

## Advanced Customization

### Example 6: Custom Progress Tracking

Track detailed video analytics:

```typescript
import React, { useState, useCallback } from 'react';
import KidsVideoPlayer from './components/kids/KidsVideoPlayer';

function AnalyticsVideoPlayer() {
  const [analytics, setAnalytics] = useState({
    startTime: null as number | null,
    endTime: null as number | null,
    pauseCount: 0,
    watchedScenes: [] as number[],
  });

  const handleComplete = useCallback(() => {
    setAnalytics(prev => ({
      ...prev,
      endTime: Date.now(),
    }));

    // Send to analytics service
    const watchTime = analytics.startTime
      ? (Date.now() - analytics.startTime) / 1000
      : 0;

    console.log('Video Analytics:', {
      duration: watchTime,
      pauses: analytics.pauseCount,
      completionRate: 100,
    });

    // Could send to backend:
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(analytics) });
  }, [analytics]);

  return (
    <KidsVideoPlayer
      storyId="adam"
      onBack={() => console.log('Back pressed')}
      onComplete={handleComplete}
    />
  );
}
```

### Example 7: Multi-Language Support

Extend for multiple language audio tracks:

```typescript
import React, { useState } from 'react';
import KidsVideoPlayer from './components/kids/KidsVideoPlayer';

function MultiLanguageVideoPlayer({ storyId }: { storyId: string }) {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  // Modify audio URLs based on language
  const getAudioUrl = (sceneIndex: number) => {
    return `/assets/kids/audio/${language}/story-${storyId}-scene-${sceneIndex}.mp3`;
  };

  return (
    <div>
      {/* Language selector */}
      <div className="p-4 flex gap-2 justify-center">
        <button
          onClick={() => setLanguage('en')}
          className={`px-4 py-2 rounded-full ${language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          English
        </button>
        <button
          onClick={() => setLanguage('ar')}
          className={`px-4 py-2 rounded-full ${language === 'ar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          العربية
        </button>
      </div>

      {/* Player */}
      <KidsVideoPlayer
        storyId={storyId}
        onBack={() => window.history.back()}
      />
    </div>
  );
}
```

### Example 8: Custom Controls Overlay

Add additional controls to the video player:

```typescript
import React, { useState, useRef } from 'react';
import KidsVideoPlayer from './components/kids/KidsVideoPlayer';

function CustomControlsVideoPlayer() {
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  return (
    <div className="relative">
      <KidsVideoPlayer
        storyId="adam"
        onBack={() => console.log('Back')}
      />

      {/* Custom overlay controls */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2">
        {/* Subtitles toggle */}
        <button
          onClick={() => setShowSubtitles(!showSubtitles)}
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center"
          title="Toggle subtitles"
        >
          <i className={`fas fa-closed-captioning ${showSubtitles ? 'text-blue-500' : 'text-gray-400'}`}></i>
        </button>

        {/* Speed control */}
        <button
          onClick={() => setPlaybackSpeed(prev => prev === 1 ? 1.5 : 1)}
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-sm font-bold"
          title="Playback speed"
        >
          {playbackSpeed}x
        </button>
      </div>
    </div>
  );
}
```

---

## Real-World Scenarios

### Example 9: Parental Controls

Require parent approval before video playback:

```typescript
import React, { useState } from 'react';
import VideoStorySelector from './components/kids/VideoStorySelector';
import ParentGate from './ParentGate'; // Your existing parent gate component

function ParentControlledVideos() {
  const [parentApproved, setParentApproved] = useState(false);
  const [dailyWatchTime, setDailyWatchTime] = useState(0);
  const MAX_DAILY_MINUTES = 30;

  if (!parentApproved) {
    return (
      <ParentGate
        onSuccess={() => setParentApproved(true)}
        message="Parent approval required to watch videos"
      />
    );
  }

  if (dailyWatchTime >= MAX_DAILY_MINUTES) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-3xl p-8 shadow-xl max-w-md">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold mb-4">Time's Up!</h2>
          <p className="text-lg text-gray-600">
            You've watched enough videos today. Come back tomorrow!
          </p>
        </div>
      </div>
    );
  }

  return (
    <VideoStorySelector
      onBack={() => setParentApproved(false)}
      onEarnStar={() => console.log('Star earned')}
    />
  );
}
```

### Example 10: Download Progress Indicator

Show download status for offline viewing:

```typescript
import React, { useState, useEffect } from 'react';
import VideoStorySelector from './components/kids/VideoStorySelector';
import kidsStories from '../../data/kidsStories';

function OfflineVideoManager() {
  const [downloadedStories, setDownloadedStories] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadStory = async (storyId: string) => {
    setDownloading(storyId);

    try {
      const story = kidsStories.find(s => s.id === storyId);
      if (!story) return;

      // Download all assets
      const assets = [
        ...story.scenes.map((_, i) => `/assets/kids/illustrations/story-${storyId}-${i}.png`),
        ...story.scenes.map((_, i) => `/assets/kids/audio/story-${storyId}-scene-${i}.mp3`),
      ];

      await Promise.all(
        assets.map(url => fetch(url).then(res => res.blob()))
      );

      setDownloadedStories(prev => new Set([...prev, storyId]));
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      {/* Download status */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <span className="text-sm text-gray-600">
            {downloadedStories.size} of {kidsStories.length} stories downloaded
          </span>
          <button
            onClick={() => kidsStories.forEach(s => downloadStory(s.id))}
            disabled={downloading !== null}
            className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download All'}
          </button>
        </div>
      </div>

      {/* Video selector */}
      <VideoStorySelector
        onBack={() => console.log('Back')}
        onEarnStar={() => console.log('Star earned')}
      />
    </div>
  );
}
```

### Example 11: Social Sharing Integration

Share completed videos:

```typescript
import React, { useState } from 'react';
import KidsVideoPlayer from './components/kids/KidsVideoPlayer';

function ShareableVideoPlayer({ storyId }: { storyId: string }) {
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleComplete = async () => {
    // Show share options
    setShowShareDialog(true);
  };

  const shareVideo = async (platform: 'whatsapp' | 'email' | 'copy') => {
    const shareUrl = `${window.location.origin}/kids/videos/${storyId}`;
    const shareText = `Check out this amazing Islamic story for kids!`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`);
        break;
      case 'email':
        window.location.href = `mailto:?subject=Islamic Story&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        break;
    }

    setShowShareDialog(false);
  };

  return (
    <div>
      <KidsVideoPlayer
        storyId={storyId}
        onBack={() => console.log('Back')}
        onComplete={handleComplete}
      />

      {/* Share dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Share This Story!</h3>
            <div className="space-y-3">
              <button
                onClick={() => shareVideo('whatsapp')}
                className="w-full p-4 bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <i className="fab fa-whatsapp text-2xl"></i>
                Share on WhatsApp
              </button>
              <button
                onClick={() => shareVideo('email')}
                className="w-full p-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <i className="fas fa-envelope text-2xl"></i>
                Share via Email
              </button>
              <button
                onClick={() => shareVideo('copy')}
                className="w-full p-4 bg-gray-200 text-gray-800 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <i className="fas fa-copy text-2xl"></i>
                Copy Link
              </button>
              <button
                onClick={() => setShowShareDialog(false)}
                className="w-full p-4 bg-gray-100 text-gray-600 rounded-2xl font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Troubleshooting Examples

### Example 12: Error Boundary for Video Player

Gracefully handle errors:

```typescript
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class VideoPlayerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Video player error:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-red-50">
          <div className="text-center bg-white rounded-3xl p-8 shadow-xl max-w-md">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold mb-4 text-red-600">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              The video player encountered an error. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-bold"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <VideoPlayerErrorBoundary>
      <VideoStorySelector onBack={() => {}} />
    </VideoPlayerErrorBoundary>
  );
}
```

### Example 13: Network Status Handling

Check network before video export:

```typescript
import React, { useState, useEffect } from 'react';
import KidsVideoPlayer from './components/kids/KidsVideoPlayer';

function NetworkAwareVideoPlayer({ storyId }: { storyId: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div>
      {/* Network status banner */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center font-bold">
          <i className="fas fa-wifi-slash mr-2"></i>
          You're offline. Videos will play from cache.
        </div>
      )}

      <KidsVideoPlayer
        storyId={storyId}
        onBack={() => console.log('Back')}
      />
    </div>
  );
}
```

---

## Performance Optimization Example

### Example 14: Lazy Loading with Suspense

```typescript
import React, { lazy, Suspense } from 'react';

const KidsVideoPlayer = lazy(() => import('./components/kids/KidsVideoPlayer'));
const VideoStorySelector = lazy(() => import('./components/kids/VideoStorySelector'));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-spin">⏳</div>
        <p className="text-xl text-gray-600">Loading videos...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <VideoStorySelector
        onBack={() => console.log('Back')}
        onEarnStar={() => console.log('Star earned')}
      />
    </Suspense>
  );
}
```

---

## Summary

These examples demonstrate:
- ✅ Basic integration patterns
- ✅ Advanced customization options
- ✅ Real-world use cases
- ✅ Error handling strategies
- ✅ Performance optimization techniques
- ✅ Progressive enhancement approaches

Choose the examples that best fit your use case and customize as needed!
