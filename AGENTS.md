# Codex Working Protocol

This file is mandatory project guidance for Codex work in Timviz.

## Before Starting Any Task

1. Check the current branch.
2. Check `git status --short --branch`.
3. Quickly inspect the files related to the task before editing.
4. If the task touches UI, mobile layout, i18n, booking, catalog, company pages, or global CSS, identify the matching quality command before making changes.

## After Making Changes

1. Run `npm run typecheck`.
2. Run `npm run test:i18n`.
3. Run the Playwright tests related to the changed area.
4. Run `npm run build` before a final push or when routing, Next config, Sentry, SEO, or server/client boundaries changed.
5. If mobile layout changed, run mobile and overflow tests.
6. If booking changed, run booking-flow and booking-footer tests.
7. If language, header, or mobile menu changed, run localization and mobile-header tests.
8. If tests fail, read the failing test, screenshot, trace, console logs, or HTML report, fix the root cause, and run the failed test again.
9. Do not push while critical checks are red.
10. In the final response always say what changed, which tests ran, which tests passed, and what could not run if anything was skipped.

## Forbidden

- Do not push without running the relevant checks.
- Do not ignore failing tests.
- Do not leave `undefined`, `null`, `NaN`, `[object Object]`, or raw i18n keys visible on pages.
- Do not leave horizontal overflow on mobile.
- Do not leave a duplicate visible LanguageSwitcher.
- Do not break desktop behavior while fixing mobile.
- Do not add new UI text in only one language.

## Test Selection

If the task touches header, language switching, or mobile menu:

```bash
npm run quality:ui
```

If the task touches booking:

```bash
npm run quality:booking
```

If the task touches the company page:

```bash
npm run test:e2e:company
npm run test:e2e:booking
```

If the task touches catalog, search, or map:

```bash
npm run test:e2e:catalog
npm run test:e2e:mobile
```

If the task touches translations or i18n:

```bash
npm run test:i18n
npm run test:e2e:localization
```

If the task touches global CSS or layout:

```bash
npm run quality:ui
npm run test:e2e
```

Before final push:

```bash
npm run quality
```

If full quality cannot run, run the closest relevant checks and state the reason clearly.

## When Playwright Fails

1. Inspect the failing test name and error output.
2. Open the screenshot, video, trace, or report when available.
3. Use `npx playwright show-report` if the HTML report is available.
4. Fix the root cause, not only the assertion.
5. Re-run the failed test first.
6. Re-run the related quality command.
7. Do not push while the same test is still failing.

## Required Commands

```bash
npm run quality:fast
npm run quality:ui
npm run quality:booking
npm run quality
npm run test:e2e:ui
npx playwright show-report
```
