# Prophet Stories - Adults Section

## Overview

This JSON file contains **24 detailed prophet stories** extracted from MyIslam.org's comprehensive "The Story of Prophets" document. These stories are designed for the Adults section of the Hikma Islamic storytelling app.

## File Details

- **Source**: `/Users/a21/Downloads/The Story of Prophets.txt` (6,619 lines)
- **Output**: `/Users/a21/Downloads/hikma_-quran-storyteller/data/prophetStoriesAdults.json` (447KB)
- **Format**: JSON array of 24 prophet story objects
- **Date Created**: January 9, 2026

## Statistics

- **Total Prophets**: 24
- **Total Sections**: 367
- **Total Quran Verses**: 41 (with Arabic, transliteration, translation, reference)
- **Total Hadith References**: 19 (with text and source)

## Structure

Each prophet story follows this structure:

```json
{
  "id": "adam",
  "prophet": "Adam",
  "prophetArabic": "آدم",
  "title": "The First Man and Khalifah on Earth",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Full narrative text...",
      "quranVerses": [
        {
          "arabic": "Arabic text...",
          "transliteration": "Transliteration...",
          "translation": "English translation...",
          "reference": "Surah Name, Chapter:Verse"
        }
      ],
      "hadithReferences": [
        {
          "text": "Hadith text...",
          "source": "Sahih Bukhari 1234"
        }
      ]
    }
  ],
  "keyLessons": ["Lesson 1", "Lesson 2", "Lesson 3"],
  "relatedProphets": ["Prophet1", "Prophet2"]
}
```

## Complete List of Prophets

1. **Adam** (آدم) - The First Man and Khalifah on Earth
   - 17 sections, 2 Quran verses, 4 hadiths

2. **Idris** (إدريس) - The Elevated Prophet
   - 4 sections, 2 Quran verses, 1 hadith

3. **Nuh** (نوح) - The Prophet of Patience
   - 15 sections, 0 Quran verses, 0 hadiths

4. **Hud** (هود) - The Warner to the People of 'Ad
   - 12 sections, 0 Quran verses, 0 hadiths

5. **Saleh** (صالح) - The Messenger to Thamud
   - 7 sections, 3 Quran verses, 1 hadith

6. **Ibrahim** (إبراهيم) - The Friend of Allah
   - 31 sections, 3 Quran verses, 1 hadith

7. **Lut** (لوط) - The Prophet of Sodom
   - 19 sections, 7 Quran verses, 0 hadiths

8. **Ishmael** (إسماعيل) - The Sacrificial Son
   - 14 sections, 1 Quran verse, 2 hadiths

9. **Ishaq** (إسحاق) - The Blessed Son
   - 4 sections, 0 Quran verses, 0 hadiths

10. **Yaqub** (يعقوب) - Israel - The Patient Father
    - 10 sections, 2 Quran verses, 0 hadiths

11. **Yusuf** (يوسف) - The Dreamer of Egypt
    - 6 sections, 3 Quran verses, 0 hadiths

12. **Ayyub** (أيوب) - The Patient Prophet
    - 7 sections, 1 Quran verse, 0 hadiths

13. **Shu'aib** (شعيب) - The Prophet of Midian
    - 9 sections, 0 Quran verses, 0 hadiths

14. **Musa** (موسى) - The Prophet Who Spoke to Allah
    - 111 sections, 5 Quran verses, 2 hadiths

15. **Harun** (هارون) - The Spokesman
    - 6 sections, 1 Quran verse, 0 hadiths

16. **Dhul-Kifl** (ذو الكفل) - The Patient One
    - 4 sections, 1 Quran verse, 0 hadiths

17. **Dawud** (داوود) - The King and Psalmist
    - 15 sections, 0 Quran verses, 0 hadiths

18. **Sulaiman** (سليمان) - The Wise King
    - 3 sections, 4 Quran verses, 1 hadith

19. **Ilyas** (إلياس) - The Prophet of Miracles
    - 2 sections, 1 Quran verse, 0 hadiths

20. **Al-Yasa** (اليسع) - The Successor
    - 2 sections, 1 Quran verse, 0 hadiths

21. **Yunus** (يونس) - The Prophet of the Whale
    - 3 sections, 1 Quran verse, 0 hadiths

22. **Zakariyah** (زكريا) - The Father of Yahya
    - 17 sections, 0 Quran verses, 2 hadiths

23. **Yahya** (يحيى) - John the Baptist
    - 21 sections, 1 Quran verse, 1 hadith

24. **Isa** (عيسى) - The Messiah
    - 28 sections, 2 Quran verses, 4 hadiths

## Key Features

### Quranic Verses
Each Quran verse includes:
- **Arabic**: Original Quranic text
- **Transliteration**: Romanized pronunciation
- **Translation**: English meaning
- **Reference**: Surah name and verse number

### Hadith References
Each hadith includes:
- **Text**: The hadith narrative
- **Source**: Authentic source (Sahih Bukhari, Sahih Muslim, Tirmidhi, etc.)

### Key Lessons
Each prophet story includes key lessons and themes:
- Faith and submission to Allah
- Patience and perseverance
- Calling to monotheism (Tawhid)
- Trust in Allah's plan
- Forgiveness and mercy

### Related Prophets
Cross-references to other prophets mentioned in each story

## Parsing Notes

### Parser Script
Location: `/Users/a21/Downloads/advanced_prophet_parser.py`

The parser:
1. Splits content by Tab markers (24 tabs for 24 prophets)
2. Identifies section headings (ALL CAPS or ending with colon)
3. Extracts Quran verses with 4-line structure (Arabic → Transliteration → Translation → Reference)
4. Identifies hadith references by source patterns
5. Removes image placeholders and formatting artifacts
6. Generates key lessons based on prophet themes
7. Identifies related prophets from content

### Quality Assurance
- All 24 prophets successfully parsed
- Arabic text preserved with proper UTF-8 encoding
- Quranic references validated
- Hadith sources identified and tagged
- Content cleaned of image markers and separators

## Usage in Hikma App

This JSON file is ready for integration into the Hikma Islamic storytelling app's Adults section. The structure supports:

- **Progressive disclosure**: Sections can be displayed one at a time
- **Interactive learning**: Quran verses and hadiths highlighted separately
- **Cross-referencing**: Related prophets linked
- **Multilingual support**: Arabic text with transliteration and translation
- **Educational focus**: Key lessons extracted for quick reference

## Source Attribution

All content sourced from MyIslam.org's comprehensive "The Story of Prophets" collection. This material is intended for educational purposes within the Hikma Islamic app to teach about the prophets in Islam with accuracy and respect.

## Technical Details

- **Encoding**: UTF-8
- **Format**: JSON (minified: false, indent: 2)
- **File Size**: 447KB
- **Lines**: 3,005
- **Valid JSON**: ✓

## Maintenance

To regenerate or update:
```bash
python3 /Users/a21/Downloads/advanced_prophet_parser.py
```

The parser can be modified to adjust:
- Section heading detection
- Quran verse extraction logic
- Hadith pattern matching
- Key lesson generation
- Related prophet detection

---

**Created for**: Hikma - Quran Storyteller App
**Section**: Adults (detailed prophet stories)
**Generated**: January 9, 2026
**Format**: JSON structured data
