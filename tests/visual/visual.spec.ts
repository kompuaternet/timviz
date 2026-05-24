import { expect, test } from "@playwright/test";
import { catalogPath, companyPath, localizedPath, openAndSettle } from "../e2e/helpers/site";
import { stabilizeVisuals } from "../e2e/helpers/visual";

test.describe("visual regression snapshots", () => {
  test.skip(!process.env.PLAYWRIGHT_VISUAL, "Set PLAYWRIGHT_VISUAL=1 to run visual snapshot comparisons.");

  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile header FR", async ({ page }) => {
    await openAndSettle(page, companyPath("fr"));
    await stabilizeVisuals(page);
    await expect(page.locator("header.public-header")).toHaveScreenshot("mobile-header-fr.png", { maxDiffPixels: 300 });
  });

  test("mobile header EN", async ({ page }) => {
    await openAndSettle(page, companyPath("en"));
    await stabilizeVisuals(page);
    await expect(page.locator("header.public-header")).toHaveScreenshot("mobile-header-en.png", { maxDiffPixels: 300 });
  });

  test("company page mobile", async ({ page }) => {
    await openAndSettle(page, companyPath("ru"));
    await stabilizeVisuals(page);
    await expect(page).toHaveScreenshot("company-page-mobile.png", { fullPage: true, maxDiffPixels: 300 });
  });

  test("catalog mobile", async ({ page }) => {
    await openAndSettle(page, catalogPath("ru"));
    await stabilizeVisuals(page);
    await expect(page).toHaveScreenshot("catalog-mobile.png", { fullPage: true, maxDiffPixels: 300 });
  });

  test("booking steps mobile", async ({ page }) => {
    await openAndSettle(page, companyPath("ru"));
    await stabilizeVisuals(page);
    await page.locator(".company-book-button").first().click();
    await expect(page).toHaveScreenshot("booking-services-mobile.png", { fullPage: true, maxDiffPixels: 300 });
    await page.locator(".company-modal-next").click();
    await expect(page).toHaveScreenshot("booking-specialist-mobile.png", { fullPage: true, maxDiffPixels: 300 });
    await page.locator(".company-modal-next").click();
    await expect(page).toHaveScreenshot("booking-time-mobile.png", { fullPage: true, maxDiffPixels: 300 });
    const slot = page.locator(".company-slot-item").first();
    if (await slot.isVisible().catch(() => false)) {
      await slot.click();
      await page.locator(".company-time-cta").click();
      await expect(page).toHaveScreenshot("booking-confirmation-mobile.png", { fullPage: true, maxDiffPixels: 300 });
    }
  });

  test("success page mobile when fixture id is provided", async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_BOOKING_SUCCESS_ID, "Provide PLAYWRIGHT_BOOKING_SUCCESS_ID for success page snapshots.");
    await openAndSettle(page, localizedPath("ru", `/booking-success/${process.env.PLAYWRIGHT_BOOKING_SUCCESS_ID}`));
    await stabilizeVisuals(page);
    await expect(page).toHaveScreenshot("booking-success-mobile.png", { fullPage: true, maxDiffPixels: 300 });
  });

  test("desktop booking modal", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openAndSettle(page, companyPath("ru"));
    await stabilizeVisuals(page);
    await page.locator(".company-book-button").first().click();
    await expect(page).toHaveScreenshot("desktop-booking-modal.png", { fullPage: true, maxDiffPixels: 300 });
  });
});
