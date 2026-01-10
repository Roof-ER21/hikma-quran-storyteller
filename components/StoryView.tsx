import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  generateStory,
  generateStoryImage,
  speakText,
  getLocations,
  getContextWithSearch,
  quickAnalyze,
  extractScenes,
  cleanStoryText,
  StoryLanguage,
  LANGUAGE_LABELS
} from '../services/geminiService';
import {
  saveStoryReadingPosition,
  getStoryReadingPosition,
  StoryReadingPosition
} from '../services/offlineDatabase';
import { VisualConfig } from '../types';
import ImageLightbox from './ImageLightbox';

// CSS for animations - inject into document
const injectAnimationStyles = () => {
  if (document.getElementById('story-animation-styles')) return;
  const style = document.createElement('style');
  style.id = 'story-animation-styles';
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
      opacity: 0;
    }

    .stagger-1 { animation-delay: 0.1s; }
    .stagger-2 { animation-delay: 0.2s; }
    .stagger-3 { animation-delay: 0.3s; }
    .stagger-4 { animation-delay: 0.4s; }
    .stagger-5 { animation-delay: 0.5s; }

    .parallax-container {
      overflow: hidden;
      position: relative;
    }

    .parallax-image {
      position: absolute;
      width: 100%;
      height: 130%;
      top: -15%;
      left: 0;
      object-fit: cover;
      will-change: transform;
    }

    .shimmer-skeleton {
      background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .islamic-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem 0;
    }

    .islamic-divider::before,
    .islamic-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, currentColor, transparent);
    }

    .reading-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #be123c, #f59e0b);
      z-index: 100;
      transition: width 0.1s ease-out;
    }
  `;
  document.head.appendChild(style);
};

interface StoryViewProps {
  prophet: string;
  topic: string;
  onBack: () => void;
}

const AMBIENCE_OPTIONS = [
    { id: 'silence', label: 'Silence', icon: 'fa-volume-mute' },
    { id: 'wind', label: 'Desert Wind', icon: 'fa-wind' },
    { id: 'night', label: 'Night Peace', icon: 'fa-moon' },
    { id: 'rain', label: 'Rainfall', icon: 'fa-cloud-rain' },
    { id: 'ocean', label: 'Ocean Waves', icon: 'fa-water' },
    { id: 'cave', label: 'Cave Echo', icon: 'fa-mountain' },
    { id: 'market', label: 'Market Bustle', icon: 'fa-store' },
];

// Scene image state
interface SceneImage {
  prompt: string;
  image: string | null;
  loading: boolean;
}

// Audio cues - keywords that trigger subtle sound effects
const AUDIO_CUE_KEYWORDS: Record<string, string[]> = {
  water: ['flood', 'sea', 'river', 'ocean', 'water', 'waves', 'drowned', 'ark', 'ship'],
  wind: ['storm', 'wind', 'tornado', 'tempest', 'blow', 'gust'],
  chime: ['revealed', 'revelation', 'allah said', 'god said', 'divine', 'angel', 'gabriel', 'jibreel'],
  birds: ['garden', 'paradise', 'jannah', 'tree', 'birds', 'eden', 'beautiful'],
  thunder: ['destroyed', 'punishment', 'wrath', 'perished', 'doom', 'fire', 'lightning']
};

const StoryView: React.FC<StoryViewProps> = ({ prophet, topic, onBack }) => {
  const { t, i18n } = useTranslation('story');
  const isArabic = i18n.language === 'ar-EG';

  const [story, setStory] = useState<string>("");
  const [cleanedStory, setCleanedStory] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [images, setImages] = useState<string[]>([]);
  const [sceneImages, setSceneImages] = useState<SceneImage[]>([]);
  const [generatingImage, setGeneratingImage] = useState<boolean>(false);
  const [locations, setLocations] = useState<{title: string, uri: string}[]>([]);
  const [mapText, setMapText] = useState<string>("");
  const [contextSources, setContextSources] = useState<{title: string, url: string}[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'read' | 'locations' | 'context'>('read');
  const [language, setLanguage] = useState<StoryLanguage>('english');
  
  // UX State
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [ambience, setAmbience] = useState('silence');
  const [readingProgress, setReadingProgress] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [visibleParagraphs, setVisibleParagraphs] = useState<Set<number>>(new Set());
  const [savedPosition, setSavedPosition] = useState<StoryReadingPosition | null>(null);
  const [showContinueReading, setShowContinueReading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Refs for scroll tracking
  const contentRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const savePositionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredPosition = useRef(false);

  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  // Ambience Refs
  const ambienceCtxRef = useRef<AudioContext | null>(null);
  const ambienceGainRef = useRef<GainNode | null>(null);

  // Audio Cue Refs
  const audioCueCtxRef = useRef<AudioContext | null>(null);
  const playedCuesRef = useRef<Set<string>>(new Set());
  const cueTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inject animation styles on mount
  useEffect(() => {
    injectAnimationStyles();
  }, []);

  // Soft Islamic-inspired background for non-immersive mode
  const storyBackgroundStyle = immersiveMode
    ? undefined
    : {
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(190, 24, 93, 0.06) 0, rgba(190, 24, 93, 0.06) 12px, transparent 12px),
          radial-gradient(circle at 80% 0%, rgba(234, 179, 8, 0.06) 0, rgba(234, 179, 8, 0.06) 14px, transparent 18px),
          linear-gradient(180deg, #f9f7f4 0%, #fdfaf6 28%, #f6f1e9 100%)
        `,
        backgroundSize: '180px 180px, 240px 240px, cover',
        backgroundAttachment: 'fixed, fixed, fixed',
      };

  // Scroll handler for reading progress and parallax
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    const container = contentRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setReadingProgress(Math.min(100, scrollPercentage));

    // Parallax effect - move hero image slower than scroll
    setParallaxOffset(scrollTop * 0.4);

    // Track visible paragraphs for staggered animation
    const paragraphs = container.querySelectorAll('[data-paragraph]');
    const newVisible = new Set(visibleParagraphs);
    paragraphs.forEach((p, i) => {
      const rect = p.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
        newVisible.add(i);
      }
    });
    if (newVisible.size !== visibleParagraphs.size) {
      setVisibleParagraphs(newVisible);
    }

    // Debounced save of reading position (every 2 seconds)
    if (savePositionTimeoutRef.current) {
      clearTimeout(savePositionTimeoutRef.current);
    }
    savePositionTimeoutRef.current = setTimeout(() => {
      if (scrollPercentage > 1) { // Only save if scrolled past 1%
        saveStoryReadingPosition(prophet, topic, language, scrollPercentage);
      }
    }, 2000);
  }, [visibleParagraphs, prophet, topic, language]);

  // Attach scroll listener
  useEffect(() => {
    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
        // Clear any pending save timeout on unmount
        if (savePositionTimeoutRef.current) {
          clearTimeout(savePositionTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  // Load saved reading position on mount
  useEffect(() => {
    const loadSavedPosition = async () => {
      const position = await getStoryReadingPosition(prophet, topic, language);
      if (position && position.scrollPercent > 5) {
        setSavedPosition(position);
        setShowContinueReading(true);
      }
    };
    loadSavedPosition();
    hasRestoredPosition.current = false;
  }, [prophet, topic, language]);

  // Restore scroll position when story loads and user clicks continue
  const handleContinueReading = useCallback(() => {
    if (savedPosition && contentRef.current) {
      const container = contentRef.current;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const targetScroll = (savedPosition.scrollPercent / 100) * scrollHeight;
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      setShowContinueReading(false);
      hasRestoredPosition.current = true;
    }
  }, [savedPosition]);

  // Load Story with scene extraction and progressive image generation
  useEffect(() => {
    const loadStory = async () => {
      setLoading(true);
      setImages([]);
      setSceneImages([]);
      setCleanedStory("");

      try {
        const text = await generateStory(prophet, topic, language);
        const rawStory = text || "Could not generate story.";
        setStory(rawStory);

        // Extract scenes and clean the story text
        const scenes = extractScenes(rawStory);
        const cleaned = cleanStoryText(rawStory);
        setCleanedStory(cleaned);

        // Initialize scene images array
        if (scenes.length > 0) {
          const initialSceneImages: SceneImage[] = scenes.map(prompt => ({
            prompt,
            image: null,
            loading: false
          }));
          setSceneImages(initialSceneImages);

          // Generate first image immediately (hero image)
          const heroPrompt = scenes[0] || `Cinematic landscape of the era of Prophet ${prophet}, ${topic}`;
          const heroImg = await generateStoryImage(heroPrompt, { aspectRatio: "16:9", resolution: "2K" });
          if (heroImg) {
            setImages([heroImg]);
            setSceneImages(prev => prev.map((s, i) => i === 0 ? { ...s, image: heroImg, loading: false } : s));
          }

          // Generate remaining images progressively in background
          generateRemainingSceneImages(scenes.slice(1), 1);
        } else {
          // Fallback: Generate a single hero image if no scenes
          const prompt = `Cinematic landscape of the era of Prophet ${prophet}, ${topic}, wide shot, atmospheric`;
          const img = await generateStoryImage(prompt, { aspectRatio: "16:9", resolution: "2K" });
          if (img) setImages([img]);
        }

      } catch (e) {
        console.error(e);
        setStory("Error loading story. Please try again.");
        setCleanedStory("Error loading story. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadStory();

    return () => {
      stopAudio();
      stopAmbience();
    };
  }, [prophet, topic, language]);

  // Progressive image generation for remaining scenes
  const generateRemainingSceneImages = async (scenes: string[], startIndex: number) => {
    for (let i = 0; i < scenes.length; i++) {
      const index = startIndex + i;
      const prompt = scenes[i];

      // Mark as loading
      setSceneImages(prev => prev.map((s, idx) => idx === index ? { ...s, loading: true } : s));

      try {
        const img = await generateStoryImage(prompt, { aspectRatio: "16:9", resolution: "1K" });
        if (img) {
          setSceneImages(prev => prev.map((s, idx) => idx === index ? { ...s, image: img, loading: false } : s));
          setImages(prev => [...prev, img]);
        } else {
          setSceneImages(prev => prev.map((s, idx) => idx === index ? { ...s, loading: false } : s));
        }
      } catch (e) {
        console.error(`Failed to generate scene image ${index}:`, e);
        setSceneImages(prev => prev.map((s, idx) => idx === index ? { ...s, loading: false } : s));
      }

      // Small delay between generations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Handle Ambience Changes
  useEffect(() => {
      if (ambience === 'silence') {
          stopAmbience();
      } else {
          playAmbience(ambience);
      }
      return () => stopAmbience();
  }, [ambience]);

  // Procedural Ambience Generator - Enhanced with more options
  let lastOut = 0;
  const playAmbience = (type: string) => {
      stopAmbience(); // Stop current first

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ambienceCtxRef.current = ctx;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.15; // Low volume background
      masterGain.connect(ctx.destination);
      ambienceGainRef.current = masterGain;

      if (type === 'wind') {
          // Pink Noise buffer for desert wind
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let localLastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
              let white = Math.random() * 2 - 1;
              output[i] = (localLastOut + (0.02 * white)) / 1.02;
              localLastOut = output[i];
              output[i] *= 3.5;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 400;

          noise.connect(filter);
          filter.connect(masterGain);
          noise.start();
      } else if (type === 'night') {
          // Low Drone + Crickets
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = 60;
          osc.connect(masterGain);
          osc.start();

          const osc2 = ctx.createOscillator();
          osc2.type = 'triangle';
          osc2.frequency.value = 4000;
          const gain2 = ctx.createGain();
          gain2.gain.value = 0.05;
          osc2.connect(gain2);
          gain2.connect(masterGain);
          osc2.start();
      } else if (type === 'rain') {
          // Rain: Brown noise (deeper) with occasional droplet sounds
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let localLastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
              let white = Math.random() * 2 - 1;
              output[i] = (localLastOut + (0.01 * white)) / 1.01; // Slower = brown noise
              localLastOut = output[i];
              output[i] *= 5;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          // Bandpass filter for rain-like sound
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 800;
          filter.Q.value = 0.5;

          noise.connect(filter);
          filter.connect(masterGain);
          noise.start();

          // Add subtle thunder-like rumble
          const thunder = ctx.createOscillator();
          thunder.type = 'sine';
          thunder.frequency.value = 40;
          const thunderGain = ctx.createGain();
          thunderGain.gain.value = 0.03;
          thunder.connect(thunderGain);
          thunderGain.connect(masterGain);
          thunder.start();
      } else if (type === 'ocean') {
          // Ocean: Layered noise with slow modulation for waves
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let localLastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
              let white = Math.random() * 2 - 1;
              output[i] = (localLastOut + (0.02 * white)) / 1.02;
              localLastOut = output[i];
              output[i] *= 4;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          // Lowpass for deep ocean sound
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 600;

          // LFO for wave rhythm
          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.1; // Very slow oscillation (10 second waves)
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 0.08;
          lfo.connect(lfoGain);
          lfoGain.connect(masterGain.gain);
          lfo.start();

          noise.connect(filter);
          filter.connect(masterGain);
          noise.start();
      } else if (type === 'cave') {
          // Cave Echo: Reverberant low drone with subtle water drips
          // Create a deep resonant drone
          const drone = ctx.createOscillator();
          drone.type = 'sine';
          drone.frequency.value = 50; // Deep bass drone
          const droneGain = ctx.createGain();
          droneGain.gain.value = 0.3;
          drone.connect(droneGain);
          droneGain.connect(masterGain);
          drone.start();

          // Add harmonics for richness
          const harmonic = ctx.createOscillator();
          harmonic.type = 'sine';
          harmonic.frequency.value = 75;
          const harmonicGain = ctx.createGain();
          harmonicGain.gain.value = 0.1;
          harmonic.connect(harmonicGain);
          harmonicGain.connect(masterGain);
          harmonic.start();

          // Create convolver for reverb effect (simulate cave acoustics)
          const convolver = ctx.createConvolver();
          const reverbLength = 3 * ctx.sampleRate; // 3 second reverb
          const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
          for (let channel = 0; channel < 2; channel++) {
            const data = reverbBuffer.getChannelData(channel);
            for (let i = 0; i < reverbLength; i++) {
              // Exponential decay with slight randomness
              data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2);
            }
          }
          convolver.buffer = reverbBuffer;

          // Water drip simulation - random high frequency pings
          const dripOsc = ctx.createOscillator();
          dripOsc.type = 'sine';
          dripOsc.frequency.value = 1200;
          const dripGain = ctx.createGain();
          dripGain.gain.value = 0;
          dripOsc.connect(dripGain);
          dripGain.connect(convolver);
          convolver.connect(masterGain);
          dripOsc.start();

          // Random drip trigger
          const triggerDrip = () => {
            dripGain.gain.setValueAtTime(0.15, ctx.currentTime);
            dripGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            dripOsc.frequency.setValueAtTime(800 + Math.random() * 800, ctx.currentTime);
            // Schedule next drip randomly between 2-6 seconds
            setTimeout(triggerDrip, 2000 + Math.random() * 4000);
          };
          setTimeout(triggerDrip, 1000);

      } else if (type === 'market') {
          // Market Bustle: Subtle crowd murmur with occasional sounds
          // Base crowd noise (filtered pink noise)
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let localLastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            output[i] = (localLastOut + (0.02 * white)) / 1.02;
            localLastOut = output[i];
            output[i] *= 3;
          }
          const crowdNoise = ctx.createBufferSource();
          crowdNoise.buffer = noiseBuffer;
          crowdNoise.loop = true;

          // Bandpass filter to simulate human voice frequencies
          const voiceFilter = ctx.createBiquadFilter();
          voiceFilter.type = 'bandpass';
          voiceFilter.frequency.value = 400; // Human voice range
          voiceFilter.Q.value = 0.8;

          crowdNoise.connect(voiceFilter);
          voiceFilter.connect(masterGain);
          crowdNoise.start();

          // Add subtle modulation to simulate crowd dynamics
          const modulator = ctx.createOscillator();
          modulator.type = 'sine';
          modulator.frequency.value = 0.3; // Slow modulation
          const modGain = ctx.createGain();
          modGain.gain.value = 0.05;
          modulator.connect(modGain);
          modGain.connect(masterGain.gain);
          modulator.start();

          // Higher frequency chatter layer
          const chatterNoise = ctx.createBufferSource();
          const chatterBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const chatterData = chatterBuffer.getChannelData(0);
          let chatterLast = 0;
          for (let i = 0; i < bufferSize; i++) {
            let white = Math.random() * 2 - 1;
            chatterData[i] = (chatterLast + (0.03 * white)) / 1.03;
            chatterLast = chatterData[i];
            chatterData[i] *= 2;
          }
          chatterNoise.buffer = chatterBuffer;
          chatterNoise.loop = true;

          const chatterFilter = ctx.createBiquadFilter();
          chatterFilter.type = 'bandpass';
          chatterFilter.frequency.value = 800;
          chatterFilter.Q.value = 1.5;

          const chatterGain = ctx.createGain();
          chatterGain.gain.value = 0.3;
          chatterNoise.connect(chatterFilter);
          chatterFilter.connect(chatterGain);
          chatterGain.connect(masterGain);
          chatterNoise.start();
      }
  };

  const stopAmbience = () => {
      if (ambienceCtxRef.current) {
          ambienceCtxRef.current.close();
          ambienceCtxRef.current = null;
      }
  };

  // Audio Cue System - detect keywords and play subtle sounds
  const detectAndPlayAudioCues = useCallback((text: string) => {
    if (!text) return;

    const lowerText = text.toLowerCase();
    const detectedCues: string[] = [];

    // Check each cue type for keyword matches
    for (const [cueType, keywords] of Object.entries(AUDIO_CUE_KEYWORDS)) {
      if (playedCuesRef.current.has(cueType)) continue; // Skip already played

      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          detectedCues.push(cueType);
          playedCuesRef.current.add(cueType);
          break; // Only trigger once per cue type
        }
      }
    }

    // Play detected cues with delay between them
    detectedCues.forEach((cue, index) => {
      setTimeout(() => playAudioCue(cue), index * 3000 + 2000); // 2s initial delay, 3s between
    });
  }, []);

  const playAudioCue = (cueType: string) => {
    // Don't play if ambience is silence (user wants quiet)
    if (ambience === 'silence') return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCueCtxRef.current = ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.12; // Very subtle
    masterGain.connect(ctx.destination);

    switch (cueType) {
      case 'water': {
        // Gentle water/wave sound
        const bufferSize = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= Math.sin(i / bufferSize * Math.PI) * 4; // Fade envelope
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        source.connect(filter);
        filter.connect(masterGain);
        source.start();
        break;
      }
      case 'wind': {
        // Wind gust
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          // Gust shape: quick rise, slow fall
          const envelope = i < bufferSize * 0.2
            ? i / (bufferSize * 0.2)
            : Math.pow(1 - (i - bufferSize * 0.2) / (bufferSize * 0.8), 0.5);
          data[i] *= envelope * 5;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        source.connect(filter);
        filter.connect(masterGain);
        source.start();
        break;
      }
      case 'chime': {
        // Divine revelation chime
        const frequencies = [523, 659, 784, 1046]; // C5, E5, G5, C6 (major chord)
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const oscGain = ctx.createGain();
          oscGain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
          oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 2);
          osc.connect(oscGain);
          oscGain.connect(masterGain);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 2);
        });
        break;
      }
      case 'birds': {
        // Simple bird chirp simulation
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          const startFreq = 2000 + Math.random() * 1000;
          osc.frequency.setValueAtTime(startFreq, ctx.currentTime + i * 0.3);
          osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, ctx.currentTime + i * 0.3 + 0.05);
          osc.frequency.exponentialRampToValueAtTime(startFreq * 0.8, ctx.currentTime + i * 0.3 + 0.15);
          const birdGain = ctx.createGain();
          birdGain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
          birdGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.3 + 0.02);
          birdGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.2);
          osc.connect(birdGain);
          birdGain.connect(masterGain);
          osc.start(ctx.currentTime + i * 0.3);
          osc.stop(ctx.currentTime + i * 0.3 + 0.25);
        }
        break;
      }
      case 'thunder': {
        // Distant thunder rumble
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.01 * white) / 1.01; // Brown noise
          lastOut = data[i];
          // Thunder envelope: quick attack, long decay with rumbles
          const baseEnv = Math.exp(-i / (bufferSize * 0.4));
          const rumble = 1 + 0.3 * Math.sin(i / ctx.sampleRate * 8);
          data[i] *= baseEnv * rumble * 6;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        source.connect(filter);
        filter.connect(masterGain);
        source.start();
        break;
      }
    }

    // Clean up after a few seconds
    setTimeout(() => {
      if (audioCueCtxRef.current) {
        audioCueCtxRef.current.close();
        audioCueCtxRef.current = null;
      }
    }, 5000);
  };

  // Reset played cues when story changes
  useEffect(() => {
    playedCuesRef.current.clear();
  }, [prophet, topic, language]);

  // Detect audio cues when story loads
  useEffect(() => {
    if (cleanedStory && cleanedStory.length > 100) {
      // Delay audio cue detection to let story settle
      cueTimeoutRef.current = setTimeout(() => {
        detectAndPlayAudioCues(cleanedStory);
      }, 4000);
    }
    return () => {
      if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
    };
  }, [cleanedStory, detectAndPlayAudioCues]);

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    const config: VisualConfig = { aspectRatio: "16:9", resolution: "2K" }; 
    try {
        const prompt = `A specific scene from the story of Prophet ${prophet}: ${story.slice(0, 100)}`; 
        const img = await generateStoryImage(prompt, config);
        if (img) setImages(prev => [img, ...prev]);
    } catch (e) {
        console.error("Image generation failed", e);
        alert("Failed to generate image.");
    } finally {
        setGeneratingImage(false);
    }
  };

  const handleLoadLocations = async () => {
    if (mapText) return; 
    try {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const res = await getLocations(story, pos.coords.latitude, pos.coords.longitude);
            setLocations(res.locations);
            setMapText(res.text || "");
        }, async () => {
            const res = await getLocations(story);
            setLocations(res.locations);
            setMapText(res.text || "");
        });
    } catch (e) {
        console.error(e);
    }
  };

  const handleLoadContext = async () => {
    if (contextSources.length > 0) return;
    try {
        const res = await getContextWithSearch(`Historical context of Prophet ${prophet} and ${topic}`);
        setContextSources(res.sources);
    } catch (e) { console.error(e) }
  };

  const playAudio = async () => {
    if (isPlaying) {
        stopAudio();
        return;
    }
    
    setIsPlaying(true);
    try {
        const buffer = await speakText(story);
        if (buffer) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtxRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtxRef.current.destination);
            
            source.onended = () => {
                setIsPlaying(false);
                setProgress(0);
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            };

            durationRef.current = buffer.duration;
            startTimeRef.current = audioCtxRef.current.currentTime;
            
            source.start();
            sourceNodeRef.current = source;

            // Start Animation Loop for Progress
            const updateProgress = () => {
                if (audioCtxRef.current && isPlaying) { // Check state implicitly or use ref
                     const elapsed = audioCtxRef.current.currentTime - startTimeRef.current;
                     const p = Math.min(100, (elapsed / durationRef.current) * 100);
                     setProgress(p);
                     animationFrameRef.current = requestAnimationFrame(updateProgress);
                }
            };
            // Need to set playing true first so the loop runs
            requestAnimationFrame(updateProgress);
        }
    } catch (e) {
        console.error("TTS Failed", e);
        setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
    }
    if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsPlaying(false);
    setProgress(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-rose-800 bg-gradient-to-br from-stone-50 to-rose-50" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="relative mb-8">
          {/* Decorative rings */}
          <div className="absolute inset-0 rounded-full border-2 border-rose-200 animate-ping opacity-30"></div>
          <div className="absolute inset-2 rounded-full border border-rose-300 animate-pulse"></div>
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-900"></div>
            <i className="fas fa-book-open absolute text-rose-700 text-xl"></i>
          </div>
        </div>
        <p className={`text-2xl font-serif animate-pulse ${isArabic ? 'font-arabic' : ''}`}>{t('loading.consulting')}</p>
        <p className={`text-sm text-stone-500 mt-2 animate-fade-in-up ${isArabic ? 'font-arabic' : ''}`}>{t('loading.weaving', { prophet })}</p>

        {/* Skeleton preview */}
        <div className="mt-8 w-full max-w-md px-8 space-y-3 opacity-30">
          <div className="h-4 shimmer-skeleton rounded w-3/4 mx-auto"></div>
          <div className="h-4 shimmer-skeleton rounded w-full"></div>
          <div className="h-4 shimmer-skeleton rounded w-5/6"></div>
          <div className="h-4 shimmer-skeleton rounded w-4/6 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-stone-50 transition-all duration-700 ${immersiveMode ? 'fixed inset-0 z-50' : 'rounded-lg shadow-xl overflow-hidden'}`}>
      
      {/* Immersive Header / Controls */}
      <div className={`${immersiveMode ? 'bg-black/80 text-white backdrop-blur-md fixed top-0 w-full z-50' : 'bg-white text-stone-800 border-b border-stone-200'} p-4 flex items-center justify-between transition-all duration-300`}>
        <div className="flex items-center gap-4">
            <button onClick={immersiveMode ? () => setImmersiveMode(false) : onBack} className={`p-2 rounded-full transition-colors ${immersiveMode ? 'hover:bg-white/10' : 'hover:bg-stone-100'}`}>
               <i className={`fas ${immersiveMode ? 'fa-compress' : 'fa-arrow-left'}`}></i>
            </button>
            <div>
                <h2 className="text-xl font-serif font-bold">{prophet}</h2>
                {!immersiveMode && <p className="text-xs text-stone-500 uppercase tracking-widest">{topic}</p>}
            </div>
        </div>
        
        <div className="flex gap-2 items-center">
            {/* Language Toggle - 3 Languages */}
            {!immersiveMode && (
                <div className="flex bg-stone-100 rounded-lg p-1 mr-2">
                    <button
                        onClick={() => setLanguage('english')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${language === 'english' ? 'bg-white shadow text-rose-900 font-medium' : 'text-stone-400 hover:text-stone-600'}`}
                        title="English"
                    >{LANGUAGE_LABELS.english}</button>
                    <button
                        onClick={() => setLanguage('arabic')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${language === 'arabic' ? 'bg-white shadow text-rose-900 font-medium' : 'text-stone-400 hover:text-stone-600'}`}
                        title="Arabic (Fusha)"
                    >{LANGUAGE_LABELS.arabic}</button>
                    <button
                        onClick={() => setLanguage('arabic_egyptian')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${language === 'arabic_egyptian' ? 'bg-white shadow text-rose-900 font-medium' : 'text-stone-400 hover:text-stone-600'}`}
                        title="Egyptian Arabic (مصري)"
                    >{LANGUAGE_LABELS.arabic_egyptian}</button>
                </div>
            )}

           {/* Ambience Control */}
           <div className={`flex items-center rounded-full px-2 py-1 ${immersiveMode ? 'bg-white/10' : 'bg-stone-100'}`}>
                {AMBIENCE_OPTIONS.map(opt => (
                    <button 
                        key={opt.id}
                        onClick={() => setAmbience(opt.id)}
                        title={opt.label}
                        className={`w-8 h-8 rounded-full text-xs flex items-center justify-center transition-all ${ambience === opt.id ? 'bg-rose-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        <i className={`fas ${opt.icon}`}></i>
                    </button>
                ))}
           </div>

           <button 
             onClick={() => setImmersiveMode(!immersiveMode)} 
             className={`p-2 rounded-full transition-colors ${immersiveMode ? 'hover:bg-white/10 text-rose-400' : 'hover:bg-stone-100 text-stone-400'}`}
             title="Cinematic Mode"
           >
             <i className="fas fa-expand"></i>
           </button>

           <div className="relative">
               <button 
                 onClick={playAudio} 
                 className={`p-3 rounded-full transition-all shadow-md relative z-10 ${isPlaying ? 'bg-amber-600 text-white ring-4 ring-amber-200' : 'bg-rose-900 text-white hover:bg-rose-800'}`}
               >
                 <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>
               </button>
               {isPlaying && (
                 <svg className="absolute top-0 left-0 w-full h-full -m-1 pointer-events-none w-[calc(100%+8px)] h-[calc(100%+8px)]" viewBox="0 0 36 36">
                    <path
                        className="text-amber-200"
                        strokeDasharray="100, 100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <path
                        className="text-amber-600 transition-all duration-300 ease-linear"
                        strokeDasharray={`${progress}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                 </svg>
               )}
           </div>
        </div>
      </div>
      
      {/* Mini Progress Bar for Immersive Mode */}
      {immersiveMode && isPlaying && (
         <div className="fixed top-[72px] left-0 w-full h-1 bg-white/20 z-50">
             <div className="h-full bg-amber-500 transition-all duration-300 ease-linear" style={{width: `${progress}%`}}></div>
         </div>
      )}

      {/* Reading Progress Bar */}
      {activeTab === 'read' && !loading && (
        <div
          className="reading-progress-bar"
          style={{ width: `${readingProgress}%` }}
        />
      )}

      {/* Hero Image with Parallax Effect */}
      {!immersiveMode && images.length > 0 && (
          <div
            className="h-72 w-full parallax-container group cursor-pointer"
            onClick={() => {
              setLightboxIndex(0);
              setLightboxOpen(true);
            }}
          >
              <img
                ref={heroImageRef}
                src={images[0]}
                className="parallax-image transition-transform duration-100"
                style={{ transform: `translateY(${parallaxOffset}px)` }}
                alt="Hero"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-transparent to-transparent"></div>
              {/* Expand icon on hover */}
              <div className="absolute top-4 right-4 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fas fa-expand text-white"></i>
              </div>
              {/* Decorative overlay pattern */}
              <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none opacity-30">
                <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,20 Q25,0 50,20 T100,20 V20 H0 Z" fill="currentColor" className="text-stone-50"/>
                </svg>
              </div>
          </div>
      )}

      {/* Tabs (Hidden in Immersive) */}
      {!immersiveMode && (
          <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
            {/* Existing Tab Logic */}
            <button
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'read' ? 'border-rose-800 text-rose-900' : 'border-transparent text-stone-500 hover:text-rose-700'} ${isArabic ? 'font-arabic' : ''}`}
                onClick={() => setActiveTab('read')}
            >
                {t('tabs.story')}
            </button>
            <button
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'locations' ? 'border-rose-800 text-rose-900' : 'border-transparent text-stone-500 hover:text-rose-700'} ${isArabic ? 'font-arabic' : ''}`}
                onClick={() => { setActiveTab('locations'); handleLoadLocations(); }}
            >
                {t('tabs.locations')}
            </button>
            <button
                className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'context' ? 'border-rose-800 text-rose-900' : 'border-transparent text-stone-500 hover:text-rose-700'} ${isArabic ? 'font-arabic' : ''}`}
                onClick={() => { setActiveTab('context'); handleLoadContext(); }}
            >
                {t('tabs.deepDive')}
            </button>
          </div>
      )}

      {/* Continue Reading Floating Button */}
      {showContinueReading && savedPosition && !loading && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in-up">
          <button
            onClick={handleContinueReading}
            className={`bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3 transition-all hover:scale-105 ${isArabic ? 'flex-row-reverse' : ''}`}
          >
            <i className="fas fa-bookmark"></i>
            <span className={`font-medium ${isArabic ? 'font-arabic' : ''}`}>{t('view.continueReading')}</span>
            <span className="text-rose-200 text-sm">({Math.round(savedPosition.scrollPercent)}%)</span>
          </button>
          <button
            onClick={() => setShowContinueReading(false)}
            className={`absolute -top-2 w-6 h-6 bg-stone-600 hover:bg-stone-700 text-white rounded-full text-xs flex items-center justify-center ${isArabic ? '-left-2' : '-right-2'}`}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={`flex-1 overflow-y-auto ${immersiveMode ? 'bg-stone-900 p-8 md:p-20 pt-24' : 'p-6 md:p-10'} scroll-smooth`}
        style={storyBackgroundStyle}
      >
        {activeTab === 'read' && (
            <div className={`mx-auto transition-all duration-500 ${immersiveMode ? 'max-w-2xl text-stone-300' : 'max-w-3xl text-stone-800'}`}>

                {immersiveMode && images.length > 0 && (
                     <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl border border-stone-800 animate-fade-in-up">
                        <img src={images[0]} className="w-full object-cover opacity-80" alt="Cinematic Scene" />
                     </div>
                )}

                {/* Summary Card with animation */}
                {!immersiveMode && summary && (
                    <div className="mb-8 p-6 bg-amber-50 rounded-xl border-l-4 border-amber-400 italic text-amber-900 shadow-sm animate-fade-in-up">
                        "{summary}"
                    </div>
                )}

                {/* Reading Stats */}
                {!immersiveMode && cleanedStory && (
                    <div className={`flex items-center gap-4 mb-6 text-xs text-stone-400 uppercase tracking-wider animate-fade-in-up stagger-1 ${isArabic ? 'flex-row-reverse font-arabic' : ''}`}>
                      <span className={isArabic ? 'flex items-center flex-row-reverse gap-1' : ''}><i className={`fas fa-clock ${isArabic ? '' : 'mr-1'}`}></i>{t('view.readTime', { time: Math.ceil((cleanedStory || story).split(' ').length / 200) })}</span>
                      <span className={isArabic ? 'flex items-center flex-row-reverse gap-1' : ''}><i className={`fas fa-align-left ${isArabic ? '' : 'mr-1'}`}></i>{t('view.paragraphs', { count: (cleanedStory || story).split('\n').filter(l => l.trim()).length })}</span>
                      {sceneImages.length > 0 && <span className={isArabic ? 'flex items-center flex-row-reverse gap-1' : ''}><i className={`fas fa-images ${isArabic ? '' : 'mr-1'}`}></i>{t('view.scenes', { count: sceneImages.length })}</span>}
                    </div>
                )}

                {/* Story text with RTL support for Arabic and animated paragraphs */}
                <div
                  className={`prose prose-lg ${immersiveMode ? 'prose-invert prose-p:leading-loose prose-headings:text-rose-400' : 'prose-stone prose-headings:font-serif prose-headings:text-rose-900'} max-w-none ${(language === 'arabic' || language === 'arabic_egyptian') ? 'text-right font-arabic' : ''}`}
                  dir={(language === 'arabic' || language === 'arabic_egyptian') ? 'rtl' : 'ltr'}
                >
                    {(cleanedStory || story).split('\n').map((line, i) => {
                        // Skip scene markers if any remain
                        if (line.includes('[SCENE:')) return null;

                        // Detect Headers for styling with animation
                        if (line.startsWith('#')) {
                            return (
                              <div key={i} className="islamic-divider text-rose-300/50 my-8">
                                <h3
                                  data-paragraph={i}
                                  className={`mt-0 mb-0 font-serif text-2xl font-bold px-4 animate-fade-in-up stagger-${Math.min(5, (i % 5) + 1)}`}
                                >
                                  {line.replace(/#/g, '').trim()}
                                </h3>
                              </div>
                            );
                        }
                        if (line.trim().length === 0) return <br key={i}/>;

                        // Check if this is a Quranic verse citation (typically in parentheses with numbers)
                        const isVerseCitation = /^\s*[\(\[].*\d+:\d+.*[\)\]]/.test(line) || line.includes('Surah');

                        return (
                          <p
                            key={i}
                            data-paragraph={i}
                            className={`mb-4 text-lg leading-relaxed animate-fade-in-up stagger-${Math.min(5, (i % 5) + 1)} ${
                              isVerseCitation
                                ? 'text-center italic text-rose-700/80 bg-rose-50/50 py-2 px-4 rounded-lg border-l-2 border-rose-300'
                                : ''
                            }`}
                          >
                            {line}
                          </p>
                        );
                    })}
                </div>

                {/* Scene Images Gallery with enhanced animations */}
                {sceneImages.length > 1 && !immersiveMode && (
                    <div className="mt-12 space-y-6 animate-fade-in-up">
                        <div className="islamic-divider text-rose-300/50">
                          <h4 className={`text-lg font-serif text-rose-900 px-4 ${isArabic ? 'font-arabic' : ''}`}>{t('images.storyScenes')}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {sceneImages.slice(1).map((scene, i) => (
                                <div
                                  key={i}
                                  onClick={() => {
                                    if (scene.image) {
                                      setLightboxIndex(i + 1); // +1 because we slice from 1
                                      setLightboxOpen(true);
                                    }
                                  }}
                                  className={`relative rounded-xl overflow-hidden shadow-lg aspect-video bg-stone-200 group cursor-pointer hover:shadow-xl transition-all duration-300 animate-fade-in-up stagger-${Math.min(5, (i % 5) + 1)}`}
                                >
                                    {scene.loading ? (
                                        <div className="absolute inset-0 shimmer-skeleton">
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-600"></div>
                                          </div>
                                        </div>
                                    ) : scene.image ? (
                                        <>
                                          <img
                                            src={scene.image}
                                            alt={t('images.scene', { number: i + 2 })}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className={`absolute bottom-2 left-2 right-2 text-white text-xs truncate flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                              <span className={isArabic ? 'font-arabic' : ''}>{t('images.scene', { number: i + 2 })}</span>
                                              <i className="fas fa-expand text-white/80"></i>
                                            </div>
                                          </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-stone-400 bg-stone-100">
                                            <i className="fas fa-image text-3xl opacity-50"></i>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!immersiveMode && (
                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={handleGenerateImage}
                            disabled={generatingImage}
                            className={`bg-rose-100 hover:bg-rose-200 text-rose-900 px-6 py-3 rounded-full flex items-center gap-2 transition-all disabled:opacity-50 font-medium ${isArabic ? 'flex-row-reverse font-arabic' : ''}`}
                        >
                            <i className={`fas ${generatingImage ? 'fa-spinner fa-spin' : 'fa-paint-brush'}`}></i>
                            {generatingImage ? t('images.generating') : t('images.generate')}
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* Other Tabs (Standard Implementation) */}
        {activeTab === 'locations' && !immersiveMode && (
            <div className="max-w-2xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
                {!mapText && <div className="text-center text-gray-500 py-10"><i className="fas fa-compass fa-spin text-2xl mb-2"></i><p className={isArabic ? 'font-arabic' : ''}>{t('locations.locating')}</p></div>}

                {mapText && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className={`text-lg font-bold text-rose-900 mb-2 ${isArabic ? 'font-arabic' : ''}`}>{t('locations.geoContext')}</h3>
                        <p className="text-gray-700">{mapText}</p>
                    </div>
                )}

                {locations.length > 0 && (
                    <div className="grid gap-3">
                        {locations.map((loc, i) => (
                             <a key={i} href={loc.uri} target="_blank" rel="noopener noreferrer" className={`block bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-rose-300 transition-colors flex items-center justify-between group ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <span className="font-medium text-rose-800">{loc.title}</span>
                                <i className="fas fa-external-link-alt text-gray-400 group-hover:text-rose-500"></i>
                             </a>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'context' && !immersiveMode && (
            <div className="max-w-2xl mx-auto space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
                 {!contextSources.length && <div className="text-center text-gray-500 py-10"><i className="fas fa-search fa-spin text-2xl mb-2"></i><p className={isArabic ? 'font-arabic' : ''}>{t('context.searching')}</p></div>}

                 {contextSources.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className={`text-lg font-bold text-rose-900 mb-4 ${isArabic ? 'font-arabic' : ''}`}>{t('context.sources')}</h3>
                        <ul className="space-y-3">
                            {contextSources.map((source, i) => (
                                <li key={i}>
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" className={`text-rose-700 hover:underline flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <i className="fas fa-link mt-1 text-xs"></i>
                                        <span>{source.title}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}
            </div>
        )}
      </div>
      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default StoryView;
