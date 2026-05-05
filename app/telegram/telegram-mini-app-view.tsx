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
  openLink?: (url: string, options?: { try_instant_view?: boolean; try_browser?: string }) => void;
  openTelegramLink?: (url: string) => void;
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
    authTitle: "Вход в кабинет",
    emailLabel: "Email",
    passwordLabel: "Пароль",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "Введите пароль",
    signIn: "Войти",
    signingIn: "Входим…",
    signInGoogle: "Войти через Google",
    googleHint:
      "Google может открыть защищённое окно авторизации. После входа вы вернётесь обратно в Mini App.",
    openBot: "Открыть бот",
    loading: "Проверяем Telegram-сессию…",
    linkingAccount: "Привязываем Telegram к вашему профилю…",
    reconnectHint: "Если это первый запуск, сначала подключите бота через /start connect_...",
    invalidSessionHint: "Сессия Telegram недействительна. Обновите Mini App и попробуйте снова.",
    genericAuthError: "Не удалось авторизоваться. Попробуйте ещё раз.",
    invalidCredentials: "Неверный email или пароль.",
    linkedAnotherProfile: "Этот Telegram уже привязан к другому профилю Timviz.",
    googleStateError: "Google-сессия устарела. Запустите вход ещё раз.",
    googleOauthError: "Ошибка Google-входа. Попробуйте ещё раз.",
    connectedRedirecting: "Успешный вход. Перенаправляем в кабинет…",
    continueWeb: "Продолжить в веб-версии",
    openCatalog: "Каталог",
    openDashboard: "Войти в кабинет",
    openSettings: "Настройки бизнеса"
  },
  uk: {
    title: "Timviz Mini App",
    subtitle: "Вхід у застосунок Timviz всередині Telegram.",
    authTitle: "Вхід у кабінет",
    emailLabel: "Email",
    passwordLabel: "Пароль",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "Введіть пароль",
    signIn: "Увійти",
    signingIn: "Входимо…",
    signInGoogle: "Увійти через Google",
    googleHint:
      "Google може відкрити захищене вікно авторизації. Після входу ви повернетеся в Mini App.",
    openBot: "Відкрити бота",
    loading: "Перевіряємо Telegram-сесію…",
    linkingAccount: "Прив'язуємо Telegram до вашого профілю…",
    reconnectHint: "Якщо це перший запуск, спочатку підключіть бота через /start connect_...",
    invalidSessionHint: "Сесія Telegram недійсна. Оновіть Mini App і спробуйте ще раз.",
    genericAuthError: "Не вдалося авторизуватися. Спробуйте ще раз.",
    invalidCredentials: "Невірний email або пароль.",
    linkedAnotherProfile: "Цей Telegram уже привʼязаний до іншого профілю Timviz.",
    googleStateError: "Google-сесія застаріла. Запустіть вхід ще раз.",
    googleOauthError: "Помилка Google-входу. Спробуйте ще раз.",
    connectedRedirecting: "Успішний вхід. Перенаправляємо в кабінет…",
    continueWeb: "Продовжити у веб-версії",
    openCatalog: "Каталог",
    openDashboard: "Увійти в кабінет",
    openSettings: "Налаштування бізнесу"
  },
  en: {
    title: "Timviz Mini App",
    subtitle: "Enter Timviz app inside Telegram.",
    authTitle: "Dashboard sign in",
    emailLabel: "Email",
    passwordLabel: "Password",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "Enter password",
    signIn: "Sign in",
    signingIn: "Signing in…",
    signInGoogle: "Continue with Google",
    googleHint:
      "Google may open a secure auth window. After sign-in, you will return to the Mini App.",
    openBot: "Open bot",
    loading: "Verifying Telegram session…",
    linkingAccount: "Linking Telegram to your profile…",
    reconnectHint: "If this is your first launch, connect the bot first via /start connect_...",
    invalidSessionHint: "Telegram session is invalid. Refresh Mini App and try again.",
    genericAuthError: "Could not authenticate. Please try again.",
    invalidCredentials: "Invalid email or password.",
    linkedAnotherProfile: "This Telegram is already linked to another Timviz profile.",
    googleStateError: "Google session expired. Start sign-in again.",
    googleOauthError: "Google sign-in failed. Please try again.",
    connectedRedirecting: "Signed in. Redirecting to dashboard…",
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
  initialStartParam?: string | null;
  signedInRedirectPath?: string | null;
};

