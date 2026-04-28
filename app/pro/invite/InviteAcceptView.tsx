"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";

type InvitationPreview = {
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked";
  hasExistingAccount: boolean;
  business: {
    id: string;
    name: string;
    categories: string[];
    address: string;
  };
};

type InviteAcceptViewProps = {
  token: string;
  invitation: InvitationPreview | null;
  currentProfessionalEmail: string;
};

const inviteText = {
  ru: {
    invalidTitle: "Приглашение не найдено",
    invalidText: "Ссылка недействительна или уже устарела. Попросите владельца бизнеса отправить новое приглашение.",
    revokedTitle: "Приглашение отозвано",
    revokedText: "Владелец бизнеса уже отменил это приглашение. Если доступ всё ещё нужен, попросите отправить новое письмо.",
    acceptedTitle: "Приглашение уже подтверждено",
    acceptedText: "Этот email уже подключён к бизнесу. Можно сразу переходить в рабочий кабинет.",
    pendingTitle: "Вас приглашают в команду",
    pendingText: "Подтвердите приглашение через этот email и получите доступ к рабочему кабинету сотрудника.",
    business: "Бизнес",
    role: "Роль",
    email: "Email",
    accept: "Подтвердить приглашение",
    accepting: "Подтверждаем...",
    login: "Войти",
    create: "Создать аккаунт",
    loginToAccept: "Войдите под этим email, чтобы подтвердить приглашение.",
    wrongAccount: "Сейчас вы вошли под другим email. Войдите в аккаунт, на который пришло приглашение.",
    openWorkspace: "Открыть кабинет"
  },
  uk: {
    invalidTitle: "Запрошення не знайдено",
    invalidText: "Посилання недійсне або вже застаріло. Попросіть власника бізнесу надіслати нове запрошення.",
    revokedTitle: "Запрошення відкликано",
    revokedText: "Власник бізнесу вже скасував це запрошення. Якщо доступ все ще потрібен, попросіть надіслати новий лист.",
    acceptedTitle: "Запрошення вже підтверджено",
    acceptedText: "Цей email уже підключено до бізнесу. Можна одразу переходити до робочого кабінету.",
    pendingTitle: "Вас запрошують до команди",
    pendingText: "Підтвердьте запрошення через цей email і отримайте доступ до робочого кабінету співробітника.",
    business: "Бізнес",
    role: "Роль",
    email: "Email",
    accept: "Підтвердити запрошення",
    accepting: "Підтверджуємо...",
    login: "Увійти",
    create: "Створити акаунт",
    loginToAccept: "Увійдіть під цим email, щоб підтвердити запрошення.",
    wrongAccount: "Зараз ви ввійшли під іншим email. Увійдіть в акаунт, на який прийшло запрошення.",
    openWorkspace: "Відкрити кабінет"
  },
  en: {
    invalidTitle: "Invitation not found",
    invalidText: "This link is invalid or expired. Ask the business owner to send a new invitation.",
    revokedTitle: "Invitation revoked",
    revokedText: "The business owner has already cancelled this invitation. If you still need access, ask for a new email.",
    acceptedTitle: "Invitation already accepted",
    acceptedText: "This email is already connected to the business. You can go straight to the workspace.",
    pendingTitle: "You are invited to the team",
    pendingText: "Confirm this invitation with the same email and get access to the staff workspace.",
    business: "Business",
    role: "Role",
    email: "Email",
    accept: "Confirm invitation",
    accepting: "Confirming...",
    login: "Sign in",
    create: "Create account",
    loginToAccept: "Sign in with this email to confirm the invitation.",
    wrongAccount: "You are currently signed in with a different email. Sign in with the invited account instead.",
    openWorkspace: "Open workspace"
  }
} as const;

