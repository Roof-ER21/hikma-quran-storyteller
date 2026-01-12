/**
 * Fallback Chains Configuration
 * Defines provider priority order for each capability and mode
 */

import type { AIProviderType, AICapability, CostPreference, FallbackChain } from '../types';

// Quality mode - best results, higher cost
const qualityChains: FallbackChain[] = [
  {
    capability: 'text',
    mode: 'quality',
    providers: ['gemini', 'openai', 'groq', 'ollama']
  },
  {
    capability: 'tts',
    mode: 'quality',
    providers: ['gemini', 'openai', 'huggingface']
  },
  {
    capability: 'stt',
    mode: 'quality',
    providers: ['gemini', 'groq', 'openai']
  },
  {
    capability: 'image',
    mode: 'quality',
    providers: ['gemini', 'openai']
  },
  {
    capability: 'live-audio',
    mode: 'quality',
    providers: ['gemini'] // Only Gemini supports live bidirectional audio
  }
];

// Balanced mode - good quality, reasonable cost
const balancedChains: FallbackChain[] = [
  {
    capability: 'text',
    mode: 'balanced',
    providers: ['gemini', 'groq', 'openai', 'ollama']
  },
  {
    capability: 'tts',
    mode: 'balanced',
    providers: ['gemini', 'openai']
  },
  {
    capability: 'stt',
    mode: 'balanced',
    providers: ['groq', 'gemini', 'openai']
  },
  {
    capability: 'image',
    mode: 'balanced',
    providers: ['gemini', 'openai']
  },
  {
    capability: 'live-audio',
    mode: 'balanced',
    providers: ['gemini']
  }
];

// Budget mode - minimize cost, use free/local options
const budgetChains: FallbackChain[] = [
  {
    capability: 'text',
    mode: 'budget',
    providers: ['ollama', 'groq', 'huggingface', 'gemini']
  },
  {
    capability: 'tts',
    mode: 'budget',
    providers: ['huggingface', 'gemini']
  },
  {
    capability: 'stt',
    mode: 'budget',
    providers: ['groq', 'huggingface', 'gemini']
  },
  {
    capability: 'image',
    mode: 'budget',
    providers: ['gemini'] // Image gen is expensive everywhere
  },
  {
    capability: 'live-audio',
    mode: 'budget',
    providers: ['gemini']
  }
];

// Kids mode - prioritize reliability and safety
const kidsChains: FallbackChain[] = [
  {
    capability: 'text',
    mode: 'kids',
    providers: ['openai', 'gemini', 'groq'] // OpenAI has best content filtering
  },
  {
    capability: 'tts',
    mode: 'kids',
    providers: ['openai', 'gemini'] // Stable, friendly voices
  },
  {
    capability: 'stt',
    mode: 'kids',
    providers: ['groq', 'openai', 'gemini'] // Groq Whisper is fast for kids
  },
  {
    capability: 'image',
    mode: 'kids',
    providers: ['gemini', 'openai']
  },
  {
    capability: 'live-audio',
    mode: 'kids',
    providers: ['gemini']
  }
];

// All chains combined
export const allFallbackChains: FallbackChain[] = [
  ...qualityChains,
  ...balancedChains,
  ...budgetChains,
  ...kidsChains
];

/**
 * Get the fallback chain for a specific capability and mode
 */
export function getFallbackChain(
  capability: AICapability,
  mode: CostPreference | 'kids' = 'balanced'
): AIProviderType[] {
  const chain = allFallbackChains.find(
    c => c.capability === capability && c.mode === mode
  );
  return chain?.providers ?? ['gemini'];
}

/**
 * Get all providers that support a given capability
 */
export function getProvidersForCapability(capability: AICapability): AIProviderType[] {
  const providerCapabilities: Record<AIProviderType, AICapability[]> = {
    gemini: ['text', 'tts', 'stt', 'image', 'live-audio'],
    openai: ['text', 'tts', 'stt', 'image'],
    groq: ['text', 'stt'],
    ollama: ['text'],
    huggingface: ['text', 'tts', 'stt']
  };

  return (Object.entries(providerCapabilities) as [AIProviderType, AICapability[]][])
    .filter(([_, caps]) => caps.includes(capability))
    .map(([provider]) => provider);
}

/**
 * Check if a provider supports a capability
 */
export function providerSupports(provider: AIProviderType, capability: AICapability): boolean {
  const providerCapabilities: Record<AIProviderType, AICapability[]> = {
    gemini: ['text', 'tts', 'stt', 'image', 'live-audio'],
    openai: ['text', 'tts', 'stt', 'image'],
    groq: ['text', 'stt'],
    ollama: ['text'],
    huggingface: ['text', 'tts', 'stt']
  };

  return providerCapabilities[provider]?.includes(capability) ?? false;
}
