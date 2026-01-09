<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ONOeqL4POixX9yagULO0SZFLFOMeejv7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (Railway: add `VITE_GEMINI_API_KEY` or `GEMINI_API_KEY`)
3. Run the app:
   `npm run dev`

## Deploy (Railway/Docker)

- Railway will use the provided `Dockerfile` so only the Node static server runs (avoids Caddy binding the same port).
- Build and test the image locally: `docker build -t hikma-storyteller . && docker run -p 8080:8080 --env PORT=8080 --env VITE_GEMINI_API_KEY=your_key hikma-storyteller`.
- Prebake offline audio (kids stories + short surahs) before deploy: `VITE_GEMINI_API_KEY=your_key node scripts/prebake-audio.mjs`.
