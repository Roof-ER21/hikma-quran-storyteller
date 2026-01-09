# Kids Video Player - Noor Soad App

## Overview

The Kids Video Player is a feature-complete video generation and playback system for the Noor Soad kids educational app. It creates engaging slideshow-style videos by combining pre-generated story illustrations with audio narrations, complete with smooth transitions and kid-friendly controls.

## Features

### 1. **In-App Video Playback**
- Smooth slideshow-style video presentation
- Synchronized audio narration with visuals
- Fade-in/fade-out transitions between scenes
- Large, kid-friendly play/pause controls
- Visual progress indicator with scene numbers
- Automatic progression through all scenes

### 2. **Offline-First Design**
- Works completely offline once assets are loaded
- Uses pre-generated illustrations and audio files
- No external API calls during playback
- Assets cached by service worker for true offline capability

### 3. **Video Export**
- Download videos as WebM files using MediaRecorder API
- Exports at 1280x720 resolution, 30fps
- Includes both video and audio tracks
- One-click download for offline sharing

### 4. **Kid-Friendly Interface**
- Large touch targets (14-20rem buttons)
- Colorful, engaging design matching story themes
- Simple controls (play/pause/restart)
- Visual feedback (scene indicators, progress bar)
- Emoji-rich content display

### 5. **Progress Tracking**
- Tracks watched stories
- Awards stars on completion
- Visual indicators for completed content
- Persistent progress via existing database

## Component Architecture

```
components/kids/
├── KidsVideoPlayer.tsx       # Main video player component
├── VideoStorySelector.tsx    # Story selection grid
└── VIDEO_PLAYER_README.md    # This documentation
```

## Usage

### Basic Integration

```typescript
import KidsVideoPlayer from './components/kids/KidsVideoPlayer';

// In your component
<KidsVideoPlayer
  storyId="adam"
  onBack={() => {/* navigate back */}}
  onComplete={() => {/* optional: handle completion */}}
/>
```

### With Story Selector

```typescript
import VideoStorySelector from './components/kids/VideoStorySelector';

// In your app
<VideoStorySelector
  onBack={() => {/* navigate back */}}
  onEarnStar={() => {/* award star to user */}}
/>
```

### Integration with KidsHome

Add to the ACTIVITIES array in `KidsHome.tsx`:

```typescript
{
  id: 'videos' as const,
  title: 'Video Stories',
  titleArabic: 'قصص فيديو',
  icon: 'fa-film',
  color: KIDS_COLORS.orange,
  description: 'Watch animated stories!',
}
```

Then add the activity handler:

```typescript
if (activity === 'videos') {
  return (
    <VideoStorySelector
      onBack={() => setActivity('home')}
      onEarnStar={earnStar}
    />
  );
}
```

## Technical Details

### Canvas Rendering

The player uses HTML5 Canvas for rendering:
- **Resolution**: 1280x720 (720p HD)
- **Frame Rate**: 30fps for export, requestAnimationFrame for playback
- **Drawing Process**:
  1. Fill background with story color
  2. Center and scale illustration to fit
  3. Apply fade opacity during transitions
  4. Render text below image with word wrapping
  5. Display emoji at top

### Audio Synchronization

Audio is synchronized with visuals using:
- `HTMLAudioElement` for playback
- Scene duration calculated from audio metadata
- Automatic progression when audio ends
- Pause/resume support with time tracking

### Scene Transitions

Smooth transitions implemented via:
- 0.5 second fade-in at scene start
- 0.5 second fade-out at scene end
- Canvas globalAlpha for opacity control
- requestAnimationFrame for smooth rendering

### Export Functionality

Video export uses the MediaRecorder API:
```typescript
const stream = canvas.captureStream(30);
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9',
  videoBitsPerSecond: 2500000,
});
```

**Browser Support**:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Partial (WebM may not work, falls back to in-app playback)

## Asset Structure

### Required Assets

For each story, the following assets must exist:

**Illustrations** (`/public/assets/kids/illustrations/`):
```
story-{storyId}-0.png
story-{storyId}-1.png
story-{storyId}-2.png
story-{storyId}-3.png (if 4 scenes)
```

**Audio Files** (`/public/assets/kids/audio/`):
```
story-{storyId}-scene-0.mp3
story-{storyId}-scene-1.mp3
story-{storyId}-scene-2.mp3
story-{storyId}-scene-3.mp3 (if 4 scenes)
```

### Story Data Format

Stories are defined in `/data/kidsStories.json`:

