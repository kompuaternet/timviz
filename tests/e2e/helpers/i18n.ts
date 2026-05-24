import { expect, type Page } from "@playwright/test";

const leakedTextPattern = /\b(undefined|null|NaN)\b|\[object Object\]|\b(?:header|booking|common|account|company|catalog|public|pro|settings)\.[a-zA-Z0-9_.-]+/;
const languageShortLabels: Record<string, string> = {
  ru: "RU",
  uk: "UA",
  en: "EN",
  fr: "FR",
  pl: "PL",
  cs: "CS",
  es: "ES",
  de: "DE"
};

export async function assertNoLeakedTranslations(page: Page) {
  const leak = await page.evaluate((patternSource) => {
    const pattern = new RegExp(patternSource);
    const text = document.body.innerText.replace(/\s+/g, " ");
    const match = text.match(pattern);
    return match ? { match: match[0], sample: text.slice(Math.max(0, match.index! - 80), match.index! + 120) } : null;
  }, leakedTextPattern.source);

  expect(leak, `Leaked translation/key text found: ${JSON.stringify(leak, null, 2)}`).toBeNull();
}

export async function assertButtonsHaveAccessibleNames(page: Page) {
  const unnamedButtons = await page.evaluate(() => {
    const controls = Array.from(document.querySelectorAll("button, [role='button'], summary"));
    const unnamedControls = controls
      .map((element) => {
        const text = (element.textContent || "").replace(/\s+/g, " ").trim();
        const label = element.getAttribute("aria-label") || element.getAttribute("title") || "";
        const rawAriaLabel = element.getAttribute("aria-label");
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          text,
          label,
          rawAriaLabel,
          visible: rect.width > 0 && rect.height > 0
        };
      })
      .filter((item) => item.visible && (!item.text && !item.label || item.rawAriaLabel === ""))
      .slice(0, 20);

    const emptyAriaLabels = Array.from(document.querySelectorAll("[aria-label='']"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          visible: rect.width > 0 && rect.height > 0
        };
      })
      .filter((item) => item.visible)
      .slice(0, 20);

    return [...unnamedControls, ...emptyAriaLabels];
  });

  expect(unnamedButtons, `Buttons without accessible names: ${JSON.stringify(unnamedButtons, null, 2)}`).toEqual([]);
}

export async function assertSingleLanguageSwitcher(page: Page) {
  const visibleTriggers = await page.locator(".global-language-trigger:visible").count();
  expect(visibleTriggers, "There must be exactly one visible LanguageSwitcher trigger").toBe(1);
}

export async function assertHtmlLang(page: Page, language: string) {
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(language);
}

export async function assertLanguageSwitcherContainsAllLanguages(page: Page, languages: readonly string[]) {
  const trigger = page.locator(".global-language-trigger:visible").first();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const menu = page.locator(".global-language-menu:visible").first();
  await expect(menu).toBeVisible();

  for (const language of languages) {
    const shortLabel = languageShortLabels[language] ?? language.toUpperCase();
    await expect(menu.locator("button").filter({ hasText: shortLabel }).first(), `Language option ${language}`).toBeVisible();
  }

  const activeOptions = await menu.locator(".global-language-option-active").count();
  expect(activeOptions, "Exactly one active language option should be highlighted").toBe(1);

  await trigger.click();
}

export async function assertLanguagePersisted(page: Page, language: string) {
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem("rezervo-pro-language"))).toBe(language);
}
