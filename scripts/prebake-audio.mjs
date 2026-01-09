/**
 * Prebake audio assets for offline/instant playback.
 * - Kids stories: Gemini TTS -> public/assets/kids/audio/story-<id>-scene-<n>.mp3 and lesson.
 * - Short surahs (105-114): Download verse MP3s from Islamic Network CDN -> public/assets/quran/offline/<surah>/<verse>.mp3
 *
 * Usage:
 *   VITE_GEMINI_API_KEY=your_key node scripts/prebake-audio.mjs
 *   # or GEMINI_API_KEY=your_key node scripts/prebake-audio.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error('❌ Set VITE_GEMINI_API_KEY or GEMINI_API_KEY before running.');
  process.exit(1);
}

const genai = new GoogleGenAI({ apiKey: GEMINI_KEY });

const OFFLINE_SURAHS = [105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
const VERSE_COUNTS = [
  0, 7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83,
  182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96,
  29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31,
  50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5,
  8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
];

function getGlobalVerseNumber(surahNumber, verseNumber) {
  let total = 0;
  for (let i = 1; i < surahNumber; i++) total += VERSE_COUNTS[i];
  return total + verseNumber;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function ttsToFile(text, outPath, voiceName = 'Fenrir') {
  const res = await genai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
    },
  });

  const audioBase64 = res?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioBase64) {
    throw new Error('No audio returned from Gemini');
  }
  const buffer = Buffer.from(audioBase64, 'base64');
  await ensureDir(path.dirname(outPath));
  await fs.writeFile(outPath, buffer);
}

async function readKidsStories() {
  const dataPath = path.join(root, 'data', 'kidsStories.json');
  const json = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(json);
}

async function generateKidsAudio() {
  console.log('🎙️  Generating kids story audio...');
  const stories = await readKidsStories();
  for (const story of stories) {
    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      const out = path.join(root, 'public', 'assets', 'kids', 'audio', `story-${story.id}-scene-${i}.mp3`);
      await ttsToFile(scene.text, out, 'Fenrir');
      console.log(`  ✅ ${story.id} scene ${i + 1} -> ${path.basename(out)}`);
    }
    const lessonOut = path.join(root, 'public', 'assets', 'kids', 'audio', `story-${story.id}-lesson.mp3`);
    await ttsToFile(story.lesson, lessonOut, 'Fenrir');
    console.log(`  ✅ ${story.id} lesson -> ${path.basename(lessonOut)}`);
  }
}

async function downloadShortSurahs() {
  console.log('📥 Downloading short surahs (105-114) for offline...');
  const bitrate = '128';
  const reciter = 'ar.alafasy';
  for (const surah of OFFLINE_SURAHS) {
    const totalVerses = VERSE_COUNTS[surah];
    for (let verse = 1; verse <= totalVerses; verse++) {
      const global = getGlobalVerseNumber(surah, verse);
      const url = `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${global}.mp3`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  ⚠️  Failed ${url}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const out = path.join(root, 'public', 'assets', 'quran', 'offline', `${surah}`, `${verse}.mp3`);
      await ensureDir(path.dirname(out));
      await fs.writeFile(out, buf);
    }
    console.log(`  ✅ Surah ${surah} (${totalVerses} verses) downloaded`);
  }
}

async function main() {
  await generateKidsAudio();
  await downloadShortSurahs();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
