# Apple Ads Optimization Rules

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

## Daily Review

Review performance every day, but do not make hard conclusions in the first 24 hours unless there is obvious waste.

Main metric: cost per first_booking_created and cost per trial_started. CPI is secondary.

## After 48 Hours

1. If a keyword has impressions but no taps, review relevance and either wait 24 hours or lower bid.
2. If a keyword has 10 taps and 0 installs, pause it.
3. If a keyword spends $3 and has 0 installs, pause it.
4. If a keyword has installs but 0 activation events after 5 installs, lower bid by 20% or pause.
5. If a keyword has install plus service_created or first_booking_created, raise bid 15-20%, but never above cap.
6. If a country gives only installs after 7 days and no service_created/client_created/first_booking_created, do not scale it.
7. If a country has expensive installs but trial/purchase events, keep it and optimize for quality.

## Country Rules

- Ukraine: keep if there is at least service_created, client_created, or first_booking_created.
- Kazakhstan: keep if CPI is lower than Ukraine or there is first_booking_created.
- Poland: keep if there is trial_started, subscription_purchased, or strong activation, even if CPI is higher.

## Week 2 Budget Reallocation

If a country has no quality events, pause that country and move budget to the best country or one Wave 2 test.

Examples:

- If Ukraine has first_booking_created, Kazakhstan has no quality event, and Poland has trial_started: pause Kazakhstan, set Ukraine to $7/day and Poland to $7/day, do not launch Wave 2 yet.
- If Ukraine is cheap but has no activation, and Poland is more expensive but has first_booking_created: lower Ukraine to $2/day or pause, raise Poland to $8-10/day, and consider Czech Republic or Mexico test with the remainder.

## Wave 2 Rules

Launch Czech Republic or Mexico only after W1 shows at least one of:

- service_created
- client_created
- first_booking_created
- trial_started
- subscription_purchased

Launch only one new country at a time.

## Competitor Rules

- Do not launch competitor keywords in W1.
- Launch only after activated installs from core/profession keywords.
- Daily competitor test budget max $2/day.
- If a competitor keyword spends $3 with 0 installs, pause it.
- If installs arrive but there is no service_created or first_booking_created, pause it.
