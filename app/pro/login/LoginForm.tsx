"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useProLanguage } from "../useProLanguage";
import styles from "../pro.module.css";

const loginText = {
  ru: {
    googleConfigError: "Google вход временно недоступен: не настроены ключи.",
    googleLoginError: "Не удалось выполнить вход через Google. Повторите попытку.",
    loginFailed: "Не удалось войти.",
    eyebrow: "Вход для профессионалов",
    title: "Войдите в свой бизнес-аккаунт",
    subtitle: "Для владельца бизнеса, администратора или мастера, который уже зарегистрирован в системе.",
    password: "Пароль",
    passwordPlaceholder: "Введите пароль",
    google: "Войти через Google",
    forgotPassword: "Забыли пароль?",
    loading: "Входим...",
    submit: "Войти",
    noAccount: "Нет аккаунта?",
    createProfile: "Создать профессиональный профиль",
    createMaster: "Создать аккаунт мастера",
    createMasterSubtitle: "1 минута — и вы сможете открыть календарь."
  },
  uk: {
    googleConfigError: "Google вхід тимчасово недоступний: ключі не налаштовані.",
    googleLoginError: "Не вдалося виконати вхід через Google. Спробуйте ще раз.",
    loginFailed: "Не вдалося увійти.",
    eyebrow: "Вхід для професіоналів",
    title: "Увійдіть у свій бізнес-акаунт",
    subtitle: "Для власника бізнесу, адміністратора або майстра, який уже зареєстрований у системі.",
    password: "Пароль",
    passwordPlaceholder: "Введіть пароль",
    google: "Увійти через Google",
    forgotPassword: "Забули пароль?",
    loading: "Входимо...",
    submit: "Увійти",
    noAccount: "Немає акаунта?",
    createProfile: "Створити професійний профіль",
    createMaster: "Створити акаунт майстра",
    createMasterSubtitle: "1 хвилина — і ви зможете відкрити календар."
  },
  en: {
    googleConfigError: "Google sign-in is temporarily unavailable: keys are not configured.",
    googleLoginError: "Could not sign in with Google. Please try again.",
    loginFailed: "Could not sign in.",
    eyebrow: "Professional sign in",
    title: "Sign in to your business account",
    subtitle: "For the business owner, administrator or specialist who is already registered in the system.",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    google: "Continue with Google",
    forgotPassword: "Forgot password?",
    loading: "Signing in...",
    submit: "Sign in",
    noAccount: "No account yet?",
    createProfile: "Create a professional profile",
    createMaster: "Create master account",
    createMasterSubtitle: "1 minute — and you can open your calendar."
  }
} as const;

type LoginFormProps = {
  staleSession?: boolean;
  returnTo?: string;
};

type TelegramRuntime = {
  openLink?: (url: string, options?: { try_instant_view?: boolean; try_browser?: string }) => void;
  initData?: string;
};

