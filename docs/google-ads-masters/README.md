# Timviz Masters Ads Launch Pack

Prepared for campaigns that acquire masters, specialists, salon owners and small service businesses. Do not optimize these campaigns for simple clicks once conversion events are available.

## Landing Pages

- RU: `https://timviz.com/ru/for-masters`
- UK: `https://timviz.com/uk/for-masters`
- EN: `https://timviz.com/en/for-masters`
- Non-core languages: localized pages exist under `/fr`, `/pl`, `/cs`, `/es`, `/de`.
- Root helper: `https://timviz.com/for-masters` redirects to the detected language.

## Conversion Priority

Primary Google Ads conversion:

- `business_profile_created`

Secondary conversions:

- `sign_up_complete`
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
https://timviz.com/{lang}/for-masters?utm_source=meta&utm_medium=paid_social&utm_campaign=ua_meta_masters&utm_content={{ad.name}}&utm_term={{placement}}
```

Remarketing final URL:

```text
https://timviz.com/{lang}/for-masters?utm_source=google&utm_medium=remarketing&utm_campaign=ua_remarketing_masters
```

## Google Ads Search Setup

- Campaign: `Timviz | Search | UA | Masters | Signups`
- Geo: Ukraine
- Languages: Ukrainian, Russian
- Networks: Google Search only. Disable Display Network.
- Starting budget split for USD 100/week: Search USD 70, Meta USD 20, remarketing USD 10.
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
8. Use `creative_briefs.md` for banners and vertical videos.

