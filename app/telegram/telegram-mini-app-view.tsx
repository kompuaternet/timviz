"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./telegram-mini-app-view.module.css";

type TelegramWebAppRuntime = {
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebAppRuntime;
    };
  }
}

const copyByLanguage = {
  ru: {
    title: "Timviz Mini App",
    subtitle: "Вход в приложение Timviz внутри Telegram.",
    openCatalog: "Каталог",
    openDashboard: "Войти в кабинет",
    openSettings: "Настройки бизнеса"
  },
  uk: {
    title: "Timviz Mini App",
    subtitle: "Вхід у застосунок Timviz всередині Telegram.",
    openCatalog: "Каталог",
    openDashboard: "Увійти в кабінет",
    openSettings: "Налаштування бізнесу"
  },
  en: {
    title: "Timviz Mini App",
    subtitle: "Enter Timviz app inside Telegram.",
    openCatalog: "Open catalog",
    openDashboard: "Sign in to dashboard",
    openSettings: "Business settings"
  }
} as const;

function normalizeLanguage(value: string | null) {
  const candidate = (value || "").trim().toLowerCase();
  if (candidate.startsWith("ru")) return "ru";
  if (candidate === "ua" || candidate.startsWith("uk")) return "uk";
  return "en";
}

function initializeTelegramWebApp() {
  if (typeof window === "undefined") {
    return;
  }

  const runtime = window.Telegram?.WebApp;
  if (!runtime) {
    return;
  }

  runtime.ready?.();
  runtime.expand?.();
  runtime.disableVerticalSwipes?.();
  runtime.setHeaderColor?.("#f3f3fb");
  runtime.setBackgroundColor?.("#f3f3fb");
}

function injectTelegramScript() {
  if (typeof window === "undefined") {
    return;
  }

  if (window.Telegram?.WebApp) {
    initializeTelegramWebApp();
    return;
  }

  const existing = document.querySelector<HTMLScriptElement>('script[data-telegram-webapp="true"]');
  if (existing) {
    existing.addEventListener("load", initializeTelegramWebApp, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = "https://telegram.org/js/telegram-web-app.js";
  script.async = true;
  script.dataset.telegramWebapp = "true";
  script.addEventListener("load", initializeTelegramWebApp, { once: true });
  document.head.appendChild(script);
}

type TelegramMiniAppViewProps = {
  initialLanguage?: string | null;
};

export default function TelegramMiniAppView({ initialLanguage }: TelegramMiniAppViewProps) {
  const language = normalizeLanguage(initialLanguage ?? null);
  const copy = copyByLanguage[language];

  useEffect(() => {
    injectTelegramScript();
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.badge}>Telegram Mini App</p>
        <h1>{copy.title}</h1>
        <p className={styles.subtitle}>{copy.subtitle}</p>
        <div className={styles.actions}>
          <Link href="/pro/login?source=telegram" className={styles.primaryButton}>
            {copy.openDashboard}
          </Link>
          <Link href="/catalog?source=telegram" className={styles.secondaryButton}>
            {copy.openCatalog}
          </Link>
          <Link href="/pro/settings?source=telegram&section=telegram" className={styles.secondaryButton}>
            {copy.openSettings}
          </Link>
        </div>
      </section>
    </main>
  );
}