export default function LoginForm({ staleSession = false, returnTo = "" }: LoginFormProps) {
  const router = useRouter();
  const { language } = useProLanguage();
  const copy = loginText[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthErrorText, setOauthErrorText] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [staleSessionMessage, setStaleSessionMessage] = useState("");
  const [isTelegramSource, setIsTelegramSource] = useState(false);
  const [telegramStartParam, setTelegramStartParam] = useState("calendar");
  const [returnToPath, setReturnToPath] = useState(returnTo);

  useEffect(() => {
    let isCancelled = false;

    if (!staleSession) {
      return () => {
        isCancelled = true;
      };
    }

    void fetch("/api/pro/logout", {
      method: "POST"
    }).finally(() => {
      if (isCancelled) {
        return;
      }

      setStaleSessionMessage(
        language === "uk"
          ? "Попередню сесію очищено. Увійдіть знову."
          : language === "en"
            ? "Your previous session was cleared. Please sign in again."
            : "Предыдущая сессия очищена. Войдите снова."
      );
    });

    return () => {
      isCancelled = true;
    };
  }, [language, staleSession]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get("google_error");
    const prefilledEmail = params.get("email")?.trim() || "";
    const inviteFromQuery = params.get("invite")?.trim() || "";
    const returnToFromQuery = params.get("return_to")?.trim() || "";
    const source = params.get("source")?.trim().toLowerCase() || "";
    const runtimeStartParam = (() => {
      try {
        const telegram = (
          window as Window & {
            Telegram?: { WebApp?: { initDataUnsafe?: { start_param?: string }; initData?: string } };
          }
        ).Telegram;
        return String(telegram?.WebApp?.initDataUnsafe?.start_param || "").trim();
      } catch {
        return "";
      }
    })();
    const hasTelegramRuntime = (() => {
      try {
        const telegram = (
          window as Window & { Telegram?: { WebApp?: { initData?: string } } }
        ).Telegram;
        return Boolean(telegram?.WebApp?.initData);
      } catch {
        return false;
      }
    })();
    const startParam =
      params.get("startapp")?.trim() ||
      params.get("start_param")?.trim() ||
      params.get("tgWebAppStartParam")?.trim() ||
      runtimeStartParam ||
      "";
    const nextText =
      googleError === "config"
        ? copy.googleConfigError
        : googleError
          ? copy.googleLoginError
          : "";
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
    setIsTelegramSource(source === "telegram" || hasTelegramRuntime);
    setTelegramStartParam(startParam || "calendar");
    setInviteToken(inviteFromQuery);
    if (returnToFromQuery.startsWith("/") && !returnToFromQuery.startsWith("//")) {
      setReturnToPath(returnToFromQuery);
    }
    setOauthErrorText(nextText);
  }, [copy.googleConfigError, copy.googleLoginError]);

  const googleAuthHref = useMemo(() => {
    const query = new URLSearchParams();
    query.set("mode", "login");
    if (inviteToken) {
      query.set("invite", inviteToken);
    }
    if (isTelegramSource) {
      query.set("source", "telegram");
      const returnToQuery = new URLSearchParams();
      returnToQuery.set("source", "telegram");
      if (telegramStartParam) {
        returnToQuery.set("startapp", telegramStartParam);
      }
      query.set("return_to", `/telegram?${returnToQuery.toString()}`);
    } else if (returnToPath) {
      query.set("return_to", returnToPath);
    }
    return `/api/pro/auth/google/start?${query.toString()}`;
  }, [inviteToken, isTelegramSource, returnToPath, telegramStartParam]);

  const createAccountHref = useMemo(() => {
    const params = new URLSearchParams();
    if (inviteToken) {
      params.set("invite", inviteToken);
    }
    if (email.trim()) {
      params.set("email", email.trim());
    }
    if (isTelegramSource) {
      params.set("source", "telegram");
      params.set("startapp", telegramStartParam || "calendar");
    }
    const query = params.toString();
    return query ? `/pro/create-account?${query}` : "/pro/create-account";
  }, [email, inviteToken, isTelegramSource, telegramStartParam]);

  function handleGoogleSignIn() {
    if (typeof window === "undefined") {
      return;
    }

    const absolute = new URL(googleAuthHref, window.location.origin).toString();
    const telegramRuntime = (
      window as Window & {
        Telegram?: { WebApp?: TelegramRuntime };
      }
    ).Telegram?.WebApp;

    if ((isTelegramSource || Boolean(telegramRuntime?.initData)) && telegramRuntime?.openLink) {
      telegramRuntime.openLink(absolute, { try_instant_view: false });
      return;
    }

    window.location.assign(absolute);
  }

  async function handleLogin() {
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/pro/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, inviteToken })
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || copy.loginFailed);
      setIsLoading(false);
      return;
    }

    if (isTelegramSource) {
      const query = new URLSearchParams();
      query.set("source", "telegram");
      if (telegramStartParam) {
        query.set("startapp", telegramStartParam);
      }
      router.push(`/telegram?${query.toString()}`);
      router.refresh();
      return;
    }

    router.push(returnToPath || "/pro/workspace");
    router.refresh();
  }

  return (
    <div className={styles.panel}>
      <div>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 className={styles.heroTitle}>{copy.title}</h1>
        <p className={styles.heroSubtitle}>
          {copy.subtitle}
        </p>
      </div>

      <a href={createAccountHref} className={styles.loginCreateMasterCta}>
        <strong>{copy.createMaster}</strong>
        <span>{copy.createMasterSubtitle}</span>
      </a>

      <div className={styles.fieldStack}>
        <div className={styles.field}>
          <label htmlFor="loginEmail">Email</label>
          <input
            id="loginEmail"
            type="email"
            className={styles.input}
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="loginPassword">{copy.password}</label>
          <input
            id="loginPassword"
            type="password"
            className={styles.input}
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>

      <div className={styles.inlineActionRow}>
        <a href={`/pro/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`} className={styles.mutedLink}>
          {copy.forgotPassword}
        </a>
      </div>

      {error ? <div className={styles.addressWarning}>{error}</div> : null}
      {!error && staleSessionMessage ? <div className={styles.addressWarning}>{staleSessionMessage}</div> : null}
      {!error && !staleSessionMessage && oauthErrorText ? <div className={styles.addressWarning}>{oauthErrorText}</div> : null}

      <button
        type="button"
        className={styles.ghostButton}
        onClick={handleGoogleSignIn}
      >
        {copy.google}
      </button>

      <button
        type="button"
        className={styles.primaryButton}
        disabled={!email.trim() || !password.trim() || isLoading}
        onClick={() => {
          void handleLogin();
        }}
      >
        {isLoading ? copy.loading : copy.submit}
      </button>

      <div className={styles.helperBlock}>
        {copy.noAccount}{" "}
        <a
          href={createAccountHref}
          className={styles.mutedLink}
        >
          {copy.createProfile}
        </a>
      </div>
    </div>
  );
}
