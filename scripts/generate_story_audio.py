#!/usr/bin/env python3
"""
F5-TTS Batch Audio Generation Script for Hikma Quran Storyteller

This script generates audio files for:
1. Kids stories (kidsStories.json) - slower narration (speed=0.75)
2. Adult Seerah stories (adultStories.json) - natural narration (speed=0.85)
3. Adult Prophet stories (prophetStoriesAdults.json) - natural narration (speed=0.85)

Features:
- F5-TTS voice cloning with reference audio
- Automatic WAV to MP3 conversion (pydub)
- Long text chunking and merging
- Progress tracking with tqdm
- CLI args for flexible generation
- Skip existing files (unless --force)
"""

import argparse
import json
import logging
import os
import sys
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Third-party imports
try:
    from f5_tts.api import F5TTS
    from pydub import AudioSegment
    from tqdm import tqdm
except ImportError as e:
    print(f"ERROR: Missing required dependency: {e}")
    print("\nInstall dependencies:")
    print("  pip install f5-tts pydub tqdm")
    print("\nFor pydub, you also need ffmpeg:")
    print("  brew install ffmpeg  # macOS")
    print("  apt install ffmpeg   # Ubuntu/Debian")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Project paths
PROJECT_ROOT = Path("/Users/a21/Downloads/hikma_-quran-storyteller")
DATA_DIR = PROJECT_ROOT / "data"
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
TTS_DIR = SCRIPTS_DIR / "tts"
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets"

# Voice reference files
KIDS_VOICE_REF = TTS_DIR / "kids_voice_reference.wav"
KIDS_VOICE_TEXT = TTS_DIR / "kids_voice_reference.txt"
ADULT_VOICE_REF = TTS_DIR / "adult_voice_reference.wav"
ADULT_VOICE_TEXT = TTS_DIR / "adult_voice_reference.txt"

# Story data files
KIDS_STORIES_FILE = DATA_DIR / "kidsStories.json"
ADULT_SEERAH_FILE = DATA_DIR / "adultStories.json"
ADULT_PROPHET_FILE = DATA_DIR / "prophetStoriesAdults.json"

# Output directories
KIDS_AUDIO_DIR = OUTPUT_DIR / "kids" / "audio"
ADULT_AUDIO_DIR = OUTPUT_DIR / "adult" / "audio"

# Generation settings
KIDS_SPEED = 0.75  # Slower for children
ADULT_SPEED = 0.85  # Natural narration
MAX_CHUNK_LENGTH = 500  # Max characters per chunk
MP3_BITRATE = "128k"  # MP3 quality


