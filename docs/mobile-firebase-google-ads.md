# Timviz Mobile Firebase / Google Ads Setup

## What is already prepared

- The mobile app sends app events through `apps/mobile/src/lib/mobileAnalytics.ts`.
- Events are duplicated to the Timviz backend through `/api/mobile/pro/ads/events`.
- Firebase Analytics is enabled automatically only when the Firebase service files exist for the build.

Tracked mobile events:

- `app_open`
- `sign_up`
- `login`
- `tutorial_complete` for added service
- `generate_lead` for created appointment
- `begin_checkout`
- `purchase`
- `contact`
- `view_item`

## Firebase files

Create Firebase apps with the same bundle/package ids:

- iOS bundle id: `com.timviz.master`
- Android package id: `com.timviz.master`

Download files:

- iOS: `GoogleService-Info.plist`
- Android: `google-services.json`

For local builds put them here:

```text
apps/mobile/firebase/GoogleService-Info.plist
apps/mobile/firebase/google-services.json
```

These files are ignored by git and must not be committed.

## EAS variables

For EAS builds, add file secrets:

```text
GOOGLE_SERVICES_PLIST
GOOGLE_SERVICES_JSON
```

`app.config.js` reads these paths and only enables Firebase when the files are present.

## Google Ads connection

1. Open Firebase.
2. Project settings -> Integrations.
3. Link Google Ads.
4. Open Google Ads.
5. Goals -> Conversions -> App.
6. Import app conversions from Firebase / Google Analytics.
7. Mark the important events as conversions:
   - `sign_up`
   - `tutorial_complete`
   - `generate_lead`
   - `purchase`

For iOS install and in-app event optimization this requires a new App Store build that includes the Firebase files.
