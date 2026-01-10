# Prophet Stories Library - Integration Guide

## Quick Start

### Step 1: Copy Sample Data

Copy the sample data to the correct location:

```bash
cp SAMPLE_PROPHET_DATA.json data/prophetStoriesAdults.json
```

Or create your own based on the sample format with all 25 prophets.

### Step 2: Update App.tsx

Add the component to your navigation:

```tsx
// At the top, add import
import ProphetStoriesLibrary from './components/ProphetStoriesLibrary';

// Update view type
type ViewType = 'home' | 'story' | 'live' | 'quran' | 'kids' | 'library';

// Update state
const [view, setView] = useState<ViewType>('home');

// Add navigation button (in navbar)
<button
  onClick={() => setView('library')}
  className={`px-3 md:px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
    view === 'library' ? 'bg-rose-50 text-rose-800' : 'text-stone-500 hover:text-rose-700'
  }`}
>
  <i className="fas fa-university md:mr-2"></i>
  <span className="hidden md:inline">Prophet Library</span>
</button>

// Add view rendering (in main content area)
{view === 'library' && (
  <div className="h-[calc(100vh-80px)]">
    <ProphetStoriesLibrary />
  </div>
)}
```

### Step 3: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the new "Prophet Library" section

3. You should see:
   - 3 prophet cards (Adam, Nuh, Ibrahim) if using sample data
   - Search functionality working
   - Clicking a prophet shows detailed view
   - Sections are collapsible
   - Quranic verses display properly
   - Hadith references show correctly

## Adding More Prophets

### Data Structure Template

```json
{
  "id": "unique-id-lowercase",
  "prophetName": "Prophet Name (English)",
  "arabicName": "النبي عليه السلام",
  "era": "Time Period",
  "period": "More specific dating",
  "location": "Geographic location",
  "summary": "Brief summary of the prophet's story and mission",
  "keyLessons": [
    "First key lesson or takeaway",
    "Second lesson",
    "Third lesson"
  ],
  "sections": [
    {
      "id": "section-unique-id",
      "title": "Section Title",
      "content": "Detailed narrative. Can include multiple paragraphs separated by \\n\\n",
      "verses": [
        {
          "surah": 2,
          "verse": 31,
          "arabic": "Arabic text here",
          "transliteration": "Romanized pronunciation",
          "translation": "English translation"
        }
      ],
      "hadiths": [
        {
          "source": "Sahih Bukhari/Muslim/etc",
          "book": "Book name",
          "number": "Number",
          "text": "Hadith text",
          "grade": "Sahih/Hasan/etc"
        }
      ]
    }
  ],
  "relatedProphets": ["prophet-id-1", "prophet-id-2"],
  "historicalNotes": "Scholarly notes about historical context, archaeological findings, etc."
}
```

### Recommended 25 Prophets List

1. **Adam** (آدم) ✅ Included in sample
2. **Idris** (إدريس) - Enoch
3. **Nuh** (نوح) ✅ Included in sample
4. **Hud** (هود) - Sent to 'Ad people
5. **Salih** (صالح) - Sent to Thamud people
6. **Ibrahim** (إبراهيم) ✅ Included in sample
7. **Lut** (لوط) - Lot, nephew of Ibrahim
8. **Ismail** (إسماعيل) - Ishmael, son of Ibrahim
9. **Ishaq** (إسحاق) - Isaac, son of Ibrahim
10. **Yaqub** (يعقوب) - Jacob/Israel
11. **Yusuf** (يوسف) - Joseph in Egypt
12. **Shuaib** (شعيب) - Sent to Madyan
13. **Ayyub** (أيوب) - Job, tested with patience
14. **Dhul-Kifl** (ذو الكفل) - Ezekiel
15. **Musa** (موسى) - Moses and Pharaoh
16. **Harun** (هارون) - Aaron, brother of Musa
17. **Dawud** (داوود) - David, given Psalms
18. **Sulaiman** (سليمان) - Solomon, wisdom and kingdom
19. **Ilyas** (إلياس) - Elijah
20. **Alyasa** (اليسع) - Elisha
21. **Yunus** (يونس) - Jonah and the whale
22. **Zakariya** (زكريا) - Zechariah
23. **Yahya** (يحيى) - John the Baptist
24. **Isa** (عيسى) - Jesus (Messiah)
25. **Muhammad** (محمد) ﷺ - Final Prophet

## Where to Find Content

### Quranic Verses
- **Quran.com** - Best source for verified Arabic text, transliterations, and translations
- **Tanzil.net** - Developer-friendly Quran API
- Use Sahih International or other approved translations

### Hadith References
- **Sunnah.com** - Authenticated hadith collections (Bukhari, Muslim, Tirmidhi, etc.)
- Verify hadith authenticity (Sahih, Hasan, Daif)
- Include source, book, and number for verification

