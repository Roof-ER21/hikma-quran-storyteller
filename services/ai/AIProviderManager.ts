/**
 * AI Provider Manager
 * Orchestrates multiple AI providers with intelligent fallback
 */

import type {
  AIProvider,
  AIProviderType,
  AICapability,
  CostPreference,
  ProviderStatus,
  AITextRequest,
  AITextResponse,
  AITTSRequest,
  AITTSResponse,
  AISTTRequest,
  AISTTResponse,
  AIImageRequest,
  AIImageResponse,
  AIProviderConfigs
} from './types';
import { getFallbackChain, providerSupports } from './config/fallbackChains';

// Provider instances will be lazily loaded
let providerInstances: Map<AIProviderType, AIProvider> = new Map();
let providerStatus: Map<AIProviderType, ProviderStatus> = new Map();

// Configuration
let currentConfig: Partial<AIProviderConfigs> = {};
let costPreference: CostPreference | 'kids' = 'balanced';

// Health check interval (5 minutes)
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;
// Cooldown after failure (30 seconds)
const FAILURE_COOLDOWN = 30 * 1000;

/**
 * Initialize the AI Provider Manager with configuration
 */
export function initializeAIProviders(config: Partial<AIProviderConfigs>): void {
  currentConfig = config;
  providerInstances.clear();
  providerStatus.clear();

  // Initialize status for each configured provider
  const providers: AIProviderType[] = ['gemini', 'openai', 'groq', 'ollama', 'huggingface'];
  for (const provider of providers) {
    const providerConfig = config[provider];
    if (providerConfig?.enabled) {
      providerStatus.set(provider, {
        provider,
        available: true,
        healthy: true,
        lastCheck: new Date()
      });
    }
  }
}

/**
 * Set the cost preference mode
 */
export function setCostPreference(preference: CostPreference | 'kids'): void {
  costPreference = preference;
}

/**
 * Get current cost preference
 */
export function getCostPreference(): CostPreference | 'kids' {
  return costPreference;
}

/**
 * Lazy-load a provider instance
 */
async function getProvider(type: AIProviderType): Promise<AIProvider | null> {
  if (providerInstances.has(type)) {
    return providerInstances.get(type)!;
  }

  const config = currentConfig[type];
  if (!config?.enabled) {
    return null;
  }

  try {
    let provider: AIProvider | null = null;

    switch (type) {
      case 'gemini': {
        const { GeminiProvider } = await import('./providers/GeminiProvider');
        provider = new GeminiProvider(config);
        break;
      }
      case 'openai': {
        const { OpenAIProvider } = await import('./providers/OpenAIProvider');
        provider = new OpenAIProvider(config);
        break;
      }
      case 'groq': {
        const { GroqProvider } = await import('./providers/GroqProvider');
        provider = new GroqProvider(config);
        break;
      }
      case 'ollama': {
        const { OllamaProvider } = await import('./providers/OllamaProvider');
        provider = new OllamaProvider(config);
        break;
      }
      case 'huggingface': {
        const { HuggingFaceProvider } = await import('./providers/HuggingFaceProvider');
        provider = new HuggingFaceProvider(config);
        break;
      }
    }

    if (provider) {
      providerInstances.set(type, provider);
    }
    return provider;
  } catch (error) {
    console.error(`Failed to load provider ${type}:`, error);
    return null;
  }
}

/**
 * Check if a provider is currently healthy
 */
function isProviderHealthy(type: AIProviderType): boolean {
  const status = providerStatus.get(type);
  if (!status) return false;

  // Check if we're in cooldown after a failure
  if (!status.healthy) {
    const timeSinceCheck = Date.now() - status.lastCheck.getTime();
    if (timeSinceCheck < FAILURE_COOLDOWN) {
      return false;
    }
    // Reset healthy status to try again
    status.healthy = true;
  }

  return status.available && status.healthy;
}

/**
 * Mark a provider as failed
 */
function markProviderFailed(type: AIProviderType, error: string): void {
  const status = providerStatus.get(type);
  if (status) {
    status.healthy = false;
    status.error = error;
    status.lastCheck = new Date();
  }
}

/**
 * Mark a provider as successful
 */
function markProviderSuccess(type: AIProviderType, latencyMs: number): void {
  const status = providerStatus.get(type);
  if (status) {
    status.healthy = true;
    status.error = undefined;
    status.latencyMs = latencyMs;
    status.lastCheck = new Date();
  }
}

/**
 * Execute with fallback - tries providers in order until one succeeds
 */
