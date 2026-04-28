"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "../../ProfileAvatar";
import ProSidebar from "../ProSidebar";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
import type { BusinessStaffSnapshot, StaffMemberSource } from "../../../lib/pro-staff";

type StaffViewProps = {
  professionalId: string;
  snapshot: BusinessStaffSnapshot;
};

const staffText = {
  ru: {
    kicker: "Кабинет компании",
    title: "Сотрудники",
    subtitle:
      "Команда бизнеса в одном разделе: активные сотрудники, заявки на присоединение, приглашения по email, записи и рабочие услуги каждого мастера.",
    inviteTitle: "Пригласить сотрудника",
    inviteText:
      "Отправьте письмо на email мастера. После входа или регистрации на этот адрес приглашение подтвердится автоматически.",
    inviteEmail: "Email сотрудника",
    inviteRole: "Роль в компании",
    inviteButton: "Отправить приглашение",
    inviteSending: "Отправляем...",
    searchPlaceholder: "Поиск по имени, email, телефону или роли",
    summaryPeople: "Всего в команде",
    summaryMembers: "Активные сотрудники",
    summaryRequests: "Ожидают подтверждения",
    summaryInvites: "Письма в ожидании",
    summaryMonthBookings: "Записи за месяц",
    summaryMonthRevenue: "Доход за месяц",
    joinRequests: "Запросы на присоединение",
    joinRequestsEmpty: "Новых запросов пока нет.",
    approve: "Подтвердить",
    reject: "Отклонить",
    pendingInvites: "Приглашения по email",
    pendingInvitesEmpty: "Активных приглашений пока нет.",
    revokeInvite: "Отозвать",
    roleLabel: "Роль",
    sourceLabel: "Источник",
    source: {
      owner: "Владелец",
      join_request: "Регистрация + заявка",
      email_invitation: "Email-приглашение",
      member: "Сотрудник"
    } satisfies Record<StaffMemberSource, string>,
    memberCount: "чел.",
    bookings: "Записи",
    completed: "Подтверждено",
    upcoming: "Впереди",
    revenue: "Доход",
    services: "Услуги в работе",
    noServices: "Пока нет личной истории услуг. Сотруднику видны общие услуги бизнеса.",
    businessServicesVisible: "Услуг бизнеса видно в кабинете",
    recentAppointments: "Последние записи",
    noAppointments: "Пока нет записей по этому сотруднику.",
    customerFallback: "Клиент",
    statusSaved: "Изменения сохранены.",
    statusFailed: "Не удалось выполнить действие.",
    attendance: {
      pending: "Ожидает",
      confirmed: "Подтверждено",
      arrived: "Пришел",
      no_show: "Не пришел"
    },
    memberSince: "В команде с",
    requestSince: "Запрос от",
    inviteSince: "Приглашение от",
    linkedAccount: "Аккаунт уже создан",
    employeeList: "Активная команда"
  },
  uk: {
    kicker: "Кабінет компанії",
    title: "Співробітники",
    subtitle:
      "Команда бізнесу в одному розділі: активні співробітники, запити на приєднання, запрошення через email, записи й робочі послуги кожного майстра.",
    inviteTitle: "Запросити співробітника",
    inviteText:
      "Надішліть листа на email майстра. Після входу або реєстрації на цю адресу запрошення підтвердиться автоматично.",
    inviteEmail: "Email співробітника",
    inviteRole: "Роль у компанії",
    inviteButton: "Надіслати запрошення",
    inviteSending: "Надсилаємо...",
    searchPlaceholder: "Пошук за ім'ям, email, телефоном або роллю",
    summaryPeople: "Усього в команді",
    summaryMembers: "Активні співробітники",
    summaryRequests: "Очікують підтвердження",
    summaryInvites: "Листи в очікуванні",
    summaryMonthBookings: "Записи за місяць",
    summaryMonthRevenue: "Дохід за місяць",
    joinRequests: "Запити на приєднання",
    joinRequestsEmpty: "Нових запитів поки немає.",
    approve: "Підтвердити",
    reject: "Відхилити",
    pendingInvites: "Запрошення через email",
    pendingInvitesEmpty: "Активних запрошень поки немає.",
    revokeInvite: "Відкликати",
    roleLabel: "Роль",
    sourceLabel: "Джерело",
    source: {
      owner: "Власник",
      join_request: "Реєстрація + запит",
      email_invitation: "Email-запрошення",
      member: "Співробітник"
    } satisfies Record<StaffMemberSource, string>,
    memberCount: "ос.",
    bookings: "Записи",
    completed: "Підтверджено",
    upcoming: "Попереду",
    revenue: "Дохід",
    services: "Послуги в роботі",
    noServices: "Поки немає особистої історії послуг. Співробітнику видно спільні послуги бізнесу.",
    businessServicesVisible: "Послуг бізнесу видно в кабінеті",
    recentAppointments: "Останні записи",
    noAppointments: "Поки немає записів по цьому співробітнику.",
    customerFallback: "Клієнт",
    statusSaved: "Зміни збережено.",
    statusFailed: "Не вдалося виконати дію.",
    attendance: {
      pending: "Очікує",
      confirmed: "Підтверджено",
      arrived: "Прийшов",
      no_show: "Не прийшов"
    },
    memberSince: "У команді з",
    requestSince: "Запит від",
    inviteSince: "Запрошення від",
    linkedAccount: "Акаунт уже створено",
    employeeList: "Активна команда"
  },
  en: {
    kicker: "Company workspace",
    title: "Staff",
    subtitle:
      "Your business team in one place: active staff, join requests, email invitations, bookings and each specialist's working services.",
    inviteTitle: "Invite a staff member",
    inviteText:
      "Send an email invitation to the specialist. After signing in or registering with that address, the invitation is confirmed automatically.",
    inviteEmail: "Staff email",
    inviteRole: "Role in the company",
    inviteButton: "Send invitation",
    inviteSending: "Sending...",
    searchPlaceholder: "Search by name, email, phone or role",
    summaryPeople: "Team total",
    summaryMembers: "Active staff",
    summaryRequests: "Awaiting approval",
    summaryInvites: "Emails pending",
    summaryMonthBookings: "Bookings this month",
    summaryMonthRevenue: "Revenue this month",
    joinRequests: "Join requests",
    joinRequestsEmpty: "No new requests yet.",
    approve: "Approve",
    reject: "Reject",
    pendingInvites: "Email invitations",
    pendingInvitesEmpty: "No active invitations yet.",
    revokeInvite: "Revoke",
    roleLabel: "Role",
    sourceLabel: "Source",
    source: {
      owner: "Owner",
      join_request: "Registration + request",
      email_invitation: "Email invitation",
      member: "Staff member"
    } satisfies Record<StaffMemberSource, string>,
    memberCount: "people",
    bookings: "Bookings",
    completed: "Completed",
    upcoming: "Upcoming",
    revenue: "Revenue",
    services: "Working services",
    noServices: "No personal service history yet. The specialist still sees the shared business services.",
    businessServicesVisible: "Business services visible in the workspace",
    recentAppointments: "Recent bookings",
    noAppointments: "No bookings for this team member yet.",
    customerFallback: "Client",
    statusSaved: "Changes saved.",
    statusFailed: "Could not complete the action.",
    attendance: {
      pending: "Pending",
      confirmed: "Confirmed",
      arrived: "Arrived",
      no_show: "No show"
    },
    memberSince: "In team since",
    requestSince: "Request from",
    inviteSince: "Invitation from",
    linkedAccount: "Account already created",
    employeeList: "Active team"
  }
} as const;

