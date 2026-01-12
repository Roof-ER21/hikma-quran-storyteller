/**
 * Groq AI Provider
 * Fast inference with Whisper STT support
 */

import type {
  AIProvider,
  AIProviderType,
  AICapability,
  AITextRequest,
  AITextResponse,
  AISTTRequest,
  AISTTResponse,
  ProviderConfig
} from '../types';

export class GroqProvider implements AIProvider {
  readonly type: AIProviderType = 'groq';
  readonly capabilities: AICapability[] = ['text', 'stt'];

  private apiKey: string;
  private model: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'llama-3.3-70b-versatile';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      provider: 'groq',
      tokensUsed: data.usage?.total_tokens,
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
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', request.language === 'ar' ? 'ar' : 'en');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq STT error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      text: data.text || '',
      provider: 'groq',
      latencyMs: Date.now() - startTime
    };
  }
}
