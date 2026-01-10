#!/usr/bin/env python3
"""
Generate narration text files from kidsStories.json.
Creates text files for each scene and lesson.
"""

import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
STORIES_FILE = PROJECT_ROOT / "data" / "kidsStories.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "kids" / "narrations"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def main():
    print("Generating narration text files from kidsStories.json")
    print("=" * 55)

    with open(STORIES_FILE, 'r', encoding='utf-8') as f:
        stories = json.load(f)

    created = 0

    for story in stories:
        story_id = story['id']
        scenes = story['scenes']
        lesson = story['lesson']

        print(f"\nStory: {story_id} ({len(scenes)} scenes)")

        # Create scene text files
        for i, scene in enumerate(scenes):
            filename = f"story-{story_id}-scene-{i}.txt"
            filepath = OUTPUT_DIR / filename
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(scene['text'])
            print(f"  Created: {filename}")
            created += 1

        # Create lesson text file
        lesson_filename = f"story-{story_id}-lesson.txt"
        lesson_filepath = OUTPUT_DIR / lesson_filename
        with open(lesson_filepath, 'w', encoding='utf-8') as f:
            f.write(lesson)
        print(f"  Created: {lesson_filename}")
        created += 1

    print(f"\n{'=' * 55}")
    print(f"Created {created} narration text files")
    print(f"Output: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