async function executeWithFallback<T>(
  capability: AICapability,
  mode: CostPreference | 'kids',
  operation: (provider: AIProvider) => Promise<T>
): Promise<T> {
  const chain = getFallbackChain(capability, mode);
  const errors: string[] = [];

  for (const providerType of chain) {
    if (!isProviderHealthy(providerType)) {
      continue;
    }

    if (!providerSupports(providerType, capability)) {
      continue;
    }

    const provider = await getProvider(providerType);
    if (!provider) {
      continue;
    }

    try {
      const startTime = Date.now();
      const result = await operation(provider);
      const latencyMs = Date.now() - startTime;
      markProviderSuccess(providerType, latencyMs);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`${providerType}: ${errorMessage}`);
      markProviderFailed(providerType, errorMessage);
      console.warn(`Provider ${providerType} failed for ${capability}:`, errorMessage);
    }
  }

  throw new Error(`All providers failed for ${capability}. Errors: ${errors.join('; ')}`);
}

/**
 * Generate text using the best available provider
 */
export async function generateText(
  request: AITextRequest,
  mode?: CostPreference | 'kids'
): Promise<AITextResponse> {
  return executeWithFallback('text', mode ?? costPreference, async (provider) => {
    if (!provider.generateText) {
      throw new Error(`Provider ${provider.type} does not support text generation`);
    }
    return provider.generateText(request);
  });
}

/**
 * Convert text to speech using the best available provider
 */
export async function textToSpeech(
  request: AITTSRequest,
  mode?: CostPreference | 'kids'
): Promise<AITTSResponse> {
  return executeWithFallback('tts', mode ?? costPreference, async (provider) => {
    if (!provider.textToSpeech) {
      throw new Error(`Provider ${provider.type} does not support TTS`);
    }
    return provider.textToSpeech(request);
  });
}

/**
 * Convert speech to text using the best available provider
 */
export async function speechToText(
  request: AISTTRequest,
  mode?: CostPreference | 'kids'
): Promise<AISTTResponse> {
  return executeWithFallback('stt', mode ?? costPreference, async (provider) => {
    if (!provider.speechToText) {
      throw new Error(`Provider ${provider.type} does not support STT`);
    }
    return provider.speechToText(request);
  });
}

/**
 * Generate an image using the best available provider
 */
export async function generateImage(
  request: AIImageRequest,
  mode?: CostPreference | 'kids'
): Promise<AIImageResponse> {
  return executeWithFallback('image', mode ?? costPreference, async (provider) => {
    if (!provider.generateImage) {
      throw new Error(`Provider ${provider.type} does not support image generation`);
    }
    return provider.generateImage(request);
  });
}

/**
 * Get the status of all providers
 */
export function getAllProviderStatus(): ProviderStatus[] {
  return Array.from(providerStatus.values());
}

/**
 * Get status of a specific provider
 */
export function getProviderStatus(type: AIProviderType): ProviderStatus | undefined {
  return providerStatus.get(type);
}

/**
 * Force a health check on all providers
 */
export async function checkAllProviders(): Promise<ProviderStatus[]> {
  const results: ProviderStatus[] = [];

  for (const [type, status] of providerStatus.entries()) {
    const provider = await getProvider(type);
    if (provider) {
      try {
        const startTime = Date.now();
        const available = await provider.isAvailable();
        const latencyMs = Date.now() - startTime;

        status.available = available;
        status.healthy = available;
        status.latencyMs = latencyMs;
        status.lastCheck = new Date();
        status.error = available ? undefined : 'Health check failed';
      } catch (error) {
        status.available = false;
        status.healthy = false;
        status.error = error instanceof Error ? error.message : String(error);
        status.lastCheck = new Date();
      }
    }
    results.push(status);
  }

  return results;
}

/**
 * Initialize providers from environment variables
 */
export function initializeFromEnv(): void {
  const config: Partial<AIProviderConfigs> = {
    gemini: {
      enabled: !!(import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_SECONDARY_GEMINI_API_KEY),
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      secondaryApiKey: import.meta.env.VITE_SECONDARY_GEMINI_API_KEY
    },
    openai: {
      enabled: !!import.meta.env.VITE_OPENAI_API_KEY,
      apiKey: import.meta.env.VITE_OPENAI_API_KEY
    },
    groq: {
      enabled: !!import.meta.env.VITE_GROQ_API_KEY,
      apiKey: import.meta.env.VITE_GROQ_API_KEY
    },
    ollama: {
      enabled: !!import.meta.env.VITE_OLLAMA_BASE_URL,
      baseUrl: import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434'
    },
    huggingface: {
      enabled: !!import.meta.env.VITE_HUGGINGFACE_API_KEY,
      apiKey: import.meta.env.VITE_HUGGINGFACE_API_KEY
    }
  };

  // Set cost preference from env
  const envPreference = import.meta.env.VITE_AI_COST_PREFERENCE;
  if (envPreference && ['quality', 'balanced', 'budget'].includes(envPreference)) {
    costPreference = envPreference as CostPreference;
  }

  initializeAIProviders(config);
}
