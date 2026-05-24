"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { isProLanguage, type ProLanguage } from "../i18n";
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
  },
  fr: {
    eyebrow: "Nouveau mot de passe",
    title: "Créez un nouveau mot de passe",
    subtitle: "Définissez un nouveau mot de passe pour votre compte professionnel. Vous pourrez ensuite vous connecter.",
    password: "Nouveau mot de passe",
    confirm: "Répéter le mot de passe",
    placeholder: "Au moins 8 caractères, une lettre et un chiffre",
    submit: "Enregistrer le mot de passe",
    loading: "Enregistrement...",
    success: "Mot de passe mis à jour. Ouverture du cabinet...",
    successMobile: "Mot de passe mis à jour. Retour dans l’application...",
    mismatch: "Les mots de passe ne correspondent pas.",
    requirementLength: "Au moins 8 caractères",
    requirementLetter: "Au moins une lettre",
    requirementDigit: "Au moins un chiffre",
    matchReady: "Les mots de passe correspondent",
    failed: "Impossible de mettre à jour le mot de passe. Réessayez.",
    backToLogin: "Retour à la connexion",
    home: "Accueil"
  },
  pl: {
    eyebrow: "Nowe hasło",
    title: "Utwórz nowe hasło",
    subtitle: "Ustaw nowe hasło do konta firmowego. Po zapisaniu możesz od razu się zalogować.",
    password: "Nowe hasło",
    confirm: "Powtórz hasło",
    placeholder: "Minimum 8 znaków, litera i cyfra",
    submit: "Zapisz hasło",
    loading: "Zapisywanie...",
    success: "Hasło zaktualizowane. Otwieramy panel...",
    successMobile: "Hasło zaktualizowane. Wracamy do aplikacji...",
    mismatch: "Hasła nie są takie same.",
    requirementLength: "Minimum 8 znaków",
    requirementLetter: "Co najmniej jedna litera",
    requirementDigit: "Co najmniej jedna cyfra",
    matchReady: "Hasła są zgodne",
    failed: "Nie udało się zaktualizować hasła. Spróbuj ponownie.",
    backToLogin: "Wróć do logowania",
    home: "Strona główna"
  },
  cs: {
    eyebrow: "Nové heslo",
    title: "Vytvořte nové heslo",
    subtitle: "Nastavte nové heslo pro firemní účet. Po uložení se můžete hned přihlásit.",
    password: "Nové heslo",
    confirm: "Zopakujte heslo",
    placeholder: "Alespoň 8 znaků, písmeno a číslice",
    submit: "Uložit heslo",
    loading: "Ukládání...",
    success: "Heslo aktualizováno. Otevíráme kabinet...",
    successMobile: "Heslo aktualizováno. Vracíme se do aplikace...",
    mismatch: "Hesla se neshodují.",
    requirementLength: "Alespoň 8 znaků",
    requirementLetter: "Alespoň jedno písmeno",
    requirementDigit: "Alespoň jedna číslice",
    matchReady: "Hesla se shodují",
    failed: "Heslo se nepodařilo aktualizovat. Zkuste to znovu.",
    backToLogin: "Zpět k přihlášení",
    home: "Domů"
  },
  es: {
    eyebrow: "Nueva contraseña",
    title: "Crea una nueva contraseña",
    subtitle: "Define una nueva contraseña para tu cuenta profesional. Después podrás iniciar sesión.",
    password: "Nueva contraseña",
    confirm: "Repetir contraseña",
    placeholder: "Al menos 8 caracteres, una letra y un número",
    submit: "Guardar contraseña",
    loading: "Guardando...",
    success: "Contraseña actualizada. Abriendo el panel...",
    successMobile: "Contraseña actualizada. Volviendo a la app...",
    mismatch: "Las contraseñas no coinciden.",
    requirementLength: "Al menos 8 caracteres",
    requirementLetter: "Al menos una letra",
    requirementDigit: "Al menos un número",
    matchReady: "Las contraseñas coinciden",
    failed: "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
    backToLogin: "Volver al inicio de sesión",
    home: "Inicio"
  },
  de: {
    eyebrow: "Neues Passwort",
    title: "Neues Passwort erstellen",
    subtitle: "Lege ein neues Passwort für dein Geschäftskonto fest. Danach kannst du dich direkt anmelden.",
    password: "Neues Passwort",
    confirm: "Passwort wiederholen",
    placeholder: "Mindestens 8 Zeichen, ein Buchstabe und eine Zahl",
    submit: "Passwort speichern",
    loading: "Speichern...",
    success: "Passwort aktualisiert. Arbeitsbereich wird geöffnet...",
    successMobile: "Passwort aktualisiert. Zurück zur App...",
    mismatch: "Die Passwörter stimmen nicht überein.",
    requirementLength: "Mindestens 8 Zeichen",
    requirementLetter: "Mindestens ein Buchstabe",
    requirementDigit: "Mindestens eine Zahl",
    matchReady: "Passwörter stimmen überein",
    failed: "Passwort konnte nicht aktualisiert werden. Bitte erneut versuchen.",
    backToLogin: "Zurück zur Anmeldung",
    home: "Startseite"
  }
} as const;

function getResetPasswordLanguage(value: string | null): ProLanguage {
  return isProLanguage(value) ? value : "en";
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
  const t = {
    ...copy.en,
    ...((copy as unknown as Record<string, Partial<typeof copy.en>>)[language] ?? {})
  } as typeof copy.en;
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
