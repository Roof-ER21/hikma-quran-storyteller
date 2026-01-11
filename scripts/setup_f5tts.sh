#!/bin/bash
################################################################################
# F5-TTS Story Audio Generation Setup Script
# Hikma Quran Storyteller Project
################################################################################

set -e  # Exit on error

echo "========================================================================"
echo "F5-TTS Story Audio Generation - Setup"
echo "========================================================================"
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Project root: $PROJECT_ROOT"
echo

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $PYTHON_VERSION"

if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
    echo -e "${RED}Error: Python 3.8 or higher is required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python version OK${NC}"
echo

# Install Python dependencies
echo "Installing Python dependencies..."
if pip3 install -r "$SCRIPT_DIR/requirements-f5tts.txt"; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi
echo

# Check if F5-TTS is installed
echo "Verifying F5-TTS installation..."
if python3 -c "from f5_tts.api import F5TTS" 2>/dev/null; then
    echo -e "${GREEN}✓ F5-TTS installed successfully${NC}"
else
    echo -e "${RED}Error: F5-TTS not properly installed${NC}"
    exit 1
fi
echo

# Create necessary directories
echo "Creating directories..."
mkdir -p "$SCRIPT_DIR/tts"
mkdir -p "$PROJECT_ROOT/public/assets/kids/audio"
mkdir -p "$PROJECT_ROOT/public/assets/adult/audio"
echo -e "${GREEN}✓ Directories created${NC}"
echo

# Check for reference audio files
echo "Checking reference audio files..."
MISSING_FILES=()

if [ ! -f "$SCRIPT_DIR/tts/kids_voice_reference.wav" ]; then
    MISSING_FILES+=("kids_voice_reference.wav")
fi

if [ ! -f "$SCRIPT_DIR/tts/adult_voice_reference.wav" ]; then
    MISSING_FILES+=("adult_voice_reference.wav")
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠ Missing reference audio files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - scripts/tts/$file"
    done
    echo
    echo -e "${YELLOW}Note: The script will work without reference files but will use default voice.${NC}"
    echo -e "${YELLOW}For voice cloning, add WAV files to scripts/tts/${NC}"
else
    echo -e "${GREEN}✓ Reference audio files found${NC}"
fi
echo

# Run a test dry-run
echo "Running test dry-run..."
if python3 "$SCRIPT_DIR/generate_story_audio.py" --dry-run --type kids 2>/dev/null | head -20; then
    echo -e "${GREEN}✓ Script test successful${NC}"
else
    echo -e "${YELLOW}⚠ Script test had warnings (check above)${NC}"
fi
echo

echo "========================================================================"
echo "Setup Complete!"
echo "========================================================================"
echo
echo "Next steps:"
echo
echo "1. Add reference audio files (optional but recommended):"
echo "   - scripts/tts/kids_voice_reference.wav"
echo "   - scripts/tts/adult_voice_reference.wav"
echo
echo "2. Run the generator:"
echo "   python3 scripts/generate_story_audio.py --type all"
echo
echo "3. For help:"
echo "   python3 scripts/generate_story_audio.py --help"
echo "   cat scripts/README-F5-TTS-AUDIO.md"
echo
echo "========================================================================"