class AudioGenerator:
    """F5-TTS audio generation with MP3 conversion"""

    def __init__(self, voice_ref: Path, voice_text: str, speed: float = 1.0):
        """
        Initialize the audio generator.

        Args:
            voice_ref: Path to reference audio file
            voice_text: Transcript of reference audio
            speed: Speech speed multiplier
        """
        self.voice_ref = str(voice_ref)
        self.voice_text = voice_text
        self.speed = speed

        # Initialize F5-TTS
        logger.info(f"Initializing F5-TTS with voice: {voice_ref.name}")
        self.tts = F5TTS()

    def split_text(self, text: str) -> List[str]:
        """
        Split long text into chunks at sentence boundaries.

        Args:
            text: Input text to split

        Returns:
            List of text chunks
        """
        if len(text) <= MAX_CHUNK_LENGTH:
            return [text]

        chunks = []
        current_chunk = ""
        sentences = text.replace('! ', '!|').replace('? ', '?|').replace('. ', '.|').split('|')

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            # If adding this sentence exceeds limit, start new chunk
            if len(current_chunk) + len(sentence) + 1 > MAX_CHUNK_LENGTH and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk += (" " if current_chunk else "") + sentence

        # Add remaining text
        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def generate_audio(self, text: str, output_path: Path) -> bool:
        """
        Generate audio from text and save as MP3.

        Args:
            text: Text to synthesize
            output_path: Output MP3 file path

        Returns:
            True if successful, False otherwise
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Split long text into chunks
            chunks = self.split_text(text)

            if len(chunks) == 1:
                # Single chunk - direct generation
                return self._generate_single(text, output_path)
            else:
                # Multiple chunks - generate and merge
                logger.info(f"Text split into {len(chunks)} chunks")
                return self._generate_merged(chunks, output_path)

        except Exception as e:
            logger.error(f"Failed to generate audio: {e}")
            return False

    def _generate_single(self, text: str, output_path: Path) -> bool:
        """Generate audio from a single text chunk"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_wav:
                tmp_wav_path = tmp_wav.name

            # Generate with F5-TTS
            self.tts.infer(
                ref_file=self.voice_ref,
                ref_text=self.voice_text,
                gen_text=text,
                file_wave=tmp_wav_path,
                speed=self.speed
            )

            # Convert WAV to MP3
            audio = AudioSegment.from_wav(tmp_wav_path)
            audio.export(str(output_path), format="mp3", bitrate=MP3_BITRATE)

            # Clean up temp file
            os.unlink(tmp_wav_path)

            logger.debug(f"Generated: {output_path.name}")
            return True

        except Exception as e:
            logger.error(f"Single generation failed: {e}")
            if os.path.exists(tmp_wav_path):
                os.unlink(tmp_wav_path)
            return False

    def _generate_merged(self, chunks: List[str], output_path: Path) -> bool:
        """Generate audio from multiple chunks and merge"""
        temp_files = []

        try:
            # Generate each chunk
            audio_segments = []
            for i, chunk in enumerate(chunks):
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_wav:
                    tmp_wav_path = tmp_wav.name
                    temp_files.append(tmp_wav_path)

                # Generate chunk
                self.tts.infer(
                    ref_file=self.voice_ref,
                    ref_text=self.voice_text,
                    gen_text=chunk,
                    file_wave=tmp_wav_path,
                    speed=self.speed
                )

                # Load audio segment
                segment = AudioSegment.from_wav(tmp_wav_path)
                audio_segments.append(segment)

            # Merge all segments
            merged = audio_segments[0]
            for segment in audio_segments[1:]:
                # Add small pause between chunks (200ms)
                merged += AudioSegment.silent(duration=200)
                merged += segment

            # Export as MP3
            merged.export(str(output_path), format="mp3", bitrate=MP3_BITRATE)

            logger.debug(f"Generated (merged): {output_path.name}")
            return True

        except Exception as e:
            logger.error(f"Merged generation failed: {e}")
            return False

        finally:
            # Clean up all temp files
            for tmp_file in temp_files:
                if os.path.exists(tmp_file):
                    os.unlink(tmp_file)


def load_json(file_path: Path) -> Optional[List[Dict]]:
    """Load JSON data file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load {file_path}: {e}")
        return None


def load_voice_text(file_path: Path) -> str:
    """Load voice reference transcript"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        logger.error(f"Failed to load voice text {file_path}: {e}")
        return ""


