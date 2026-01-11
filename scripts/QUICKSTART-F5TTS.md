# Quick Start: F5-TTS Story Audio Generation

Get up and running with F5-TTS audio generation in 5 minutes.

## Prerequisites

- Python 3.8 or higher
- macOS, Linux, or Windows
- Internet connection (for initial setup)

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd /Users/a21/Downloads/hikma_-quran-storyteller

# Run setup script (automatically installs everything)
./scripts/setup_f5tts.sh
```

**Or manually:**

```bash
pip install -r scripts/requirements-f5tts.txt
```

This installs:
- F5-TTS (text-to-speech engine)
- pydub (audio processing)
- tqdm (progress bars)

---

## Step 2: Add Reference Audio (Optional, 1 minute)

For voice cloning, add reference audio files:

```bash
# Place your reference audio files here:
scripts/tts/kids_voice_reference.wav      # 10-30 second clip
scripts/tts/kids_voice_reference.txt      # Exact transcript
scripts/tts/adult_voice_reference.wav     # 10-30 second clip
scripts/tts/adult_voice_reference.txt     # Exact transcript
```

**Don't have reference audio?** No problem! The script will use default voice.

### Quick Reference Audio Creation

**Option A: Extract from existing audio**
```bash
python scripts/create_reference_audio.py \
  --extract public/assets/kids/audio/story-adam-scene-0.mp3 \
  --start 0 --duration 20 --output scripts/tts/kids_voice_reference.wav
```

**Option B: Record your own**
Use QuickTime, Audacity, or any audio recorder:
1. Record 15-20 seconds of narration
2. Export as WAV, 24kHz
3. Save exact transcript to .txt file

---

## Step 3: Generate Audio (2 minutes)

### Test First (Dry Run)

```bash
# Preview what will be generated
python scripts/generate_story_audio.py --dry-run --type kids
```

### Generate Kids Stories

```bash
# Generate all kids stories
python scripts/generate_story_audio.py --type kids
```

### Generate Specific Story

```bash
# Just Prophet Adam story
python scripts/generate_story_audio.py --story adam
```

### Generate Everything

```bash
# All stories (kids + adult Seerah + adult prophet)
python scripts/generate_story_audio.py --type all
```

---

## Expected Output

### Kids Stories (25 stories)
```
public/assets/kids/audio/
├── story-adam-scene-0.mp3
├── story-adam-scene-1.mp3
├── ...
├── story-adam-lesson.mp3
├── story-nuh-scene-0.mp3
└── ...
```

### Adult Stories
```
public/assets/adult/audio/
├── seerah-beginning.mp3
├── taif-mercy.mp3
├── adam-creation.mp3
└── ...
```

---

## Verify Results

```bash
# Check generated files
ls -lh public/assets/kids/audio/ | head

# Play a sample (macOS)
afplay public/assets/kids/audio/story-adam-scene-0.mp3

# Check logs
tail scripts/generate_story_audio.log
```

---

## Common Commands

```bash
# Generate kids stories only
python scripts/generate_story_audio.py --type kids

# Generate adult Seerah only
python scripts/generate_story_audio.py --type adult-seerah

# Generate adult prophet stories only
python scripts/generate_story_audio.py --type adult-prophet

# Regenerate specific story
python scripts/generate_story_audio.py --story adam --force

# Regenerate everything
python scripts/generate_story_audio.py --type all --force

# Verbose logging
python scripts/generate_story_audio.py --type kids --verbose

# Validate reference audio
python scripts/create_reference_audio.py --validate
```

---

## Troubleshooting

### "F5-TTS not installed"
```bash
pip install f5-tts
```

### "Reference audio not found"
Add files to `scripts/tts/` or the script will use default voice.

### "Permission denied"
```bash
chmod -R 755 public/assets
```

### Audio quality poor
1. Use better reference audio (24kHz WAV, clear voice)
2. Ensure transcript exactly matches reference audio
3. Record in quiet environment

### Generation too slow
1. Process one story at a time: `--story adam`
2. Use GPU (CUDA) if available
3. Close other applications

---

## Next Steps

After generating audio:

1. **Test in app**: Play audio files to verify quality
2. **Adjust reference**: Improve reference audio if needed
3. **Generate all**: Run full batch generation
4. **Deploy**: Copy files to production

---

## Full Documentation

- **Complete Guide**: [README-F5-TTS-AUDIO.md](README-F5-TTS-AUDIO.md)
- **Script Help**: `python scripts/generate_story_audio.py --help`
- **Reference Audio**: `python scripts/create_reference_audio.py --help`

---

## Example Workflow

```bash
# Day 1: Setup and test
cd /Users/a21/Downloads/hikma_-quran-storyteller
./scripts/setup_f5tts.sh
python scripts/generate_story_audio.py --dry-run --type kids

# Day 2: Create reference audio
# Record 20 seconds of kids narration
# Save as scripts/tts/kids_voice_reference.wav
# Write exact transcript to scripts/tts/kids_voice_reference.txt

# Validate reference
python scripts/create_reference_audio.py --validate

# Day 3: Generate all kids stories
python scripts/generate_story_audio.py --type kids

# Day 4: Generate adult stories
python scripts/generate_story_audio.py --type adult-seerah
python scripts/generate_story_audio.py --type adult-prophet

# Done! All audio files generated.
```

---

## Help & Support

```bash
# Show help
python scripts/generate_story_audio.py --help
python scripts/create_reference_audio.py --help

# Check logs
cat scripts/generate_story_audio.log

# Test F5-TTS
python -c "from f5_tts.api import F5TTS; print('F5-TTS OK')"
```

---

**Time to First Audio**: ~5 minutes
**Total Stories**: 25 kids + 5 adult Seerah + 25 adult prophet = 55 stories
**Expected Files**: ~400+ audio files

**Happy generating!** 🎙️
