export type SiteLanguage = "ru" | "uk" | "en";

export const siteLanguages: SiteLanguage[] = ["ru", "uk", "en"];
export const defaultSiteLanguage: SiteLanguage = "ru";

export function isSiteLanguage(value: string | null | undefined): value is SiteLanguage {
  return value === "ru" || value === "uk" || value === "en";
}

export function getLocalizedPath(language: SiteLanguage, pathname = "/") {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\/+/, "");
  return `/${language}${normalized ? `/${normalized}` : ""}`;
}

export function switchLocalizedPath(pathname: string, language: SiteLanguage) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isSiteLanguage(segments[0])) {
    segments[0] = language;
    return `/${segments.join("/")}`;
  }

  return getLocalizedPath(language, pathname);
}

export function getLanguageFromPathname(pathname: string | null | undefined) {
  const firstSegment = pathname?.split("/").filter(Boolean)[0];
  return isSiteLanguage(firstSegment) ? firstSegment : null;
}
