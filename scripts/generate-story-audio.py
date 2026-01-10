#!/usr/bin/env python3
"""
Generate story narration audio using gTTS (Google Text-to-Speech).
English narration for kids prophet stories.
"""

import os
import sys
from pathlib import Path
from gtts import gTTS
import time

# Set up paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "kids" / "audio"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Story data (matching data/kidsStories.json)
STORIES = [
    {
        "id": "adam",
        "scenes": [
            "Allah made the first person. His name was Adam.",
            "Adam lived in a beautiful garden called Jannah.",
            "The angels said Salam to Adam!",
        ],
        "lesson": "Allah created us with love!",
    },
    {
        "id": "nuh",
        "scenes": [
            "Prophet Nuh loved Allah very much.",
            "Allah asked Nuh to build a big, big boat!",
            "Animals came two by two - lions, birds, and elephants!",
            "Allah kept everyone on the boat safe!",
        ],
        "lesson": "Allah keeps us safe when we listen to Him.",
    },
    {
        "id": "ibrahim",
        "scenes": [
            "Ibrahim loved looking at the stars and moon.",
            "He knew Allah made everything beautiful!",
            "Allah called Ibrahim His friend!",
        ],
        "lesson": "We can be friends with Allah too!",
    },
    {
        "id": "musa",
        "scenes": [
            "Baby Musa floated in a basket on the river.",
            "A princess found him and took care of him!",
            "Allah had a special plan for Musa!",
        ],
        "lesson": "Allah always has a plan for us!",
    },
    {
        "id": "yusuf",
        "scenes": [
            "Yusuf had special dreams from Allah.",
            "Even when things were hard, Yusuf was patient.",
            "Allah helped Yusuf and made him a leader!",
        ],
        "lesson": "Be patient and trust Allah!",
    },
]

def generate_audio(text: str, output_path: Path, lang: str = 'en') -> bool:
    """Generate audio for given text."""
    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(str(output_path))
        return True
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return False

def main():
    print("🎙️  Noor Soad Kids - Story Narration Audio Generator")
    print("=" * 55)
    print(f"📁 Output: {OUTPUT_DIR}")
    print()

    success = 0
    failed = 0

    for story in STORIES:
        story_id = story["id"]
        scenes = story["scenes"]
        lesson = story["lesson"]

        print(f"📖 Story: {story_id}")

        # Generate scene audio
        for i, scene_text in enumerate(scenes):
            output_file = OUTPUT_DIR / f"story-{story_id}-scene-{i}.mp3"
            print(f"    Scene {i}: {scene_text[:40]}...")

            if generate_audio(scene_text, output_file):
                print(f"    ✅ story-{story_id}-scene-{i}.mp3")
                success += 1
            else:
                failed += 1

            time.sleep(0.5)  # Avoid rate limiting

        # Generate lesson audio
        lesson_file = OUTPUT_DIR / f"story-{story_id}-lesson.mp3"
        print(f"    Lesson: {lesson}")

        if generate_audio(lesson, lesson_file):
            print(f"    ✅ story-{story_id}-lesson.mp3")
            success += 1
        else:
            failed += 1

        time.sleep(0.5)
        print()

    print("=" * 55)
    print(f"📊 Generation complete!")
    print(f"    ✅ Success: {success}")
    print(f"    ❌ Failed: {failed}")
    print()
    print("🎉 All done!")
    print(f"📁 Files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
