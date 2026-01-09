/**
 * Narration Service - Gemini TTS Primary
 *
 * Inspired by top-rated Islamic kids apps:
 * - Hakma: Vibrant storytelling with moral lessons
 * - Muslim Kids TV: Engaging animations and warm narration
 * - My Quran Journey: Interactive, multi-sensory learning
 *
 * Uses Gemini TTS for child-friendly, warm narration.
 */

// ============================================
// Types
// ============================================

export interface NarrationConfig {
  voice?: string;
  speed?: number; // 0.5-2.0
  language?: 'en' | 'ar';
  style?: 'storytelling' | 'educational' | 'playful';
}

export interface GeneratedAudio {
  url: string; // Data URL or blob URL
  duration: number; // seconds
  cached: boolean;
}

export interface BatchProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

// ============================================
// Gemini TTS Configuration
// ============================================

// Voice options for different content types
// Gemini voices: Aoede (warm), Charon (calm), Fenrir (friendly), Kore (gentle)
const GEMINI_VOICES = {
  storytelling: 'Aoede',    // Warm, perfect for stories
  educational: 'Kore',      // Gentle, good for teaching
  playful: 'Puck',          // Energetic for games/rewards
  arabic: 'Aoede',          // Clear for Arabic sounds
};

// ============================================
// Enhanced Story Narrations
// Inspired by Goodnight Stories from the Quran style
// ============================================

