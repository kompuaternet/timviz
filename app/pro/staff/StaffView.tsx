"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "../../ProfileAvatar";
import ProSidebar from "../ProSidebar";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
import type {
  BusinessStaffSnapshot,
  PendingStaffInvitationSnapshot,
  StaffMemberSnapshot,
  StaffMemberWorkspaceAccess
} from "../../../lib/pro-staff";

type StaffViewProps = {
  professionalId: string;
  snapshot: BusinessStaffSnapshot;
  initialAddOpen?: boolean;
};

const staffText = {
  ru: {
    sectionTitle: "Команда",
    people: "Участники команды",
    schedule: "График смен",
    pageTitle: "Участники команды",
    pageText:
      "Добавляйте сотрудников вручную, редактируйте их профиль и график, а доступ в кабинет выдавайте отдельным приглашением на email.",
    add: "Добавить",
    options: "Варианты",
    search: "Поиск участников команды",
    filterHint: "Вход в кабинет отправляется по приглашению. Без приглашения сотрудник остаётся в команде и участвует в графике.",
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
    pendingInvites: "Приглашения",
    joinRequests: "Запросы на присоединение",
    noInvites: "Активных приглашений пока нет.",
    noJoinRequests: "Новых запросов пока нет.",
    approve: "Подтвердить",
    reject: "Отклонить",
    inviteSent: "Приглашение отправлено.",
    saved: "Изменения сохранены.",
    failed: "Не удалось выполнить действие.",
    addTitle: "Добавить сотрудника",
    addText:
      "Сотрудника можно сразу добавить в команду и настроить ему график. Доступ в кабинет включается отдельным приглашением.",
    fullName: "Имя и фамилия",
    role: "Должность",
    email: "Email",
    phone: "Телефон",
    sendInvite: "Сразу отправить приглашение в кабинет",
    createStaff: "Добавить сотрудника",
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
    inviteFrom: "Приглашение от"
  },
  uk: {
    sectionTitle: "Команда",
    people: "Учасники команди",
    schedule: "Графік змін",
    pageTitle: "Учасники команди",
    pageText:
      "Додавайте співробітників вручну, редагуйте їхній профіль і графік, а доступ до кабінету видавайте окремим запрошенням на email.",
    add: "Додати",
    options: "Варіанти",
    search: "Пошук учасників команди",
    filterHint: "Вхід до кабінету надсилається окремим запрошенням. Без нього співробітник лишається в команді та бере участь у графіку.",
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
    pendingInvites: "Запрошення",
    joinRequests: "Запити на приєднання",
    noInvites: "Активних запрошень поки немає.",
    noJoinRequests: "Нових запитів поки немає.",
    approve: "Підтвердити",
    reject: "Відхилити",
    inviteSent: "Запрошення надіслано.",
    saved: "Зміни збережено.",
    failed: "Не вдалося виконати дію.",
    addTitle: "Додати співробітника",
    addText:
      "Співробітника можна одразу додати до команди й налаштувати йому графік. Доступ до кабінету вмикається окремим запрошенням.",
    fullName: "Ім'я та прізвище",
    role: "Посада",
    email: "Email",
    phone: "Телефон",
    sendInvite: "Одразу надіслати запрошення до кабінету",
    createStaff: "Додати співробітника",
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
    inviteFrom: "Запрошення від"
  },
  en: {
    sectionTitle: "Team",
    people: "Team members",
    schedule: "Shift schedule",
    pageTitle: "Team members",
    pageText:
      "Add employees manually, manage their profile and schedule, and only send workspace access when you are ready.",
    add: "Add",
    options: "Options",
    search: "Search team members",
    filterHint: "Workspace access is sent separately by email invitation. Without it, the employee still stays in the team and schedule.",
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
    pendingInvites: "Invitations",
    joinRequests: "Join requests",
    noInvites: "No active invitations yet.",
    noJoinRequests: "No new requests yet.",
    approve: "Approve",
    reject: "Reject",
    inviteSent: "Invitation sent.",
    saved: "Changes saved.",
    failed: "Could not complete the action.",
    addTitle: "Add employee",
    addText:
      "You can add an employee to the team right away and set their schedule first. Workspace access is enabled by a separate invitation.",
    fullName: "Full name",
    role: "Role",
    email: "Email",
    phone: "Phone",
    sendInvite: "Send workspace invitation now",
    createStaff: "Add employee",
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
    inviteFrom: "Invitation from"
  }
} as const;

