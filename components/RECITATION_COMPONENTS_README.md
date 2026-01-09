# Recitation Practice Components

Two powerful AI-powered components for Quran recitation practice and memorization.

## Components

### 1. RecitationChecker

Interactive component that records user recitation and provides AI-powered feedback.

#### Features
- Audio recording with visual feedback
- AI analysis via Google Gemini
- Word-by-word feedback with color coding:
  - 🟢 Green: Correct pronunciation
  - 🔴 Red: Incorrect/mispronounced
  - 🟡 Yellow: Missing words
  - 🟠 Orange: Extra words
- Animated accuracy progress ring
- Tajweed improvement suggestions
- Retry and next verse navigation

#### Props
```typescript
interface RecitationCheckerProps {
  verse: Verse;           // Verse object with Arabic and translation
  surahNumber: number;    // Surah number (1-114)
  onComplete: (accuracy: number) => void;  // Callback with accuracy score
  onNext: () => void;     // Callback for next verse
}
```

#### Usage Example
```tsx
import RecitationChecker from './components/RecitationChecker';

function MyComponent() {
  const verse = {
    number: 1,
    numberInSurah: 1,
    arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    translation: "In the name of Allah, the Most Gracious, the Most Merciful",
    juz: 1,
    page: 1
  };

  return (
    <RecitationChecker
      verse={verse}
      surahNumber={1}
      onComplete={(accuracy) => console.log('Accuracy:', accuracy)}
      onNext={() => console.log('Next verse')}
    />
  );
}
```

### 2. MemorizationMode

Progressive memorization trainer with 4 difficulty stages and streak tracking.

#### Features
- **4 Progressive Stages:**
  1. Show All: Full verse with translation
  2. Hide Translation: Arabic only
  3. Hide Partial: Every other word hidden
  4. Hide All: Complete from memory
- Accuracy tracking per verse
- Streak counter for consecutive correct recitations
- Best score tracking
- Overall progress dashboard
- Auto-advance on 85%+ accuracy
- Visual stage indicators

#### Props
```typescript
interface MemorizationModeProps {
  verses: Verse[];        // Array of verses to memorize
  surahNumber: number;    // Surah number
  surahName: string;      // Surah name for display
  onProgress: (completed: number, total: number) => void;  // Progress callback
}
```

#### Usage Example
```tsx
import MemorizationMode from './components/MemorizationMode';

function MyComponent() {
  const verses = [
    {
      number: 1,
      numberInSurah: 1,
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: "In the name of Allah, the Most Gracious, the Most Merciful",
      juz: 1,
      page: 1
    },
    // ... more verses
  ];

  return (
    <MemorizationMode
      verses={verses}
      surahNumber={1}
      surahName="Al-Fatihah"
      onProgress={(completed, total) =>
        console.log(`Progress: ${completed}/${total}`)
      }
    />
  );
}
```

## Integration with Existing App

### Step 1: Add to QuranView or New Tab

In `QuranView.tsx`, add a new tab for practice:

```tsx
// Add to tab list
{ id: 'practice' as TabType, label: 'Practice', icon: 'fa-microphone' }

// Add tab content
{activeTab === 'practice' && renderPracticeTab()}

// Render function
const renderPracticeTab = () => {
  const [practiceMode, setPracticeMode] = useState<'checker' | 'memorize' | 'menu'>('menu');

  if (practiceMode === 'checker') {
    return (
      <RecitationChecker
        verse={surahData.verses[currentVerseIndex]}
        surahNumber={selectedSurah.number}
        onComplete={(accuracy) => handlePracticeComplete(accuracy)}
        onNext={() => setCurrentVerseIndex(prev => prev + 1)}
      />
    );
  }

  if (practiceMode === 'memorize') {
    return (
      <MemorizationMode
        verses={surahData.verses}
        surahNumber={selectedSurah.number}
        surahName={selectedSurah.nameEn}
        onProgress={(completed, total) => updateProgress(completed, total)}
      />
    );
  }

  // Menu UI to select mode...
};
```

### Step 2: Import Types

The components use these types from `../types`:
- `Verse` - Main verse structure
- `RecitationResult` - AI feedback result

Both are already defined in `/types.ts`.

### Step 3: Import Service

The components use the `checkRecitation` function from `geminiService.ts`, which has been added.

## Technical Details

### Audio Recording
- Uses Web Audio API
- Supports WebM format (Chrome/Edge default)
- Automatically requests microphone permission
- Cleans up streams on unmount

### AI Analysis
- Powered by Google Gemini 3 Flash Preview
- Analyzes pronunciation accuracy
- Provides word-level feedback
- Suggests tajweed improvements
- Returns structured JSON response

### State Management
Both components are self-contained with local state:
- Recording state machine
- Progress tracking
- Result display
- No external state dependencies

### Styling
- Tailwind CSS with rose/stone theme
- Smooth CSS transitions
- Mobile-friendly responsive design
- Animated progress indicators
- FontAwesome icons

## Example Integration File

See `RecitationPracticeExample.tsx` for a complete working example with:
- Mode selection menu
- Navigation between modes
- Progress tracking
- Feature showcase

## Performance Considerations

1. **Audio Processing**: Processing happens after recording stops
2. **API Calls**: One API call per recitation check
3. **Progressive Enhancement**: Works without localStorage
4. **Memory**: Cleans up audio streams properly

## Future Enhancements

Potential additions:
- Offline storage for progress (localStorage/IndexedDB)
- Export progress to PDF/CSV
- Social sharing of achievements
- Comparison with famous reciters
- Advanced tajweed rule detection
- Multi-language feedback

## Browser Support

Requires:
- Modern browser with Web Audio API
- Microphone access
- ES6+ JavaScript support

Tested on:
- Chrome 90+
- Edge 90+
- Safari 14+
- Firefox 88+

## Troubleshooting

### "Microphone access denied"
- Check browser permissions
- Use HTTPS (required for getUserMedia)
- Grant microphone access when prompted

### "Unable to analyze recitation"
- Check internet connection
- Verify Gemini API key is valid
- Ensure audio quality is good (quiet environment)

### TypeScript errors
- Ensure `Verse` and `RecitationResult` types are imported
- Check that `checkRecitation` is exported from `geminiService`

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key configuration
3. Test microphone with browser's native recorder first
4. Review geminiService.ts for API call issues

---

**Created**: January 9, 2026
**Components**: RecitationChecker.tsx, MemorizationMode.tsx
**Service**: geminiService.ts (checkRecitation function)
**Example**: RecitationPracticeExample.tsx
