"use client";

import { useEffect, useRef, useState } from "react";
import { isProLanguage, languageLabels, proLanguageOptions, proText, type ProLanguage } from "./i18n";
import styles from "./pro.module.css";

export default function LanguageSwitcher() {
  const [activeLanguage, setActiveLanguage] = useState<ProLanguage>("ru");
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let storedLanguage: string | null = null;
    try {
      storedLanguage =
        typeof window.localStorage?.getItem === "function"
          ? window.localStorage.getItem("rezervo-pro-language")
          : null;
    } catch {
      storedLanguage = null;
    }
    const nextLanguage = isProLanguage(storedLanguage) ? storedLanguage : "ru";
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

  const active = proLanguageOptions.find((language) => language.code === activeLanguage) ?? proLanguageOptions[0];
  const t = proText[activeLanguage];

  async function changeLanguage(language: ProLanguage) {
    setActiveLanguage(language);
    setIsOpen(false);
    try {
      if (typeof window.localStorage?.setItem === "function") {
        window.localStorage.setItem("rezervo-pro-language", language);
      }
    } catch {
      // Local switch should keep working even when storage is unavailable.
    }
    document.documentElement.lang = language;
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: language }));

    try {
      await fetch("/api/pro/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional: {
            language: languageLabels[language]
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
        {proLanguageOptions.map((language) => (
          <button
            key={language.code}
            type="button"
            className={activeLanguage === language.code ? styles.languageOptionActive : ""}
            onClick={() => void changeLanguage(language.code)}
            title={language.fullLabel}
          >
            <span>{language.flag}</span>
            {language.label}
          </button>
        ))}
      </div>
    </div>
  );
}