def generate_kids_stories(
    story_id: Optional[str] = None,
    force: bool = False,
    dry_run: bool = False
) -> Tuple[int, int]:
    """
    Generate audio for kids stories.

    Args:
        story_id: Specific story ID to generate (None for all)
        force: Overwrite existing files
        dry_run: Don't actually generate, just show what would happen

    Returns:
        Tuple of (generated_count, skipped_count)
    """
    logger.info("=" * 60)
    logger.info("KIDS STORIES GENERATION")
    logger.info("=" * 60)

    # Load stories
    stories = load_json(KIDS_STORIES_FILE)
    if not stories:
        return 0, 0

    # Filter by ID if specified
    if story_id:
        stories = [s for s in stories if s['id'] == story_id]
        if not stories:
            logger.error(f"Story ID '{story_id}' not found")
            return 0, 0

    # Load voice reference
    voice_text = load_voice_text(KIDS_VOICE_TEXT)
    if not voice_text:
        return 0, 0

    # Initialize generator
    if not dry_run:
        generator = AudioGenerator(KIDS_VOICE_REF, voice_text, speed=KIDS_SPEED)

    generated = 0
    skipped = 0

    # Process each story
    for story in tqdm(stories, desc="Kids stories"):
        story_id = story['id']
        logger.info(f"\nProcessing: {story['prophet']} ({story_id})")

        # Generate scene audio
        for i, scene in enumerate(story['scenes']):
            output_file = KIDS_AUDIO_DIR / f"story-{story_id}-scene-{i}.mp3"

            if output_file.exists() and not force:
                logger.debug(f"  Scene {i}: SKIP (exists)")
                skipped += 1
                continue

            if dry_run:
                logger.info(f"  Scene {i}: WOULD GENERATE -> {output_file.name}")
                generated += 1
                continue

            # Generate audio
            if generator.generate_audio(scene['text'], output_file):
                logger.info(f"  Scene {i}: GENERATED")
                generated += 1
            else:
                logger.error(f"  Scene {i}: FAILED")

        # Generate lesson audio
        lesson_file = KIDS_AUDIO_DIR / f"story-{story_id}-lesson.mp3"

        if lesson_file.exists() and not force:
            logger.debug(f"  Lesson: SKIP (exists)")
            skipped += 1
            continue

        if dry_run:
            logger.info(f"  Lesson: WOULD GENERATE -> {lesson_file.name}")
            generated += 1
            continue

        if generator.generate_audio(story['lesson'], lesson_file):
            logger.info(f"  Lesson: GENERATED")
            generated += 1
        else:
            logger.error(f"  Lesson: FAILED")

    return generated, skipped


def generate_adult_seerah(
    story_id: Optional[str] = None,
    force: bool = False,
    dry_run: bool = False
) -> Tuple[int, int]:
    """
    Generate audio for adult Seerah stories.

    Args:
        story_id: Specific story ID to generate (None for all)
        force: Overwrite existing files
        dry_run: Don't actually generate, just show what would happen

    Returns:
        Tuple of (generated_count, skipped_count)
    """
    logger.info("=" * 60)
    logger.info("ADULT SEERAH STORIES GENERATION")
    logger.info("=" * 60)

    # Load stories
    stories = load_json(ADULT_SEERAH_FILE)
    if not stories:
        return 0, 0

    # Filter by ID if specified
    if story_id:
        stories = [s for s in stories if s['id'] == story_id]
        if not stories:
            logger.error(f"Story ID '{story_id}' not found")
            return 0, 0

    # Load voice reference
    voice_text = load_voice_text(ADULT_VOICE_TEXT)
    if not voice_text:
        return 0, 0

    # Initialize generator
    if not dry_run:
        generator = AudioGenerator(ADULT_VOICE_REF, voice_text, speed=ADULT_SPEED)

    generated = 0
    skipped = 0

    # Process each story
    for story in tqdm(stories, desc="Adult Seerah"):
        story_id = story['id']
        logger.info(f"\nProcessing: {story['title']} ({story_id})")

        output_file = ADULT_AUDIO_DIR / f"{story_id}.mp3"

        if output_file.exists() and not force:
            logger.debug(f"  SKIP (exists)")
            skipped += 1
            continue

        if dry_run:
            logger.info(f"  WOULD GENERATE -> {output_file.name}")
            generated += 1
            continue

        # Generate audio
        if generator.generate_audio(story['text'], output_file):
            logger.info(f"  GENERATED")
            generated += 1
        else:
            logger.error(f"  FAILED")

    return generated, skipped


