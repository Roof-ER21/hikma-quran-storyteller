/**
 * Prebake audio for Prophet Stories Library (Adults section)
 *
 * Generates narration audio for:
 * - Section content (116 sections)
 * - Hadith references (35 hadiths)
 *
 * Uses Gemini TTS with "Charon" voice for scholarly, reverent narration.
 *
 * Usage:
 *   VITE_GEMINI_API_KEY=your_key node scripts/prebake-prophet-audio.mjs
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

// Scholarly voice for adult content
const SCHOLAR_VOICE = 'Charon';
const RATE_LIMIT_DELAY = 500; // ms between requests

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate TTS audio and save to file
 */
async function ttsToFile(text, outPath, voiceName = SCHOLAR_VOICE, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Truncate text if too long (Gemini has limits)
      const truncatedText = text.length > 4000 ? text.slice(0, 4000) + '...' : text;

      const res = await genai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: truncatedText }] }],
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
      return true;
    } catch (error) {
      console.error(`  ⚠️  Attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        await sleep(2000 * attempt); // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

/**
 * Read prophet stories from JSON
 */
async function readProphetStories() {
  const dataPath = path.join(root, 'public', 'data', 'prophetStoriesAdults.json');
  const json = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(json);
}

/**
 * Format hadith for narration
 */
function formatHadithNarration(hadith) {
  const gradeNote = hadith.grade ? ` This hadith is graded ${hadith.grade}.` : '';
  return `As narrated in ${hadith.source}, ${hadith.book}: "${hadith.text}"${gradeNote}`;
}

/**
 * Generate all prophet story audio
 */
async function generateProphetAudio() {
  console.log('🎙️  Prophet Stories Audio Generator');
  console.log('====================================\n');

  const stories = await readProphetStories();

  // Calculate totals
  let totalSections = 0;
  let totalHadiths = 0;
  for (const story of stories) {
    totalSections += story.sections.length;
    for (const section of story.sections) {
      totalHadiths += section.hadiths?.length || 0;
    }
  }

  console.log(`📊 Stats:`);
  console.log(`   Prophets: ${stories.length}`);
  console.log(`   Sections: ${totalSections}`);
  console.log(`   Hadiths: ${totalHadiths}`);
  console.log(`   Total files: ${totalSections + totalHadiths}\n`);

  const sectionsDir = path.join(root, 'public', 'assets', 'prophets', 'audio', 'sections');
  const hadithsDir = path.join(root, 'public', 'assets', 'prophets', 'audio', 'hadiths');

  await ensureDir(sectionsDir);
  await ensureDir(hadithsDir);

  let completed = 0;
  let errors = [];

  console.log('🔊 Generating section audio...\n');

  for (const story of stories) {
    console.log(`📖 ${story.prophetName} (${story.arabicName})`);

    for (const section of story.sections) {
      const sectionFile = path.join(sectionsDir, `${story.id}-${section.id}.mp3`);

      // Check if already exists
      try {
        await fs.access(sectionFile);
        console.log(`   ⏭️  ${section.id} (exists)`);
        completed++;
        continue;
      } catch {
        // File doesn't exist, generate it
      }

      try {
        await ttsToFile(section.content, sectionFile);
        completed++;
        console.log(`   ✅ ${section.id}`);
      } catch (error) {
        errors.push(`${story.id}-${section.id}`);
        console.log(`   ❌ ${section.id}: ${error.message}`);
      }

      await sleep(RATE_LIMIT_DELAY);

      // Generate hadith audio
      if (section.hadiths && section.hadiths.length > 0) {
        for (let i = 0; i < section.hadiths.length; i++) {
          const hadith = section.hadiths[i];
          const hadithFile = path.join(hadithsDir, `${story.id}-${section.id}-hadith-${i}.mp3`);

          // Check if already exists
          try {
            await fs.access(hadithFile);
            console.log(`      ⏭️  hadith-${i} (exists)`);
            completed++;
            continue;
          } catch {
            // File doesn't exist, generate it
          }

          try {
            const hadithText = formatHadithNarration(hadith);
            await ttsToFile(hadithText, hadithFile);
            completed++;
            console.log(`      ✅ hadith-${i}`);
          } catch (error) {
            errors.push(`${story.id}-${section.id}-hadith-${i}`);
            console.log(`      ❌ hadith-${i}: ${error.message}`);
          }

          await sleep(RATE_LIMIT_DELAY);
        }
      }
    }

    console.log('');
  }

  console.log('====================================');
  console.log(`✅ Completed: ${completed}/${totalSections + totalHadiths}`);
  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    console.log('   Failed items:', errors.join(', '));
  }

  // Calculate approximate size
  try {
    const sectionFiles = await fs.readdir(sectionsDir);
    const hadithFiles = await fs.readdir(hadithsDir);
    let totalSize = 0;

    for (const file of sectionFiles) {
      const stat = await fs.stat(path.join(sectionsDir, file));
      totalSize += stat.size;
    }
    for (const file of hadithFiles) {
      const stat = await fs.stat(path.join(hadithsDir, file));
      totalSize += stat.size;
    }

    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`📦 Total size: ${sizeMB} MB`);
  } catch {
    // Ignore size calculation errors
  }

  console.log('\n🎉 Done!\n');
}

// Run
generateProphetAudio().catch(console.error);
