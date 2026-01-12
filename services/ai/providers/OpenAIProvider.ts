/**
 * OpenAI Provider
 * GPT-4o, TTS, Whisper STT, DALL-E
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

export class OpenAIProvider implements AIProvider {
  readonly type: AIProviderType = 'openai';
  readonly capabilities: AICapability[] = ['text', 'tts', 'stt', 'image'];

  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gpt-4o-mini';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateText(request: AITextRequest): Promise<AITextResponse> {
    const startTime = Date.now();

    const messages: { role: string; content: string }[] = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: request.prompt
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      provider: 'openai',
      tokensUsed: data.usage?.total_tokens,
      latencyMs: Date.now() - startTime
    };
  }

  async textToSpeech(request: AITTSRequest): Promise<AITTSResponse> {
    const startTime = Date.now();

    // Select appropriate voice
    let voice = request.voice || 'nova';
    if (request.language === 'ar') {
      // OpenAI voices that work well with Arabic
      voice = 'alloy';
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: request.text,
        voice,
        speed: request.speed || 1.0,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS error: ${response.status} - ${error}`);
    }

    const audioData = await response.arrayBuffer();

    return {
      audioData,
      provider: 'openai',
      format: 'mp3',
      latencyMs: Date.now() - startTime
    };
  }

  async speechToText(request: AISTTRequest): Promise<AISTTResponse> {
    const startTime = Date.now();

    // Prepare audio as file
    let audioBlob: Blob;
    if (request.audio instanceof Blob) {
      audioBlob = request.audio;
    } else {
      audioBlob = new Blob([request.audio], { type: 'audio/webm' });
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    if (request.language) {
      formData.append('language', request.language === 'ar' ? 'ar' : 'en');
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI STT error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      text: data.text || '',
      provider: 'openai',
      latencyMs: Date.now() - startTime
    };
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: request.prompt,
        n: 1,
        size: `${request.width || 1024}x${request.height || 1024}`,
        style: request.style || 'vivid'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Image error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    return {
      imageUrl,
      provider: 'openai',
      latencyMs: Date.now() - startTime
    };
  }
}
