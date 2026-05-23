import { headers } from "next/headers";
import { isSiteLanguage, siteLanguages, type SiteLanguage } from "./site-language";

export async function getRequestLanguage(defaultLanguage: SiteLanguage = "ru"): Promise<SiteLanguage> {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language")?.toLowerCase() ?? "";

  const requestedLanguages = acceptLanguage
    .split(",")
    .map((item) => item.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const requestedLanguage of requestedLanguages) {
    const exact = requestedLanguage.split("-")[0];
    if (isSiteLanguage(exact)) return exact;
    const matched = siteLanguages.find((language) => requestedLanguage.startsWith(language));
    if (matched) return matched;
  }

  return defaultLanguage;
}
