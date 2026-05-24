"use client";

import ProfileAvatar from "../ProfileAvatar";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import FloatingPopover from "./FloatingPopover";
import { PlanBadge } from "./PlanBadge";
import SupportWidget from "./SupportWidget";
import styles from "./pro.module.css";
import { getPostLogoutRedirectPath } from "./telegram-context";
import { useProLanguage } from "./useProLanguage";
import { uploadProMediaFile } from "./media-upload";
import { profileLanguageFromCode, proLanguageOptions, type ProLanguage } from "./i18n";
import type { OnboardingCtaState, OnboardingStepId } from "../../lib/pro-onboarding";

type ProWorkspaceHeaderProps = {
  businessName: string;
  viewerName: string;
  viewerAvatarUrl?: string;
  viewerInitials?: string;
  isPremium?: boolean;
  publicBookingUrl?: string;
  publicBookingEnabled?: boolean;
  canTogglePublicBooking?: boolean;
  onboardingCta?: OnboardingCtaState | null;
  bookingCredits?: {
    total: number;
    used: number;
    remaining: number;
  };
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
    companySettings: "Настройки компании",
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
    onboardingTelegram: "Підключити Telegram",
    appointments: "Записи этого месяца",
    remaining: "осталось",
    used: "использовано",
    unlimited: "unlim"
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
    companySettings: "Налаштування компанії",
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
    onboardingTelegram: "Підключити Telegram",
    appointments: "Записи цього місяця",
    remaining: "залишилось",
    used: "використано",
    unlimited: "unlim"
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
    companySettings: "Company settings",
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
    onboardingTelegram: "Connect Telegram",
    appointments: "This month's appointments",
    remaining: "remaining",
    used: "used",
    unlimited: "unlim"
  },
  fr: {
    workspace: "Espace de travail",
    calendar: "Calendrier du jour",
    services: "Services",
    clients: "Clients",
    staff: "Équipe",
    staffSchedule: "Planning d’équipe",
    settings: "Réglages",
    publicLink: "Lien public",
    publicLinkTitle: "Lien de réservation en ligne",
    publicLinkHint: "Envoyez-le aux clients, publiez-le sur les réseaux ou copiez-le en un geste.",
    publicLinkCopy: "Copier le lien",
    publicLinkOpen: "Ouvrir la page",
    publicLinkShare: "Partager",
    publicLinkCopied: "Le lien de réservation a été copié.",
    publicLinkSelected: "Le lien est sélectionné. Copiez-le manuellement si le navigateur bloque le presse-papiers.",
    publicLinkDisabled: "Réservation en ligne désactivée",
    publicLinkEnabled: "Réservation en ligne activée",
    notifications: "Notifications",
    accountMenu: "Menu du compte",
    companySettings: "Réglages de l’entreprise",
    helpSupport: "Aide et support",
    uploadAvatar: "Téléverser un avatar",
    avatarUploading: "Téléversement de l’avatar…",
    avatarUpdated: "Avatar mis à jour.",
    avatarImageOnly: "Choisissez une image (JPG, PNG, WEBP).",
    avatarTooLarge: "L’avatar est trop grand. Taille maximale 2 Mo.",
    avatarUploadFailed: "Impossible de mettre à jour l’avatar. Réessayez.",
    language: "Langue",
    logout: "Déconnexion",
    onboardingDone: "✔ Terminé",
    onboardingServices: "Ajouter des services",
    onboardingSchedule: "Configurer l’horaire",
    onboardingBooking: "Activer la réservation",
    onboardingPhoto: "Ajouter des photos",
    onboardingTelegram: "Connecter Telegram",
    appointments: "Rendez-vous du mois",
    remaining: "restants",
    used: "utilisés",
    unlimited: "illimité"
  },
  pl: {
    workspace: "Przestrzeń robocza",
    calendar: "Kalendarz dzienny",
    services: "Usługi",
    clients: "Klienci",
    staff: "Zespół",
    staffSchedule: "Grafik zmian",
    settings: "Ustawienia",
    publicLink: "Link publiczny",
    publicLinkTitle: "Link do rezerwacji online",
    publicLinkHint: "Wyślij go klientom, opublikuj w social mediach albo skopiuj jednym kliknięciem.",
    publicLinkCopy: "Kopiuj link",
    publicLinkOpen: "Otwórz stronę",
    publicLinkShare: "Udostępnij",
    publicLinkCopied: "Link do rezerwacji został skopiowany.",
    publicLinkSelected: "Link jest zaznaczony. Skopiuj go ręcznie, jeśli przeglądarka zablokowała schowek.",
    publicLinkDisabled: "Rezerwacje online wyłączone",
    publicLinkEnabled: "Rezerwacje online włączone",
    notifications: "Powiadomienia",
    accountMenu: "Menu konta",
    companySettings: "Ustawienia firmy",
    helpSupport: "Pomoc i wsparcie",
    uploadAvatar: "Prześlij avatar",
    avatarUploading: "Przesyłanie avatara…",
    avatarUpdated: "Avatar zaktualizowany.",
    avatarImageOnly: "Wybierz plik obrazu (JPG, PNG, WEBP).",
    avatarTooLarge: "Avatar jest za duży. Maksymalnie 2 MB.",
    avatarUploadFailed: "Nie udało się zaktualizować avatara. Spróbuj ponownie.",
    language: "Język",
    logout: "Wyloguj",
    onboardingDone: "✔ Gotowe",
    onboardingServices: "Dodaj usługi",
    onboardingSchedule: "Ustaw grafik",
    onboardingBooking: "Włącz rezerwacje",
    onboardingPhoto: "Dodaj zdjęcia",
    onboardingTelegram: "Połącz Telegram",
    appointments: "Rezerwacje w tym miesiącu",
    remaining: "pozostało",
    used: "wykorzystano",
    unlimited: "bez limitu"
  },
  cs: {
    workspace: "Pracovní prostor",
    calendar: "Denní kalendář",
    services: "Služby",
    clients: "Klienti",
    staff: "Tým",
    staffSchedule: "Rozvrh směn",
    settings: "Nastavení",
    publicLink: "Veřejný odkaz",
    publicLinkTitle: "Odkaz pro online rezervace",
    publicLinkHint: "Pošlete ho klientům, zveřejněte na sítích nebo zkopírujte jedním klepnutím.",
    publicLinkCopy: "Kopírovat odkaz",
    publicLinkOpen: "Otevřít stránku",
    publicLinkShare: "Sdílet",
    publicLinkCopied: "Odkaz pro rezervaci byl zkopírován.",
    publicLinkSelected: "Odkaz je označen. Pokud prohlížeč blokuje schránku, zkopírujte ho ručně.",
    publicLinkDisabled: "Online rezervace vypnuty",
    publicLinkEnabled: "Online rezervace zapnuty",
    notifications: "Oznámení",
    accountMenu: "Menu účtu",
    companySettings: "Nastavení firmy",
    helpSupport: "Pomoc a podpora",
    uploadAvatar: "Nahrát avatar",
    avatarUploading: "Nahrávání avataru…",
    avatarUpdated: "Avatar aktualizován.",
    avatarImageOnly: "Vyberte obrázek (JPG, PNG, WEBP).",
    avatarTooLarge: "Avatar je příliš velký. Maximum 2 MB.",
    avatarUploadFailed: "Avatar se nepodařilo aktualizovat. Zkuste to znovu.",
    language: "Jazyk",
    logout: "Odhlásit se",
    onboardingDone: "✔ Hotovo",
    onboardingServices: "Přidat služby",
    onboardingSchedule: "Nastavit rozvrh",
    onboardingBooking: "Zapnout rezervace",
    onboardingPhoto: "Přidat fotky",
    onboardingTelegram: "Připojit Telegram",
    appointments: "Rezervace tento měsíc",
    remaining: "zbývá",
    used: "využito",
    unlimited: "bez limitu"
  },
  es: {
    workspace: "Espacio de trabajo",
    calendar: "Calendario diario",
    services: "Servicios",
    clients: "Clientes",
    staff: "Equipo",
    staffSchedule: "Horario de turnos",
    settings: "Ajustes",
    publicLink: "Enlace público",
    publicLinkTitle: "Enlace de reserva online",
    publicLinkHint: "Envíalo a clientes, publícalo en redes o cópialo con un toque.",
    publicLinkCopy: "Copiar enlace",
    publicLinkOpen: "Abrir página",
    publicLinkShare: "Compartir",
    publicLinkCopied: "El enlace de reserva se ha copiado.",
    publicLinkSelected: "El enlace está seleccionado. Cópialo manualmente si el navegador bloqueó el portapapeles.",
    publicLinkDisabled: "Reserva online desactivada",
    publicLinkEnabled: "Reserva online activada",
    notifications: "Notificaciones",
    accountMenu: "Menú de cuenta",
    companySettings: "Ajustes de empresa",
    helpSupport: "Ayuda y soporte",
    uploadAvatar: "Subir avatar",
    avatarUploading: "Subiendo avatar…",
    avatarUpdated: "Avatar actualizado.",
    avatarImageOnly: "Elige una imagen (JPG, PNG, WEBP).",
    avatarTooLarge: "El avatar es demasiado grande. Máximo 2 MB.",
    avatarUploadFailed: "No se pudo actualizar el avatar. Inténtalo de nuevo.",
    language: "Idioma",
    logout: "Cerrar sesión",
    onboardingDone: "✔ Listo",
    onboardingServices: "Añadir servicios",
    onboardingSchedule: "Configurar horario",
    onboardingBooking: "Activar reservas",
    onboardingPhoto: "Añadir fotos",
    onboardingTelegram: "Conectar Telegram",
    appointments: "Reservas de este mes",
    remaining: "restantes",
    used: "usadas",
    unlimited: "sin límite"
  },
  de: {
    workspace: "Arbeitsbereich",
    calendar: "Tageskalender",
    services: "Leistungen",
    clients: "Kunden",
    staff: "Team",
    staffSchedule: "Schichtplan",
    settings: "Einstellungen",
    publicLink: "Öffentlicher Link",
    publicLinkTitle: "Link für Online-Buchungen",
    publicLinkHint: "Sende ihn an Kunden, poste ihn in sozialen Medien oder kopiere ihn mit einem Klick.",
    publicLinkCopy: "Link kopieren",
    publicLinkOpen: "Seite öffnen",
    publicLinkShare: "Teilen",
    publicLinkCopied: "Der Buchungslink wurde kopiert.",
    publicLinkSelected: "Der Link ist markiert. Kopiere ihn manuell, falls der Browser die Zwischenablage blockiert.",
    publicLinkDisabled: "Online-Buchung aus",
    publicLinkEnabled: "Online-Buchung an",
    notifications: "Benachrichtigungen",
    accountMenu: "Kontomenü",
    companySettings: "Firmeneinstellungen",
    helpSupport: "Hilfe und Support",
    uploadAvatar: "Avatar hochladen",
    avatarUploading: "Avatar wird hochgeladen…",
    avatarUpdated: "Avatar aktualisiert.",
    avatarImageOnly: "Bitte eine Bilddatei wählen (JPG, PNG, WEBP).",
    avatarTooLarge: "Avatar ist zu groß. Maximal 2 MB.",
    avatarUploadFailed: "Avatar konnte nicht aktualisiert werden. Bitte erneut versuchen.",
    language: "Sprache",
    logout: "Abmelden",
    onboardingDone: "✔ Fertig",
    onboardingServices: "Leistungen hinzufügen",
    onboardingSchedule: "Zeitplan einrichten",
    onboardingBooking: "Buchung aktivieren",
    onboardingPhoto: "Fotos hinzufügen",
    onboardingTelegram: "Telegram verbinden",
    appointments: "Buchungen dieses Monats",
    remaining: "übrig",
    used: "genutzt",
    unlimited: "unbegrenzt"
  }
} as const;
type HeaderCopy = (typeof headerCopy)[keyof typeof headerCopy];

