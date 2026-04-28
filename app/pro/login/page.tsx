import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getPendingJoinRequestForProfessional, getWorkspaceSnapshot } from "../../../lib/pro-data";
import LoginForm from "./LoginForm";
import styles from "../pro.module.css";

export default async function ProLoginPage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(
    cookieStore.get(getSessionCookieName())?.value
  );

  if (professionalId) {
    const [workspace, pendingJoinRequest] = await Promise.all([
      getWorkspaceSnapshot(professionalId),
      getPendingJoinRequestForProfessional(professionalId)
    ]);

    if (workspace) {
      redirect("/pro/calendar");
    }

    if (pendingJoinRequest) {
      redirect("/pro/pending");
    }
  }

  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <LoginForm staleSession={Boolean(professionalId)} />
      </section>
      <aside className={styles.visualSide}>
        <div className={styles.visualPhoto} />
        <div className={styles.visualOverlay} />
      </aside>
    </main>
  );
}
