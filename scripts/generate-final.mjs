import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const OUTPUT_DIR = 'public/assets/kids/audio/letters';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function generateAudio(text, outPath) {
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
        languageCode: 'ar-XA',
      },
    },
  });
  const audioBase64 = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioBase64) throw new Error('No audio');
  await fs.writeFile(outPath, Buffer.from(audioBase64, 'base64'));
  return true;
}

const remaining = [
  { id: 'waw', name: 'واو', example: 'وردة' },
  { id: 'yaa', name: 'ياء', example: 'يد' },
];

console.log('🎙️  Generating final 4 files...\n');

for (const letter of remaining) {
  console.log(`  Generating: ${letter.id} (${letter.name})...`);
  await generateAudio(`هذا حرف ${letter.name}`, path.join(OUTPUT_DIR, `letter-${letter.id}.mp3`));
  console.log(`    ✅ letter-${letter.id}.mp3`);
  await delay(25000); // 25 sec to respect rate limit
  
  console.log(`  Generating: ${letter.id} example (${letter.example})...`);
  await generateAudio(`حرف ${letter.name}. مثال: ${letter.example}.`, path.join(OUTPUT_DIR, `letter-${letter.id}-example.mp3`));
  console.log(`    ✅ letter-${letter.id}-example.mp3`);
  await delay(25000);
}

console.log('\n✅ ALL 56 ARABIC LETTER AUDIO FILES COMPLETE!');
