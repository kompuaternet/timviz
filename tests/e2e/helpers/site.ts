import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { siteLanguages, type SiteLanguage } from "../../../lib/site-language";
import { getNicheSlug } from "../../../lib/niche-pages";
import { createConsoleErrorTracker } from "./console";
import { assertButtonsHaveAccessibleNames, assertNoLeakedTranslations } from "./i18n";
import { assertNoHorizontalOverflow } from "./layout";
import { createNetworkTracker } from "./network";

export const languages = siteLanguages;
export type TestLanguage = SiteLanguage;

export const mobileViewports = [
  { width: 360, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 }
];

export function localizedPath(language: SiteLanguage, pathname = "/") {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\/+/, "");
  return `/${language}${normalized ? `/${normalized}` : ""}`;
}

export function companyPath(language: SiteLanguage) {
  return localizedPath(language, "/businesses/google-runo");
}

export function catalogPath(language: SiteLanguage) {
  return localizedPath(language, "/catalog");
}

export function accountPath(language: SiteLanguage) {
  return localizedPath(language, "/account");
}

export function successPath(language: SiteLanguage, bookingId = "RZV-RQ8RXI") {
  return `/booking-success/${bookingId}?back=${encodeURIComponent(companyPath(language))}&pending=1`;
}

export function nichePath(language: SiteLanguage, key: Parameters<typeof getNicheSlug>[1]) {
  return localizedPath(language, `/${getNicheSlug(language, key)}`);
}

export function setupPageGuards(page: Page) {
  const consoleTracker = createConsoleErrorTracker(page);
  const networkTracker = createNetworkTracker(page);

  return {
    async assertCleanPage() {
      await assertNoHorizontalOverflow(page);
      await assertNoLeakedTranslations(page);
      await assertButtonsHaveAccessibleNames(page);
      await consoleTracker.assertNoConsoleErrors();
      await networkTracker.assertNoUnexpectedNetworkFailures();
    }
  };
}

export async function openAndSettle(page: Page, path: string) {
  await page.evaluate(() => window.stop()).catch(() => undefined);
  await page.waitForTimeout(50);
  await page.goto(path, { waitUntil: "domcontentloaded" }).catch(async (error) => {
    if (!String(error).includes("interrupted by another navigation")) {
      throw error;
    }
    await page.waitForTimeout(250);
    await page.goto(path, { waitUntil: "domcontentloaded" });
  });
  await page.waitForLoadState("networkidle").catch(() => undefined);
}

export async function expectVisibleLocator(page: Page, selector: string, label: string) {
  await expect(page.locator(selector).first(), label).toBeVisible();
}

export async function firstVisible(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) return locator;
  }
  throw new Error(`None of the selectors are visible: ${selectors.join(", ")}`);
}
