# Apple Ads W1 Validation Report

Generated: 2026-06-02

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

## Budget

- Total active daily budget: $14.00
- Weekly active planned spend: about $98.00 over 7 days
- Reserve against the $100/week cap: about $2.00
- End date rule: launch date + 7 days. If launched on 2026-06-02, use 2026-06-09.

## Active Campaigns

- TIVZ_UA_SR_EXACT_W1: Ukraine, $6/day, Search Results, Manage Bids, Search Match Off, New users, PAUSED
- TIVZ_KZ_SR_EXACT_W1: Kazakhstan, $4/day, Search Results, Manage Bids, Search Match Off, New users, PAUSED
- TIVZ_PL_SR_EXACT_W1: Poland, $4/day, Search Results, Manage Bids, Search Match Off, New users, PAUSED

## Keyword Counts

- TIVZ_UA_SR_EXACT_W1: 159 active exact keywords (UA_CORE_EXACT: 39, UA_PROFESSIONS_EXACT: 35, RU_CORE_EXACT: 39, RU_PROFESSIONS_EXACT: 35, BRAND_EXACT: 11)
- TIVZ_KZ_SR_EXACT_W1: 85 active exact keywords (RU_CORE_EXACT: 39, RU_PROFESSIONS_EXACT: 35, BRAND_EXACT: 11)
- TIVZ_PL_SR_EXACT_W1: 85 active exact keywords (PL_CORE_EXACT: 40, PL_PROFESSIONS_EXACT: 34, BRAND_EXACT: 11)

- Total active exact keyword rows: 329
- Paused Wave 2 Czech keyword rows: 28
- Paused Wave 2 Mexico keyword rows: 33
- Paused competitor keyword rows: 16

## Negative Keyword Counts

- Global campaign-level negatives: 35 per active campaign; 105 total rows in negative_keywords_global.csv
- Ukraine campaign-level negatives: 111
- Kazakhstan campaign-level negatives: 56
- Poland campaign-level negatives: 54
- Wave 2 ES negatives prepared in generator data only: 38

## Validation Checks

- PASS: Total active daily budget <= $14.00. $14.00 active daily budget.
- PASS: Active countries only Ukraine, Kazakhstan, Poland. Ukraine, Kazakhstan, Poland.
- PASS: All active target keywords are EXACT. All keyword CSV rows use Match Type EXACT.
- PASS: Search Match is Off for active campaigns. Documented Off in campaign summary and checklist.
- PASS: No broad target keywords in active campaigns. Broad appears only in negative keywords where intentionally marked.
- PASS: Discovery campaigns only PAUSED. No Discovery campaign generated for W1.
- PASS: Competitor campaigns only PAUSED. paused_competitors_keywords.csv status is PAUSED.
- PASS: No duplicates inside one ad group. No duplicates found.
- PASS: Target keyword is not also negative in the same campaign. No target/negative conflicts found.
- PASS: Russia absent. Russia is not present in active or paused campaign CSV.
- PASS: US/UK/Canada/Germany/France/Spain/Mexico/Czech not active in W1. Czech Republic and Mexico are paused Wave 2 only; others not generated.
- PASS: All generated CSV files are UTF-8. Files written with Node fs.writeFileSync(..., 'utf8').
- PASS: All active campaigns have end date +7 days. Use Launch date + 7 days; if launched 2026-06-02, use 2026-06-09.
- PASS: All active campaigns initially PAUSED until human confirmation. Initial Status PAUSED in active_campaigns_summary.csv.

## Notes

- Campaign ID and Ad Group ID are intentionally blank in keyword and negative keyword CSV files because campaigns/ad groups must be created manually or through approved Apple Ads API access first.
- Apple Ads officially supports bulk upload up to 5000 keyword rows at a time and says CSV files with non-ASCII characters should be saved as UTF-8.
- Apple Ads also supports bulk upload up to 5000 negative keywords in each ad group. These files keep negative keywords at campaign level unless you decide to split by ad group after campaign creation.
- Russia is excluded because Apple Support says new purchases, in-app purchases, and subscription renewals in Russia are unavailable unless the user already has Apple Account balance.
