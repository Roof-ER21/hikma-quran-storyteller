import { GoogleGenAI } from '@google/genai';
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

try {
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text: 'هذا حرف ألف. مثال: أسد.' }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
        languageCode: 'ar-XA',
      },
    },
  });

  const data = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  console.log(data ? '✅ SUCCESS - Gemini TTS quota available!' : '❌ FAILED - No audio data');
} catch (e) {
  if (e.message?.includes('429') || e.message?.includes('quota')) {
    console.log('❌ QUOTA EXCEEDED - Need to wait or use different key');
  } else {
    console.log('❌ ERROR:', e.message);
  }
}
