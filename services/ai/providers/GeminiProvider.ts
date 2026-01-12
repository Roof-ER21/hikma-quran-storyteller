/**
 * Gemini AI Provider
 * Wraps Google's Gemini API with all capabilities
 */

import type {
  AIProvider,
  AIProviderType,
  AICapability,
  AITextRequest,
  AITextResponse,
  AITTSRequest,
  AITTSResponse,
  AISTTRequest,
  AISTTResponse,
  AIImageRequest,
  AIImageResponse,
  ProviderConfig
} from '../types';

interface GeminiConfig extends ProviderConfig {
  secondaryApiKey?: string;
}

export class GeminiProvider implements AIProvider {
  readonly type: AIProviderType = 'gemini';
  readonly capabilities: AICapability[] = ['text', 'tts', 'stt', 'image', 'live-audio'];

  private apiKey: string;
  private secondaryApiKey?: string;
  private useSecondary = false;
  private lastSwitch = 0;
  private readonly COOLDOWN = 60000; // 1 minute cooldown

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey || '';
    this.secondaryApiKey = config.secondaryApiKey;
  }

  private getActiveApiKey(): string {
    if (this.useSecondary && this.secondaryApiKey) {
      return this.secondaryApiKey;
    }
    return this.apiKey;
  }

  private switchApiKey(): void {
    if (!this.secondaryApiKey) return;

    const now = Date.now();
    if (now - this.lastSwitch < this.COOLDOWN) return;

    this.useSecondary = !this.useSecondary;
    this.lastSwitch = now;
    console.log(`Switched to ${this.useSecondary ? 'secondary' : 'primary'} Gemini API key`);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.getActiveApiKey()}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateText(request: AITextRequest): Promise<AITextResponse> {
    const startTime = Date.now();
    const apiKey = this.getActiveApiKey();

    const messages: { role: string; parts: { text: string }[] }[] = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'user',
        parts: [{ text: request.systemPrompt }]
      });
      messages.push({
        role: 'model',
        parts: [{ text: 'I understand. I will follow these instructions.' }]
      });
    }

    messages.push({
      role: 'user',
      parts: [{ text: request.prompt }]
    });

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages,
            generationConfig: {
              maxOutputTokens: request.maxTokens || 1024,
              temperature: request.temperature || 0.7
            }
          })
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
          this.switchApiKey();
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        text,
        provider: 'gemini',
        tokensUsed: data.usageMetadata?.totalTokenCount,
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      this.switchApiKey();
      throw error;
    }
  }

  async textToSpeech(request: AITTSRequest): Promise<AITTSResponse> {
    const startTime = Date.now();
    const apiKey = this.getActiveApiKey();

    // Use Gemini's TTS endpoint
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: request.text },
          voice: {
            languageCode: request.language === 'ar' ? 'ar-XA' : 'en-US',
            name: request.voice || (request.language === 'ar' ? 'ar-XA-Wavenet-A' : 'en-US-Neural2-F')
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: request.speed || 1.0
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini TTS error: ${response.status}`);
    }

    const data = await response.json();
    const audioContent = data.audioContent;

    // Decode base64 to ArrayBuffer
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return {
      audioData: bytes.buffer,
      provider: 'gemini',
      format: 'mp3',
      latencyMs: Date.now() - startTime
    };
  }

  async speechToText(request: AISTTRequest): Promise<AISTTResponse> {
    const startTime = Date.now();
    const apiKey = this.getActiveApiKey();

    // Convert audio to base64
    let audioData: string;
    if (request.audio instanceof Blob) {
      const arrayBuffer = await request.audio.arrayBuffer();
      audioData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    } else {
      audioData = btoa(String.fromCharCode(...new Uint8Array(request.audio)));
    }

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            languageCode: request.language === 'ar' ? 'ar-SA' : 'en-US',
            enableAutomaticPunctuation: true
          },
          audio: { content: audioData }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini STT error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results?.[0]?.alternatives?.[0];

    return {
      text: result?.transcript || '',
      provider: 'gemini',
      confidence: result?.confidence,
      latencyMs: Date.now() - startTime
    };
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    const startTime = Date.now();
    const apiKey = this.getActiveApiKey();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: request.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
            safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Image error: ${response.status}`);
    }

    const data = await response.json();
    const imageData = data.predictions?.[0]?.bytesBase64Encoded;

    if (!imageData) {
      throw new Error('No image data returned');
    }

    // Decode base64 to ArrayBuffer
    const binaryString = atob(imageData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return {
      imageData: bytes.buffer,
      provider: 'gemini',
      latencyMs: Date.now() - startTime
    };
  }
}
