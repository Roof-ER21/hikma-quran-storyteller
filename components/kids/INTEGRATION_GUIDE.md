# Kids Video Player - Integration Guide

## Quick Start (5 Minutes)

### Step 1: Import the Components

In your `KidsHome.tsx` (or wherever you want to add video stories):

```typescript
import VideoStorySelector from './VideoStorySelector';
```

### Step 2: Add to Activities List

```typescript
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
```

### Step 3: Update Type Definition

```typescript
type KidsActivity = 'home' | 'alphabet' | 'quran' | 'stories' | 'videos' | 'rewards';
```

### Step 4: Add Activity Handler

```typescript
// Before the final return statement
if (activity === 'videos') {
  return (
    <VideoStorySelector
      onBack={() => setActivity('home')}
      onEarnStar={earnStar}
    />
  );
}
```

### Step 5: Test It!

```bash
npm run dev
```

Navigate to Kids Mode → Video Stories → Select a story → Press play!

---

## Verification Checklist

### Pre-Integration Checks

- [ ] Illustrations exist in `/public/assets/kids/illustrations/`
  - `story-adam-0.png` through `story-adam-2.png`
  - `story-nuh-0.png` through `story-nuh-3.png`
  - `story-ibrahim-0.png` through `story-ibrahim-2.png`
  - `story-musa-0.png` through `story-musa-2.png`
  - `story-yusuf-0.png` through `story-yusuf-2.png`

- [ ] Audio files exist in `/public/assets/kids/audio/`
  - `story-adam-scene-0.mp3` through `story-adam-scene-2.mp3`
  - `story-nuh-scene-0.mp3` through `story-nuh-scene-3.mp3`
  - `story-ibrahim-scene-0.mp3` through `story-ibrahim-scene-2.mp3`
  - `story-musa-scene-0.mp3` through `story-musa-scene-2.mp3`
  - `story-yusuf-scene-0.mp3` through `story-yusuf-scene-2.mp3`

- [ ] Story data exists in `/data/kidsStories.json`

### Post-Integration Checks

- [ ] App builds without errors (`npm run build`)
- [ ] Video player opens when selecting a story
- [ ] Canvas displays illustrations correctly
- [ ] Audio plays synchronized with visuals
- [ ] Play/pause button works
- [ ] Progress bar updates correctly
- [ ] Scene indicators show current scene
- [ ] Transitions are smooth (fade in/out)
- [ ] Back button returns to story selection
- [ ] Completion awards a star
- [ ] Export button downloads video (Chrome/Firefox)
- [ ] Works offline after initial load

---

## File Structure

After integration, you should have:

```
components/kids/
├── KidsHome.tsx                 # Updated with video activity
├── KidsVideoPlayer.tsx          # Main video player (NEW)
├── VideoStorySelector.tsx       # Story selection grid (NEW)
├── VideoPlayerDemo.tsx          # Demo/test component (NEW)
├── MediaGenerator.tsx           # Existing media generator
├── INTEGRATION_GUIDE.md         # This file (NEW)
├── USAGE_EXAMPLES.md            # Usage examples (NEW)
└── VIDEO_PLAYER_README.md       # Technical docs (NEW)

public/assets/kids/
├── illustrations/               # Story images
│   ├── story-adam-0.png
│   ├── story-adam-1.png
│   └── ... (all story images)
├── audio/                       # Story audio
│   ├── story-adam-scene-0.mp3
│   ├── story-adam-scene-1.mp3
│   └── ... (all audio files)
└── manifest.json                # Asset manifest

data/
└── kidsStories.json             # Story definitions
```

---

## Feature Testing

### Manual Test Script

1. **Launch App**
   ```bash
   npm run dev
   ```

2. **Navigate to Video Stories**
   - Open app in browser
   - Click "Kids Mode" (if separate)
   - Click "Video Stories" activity card

3. **Test Story Selection**
   - All 5 story cards should display
   - Each card shows prophet name, emoji, scene count
   - Clicking a card opens the video player

4. **Test Video Playback**
   - Press play button (green circle)
   - Verify illustration appears
   - Verify audio plays automatically
   - Check text displays below image
   - Watch for fade transitions between scenes

5. **Test Controls**
   - Pause during playback (button turns orange)
   - Resume playback
   - Verify progress bar updates
   - Check scene indicators (dots at bottom)

6. **Test Completion**
   - Watch video to end
   - Verify "Story Complete!" overlay appears
   - Check lesson text displays
   - Confirm star is awarded (check counter)
   - Press "Watch Again" button

7. **Test Export (Optional)**
   - Click download button (top right)
   - Wait for export to complete
   - Verify WebM file downloads
   - Try playing downloaded video

8. **Test Navigation**
   - Press back button during playback
   - Verify returns to story selection
   - Check watched story has star badge
   - Count updates (e.g., "1/5")

9. **Test Offline**
   - Open Chrome DevTools → Network
   - Enable "Offline" mode
   - Refresh page (should load from cache)
   - Play a video (should work offline)

---

## Troubleshooting

### Issue: Video player doesn't open

**Check:**
- Activity ID matches in ACTIVITIES array and handler
- Import statement is correct
- No console errors

