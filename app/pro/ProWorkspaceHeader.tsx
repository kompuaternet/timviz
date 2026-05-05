"use client";

import ProfileAvatar from "../ProfileAvatar";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import FloatingPopover from "./FloatingPopover";
import SupportWidget from "./SupportWidget";
import styles from "./pro.module.css";
import { getPostLogoutRedirectPath } from "./telegram-context";
import { useProLanguage } from "./useProLanguage";
import { profileLanguageFromCode, type ProLanguage } from "./i18n";
import type { OnboardingCtaState, OnboardingStepId } from "../../lib/pro-onboarding";

type ProWorkspaceHeaderProps = {
  businessName: string;
  viewerName: string;
  viewerAvatarUrl?: string;
  viewerInitials?: string;
  publicBookingUrl?: string;
  publicBookingEnabled?: boolean;
  canTogglePublicBooking?: boolean;
  onboardingCta?: OnboardingCtaState | null;
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    helpSupport: "Помощь и поддержка",
    uploadAvatar: "Загрузить аватар",
    avatarUploading: "Загружаем аватар…",
    avatarUpdated: "Аватар обновлён.",
    avatarImageOnly: "Выберите файл изображения (JPG, PNG, WEBP).",
    avatarTooLarge: "Аватар слишком большой. Максимум 2 МБ.",
    avatarUploadFailed: "Не удалось обновить аватар. Попробуйте ещё раз.",
    language: "Язык",
    logout: "Выйти",
    onboardingDone: "✔ Готово",
    onboardingServices: "Додати послуги",
    onboardingSchedule: "Налаштувати графік",
    onboardingBooking: "Увімкнути запис",
    onboardingPhoto: "Додати фото",
    onboardingTelegram: "Підключити Telegram"
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
    helpSupport: "Допомога і підтримка",
    uploadAvatar: "Завантажити аватар",
    avatarUploading: "Завантажуємо аватар…",
    avatarUpdated: "Аватар оновлено.",
    avatarImageOnly: "Оберіть файл зображення (JPG, PNG, WEBP).",
    avatarTooLarge: "Аватар завеликий. Максимум 2 МБ.",
    avatarUploadFailed: "Не вдалося оновити аватар. Спробуйте ще раз.",
    language: "Мова",
    logout: "Вийти",
    onboardingDone: "✔ Готово",
    onboardingServices: "Додати послуги",
    onboardingSchedule: "Налаштувати графік",
    onboardingBooking: "Увімкнути запис",
    onboardingPhoto: "Додати фото",
    onboardingTelegram: "Підключити Telegram"
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
    helpSupport: "Help and support",
    uploadAvatar: "Upload avatar",
    avatarUploading: "Uploading avatar…",
    avatarUpdated: "Avatar updated.",
    avatarImageOnly: "Please choose an image file (JPG, PNG, WEBP).",
    avatarTooLarge: "Avatar is too large. Maximum size is 2 MB.",
    avatarUploadFailed: "Could not update avatar. Please try again.",
    language: "Language",
    logout: "Log out",
    onboardingDone: "✔ Done",
    onboardingServices: "Add services",
    onboardingSchedule: "Set schedule",
    onboardingBooking: "Enable booking",
    onboardingPhoto: "Add photos",
    onboardingTelegram: "Connect Telegram"
  }
} as const;
type HeaderCopy = (typeof headerCopy)[keyof typeof headerCopy];

const accountLanguages: Array<{ value: ProLanguage; short: string }> = [
  { value: "ru", short: "RU" },
  { value: "uk", short: "UA" },
  { value: "en", short: "EN" }
];

const MAX_PROFILE_AVATAR_BYTES = 2 * 1024 * 1024;

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

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4.8c4.3 0 7.8 3 7.8 6.8s-3.5 6.8-7.8 6.8c-1.3 0-2.6-.3-3.7-.8l-2.9 1 .8-2.7c-1-1-1.8-2.5-1.8-4.3 0-3.8 3.5-6.8 7.8-6.8Z" />
      <path d="M10.15 10.05a2.22 2.22 0 0 1 4.2.95c0 1.3-1.18 1.8-1.9 2.34-.51.38-.79.69-.79 1.43" />
      <circle cx="11.95" cy="15.55" r="0.72" fill="currentColor" stroke="none" />
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

function getOnboardingStepText(
  copy: HeaderCopy,
  step: OnboardingStepId | null
) {
  if (step === "services") return copy.onboardingServices;
  if (step === "schedule") return copy.onboardingSchedule;
  if (step === "booking") return copy.onboardingBooking;
  if (step === "photo") return copy.onboardingPhoto;
  if (step === "telegram") return copy.onboardingTelegram;
  return "";
}

function readFileAsDataUrl(file: File, errorText: string) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(errorText));
    };
    reader.onerror = () => reject(new Error(errorText));
    reader.readAsDataURL(file);
  });
}

