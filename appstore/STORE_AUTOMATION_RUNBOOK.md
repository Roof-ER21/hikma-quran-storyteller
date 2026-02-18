# Store Automation Runbook

## Scope

This runbook covers automated release uploads for:

- Apple TestFlight (iOS)
- Google Play Internal Track (Android)

## One-Time Setup

1. Install Ruby dependencies:
   - `bundle install`
2. Create Android signing config:
   - Copy `android/keystore.properties.example` -> `android/keystore.properties`
   - Fill upload keystore values
3. Create release env:
   - Copy `fastlane/.env.example` -> `fastlane/.env`
   - Fill App Store Connect + Play credentials

## Required Credentials

### iOS

- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- One of:
  - `ASC_KEY_FILEPATH` (path to `.p8` key), or
  - `ASC_KEY_CONTENT_BASE64`
- `IOS_TEAM_ID` (if needed for signing override)

### Android

- `PLAY_SERVICE_ACCOUNT_JSON` (path to Play service account JSON)
- Android keystore values in `android/keystore.properties` (or env fallbacks in Gradle):
  - `storeFile`
  - `storePassword`
  - `keyAlias`
  - `keyPassword`

## Commands

### iOS

- Build only:
  - `npm run release:ios:build`
- Build + TestFlight upload:
  - `npm run release:ios:testflight` (runs `fastlane ios beta`)

### Android

- Build AAB only:
  - `npm run release:android:build`
- Build + Play internal upload:
  - `npm run release:android:internal`

## Notes

- Fastlane lanes are defined in `fastlane/Fastfile`.
- Android release signing auto-loads from `android/keystore.properties` when present.
- Current iOS project/scheme target:
  - Project: `ios/App/App.xcodeproj`
  - Scheme: `App`
- Current package identifiers:
  - iOS: `com.roofer21.alayasoad`
  - Android: `com.roofer21.alayasoad`
