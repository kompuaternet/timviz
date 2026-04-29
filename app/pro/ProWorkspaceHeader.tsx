"use client";

import ProfileAvatar from "../ProfileAvatar";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import FloatingPopover from "./FloatingPopover";
import styles from "./pro.module.css";
import { useProLanguage } from "./useProLanguage";

type ProWorkspaceHeaderProps = {
  businessName: string;
  viewerName: string;
  viewerAvatarUrl?: string;
  viewerInitials?: string;
  publicBookingUrl?: string;
  publicBookingEnabled?: boolean;
};

const headerCopy = {
  ru: {
    workspace: "Рабочее пространство",
    calendar: "Дневной календарь",
    services: "Услуги",
    clients: "Клиенты",
    staff: "Участники команды",
    staffSchedule: "График смен",
    settings: "Настройки",
    publicLink: "Публичная ссылка",
    publicLinkTitle: "Ссылка для онлайн-записи",
    publicLinkHint: "Отправляйте ссылку клиентам, публикуйте в соцсетях или копируйте её в один тап.",
    publicLinkCopy: "Копировать",
    publicLinkOpen: "Открыть страницу",
    publicLinkShare: "Поделиться",
    publicLinkCopied: "Ссылка для записи скопирована.",
    publicLinkSelected: "Ссылка выделена. Скопируйте её вручную, если браузер запретил доступ к буферу.",
    publicLinkDisabled: "Онлайн-запись выключена",
    publicLinkEnabled: "Онлайн-запись включена",
    notifications: "Уведомления",
    accountMenu: "Меню аккаунта",
    myProfile: "Мой профиль",
    personalSettings: "Личные настройки",
    logout: "Выйти"
  },
  uk: {
    workspace: "Робочий простір",
    calendar: "Денний календар",
    services: "Послуги",
    clients: "Клієнти",
    staff: "Учасники команди",
    staffSchedule: "Графік змін",
    settings: "Налаштування",
    publicLink: "Публічне посилання",
    publicLinkTitle: "Посилання для онлайн-запису",
    publicLinkHint: "Надсилайте посилання клієнтам, публікуйте в соцмережах або копіюйте його в один дотик.",
    publicLinkCopy: "Скопіювати",
    publicLinkOpen: "Відкрити сторінку",
    publicLinkShare: "Поділитися",
    publicLinkCopied: "Посилання для запису скопійовано.",
    publicLinkSelected: "Посилання виділено. Скопіюйте його вручну, якщо браузер заборонив буфер обміну.",
    publicLinkDisabled: "Онлайн-запис вимкнено",
    publicLinkEnabled: "Онлайн-запис увімкнено",
    notifications: "Сповіщення",
    accountMenu: "Меню акаунта",
    myProfile: "Мій профіль",
    personalSettings: "Особисті налаштування",
    logout: "Вийти"
  },
  en: {
    workspace: "Workspace",
    calendar: "Daily calendar",
    services: "Services",
    clients: "Clients",
    staff: "Team members",
    staffSchedule: "Shift schedule",
    settings: "Settings",
    publicLink: "Public link",
    publicLinkTitle: "Online booking link",
    publicLinkHint: "Send it to clients, post it on social media, or copy it in one tap.",
    publicLinkCopy: "Copy link",
    publicLinkOpen: "Open page",
    publicLinkShare: "Share",
    publicLinkCopied: "The booking link has been copied.",
    publicLinkSelected: "The link is selected. Copy it manually if the browser blocked clipboard access.",
    publicLinkDisabled: "Online booking is off",
    publicLinkEnabled: "Online booking is on",
    notifications: "Notifications",
    accountMenu: "Account menu",
    myProfile: "My profile",
    personalSettings: "Personal settings",
    logout: "Log out"
  }
} as const;

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V5" />
      <path d="M8.5 8.5 12 5l3.5 3.5" />
      <path d="M6 14.5v2.3A2.2 2.2 0 0 0 8.2 19h7.6a2.2 2.2 0 0 0 2.2-2.2v-2.3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.7 8.8a5.3 5.3 0 1 1 10.6 0c0 5.1 2.1 6.1 2.1 6.1H4.6s2.1-1 2.1-6.1" />
      <path d="M10.2 18.2a2.1 2.1 0 0 0 3.6 0" />
    </svg>
  );
}

function getPageTitle(pathname: string | null, language: "ru" | "uk" | "en") {
  const copy = headerCopy[language];

  if (!pathname) return copy.workspace;
  if (pathname.startsWith("/pro/calendar")) return copy.calendar;
  if (pathname.startsWith("/pro/services")) return copy.services;
  if (pathname.startsWith("/pro/clients")) return copy.clients;
  if (pathname.startsWith("/pro/staff/schedule")) return copy.staffSchedule;
  if (pathname.startsWith("/pro/staff")) return copy.staff;
  if (pathname.startsWith("/pro/settings")) return copy.settings;
  return copy.workspace;
}

