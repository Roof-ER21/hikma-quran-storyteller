#!/usr/bin/env python3
"""
Process PDF story images for Noor Soad Kids app.
Crops illustration portion and optimizes for web.
"""

from PIL import Image
from pathlib import Path
import os

# Source directories (extracted from PDFs)
IBRAHIM_SRC = Path("/tmp/ibrahim-pdf")
NUH_SRC = Path("/tmp/nuh-pdf")

# Output directory
PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "kids" / "illustrations"

# Target width for web (maintains aspect ratio)
TARGET_WIDTH = 800

def process_image(src_path: Path, dst_path: Path, crop_left_half: bool = True):
    """Process a single image: crop left half (illustration) and resize."""
    try:
        img = Image.open(src_path)
        width, height = img.size

        if crop_left_half:
            # Crop left 50% (the illustration side)
            # Some pages have illustration on left, text on right
            crop_box = (0, 0, width // 2, height)
            img = img.crop(crop_box)

        # Calculate new height maintaining aspect ratio
        new_width = TARGET_WIDTH
        new_height = int((TARGET_WIDTH / img.width) * img.height)

        # Resize with high quality
        img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Convert to RGB if necessary (for JPEG)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Save as optimized JPEG
        img.save(dst_path, 'JPEG', quality=85, optimize=True)

        file_size = dst_path.stat().st_size / 1024
        print(f"  {dst_path.name}: {new_width}x{new_height}, {file_size:.1f}KB")
        return True
    except Exception as e:
        print(f"  Error processing {src_path}: {e}")
        return False

def main():
    print("Processing PDF story images for Noor Soad Kids")
    print("=" * 55)

    # Create output directories
    ibrahim_out = OUTPUT_DIR / "ibrahim"
    nuh_out = OUTPUT_DIR / "nuh"
    ibrahim_out.mkdir(parents=True, exist_ok=True)
    nuh_out.mkdir(parents=True, exist_ok=True)

    # Ibrahim story pages (even indices are main pages: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20)
    # Page 0 is cover, pages 2-20 are scenes 0-9
    print("\nProcessing Ibrahim and the Great Search...")
    ibrahim_pages = [
        (0, "cover", False),  # Cover - don't crop
        (2, "0", True),   # Scene 0
        (4, "1", True),   # Scene 1
        (6, "2", True),   # Scene 2
        (8, "3", True),   # Scene 3
        (10, "4", True),  # Scene 4
        (12, "5", True),  # Scene 5
        (14, "6", True),  # Scene 6
        (16, "7", True),  # Scene 7
        (18, "8", True),  # Scene 8
        (20, "9", True),  # Scene 9
    ]

    for page_num, scene_id, crop in ibrahim_pages:
        src = IBRAHIM_SRC / f"page-{page_num:03d}.png"
        if src.exists():
            dst = ibrahim_out / f"scene-{scene_id}.jpg"
            process_image(src, dst, crop_left_half=crop)

    # Nuh story pages
    print("\nProcessing The Great Ship of Peace...")
    nuh_pages = [
        (0, "cover", False),  # Cover - don't crop
        (2, "0", True),   # Scene 0
        (4, "1", True),   # Scene 1
        (6, "2", True),   # Scene 2
        (8, "3", True),   # Scene 3
        (10, "4", True),  # Scene 4
        (12, "5", True),  # Scene 5
        (14, "6", True),  # Scene 6
        (16, "7", True),  # Scene 7
        (18, "8", True),  # Scene 8
        (20, "9", True),  # Scene 9
    ]

    for page_num, scene_id, crop in nuh_pages:
        src = NUH_SRC / f"page-{page_num:03d}.png"
        if src.exists():
            dst = nuh_out / f"scene-{scene_id}.jpg"
            process_image(src, dst, crop_left_half=crop)

    print("\n" + "=" * 55)
    print("Done! Images saved to:")
    print(f"  {ibrahim_out}")
    print(f"  {nuh_out}")

if __name__ == "__main__":
    main()
