# Timviz Mobile Firebase / Google Ads Setup

## What is already prepared

- The mobile app sends app events through `apps/mobile/src/lib/mobileAnalytics.ts`.
- Events are duplicated to the Timviz backend through `/api/mobile/pro/ads/events`.
- New mobile registrations are also reported from the backend through `lib/mobile-registration-conversions.ts`.
- Firebase Analytics is enabled automatically only when the Firebase service files exist for the build.
- iOS registrations call Firebase on-device conversion measurement before logging `sign_up`.

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

For iOS install and in-app event optimization this requires a new App Store build that includes the Firebase files. The iOS build also enables the `GoogleAdsOnDeviceConversion` pod when `GOOGLE_SERVICES_PLIST` is present.

## Temporary server-side registration signal

Until the next App Store build is released, the backend sends a best-effort signal when a new master registers through the mobile app.

It is triggered from:

- `/api/mobile/pro/register`
- `/api/mobile/pro/social-auth`
- `/api/mobile/pro/auth/google/callback`
- the mobile bridge inside `/api/pro/auth/google/callback`

The event is stored in Supabase `webhook_events` with:

- provider: `timviz_mobile_registration_conversion`
- event type: `mobile_sign_up_complete`
- Google event name: `sign_up`

Optional Railway variables:

```text
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
GA4_FIREBASE_APP_ID=
GA4_APP_API_SECRET=
MOBILE_REGISTRATION_CONVERSION_WEBHOOK_URL=
MOBILE_REGISTRATION_CONVERSION_WEBHOOK_SECRET=
MOBILE_REGISTRATION_CONVERSION_SALT=
MOBILE_REGISTRATION_SERVER_CONVERSIONS_DISABLED=false
```

`GA4_MEASUREMENT_ID` + `GA4_API_SECRET` sends a web-stream Measurement Protocol event.
`GA4_FIREBASE_APP_ID` + `GA4_APP_API_SECRET` sends an app-stream Measurement Protocol event. Without a real Firebase `app_instance_id` from the app, the backend uses a stable server-generated id, so this is useful as a temporary registration counter but it is not the same quality as Firebase SDK app attribution.
`MOBILE_REGISTRATION_CONVERSION_WEBHOOK_URL` can point to Make, Zapier, a Google Ads API bridge, or any internal collector. The webhook payload includes hashed email/phone values for downstream enhanced-conversion workflows, but GA4 requests do not include email or phone.
