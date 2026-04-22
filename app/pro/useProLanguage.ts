"use client";

import { useEffect, useState } from "react";
import { isProLanguage, proText, type ProLanguage } from "./i18n";

export function useProLanguage(defaultLanguage: ProLanguage = "ru") {
  const [language, setLanguage] = useState<ProLanguage>(defaultLanguage);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("rezervo-pro-language");
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
