/**
 * Prebake Kids Audio Assets for Offline/Instant Playback
 *
 * This script generates audio files for:
 * 1. All 28 Arabic letters (letter pronunciation)
 * 2. Letter example words (e.g., أسد for Alif)
 * 3. Story narrations from kidsStories.json (scenes + lessons)
 *
 * Audio is generated using Gemini TTS API with:
 * - Arabic content: ar-XA language, Aoede voice
 * - English content: en-US language, Aoede voice
 *
 * Output structure:
 * - /public/assets/kids/audio/letters/letter-<id>.mp3
 * - /public/assets/kids/audio/letters/letter-<id>-example.mp3
 * - /public/assets/kids/audio/story-<id>-scene-<n>.mp3
 * - /public/assets/kids/audio/story-<id>-lesson.mp3
 *
 * Usage:
 *   VITE_GEMINI_API_KEY=your_key node scripts/prebake-kids-audio.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

// Get API key from environment
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.error('❌ Set VITE_GEMINI_API_KEY or GEMINI_API_KEY before running.');
  process.exit(1);
}

const genai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// Arabic alphabet data with Arabic names for TTS pronunciation
const ARABIC_LETTERS = [
  { id: 'alif', letter: 'ا', name: 'Alif', arabicName: 'ألف', example: 'أسد', exampleMeaning: 'Lion' },
  { id: 'baa', letter: 'ب', name: 'Baa', arabicName: 'باء', example: 'بطة', exampleMeaning: 'Duck' },
  { id: 'taa', letter: 'ت', name: 'Taa', arabicName: 'تاء', example: 'تفاح', exampleMeaning: 'Apple' },
  { id: 'thaa', letter: 'ث', name: 'Thaa', arabicName: 'ثاء', example: 'ثعلب', exampleMeaning: 'Fox' },
  { id: 'jeem', letter: 'ج', name: 'Jeem', arabicName: 'جيم', example: 'جمل', exampleMeaning: 'Camel' },
  { id: 'haa', letter: 'ح', name: 'Haa', arabicName: 'حاء', example: 'حصان', exampleMeaning: 'Horse' },
  { id: 'khaa', letter: 'خ', name: 'Khaa', arabicName: 'خاء', example: 'خروف', exampleMeaning: 'Sheep' },
  { id: 'dal', letter: 'د', name: 'Dal', arabicName: 'دال', example: 'دب', exampleMeaning: 'Bear' },
  { id: 'thal', letter: 'ذ', name: 'Thal', arabicName: 'ذال', example: 'ذرة', exampleMeaning: 'Corn' },
  { id: 'raa', letter: 'ر', name: 'Raa', arabicName: 'راء', example: 'رمان', exampleMeaning: 'Pomegranate' },
  { id: 'zay', letter: 'ز', name: 'Zay', arabicName: 'زاي', example: 'زرافة', exampleMeaning: 'Giraffe' },
  { id: 'seen', letter: 'س', name: 'Seen', arabicName: 'سين', example: 'سمكة', exampleMeaning: 'Fish' },
  { id: 'sheen', letter: 'ش', name: 'Sheen', arabicName: 'شين', example: 'شمس', exampleMeaning: 'Sun' },
  { id: 'saad', letter: 'ص', name: 'Saad', arabicName: 'صاد', example: 'صقر', exampleMeaning: 'Falcon' },
  { id: 'daad', letter: 'ض', name: 'Daad', arabicName: 'ضاد', example: 'ضفدع', exampleMeaning: 'Frog' },
  { id: 'taa2', letter: 'ط', name: 'Taa', arabicName: 'طاء', example: 'طائر', exampleMeaning: 'Bird' },
  { id: 'thaa2', letter: 'ظ', name: 'Thaa', arabicName: 'ظاء', example: 'ظبي', exampleMeaning: 'Gazelle' },
  { id: 'ayn', letter: 'ع', name: 'Ayn', arabicName: 'عين', example: 'عنب', exampleMeaning: 'Grapes' },
  { id: 'ghayn', letter: 'غ', name: 'Ghayn', arabicName: 'غين', example: 'غزال', exampleMeaning: 'Deer' },
  { id: 'faa', letter: 'ف', name: 'Faa', arabicName: 'فاء', example: 'فيل', exampleMeaning: 'Elephant' },
  { id: 'qaaf', letter: 'ق', name: 'Qaaf', arabicName: 'قاف', example: 'قمر', exampleMeaning: 'Moon' },
  { id: 'kaaf', letter: 'ك', name: 'Kaaf', arabicName: 'كاف', example: 'كتاب', exampleMeaning: 'Book' },
  { id: 'laam', letter: 'ل', name: 'Laam', arabicName: 'لام', example: 'ليمون', exampleMeaning: 'Lemon' },
  { id: 'meem', letter: 'م', name: 'Meem', arabicName: 'ميم', example: 'موز', exampleMeaning: 'Banana' },
  { id: 'noon', letter: 'ن', name: 'Noon', arabicName: 'نون', example: 'نجمة', exampleMeaning: 'Star' },
  { id: 'haa2', letter: 'ه', name: 'Haa', arabicName: 'هاء', example: 'هلال', exampleMeaning: 'Crescent' },
  { id: 'waw', letter: 'و', name: 'Waw', arabicName: 'واو', example: 'وردة', exampleMeaning: 'Rose' },
  { id: 'yaa', letter: 'ي', name: 'Yaa', arabicName: 'ياء', example: 'يد', exampleMeaning: 'Hand' },
];

// Helper to check if file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Rate limiting helper - Gemini TTS has 10 requests/minute limit
// Use 7 second delay to stay under limit (8-9 requests per minute)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY = 7000; // 7 seconds between requests

// Ensure directory exists
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Generate TTS audio using Gemini API
 * @param {string} text - Text to convert to speech
 * @param {string} outPath - Output file path
 * @param {string} languageCode - Language code (ar-XA or en-US)
 * @param {string} voiceName - Voice name (default: Aoede)
 */
