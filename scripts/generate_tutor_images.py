#!/usr/bin/env python3
"""
Generate AI Tutor Character Images
Creates avatar and detail images for each of the 5 tutor personas
Uses Google Gemini 2.0 Flash for generation
"""

import os
import sys
import base64
import json
from pathlib import Path

# Try to import required libraries
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Installing google-genai...")
    os.system("pip install google-genai")
    from google import genai
    from google.genai import types

# Tutor definitions with image prompts
TUTORS = [
    {
        "id": "khalid",
        "name": "Sheikh Khalid",
        "avatar_prompt": "Create a professional portrait illustration of a dignified Middle Eastern Muslim scholar in his 50s, wearing a white thobe and keffiyeh, wise gentle eyes, neat grey beard, warm scholarly expression, soft studio lighting, Islamic geometric pattern background in emerald green, digital art style, clean lines, suitable for educational app. Square format, centered composition.",
        "detail_prompt": "Create an illustration of a dignified Middle Eastern Muslim scholar sitting at a wooden desk with ancient Islamic manuscripts and books, wearing white thobe, reading glasses, pointing to a Quran, library setting with Islamic geometric patterns, warm golden lighting, welcoming educational atmosphere, digital art illustration style. Landscape format."
    },
    {
        "id": "amina",
        "name": "Sister Amina",
        "avatar_prompt": "Create a professional portrait illustration of a warm friendly Muslim woman teacher in her 30s, wearing elegant hijab in soft teal color, kind encouraging smile, bright warm eyes, modern modest dress, soft pastel background, digital art style, clean lines, welcoming expression, suitable for educational app. Square format, centered composition.",
        "detail_prompt": "Create an illustration of a warm Muslim woman teacher sitting comfortably in a cozy study room, wearing elegant teal hijab, holding a book with encouraging gesture, surrounded by plants and soft cushions, warm natural lighting, nurturing educational atmosphere, digital art illustration style. Landscape format."
    },
    {
        "id": "yusuf",
        "name": "Brother Yusuf",
        "avatar_prompt": "Create a professional portrait illustration of an energetic young Muslim man coach in his late 20s, short neat beard, athletic build, wearing modern modest sportswear, confident motivating smile, dynamic purple gradient background, digital art style, clean lines, inspiring expression, suitable for educational app. Square format, centered composition.",
        "detail_prompt": "Create an illustration of an energetic young Muslim man as a memorization coach, standing confidently with arms crossed, modern modest athletic wear, whiteboard behind him with Quran verses, dynamic coaching environment, bright motivating lighting, energetic educational atmosphere, digital art illustration style. Landscape format."
    },
    {
        "id": "layla",
        "name": "Dr. Layla",
        "avatar_prompt": "Create a professional portrait illustration of an intellectual Muslim woman academic in her 40s, wearing professional hijab in deep blue, modern glasses, confident scholarly expression, university professor appearance, clean blue gradient background, digital art style, clean lines, professional demeanor, suitable for educational app. Square format, centered composition.",
        "detail_prompt": "Create an illustration of an intellectual Muslim woman professor at a modern desk, wearing professional blue hijab and glasses, laptop and research papers visible, Arabic calligraphy charts on wall, academic office setting, crisp professional lighting, analytical educational atmosphere, digital art illustration style. Landscape format."
    },
    {
        "id": "hassan",
        "name": "Uncle Hassan",
        "avatar_prompt": "Create a professional portrait illustration of a warm grandfatherly Muslim man in his 60s, full white beard, wearing traditional brown bisht over white thobe, kind twinkling eyes, gentle storytelling smile, warm amber background, digital art style, clean lines, approachable wise expression, suitable for educational app. Square format, centered composition.",
        "detail_prompt": "Create an illustration of a warm elderly Muslim grandfather sitting on comfortable cushions in a traditional majlis setting, wearing brown bisht, gesturing while telling a story, cup of tea nearby, warm lantern lighting, cozy storytelling atmosphere, children's book illustration style, inviting educational setting. Landscape format."
    }
]

OUTPUT_DIR = Path("/Users/a21/Downloads/hikma_-quran-storyteller/public/assets/tutors")

def generate_image(client, prompt: str, output_path: Path):
    """Generate an image using Gemini 2.0 Flash"""
    try:
        print(f"  Generating: {output_path.name}...")

        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=['IMAGE', 'TEXT'],
            )
        )

        # Extract image from response
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                image_data = part.inline_data.data
                with open(output_path, 'wb') as f:
                    f.write(image_data)
                print(f"  ✓ Saved: {output_path.name}")
                return True

        print(f"  ✗ No image in response for {output_path.name}")
        return False

    except Exception as e:
        print(f"  ✗ Error generating {output_path.name}: {e}")
        return False

def main():
    # Get API key
    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    if not api_key:
        # Try to read from .env file
        env_path = Path("/Users/a21/Downloads/hikma_-quran-storyteller/.env")
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    if line.startswith('VITE_GEMINI_API_KEY='):
                        api_key = line.split('=', 1)[1].strip().strip('"\'')
                        break

    if not api_key:
        print("Error: No Gemini API key found. Set GEMINI_API_KEY environment variable.")
        sys.exit(1)

    # Initialize client
    client = genai.Client(api_key=api_key)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("🎨 Generating Tutor Character Images with Gemini 2.0")
    print("=" * 50)

    success_count = 0
    total_count = len(TUTORS) * 2

    for tutor in TUTORS:
        print(f"\n👤 {tutor['name']}:")

        # Generate avatar (small, for cards)
        avatar_path = OUTPUT_DIR / f"{tutor['id']}-avatar.png"
        if generate_image(client, tutor['avatar_prompt'], avatar_path):
            success_count += 1

        # Generate detail image (larger, for detail panel)
        detail_path = OUTPUT_DIR / f"{tutor['id']}-detail.png"
        if generate_image(client, tutor['detail_prompt'], detail_path):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"✅ Generated {success_count}/{total_count} images")
    print(f"📁 Output: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