export const STORY_NARRATIONS: Record<string, { scenes: string[]; lesson: string }> = {
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
// Enhanced Arabic Letter Pronunciations
// Engaging, educational style like Noorani Qaida apps
// ============================================

export const LETTER_PRONUNCIATIONS: Record<string, { text: string; example: string; funFact: string }> = {
  alif: {
    text: "This is Alif! It's the first letter. Say 'Ahhh' like when you open your mouth for the doctor. Alif makes the 'ah' sound.",
    example: "Alif is in Allah - the most beautiful name!",
    funFact: "Alif stands tall and straight, like a brave soldier!"
  },
  baa: {
    text: "This is Baa! Put your lips together and say 'Buh'. The dot goes underneath, like a little ball bouncing below!",
    example: "Baa is in Bismillah - what we say before eating!",
    funFact: "Baa looks like a boat with a dot underneath!"
  },
  taa: {
    text: "This is Taa! Touch your tongue to the top of your mouth and say 'Tuh'. It has two dots on top like eyes!",
    example: "Taa is in Taqwa - being close to Allah!",
    funFact: "Taa looks like a smile with two dots!"
  },
  thaa: {
    text: "This is Thaa! Put your tongue between your teeth and blow softly - 'Thhhh'. Three dots on top!",
    example: "Thaa is in Thawaab - the rewards we get for good deeds!",
    funFact: "Thaa has three dots, like three little stars!"
  },
  jeem: {
    text: "This is Jeem! Say 'Juh' like in 'jump'! The dot goes in the middle, like a treasure hidden inside.",
    example: "Jeem is in Jannah - Paradise, our beautiful home!",
    funFact: "Jeem looks like a little house with a dot inside!"
  },
  haa: {
    text: "This is Haa! Breathe out gently and say 'Huh' from your throat. No dots - it's clean and simple!",
    example: "Haa is in Hamd - praising Allah!",
    funFact: "Haa looks like a fancy loop!"
  },
  khaa: {
    text: "This is Khaa! Make a scratchy sound from the back of your throat - 'Khuh'. One dot on top!",
    example: "Khaa is in Khair - goodness!",
    funFact: "Khaa is Haa's twin but with a dot hat!"
  },
  dal: {
    text: "This is Dal! Say 'Duh' like in 'duck'. It looks like a little slide going down!",
    example: "Dal is in Deen - our beautiful way of life!",
    funFact: "Dal is short and sweet, like a little wave!"
  },
  thal: {
    text: "This is Thal! Put your tongue out a tiny bit and say 'Thuh'. It has one dot on top!",
    example: "Thal is in Dhikr - remembering Allah!",
    funFact: "Thal is Dal wearing a little dot crown!"
  },
  raa: {
    text: "This is Raa! Roll your tongue and say 'Rrr' like a little motor. It looks like Dal but dips below!",
    example: "Raa is in Rahman - the Most Merciful!",
    funFact: "Raa goes down below the line, like diving into water!"
  },
  zay: {
    text: "This is Zay! Say 'Zzzz' like a buzzing bee! It has a dot on top!",
    example: "Zay is in Zakat - sharing with others!",
    funFact: "Zay buzzes like a happy little bee!"
  },
  seen: {
    text: "This is Seen! Say 'Sss' like a snake. It has three little bumps like mountains!",
    example: "Seen is in Salam - peace!",
    funFact: "Seen looks like three little hills in a row!"
  },
  sheen: {
    text: "This is Sheen! Say 'Shhh' like you're telling a secret! Three dots on top of the mountains!",
    example: "Sheen is in Shukr - being thankful!",
    funFact: "Sheen is Seen wearing three dot stars!"
  },
  saad: {
    text: "This is Saad! Say 'Ssss' but make your mouth round and heavy. It's a special strong S!",
    example: "Saad is in Salah - our prayers!",
    funFact: "Saad has a loop like a little hug!"
  },
  daad: {
    text: "This is Daad! Say 'Duh' but heavy and strong. One dot on top! This letter is only in Arabic!",
    example: "Daad is in Diya - light!",
    funFact: "Arabic is called the language of Daad!"
  },
  taa2: {
    text: "This is Taa - the strong one! Say 'Tuh' with your mouth round. It's a powerful T!",
    example: "Taa is in Taahir - pure and clean!",
    funFact: "This Taa is bigger and stronger than the first one!"
  },
  thaa2: {
    text: "This is Thaa - the strong one! Say 'Thuh' with power. One dot on top!",
    example: "Thaa is in Thulm - which means we should never be unfair!",
    funFact: "This is the strong cousin of the soft Thaa!"
  },
  ayn: {
    text: "This is Ayn! This special sound comes from deep in your throat. Say 'Aaa' but squeeze it tight!",
    example: "Ayn is in Ilm - knowledge!",
    funFact: "Ayn looks like a little eye!"
  },
  ghayn: {
    text: "This is Ghayn! Make a gargling sound from your throat - 'Ghuh'. One dot on top!",
    example: "Ghayn is in Ghafoor - Allah is forgiving!",
    funFact: "Ghayn is Ayn wearing a dot hat!"
  },
  faa: {
    text: "This is Faa! Say 'Fuh' with your top teeth on your bottom lip. One dot on top!",
    example: "Faa is in Fajr - the beautiful morning prayer!",
    funFact: "Faa has a curly tail like a happy puppy!"
  },
  qaaf: {
    text: "This is Qaaf! Say 'Kuh' but from way back in your throat. Two dots on top!",
    example: "Qaaf is in Quran - Allah's special book!",
    funFact: "Qaaf starts the word Quran - how special!"
  },
  kaaf: {
    text: "This is Kaaf! Say 'Kuh' like in 'kite'. It looks like a little hand!",
    example: "Kaaf is in Kaaba - the special house of Allah!",
    funFact: "Kaaf has a little mark inside like a hamza!"
  },
  laam: {
    text: "This is Laam! Say 'Luh' with your tongue at the top of your mouth. It's tall and proud!",
    example: "Laam is in La ilaha illallah - there is no god but Allah!",
    funFact: "Laam stands tall like a tree reaching for the sky!"
  },
  meem: {
    text: "This is Meem! Close your lips and hum - 'Mmm'. It's round like a little circle!",
    example: "Meem is in Muhammad - our beloved Prophet!",
    funFact: "Meem looks like a full moon!"
  },
  noon: {
    text: "This is Noon! Say 'Nuh' with your tongue at the top. One dot on top of the bowl shape!",
    example: "Noon is in Noor - beautiful light!",
    funFact: "Noon looks like a boat with a dot captain!"
  },
  haa2: {
    text: "This is Haa! Breathe out softly - 'Huh'. It's gentle and quiet at the end of words!",
    example: "Haa is at the end of Allah!",
    funFact: "This Haa is small and gentle!"
  },
  waw: {
    text: "This is Waw! Round your lips and say 'Wuh' like 'wow'. It looks like a hook!",
    example: "Waw is in Wudu - how we clean before prayer!",
    funFact: "Waw has a long tail going down!"
  },
  yaa: {
    text: "This is Yaa! Say 'Yuh' like in 'yes'. Two dots go underneath!",
    example: "Yaa is in Yawm - which means day!",
    funFact: "Yaa has dots underneath like buried treasure!"
  }
};

// ============================================
// Short fun phrases for rewards/celebrations
// ============================================

export const CELEBRATION_PHRASES = [
  "MashaAllah! You did it!",
  "SubhanAllah! That was amazing!",
  "Wonderful job! Allah is happy with you!",
  "You're a superstar! Keep learning!",
  "Excellent! You earned a star!",
  "Alhamdulillah! Great work!",
  "You're getting so smart! MashaAllah!",
  "Fantastic! You make Allah proud!",
];

export const ENCOURAGEMENT_PHRASES = [
  "Try again! You can do it!",
  "Almost there! Keep going!",
  "Don't give up! Allah loves those who try!",
  "You're doing great! One more time!",
];

// ============================================
// Gemini TTS Integration
// ============================================

/**
 * Generate narration using Gemini TTS
 */
export async function generateGeminiNarration(
  text: string,
  config: NarrationConfig = {}
): Promise<GeneratedAudio | null> {
  try {
    const { speakText } = await import('./geminiService');

    const audioBuffer = await speakText(text);
    if (!audioBuffer) return null;

    // Convert AudioBuffer to blob URL
    const wavData = audioBufferToWav(audioBuffer);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    return {
      url,
      duration: audioBuffer.duration,
      cached: false,
    };
  } catch (error) {
    console.error('Gemini narration error:', error);
    return null;
  }
}

/**
 * Convert AudioBuffer to WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write audio data
  const offset = 44;
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
  }

  return arrayBuffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ============================================
// Content Generation Functions
// ============================================

/**
 * Generate narration for a story scene
 */
export async function generateStorySceneNarration(
  storyId: string,
  sceneIndex: number
): Promise<GeneratedAudio | null> {
  const story = STORY_NARRATIONS[storyId];
  if (!story || sceneIndex >= story.scenes.length) return null;

  return generateGeminiNarration(story.scenes[sceneIndex], { style: 'storytelling' });
}

/**
 * Generate the lesson narration for a story
 */
export async function generateStoryLessonNarration(
  storyId: string
): Promise<GeneratedAudio | null> {
  const story = STORY_NARRATIONS[storyId];
  if (!story) return null;

  return generateGeminiNarration(story.lesson, { style: 'educational' });
}

/**
 * Generate pronunciation for an Arabic letter
 */
export async function generateLetterPronunciation(
  letterId: string
): Promise<GeneratedAudio | null> {
  const letter = LETTER_PRONUNCIATIONS[letterId];
  if (!letter) return null;

  // Combine the pronunciation text with the example
  const fullText = `${letter.text} ${letter.example}`;
  return generateGeminiNarration(fullText, { style: 'educational' });
}

/**
 * Generate a celebration phrase
 */
export async function generateCelebration(): Promise<GeneratedAudio | null> {
  const phrase = CELEBRATION_PHRASES[Math.floor(Math.random() * CELEBRATION_PHRASES.length)];
  return generateGeminiNarration(phrase, { style: 'playful' });
}

/**
 * Generate an encouragement phrase
 */
export async function generateEncouragement(): Promise<GeneratedAudio | null> {
  const phrase = ENCOURAGEMENT_PHRASES[Math.floor(Math.random() * ENCOURAGEMENT_PHRASES.length)];
  return generateGeminiNarration(phrase, { style: 'playful' });
}

// ============================================
// Batch Generation for Pre-deployment
// ============================================

/**
 * Pre-generate all narrations
 */
export async function preGenerateAllNarrations(
  onProgress?: (progress: BatchProgress) => void
): Promise<Map<string, GeneratedAudio>> {
  const results = new Map<string, GeneratedAudio>();
  const errors: string[] = [];

  // Count total items
  const storyScenes = Object.entries(STORY_NARRATIONS).reduce(
    (sum, [_, story]) => sum + story.scenes.length + 1, 0 // +1 for lesson
  );
  const letterCount = Object.keys(LETTER_PRONUNCIATIONS).length;
  const celebrationCount = CELEBRATION_PHRASES.length;
  const encouragementCount = ENCOURAGEMENT_PHRASES.length;

  const total = storyScenes + letterCount + celebrationCount + encouragementCount;
  let completed = 0;

  // Generate story narrations
  for (const [storyId, story] of Object.entries(STORY_NARRATIONS)) {
    // Generate each scene
    for (let i = 0; i < story.scenes.length; i++) {
      onProgress?.({
        total,
        completed,
        current: `Story: ${storyId} scene ${i + 1}`,
        errors,
      });

      try {
        const audio = await generateStorySceneNarration(storyId, i);
        if (audio) {
          results.set(`story-${storyId}-scene-${i}`, audio);
        }
      } catch (e) {
        errors.push(`story-${storyId}-scene-${i}`);
      }
      completed++;
      await sleep(300); // Rate limiting
    }

    // Generate lesson
    onProgress?.({
      total,
      completed,
      current: `Story: ${storyId} lesson`,
      errors,
    });

    try {
      const audio = await generateStoryLessonNarration(storyId);
      if (audio) {
        results.set(`story-${storyId}-lesson`, audio);
      }
    } catch (e) {
      errors.push(`story-${storyId}-lesson`);
    }
    completed++;
    await sleep(300);
  }

  // Generate letter pronunciations
  for (const letterId of Object.keys(LETTER_PRONUNCIATIONS)) {
    onProgress?.({
      total,
      completed,
      current: `Letter: ${letterId}`,
      errors,
    });

    try {
      const audio = await generateLetterPronunciation(letterId);
      if (audio) {
        results.set(`letter-${letterId}`, audio);
      }
    } catch (e) {
      errors.push(`letter-${letterId}`);
    }
    completed++;
    await sleep(300);
  }

  // Generate celebration phrases
  for (let i = 0; i < CELEBRATION_PHRASES.length; i++) {
    onProgress?.({
      total,
      completed,
      current: `Celebration phrase ${i + 1}`,
      errors,
    });

    try {
      const audio = await generateGeminiNarration(CELEBRATION_PHRASES[i], { style: 'playful' });
      if (audio) {
        results.set(`celebration-${i}`, audio);
      }
    } catch (e) {
      errors.push(`celebration-${i}`);
    }
    completed++;
    await sleep(300);
  }

  // Generate encouragement phrases
  for (let i = 0; i < ENCOURAGEMENT_PHRASES.length; i++) {
    onProgress?.({
      total,
      completed,
      current: `Encouragement phrase ${i + 1}`,
      errors,
    });

    try {
      const audio = await generateGeminiNarration(ENCOURAGEMENT_PHRASES[i], { style: 'playful' });
      if (audio) {
        results.set(`encouragement-${i}`, audio);
      }
    } catch (e) {
      errors.push(`encouragement-${i}`);
    }
    completed++;
    await sleep(300);
  }

  onProgress?.({
    total,
    completed,
    current: 'Complete!',
    errors,
  });

  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Audio Caching
// ============================================

const audioCache = new Map<string, GeneratedAudio>();

/**
 * Get cached or generate narration
 */
export async function getNarration(
  key: string,
  generator: () => Promise<GeneratedAudio | null>
): Promise<GeneratedAudio | null> {
  if (audioCache.has(key)) {
    const cached = audioCache.get(key)!;
    return { ...cached, cached: true };
  }

  const audio = await generator();
  if (audio) {
    audioCache.set(key, audio);
  }
  return audio;
}

/**
 * Clear audio cache
 */
export function clearNarrationCache(): void {
  for (const audio of audioCache.values()) {
    if (audio.url.startsWith('blob:')) {
      URL.revokeObjectURL(audio.url);
    }
  }
  audioCache.clear();
}