function getLocale(language: "ru" | "uk" | "en") {
  if (language === "uk") {
    return "uk-UA";
  }

  if (language === "en") {
    return "en-US";
  }

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

function makeInitials(firstName: string, lastName: string, email: string) {
  const initial = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
  return (initial || email[0] || "S").toUpperCase();
}

export default function StaffView({ professionalId, snapshot }: StaffViewProps) {
  const router = useRouter();
  const { language } = useProLanguage();
  const copy = staffText[language];
  const locale = getLocale(language);
  const [query, setQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(language === "en" ? "Specialist" : language === "uk" ? "Майстер" : "Мастер");
  const [statusText, setStatusText] = useState("");
  const [isInviteLoading, setIsInviteLoading] = useState(false);
  const [actionId, setActionId] = useState("");

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
        copy.source[member.source],
        ...member.services
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [copy.source, query, snapshot.members]);

  async function refreshAfter(request: Promise<Response>) {
    try {
      const response = await request;
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusText(String(payload.error || copy.statusFailed));
        return;
      }

      setStatusText(copy.statusSaved);
      router.refresh();
    } catch {
      setStatusText(copy.statusFailed);
    }
  }

  async function handleSendInvite() {
    if (!inviteEmail.trim()) {
      return;
    }

    setIsInviteLoading(true);
    await refreshAfter(
      fetch("/api/pro/staff/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      })
    );
    setIsInviteLoading(false);
    setInviteEmail("");
  }

  async function handleJoinRequest(requestId: string, action: "approve" | "reject") {
    setActionId(requestId);
    await refreshAfter(
      fetch("/api/pro/join-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requestId, action })
      })
    );
    setActionId("");
  }

  async function handleRevokeInvite(invitationId: string) {
    setActionId(invitationId);
    await refreshAfter(
      fetch(`/api/pro/staff/invitations?invitationId=${encodeURIComponent(invitationId)}`, {
        method: "DELETE"
      })
    );
    setActionId("");
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar active="staff" professionalId={professionalId} />

      <section className={styles.staffShell}>
        <section className={styles.staffMain}>
          <header className={styles.clientsHeader}>
            <div>
              <p className={styles.clientsKicker}>{copy.kicker}</p>
              <div className={styles.clientsTitleRow}>
                <h1 className={styles.clientsTitle}>{copy.title}</h1>
                <span className={styles.clientsBadge}>{snapshot.summary.totalPeople}</span>
              </div>
              <p className={styles.clientsSubtitle}>{copy.subtitle}</p>
            </div>
          </header>

          <section className={styles.staffSummaryGrid}>
            <article className={styles.staffSummaryCard}>
              <span>{copy.summaryPeople}</span>
              <strong>{snapshot.summary.totalPeople}</strong>
            </article>
            <article className={styles.staffSummaryCard}>
              <span>{copy.summaryMembers}</span>
              <strong>{snapshot.summary.activeEmployees}</strong>
            </article>
            <article className={styles.staffSummaryCard}>
              <span>{copy.summaryRequests}</span>
              <strong>{snapshot.summary.pendingRequests}</strong>
            </article>
            <article className={styles.staffSummaryCard}>
              <span>{copy.summaryInvites}</span>
              <strong>{snapshot.summary.pendingInvitations}</strong>
            </article>
            <article className={styles.staffSummaryCard}>
              <span>{copy.summaryMonthBookings}</span>
              <strong>{snapshot.summary.monthBookings}</strong>
            </article>
            <article className={styles.staffSummaryCard}>
              <span>{copy.summaryMonthRevenue}</span>
              <strong>{formatMoney(snapshot.summary.monthRevenue, locale, snapshot.business.currency)}</strong>
            </article>
          </section>

          <section className={styles.staffInvitePanel}>
            <div>
              <h2>{copy.inviteTitle}</h2>
              <p>{copy.inviteText}</p>
            </div>
            <div className={styles.staffInviteForm}>
              <label className={styles.staffField}>
                <span>{copy.inviteEmail}</span>
                <input
                  className={styles.input}
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </label>
              <label className={styles.staffField}>
                <span>{copy.inviteRole}</span>
                <input
                  className={styles.input}
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value)}
                />
              </label>
              <button
                type="button"
                className={styles.clientsPrimaryAddButton}
                onClick={() => void handleSendInvite()}
                disabled={!inviteEmail.trim() || isInviteLoading}
              >
                {isInviteLoading ? copy.inviteSending : copy.inviteButton}
              </button>
            </div>
          </section>

          {statusText ? <div className={styles.clientsStatus}>{statusText}</div> : null}

          <section className={styles.staffTwoColumn}>
            <article className={styles.staffPanel}>
              <div className={styles.staffPanelHeader}>
                <div>
                  <h2>{copy.joinRequests}</h2>
                </div>
              </div>

              {snapshot.joinRequests.length === 0 ? (
                <div className={styles.staffEmpty}>{copy.joinRequestsEmpty}</div>
              ) : (
                <div className={styles.staffActionList}>
                  {snapshot.joinRequests.map((request) => (
                    <article key={request.id} className={styles.staffActionCard}>
                      <div>
                        <strong>
                          {request.professional
                            ? `${request.professional.firstName} ${request.professional.lastName}`.trim() ||
                              request.professional.email
                            : "—"}
                        </strong>
                        <p>{request.professional?.email || request.professional?.phone || "—"}</p>
                        <span>{`${copy.roleLabel}: ${request.role}`}</span>
                        <span>{`${copy.requestSince}: ${formatDate(request.createdAt, locale)}`}</span>
                      </div>
                      <div className={styles.staffActionButtons}>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => void handleJoinRequest(request.id, "reject")}
                          disabled={actionId === request.id}
                        >
                          {copy.reject}
                        </button>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => void handleJoinRequest(request.id, "approve")}
                          disabled={actionId === request.id}
                        >
                          {copy.approve}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className={styles.staffPanel}>
              <div className={styles.staffPanelHeader}>
                <div>
                  <h2>{copy.pendingInvites}</h2>
                </div>
              </div>

              {snapshot.invitations.length === 0 ? (
                <div className={styles.staffEmpty}>{copy.pendingInvitesEmpty}</div>
              ) : (
                <div className={styles.staffActionList}>
                  {snapshot.invitations.map((invitation) => (
                    <article key={invitation.id} className={styles.staffActionCard}>
                      <div>
                        <strong>{invitation.email}</strong>
                        <p>{`${copy.roleLabel}: ${invitation.role}`}</p>
                        <span>{`${copy.inviteSince}: ${formatDate(invitation.createdAt, locale)}`}</span>
                        {invitation.invitedProfessional ? (
                          <span>{copy.linkedAccount}</span>
                        ) : null}
                      </div>
                      <div className={styles.staffActionButtons}>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => void handleRevokeInvite(invitation.id)}
                          disabled={actionId === invitation.id}
                        >
                          {copy.revokeInvite}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className={styles.clientsToolbar}>
            <div className={styles.clientsToolbarLeft}>
              <div className={styles.clientsSearch}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.8" />
                  <path d="m20 20-3.8-3.8" />
                </svg>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                />
              </div>
            </div>
          </section>

          <section className={styles.staffPanel}>
            <div className={styles.staffPanelHeader}>
              <div>
                <h2>{copy.employeeList}</h2>
              </div>
            </div>

            <div className={styles.staffCards}>
              {filteredMembers.length === 0 ? (
                <div className={styles.staffEmpty}>{copy.noAppointments}</div>
              ) : (
                filteredMembers.map((member) => (
                  <article key={member.professional.id} className={styles.staffMemberCard}>
                    <div className={styles.staffMemberTop}>
                      <div className={styles.staffIdentity}>
                        <ProfileAvatar
                          avatarUrl={member.professional.avatarUrl}
                          initials={makeInitials(
                            member.professional.firstName,
                            member.professional.lastName,
                            member.professional.email
                          )}
                          label={`${member.professional.firstName} ${member.professional.lastName}`.trim() || member.professional.email}
                          className={styles.clientAvatar}
                          imageClassName={styles.avatarImage}
                          fallbackClassName={styles.avatarFallback}
                        />
                        <div>
                          <strong>
                            {`${member.professional.firstName} ${member.professional.lastName}`.trim() ||
                              member.professional.email}
                          </strong>
                          <span>{member.professional.email}</span>
                          <span>{member.professional.phone || "—"}</span>
                        </div>
                      </div>

                      <div className={styles.staffBadgeStack}>
                        <span className={styles.staffBadge}>{member.membership.role}</span>
                        <span className={styles.staffBadgeMuted}>{copy.source[member.source]}</span>
                      </div>
                    </div>

                    <div className={styles.staffMetaRow}>
                      <span>{`${copy.memberSince}: ${formatDate(member.membership.createdAt, locale)}`}</span>
                      <span>{`${copy.businessServicesVisible}: ${member.visibleBusinessServicesCount}`}</span>
                    </div>

                    <div className={styles.staffStatsGrid}>
                      <div>
                        <span>{copy.bookings}</span>
                        <strong>{member.stats.totalBookings}</strong>
                      </div>
                      <div>
                        <span>{copy.completed}</span>
                        <strong>{member.stats.completedBookings}</strong>
                      </div>
                      <div>
                        <span>{copy.upcoming}</span>
                        <strong>{member.stats.upcomingBookings}</strong>
                      </div>
                      <div>
                        <span>{copy.revenue}</span>
                        <strong>{formatMoney(member.stats.revenue, locale, snapshot.business.currency)}</strong>
                      </div>
                    </div>

                    <div className={styles.staffServicesBlock}>
                      <strong>{copy.services}</strong>
                      {member.services.length > 0 ? (
                        <div className={styles.generatedList}>
                          {member.services.map((service) => (
                            <span key={`${member.professional.id}-${service}`} className={styles.generatedChip}>
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>{copy.noServices}</p>
                      )}
                    </div>

                    <div className={styles.staffAppointmentsBlock}>
                      <strong>{copy.recentAppointments}</strong>
                      {member.recentAppointments.length === 0 ? (
                        <p>{copy.noAppointments}</p>
                      ) : (
                        <div className={styles.staffAppointmentsList}>
                          {member.recentAppointments.map((appointment) => (
                            <div key={appointment.id} className={styles.staffAppointmentRow}>
                              <div>
                                <strong>{appointment.customerName || copy.customerFallback}</strong>
                                <span>{appointment.serviceName || "—"}</span>
                              </div>
                              <div>
                                <strong>{`${formatDate(appointment.appointmentDate, locale)} · ${appointment.startTime}`}</strong>
                                <span>{copy.attendance[appointment.attendance as keyof typeof copy.attendance] || appointment.attendance}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