async function ttsToFile(text, outPath, languageCode = 'en-US', voiceName = 'Aoede') {
  try {
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          },
          languageCode: languageCode,
        },
      },
    });

    const audioBase64 = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      throw new Error('No audio returned from Gemini TTS');
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    await ensureDir(path.dirname(outPath));
    await fs.writeFile(outPath, buffer);
    return true;
  } catch (error) {
    console.error(`  ⚠️  Failed to generate audio: ${error.message}`);
    return false;
  }
}

/**
 * Generate audio for all Arabic letters
 */
async function generateLetterAudio() {
  console.log('\n🎙️  Generating Arabic letter audio...');
  const lettersDir = path.join(root, 'public', 'assets', 'kids', 'audio', 'letters');
  await ensureDir(lettersDir);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (const letter of ARABIC_LETTERS) {
    // 1. Generate letter pronunciation (using Arabic name for better TTS)
    const letterPath = path.join(lettersDir, `letter-${letter.id}.mp3`);

    if (await fileExists(letterPath)) {
      console.log(`  ⏭️  Skipping ${letter.name} letter (already exists)`);
      skippedCount++;
    } else {
      console.log(`  Generating: ${letter.name} (${letter.arabicName})...`);

      // Use longer phrase for reliable TTS generation
      // Format: "هذا حرف [name]" = "This is letter [name]"
      const letterText = `هذا حرف ${letter.arabicName}`;
      const letterSuccess = await ttsToFile(
        letterText,
        letterPath,
        'ar-XA',
        'Aoede'
      );

      if (letterSuccess) {
        console.log(`    ✅ Letter audio -> ${path.basename(letterPath)}`);
        successCount++;
      } else {
        console.log(`    ❌ Letter audio failed`);
        failCount++;
      }

      // Rate limit between requests
      await delay(RATE_LIMIT_DELAY);
    }

    // 2. Generate letter with example word
    const examplePath = path.join(lettersDir, `letter-${letter.id}-example.mp3`);

    if (await fileExists(examplePath)) {
      console.log(`  ⏭️  Skipping ${letter.name} example (already exists)`);
      skippedCount++;
    } else {
      console.log(`  Generating: ${letter.name} example (${letter.example})...`);

      // Format: "حرف [name]، مثال: [example]" = "Letter [name], example: [word]"
      // Using longer phrase for reliable TTS generation
      const exampleText = `حرف ${letter.arabicName}. مثال: ${letter.example}.`;
      const exampleSuccess = await ttsToFile(
        exampleText,
        examplePath,
        'ar-XA',
        'Aoede'
      );

      if (exampleSuccess) {
        console.log(`    ✅ Example audio -> ${path.basename(examplePath)}`);
        successCount++;
      } else {
        console.log(`    ❌ Example audio failed`);
        failCount++;
      }

      // Rate limit between requests
      await delay(RATE_LIMIT_DELAY);
    }
  }

  console.log(`\n📊 Letter audio generation complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   📁 Total new files: ${successCount}`);
}

