#!/usr/bin/env python3
"""
Reference Audio Creator for F5-TTS
===================================

Helper script to create reference audio files from existing audio or text.

This script helps you:
1. Extract clips from existing audio files
2. Generate reference audio using Google Cloud TTS
3. Validate reference audio quality

Usage:
    # Extract from existing audio
    python create_reference_audio.py --extract existing_audio.mp3 --start 5 --duration 20

    # Generate with Google Cloud TTS (requires credentials)
    python create_reference_audio.py --generate "Your reference text here" --voice kids

    # Validate existing reference
    python create_reference_audio.py --validate
"""

import argparse
import os
import sys
from pathlib import Path

# Optional imports
try:
    from pydub import AudioSegment
    HAS_PYDUB = True
except ImportError:
    HAS_PYDUB = False

try:
    from google.cloud import texttospeech
    HAS_GOOGLE_TTS = True
except ImportError:
    HAS_GOOGLE_TTS = False


SCRIPT_DIR = Path(__file__).parent
TTS_DIR = SCRIPT_DIR / "tts"


def extract_clip(input_file: str, output_file: str, start_sec: float, duration_sec: float):
    """Extract audio clip from file."""
    if not HAS_PYDUB:
        print("Error: pydub not installed. Install with: pip install pydub")
        return False

    try:
        print(f"Loading audio from: {input_file}")
        audio = AudioSegment.from_file(input_file)

        start_ms = int(start_sec * 1000)
        end_ms = int((start_sec + duration_sec) * 1000)

        print(f"Extracting clip: {start_sec}s to {start_sec + duration_sec}s")
        clip = audio[start_ms:end_ms]

        # Convert to 24kHz mono WAV
        clip = clip.set_frame_rate(24000).set_channels(1)

        print(f"Saving to: {output_file}")
        clip.export(output_file, format="wav")

        print(f"✓ Success! Duration: {len(clip)/1000:.1f}s")
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False


def generate_with_google_tts(text: str, output_file: str, voice_type: str = "kids"):
    """Generate reference audio using Google Cloud TTS."""
    if not HAS_GOOGLE_TTS:
        print("Error: Google Cloud TTS not installed.")
        print("Install with: pip install google-cloud-texttospeech")
        return False

    try:
        client = texttospeech.TextToSpeechClient()

        # Select voice based on type
        if voice_type == "kids":
            voice = texttospeech.VoiceSelectionParams(
                language_code="en-US",
                name="en-US-Neural2-F",  # Female, warm voice
                ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
            )
        else:  # adult
            voice = texttospeech.VoiceSelectionParams(
                language_code="en-US",
                name="en-US-Neural2-D",  # Male, authoritative
                ssml_gender=texttospeech.SsmlVoiceGender.MALE
            )

        # Configure audio
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16,
            sample_rate_hertz=24000
        )

        # Generate
        print(f"Generating audio with Google Cloud TTS...")
        synthesis_input = texttospeech.SynthesisInput(text=text)
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )

        # Save
        print(f"Saving to: {output_file}")
        with open(output_file, "wb") as out:
            out.write(response.audio_content)

        print(f"✓ Success! Audio generated")
        return True

    except Exception as e:
        print(f"Error: {e}")
        return False


