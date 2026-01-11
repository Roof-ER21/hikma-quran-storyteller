# F5-TTS Story Audio Generation Guide

Comprehensive guide for generating story audio files using F5-TTS voice cloning.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Reference Audio Files](#reference-audio-files)
- [Usage Examples](#usage-examples)
- [Story Types](#story-types)
- [Output Structure](#output-structure)
- [Troubleshooting](#troubleshooting)

---

## Overview

The `generate_story_audio.py` script uses F5-TTS (Fast, Fair, and Fluent Text-to-Speech) to generate high-quality audio narration for:

- **Kids Stories**: Prophet stories with scenes and lessons
- **Adult Seerah**: Stories about Prophet Muhammad (ﷺ)
- **Adult Prophet Stories**: Detailed multi-section prophet stories

### Features

✅ **Voice Cloning**: Uses reference audio to match specific voice characteristics
✅ **Batch Processing**: Generate hundreds of audio files automatically
✅ **Smart Splitting**: Handles long text by splitting at sentence boundaries
✅ **Progress Tracking**: Real-time progress bars and detailed logging
✅ **Skip Existing**: Only generates missing files (use `--force` to regenerate)
✅ **Dry Run Mode**: Preview what will be generated without processing
✅ **Error Recovery**: Graceful error handling with detailed logs

---

## Setup

### 1. Install Dependencies

```bash
# Install F5-TTS
pip install f5-tts

# Install audio processing (for long text merging)
pip install pydub

# Install progress bars
pip install tqdm
```

### 2. Verify Installation

```bash
cd /Users/a21/Downloads/hikma_-quran-storyteller
python scripts/generate_story_audio.py --dry-run --type kids
```

This will show you what would be generated without actually generating files.

---

## Reference Audio Files

Voice cloning requires reference audio files that capture the desired voice characteristics.

### Required Files

Place these files in `scripts/tts/`:

```
scripts/tts/
├── kids_voice_reference.wav      # 10-30 seconds of kids-friendly narration
├── kids_voice_reference.txt      # Transcript of above
├── adult_voice_reference.wav     # 10-30 seconds of adult narration
└── adult_voice_reference.txt     # Transcript of above
```

### Creating Reference Audio

#### Option 1: Record Your Own

1. **Use a good microphone** in a quiet environment
2. **Record 10-30 seconds** of clear, expressive narration
3. **Save as WAV file** (24kHz recommended)
4. **Write exact transcript** in the .txt file

**Example Kids Reference:**
```
Hello! Welcome to the beautiful stories of the Prophets.
These are wonderful tales that will teach you about faith,
courage, and kindness. Let's explore these amazing adventures together!
```

**Example Adult Reference:**
```
The Prophet Muhammad, peace be upon him, showed us the path
of truth and righteousness. Through his life and teachings,
we learn about patience, mercy, justice, and unwavering faith in Allah.
```

#### Option 2: Use Existing Audio

If you already have story audio files:

```bash
# Extract a good 20-second sample
ffmpeg -i existing_audio.mp3 -ss 00:00:05 -t 20 -ar 24000 \
  scripts/tts/kids_voice_reference.wav

# Manually transcribe the audio into the .txt file
```

#### Option 3: Generate Reference with TTS

```bash
# Use a high-quality TTS service to create reference audio
# Google Cloud TTS, ElevenLabs, or similar
# Then use that as your reference
```

### Reference Audio Tips

✅ **Clear pronunciation**: No mumbling or background noise
✅ **Natural pacing**: Not too fast, not too slow
✅ **Good expression**: Warm, engaging tone appropriate for audience
✅ **Consistent volume**: No sudden loud or quiet parts
✅ **Proper format**: WAV, 24kHz sample rate preferred

---

## Usage Examples

### Generate All Stories

```bash
python scripts/generate_story_audio.py --type all
```

Processes all kids stories, adult Seerah, and adult prophet stories.

### Kids Stories Only

```bash
python scripts/generate_story_audio.py --type kids
```

Generates audio for:
- Each scene in each story
- Lesson at end of each story

### Adult Seerah Only

```bash
python scripts/generate_story_audio.py --type adult-seerah
```

Generates one audio file per Seerah story.

### Adult Prophet Stories Only

```bash
python scripts/generate_story_audio.py --type adult-prophet
```

Generates audio for each section of each prophet story.

### Generate Specific Story

```bash
# Generate only Prophet Adam story (kids version)
python scripts/generate_story_audio.py --story adam

# Generate only Hijrah cave story (adult Seerah)
python scripts/generate_story_audio.py --story hijrah-cave --type adult-seerah
```

### Force Regenerate All Files

```bash
# Regenerate everything, even if files exist
python scripts/generate_story_audio.py --type all --force
```

### Dry Run (Preview)

```bash
# See what would be generated without processing
python scripts/generate_story_audio.py --type kids --dry-run
```

### Verbose Logging

```bash
# Enable detailed debug logs
python scripts/generate_story_audio.py --type kids --verbose
```

---

## Story Types

### Kids Stories (25 stories)

**Source:** `data/kidsStories.json`
**Output:** `public/assets/kids/audio/`

Each story generates:
- `story-{id}-scene-0.mp3` through `story-{id}-scene-N.mp3`
- `story-{id}-lesson.mp3`

**Stories:** adam, nuh, ibrahim, musa, yusuf, yunus, sulaiman, dawud, ayyub, isa, idris, hud, saleh, lut, ismail, ishaq, yaqub, shuaib, harun, dhulkifl, ilyas, alyasa, zakariya, yahya, muhammad

**Example output:**
```
story-adam-scene-0.mp3      # Scene 1 narration
story-adam-scene-1.mp3      # Scene 2 narration
...
story-adam-scene-9.mp3      # Scene 10 narration
story-adam-lesson.mp3       # Lesson narration
```

### Adult Seerah Stories (5 stories)

**Source:** `data/adultStories.json`
**Output:** `public/assets/adult/audio/`

Each story generates one file:
- `{story-id}.mp3`

**Stories:** seerah-beginning, taif-mercy, night-journey, hijrah-cave, madinah-brotherhood

**Example output:**
```
seerah-beginning.mp3
taif-mercy.mp3
night-journey.mp3
hijrah-cave.mp3
madinah-brotherhood.mp3
```

### Adult Prophet Stories (25+ stories)

**Source:** `data/prophetStoriesAdults.json`
**Output:** `public/assets/adult/audio/`

Each story section generates:
- `{prophet-id}-{section-id}.mp3`

**Example output for Prophet Adam:**
```
adam-creation.mp3
adam-knowledge.mp3
adam-iblis-refusal.mp3
adam-paradise.mp3
adam-forbidden-tree.mp3
adam-repentance.mp3
adam-earth.mp3
adam-qabiil-habiil.mp3
```

---

## Output Structure

### Directory Layout

```
public/assets/
├── kids/audio/
│   ├── story-adam-scene-0.mp3
│   ├── story-adam-scene-1.mp3
│   ├── story-adam-lesson.mp3
│   ├── story-nuh-scene-0.mp3
│   └── ...
│
└── adult/audio/
    ├── seerah-beginning.mp3
    ├── taif-mercy.mp3
    ├── adam-creation.mp3
    ├── adam-knowledge.mp3
    └── ...
```

### File Naming Convention

- **Kids scenes:** `story-{prophet-id}-scene-{number}.mp3`
- **Kids lessons:** `story-{prophet-id}-lesson.mp3`
- **Adult Seerah:** `{story-id}.mp3`
- **Adult prophet:** `{prophet-id}-{section-id}.mp3`

### Audio Format

- **Format:** MP3
- **Sample Rate:** 24kHz (F5-TTS default)
- **Channels:** Mono
- **Quality:** High-quality neural TTS

---

## Troubleshooting

### Reference Audio Not Found

**Problem:**
```
WARNING - Reference audio not found: scripts/tts/kids_voice_reference.wav
WARNING - Generating without voice cloning
```

**Solution:**
Add reference audio files to `scripts/tts/` directory. The script will use default voice if missing, but voice cloning provides much better results.

### F5-TTS Not Installed

**Problem:**
```
Error: F5-TTS not installed. Please install it with: pip install f5-tts
```

**Solution:**
```bash
pip install f5-tts
```

### Text Too Long Error

**Problem:** Some story sections are very long and fail to generate.

**Solution:** The script automatically splits long text into chunks. If you still have issues, reduce `MAX_TEXT_LENGTH` in the script (default: 500 characters).

### Out of Memory

**Problem:** GPU/CPU runs out of memory during generation.

**Solution:**
1. Process one story type at a time
2. Use `--story` flag to process one story at a time
3. Close other applications
4. Reduce batch processing

### Audio Quality Issues

**Problem:** Generated audio sounds poor or robotic.

**Solution:**
1. Improve reference audio quality
2. Ensure reference audio is 24kHz WAV
3. Make sure reference transcript exactly matches audio
4. Use longer reference audio (20-30 seconds)

### Permission Denied

**Problem:**
```
PermissionError: [Errno 13] Permission denied: 'public/assets/kids/audio/...'
```

**Solution:**
```bash
# Fix permissions
chmod -R 755 public/assets
```

### Generation Very Slow

**Problem:** Processing takes too long.

**Solution:**
1. Use GPU if available (much faster)
2. Process specific stories: `--story adam`
3. Process one type: `--type kids`
4. Enable skip existing: remove `--force` flag

### Files Not Generated

**Problem:** Script completes but no files created.

**Solution:**
1. Check log file: `scripts/generate_story_audio.log`
2. Run with `--verbose` flag
3. Check data files exist in `data/` directory
4. Ensure output directories have write permissions

### Check Generation Log

View detailed logs:
```bash
tail -f scripts/generate_story_audio.log
```

---

## Performance Tips

### Speed Optimization

1. **Use GPU**: F5-TTS runs much faster on CUDA-enabled GPU
2. **Process in Batches**: Use `--type` to process one category at a time
3. **Skip Existing**: Don't use `--force` unless regenerating
4. **Parallel Processing**: Run multiple instances for different story types

### Quality Optimization

1. **High-Quality Reference**: Use professional-sounding reference audio
2. **Exact Transcripts**: Make sure .txt files match audio exactly
3. **Proper Punctuation**: Add periods, commas in story text for natural pauses
4. **Review Output**: Listen to generated files and refine reference audio

---

## Command Reference

```bash
# Full syntax
python scripts/generate_story_audio.py [OPTIONS]

# Options:
--type {all,kids,adult-seerah,adult-prophet}
    Story type to process (default: all)

--story STORY_ID
    Process only specific story ID (e.g., adam, nuh)

--force
    Regenerate existing audio files

--dry-run
    Preview files without generating

--verbose
    Enable verbose debug logging

--help
    Show help message
```

---

## Examples

### Workflow 1: Initial Setup

```bash
# 1. Dry run to preview
python scripts/generate_story_audio.py --dry-run

# 2. Generate kids stories first
python scripts/generate_story_audio.py --type kids

# 3. Generate adult stories
python scripts/generate_story_audio.py --type adult-seerah
python scripts/generate_story_audio.py --type adult-prophet
```

### Workflow 2: Update Specific Story

```bash
# Regenerate Prophet Adam story only
python scripts/generate_story_audio.py --story adam --force
```

### Workflow 3: Production Generation

```bash
# Generate all with logging
python scripts/generate_story_audio.py --type all --verbose 2>&1 | tee generation.log
```

---

## Next Steps

After generating audio files:

1. **Review Quality**: Listen to sample files
2. **Test Integration**: Verify audio plays in app
3. **Optimize Reference**: Improve reference audio if needed
4. **Batch Process**: Generate remaining stories
5. **Deploy**: Move audio files to production

---

## Support

For issues or questions:

1. Check this documentation
2. Review log file: `scripts/generate_story_audio.log`
3. Run with `--verbose` for detailed debugging
4. Check F5-TTS documentation: https://github.com/SWivid/F5-TTS

---

**Last Updated:** January 11, 2025
**Script Version:** 1.0.0
**F5-TTS Version:** Compatible with f5-tts >= 0.1.0
