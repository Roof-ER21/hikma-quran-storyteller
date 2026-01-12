/**
 * AI Provider Types and Interfaces
 * Multi-provider fallback system for reliable AI functionality
 */

// Provider identification
export type AIProviderType = 'gemini' | 'openai' | 'groq' | 'ollama' | 'huggingface';

// Capability types
export type AICapability = 'text' | 'tts' | 'stt' | 'image' | 'live-audio';

// Cost preference for routing
export type CostPreference = 'quality' | 'balanced' | 'budget';

// Provider status
export interface ProviderStatus {
  provider: AIProviderType;
  available: boolean;
  healthy: boolean;
  lastCheck: Date;
  error?: string;
  latencyMs?: number;
}

// Request types
export interface AITextRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  language?: 'en' | 'ar';
}

export interface AITextResponse {
  text: string;
  provider: AIProviderType;
  tokensUsed?: number;
  latencyMs: number;
}

export interface AITTSRequest {
  text: string;
  voice?: string;
  language?: 'en' | 'ar';
  speed?: number;
}

export interface AITTSResponse {
  audioData: ArrayBuffer | Blob;
  provider: AIProviderType;
  format: 'mp3' | 'wav' | 'ogg';
  latencyMs: number;
}

export interface AISTTRequest {
  audio: Blob | ArrayBuffer;
  language?: 'en' | 'ar';
}

export interface AISTTResponse {
  text: string;
  provider: AIProviderType;
  confidence?: number;
  latencyMs: number;
}

export interface AIImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  style?: string;
}

export interface AIImageResponse {
  imageUrl?: string;
  imageData?: ArrayBuffer;
  provider: AIProviderType;
  latencyMs: number;
}

// Provider interface that all providers must implement
export interface AIProvider {
  readonly type: AIProviderType;
  readonly capabilities: AICapability[];

  // Health check
  isAvailable(): Promise<boolean>;

  // Core methods (optional based on capabilities)
  generateText?(request: AITextRequest): Promise<AITextResponse>;
  textToSpeech?(request: AITTSRequest): Promise<AITTSResponse>;
  speechToText?(request: AISTTRequest): Promise<AISTTResponse>;
  generateImage?(request: AIImageRequest): Promise<AIImageResponse>;
}

// Fallback chain configuration
export interface FallbackChain {
  capability: AICapability;
  mode: CostPreference | 'kids';
  providers: AIProviderType[];
}

// Provider configuration
export interface ProviderConfig {
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
}

export interface AIProviderConfigs {
  gemini: ProviderConfig & {
    secondaryApiKey?: string;
  };
  openai: ProviderConfig;
  groq: ProviderConfig;
  ollama: ProviderConfig;
  huggingface: ProviderConfig;
}

// Kids tutor specific types
export interface KidsTutorContext {
  activity: 'alphabet' | 'stories' | 'surah' | 'general';
  currentLetter?: string;
  currentProphet?: string;
  currentSurah?: string;
  childAge?: number;
  language: 'en' | 'ar';
}

export interface KidsTutorRequest extends AITextRequest {
  context: KidsTutorContext;
}

export interface KidsTutorResponse extends AITextResponse {
  suggestions?: string[];
  shouldSpeak?: boolean;
}
