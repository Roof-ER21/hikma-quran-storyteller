/**
 * AI Provider System - Main Exports
 * Multi-provider fallback for reliable AI functionality
 */

// Types
export type {
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
  AIProvider,
  AIProviderConfigs,
  ProviderConfig,
  KidsTutorContext,
  KidsTutorRequest,
  KidsTutorResponse
} from './types';

// Manager functions
export {
  initializeAIProviders,
  initializeFromEnv,
  setCostPreference,
  getCostPreference,
  generateText,
  textToSpeech,
  speechToText,
  generateImage,
  getAllProviderStatus,
  getProviderStatus,
  checkAllProviders
} from './AIProviderManager';

// Fallback chain utilities
export {
  getFallbackChain,
  getProvidersForCapability,
  providerSupports
} from './config/fallbackChains';
