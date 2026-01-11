#!/bin/bash
# Batch audio generation script for Hikma Quran Storyteller
# Generates all story audio files in sequence

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Hikma Quran Storyteller - Audio Generation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if script exists
GENERATOR_SCRIPT="$SCRIPT_DIR/generate_story_audio.py"
if [ ! -f "$GENERATOR_SCRIPT" ]; then
    echo -e "${RED}Error: generate_story_audio.py not found${NC}"
    exit 1
fi

# Parse arguments
FORCE=""
DRY_RUN=""
VERBOSE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE="--force"
            shift
            ;;
        --dry-run)
            DRY_RUN="--dry-run"
            shift
            ;;
        --verbose)
            VERBOSE="--verbose"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--force] [--dry-run] [--verbose]"
            exit 1
            ;;
    esac
done

# Display settings
echo -e "${YELLOW}Settings:${NC}"
[ -n "$FORCE" ] && echo "  - Force regenerate: YES" || echo "  - Force regenerate: NO (skip existing)"
[ -n "$DRY_RUN" ] && echo "  - Dry run: YES (no files generated)" || echo "  - Dry run: NO (files will be generated)"
[ -n "$VERBOSE" ] && echo "  - Verbose logging: YES" || echo "  - Verbose logging: NO"
echo ""

# Log file
LOG_FILE="$PROJECT_DIR/audio_generation.log"
echo -e "${YELLOW}Log file: $LOG_FILE${NC}"
echo ""

# Start time
START_TIME=$(date +%s)
echo "Started at: $(date)" | tee "$LOG_FILE"
echo ""

# Kids Stories
echo -e "${GREEN}=== KIDS STORIES ===${NC}"
echo "Generating audio for 25 prophet stories for children..."
python3 "$GENERATOR_SCRIPT" --type kids $FORCE $DRY_RUN $VERBOSE 2>&1 | tee -a "$LOG_FILE"
KIDS_STATUS=$?

if [ $KIDS_STATUS -ne 0 ]; then
    echo -e "${RED}Kids stories generation failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Kids stories complete${NC}"
echo ""

# Adult Seerah Stories
echo -e "${GREEN}=== ADULT SEERAH STORIES ===${NC}"
echo "Generating audio for 5 Seerah stories..."
python3 "$GENERATOR_SCRIPT" --type adult-seerah $FORCE $DRY_RUN $VERBOSE 2>&1 | tee -a "$LOG_FILE"
SEERAH_STATUS=$?

if [ $SEERAH_STATUS -ne 0 ]; then
    echo -e "${RED}Adult Seerah generation failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Adult Seerah complete${NC}"
echo ""

# Adult Prophet Stories
echo -e "${GREEN}=== ADULT PROPHET STORIES ===${NC}"
echo "Generating audio for detailed prophet stories..."
python3 "$GENERATOR_SCRIPT" --type adult-prophet $FORCE $DRY_RUN $VERBOSE 2>&1 | tee -a "$LOG_FILE"
PROPHET_STATUS=$?

if [ $PROPHET_STATUS -ne 0 ]; then
    echo -e "${RED}Adult Prophet stories generation failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Adult Prophet stories complete${NC}"
echo ""

# End time and summary
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
HOURS=$((DURATION / 3600))
MINUTES=$(((DURATION % 3600) / 60))
SECONDS=$((DURATION % 60))

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}COMPLETE!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Finished at: $(date)"
printf "Total time: %02d:%02d:%02d\n" $HOURS $MINUTES $SECONDS
echo ""

if [ -n "$DRY_RUN" ]; then
    echo -e "${YELLOW}(Dry run - no files were actually generated)${NC}"
else
    echo -e "${GREEN}All audio files generated successfully!${NC}"
    echo ""
    echo "Output directories:"
    echo "  - Kids: public/assets/kids/audio/"
    echo "  - Adult: public/assets/adult/audio/"
fi

echo ""
echo "Full log: $LOG_FILE"
