# Quick Start - Recitation Components

## 🚀 60-Second Integration

### 1. Import
```tsx
import RecitationChecker from './components/RecitationChecker';
import { Verse } from './types';
```

### 2. Use
```tsx
const verse: Verse = {
  number: 1,
  numberInSurah: 1,
  arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  translation: "In the name of Allah, the Most Gracious, the Most Merciful",
  juz: 1,
  page: 1
};

<RecitationChecker
  verse={verse}
  surahNumber={1}
  onComplete={(accuracy) => alert(`Score: ${accuracy}%`)}
  onNext={() => console.log('Next!')}
/>
```

### 3. Done! 🎉

---

## 📋 What You Get

✅ **RecitationChecker** - Single verse practice with AI feedback
✅ **MemorizationMode** - 4-stage progressive memorization
✅ **checkRecitation** - AI service function (already added)

---

## 🎯 Component Comparison

| Feature | RecitationChecker | MemorizationMode |
|---------|------------------|------------------|
| **Use Case** | Practice single verses | Memorize multiple verses |
| **Stages** | One-shot recording | 4 progressive stages |
| **Feedback** | Detailed word-by-word | Quick score + tips |
| **Navigation** | Next verse button | Stage + verse navigation |
| **Progress** | Per-session | Persistent tracking |
| **Best For** | Beginners, pronunciation | Advanced, memorization |

---

## 💡 Tips

### For Best Results:
- Quiet environment
- Speak clearly
- Apply tajweed rules
- Take breath before starting

### Browser Requirements:
- HTTPS connection
- Microphone permission
- Modern browser (Chrome, Safari, Edge, Firefox)

---

## 📁 Files You Need

All files already created in:
- `/components/RecitationChecker.tsx`
- `/components/MemorizationMode.tsx`
- `/components/RecitationPracticeExample.tsx` (full example)
- `/services/geminiService.ts` (updated with checkRecitation)

---

## 🆘 Troubleshooting

**"Microphone access denied"**
→ Enable microphone in browser settings

**"Unable to analyze recitation"**
→ Check internet connection & API key

**TypeScript errors**
→ Import types from './types'

---

## 📖 Full Docs

See `RECITATION_COMPONENTS_README.md` for complete documentation.

---

**Ready to practice!** 🕌