```typescript
{
  "id": "adam",
  "prophet": "Adam",
  "prophetArabic": "آدم",
  "title": "The First Person",
  "emoji": "🌍",
  "colorKey": "green",
  "scenes": [
    { "text": "Scene text here", "emoji": "🌍" },
    // ... more scenes
  ],
  "lesson": "Moral of the story"
}
```

## Performance Considerations

### Asset Preloading

All images and audio are preloaded before playback:
- Prevents stuttering during transitions
- Shows loading state while assets load
- Falls back to default durations if audio fails

### Memory Management

- Images loaded on-demand during drawing
- Audio ref cleaned up on unmount
- Animation frame canceled when paused/stopped
- Canvas memory reused (not recreated)

### Optimization Tips

1. **Image Optimization**: Compress PNGs to reduce load time
   ```bash
   # Using ImageOptim, TinyPNG, or similar
   ```

2. **Audio Compression**: MP3 at 128kbps is sufficient
   ```bash
   ffmpeg -i input.mp3 -b:a 128k output.mp3
   ```

3. **Lazy Loading**: Only load video player when needed
   ```typescript
   const KidsVideoPlayer = lazy(() => import('./KidsVideoPlayer'));
   ```

## Accessibility

### Features Included

- Large touch targets (minimum 44x44px)
- High contrast text (white on colored backgrounds)
- Clear visual feedback on all interactions
- Keyboard support for play/pause (spacebar)
- Screen reader friendly button labels

### Future Enhancements

- [ ] Subtitles/captions support
- [ ] Adjustable playback speed
- [ ] Volume control
- [ ] Skip forward/backward buttons
- [ ] Full screen mode

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Canvas rendering | ✅ | ✅ | ✅ | ✅ |
| Audio sync | ✅ | ✅ | ✅ | ✅ |
| Video export (WebM) | ✅ | ✅ | ⚠️ | ✅ |
| Offline playback | ✅ | ✅ | ✅ | ✅ |

⚠️ = Safari may require MP4 container instead of WebM

## Testing

### Manual Testing Checklist

- [ ] Play video from start to finish
- [ ] Pause and resume playback
- [ ] Navigate back during playback
- [ ] Export video successfully
- [ ] Progress bar updates correctly
- [ ] Scene indicators show current scene
- [ ] Audio syncs with visuals
- [ ] Transitions are smooth
- [ ] Works offline (disable network)
- [ ] Star awarded on completion

### Test Stories

All 5 default stories should be tested:
1. Adam (3 scenes)
2. Nuh (4 scenes)
3. Ibrahim (3 scenes)
4. Musa (3 scenes)
5. Yusuf (3 scenes)

## Troubleshooting

### Common Issues

**Problem**: Audio doesn't play
- Check audio file paths are correct
- Verify audio files are accessible (CORS)
- Check browser autoplay policy (require user interaction)

**Problem**: Images don't load
- Verify image paths match naming convention
- Check file extensions (PNG, not jpg)
- Ensure images are in public directory

**Problem**: Export fails
- Check browser support for MediaRecorder API
- Verify WebM codec support
- Try in Chrome/Firefox if Safari fails

**Problem**: Choppy playback
- Reduce canvas resolution (e.g., 960x540)
- Compress images to smaller file sizes
- Close other browser tabs

## Future Enhancements

### Planned Features

1. **Multiple Video Formats**
   - Support MP4 export for Safari
   - Add format selection option

2. **Advanced Editing**
   - Scene reordering
   - Custom transition effects
   - Background music selection

3. **Sharing**
   - Direct share to social media
   - Generate shareable links
   - QR code for easy sharing

4. **Customization**
   - Adjustable text size
   - Font selection
   - Custom color themes

5. **Analytics**
   - Track most watched stories
   - Measure completion rates
   - Identify popular export times

## License

Part of the Noor Soad educational app. All rights reserved.

## Credits

- **Canvas Rendering**: HTML5 Canvas API
- **Audio**: Web Audio API & HTMLAudioElement
- **Video Export**: MediaRecorder API
- **Illustrations**: Pre-generated via ComfyUI
- **Audio**: Pre-generated via TTS

## Support

For issues or questions:
1. Check this documentation
2. Review console for error messages
3. Test in Chrome/Firefox for baseline
4. Verify asset files exist and are accessible
5. Check browser compatibility table

---

**Last Updated**: January 9, 2026
**Version**: 1.0.0
**Component**: KidsVideoPlayer.tsx
