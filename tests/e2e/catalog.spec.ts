import { expect, test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers/layout";
import { catalogPath, openAndSettle, setupPageGuards } from "./helpers/site";

test.describe("catalog", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("search, filters, map preview and company cards work on mobile", async ({ context, page }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 50.4501, longitude: 30.5234 });
    const guards = setupPageGuards(page);

    await openAndSettle(page, catalogPath("ru"));
    await expect(page.locator(".catalog-hero")).toBeVisible();
    await expect(page.locator(".catalog-results-toolbar")).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.locator(".public-search-time").click();
    await expect(page.locator(".public-time-panel")).toBeVisible();
    await page.locator(".public-search-time").click();
    await expect(page.locator(".public-time-panel")).toBeHidden();

    await page.locator(".public-search input").first().fill("маникюр");
    await page.locator(".public-search button[type='submit']").click();
    await page.waitForLoadState("networkidle").catch(() => undefined);
    const cards = page.locator(".catalog-result-card");
    await expect
      .poll(() => cards.count(), { timeout: 20_000, message: "catalog search should render company cards" })
      .toBeGreaterThan(0);

    await expect(cards.first()).toBeVisible();
    await expect(cards.first().locator(".company-name")).toBeVisible();
    await expect(cards.first().locator(".catalog-card-image")).toBeVisible();
    await expect(cards.first().locator(".catalog-result-actions a").first()).toBeVisible();

    const addressLineHeight = await cards.first().locator(".address").evaluate((element) => {
      const style = getComputedStyle(element);
      const lineHeight = Number.parseFloat(style.lineHeight);
      return {
        height: element.getBoundingClientRect().height,
        maxExpected: Number.isFinite(lineHeight) ? lineHeight * 2.5 : 60
      };
    });
    expect(addressLineHeight.height).toBeLessThanOrEqual(addressLineHeight.maxExpected);

    const moreButton = cards.first().locator(".catalog-result-more-button");
    if (await moreButton.isVisible().catch(() => false)) {
      await moreButton.click();
      await expect(cards.first().locator(".catalog-result-services")).toBeVisible();
    }

    if (await page.locator(".catalog-map-full").isVisible().catch(() => false)) {
      await expect(page.locator(".catalog-map-full")).toBeVisible();
      const listButton = page.locator(".catalog-map-list-button");
      if (await listButton.isVisible().catch(() => false)) {
        await listButton.click();
        await expect(page.locator("#catalog-results")).toBeInViewport();
      }
    }

    await guards.assertCleanPage();
  });
});
