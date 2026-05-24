import type { Page } from "@playwright/test";

export async function stabilizeVisuals(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0s !important;
        transition-duration: 0.001ms !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }

      .catalog-map-canvas,
      .leaflet-container,
      iframe,
      video {
        visibility: hidden !important;
      }

      img[src^="http"] {
        visibility: hidden !important;
      }
    `
  });
}
