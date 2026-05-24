"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import TurnstileWidget from "../TurnstileWidget";
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
    failed: "Не удалось отправить запрос. Попробуйте ещё раз.",
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
    failed: "Не вдалося надіслати запит. Спробуйте ще раз.",
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
    failed: "Could not send the request. Please try again.",
    back: "Back to sign in",
    success: "If an account with this email exists, we sent a password reset link."
  },
  fr: {
    eyebrow: "Récupération d’accès",
    title: "Réinitialisez votre mot de passe par email",
    subtitle: "Entrez l’email de votre compte professionnel. S’il existe, nous enverrons un lien de réinitialisation.",
    email: "Email",
    placeholder: "vous@example.com",
    submit: "Envoyer le lien",
    loading: "Envoi...",
    timeout: "La demande prend trop de temps. Réessayez dans quelques secondes.",
    failed: "Impossible d’envoyer la demande. Réessayez.",
    back: "Retour à la connexion",
    success: "Si un compte existe avec cet email, nous avons envoyé un lien de réinitialisation."
  },
  pl: {
    eyebrow: "Odzyskiwanie dostępu",
    title: "Zresetuj hasło przez email",
    subtitle: "Wpisz email konta firmowego. Jeśli istnieje, wyślemy link do resetu.",
    email: "Email",
    placeholder: "ty@example.com",
    submit: "Wyślij link",
    loading: "Wysyłamy...",
    timeout: "Żądanie trwa zbyt długo. Spróbuj ponownie za kilka sekund.",
    failed: "Nie udało się wysłać żądania. Spróbuj ponownie.",
    back: "Wróć do logowania",
    success: "Jeśli konto z tym emailem istnieje, wysłaliśmy link do resetu hasła."
  },
  cs: {
    eyebrow: "Obnovení přístupu",
    title: "Obnovte heslo emailem",
    subtitle: "Zadejte email firemního účtu. Pokud existuje, pošleme odkaz pro obnovu.",
    email: "Email",
    placeholder: "vy@example.com",
    submit: "Odeslat odkaz",
    loading: "Odesíláme...",
    timeout: "Požadavek trvá příliš dlouho. Zkuste to za pár sekund znovu.",
    failed: "Požadavek se nepodařilo odeslat. Zkuste to znovu.",
    back: "Zpět k přihlášení",
    success: "Pokud účet s tímto emailem existuje, poslali jsme odkaz pro obnovu hesla."
  },
  es: {
    eyebrow: "Recuperación de acceso",
    title: "Restablece tu contraseña por email",
    subtitle: "Introduce el email de tu cuenta profesional. Si existe, enviaremos un enlace.",
    email: "Email",
    placeholder: "tu@example.com",
    submit: "Enviar enlace",
    loading: "Enviando...",
    timeout: "La solicitud tarda demasiado. Inténtalo de nuevo en unos segundos.",
    failed: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
    back: "Volver al inicio de sesión",
    success: "Si existe una cuenta con este email, hemos enviado un enlace de restablecimiento."
  },
  de: {
    eyebrow: "Zugriff wiederherstellen",
    title: "Passwort per E-Mail zurücksetzen",
    subtitle: "Gib die E-Mail deines Geschäftskontos ein. Falls sie existiert, senden wir einen Link.",
    email: "Email",
    placeholder: "du@example.com",
    submit: "Link senden",
    loading: "Senden...",
    timeout: "Die Anfrage dauert zu lange. Bitte in ein paar Sekunden erneut versuchen.",
    failed: "Die Anfrage konnte nicht gesendet werden. Bitte erneut versuchen.",
    back: "Zurück zur Anmeldung",
    success: "Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen gesendet."
  }
} as const;

export default function ForgotPasswordForm() {
  const { language } = useProLanguage();
  const searchParams = useSearchParams();
  const t = {
    ...copy.en,
    ...((copy as unknown as Record<string, Partial<typeof copy.en>>)[language] ?? {})
  } as typeof copy.en;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const captchaReady = !turnstileEnabled || Boolean(captchaToken);

  useEffect(() => {
    const prefilledEmail = searchParams.get("email")?.trim() || "";
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

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
        body: JSON.stringify({ email, language, captchaToken }),
        signal: controller.signal
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || t.failed);
        if (result.retryAfter) {
          setCooldown(Number(result.retryAfter));
        }
        return;
      }

      setMessage(result.message || t.success);
      setCooldown(60);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setError(t.timeout);
      } else {
        setError(t.failed);
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

      <TurnstileWidget onToken={setCaptchaToken} />

      {error ? <div className={styles.addressWarning}>{error}</div> : null}
      {message ? <div className={styles.successNotice}>{message}</div> : null}

      <button
        type="button"
        className={styles.primaryButton}
        disabled={!email.trim() || isLoading || cooldown > 0 || !captchaReady}
        onClick={() => void handleSubmit()}
      >
        {isLoading ? t.loading : cooldown > 0 ? `${t.submit} · ${cooldown}` : t.submit}
      </button>

      <div className={styles.helperBlock}>
        <a href="/pro/login" className={styles.mutedLink}>
          {t.back}
        </a>
      </div>
    </div>
  );
}
