"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "../../ProfileAvatar";
import FloatingPopover from "../FloatingPopover";
import ProSidebar from "../ProSidebar";
import ProWorkspaceHeader from "../ProWorkspaceHeader";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
import { localeBySiteLanguage } from "../../../lib/site-language";
import type { ProLanguage } from "../i18n";
import type { OnboardingCtaState } from "../../../lib/pro-onboarding";
import type {
  BusinessStaffSnapshot,
  PendingStaffInvitationSnapshot,
  StaffMemberSnapshot,
  StaffMemberWorkspaceAccess
} from "../../../lib/pro-staff";

type StaffViewProps = {
  professionalId: string;
  snapshot: BusinessStaffSnapshot;
  canManageStaff?: boolean;
  initialAddOpen?: boolean;
  onboardingCta: OnboardingCtaState;
  header: {
    viewerName: string;
    viewerAvatarUrl?: string;
    viewerInitials: string;
    isPremium?: boolean;
    publicBookingUrl?: string;
    publicBookingEnabled?: boolean;
  };
};

type StaffActionMenuState = {
  memberId: string;
  anchorEl: HTMLElement;
};

const staffText = {
  ru: {
    sectionTitle: "Команда",
    people: "Участники команды",
    schedule: "График смен",
    pageTitle: "Участники команды",
    pageText:
      "Приглашайте сотрудников по email, управляйте участниками команды и их графиком.",
    add: "Пригласить",
    search: "Поиск участников команды",
    name: "Имя",
    contacts: "Контактные данные",
    access: "Роль разрешения",
    stats: "Статистика",
    actions: "Действия",
    edit: "Изменить",
    openSchedule: "Посмотреть график",
    invite: "Отправить приглашение",
    resendInvite: "Отправить повторно",
    addEmail: "Добавить email",
    revokeInvite: "Отозвать приглашение",
    pendingInvites: "Отправленные приглашения",
    joinRequests: "Запросы на присоединение",
    incomingInvites: "Полученные приглашения",
    noIncomingInvites: "Вас пока никто не пригласил.",
    noInvites: "Вы пока никого не пригласили.",
    noJoinRequests: "Новых запросов пока нет.",
    approve: "Подтвердить",
    reject: "Отклонить",
    decline: "Отклонить",
    inviteSent: "Приглашение отправлено.",
    saved: "Изменения сохранены.",
    failed: "Не удалось выполнить действие.",
    addTitle: "Пригласить сотрудника",
    addText:
      "Укажите email. Timviz отправит приглашение, а сотрудник сам заполнит профиль после принятия.",
    fullName: "Имя и фамилия",
    role: "Должность",
    email: "Email",
    phone: "Телефон",
    sendInvite: "Приглашение уйдет на этот email.",
    createStaff: "Отправить приглашение",
    cancel: "Закрыть",
    placeholderEmail: "name@example.com",
    placeholderPhone: "+380...",
    noContact: "Данные не указаны",
    memberSince: "В команде с",
    bookings: "зап.",
    revenue: "Доход",
    accessState: {
      owner: "Владелец рабочего пространства",
      active: "Доступ в кабинет открыт",
      invited: "Приглашение отправлено",
      offline: "Нет доступа"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    accessTone: {
      owner: "owner",
      active: "active",
      invited: "invited",
      offline: "offline"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    roleFallback: "Сотрудник",
    emptySearch: "По этому запросу никого не нашли.",
    requestFrom: "Запрос от",
    inviteFrom: "Пригласил",
    inviteSentAt: "Отправлено",
    removeMember: "Удалить из команды",
    removeMemberConfirm: "Удалить сотрудника из команды? Его аккаунт останется самостоятельным.",
    removeMemberSuccess: "Сотрудник удалён из команды.",
    memberPageTitle: "Моя компания",
    memberPageText: "Здесь показана компания, к которой подключён ваш аккаунт.",
    memberCompanyEyebrow: "Текущая группа",
    memberCompanyTitle: "Вы в группе",
    memberCompanyRole: "Роль",
    memberCompanyJoined: "В компании с",
    leaveCompany: "Выйти из компании",
    leaveCompanyConfirm: "Выйти из этой компании? Доступ к рабочему кабинету будет закрыт.",
    leaveCompanySuccess: "Вы вышли из компании."
  },
  uk: {
    sectionTitle: "Команда",
    people: "Учасники команди",
    schedule: "Графік змін",
    pageTitle: "Учасники команди",
    pageText:
      "Запрошуйте співробітників за email, керуйте учасниками команди та їхнім графіком.",
    add: "Запросити",
    search: "Пошук учасників команди",
    name: "Ім'я",
    contacts: "Контактні дані",
    access: "Роль доступу",
    stats: "Статистика",
    actions: "Дії",
    edit: "Змінити",
    openSchedule: "Подивитися графік",
    invite: "Надіслати запрошення",
    resendInvite: "Надіслати повторно",
    addEmail: "Додати email",
    revokeInvite: "Відкликати запрошення",
    pendingInvites: "Надіслані запрошення",
    joinRequests: "Запити на приєднання",
    incomingInvites: "Отримані запрошення",
    noIncomingInvites: "Вас поки ніхто не запросив.",
    noInvites: "Ви поки нікого не запросили.",
    noJoinRequests: "Нових запитів поки немає.",
    approve: "Підтвердити",
    reject: "Відхилити",
    decline: "Відхилити",
    inviteSent: "Запрошення надіслано.",
    saved: "Зміни збережено.",
    failed: "Не вдалося виконати дію.",
    addTitle: "Запросити співробітника",
    addText:
      "Вкажіть email. Timviz надішле запрошення, а співробітник сам заповнить профіль після прийняття.",
    fullName: "Ім'я та прізвище",
    role: "Посада",
    email: "Email",
    phone: "Телефон",
    sendInvite: "Запрошення піде на цей email.",
    createStaff: "Надіслати запрошення",
    cancel: "Закрити",
    placeholderEmail: "name@example.com",
    placeholderPhone: "+380...",
    noContact: "Дані не вказані",
    memberSince: "У команді з",
    bookings: "зап.",
    revenue: "Дохід",
    accessState: {
      owner: "Власник робочого простору",
      active: "Доступ до кабінету відкрито",
      invited: "Запрошення надіслано",
      offline: "Немає доступу"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    accessTone: {
      owner: "owner",
      active: "active",
      invited: "invited",
      offline: "offline"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    roleFallback: "Співробітник",
    emptySearch: "За цим запитом нікого не знайдено.",
    requestFrom: "Запит від",
    inviteFrom: "Запросив",
    inviteSentAt: "Надіслано",
    removeMember: "Видалити з команди",
    removeMemberConfirm: "Видалити співробітника з команди? Його акаунт залишиться самостійним.",
    removeMemberSuccess: "Співробітника видалено з команди.",
    memberPageTitle: "Моя компанія",
    memberPageText: "Тут показана компанія, до якої підключено ваш акаунт.",
    memberCompanyEyebrow: "Поточна група",
    memberCompanyTitle: "Ви в групі",
    memberCompanyRole: "Роль",
    memberCompanyJoined: "У компанії з",
    leaveCompany: "Вийти з компанії",
    leaveCompanyConfirm: "Вийти з цієї компанії? Доступ до робочого кабінету буде закрито.",
    leaveCompanySuccess: "Ви вийшли з компанії."
  },
  en: {
    sectionTitle: "Team",
    people: "Team members",
    schedule: "Shift schedule",
    pageTitle: "Team members",
    pageText:
      "Invite employees by email, manage team members and their schedules.",
    add: "Invite",
    search: "Search team members",
    name: "Name",
    contacts: "Contact details",
    access: "Access role",
    stats: "Stats",
    actions: "Actions",
    edit: "Edit",
    openSchedule: "Open schedule",
    invite: "Send invitation",
    resendInvite: "Resend invitation",
    addEmail: "Add email",
    revokeInvite: "Revoke invitation",
    pendingInvites: "Sent invitations",
    joinRequests: "Join requests",
    incomingInvites: "Received invitations",
    noIncomingInvites: "No one has invited you yet.",
    noInvites: "You have not invited anyone yet.",
    noJoinRequests: "No new requests yet.",
    approve: "Approve",
    reject: "Reject",
    decline: "Decline",
    inviteSent: "Invitation sent.",
    saved: "Changes saved.",
    failed: "Could not complete the action.",
    addTitle: "Invite employee",
    addText:
      "Enter an email. Timviz will send an invitation, and the employee will fill in their profile after accepting.",
    fullName: "Full name",
    role: "Role",
    email: "Email",
    phone: "Phone",
    sendInvite: "The invitation will be sent to this email.",
    createStaff: "Send invitation",
    cancel: "Close",
    placeholderEmail: "name@example.com",
    placeholderPhone: "+1...",
    noContact: "No details yet",
    memberSince: "In team since",
    bookings: "book.",
    revenue: "Revenue",
    accessState: {
      owner: "Workspace owner",
      active: "Workspace access enabled",
      invited: "Invitation sent",
      offline: "No access"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    accessTone: {
      owner: "owner",
      active: "active",
      invited: "invited",
      offline: "offline"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    roleFallback: "Employee",
    emptySearch: "No one matched this search.",
    requestFrom: "Request from",
    inviteFrom: "Invited by",
    inviteSentAt: "Sent",
    removeMember: "Remove from team",
    removeMemberConfirm: "Remove this employee from the team? Their account will remain standalone.",
    removeMemberSuccess: "Employee removed from the team.",
    memberPageTitle: "My company",
    memberPageText: "This is the company connected to your account.",
    memberCompanyEyebrow: "Current group",
    memberCompanyTitle: "You are in",
    memberCompanyRole: "Role",
    memberCompanyJoined: "In company since",
    leaveCompany: "Leave company",
    leaveCompanyConfirm: "Leave this company? Workspace access will be closed.",
    leaveCompanySuccess: "You left the company."
  },
  fr: {
    sectionTitle: "Équipe",
    people: "Membres de l’équipe",
    schedule: "Planning d’équipe",
    pageTitle: "Membres de l’équipe",
    pageText: "Invitez des employés par e-mail, gérez l’équipe et ses horaires.",
    add: "Inviter",
    search: "Rechercher dans l’équipe",
    name: "Nom",
    contacts: "Coordonnées",
    access: "Rôle d’accès",
    stats: "Statistiques",
    actions: "Actions",
    edit: "Modifier",
    openSchedule: "Ouvrir le planning",
    invite: "Envoyer une invitation",
    resendInvite: "Renvoyer l’invitation",
    addEmail: "Ajouter un e-mail",
    revokeInvite: "Révoquer l’invitation",
    pendingInvites: "Invitations envoyées",
    joinRequests: "Demandes d’accès",
    incomingInvites: "Invitations reçues",
    noIncomingInvites: "Personne ne vous a encore invité.",
    noInvites: "Vous n’avez encore invité personne.",
    noJoinRequests: "Aucune nouvelle demande.",
    approve: "Approuver",
    reject: "Refuser",
    decline: "Refuser",
    inviteSent: "Invitation envoyée.",
    saved: "Modifications enregistrées.",
    failed: "Impossible d’effectuer l’action.",
    addTitle: "Inviter un employé",
    addText: "Indiquez un e-mail. Timviz enverra l’invitation, puis l’employé complétera son profil.",
    fullName: "Nom complet",
    role: "Rôle",
    email: "E-mail",
    phone: "Téléphone",
    sendInvite: "L’invitation sera envoyée à cet e-mail.",
    createStaff: "Envoyer l’invitation",
    cancel: "Fermer",
    placeholderEmail: "name@example.com",
    placeholderPhone: "+33...",
    noContact: "Aucune donnée",
    memberSince: "Dans l’équipe depuis",
    bookings: "rés.",
    revenue: "Revenu",
    accessState: { owner: "Propriétaire", active: "Accès activé", invited: "Invitation envoyée", offline: "Pas d’accès" } satisfies Record<StaffMemberWorkspaceAccess, string>,
    accessTone: { owner: "owner", active: "active", invited: "invited", offline: "offline" } satisfies Record<StaffMemberWorkspaceAccess, string>,
    roleFallback: "Employé",
    emptySearch: "Aucun résultat pour cette recherche.",
    requestFrom: "Demande de",
    inviteFrom: "Invité par",
    inviteSentAt: "Envoyé",
    removeMember: "Retirer de l’équipe",
    removeMemberConfirm: "Retirer cet employé de l’équipe ? Son compte restera autonome.",
    removeMemberSuccess: "Employé retiré de l’équipe.",
    memberPageTitle: "Mon entreprise",
    memberPageText: "Voici l’entreprise connectée à votre compte.",
    memberCompanyEyebrow: "Groupe actuel",
    memberCompanyTitle: "Vous êtes dans",
    memberCompanyRole: "Rôle",
    memberCompanyJoined: "Dans l’entreprise depuis",
    leaveCompany: "Quitter l’entreprise",
    leaveCompanyConfirm: "Quitter cette entreprise ? L’accès au cabinet sera fermé.",
    leaveCompanySuccess: "Vous avez quitté l’entreprise."
  },
  pl: {
    sectionTitle: "Zespół",
    people: "Członkowie zespołu",
    schedule: "Grafik zmian",
    pageTitle: "Członkowie zespołu",
    pageText: "Zapraszaj pracowników e-mailem, zarządzaj zespołem i grafikami.",
    add: "Zaproś",
    search: "Szukaj członków zespołu",
    name: "Imię",
    contacts: "Dane kontaktowe",
    access: "Rola dostępu",
    stats: "Statystyki",
    actions: "Działania",
    edit: "Edytuj",
    openSchedule: "Otwórz grafik",
    invite: "Wyślij zaproszenie",
    resendInvite: "Wyślij ponownie",
    addEmail: "Dodaj e-mail",
    revokeInvite: "Cofnij zaproszenie",
    pendingInvites: "Wysłane zaproszenia",
    joinRequests: "Prośby o dołączenie",
    incomingInvites: "Otrzymane zaproszenia",
    noIncomingInvites: "Nikt jeszcze Cię nie zaprosił.",
    noInvites: "Nie zaproszono jeszcze nikogo.",
    noJoinRequests: "Brak nowych próśb.",
    approve: "Zatwierdź",
    reject: "Odrzuć",
    decline: "Odrzuć",
    inviteSent: "Zaproszenie wysłane.",
    saved: "Zmiany zapisane.",
    failed: "Nie udało się wykonać akcji.",
    addTitle: "Zaproś pracownika",
    addText: "Podaj e-mail. Timviz wyśle zaproszenie, a pracownik uzupełni profil po akceptacji.",
    fullName: "Imię i nazwisko",
    role: "Rola",
    email: "E-mail",
    phone: "Telefon",
    sendInvite: "Zaproszenie zostanie wysłane na ten e-mail.",
    createStaff: "Wyślij zaproszenie",
    cancel: "Zamknij",
    placeholderEmail: "name@example.com",
    placeholderPhone: "+48...",
    noContact: "Brak danych",
    memberSince: "W zespole od",
    bookings: "rez.",
    revenue: "Przychód",
    accessState: { owner: "Właściciel przestrzeni", active: "Dostęp aktywny", invited: "Zaproszenie wysłane", offline: "Brak dostępu" } satisfies Record<StaffMemberWorkspaceAccess, string>,
    accessTone: { owner: "owner", active: "active", invited: "invited", offline: "offline" } satisfies Record<StaffMemberWorkspaceAccess, string>,
    roleFallback: "Pracownik",
    emptySearch: "Nikogo nie znaleziono.",
    requestFrom: "Prośba od",
    inviteFrom: "Zaprosił",
    inviteSentAt: "Wysłano",
    removeMember: "Usuń z zespołu",
    removeMemberConfirm: "Usunąć pracownika z zespołu? Konto pozostanie samodzielne.",
    removeMemberSuccess: "Pracownik usunięty z zespołu.",
    memberPageTitle: "Moja firma",
    memberPageText: "Tutaj pokazana jest firma połączona z Twoim kontem.",
    memberCompanyEyebrow: "Aktualna grupa",
    memberCompanyTitle: "Jesteś w",
    memberCompanyRole: "Rola",
    memberCompanyJoined: "W firmie od",
    leaveCompany: "Opuść firmę",
    leaveCompanyConfirm: "Opuścić tę firmę? Dostęp do gabinetu zostanie zamknięty.",
    leaveCompanySuccess: "Opuściłeś firmę."
  },
  cs: {
    sectionTitle: "Tým",
    people: "Členové týmu",
    schedule: "Rozvrh směn",
    pageTitle: "Členové týmu",
    pageText: "Zvát zaměstnance e-mailem, spravovat členy týmu a jejich rozvrhy.",
    add: "Pozvat",
    search: "Hledat členy týmu",
    edit: "Upravit",
    invite: "Poslat pozvánku",
    pendingInvites: "Odeslané pozvánky",
    joinRequests: "Žádosti o připojení",
    approve: "Schválit",
    reject: "Odmítnout",
    saved: "Změny uloženy.",
    failed: "Akci se nepodařilo dokončit.",
    roleFallback: "Zaměstnanec",
    accessState: { owner: "Vlastník prostoru", active: "Přístup aktivní", invited: "Pozvánka odeslána", offline: "Bez přístupu" } satisfies Record<StaffMemberWorkspaceAccess, string>,
    accessTone: { owner: "owner", active: "active", invited: "invited", offline: "offline" } satisfies Record<StaffMemberWorkspaceAccess, string>
  },
  es: {
    sectionTitle: "Equipo",
    people: "Miembros del equipo",
    schedule: "Horario de turnos",
    pageTitle: "Miembros del equipo",
    pageText: "Invita empleados por email, gestiona el equipo y sus horarios.",
    add: "Invitar",
    search: "Buscar miembros del equipo",
    edit: "Editar",
    invite: "Enviar invitación",
    pendingInvites: "Invitaciones enviadas",
    joinRequests: "Solicitudes de acceso",
    approve: "Aprobar",
    reject: "Rechazar",
    saved: "Cambios guardados.",
    failed: "No se pudo completar la acción.",
    roleFallback: "Empleado",
    accessState: { owner: "Propietario del espacio", active: "Acceso activado", invited: "Invitación enviada", offline: "Sin acceso" } satisfies Record<StaffMemberWorkspaceAccess, string>,
    accessTone: { owner: "owner", active: "active", invited: "invited", offline: "offline" } satisfies Record<StaffMemberWorkspaceAccess, string>
  },
  de: {
    sectionTitle: "Team",
    people: "Teammitglieder",
    schedule: "Schichtplan",
    pageTitle: "Teammitglieder",
    pageText: "Lade Mitarbeiter per E-Mail ein und verwalte Team und Zeitpläne.",
    add: "Einladen",
    search: "Teammitglieder suchen",
    edit: "Bearbeiten",
    invite: "Einladung senden",
    pendingInvites: "Gesendete Einladungen",
    joinRequests: "Beitrittsanfragen",
    approve: "Bestätigen",
    reject: "Ablehnen",
    saved: "Änderungen gespeichert.",
    failed: "Aktion konnte nicht abgeschlossen werden.",
    roleFallback: "Mitarbeiter",
    accessState: { owner: "Arbeitsbereich-Inhaber", active: "Zugriff aktiviert", invited: "Einladung gesendet", offline: "Kein Zugriff" } satisfies Record<StaffMemberWorkspaceAccess, string>,
    accessTone: { owner: "owner", active: "active", invited: "invited", offline: "offline" } satisfies Record<StaffMemberWorkspaceAccess, string>
  }
} as const;

type StaffCopy = typeof staffText.en;

function getLocale(language: ProLanguage) {
  return localeBySiteLanguage[language];
}

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatMoney(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function makeInitials(member: StaffMemberSnapshot) {
  const initials = `${member.professional.firstName?.[0] ?? ""}${member.professional.lastName?.[0] ?? ""}`.trim();
  return (initials || member.professional.email[0] || "S").toUpperCase();
}

function renderContact(member: StaffMemberSnapshot, copy: StaffCopy) {
  const values = [member.professional.email, member.professional.phone].filter(Boolean);
  return values.length ? values : [copy.noContact];
}

function renderStats(member: StaffMemberSnapshot, locale: string, currency: string, copy: StaffCopy) {
  return `${member.stats.totalBookings} ${copy.bookings} · ${formatMoney(member.stats.revenue, locale, currency)}`;
}

function StaffRowActions({
  member,
  copy,
  open,
  anchorEl,
  onToggle,
  onClose,
  onInvite,
  onRevoke,
  onRemove
}: {
  member: StaffMemberSnapshot;
  copy: StaffCopy;
  open: boolean;
  anchorEl: HTMLElement | null;
  onToggle: (anchorEl: HTMLElement) => void;
  onClose: () => void;
  onInvite: (member: StaffMemberSnapshot) => void;
  onRevoke: (member: StaffMemberSnapshot) => void;
  onRemove: (member: StaffMemberSnapshot) => void;
}) {
  const canInvite = Boolean(member.professional.email);
  const canRemove = member.membership.scope !== "owner";

  return (
    <div
      className={`${styles.staffControlMenuWrap} ${open ? styles.staffControlMenuWrapOpen : ""}`}
      data-staff-row-menu-root
    >
      <button
        type="button"
        className={styles.staffRowActionButton}
        onClick={(event) => onToggle(event.currentTarget)}
      >
        {copy.actions}
        <span aria-hidden="true">⌄</span>
      </button>

      <FloatingPopover
        open={open}
        anchorEl={anchorEl}
        className={styles.staffControlMenu}
        placement="bottom-end"
      >
          <Link href={`/pro/staff/${member.professional.id}`} className={styles.staffControlMenuItem} onClick={onClose}>
            {copy.edit}
          </Link>
          <Link
            href="/pro/staff/schedule"
            className={styles.staffControlMenuItem}
            onClick={onClose}
          >
            {copy.openSchedule}
          </Link>
          <button
            type="button"
            className={styles.staffControlMenuItem}
            onClick={() => {
              onClose();
              onInvite(member);
            }}
          >
            {canInvite
              ? member.pendingInvitation
                ? copy.resendInvite
                : copy.invite
              : copy.addEmail}
          </button>
          {member.pendingInvitation ? (
            <button
              type="button"
              className={`${styles.staffControlMenuItem} ${styles.staffControlMenuDanger}`}
              onClick={() => {
                onClose();
                onRevoke(member);
              }}
            >
              {copy.revokeInvite}
            </button>
          ) : null}
          {canRemove ? (
            <button
              type="button"
              className={`${styles.staffControlMenuItem} ${styles.staffControlMenuDanger}`}
              onClick={() => {
                onClose();
                onRemove(member);
              }}
            >
              {copy.removeMember}
            </button>
          ) : null}
      </FloatingPopover>
    </div>
  );
}

function PendingInvitationCard({
  invitation,
  copy,
  locale,
  onRevoke
}: {
  invitation: PendingStaffInvitationSnapshot;
  copy: StaffCopy;
  locale: string;
  onRevoke: (invitationId: string) => void;
}) {
  return (
    <article className={styles.staffSideCard}>
      <div>
        <strong>{invitation.email}</strong>
        <span>{`${copy.inviteSentAt}: ${formatDate(invitation.createdAt, locale)}`}</span>
      </div>
      <button type="button" className={styles.staffSecondaryButton} onClick={() => onRevoke(invitation.id)}>
        {copy.revokeInvite}
      </button>
    </article>
  );
}

export default function StaffView({ professionalId, snapshot, canManageStaff = true, initialAddOpen = false, onboardingCta, header }: StaffViewProps) {
  const router = useRouter();
  const { language } = useProLanguage();
  const copy = {
    ...staffText.en,
    ...((staffText as unknown as Record<string, Partial<StaffCopy>>)[language] ?? {})
  } as StaffCopy;
  const locale = getLocale(language);
  const [staffSnapshot, setStaffSnapshot] = useState(snapshot);
  const [query, setQuery] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(initialAddOpen);
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<StaffActionMenuState | null>(null);

  useEffect(() => {
    setStaffSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    function closeMenus() {
      setActiveActionMenu(null);
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-staff-floating-root]")) {
        return;
      }

      closeMenus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return staffSnapshot.members;
    }

    return staffSnapshot.members.filter((member) =>
      [
        member.professional.firstName,
        member.professional.lastName,
        member.professional.email,
        member.professional.phone,
        member.membership.role,
        copy.accessState[member.workspaceAccess]
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [copy.accessState, query, staffSnapshot.members]);

  async function refreshAfter(request: Promise<Response>, successText: string = copy.saved, onSuccess?: () => void) {
    try {
      const response = await request;
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusText(String(payload.error || copy.failed));
        return;
      }

      onSuccess?.();
      setStatusText(successText);
      window.dispatchEvent(new CustomEvent("rezervo-pro-notifications-refresh"));
      router.refresh();
    } catch {
      setStatusText(copy.failed);
    }
  }

  async function handleCreateStaff() {
    if (!email.trim()) {
      return;
    }

    setIsSaving(true);
    await refreshAfter(
      fetch("/api/pro/staff/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email
        })
      }),
      copy.inviteSent
    );
    setIsSaving(false);
    setEmail("");
    setIsAddOpen(false);
  }

  async function handleInvite(member: StaffMemberSnapshot) {
    if (!member.professional.email) {
      router.push(`/pro/staff/${member.professional.id}`);
      return;
    }

    await refreshAfter(
      fetch("/api/pro/staff/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          memberProfessionalId: member.professional.id,
          email: member.professional.email,
          role: member.membership.role
        })
      }),
      copy.inviteSent
    );
  }

  async function handleRevokeInviteById(invitationId: string) {
    await refreshAfter(
      fetch(`/api/pro/staff/invitations?invitationId=${encodeURIComponent(invitationId)}`, {
        method: "DELETE"
      }),
      copy.saved,
      () => {
        setStaffSnapshot((current) => ({
          ...current,
          summary: {
            ...current.summary,
            pendingInvitations: Math.max(0, current.summary.pendingInvitations - 1)
          },
          invitations: current.invitations.filter((invitation) => invitation.id !== invitationId),
          members: current.members.map((member) =>
            member.pendingInvitation?.id === invitationId
              ? {
                  ...member,
                  workspaceAccess: member.workspaceAccess === "invited" ? "offline" : member.workspaceAccess,
                  pendingInvitation: null
                }
              : member
          )
        }));
      }
    );
  }

  async function handleRevokeInvite(member: StaffMemberSnapshot) {
    if (!member.pendingInvitation) {
      return;
    }

    await handleRevokeInviteById(member.pendingInvitation.id);
  }

  async function handleRemoveMember(member: StaffMemberSnapshot) {
    if (member.membership.scope === "owner") {
      return;
    }

    if (typeof window !== "undefined" && !window.confirm(copy.removeMemberConfirm)) {
      return;
    }

    await refreshAfter(
      fetch(`/api/pro/staff/members/${encodeURIComponent(member.professional.id)}`, {
        method: "DELETE"
      }),
      copy.removeMemberSuccess,
      () => {
        setStaffSnapshot((current) => ({
          ...current,
          summary: {
            ...current.summary,
            totalPeople: Math.max(0, current.summary.totalPeople - 1),
            activeEmployees: Math.max(0, current.summary.activeEmployees - 1)
          },
          members: current.members.filter((item) => item.professional.id !== member.professional.id),
          invitations: current.invitations.filter((invitation) => invitation.email !== member.professional.email)
        }));
      }
    );
  }

  async function handleIncomingInvitation(invitationId: string, action: "accept" | "decline") {
    await refreshAfter(
      fetch("/api/pro/staff/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ invitationId, action })
      }),
      action === "accept" ? copy.saved : copy.saved
    );
  }

  async function handleLeaveCompany(businessId?: string) {
    if (isLeaving) {
      return;
    }

    if (typeof window !== "undefined" && !window.confirm(copy.leaveCompanyConfirm)) {
      return;
    }

    setIsLeaving(true);
    try {
      const target = businessId ? `?businessId=${encodeURIComponent(businessId)}` : "";
      const response = await fetch(`/api/pro/staff/membership${target}`, {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusText(String(payload.error || copy.failed));
        return;
      }

      setStatusText(copy.leaveCompanySuccess);
      window.dispatchEvent(new CustomEvent("rezervo-pro-notifications-refresh"));
      if (!canManageStaff && (!businessId || businessId === staffSnapshot.business.id)) {
        router.replace("/pro/settings");
      }
      router.refresh();
    } catch {
      setStatusText(copy.failed);
    } finally {
      setIsLeaving(false);
    }
  }

  if (!canManageStaff) {
    const currentMember =
      staffSnapshot.members.find((member) => member.professional.id === professionalId) || null;
    const memberMemberships = staffSnapshot.myMemberships.filter((item) => item.membership.scope === "member");
    const visibleMemberships = memberMemberships.length
      ? memberMemberships
      : [
          {
            business: {
              id: staffSnapshot.business.id,
              name: staffSnapshot.business.name,
              address: ""
            },
            membership: {
              id: currentMember?.membership.id || "",
              role: currentMember?.membership.role || copy.roleFallback,
              scope: "member" as const,
              createdAt: currentMember?.membership.createdAt || new Date().toISOString()
            }
          }
        ];

    return (
      <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
        <ProSidebar active="staff" professionalId={professionalId} canManageStaff={canManageStaff} />

        <section className={styles.staffStudioShell}>
          <ProWorkspaceHeader
            businessName={staffSnapshot.business.name}
            viewerName={header.viewerName}
            viewerAvatarUrl={header.viewerAvatarUrl}
            viewerInitials={header.viewerInitials}
            isPremium={header.isPremium === true}
            publicBookingUrl={header.publicBookingUrl}
            publicBookingEnabled={header.publicBookingEnabled === true}
            canTogglePublicBooking={false}
            onboardingCta={onboardingCta}
          />

          <aside className={styles.staffStudioSidebar}>
            <div className={styles.staffStudioSidebarCard}>
              <strong>{copy.sectionTitle}</strong>
              <nav className={styles.staffStudioLocalNav}>
                <Link href="/pro/staff/members" className={`${styles.staffStudioLocalLink} ${styles.staffStudioLocalLinkActive}`}>
                  {copy.people}
                </Link>
              </nav>
            </div>
          </aside>

          <section className={styles.staffStudioMain}>
            <div className={styles.staffStudioHeader}>
              <div>
                <h1 className={styles.staffStudioTitle}>{copy.memberPageTitle}</h1>
                <p className={styles.staffStudioText}>{copy.memberPageText}</p>
              </div>
            </div>

            {statusText ? <div className={styles.staffStudioStatus}>{statusText}</div> : null}

            {visibleMemberships.map((item) => (
              <section key={`${item.business.id}:${item.membership.id}`} className={styles.staffMembershipCard}>
                <span className={styles.staffMembershipEyebrow}>{copy.memberCompanyEyebrow}</span>
                <h2>
                  {copy.memberCompanyTitle} <strong>{item.business.name}</strong>
                </h2>
                <dl className={styles.staffMembershipDetails}>
                  <div>
                    <dt>{copy.memberCompanyRole}</dt>
                    <dd>{item.membership.role || copy.roleFallback}</dd>
                  </div>
                  <div>
                    <dt>{copy.memberCompanyJoined}</dt>
                    <dd>{formatDate(item.membership.createdAt, locale)}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className={`${styles.staffSecondaryButton} ${styles.staffDangerButton}`}
                  onClick={() => void handleLeaveCompany(item.business.id)}
                  disabled={isLeaving}
                >
                  {isLeaving ? copy.saved : copy.leaveCompany}
                </button>
              </section>
            ))}

            <section className={styles.staffStudioPanel}>
              <div className={styles.staffStudioPanelHeader}>
                <h2>{copy.incomingInvites}</h2>
              </div>

              {staffSnapshot.incomingInvitations.length === 0 ? (
                <div className={styles.staffStudioEmpty}>{copy.noIncomingInvites}</div>
              ) : (
                <div className={styles.staffStudioSideList}>
                  {staffSnapshot.incomingInvitations.map((invitation) => (
                    <article key={invitation.id} className={styles.staffSideCard}>
                      <div>
                        <strong>{invitation.business.name}</strong>
                        <span>
                          {`${copy.inviteFrom}: ${
                            invitation.invitedBy
                              ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`.trim() ||
                                invitation.invitedBy.email
                              : invitation.email
                          }`}
                        </span>
                        <span>{`${copy.inviteSentAt}: ${formatDate(invitation.createdAt, locale)}`}</span>
                      </div>
                      <div className={styles.staffSideActions}>
                        <button
                          type="button"
                          className={styles.staffSecondaryButton}
                          onClick={() => void handleIncomingInvitation(invitation.id, "decline")}
                        >
                          {copy.decline}
                        </button>
                        <button
                          type="button"
                          className={styles.staffStudioPrimaryButton}
                          onClick={() => void handleIncomingInvitation(invitation.id, "accept")}
                        >
                          {copy.approve}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </section>
      </main>
    );
  }

  const joinedMemberships = staffSnapshot.myMemberships.filter((item) => item.membership.scope === "member");

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar active="staff" professionalId={professionalId} canManageStaff={canManageStaff} />

      <section className={styles.staffStudioShell}>
        <ProWorkspaceHeader
          businessName={staffSnapshot.business.name}
          viewerName={header.viewerName}
          viewerAvatarUrl={header.viewerAvatarUrl}
          viewerInitials={header.viewerInitials}
          isPremium={header.isPremium === true}
          publicBookingUrl={header.publicBookingUrl}
          publicBookingEnabled={header.publicBookingEnabled === true}
          canTogglePublicBooking
          onboardingCta={onboardingCta}
        />

        <aside className={styles.staffStudioSidebar}>
          <div className={styles.staffStudioSidebarCard}>
            <strong>{copy.sectionTitle}</strong>
            <nav className={styles.staffStudioLocalNav}>
              <Link href="/pro/staff/members" className={`${styles.staffStudioLocalLink} ${styles.staffStudioLocalLinkActive}`}>
                {copy.people}
              </Link>
              <Link href="/pro/staff/schedule" className={styles.staffStudioLocalLink}>
                {copy.schedule}
              </Link>
            </nav>
          </div>
        </aside>

        <section className={styles.staffStudioMain}>
          <div className={styles.staffStudioHeader}>
            <div>
              <div className={styles.staffStudioTitleRow}>
                <h1 className={styles.staffStudioTitle}>{copy.pageTitle}</h1>
                <span className={styles.staffStudioCount}>{staffSnapshot.members.length}</span>
              </div>
              <p className={styles.staffStudioText}>{copy.pageText}</p>
            </div>

            <div className={styles.staffStudioTopActions}>
              {canManageStaff ? (
                <button type="button" className={styles.staffStudioPrimaryButton} onClick={() => setIsAddOpen(true)}>
                  {copy.add}
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.staffStudioToolbar}>
            <label className={styles.staffStudioSearch}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.8" />
                <path d="m20 20-3.8-3.8" />
              </svg>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
            </label>
          </div>

          {statusText ? <div className={styles.staffStudioStatus}>{statusText}</div> : null}

          {joinedMemberships.length ? (
            <div className={styles.staffStudioSideList}>
              {joinedMemberships.map((item) => (
                <section key={`${item.business.id}:${item.membership.id}`} className={styles.staffMembershipCard}>
                  <span className={styles.staffMembershipEyebrow}>{copy.memberCompanyEyebrow}</span>
                  <h2>
                    {copy.memberCompanyTitle} <strong>{item.business.name}</strong>
                  </h2>
                  <dl className={styles.staffMembershipDetails}>
                    <div>
                      <dt>{copy.memberCompanyRole}</dt>
                      <dd>{item.membership.role || copy.roleFallback}</dd>
                    </div>
                    <div>
                      <dt>{copy.memberCompanyJoined}</dt>
                      <dd>{formatDate(item.membership.createdAt, locale)}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className={`${styles.staffSecondaryButton} ${styles.staffDangerButton}`}
                    onClick={() => void handleLeaveCompany(item.business.id)}
                    disabled={isLeaving}
                  >
                    {isLeaving ? copy.saved : copy.leaveCompany}
                  </button>
                </section>
              ))}
            </div>
          ) : null}

          <section className={styles.staffStudioTable}>
            <div className={styles.staffStudioTableHead}>
              <span>{copy.name}</span>
              <span>{copy.contacts}</span>
              <span>{copy.access}</span>
              <span>{copy.stats}</span>
              <span>{copy.actions}</span>
            </div>

            <div className={styles.staffStudioRows}>
              {filteredMembers.length === 0 ? (
                <div className={styles.staffStudioEmpty}>{copy.emptySearch}</div>
              ) : (
                filteredMembers.map((member) => (
                  <article key={member.professional.id} className={styles.staffStudioRow}>
                    <div className={styles.staffStudioNameCell}>
                      <ProfileAvatar
                        avatarUrl={member.professional.avatarUrl}
                        initials={makeInitials(member)}
                        label={`${member.professional.firstName} ${member.professional.lastName}`.trim() || member.professional.email}
                        className={styles.clientAvatar}
                        imageClassName={styles.avatarImage}
                        fallbackClassName={styles.avatarFallback}
                      />
                      <div className={styles.staffStudioIdentity}>
                        <strong>
                          {`${member.professional.firstName} ${member.professional.lastName}`.trim() ||
                            member.professional.email}
                        </strong>
                        <span>{member.membership.role || copy.roleFallback}</span>
                        <small>{`${copy.memberSince}: ${formatDate(member.membership.createdAt, locale)}`}</small>
                      </div>
                    </div>

                    <div className={styles.staffStudioContactCell}>
                      <span className={styles.staffStudioMobileLabel}>{copy.contacts}</span>
                      {renderContact(member, copy).map((value) => (
                        <span key={`${member.professional.id}-${value}`}>{value}</span>
                      ))}
                    </div>

                    <div className={styles.staffStudioAccessCell}>
                      <span className={styles.staffStudioMobileLabel}>{copy.access}</span>
                      <span
                        className={`${styles.staffStudioAccessBadge} ${
                          styles[`staffStudioAccessBadge${copy.accessTone[member.workspaceAccess][0].toUpperCase()}${copy.accessTone[member.workspaceAccess].slice(1)}`]
                        }`}
                      >
                        {copy.accessState[member.workspaceAccess]}
                      </span>
                    </div>

                    <div className={styles.staffStudioStatsCell}>
                      <span className={styles.staffStudioMobileLabel}>{copy.stats}</span>
                      {renderStats(member, locale, staffSnapshot.business.currency, copy)}
                    </div>

                    <div
                      className={`${styles.staffStudioActionCell} ${
                        activeActionMenu?.memberId === member.professional.id ? styles.staffStudioActionCellOpen : ""
                      }`}
                    >
                      <span className={styles.staffStudioMobileLabel}>{copy.actions}</span>
                      {canManageStaff ? (
                        <StaffRowActions
                          member={member}
                          copy={copy}
                          open={activeActionMenu?.memberId === member.professional.id}
                          anchorEl={activeActionMenu?.memberId === member.professional.id ? activeActionMenu.anchorEl : null}
                          onToggle={(anchorEl) =>
                            setActiveActionMenu((current) =>
                              current?.memberId === member.professional.id ? null : { memberId: member.professional.id, anchorEl }
                            )
                          }
                          onClose={() => setActiveActionMenu(null)}
                          onInvite={handleInvite}
                          onRevoke={handleRevokeInvite}
                          onRemove={handleRemoveMember}
                        />
                      ) : (
                        <span className={styles.staffStudioAccessBadge}>{copy.accessState[member.workspaceAccess]}</span>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <div className={styles.staffStudioBottomGrid}>
            <section className={styles.staffStudioPanel}>
              <div className={styles.staffStudioPanelHeader}>
                <h2>{copy.incomingInvites}</h2>
              </div>

              {staffSnapshot.incomingInvitations.length === 0 ? (
                <div className={styles.staffStudioEmpty}>{copy.noIncomingInvites}</div>
              ) : (
                <div className={styles.staffStudioSideList}>
                  {staffSnapshot.incomingInvitations.map((invitation) => (
                    <article key={invitation.id} className={styles.staffSideCard}>
                      <div>
                        <strong>{invitation.business.name}</strong>
                        <p>{invitation.role || copy.roleFallback}</p>
                        <span>
                          {`${copy.inviteFrom}: ${
                            invitation.invitedBy
                              ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`.trim() ||
                                invitation.invitedBy.email
                              : invitation.email
                          }`}
                        </span>
                        <span>{`${copy.inviteSentAt}: ${formatDate(invitation.createdAt, locale)}`}</span>
                      </div>
                      <div className={styles.staffSideActions}>
                        <button
                          type="button"
                          className={styles.staffSecondaryButton}
                          onClick={() => void handleIncomingInvitation(invitation.id, "decline")}
                        >
                          {copy.decline}
                        </button>
                        <button
                          type="button"
                          className={styles.staffStudioPrimaryButton}
                          onClick={() => void handleIncomingInvitation(invitation.id, "accept")}
                        >
                          {copy.approve}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {canManageStaff ? (
            <section className={styles.staffStudioPanel}>
              <div className={styles.staffStudioPanelHeader}>
                <h2>{copy.pendingInvites}</h2>
              </div>

              {staffSnapshot.invitations.length === 0 ? (
                <div className={styles.staffStudioEmpty}>{copy.noInvites}</div>
              ) : (
                <div className={styles.staffStudioSideList}>
                  {staffSnapshot.invitations.map((invitation) => (
                    <PendingInvitationCard
                      key={invitation.id}
                      invitation={invitation}
                      copy={copy}
                      locale={locale}
                      onRevoke={handleRevokeInviteById}
                    />
                  ))}
                </div>
              )}
            </section>
            ) : null}
          </div>
        </section>
      </section>

      {isAddOpen ? (
        <div className={styles.staffDrawerBackdrop} onClick={() => setIsAddOpen(false)}>
          <aside className={styles.staffDrawer} onClick={(event) => event.stopPropagation()}>
            <div className={styles.staffDrawerHeader}>
              <div>
                <h2>{copy.addTitle}</h2>
                <p>{copy.addText}</p>
              </div>
              <button type="button" className={styles.staffDrawerClose} onClick={() => setIsAddOpen(false)}>
                ×
              </button>
            </div>

            <div className={styles.staffDrawerForm}>
              <label className={styles.staffDrawerField}>
                <span>{copy.email}</span>
                <input
                  className={styles.input}
                  type="email"
                  placeholder={copy.placeholderEmail}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <div className={styles.staffStudioNotice}>{copy.sendInvite}</div>
            </div>

            <div className={styles.staffDrawerActions}>
              <button type="button" className={styles.staffStudioGhostButton} onClick={() => setIsAddOpen(false)}>
                {copy.cancel}
              </button>
              <button
                type="button"
                className={styles.staffStudioPrimaryButton}
                onClick={() => void handleCreateStaff()}
                disabled={!email.trim() || isSaving}
              >
                {copy.createStaff}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
