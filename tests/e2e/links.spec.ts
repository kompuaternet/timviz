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

    const origin = new URL(page.url()).origin;
    const internalUrls = Array.from(hrefs)
      .slice(0, 50)
      .filter((href) => !href.startsWith("#"))
      .map((href) => (href.startsWith("http") ? href : new URL(href, page.url()).toString()))
      .filter((url) => url.startsWith(origin));

    for (let index = 0; index < internalUrls.length; index += 8) {
      const results = await Promise.all(
        internalUrls.slice(index, index + 8).map(async (url) => {
          const response = await request.get(url, { timeout: 30_000 });
          return { status: response.status(), url };
        })
      );

      for (const result of results) {
        expect(result.status, `${result.url} returned ${result.status}`).toBeLessThan(400);
      }
    }
  });
});
