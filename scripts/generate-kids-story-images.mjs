/**
 * Generate Kids Story Scene Images
 *
 * Uses ComfyUI locally to generate kid-friendly images for each story scene.
 * Images focus on landscapes, objects, light - NO human faces (Islamic tradition).
 *
 * Usage:
 *   node scripts/generate-kids-story-images.mjs              # Generate all missing
 *   node scripts/generate-kids-story-images.mjs yunus        # Generate for specific prophet
 *   node scripts/generate-kids-story-images.mjs yunus dawud  # Generate for multiple prophets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ComfyUI settings
const COMFYUI_URL = 'http://127.0.0.1:8000';
const MODEL = 'dreamshaper8.safetensors';
const IMAGE_WIDTH = 512;
const IMAGE_HEIGHT = 512;

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'assets', 'kids', 'illustrations');

// Load stories data
const storiesPath = path.join(__dirname, '..', 'data', 'kidsStories.json');
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf-8'));

// Scene-to-prompt mappings for each prophet (kid-friendly, no human faces)
const PROPHET_SCENE_PROMPTS = {
  yunus: {
    style: "children's book illustration, warm colors, gentle, peaceful",
    scenes: [
      "ancient city of Nineveh with tall towers and palm trees, golden sunset, peaceful but neglected",
      "empty town square with closed doors, people's shadows walking away, sad atmosphere",
      "wooden sailing ship on calm blue sea, white sails, seagulls flying, peaceful journey",
      "dark stormy ocean with big waves, ship rocking, dramatic clouds",
      "deep underwater scene with rays of light, bubbles, peaceful blue ocean depths",
      "starry night sky from underwater looking up, divine light breaking through",
      "sandy beach at dawn with gentle waves, sunrise colors, hope returning",
      "green valley with renewed city, people's shadows praying together",
      "beautiful garden with flowing water, birds singing, peaceful morning",
      "city restored with happy decorations, celebration atmosphere, rainbow"
    ]
  },
  sulaiman: {
    style: "magical storybook illustration, royal colors gold and purple, enchanting",
    scenes: [
      "magnificent golden palace with jeweled throne, sunlight streaming through windows",
      "enchanted forest with colorful birds and animals gathered peacefully",
      "beautiful garden with talking birds and gentle animals, magical atmosphere",
      "grand throne room with golden pillars, crown on cushion, royal splendor",
      "magical wind carrying leaves and petals, swirling patterns in sky",
      "army of ants marching in organized lines through golden sand",
      "majestic hoopoe bird with colorful feathers carrying a letter",
      "magnificent glass floor reflecting sky, elegant palace interior",
      "peaceful kingdom with happy subjects (silhouettes), prosperous land",
      "wise king's study with scrolls and books, golden lamp light"
    ]
  },
  dawud: {
    style: "pastoral illustration, soft greens and blues, serene countryside",
    scenes: [
      "young shepherd's staff on green hillside, fluffy sheep grazing peacefully",
      "beautiful harp resting on rock, birds gathering to listen, sunrise",
      "mountains with echo effect shown as sound waves, golden light",
      "peaceful valley with shepherd's tent, night sky full of stars",
      "stone sling and five smooth stones by a stream, morning light",
      "giant shadow falling across valley, dramatic but hopeful sky",
      "crown and royal robes on throne, sunbeam from above",
      "ancient Jerusalem city walls at golden hour, peaceful",
      "beautiful psalms scroll with musical notes floating around",
      "kingdom at peace, olive trees and vineyards, prosperous land"
    ]
  },
  ayyub: {
    style: "warm illustration, earth tones, grateful atmosphere",
    scenes: [
      "prosperous farm with animals, green fields, beautiful home, blessed",
      "happy family silhouettes in garden, children playing, abundant fruit trees",
      "simple hut with single lamp burning, patient waiting, humble",
      "dried land turning green again, first flowers blooming, hope",
      "healing spring water bubbling from ground, divine light",
      "health and strength returning, rainbow over recovered land",
      "animals returning to farm, sheep and cattle grazing happily",
      "family reunited (silhouettes hugging), tears of joy",
      "double blessings shown - twice as many animals, bigger harvest",
      "grateful prayer scene (hands raised silhouette), sunset, thankful heart"
    ]
  },
  isa: {
    style: "soft ethereal illustration, holy light, gentle blues and whites",
    scenes: [
      "beautiful woman's silhouette praying in temple, divine light streaming in",
      "angel Gabriel as bright light appearing, wings of light, peaceful",
      "miraculous baby cradle with divine glow, stars above",
      "baby speaking wisdom, light emanating, amazed village (silhouettes)",
      "clay bird coming to life, flying into blue sky, miracle",
      "blind person's eyes opening to light, healing miracle",
      "table with divine feast appearing, bread and fish multiplying",
      "disciples' silhouettes learning, seated around teacher's light",
      "peaceful ascension scene, figure rising in light to heaven",
      "Quran open with beautiful calligraphy about Isa, golden light"
    ]
  },
  idris: {
    style: "cosmic illustration, starry skies, wisdom and knowledge theme",
    scenes: [
      "ancient scroll being written with feather pen, first writing, candlelight",
      "star-filled sky with constellation patterns, cosmic wonder",
      "early humans learning to write, clay tablets, knowledge spreading",
      "mathematical symbols and numbers floating among stars",
      "celestial stairway of light reaching toward heaven",
      "wise man's observatory with telescope, moon and stars",
      "books and scrolls stacked high, tree of knowledge",
      "angels carrying scholar upward in light, peaceful ascension",
      "heavenly realm with clouds and light, eternal peace",
      "legacy of knowledge - books transforming into stars"
    ]
  },
  hud: {
    style: "dramatic desert illustration, powerful architecture, golden sands",
    scenes: [
      "massive sandstone pillars and towers of ancient 'Ad, impressive",
      "giant footprints in sand, huge carved doorways, mighty people",
      "proud city with flags, towering monuments, arrogant atmosphere",
      "humble messenger's silhouette before giant gates, brave",
      "dark storm clouds gathering over proud city, warning",
      "howling wind beginning, sand swirling, dramatic sky",
      "seven nights of fierce wind, city being buried in sand",
      "morning after, sand dunes covering ruined towers",
      "believers' caravan leaving safely, protected by light",
      "peaceful oasis for faithful ones, palm trees, safety"
    ]
  },
  saleh: {
    style: "mountain illustration, carved stone, dramatic cliffs",
    scenes: [
      "magnificent homes carved into red cliff faces, Thamud engineering",
      "stone idols in carved shrine, people bowing (silhouettes)",
      "messenger's silhouette pointing to sky, rejecting idols",
      "miraculous she-camel emerging from split rock, divine sign",
      "beautiful camel drinking from well, villagers watching",
      "evil plot symbols - sharp weapons hidden, dark shadows",
      "camel harmed, earthquake beginning, ground cracking",
      "mountain homes crumbling, rocks falling, dramatic",
      "dust settling over ruined city, silence",
      "lone survivor walking toward sunrise, new beginning"
    ]
  },
  lut: {
    style: "dramatic landscape illustration, contrast of beauty and warning",
    scenes: [
      "beautiful green valley with flowing rivers, cities of the plain",
      "wedding scene of Lut, simple and pure, blessing",
      "city turning dark with shadows, wickedness spreading",
      "messenger's silhouette warning at city gate, ignored",
      "angels as bright lights arriving at humble home",
      "family packing quickly at night, urgent departure",
      "walking away without looking back, city in distance",
      "divine punishment - fire and brimstone falling from sky",
      "Dead Sea forming where cities stood, somber",
      "faithful family continuing journey toward sunrise"
    ]
  },
  ismail: {
    style: "desert illustration, warm oranges and yellows, hope theme",
    scenes: [
      "baby wrapped in cloth in desert, mother Hajar's silhouette praying",
      "Hajar running between two hills, searching for water",
      "Zamzam spring bursting from sand, water miracle, divine light",
      "young boy helping father build stone structure, Kaaba foundation",
      "father and son's silhouettes praying together at Kaaba",
      "beautiful black stone placed in corner of Kaaba",
      "pilgrims' silhouettes circling the sacred house",
      "desert valley transforming into busy Makkah",
      "well of Zamzam with people drinking gratefully",
      "legacy continuing - millions of silhouettes praying toward Kaaba"
    ]
  },
  ishaq: {
    style: "pastoral illustration, gentle colors, family blessing theme",
    scenes: [
      "elderly couple's silhouettes praying under night stars",
      "angels as light visiting tent, bringing good news",
      "miraculous baby in elderly arms, joy and tears",
      "young boy learning from father Ibrahim's silhouette",
      "green pastures of Canaan, flocks of sheep, prosperity",
      "twin boys' silhouettes playing, different personalities",
      "family gathered around fire, stories being told",
      "blessing being passed from father to son, light transferring",
      "peaceful death scene, family gathered, sunset"
    ]
  },
  yaqub: {
    style: "journey illustration, caravan colors, family saga theme",
    scenes: [
      "twelve stars arranged around central moon and sun, dream",
      "young favorite son with colorful coat, other sons watching",
      "empty well with torn colorful cloth, tragic moment",
      "father weeping, tears becoming river, grief",
      "years passing shown as seasons changing, waiting",
      "caravan heading to Egypt during famine, hope",
      "emotional reunion scene - silhouettes embracing, tears of joy",
      "whole family together in Egypt, feast table",
      "elderly father's blessing, twelve sons kneeling",
      "family legacy tree with twelve branches, tribes of Israel"
    ]
  },
  shuaib: {
    style: "marketplace illustration, warm earth tones, justice theme",
    scenes: [
      "busy ancient marketplace with colorful awnings, Madyan",
      "dishonest scales tipping wrong way, cheating shown",
      "poor person's empty basket, unfair trade, sadness",
      "messenger's silhouette with honest scales, teaching fairness",
      "people arguing, some accepting truth, others refusing",
      "natural disaster warning - dark clouds gathering",
      "earthquake shaking the marketplace, stalls falling",
      "destroyed market after punishment, silence",
      "honest traders rebuilding with fair scales",
      "new marketplace with justice, equal weights, prosperity"
    ]
  },
  harun: {
    style: "gentle illustration, soft colors, brotherhood theme",
    scenes: [
      "two brothers' silhouettes walking together, support",
      "speaking to crowds with gentle gestures, calming voice",
      "golden calf idol being destroyed, fire consuming it",
      "sacred tent tabernacle with golden glow inside",
      "priest's robes and holy items laid out beautifully",
      "incense rising like prayers, smoke swirling upward",
      "brothers reconciling, forgiveness, embrace silhouettes",
      "leading prayers, community gathered (silhouettes)",
      "peaceful mountain scene, staff and robes laid down",
      "legacy of gentle leadership, peaceful sunset"
    ]
  },
  dhulkifl: {
    style: "steady illustration, reliable colors, patience theme",
    scenes: [
      "watchtower with lamp burning bright, vigilant",
      "storm raging outside but lamp still burning inside",
      "promises carved in stone tablets, commitment",
      "patient waiting through day and night cycle",
      "helping travelers at crossroads, generous",
      "judging fairly between two parties, balanced scales",
      "keeping covenant through difficult times, steadfast",
      "rewarded with peaceful kingdom, prosperity"
    ]
  },
  ilyas: {
    style: "dramatic illustration, mountain setting, faith vs idols",
    scenes: [
      "Mount Carmel with altar of stones, dramatic sky",
      "Baal idol being worshipped by silhouettes, wrong path",
      "prophet's silhouette alone against crowd, brave",
      "altar challenge - wood stacked, no fire yet",
      "fire from heaven consuming altar, dramatic miracle",
      "rain finally falling after drought, relief",
      "idol worship abandoned, statues crumbling",
      "people returning to true faith, renewed",
      "prophet's chariot of fire ascending, dramatic",
      "mantle falling to successor below, legacy continues"
    ]
  },
  alyasa: {
    style: "healing illustration, river theme, miracles of kindness",
    scenes: [
      "receiving the prophet's mantle, sacred inheritance",
      "Jordan River parting like before, miracle continuing",
      "healing waters flowing, sick becoming well",
      "multiplying oil in widow's jars, abundance",
      "dead child being revived, life returning, light",
      "poison in pot being neutralized, safety",
      "feeding many with little food, multiplication",
      "enemy army struck blind then healed, mercy",
      "peaceful ministry among people, teaching"
    ]
  },
  zakariya: {
    style: "temple illustration, golden light, prayer theme",
    scenes: [
      "elderly priest praying in temple sanctuary, devoted",
      "empty cradle, longing for child, years of prayer",
      "divine light appearing in prayer chamber, answer coming",
      "unable to speak, communicating through writing",
      "miracle baby announcement, joy despite old age",
      "naming ceremony, 'Yahya' written on tablet",
      "baby in elderly arms, tears of gratitude",
      "temple bells ringing in celebration",
      "father and son silhouettes at temple, training",
      "peaceful passing, legacy of faith continuing"
    ]
  },
  yahya: {
    style: "wilderness illustration, river theme, purity",
    scenes: [
      "miracle baby glowing with light, special from birth",
      "young boy in temple studying scrolls, devoted",
      "wilderness of Jordan, simple living, dates and honey",
      "river baptism scene, water and light, purification",
      "preaching to crowds by river, silhouettes listening",
      "preparing the way, paths being straightened",
      "simple clothes of camel hair, humble life",
      "fearless truth-telling, standing against wrong",
      "martyr's crown of light, sacrifice",
      "legacy flowing like the Jordan River, continued faith"
    ]
  },
  muhammad: {
    style: "Makkan illustration, desert and city, light theme",
    scenes: [
      "year of elephant - army with elephant retreating, birds",
      "baby's light illuminating dark Makkah night, blessed birth",
      "Halima's village blessed with green after baby arrives",
      "young orphan cared for by grandfather, then uncle",
      "honest trader known as Al-Amin, trusted scales",
      "cave of Hira, peaceful meditation, moonlight",
      "first revelation - angel's light in cave, Iqra",
      "secret meetings of early Muslims, small but strong",
      "night journey - dome of rock and heavens opening",
      "Madinah welcoming with palm branches, Hijra complete"
    ]
  }
};

// Base negative prompt (no human faces, appropriate content)
const NEGATIVE_PROMPT = "human face, facial features, eyes, nose, mouth, realistic humans, portrait, photograph, text, watermark, signature, nsfw, inappropriate, violence, scary, dark themes, horror";

// Create ComfyUI workflow
function createWorkflow(prompt, seed = Math.floor(Math.random() * 999999999)) {
  const fullPrompt = `${prompt}, children's book illustration style, kid-friendly, bright colors, soft edges, warm lighting, cute, wholesome, educational, masterpiece, highly detailed`;

  return {
    "3": {
      "inputs": {
        "seed": seed,
        "steps": 25,
        "cfg": 7.5,
        "sampler_name": "euler_ancestral",
        "scheduler": "normal",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "ckpt_name": MODEL
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "5": {
      "inputs": {
        "width": IMAGE_WIDTH,
        "height": IMAGE_HEIGHT,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "6": {
      "inputs": {
        "text": fullPrompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": NEGATIVE_PROMPT,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["4", 2]
      },
      "class_type": "VAEDecode"
    },
    "9": {
      "inputs": {
        "filename_prefix": "kids_story",
        "images": ["8", 0]
      },
      "class_type": "SaveImage"
    }
  };
}

// Check if ComfyUI is running
async function checkComfyUI() {
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`);
    return response.ok;
  } catch {
    return false;
  }
}

// Queue a prompt and wait for completion
async function queuePrompt(workflow) {
  const clientId = Math.random().toString(36).substring(7);

  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: workflow,
      client_id: clientId
    })
  });

  const { prompt_id } = await response.json();

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws?clientId=${clientId}`);

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'executing' && message.data.node === null && message.data.prompt_id === prompt_id) {
        ws.close();
        resolve(prompt_id);
      }
    });

    ws.on('error', reject);

    setTimeout(() => {
      ws.close();
      reject(new Error('Timeout waiting for image generation'));
    }, 120000);
  });
}

// Get the generated image
async function getGeneratedImage(promptId) {
  const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
  const history = await response.json();

  const outputs = history[promptId]?.outputs;
  if (!outputs) return null;

  for (const nodeId of Object.keys(outputs)) {
    const images = outputs[nodeId]?.images;
    if (images && images.length > 0) {
      const image = images[0];
      const imageResponse = await fetch(`${COMFYUI_URL}/view?filename=${image.filename}&subfolder=${image.subfolder || ''}&type=${image.type}`);
      return Buffer.from(await imageResponse.arrayBuffer());
    }
  }

  return null;
}

// Generate images for a single prophet
async function generateForProphet(prophetId) {
  const prophetData = PROPHET_SCENE_PROMPTS[prophetId];
  if (!prophetData) {
    console.log(`  No prompts defined for ${prophetId}`);
    return { generated: 0, skipped: 0 };
  }

  const story = stories.find(s => s.id === prophetId);
  if (!story) {
    console.log(`  Story not found for ${prophetId}`);
    return { generated: 0, skipped: 0 };
  }

  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < prophetData.scenes.length && i < story.scenes.length; i++) {
    const outputPath = path.join(OUTPUT_DIR, `story-${prophetId}-${i}.png`);

    if (fs.existsSync(outputPath)) {
      console.log(`    [${i}] Skipping (exists)`);
      skipped++;
      continue;
    }

    const scenePrompt = `${prophetData.scenes[i]}, ${prophetData.style}`;
    console.log(`    [${i}] Generating: ${prophetData.scenes[i].substring(0, 50)}...`);

    try {
      const workflow = createWorkflow(scenePrompt);
      const promptId = await queuePrompt(workflow);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const imageBuffer = await getGeneratedImage(promptId);

      if (imageBuffer) {
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`        Saved!`);
        generated++;
      } else {
        console.log(`        No image returned`);
      }
    } catch (error) {
      console.log(`        Error: ${error.message}`);
    }

    // Delay between images to avoid overwhelming
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { generated, skipped };
}

// Main function
async function main() {
  console.log('🎨 Kids Story Scene Image Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const isRunning = await checkComfyUI();
  if (!isRunning) {
    console.log('❌ ComfyUI is not running!');
    console.log('   Please open ComfyUI.app and try again.');
    process.exit(1);
  }

  console.log('✅ ComfyUI is running');
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`🖼️  Size: ${IMAGE_WIDTH}x${IMAGE_HEIGHT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Get prophets to generate
  const args = process.argv.slice(2);
  const prophetsToGenerate = args.length > 0
    ? args
    : Object.keys(PROPHET_SCENE_PROMPTS);

  console.log(`\nGenerating for: ${prophetsToGenerate.join(', ')}\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;

  for (const prophetId of prophetsToGenerate) {
    console.log(`\n📖 ${prophetId.toUpperCase()}`);
    const { generated, skipped } = await generateForProphet(prophetId);
    totalGenerated += generated;
    totalSkipped += skipped;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Generated: ${totalGenerated} images`);
  console.log(`⏭️  Skipped: ${totalSkipped} images`);
  console.log('🎉 Done!');
}

main().catch(console.error);
