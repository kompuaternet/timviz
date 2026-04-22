"use client";

import { useEffect, useState } from "react";
import type { ProLanguage } from "../i18n";
import styles from "../pro.module.css";

const visualCopy = {
  ru: {
    title: "График, клиенты и услуги сразу под рукой",
    text: "Владелец видит записи, свободные слоты и загрузку дня в одном рабочем экране."
  },
  uk: {
    title: "Графік, клієнти й послуги завжди під рукою",
    text: "Власник бачить записи, вільні слоти й завантаження дня в одному робочому екрані."
  },
  en: {
    title: "Schedule, clients and services in one place",
    text: "Business owners see bookings, free slots and daily workload in one workspace."
  }
} satisfies Record<ProLanguage, { title: string; text: string }>;

function getSavedLanguage(): ProLanguage {
  if (typeof window === "undefined") return "ru";

  const savedLanguage = window.localStorage.getItem("rezervo-pro-language");
  if (savedLanguage === "uk" || savedLanguage === "en" || savedLanguage === "ru") {
    return savedLanguage;
  }

  const browserLanguages = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (browserLanguages.some((value) => value.startsWith("uk") || value.includes("-ua"))) return "uk";
  if (browserLanguages.some((value) => value.startsWith("en"))) return "en";
  return "ru";
}

export default function CreateAccountVisual() {
  const [language, setLanguage] = useState<ProLanguage>("ru");
  const copy = visualCopy[language];

  useEffect(() => {
    setLanguage(getSavedLanguage());

    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<ProLanguage>).detail;
      if (nextLanguage === "ru" || nextLanguage === "uk" || nextLanguage === "en") {
        setLanguage(nextLanguage);
      }
    };

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, []);

  return (
    <div className={styles.createVisualContent} aria-hidden="true">
      <div className={styles.createVisualBadge}>
        <img
          src="/brand/timviz-logo-web.png"
          alt="Timviz"
          width={800}
          height={385}
          className={styles.createVisualBadgeLogoImage}
        />
        <span>Business</span>
      </div>
      <div className={styles.createVisualPhotoCard}>
        <div className={styles.createPerson}>
          <span className={styles.createPersonHair} />
          <span className={styles.createPersonFace} />
          <span className={styles.createPersonBody} />
        </div>
        <div className={styles.createLaptop}>
          <div className={styles.createLaptopTop}>
            <span />
            <span />
            <span />
          </div>
          <img src="/for-business/ru-day.png" alt="" />
        </div>
      </div>
      <div className={styles.createVisualText}>
        <strong>{copy.title}</strong>
        <span>{copy.text}</span>
      </div>
    </div>
  );
}
