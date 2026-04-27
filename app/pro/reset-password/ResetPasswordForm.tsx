"use client";

import { useSearchParams } from "next/navigation";
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
    placeholder: "Минимум 6 символов",
    submit: "Сохранить пароль",
    loading: "Сохраняем...",
    success: "Пароль обновлён. Теперь можно войти в кабинет.",
    login: "Перейти ко входу",
    mismatch: "Пароли не совпадают."
  },
  uk: {
    eyebrow: "Новий пароль",
    title: "Створіть новий пароль",
    subtitle: "Придумайте новий пароль для бізнес-кабінету. Після збереження можна буде одразу увійти.",
    password: "Новий пароль",
    confirm: "Повторіть пароль",
    placeholder: "Мінімум 6 символів",
    submit: "Зберегти пароль",
    loading: "Зберігаємо...",
    success: "Пароль оновлено. Тепер можна увійти в кабінет.",
    login: "Перейти до входу",
    mismatch: "Паролі не збігаються."
  },
  en: {
    eyebrow: "New password",
    title: "Create a new password",
    subtitle: "Set a new password for your business account. After saving, you can sign in right away.",
    password: "New password",
    confirm: "Repeat password",
    placeholder: "At least 6 characters",
    submit: "Save password",
    loading: "Saving...",
    success: "Password updated. You can now sign in.",
    login: "Go to sign in",
    mismatch: "Passwords do not match."
  }
} as const;

export default function ResetPasswordForm() {
  const { language } = useProLanguage();
  const t = copy[language];
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
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
      body: JSON.stringify({ token, password })
    });

    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Reset failed.");
      setIsLoading(false);
      return;
    }

    setMessage(t.success);
    setPassword("");
    setConfirmPassword("");
    setIsLoading(false);
  }

  return (
    <div className={styles.panel}>
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
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="resetPasswordConfirm">{t.confirm}</label>
          <input
            id="resetPasswordConfirm"
            type="password"
            className={styles.input}
            placeholder={t.placeholder}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
      </div>

      {error ? <div className={styles.addressWarning}>{error}</div> : null}
      {message ? <div className={styles.successNotice}>{message}</div> : null}

      <button
        type="button"
        className={styles.primaryButton}
        disabled={!token || password.trim().length < 6 || confirmPassword.trim().length < 6 || isLoading}
        onClick={() => void handleSubmit()}
      >
        {isLoading ? t.loading : t.submit}
      </button>

      {message ? (
        <div className={styles.helperBlock}>
          <a href="/pro/login" className={styles.mutedLink}>
            {t.login}
          </a>
        </div>
      ) : null}
    </div>
  );
}
