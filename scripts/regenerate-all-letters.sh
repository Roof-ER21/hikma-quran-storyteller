#!/bin/bash
# Regenerate ALL Arabic letter audio with consistent macOS Majed voice (MSA)
OUTPUT_DIR="public/assets/kids/audio/letters"

# Remove existing files for clean regeneration
echo "🗑️  Clearing existing letter audio files..."
rm -f "$OUTPUT_DIR"/*.mp3

generate_letter() {
  local id="$1"
  local name="$2"
  local example="$3"

  local letter_file="$OUTPUT_DIR/letter-${id}.mp3"
  local example_file="$OUTPUT_DIR/letter-${id}-example.mp3"

  echo "  📝 $id: $name → $example"

  # Generate letter pronunciation
  say -v Majed "هذا حرف ${name}" -o "/tmp/letter-${id}.aiff"
  ffmpeg -y -i "/tmp/letter-${id}.aiff" -acodec libmp3lame -ab 192k "$letter_file" 2>/dev/null
  rm -f "/tmp/letter-${id}.aiff"

  # Generate example
  say -v Majed "حرف ${name}. مثال: ${example}." -o "/tmp/letter-${id}-example.aiff"
  ffmpeg -y -i "/tmp/letter-${id}-example.aiff" -acodec libmp3lame -ab 192k "$example_file" 2>/dev/null
  rm -f "/tmp/letter-${id}-example.aiff"
}

echo ""
echo "🎙️  Generating ALL Arabic letter audio with Majed voice (MSA)..."
echo "    Perfect for Quran and Arabic alphabet learning!"
echo ""

# All 28 Arabic letters
generate_letter "alif" "ألف" "أسد"
generate_letter "baa" "باء" "بطة"
generate_letter "taa" "تاء" "تفاح"
generate_letter "thaa" "ثاء" "ثعلب"
generate_letter "jeem" "جيم" "جمل"
generate_letter "haa" "حاء" "حصان"
generate_letter "khaa" "خاء" "خروف"
generate_letter "dal" "دال" "دب"
generate_letter "thal" "ذال" "ذرة"
generate_letter "raa" "راء" "رمان"
generate_letter "zay" "زاي" "زرافة"
generate_letter "seen" "سين" "سمكة"
generate_letter "sheen" "شين" "شمس"
generate_letter "saad" "صاد" "صقر"
generate_letter "daad" "ضاد" "ضفدع"
generate_letter "taa2" "طاء" "طائر"
generate_letter "thaa2" "ظاء" "ظبي"
generate_letter "ayn" "عين" "عنب"
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
echo "✅ Complete! Generated 56 audio files with consistent Majed (MSA) voice."
echo ""
ls -la "$OUTPUT_DIR" | head -20
