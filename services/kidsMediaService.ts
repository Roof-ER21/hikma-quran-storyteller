/**
 * Kids Media Service - Enhanced Illustrations
 *
 * Inspired by top-rated Islamic kids apps:
 * - Hakma: Vibrant, high-quality illustrations
 * - Goodnight Stories from the Quran: Colorful, immersive scenes
 * - Muslim Kids TV: Child-friendly animations
 *
 * IMPORTANT: Following Islamic tradition, prophets are NOT depicted.
 * Instead, we show environments, animals, objects, and symbolic elements.
 *
 * Audio Sources:
 * - Quran Recitation: Islamic Network CDN (Al-Afasy)
 * - All other audio: Gemini TTS
 *
 * Image Sources:
 * - Gemini Image Generation (Imagen 3)
 */

import { getGlobalVerseNumber } from './quranDataService';

// ============================================
// Constants
// ============================================

const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio';
const DEFAULT_RECITER = 'ar.alafasy';

// Kids-friendly illustration style - inspired by top apps
const KIDS_ILLUSTRATION_STYLE = `
  Art style: Modern children's book illustration, similar to Pixar concept art.
  Colors: Vibrant, warm palette with soft gradients (coral, teal, golden yellow, sage green).
  Shapes: Rounded, friendly, non-threatening forms.
  Lighting: Soft, warm, magical golden hour or gentle moonlight.
  Mood: Peaceful, wonder-filled, safe, and cozy.
  Details: Simple but charming, with subtle Islamic geometric patterns in backgrounds.
  Age-appropriate: Designed for ages 3-6, nothing scary or complex.
  NO text, NO words, NO letters in the image.
  NO depiction of prophets, angels, or religious figures - only environments and objects.
`;

// ============================================
// Quran Audio (Real Recitation)
// ============================================

/**
 * Get audio URL for a specific Quran verse
 */
export function getQuranVerseAudioUrl(
  surahNumber: number,
  verseNumber: number,
  reciterId: string = DEFAULT_RECITER
): string {
  const globalVerseNumber = getGlobalVerseNumber(surahNumber, verseNumber);
  return `${AUDIO_CDN}/128/${reciterId}/${globalVerseNumber}.mp3`;
}

/**
 * Get all verse audio URLs for a surah
 */
export function getSurahAudioUrls(
  surahNumber: number,
  totalVerses: number,
  reciterId: string = DEFAULT_RECITER
): string[] {
  const urls: string[] = [];
  for (let i = 1; i <= totalVerses; i++) {
    urls.push(getQuranVerseAudioUrl(surahNumber, i, reciterId));
  }
  return urls;
}

/**
 * Preload audio files for a surah
 */
export async function preloadSurahAudio(
  surahNumber: number,
  totalVerses: number
): Promise<HTMLAudioElement[]> {
  const urls = getSurahAudioUrls(surahNumber, totalVerses);
  const audioElements: HTMLAudioElement[] = [];

  for (const url of urls) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audioElements.push(audio);
  }

  return audioElements;
}

// ============================================
// Enhanced Story Illustrations
// Following top apps: No prophet depiction, vivid environments
// ============================================