export default function InviteAcceptView({
  token,
  invitation,
  currentProfessionalEmail
}: InviteAcceptViewProps) {
  const router = useRouter();
  const { language } = useProLanguage();
  const copy = inviteText[language];
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const normalizedCurrentEmail = currentProfessionalEmail.trim().toLowerCase();
  const normalizedInvitationEmail = invitation?.email.trim().toLowerCase() || "";
  const isMatchingLoggedInAccount =
    Boolean(normalizedCurrentEmail) && normalizedCurrentEmail === normalizedInvitationEmail;

  async function handleAccept() {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setStatus("");

    const response = await fetch("/api/pro/staff/invitations/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(String(payload.error || copy.invalidText));
      setIsLoading(false);
      return;
    }

    router.push("/pro/calendar");
    router.refresh();
  }

  const loginHref = `/pro/login?email=${encodeURIComponent(normalizedInvitationEmail)}&invite=${encodeURIComponent(token)}`;
  const createHref = `/pro/create-account?email=${encodeURIComponent(normalizedInvitationEmail)}&invite=${encodeURIComponent(token)}`;

  if (!token || !invitation) {
    return (
      <main className={styles.onboardingShell}>
        <div className={styles.wizardFrame}>
          <section className={styles.wizardCard}>
            <div className={styles.wizardHeader}>
              <h1>{copy.invalidTitle}</h1>
              <p>{copy.invalidText}</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const title =
    invitation.status === "accepted"
      ? copy.acceptedTitle
      : invitation.status === "revoked"
        ? copy.revokedTitle
        : copy.pendingTitle;
  const text =
    invitation.status === "accepted"
      ? copy.acceptedText
      : invitation.status === "revoked"
        ? copy.revokedText
        : copy.pendingText;

  return (
    <main className={styles.onboardingShell}>
      <div className={styles.wizardFrame}>
        <section className={styles.wizardCard}>
          <div className={styles.wizardHeader}>
            <h1>{title}</h1>
            <p>{text}</p>
          </div>

          <div className={styles.generatedBlock}>
            <strong>{copy.business}</strong>
            <div className={styles.serviceStack}>
              <div className={`${styles.serviceOption} ${styles.selectedCard}`}>
                <span className={styles.choiceTitle}>{invitation.business.name}</span>
                <span className={styles.choiceText}>{`${copy.role}: ${invitation.role}`}</span>
                <span className={styles.choiceText}>{`${copy.email}: ${invitation.email}`}</span>
              </div>
            </div>

            {status ? <div className={styles.addressWarning}>{status}</div> : null}

            <div className={styles.templateActions}>
              {invitation.status === "accepted" ? (
                <a href={normalizedCurrentEmail ? "/pro/calendar" : loginHref} className={styles.primaryButton}>
                  {normalizedCurrentEmail ? copy.openWorkspace : copy.login}
                </a>
              ) : null}

              {invitation.status === "revoked" ? (
                <a href="/pro/login" className={styles.ghostButton}>
                  {copy.login}
                </a>
              ) : null}

              {invitation.status === "pending" && isMatchingLoggedInAccount ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => void handleAccept()}
                  disabled={isLoading}
                >
                  {isLoading ? copy.accepting : copy.accept}
                </button>
              ) : null}

              {invitation.status === "pending" && !normalizedCurrentEmail ? (
                <>
                  <a href={invitation.hasExistingAccount ? loginHref : createHref} className={styles.primaryButton}>
                    {invitation.hasExistingAccount ? copy.login : copy.create}
                  </a>
                  <p className={styles.choiceText}>{copy.loginToAccept}</p>
                </>
              ) : null}

              {invitation.status === "pending" &&
              normalizedCurrentEmail &&
              !isMatchingLoggedInAccount ? (
                <>
                  <a href={loginHref} className={styles.primaryButton}>
                    {copy.login}
                  </a>
                  {!invitation.hasExistingAccount ? (
                    <a href={createHref} className={styles.ghostButton}>
                      {copy.create}
                    </a>
                  ) : null}
                  <p className={styles.choiceText}>{copy.wrongAccount}</p>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
