# F5-TTS Audio Generation - Command Cheatsheet

Quick reference for all audio generation commands.

## Setup & Testing

```bash
# Install dependencies
pip install f5-tts pydub tqdm
brew install ffmpeg  # macOS

# Test setup (ALWAYS RUN FIRST)
python scripts/test_audio_setup.py

# Quick check
python -c "from f5_tts.api import F5TTS; from pydub import AudioSegment; print('OK')"
```

## Basic Generation

```bash
# Generate ALL stories (~430 files, 10-12 hours CPU)
python scripts/generate_story_audio.py --type all

# OR use batch script (recommended)
./scripts/generate_all_audio.sh
```

## Generate by Type

```bash
# Kids stories only (~275 files, 6-8 hours)
python scripts/generate_story_audio.py --type kids

# Adult Seerah only (5 files, ~10 min)
python scripts/generate_story_audio.py --type adult-seerah

# Adult Prophet stories only (~150 files, 3-4 hours)
python scripts/generate_story_audio.py --type adult-prophet
```

## Generate Specific Stories

```bash
# Specific kids story
python scripts/generate_story_audio.py --type kids --story adam
python scripts/generate_story_audio.py --type kids --story ibrahim
python scripts/generate_story_audio.py --type kids --story muhammad

# Specific adult Seerah
python scripts/generate_story_audio.py --type adult-seerah --story hijrah-cave
python scripts/generate_story_audio.py --type adult-seerah --story night-journey

# Specific adult Prophet
python scripts/generate_story_audio.py --type adult-prophet --story musa
python scripts/generate_story_audio.py --type adult-prophet --story yusuf
```

## Advanced Options

```bash
# Dry run (preview what would be generated)
python scripts/generate_story_audio.py --type all --dry-run
python scripts/generate_story_audio.py --type kids --story adam --dry-run

# Force regenerate (overwrite existing)
python scripts/generate_story_audio.py --type kids --force
python scripts/generate_story_audio.py --type kids --story adam --force

# Verbose logging (debug mode)
python scripts/generate_story_audio.py --type kids --story adam --verbose

# Combine options
python scripts/generate_story_audio.py --type kids --story ibrahim --force --verbose
```

## Batch Script Options

```bash
# Normal batch generation
./scripts/generate_all_audio.sh

# Batch with force regenerate
./scripts/generate_all_audio.sh --force

# Batch dry run
./scripts/generate_all_audio.sh --dry-run

# Batch with verbose logging
./scripts/generate_all_audio.sh --verbose

# Combine options
./scripts/generate_all_audio.sh --force --verbose
```

## Story IDs Reference

### Kids Stories (25 prophets)
```
adam, nuh, ibrahim, musa, yusuf, yunus, sulaiman, dawud,
ayyub, isa, idris, hud, saleh, lut, ismail, ishaq, yaqub,
shuaib, harun, dhulkifl, ilyas, alyasa, zakariya, yahya, muhammad
```

### Adult Seerah (5 stories)
```
seerah-beginning, taif-mercy, night-journey, hijrah-cave, madinah-brotherhood
```

### Adult Prophet (25 prophets)
```
Same as kids stories: adam, nuh, ibrahim, etc.
```

## File Locations

### Input
```bash
# Voice references
scripts/tts/kids_voice_reference.wav
scripts/tts/kids_voice_reference.txt
scripts/tts/adult_voice_reference.wav
scripts/tts/adult_voice_reference.txt

# Story data
data/kidsStories.json
data/adultStories.json
data/prophetStoriesAdults.json
```

### Output
```bash
# Kids audio
public/assets/kids/audio/story-{id}-scene-{n}.mp3
public/assets/kids/audio/story-{id}-lesson.mp3

# Adult audio
public/assets/adult/audio/{id}.mp3
public/assets/adult/audio/{prophet_id}-{section_id}.mp3
```

## Common Workflows

### First Time Setup
```bash
# 1. Install
pip install f5-tts pydub tqdm
brew install ffmpeg

# 2. Test
python scripts/test_audio_setup.py

# 3. Generate sample
python scripts/generate_story_audio.py --type kids --story adam --verbose

# 4. Verify quality, then generate all
./scripts/generate_all_audio.sh
```

### Update Single Story
```bash
# Edit story in data/*.json
# Then regenerate with force
python scripts/generate_story_audio.py --type kids --story adam --force
```

### Preview Generation
```bash
# See what would be generated without actually generating
python scripts/generate_story_audio.py --type all --dry-run
```

### Incremental Generation
```bash
# Only generate missing files (skip existing)
python scripts/generate_story_audio.py --type all
```

### Full Regeneration
```bash
# Overwrite everything
python scripts/generate_story_audio.py --type all --force
# OR
./scripts/generate_all_audio.sh --force
```

## Troubleshooting

```bash
# Check if imports work
python -c "from f5_tts.api import F5TTS; print('F5-TTS OK')"
python -c "from pydub import AudioSegment; print('pydub OK')"

# Check ffmpeg
ffmpeg -version

# Run full test suite
python scripts/test_audio_setup.py

# Test with verbose logging
python scripts/generate_story_audio.py --type kids --story adam --verbose
```

## Quick Examples

```bash
# Example 1: Generate Adam's story for kids
python scripts/generate_story_audio.py --type kids --story adam

# Example 2: Regenerate all kids stories
python scripts/generate_story_audio.py --type kids --force

# Example 3: Preview what would be generated
python scripts/generate_story_audio.py --type all --dry-run

# Example 4: Generate everything (production)
./scripts/generate_all_audio.sh

# Example 5: Debug specific story
python scripts/generate_story_audio.py --type kids --story ibrahim --verbose
```

## Performance Tips

```bash
# Use GPU if available (automatic detection)
# Generation will be 3-4x faster

# Generate overnight for full batch
nohup ./scripts/generate_all_audio.sh > generation.log 2>&1 &

# Check progress
tail -f generation.log
```

## Help

```bash
# Show all options
python scripts/generate_story_audio.py --help

# Read full docs
cat scripts/README_AUDIO_GENERATION.md
cat scripts/QUICK_START.md
cat AUDIO_GENERATION_SUMMARY.md
```

---

**Created:** January 11, 2026
**Project:** Hikma Quran Storyteller
