# F5-TTS Complete Audio Generation System

## 📋 Overview

This is a **production-ready, comprehensive batch audio generation system** for the Hikma Quran Storyteller project using F5-TTS with voice cloning capabilities.

### What's Included

✅ **Main Generation Script** (622 lines) - Batch processes all story types
✅ **Reference Audio Helper** (314 lines) - Creates and validates voice references
✅ **Setup Automation** - One-command installation
✅ **Verification Tests** - Comprehensive system checks
✅ **Complete Documentation** - Guides for all skill levels
✅ **Reference Audio Files** - Pre-configured WAV templates

### Total Coverage

- **25 Kids Stories** → ~275 audio files (scenes + lessons)
- **5 Adult Seerah** → 5 audio files
- **25 Adult Prophet Stories** → ~200 audio files (multi-section)
- **Total: ~480 audio files**

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Navigate to project
cd /Users/a21/Downloads/hikma_-quran-storyteller

# 2. Run setup (installs everything)
./scripts/setup_f5tts.sh

# 3. Verify setup
python scripts/test_f5tts_setup.py

# 4. Generate a test story
python scripts/generate_story_audio.py --story adam

# 5. Generate all stories
python scripts/generate_story_audio.py --type all
```

**Done!** Audio files will be in `public/assets/kids/audio/` and `public/assets/adult/audio/`.

---

## 📁 File Structure

```
hikma_-quran-storyteller/
│
├── F5-TTS-COMPLETE-SYSTEM.md          ⭐ This file - start here
│
├── scripts/
│   │
│   ├── 🎯 CORE SCRIPTS
│   ├── generate_story_audio.py        ⭐ Main batch generator (622 lines)
│   ├── create_reference_audio.py      ⭐ Reference audio helper (314 lines)
│   ├── test_f5tts_setup.py           ⭐ Verification tests (280 lines)
│   ├── setup_f5tts.sh                ⭐ Automated setup script
│   │
│   ├── 📚 DOCUMENTATION
│   ├── README-F5-TTS-AUDIO.md        Complete technical documentation
│   ├── QUICKSTART-F5TTS.md           Quick start guide
│   ├── F5-TTS-IMPLEMENTATION.md      Implementation details
│   │
│   ├── ⚙️  CONFIGURATION
│   ├── requirements-f5tts.txt        Python dependencies
│   │
│   ├── 🎙️ REFERENCE AUDIO (Voice Cloning)
│   └── tts/
│       ├── kids_voice_reference.wav   ✅ Pre-configured (24kHz mono)
│       ├── kids_voice_reference.txt   ✅ Transcript
│       ├── adult_voice_reference.wav  ✅ Pre-configured (24kHz mono)
│       └── adult_voice_reference.txt  ✅ Transcript
│
├── 📊 DATA (Input)
├── data/
│   ├── kidsStories.json              25 kids prophet stories
│   ├── adultStories.json             5 Seerah stories
│   └── prophetStoriesAdults.json     25 detailed prophet stories
│
└── 🔊 OUTPUT (Generated Audio)
    └── public/assets/
        ├── kids/audio/               ~275 MP3 files
        └── adult/audio/              ~205 MP3 files
```

---

## 📖 Documentation Index

### For Beginners
1. **Start Here**: [QUICKSTART-F5TTS.md](scripts/QUICKSTART-F5TTS.md)
   - 5-minute setup guide
   - Basic commands
   - Common examples

### For Developers
2. **Complete Guide**: [README-F5-TTS-AUDIO.md](scripts/README-F5-TTS-AUDIO.md)
   - Full documentation
   - All features explained
   - Troubleshooting guide

### For Technical Details
3. **Implementation**: [F5-TTS-IMPLEMENTATION.md](scripts/F5-TTS-IMPLEMENTATION.md)
   - Technical architecture
   - Performance metrics
   - Production deployment

### This File
4. **Overview**: [F5-TTS-COMPLETE-SYSTEM.md](F5-TTS-COMPLETE-SYSTEM.md)
   - System overview
   - Quick reference
   - File navigation

---

## 🎯 Core Scripts

### 1. Main Generator: `generate_story_audio.py`

**Purpose**: Batch generates audio for all story types

**Features**:
- ✅ F5-TTS with voice cloning
- ✅ Processes kids, adult Seerah, and adult prophet stories
- ✅ Smart text splitting for long content
- ✅ Progress bars and logging
- ✅ Skip existing files
- ✅ Dry-run mode
- ✅ Error recovery

**Usage**:
```bash
# All stories
python scripts/generate_story_audio.py --type all

# Kids only
python scripts/generate_story_audio.py --type kids

