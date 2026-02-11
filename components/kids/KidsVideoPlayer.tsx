import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface KidsVideoPlayerProps {
  storyId: string;
  onBack: () => void;
  onComplete?: () => void;
}

interface Scene {
  imageUrl: string;
  audioUrl: string;
  text: string;
  emoji: string;
  duration: number; // Duration in seconds
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'completed';

const KidsVideoPlayer: React.FC<KidsVideoPlayerProps> = ({ storyId, onBack, onComplete }) => {
  const [story, setStory] = useState<typeof kidsStories[0] | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [progress, setProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sceneStartTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Load story data and prepare scenes
  useEffect(() => {
    const foundStory = kidsStories.find(s => s.id === storyId);
    if (!foundStory) {
      console.error(`Story not found: ${storyId}`);
      return;
    }

    setStory(foundStory);

    // Prepare scene data
    const preparedScenes: Scene[] = foundStory.scenes.map((scene, index) => ({
      imageUrl: `/assets/kids/illustrations/story-${storyId}-${index}.png`,
      audioUrl: `/assets/kids/audio/story-${storyId}-scene-${index}.mp3`,
      text: scene.text,
      emoji: scene.emoji,
      duration: 0, // Will be set after audio loads
    }));

    setScenes(preparedScenes);
    setPlaybackState('loading');
  }, [storyId]);

  // Preload images and calculate durations from audio
  useEffect(() => {
    if (scenes.length === 0) return;

    const loadAssets = async () => {
      try {
        // Preload all images
        const imagePromises = scenes.map(scene => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${scene.imageUrl}`));
            img.src = scene.imageUrl;
          });
        });

        // Load all audio and get durations
        const audioPromises = scenes.map((scene, index) => {
          return new Promise<number>((resolve, reject) => {
            const audio = new Audio();
            audio.onloadedmetadata = () => {
              resolve(audio.duration);
            };
            audio.onerror = () => {
              console.warn(`Failed to load audio: ${scene.audioUrl}, using default duration`);
              resolve(5); // Default 5 seconds if audio fails
            };
            audio.src = scene.audioUrl;
          });
        });

        await Promise.all(imagePromises);
        const durations = await Promise.all(audioPromises);

        // Update scenes with actual durations
        setScenes(prevScenes =>
          prevScenes.map((scene, index) => ({
            ...scene,
            duration: durations[index] || 5,
          }))
        );

        setPlaybackState('idle');
      } catch (error) {
        console.error('Error loading assets:', error);
        setPlaybackState('idle'); // Continue anyway
      }
    };

    loadAssets();
  }, [scenes.length]);

  // Draw scene on canvas
  const drawScene = useCallback((sceneIndex: number, opacity: number = 1) => {
    const canvas = canvasRef.current;
    if (!canvas || !scenes[sceneIndex]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scene = scenes[sceneIndex];
    const img = new Image();

    img.onload = () => {
      // Clear canvas
      ctx.fillStyle = story?.colorKey ? KIDS_COLORS[story.colorKey] : KIDS_COLORS.cream;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image (centered and scaled to fit)
      const scale = Math.min(
        canvas.width / img.width,
        (canvas.height * 0.7) / img.height
      );
      const x = (canvas.width - img.width * scale) / 2;
      const y = 50;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.restore();

      // Draw text below image
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textY = canvas.height - 100;
      const maxWidth = canvas.width - 80;

      // Word wrap text
      const words = scene.text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);

      // Draw lines
      const lineHeight = 40;
      const startY = textY - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, index) => {
        ctx.fillText(line.trim(), canvas.width / 2, startY + index * lineHeight);
      });

      // Draw emoji
      ctx.font = '48px system-ui';
      ctx.fillText(scene.emoji, canvas.width / 2, 30);
    };

    img.src = scene.imageUrl;
  }, [scenes, story]);

  // Animation loop for smooth transitions
  const animate = useCallback(() => {
    if (playbackState !== 'playing') return;

    const currentTime = Date.now();
    const elapsedTime = (currentTime - sceneStartTimeRef.current) / 1000;
    const scene = scenes[currentSceneIndex];

    if (!scene) return;

    // Calculate progress
    const sceneProgress = Math.min(elapsedTime / scene.duration, 1);

    // Calculate total progress
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    const completedDuration = scenes.slice(0, currentSceneIndex).reduce((sum, s) => sum + s.duration, 0);
    const totalProgress = (completedDuration + (sceneProgress * scene.duration)) / totalDuration;
    setProgress(totalProgress * 100);

    // Transition effect
    const transitionDuration = 0.5; // 0.5 seconds for fade
    let opacity = 1;

    if (elapsedTime < transitionDuration) {
      // Fade in
      opacity = elapsedTime / transitionDuration;
    } else if (elapsedTime > scene.duration - transitionDuration) {
      // Fade out
      opacity = (scene.duration - elapsedTime) / transitionDuration;
    }

    drawScene(currentSceneIndex, opacity);

    // Check if scene is complete
    if (elapsedTime >= scene.duration) {
      if (currentSceneIndex < scenes.length - 1) {
        // Move to next scene
        setCurrentSceneIndex(prev => prev + 1);
        sceneStartTimeRef.current = Date.now();
      } else {
        // Video completed
        setPlaybackState('completed');
        setProgress(100);
        onComplete?.();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [playbackState, currentSceneIndex, scenes, drawScene, onComplete]);

  // Play audio for current scene
  useEffect(() => {
    if (playbackState !== 'playing' || !scenes[currentSceneIndex]) return;

    const audio = audioRef.current;
    if (!audio) return;

    const scene = scenes[currentSceneIndex];
    audio.src = scene.audioUrl;
    audio.play().catch(err => {
      console.warn('Audio playback failed:', err);
    });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [playbackState, currentSceneIndex, scenes]);

  // Start/stop animation loop
  useEffect(() => {
    if (playbackState === 'playing') {
      if (sceneStartTimeRef.current === 0) {
        sceneStartTimeRef.current = Date.now();
      } else if (pausedTimeRef.current > 0) {
        // Adjust start time for pause duration
        const pauseDuration = Date.now() - pausedTimeRef.current;
        sceneStartTimeRef.current += pauseDuration;
        pausedTimeRef.current = 0;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (playbackState === 'paused') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      pausedTimeRef.current = Date.now();
      audioRef.current?.pause();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState, animate]);

  // Initial draw
  useEffect(() => {
    if (scenes.length > 0 && playbackState === 'idle') {
      drawScene(0);
    }
  }, [scenes, playbackState, drawScene]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (playbackState === 'idle' || playbackState === 'completed') {
      setCurrentSceneIndex(0);
      sceneStartTimeRef.current = 0;
      pausedTimeRef.current = 0;
      setProgress(0);
      setPlaybackState('playing');
    } else if (playbackState === 'playing') {
      setPlaybackState('paused');
    } else if (playbackState === 'paused') {
      setPlaybackState('playing');
    }
  };

  // Export as downloadable video (using canvas + MediaRecorder API)
  const handleExport = async () => {
    if (!canvasRef.current || isExporting) return;

    setIsExporting(true);

    try {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30); // 30 fps

      // Add audio track if supported
      if (audioRef.current && audioRef.current.captureStream) {
        const audioStream = audioRef.current.captureStream();
        audioStream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `story-${storyId}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      // Start recording
      mediaRecorder.start();

      // Play through all scenes
      setCurrentSceneIndex(0);
      sceneStartTimeRef.current = Date.now();
      setPlaybackState('playing');

      // Stop recording when complete
      const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0) * 1000;
      setTimeout(() => {
        mediaRecorder.stop();
        setPlaybackState('completed');
      }, totalDuration + 500);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. This feature may not be supported in your browser.');
      setIsExporting(false);
    }
  };

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: KIDS_COLORS.cream }}>
        <div className="text-center">
          <div className="text-4xl mb-4">📖</div>
          <p className="text-xl text-stone-600">Loading story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: KIDS_COLORS.cream }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform"
          disabled={isExporting}
          aria-label="Go back"
        >
          <i className="fas fa-arrow-left text-xl" aria-hidden="true"></i>
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-stone-700">{story.title}</h2>
          <p className="text-sm text-stone-500">{story.prophet} - {story.prophetArabic}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || playbackState === 'loading'}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-stone-600 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
          title="Download video"
          aria-label={isExporting ? "Exporting video" : "Download video"}
        >
          <i className={`fas ${isExporting ? 'fa-spinner fa-spin' : 'fa-download'} text-xl`} aria-hidden="true"></i>
        </button>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl">
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full rounded-3xl shadow-2xl"
            style={{ backgroundColor: story?.colorKey ? KIDS_COLORS[story.colorKey] : KIDS_COLORS.cream }}
          />

