/**
 * Kids Asset Loader Service
 *
 * Loads pre-downloaded narration texts and manages asset retrieval.
 * Falls back to Web Speech API when Gemini TTS is unavailable.
 */

const ASSETS_BASE = '/assets/kids';
const NARRATIONS_PATH = `${ASSETS_BASE}/narrations`;

// Cache for loaded assets
const textCache = new Map<string, string>();

/**
 * Load a pre-saved narration text file
 */
export async function loadNarrationText(filename: string): Promise<string | null> {
  // Check cache first
  if (textCache.has(filename)) {
    return textCache.get(filename)!;
  }

  try {
    const response = await fetch(`${NARRATIONS_PATH}/${filename}`);
    if (!response.ok) {
      console.warn(`Failed to load narration: ${filename}`);
      return null;
    }
    const text = await response.text();
    textCache.set(filename, text);
    return text;
  } catch (error) {
    console.error(`Error loading narration ${filename}:`, error);
    return null;
  }
}

/**
 * Load story narration by story ID and scene index
 */
export async function loadStoryScene(storyId: string, sceneIndex: number): Promise<string | null> {
  return loadNarrationText(`story-${storyId}-scene-${sceneIndex}.txt`);
}

/**
 * Load story lesson by story ID
 */
export async function loadStoryLesson(storyId: string): Promise<string | null> {
  return loadNarrationText(`story-${storyId}-lesson.txt`);
}

/**
 * Load a random celebration phrase
 */
export async function loadCelebration(): Promise<string> {
  const index = Math.floor(Math.random() * 6);
  const text = await loadNarrationText(`celebration-${index}.txt`);
  return text || 'MashaAllah! Great job!';
}

/**
 * Load a random encouragement phrase
 */
export async function loadEncouragement(): Promise<string> {
  const index = Math.floor(Math.random() * 4);
  const text = await loadNarrationText(`encouragement-${index}.txt`);
  return text || 'Try again! You can do it!';
}

/**
 * Speak text using Web Speech API (fallback for when Gemini TTS is unavailable)
 */
export function speakWithWebSpeech(text: string, langOrRate: string | number = 0.9): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API not supported');
      reject(new Error('Web Speech API not supported'));
      return;
    }

    // Parse parameters - can be language string or rate number
    let rate = 0.9;
    let lang = 'en-US';

    if (typeof langOrRate === 'string') {
      lang = langOrRate;
    } else if (typeof langOrRate === 'number' && isFinite(langOrRate)) {
      rate = langOrRate;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.1; // Slightly higher for kids-friendly tone
    utterance.volume = 1.0;
    utterance.lang = lang;

    // Try to find a matching voice for the language
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.split('-')[0];
    const preferredVoices = voices.filter(v => v.lang.startsWith(langPrefix));
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }

    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(event.error);

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Load and speak a story scene
 */
export async function loadAndSpeakScene(
  storyId: string,
  sceneIndex: number,
  useGemini: boolean = false
): Promise<void> {
  const text = await loadStoryScene(storyId, sceneIndex);
  if (!text) {
    console.error(`Scene not found: ${storyId} - ${sceneIndex}`);
    return;
  }

  if (useGemini) {
    try {
      const { speakText } = await import('./geminiService');
      await speakText(text);
    } catch (error) {
      console.warn('Gemini TTS failed, falling back to Web Speech:', error);
      await speakWithWebSpeech(text);
    }
  } else {
    await speakWithWebSpeech(text);
  }
}

/**
 * Load asset manifest
 */
export async function loadManifest(): Promise<any | null> {
  try {
    const response = await fetch(`${ASSETS_BASE}/manifest.json`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to load manifest:', error);
    return null;
  }
}

/**
 * Check if assets are pre-loaded
 */
export async function checkAssetsAvailable(): Promise<{
  narrations: boolean;
  illustrations: boolean;
}> {
  const manifest = await loadManifest();
  return {
    narrations: manifest?.narrations?.stories !== undefined,
    illustrations: manifest?.illustrations?.status !== 'pending_api_key',
  };
}

/**
 * Preload all narration texts into cache (for offline use)
 */
export async function preloadAllNarrations(): Promise<number> {
  const manifest = await loadManifest();
  if (!manifest) return 0;

  let loaded = 0;

  // Load story narrations
  const stories = manifest.narrations?.stories || {};
  for (const [storyId, story] of Object.entries(stories) as [string, any][]) {
    for (const scene of story.scenes || []) {
      if (await loadNarrationText(scene)) loaded++;
    }
    if (story.lesson && await loadNarrationText(story.lesson)) loaded++;
  }

  // Load celebrations
  for (const file of manifest.narrations?.celebrations || []) {
    if (await loadNarrationText(file)) loaded++;
  }

  // Load encouragements
  for (const file of manifest.narrations?.encouragements || []) {
    if (await loadNarrationText(file)) loaded++;
  }

  console.log(`Preloaded ${loaded} narration texts`);
  return loaded;
}
