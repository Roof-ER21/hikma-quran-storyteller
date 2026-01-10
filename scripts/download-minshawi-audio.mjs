#!/usr/bin/env node
/**
 * Download ar.minshawimujawwad audio files for offline surahs 105-114
 *
 * Downloads 48 verse audio files from Islamic Network CDN
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/assets/quran/offline/ar.minshawimujawwad');

// Surah data: [surahNumber, verseCount, globalStartVerse]
const SURAHS = [
  [105, 5, 6188],   // Al-Fil
  [106, 4, 6193],   // Quraish
  [107, 7, 6197],   // Al-Maun
  [108, 3, 6204],   // Al-Kawthar
  [109, 6, 6207],   // Al-Kafirun
  [110, 3, 6213],   // An-Nasr
  [111, 5, 6216],   // Al-Lahab
  [112, 4, 6221],   // Al-Ikhlas
  [113, 5, 6225],   // Al-Falaq
  [114, 6, 6230],   // An-Nas
];

const CDN_BASE = 'https://cdn.islamic.network/quran/audio/64/ar.minshawimujawwad';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('🎙️  Downloading ar.minshawimujawwad Audio Files');
  console.log('━'.repeat(50));

  let downloaded = 0;
  let failed = 0;

  for (const [surah, verseCount, globalStart] of SURAHS) {
    const surahDir = path.join(OUTPUT_DIR, String(surah));

    // Create directory if it doesn't exist
    if (!fs.existsSync(surahDir)) {
      fs.mkdirSync(surahDir, { recursive: true });
    }

    console.log(`\n📖 Surah ${surah} (${verseCount} verses)`);

    for (let verse = 1; verse <= verseCount; verse++) {
      const globalVerse = globalStart + verse - 1;
      const url = `${CDN_BASE}/${globalVerse}.mp3`;
      const dest = path.join(surahDir, `${verse}.mp3`);

      // Skip if file already exists
      if (fs.existsSync(dest)) {
        console.log(`   ⏭️  Verse ${verse} - already exists`);
        downloaded++;
        continue;
      }

      try {
        await downloadFile(url, dest);
        console.log(`   ✅ Verse ${verse} - downloaded`);
        downloaded++;

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.log(`   ❌ Verse ${verse} - FAILED: ${err.message}`);
        failed++;
      }
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log(`✅ Downloaded: ${downloaded} files`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed} files`);
  }
  console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
