"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useProLanguage } from "../useProLanguage";
import styles from "../pro.module.css";

const copy = {
  ru: {
    eyebrow: "Новый пароль",
    title: "Создайте новый пароль",
    subtitle: "Придумайте новый пароль для бизнес-кабинета. После сохранения можно будет сразу войти.",
    password: "Новый пароль",
    confirm: "Повторите пароль",
    placeholder: "Минимум 8 символов, буква и цифра",
    submit: "Сохранить пароль",
    loading: "Сохраняем...",
    success: "Пароль обновлён. Открываем кабинет...",
    successMobile: "Пароль обновлён. Возвращаемся в приложение...",
    mismatch: "Пароли не совпадают.",
    requirementLength: "Минимум 8 символов",
    requirementLetter: "Хотя бы одна буква",
    requirementDigit: "Хотя бы одна цифра",
    matchReady: "Пароли совпадают",
    failed: "Не удалось обновить пароль. Попробуйте ещё раз.",
    backToLogin: "Вернуться ко входу",
    home: "На главную"
  },
  uk: {
    eyebrow: "Новий пароль",
    title: "Створіть новий пароль",
    subtitle: "Придумайте новий пароль для бізнес-кабінету. Після збереження можна буде одразу увійти.",
    password: "Новий пароль",
    confirm: "Повторіть пароль",
    placeholder: "Мінімум 8 символів, літера і цифра",
    submit: "Зберегти пароль",
    loading: "Зберігаємо...",
    success: "Пароль оновлено. Відкриваємо кабінет...",
    successMobile: "Пароль оновлено. Повертаємось у застосунок...",
    mismatch: "Паролі не збігаються.",
    requirementLength: "Мінімум 8 символів",
    requirementLetter: "Хоча б одна літера",
    requirementDigit: "Хоча б одна цифра",
    matchReady: "Паролі збігаються",
    failed: "Не вдалося оновити пароль. Спробуйте ще раз.",
    backToLogin: "Повернутися до входу",
    home: "На головну"
  },
  en: {
    eyebrow: "New password",
    title: "Create a new password",
    subtitle: "Set a new password for your business account. After saving, you can sign in right away.",
    password: "New password",
    confirm: "Repeat password",
    placeholder: "At least 8 characters, one letter and one digit",
    submit: "Save password",
    loading: "Saving...",
    success: "Password updated. Opening your workspace...",
    successMobile: "Password updated. Returning to the app...",
    mismatch: "Passwords do not match.",
    requirementLength: "At least 8 characters",
    requirementLetter: "At least one letter",
    requirementDigit: "At least one digit",
    matchReady: "Passwords match",
    failed: "Could not update the password. Please try again.",
    backToLogin: "Back to sign in",
    home: "Home"
  }
} as const;

type ResetPasswordLanguage = keyof typeof copy;

function getResetPasswordLanguage(value: string | null): ResetPasswordLanguage {
  return value === "ru" || value === "uk" || value === "en" ? value : "en";
}

function getSafeAppReturnTo(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "timviz-master:" && url.hostname === "password-reset" ? url : null;
  } catch {
    return null;
  }
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedLanguage = getResetPasswordLanguage(params.get("lang"));
  const { language } = useProLanguage(requestedLanguage);
  const t = copy[language];
  const token = params.get("token") || "";
  const returnToApp = params.get("source") === "mobile" ? getSafeAppReturnTo(params.get("return_to") || "") : null;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasLength = password.length >= 8;
  const hasLetter = /[a-zа-яіїєґ]/i.test(password);
  const hasDigit = /\d/.test(password);
  const passwordIsStrong = hasLength && hasLetter && hasDigit;
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = confirmTouched && password === confirmPassword;
  const showMismatch = confirmTouched && password.length > 0 && password !== confirmPassword;

  async function handleSubmit() {
    if (!passwordIsStrong) {
      return;
    }
    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/pro/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, language })
    });

    const result = await response.json();
    if (!response.ok) {
      setError(result.error || t.failed);
      setIsLoading(false);
      return;
    }

    if (returnToApp) {
      const email = typeof result.email === "string" ? result.email.trim().toLowerCase() : "";
      if (email) returnToApp.searchParams.set("email", email);
      setMessage(t.successMobile);
      setIsLoading(false);
      window.location.assign(returnToApp.toString());
      return;
    }

    setMessage(t.success);
    setIsLoading(false);
    router.push("/pro/workspace");
    router.refresh();
  }

  return (
    <div className={styles.panel}>
      <div className={styles.resetPasswordNav}>
        <a href="/pro/login" className={styles.resetPasswordBack}>
          {t.backToLogin}
        </a>
      </div>

      <div>
        <p className={styles.eyebrow}>{t.eyebrow}</p>
        <h1 className={styles.heroTitle}>{t.title}</h1>
        <p className={styles.heroSubtitle}>{t.subtitle}</p>
      </div>

      <div className={styles.fieldStack}>
        <div className={styles.field}>
          <label htmlFor="resetPassword">{t.password}</label>
          <input
            id="resetPassword"
            type="password"
            className={styles.input}
            placeholder={t.placeholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
          />
          <div className={styles.passwordChecklist}>
            <span className={hasLength ? styles.passwordRuleOk : ""}>{t.requirementLength}</span>
            <span className={hasLetter ? styles.passwordRuleOk : ""}>{t.requirementLetter}</span>
            <span className={hasDigit ? styles.passwordRuleOk : ""}>{t.requirementDigit}</span>
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="resetPasswordConfirm">{t.confirm}</label>
          <input
            id="resetPasswordConfirm"
            type="password"
            className={`${styles.input} ${showMismatch ? styles.inputInvalid : ""} ${passwordsMatch ? styles.inputValid : ""}`}
            placeholder={t.placeholder}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
            }}
          />
          {showMismatch ? <span className={styles.fieldError}>{t.mismatch}</span> : null}
          {passwordsMatch ? <span className={styles.fieldSuccess}>{t.matchReady}</span> : null}
        </div>
      </div>

      {error ? <div className={styles.addressWarning}>{error}</div> : null}
      {message ? <div className={styles.successNotice}>{message}</div> : null}

      <button
        type="button"
        className={styles.primaryButton}
        disabled={!token || !passwordIsStrong || !passwordsMatch || isLoading}
        onClick={() => void handleSubmit()}
      >
        {isLoading ? t.loading : t.submit}
      </button>

      <div className={styles.helperBlock}>
        <a href="/" className={styles.mutedLink}>
          {t.home}
        </a>
      </div>
    </div>
  );
}
