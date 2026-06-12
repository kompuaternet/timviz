# Timviz Masters Ads Launch Pack

Prepared for campaigns that acquire masters, specialists, salon owners and small service businesses. Do not optimize these campaigns for simple clicks once conversion events are available.

## Landing Pages

- Main RU site landing: `https://timviz.com/ru/for-business`
- Main UK site landing: `https://timviz.com/uk/for-business`
- Main EN site landing: `https://timviz.com/en/for-business`
- Direct registration: `https://timviz.com/pro/create-account`
- Specialist-specific RU: `https://timviz.com/ru/for-masters`
- Specialist-specific UK: `https://timviz.com/uk/for-masters`
- Specialist-specific EN: `https://timviz.com/en/for-masters`
- Non-core languages: localized pages exist under `/fr`, `/pl`, `/cs`, `/es`, `/de`.
- Root helpers: `https://timviz.com/for-business` and `https://timviz.com/for-masters` redirect to the detected language.

## Conversion Priority

Primary paid traffic conversion:

- `business_profile_created`
- Meta standard event: `CompleteRegistration`

Secondary conversions:

- `sign_up_complete`
- Meta standard event: `Lead`
- `first_service_added`
- `booking_link_copied`

Micro conversions:

- `landing_view`
- `cta_click`
- `sign_up_start`
- `pricing_view`

Product activation:

- `pro_trial_started`

Still needs a server-side event before importing as a conversion:

- `first_booking_received`

## UTM Templates

Google Search final URL:

```text
https://timviz.com/{lang}/for-masters?utm_source=google&utm_medium=cpc&utm_campaign=ua_search_masters&utm_content={adgroupid}_{creative}&utm_term={keyword}
```

Meta final URL:

```text
https://timviz.com/{lang}/for-business?utm_source=meta&utm_medium=paid_social&utm_campaign=ua_meta_site_registrations&utm_content={{ad.name}}&utm_term={{placement}}
```

Remarketing final URL:

```text
https://timviz.com/pro/create-account?utm_source=meta&utm_medium=remarketing&utm_campaign=ua_meta_site_remarketing&utm_content={{ad.name}}&utm_term={{placement}}
```

## Meta Pixel And CAPI

Set these production variables before launching Meta traffic:

```text
NEXT_PUBLIC_META_PIXEL_ID=<pixel id>
META_PIXEL_ID=<same pixel id>
META_CONVERSIONS_API_ACCESS_TOKEN=<events manager token>
META_GRAPH_API_VERSION=v25.0
```

Verify in Meta Events Manager:

- `PageView` on every page and on client-side navigation.
- `ViewContent` when a visitor opens `/for-business`, `/for-masters`, or pricing pages.
- `Lead` on CTA clicks and registration start.
- `CompleteRegistration` after a successful master account registration.

Use `META_TEST_EVENT_CODE` in staging/testing and remove it for production.

## Google Ads Search Setup

- Campaign: `Timviz | Search | UA | Masters | Signups`
- Geo: Ukraine
- Languages: Ukrainian, Russian
- Networks: Google Search only. Disable Display Network.
- Starting budget split for USD 100/week: Search USD 60, Meta cold USD 30, Meta remarketing USD 10.
- Start bidding: Maximize Conversions if GTM conversions are live. Otherwise Manual CPC or Maximize Clicks with CPC cap for 3-5 days, then Maximize Conversions.
- Primary conversion action: `business_profile_created`.
- Temporary conversion action if volume is low: `sign_up_complete`.

## Manual Cabinet Checklist

1. Publish GTM container and verify `landing_view`, `cta_click`, `sign_up_start`, `sign_up_complete`, `business_profile_created`, `first_service_added`, `booking_link_copied`, `pricing_view`, `pro_trial_started`.
2. Create/import Google Ads conversion actions from GTM or GA4.
3. Import `google_ads_search_keywords.csv`.
4. Import `google_ads_responsive_search_ads.csv`.
5. Add `google_ads_negative_keywords.csv` as a shared negative keyword list.
6. Add sitelinks/callouts/snippets from `google_ads_extensions.csv`.
7. Create Meta campaign and audiences from `meta_ads_plan.csv`.
8. Upload the premium static creatives from `creatives/`.
9. Use `creative_briefs.md` for additional vertical videos.
