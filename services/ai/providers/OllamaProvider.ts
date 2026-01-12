/**
 * Ollama Provider
 * Local AI models - free and private
 */

import type {
  AIProvider,
  AIProviderType,
  AICapability,
  AITextRequest,
  AITextResponse,
  ProviderConfig
} from '../types';

export class OllamaProvider implements AIProvider {
  readonly type: AIProviderType = 'ollama';
  readonly capabilities: AICapability[] = ['text'];

  private baseUrl: string;
  private model: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3.2';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET'
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
      prompt = `System: ${request.systemPrompt}\n\nUser: ${request.prompt}`;
    }

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          num_predict: request.maxTokens || 1024,
          temperature: request.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      text: data.response || '',
      provider: 'ollama',
      tokensUsed: data.eval_count,
      latencyMs: Date.now() - startTime
    };
  }
}
