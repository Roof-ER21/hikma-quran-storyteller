import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Icon sizes required for iOS App Store
const ICON_SIZES = [
  { size: 120, name: 'icon-120.png', description: 'iPhone @2x' },
  { size: 152, name: 'icon-152.png', description: 'iPad @2x' },
  { size: 167, name: 'icon-167.png', description: 'iPad Pro @2x' },
  { size: 180, name: 'icon-180.png', description: 'iPhone @3x' },
  { size: 1024, name: 'icon-1024.png', description: 'App Store' }
];

const SVG_PATH = resolve(projectRoot, 'public/icons/icon.svg');
const ICONS_DIR = resolve(projectRoot, 'public/icons');

async function checkSharp() {
  try {
    await import('sharp');
    return true;
  } catch {
    return false;
  }
}

async function generateWithSharp() {
  console.log('Using sharp for PNG generation...\n');
  const sharp = (await import('sharp')).default;
  const svgBuffer = readFileSync(SVG_PATH);

  for (const icon of ICON_SIZES) {
    const outputPath = resolve(ICONS_DIR, icon.name);
    console.log(`Generating ${icon.name} (${icon.size}x${icon.size}) - ${icon.description}...`);

    await sharp(svgBuffer)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        compressionLevel: 9,
        quality: 100
      })
      .toFile(outputPath);

    console.log(`  ✓ Created ${icon.name}`);
  }
}

async function generateWithInkscape() {
  console.log('Using Inkscape for PNG generation...\n');

  for (const icon of ICON_SIZES) {
    const outputPath = resolve(ICONS_DIR, icon.name);
    console.log(`Generating ${icon.name} (${icon.size}x${icon.size}) - ${icon.description}...`);

    try {
      await execAsync(
        `inkscape "${SVG_PATH}" --export-filename="${outputPath}" --export-width=${icon.size} --export-height=${icon.size}`
      );
      console.log(`  ✓ Created ${icon.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${icon.name}:`, error.message);
    }
  }
}

async function generateWithImageMagick() {
  console.log('Using ImageMagick for PNG generation...\n');

  for (const icon of ICON_SIZES) {
    const outputPath = resolve(ICONS_DIR, icon.name);
    console.log(`Generating ${icon.name} (${icon.size}x${icon.size}) - ${icon.description}...`);

    try {
      await execAsync(
        `convert -background none -resize ${icon.size}x${icon.size} "${SVG_PATH}" "${outputPath}"`
      );
      console.log(`  ✓ Created ${icon.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create ${icon.name}:`, error.message);
    }
  }
}

async function checkCommand(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('iOS App Icon Generator');
  console.log('='.repeat(60));
  console.log();

  // Check available tools
  const hasSharp = await checkSharp();
  const hasInkscape = await checkCommand('inkscape');
  const hasImageMagick = await checkCommand('convert');

  console.log('Available tools:');
  console.log(`  Sharp: ${hasSharp ? '✓' : '✗'}`);
  console.log(`  Inkscape: ${hasInkscape ? '✓' : '✗'}`);
  console.log(`  ImageMagick: ${hasImageMagick ? '✓' : '✗'}`);
  console.log();

  if (!hasSharp && !hasInkscape && !hasImageMagick) {
    console.error('❌ No image processing tools available!');
    console.error('\nPlease install one of the following:');
    console.error('  1. npm install sharp (recommended)');
    console.error('  2. brew install inkscape');
    console.error('  3. brew install imagemagick');
    process.exit(1);
  }

  try {
    if (hasSharp) {
      await generateWithSharp();
    } else if (hasInkscape) {
      await generateWithInkscape();
    } else if (hasImageMagick) {
      await generateWithImageMagick();
    }

    console.log();
    console.log('='.repeat(60));
    console.log('✓ Icon generation complete!');
    console.log('='.repeat(60));
    console.log('\nGenerated icons:');
    ICON_SIZES.forEach(icon => {
      console.log(`  • ${icon.name} (${icon.size}x${icon.size}) - ${icon.description}`);
    });
    console.log('\nNext steps:');
    console.log('  1. Update manifest.json with new icons');
    console.log('  2. Add apple-touch-icon links to index.html');
    console.log('  3. Test icons in iOS simulator or device');
  } catch (error) {
    console.error('\n❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

main();
