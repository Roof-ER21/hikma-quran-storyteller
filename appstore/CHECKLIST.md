# Hikma (Alaya & Soad's Gift) - Store Submission Checklist

## Shared Release Readiness

### Metadata & Content
- [x] `appstore/metadata.json` complete for iOS baseline
- [x] Description, keywords, promo copy drafted
- [x] Google Play short description (80 chars) finalized (`appstore/google-play-listing.md`)
- [x] Google Play full description (4000 chars) finalized (`appstore/google-play-listing.md`)
- [x] Competitive deep-dive completed (`appstore/competitive-deep-dive-2026-02-15.md`)
- [ ] Store listing screenshots for both platforms exported

### Legal & Policy
- [x] Privacy policy URL publicly reachable
- [x] Terms of service URL publicly reachable
- [ ] Support email monitored
- [ ] COPPA / child-directed disclosures reviewed in both consoles
- [ ] Subscription disclosures match in-app pricing and trial terms

### Functional QA
- [x] TypeScript clean (`npx tsc --noEmit`)
- [x] Production web build clean (`npm run build`)
- [x] In-app issue reporting wired with diagnostics (`services/issueReportService.ts`)
- [x] Automated mobile smoke scripts added (`scripts/qa/mobile_qa_local.py`, `scripts/qa/mobile_qa_live.py`)
- [ ] Real-device QA matrix completed (`appstore/DEVICE_QA_MATRIX.md`)
- [x] QA evidence sheet completed (`appstore/device-qa-template.csv`)
- [ ] iOS TestFlight smoke test complete
- [ ] Android internal testing track smoke test complete
- [ ] Offline mode verified on real device
- [ ] Voice/search/microphone permission flow verified on device
- [ ] Prayer notifications verified on device

## Apple App Store (iOS)

### Connect Setup
- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [x] Bundle ID: `com.roofer21.alayasoad`
- [ ] Version + build numbers set for release
- [ ] Categories and age rating finalized

### Assets
- [ ] 1024x1024 App Store icon
- [ ] iPhone 6.7" screenshots
- [ ] iPhone 6.5" screenshots
- [ ] iPhone 5.5" screenshots
- [ ] iPad 12.9" screenshots
- [ ] iPad 11" screenshots

### Build & Upload
- [x] `npm run ios:build`
- [ ] Open Xcode, archive, and validate
- [ ] Upload to App Store Connect
- [ ] Submit for review

## Google Play Store (Android)

### Play Console Setup
- [ ] Google Play Developer account active
- [ ] App created in Play Console
- [x] Application ID planned as `com.roofer21.alayasoad`
- [ ] Data safety form completed
- [ ] Content rating questionnaire completed
- [ ] Target audience / Families policy reviewed

### Android Build Pipeline
- [x] Capacitor Android dependency added
- [x] Android platform generated (`npx cap add android`)
- [x] Android signing config prepared
- [x] Release AAB generated from Android Studio / Gradle (`./gradlew :app:bundleRelease`)
- [ ] Internal testing track upload completed

### Play Listing Assets
- [ ] 512x512 app icon
- [ ] Feature graphic 1024x500
- [ ] Phone screenshots (minimum 2)
- [ ] 7-inch tablet screenshots (recommended)
- [ ] 10-inch tablet screenshots (recommended)

## In-App Purchases / Subscriptions (RevenueCat)
- [x] RevenueCat Capacitor plugin installed
- [x] Subscription service and paywall flow wired
- [ ] Products created in App Store Connect
- [ ] Products created in Google Play Console
- [ ] RevenueCat offerings mapped to both stores
- [ ] End-to-end purchase + restore tested on both platforms

## Command Quick Reference
- iOS build + sync: `npm run ios:build`
- iOS open: `npm run ios:open`
- Android build + sync: `npm run android:build`
- Android open: `npm run android:open`
- Android run on device/emulator: `npm run android:run`