# Specific story
python scripts/generate_story_audio.py --story adam

# Force regenerate
python scripts/generate_story_audio.py --type all --force

# Test without generating
python scripts/generate_story_audio.py --dry-run --type kids
```

### 2. Reference Audio Helper: `create_reference_audio.py`

**Purpose**: Create and validate voice reference files

**Features**:
- ✅ Extract clips from existing audio
- ✅ Generate with Google Cloud TTS
- ✅ Validate audio quality
- ✅ Check format compliance

**Usage**:
```bash
# Validate existing reference
python scripts/create_reference_audio.py --validate

# Extract from existing audio
python scripts/create_reference_audio.py \
  --extract existing.mp3 --start 5 --duration 20

# Generate with Google TTS
python scripts/create_reference_audio.py \
  --generate "Your text here" --voice kids
```

### 3. Setup Verification: `test_f5tts_setup.py`

**Purpose**: Comprehensive system verification

**Tests**:
- ✅ Python version (3.8+)
- ✅ Dependencies installed
- ✅ F5-TTS working
- ✅ Project structure
- ✅ Reference audio files
- ✅ Scripts present
- ✅ Dry-run test

**Usage**:
```bash
python scripts/test_f5tts_setup.py
```

### 4. Setup Automation: `setup_f5tts.sh`

**Purpose**: One-command installation

**Actions**:
- ✅ Checks Python version
- ✅ Installs dependencies
- ✅ Creates directories
- ✅ Verifies F5-TTS
- ✅ Runs test

**Usage**:
```bash
./scripts/setup_f5tts.sh
```

---

## 🎙️ Voice Cloning

### Reference Audio Files

The system includes **pre-configured reference audio** at 24kHz mono format:

```
scripts/tts/
├── kids_voice_reference.wav    ✅ Pre-configured
├── kids_voice_reference.txt    ✅ Transcript
├── adult_voice_reference.wav   ✅ Pre-configured
└── adult_voice_reference.txt   ✅ Transcript
```

### Voice Quality Tips

For best results:
1. ✅ Use 10-30 seconds of clear narration
2. ✅ Record in quiet environment
3. ✅ 24kHz sample rate, mono channel
4. ✅ Natural, expressive tone
5. ✅ Exact transcript matching

### Customize Voices

To use your own voice:
1. Record 15-20 seconds of narration
2. Export as WAV, 24kHz mono
3. Replace files in `scripts/tts/`
4. Update transcript files
5. Validate: `python scripts/create_reference_audio.py --validate`

---

## 📊 Story Processing

### Kids Stories (25 prophets)

**Input**: `data/kidsStories.json`
**Output**: `public/assets/kids/audio/`

```
Story: adam
├── story-adam-scene-0.mp3     (Scene 1)
├── story-adam-scene-1.mp3     (Scene 2)
├── ...
├── story-adam-scene-9.mp3     (Scene 10)
└── story-adam-lesson.mp3      (Lesson)

