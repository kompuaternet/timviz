"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";

type InvitationPreview = {
  email: string;
  role: string;
  status: "pending" | "accepted" | "revoked" | "declined";
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
  },
  fr: {
    invalidTitle: "Invitation introuvable",
    invalidText: "Ce lien est invalide ou expiré. Demandez au propriétaire d’envoyer une nouvelle invitation.",
    revokedTitle: "Invitation révoquée",
    revokedText: "Le propriétaire a déjà annulé cette invitation. Si l’accès est toujours nécessaire, demandez un nouvel email.",
    acceptedTitle: "Invitation déjà acceptée",
    acceptedText: "Cet email est déjà connecté à l’entreprise. Vous pouvez ouvrir le cabinet.",
    pendingTitle: "Vous êtes invité dans l’équipe",
    pendingText: "Confirmez cette invitation avec le même email pour accéder au cabinet de l’équipe.",
    business: "Entreprise",
    role: "Rôle",
    email: "Email",
    accept: "Confirmer l’invitation",
    accepting: "Confirmation...",
    login: "Se connecter",
    create: "Créer un compte",
    loginToAccept: "Connectez-vous avec cet email pour confirmer l’invitation.",
    wrongAccount: "Vous êtes connecté avec un autre email. Connectez-vous au compte invité.",
    openWorkspace: "Ouvrir le cabinet"
  },
  pl: {
    invalidTitle: "Nie znaleziono zaproszenia",
    invalidText: "Ten link jest nieprawidłowy albo wygasł. Poproś właściciela o nowe zaproszenie.",
    revokedTitle: "Zaproszenie cofnięte",
    revokedText: "Właściciel firmy anulował to zaproszenie. Jeśli nadal potrzebujesz dostępu, poproś o nowy email.",
    acceptedTitle: "Zaproszenie już zaakceptowane",
    acceptedText: "Ten email jest już połączony z firmą. Możesz przejść do panelu.",
    pendingTitle: "Masz zaproszenie do zespołu",
    pendingText: "Potwierdź zaproszenie tym samym adresem email i uzyskaj dostęp do panelu pracownika.",
    business: "Firma",
    role: "Rola",
    email: "Email",
    accept: "Potwierdź zaproszenie",
    accepting: "Potwierdzamy...",
    login: "Zaloguj się",
    create: "Utwórz konto",
    loginToAccept: "Zaloguj się tym adresem email, aby potwierdzić zaproszenie.",
    wrongAccount: "Jesteś zalogowany innym adresem email. Zaloguj się na zaproszone konto.",
    openWorkspace: "Otwórz panel"
  },
  cs: {
    invalidTitle: "Pozvánka nenalezena",
    invalidText: "Tento odkaz je neplatný nebo vypršel. Požádejte vlastníka firmy o novou pozvánku.",
    revokedTitle: "Pozvánka byla odvolána",
    revokedText: "Vlastník firmy už tuto pozvánku zrušil. Pokud stále potřebujete přístup, požádejte o nový email.",
    acceptedTitle: "Pozvánka už byla přijata",
    acceptedText: "Tento email je už připojený k firmě. Můžete přejít do kabinetu.",
    pendingTitle: "Jste pozváni do týmu",
    pendingText: "Potvrďte pozvánku stejným emailem a získejte přístup do pracovního kabinetu.",
    business: "Firma",
    role: "Role",
    email: "Email",
    accept: "Potvrdit pozvánku",
    accepting: "Potvrzujeme...",
    login: "Přihlásit se",
    create: "Vytvořit účet",
    loginToAccept: "Přihlaste se tímto emailem pro potvrzení pozvánky.",
    wrongAccount: "Nyní jste přihlášeni jiným emailem. Přihlaste se pozvaným účtem.",
    openWorkspace: "Otevřít kabinet"
  },
  es: {
    invalidTitle: "Invitación no encontrada",
    invalidText: "Este enlace no es válido o ha caducado. Pide al propietario que envíe una nueva invitación.",
    revokedTitle: "Invitación revocada",
    revokedText: "El propietario ya canceló esta invitación. Si aún necesitas acceso, pide un nuevo email.",
    acceptedTitle: "Invitación ya aceptada",
    acceptedText: "Este email ya está conectado a la empresa. Puedes ir al panel.",
    pendingTitle: "Te han invitado al equipo",
    pendingText: "Confirma esta invitación con el mismo email para acceder al panel del equipo.",
    business: "Empresa",
    role: "Rol",
    email: "Email",
    accept: "Confirmar invitación",
    accepting: "Confirmando...",
    login: "Iniciar sesión",
    create: "Crear cuenta",
    loginToAccept: "Inicia sesión con este email para confirmar la invitación.",
    wrongAccount: "Has iniciado sesión con otro email. Entra con la cuenta invitada.",
    openWorkspace: "Abrir panel"
  },
  de: {
    invalidTitle: "Einladung nicht gefunden",
    invalidText: "Dieser Link ist ungültig oder abgelaufen. Bitte den Inhaber um eine neue Einladung.",
    revokedTitle: "Einladung widerrufen",
    revokedText: "Der Inhaber hat diese Einladung bereits storniert. Wenn du Zugriff brauchst, bitte um eine neue E-Mail.",
    acceptedTitle: "Einladung bereits bestätigt",
    acceptedText: "Diese E-Mail ist bereits mit dem Unternehmen verbunden. Du kannst direkt zum Arbeitsbereich gehen.",
    pendingTitle: "Du bist ins Team eingeladen",
    pendingText: "Bestätige diese Einladung mit derselben E-Mail und erhalte Zugriff auf den Team-Arbeitsbereich.",
    business: "Unternehmen",
    role: "Rolle",
    email: "Email",
    accept: "Einladung bestätigen",
    accepting: "Bestätigung...",
    login: "Anmelden",
    create: "Konto erstellen",
    loginToAccept: "Melde dich mit dieser E-Mail an, um die Einladung zu bestätigen.",
    wrongAccount: "Du bist mit einer anderen E-Mail angemeldet. Melde dich mit dem eingeladenen Konto an.",
    openWorkspace: "Arbeitsbereich öffnen"
  }
} as const;

export default function InviteAcceptView({
  token,
  invitation,
  currentProfessionalEmail
}: InviteAcceptViewProps) {
  const router = useRouter();
  const { language } = useProLanguage();
  const copy = {
    ...inviteText.en,
    ...((inviteText as unknown as Record<string, Partial<typeof inviteText.en>>)[language] ?? {})
  } as typeof inviteText.en;
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
      : invitation.status === "revoked" || invitation.status === "declined"
        ? copy.revokedTitle
        : copy.pendingTitle;
  const text =
    invitation.status === "accepted"
      ? copy.acceptedText
      : invitation.status === "revoked" || invitation.status === "declined"
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

              {invitation.status === "revoked" || invitation.status === "declined" ? (
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
