# Real-Device QA Matrix (Store Release Gate)

Use this matrix before every store submission. This is the manual complement to automated checks in `scripts/qa/`.

## 1) Device Coverage

Minimum required device set:

| Platform | Device Class | Example Device | Target Size |
|---|---|---|---|
| iOS | Small phone | iPhone SE (3rd gen) | 4.7" |
| iOS | Large phone | iPhone 15 Pro Max | 6.7" |
| iOS | Tablet | iPad Pro 11" | 11" |
| Android | Small/medium phone | Pixel 6a or Galaxy A54 | 6.1"-6.4" |
| Android | Large phone | Pixel 8 Pro / Galaxy S24+ | 6.7"+ |
| Android | Tablet | Pixel Tablet / Galaxy Tab | 10"+ |

## 2) Environments

- Build under test: TestFlight build (iOS) + Internal testing build (Android)
- Network profiles:
  - Strong Wi-Fi
  - Weak/unstable network
  - Offline (airplane mode after first load)
- Locale:
  - English (`en`)
  - Egyptian Arabic (`ar-EG`)

## 3) Core Pass/Fail Criteria

Fail the release if any of these occur:

1. Screen clipping or blocked primary action on any required device.
2. Non-functional vertical scrolling where content exceeds viewport.
3. Horizontal overflow causing unintended sideways scrolling.
4. Locale mismatch: visible untranslated core UI text in Arabic mode.
5. Crash, white screen, or repeated console/runtime error in normal flow.
6. Broken purchase/restore or parent-gate auth flow.

## 4) Critical Test Scenarios

Run all scenarios on both locales (`en`, `ar-EG`) unless marked otherwise.

| ID | Area | Scenario | Expected |
|---|---|---|---|
| NAV-01 | Navigation | Open each tab: Stories, Quran, Live, Kids, Library, Tools | Correct destination view loads every time |
| NAV-02 | Menu | Open/close mobile menu in portrait + landscape | Menu never traps user; touch/scroll remains usable |
| L10N-01 | Localization | Switch language on each main tab | Labels update immediately; direction/RTL correct |
| L10N-02 | Localization | Arabic mode deep scan (cards, headers, buttons, modals) | No stray English in core UX |
| SCR-01 | Scroll/Layout | Long pages: Quran list, Library detail, Kids stories, downloads modal | Smooth vertical scroll; no clipped controls |
| SCR-02 | Scroll/Layout | Landscape on small phone | No blocked CTA; no horizontal overflow |
| STR-01 | Stories | Select prophet/topic; open story; switch story language; share | Story loads, controls visible, share works |
| QUR-01 | Quran | Surah browse/search/open; tab switching Read/Story/Listen/Study/Practice | Each tab renders and remains scrollable |
| QUR-02 | Quran Audio | Start/stop recitation; change verse | Playback controls responsive, no lockups |
| LIV-01 | Live Tutor | Open Live; start session; stop session; mode change | Session state transitions correctly |
| KID-01 | Kids Mode | Enter kids, open letters/surahs/stories/rewards | Navigation and interactions remain stable |
| LIB-01 | Library | Open prophet library card + full detail + sections expand/collapse | No layout break; text direction correct |
| TLS-01 | Islamic Tools | Deny location then retry; allow location | Clear fallback messaging; tools recover |
| OFF-01 | Offline | Use previously visited pages offline | App remains usable with expected offline limits |
| PNT-01 | Permissions | Microphone, notifications, location permission prompts | Prompts appear once; post-denial UX clear |
| IAP-01 | Subscription | Purchase + restore on test account | Entitlement state updates correctly |
| ERR-01 | Error Path | Trigger handled error path (network/API fail) | Friendly error UX + no app crash |

## 5) Evidence Capture

For every failed scenario:

- Screenshot/video capture
- Device + OS version
- Locale + orientation
- Repro steps (short and deterministic)
- Severity (`blocker`, `major`, `minor`)
- Linked issue ID

Use `appstore/device-qa-template.csv` to track all results.

## 6) Automation Pairing (Required)

Before manual sign-off, run:

- Local smoke:
  - `python3 scripts/qa/mobile_qa_local.py`
- Production smoke:
  - `python3 scripts/qa/mobile_qa_live.py`

Attach both generated reports to the release ticket:

- `scripts/qa/results/local/qa_report.json`
- `scripts/qa/results/live/qa_report.json`
