#!/usr/bin/env python3
"""
Generate story narration audio using Google Cloud TTS.
Reads from kidsStories.json and generates MP3 files.
"""

import os
import sys
import json
import base64
import requests
from pathlib import Path
import time

# Set up paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
STORIES_FILE = PROJECT_ROOT / "data" / "kidsStories.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "kids" / "audio"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Google Cloud TTS API - requires GOOGLE_CLOUD_TTS_KEY environment variable
API_KEY = os.environ.get("GOOGLE_CLOUD_TTS_KEY")
if not API_KEY:
    print("Error: Missing GOOGLE_CLOUD_TTS_KEY environment variable")
    print("   Set it with: export GOOGLE_CLOUD_TTS_KEY=your_key_here")
    sys.exit(1)

TTS_URL = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}"

def generate_audio(text: str, output_path: Path, voice_name: str = "en-US-Wavenet-F") -> bool:
    """Generate audio using Google Cloud TTS REST API."""
    try:
        # Use a child-friendly female voice for English
        payload = {
            "input": {"text": text},
            "voice": {
                "languageCode": "en-US",
                "name": voice_name,
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "speakingRate": 0.9,  # Slightly slower for kids
                "pitch": 1.5,  # Slightly higher for friendly tone
            }
        }

        response = requests.post(TTS_URL, json=payload)

        if response.status_code != 200:
            print(f"    API Error: {response.status_code} - {response.text[:200]}")
            return False

        result = response.json()
        audio_content = base64.b64decode(result["audioContent"])

        with open(output_path, "wb") as f:
            f.write(audio_content)

        return True

    except Exception as e:
        print(f"    Error: {e}")
        return False

def main():
    print("Noor Soad Kids - Story Audio Generator (Google Cloud TTS)")
    print("=" * 60)
    print(f"Output: {OUTPUT_DIR}")
    print()

    # Load stories
    with open(STORIES_FILE, 'r', encoding='utf-8') as f:
        stories = json.load(f)

    success = 0
    failed = 0

    for story in stories:
        story_id = story['id']
        scenes = story['scenes']
        lesson = story['lesson']

        print(f"\nStory: {story_id} - {story['title']} ({len(scenes)} scenes)")

        # Generate scene audio
        for i, scene in enumerate(scenes):
            output_file = OUTPUT_DIR / f"story-{story_id}-scene-{i}.mp3"
            text = scene['text']

            # Truncate display text
            display_text = text[:50] + "..." if len(text) > 50 else text
            print(f"  Scene {i}: {display_text}")

            if generate_audio(text, output_file):
                file_size = output_file.stat().st_size / 1024
                print(f"    -> story-{story_id}-scene-{i}.mp3 ({file_size:.1f}KB)")
                success += 1
            else:
                failed += 1

            time.sleep(0.3)  # Avoid rate limiting

        # Generate lesson audio
        lesson_file = OUTPUT_DIR / f"story-{story_id}-lesson.mp3"
        print(f"  Lesson: {lesson}")

        if generate_audio(lesson, lesson_file):
            file_size = lesson_file.stat().st_size / 1024
            print(f"    -> story-{story_id}-lesson.mp3 ({file_size:.1f}KB)")
            success += 1
        else:
            failed += 1

        time.sleep(0.3)

    print()
    print("=" * 60)
    print(f"Generation complete!")
    print(f"    Success: {success}")
    print(f"    Failed: {failed}")
    print(f"\nFiles saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
