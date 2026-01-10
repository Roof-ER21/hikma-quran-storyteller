#!/usr/bin/env node
/**
 * Generate Pre-loaded Adult Prophet Stories
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/generate-adult-stories.mjs
 *
 * Cost: ~$0.01-0.05 for all 24 stories using Gemini 2.5 Flash
 * Time: ~3-5 minutes with 2-second delays
 */

import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
  console.error('❌ Set GEMINI_API_KEY or VITE_GEMINI_API_KEY before running.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

// All 24 Prophets
const PROPHETS = [
  { id: 'adam', name: 'Adam', arabic: 'آدم', era: 'Beginning of Creation' },
  { id: 'idris', name: 'Idris', arabic: 'إدريس', era: 'Before the Flood' },
  { id: 'nuh', name: 'Nuh (Noah)', arabic: 'نوح', era: 'The Great Flood' },
  { id: 'hud', name: 'Hud', arabic: 'هود', era: 'People of Ad' },
  { id: 'saleh', name: 'Saleh', arabic: 'صالح', era: 'People of Thamud' },
  { id: 'ibrahim', name: 'Ibrahim (Abraham)', arabic: 'إبراهيم', era: 'Father of Prophets' },
  { id: 'lut', name: 'Lut (Lot)', arabic: 'لوط', era: 'Cities of Sin' },
  { id: 'ismail', name: 'Ismail (Ishmael)', arabic: 'إسماعيل', era: 'Sacrifice & Kaaba' },
  { id: 'ishaq', name: 'Ishaq (Isaac)', arabic: 'إسحاق', era: 'Blessed Lineage' },
  { id: 'yaqub', name: 'Yaqub (Jacob)', arabic: 'يعقوب', era: 'Father of Twelve' },
  { id: 'yusuf', name: 'Yusuf (Joseph)', arabic: 'يوسف', era: 'Egypt' },
  { id: 'ayyub', name: 'Ayyub (Job)', arabic: 'أيوب', era: 'Patience & Trial' },
  { id: 'shuaib', name: "Shu'aib", arabic: 'شعيب', era: 'People of Madyan' },
  { id: 'musa', name: 'Musa (Moses)', arabic: 'موسى', era: 'Egypt & Exodus' },
  { id: 'harun', name: 'Harun (Aaron)', arabic: 'هارون', era: 'Egypt & Exodus' },
  { id: 'dhulkifl', name: 'Dhul-Kifl', arabic: 'ذو الكفل', era: 'Iraq/Syria' },
  { id: 'dawud', name: 'Dawud (David)', arabic: 'داوود', era: 'Kingdom of Israel' },
  { id: 'sulaiman', name: 'Sulaiman (Solomon)', arabic: 'سليمان', era: 'Kingdom of Israel' },
  { id: 'ilyas', name: 'Ilyas (Elijah)', arabic: 'إلياس', era: 'Baal Worship' },
  { id: 'alyasa', name: 'Al-Yasa (Elisha)', arabic: 'اليسع', era: 'After Ilyas' },
  { id: 'yunus', name: 'Yunus (Jonah)', arabic: 'يونس', era: 'Nineveh' },
  { id: 'zakariya', name: 'Zakariya (Zechariah)', arabic: 'زكريا', era: 'Before Isa' },
  { id: 'yahya', name: 'Yahya (John)', arabic: 'يحيى', era: 'Before Isa' },
  { id: 'isa', name: 'Isa (Jesus)', arabic: 'عيسى', era: 'Palestine' },
];

const STORY_PROMPT = (prophet) => `You are an Islamic scholar and master storyteller. Generate a beautifully written story about Prophet ${prophet.name} (${prophet.arabic}) that is:

1. Deeply rooted in Quran and authentic Hadith
2. Written for adult Muslim readers seeking spiritual connection
3. Engaging narrative style with vivid imagery
4. 8-10 scenes that flow naturally
5. Each scene should reference relevant Quran verses where applicable

Return a JSON object with this EXACT structure (no markdown, just pure JSON):
{
  "id": "${prophet.id}",
  "prophet": "${prophet.name}",
  "prophetArabic": "${prophet.arabic}",
  "title": "An evocative title for the story",
  "titleArabic": "العنوان بالعربية",
  "theme": "Main spiritual theme (e.g., Patience, Faith, Repentance)",
  "estimatedReadTime": 8,
  "scenes": [
    {
      "sceneTitle": "Scene title",
      "text": "Full scene text (2-3 paragraphs, rich and detailed)",
      "quranReference": "Surah Name X:Y (if applicable, otherwise null)"
    }
  ],
  "keyLessons": [
    "First spiritual lesson from this prophet's story",
    "Second lesson",
    "Third lesson"
  ],
  "relatedVerses": ["2:30-39", "7:11-25"]
}

Important:
- Make the story deeply spiritual and reflective
- Include actual Quran verse references (Surah:Ayah format)
- The narrative should move the heart and inspire faith
- Scenes should be substantial (2-3 paragraphs each)
- Use "peace be upon him" naturally in the text
- Return ONLY valid JSON, no markdown code blocks`;

async function generateStory(prophet) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: STORY_PROMPT(prophet),
    config: {
      temperature: 0.8,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json'
    }
  });

  const text = response.text;

  if (!text) {
    throw new Error('No text in Gemini response');
  }

  // Parse JSON (handle potential markdown wrapping)
  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
  }

  return JSON.parse(jsonText);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🕌 Generating Adult Prophet Stories');
  console.log('━'.repeat(50));
  console.log(`📚 ${PROPHETS.length} prophets to generate`);
  console.log(`💰 Estimated cost: ~$0.02-0.05`);
  console.log(`⏱️  Estimated time: ~3-5 minutes`);
  console.log('━'.repeat(50));

  const stories = [];
  const errors = [];

  for (let i = 0; i < PROPHETS.length; i++) {
    const prophet = PROPHETS[i];
    const progress = `[${i + 1}/${PROPHETS.length}]`;

    console.log(`\n${progress} Generating story for ${prophet.name} (${prophet.arabic})...`);

    try {
      const story = await generateStory(prophet);
      stories.push(story);
      console.log(`   ✅ "${story.title}" - ${story.scenes?.length || 0} scenes`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      errors.push({ prophet: prophet.name, error: error.message });
    }

    // Delay between requests to avoid rate limits
    if (i < PROPHETS.length - 1) {
      console.log(`   ⏳ Waiting 2 seconds...`);
      await delay(2000);
    }
  }

  // Save to file
  const outputPath = path.join(__dirname, '..', 'data', 'adultStoriesPreloaded.json');
  fs.writeFileSync(outputPath, JSON.stringify(stories, null, 2), 'utf-8');

  console.log('\n' + '━'.repeat(50));
  console.log(`✅ Generated ${stories.length}/${PROPHETS.length} stories`);
  console.log(`📁 Saved to: data/adultStoriesPreloaded.json`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors:`);
    errors.forEach(e => console.log(`   - ${e.prophet}: ${e.error}`));
  }

  console.log('\n🎉 Done!');
}

main().catch(console.error);
