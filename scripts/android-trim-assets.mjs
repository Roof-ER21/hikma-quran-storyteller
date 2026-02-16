#!/usr/bin/env node

/**
 * Android Asset Trimmer
 *
 * Removes large audio files from the Android app bundle after Capacitor sync.
 * Quran audio streams from CDN (cdn.islamic.network) and doesn't need
 * to be bundled in the app. Short surahs (105-114) are kept for offline kids mode.
 */

import fs from 'fs';
import path from 'path';

const ANDROID_PUBLIC = path.resolve('android/app/src/main/assets/public');
const QURAN_OFFLINE = path.join(ANDROID_PUBLIC, 'assets', 'quran', 'offline');

// Large reciter folders that stream from CDN (not needed in bundle)
const RECITERS_TO_REMOVE = [
  'ar.alafasy',
  'ar.husary',
  'ar.minshawimujawwad'
];

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  Removed: ${path.relative(ANDROID_PUBLIC, dirPath)}`);
  }
}

function getSize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let size = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      size += getSize(fullPath);
    } else {
      size += fs.statSync(fullPath).size;
    }
  }
  return size;
}

console.log('\n--- Android Asset Trimmer ---\n');

const beforeSize = getSize(ANDROID_PUBLIC);
console.log(`Before: ${(beforeSize / 1024 / 1024).toFixed(1)} MB`);

// Remove large reciter audio folders
console.log('\nRemoving CDN-streamed Quran audio:');
for (const reciter of RECITERS_TO_REMOVE) {
  removeDir(path.join(QURAN_OFFLINE, reciter));
}

const afterSize = getSize(ANDROID_PUBLIC);
const saved = beforeSize - afterSize;

console.log(`\nAfter:  ${(afterSize / 1024 / 1024).toFixed(1)} MB`);
console.log(`Saved:  ${(saved / 1024 / 1024).toFixed(1)} MB`);
console.log('\nShort surahs (105-114) kept for offline kids mode.');
console.log('Full recitations stream from cdn.islamic.network.\n');
