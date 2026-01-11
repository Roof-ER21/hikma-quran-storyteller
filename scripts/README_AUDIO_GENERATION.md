# F5-TTS Audio Generation for Hikma Quran Storyteller

Complete guide for generating high-quality audio narration using F5-TTS voice cloning.

## Overview

This script generates audio files for three types of content:

1. **Kids Stories** (`kidsStories.json`)
   - Speed: 0.75 (slower for children)
   - Files: `story-{id}-scene-{n}.mp3`, `story-{id}-lesson.mp3`
   - Output: `public/assets/kids/audio/`

2. **Adult Seerah** (`adultStories.json`)
   - Speed: 0.85 (natural narration)
   - Files: `{id}.mp3`
   - Output: `public/assets/adult/audio/`

3. **Adult Prophet Stories** (`prophetStoriesAdults.json`)
   - Speed: 0.85 (natural narration)
   - Files: `{id}-{section_id}.mp3`
   - Output: `public/assets/adult/audio/`

## Features

✅ **F5-TTS Voice Cloning** - Uses reference audio for consistent voice
✅ **Real MP3 Output** - Converts WAV to MP3 with pydub (128kbps)
✅ **Long Text Handling** - Automatically chunks and merges audio
✅ **Progress Tracking** - tqdm progress bars
✅ **Smart Skipping** - Avoids regenerating existing files
✅ **Flexible CLI** - Target specific stories or generate all
✅ **Dry Run Mode** - Preview what will be generated

## Installation

### 1. Install Python Dependencies

```bash
pip install f5-tts pydub tqdm
```

### 2. Install ffmpeg (Required for MP3 conversion)

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### 3. Verify Installation

```bash
python -c "from f5_tts.api import F5TTS; from pydub import AudioSegment; print('✅ All dependencies installed')"
```

## Voice Reference Files

The script uses these voice references:

- **Kids voice:**
  - `scripts/tts/kids_voice_reference.wav`
  - `scripts/tts/kids_voice_reference.txt`

- **Adult voice:**
  - `scripts/tts/adult_voice_reference.wav`
  - `scripts/tts/adult_voice_reference.txt`

**Note:** Reference audio should be:
- Clear, high-quality recording
- 5-30 seconds long
- Match the transcript exactly
- WAV format, 16-bit, 22050Hz or 44100Hz

## Usage

### Basic Commands

```bash
# Generate all stories
python scripts/generate_story_audio.py --type all

# Generate only kids stories
python scripts/generate_story_audio.py --type kids

# Generate only adult Seerah stories
python scripts/generate_story_audio.py --type adult-seerah

# Generate only adult Prophet stories
python scripts/generate_story_audio.py --type adult-prophet
```

### Generate Specific Story

```bash
# Generate specific kids story
python scripts/generate_story_audio.py --type kids --story adam

# Generate specific adult Seerah
python scripts/generate_story_audio.py --type adult-seerah --story hijrah-cave

# Generate specific adult Prophet story
python scripts/generate_story_audio.py --type adult-prophet --story adam
```

### Advanced Options

```bash
# Force regenerate (overwrite existing)
python scripts/generate_story_audio.py --type kids --force

# Dry run (see what would be generated)
python scripts/generate_story_audio.py --type all --dry-run

# Verbose logging
python scripts/generate_story_audio.py --type kids --verbose

# Combine options
python scripts/generate_story_audio.py --type kids --story ibrahim --force --verbose
```

## CLI Arguments

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `--type` | choice | `all` | Type of stories: `all`, `kids`, `adult-seerah`, `adult-prophet` |
| `--story` | string | - | Specific story ID (e.g., `adam`, `ibrahim`) |
| `--force` | flag | - | Overwrite existing audio files |
| `--dry-run` | flag | - | Preview without generating |
| `--verbose` | flag | - | Enable debug logging |

## Output Files

### Kids Stories (25 prophets)

Each story generates:
- 10 scene files: `story-adam-scene-0.mp3` to `story-adam-scene-9.mp3`
- 1 lesson file: `story-adam-lesson.mp3`

**Total:** ~275 files per complete generation

### Adult Seerah Stories (5 stories)

- `seerah-beginning.mp3`
- `taif-mercy.mp3`
- `night-journey.mp3`
- `hijrah-cave.mp3`
- `madinah-brotherhood.mp3`

**Total:** 5 files

### Adult Prophet Stories (25 prophets, ~6 sections each)

- `adam-creation.mp3`
- `adam-iblis-refusal.mp3`
- `adam-paradise.mp3`
- ... (multiple sections per prophet)

**Total:** ~150 files

## Technical Details

### Speed Settings

```python
KIDS_SPEED = 0.75    # Slower for children's comprehension
ADULT_SPEED = 0.85   # Natural adult narration pace
```

### Text Chunking

Long text (>500 characters) is automatically:
1. Split at sentence boundaries
2. Generated as separate audio chunks
3. Merged with 200ms pauses between chunks
4. Exported as single MP3 file

### MP3 Conversion

