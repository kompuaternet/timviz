import { expect, test } from "@playwright/test";
import { companyPath, openAndSettle, setupPageGuards } from "./helpers/site";

async function assertFooterDoesNotCoverLastContent(page: import("@playwright/test").Page) {
  const result = await page.evaluate(() => {
    const footer = document.querySelector(".company-booking-modal-footer")?.getBoundingClientRect();
    const step = document.querySelector(".company-booking-step")?.getBoundingClientRect();
    const lastElement = document.querySelector(".company-booking-step > :last-child")?.getBoundingClientRect();
    if (!footer || !step || !lastElement) return { ok: false, reason: "Required booking elements were not found." };
    return {
      ok: lastElement.bottom <= footer.top + 1 || step.bottom <= footer.top + footer.height + 140,
      footerTop: footer.top,
      lastBottom: lastElement.bottom,
      stepBottom: step.bottom,
      footerHeight: footer.height
    };
  });

  expect(result, `Sticky footer overlaps booking content: ${JSON.stringify(result, null, 2)}`).toMatchObject({ ok: true });
}

test.describe("booking sticky footer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("footer stays visible and does not block booking content", async ({ page }) => {
    const guards = setupPageGuards(page);
    await openAndSettle(page, companyPath("ru"));
    await page.locator(".company-book-button").first().click();

    for (let stepIndex = 0; stepIndex < 3; stepIndex += 1) {
      await expect(page.locator(".company-booking-modal-footer")).toBeVisible();
      await page.locator(".company-booking-flow").evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await assertFooterDoesNotCoverLastContent(page);

      if (stepIndex === 2) {
        const firstSlot = page.locator(".company-slot-item").first();
        if (await firstSlot.isVisible().catch(() => false)) {
          await firstSlot.click();
          await page.locator(".company-modal-next").click();
        }
        break;
      }

      await page.locator(".company-modal-next").click();
    }

    if (await page.locator(".company-confirm-form").isVisible().catch(() => false)) {
      await page.locator(".company-booking-flow").evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await assertFooterDoesNotCoverLastContent(page);
    }

    await guards.assertCleanPage();
  });
});
