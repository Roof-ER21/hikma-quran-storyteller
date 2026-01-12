#!/usr/bin/env python3
"""
Generate Adult Prophet Story Illustrations
Creates 3 key illustrations per prophet (75 total) using Google Gemini Imagen
"""

import os
import sys
import json
import time
import base64
import requests
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
DATA_FILE = PROJECT_ROOT / "data" / "prophetStoriesAdults.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "assets" / "adult" / "illustrations"

# Get API key from environment
API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
if not API_KEY:
    print("Error: Set GEMINI_API_KEY or VITE_GEMINI_API_KEY environment variable")
    sys.exit(1)

# Adult illustration style - more mature but still respectful
ADULT_ILLUSTRATION_STYLE = """
Art style: Epic historical illustration, painterly digital art style.
Colors: Rich, sophisticated palette with deep golds, blues, earth tones.
Atmosphere: Dramatic lighting, cinematic composition.
Mood: Reverent, awe-inspiring, historically evocative.
Details: Architectural details, landscapes, symbolic elements.
Cultural accuracy: Middle Eastern and ancient setting elements.
NO depiction of prophets, angels, or religious figures - only environments, symbols, and scenes.
NO faces of holy figures - show from behind, silhouettes, or environmental focus only.
NO text, NO words, NO letters in the image.
Mature audience: Artistic sophistication appropriate for adult viewers.
"""

# Key scenes to illustrate for each prophet (3 scenes each)
# Format: prophet_id -> list of (scene_id, description) tuples
PROPHET_SCENES = {
    "adam": [
        ("creation", "A magnificent garden paradise with lush greenery, golden light streaming through trees, peaceful waters - the Garden of Eden"),
        ("knowledge", "Ancient scrolls and cosmic symbols floating in ethereal light, representing divine knowledge"),
        ("earth", "A vast, beautiful earth landscape at dawn, mountains and valleys, beginning of human journey"),
    ],
    "idris": [
        ("wisdom", "Ancient astronomical observatory with stars and celestial bodies, scrolls of wisdom"),
        ("teaching", "A gathering place with books and instruments of learning under starlit sky"),
        ("ascension", "Majestic heavens with layers of light, clouds parting upward"),
    ],
    "nuh": [
        ("ark", "A massive wooden ark under construction, tools and timber, dramatic stormy sky approaching"),
        ("flood", "Enormous waves and rain, the ark floating on turbulent waters"),
        ("rainbow", "Rainbow over calm waters, mountains emerging, dove with olive branch"),
    ],
    "hud": [
        ("ad-city", "Magnificent ancient city with towering pillars and grand architecture in the desert"),
        ("warning", "Storm clouds gathering over proud towers, wind beginning to blow"),
        ("aftermath", "Ruins in the desert sand, wind-swept columns, sunset"),
    ],
    "saleh": [
        ("thamud", "Rock-carved dwellings in dramatic cliff faces, ancient Nabatean-style architecture"),
        ("camel", "A miraculous spring in the desert with mountains in background"),
        ("destruction", "Crumbling rock structures, earthquake damage, dust clouds"),
    ],
    "ibrahim": [
        ("stars", "Night sky filled with brilliant stars over ancient Mesopotamian landscape"),
        ("fire", "A massive furnace with flames, but cool garden oasis within"),
        ("kaaba", "The sacred Kaaba under construction, desert valley of Makkah, mountains"),
    ],
    "lut": [
        ("city", "Ancient city on the shores of a dead sea, elaborate but corrupt architecture"),
        ("angels", "Mysterious light descending toward a humble home at night"),
        ("destruction", "City being overturned, stones raining from sky, dawn escape"),
    ],
    "ismail": [
        ("desert", "Mother and child silhouette in vast desert, searching for water"),
        ("zamzam", "Spring of water bursting from desert sand, oasis forming"),
        ("sacrifice", "Mountain landscape with altar, knife replaced by ram, divine light"),
    ],
    "ishaq": [
        ("blessing", "Elderly hands raised in blessing, tent in pastoral landscape"),
        ("family", "Large family gathering, tents of prosperity in green land"),
        ("lineage", "Family tree imagery, roots growing into many branches"),
    ],
    "yaqub": [
        ("dream", "Ladder of light extending from earth to heavens, angels ascending"),
        ("grief", "Empty well in landscape, torn colorful garment"),
        ("reunion", "Caravan approaching Egyptian palace, emotional gates opening"),
    ],
    "yusuf": [
        ("well", "Deep well in wilderness, caravan in distance, colorful coat"),
        ("prison", "Egyptian prison with light streaming through window, dream symbols"),
        ("throne", "Grand Egyptian palace throne room, grain stores, prosperity"),
    ],
    "ayyub": [
        ("prosperity", "Lush estate with gardens, flocks, abundant blessings"),
        ("trials", "Barren landscape, crumbling walls, patient endurance"),
        ("restoration", "Spring of healing water, new growth, restoration"),
    ],
    "shuaib": [
        ("midian", "Trading marketplace in ancient Midian, scales and commerce"),
        ("warning", "Earthquake cracks forming, merchants fleeing"),
        ("meeting", "Well scene with flocks, hospitality tent"),
    ],
    "musa": [
        ("basket", "Baby basket floating in Nile reeds, palace in background"),
        ("fire", "Burning bush on Mount Sinai, holy ground, shoes removed"),
        ("sea", "Parted sea with walls of water, people crossing on dry ground"),
    ],
    "harun": [
        ("speaking", "Two brothers before grand pharaoh's throne, staffs in hand"),
        ("calf", "Golden calf idol being destroyed, tablets of law"),
        ("priesthood", "Sacred vestments, tabernacle in desert"),
    ],
    "dhul-kifl": [
        ("patience", "Judge's seat under a tree, wisdom and fair judgment"),
        ("devotion", "Continuous worship through day and night, lamp burning"),
        ("legacy", "Peaceful grave site with flowers, memorial"),
    ],
    "dawud": [
        ("goliath", "Battlefield with sling and stones, giant armor fallen"),
        ("kingdom", "Jerusalem palace, throne of united kingdom"),
        ("psalms", "Harp and scrolls, mountains echoing praise"),
    ],
    "sulaiman": [
        ("throne", "Magnificent throne with lions, crystal palace"),
        ("creatures", "Birds and ants in organized gathering, nature commanding"),
        ("sheba", "Queen's caravan approaching glass palace floor"),
    ],
    "ilyas": [
        ("baal", "Destroyed idol altars on mountaintop, rain clouds gathering"),
        ("cave", "Prophet hiding in cave, ravens bringing food"),
        ("chariot", "Fiery chariot ascending into whirlwind"),
    ],
    "al-yasa": [
        ("succession", "Mantle being passed, double portion of spirit"),
        ("miracles", "Healing waters, multiplication of oil"),
        ("teaching", "School of prophets, students learning"),
    ],
    "yunus": [
        ("ship", "Storm-tossed ship on dark sea, lots being cast"),
        ("whale", "Massive whale in deep ocean, light in darkness"),
        ("plant", "Gourd vine providing shade, city of Nineveh reformed"),
    ],
    "zakariya": [
        ("temple", "Ancient temple sanctuary, incense rising"),
        ("prayer", "Elderly man in prayer niche, miraculous answer"),
        ("son", "Baby in elderly arms, miracle of life"),
    ],
    "yahya": [
        ("wilderness", "Austere wilderness life, locusts and honey"),
        ("baptism", "River scene, purification rituals"),
        ("martyrdom", "Prison cell with light streaming in"),
    ],
    "isa": [
        ("birth", "Palm tree in desert, miraculous provision, star above"),
        ("miracles", "Table descending from heaven, healing light"),
        ("ascension", "Figure rising into clouds, disciples watching from below"),
    ],
    "muhammad": [
        ("cave", "Cave of Hira with light of revelation, Makkah below"),
        ("migration", "Desert journey at night, guiding star, spider web at cave"),
        ("medina", "City of light, mosque being built, community gathering"),
    ],
}