```python
# F5-TTS outputs WAV (high quality, large)
# pydub converts to MP3 (128kbps, smaller)

audio = AudioSegment.from_wav(temp_wav)
audio.export(output_mp3, format="mp3", bitrate="128k")
```

### File Naming Convention

**Kids:**
```
story-{prophet_id}-scene-{index}.mp3
story-{prophet_id}-lesson.mp3
```

**Adult Seerah:**
```
{story_id}.mp3
```

**Adult Prophet:**
```
{prophet_id}-{section_id}.mp3
```

## Example Workflow

### Generate Kids Story for Adam

```bash
python scripts/generate_story_audio.py --type kids --story adam --verbose
```

**Output:**
```
============================================================
KIDS STORIES GENERATION
============================================================

Processing: Adam (adam)
  Scene 0: GENERATED
  Scene 1: GENERATED
  Scene 2: GENERATED
  Scene 3: GENERATED
  Scene 4: GENERATED
  Scene 5: GENERATED
  Scene 6: GENERATED
  Scene 7: GENERATED
  Scene 8: GENERATED
  Scene 9: GENERATED
  Lesson: GENERATED

============================================================
GENERATION SUMMARY
============================================================
Total generated: 11
Total skipped: 0

Done!
```

### Dry Run All Stories

```bash
python scripts/generate_story_audio.py --type all --dry-run
```

Shows what would be generated without actually processing.

## Troubleshooting

### Error: Module 'f5_tts' not found

```bash
pip install f5-tts
```

### Error: pydub can't find ffmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify
ffmpeg -version
```

### Error: CUDA/GPU issues

F5-TTS will automatically use CPU if CUDA is unavailable. Generation will be slower but functional.

### Audio quality issues

1. **Check reference audio:**
   - Should be clear, noise-free
   - Match transcript exactly
   - 5-30 seconds duration

2. **Increase bitrate:**
   Edit script, change:
   ```python
   MP3_BITRATE = "192k"  # Higher quality
   ```

### Generation is slow

**Normal speeds:**
- CPU: ~1-2 minutes per audio file
- GPU: ~10-30 seconds per audio file

**Speed up:**
- Use GPU if available
- Process fewer stories at once
- Generate during off-hours

## Performance

**Estimated generation times (CPU):**

| Type | Files | Time |
|------|-------|------|
| Single kids story | 11 files | ~15 minutes |
| All kids stories | ~275 files | ~6-8 hours |
| Adult Seerah | 5 files | ~10 minutes |
| Adult Prophet stories | ~150 files | ~3-4 hours |
| **Complete generation** | **~430 files** | **~10-12 hours** |

**With GPU:** ~3-4 hours total

## Production Deployment

### Batch Generation Script

```bash
#!/bin/bash
# generate_all_audio.sh

echo "Starting complete audio generation..."

# Kids stories
echo "=== KIDS STORIES ==="
python scripts/generate_story_audio.py --type kids

# Adult Seerah
echo "=== ADULT SEERAH ==="
python scripts/generate_story_audio.py --type adult-seerah

# Adult Prophet
echo "=== ADULT PROPHET ==="
python scripts/generate_story_audio.py --type adult-prophet

echo "Complete! Check logs for any errors."
```

### Incremental Updates

```bash
# Only generate missing files (skip existing)
python scripts/generate_story_audio.py --type all

# Force regenerate specific story
python scripts/generate_story_audio.py --type kids --story adam --force
```

### CI/CD Integration

```yaml
# .github/workflows/generate-audio.yml
name: Generate Audio

on:
  workflow_dispatch:  # Manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          sudo apt install ffmpeg
          pip install f5-tts pydub tqdm

      - name: Generate audio
        run: python scripts/generate_story_audio.py --type all

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: audio-files
          path: public/assets/*/audio/*.mp3
```

## File Structure

```
hikma_-quran-storyteller/
├── scripts/
│   ├── generate_story_audio.py          # Main script
│   ├── README_AUDIO_GENERATION.md       # This file
│   └── tts/
│       ├── kids_voice_reference.wav
│       ├── kids_voice_reference.txt
│       ├── adult_voice_reference.wav
│       └── adult_voice_reference.txt
├── data/
│   ├── kidsStories.json                 # Kids story data
│   ├── adultStories.json                # Seerah stories
│   └── prophetStoriesAdults.json        # Detailed prophet stories
└── public/assets/
    ├── kids/audio/                      # Kids audio output
    │   ├── story-adam-scene-0.mp3
    │   ├── story-adam-scene-1.mp3
    │   └── ...
    └── adult/audio/                     # Adult audio output
        ├── seerah-beginning.mp3
        ├── adam-creation.mp3
        └── ...
```

## Contributing

When adding new stories:

1. **Update JSON files** in `data/`
2. **Run generation:**
   ```bash
   python scripts/generate_story_audio.py --type [story-type] --story [new-id]
   ```
3. **Verify audio quality**
4. **Commit both JSON and MP3 files**

## License

Part of the Hikma Quran Storyteller project.

---

**Last Updated:** January 11, 2026
**Script Version:** 1.0.0
**Python Required:** 3.8+
