#!/usr/bin/env python3
"""
Generate Arabic letter audio using gTTS (Google Text-to-Speech).
Free, fast, and reliable Arabic TTS.
"""

import os
import sys
from pathlib import Path
from gtts import gTTS
import time

# Set up paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "kids" / "audio" / "letters"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Arabic alphabet data (matching KidsHome.tsx ARABIC_LETTERS)
ARABIC_LETTERS = [
    ("alif", "ألف", "أسد"),
    ("baa", "باء", "بطة"),
    ("taa", "تاء", "تفاح"),
    ("thaa", "ثاء", "ثعلب"),
    ("jeem", "جيم", "جمل"),
    ("haa", "حاء", "حصان"),
    ("khaa", "خاء", "خروف"),
    ("dal", "دال", "دب"),
    ("thal", "ذال", "ذرة"),
    ("raa", "راء", "رمان"),
    ("zay", "زاي", "زرافة"),
    ("seen", "سين", "سمكة"),
    ("sheen", "شين", "شمس"),
    ("saad", "صاد", "صقر"),
    ("daad", "ضاد", "ضفدع"),
    ("taa2", "طاء", "طائر"),
    ("thaa2", "ظاء", "ظبي"),
    ("ayn", "عين", "عنب"),
    ("ghayn", "غين", "غزال"),
    ("faa", "فاء", "فيل"),
    ("qaaf", "قاف", "قمر"),
    ("kaaf", "كاف", "كتاب"),
    ("laam", "لام", "ليمون"),
    ("meem", "ميم", "موز"),
    ("noon", "نون", "نجمة"),
    ("haa2", "هاء", "هلال"),
    ("waw", "واو", "وردة"),
    ("yaa", "ياء", "يد"),
]

def generate_audio(text: str, output_path: Path) -> bool:
    """Generate audio for given Arabic text."""
    try:
        tts = gTTS(text=text, lang='ar', slow=False)
        tts.save(str(output_path))
        return True
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return False

def main():
    print("🎙️  Noor Soad Kids - Arabic Letter Audio Generator (gTTS)")
    print("=" * 55)
    print(f"📁 Output: {OUTPUT_DIR}")
    print()

    success = 0
    failed = 0

    print(f"📝 Generating audio for {len(ARABIC_LETTERS)} Arabic letters...")
    print()

    for i, (letter_id, arabic_name, example) in enumerate(ARABIC_LETTERS, 1):
        print(f"[{i:2d}/{len(ARABIC_LETTERS)}] {letter_id}: {arabic_name} → {example}")

        # Generate letter pronunciation: "هذا حرف [name]"
        letter_text = f"هذا حرف {arabic_name}"
        letter_file = OUTPUT_DIR / f"letter-{letter_id}.mp3"

        if generate_audio(letter_text, letter_file):
            print(f"    ✅ letter-{letter_id}.mp3")
            success += 1
        else:
            failed += 1

        # Small delay to avoid rate limiting
        time.sleep(0.5)

        # Generate example: "حرف [name]. مثال: [example]."
        example_text = f"حرف {arabic_name}. مثال: {example}."
        example_file = OUTPUT_DIR / f"letter-{letter_id}-example.mp3"

        if generate_audio(example_text, example_file):
            print(f"    ✅ letter-{letter_id}-example.mp3")
            success += 1
        else:
            failed += 1

        # Small delay to avoid rate limiting
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
