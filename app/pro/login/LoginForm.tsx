"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import TurnstileWidget from "../TurnstileWidget";
import { useProLanguage } from "../useProLanguage";
import styles from "../pro.module.css";

const loginText = {
  ru: {
    googleConfigError: "Google вход временно недоступен: не настроены ключи.",
    appleConfigError: "Apple вход временно недоступен: не настроены ключи.",
    googleLoginError: "Не удалось выполнить вход через Google. Повторите попытку.",
    loginFailed: "Не удалось войти.",
    eyebrow: "Timviz",
    title: "Timviz для мастера",
    subtitle: "Календарь, услуги, клиенты и онлайн-запись в одном месте.",
    password: "Пароль",
    passwordPlaceholder: "Введите пароль",
    google: "Продолжить с Google",
    apple: "Продолжить с Apple",
    divider: "или",
    forgotPassword: "Забыли пароль?",
    confirmTitle: "Подтвердите email",
    confirmText: "Чтобы защитить сервис от спама, подтвердите вашу email-адресу.",
    resend: "Отправить ещё раз",
    resendWait: "Отправить ещё раз можно через 60 секунд.",
    changeEmail: "Изменить email",
    loading: "Входим...",
    submit: "Войти",
    noAccount: "Нет аккаунта?",
    createProfile: "Создать профессиональный профиль",
    createMaster: "Создать аккаунт мастера",
    createMasterSubtitle: "1 минута — и вы сможете открыть календарь."
  },
  uk: {
    googleConfigError: "Google вхід тимчасово недоступний: ключі не налаштовані.",
    appleConfigError: "Apple вхід тимчасово недоступний: ключі не налаштовані.",
    googleLoginError: "Не вдалося виконати вхід через Google. Спробуйте ще раз.",
    loginFailed: "Не вдалося увійти.",
    eyebrow: "Timviz",
    title: "Timviz для майстра",
    subtitle: "Календар, послуги, клієнти й онлайн-запис в одному місці.",
    password: "Пароль",
    passwordPlaceholder: "Введіть пароль",
    google: "Продовжити з Google",
    apple: "Продовжити з Apple",
    divider: "або",
    forgotPassword: "Забули пароль?",
    confirmTitle: "Підтвердіть email",
    confirmText: "Щоб захистити сервіс від спаму, підтвердіть вашу email-адресу.",
    resend: "Надіслати ще раз",
    resendWait: "Надіслати ще раз можна через 60 секунд.",
    changeEmail: "Змінити email",
    loading: "Входимо...",
    submit: "Увійти",
    noAccount: "Немає акаунта?",
    createProfile: "Створити професійний профіль",
    createMaster: "Створити акаунт майстра",
    createMasterSubtitle: "1 хвилина — і ви зможете відкрити календар."
  },
  en: {
    googleConfigError: "Google sign-in is temporarily unavailable: keys are not configured.",
    appleConfigError: "Apple sign-in is temporarily unavailable: keys are not configured.",
    googleLoginError: "Could not sign in with Google. Please try again.",
    loginFailed: "Could not sign in.",
    eyebrow: "Timviz",
    title: "Timviz for masters",
    subtitle: "Calendar, services, clients, and online booking in one place.",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    google: "Continue with Google",
    apple: "Continue with Apple",
    divider: "or",
    forgotPassword: "Forgot password?",
    confirmTitle: "Confirm your email",
    confirmText: "To protect Timviz from spam, confirm your email address.",
    resend: "Send again",
    resendWait: "You can send again in 60 seconds.",
    changeEmail: "Change email",
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
  const copy = (loginText as unknown as Record<string, typeof loginText.en>)[language] ?? loginText.en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthErrorText, setOauthErrorText] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [staleSessionMessage, setStaleSessionMessage] = useState("");
  const [isTelegramSource, setIsTelegramSource] = useState(false);
  const [telegramStartParam, setTelegramStartParam] = useState("calendar");
  const [returnToPath, setReturnToPath] = useState(returnTo);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const captchaReady = !turnstileEnabled || Boolean(captchaToken);

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
    const appleError = params.get("apple_error");
    const confirmEmailFromQuery = params.get("confirm_email")?.trim() || "";
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
        : appleError === "config"
          ? copy.appleConfigError
        : googleError
          ? copy.googleLoginError
          : "";
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
    if (confirmEmailFromQuery) {
      setConfirmEmail(confirmEmailFromQuery);
      setEmail(confirmEmailFromQuery);
    }
    setIsTelegramSource(source === "telegram" || hasTelegramRuntime);
    setTelegramStartParam(startParam || "calendar");
    setInviteToken(inviteFromQuery);
    if (returnToFromQuery.startsWith("/") && !returnToFromQuery.startsWith("//")) {
      setReturnToPath(returnToFromQuery);
    }
    setOauthErrorText(nextText);
  }, [copy.appleConfigError, copy.googleConfigError, copy.googleLoginError]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

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

  function handleAppleSignIn() {
    if (typeof window === "undefined") return;
    const query = new URLSearchParams();
    if (returnToPath) query.set("return_to", returnToPath);
    window.location.assign(`/api/pro/auth/apple/start?${query.toString()}`);
  }

  async function resendConfirmation() {
    if (!confirmEmail || resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setError("");
    setResendMessage("");
    const response = await fetch("/api/pro/email/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: confirmEmail, language, captchaToken })
    });
    const result = await response.json().catch(() => ({}));
    setIsLoading(false);
    if (!response.ok) {
      setError(result.error || copy.resendWait);
      setResendCooldown(Number(result.retryAfter || 60));
      return;
    }
    setResendMessage(result.message || copy.resend);
    setResendCooldown(60);
  }

  async function handleLogin() {
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/pro/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password, inviteToken, language })
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errorCode === "email_not_confirmed") {
        setConfirmEmail(result.email || email.trim());
      }
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

  if (confirmEmail) {
    return (
      <div className={`${styles.panel} ${styles.authStartPanel}`}>
        <div>
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.heroTitle}>{copy.confirmTitle}</h1>
          <p className={styles.heroSubtitle}>{copy.confirmText}</p>
        </div>
        <div className={styles.confirmEmailBox}>{confirmEmail}</div>
        <TurnstileWidget onToken={setCaptchaToken} />
        {error ? <div className={styles.addressWarning}>{error}</div> : null}
        {resendMessage ? <div className={styles.successNotice}>{resendMessage}</div> : null}
        <button type="button" className={styles.primaryButton} disabled={isLoading || resendCooldown > 0 || !captchaReady} onClick={() => void resendConfirmation()}>
          {resendCooldown > 0 ? `${copy.resend} · ${resendCooldown}` : copy.resend}
        </button>
        <button type="button" className={styles.ghostButton} onClick={() => setConfirmEmail("")}>
          {copy.changeEmail}
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.panel} ${styles.authStartPanel}`}>
      <div>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 className={styles.heroTitle}>{copy.title}</h1>
        <p className={styles.heroSubtitle}>
          {copy.subtitle}
        </p>
      </div>

      <div className={styles.socialStack}>
        <button type="button" className={styles.socialButton} onClick={handleGoogleSignIn}>
          <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
          <span>{copy.google}</span>
        </button>
        <button type="button" className={`${styles.socialButton} ${styles.appleButton}`} onClick={handleAppleSignIn}>
          <span className={styles.appleGlyph}>●</span>
          <span>{copy.apple}</span>
        </button>
      </div>

      <div className={styles.socialDivider}>{copy.divider}</div>

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
