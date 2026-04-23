"use client";

import Link from "next/link";
import BrandLogo from "../BrandLogo";
import styles from "./pro.module.css";
import { useProLanguage } from "./useProLanguage";

const landingText = {
  ru: {
    brandSuffix: "для профессионалов",
    title: "Создайте учетную запись для управления бизнесом",
    subtitle: "Для мастера, частного специалиста или салона. Здесь начинается настройка расписания, услуг, команды и онлайн-записи клиентов.",
    emailPlaceholder: "Введите ваш адрес электронной почты",
    continue: "Продолжить",
    login: "Уже есть аккаунт? Войти",
    or: "или",
    facebook: "Войти через Facebook",
    google: "Войти через Google",
    apple: "Войти через Apple",
    clientPrompt: "Вы клиент и хотите записаться на прием?",
    clientCatalog: "Перейти в каталог для клиентов"
  },
  uk: {
    brandSuffix: "для професіоналів",
    title: "Створіть акаунт для керування бізнесом",
    subtitle: "Для майстра, приватного спеціаліста або салону. Саме тут починається налаштування графіка, послуг, команди та онлайн-запису клієнтів.",
    emailPlaceholder: "Введіть вашу електронну пошту",
    continue: "Продовжити",
    login: "Вже є акаунт? Увійти",
    or: "або",
    facebook: "Увійти через Facebook",
    google: "Увійти через Google",
    apple: "Увійти через Apple",
    clientPrompt: "Ви клієнт і хочете записатися на візит?",
    clientCatalog: "Перейти в каталог для клієнтів"
  },
  en: {
    brandSuffix: "for professionals",
    title: "Create an account to manage your business",
    subtitle: "For an independent specialist, private expert or salon. This is where schedule, services, team and online client bookings begin.",
    emailPlaceholder: "Enter your email address",
    continue: "Continue",
    login: "Already have an account? Sign in",
    or: "or",
    facebook: "Continue with Facebook",
    google: "Continue with Google",
    apple: "Continue with Apple",
    clientPrompt: "Are you a client and want to book a visit?",
    clientCatalog: "Open the client catalog"
  }
} as const;

export default function ProLandingPage() {
  const { language } = useProLanguage();
  const copy = landingText[language];

  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <div className={styles.panel}>
          <div className={styles.brand}>
            <BrandLogo className={styles.brandLogoInline} />
            <span>{copy.brandSuffix}</span>
          </div>
          <div>
            <h1 className={styles.heroTitle}>{copy.title}</h1>
            <p className={styles.heroSubtitle}>
              {copy.subtitle}
            </p>
          </div>

          <div className={styles.fieldStack}>
            <div className={styles.field}>
              <label htmlFor="pro-email">Email</label>
              <input
                id="pro-email"
                className={styles.input}
                placeholder={copy.emailPlaceholder}
                defaultValue="info@comp.ua"
              />
            </div>
            <Link href="/pro/create-account" className={styles.primaryButton}>
              {copy.continue}
            </Link>
            <Link href="/pro/login" className={styles.ghostButton}>
              {copy.login}
            </Link>
          </div>

          <div className={styles.socialDivider}>{copy.or}</div>

          <div className={styles.socialStack}>
            <button type="button" className={styles.socialButton}>
              <span className={`${styles.socialIcon} ${styles.facebook}`}>f</span>
              {copy.facebook}
            </button>
            <button type="button" className={styles.socialButton}>
              <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
              {copy.google}
            </button>
            <button type="button" className={styles.socialButton}>
              <span className={`${styles.socialIcon} ${styles.apple}`}></span>
              {copy.apple}
            </button>
          </div>

          <div className={styles.helperBlock}>
            {copy.clientPrompt}{" "}
            <Link href="/catalog" className={styles.mutedLink}>
              {copy.clientCatalog}
            </Link>
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
