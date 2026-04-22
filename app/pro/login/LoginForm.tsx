"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../pro.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthErrorText, setOauthErrorText] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get("google_error");
    const nextText =
      googleError === "config"
        ? "Google вход временно недоступен: не настроены ключи."
        : googleError
          ? "Не удалось выполнить вход через Google. Повторите попытку."
          : "";
    setOauthErrorText(nextText);
  }, []);

  async function handleLogin() {
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/pro/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Не удалось войти.");
      setIsLoading(false);
      return;
    }

    router.push("/pro/calendar");
    router.refresh();
  }

  return (
    <div className={styles.panel}>
      <div>
        <p className={styles.eyebrow}>Вход для профессионалов</p>
        <h1 className={styles.heroTitle}>Войдите в свой бизнес-аккаунт</h1>
        <p className={styles.heroSubtitle}>
          Для владельца бизнеса, администратора или мастера, который уже зарегистрирован в системе.
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
          <label htmlFor="loginPassword">Пароль</label>
          <input
            id="loginPassword"
            type="password"
            className={styles.input}
            placeholder="Введите пароль"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>

      {error ? <div className={styles.addressWarning}>{error}</div> : null}
      {!error && oauthErrorText ? <div className={styles.addressWarning}>{oauthErrorText}</div> : null}

      <a href="/api/pro/auth/google/start?mode=login" className={styles.ghostButton}>
        Войти через Google
      </a>

      <button
        type="button"
        className={styles.primaryButton}
        disabled={!email.trim() || !password.trim() || isLoading}
        onClick={() => {
          void handleLogin();
        }}
      >
        {isLoading ? "Входим..." : "Войти"}
      </button>

      <div className={styles.helperBlock}>
        Нет аккаунта?{" "}
        <a href="/pro/create-account" className={styles.mutedLink}>
          Создать профессиональный профиль
        </a>
      </div>
    </div>
  );
}
