#!/usr/bin/env python3
"""
Generate Arabic letter audio using XTTS v2 neural TTS.
Coqui TTS with multilingual support for high-quality Arabic speech.
"""

import os
import sys
from pathlib import Path

# Fix for PyTorch 2.6+ weights_only issue
import torch
torch.serialization.add_safe_globals([])  # Initialize
try:
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import XttsAudioConfig, XttsArgs
    torch.serialization.add_safe_globals([XttsConfig, XttsAudioConfig, XttsArgs])
except ImportError:
    pass

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

def main():
    print("🎙️  Noor Soad Kids - Arabic Letter Audio Generator")
    print("=" * 50)
    print(f"📁 Output: {OUTPUT_DIR}")
    print()

    # Import TTS
    try:
        from TTS.api import TTS
    except ImportError:
        print("❌ Coqui TTS not installed. Run: pip install TTS")
        sys.exit(1)

    # Initialize XTTS v2
    print("🔄 Loading XTTS v2 model (this may take a moment)...")
    try:
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
        print("✅ Model loaded!")
    except Exception as e:
        print(f"❌ Failed to load XTTS: {e}")
        sys.exit(1)

    # Check for GPU
    import torch
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"🖥️  Using device: {device}")

    if device != "cpu":
        tts.to(device)

    print()
    print(f"📝 Generating audio for {len(ARABIC_LETTERS)} Arabic letters...")
    print()

    success = 0
    failed = 0

    for i, (letter_id, arabic_name, example) in enumerate(ARABIC_LETTERS, 1):
        print(f"[{i:2d}/{len(ARABIC_LETTERS)}] {letter_id}: {arabic_name} → {example}")

        # Generate letter pronunciation: "هذا حرف [name]"
        letter_text = f"هذا حرف {arabic_name}"
        letter_file = OUTPUT_DIR / f"letter-{letter_id}.wav"

        try:
            tts.tts_to_file(
                text=letter_text,
                language="ar",
                file_path=str(letter_file)
            )
            print(f"    ✅ letter-{letter_id}.wav")
        except Exception as e:
            print(f"    ❌ letter-{letter_id}.wav: {e}")
            failed += 1
            continue

        # Generate example: "حرف [name]. مثال: [example]."
        example_text = f"حرف {arabic_name}. مثال: {example}."
        example_file = OUTPUT_DIR / f"letter-{letter_id}-example.wav"

        try:
            tts.tts_to_file(
                text=example_text,
                language="ar",
                file_path=str(example_file)
            )
            print(f"    ✅ letter-{letter_id}-example.wav")
            success += 2
        except Exception as e:
            print(f"    ❌ letter-{letter_id}-example.wav: {e}")
            failed += 1

    print()
    print("=" * 50)
    print(f"📊 Generation complete!")
    print(f"    ✅ Success: {success}")
    print(f"    ❌ Failed: {failed}")
    print()

    # Convert WAV to MP3 using ffmpeg
    print("🔄 Converting WAV to MP3...")
    wav_files = list(OUTPUT_DIR.glob("*.wav"))

    if not wav_files:
        print("⚠️  No WAV files to convert")
        return

    for wav_file in wav_files:
        mp3_file = wav_file.with_suffix(".mp3")
        cmd = f'ffmpeg -y -i "{wav_file}" -acodec libmp3lame -ab 192k "{mp3_file}" 2>/dev/null'
        result = os.system(cmd)
        if result == 0:
            wav_file.unlink()  # Delete WAV after successful conversion
            print(f"    ✅ {mp3_file.name}")
        else:
            print(f"    ❌ Failed to convert {wav_file.name}")

    print()
    print("🎉 All done!")
    print(f"📁 Files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
