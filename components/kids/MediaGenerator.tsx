/**
 * Media Generator Component
 * Pre-generates all kids content using Gemini API (TTS + Image Generation)
 *
 * Inspired by top Islamic kids apps:
 * - Hakma: Vibrant illustrations with moral lessons
 * - Muslim Kids TV: Engaging audio narration
 * - My Quran Journey: Interactive, multi-sensory learning
 *
 * Access via: ?admin=media
 */

import React, { useState, useCallback } from 'react';
import {
  preGenerateAllNarrations,
  BatchProgress,
  STORY_NARRATIONS,
  LETTER_PRONUNCIATIONS,
  CELEBRATION_PHRASES,
  ENCOURAGEMENT_PHRASES,
} from '../../services/narrationService';
import {
  STORY_ILLUSTRATION_PROMPTS,
  LETTER_ILLUSTRATION_PROMPTS,
  SURAH_ILLUSTRATION_PROMPTS,
  preGenerateAllIllustrations,
  GenerationProgress,
} from '../../services/kidsMediaService';

interface GeneratedAssets {
  narrations: Map<string, { url: string; duration: number }>;
  illustrations: Map<string, string>;
}

const MediaGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrationProgress, setNarrationProgress] = useState<BatchProgress | null>(null);
  const [illustrationProgress, setIllustrationProgress] = useState<GenerationProgress | null>(null);
  const [currentTask, setCurrentTask] = useState<'idle' | 'narrations' | 'illustrations'>('idle');
  const [assets, setAssets] = useState<GeneratedAssets>({
    narrations: new Map(),
    illustrations: new Map(),
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Generate all narrations using Gemini TTS
  const generateNarrations = useCallback(async () => {
    setIsGenerating(true);
    setCurrentTask('narrations');
    setErrors([]);

    try {
      const results = await preGenerateAllNarrations((p) => {
        setNarrationProgress(p);
      });

      setAssets((prev) => ({
        ...prev,
        narrations: results,
      }));
    } catch (error) {
      console.error('Narration generation error:', error);
      setErrors((prev) => [...prev, 'Narration generation failed']);
    }

    setIsGenerating(false);
    setCurrentTask('idle');
  }, []);

  // Generate all illustrations using Gemini Image Gen
  const generateIllustrations = useCallback(async () => {
    setIsGenerating(true);
    setCurrentTask('illustrations');
    setErrors([]);

    try {
      const results = await preGenerateAllIllustrations((p) => {
        setIllustrationProgress(p);
      });

      setAssets((prev) => ({
        ...prev,
        illustrations: results,
      }));

      if (results.size === 0) {
        setErrors((prev) => [...prev, 'No illustrations generated - check Gemini API']);
      }
    } catch (error) {
      console.error('Illustration generation error:', error);
      setErrors((prev) => [...prev, 'Illustration generation failed']);
    }

    setIsGenerating(false);
    setCurrentTask('idle');
  }, []);

  // Export assets as JSON for static hosting
  const exportAssets = () => {
    const exportData = {
      narrations: Array.from(assets.narrations.entries()).map(([key, value]) => ({
        key,
        url: value.url,
        duration: value.duration,
      })),
      illustrations: Array.from(assets.illustrations.entries()).map(([key, url]) => ({
        key,
        url,
      })),
      generatedAt: new Date().toISOString(),
      version: '2.0',
      source: 'Gemini API',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hikma-kids-assets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate totals
  const totalStoryScenes = Object.values(STORY_NARRATIONS).reduce(
    (sum, story) => sum + story.scenes.length + 1, 0 // +1 for lessons
  );
  const totalLetters = Object.keys(LETTER_PRONUNCIATIONS).length;
  const totalCelebrations = CELEBRATION_PHRASES.length;
  const totalEncouragements = ENCOURAGEMENT_PHRASES.length;
  const totalNarrations = totalStoryScenes + totalLetters + totalCelebrations + totalEncouragements;

  const totalStoryIllustrations = Object.values(STORY_ILLUSTRATION_PROMPTS).flat().length;
  const totalLetterIllustrations = Object.keys(LETTER_ILLUSTRATION_PROMPTS).length;
  const totalSurahIllustrations = Object.keys(SURAH_ILLUSTRATION_PROMPTS).length;
  const totalIllustrations = totalStoryIllustrations + totalLetterIllustrations + totalSurahIllustrations;

  const progress = currentTask === 'narrations' ? narrationProgress : illustrationProgress;

  return (
    <div className="min-h-screen-safe bg-gradient-to-br from-teal-50 to-amber-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-stone-800 mb-2">
            Kids Media Generator
          </h1>
          <p className="text-stone-600">
            Pre-generate narrations and illustrations using Gemini API
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm">
            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
            Powered by Gemini (TTS + Imagen 3)
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-lg border border-teal-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-microphone text-teal-600"></i>
              </div>
              <h3 className="font-bold text-stone-700">Narrations</h3>
            </div>
            <div className="space-y-1 text-sm text-stone-500">
              <p>{totalStoryScenes} story scenes + lessons</p>
              <p>{totalLetters} letter pronunciations</p>
              <p>{totalCelebrations + totalEncouragements} feedback phrases</p>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-lg font-bold text-teal-600">{totalNarrations} total</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-lg border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-image text-purple-600"></i>
              </div>
              <h3 className="font-bold text-stone-700">Illustrations</h3>
            </div>
            <div className="space-y-1 text-sm text-stone-500">
              <p>{totalStoryIllustrations} story scenes</p>
              <p>{totalLetterIllustrations} letter images</p>
              <p>{totalSurahIllustrations} surah images</p>
            </div>
            <div className="mt-3 pt-3 border-t border-stone-100">
              <p className="text-lg font-bold text-purple-600">{totalIllustrations} total</p>
            </div>
          </div>
        </div>

        {/* Generation Controls */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Narrations Button */}
          <button
            onClick={generateNarrations}
            disabled={isGenerating}
            className={`p-6 rounded-xl font-medium text-white transition-all ${
              isGenerating
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <i className="fas fa-microphone text-2xl mb-2"></i>
            <p className="text-lg">
              {currentTask === 'narrations' ? 'Generating...' : 'Generate Narrations'}
            </p>
            <p className="text-sm opacity-80 mt-1">
              {assets.narrations.size} / {totalNarrations} complete
            </p>
          </button>

          {/* Illustrations Button */}
          <button
            onClick={generateIllustrations}
            disabled={isGenerating}
            className={`p-6 rounded-xl font-medium text-white transition-all ${
              isGenerating
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
            }`}
          >
            <i className="fas fa-image text-2xl mb-2"></i>
            <p className="text-lg">
              {currentTask === 'illustrations' ? 'Generating...' : 'Generate Illustrations'}
            </p>
            <p className="text-sm opacity-80 mt-1">
              {assets.illustrations.size} / {totalIllustrations} complete
            </p>
          </button>
        </div>

        {/* Progress */}
        {progress && isGenerating && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-stone-600">
                {progress.current}
              </span>
              <span className="text-sm text-stone-500">
                {progress.completed} / {progress.total}
              </span>
            </div>
            <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentTask === 'narrations'
                    ? 'bg-gradient-to-r from-teal-400 to-teal-500'
                    : 'bg-gradient-to-r from-purple-400 to-purple-500'
                }`}
                style={{
                  width: `${(progress.completed / progress.total) * 100}%`,
                }}
              />
            </div>
            {progress.errors.length > 0 && (
              <p className="text-xs text-red-500 mt-2">
                <i className="fas fa-exclamation-circle mr-1"></i>
                {progress.errors.length} errors encountered
              </p>
            )}
            <p className="text-xs text-stone-400 mt-2">
              Estimated time remaining: ~{Math.ceil((progress.total - progress.completed) * (currentTask === 'narrations' ? 0.5 : 2) / 60)} min
            </p>
          </div>
        )}

        {/* Export */}
        {(assets.narrations.size > 0 || assets.illustrations.size > 0) && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-download text-amber-600"></i>
              </div>
              <div>
                <h3 className="font-bold text-stone-700">Export Assets</h3>
                <p className="text-sm text-stone-500">
                  Download for static hosting or offline use
                </p>
              </div>
            </div>
            <button
              onClick={exportAssets}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 shadow-lg"
            >
              <i className="fas fa-file-export mr-2"></i>
              Download JSON ({assets.narrations.size + assets.illustrations.size} assets)
            </button>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 rounded-xl p-6 border border-red-200 mb-6">
            <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              Generation Errors
            </h3>
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview Section */}
        {assets.illustrations.size > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h3 className="font-bold text-stone-700 mb-4">Generated Illustrations Preview</h3>
            <div className="grid grid-cols-3 gap-3">
              {Array.from(assets.illustrations.entries()).slice(0, 6).map(([key, url]) => (
                <div key={key} className="relative group">
                  <img
                    src={url}
                    alt={key}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs">{key}</span>
                  </div>
                </div>
              ))}
            </div>
            {assets.illustrations.size > 6 && (
              <p className="text-sm text-stone-400 mt-3 text-center">
                +{assets.illustrations.size - 6} more illustrations
              </p>
            )}
          </div>
        )}

        {/* Stats Footer */}
        <div className="text-center text-sm text-stone-500 space-y-1">
          <p>
            <i className="fas fa-info-circle mr-1"></i>
            All content generated using Gemini API with your existing API key
          </p>
          <p>
            Total assets: {totalNarrations} narrations + {totalIllustrations} illustrations
          </p>
          <p className="text-xs">
            Estimated total generation time: ~{Math.ceil((totalNarrations * 0.5 + totalIllustrations * 2) / 60)} minutes
          </p>
        </div>

        {/* Content Quality Note */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            <i className="fas fa-star"></i>
            Content Quality Standards
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Inspired by top-rated Islamic kids apps:
          </p>
          <ul className="text-sm text-blue-600 space-y-1">
            <li>• <strong>Hakma</strong>: Vibrant illustrations with moral lessons</li>
            <li>• <strong>Muslim Kids TV</strong>: Engaging, warm narration style</li>
            <li>• <strong>My Quran Journey</strong>: Interactive, multi-sensory learning</li>
            <li>• <strong>Goodnight Stories from the Quran</strong>: Age-appropriate storytelling</li>
          </ul>
          <p className="text-xs text-blue-500 mt-3">
            Following Islamic tradition: Prophets are not depicted in illustrations
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaGenerator;
