#!/bin/bash
# Generate remaining Arabic letter audio using macOS TTS
OUTPUT_DIR="public/assets/kids/audio/letters"

generate_letter() {
  local id="$1"
  local name="$2"
  local example="$3"

  local letter_file="$OUTPUT_DIR/letter-${id}.mp3"
  local example_file="$OUTPUT_DIR/letter-${id}-example.mp3"

  # Generate letter audio if missing
  if [ ! -f "$letter_file" ]; then
    echo "Generating: $id ($name)..."
    say -v Majed "هذا حرف ${name}" -o "/tmp/letter-${id}.aiff"
    ffmpeg -y -i "/tmp/letter-${id}.aiff" -acodec libmp3lame -ab 128k "$letter_file" 2>/dev/null
    rm -f "/tmp/letter-${id}.aiff"
    echo "  ✅ Created $letter_file"
  else
    echo "  ⏭️  Skipping $id letter (exists)"
  fi

  # Generate example audio if missing
  if [ ! -f "$example_file" ]; then
    echo "Generating: $id example ($example)..."
    say -v Majed "حرف ${name}. مثال: ${example}." -o "/tmp/letter-${id}-example.aiff"
    ffmpeg -y -i "/tmp/letter-${id}-example.aiff" -acodec libmp3lame -ab 128k "$example_file" 2>/dev/null
    rm -f "/tmp/letter-${id}-example.aiff"
    echo "  ✅ Created $example_file"
  else
    echo "  ⏭️  Skipping $id example (exists)"
  fi
}

echo "🎙️  Generating remaining Arabic letter audio with macOS TTS..."
echo ""

# Missing letters
generate_letter "thaa2" "ظاء" "ظبي"
generate_letter "ghayn" "غين" "غزال"
generate_letter "faa" "فاء" "فيل"
generate_letter "qaaf" "قاف" "قمر"
generate_letter "kaaf" "كاف" "كتاب"
generate_letter "laam" "لام" "ليمون"
generate_letter "meem" "ميم" "موز"
generate_letter "noon" "نون" "نجمة"
generate_letter "haa2" "هاء" "هلال"
generate_letter "waw" "واو" "وردة"
generate_letter "yaa" "ياء" "يد"

echo ""
echo "✅ Done! All Arabic letter audio files generated."
