#!/usr/bin/env node
/**
 * Translate preloaded adult stories to Arabic using Gemini.
 * Adds `themeArabic`, `keyLessonsArabic`, and per-scene `sceneTitleArabic`/`textArabic`.
 *
 * Requirements:
 * - Set GEMINI_API_KEY in the environment.
 * - Node 18+ (fetch available globally).
 *
 * The script writes back to data/adultStoriesPreloaded.json after translation.
 */

import fs from 'fs';
import path from 'path';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY. Set it and rerun.');
  process.exit(1);
}

const MODEL = 'claude-3-haiku-20240307';
const INPUT_PATH = path.join(process.cwd(), 'data', 'adultStoriesPreloaded.json');
const stories = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function callClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: 'High-fidelity Arabic translation. Preserve meaning and structure; no additions.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text?.trim() || '';
}

async function translateText(text) {
  const prompt = `
ترجم النص التالي إلى العربية الفصحى الحديثة بدقة تامة دون أي إضافة أو حذف أو شرح. أعد النص المترجم فقط.

النص:
${text}
`.trim();
  return callClaude(prompt);
}

async function translateLessons(lessons) {
  const results = [];
  for (const lesson of lessons) {
    results.push(await translateText(lesson));
    await sleep(200);
  }
  return results;
}

async function translateScene(scene) {
  return {
    sceneTitleArabic: await translateText(scene.sceneTitle),
    textArabic: await translateText(scene.text),
  };
}

async function translateStory(story) {
  const themeArabic = await translateText(story.theme);
  const keyLessonsArabic = await translateLessons(story.keyLessons || []);

  const translatedScenes = [];
  for (const scene of story.scenes) {
    translatedScenes.push(await translateScene(scene));
    await sleep(400); // small delay between scene calls
  }

  return { themeArabic, keyLessonsArabic, scenesArabic: translatedScenes };
}

async function run() {
  console.log(`Translating ${stories.length} stories...`);
  for (const story of stories) {
    console.log(`→ ${story.id}`);
    try {
      const translated = await translateStory(story);
      story.themeArabic = translated.themeArabic || story.themeArabic;
      story.keyLessonsArabic = translated.keyLessonsArabic || [];
      if (translated.scenesArabic?.length === story.scenes.length) {
        story.scenes = story.scenes.map((scene, idx) => ({
          ...scene,
          sceneTitleArabic: translated.scenesArabic[idx]?.sceneTitleArabic || scene.sceneTitleArabic,
          textArabic: translated.scenesArabic[idx]?.textArabic || scene.textArabic,
        }));
      }
    } catch (err) {
      console.error(`Translation failed for ${story.id}:`, err.message);
    }
    await sleep(800);
  }

  fs.writeFileSync(INPUT_PATH, JSON.stringify(stories, null, 2), 'utf8');
  console.log('Done. Updated data/adultStoriesPreloaded.json');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
