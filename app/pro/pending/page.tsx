import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getPendingJoinRequestForProfessional, getWorkspaceSnapshot } from "../../../lib/pro-data";
import styles from "../pro.module.css";

export default async function ProPendingPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const [workspace, pendingJoinRequest] = await Promise.all([
    getWorkspaceSnapshot(professionalId),
    getPendingJoinRequestForProfessional(professionalId)
  ]);

  if (workspace) {
    redirect("/pro/calendar");
  }

  if (!pendingJoinRequest) {
    redirect("/pro/login");
  }

  const languageHeader = headerStore.get("accept-language")?.toLowerCase() || "";
  const language = languageHeader.includes("uk")
    ? "uk"
    : languageHeader.includes("en")
      ? "en"
      : "ru";

  const copy = {
    ru: {
      eyebrow: "Запрос отправлен",
      title: "Ожидаем подтверждение владельца бизнеса",
      text: "Мы отправили запрос на присоединение к бизнесу",
      tail: "Как только владелец подтвердит его, вы сможете войти в рабочий кабинет и начать работу."
    },
    uk: {
      eyebrow: "Запит надіслано",
      title: "Очікуємо підтвердження від власника бізнесу",
      text: "Ми надіслали запит на приєднання до бізнесу",
      tail: "Щойно власник підтвердить його, ви зможете увійти до робочого кабінету й почати роботу."
    },
    en: {
      eyebrow: "Request sent",
      title: "Waiting for the business owner to approve access",
      text: "We have sent a request to join",
      tail: "As soon as the owner approves it, you will be able to enter the workspace and start working."
    }
  }[language];

  return (
    <main className={styles.onboardingShell}>
      <div className={styles.wizardFrame}>
        <section className={styles.wizardCard}>
          <div className={styles.wizardHeader}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p>
              {copy.text} <strong>{pendingJoinRequest.business.name}</strong>. {copy.tail}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
