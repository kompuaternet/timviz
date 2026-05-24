import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { catalogPath, companyPath, localizedPath, openAndSettle } from "./helpers/site";

async function expectNoCriticalA11yViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .disableRules([
      // Color contrast is tracked separately because brand gradients and external map tiles can create noisy first-pass reports.
      "color-contrast"
    ])
    .analyze();

  const serious = results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""));
  expect(
    serious,
    serious.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`).join("\n")
  ).toEqual([]);
}

test.describe("accessibility", () => {
  for (const path of [localizedPath("ru"), catalogPath("ru"), companyPath("ru"), localizedPath("ru", "/account")]) {
    test(`${path} has no critical axe violations`, async ({ page }) => {
      await openAndSettle(page, path);
      await expectNoCriticalA11yViolations(page);
    });
  }

  test("booking dialog exposes modal semantics and focus controls", async ({ page }) => {
    await openAndSettle(page, companyPath("ru"));
    await page.locator(".company-book-button").first().click();

    const dialog = page.locator(".company-booking-modal");
    await expect(dialog).toHaveAttribute("role", "dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog.locator(".company-modal-close")).toHaveAttribute("aria-label", /.+/);
    await expect(dialog.locator(".company-modal-back")).toHaveAttribute("aria-label", /.+/);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await expectNoCriticalA11yViolations(page);
  });
});
