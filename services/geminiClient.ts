/**
 * Gemini API Client - Secure backend proxy wrapper
 * This replaces direct @google/genai calls with server-side proxy requests
 */

export interface GeminiResponse {
  text: string;
  candidates?: any[];
}

export interface GeminiRequest {
  model: string;
  contents: any;
  config?: {
    systemInstruction?: string;
    generationConfig?: any;
    safetySettings?: any[];
    tools?: any[];
    toolConfig?: any;
    responseModalities?: string[];
    speechConfig?: any;
    imageConfig?: any;
  };
}

/**
 * Call Gemini API via backend proxy
 * This keeps API keys secure on the server
 */
export async function callGeminiProxy(request: GeminiRequest): Promise<GeminiResponse> {
  const response = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API request failed: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from response
  let text = '';
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.text) {
        text += part.text;
      }
    }
  }

  return {
    text,
    candidates: data.candidates
  };
}

/**
 * Helper to format contents for Gemini API
 */
export function formatContents(input: string | any[]): any {
  if (typeof input === 'string') {
    return [{ parts: [{ text: input }] }];
  }
  return input;
}

/**
 * Generate image via backend proxy
 */
export async function generateImage(model: string, prompt: string, imageConfig?: any): Promise<string | null> {
  const response = await fetch('/api/gemini/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      config: { imageConfig }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Image generation failed: ${response.status}`);
  }

  const data = await response.json();

  // Extract image from response
  for (const part of data.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return null;
}

/**
 * Generate TTS audio via backend proxy
 */
export async function generateTTS(
  model: string,
  text: string,
  config?: {
    responseModalities?: string[];
    speechConfig?: any;
  }
): Promise<string | null> {
  const response = await fetch('/api/gemini/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      text,
      config
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `TTS generation failed: ${response.status}`);
  }

  const data = await response.json();

  // Extract audio base64 from response
  const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || null;
}