export default function ProWorkspaceHeader({
  businessName,
  viewerName,
  viewerAvatarUrl,
  viewerInitials,
  publicBookingUrl = "",
  publicBookingEnabled = false
}: ProWorkspaceHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, t } = useProLanguage();
  const copy = headerCopy[language];
  const shareMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const shareMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const accountMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const shareLinkInputRef = useRef<HTMLInputElement | null>(null);
  const [activeMenu, setActiveMenu] = useState<"share" | "account" | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pageTitle = useMemo(() => getPageTitle(pathname, language), [language, pathname]);
  const canUseNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copyPublicBookingLink() {
    if (!publicBookingUrl) return;

    try {
      await navigator.clipboard.writeText(publicBookingUrl);
      shareLinkInputRef.current?.select();
      window.dispatchEvent(new CustomEvent("rezervo-calendar-toast", { detail: { message: copy.publicLinkCopied, tone: "success" } }));
    } catch {
      shareLinkInputRef.current?.select();
      window.dispatchEvent(new CustomEvent("rezervo-calendar-toast", { detail: { message: copy.publicLinkSelected, tone: "info" } }));
    }
  }

  async function sharePublicBookingLink() {
    if (!publicBookingUrl || !canUseNativeShare) return;

    try {
      await navigator.share({
        title: businessName,
        text: copy.publicLinkTitle,
        url: publicBookingUrl
      });
    } catch {
      return;
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/pro/logout", { method: "POST" });
    } finally {
      router.push("/pro/login");
      router.refresh();
    }
  }

  return (
    <div className={`${styles.calendarWorkspaceHeader} ${styles.proPageWorkspaceHeader}`}>
      <div className={styles.calendarWorkspaceMeta}>
        <span>{businessName || "Timviz"}</span>
        <strong>{pageTitle}</strong>
      </div>

      <div className={styles.calendarWorkspaceActions}>
        <button
          ref={shareMenuButtonRef}
          type="button"
          className={`${styles.calendarIconButton} ${styles.calendarShareButton} ${activeMenu === "share" ? styles.calendarIconButtonActive : ""}`}
          aria-label={copy.publicLink}
          onClick={() => setActiveMenu((current) => (current === "share" ? null : "share"))}
        >
          <ShareIcon />
        </button>

        <button
          type="button"
          className={styles.calendarIconButton}
          aria-label={copy.notifications}
          onClick={() => router.push("/pro/calendar?panel=notifications")}
        >
          <BellIcon />
        </button>

        <button
          ref={accountMenuButtonRef}
          type="button"
          className={styles.calendarProfileButton}
          aria-label={copy.accountMenu}
          onClick={() => setActiveMenu((current) => (current === "account" ? null : "account"))}
        >
          <ProfileAvatar
            avatarUrl={viewerAvatarUrl}
            initials={viewerInitials || viewerName.slice(0, 2).toUpperCase() || "RZ"}
            label={viewerName}
            className={styles.calendarHeaderAvatar}
            imageClassName={styles.avatarImage}
            fallbackClassName={styles.avatarFallback}
          />
          <div className={styles.calendarProfileMeta}>
            <strong>{viewerName}</strong>
            <span>{businessName || "Timviz"}</span>
          </div>
          <span className={styles.calendarToolbarChevron}>⌄</span>
        </button>

        <FloatingPopover
          open={activeMenu === "share"}
          anchorEl={shareMenuButtonRef.current}
          panelRef={shareMenuPanelRef}
          className={`${styles.calendarAccountMenu} ${styles.calendarShareMenu}`}
          placement="bottom-end"
          offset={12}
        >
          <div className={styles.calendarShareMenuHero}>
            <span className={styles.calendarShareMenuEyebrow}>{copy.publicLink}</span>
            <strong>{copy.publicLinkTitle}</strong>
            <p>{copy.publicLinkHint}</p>
            <span className={`${styles.calendarShareStatusPill} ${publicBookingEnabled ? styles.calendarShareStatusPillActive : ""}`}>
              {publicBookingEnabled ? copy.publicLinkEnabled : copy.publicLinkDisabled}
            </span>
          </div>

          <div className={styles.calendarShareField}>
            <input
              ref={shareLinkInputRef}
              className={styles.calendarShareFieldInput}
              readOnly
              value={publicBookingUrl}
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
            />
          </div>

          <div className={styles.calendarShareActions}>
            <button type="button" className={styles.calendarSharePrimaryAction} onClick={() => void copyPublicBookingLink()}>
              {copy.publicLinkCopy}
            </button>
            <button
              type="button"
              className={styles.calendarShareGhostAction}
              onClick={() => {
                if (!publicBookingUrl) return;
                setActiveMenu(null);
                window.open(publicBookingUrl, "_blank", "noopener,noreferrer");
              }}
            >
              {copy.publicLinkOpen}
            </button>
            {canUseNativeShare ? (
              <button type="button" className={styles.calendarShareGhostAction} onClick={() => void sharePublicBookingLink()}>
                {copy.publicLinkShare}
              </button>
            ) : null}
          </div>
        </FloatingPopover>

        <FloatingPopover
          open={activeMenu === "account"}
          anchorEl={accountMenuButtonRef.current}
          panelRef={accountMenuPanelRef}
          className={styles.calendarAccountMenu}
          placement="bottom-end"
          offset={12}
        >
          <div className={styles.calendarAccountMenuHeader}>
            <ProfileAvatar
              avatarUrl={viewerAvatarUrl}
              initials={viewerInitials || viewerName.slice(0, 2).toUpperCase() || "RZ"}
              label={viewerName}
              className={styles.calendarAccountMenuAvatar}
              imageClassName={styles.avatarImage}
              fallbackClassName={styles.avatarFallback}
            />
            <div>
              <strong>{viewerName}</strong>
              <span>{businessName || "Timviz"}</span>
            </div>
          </div>

          <div className={styles.calendarAccountMenuSection}>
            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                router.push("/pro/settings");
              }}
            >
              {copy.myProfile}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                router.push("/pro/settings");
              }}
            >
              {copy.personalSettings}
            </button>
          </div>

          <div className={styles.calendarAccountMenuSection}>
            <button
              type="button"
              className={styles.calendarDangerMenuItem}
              disabled={isLoggingOut}
              onClick={() => {
                void handleLogout();
              }}
            >
              {isLoggingOut ? t.settings.logoutLoading : copy.logout}
            </button>
          </div>
        </FloatingPopover>
      </div>
    </div>
  );
}
