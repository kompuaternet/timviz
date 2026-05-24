# Timviz localization review

Date: 2026-05-24

## Languages found

The project languages are detected from `lib/site-language.ts`:

- `ru` Russian
- `uk` Ukrainian
- `en` English
- `fr` French
- `pl` Polish
- `cs` Czech
- `es` Spanish
- `de` German

## Files reviewed

- `lib/site-language.ts`
- `scripts/check-i18n.mjs`
- `app/PublicHeaderAuthMenu.tsx`
- `app/PublicHome.tsx`
- `app/catalog/CatalogView.tsx`
- `app/businesses/[id]/BusinessView.tsx`
- `app/booking-success/[id]/BookingSuccessView.tsx`
- `app/account/CustomerAccountView.tsx`
- `app/[lang]/account/page.tsx`
- `lib/public-search.ts`
- `lib/seo.ts`

## Interface zones reviewed

- Public header and account menu
- Homepage hero, counters, review snippets, and business CTA copy
- Catalog search, result cards, online appointment status, and map/list labels
- Company page hero, service CTA, booking sheet, specialist/time/confirmation steps
- Booking success page
- Customer account and account SEO
- Public SEO metadata for homepage, business page, catalog, and account creation

## Terms unified

- RU: client flow uses "запись" and "записаться" instead of "бронь/забронировать".
- UK: client flow uses "запис" and "записатися" instead of "бронювання/забронювати".
- EN: customer-facing flows use "appointment" where clarity matters, while "book now" remains for short CTA.
- FR: customer-facing flows use "rendez-vous/RDV" instead of generic "réservation".
- PL: customer-facing flows use "wizyta/zapisy/umów wizytę" instead of "rezerwacja".
- CS: customer-facing flows use "termín/objednání/objednat se" instead of "rezervace".
- ES: customer-facing flows use "cita/pedir cita" instead of "reserva/reservar".
- DE: customer-facing flows use "Termin/Termin buchen" instead of "Buchung/buchen".

## Translations improved

- Replaced hotel-like booking wording on the company page and booking flow.
- Replaced success-page "booking number/reservation number" wording with appointment/visit terms.
- Shortened catalog CTAs for mobile in French, Polish, Czech, Spanish, and German.
- Replaced customer-account "Actions/Reservations/Bookings" equivalents with natural appointment terms.
- Cleaned SEO titles/descriptions for public pages so they target appointment/service-booking intent.
- Improved English pro-account labels from "Master" to "Professional".

## Hardcoded text

No new hardcoded UI text was added. Existing inline translation maps were improved in place because that is the current project pattern.

## Fallbacks and warnings

`npm run test:i18n` reports no missing or invalid translations. It still reports warnings for maps that are intentionally built from English fallback helpers or patched with `Object.assign`. The biggest remaining native-review areas are long legal copy, Telegram bot copy, deep pro-dashboard copy, and niche landing-page long-form content.

## Native review recommended

Native review is recommended for:

- French, Polish, Czech, Spanish, and German legal text.
- SEO landing pages where exact search terminology may vary by country.
- Telegram bot operational messages for pro users.
- Deep pro-dashboard copy that can naturally use business terms like "booking software" but should stay consistent with the glossary.

## Tests

Checks run after this review:

- `git diff --check` passed.
- `npm run typecheck` passed.
- `npm run test:i18n` passed: 8 languages, 103 dictionaries, 20,457 leaf keys, 0 missing or invalid values.
- `npm run test:e2e:localization` initially exposed dev-server chunk reload noise; the failed tests passed on retry.
- `CI=1 npm run test:e2e:localization` passed: 57 tests.

Final result: no missing keys, no empty values, no exposed translation keys in localization smoke tests, no duplicate language switcher, and no horizontal overflow on checked mobile localization pages.
