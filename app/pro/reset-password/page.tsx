import ResetPasswordForm from "./ResetPasswordForm";
import styles from "../pro.module.css";

export const dynamic = "force-dynamic";

export default function ProResetPasswordPage() {
  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <ResetPasswordForm />
      </section>
      <aside className={styles.visualSide}>
        <div className={styles.visualPhoto} />
        <div className={styles.visualOverlay} />
      </aside>
    </main>
  );
}
