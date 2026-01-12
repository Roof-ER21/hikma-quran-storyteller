/**
 * HuggingFace Provider
 * Budget option with free tier
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
  ProviderConfig
} from '../types';

export class HuggingFaceProvider implements AIProvider {
  readonly type: AIProviderType = 'huggingface';
  readonly capabilities: AICapability[] = ['text', 'tts', 'stt'];

  private apiKey: string;
  private textModel: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || '';
    this.textModel = config.model || 'mistralai/Mistral-7B-Instruct-v0.2';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://huggingface.co/api/whoami', {
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

    let prompt = request.prompt;
    if (request.systemPrompt) {
      prompt = `<s>[INST] ${request.systemPrompt}\n\n${request.prompt} [/INST]`;
    } else {
      prompt = `<s>[INST] ${request.prompt} [/INST]`;
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.textModel}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: request.maxTokens || 1024,
            temperature: request.temperature || 0.7,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || '';

    return {
      text,
      provider: 'huggingface',
      latencyMs: Date.now() - startTime
    };
  }

  async textToSpeech(request: AITTSRequest): Promise<AITTSResponse> {
    const startTime = Date.now();

    // Use Facebook's MMS TTS model
    const model = request.language === 'ar'
      ? 'facebook/mms-tts-ara'
      : 'facebook/mms-tts-eng';

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: request.text
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace TTS error: ${response.status} - ${error}`);
    }

    const audioData = await response.arrayBuffer();

    return {
      audioData,
      provider: 'huggingface',
      format: 'wav',
      latencyMs: Date.now() - startTime
    };
  }

  async speechToText(request: AISTTRequest): Promise<AISTTResponse> {
    const startTime = Date.now();

    // Prepare audio
    let audioBlob: Blob;
    if (request.audio instanceof Blob) {
      audioBlob = request.audio;
    } else {
      audioBlob = new Blob([request.audio], { type: 'audio/webm' });
    }

    // Use OpenAI's Whisper model hosted on HuggingFace
    const response = await fetch(
      'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: audioBlob
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace STT error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      text: data.text || '',
      provider: 'huggingface',
      latencyMs: Date.now() - startTime
    };
  }
}
