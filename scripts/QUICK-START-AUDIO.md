# Quick Start: Generate Kids Audio

## 1. Get Your API Key

Get a free Google AI API key from:
https://aistudio.google.com/apikey

## 2. Set Environment Variable

### Option A: In your terminal session
```bash
export VITE_GEMINI_API_KEY="your-api-key-here"
```

### Option B: Create a .env file
Create `.env` in the project root:
```
VITE_GEMINI_API_KEY=your-api-key-here
```

## 3. Run the Script

### Using npm (recommended)
```bash
npm run prebake:kids
```

### Using node directly
```bash
node scripts/prebake-kids-audio.mjs
```

## 4. Wait for Completion

The script will:
- Generate 56 Arabic letter audio files (~2 minutes)
- Generate ~30 story audio files (~1 minute)
- Total time: ~2-3 minutes

## 5. Test in the App

```bash
npm run dev
```

Then:
1. Open http://localhost:5173
2. Click "Kids Mode"
3. Test Arabic Letters activity
4. Test Prophet Stories activity

## What Gets Created

```
public/assets/kids/audio/
├── letters/                    (56 files)
│   ├── letter-alif.mp3
│   ├── letter-alif-example.mp3
│   └── ...
└── story-*.mp3                 (30 files)
    ├── story-adam-scene-0.mp3
    ├── story-adam-lesson.mp3
    └── ...
```

## Troubleshooting

### "Missing API key"
```bash
# Make sure you exported the key
echo $VITE_GEMINI_API_KEY

# Should print your key, not empty
```

### "Permission denied"
```bash
# Make the script executable
chmod +x scripts/prebake-kids-audio.mjs
```

### "Module not found"
```bash
# Install dependencies
npm install
```

## Need Help?

Read the full documentation:
- [README-KIDS-AUDIO.md](./README-KIDS-AUDIO.md)

Or check the existing prebake script:
- [prebake-audio.mjs](./prebake-audio.mjs)