/**
 * Generate audio for kids stories
 */
async function generateStoriesAudio() {
  console.log('\n🎙️  Generating kids stories audio...');

  // Load stories from JSON
  const storiesPath = path.join(root, 'data', 'kidsStories.json');
  const storiesJSON = await fs.readFile(storiesPath, 'utf-8');
  const stories = JSON.parse(storiesJSON);

  const audioDir = path.join(root, 'public', 'assets', 'kids', 'audio');
  await ensureDir(audioDir);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (const story of stories) {
    console.log(`\n  📖 Story: ${story.prophet} (${story.prophetArabic})`);

    // Generate audio for each scene
    for (let i = 0; i < story.scenes.length; i++) {
      const scene = story.scenes[i];
      const sceneOutPath = path.join(audioDir, `story-${story.id}-scene-${i}.mp3`);

      if (await fileExists(sceneOutPath)) {
        console.log(`    ⏭️  Skipping scene ${i + 1} (already exists)`);
        skippedCount++;
        continue;
      }

      console.log(`    Scene ${i + 1}/${story.scenes.length}: "${scene.text.substring(0, 40)}..."`);

      const success = await ttsToFile(
        scene.text,
        sceneOutPath,
        'en-US',
        'Aoede'
      );

      if (success) {
        console.log(`      ✅ ${path.basename(sceneOutPath)}`);
        successCount++;
      } else {
        console.log(`      ❌ Failed to generate scene ${i} audio`);
        failCount++;
      }

      // Rate limit between requests
      await delay(RATE_LIMIT_DELAY);
    }

    // Generate audio for lesson
    const lessonOutPath = path.join(audioDir, `story-${story.id}-lesson.mp3`);

    if (await fileExists(lessonOutPath)) {
      console.log(`    ⏭️  Skipping lesson (already exists)`);
      skippedCount++;
      continue;
    }

    console.log(`    Lesson: "${story.lesson}"`);

    const lessonSuccess = await ttsToFile(
      story.lesson,
      lessonOutPath,
      'en-US',
      'Aoede'
    );

    if (lessonSuccess) {
      console.log(`      ✅ ${path.basename(lessonOutPath)}`);
      successCount++;
    } else {
      console.log(`      ❌ Failed to generate lesson audio`);
      failCount++;
    }

    // Rate limit: wait 1 second between stories
    await delay(RATE_LIMIT_DELAY);
  }

  console.log(`\n📊 Story audio generation complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   📁 Total new files: ${successCount}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🌟 Starting Kids Audio Prebaking...');
  console.log(`📁 Root directory: ${root}`);
  console.log(`🔑 Using API key: ${GEMINI_KEY.substring(0, 10)}...`);

  const startTime = Date.now();

  try {
    // Generate all letter audio (28 letters x 2 files each = 56 files)
    await generateLetterAudio();

    // Generate all story audio (5 stories with scenes + lessons)
    await generateStoriesAudio();

    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ All audio generation complete!');
    console.log(`⏱️  Total time: ${durationSec}s`);
    console.log(`📁 Audio files saved to: ${path.join(root, 'public', 'assets', 'kids', 'audio')}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Test the audio files by opening the app');
    console.log('   2. Verify all files play correctly in the kids mode');
    console.log('   3. Check file sizes and quality');

  } catch (error) {
    console.error('\n❌ Error during audio generation:');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
