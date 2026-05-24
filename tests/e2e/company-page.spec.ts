import { expect, test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers/layout";
import { companyPath, openAndSettle, setupPageGuards } from "./helpers/site";

test.describe("company page", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("renders hero, services, specialists and company info without mobile layout breaks", async ({ page }) => {
    const guards = setupPageGuards(page);
    await openAndSettle(page, companyPath("ru"));

    await expect(page.locator(".company-hero")).toBeVisible();
    await expect(page.locator(".company-hero h1")).toBeVisible();
    await expect(page.locator(".company-work-status")).toBeVisible();
    await expect(page.locator(".company-hero-address")).toBeVisible();

    const addressMetrics = await page.locator(".company-hero-address").evaluate((element) => {
      const style = getComputedStyle(element);
      const lineHeight = Number.parseFloat(style.lineHeight);
      return {
        height: element.getBoundingClientRect().height,
        lineClamp: style.webkitLineClamp,
        lines: Number.isFinite(lineHeight) ? element.getBoundingClientRect().height / lineHeight : null
      };
    });
    expect(addressMetrics.lineClamp).toBe("2");
    if (addressMetrics.lines !== null) {
      expect(addressMetrics.lines).toBeLessThanOrEqual(2.2);
    }

    await expect(page.locator("#services")).toBeVisible();
    await expect(page.locator(".company-category-tabs")).toBeVisible();
    await expect(page.locator(".company-service-card").first()).toBeVisible();
    await expect(page.locator(".company-book-button").first()).toBeVisible();

    const firstServiceCard = page.locator(".company-service-card").first();
    await expect(firstServiceCard).toBeInViewport();
    await expect(firstServiceCard.locator("span").first()).toBeVisible();

    await page.locator("#team").scrollIntoViewIfNeeded();
    await expect(page.locator("#team")).toBeVisible();
    await expect(page.locator(".company-team-card").first()).toBeVisible();

    await page.locator("#details").scrollIntoViewIfNeeded();
    await expect(page.locator("#details")).toBeVisible();
    await expect(page.locator(".company-info-card").first()).toBeVisible();

    await assertNoHorizontalOverflow(page);
    await guards.assertCleanPage();
  });
});
