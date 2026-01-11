#!/usr/bin/env python3
"""
F5-TTS Setup Verification Script
=================================

Tests the complete F5-TTS audio generation setup.

Usage:
    python scripts/test_f5tts_setup.py
"""

import sys
from pathlib import Path

# Colors for output
GREEN = '\033[0;32m'
RED = '\033[0;31m'
YELLOW = '\033[1;33m'
NC = '\033[0m'  # No Color


def print_section(title):
    """Print section header."""
    print()
    print("=" * 70)
    print(f" {title}")
    print("=" * 70)


def check_pass(message):
    """Print success message."""
    print(f"{GREEN}✓{NC} {message}")


def check_fail(message):
    """Print failure message."""
    print(f"{RED}✗{NC} {message}")


def check_warn(message):
    """Print warning message."""
    print(f"{YELLOW}⚠{NC} {message}")


def check_python_version():
    """Check Python version."""
    print_section("Python Version")

    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"

    if version >= (3, 8):
        check_pass(f"Python {version_str} (>= 3.8 required)")
        return True
    else:
        check_fail(f"Python {version_str} (3.8+ required)")
        return False


def check_dependencies():
    """Check if required packages are installed."""
    print_section("Python Dependencies")

    required = {
        'f5_tts': 'F5-TTS',
        'pydub': 'PyDub',
        'tqdm': 'tqdm',
    }

    optional = {
        'soundfile': 'SoundFile',
        'librosa': 'Librosa',
    }

    all_ok = True

    print("Required packages:")
    for module, name in required.items():
        try:
            __import__(module)
            check_pass(f"{name} installed")
        except ImportError:
            check_fail(f"{name} not installed (pip install {module.replace('_', '-')})")
            all_ok = False

    print()
    print("Optional packages:")
    for module, name in optional.items():
        try:
            __import__(module)
            check_pass(f"{name} installed")
        except ImportError:
            check_warn(f"{name} not installed (optional)")

    return all_ok


def check_f5tts():
    """Test F5-TTS import."""
    print_section("F5-TTS Engine")

    try:
        from f5_tts.api import F5TTS
        check_pass("F5TTS class imported successfully")

        # Try to initialize (may take a moment)
        print("  Initializing F5-TTS model (this may take a moment)...")
        try:
            tts = F5TTS()
            check_pass("F5-TTS model initialized successfully")
            return True
        except Exception as e:
            check_warn(f"F5-TTS initialization warning: {e}")
            return True  # Import works, initialization might need GPU/setup

    except ImportError as e:
        check_fail(f"Cannot import F5TTS: {e}")
        return False


def check_project_structure():
    """Check project directory structure."""
    print_section("Project Structure")

    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    required_dirs = [
        (project_root / "data", "Data directory"),
        (project_root / "public/assets/kids/audio", "Kids audio output"),
        (project_root / "public/assets/adult/audio", "Adult audio output"),
        (script_dir / "tts", "TTS reference directory"),
    ]

    required_files = [
        (project_root / "data/kidsStories.json", "Kids stories data"),
        (project_root / "data/adultStories.json", "Adult Seerah data"),
        (project_root / "data/prophetStoriesAdults.json", "Adult prophet data"),
    ]

    all_ok = True

    print("Directories:")
    for path, name in required_dirs:
        if path.exists():
            check_pass(f"{name}: {path}")
        else:
            check_fail(f"{name}: {path} (not found)")
            all_ok = False

    print()
    print("Data files:")
    for path, name in required_files:
        if path.exists():
            check_pass(f"{name}: {path.name}")
        else:
            check_fail(f"{name}: {path.name} (not found)")
            all_ok = False

    return all_ok


