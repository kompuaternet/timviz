"use client";

import { useEffect, useState } from "react";
import { isSiteLanguage, type SiteLanguage } from "../lib/site-language";

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

export function useSiteLanguage(defaultLanguage: SiteLanguage = "ru", lockToDefault = false) {
  const [language, setLanguage] = useState<SiteLanguage>(defaultLanguage);

  useEffect(() => {
    const nextLanguage = lockToDefault ? defaultLanguage : detectSiteLanguage(defaultLanguage);
    setLanguage(nextLanguage);
    window.localStorage.setItem("rezervo-pro-language", nextLanguage);
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