export const STORY_ILLUSTRATION_PROMPTS: Record<string, string[]> = {
  adam: [
    // Scene 1: Creation from clay
    `A pair of gentle hands forming beautiful reddish-brown clay on a potter's wheel,
    surrounded by swirling cosmic dust and golden light particles,
    the clay taking a graceful curved shape like a vessel being formed,
    background shows deep blue starry cosmos with nebulas,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 2: Garden of Paradise
    `A breathtaking paradise garden with crystal clear rivers flowing between,
    fruit trees heavy with colorful fruits - pomegranates, figs, grapes, dates,
    flowers of every color imaginable - roses, jasmine, tulips in pastels,
    gentle waterfalls cascading into turquoise pools,
    golden sunlight filtering through the leaves creating magical light rays,
    butterflies and songbirds flying peacefully,
    one special tree in the center glowing with soft golden light,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 3: Angels bowing (show light and wings, no figures)
    `Magnificent rays of pure white and golden light streaming down from above,
    multiple pairs of beautiful luminous wings visible in the light,
    the wings are made of iridescent feathers in white, gold, and soft blue,
    gentle sparkles and star dust floating in the air,
    the scene feels reverent and peaceful,
    clouds parting to reveal divine golden light,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 4: Two figures in garden (silhouettes in distance)
    `A paradise garden at golden sunset,
    two small silhouettes walking hand in hand in the far distance,
    surrounded by towering fruit trees and flowers,
    a gentle stream reflecting the orange and pink sky,
    peaceful deer and rabbits grazing nearby,
    birds singing on branches,
    everything glowing with warmth and happiness,
    ${KIDS_ILLUSTRATION_STYLE}`
  ],

  nuh: [
    // Scene 1: Building the ark
    `A massive wooden ark being built on green hills,
    enormous wooden beams and planks arranged beautifully,
    tools scattered around - hammers, saws, ropes,
    wood shavings curling on the ground,
    the partially complete boat is huge and magnificent,
    blue sky with fluffy white clouds,
    birds watching curiously from nearby trees,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 2: Animals gathering
    `Pairs of adorable animals walking toward a large wooden ark,
    two friendly lions walking side by side with fluffy manes,
    two gray elephants holding trunks lovingly,
    two giraffes with long spotted necks,
    two colorful parrots flying together,
    two fluffy sheep, two striped zebras, two brown bears,
    all walking in an orderly, peaceful procession,
    green meadow with wildflowers, sunny day,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 3: Inside the cozy ark
    `Interior of a wooden ark with warm lantern lighting,
    cozy hay beds for animals,
    cute animals resting peacefully - sleeping lions, curled up cats,
    birds perched on wooden beams,
    rain visible through small round windows,
    the feeling is safe, warm, and cozy like a home,
    wooden walls with simple geometric patterns carved in,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 4: Rainbow and new beginning
    `A magnificent rainbow arcing across a bright blue sky,
    the wooden ark resting peacefully on a green mountain,
    clear blue water receding below,
    animals happily leaving the ark - elephants trumpeting, birds flying free,
    new green plants and flowers sprouting everywhere,
    the sun breaking through clouds with golden rays,
    everything fresh, clean, and full of hope,
    ${KIDS_ILLUSTRATION_STYLE}`
  ],

  ibrahim: [
    // Scene 1: Starry night wonder
    `A vast desert landscape under a spectacular night sky,
    thousands of twinkling stars like diamonds,
    the Milky Way visible as a glowing river across the sky,
    a crescent moon glowing softly,
    a small silhouette of a child looking up in wonder,
    sand dunes in soft purple and blue night colors,
    the sky feels infinite and magical,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 2: Sunrise revelation
    `A beautiful sunrise over desert mountains,
    the sun rising as a golden orb spreading warm light,
    the previous stars fading away in the brightening sky,
    colors transitioning from deep blue to pink to gold,
    a single figure silhouette small against the vast landscape,
    the scene conveys the eternal nature of the Creator,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 3: Heart filled with love (symbolic)
    `A beautiful glowing heart shape made of golden light,
    floating in a peaceful blue sky with soft clouds,
    the heart radiates warm golden rays outward,
    small stars and sparkles surrounding it,
    below is a peaceful landscape with gentle hills,
    the image conveys deep love and connection,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 4: The Kaaba being built
    `The Kaaba as a simple, beautiful cube structure,
    made of gray stones being carefully placed,
    two small silhouettes working together as a team,
    golden sunlight illuminating the sacred structure,
    mountains in the background,
    birds circling above peacefully,
    the scene conveys teamwork and dedication,
    ${KIDS_ILLUSTRATION_STYLE}`
  ],

  musa: [
    // Scene 1: Baby in a basket
    `A beautiful woven basket floating gently on a calm river,
    inside is a cozy blanket (baby hidden, just blanket visible),
    the basket is decorated with flowers and protected by reeds,
    lotus flowers and lily pads surrounding the basket,
    gentle ripples in the crystal clear blue water,
    morning sunlight creating golden sparkles on the water,
    dragonflies and butterflies nearby,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 2: Palace discovery
    `An ornate ancient Egyptian palace courtyard,
    beautiful pillars decorated with geometric patterns,
    a fountain with clear water in the center,
    palm trees and exotic flowers,
    a small woven basket at the water's edge,
    elegant royal gardens with peacocks,
    golden sunlight streaming through,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 3: The burning bush (symbolic light)
    `A beautiful tree or bush glowing with golden-white divine light,
    flames that look gentle and warm, not scary,
    the flames don't burn the green leaves,
    soft sparkles and light particles floating around,
    a peaceful desert mountain setting,
    the light feels warm, inviting, and holy,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 4: Parting of the sea
    `A miraculous path through the sea,
    two towering walls of sparkling blue-green water on each side,
    the water walls have fish, coral, and sea creatures visible inside,
    a dry sandy path through the middle,
    golden sunlight breaking through clouds above,
    the scene is awe-inspiring but not scary,
    the path leads to safety on the other side,
    ${KIDS_ILLUSTRATION_STYLE}`
  ],

  yusuf: [
    // Scene 1: Dream of stars
    `A magical dream scene with eleven golden stars in a night sky,
    a glowing crescent moon bowing gracefully,
    a bright sun with a friendly face also bowing,
    all celestial bodies arranged in a beautiful pattern,
    soft dreamy clouds in purple and blue,
    sparkles and stardust creating a magical atmosphere,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 2: The well (hope in darkness)
    `Looking up from inside a stone well,
    a circle of blue sky visible far above,
    a small rope hanging down bringing hope,
    birds flying in the sky above,
    the stone walls have patches of moss and small flowers,
    light streaming down creating a hopeful feeling,
    the scene shows that help is coming,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 3: Coat of many colors
    `A beautiful coat draped on a wooden chair,
    the coat has rainbow stripes and patterns,
    colors include ruby red, emerald green, sapphire blue, golden yellow,
    the fabric looks soft and lovingly made,
    golden sunlight illuminating the beautiful garment,
    simple room with geometric patterns on walls,
    ${KIDS_ILLUSTRATION_STYLE}`,

    // Scene 4: Giving to others
    `A marketplace scene with baskets full of golden wheat and grain,
    happy villagers receiving food,
    children playing nearby,
    a sense of abundance and generosity,
    warm golden sunset lighting,
    beautiful Islamic architecture in background,
    the scene conveys kindness and helping others,
    ${KIDS_ILLUSTRATION_STYLE}`
  ]
};

