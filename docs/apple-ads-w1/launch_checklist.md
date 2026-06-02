# Apple Ads Launch Checklist

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

## Before Creating Campaigns

- [ ] Confirm no Apple ID, password, 2FA, payment, API private key, client secret, or token is stored in this repository.
- [ ] Confirm app: Timviz Master, App Store app id 6771003105.
- [ ] Confirm only Search Results placement is used.
- [ ] Confirm Russia is not included.
- [ ] Confirm W1 active countries are only Ukraine, Kazakhstan, and Poland.

## Campaign Settings

- [ ] TIVZ_UA_SR_EXACT_W1 exists and is PAUSED.
- [ ] TIVZ_KZ_SR_EXACT_W1 exists and is PAUSED.
- [ ] TIVZ_PL_SR_EXACT_W1 exists and is PAUSED.
- [ ] Daily budgets are $6, $4, and $4 respectively.
- [ ] Total active daily budget is $14/day or less.
- [ ] End date is launch date + 7 days. If launch is 2026-06-02, end date is 2026-06-09.
- [ ] Bid strategy is Manage Bids.
- [ ] Search Match is Off.
- [ ] Customer type is New users.
- [ ] Age and gender are unrestricted.
- [ ] Devices are unrestricted across compatible devices.
- [ ] Maximize Conversions is not enabled.

## Keyword Upload

- [ ] CSV files are UTF-8.
- [ ] Campaign ID and Ad Group ID are filled after manual campaign/ad group creation.
- [ ] keywords_ua.csv uploaded to the Ukraine campaign.
- [ ] keywords_kz.csv uploaded to the Kazakhstan campaign.
- [ ] keywords_pl.csv uploaded to the Poland campaign.
- [ ] Every active keyword row uses Match Type EXACT.
- [ ] No active broad target keyword exists.
- [ ] No keyword upload has more than 5000 rows.

## Negative Keyword Upload

- [ ] negative_keywords_global.csv uploaded at campaign level for all active W1 campaigns.
- [ ] negative_keywords_ua.csv uploaded at campaign level for Ukraine.
- [ ] negative_keywords_kz.csv uploaded at campaign level for Kazakhstan.
- [ ] negative_keywords_pl.csv uploaded at campaign level for Poland.
- [ ] Negative keyword upload row count is under 5000 per campaign/ad group upload.

## Do Not Launch

- [ ] Czech Republic is not active in W1.
- [ ] Mexico is not active in W1.
- [ ] Competitor keyword campaign/ad group is not active in W1.
- [ ] US, UK, Canada, Germany, France, Spain, and Russia are not active.
- [ ] Today Tab, Search Tab, and Product Pages campaigns are not active.
- [ ] Final human approval received.
