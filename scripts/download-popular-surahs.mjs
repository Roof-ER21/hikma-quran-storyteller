#!/usr/bin/env node
/**
 * Download popular surah audio files for offline use
 *
 * Downloads audio files for important surahs across 3 reciters:
 * - ar.alafasy (128kbps)
 * - ar.husary (128kbps)
 * - ar.minshawimujawwad (64kbps)
 *
 * Popular Surahs:
 * - Surah 1: Al-Fatiha (7 verses)
 * - Surah 2:255: Ayat al-Kursi (1 verse)
 * - Surah 36: Ya-Sin (83 verses)
 * - Surah 67: Al-Mulk (30 verses)
 * - Surah 112: Al-Ikhlas (already available offline)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_OUTPUT_DIR = path.join(__dirname, '../public/assets/quran/offline');

// Reciters configuration: [identifier, bitrate]
const RECITERS = [
  ['ar.alafasy', '128'],
  ['ar.husary', '128'],
  ['ar.minshawimujawwad', '64']
];

// Surah data: [surahNumber, surahName, verseCount, globalStartVerse]
const POPULAR_SURAHS = [
  [1, 'Al-Fatiha', 7, 1],
  [36, 'Ya-Sin', 83, 2673],
  [67, 'Al-Mulk', 30, 5242],
];

// Special case: Ayat al-Kursi (Surah 2:255)
const AYAT_AL_KURSI = {
  surah: 2,
  verse: 255,
  globalVerse: 262,
  name: 'Ayat al-Kursi'
};

const CDN_BASE = 'https://cdn.islamic.network/quran/audio';

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
        reject(new Error(`HTTP ${response.statusCode}`));
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

async function downloadSurahForReciter(surah, verseCount, globalStart, surahName, reciter, bitrate) {
  const reciterDir = path.join(BASE_OUTPUT_DIR, reciter, String(surah));

  // Create directory if it doesn't exist
  if (!fs.existsSync(reciterDir)) {
    fs.mkdirSync(reciterDir, { recursive: true });
  }

  let downloaded = 0;
  let failed = 0;
  let skipped = 0;

  for (let verse = 1; verse <= verseCount; verse++) {
    const globalVerse = globalStart + verse - 1;
    const url = `${CDN_BASE}/${bitrate}/${reciter}/${globalVerse}.mp3`;
    const dest = path.join(reciterDir, `${verse}.mp3`);

    // Skip if file already exists
    if (fs.existsSync(dest)) {
      skipped++;
      continue;
    }

    try {
      await downloadFile(url, dest);
      downloaded++;
      process.stdout.write('.');

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 150));
    } catch (err) {
      console.log(`\n   ❌ Verse ${verse} - FAILED: ${err.message}`);
      failed++;
    }
  }

  return { downloaded, failed, skipped };
}

async function downloadAyatAlKursiForReciter(reciter, bitrate) {
  const surahDir = path.join(BASE_OUTPUT_DIR, reciter, String(AYAT_AL_KURSI.surah));

  // Create directory if it doesn't exist
  if (!fs.existsSync(surahDir)) {
    fs.mkdirSync(surahDir, { recursive: true });
  }

  const url = `${CDN_BASE}/${bitrate}/${reciter}/${AYAT_AL_KURSI.globalVerse}.mp3`;
  const dest = path.join(surahDir, `${AYAT_AL_KURSI.verse}.mp3`);

  // Skip if file already exists
  if (fs.existsSync(dest)) {
    return { downloaded: 0, failed: 0, skipped: 1 };
  }

  try {
    await downloadFile(url, dest);
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 150));
    return { downloaded: 1, failed: 0, skipped: 0 };
  } catch (err) {
    console.log(`\n   ❌ FAILED: ${err.message}`);
    return { downloaded: 0, failed: 1, skipped: 0 };
  }
}

async function main() {
  console.log('🎙️  Downloading Popular Quran Surahs for Offline Use');
  console.log('━'.repeat(70));
  console.log('📦 Reciters: ar.alafasy, ar.husary, ar.minshawimujawwad');
  console.log('📖 Surahs: Al-Fatiha (1), Ayat al-Kursi (2:255), Ya-Sin (36), Al-Mulk (67)');
  console.log('━'.repeat(70));

  const totalStats = {
    downloaded: 0,
    failed: 0,
    skipped: 0
  };

  // Download each surah for each reciter
  for (const [reciter, bitrate] of RECITERS) {
    console.log(`\n\n🎙️  Reciter: ${reciter} (${bitrate}kbps)`);
    console.log('─'.repeat(70));

    // Download Ayat al-Kursi
    console.log(`\n📖 Surah 2:255 - ${AYAT_AL_KURSI.name}`);
    process.stdout.write('   Progress: ');
    const kursiStats = await downloadAyatAlKursiForReciter(reciter, bitrate);
    console.log(` ✅ Downloaded: ${kursiStats.downloaded}, Skipped: ${kursiStats.skipped}, Failed: ${kursiStats.failed}`);
    totalStats.downloaded += kursiStats.downloaded;
    totalStats.failed += kursiStats.failed;
    totalStats.skipped += kursiStats.skipped;

    // Download other surahs
    for (const [surah, surahName, verseCount, globalStart] of POPULAR_SURAHS) {
      console.log(`\n📖 Surah ${surah} - ${surahName} (${verseCount} verses)`);
      process.stdout.write('   Progress: ');

      const stats = await downloadSurahForReciter(
        surah,
        verseCount,
        globalStart,
        surahName,
        reciter,
        bitrate
      );

      console.log(` ✅ Downloaded: ${stats.downloaded}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`);

      totalStats.downloaded += stats.downloaded;
      totalStats.failed += stats.failed;
      totalStats.skipped += stats.skipped;
    }
  }

  // Summary
  console.log('\n' + '━'.repeat(70));
  console.log('📊 DOWNLOAD SUMMARY');
  console.log('━'.repeat(70));
  console.log(`✅ Downloaded: ${totalStats.downloaded} files`);
  console.log(`⏭️  Skipped (already exist): ${totalStats.skipped} files`);
  if (totalStats.failed > 0) {
    console.log(`❌ Failed: ${totalStats.failed} files`);
  }
  console.log(`📁 Output: ${BASE_OUTPUT_DIR}`);
  console.log('\n✨ Popular surahs are now available offline!');
}

main().catch(console.error);