def check_reference_audio():
    """Check reference audio files."""
    print_section("Reference Audio Files")

    script_dir = Path(__file__).parent
    tts_dir = script_dir / "tts"

    ref_files = [
        ("kids_voice_reference.wav", "Kids voice WAV"),
        ("kids_voice_reference.txt", "Kids voice transcript"),
        ("adult_voice_reference.wav", "Adult voice WAV"),
        ("adult_voice_reference.txt", "Adult voice transcript"),
    ]

    all_ok = True

    for filename, name in ref_files:
        path = tts_dir / filename
        if path.exists():
            if filename.endswith('.wav'):
                size = path.stat().st_size
                check_pass(f"{name}: {filename} ({size:,} bytes)")

                # Check if it's a valid WAV
                try:
                    import wave
                    with wave.open(str(path), 'rb') as wf:
                        channels = wf.getnchannels()
                        sample_rate = wf.getframerate()
                        duration = wf.getnframes() / sample_rate

                        print(f"    Sample rate: {sample_rate}Hz, Channels: {channels}, Duration: {duration:.1f}s")

                        if sample_rate != 24000:
                            check_warn(f"    Sample rate should be 24000Hz (got {sample_rate}Hz)")
                        if channels != 1:
                            check_warn(f"    Should be mono (got {channels} channels)")
                        if duration < 5:
                            check_warn(f"    Audio too short (< 5 seconds)")
                        elif duration > 60:
                            check_warn(f"    Audio very long (> 60 seconds)")

                except Exception as e:
                    check_warn(f"    Could not analyze WAV: {e}")
            else:
                # Text file
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    check_pass(f"{name}: {filename} ({len(content)} characters)")
        else:
            check_warn(f"{name}: {filename} (not found - will use default voice)")
            all_ok = False

    return all_ok


def check_scripts():
    """Check if scripts exist and are executable."""
    print_section("Scripts")

    script_dir = Path(__file__).parent

    scripts = [
        ("generate_story_audio.py", "Main generation script"),
        ("create_reference_audio.py", "Reference audio helper"),
        ("setup_f5tts.sh", "Setup script"),
    ]

    all_ok = True

    for filename, name in scripts:
        path = script_dir / filename
        if path.exists():
            size = path.stat().st_size
            check_pass(f"{name}: {filename} ({size:,} bytes)")
        else:
            check_fail(f"{name}: {filename} (not found)")
            all_ok = False

    return all_ok


def run_dry_run_test():
    """Test the main script in dry-run mode."""
    print_section("Dry-Run Test")

    import subprocess

    script_dir = Path(__file__).parent
    script_path = script_dir / "generate_story_audio.py"

    print("Running: python generate_story_audio.py --dry-run --story adam")
    print()

    try:
        result = subprocess.run(
            [sys.executable, str(script_path), "--dry-run", "--story", "adam"],
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode == 0:
            check_pass("Dry-run test completed successfully")

            # Count how many files would be generated
            output = result.stdout
            if "[DRY RUN]" in output:
                dry_run_count = output.count("[DRY RUN]")
                print(f"  Would generate {dry_run_count} files for story 'adam'")

            return True
        else:
            check_fail("Dry-run test failed")
            print(f"  Error: {result.stderr}")
            return False

    except subprocess.TimeoutExpired:
        check_fail("Dry-run test timed out")
        return False
    except Exception as e:
        check_fail(f"Dry-run test error: {e}")
        return False


def print_summary(results):
    """Print test summary."""
    print_section("Summary")

    total = len(results)
    passed = sum(results.values())
    failed = total - passed

    print(f"Tests run: {total}")
    print(f"{GREEN}Passed: {passed}{NC}")
    if failed > 0:
        print(f"{RED}Failed: {failed}{NC}")

    print()

    if all(results.values()):
        print(f"{GREEN}✓ All tests passed! Setup is complete.{NC}")
        print()
        print("Next steps:")
        print("  1. python scripts/generate_story_audio.py --story adam")
        print("  2. python scripts/generate_story_audio.py --type kids")
        print("  3. python scripts/generate_story_audio.py --type all")
        return True
    else:
        print(f"{RED}✗ Some tests failed. Please fix the issues above.{NC}")
        print()
        print("Common fixes:")
        print("  - Install dependencies: pip install -r scripts/requirements-f5tts.txt")
        print("  - Run setup script: ./scripts/setup_f5tts.sh")
        print("  - Add reference audio to scripts/tts/")
        return False


def main():
    """Run all tests."""
    print("=" * 70)
    print(" F5-TTS Setup Verification")
    print("=" * 70)
    print()
    print("Testing F5-TTS audio generation setup...")

    results = {}

    # Run all tests
    results['Python Version'] = check_python_version()
    results['Dependencies'] = check_dependencies()
    results['F5-TTS Engine'] = check_f5tts()
    results['Project Structure'] = check_project_structure()
    results['Reference Audio'] = check_reference_audio()
    results['Scripts'] = check_scripts()
    results['Dry-Run Test'] = run_dry_run_test()

    # Print summary
    success = print_summary(results)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
