import { expect, type Page } from "@playwright/test";

type OverflowElement = {
  tagName: string;
  id: string;
  className: string;
  text: string;
  rect: { left: number; right: number; width: number };
  computedWidth: string;
};

export async function findOverflowingElements(page: Page) {
  return page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const offenders = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          tagName: element.tagName.toLowerCase(),
          id: element.id,
          className:
            typeof element.className === "string"
              ? element.className
              : String((element as HTMLElement).className || ""),
          text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
          rect: { left: rect.left, right: rect.right, width: rect.width },
          computedWidth: style.width
        };
      })
      .filter((item) => item.rect.right > window.innerWidth + 1 || item.rect.left < -1)
      .slice(0, 25) as OverflowElement[];

    return {
      clientWidth,
      scrollWidth,
      hasOverflow: scrollWidth > clientWidth + 1,
      offenders
    };
  });
}

export async function assertNoHorizontalOverflow(page: Page) {
  const result = await findOverflowingElements(page);

  expect(result, `Horizontal overflow: ${JSON.stringify(result, null, 2)}`).toMatchObject({
    hasOverflow: false
  });
}

export async function assertElementFitsViewport(page: Page, selector: string) {
  const result = await page.locator(selector).first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewport: window.innerWidth,
      fits: rect.left >= -1 && rect.right <= window.innerWidth + 1
    };
  });

  expect(result, `${selector} does not fit viewport`).toMatchObject({ fits: true });
}
