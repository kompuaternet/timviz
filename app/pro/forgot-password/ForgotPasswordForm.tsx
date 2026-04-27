"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useProLanguage } from "../useProLanguage";
import styles from "../pro.module.css";

const copy = {
  ru: {
    eyebrow: "Восстановление доступа",
    title: "Сбросьте пароль через email",
    subtitle: "Введите email от бизнес-аккаунта. Если он зарегистрирован, мы отправим письмо со ссылкой для восстановления.",
    email: "Email",
    placeholder: "you@example.com",
    submit: "Отправить ссылку",
    loading: "Отправляем...",
    timeout: "Запрос занял слишком много времени. Попробуйте ещё раз через несколько секунд.",
    back: "Вернуться ко входу",
    success: "Если аккаунт с таким email существует, мы отправили ссылку для восстановления пароля."
  },
  uk: {
    eyebrow: "Відновлення доступу",
    title: "Скиньте пароль через email",
    subtitle: "Введіть email бізнес-акаунта. Якщо його зареєстровано, ми надішлемо лист із посиланням для відновлення.",
    email: "Email",
    placeholder: "you@example.com",
    submit: "Надіслати посилання",
    loading: "Надсилаємо...",
    timeout: "Запит триває надто довго. Спробуйте ще раз за кілька секунд.",
    back: "Повернутися до входу",
    success: "Якщо акаунт з таким email існує, ми надіслали посилання для відновлення пароля."
  },
  en: {
    eyebrow: "Access recovery",
    title: "Reset your password by email",
    subtitle: "Enter the email used for your business account. If it exists, we’ll send a reset link.",
    email: "Email",
    placeholder: "you@example.com",
    submit: "Send reset link",
    loading: "Sending...",
    timeout: "This request is taking too long. Please try again in a few seconds.",
    back: "Back to sign in",
    success: "If an account with this email exists, we sent a password reset link."
  }
} as const;

export default function ForgotPasswordForm() {
  const { language } = useProLanguage();
  const searchParams = useSearchParams();
  const t = copy[language];
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const prefilledEmail = searchParams.get("email")?.trim() || "";
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [searchParams]);

  async function handleSubmit() {
    setIsLoading(true);
    setError("");
    setMessage("");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch("/api/pro/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language }),
        signal: controller.signal
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Request failed.");
        return;
      }

      setMessage(result.message || t.success);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError(t.timeout);
      } else {
        setError("Request failed.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
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
          <label htmlFor="forgotEmail">{t.email}</label>
          <input
            id="forgotEmail"
            type="email"
            className={styles.input}
            placeholder={t.placeholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>

      {error ? <div className={styles.addressWarning}>{error}</div> : null}
      {message ? <div className={styles.successNotice}>{message}</div> : null}

      <button
        type="button"
        className={styles.primaryButton}
        disabled={!email.trim() || isLoading}
        onClick={() => void handleSubmit()}
      >
        {isLoading ? t.loading : t.submit}
      </button>

      <div className={styles.helperBlock}>
        <a href="/pro/login" className={styles.mutedLink}>
          {t.back}
        </a>
      </div>
    </div>
  );
}
