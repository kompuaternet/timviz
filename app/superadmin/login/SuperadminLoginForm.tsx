"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLogo from "../../BrandLogo";
import styles from "../superadmin.module.css";

type SuperadminLoginFormProps = {
  setupMessage?: string;
};

export default function SuperadminLoginForm({ setupMessage = "" }: SuperadminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(setupMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Не удалось выполнить вход.");
      }
      router.replace("/superadmin");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось выполнить вход.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.loginShell}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <BrandLogo className={styles.loginLogo} />
        <div className={styles.loginHeader}>
          <p className={styles.kicker}>Timviz Superadmin</p>
          <h1>Управление платформой</h1>
          <p>Поиск пользователей, вход под аккаунтом, модерация услуг, фото и корневого каталога.</p>
        </div>

        <label className={styles.field}>
          <span>Email суперадмина</span>
          <input
            className={styles.input}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Пароль</span>
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className={styles.errorText}>{error}</p> : null}

        <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Входим..." : "Войти в супер-админку"}
        </button>
      </form>
    </main>
  );
}
