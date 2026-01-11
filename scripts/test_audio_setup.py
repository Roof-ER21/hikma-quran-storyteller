#!/usr/bin/env python3
"""
Test script to verify F5-TTS audio generation setup

Runs quick validation checks before full batch generation.
"""

import sys
from pathlib import Path

def test_imports():
    """Test all required imports"""
    print("Testing imports...")

    try:
        from f5_tts.api import F5TTS
        print("  ✅ f5-tts")
    except ImportError:
        print("  ❌ f5-tts - Run: pip install f5-tts")
        return False

    try:
        from pydub import AudioSegment
        print("  ✅ pydub")
    except ImportError:
        print("  ❌ pydub - Run: pip install pydub")
        return False

    try:
        from tqdm import tqdm
        print("  ✅ tqdm")
    except ImportError:
        print("  ❌ tqdm - Run: pip install tqdm")
        return False

    return True


def test_ffmpeg():
    """Test ffmpeg availability"""
    print("\nTesting ffmpeg...")

    import subprocess
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version = result.stdout.split('\n')[0]
            print(f"  ✅ {version}")
            return True
        else:
            print("  ❌ ffmpeg not working properly")
            return False
    except FileNotFoundError:
        print("  ❌ ffmpeg not found")
        print("     Install: brew install ffmpeg (macOS)")
        print("              apt install ffmpeg (Ubuntu/Debian)")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def test_files():
    """Test required files exist"""
    print("\nTesting required files...")

    project_root = Path("/Users/a21/Downloads/hikma_-quran-storyteller")

    required_files = [
        ("Kids voice WAV", project_root / "scripts/tts/kids_voice_reference.wav"),
        ("Kids voice TXT", project_root / "scripts/tts/kids_voice_reference.txt"),
        ("Adult voice WAV", project_root / "scripts/tts/adult_voice_reference.wav"),
        ("Adult voice TXT", project_root / "scripts/tts/adult_voice_reference.txt"),
        ("Kids stories JSON", project_root / "data/kidsStories.json"),
        ("Adult Seerah JSON", project_root / "data/adultStories.json"),
        ("Adult Prophet JSON", project_root / "data/prophetStoriesAdults.json"),
    ]

    all_exist = True
    for name, path in required_files:
        if path.exists():
            size = path.stat().st_size
            print(f"  ✅ {name} ({size:,} bytes)")
        else:
            print(f"  ❌ {name} - Missing: {path}")
            all_exist = False

    return all_exist


def test_directories():
    """Test output directories exist or can be created"""
    print("\nTesting output directories...")

    project_root = Path("/Users/a21/Downloads/hikma_-quran-storyteller")

    dirs = [
        ("Kids audio", project_root / "public/assets/kids/audio"),
        ("Adult audio", project_root / "public/assets/adult/audio"),
    ]

    for name, path in dirs:
        if path.exists():
            print(f"  ✅ {name} exists")
        else:
            try:
                path.mkdir(parents=True, exist_ok=True)
                print(f"  ✅ {name} created")
            except Exception as e:
                print(f"  ❌ {name} - Can't create: {e}")
                return False

    return True


def test_f5tts_init():
    """Test F5-TTS initialization"""
    print("\nTesting F5-TTS initialization...")

    try:
        from f5_tts.api import F5TTS
        tts = F5TTS()
        print("  ✅ F5-TTS initialized successfully")
        return True
    except Exception as e:
        print(f"  ❌ F5-TTS initialization failed: {e}")
        return False


def test_sample_generation():
    """Test generating a small sample audio"""
    print("\nTesting sample audio generation...")

    try:
        import tempfile
        from f5_tts.api import F5TTS
        from pydub import AudioSegment

        project_root = Path("/Users/a21/Downloads/hikma_-quran-storyteller")
        ref_audio = project_root / "scripts/tts/kids_voice_reference.wav"
        ref_text_file = project_root / "scripts/tts/kids_voice_reference.txt"

        # Load reference text
        with open(ref_text_file, 'r') as f:
            ref_text = f.read().strip()

        # Test text
        test_text = "This is a test of the audio generation system."

        print("  → Initializing F5-TTS...")
        tts = F5TTS()

        print("  → Generating test audio...")
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_wav:
            tmp_wav_path = tmp_wav.name

        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_mp3:
            tmp_mp3_path = tmp_mp3.name

        # Generate WAV
        tts.infer(
            ref_file=str(ref_audio),
            ref_text=ref_text,
            gen_text=test_text,
            file_wave=tmp_wav_path,
            speed=0.75
        )

        print("  → Converting to MP3...")
        audio = AudioSegment.from_wav(tmp_wav_path)
        audio.export(tmp_mp3_path, format="mp3", bitrate="128k")

        # Check file sizes
        wav_size = Path(tmp_wav_path).stat().st_size
        mp3_size = Path(tmp_mp3_path).stat().st_size

        print(f"  ✅ Sample generated successfully")
        print(f"     WAV: {wav_size:,} bytes")
        print(f"     MP3: {mp3_size:,} bytes")
        print(f"     Compression: {mp3_size/wav_size*100:.1f}%")

        # Clean up
        import os
        os.unlink(tmp_wav_path)
        os.unlink(tmp_mp3_path)

        return True

    except Exception as e:
        print(f"  ❌ Sample generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("F5-TTS Audio Generation Setup Test")
    print("=" * 60)

    tests = [
        ("Python imports", test_imports),
        ("ffmpeg", test_ffmpeg),
        ("Required files", test_files),
        ("Output directories", test_directories),
        ("F5-TTS initialization", test_f5tts_init),
        ("Sample generation", test_sample_generation),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n❌ {test_name} crashed: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)

    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")

    print(f"\nTotal: {passed_count}/{total_count} tests passed")

    if passed_count == total_count:
        print("\n🎉 All tests passed! Ready to generate audio.")
        print("\nRun: python scripts/generate_story_audio.py --type all --dry-run")
        return 0
    else:
        print("\n⚠️  Some tests failed. Fix issues before generating audio.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
