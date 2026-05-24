import { expect, test } from "@playwright/test";
import { catalogPath, companyPath, localizedPath, openAndSettle, setupPageGuards } from "./helpers/site";

test.describe("important links", () => {
  test("header, menu, footer and booking links are not broken", async ({ page, request }) => {
    test.setTimeout(120_000);
    const guards = setupPageGuards(page);
    const pages = [localizedPath("ru"), catalogPath("ru"), companyPath("ru"), localizedPath("ru", "/for-business")];
    const hrefs = new Set<string>();
    const badInternalHrefs: string[] = [];

    for (const path of pages) {
      await openAndSettle(page, path);
      const pageHrefs = await page.locator("a[href]").evaluateAll((links) =>
        links
          .map((link) => link.getAttribute("href") || "")
          .filter((href) => href && !href.startsWith("mailto:") && !href.startsWith("tel:"))
      );
      pageHrefs.forEach((href) => hrefs.add(href));
      badInternalHrefs.push(
        ...(await page.evaluate(() =>
          Array.from(document.querySelectorAll("a[href='#'], a[href^='javascript:']"))
            .filter((link) => !link.classList.contains("leaflet-control-zoom-in") && !link.classList.contains("leaflet-control-zoom-out"))
            .map((link) => link.outerHTML.slice(0, 160))
        ))
      );
      await guards.assertCleanPage();
    }

    expect(badInternalHrefs).toEqual([]);

    for (const href of Array.from(hrefs).slice(0, 50)) {
      if (href.startsWith("#")) continue;
      const url = href.startsWith("http") ? href : new URL(href, page.url()).toString();
      if (!url.startsWith(new URL(page.url()).origin)) continue;
      const response = await request.get(url, { timeout: 10_000 });
      expect(response.status(), `${url} returned ${response.status()}`).toBeLessThan(400);
    }
  });
});