def generate_image(prompt: str, output_path: Path, max_retries: int = 3) -> bool:
    """Generate an image using Gemini Imagen API with retry logic"""

    full_prompt = f"{prompt}\n\n{ADULT_ILLUSTRATION_STYLE}"

    for attempt in range(max_retries):
        # Using Gemini's image generation endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={API_KEY}"

        payload = {
            "instances": [{"prompt": full_prompt}],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": "16:9",
                "safetyFilterLevel": "BLOCK_MEDIUM_AND_ABOVE",
                "personGeneration": "DONT_ALLOW"
            }
        }

        try:
            response = requests.post(url, json=payload, timeout=60)

            if response.status_code == 200:
                data = response.json()
                if "predictions" in data and len(data["predictions"]) > 0:
                    image_data = data["predictions"][0].get("bytesBase64Encoded")
                    if image_data:
                        # Decode and save
                        image_bytes = base64.b64decode(image_data)
                        output_path.parent.mkdir(parents=True, exist_ok=True)
                        with open(output_path, "wb") as f:
                            f.write(image_bytes)
                        return True

            # Try alternative endpoint (Gemini 2.0 with image output)
            alt_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={API_KEY}"
            alt_payload = {
                "contents": [{"parts": [{"text": f"Generate an image: {full_prompt}"}]}],
                "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
            }

            alt_response = requests.post(alt_url, json=alt_payload, timeout=60)
            if alt_response.status_code == 200:
                alt_data = alt_response.json()
                candidates = alt_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            image_data = part["inlineData"].get("data")
                            if image_data:
                                image_bytes = base64.b64decode(image_data)
                                output_path.parent.mkdir(parents=True, exist_ok=True)
                                with open(output_path, "wb") as f:
                                    f.write(image_bytes)
                                return True

            # Rate limit handling
            if response.status_code == 429:
                wait_time = (attempt + 1) * 10  # Exponential backoff: 10s, 20s, 30s
                print(f"Rate limited, waiting {wait_time}s...", end=" ", flush=True)
                time.sleep(wait_time)
                continue

            print(f"  API Error: {response.status_code} - {response.text[:200]}")

        except Exception as e:
            print(f"  Error: {e}")
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 5
                print(f"  Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue

    return False


def main():
    print("=" * 60)
    print("ADULT PROPHET STORY ILLUSTRATIONS")
    print("=" * 60)
    print()

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = 0
    skipped = 0
    failed = 0

    for prophet_id, scenes in PROPHET_SCENES.items():
        print(f"\n{prophet_id.title()} ({prophet_id})")

        for i, (scene_id, description) in enumerate(scenes):
            output_path = OUTPUT_DIR / f"{prophet_id}-{i}.png"

            # Skip if already exists
            if output_path.exists() and output_path.stat().st_size > 1000:
                print(f"  Scene {i} ({scene_id}): SKIP (exists)")
                skipped += 1
                continue

            print(f"  Scene {i} ({scene_id}): Generating...", end=" ", flush=True)

            if generate_image(description, output_path):
                size_kb = output_path.stat().st_size // 1024
                print(f"OK ({size_kb}KB)")
                generated += 1
            else:
                print("FAILED")
                failed += 1

            # Rate limiting - 5 seconds between requests to avoid hitting limits
            time.sleep(5)

    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Generated: {generated}")
    print(f"Skipped: {skipped}")
    print(f"Failed: {failed}")
    print()
    print("Done!")


if __name__ == "__main__":
    main()
