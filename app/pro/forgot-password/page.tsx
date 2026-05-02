import ForgotPasswordForm from "./ForgotPasswordForm";
import styles from "../pro.module.css";

export const dynamic = "force-dynamic";

export default function ProForgotPasswordPage() {
  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <ForgotPasswordForm />
      </section>
      <aside className={styles.visualSide}>
        <div className={styles.visualPhoto} />
        <div className={styles.visualOverlay} />
      </aside>
    </main>
  );
}