          {/* Loading overlay */}
          {playbackState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl">
              <div className="text-center text-white">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-lg">Loading story...</p>
              </div>
            </div>
          )}

          {/* Completed overlay */}
          {playbackState === 'completed' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">⭐</div>
                <p className="text-2xl font-bold mb-2">Story Complete!</p>
                <p className="text-lg mb-4">{story.lesson}</p>
                <button
                  onClick={handlePlayPause}
                  className="px-6 py-3 bg-white text-stone-700 rounded-full font-bold hover:scale-105 active:scale-95 transition-transform"
                >
                  Watch Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-white shadow-lg">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: story?.colorKey ? KIDS_COLORS[story.colorKey] : KIDS_COLORS.green,
                }}
              />
            </div>
            <div className="mt-2 text-sm text-stone-500 text-center">
              Scene {currentSceneIndex + 1} of {scenes.length}
            </div>
          </div>

          {/* Play/Pause Button */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePlayPause}
              disabled={playbackState === 'loading' || isExporting}
              className="w-20 h-20 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor:
                  playbackState === 'playing'
                    ? KIDS_COLORS.orange
                    : story?.colorKey
                    ? KIDS_COLORS[story.colorKey]
                    : KIDS_COLORS.green,
              }}
            >
              <i
                className={`fas ${
                  playbackState === 'playing'
                    ? 'fa-pause'
                    : playbackState === 'completed'
                    ? 'fa-redo'
                    : 'fa-play'
                } text-3xl text-white ${playbackState === 'playing' ? '' : 'pl-1'}`}
              ></i>
            </button>
          </div>

          {/* Scene Indicators */}
          <div className="mt-4 flex gap-2 justify-center">
            {scenes.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSceneIndex
                    ? 'scale-125'
                    : index < currentSceneIndex
                    ? 'opacity-50'
                    : 'opacity-30'
                }`}
                style={{
                  backgroundColor:
                    index <= currentSceneIndex
                      ? story?.colorKey
                        ? KIDS_COLORS[story.colorKey]
                        : KIDS_COLORS.green
                      : '#D1D5DB',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} />
    </div>
  );
};

export default KidsVideoPlayer;
