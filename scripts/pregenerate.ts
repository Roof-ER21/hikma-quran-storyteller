/**
 * Pre-generation Script for Hikma Kids Content
 *
 * Run with: npx tsx scripts/pregenerate.ts
 *
 * This script pre-generates and caches:
 * - Kids narrations (Gemini TTS)
 * - Kids illustrations (Gemini Image Gen)
 * - Saves to public/assets/kids/ for static serving
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Load environment
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not set. Run: export GEMINI_API_KEY=your_key');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Output directories
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'assets', 'kids');
const NARRATIONS_DIR = path.join(OUTPUT_DIR, 'narrations');
const ILLUSTRATIONS_DIR = path.join(OUTPUT_DIR, 'illustrations');

// Ensure directories exist
[OUTPUT_DIR, NARRATIONS_DIR, ILLUSTRATIONS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created: ${dir}`);
  }
});

// ============================================
// STORY NARRATIONS
// ============================================

const STORY_NARRATIONS: Record<string, { scenes: string[]; lesson: string }> = {
  adam: {
    scenes: [
      "A long, long time ago, before there were any people, Allah created the very first human being. His name was Adam, and Allah made him from clay with His own hands. Isn't that amazing?",
      "Allah placed Adam in a beautiful garden called Jannah - Paradise! It had sparkling rivers, the sweetest fruits, and flowers of every color. Adam could eat anything he wanted, except from one special tree.",
      "The angels came down and said 'Assalamu Alaikum' - peace be upon you - to Adam! They bowed down to him because Allah told them to. Adam was very special to Allah.",
      "Adam felt a little lonely, so Allah created Hawwa to be his friend and wife. Together they were so happy in the beautiful garden, thanking Allah for everything!"
    ],
    lesson: "Allah made each of us special, just like He made Adam. We should always be thankful for Allah's gifts!"
  },
  nuh: {
    scenes: [
      "Prophet Nuh was a very kind and patient man who loved Allah with all his heart. He told people to be good and worship only Allah, but many didn't listen.",
      "Allah told Nuh a special secret: 'Build a big, big boat!' Nuh worked hard every day, hammering and sawing, even when people laughed at him. He trusted Allah's plan!",
      "When the boat was ready, something magical happened! Animals came from everywhere - two lions walking side by side, two elephants holding trunks, two colorful birds flying together. They all got on the boat!",
      "Rain fell and fell, but everyone on the boat was safe and cozy. Allah protected them! When the water went away, a beautiful rainbow appeared in the sky - Allah's promise of safety!"
    ],
    lesson: "When we trust Allah and are patient like Prophet Nuh, Allah will always protect us!"
  },
  ibrahim: {
    scenes: [
      "Young Ibrahim loved looking up at the night sky. He saw the twinkling stars and the glowing moon and wondered, 'Who made all these beautiful things?' He wanted to find the answer!",
      "Ibrahim was very smart. He knew that stars go away, the moon disappears, and even the sun sets. But Allah never goes away! Allah is always there, taking care of everything.",
      "Ibrahim loved Allah so much that Allah called him 'Khalilullah' - the friend of Allah! Imagine being best friends with Allah! Ibrahim showed us how to have a heart full of love for our Creator.",
      "Ibrahim and his son Ismail built the Kaaba together - the special cube-shaped building that Muslims face when they pray. They worked as a team, making something beautiful for Allah!"
    ],
    lesson: "Like Ibrahim, we can use our minds to learn about Allah. Allah loves those who think and wonder about His creation!"
  },
  musa: {
    scenes: [
      "Baby Musa's mommy loved him so much! But a mean king wanted to hurt baby boys, so Allah told her to put baby Musa in a little basket and let it float gently down the river. Allah would keep him safe!",
      "Guess who found the basket? A princess! She looked inside and saw the cutest baby with big bright eyes. 'Oh, what a beautiful baby!' she said. She decided to take care of him in the palace!",
      "Musa grew up big and strong. One day, Allah spoke to him from a burning bush that wasn't really burning! Allah gave Musa a special job - to help free people who were being treated unfairly.",
      "With Allah's help, Musa did something incredible! He raised his staff, and the sea split in two, making a path right through the middle! Everyone walked through safely. SubhanAllah - glory to Allah!"
    ],
    lesson: "Allah protected baby Musa and made him a great prophet. Allah always has a wonderful plan for those who trust Him!"
  },
  yusuf: {
    scenes: [
      "Little Yusuf had the most amazing dreams! One night, he dreamed that eleven stars, the sun, and the moon were all bowing down to him. His father Yaqub knew this meant Yusuf was very special to Allah.",
      "But Yusuf's brothers were jealous and did something very mean - they put him in a deep, dark well. Poor Yusuf! But even there, he didn't cry. He prayed to Allah and trusted that everything would be okay.",
      "Some travelers found Yusuf and took him to Egypt. Even when hard things happened, Yusuf always did what was right. He was honest, kind, and patient. He never forgot Allah, and Allah never forgot him!",
      "Allah's plan was amazing! Yusuf became a wise leader who helped save everyone during a time when food was hard to find. Even his brothers came to him, and Yusuf forgave them with a big smile!"
    ],
    lesson: "Like Yusuf, when we stay patient and kind even when things are hard, Allah will always help us in the end!"
  }
};

// ============================================
// CELEBRATION & ENCOURAGEMENT PHRASES
// ============================================

const CELEBRATION_PHRASES = [
  "MashaAllah! You did it!",
  "SubhanAllah! That was amazing!",
  "Wonderful job! Allah is happy with you!",
  "You're a superstar! Keep learning!",
  "Excellent! You earned a star!",
  "Alhamdulillah! Great work!",
];

const ENCOURAGEMENT_PHRASES = [
  "Try again! You can do it!",
  "Almost there! Keep going!",
  "Don't give up! Allah loves those who try!",
  "You're doing great! One more time!",
];

// ============================================
// ILLUSTRATION PROMPTS (Simplified for speed)
// ============================================

const KIDS_ILLUSTRATION_STYLE = `
  Art style: Modern children's book illustration, similar to Pixar concept art.
  Colors: Vibrant, warm palette with soft gradients.
  Age-appropriate: Designed for ages 3-6, nothing scary.
  NO text, NO words in the image.
  NO depiction of prophets or religious figures.
`;

const STORY_ILLUSTRATIONS: Record<string, string[]> = {
  adam: [
    `A beautiful paradise garden with crystal clear rivers, colorful fruit trees, butterflies and flowers. ${KIDS_ILLUSTRATION_STYLE}`,
    `Pairs of cute friendly animals - lions, elephants, birds, rabbits - in a peaceful garden. ${KIDS_ILLUSTRATION_STYLE}`,
  ],
  nuh: [
    `A large wooden ark boat being built on green hills, blue sky, birds watching. ${KIDS_ILLUSTRATION_STYLE}`,
    `Pairs of adorable animals walking toward a wooden ark - lions, elephants, giraffes, birds. ${KIDS_ILLUSTRATION_STYLE}`,
  ],
  ibrahim: [
    `A vast desert under a spectacular night sky with thousands of twinkling stars and crescent moon. ${KIDS_ILLUSTRATION_STYLE}`,
    `The Kaaba as a simple beautiful cube structure with mountains in background. ${KIDS_ILLUSTRATION_STYLE}`,
  ],
  musa: [
    `A beautiful woven basket floating gently on a calm river surrounded by lotus flowers. ${KIDS_ILLUSTRATION_STYLE}`,
    `A miraculous path through the sea with walls of sparkling water on each side. ${KIDS_ILLUSTRATION_STYLE}`,
  ],
  yusuf: [
    `A magical dream scene with eleven golden stars, crescent moon, and sun in night sky. ${KIDS_ILLUSTRATION_STYLE}`,
    `A beautiful rainbow-colored coat draped on a wooden chair, golden sunlight. ${KIDS_ILLUSTRATION_STYLE}`,
  ],
};

// ============================================
// GENERATION FUNCTIONS
// ============================================

async function generateNarration(text: string, filename: string): Promise<boolean> {
  const filepath = path.join(NARRATIONS_DIR, `${filename}.txt`);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  Skipping (exists): ${filename}`);
    return true;
  }

  try {
    // For now, save the text content (TTS requires browser environment)
    // We'll use the text for Web Speech API or Gemini TTS in browser
    fs.writeFileSync(filepath, text);
    console.log(`✅ Saved narration: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${filename}`, error);
    return false;
  }
}

async function generateIllustration(prompt: string, filename: string): Promise<boolean> {
  const filepath = path.join(ILLUSTRATIONS_DIR, `${filename}.png`);

  // Skip if already exists
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  Skipping (exists): ${filename}`);
    return true;
  }

  try {
    console.log(`🎨 Generating: ${filename}...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [{ text: `Generate an image: ${prompt}` }]
      }],
      config: {
        responseModalities: ['image', 'text'],
      }
    });

    // Check for image in response
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const imageData = Buffer.from(part.inlineData.data, 'base64');
        fs.writeFileSync(filepath, imageData);
        console.log(`✅ Saved illustration: ${filename}`);
        return true;
      }
    }

    console.log(`⚠️  No image in response for: ${filename}`);
    return false;
  } catch (error: any) {
    console.error(`❌ Failed: ${filename}`, error.message || error);
    return false;
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n🚀 HIKMA KIDS CONTENT PRE-GENERATION\n');
  console.log('=' .repeat(50));

  let narrationCount = 0;
  let illustrationCount = 0;
  let errors = 0;

  // 1. Generate Story Narrations (text files)
  console.log('\n📖 STORY NARRATIONS\n');
  for (const [storyId, story] of Object.entries(STORY_NARRATIONS)) {
    for (let i = 0; i < story.scenes.length; i++) {
      const success = await generateNarration(story.scenes[i], `story-${storyId}-scene-${i}`);
      if (success) narrationCount++;
      else errors++;
    }
    // Generate lesson
    const lessonSuccess = await generateNarration(story.lesson, `story-${storyId}-lesson`);
    if (lessonSuccess) narrationCount++;
    else errors++;
  }

  // 2. Generate Celebration/Encouragement phrases
  console.log('\n🎉 FEEDBACK PHRASES\n');
  for (let i = 0; i < CELEBRATION_PHRASES.length; i++) {
    const success = await generateNarration(CELEBRATION_PHRASES[i], `celebration-${i}`);
    if (success) narrationCount++;
    else errors++;
  }
  for (let i = 0; i < ENCOURAGEMENT_PHRASES.length; i++) {
    const success = await generateNarration(ENCOURAGEMENT_PHRASES[i], `encouragement-${i}`);
    if (success) narrationCount++;
    else errors++;
  }

  // 3. Generate Illustrations
  console.log('\n🎨 ILLUSTRATIONS\n');
  for (const [storyId, prompts] of Object.entries(STORY_ILLUSTRATIONS)) {
    for (let i = 0; i < prompts.length; i++) {
      const success = await generateIllustration(prompts[i], `story-${storyId}-${i}`);
      if (success) illustrationCount++;
      else errors++;

      // Rate limiting
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 GENERATION COMPLETE\n');
  console.log(`✅ Narrations saved: ${narrationCount}`);
  console.log(`✅ Illustrations saved: ${illustrationCount}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`\n📁 Output: ${OUTPUT_DIR}`);
  console.log('=' .repeat(50) + '\n');
}

main().catch(console.error);