type StaffCopy = (typeof staffText)[keyof typeof staffText];

function getLocale(language: "ru" | "uk" | "en") {
  if (language === "uk") return "uk-UA";
  if (language === "en") return "en-US";
  return "ru-RU";
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

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ")
  };
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
  onInvite,
  onRevoke
}: {
  member: StaffMemberSnapshot;
  copy: StaffCopy;
  onInvite: (member: StaffMemberSnapshot) => void;
  onRevoke: (member: StaffMemberSnapshot) => void;
}) {
  const [open, setOpen] = useState(false);
  const canInvite = Boolean(member.professional.email);

  return (
    <div className={styles.staffControlMenuWrap}>
      <button
        type="button"
        className={styles.staffRowActionButton}
        onClick={() => setOpen((value) => !value)}
      >
        {copy.actions}
        <span aria-hidden="true">⌄</span>
      </button>

      {open ? (
        <div className={styles.staffControlMenu}>
          <Link href={`/pro/staff/${member.professional.id}`} className={styles.staffControlMenuItem}>
            {copy.edit}
          </Link>
          <Link
            href={`/pro/staff/${member.professional.id}?tab=schedule`}
            className={styles.staffControlMenuItem}
          >
            {copy.openSchedule}
          </Link>
          <button
            type="button"
            className={styles.staffControlMenuItem}
            onClick={() => {
              setOpen(false);
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
                setOpen(false);
                onRevoke(member);
              }}
            >
              {copy.revokeInvite}
            </button>
          ) : null}
        </div>
      ) : null}
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
        <p>{invitation.role || copy.roleFallback}</p>
        <span>{`${copy.inviteFrom}: ${formatDate(invitation.createdAt, locale)}`}</span>
      </div>
      <button type="button" className={styles.staffSecondaryButton} onClick={() => onRevoke(invitation.id)}>
        {copy.revokeInvite}
      </button>
    </article>
  );
}

