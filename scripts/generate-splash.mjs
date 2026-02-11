#!/usr/bin/env node
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SPLASH_SIZE = 2732;
const ICON_SIZE = 400;
const BACKGROUND_COLOR = '#1e293b'; // Dark slate

const outputDir = join(projectRoot, 'ios/App/App/Assets.xcassets/Splash.imageset');

async function generateSplashScreen() {
  console.log('🎨 Generating splash screens for Hikma Quran iOS app...\n');

  try {
    // Read the SVG icon
    const iconSvgPath = join(projectRoot, 'public/icons/icon.svg');
    const iconSvg = readFileSync(iconSvgPath, 'utf8');

    console.log('📖 Read icon SVG');

    // Create the icon PNG at the desired size
    const iconBuffer = await sharp(Buffer.from(iconSvg))
      .resize(ICON_SIZE, ICON_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    console.log(`✓ Converted icon to ${ICON_SIZE}x${ICON_SIZE} PNG`);

    // Create the base splash screen with dark slate background
    const baseImage = await sharp({
      create: {
        width: SPLASH_SIZE,
        height: SPLASH_SIZE,
        channels: 4,
        background: BACKGROUND_COLOR
      }
    })
      .composite([
        {
          input: iconBuffer,
          gravity: 'center'
        }
      ])
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();

    console.log(`✓ Created ${SPLASH_SIZE}x${SPLASH_SIZE} splash screen with centered icon\n`);

    // Save all three required files
    const files = [
      'splash-2732x2732.png',      // 3x
      'splash-2732x2732-1.png',    // 2x
      'splash-2732x2732-2.png'     // 1x
    ];

    for (const filename of files) {
      const outputPath = join(outputDir, filename);
      await sharp(baseImage).toFile(outputPath);
      console.log(`✓ Saved ${filename}`);
    }

    console.log('\n🎉 All splash screens generated successfully!');
    console.log(`📁 Location: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error generating splash screens:', error);
    process.exit(1);
  }
}

generateSplashScreen();
