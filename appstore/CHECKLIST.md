# Hikma (Alaya & Soad's Gift) - App Store Submission Checklist

## Pre-Submission Requirements

### Metadata & Text Content
- [x] metadata.json complete
- [x] App description written
- [x] Keywords optimized (99 chars)
- [x] Promotional text
- [x] Reviewer notes prepared

### Visual Assets (TO DO)
- [ ] App icon (1024x1024px)
- [ ] iPhone 6.7" screenshots (3-10)
- [ ] iPhone 6.5" screenshots (3-10)
- [ ] iPhone 5.5" screenshots (3-10)
- [ ] iPad 12.9" screenshots (2-10)
- [ ] iPad 11" screenshots (2-10)

### Legal & Support
- [ ] Privacy policy page deployed
- [ ] Terms of service page deployed
- [ ] Support email active

### App Store Connect Setup
- [ ] Apple Developer Account active
- [ ] App registered in App Store Connect
- [ ] Bundle ID: com.roofer21.alayasoad
- [ ] Version 1.0.0 created
- [ ] Age rating: 4+
- [ ] Categories: Education (primary), Books (secondary)

### In-App Purchases (RevenueCat)
- [x] RevenueCat Capacitor plugin installed
- [x] Subscription service created
- [x] PremiumGate component created
- [ ] RevenueCat account created & configured
- [ ] Kids Premium: $4.99/month or $39.99/year
- [ ] Scholar Premium: $9.99/month or $79.99/year
- [ ] 7-day free trial configured
- [ ] Entitlements: "premium", "kids_premium", "scholar"

### Build & Testing
- [ ] Capacitor iOS build working
- [ ] TestFlight beta testing
- [ ] Prophet stories loading
- [ ] Kids mode working
- [ ] Quran recitations playing
- [ ] AI tutor responding
- [ ] RevenueCat paywall flow tested
- [ ] Offline mode verified

## Submission Steps
1. Create app in App Store Connect
2. Upload metadata from metadata.json
3. Upload screenshots
4. Configure IAP subscriptions
5. Build: `npm run ios:build`
6. Archive in Xcode and upload
7. Submit for review

## App Details Quick Reference
- **Name:** Alaya & Soad's Gift
- **Bundle ID:** com.roofer21.alayasoad
- **Version:** 1.0.0
- **Platform:** iOS (Capacitor 8)
- **Pricing:** Free with IAP
- **Age Rating:** 4+