// ============================================
// Arabic Letter Illustrations
// Cute animals/objects for each letter
// ============================================

export const LETTER_ILLUSTRATION_PROMPTS: Record<string, string> = {
  alif: `A majestic but friendly cartoon lion standing proudly,
    golden-orange fur with a fluffy mane,
    big gentle eyes and a warm smile,
    surrounded by savanna grass and acacia trees,
    ${KIDS_ILLUSTRATION_STYLE}`,

  baa: `An adorable cartoon duck swimming in a pond,
    bright yellow feathers with an orange beak,
    happy expression, splashing in clear blue water,
    lily pads and reeds around,
    ${KIDS_ILLUSTRATION_STYLE}`,

  taa: `A shiny red apple with a cute happy face,
    sitting on a wooden table,
    a green leaf on top,
    sparkles showing it's fresh and delicious,
    ${KIDS_ILLUSTRATION_STYLE}`,

  thaa: `A friendly cartoon fox with a magnificent fluffy tail,
    orange and white fur, bright curious eyes,
    sitting in an autumn forest setting,
    fallen leaves around in warm colors,
    ${KIDS_ILLUSTRATION_STYLE}`,

  jeem: `A lovable cartoon camel with a big friendly smile,
    tan and cream colored with long eyelashes,
    standing in a desert with palm trees,
    sunset colors in the sky,
    ${KIDS_ILLUSTRATION_STYLE}`,

  haa: `A gentle cartoon horse galloping through a meadow,
    chestnut brown coat with a flowing mane,
    strong and graceful, friendly expression,
    green grass and wildflowers,
    ${KIDS_ILLUSTRATION_STYLE}`,

  khaa: `A fluffy cartoon sheep with soft white wool,
    adorable black face and legs,
    grazing in a green field with daisies,
    blue sky with fluffy clouds,
    ${KIDS_ILLUSTRATION_STYLE}`,

  dal: `A cuddly cartoon bear waving hello,
    warm brown fur, round ears,
    sitting among pine trees in a forest,
    honey pot nearby,
    ${KIDS_ILLUSTRATION_STYLE}`,

  thal: `A sweet cartoon honey bee with sparkly wings,
    yellow and black stripes,
    flying near colorful flowers,
    carrying a tiny bucket of honey,
    ${KIDS_ILLUSTRATION_STYLE}`,

  raa: `A friendly cartoon rabbit with long soft ears,
    white and gray fur, pink nose,
    hopping through a garden with carrots,
    spring flowers blooming,
    ${KIDS_ILLUSTRATION_STYLE}`,

  zay: `A colorful cartoon peacock with magnificent tail feathers,
    brilliant blues, greens, and golds,
    displaying feathers proudly,
    palace garden setting,
    ${KIDS_ILLUSTRATION_STYLE}`,

  seen: `A playful cartoon dolphin jumping out of the ocean,
    sleek gray-blue body, big smile,
    splash of water droplets,
    sunset over the sea,
    ${KIDS_ILLUSTRATION_STYLE}`,

  sheen: `A bright happy cartoon sun with a friendly face,
    golden yellow rays spreading warmth,
    fluffy white clouds nearby,
    blue sky background,
    ${KIDS_ILLUSTRATION_STYLE}`,

  saad: `A wise cartoon owl perched on a branch,
    brown feathers with big round eyes,
    wearing a tiny graduation cap,
    nighttime library setting with books,
    ${KIDS_ILLUSTRATION_STYLE}`,

  daad: `A beautiful crescent moon with a gentle smile,
    glowing softly in a starry night sky,
    surrounded by twinkling stars,
    peaceful nighttime scene,
    ${KIDS_ILLUSTRATION_STYLE}`,

  taa2: `A colorful cartoon parrot on a branch,
    vibrant red, blue, green, and yellow feathers,
    tropical jungle background,
    exotic flowers around,
    ${KIDS_ILLUSTRATION_STYLE}`,

  thaa2: `A graceful cartoon gazelle in the desert,
    tan coat with elegant horns,
    standing on sand dunes at sunset,
    palm trees in distance,
    ${KIDS_ILLUSTRATION_STYLE}`,

  ayn: `A friendly cartoon eye made of sparkles,
    like a magical seeing crystal,
    surrounded by rainbow light,
    mystical and wonder-filled,
    ${KIDS_ILLUSTRATION_STYLE}`,

  ghayn: `A fluffy cartoon cloud with a happy face,
    soft white and gray,
    floating in a blue sky,
    gentle rain drops falling below,
    ${KIDS_ILLUSTRATION_STYLE}`,

  faa: `A magnificent cartoon elephant with big friendly ears,
    gray with pink inner ears,
    spraying water playfully from trunk,
    savanna background,
    ${KIDS_ILLUSTRATION_STYLE}`,

  qaaf: `An open Quran book glowing with golden light,
    beautiful Arabic calligraphy visible,
    surrounded by soft sparkles,
    sitting on an ornate book stand,
    ${KIDS_ILLUSTRATION_STYLE}`,

  kaaf: `The Kaaba as a beautiful simple cube,
    black covering with golden embroidery,
    surrounded by white marble courtyard,
    clear blue sky above,
    ${KIDS_ILLUSTRATION_STYLE}`,

  laam: `A tall palm tree reaching toward the sky,
    green fronds swaying gently,
    dates hanging in clusters,
    oasis setting with blue water,
    ${KIDS_ILLUSTRATION_STYLE}`,

  meem: `A glowing full moon in a starry sky,
    soft silver-white light,
    gentle face with peaceful expression,
    nighttime mosque silhouette below,
    ${KIDS_ILLUSTRATION_STYLE}`,

  noon: `A bright twinkling star with a happy face,
    golden yellow with sparkle trails,
    surrounded by smaller stars,
    deep blue night sky,
    ${KIDS_ILLUSTRATION_STYLE}`,

  haa2: `A beautiful decorative lantern glowing warmly,
    intricate geometric patterns,
    soft golden light inside,
    hanging in a cozy room,
    ${KIDS_ILLUSTRATION_STYLE}`,

  waw: `A cute cartoon whale spouting water,
    friendly blue whale in the ocean,
    rainbow in the water spray,
    underwater friends swimming nearby,
    ${KIDS_ILLUSTRATION_STYLE}`,

  yaa: `A beautiful butterfly with colorful wings,
    patterns in purple, blue, and gold,
    fluttering near a flower garden,
    magical sparkle trail behind,
    ${KIDS_ILLUSTRATION_STYLE}`
};

