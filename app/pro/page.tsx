import Link from "next/link";
import BrandLogo from "../BrandLogo";
import styles from "./pro.module.css";

export default function ProLandingPage() {
  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <div className={styles.panel}>
          <div className={styles.brand}>
            <BrandLogo className={styles.brandLogoInline} />
            <span>для профессионалов</span>
          </div>
          <div>
            <h1 className={styles.heroTitle}>Создайте учетную запись для управления бизнесом</h1>
            <p className={styles.heroSubtitle}>
              Для мастера, частного специалиста или салона. Здесь начинается
              настройка расписания, услуг, команды и онлайн-записи клиентов.
            </p>
          </div>

          <div className={styles.fieldStack}>
            <div className={styles.field}>
              <label htmlFor="pro-email">Email</label>
              <input
                id="pro-email"
                className={styles.input}
                placeholder="Введите ваш адрес электронной почты"
                defaultValue="info@comp.ua"
              />
            </div>
            <Link href="/pro/create-account" className={styles.primaryButton}>
              Продолжить
            </Link>
            <Link href="/pro/login" className={styles.ghostButton}>
              Уже есть аккаунт? Войти
            </Link>
          </div>

          <div className={styles.socialDivider}>или</div>

          <div className={styles.socialStack}>
            <button type="button" className={styles.socialButton}>
              <span className={`${styles.socialIcon} ${styles.facebook}`}>f</span>
              Войти через Facebook
            </button>
            <button type="button" className={styles.socialButton}>
              <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
              Войти через Google
            </button>
            <button type="button" className={styles.socialButton}>
              <span className={`${styles.socialIcon} ${styles.apple}`}></span>
              Войти через Apple
            </button>
          </div>

          <div className={styles.helperBlock}>
            Вы клиент и хотите записаться на прием?{" "}
            <Link href="/catalog" className={styles.mutedLink}>
              Перейти в каталог для клиентов
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