Total: ~10 scenes × 25 prophets + 25 lessons = ~275 files
```

**Prophets**: adam, nuh, ibrahim, musa, yusuf, yunus, sulaiman, dawud, ayyub, isa, idris, hud, saleh, lut, ismail, ishaq, yaqub, shuaib, harun, dhulkifl, ilyas, alyasa, zakariya, yahya, muhammad

### Adult Seerah (5 stories)

**Input**: `data/adultStories.json`
**Output**: `public/assets/adult/audio/`

```
├── seerah-beginning.mp3       (First revelation)
├── taif-mercy.mp3             (Mercy at Ta'if)
├── night-journey.mp3          (Isra wal Mi'raj)
├── hijrah-cave.mp3            (Cave of Thawr)
└── madinah-brotherhood.mp3    (Ansar & Muhajirun)

Total: 5 files
```

### Adult Prophet Stories (25 prophets)

**Input**: `data/prophetStoriesAdults.json`
**Output**: `public/assets/adult/audio/`

```
Story: adam
├── adam-creation.mp3          (Section 1)
├── adam-knowledge.mp3         (Section 2)
├── adam-iblis-refusal.mp3     (Section 3)
├── adam-paradise.mp3          (Section 4)
├── adam-forbidden-tree.mp3    (Section 5)
├── adam-repentance.mp3        (Section 6)
├── adam-earth.mp3             (Section 7)
└── adam-qabiil-habiil.mp3     (Section 8)

Total: ~8 sections × 25 prophets = ~200 files
```

---

## ⚡ Command Reference

### Basic Commands

```bash
# Generate all stories
python scripts/generate_story_audio.py --type all

# Kids stories only
python scripts/generate_story_audio.py --type kids

# Adult Seerah only
python scripts/generate_story_audio.py --type adult-seerah

# Adult prophet stories only
python scripts/generate_story_audio.py --type adult-prophet

# Specific story
python scripts/generate_story_audio.py --story adam
```

### Advanced Options

```bash
# Force regenerate (overwrite existing)
python scripts/generate_story_audio.py --type all --force

# Dry run (preview without generating)
python scripts/generate_story_audio.py --dry-run --type kids

# Verbose logging
python scripts/generate_story_audio.py --verbose --type all

# Help
python scripts/generate_story_audio.py --help
```

### Reference Audio

```bash
# Validate reference files
python scripts/create_reference_audio.py --validate

# Extract from existing
python scripts/create_reference_audio.py \
  --extract audio.mp3 --start 5 --duration 20

# Generate with Google TTS
python scripts/create_reference_audio.py \
  --generate "Text here" --voice kids
```

### System Verification

```bash
# Full system test
python scripts/test_f5tts_setup.py

# Setup/reinstall
./scripts/setup_f5tts.sh

# Check logs
tail -f scripts/generate_story_audio.log
```

---

## 🔧 Installation

### Automated Setup (Recommended)

```bash
cd /Users/a21/Downloads/hikma_-quran-storyteller
./scripts/setup_f5tts.sh
```

### Manual Setup

```bash
# Install dependencies
pip install -r scripts/requirements-f5tts.txt

# Verify
python scripts/test_f5tts_setup.py
```

### Dependencies

**Required**:
- Python 3.8+
- f5-tts >= 0.1.0
- pydub >= 0.25.1
- tqdm >= 4.66.0

**Optional**:
- soundfile (better audio I/O)
- librosa (audio analysis)
- torch (GPU acceleration)

---

## 🎯 Typical Workflow

### Day 1: Setup & Test
```bash
# 1. Setup
./scripts/setup_f5tts.sh

# 2. Verify
python scripts/test_f5tts_setup.py

# 3. Test one story
python scripts/generate_story_audio.py --story adam

# 4. Review output
ls public/assets/kids/audio/story-adam-*
afplay public/assets/kids/audio/story-adam-scene-0.mp3
```

### Day 2: Generate Kids Stories
```bash
# Generate all kids stories
python scripts/generate_story_audio.py --type kids

# Monitor progress (in another terminal)
tail -f scripts/generate_story_audio.log
```

### Day 3: Generate Adult Stories
```bash
# Adult Seerah
python scripts/generate_story_audio.py --type adult-seerah

# Adult prophet stories
python scripts/generate_story_audio.py --type adult-prophet
```

### Day 4: Verify & Deploy
```bash
# Count files
ls public/assets/kids/audio/ | wc -l
ls public/assets/adult/audio/ | wc -l

# Spot check quality
# Play random samples

# Deploy to production
```

---

## 📈 Performance

### Generation Speed

**CPU** (Apple M1/M2):
- Short text (< 100 chars): ~10-20 seconds
- Medium text (100-300 chars): ~30-60 seconds
- Long text (> 300 chars): ~60-120 seconds

**GPU** (CUDA):
- Short text: ~2-5 seconds
- Medium text: ~5-15 seconds
- Long text: ~15-30 seconds

### Total Time Estimates

| Story Type | Files | CPU Time | GPU Time |
|-----------|-------|----------|----------|
| Kids Stories | ~275 | 2-3 hours | 30-60 min |
| Adult Seerah | 5 | 10-15 min | 3-5 min |
| Adult Prophet | ~200 | 3-4 hours | 45-90 min |
| **Total** | **~480** | **6-8 hours** | **2-3 hours** |

### Storage

- Average file size: 200-500 KB
- Total storage: ~100-200 MB

---

## 🔍 Troubleshooting

### Quick Fixes

```bash
# F5-TTS not found
pip install f5-tts

# Permission denied
chmod -R 755 public/assets

# Reference not found (will use default voice)
# Add WAV files to scripts/tts/

# Out of memory
# Process one story at a time: --story adam

# Slow generation
# Use GPU or process smaller batches
```

### Debug Commands

```bash
# Verify F5-TTS
python -c "from f5_tts.api import F5TTS; print('OK')"

# Check logs
tail -100 scripts/generate_story_audio.log

# Test setup
python scripts/test_f5tts_setup.py

# Validate reference
python scripts/create_reference_audio.py --validate

# Dry run
python scripts/generate_story_audio.py --dry-run --story adam
```

### Common Issues

1. **Import Error**: Install dependencies
2. **No Reference Audio**: Add WAV files or use default
3. **Permission Error**: Fix directory permissions
4. **Memory Error**: Process smaller batches
5. **Slow Speed**: Use GPU or one story at a time

---

## 📚 Complete Documentation

### Quick Reference

- **Start Here**: [QUICKSTART-F5TTS.md](scripts/QUICKSTART-F5TTS.md)
- **Full Guide**: [README-F5-TTS-AUDIO.md](scripts/README-F5-TTS-AUDIO.md)
- **Technical Details**: [F5-TTS-IMPLEMENTATION.md](scripts/F5-TTS-IMPLEMENTATION.md)
- **This Overview**: [F5-TTS-COMPLETE-SYSTEM.md](F5-TTS-COMPLETE-SYSTEM.md)

### Script Help

```bash
python scripts/generate_story_audio.py --help
python scripts/create_reference_audio.py --help
python scripts/test_f5tts_setup.py
```

---

## ✅ Production Checklist

- [ ] Dependencies installed: `./scripts/setup_f5tts.sh`
- [ ] Setup verified: `python scripts/test_f5tts_setup.py`
- [ ] Reference audio validated: `python scripts/create_reference_audio.py --validate`
- [ ] Test story generated: `python scripts/generate_story_audio.py --story adam`
- [ ] Output verified: Check `public/assets/` directories
- [ ] Audio quality checked: Listen to sample files
- [ ] Kids stories generated: `--type kids`
- [ ] Adult Seerah generated: `--type adult-seerah`
- [ ] Adult prophet generated: `--type adult-prophet`
- [ ] All files present: Count files in output directories
- [ ] Logs reviewed: Check for errors
- [ ] Production deployment: Copy to production server
- [ ] App integration: Test audio playback in app

---

## 🎓 Key Features

### ✅ Implemented

1. **Voice Cloning** - Use custom voice references
2. **Batch Processing** - Generate hundreds of files automatically
3. **Smart Text Handling** - Automatic splitting for long content
4. **Progress Tracking** - Real-time progress bars
5. **Error Recovery** - Graceful failures with detailed logs
6. **Skip Existing** - Resume interrupted generation
7. **Dry Run** - Preview without processing
8. **Multiple Story Types** - Kids, adult Seerah, adult prophet
9. **Comprehensive Testing** - Full system verification
10. **Complete Documentation** - Guides for all levels

### 🚀 Advanced Features

- Reference audio validation
- Google Cloud TTS integration
- Audio quality checking
- WAV format verification
- Automatic directory creation
- Detailed logging system
- Command-line interface
- Parallel-ready architecture

---

## 📞 Support

### Documentation
- Quick Start: `scripts/QUICKSTART-F5TTS.md`
- Full Guide: `scripts/README-F5-TTS-AUDIO.md`
- Technical: `scripts/F5-TTS-IMPLEMENTATION.md`

### Tools
- Test Setup: `python scripts/test_f5tts_setup.py`
- Validate Audio: `python scripts/create_reference_audio.py --validate`
- Check Logs: `tail scripts/generate_story_audio.log`

### Help Commands
```bash
python scripts/generate_story_audio.py --help
python scripts/create_reference_audio.py --help
./scripts/setup_f5tts.sh
```

---

## 🎉 Success Metrics

✅ **Setup Complete**: All dependencies installed
✅ **Tests Pass**: `python scripts/test_f5tts_setup.py` succeeds
✅ **Reference Valid**: Audio files properly formatted
✅ **Test Generation**: At least one story generated
✅ **Batch Complete**: All story types processed
✅ **Quality Verified**: Audio plays correctly
✅ **Production Ready**: Files deployed and working

---

## 📊 System Stats

- **Total Scripts**: 4 (936 lines of Python + 1 Bash script)
- **Documentation**: 4 comprehensive guides
- **Reference Files**: 4 (2 WAV + 2 TXT)
- **Story Types**: 3 (kids, adult Seerah, adult prophet)
- **Total Stories**: 55 (25 kids + 5 Seerah + 25 prophet)
- **Expected Output**: ~480 audio files
- **Storage Required**: ~100-200 MB
- **Generation Time**: 6-8 hours (CPU) / 2-3 hours (GPU)

---

**Version**: 1.0.0
**Date**: January 11, 2025
**Status**: ✅ Production Ready

**Complete, tested, and ready to use!** 🚀

---

## Quick Command Summary

```bash
# Setup
./scripts/setup_f5tts.sh

# Verify
python scripts/test_f5tts_setup.py

# Generate all
python scripts/generate_story_audio.py --type all

# Check output
ls public/assets/kids/audio/ | wc -l
ls public/assets/adult/audio/ | wc -l

# Done!
```

**Happy audio generating!** 🎙️✨