function resolveStartRedirectPath(startParam: string | null | undefined) {
  const normalized = String(startParam || "").trim().toLowerCase();
  if (!normalized) return "/pro/calendar?source=telegram";
  if (normalized.includes("notifications") || normalized.includes("inbox")) {
    return "/pro/calendar?source=telegram&panel=notifications";
  }
  if (normalized.includes("settings") || normalized.includes("setup")) {
    return "/pro/settings?source=telegram";
  }
  if (normalized.includes("support") || normalized.includes("help")) {
    return "/pro/settings?source=telegram&section=telegram";
  }
  if (normalized.includes("clients")) {
    return "/pro/clients?source=telegram";
  }
  if (normalized.includes("services")) {
    return "/pro/services?source=telegram";
  }
  if (
    normalized.includes("staff") ||
    normalized.includes("team") ||
    normalized.includes("schedule")
  ) {
    return "/pro/staff/schedule?source=telegram";
  }
  return "/pro/calendar?source=telegram";
}

export default function TelegramMiniAppView({
  initialLanguage,
  initialStartParam,
  signedInRedirectPath
}: TelegramMiniAppViewProps) {
  const [runtimeLanguage, setRuntimeLanguage] = useState<string | null>(null);
  const [siteLanguage, setSiteLanguage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isManualAuthLoading, setIsManualAuthLoading] = useState(false);
  const [runtimeStartParam, setRuntimeStartParam] = useState<string>("");
  const [runtimeInitData, setRuntimeInitData] = useState<string>("");

  const language = normalizeLanguage(siteLanguage || initialLanguage || runtimeLanguage || null);
  const copy = copyByLanguage[language];
  const isLoading = status === "loading";
  const hasError = status === "error";
  const isDone = status === "done";

  const redirectCandidates = useMemo(() => {
    const fallbackDashboard = resolveStartRedirectPath(initialStartParam);
    const setupParams = new URLSearchParams();
    setupParams.set("source", "telegram");
    setupParams.set("startapp", "setup");
    return {
      dashboard: signedInRedirectPath || fallbackDashboard,
      settings: signedInRedirectPath
        ? "/pro/settings?source=telegram&section=telegram"
        : `/pro/create-account?${setupParams.toString()}`,
      bot: "https://t.me/Timviz_bot"
    };
  }, [initialStartParam, runtimeStartParam, signedInRedirectPath]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem("rezervo-pro-language");
    if (stored) {
      setSiteLanguage(stored);
    }

    const onLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (typeof next === "string" && next.trim()) {
        setSiteLanguage(next.trim());
      }
    };

    window.addEventListener("rezervo-language-change", onLanguageChange);
    return () => {
      window.removeEventListener("rezervo-language-change", onLanguageChange);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get("google_error");
    if (!googleError) {
      return;
    }

    if (googleError === "state") {
      setErrorMessage(copy.googleStateError);
      setStatus("error");
      return;
    }

    if (googleError === "oauth") {
      setErrorMessage(copy.googleOauthError);
      setStatus("error");
      return;
    }
  }, [copy.googleOauthError, copy.googleStateError]);

  async function tryManualSignIn() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password.trim()) {
      return;
    }

    setIsManualAuthLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/pro/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password
        })
      });
      const payload = (await response.json().catch(() => ({}))) as Partial<{
        error: string;
      }>;

      if (!response.ok) {
        setStatus("error");
        if (response.status === 401) {
          setErrorMessage(copy.invalidCredentials);
        } else {
          setErrorMessage(payload.error || copy.genericAuthError);
        }
        return;
      }

      if (runtimeInitData) {
        setStatus("loading");
        setErrorMessage(copy.linkingAccount);
        await bindCurrentTelegramToSession(runtimeInitData);
      }

      setStatus("done");
      setErrorMessage(copy.connectedRedirecting);
      window.location.replace(redirectCandidates.dashboard || "/pro/workspace?source=telegram");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : copy.genericAuthError);
    } finally {
      setIsManualAuthLoading(false);
    }
  }

  function openGoogleInMiniApp() {
    const startParam = runtimeStartParam || "calendar";
    const returnTo = `/telegram?source=telegram&startapp=${encodeURIComponent(startParam)}`;
    const relative = `/api/pro/auth/google/start?mode=login&source=telegram&return_to=${encodeURIComponent(returnTo)}`;
    const absolute = new URL(relative, window.location.origin).toString();
    const runtime = getRuntime();
    if (runtime?.openLink) {
      runtime.openLink(absolute, { try_instant_view: false });
      return;
    }
    window.location.assign(absolute);
  }

  async function bindCurrentTelegramToSession(initData: string) {
    const response = await fetch("/api/pro/telegram/miniapp/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ initData })
    });

    const payload = (await response.json().catch(() => ({}))) as Partial<{
      errorCode: string;
      error: string;
    }>;

    if (!response.ok) {
      if (payload.errorCode === "already_linked_other_profile") {
        throw new Error(copy.linkedAnotherProfile);
      }
      throw new Error(payload.error || copy.genericAuthError);
    }
  }

  useEffect(() => {
    injectTelegramScript();

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      if (cancelled) {
        return;
      }

      const runtime = getRuntime();
      const initData = runtime?.initData?.trim() || "";
      const queryStartParam = (() => {
        const params = new URLSearchParams(window.location.search);
        return (
          params.get("tgWebAppStartParam")?.trim() ||
          params.get("startapp")?.trim() ||
          params.get("start_param")?.trim() ||
          ""
        );
      })();
      const startParam = String(runtime?.initDataUnsafe?.start_param || queryStartParam || "").trim();
      const runtimeLang = runtime?.initDataUnsafe?.user?.language_code || "";
      if (runtimeLang) {
        setRuntimeLanguage(runtimeLang);
      }
      if (startParam) {
        setRuntimeStartParam(startParam);
      }
      if (initData) {
        setRuntimeInitData(initData);
      }

      if (!initData) {
        if (signedInRedirectPath) {
          window.location.replace(signedInRedirectPath);
        }
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
          errorCode: string;
          error: string;
        }>;

        if (response.ok && payload.redirectPath) {
          setStatus("done");
          window.location.replace(payload.redirectPath);
          return;
        }

        if (payload.errorCode === "not_connected" && signedInRedirectPath) {
          try {
            setErrorMessage(copy.linkingAccount);
            await bindCurrentTelegramToSession(initData);
            setStatus("done");
            window.location.replace(signedInRedirectPath);
            return;
          } catch (linkError) {
            if (!cancelled) {
              setStatus("error");
              setErrorMessage(
                linkError instanceof Error ? linkError.message : copy.genericAuthError
              );
            }
            return;
          }
        }

        let fallbackError = payload.error || copy.reconnectHint;
        if (payload.errorCode === "invalid_init_data") {
          fallbackError = copy.invalidSessionHint;
        }
        if (payload.errorCode === "not_connected") {
          fallbackError = copy.reconnectHint;
        }

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
  }, [copy.genericAuthError, copy.invalidSessionHint, copy.linkingAccount, copy.reconnectHint, signedInRedirectPath]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.badge}>Telegram Mini App</p>
        <h1>{copy.title}</h1>
        <p className={styles.subtitle}>{copy.subtitle}</p>
        {isLoading ? <p className={styles.stateInfo}>{copy.loading}</p> : null}
        {hasError ? <p className={styles.stateError}>{errorMessage || copy.reconnectHint}</p> : null}
        {isDone ? <p className={styles.stateInfo}>{copy.connectedRedirecting}</p> : null}

        {!isLoading ? (
          <div className={styles.loginCard}>
            <h2>{copy.authTitle}</h2>
            <label className={styles.fieldLabel}>
              {copy.emailLabel}
              <input
                type="email"
                autoComplete="email"
                className={styles.fieldInput}
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className={styles.fieldLabel}>
              {copy.passwordLabel}
              <input
                type="password"
                autoComplete="current-password"
                className={styles.fieldInput}
                placeholder={copy.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!email.trim() || !password.trim() || isManualAuthLoading}
              onClick={() => {
                void tryManualSignIn();
              }}
            >
              {isManualAuthLoading ? copy.signingIn : copy.signIn}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={openGoogleInMiniApp}
            >
              {copy.signInGoogle}
            </button>
            <p className={styles.hintText}>{copy.googleHint}</p>
            {runtimeInitData ? null : (
              <a className={styles.linkButton} href={redirectCandidates.bot}>
                {copy.openBot}
              </a>
            )}
          </div>
        ) : null}

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