def validate_reference_audio():
    """Validate existing reference audio files."""
    if not HAS_PYDUB:
        print("Warning: pydub not installed. Install for validation: pip install pydub")
        return

    files_to_check = [
        (TTS_DIR / "kids_voice_reference.wav", TTS_DIR / "kids_voice_reference.txt"),
        (TTS_DIR / "adult_voice_reference.wav", TTS_DIR / "adult_voice_reference.txt"),
    ]

    print("=" * 70)
    print("Reference Audio Validation")
    print("=" * 70)
    print()

    all_good = True

    for audio_file, text_file in files_to_check:
        print(f"Checking: {audio_file.name}")

        # Check if files exist
        if not audio_file.exists():
            print(f"  ✗ Audio file not found")
            all_good = False
            continue

        if not text_file.exists():
            print(f"  ✗ Transcript file not found")
            all_good = False
            continue

        # Check audio properties
        try:
            audio = AudioSegment.from_wav(str(audio_file))
            duration = len(audio) / 1000.0
            sample_rate = audio.frame_rate
            channels = audio.channels

            print(f"  ✓ Audio file found")
            print(f"    Duration: {duration:.1f}s")
            print(f"    Sample rate: {sample_rate}Hz")
            print(f"    Channels: {channels}")

            # Validate duration
            if duration < 5:
                print(f"    ⚠ Warning: Audio too short (< 5s)")
                all_good = False
            elif duration > 60:
                print(f"    ⚠ Warning: Audio too long (> 60s)")

            # Validate sample rate
            if sample_rate != 24000:
                print(f"    ⚠ Warning: Sample rate should be 24000Hz")

            # Validate channels
            if channels != 1:
                print(f"    ⚠ Warning: Should be mono (1 channel)")

        except Exception as e:
            print(f"  ✗ Error reading audio: {e}")
            all_good = False
            continue

        # Check transcript
        try:
            with open(text_file, 'r', encoding='utf-8') as f:
                transcript = f.read().strip()

            print(f"  ✓ Transcript file found")
            print(f"    Length: {len(transcript)} characters")

            if len(transcript) < 50:
                print(f"    ⚠ Warning: Transcript seems short")

        except Exception as e:
            print(f"  ✗ Error reading transcript: {e}")
            all_good = False

        print()

    print("=" * 70)
    if all_good:
        print("✓ All reference files are valid!")
    else:
        print("⚠ Some issues found - see warnings above")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(
        description="Create and validate reference audio for F5-TTS",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    group = parser.add_mutually_exclusive_group(required=True)

    group.add_argument(
        '--extract',
        type=str,
        help='Extract clip from existing audio file'
    )

    group.add_argument(
        '--generate',
        type=str,
        help='Generate reference audio using Google Cloud TTS'
    )

    group.add_argument(
        '--validate',
        action='store_true',
        help='Validate existing reference audio files'
    )

    parser.add_argument(
        '--start',
        type=float,
        default=0,
        help='Start time in seconds (for --extract)'
    )

    parser.add_argument(
        '--duration',
        type=float,
        default=20,
        help='Duration in seconds (for --extract)'
    )

    parser.add_argument(
        '--voice',
        choices=['kids', 'adult'],
        default='kids',
        help='Voice type (for --generate)'
    )

    parser.add_argument(
        '--output',
        type=str,
        help='Output file path (optional, auto-generated if not specified)'
    )

    args = parser.parse_args()

    # Ensure TTS directory exists
    TTS_DIR.mkdir(parents=True, exist_ok=True)

    if args.validate:
        validate_reference_audio()

    elif args.extract:
        if not args.output:
            voice_type = input("Voice type (kids/adult): ").strip().lower()
            if voice_type not in ['kids', 'adult']:
                print("Invalid voice type")
                return
            args.output = str(TTS_DIR / f"{voice_type}_voice_reference.wav")

        success = extract_clip(args.extract, args.output, args.start, args.duration)

        if success:
            print()
            print("Next step: Create transcript file")
            transcript_file = Path(args.output).with_suffix('.txt')
            print(f"Manually transcribe the audio and save to: {transcript_file}")

    elif args.generate:
        if not args.output:
            args.output = str(TTS_DIR / f"{args.voice}_voice_reference.wav")

        success = generate_with_google_tts(args.generate, args.output, args.voice)

        if success:
            print()
            print("Next step: Create transcript file")
            transcript_file = Path(args.output).with_suffix('.txt')
            print(f"Saving transcript to: {transcript_file}")

            with open(transcript_file, 'w', encoding='utf-8') as f:
                f.write(args.generate)

            print("✓ Transcript saved")


if __name__ == "__main__":
    main()
