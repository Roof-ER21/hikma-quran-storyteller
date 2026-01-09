# Kids Audio Prebaking Script

## Overview

The `prebake-kids-audio.mjs` script generates offline audio files for the Noor Soad Kids app using Google Gemini TTS API. This enables instant playback without requiring API calls during app usage.

## What Gets Generated

### 1. Arabic Letter Audio (56 files)
For each of the 28 Arabic letters:
- **Letter pronunciation**: Just the letter sound (e.g., "ا")
  - Saved as: `letter-<id>.mp3`
- **Letter with example**: Letter followed by example word (e.g., "ا... أسد")
  - Saved as: `letter-<id>-example.mp3`

### 2. Story Narrations (~30 files)
For each of the 5 prophet stories:
- **Scene narrations**: Audio for each story scene
  - Saved as: `story-<id>-scene-<n>.mp3`
- **Lesson narration**: Audio for the story's lesson
  - Saved as: `story-<id>-lesson.mp3`

## Audio Configuration

| Content Type | Language | Voice | Sample Rate |
|--------------|----------|-------|-------------|
| Arabic letters | ar-XA | Aoede | 24kHz |
| English stories | en-US | Aoede | 24kHz |

## Usage

### Prerequisites

1. **Gemini API Key**: You need a valid Google AI API key
2. **Node.js**: Version 18+ recommended
3. **Dependencies**: Install with `npm install` in the project root

### Running the Script

```bash
# Set your API key
export VITE_GEMINI_API_KEY="your-api-key-here"

# Run the script
node scripts/prebake-kids-audio.mjs
```

Or in one line:
```bash
VITE_GEMINI_API_KEY="your-key" node scripts/prebake-kids-audio.mjs
```

### Expected Output

```
🌟 Starting Kids Audio Prebaking...
📁 Root directory: /Users/a21/Downloads/hikma_-quran-storyteller
🔑 Using API key: AIzaSyDxxx...

🎙️  Generating Arabic letter audio...
  Generating: Alif (ا)...
    ✅ Letter audio -> letter-alif.mp3
  Generating: Alif example (أسد)...
    ✅ Example audio -> letter-alif-example.mp3
  ...

📊 Letter audio generation complete:
   ✅ Success: 56
   ❌ Failed: 0
   📁 Total files: 56

🎙️  Generating kids stories audio...

  📖 Story: Adam (آدم)
    Scene 1/3: "Allah made the first person. His name w..."
      ✅ story-adam-scene-0.mp3
    Scene 2/3: "Adam lived in a beautiful garden calle..."
      ✅ story-adam-scene-1.mp3
    ...

📊 Story audio generation complete:
   ✅ Success: 30
   ❌ Failed: 0
   📁 Total files: 30

✅ All audio generation complete!
⏱️  Total time: 142.35s
📁 Audio files saved to: /Users/a21/Downloads/hikma_-quran-storyteller/public/assets/kids/audio
```

## Output Directory Structure

```
public/assets/kids/audio/
├── letters/
│   ├── letter-alif.mp3
│   ├── letter-alif-example.mp3
│   ├── letter-baa.mp3
│   ├── letter-baa-example.mp3
│   └── ... (56 total files)
├── story-adam-scene-0.mp3
├── story-adam-scene-1.mp3
├── story-adam-scene-2.mp3
├── story-adam-lesson.mp3
├── story-nuh-scene-0.mp3
└── ... (30 total story files)
```

## Rate Limiting

The script includes automatic rate limiting to prevent API throttling:
- **1 second delay** between each API request
- Approximately **86 total requests** (56 letters + 30 stories)
- **Expected runtime**: ~2-3 minutes

## Error Handling

The script handles errors gracefully:
- ✅ **Success**: Files generated and saved
- ⚠️ **Partial failure**: Continues with remaining files, reports errors
- ❌ **Complete failure**: Exits with error code 1

### Common Errors

1. **Missing API Key**
   ```
   ❌ Set VITE_GEMINI_API_KEY or GEMINI_API_KEY before running.
   ```
   **Solution**: Export your API key as environment variable

