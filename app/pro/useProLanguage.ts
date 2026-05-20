"use client";

import { useEffect, useState } from "react";
import { isProLanguage, proText, type ProLanguage } from "./i18n";

function getStoredProLanguage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return typeof window.localStorage?.getItem === "function"
      ? window.localStorage.getItem("rezervo-pro-language")
      : null;
  } catch {
    return null;
  }
}

export function useProLanguage(defaultLanguage: ProLanguage = "ru") {
  const [language, setLanguage] = useState<ProLanguage>(defaultLanguage);

  useEffect(() => {
    const storedLanguage = getStoredProLanguage();
    const nextLanguage = isProLanguage(storedLanguage) ? storedLanguage : defaultLanguage;
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;

    const handleLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<ProLanguage>).detail;
      if (isProLanguage(next)) {
        setLanguage(next);
        document.documentElement.lang = next;
      }
    };

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, [defaultLanguage]);

  return {
    language,
    t: proText[language]
  };
}