export default function ProWorkspaceHeader({
  businessName,
  viewerName,
  viewerAvatarUrl,
  viewerInitials,
  publicBookingUrl = "",
  publicBookingEnabled = false,
  canTogglePublicBooking = false,
  onboardingCta = null
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
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [activeMenu, setActiveMenu] = useState<"share" | "account" | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isTogglingPublicBooking, setIsTogglingPublicBooking] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [menuAvatarUrl, setMenuAvatarUrl] = useState((viewerAvatarUrl || "").trim());
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [publicBookingState, setPublicBookingState] = useState(publicBookingEnabled);
  const pageTitle = useMemo(() => getPageTitle(pathname, language), [language, pathname]);
  const onboardingStepText = onboardingCta
    ? getOnboardingStepText(copy, onboardingCta.step)
    : "";
  const onboardingDesktopLabel = onboardingCta?.completed
    ? copy.onboardingDone
    : onboardingStepText
      ? `🚀 ${onboardingStepText}`
      : "";
  const onboardingTooltip = onboardingCta?.completed
    ? copy.onboardingDone
    : onboardingStepText;
  const canUseNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const refreshNotifications = useCallback(() => {
    const todayDate = formatDateKey(new Date());

    void fetch(`/api/pro/calendar?mode=notifications&date=${todayDate}`)
      .then((response) => response.json())
      .then((payload: { pendingOnlineBookings?: Array<unknown>; pendingJoinRequests?: Array<unknown> }) => {
        const onlineCount = payload.pendingOnlineBookings?.length ?? 0;
        const joinCount = payload.pendingJoinRequests?.length ?? 0;
        setNotificationsCount(onlineCount + joinCount);
      })
      .catch(() => setNotificationsCount(0));
  }, []);

  useEffect(() => {
    setPublicBookingState(publicBookingEnabled);
  }, [publicBookingEnabled]);

  useEffect(() => {
    setMenuAvatarUrl((viewerAvatarUrl || "").trim());
  }, [viewerAvatarUrl]);

  useEffect(() => {
    refreshNotifications();
  }, [pathname, refreshNotifications]);

  useEffect(() => {
    function handleNotificationsRefresh() {
      refreshNotifications();
    }

    const intervalId = window.setInterval(() => {
      refreshNotifications();
    }, 30000);

    window.addEventListener("rezervo-pro-notifications-refresh", handleNotificationsRefresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("rezervo-pro-notifications-refresh", handleNotificationsRefresh);
    };
  }, [refreshNotifications]);

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

  function showToast(message: string, tone: "success" | "warning" | "error" | "info" = "info") {
    window.dispatchEvent(new CustomEvent("rezervo-calendar-toast", { detail: { message, tone } }));
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!file || isUploadingAvatar) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast(copy.avatarImageOnly, "warning");
      return;
    }

    if (file.size > MAX_PROFILE_AVATAR_BYTES) {
      showToast(copy.avatarTooLarge, "warning");
      return;
    }

    setIsUploadingAvatar(true);
    showToast(copy.avatarUploading, "info");

    try {
      const avatarDataUrl = await readFileAsDataUrl(file, copy.avatarUploadFailed);
      const response = await fetch("/api/pro/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional: {
            avatarUrl: avatarDataUrl
          }
        })
      });
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(copy.avatarUploadFailed);
      }

      const persistedAvatarUrl =
        typeof payload === "object" &&
        payload &&
        "workspace" in payload &&
        typeof (payload as { workspace?: { professional?: { avatarUrl?: unknown } } }).workspace?.professional?.avatarUrl === "string"
          ? ((payload as { workspace?: { professional?: { avatarUrl?: string } } }).workspace?.professional?.avatarUrl || "").trim()
          : avatarDataUrl;

      setMenuAvatarUrl(persistedAvatarUrl);
      showToast(copy.avatarUpdated, "success");
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error && error.message ? error.message : copy.avatarUploadFailed, "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function togglePublicBooking() {
    if (!canTogglePublicBooking || isTogglingPublicBooking) {
      return;
    }

    const nextValue = !publicBookingState;
    setPublicBookingState(nextValue);
    setIsTogglingPublicBooking(true);

    try {
      const response = await fetch("/api/pro/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: {
            allowOnlineBooking: nextValue
          }
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "toggle_failed");
      }

      const persistedValue = payload?.workspace?.business?.allowOnlineBooking === true;
      if (persistedValue !== nextValue) {
        throw new Error("toggle_sync_failed");
      }

      setPublicBookingState(persistedValue);
    } catch {
      setPublicBookingState(!nextValue);
    } finally {
      setIsTogglingPublicBooking(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/pro/logout", { method: "POST" });
    } finally {
      router.push(getPostLogoutRedirectPath());
      router.refresh();
    }
  }

  async function applyLanguage(nextLanguage: ProLanguage) {
    if (nextLanguage === language) {
      setActiveMenu(null);
      return;
    }

    document.documentElement.lang = nextLanguage;
    window.localStorage.setItem("rezervo-pro-language", nextLanguage);
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: nextLanguage }));
    setActiveMenu(null);

    try {
      await fetch("/api/pro/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: profileLanguageFromCode(nextLanguage) })
      });
    } catch {
      return;
    }
  }

  return (
    <div className={`${styles.calendarWorkspaceHeader} ${styles.proPageWorkspaceHeader}`}>
      <div className={styles.calendarWorkspaceMeta}>
        <span>{businessName || "Timviz"}</span>
        <div className={styles.calendarWorkspaceTitleRow}>
          <strong>{pageTitle}</strong>
        </div>
      </div>

      <div className={styles.calendarWorkspaceActions}>
        {onboardingCta ? (
          <button
            type="button"
            className={`${styles.calendarOnboardingCta} ${
              onboardingCta.completed ? styles.calendarOnboardingCtaDone : ""
            }`}
            onClick={() => {
              if (onboardingCta.completed || !onboardingCta.href) {
                return;
              }
              router.push(onboardingCta.href);
            }}
            title={onboardingTooltip || copy.onboardingDone}
            aria-label={onboardingTooltip || copy.onboardingDone}
            data-tooltip={onboardingTooltip || copy.onboardingDone}
            disabled={onboardingCta.completed}
          >
            <span className={styles.calendarOnboardingCtaFull}>
              {onboardingDesktopLabel || copy.onboardingDone}
            </span>
            <span className={styles.calendarOnboardingCtaShort}>
              {onboardingCta.completed ? "✅" : "🚀"}
            </span>
          </button>
        ) : null}

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
          className={`${styles.calendarIconButton} ${styles.calendarSupportButton}`}
          aria-label={copy.helpSupport}
          onClick={() => {
            setActiveMenu(null);
            setIsSupportOpen(true);
          }}
        >
          <HelpIcon />
        </button>

        <button
          type="button"
          className={styles.calendarIconButton}
          aria-label={copy.notifications}
          onClick={() => router.push("/pro/calendar?panel=notifications")}
        >
          <BellIcon />
          {notificationsCount ? <span className={styles.calendarNotificationBadge}>{notificationsCount}</span> : null}
        </button>

        <button
          ref={accountMenuButtonRef}
          type="button"
          className={styles.calendarProfileButton}
          aria-label={copy.accountMenu}
          onClick={() => setActiveMenu((current) => (current === "account" ? null : "account"))}
        >
          <ProfileAvatar
            avatarUrl={menuAvatarUrl}
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
            {canTogglePublicBooking ? (
              <button
                type="button"
                className={`${styles.settingsShareToggle} ${publicBookingState ? styles.settingsShareToggleActive : ""}`}
                onClick={() => void togglePublicBooking()}
                aria-pressed={publicBookingState}
                aria-label={copy.publicLink}
                disabled={isTogglingPublicBooking}
              >
                <span className={styles.settingsShareToggleLabel}>
                  {publicBookingState ? copy.publicLinkEnabled : copy.publicLinkDisabled}
                </span>
                <span className={styles.settingsShareToggleTrack}>
                  <span className={styles.settingsShareToggleThumb} />
                </span>
              </button>
            ) : (
              <span className={`${styles.calendarShareStatusPill} ${publicBookingState ? styles.calendarShareStatusPillActive : ""}`}>
                {publicBookingState ? copy.publicLinkEnabled : copy.publicLinkDisabled}
              </span>
            )}
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
            <div className={styles.calendarAccountMenuAvatarEditor}>
              <ProfileAvatar
                avatarUrl={menuAvatarUrl}
                initials={viewerInitials || viewerName.slice(0, 2).toUpperCase() || "RZ"}
                label={viewerName}
                className={styles.calendarAccountMenuAvatar}
                imageClassName={styles.avatarImage}
                fallbackClassName={styles.avatarFallback}
              />
              <button
                type="button"
                className={styles.calendarAccountMenuAvatarEdit}
                onClick={() => avatarInputRef.current?.click()}
                aria-label={copy.uploadAvatar}
                title={copy.uploadAvatar}
                disabled={isUploadingAvatar}
              >
                ✎
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className={styles.calendarAccountMenuAvatarInput}
                onChange={(event) => void handleAvatarUpload(event)}
                disabled={isUploadingAvatar}
              />
            </div>
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
            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                setIsSupportOpen(true);
              }}
            >
              {copy.helpSupport}
            </button>
          </div>

          <div className={styles.calendarAccountMenuSection}>
            <span className={styles.calendarAccountMenuLabel}>{copy.language}</span>
            <div className={styles.calendarLanguageOptions}>
              {accountLanguages.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`${styles.calendarLanguageOption} ${language === item.value ? styles.calendarLanguageOptionActive : ""}`}
                  onClick={() => void applyLanguage(item.value)}
                >
                  {item.short}
                </button>
              ))}
            </div>
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

        <SupportWidget
          isOpen={isSupportOpen}
          onOpen={() => setIsSupportOpen(true)}
          onClose={() => setIsSupportOpen(false)}
          showTrigger={false}
        />
      </div>
    </div>
  );
}
