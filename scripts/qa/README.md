## Mobile QA Scripts

These Playwright scripts validate:
- navigation to each major view (`stories`, `quran`, `live`, `kids`, `library`, `tools`)
- language toggle behavior (`en` -> `ar`)
- vertical scroll behavior
- horizontal overflow
- browser console/page errors

### Prerequisites

- Python 3
- Playwright for Python installed (`pip install playwright`)
- Playwright browsers installed (`playwright install chromium`)

### Local QA

1. Build and run preview:
   - `npm run build`
   - `npm run preview -- --host 127.0.0.1 --port 4173`
2. Run:
   - `python3 scripts/qa/mobile_qa_local.py`

Output:
- `scripts/qa/results/local/qa_report.json`
- screenshots in `scripts/qa/results/local/`

### Live QA (Production)

Run:
- `python3 scripts/qa/mobile_qa_live.py`

Output:
- `scripts/qa/results/live/qa_report.json`
- screenshots in `scripts/qa/results/live/`
