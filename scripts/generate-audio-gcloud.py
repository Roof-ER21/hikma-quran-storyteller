#!/usr/bin/env python3
"""
Generate Arabic letter audio using Google Cloud TTS with Egyptian Arabic (ar-EG).
Uses the REST API with API key for authentic Egyptian pronunciation.
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
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "kids" / "audio" / "letters"

# Ensure output directory exists
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Google Cloud TTS API - requires GOOGLE_CLOUD_TTS_KEY environment variable
API_KEY = os.environ.get("GOOGLE_CLOUD_TTS_KEY")
if not API_KEY:
    print("❌ Missing GOOGLE_CLOUD_TTS_KEY environment variable")
    print("   Set it with: export GOOGLE_CLOUD_TTS_KEY=your_key_here")
    sys.exit(1)
TTS_URL = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={API_KEY}"

# Arabic alphabet data (matching KidsHome.tsx ARABIC_LETTERS)
ARABIC_LETTERS = [
    ("alif", "أَلِف", "أ", "أسد"),
    ("baa", "باء", "ب", "بطة"),
    ("taa", "تاء", "ت", "تفاح"),
    ("thaa", "ثاء", "ث", "ثعلب"),
    ("jeem", "جيم", "ج", "جمل"),
    ("haa", "حاء", "ح", "حصان"),
    ("khaa", "خاء", "خ", "خروف"),
    ("dal", "دال", "د", "دب"),
    ("thal", "ذال", "ذ", "ذرة"),
    ("raa", "راء", "ر", "رمان"),
    ("zay", "زاي", "ز", "زرافة"),
    ("seen", "سين", "س", "سمكة"),
    ("sheen", "شين", "ش", "شمس"),
    ("saad", "صاد", "ص", "صقر"),
    ("daad", "ضاد", "ض", "ضفدع"),
    ("taa2", "طاء", "ط", "طائر"),
    ("thaa2", "ظاء", "ظ", "ظبي"),
    ("ayn", "عين", "ع", "عنب"),
    ("ghayn", "غين", "غ", "غزال"),
    ("faa", "فاء", "ف", "فيل"),
    ("qaaf", "قاف", "ق", "قمر"),
    ("kaaf", "كاف", "ك", "كتاب"),
    ("laam", "لام", "ل", "ليمون"),
    ("meem", "ميم", "م", "موز"),
    ("noon", "نون", "ن", "نجمة"),
    ("haa2", "هاء", "ه", "هلال"),
    ("waw", "واو", "و", "وردة"),
    ("yaa", "ياء", "ي", "يد"),
]

def generate_audio(text: str, output_path: Path, voice_name: str = "ar-XA-Wavenet-B") -> bool:
    """Generate audio using Google Cloud TTS REST API."""
    try:
        payload = {
            "input": {"text": text},
            "voice": {
                "languageCode": "ar-XA",  # Arabic
                "name": voice_name,  # WaveNet voice for natural sound
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "speakingRate": 0.85,  # Slightly slower for kids
                "pitch": 0.5,  # Slightly higher for friendly tone
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
    print("🎙️  Noor Soad Kids - Arabic Letter Audio Generator (Google Cloud TTS)")
    print("=" * 65)
    print(f"📁 Output: {OUTPUT_DIR}")
    print(f"🗣️  Voice: ar-XA-Wavenet-B (Arabic WaveNet)")
    print()

    # Test API first
    print("🔄 Testing Google Cloud TTS API...")
    test_payload = {
        "input": {"text": "مرحبا"},
        "voice": {"languageCode": "ar-XA", "name": "ar-XA-Wavenet-B"},
        "audioConfig": {"audioEncoding": "MP3"}
    }
    test_response = requests.post(TTS_URL, json=test_payload)
    if test_response.status_code != 200:
        print(f"❌ API test failed: {test_response.status_code}")
        print(f"   {test_response.text[:300]}")
        sys.exit(1)
    print("✅ API connection successful!")
    print()

    success = 0
    failed = 0

    print(f"📝 Generating audio for {len(ARABIC_LETTERS)} Arabic letters...")
    print()

    for i, (letter_id, arabic_name, letter_char, example) in enumerate(ARABIC_LETTERS, 1):
        print(f"[{i:2d}/{len(ARABIC_LETTERS)}] {letter_id}: {arabic_name} ({letter_char}) → {example}")

        # Generate letter pronunciation: "حرف [name]" - simpler for kids
        letter_text = f"حرف {arabic_name}"
        letter_file = OUTPUT_DIR / f"letter-{letter_id}.mp3"

        if generate_audio(letter_text, letter_file):
            print(f"    ✅ letter-{letter_id}.mp3")
            success += 1
        else:
            failed += 1

        # Small delay to avoid rate limiting
        time.sleep(0.3)

        # Generate example: "[letter] ... [example]"
        # Pronounce the letter sound, then the example word
        example_text = f"{letter_char}... {example}"
        example_file = OUTPUT_DIR / f"letter-{letter_id}-example.mp3"

        if generate_audio(example_text, example_file):
            print(f"    ✅ letter-{letter_id}-example.mp3")
            success += 1
        else:
            failed += 1

        # Small delay to avoid rate limiting
        time.sleep(0.3)

    print()
    print("=" * 65)
    print(f"📊 Generation complete!")
    print(f"    ✅ Success: {success}")
    print(f"    ❌ Failed: {failed}")
    print()
    print("🎉 All done!")
    print(f"📁 Files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