// ============================================
// Surah Illustrations
// ============================================

export const SURAH_ILLUSTRATION_PROMPTS: Record<number, string> = {
  1: `Beautiful open book with golden light emanating,
    Arabic calligraphy visible, surrounded by flowers,
    rays of light spreading outward,
    peaceful mosque in background,
    ${KIDS_ILLUSTRATION_STYLE}`,

  112: `A single beautiful gemstone radiating pure light,
    representing the oneness of Allah,
    surrounded by geometric Islamic patterns,
    deep blue background with golden accents,
    ${KIDS_ILLUSTRATION_STYLE}`,

  113: `A beautiful sunrise breaking through darkness,
    golden light dispelling shadows,
    protective light rays spreading outward,
    peaceful morning scene,
    ${KIDS_ILLUSTRATION_STYLE}`,

  114: `A peaceful sleeping child in a cozy bed,
    protective golden light surrounding them,
    gentle guardian light keeping them safe,
    stars visible through a window,
    ${KIDS_ILLUSTRATION_STYLE}`
};

// ============================================
// Image Generation Functions
// ============================================

/**
 * Generate a kids-friendly illustration using Gemini
 */
export async function generateKidsIllustration(
  prompt: string,
  type: 'story' | 'letter' | 'surah'
): Promise<string | null> {
  try {
    const { generateStoryImage } = await import('./geminiService');

    const imageUrl = await generateStoryImage(prompt, {
      resolution: '1K',
      aspectRatio: type === 'letter' ? '1:1' : '16:9'
    });

    return imageUrl;
  } catch (error) {
    console.error('Error generating kids illustration:', error);
    return null;
  }
}

