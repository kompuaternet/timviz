import { expect, type Page } from "@playwright/test";

const ignoredNetworkPatterns = [
  /tile\.openstreetmap\.org/i,
  /unpkg\.com\/leaflet/i,
  /google-analytics|googletagmanager/i,
  /favicon/i
];

export function createNetworkTracker(page: Page) {
  const failures: string[] = [];

  page.on("response", (response) => {
    const url = response.url();
    const status = response.status();
    if (ignoredNetworkPatterns.some((pattern) => pattern.test(url))) return;

    if (status >= 500) {
      failures.push(`${status} ${url}`);
    }

    if (status === 404 && /\.(?:js|css|png|jpe?g|webp|svg|woff2?)($|\?)/i.test(url)) {
      failures.push(`Static 404 ${url}`);
    }
  });

  return {
    failures,
    async assertNoUnexpectedNetworkFailures() {
      expect(failures, `Unexpected network failures:\n${failures.join("\n")}`).toEqual([]);
    }
  };
}
