#!/usr/bin/env python3
"""
Google Cloud TTS Batch Audio Generation for Hikma Quran Storyteller

Generates audio for:
- Kids stories (Neural2-F voice - warm, natural)
- Adult Seerah stories (Wavenet-F - matches existing)
- Adult Prophet stories (Wavenet-F - matches existing)
"""

import argparse
import base64
import json
import os
import sys
import time
from pathlib import Path

import requests

# =============================================================================
# CONFIGURATION
# =============================================================================

PROJECT_ROOT = Path("/Users/a21/Downloads/hikma_-quran-storyteller")
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets"

# Story data files
KIDS_STORIES_FILE = DATA_DIR / "kidsStories.json"
ADULT_SEERAH_FILE = DATA_DIR / "adultStories.json"
ADULT_PROPHET_FILE = DATA_DIR / "prophetStoriesAdults.json"

# Output directories
KIDS_AUDIO_DIR = OUTPUT_DIR / "kids" / "audio"
ADULT_AUDIO_DIR = OUTPUT_DIR / "adult" / "audio"

# Voice configurations
VOICES = {
    "kids": {
        "name": "en-US-Neural2-F",
        "speakingRate": 0.85,  # Slightly slower for kids
        "pitch": 1.0,
    },
    "adult": {
        "name": "en-US-Wavenet-F",
        "speakingRate": 0.90,
        "pitch": 0.0,
    },
}

# API Key
API_KEY = os.environ.get("GOOGLE_CLOUD_TTS_KEY")
if not API_KEY:
    # Try loading from .env.local
    env_file = PROJECT_ROOT / ".env.local"
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                if line.startswith("GOOGLE_CLOUD_TTS_KEY="):
                    API_KEY = line.split("=", 1)[1].strip()
                    break

TTS_URL = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}"


# =============================================================================
# TTS GENERATION
# =============================================================================

def generate_audio(text: str, output_path: Path, voice_type: str = "kids") -> bool:
    """Generate audio using Google Cloud TTS."""
    voice_config = VOICES[voice_type]

    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": "en-US",
            "name": voice_config["name"],
        },
        "audioConfig": {
            "audioEncoding": "MP3",
            "speakingRate": voice_config["speakingRate"],
            "pitch": voice_config["pitch"],
        }
    }

    try:
        response = requests.post(TTS_URL, json=payload, timeout=30)

        if response.status_code != 200:
            print(f"    API Error: {response.status_code}")
            return False

        result = response.json()
        audio_content = base64.b64decode(result["audioContent"])

        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(audio_content)

        return True

    except Exception as e:
        print(f"    Error: {e}")
        return False


# =============================================================================
# STORY GENERATORS
# =============================================================================

def generate_kids_stories(story_id: str = None, force: bool = False) -> tuple:
    """Generate kids story audio."""
    print("=" * 60)
    print("KIDS STORIES - Google Neural2-F")
    print("=" * 60)

    with open(KIDS_STORIES_FILE, 'r', encoding='utf-8') as f:
        stories = json.load(f)

    if story_id:
        stories = [s for s in stories if s['id'] == story_id]

    generated, skipped = 0, 0

    for story in stories:
        sid = story['id']
        print(f"\n{story['prophet']} ({sid})")

        # Generate scenes
        for i, scene in enumerate(story['scenes']):
            output = KIDS_AUDIO_DIR / f"story-{sid}-scene-{i}.mp3"

            if output.exists() and not force:
                print(f"  Scene {i}: SKIP")
                skipped += 1
                continue

            if generate_audio(scene['text'], output, "kids"):
                print(f"  Scene {i}: OK ({output.stat().st_size//1024}KB)")
                generated += 1
            else:
                print(f"  Scene {i}: FAILED")

            time.sleep(0.2)  # Rate limiting

        # Generate lesson
        lesson_output = KIDS_AUDIO_DIR / f"story-{sid}-lesson.mp3"
        if lesson_output.exists() and not force:
            print(f"  Lesson: SKIP")
            skipped += 1
        elif generate_audio(story['lesson'], lesson_output, "kids"):
            print(f"  Lesson: OK")
            generated += 1
        else:
            print(f"  Lesson: FAILED")

        time.sleep(0.2)

    return generated, skipped


def generate_adult_seerah(story_id: str = None, force: bool = False) -> tuple:
    """Generate adult Seerah story audio."""
    print("=" * 60)
    print("ADULT SEERAH - Google Wavenet-F")
    print("=" * 60)

    with open(ADULT_SEERAH_FILE, 'r', encoding='utf-8') as f:
        stories = json.load(f)

    if story_id:
        stories = [s for s in stories if s['id'] == story_id]

    generated, skipped = 0, 0

    for story in stories:
        sid = story['id']
        print(f"\n{story['title']} ({sid})")

        output = ADULT_AUDIO_DIR / f"{sid}.mp3"

        if output.exists() and not force:
            print(f"  SKIP (exists)")
            skipped += 1
            continue

        if generate_audio(story['text'], output, "adult"):
            print(f"  OK ({output.stat().st_size//1024}KB)")
            generated += 1
        else:
            print(f"  FAILED")

        time.sleep(0.3)

    return generated, skipped


def generate_adult_prophet(story_id: str = None, force: bool = False) -> tuple:
    """Generate adult Prophet story audio (sections)."""
    print("=" * 60)
    print("ADULT PROPHET STORIES - Google Wavenet-F")
    print("=" * 60)

    with open(ADULT_PROPHET_FILE, 'r', encoding='utf-8') as f:
        stories = json.load(f)

    if story_id:
        stories = [s for s in stories if s['id'] == story_id]

    generated, skipped = 0, 0

    for story in stories:
        sid = story['id']
        print(f"\n{story['prophetName']} ({sid})")

        for section in story['sections']:
            section_id = section['id']
            output = ADULT_AUDIO_DIR / f"{sid}-{section_id}.mp3"

            if output.exists() and not force:
                print(f"  {section_id}: SKIP")
                skipped += 1
                continue

            if generate_audio(section['content'], output, "adult"):
                print(f"  {section_id}: OK ({output.stat().st_size//1024}KB)")
                generated += 1
            else:
                print(f"  {section_id}: FAILED")

            time.sleep(0.3)

    return generated, skipped


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Generate audio with Google Cloud TTS'
    )
    parser.add_argument(
        '--type',
        choices=['all', 'kids', 'adult-seerah', 'adult-prophet'],
        default='all',
        help='Story type to generate'
    )
    parser.add_argument('--story', help='Specific story ID')
    parser.add_argument('--force', action='store_true', help='Overwrite existing')

    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: GOOGLE_CLOUD_TTS_KEY not set")
        print("Set it with: export GOOGLE_CLOUD_TTS_KEY=your_key")
        sys.exit(1)

    total_gen, total_skip = 0, 0

    if args.type in ['all', 'kids']:
        gen, skip = generate_kids_stories(args.story, args.force)
        total_gen += gen
        total_skip += skip

    if args.type in ['all', 'adult-seerah']:
        gen, skip = generate_adult_seerah(args.story, args.force)
        total_gen += gen
        total_skip += skip

    if args.type in ['all', 'adult-prophet']:
        gen, skip = generate_adult_prophet(args.story, args.force)
        total_gen += gen
        total_skip += skip

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Generated: {total_gen}")
    print(f"Skipped: {total_skip}")
    print("\nDone!")


if __name__ == '__main__':
    main()
