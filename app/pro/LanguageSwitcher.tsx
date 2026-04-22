"use client";

import { useEffect, useRef, useState } from "react";
import { languageLabels, proText, type ProLanguage } from "./i18n";
import styles from "./pro.module.css";

const languages = [
  { code: "ru", label: "RU", flag: "🇷🇺" },
  { code: "uk", label: "UA", flag: "🇺🇦" },
  { code: "en", label: "EN", flag: "🇬🇧" }
] as const;

type LanguageCode = (typeof languages)[number]["code"];

function isLanguageCode(value: string | null): value is LanguageCode {
  return value === "ru" || value === "uk" || value === "en";
}

export default function LanguageSwitcher() {
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>("ru");
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("rezervo-pro-language");
    const nextLanguage = isLanguageCode(storedLanguage) ? storedLanguage : "ru";
    setActiveLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const active = languages.find((language) => language.code === activeLanguage) ?? languages[0];
  const t = proText[activeLanguage];

  async function changeLanguage(language: LanguageCode) {
    setActiveLanguage(language);
    setIsOpen(false);
    window.localStorage.setItem("rezervo-pro-language", language);
    document.documentElement.lang = language;
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: language }));

    try {
      await fetch("/api/pro/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional: {
            language: languageLabels[language as ProLanguage]
          }
        })
      });
    } catch {
      // Local switch should keep working even if the account is not authorized yet.
    }
  }

  return (
    <div className={`${styles.languageSwitcher} ${isOpen ? styles.languageSwitcherOpen : ""}`} ref={switcherRef}>
      <button
        type="button"
        className={styles.languageTrigger}
        aria-label={t.nav.chooseLanguage}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>{active.flag}</span>
      </button>
      <div className={styles.languageMenu}>
        {languages.map((language) => (
          <button
            key={language.code}
            type="button"
            className={activeLanguage === language.code ? styles.languageOptionActive : ""}
            onClick={() => void changeLanguage(language.code)}
          >
            <span>{language.flag}</span>
            {language.label}
          </button>
        ))}
      </div>
    </div>
  );
}
