import { headers } from "next/headers";
import { type SiteLanguage } from "./site-language";

export async function getRequestLanguage(defaultLanguage: SiteLanguage = "ru"): Promise<SiteLanguage> {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language")?.toLowerCase() ?? "";

  if (acceptLanguage.includes("uk")) {
    return "uk";
  }

  if (acceptLanguage.includes("en")) {
    return "en";
  }

  return defaultLanguage;
}
