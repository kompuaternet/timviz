import Link from "next/link";
import { activateProfessionalEmailByEmail, getProfessionalPasswordResetProfile } from "../../../lib/pro-data";
import {
  readEmailFromConfirmationToken,
  verifyEmailConfirmationToken
} from "../../../lib/pro-email-confirmation";
import { isProLanguage } from "../i18n";
import styles from "../pro.module.css";

export const dynamic = "force-dynamic";

type ConfirmEmailPageProps = {
  searchParams?: Promise<{ token?: string; lang?: string }>;
};

const copy = {
  ru: {
    okTitle: "Email подтверждён",
    okText: "Аккаунт активирован. Теперь можно войти в кабинет Timviz.",
    badTitle: "Ссылка недействительна",
    badText: "Запросите письмо ещё раз или войдите в аккаунт, чтобы продолжить.",
    login: "Войти",
    resend: "Отправить ещё раз"
  },
  uk: {
    okTitle: "Email підтверджено",
    okText: "Акаунт активовано. Тепер можна увійти в кабінет Timviz.",
    badTitle: "Посилання недійсне",
    badText: "Запросіть лист ще раз або увійдіть в акаунт, щоб продовжити.",
    login: "Увійти",
    resend: "Надіслати ще раз"
  },
  en: {
    okTitle: "Email confirmed",
    okText: "Your account is active. You can now sign in to Timviz.",
    badTitle: "Invalid link",
    badText: "Request a new email or sign in to continue.",
    login: "Sign in",
    resend: "Send again"
  },
  fr: {
    okTitle: "Email confirmé",
    okText: "Votre compte est actif. Vous pouvez maintenant vous connecter à Timviz.",
    badTitle: "Lien invalide",
    badText: "Demandez un nouvel email ou connectez-vous pour continuer.",
    login: "Se connecter",
    resend: "Renvoyer"
  },
  pl: {
    okTitle: "Email potwierdzony",
    okText: "Konto jest aktywne. Możesz teraz zalogować się do Timviz.",
    badTitle: "Nieprawidłowy link",
    badText: "Poproś o nowy email albo zaloguj się, aby kontynuować.",
    login: "Zaloguj się",
    resend: "Wyślij ponownie"
  },
  cs: {
    okTitle: "Email potvrzen",
    okText: "Účet je aktivní. Nyní se můžete přihlásit do Timviz.",
    badTitle: "Neplatný odkaz",
    badText: "Požádejte o nový email nebo se přihlaste a pokračujte.",
    login: "Přihlásit se",
    resend: "Odeslat znovu"
  },
  es: {
    okTitle: "Email confirmado",
    okText: "Tu cuenta está activa. Ya puedes iniciar sesión en Timviz.",
    badTitle: "Enlace no válido",
    badText: "Solicita un nuevo email o inicia sesión para continuar.",
    login: "Iniciar sesión",
    resend: "Enviar de nuevo"
  },
  de: {
    okTitle: "E-Mail bestätigt",
    okText: "Dein Konto ist aktiv. Du kannst dich jetzt bei Timviz anmelden.",
    badTitle: "Ungültiger Link",
    badText: "Fordere eine neue E-Mail an oder melde dich an, um fortzufahren.",
    login: "Anmelden",
    resend: "Erneut senden"
  }
} as const;

export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  const params = searchParams ? await searchParams : {};
  const requestedLanguage = params?.lang ?? null;
  const lang = isProLanguage(requestedLanguage) ? requestedLanguage : "en";
  const t = copy[lang] ?? copy.en;
  const token = String(params?.token || "").trim();
  const email = readEmailFromConfirmationToken(token);
  let confirmed = false;

  if (email) {
    const professional = await getProfessionalPasswordResetProfile(email);
    if (professional && verifyEmailConfirmationToken(token, professional.passwordHash, professional.createdAt)) {
      await activateProfessionalEmailByEmail(email);
      confirmed = true;
    }
  }

  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <div className={styles.panel}>
          <div>
            <p className={styles.eyebrow}>Timviz</p>
            <h1 className={styles.heroTitle}>{confirmed ? t.okTitle : t.badTitle}</h1>
            <p className={styles.heroSubtitle}>{confirmed ? t.okText : t.badText}</p>
          </div>
          <div className={styles.authLinkRow}>
            <Link className={styles.primaryButton} href={`/pro/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}>
              {t.login}
            </Link>
            {!confirmed ? (
              <Link className={styles.ghostButton} href={`/pro/login${email ? `?confirm_email=${encodeURIComponent(email)}` : ""}`}>
                {t.resend}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
      <aside className={styles.visualSide}>
        <div className={styles.visualPhoto} />
        <div className={styles.visualOverlay} />
      </aside>
    </main>
  );
}