### Historical Context
- Ibn Kathir's "Stories of the Prophets" (Qisas al-Anbiya)
- Al-Tabari's "History of the Prophets and Kings"
- Modern scholarly works:
  - Yasir Qadhi's lectures
  - Nouman Ali Khan's Tafsir
  - Mufti Menk's series on prophets

## Styling Customization

### Custom Colors

The component uses these main Tailwind colors that you can customize:

```tsx
// Primary: Rose family
bg-rose-900  // Main buttons, headers
bg-rose-50   // Light backgrounds
text-rose-900  // Dark text

// Secondary: Amber family
bg-amber-600  // Accents
bg-amber-50  // Verse backgrounds
text-amber-700  // Highlights

// Neutral: Stone family
bg-stone-50  // Page backgrounds
text-stone-700  // Body text
```

### Typography

```tsx
font-serif    // Used for headings (classical feel)
font-arabic   // Used for Arabic text (ensure this is defined in globals.css)
prose prose-lg  // Used for readable long-form content
```

### Add Custom Arabic Font

In your `globals.css` or `tailwind.config.js`:

```css
@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');

.font-arabic {
  font-family: 'Amiri', 'Traditional Arabic', serif;
  font-size: 1.25em;
  line-height: 2;
}
```

## Features to Add Later

### Phase 2 Enhancements

1. **Audio Recitation**
   - Add audio URLs to verse objects
   - Implement audio player for Quranic verses
   - Option to listen while reading

2. **Bookmarking**
   - Save favorite prophets
   - Bookmark specific sections
   - Reading progress tracking

3. **Print Formatting**
   - Print-friendly CSS
   - Option to print individual prophet stories
   - PDF export functionality

4. **Sharing**
   - Share specific sections via social media
   - Copy verse text with proper attribution
   - Generate shareable quote images

5. **Advanced Search**
   - Filter by multiple criteria
   - Search within Quranic verses
   - Search within Hadith text
   - Timeline view of prophets

6. **Study Tools**
   - Note-taking feature
   - Highlight important passages
   - Create custom collections

7. **Multilingual Support**
   - Add more languages
   - Switch between translations
   - Multiple transliteration styles

## Accessibility Checklist

✅ Semantic HTML (heading hierarchy)
✅ ARIA labels where needed
✅ Keyboard navigation
✅ Focus indicators
✅ High contrast text
✅ Responsive font sizes
⬜ Screen reader testing (recommended)
⬜ WCAG 2.1 AA compliance audit

## Performance Optimization

Current optimizations:
- ✅ Data caching in memory
- ✅ Debounced search (300ms)
- ✅ Lazy section expansion
- ✅ Efficient re-renders

Future optimizations:
- ⬜ Lazy load images
- ⬜ Virtual scrolling for long lists
- ⬜ IndexedDB for offline support
- ⬜ Service worker caching

## Testing Checklist

- [ ] All 25 prophets load correctly
- [ ] Search finds prophets by name (English and Arabic)
- [ ] Search finds prophets by keywords in content
- [ ] Clicking prophet card opens detail view
- [ ] Back button returns to library view
- [ ] Sections expand/collapse correctly
- [ ] "Expand All" button works
- [ ] "Collapse All" button works
- [ ] Quranic verses display with proper RTL
- [ ] Arabic text renders correctly
- [ ] Transliteration is readable
- [ ] Hadith sources are properly formatted
- [ ] Related prophets navigation works
- [ ] Responsive design works on mobile
- [ ] Responsive design works on tablet
- [ ] Loading states appear correctly
- [ ] Empty search results handled gracefully
- [ ] No console errors

## Troubleshooting

### Issue: Data not loading

**Solution**: Ensure `prophetStoriesAdults.json` is in `/data/` directory and path in `prophetService.ts` is correct.

### Issue: Arabic text not displaying

**Solution**: Add Arabic font import to your CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Amiri&display=swap');
```

### Issue: Search not working

**Solution**: Check that the `searchProphetStories` function is imported and search query is being passed correctly.

### Issue: Sections not expanding

**Solution**: Verify the `expandedSections` Set is being updated in the `toggleSection` function.

### Issue: Styling looks wrong

**Solution**: Ensure Tailwind CSS is configured correctly and all classes are being recognized.

## Support and Resources

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **React Hooks Reference**: https://react.dev/reference/react
- **Islamic Resources**: Quran.com, Sunnah.com
- **Typography Best Practices**: https://practicaltypography.com/

---

**Ready to Deploy?**

Once you've:
1. ✅ Created `prophetStoriesAdults.json` with all 25 prophets
2. ✅ Integrated into App.tsx
3. ✅ Tested all features
4. ✅ Verified accessibility
5. ✅ Added proper Arabic fonts

Your Prophet Stories Library is production-ready!

---

**Questions or Issues?**

Check the main `PROPHET_LIBRARY_README.md` for detailed component documentation.
