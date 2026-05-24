import { expect, test, type Page } from "@playwright/test";
import { assertElementFitsViewport, assertNoHorizontalOverflow } from "./helpers/layout";
import {
  accountPath,
  catalogPath,
  companyPath,
  languages,
  localizedPath,
  openAndSettle,
  setupPageGuards,
  successPath,
  testCompanySlug,
  type TestLanguage
} from "./helpers/site";
import {
  assertHtmlLang,
  assertLanguagePersisted,
  assertLanguageSwitcherContainsAllLanguages,
  assertSingleLanguageSwitcher
} from "./helpers/i18n";

const corePages = [
  { name: "home", path: (language: TestLanguage) => localizedPath(language) },
  { name: "catalog", path: catalogPath },
  { name: "company", path: companyPath },
  { name: "account", path: accountPath }
];

async function openMobileMenuIfPresent(page: Page) {
  const summary = page.locator(".public-menu summary:visible").first();
  if (!(await summary.isVisible().catch(() => false))) return;

  await summary.click();
  const panel = page.locator(".public-menu[open] .public-menu-panel:visible").first();
  await expect(panel).toBeVisible();
  await assertElementFitsViewport(page, ".public-menu[open] .public-menu-panel:visible");
  await expect(panel.locator("a, button").first()).toBeVisible();
  await summary.click();
}

async function setStoredLanguage(page: Page, language: TestLanguage) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("rezervo-pro-language", value);
  }, language);
}

async function openLanguageMenu(page: Page) {
  const trigger = page.locator(".global-language-trigger:visible").first();
  const menu = page.locator(".global-language-menu:visible").first();
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", /true|false/);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await menu.isVisible().catch(() => false)) return menu;
    await trigger.click();
    await expect
      .poll(() => trigger.getAttribute("aria-expanded"), { timeout: 1000 })
      .toBe("true")
      .catch(() => undefined);
    await page.waitForTimeout(150);
  }

  await expect(menu).toBeVisible();
  return menu;
}

test.describe("localization browser QA", () => {
  for (const language of languages) {
    test(`${language} core pages have localized UI, one switcher and no mobile overflow`, async ({ page }, testInfo) => {
      await setStoredLanguage(page, language);
      const guards = setupPageGuards(page);

      for (const item of corePages) {
        await test.step(`${language} ${item.name}`, async () => {
          await openAndSettle(page, item.path(language));
          await assertHtmlLang(page, language);
          await assertSingleLanguageSwitcher(page);
          await openMobileMenuIfPresent(page);
          await guards.assertCleanPage();
          testInfo.annotations.push({ type: "localized-page", description: `${language}:${item.name}` });
        });
      }
    });

    test(`${language} booking flow localization stays stable through key steps`, async ({ page }) => {
      await setStoredLanguage(page, language);
      const guards = setupPageGuards(page);
      await openAndSettle(page, companyPath(language));

      await page.locator(".company-book-button").first().click();
      await expect(page.locator(".company-booking-modal")).toBeVisible();
      await assertNoHorizontalOverflow(page);
      await guards.assertCleanPage();

      const next = page.locator(".company-modal-next");
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await expect(page.locator(".company-booking-modal")).toBeVisible();
        await assertNoHorizontalOverflow(page);
        await guards.assertCleanPage();
      }
    });
  }

  test("success page respects stored language when a local fixture booking is available", async ({ page }, testInfo) => {
    const language = "de" satisfies TestLanguage;
    await setStoredLanguage(page, language);
    const guards = setupPageGuards(page);
    const response = await page.goto(successPath(language), { waitUntil: "domcontentloaded" });

    if (response?.status() === 404) {
      testInfo.annotations.push({
        type: "success-page",
        description: "Skipped deep success-page localization because fixture booking was not available in this environment."
      });
      return;
    }

    await page.waitForLoadState("networkidle").catch(() => undefined);
    await assertHtmlLang(page, language);
    await guards.assertCleanPage();
  });

  test("LanguageSwitcher lists every language, changes localized URL and persists after reload", async ({ page }) => {
    await openAndSettle(page, companyPath("fr"));
    await assertSingleLanguageSwitcher(page);
    await assertLanguageSwitcherContainsAllLanguages(page, languages);

    for (const language of languages) {
      const menu = await openLanguageMenu(page);
      const shortLabel = language === "uk" ? "UA" : language.toUpperCase();
      const option = menu.locator("button").filter({ hasText: shortLabel }).first();
      await expect(option, `Language option ${language}`).toBeVisible();
      await option.click();
      await expect(page).toHaveURL(new RegExp(`/${language}/businesses/${testCompanySlug}`));
      await assertHtmlLang(page, language);
      await assertLanguagePersisted(page, language);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await assertHtmlLang(page, language);
      await assertLanguagePersisted(page, language);
    }
  });

  test("booking dialog does not render a second language switcher", async ({ page }) => {
    await openAndSettle(page, companyPath("ru"));
    await page.locator(".company-book-button").first().click();
    await expect(page.locator(".company-booking-modal")).toBeVisible();
    await assertSingleLanguageSwitcher(page);
  });
});
