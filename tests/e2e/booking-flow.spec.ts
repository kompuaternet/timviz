import { expect, test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers/layout";
import { companyPath, openAndSettle, setupPageGuards } from "./helpers/site";

async function assertBookingStepClean(page: import("@playwright/test").Page) {
  await expect(page.locator(".company-booking-modal")).toBeVisible();
  await assertNoHorizontalOverflow(page);
  const footer = page.locator(".company-booking-modal-footer");
  if (await footer.isVisible().catch(() => false)) {
    await expect(footer).toBeVisible();
  } else {
    await expect(page.locator(".company-google-button, .submit-button").first()).toBeVisible();
  }
}

test.describe("booking flow", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("walks through services, specialist, time and confirmation", async ({ page }) => {
    const guards = setupPageGuards(page);
    await openAndSettle(page, companyPath("ru"));

    await page.locator(".company-book-button").first().click();
    await expect(page.locator(".company-booking-modal")).toBeVisible();
    await expect(page.locator(".company-booking-step h2")).toBeVisible();
    await expect(page.locator(".company-flow-card.active").first()).toBeVisible();
    await assertBookingStepClean(page);

    await page.locator(".company-modal-next").click();
    await expect(page.locator(".company-booking-step h2")).toContainText(/специалист|specialist|спеціаліст/i);
    await expect(page.locator(".company-flow-card").first()).toBeVisible();
    await expect(page.locator(".company-flow-card.active").first()).toBeVisible();
    await assertBookingStepClean(page);

    await page.locator(".company-modal-next").click();
    await expect(page.locator(".company-week-strip")).toBeVisible();
    await expect(page.locator(".company-slot-groups, .company-empty-hint").first()).toBeVisible();

    const firstSlot = page.locator(".company-slot-item").first();
    if (await firstSlot.isVisible().catch(() => false)) {
      await firstSlot.click();
      await expect(firstSlot).toHaveClass(/active/);
      await assertBookingStepClean(page);

      const timeCta = page.locator(".company-modal-next");
      await expect(timeCta).toBeVisible();
      await timeCta.click();
    } else {
      test.info().annotations.push({ type: "booking-slots", description: "No public slots available for the selected test business." });
      return;
    }

    await expect(page.locator(".company-booking-step h2")).toContainText(/подтверждение|confirmation|підтвердження/i);
    await expect(page.locator(".company-auth-card, .company-confirm-form").first()).toBeVisible();

    if (await page.locator(".company-confirm-form").isVisible().catch(() => false)) {
      await expect(page.locator(".salon-phone-input")).toBeVisible();
      await expect(page.locator(".company-comment-input")).toBeVisible();
      await expect(page.locator(".company-mobile-confirm-summary")).toBeVisible();
      await expect(page.locator(".submit-button")).toBeVisible();
    } else {
      await expect(page.locator(".company-google-button")).toBeVisible();
    }

    await assertBookingStepClean(page);
    await guards.assertCleanPage();
  });
});