export default function StaffView({ professionalId, snapshot, initialAddOpen = false }: StaffViewProps) {
  const router = useRouter();
  const { language } = useProLanguage();
  const copy = staffText[language];
  const locale = getLocale(language);
  const [query, setQuery] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(initialAddOpen);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(language === "en" ? "Specialist" : language === "uk" ? "Майстер" : "Мастер");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sendInvitation, setSendInvitation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredMembers = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return snapshot.members;
    }

    return snapshot.members.filter((member) =>
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
  }, [copy.accessState, query, snapshot.members]);

  async function refreshAfter(request: Promise<Response>, successText: string = copy.saved) {
    try {
      const response = await request;
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusText(String(payload.error || copy.failed));
        return;
      }

      setStatusText(successText);
      router.refresh();
    } catch {
      setStatusText(copy.failed);
    }
  }

  async function handleCreateStaff() {
    const parsed = splitFullName(fullName);

    if (!parsed.firstName) {
      return;
    }

    setIsSaving(true);
    await refreshAfter(
      fetch("/api/pro/staff/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          role,
          email,
          phone,
          sendInvitation
        })
      })
    );
    setIsSaving(false);
    setFullName("");
    setRole(language === "en" ? "Specialist" : language === "uk" ? "Майстер" : "Мастер");
    setEmail("");
    setPhone("");
    setSendInvitation(false);
    setIsAddOpen(false);
  }

  async function handleJoinRequest(requestId: string, action: "approve" | "reject") {
    await refreshAfter(
      fetch("/api/pro/join-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requestId, action })
      })
    );
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
      })
    );
  }

  async function handleRevokeInvite(member: StaffMemberSnapshot) {
    if (!member.pendingInvitation) {
      return;
    }

    await handleRevokeInviteById(member.pendingInvitation.id);
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar active="staff" professionalId={professionalId} canManageStaff />

      <section className={styles.staffStudioShell}>
        <aside className={styles.staffStudioSidebar}>
          <div className={styles.staffStudioSidebarCard}>
            <strong>{copy.sectionTitle}</strong>
            <nav className={styles.staffStudioLocalNav}>
              <Link href="/pro/staff" className={`${styles.staffStudioLocalLink} ${styles.staffStudioLocalLinkActive}`}>
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
                <span className={styles.staffStudioCount}>{snapshot.members.length}</span>
              </div>
              <p className={styles.staffStudioText}>{copy.pageText}</p>
            </div>

            <div className={styles.staffStudioTopActions}>
              <button type="button" className={styles.staffStudioGhostButton}>
                {copy.options}
                <span aria-hidden="true">⌄</span>
              </button>
              <button type="button" className={styles.staffStudioPrimaryButton} onClick={() => setIsAddOpen(true)}>
                {copy.add}
              </button>
            </div>
          </div>

          <div className={styles.staffStudioNotice}>
            <span>{copy.filterHint}</span>
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
                      {renderStats(member, locale, snapshot.business.currency, copy)}
                    </div>

                    <div className={styles.staffStudioActionCell}>
                      <span className={styles.staffStudioMobileLabel}>{copy.actions}</span>
                      <StaffRowActions
                        member={member}
                        copy={copy}
                        onInvite={handleInvite}
                        onRevoke={handleRevokeInvite}
                      />
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <div className={styles.staffStudioBottomGrid}>
            <section className={styles.staffStudioPanel}>
              <div className={styles.staffStudioPanelHeader}>
                <h2>{copy.joinRequests}</h2>
              </div>

              {snapshot.joinRequests.length === 0 ? (
                <div className={styles.staffStudioEmpty}>{copy.noJoinRequests}</div>
              ) : (
                <div className={styles.staffStudioSideList}>
                  {snapshot.joinRequests.map((request) => (
                    <article key={request.id} className={styles.staffSideCard}>
                      <div>
                        <strong>
                          {request.professional
                            ? `${request.professional.firstName} ${request.professional.lastName}`.trim() ||
                              request.professional.email
                            : "—"}
                        </strong>
                        <p>{request.professional?.email || request.professional?.phone || copy.noContact}</p>
                        <span>{`${copy.requestFrom}: ${formatDate(request.createdAt, locale)}`}</span>
                      </div>
                      <div className={styles.staffSideActions}>
                        <button
                          type="button"
                          className={styles.staffSecondaryButton}
                          onClick={() => void handleJoinRequest(request.id, "reject")}
                        >
                          {copy.reject}
                        </button>
                        <button
                          type="button"
                          className={styles.staffStudioPrimaryButton}
                          onClick={() => void handleJoinRequest(request.id, "approve")}
                        >
                          {copy.approve}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.staffStudioPanel}>
              <div className={styles.staffStudioPanelHeader}>
                <h2>{copy.pendingInvites}</h2>
              </div>

              {snapshot.invitations.length === 0 ? (
                <div className={styles.staffStudioEmpty}>{copy.noInvites}</div>
              ) : (
                <div className={styles.staffStudioSideList}>
                  {snapshot.invitations.map((invitation) => (
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
                <span>{copy.fullName}</span>
                <input className={styles.input} value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
              <label className={styles.staffDrawerField}>
                <span>{copy.role}</span>
                <input className={styles.input} value={role} onChange={(event) => setRole(event.target.value)} />
              </label>
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
              <label className={styles.staffDrawerField}>
                <span>{copy.phone}</span>
                <input
                  className={styles.input}
                  placeholder={copy.placeholderPhone}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
              <label className={styles.staffDrawerToggle}>
                <input
                  type="checkbox"
                  checked={sendInvitation}
                  onChange={(event) => setSendInvitation(event.target.checked)}
                />
                <span>{copy.sendInvite}</span>
              </label>
            </div>

            <div className={styles.staffDrawerActions}>
              <button type="button" className={styles.staffStudioGhostButton} onClick={() => setIsAddOpen(false)}>
                {copy.cancel}
              </button>
              <button
                type="button"
                className={styles.staffStudioPrimaryButton}
                onClick={() => void handleCreateStaff()}
                disabled={!fullName.trim() || isSaving}
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
