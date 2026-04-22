"use client";

import { useEffect, useState } from "react";

export type SiteLanguage = "ru" | "uk" | "en";

export function isSiteLanguage(value: string | null | undefined): value is SiteLanguage {
  return value === "ru" || value === "uk" || value === "en";
}

function detectSiteLanguage(defaultLanguage: SiteLanguage) {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  const storedLanguage = window.localStorage.getItem("rezervo-pro-language");
  if (isSiteLanguage(storedLanguage)) {
    return storedLanguage;
  }

  const candidates = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (candidates.some((value) => value.startsWith("uk") || value.includes("-ua"))) {
    return "uk";
  }

  if (candidates.some((value) => value.startsWith("en"))) {
    return "en";
  }

  return defaultLanguage;
}

export function useSiteLanguage(defaultLanguage: SiteLanguage = "ru") {
  const [language, setLanguage] = useState<SiteLanguage>(defaultLanguage);

  useEffect(() => {
    const nextLanguage = detectSiteLanguage(defaultLanguage);
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;

    const handleLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<SiteLanguage>).detail;
      if (isSiteLanguage(next)) {
        setLanguage(next);
        document.documentElement.lang = next;
      }
    };

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, [defaultLanguage]);

  return language;
}
