import { expect, test } from "@playwright/test";
import { assertSingleLanguageSwitcher } from "./helpers/i18n";
import { assertElementFitsViewport, assertNoHorizontalOverflow } from "./helpers/layout";
import { companyPath, languages, mobileViewports, openAndSettle, setupPageGuards } from "./helpers/site";

test.describe("mobile header", () => {
  for (const viewport of mobileViewports) {
    for (const language of languages) {
      test(`${language} header fits ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const guards = setupPageGuards(page);
        await openAndSettle(page, companyPath(language));

        const header = page.locator("header.public-header").first();
        await expect(header).toBeVisible();
        await assertElementFitsViewport(page, "header.public-header");
        await expect(header.locator(".public-login-name:visible")).toHaveCount(0);
        await expect(header.locator(".public-menu:not(.public-entry-menu) > summary > span:first-child:visible")).toHaveCount(0);
        await assertSingleLanguageSwitcher(page);

        const authControl = header.locator(".public-entry-menu summary").first();
        await expect(authControl).toBeVisible();
        await expect(authControl).toHaveAttribute("aria-label", /.+/);

        const menuControl = header.locator("summary").first();
        await expect(menuControl).toBeVisible();
        await expect(menuControl).toHaveAttribute("aria-label", /.+/);

        await menuControl.click();
        await expect(page.locator(".public-menu-panel").first()).toBeVisible();
        await assertElementFitsViewport(page, ".public-menu-panel");
        await page.keyboard.press("Escape");

        await page.locator(".global-language-trigger").click();
        await expect(page.locator(".global-language-menu")).toBeVisible();
        await assertElementFitsViewport(page, ".global-language-menu");

        await assertNoHorizontalOverflow(page);
        await guards.assertCleanPage();
      });
    }
  }
});