/**
 * Generate illustration for a story scene
 */
export async function generateStorySceneImage(
  storyId: string,
  sceneIndex: number
): Promise<string | null> {
  const prompts = STORY_ILLUSTRATION_PROMPTS[storyId];
  if (!prompts || sceneIndex >= prompts.length) {
    return null;
  }

  return generateKidsIllustration(prompts[sceneIndex], 'story');
}

/**
 * Generate illustration for an Arabic letter
 */
export async function generateLetterImage(letterId: string): Promise<string | null> {
  const prompt = LETTER_ILLUSTRATION_PROMPTS[letterId];
  if (!prompt) return null;

  return generateKidsIllustration(prompt, 'letter');
}

/**
 * Generate illustration for a surah
 */
export async function generateSurahImage(surahNumber: number): Promise<string | null> {
  const prompt = SURAH_ILLUSTRATION_PROMPTS[surahNumber];
  if (!prompt) return null;

  return generateKidsIllustration(prompt, 'surah');
}

// ============================================
// Batch Generation (for pre-caching)
// ============================================

export interface GenerationProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

/**
 * Pre-generate all kids illustrations
 */
export async function preGenerateAllIllustrations(
  onProgress?: (progress: GenerationProgress) => void
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  const errors: string[] = [];

  const storyIds = Object.keys(STORY_ILLUSTRATION_PROMPTS);
  const letterIds = Object.keys(LETTER_ILLUSTRATION_PROMPTS);
  const surahIds = Object.keys(SURAH_ILLUSTRATION_PROMPTS);

  const totalItems = storyIds.reduce((sum, id) =>
    sum + STORY_ILLUSTRATION_PROMPTS[id].length, 0
  ) + letterIds.length + surahIds.length;

  let completed = 0;

  // Generate story illustrations
  for (const storyId of storyIds) {
    const prompts = STORY_ILLUSTRATION_PROMPTS[storyId];
    for (let i = 0; i < prompts.length; i++) {
      onProgress?.({
        total: totalItems,
        completed,
        current: `Story: ${storyId} scene ${i + 1}`,
        errors
      });

      try {
        const image = await generateStorySceneImage(storyId, i);
        if (image) {
          images.set(`story-${storyId}-${i}`, image);
        }
      } catch (e) {
        errors.push(`story-${storyId}-${i}`);
      }
      completed++;

      // Rate limiting - Gemini image gen needs more time
      await sleep(2000);
    }
  }

  // Generate letter illustrations
  for (const letterId of letterIds) {
    onProgress?.({
      total: totalItems,
      completed,
      current: `Letter: ${letterId}`,
      errors
    });

    try {
      const image = await generateLetterImage(letterId);
      if (image) {
        images.set(`letter-${letterId}`, image);
      }
    } catch (e) {
      errors.push(`letter-${letterId}`);
    }
    completed++;
    await sleep(2000);
  }

  // Generate surah illustrations
  for (const surahId of surahIds) {
    onProgress?.({
      total: totalItems,
      completed,
      current: `Surah: ${surahId}`,
      errors
    });

    try {
      const image = await generateSurahImage(Number(surahId));
      if (image) {
        images.set(`surah-${surahId}`, image);
      }
    } catch (e) {
      errors.push(`surah-${surahId}`);
    }
    completed++;
    await sleep(2000);
  }

  onProgress?.({
    total: totalItems,
    completed,
    current: 'Complete!',
    errors
  });

  return images;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Surah Verse Data
// ============================================

export const KIDS_SURAH_VERSES: Record<number, number> = {
  1: 7,    // Al-Fatiha
  112: 4,  // Al-Ikhlas
  113: 5,  // Al-Falaq
  114: 6   // An-Nas
};

export const KIDS_SURAH_ARABIC: Record<number, string[]> = {
  1: [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    'الرَّحْمَٰنِ الرَّحِيمِ',
    'مَالِكِ يَوْمِ الدِّينِ',
    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ'
  ],
  112: [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'قُلْ هُوَ اللَّهُ أَحَدٌ',
    'اللَّهُ الصَّمَدُ',
    'لَمْ يَلِدْ وَلَمْ يُولَدْ',
    'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ'
  ],
  113: [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
    'مِن شَرِّ مَا خَلَقَ',
    'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
    'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ',
    'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ'
  ],
  114: [
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
    'مَلِكِ النَّاسِ',
    'إِلَٰهِ النَّاسِ',
    'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ',
    'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ',
    'مِنَ الْجِنَّةِ وَالنَّاسِ'
  ]
};

// Simple English translations for kids
export const KIDS_SURAH_TRANSLATION: Record<number, string[]> = {
  1: [
    'In the name of Allah, the Most Kind, the Most Caring',
    'All thanks to Allah, who takes care of everything',
    'The Most Kind, the Most Caring',
    'He is in charge of the Day we return to Him',
    'Only You we worship, only You we ask for help',
    'Show us the right path',
    'The path of those You blessed, not those who made You upset'
  ],
  112: [
    'In the name of Allah, the Most Kind, the Most Caring',
    'Say: He is Allah, the One and Only',
    'Allah needs nothing, everyone needs Him',
    'He was not born, and He has no children',
    'There is nothing like Him'
  ],
  113: [
    'In the name of Allah, the Most Kind, the Most Caring',
    'Say: I ask Allah to protect me, the Lord of the morning light',
    'From the bad in what He created',
    'And from the dark when it spreads',
    'And from those who do magic',
    'And from jealous people when they are jealous'
  ],
  114: [
    'In the name of Allah, the Most Kind, the Most Caring',
    'Say: I ask Allah to protect me, the Lord of all people',
    'The King of all people',
    'The God of all people',
    'From the sneaky whisperer who hides',
    'Who whispers bad thoughts in people\'s hearts',
    'From the jinn and from people'
  ]
};
