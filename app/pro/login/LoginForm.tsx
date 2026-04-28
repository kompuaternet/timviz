"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    createProfile: "Создать профессиональный профиль"
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
    createProfile: "Створити професійний профіль"
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
    createProfile: "Create a professional profile"
  }
} as const;

type LoginFormProps = {
  staleSession?: boolean;
};

export default function LoginForm({ staleSession = false }: LoginFormProps) {
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
    const nextText =
      googleError === "config"
        ? copy.googleConfigError
        : googleError
          ? copy.googleLoginError
          : "";
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
    setInviteToken(inviteFromQuery);
    setOauthErrorText(nextText);
  }, [copy.googleConfigError, copy.googleLoginError]);

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

    router.push("/pro/workspace");
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

      <a
        href={`/api/pro/auth/google/start?mode=login${
          inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""
        }`}
        className={styles.ghostButton}
      >
        {copy.google}
      </a>

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
          href={
            inviteToken
              ? `/pro/create-account?invite=${encodeURIComponent(inviteToken)}${
                  email.trim() ? `&email=${encodeURIComponent(email.trim())}` : ""
                }`
              : "/pro/create-account"
          }
          className={styles.mutedLink}
        >
          {copy.createProfile}
        </a>
      </div>
    </div>
  );
}
