import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import LoginForm from "./LoginForm";
import styles from "../pro.module.css";

export default async function ProLoginPage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(
    cookieStore.get(getSessionCookieName())?.value
  );

  if (professionalId) {
    redirect("/pro/calendar");
  }

  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <LoginForm />
      </section>
      <aside className={styles.visualSide}>
        <div className={styles.visualPhoto} />
        <div className={styles.visualOverlay} />
      </aside>
    </main>
  );
}
