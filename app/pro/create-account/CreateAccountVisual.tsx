"use client";

import { useEffect, useState } from "react";
import { isProLanguage, type ProLanguage } from "../i18n";
import styles from "../pro.module.css";

const visualCopy = {
  ru: {
    badge: "Партнёры Timviz",
    title: "Запуская бизнес, вы сразу получаете запись, календарь и клиентов",
    text: "Рабочий кабинет открывается сразу после регистрации: бронирования, график и карточка компании уже собраны в одном месте.",
    metric: "Клиенты смогут записываться онлайн сразу после запуска кабинета.",
    calendarReady: "Календарь готов"
  },
  uk: {
    badge: "Партнери Timviz",
    title: "Запускаючи бізнес, ви одразу отримуєте запис, календар і клієнтів",
    text: "Робочий кабінет відкривається одразу після реєстрації: бронювання, графік і картка компанії вже зібрані в одному місці.",
    metric: "Клієнти можуть записуватися онлайн одразу після запуску кабінету.",
    calendarReady: "Календар готовий"
  },
  en: {
    badge: "Timviz partners",
    title: "Launch with bookings, calendar and clients from day one",
    text: "Your workspace opens right after signup, with bookings, schedule and company card already connected in one flow.",
    metric: "Clients can book online as soon as the workspace is live.",
    calendarReady: "Calendar ready"
  },
  fr: {
    badge: "Partenaires Timviz",
    title: "Lancez votre activité avec réservations, calendrier et clients dès le premier jour",
    text: "Votre cabinet s’ouvre juste après l’inscription, avec réservations, horaires et fiche d’entreprise déjà reliés.",
    metric: "Les clients peuvent réserver en ligne dès l’ouverture du cabinet.",
    calendarReady: "Calendrier prêt"
  },
  pl: {
    badge: "Partnerzy Timviz",
    title: "Startuj z rezerwacjami, kalendarzem i klientami od pierwszego dnia",
    text: "Panel otwiera się zaraz po rejestracji, a rezerwacje, grafik i karta firmy są już połączone.",
    metric: "Klienci mogą rezerwować online od razu po uruchomieniu panelu.",
    calendarReady: "Kalendarz gotowy"
  },
  cs: {
    badge: "Partneři Timviz",
    title: "Začněte s rezervacemi, kalendářem a klienty od prvního dne",
    text: "Kabinet se otevře hned po registraci, rezervace, rozvrh i profil firmy jsou propojené.",
    metric: "Klienti se mohou objednávat online hned po spuštění kabinetu.",
    calendarReady: "Kalendář připraven"
  },
  es: {
    badge: "Socios Timviz",
    title: "Empieza con reservas, calendario y clientes desde el primer día",
    text: "Tu panel se abre justo después del registro, con reservas, horario y ficha de empresa conectados.",
    metric: "Los clientes pueden reservar online en cuanto el panel esté activo.",
    calendarReady: "Calendario listo"
  },
  de: {
    badge: "Timviz Partner",
    title: "Starte vom ersten Tag an mit Buchungen, Kalender und Kunden",
    text: "Dein Arbeitsbereich öffnet sich direkt nach der Registrierung, mit Buchungen, Zeitplan und Unternehmensprofil verbunden.",
    metric: "Kunden können online buchen, sobald der Arbeitsbereich aktiv ist.",
    calendarReady: "Kalender bereit"
  }
} as const;

function getSavedLanguage(): ProLanguage {
  if (typeof window === "undefined") return "ru";

  let savedLanguage: string | null = null;
  try {
    savedLanguage =
      typeof window.localStorage?.getItem === "function"
        ? window.localStorage.getItem("rezervo-pro-language")
        : null;
  } catch {
    savedLanguage = null;
  }
  if (isProLanguage(savedLanguage)) {
    return savedLanguage;
  }

  const browserLanguages = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (browserLanguages.some((value) => value.startsWith("uk") || value.includes("-ua"))) return "uk";
  if (browserLanguages.some((value) => value.startsWith("fr"))) return "fr";
  if (browserLanguages.some((value) => value.startsWith("pl"))) return "pl";
  if (browserLanguages.some((value) => value.startsWith("cs") || value.startsWith("cz"))) return "cs";
  if (browserLanguages.some((value) => value.startsWith("es"))) return "es";
  if (browserLanguages.some((value) => value.startsWith("de"))) return "de";
  if (browserLanguages.some((value) => value.startsWith("en"))) return "en";
  return "ru";
}

export default function CreateAccountVisual() {
  const [language, setLanguage] = useState<ProLanguage>("ru");
  const copy = {
    ...visualCopy.en,
    ...((visualCopy as unknown as Record<string, Partial<typeof visualCopy.en>>)[language] ?? {})
  } as typeof visualCopy.en;

  useEffect(() => {
    setLanguage(getSavedLanguage());

    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<ProLanguage>).detail;
      if (isProLanguage(nextLanguage)) {
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
          <span>{copy.metric}</span>
        </div>
        <div className={styles.createVisualMiniCard}>
          <div className={styles.createVisualMiniRow}>
            <span>{copy.calendarReady}</span>
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
