"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ProfileAvatar from "../../ProfileAvatar";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
import type { StaffMemberEditorSnapshot, StaffMemberWorkspaceAccess } from "../../../lib/pro-staff";

type StaffMemberEditorProps = {
  snapshot: StaffMemberEditorSnapshot;
  initialTab: "profile" | "schedule" | "access";
};

const editorText = {
  ru: {
    back: "Закрыть",
    save: "Сохранить",
    saving: "Сохраняем...",
    titlePrefix: "Изменить",
    profileTab: "Профиль",
    scheduleTab: "График",
    accessTab: "Доступ",
    personalTitle: "Личные сведения",
    workTitle: "Рабочая область",
    profileTitle: "Профиль",
    profileText: "Управляйте личным профилем сотрудника и тем, как он отображается в команде.",
    firstName: "Имя",
    lastName: "Фамилия",
    role: "Должность",
    email: "Эл. почта",
    phone: "Номер телефона",
    statsTitle: "Статистика сотрудника",
    statsText: "Быстрый обзор записей и доступных услуг в бизнесе.",
    servicesVisible: "Услуг бизнеса видно",
    bookings: "Записей",
    revenue: "Доход",
    accessTitle: "Доступ в кабинет",
    accessText: "Сотрудник появится в команде сразу. Вход в админку включается отдельным приглашением на email.",
    invite: "Отправить приглашение",
    resend: "Отправить повторно",
    revoke: "Отозвать",
    inviteSent: "Приглашение отправлено",
    invitedAt: "Приглашение активно с",
    noEmail: "Чтобы отправить приглашение, сначала укажите email сотрудника в профиле.",
    state: {
      owner: "Владелец рабочего пространства",
      active: "Доступ в кабинет открыт",
      invited: "Приглашение отправлено",
      offline: "Нет доступа"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    saved: "Изменения сохранены.",
    failed: "Не удалось сохранить изменения.",
    scheduleHint:
      "Личный график сотрудника теперь редактируется только в общем разделе графика смен команды.",
    openTeamSchedule: "Открыть график смен команды"
  },
  uk: {
    back: "Закрити",
    save: "Зберегти",
    saving: "Зберігаємо...",
    titlePrefix: "Змінити",
    profileTab: "Профіль",
    scheduleTab: "Графік",
    accessTab: "Доступ",
    personalTitle: "Особисті відомості",
    workTitle: "Робоча область",
    profileTitle: "Профіль",
    profileText: "Керуйте особистим профілем співробітника і тим, як він показується в команді.",
    firstName: "Ім'я",
    lastName: "Прізвище",
    role: "Посада",
    email: "Ел. пошта",
    phone: "Номер телефону",
    statsTitle: "Статистика співробітника",
    statsText: "Швидкий огляд записів і доступних послуг у бізнесі.",
    servicesVisible: "Послуг бізнесу видно",
    bookings: "Записів",
    revenue: "Дохід",
    accessTitle: "Доступ до кабінету",
    accessText: "Співробітник з’являється в команді одразу. Вхід до адмінки вмикається окремим запрошенням на email.",
    invite: "Надіслати запрошення",
    resend: "Надіслати повторно",
    revoke: "Відкликати",
    inviteSent: "Запрошення надіслано",
    invitedAt: "Запрошення активне з",
    noEmail: "Щоб надіслати запрошення, спершу вкажіть email співробітника у профілі.",
    state: {
      owner: "Власник робочого простору",
      active: "Доступ до кабінету відкрито",
      invited: "Запрошення надіслано",
      offline: "Немає доступу"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    saved: "Зміни збережено.",
    failed: "Не вдалося зберегти зміни.",
    scheduleHint:
      "Особистий графік співробітника тепер редагується лише в загальному розділі графіка змін команди.",
    openTeamSchedule: "Відкрити графік змін команди"
  },
  en: {
    back: "Close",
    save: "Save",
    saving: "Saving...",
    titlePrefix: "Edit",
    profileTab: "Profile",
    scheduleTab: "Schedule",
    accessTab: "Access",
    personalTitle: "Personal details",
    workTitle: "Work area",
    profileTitle: "Profile",
    profileText: "Manage the employee profile and how they appear inside the team.",
    firstName: "First name",
    lastName: "Last name",
    role: "Role",
    email: "Email",
    phone: "Phone",
    statsTitle: "Employee stats",
    statsText: "Quick overview of bookings and visible business services.",
    servicesVisible: "Business services visible",
    bookings: "Bookings",
    revenue: "Revenue",
    accessTitle: "Workspace access",
    accessText: "The employee joins the team immediately. Admin access is enabled by a separate email invitation.",
    invite: "Send invitation",
    resend: "Resend invitation",
    revoke: "Revoke",
    inviteSent: "Invitation sent",
    invitedAt: "Invitation active since",
    noEmail: "Add an email in the profile first to send an invitation.",
    state: {
      owner: "Workspace owner",
      active: "Workspace access enabled",
      invited: "Invitation sent",
      offline: "No access"
    } satisfies Record<StaffMemberWorkspaceAccess, string>,
    saved: "Changes saved.",
    failed: "Could not save changes.",
    scheduleHint:
      "The employee personal schedule is now managed only from the shared team shift schedule screen.",
    openTeamSchedule: "Open team shift schedule"
  }
} as const;

function getLocale(language: "ru" | "uk" | "en") {
  if (language === "uk") return "uk-UA";
  if (language === "en") return "en-US";
  return "ru-RU";
}

function formatMoney(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export default function StaffMemberEditor({ snapshot, initialTab }: StaffMemberEditorProps) {
  const router = useRouter();
  const { language } = useProLanguage();
  const copy = editorText[language];
  const locale = getLocale(language);
  const member = snapshot.member;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [firstName, setFirstName] = useState(member.professional.firstName);
  const [lastName, setLastName] = useState(member.professional.lastName);
  const [role, setRole] = useState(member.membership.role);
  const [email, setEmail] = useState(member.professional.email);
  const [phone, setPhone] = useState(member.professional.phone);
  const [statusText, setStatusText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSignatureRef = useRef(
    JSON.stringify({
      firstName: member.professional.firstName,
      lastName: member.professional.lastName,
      role: member.membership.role,
      email: member.professional.email,
      phone: member.professional.phone
    })
  );

  const initials = useMemo(() => {
    const letters = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim();
    return (letters || email[0] || "M").toUpperCase();
  }, [email, firstName, lastName]);

  const profileSignature = useMemo(
    () =>
      JSON.stringify({
        firstName,
        lastName,
        role,
        email,
        phone
      }),
    [email, firstName, lastName, phone, role]
  );

  async function saveProfile() {
    if (profileSignature === lastSavedSignatureRef.current) {
      return true;
    }

    setIsSaving(true);
    setStatusText(copy.saving);

    try {
      const response = await fetch(`/api/pro/staff/members/${encodeURIComponent(member.professional.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName,
          lastName,
          role,
          email,
          phone
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusText(String(payload.error || copy.failed));
      } else {
        lastSavedSignatureRef.current = profileSignature;
        setStatusText(copy.saved);
        setIsSaving(false);
        return true;
      }
    } catch {
      setStatusText(copy.failed);
    }

    setIsSaving(false);
    return false;
  }

  useEffect(() => {
    if (activeTab !== "profile" || isSaving || profileSignature === lastSavedSignatureRef.current) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void saveProfile();
    }, 700);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [activeTab, isSaving, profileSignature]);

  async function sendInvite() {
    if (!email.trim()) {
      setStatusText(copy.noEmail);
      return;
    }

    setIsSaving(true);
    setStatusText("");

    try {
      const response = await fetch("/api/pro/staff/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          memberProfessionalId: member.professional.id,
          email,
          role
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusText(String(payload.error || copy.failed));
      } else {
        setStatusText(copy.inviteSent);
        router.refresh();
      }
    } catch {
      setStatusText(copy.failed);
    }

    setIsSaving(false);
  }

  async function revokeInvite() {
    if (!member.pendingInvitation) {
      return;
    }

    setIsSaving(true);
    setStatusText("");

    try {
      const response = await fetch(
        `/api/pro/staff/invitations?invitationId=${encodeURIComponent(member.pendingInvitation.id)}`,
        { method: "DELETE" }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusText(String(payload.error || copy.failed));
      } else {
        setStatusText(copy.saved);
        router.refresh();
      }
    } catch {
      setStatusText(copy.failed);
    }

    setIsSaving(false);
  }

  return (
    <main className={styles.staffEditorShell}>
      <div className={styles.staffEditorTopBar}>
        <div className={styles.staffEditorTopTitle}>
          {copy.titlePrefix} {`${member.professional.firstName} ${member.professional.lastName}`.trim() || member.professional.email}
        </div>
        <div className={styles.staffEditorTopActions}>
          <Link href="/pro/staff" className={styles.staffStudioGhostButton}>
            {copy.back}
          </Link>
          <button type="button" className={styles.staffStudioPrimaryButton} onClick={() => void saveProfile()} disabled={isSaving}>
            {copy.save}
          </button>
        </div>
      </div>

      <div className={styles.staffEditorLayout}>
        <aside className={styles.staffEditorSidebar}>
          <div className={styles.staffEditorSidebarBlock}>
            <strong>{copy.personalTitle}</strong>
            <button
              type="button"
              className={`${styles.staffEditorNavItem} ${activeTab === "profile" ? styles.staffEditorNavItemActive : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              {copy.profileTab}
            </button>
            <button
              type="button"
              className={`${styles.staffEditorNavItem} ${activeTab === "schedule" ? styles.staffEditorNavItemActive : ""}`}
              onClick={() => setActiveTab("schedule")}
            >
              {copy.scheduleTab}
            </button>
            <button
              type="button"
              className={`${styles.staffEditorNavItem} ${activeTab === "access" ? styles.staffEditorNavItemActive : ""}`}
              onClick={() => setActiveTab("access")}
            >
              {copy.accessTab}
            </button>
          </div>
        </aside>

        <section className={styles.staffEditorMain}>
          {statusText ? <div className={styles.staffStudioStatus}>{statusText}</div> : null}

          {activeTab === "profile" ? (
            <div className={styles.staffEditorPanel}>
              <div className={styles.staffEditorPanelHeader}>
                <div>
                  <h1>{copy.profileTitle}</h1>
                  <p>{copy.profileText}</p>
                </div>
              </div>

              <div className={styles.staffEditorHero}>
                <ProfileAvatar
                  avatarUrl={member.professional.avatarUrl}
                  initials={initials}
                  label={`${firstName} ${lastName}`.trim() || email}
                  className={styles.staffEditorAvatar}
                  imageClassName={styles.avatarImage}
                  fallbackClassName={styles.avatarFallback}
                />
              </div>

              <div className={styles.staffEditorGrid}>
                <label className={styles.staffDrawerField}>
                  <span>{copy.firstName}</span>
                  <input className={styles.input} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                </label>
                <label className={styles.staffDrawerField}>
                  <span>{copy.lastName}</span>
                  <input className={styles.input} value={lastName} onChange={(event) => setLastName(event.target.value)} />
                </label>
                <label className={styles.staffDrawerField}>
                  <span>{copy.role}</span>
                  <input className={styles.input} value={role} onChange={(event) => setRole(event.target.value)} />
                </label>
                <label className={styles.staffDrawerField}>
                  <span>{copy.phone}</span>
                  <input className={styles.input} value={phone} onChange={(event) => setPhone(event.target.value)} />
                </label>
                <label className={`${styles.staffDrawerField} ${styles.staffEditorFieldWide}`}>
                  <span>{copy.email}</span>
                  <input className={styles.input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
              </div>

              <div className={styles.staffEditorStats}>
                <div className={styles.staffEditorStatCard}>
                  <span>{copy.bookings}</span>
                  <strong>{member.stats.totalBookings}</strong>
                </div>
                <div className={styles.staffEditorStatCard}>
                  <span>{copy.servicesVisible}</span>
                  <strong>{member.visibleBusinessServicesCount}</strong>
                </div>
                <div className={styles.staffEditorStatCard}>
                  <span>{copy.revenue}</span>
                  <strong>{formatMoney(member.stats.revenue, locale, snapshot.business.currency)}</strong>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "schedule" ? (
            <div className={styles.staffEditorPanel}>
              <div className={styles.staffEditorPanelHeader}>
                <div>
                  <h1>{copy.scheduleTab}</h1>
                  <p>{copy.scheduleHint}</p>
                </div>
              </div>

              <div className={styles.staffStudioNotice}>
                {copy.scheduleHint}
              </div>

              <div className={styles.staffEditorActionRow}>
                <Link href="/pro/staff/schedule" className={styles.staffStudioPrimaryButton}>
                  {copy.openTeamSchedule}
                </Link>
              </div>
            </div>
          ) : null}

          {activeTab === "access" ? (
            <div className={styles.staffEditorPanel}>
              <div className={styles.staffEditorPanelHeader}>
                <div>
                  <h1>{copy.accessTitle}</h1>
                  <p>{copy.accessText}</p>
                </div>
              </div>

              <div className={styles.staffEditorAccessCard}>
                <span className={styles.staffStudioAccessBadge}>{copy.state[member.workspaceAccess]}</span>
                {member.pendingInvitation ? (
                  <p>
                    {copy.invitedAt} {new Date(member.pendingInvitation.createdAt).toLocaleDateString(locale)}
                  </p>
                ) : null}
              </div>

              {!email.trim() ? <div className={styles.staffStudioNotice}>{copy.noEmail}</div> : null}

              <div className={styles.staffEditorActionRow}>
                <button type="button" className={styles.staffStudioPrimaryButton} onClick={() => void sendInvite()} disabled={isSaving}>
                  {member.pendingInvitation ? copy.resend : copy.invite}
                </button>
                {member.pendingInvitation ? (
                  <button type="button" className={styles.staffStudioGhostButton} onClick={() => void revokeInvite()} disabled={isSaving}>
                    {copy.revoke}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
