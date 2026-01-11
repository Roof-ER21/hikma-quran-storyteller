# Quick Start Guide - Audio Generation

Get started generating audio in 5 minutes.

## 1. Install Dependencies

```bash
# Python packages
pip install f5-tts pydub tqdm

# ffmpeg (macOS)
brew install ffmpeg

# ffmpeg (Ubuntu/Debian)
sudo apt install ffmpeg
```

## 2. Test Your Setup

```bash
cd /Users/a21/Downloads/hikma_-quran-storyteller
python scripts/test_audio_setup.py
```

**Expected output:**
```
✅ PASS - Python imports
✅ PASS - ffmpeg
✅ PASS - Required files
✅ PASS - Output directories
✅ PASS - F5-TTS initialization
✅ PASS - Sample generation

🎉 All tests passed! Ready to generate audio.
```

## 3. Preview What Will Be Generated (Dry Run)

```bash
# See what would be generated without actually generating
python scripts/generate_story_audio.py --type all --dry-run
```

## 4. Generate Your First Story

```bash
# Generate Adam's story for kids (11 audio files)
python scripts/generate_story_audio.py --type kids --story adam --verbose
```

**This creates:**
- `public/assets/kids/audio/story-adam-scene-0.mp3` through `scene-9.mp3`
- `public/assets/kids/audio/story-adam-lesson.mp3`

**Time:** ~10-15 minutes (CPU), ~2-3 minutes (GPU)

## 5. Generate All Stories (Production)

```bash
# Option A: Using the main script
python scripts/generate_story_audio.py --type all

# Option B: Using the batch script (recommended)
./scripts/generate_all_audio.sh
```

**Time:** ~10-12 hours (CPU), ~3-4 hours (GPU)

## Common Commands

### Generate by Type

```bash
# Only kids stories (~275 files)
python scripts/generate_story_audio.py --type kids

# Only adult Seerah (5 files)
python scripts/generate_story_audio.py --type adult-seerah

# Only adult Prophet stories (~150 files)
python scripts/generate_story_audio.py --type adult-prophet
```

### Generate Specific Stories

```bash
# Kids stories
python scripts/generate_story_audio.py --type kids --story adam
python scripts/generate_story_audio.py --type kids --story ibrahim
python scripts/generate_story_audio.py --type kids --story muhammad

# Adult Seerah
python scripts/generate_story_audio.py --type adult-seerah --story hijrah-cave

# Adult Prophet
python scripts/generate_story_audio.py --type adult-prophet --story musa
```

### Force Regenerate

```bash
# Overwrite existing files
python scripts/generate_story_audio.py --type kids --story adam --force
```

## File Locations

### Input Files (Voice References)

```
scripts/tts/
├── kids_voice_reference.wav      # Kids narrator voice sample
├── kids_voice_reference.txt      # Transcript of kids sample
├── adult_voice_reference.wav     # Adult narrator voice sample
└── adult_voice_reference.txt     # Transcript of adult sample
```

### Data Files (Stories)

```
data/
├── kidsStories.json              # 25 prophet stories for kids
├── adultStories.json             # 5 Seerah stories
└── prophetStoriesAdults.json     # Detailed prophet stories
```

### Output Files (Generated Audio)

```
public/assets/
├── kids/audio/
│   ├── story-adam-scene-0.mp3
│   ├── story-adam-scene-1.mp3
│   ├── story-adam-lesson.mp3
│   └── ... (~275 files)
└── adult/audio/
    ├── seerah-beginning.mp3
    ├── adam-creation.mp3
    └── ... (~155 files)
```

## Troubleshooting

### "Module not found" errors

```bash
pip install f5-tts pydub tqdm
```

### "ffmpeg not found"

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

### Generation is slow

**Normal:** 1-2 minutes per file on CPU, 10-30 seconds on GPU

**Speed up:**
- Run overnight for full batch
- Use GPU if available
- Generate specific stories only

### Audio quality issues

1. Check reference audio quality
2. Verify transcript matches audio exactly
3. Adjust speed in script if needed:
   ```python
   KIDS_SPEED = 0.80  # Slightly faster
   ADULT_SPEED = 0.90 # Slightly faster
   ```

## Next Steps

1. **✅ Test setup** - Run `test_audio_setup.py`
2. **✅ Generate one story** - Test with Adam's story
3. **✅ Listen & verify** - Check audio quality
4. **✅ Generate all** - Run full batch generation
5. **✅ Commit** - Add generated MP3s to git

## Support

- **Full documentation:** `scripts/README_AUDIO_GENERATION.md`
- **Test script:** `scripts/test_audio_setup.py`
- **Batch script:** `scripts/generate_all_audio.sh`

---

**Happy generating!** 🎙️