const accountLanguages: Array<{ value: ProLanguage; short: string }> = proLanguageOptions.map((item) => ({
  value: item.code,
  short: item.label
}));

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

function getPageTitle(pathname: string | null, language: ProLanguage) {
  const copy = (headerCopy as unknown as Record<string, typeof headerCopy.en>)[language] ?? headerCopy.en;

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

export default function ProWorkspaceHeader({
  businessName,
  viewerName,
  viewerAvatarUrl,
  viewerInitials,
  isPremium = false,
  publicBookingUrl = "",
  publicBookingEnabled = false,
  canTogglePublicBooking = false,
  onboardingCta = null,
  bookingCredits
}: ProWorkspaceHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, t } = useProLanguage();
  const copy = (headerCopy as unknown as Record<string, typeof headerCopy.en>)[language] ?? headerCopy.en;
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
  const bookingCreditsPercent = bookingCredits && bookingCredits.total > 0
    ? Math.min(100, Math.round((bookingCredits.used / bookingCredits.total) * 100))
    : 0;
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
      .then((payload: {
        pendingOnlineBookings?: Array<unknown>;
        pendingJoinRequests?: Array<unknown>;
        appNotifications?: Array<{ type?: string; readAt?: string | null }>;
      }) => {
        const onlineCount = payload.pendingOnlineBookings?.length ?? 0;
        const joinCount = payload.pendingJoinRequests?.length ?? 0;
        const appCount =
          payload.appNotifications?.filter(
            (item) => !item.readAt && item.type !== "online_booking" && item.type !== "team_join_request"
          ).length ?? 0;
        setNotificationsCount(onlineCount + joinCount + appCount);
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
      const avatarUrl = await uploadProMediaFile({
        file,
        kind: "avatar",
        fallbackError: copy.avatarUploadFailed
      });
      const response = await fetch("/api/pro/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional: {
            avatarUrl
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
          : avatarUrl;

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
        {onboardingCta && !onboardingCta.completed ? (
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
          onClick={() => {
            if (!isPremium) {
              router.push("/pricing");
              return;
            }
            setActiveMenu((current) => (current === "share" ? null : "share"));
          }}
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
              <div className={styles.profileMenuCompanyRow}>
                <span className={styles.profileMenuCompanyName}>{businessName || "Timviz"}</span>
                {isPremium ? <PlanBadge variant="menu" /> : null}
              </div>
            </div>
          </div>

          {bookingCredits ? (
            <div className={styles.profileMenuCreditsCard}>
              <div className={styles.profileMenuCreditsTop}>
                <span>{copy.appointments}</span>
                <strong>{isPremium ? copy.unlimited : `${bookingCredits.remaining}/${bookingCredits.total}`}</strong>
              </div>
              <div className={styles.profileMenuCreditsTrack}>
                <span style={{ width: isPremium ? "100%" : `${bookingCreditsPercent}%` }} />
              </div>
              <small>
                {isPremium
                  ? `${copy.used}: ${copy.unlimited}`
                  : `${copy.remaining}: ${bookingCredits.remaining} · ${copy.used}: ${bookingCredits.used}`}
              </small>
            </div>
          ) : null}

          <div className={styles.calendarAccountMenuSection}>
            <button
              type="button"
              onClick={() => {
                setActiveMenu(null);
                router.push("/pro/settings");
              }}
            >
              {copy.companySettings}
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
