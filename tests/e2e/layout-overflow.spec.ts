import { test } from "@playwright/test";
import { assertNoHorizontalOverflow } from "./helpers/layout";
import { accountPath, catalogPath, companyPath, localizedPath, mobileViewports, openAndSettle, setupPageGuards } from "./helpers/site";

const pages = [
  { name: "home", path: localizedPath("ru") },
  { name: "catalog", path: catalogPath("ru") },
  { name: "company", path: companyPath("ru") },
  { name: "account", path: accountPath("ru") },
  { name: "business", path: localizedPath("ru", "/for-business") }
];

test.describe("layout overflow smoke", () => {
  for (const viewport of mobileViewports.filter((item) => [360, 390, 430].includes(item.width))) {
    for (const item of pages) {
      test(`${item.name} has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const guards = setupPageGuards(page);
        await openAndSettle(page, item.path);
        await assertNoHorizontalOverflow(page);
        await guards.assertCleanPage();
      });
    }
  }
});
