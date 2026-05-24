import { expect, type Page } from "@playwright/test";

const harmlessConsolePatterns = [
  /favicon/i,
  /ResizeObserver loop/i,
  /Failed to load resource:.*(tile|openstreetmap|leaflet)/i,
  /Failed to fetch RSC payload .*Falling back to browser navigation/i,
  /__nextjs_original-stack-frames.*access control checks/i,
  /_rsc=.*access control checks/i,
  /webpack\.hot-update\.json.*access control checks/i
];

export function createConsoleErrorTracker(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (harmlessConsolePatterns.some((pattern) => pattern.test(text))) return;
    errors.push(`[console.error] ${text}`);
  });

  page.on("pageerror", (error) => {
    const text = `${error.message}\n${error.stack ?? ""}`;
    if (harmlessConsolePatterns.some((pattern) => pattern.test(text))) return;
    errors.push(`[pageerror] ${text}`);
  });

  return {
    errors,
    async assertNoConsoleErrors() {
      expect(errors, `Browser console/page errors:\n${errors.join("\n\n")}`).toEqual([]);
    },
    async assertNoPageErrors() {
      const pageErrors = errors.filter((error) => error.startsWith("[pageerror]"));
      expect(pageErrors, `Browser page errors:\n${pageErrors.join("\n\n")}`).toEqual([]);
    }
  };
}

export function collectConsoleErrors(page: Page) {
  return createConsoleErrorTracker(page);
}

export function assertNoConsoleErrors(page: Page) {
  return createConsoleErrorTracker(page);
}
