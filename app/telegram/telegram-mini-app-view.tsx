"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./telegram-mini-app-view.module.css";

type TelegramWebAppRuntime = {
  ready?: () => void;
  expand?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
  initData?: string;
  initDataUnsafe?: {
    start_param?: string;
    user?: {
      language_code?: string;
    };
  };
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
    loading: "Проверяем Telegram-сессию…",
    reconnectHint: "Если это первый запуск, сначала подключите бота через /start connect_...",
    continueWeb: "Продолжить в веб-версии",
    openCatalog: "Каталог",
    openDashboard: "Войти в кабинет",
    openSettings: "Настройки бизнеса"
  },
  uk: {
    title: "Timviz Mini App",
    subtitle: "Вхід у застосунок Timviz всередині Telegram.",
    loading: "Перевіряємо Telegram-сесію…",
    reconnectHint: "Якщо це перший запуск, спочатку підключіть бота через /start connect_...",
    continueWeb: "Продовжити у веб-версії",
    openCatalog: "Каталог",
    openDashboard: "Увійти в кабінет",
    openSettings: "Налаштування бізнесу"
  },
  en: {
    title: "Timviz Mini App",
    subtitle: "Enter Timviz app inside Telegram.",
    loading: "Verifying Telegram session…",
    reconnectHint: "If this is your first launch, connect the bot first via /start connect_...",
    continueWeb: "Continue in web",
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

function getRuntime() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.Telegram?.WebApp || null;
}

type TelegramMiniAppViewProps = {
  initialLanguage?: string | null;
};

export default function TelegramMiniAppView({ initialLanguage }: TelegramMiniAppViewProps) {
  const [runtimeLanguage, setRuntimeLanguage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const language = normalizeLanguage(runtimeLanguage || initialLanguage || null);
  const copy = copyByLanguage[language];
  const isLoading = status === "loading";
  const hasError = status === "error";

  const redirectCandidates = useMemo(
    () => ({
      dashboard: "/pro/calendar?source=telegram",
      settings: "/pro/settings?source=telegram&section=telegram"
    }),
    []
  );

  useEffect(() => {
    injectTelegramScript();

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      if (cancelled) {
        return;
      }

      const runtime = getRuntime();
      const initData = runtime?.initData?.trim() || "";
      const runtimeLang = runtime?.initDataUnsafe?.user?.language_code || "";
      if (runtimeLang) {
        setRuntimeLanguage(runtimeLang);
      }

      if (!initData) {
        return;
      }

      setStatus("loading");
      setErrorMessage("");

      try {
        const response = await fetch("/api/telegram/miniapp/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            initData,
            startParam: runtime?.initDataUnsafe?.start_param || ""
          })
        });

        const payload = (await response.json().catch(() => ({}))) as Partial<{
          redirectPath: string;
          error: string;
        }>;

        if (response.ok && payload.redirectPath) {
          window.location.replace(payload.redirectPath);
          return;
        }

        const fallbackError = payload.error || copy.reconnectHint;
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(fallbackError);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(error instanceof Error ? error.message : copy.reconnectHint);
        }
      }
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.badge}>Telegram Mini App</p>
        <h1>{copy.title}</h1>
        <p className={styles.subtitle}>{copy.subtitle}</p>
        {isLoading ? <p className={styles.stateInfo}>{copy.loading}</p> : null}
        {hasError ? <p className={styles.stateError}>{errorMessage || copy.reconnectHint}</p> : null}
        <div className={styles.actions}>
          <Link href={redirectCandidates.dashboard} className={styles.primaryButton}>
            {copy.openDashboard}
          </Link>
          <Link href="/pro/login?source=telegram" className={styles.secondaryButton}>
            {copy.continueWeb}
          </Link>
          <Link href="/catalog?source=telegram" className={styles.secondaryButton}>
            {copy.openCatalog}
          </Link>
          <Link href={redirectCandidates.settings} className={styles.secondaryButton}>
            {copy.openSettings}
          </Link>
        </div>
      </section>
    </main>
  );
}
