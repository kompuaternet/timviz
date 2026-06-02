# Apple Ads Week 1 Bulk Upload Pack

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

This pack prepares Apple Ads Advanced Search Results campaigns for Timviz Master. It does not log in to Apple Ads, does not configure campaigns in the browser, and does not start spend.

## Files

- apple_ads_campaign_plan.md: campaign structure, countries, budgets, bids, and exclusions
- active_campaigns_summary.csv: compact summary of the three active W1 campaigns
- human_readable_keywords.csv: all active keyword rows with campaign/ad group names and blank IDs
- human_readable_negative_keywords.csv: all active negative keyword rows with campaign names and blank IDs
- keywords_ua.csv, keywords_kz.csv, keywords_pl.csv: Apple keyword upload CSV files with blank Campaign ID and Ad Group ID
- negative_keywords_global.csv: global campaign-level negative keywords for all three W1 campaigns
- negative_keywords_ua.csv, negative_keywords_kz.csv, negative_keywords_pl.csv: country/language campaign-level negatives
- paused_wave2_keywords_cz.csv, paused_wave2_keywords_es.csv: Wave 2 exact keywords, PAUSED
- paused_competitors_keywords.csv: competitor exact keywords, PAUSED
- optimization_rules.md: day 2/day 7 bid and pause rules
- launch_checklist.md: manual setup and pre-launch checklist
- validation_report.md: generated validation and counts

## Manual Setup Flow

1. In Apple Ads Advanced, create three Search Results campaigns:
   - TIVZ_UA_SR_EXACT_W1, Ukraine, $6/day
   - TIVZ_KZ_SR_EXACT_W1, Kazakhstan, $4/day
   - TIVZ_PL_SR_EXACT_W1, Poland, $4/day
2. Set each campaign to Manage Bids, New users, Search Match Off, all compatible devices, no age/gender restriction.
3. Set end date to launch date + 7 days. If launching on 2026-06-02, use 2026-06-09.
4. Keep every campaign and ad group PAUSED until final human approval.
5. Create the ad groups named in active_campaigns_summary.csv.
6. Copy Campaign ID and Ad Group ID from Apple Ads into the keyword CSV files.
7. Upload the matching keyword CSV for each country campaign.
8. Upload negative_keywords_global.csv at campaign level, then upload the country-specific negative keyword file for the matching campaign.
9. Re-check total active daily budget is no more than $14/day before enabling anything.

## Where To Get IDs

- Campaign ID: open the campaign in Apple Ads and copy the numeric ID from campaign details or reporting/export tables.
- Ad Group ID: open the ad group and copy the numeric ID from ad group details or reporting/export tables.
- Keep IDs out of source code secrets. These CSV files may contain operational IDs but no Apple ID credentials, 2FA, payments, API keys, or tokens.

## Upload Rules

- Save and upload CSV as UTF-8.
- Keep Match Type EXACT for all active target keywords.
- Do not enable broad match, Search Match, Today Tab, Search Tab, Product Pages, or Maximize Conversions in W1.
- Do not launch Russia. Do not launch US, UK, Canada, Germany, France, Spain, Mexico, or Czech Republic in W1.
