"use client";

import { useEffect, useState } from "react";
import type { ProLanguage } from "../i18n";
import styles from "../pro.module.css";

const visualCopy = {
  ru: {
    badge: "Партнёры Timviz",
    title: "Запуская бизнес, вы сразу получаете запись, календарь и клиентов",
    text: "Рабочий кабинет открывается сразу после регистрации: бронирования, график и карточка компании уже собраны в одном месте."
  },
  uk: {
    badge: "Партнери Timviz",
    title: "Запускаючи бізнес, ви одразу отримуєте запис, календар і клієнтів",
    text: "Робочий кабінет відкривається одразу після реєстрації: бронювання, графік і картка компанії вже зібрані в одному місці."
  },
  en: {
    badge: "Timviz partners",
    title: "Launch with bookings, calendar and clients from day one",
    text: "Your workspace opens right after signup, with bookings, schedule and company card already connected in one flow."
  }
} satisfies Record<ProLanguage, { badge: string; title: string; text: string }>;

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
        <span>{copy.badge}</span>
      </div>
      <div className={styles.createVisualPhotoCard}>
        <div className={styles.createVisualPhotoGlow} />
        <div className={styles.createVisualFrame}>
          <div className={styles.createVisualFrameTop}>
            <span />
            <span />
            <span />
          </div>
          <img src="/for-business/ru-schedule-wide.png" alt="" className={styles.createVisualFrameImage} />
        </div>
        <div className={styles.createVisualMetricCard}>
          <strong>24/7</strong>
          <span>
            {language === "en"
              ? "Clients can book online as soon as the workspace is live."
              : language === "uk"
                ? "Клієнти можуть записуватися онлайн одразу після запуску кабінету."
                : "Клиенты смогут записываться онлайн сразу после запуска кабинета."}
          </span>
        </div>
        <div className={styles.createVisualMiniCard}>
          <div className={styles.createVisualMiniRow}>
            <span>
              {language === "en" ? "Calendar ready" : language === "uk" ? "Календар готовий" : "Календарь готов"}
            </span>
            <strong>09:00-18:00</strong>
          </div>
          <div className={styles.createVisualMiniDots}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      <div className={styles.createVisualText}>
        <strong>{copy.title}</strong>
        <span>{copy.text}</span>
      </div>
    </div>
  );
}
