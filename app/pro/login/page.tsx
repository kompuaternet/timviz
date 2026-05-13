import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getPendingJoinRequestForProfessional, getWorkspaceSnapshot } from "../../../lib/pro-data";
import LoginForm from "./LoginForm";
import styles from "../pro.module.css";

type ProLoginPageProps = {
  searchParams?: Promise<{
    source?: string;
    startapp?: string;
    start_param?: string;
    tgWebAppStartParam?: string;
    google_error?: string;
    invite?: string;
    email?: string;
    return_to?: string;
  }>;
};

function normalizeReturnTo(value: string) {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "";
  }
  return trimmed;
}

export default async function ProLoginPage({ searchParams }: ProLoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const source = typeof params?.source === "string" ? params.source.trim().toLowerCase() : "";
  const isTelegramSource = source === "telegram";
  const startParamRaw = [params?.startapp, params?.start_param, params?.tgWebAppStartParam].find(
    (value) => typeof value === "string" && value.trim()
  );
  const startParam = typeof startParamRaw === "string" ? startParamRaw.trim() : "";
  const googleError = typeof params?.google_error === "string" ? params.google_error.trim() : "";
  const invite = typeof params?.invite === "string" ? params.invite.trim() : "";
  const email = typeof params?.email === "string" ? params.email.trim() : "";
  const returnTo = typeof params?.return_to === "string" ? normalizeReturnTo(params.return_to) : "";

  if (isTelegramSource) {
    const query = new URLSearchParams();
    query.set("source", "telegram");
    if (startParam) {
      query.set("startapp", startParam);
    }
    if (googleError) {
      query.set("google_error", googleError);
    }
    if (invite) {
      query.set("invite", invite);
    }
    if (email) {
      query.set("email", email);
    }
    redirect(`/telegram?${query.toString()}`);
  }

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
      redirect(returnTo || "/pro/calendar");
    }

    if (pendingJoinRequest) {
      redirect("/pro/pending");
    }
  }

  return (
    <main className={styles.splitShell}>
      <section className={styles.formSide}>
        <LoginForm staleSession={Boolean(professionalId)} returnTo={returnTo} />
      </section>
      <aside className={styles.visualSide}>
        <div className={styles.visualPhoto} />
        <div className={styles.visualOverlay} />
      </aside>
    </main>
  );
}