**Fix:**
```typescript
// Ensure activity ID is exactly 'videos'
if (activity === 'videos') { // not 'video' or 'video-stories'
  return <VideoStorySelector ... />;
}
```

### Issue: Images don't load

**Check:**
- Files exist in `/public/assets/kids/illustrations/`
- Naming matches: `story-{id}-{index}.png` (not .jpg)
- File permissions are readable

**Fix:**
```bash
ls -la public/assets/kids/illustrations/
# Should show all story images
```

### Issue: Audio doesn't play

**Check:**
- Files exist in `/public/assets/kids/audio/`
- Browser autoplay policy (requires user interaction)
- Console for 404 errors

**Fix:**
```typescript
// Audio should start after clicking play button
// If still fails, check browser console
```

### Issue: Canvas is blank

**Check:**
- Canvas ref is properly initialized
- Image paths are correct
- No CORS issues (unlikely with public assets)

**Fix:**
```typescript
// Check canvas dimensions
console.log(canvasRef.current?.width); // Should be 1280
console.log(canvasRef.current?.height); // Should be 720
```

### Issue: Export doesn't work

**Check:**
- Browser supports MediaRecorder API
- WebM codec is available
- Not using Safari (limited support)

**Fix:**
```typescript
// Test in Chrome/Firefox first
// Safari may require MP4 export (future enhancement)
```

### Issue: Progress bar doesn't update

**Check:**
- Animation loop is running
- Scene durations are calculated
- No errors in console

**Fix:**
```typescript
// Enable console logging in KidsVideoPlayer
console.log('Scene duration:', scene.duration);
console.log('Progress:', progress);
```

---

## Performance Tips

### 1. Image Optimization

Reduce image file sizes for faster loading:

```bash
# Using ImageMagick
for img in public/assets/kids/illustrations/*.png; do
  convert "$img" -resize 1920x1080 -quality 85 "$img"
done
```

### 2. Audio Compression

Optimize audio files:

```bash
# Using FFmpeg
for audio in public/assets/kids/audio/*.mp3; do
  ffmpeg -i "$audio" -b:a 128k "${audio}.optimized.mp3"
  mv "${audio}.optimized.mp3" "$audio"
done
```

### 3. Lazy Loading

Load video player only when needed:

```typescript
const VideoStorySelector = lazy(() => import('./VideoStorySelector'));

// In component
<Suspense fallback={<LoadingSpinner />}>
  {activity === 'videos' && <VideoStorySelector ... />}
</Suspense>
```

### 4. Preload Assets

Preload images and audio on app start:

```typescript
// In App.tsx or main component
useEffect(() => {
  // Preload all story images
  kidsStories.forEach(story => {
    story.scenes.forEach((_, i) => {
      const img = new Image();
      img.src = `/assets/kids/illustrations/story-${story.id}-${i}.png`;
    });
  });
}, []);
```

---

## Browser Support Matrix

| Browser | Version | Canvas | Audio | Export | Offline |
|---------|---------|--------|-------|--------|---------|
| Chrome  | 90+     | ✅     | ✅    | ✅     | ✅      |
| Firefox | 88+     | ✅     | ✅    | ✅     | ✅      |
| Safari  | 14+     | ✅     | ✅    | ⚠️     | ✅      |
| Edge    | 90+     | ✅     | ✅    | ✅     | ✅      |

✅ Full support | ⚠️ Partial support (WebM export may not work)

---

## Next Steps

After successful integration:

1. **Add More Stories**
   - Create new story entries in `kidsStories.json`
   - Generate illustrations and audio
   - Test with new content

2. **Enhance Features**
   - Add subtitles/captions
   - Implement playback speed control
   - Create video playlists
   - Add parent sharing features

3. **Optimize Performance**
   - Implement image lazy loading
   - Add service worker caching
   - Enable compression for assets

4. **Collect Analytics**
   - Track most watched stories
   - Monitor completion rates
   - Measure export usage

5. **User Feedback**
   - Add rating system
   - Collect feature requests
   - A/B test different transitions

---

## Support Resources

- **Technical Documentation**: `VIDEO_PLAYER_README.md`
- **Usage Examples**: `USAGE_EXAMPLES.md`
- **Component Demo**: `VideoPlayerDemo.tsx`
- **Issue Tracking**: Check console logs first
- **Browser DevTools**: Network tab for asset loading

---

## Success Criteria

Your integration is successful when:

- ✅ All 5 default stories are playable
- ✅ Audio syncs perfectly with visuals
- ✅ Transitions are smooth (no flicker)
- ✅ Progress tracking works correctly
- ✅ Stars are awarded on completion
- ✅ Export functionality works (Chrome/Firefox)
- ✅ Offline playback is functional
- ✅ No console errors during playback
- ✅ Mobile responsive and touch-friendly
- ✅ Parent/kid feedback is positive

---

**Ready to integrate? Follow the Quick Start steps above and you'll have video stories running in 5 minutes!**

**Questions? Check the troubleshooting section or review the usage examples.**

---

**Last Updated**: January 9, 2026
**Version**: 1.0.0
**Integration Time**: ~5 minutes