def generate_adult_prophet(
    story_id: Optional[str] = None,
    force: bool = False,
    dry_run: bool = False
) -> Tuple[int, int]:
    """
    Generate audio for adult Prophet stories (detailed sections).

    Args:
        story_id: Specific story ID to generate (None for all)
        force: Overwrite existing files
        dry_run: Don't actually generate, just show what would happen

    Returns:
        Tuple of (generated_count, skipped_count)
    """
    logger.info("=" * 60)
    logger.info("ADULT PROPHET STORIES GENERATION")
    logger.info("=" * 60)

    # Load stories
    stories = load_json(ADULT_PROPHET_FILE)
    if not stories:
        return 0, 0

    # Filter by ID if specified
    if story_id:
        stories = [s for s in stories if s['id'] == story_id]
        if not stories:
            logger.error(f"Story ID '{story_id}' not found")
            return 0, 0

    # Load voice reference
    voice_text = load_voice_text(ADULT_VOICE_TEXT)
    if not voice_text:
        return 0, 0

    # Initialize generator
    if not dry_run:
        generator = AudioGenerator(ADULT_VOICE_REF, voice_text, speed=ADULT_SPEED)

    generated = 0
    skipped = 0

    # Process each story
    for story in tqdm(stories, desc="Adult Prophet"):
        story_id = story['id']
        logger.info(f"\nProcessing: {story['prophetName']} ({story_id})")

        # Generate audio for each section
        for section in story['sections']:
            section_id = section['id']
            output_file = ADULT_AUDIO_DIR / f"{story_id}-{section_id}.mp3"

            if output_file.exists() and not force:
                logger.debug(f"  Section {section_id}: SKIP (exists)")
                skipped += 1
                continue

            if dry_run:
                logger.info(f"  Section {section_id}: WOULD GENERATE -> {output_file.name}")
                generated += 1
                continue

            # Generate audio
            if generator.generate_audio(section['content'], output_file):
                logger.info(f"  Section {section_id}: GENERATED")
                generated += 1
            else:
                logger.error(f"  Section {section_id}: FAILED")

    return generated, skipped


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Generate audio files for Hikma Quran Storyteller using F5-TTS',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate all stories
  python generate_story_audio.py --type all

  # Generate only kids stories
  python generate_story_audio.py --type kids

  # Generate specific story
  python generate_story_audio.py --type kids --story adam

  # Force regenerate all adult Seerah
  python generate_story_audio.py --type adult-seerah --force

  # Dry run to see what would be generated
  python generate_story_audio.py --type all --dry-run
        """
    )

    parser.add_argument(
        '--type',
        choices=['all', 'kids', 'adult-seerah', 'adult-prophet'],
        default='all',
        help='Type of stories to generate (default: all)'
    )

    parser.add_argument(
        '--story',
        type=str,
        help='Specific story ID to generate (e.g., adam, ibrahim)'
    )

    parser.add_argument(
        '--force',
        action='store_true',
        help='Overwrite existing audio files'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be generated without actually generating'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )

    args = parser.parse_args()

    # Set log level
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # Validate files exist
    missing_files = []
    required_files = [
        KIDS_VOICE_REF, KIDS_VOICE_TEXT,
        ADULT_VOICE_REF, ADULT_VOICE_TEXT,
        KIDS_STORIES_FILE, ADULT_SEERAH_FILE, ADULT_PROPHET_FILE
    ]

    for file_path in required_files:
        if not file_path.exists():
            missing_files.append(str(file_path))

    if missing_files:
        logger.error("Missing required files:")
        for f in missing_files:
            logger.error(f"  - {f}")
        sys.exit(1)

    # Track totals
    total_generated = 0
    total_skipped = 0

    # Generate based on type
    if args.type in ['all', 'kids']:
        gen, skip = generate_kids_stories(args.story, args.force, args.dry_run)
        total_generated += gen
        total_skipped += skip

    if args.type in ['all', 'adult-seerah']:
        gen, skip = generate_adult_seerah(args.story, args.force, args.dry_run)
        total_generated += gen
        total_skipped += skip

    if args.type in ['all', 'adult-prophet']:
        gen, skip = generate_adult_prophet(args.story, args.force, args.dry_run)
        total_generated += gen
        total_skipped += skip

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("GENERATION SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Total generated: {total_generated}")
    logger.info(f"Total skipped: {total_skipped}")

    if args.dry_run:
        logger.info("\n(DRY RUN - no files were actually generated)")

    logger.info("\nDone!")


if __name__ == '__main__':
    main()
