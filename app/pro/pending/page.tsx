import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getPendingJoinRequestForProfessional, getWorkspaceSnapshot } from "../../../lib/pro-data";
import { isProLanguage, type ProLanguage } from "../i18n";
import styles from "../pro.module.css";

function languageFromAcceptHeader(value: string): ProLanguage {
  const normalized = value.toLowerCase();
  const firstCode = normalized
    .split(",")
    .map((item) => item.trim().split(";")[0]?.split("-")[0] || "")
    .find((code) => isProLanguage(code));

  return firstCode ?? "en";
}

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

  const language = languageFromAcceptHeader(headerStore.get("accept-language") || "");

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
    },
    fr: {
      eyebrow: "Demande envoyée",
      title: "En attente de validation par le propriétaire",
      text: "Nous avons envoyé une demande pour rejoindre",
      tail: "Dès que le propriétaire l’approuve, vous pourrez ouvrir le cabinet et commencer à travailler."
    },
    pl: {
      eyebrow: "Prośba wysłana",
      title: "Czekamy na zatwierdzenie przez właściciela firmy",
      text: "Wysłaliśmy prośbę o dołączenie do",
      tail: "Gdy właściciel ją zatwierdzi, uzyskasz dostęp do panelu i rozpoczniesz pracę."
    },
    cs: {
      eyebrow: "Žádost odeslána",
      title: "Čekáme na schválení vlastníkem firmy",
      text: "Odeslali jsme žádost o připojení k",
      tail: "Jakmile ji vlastník schválí, budete moci otevřít pracovní kabinet a začít pracovat."
    },
    es: {
      eyebrow: "Solicitud enviada",
      title: "Esperando la aprobación del propietario",
      text: "Hemos enviado una solicitud para unirse a",
      tail: "Cuando el propietario la apruebe, podrás entrar al panel y empezar a trabajar."
    },
    de: {
      eyebrow: "Anfrage gesendet",
      title: "Wir warten auf die Freigabe durch den Inhaber",
      text: "Wir haben eine Anfrage zum Beitritt gesendet an",
      tail: "Sobald der Inhaber sie bestätigt, kannst du den Arbeitsbereich öffnen und loslegen."
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