2. **API Rate Limit**
   ```
   ⚠️  Failed to generate audio: 429 Too Many Requests
   ```
   **Solution**: Wait a few minutes and try again

3. **Invalid API Key**
   ```
   ⚠️  Failed to generate audio: 403 Forbidden
   ```
   **Solution**: Check your API key is valid and has TTS enabled

## Integration with App

The generated audio files are automatically used by the app:

### Letter Audio
```typescript
// In AlphabetActivity component
const letterPath = `/assets/kids/audio/letters/letter-${letter.id}.mp3`;
const examplePath = `/assets/kids/audio/letters/letter-${letter.id}-example.mp3`;
```

### Story Audio
```typescript
// In StoriesActivity component
const sceneUrl = `/assets/kids/audio/story-${story.id}-scene-${sceneIndex}.mp3`;
const lessonUrl = `/assets/kids/audio/story-${story.id}-lesson.mp3`;
```

## File Sizes

Approximate sizes per file:
- **Letter audio**: ~20-30 KB each
- **Letter example audio**: ~40-60 KB each
- **Story scene audio**: ~100-200 KB each
- **Story lesson audio**: ~80-150 KB each

**Total expected size**: ~15-20 MB for all audio files

## Updating Audio

When you update stories or letters:

1. **Modify data source**:
   - Letters: `ARABIC_LETTERS` array in the script
   - Stories: `data/kidsStories.json` file

2. **Regenerate audio**:
   ```bash
   node scripts/prebake-kids-audio.mjs
   ```

3. **Test in app**: Open kids mode and verify audio plays correctly

## Troubleshooting

### Audio files not playing in app

1. **Check file paths**: Ensure output directory matches app expectations
2. **Check file format**: Should be MP3 (24kHz, mono)
3. **Check permissions**: Files should be readable by web server

### Slow generation

- Normal: ~2-3 minutes for all files
- Slow: >5 minutes may indicate network issues
- **Solution**: Check internet connection, try again

### Skipping existing files

The script always regenerates files. To skip existing:

1. Check if file exists before calling `ttsToFile()`
2. Add `--force` flag option to script

## Advanced Usage

### Generate only letters
Comment out the story generation in `main()`:
```javascript
// await generateStoriesAudio();  // Skip stories
```

### Generate only stories
Comment out the letter generation in `main()`:
```javascript
// await generateLetterAudio();  // Skip letters
```

### Custom voice
Modify the `voiceName` parameter in `ttsToFile()` calls:
- Available voices: Aoede, Fenrir, Kore, Puck, Charon

### Custom language
Modify the `languageCode` parameter:
- Arabic: `ar-XA`
- English (US): `en-US`
- English (UK): `en-GB`

## Testing Generated Audio

### Manual test
```bash
# Play a letter audio file (macOS)
afplay public/assets/kids/audio/letters/letter-alif.mp3

# Play a story audio file
afplay public/assets/kids/audio/story-adam-scene-0.mp3
```

### Web test
1. Start the dev server: `npm run dev`
2. Open the app in browser
3. Navigate to Kids Mode
4. Test each activity:
   - Arabic Letters: Click on letters
   - Stories: Play each scene
5. Verify audio plays correctly

## Performance Tips

1. **Run during low-traffic**: API response times are faster
2. **Use stable internet**: Reduces failed requests
3. **Monitor API quota**: Check your Google AI quota limits
4. **Batch processing**: Script handles this automatically

## Maintenance

### When to regenerate
- ✅ After updating story content in `kidsStories.json`
- ✅ After changing letter pronunciations
- ✅ After switching TTS voice
- ✅ When audio quality is poor
- ❌ Not needed for UI-only changes

### Regular checks
- Monthly: Verify all audio files still exist
- After updates: Test audio plays correctly
- Before deployment: Ensure files are committed to git

## Support

For issues or questions:
1. Check error messages in console output
2. Verify API key is valid
3. Test API key with simple Gemini request
4. Check file permissions in output directory
5. Review this documentation

## License

Part of the Noor Soad Quran Storyteller project.
