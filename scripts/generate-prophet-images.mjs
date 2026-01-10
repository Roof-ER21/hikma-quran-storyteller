/**
 * Generate Abstract/Environmental Images for Prophet Stories
 *
 * Uses ComfyUI locally to generate non-figurative images for each prophet story.
 * Images focus on landscapes, objects, light, and atmosphere - no human figures.
 *
 * Prerequisites:
 * 1. Open ComfyUI app (it runs on http://127.0.0.1:8188)
 * 2. Run: node scripts/generate-prophet-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ComfyUI settings
const COMFYUI_URL = 'http://127.0.0.1:8188';
const MODEL = 'dreamshaper8.safetensors'; // Artistic style
const IMAGE_WIDTH = 768;
const IMAGE_HEIGHT = 432; // 16:9 aspect ratio for story headers

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'prophets');

// Abstract/environmental prompts for each prophet (NO human figures)
const PROPHET_IMAGE_PROMPTS = {
  adam: {
    title: "The Garden of Eden",
    prompt: "ethereal garden paradise, lush green trees, golden sunlight streaming through leaves, crystal clear stream, vibrant flowers, peaceful atmosphere, divine light rays, soft clouds, masterpiece, highly detailed, fantasy art style",
    negative: "people, humans, figures, faces, bodies, animals, text, watermark, signature"
  },
  idris: {
    title: "Celestial Ascension",
    prompt: "majestic night sky with countless stars, celestial stairway of light ascending to heavens, aurora borealis, cosmic nebula, divine radiance, mystical atmosphere, ethereal glow, masterpiece, highly detailed",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  nuh: {
    title: "The Great Ark",
    prompt: "massive wooden ark on stormy seas, dramatic thunderclouds, lightning in distance, rain falling, turbulent waves, rainbow breaking through clouds, hope amidst storm, cinematic, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  hud: {
    title: "Ancient City of 'Ad",
    prompt: "ancient magnificent sandstone city ruins in vast desert, towering pillars, golden sand dunes, dramatic sunset, wind-swept desert landscape, archaeological wonder, mysterious atmosphere, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  saleh: {
    title: "The Sacred Mountain",
    prompt: "majestic rocky mountain in Arabian desert, ancient carved stone dwellings, dramatic cliffs, golden hour lighting, peaceful valley below, desert flowers, masterpiece, highly detailed",
    negative: "people, humans, figures, faces, bodies, animals, text, watermark, signature"
  },
  ibrahim: {
    title: "The Sacred House",
    prompt: "ancient stone structure in desert valley, sacred shrine, golden sunrise, mountains in background, peaceful atmosphere, divine light from above, spiritual ambiance, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  lut: {
    title: "Cities of the Plain",
    prompt: "dramatic landscape of ancient ruined cities, Dead Sea at dawn, salt formations, desolate beauty, morning mist, dramatic sky, somber atmosphere, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  ismail: {
    title: "The Well of Zamzam",
    prompt: "sacred spring emerging from desert sand, Mecca valley landscape, rocky hills, clear blue water, divine light, oasis in desert, peaceful atmosphere, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  ishaq: {
    title: "Land of Promise",
    prompt: "fertile green valleys of ancient Canaan, olive groves, rolling hills, shepherd's pastures, golden wheat fields, peaceful landscape, soft morning light, masterpiece",
    negative: "people, humans, figures, faces, bodies, animals, text, watermark, signature"
  },
  yaqub: {
    title: "Journey Through Lands",
    prompt: "ancient caravan trail through desert at twilight, distant oasis, star-filled sky, campfire light, peaceful night scene, travel through wilderness, masterpiece",
    negative: "people, humans, figures, faces, bodies, animals, text, watermark, signature"
  },
  yusuf: {
    title: "Palace of Egypt",
    prompt: "magnificent ancient Egyptian palace interior, golden columns, hieroglyphic walls, Nile view through windows, luxurious throne room, torchlight, masterpiece, highly detailed",
    negative: "people, humans, figures, faces, bodies, statues, text, watermark, signature"
  },
  ayyub: {
    title: "Land of Patience",
    prompt: "humble dwelling in lush oasis, healing spring waters, olive trees recovering, morning dew, rainbow after rain, renewal and hope, peaceful atmosphere, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  shuaib: {
    title: "Madyan Marketplace",
    prompt: "ancient Middle Eastern marketplace at dawn, empty merchant stalls, scales and measures, date palms, morning light through fabric awnings, peaceful atmosphere, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  musa: {
    title: "Mount Sinai",
    prompt: "majestic Mount Sinai at sunrise, divine light emanating from peak, dramatic clouds, sacred mountain, golden rays, burning bush glow, spiritual atmosphere, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  harun: {
    title: "The Tabernacle",
    prompt: "sacred tent sanctuary in desert, golden lampstand light, incense smoke rising, curtains of fine fabric, holy vessels, divine presence, peaceful interior, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  dhulkifl: {
    title: "Steadfast Guardian",
    prompt: "ancient watchtower overlooking peaceful valley, guardian's lamp burning bright, starry night sky, protective walls, faithful vigil, serene atmosphere, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  dawud: {
    title: "Kingdom of Faith",
    prompt: "Jerusalem ancient city at golden hour, stone walls and towers, harp resting on palace balcony, olive trees, peaceful kingdom, divine light, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  sulaiman: {
    title: "Temple of Wisdom",
    prompt: "magnificent ancient temple with golden dome, ornate columns, throne room with gems, elaborate architecture, sunlight through windows, royal splendor, masterpiece",
    negative: "people, humans, figures, faces, bodies, animals, text, watermark, signature"
  },
  ilyas: {
    title: "Mount Carmel",
    prompt: "dramatic mountain peak with altar of stones, rain clouds gathering, lightning in sky, dramatic weather, spiritual atmosphere, ancient Israel landscape, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  alyasa: {
    title: "Healing Waters",
    prompt: "Jordan River at peaceful dawn, healing waters flowing, lush riverbanks, morning mist, olive groves, sacred atmosphere, gentle light, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  yunus: {
    title: "Depths of Mercy",
    prompt: "deep ocean underwater scene, rays of divine light penetrating depths, peaceful blue waters, coral and sea life, hope in darkness, beautiful underwater world, masterpiece",
    negative: "people, humans, figures, faces, bodies, whale, fish, text, watermark, signature"
  },
  zakariya: {
    title: "Temple Sanctuary",
    prompt: "ancient temple inner sanctuary, golden menorah burning, incense altar, curtains of blue and purple, sacred vessels, peaceful prayer chamber, divine light, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  yahya: {
    title: "Jordan Wilderness",
    prompt: "wild Jordan River valley, rocky wilderness, date palms by water, sunrise over desert hills, locusts and wild honey, prophetic landscape, masterpiece",
    negative: "people, humans, figures, faces, bodies, text, watermark, signature"
  },
  isa: {
    title: "Galilee at Dawn",
    prompt: "Sea of Galilee at peaceful sunrise, fishing boats on still water, hills of Nazareth in distance, olive groves, divine light breaking through clouds, spiritual atmosphere, masterpiece",
    negative: "people, humans, figures, faces, bodies, cross, text, watermark, signature"
  }
};

// ComfyUI workflow template for text-to-image
function createWorkflow(prompt, negativePrompt, seed = Math.floor(Math.random() * 999999999)) {
  return {
    "3": {
      "inputs": {
        "seed": seed,
        "steps": 25,
        "cfg": 7,
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
        "text": prompt,
        "clip": ["4", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": negativePrompt,
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
        "filename_prefix": "prophet",
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

  // Queue the prompt
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: workflow,
      client_id: clientId
    })
  });

  const { prompt_id } = await response.json();

  // Wait for completion via WebSocket
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:8188/ws?clientId=${clientId}`);

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'executing' && message.data.node === null && message.data.prompt_id === prompt_id) {
        ws.close();
        resolve(prompt_id);
      }
    });

    ws.on('error', reject);

    // Timeout after 2 minutes
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

  // Find the SaveImage node output
  for (const nodeId of Object.keys(outputs)) {
    const images = outputs[nodeId]?.images;
    if (images && images.length > 0) {
      const image = images[0];
      // Download the image
      const imageResponse = await fetch(`${COMFYUI_URL}/view?filename=${image.filename}&subfolder=${image.subfolder || ''}&type=${image.type}`);
      return Buffer.from(await imageResponse.arrayBuffer());
    }
  }

  return null;
}

// Main generation function
async function generateProphetImages() {
  console.log('🎨 Prophet Story Image Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Check ComfyUI
  const isRunning = await checkComfyUI();
  if (!isRunning) {
    console.log('❌ ComfyUI is not running!');
    console.log('');
    console.log('Please:');
    console.log('1. Open ComfyUI.app from /Applications');
    console.log('2. Wait for it to fully load');
    console.log('3. Run this script again');
    console.log('');
    process.exit(1);
  }

  console.log('✅ ComfyUI is running');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  console.log(`🖼️  Image size: ${IMAGE_WIDTH}x${IMAGE_HEIGHT}`);
  console.log(`🎨 Model: ${MODEL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const prophets = Object.keys(PROPHET_IMAGE_PROMPTS);
  let generated = 0;
  let skipped = 0;

  for (let i = 0; i < prophets.length; i++) {
    const prophetId = prophets[i];
    const prophetData = PROPHET_IMAGE_PROMPTS[prophetId];
    const outputPath = path.join(OUTPUT_DIR, `${prophetId}.png`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`[${i + 1}/${prophets.length}] ⏭️  ${prophetId} - already exists, skipping`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${prophets.length}] 🎨 Generating: ${prophetData.title}`);
    console.log(`    Prompt: ${prophetData.prompt.substring(0, 60)}...`);

    try {
      const workflow = createWorkflow(prophetData.prompt, prophetData.negative);
      const promptId = await queuePrompt(workflow);

      // Wait a moment for the image to be saved
      await new Promise(resolve => setTimeout(resolve, 1000));

      const imageBuffer = await getGeneratedImage(promptId);

      if (imageBuffer) {
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`    ✅ Saved: ${outputPath}`);
        generated++;
      } else {
        console.log(`    ⚠️  No image returned`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }

    // Small delay between generations
    if (i < prophets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Generated: ${generated} images`);
  console.log(`⏭️  Skipped: ${skipped} images (already existed)`);
  console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
  console.log('');
  console.log('🎉 Done! Now run: npm run build && git push');
}

// Run
generateProphetImages().catch(console.error);
