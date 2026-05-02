"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import ProSidebar from "../ProSidebar";
import ProWorkspaceHeader from "../ProWorkspaceHeader";
import styles from "../pro.module.css";
import { languageFromProfile, languageLabels, type ProLanguage } from "../i18n";
import { useProLanguage } from "../useProLanguage";
import { type BusinessPhoto } from "../../../lib/pro-data";

const MAX_BUSINESS_PHOTOS = 5;

type SettingsData = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    email: string;
    phone: string;
    country: string;
    timezone: string;
    language: string;
    currency: string;
    ownerMode: "owner" | "member";
  };
  business: {
    id: string;
    name: string;
    website: string;
    publicBookingPath?: string;
    publicBookingUrl?: string;
    photos?: BusinessPhoto[];
    categories: string[];
    accountType: "solo" | "team";
    serviceMode: string;
    address: string;
    addressDetails: string;
    addressLat: number | null;
    addressLon: number | null;
    allowOnlineBooking?: boolean;
  };
  membership: {
    scope: "owner" | "member" | "pending";
    role: string;
  };
  joinRequests: Array<{
    id: string;
    role: string;
    createdAt: string;
    professional: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    } | null;
  }>;
  bookingCredits: {
    total: number;
    used: number;
    remaining: number;
  };
};

type SettingsViewProps = {
  initialData: SettingsData;
};

type AddressSuggestion = {
  label: string;
  details: string;
  street: string;
  house: string;
  city: string;
  region: string;
  country: string;
  postcode: string;
  lat: number;
  lon: number;
};

type TelegramSettingsSection = "notifications" | "support" | "bot";

type TelegramPanelState = {
  deepLink: string;
  tokenExpiresAt: string;
  connected: boolean;
  chatId: string | null;
  settings: {
    notificationsNewBooking: boolean;
    notificationsReminder: boolean;
    notificationsToday: boolean;
    forwardingEnabled: boolean;
  };
};

const countries = [
  "Ukraine",
  "Russia",
  "Poland",
  "United Kingdom",
  "United States",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Czech Republic",
  "Slovakia",
  "Moldova",
  "Romania",
  "Georgia",
  "Armenia",
  "Kazakhstan",
  "Lithuania",
  "Latvia",
  "Estonia",
  "Turkey",
  "United Arab Emirates",
  "Canada",
  "International"
];
const languages: ProLanguage[] = ["ru", "uk", "en"];
const currencies = ["USD", "RUB", "UAH", "EUR", "PLN", "GBP", "KZT", "GEL", "AED", "CAD"];
const timezones = [
  { value: "Pacific/Honolulu", label: "UTC-10 · Honolulu" },
  { value: "America/Anchorage", label: "UTC-9 · Anchorage" },
  { value: "America/Los_Angeles", label: "UTC-8 · Los Angeles" },
  { value: "America/Denver", label: "UTC-7 · Denver" },
  { value: "America/Chicago", label: "UTC-6 · Chicago" },
  { value: "America/New_York", label: "UTC-5 · New York" },
  { value: "America/Toronto", label: "UTC-5 · Toronto" },
  { value: "UTC", label: "UTC+0 · UTC" },
  { value: "Europe/London", label: "UTC+0 · London" },
  { value: "Europe/Warsaw", label: "UTC+1 · Warsaw" },
  { value: "Europe/Prague", label: "UTC+1 · Prague" },
  { value: "Europe/Berlin", label: "UTC+1 · Berlin" },
  { value: "Europe/Paris", label: "UTC+1 · Paris" },
  { value: "Europe/Madrid", label: "UTC+1 · Madrid" },
  { value: "Europe/Rome", label: "UTC+1 · Rome" },
  { value: "Europe/Kiev", label: "UTC+2 · Kyiv" },
  { value: "Europe/Kaliningrad", label: "UTC+2 · Kaliningrad" },
  { value: "Europe/Moscow", label: "UTC+3 · Moscow" },
  { value: "Europe/Samara", label: "UTC+4 · Samara" },
  { value: "Asia/Tbilisi", label: "UTC+4 · Tbilisi" },
  { value: "Asia/Yerevan", label: "UTC+4 · Yerevan" },
  { value: "Asia/Dubai", label: "UTC+4 · Dubai" },
  { value: "Asia/Yekaterinburg", label: "UTC+5 · Yekaterinburg" },
  { value: "Asia/Almaty", label: "UTC+6 · Almaty" },
  { value: "Asia/Omsk", label: "UTC+6 · Omsk" },
  { value: "Asia/Novosibirsk", label: "UTC+7 · Novosibirsk" },
  { value: "Asia/Krasnoyarsk", label: "UTC+7 · Krasnoyarsk" },
  { value: "Asia/Irkutsk", label: "UTC+8 · Irkutsk" },
  { value: "Asia/Yakutsk", label: "UTC+9 · Yakutsk" },
  { value: "Asia/Vladivostok", label: "UTC+10 · Vladivostok" },
  { value: "Asia/Magadan", label: "UTC+11 · Magadan" },
  { value: "Asia/Kamchatka", label: "UTC+12 · Kamchatka" }
];
const serviceModeGroups = [
  {
    ru: "Клиенты приходят в мое физическое заведение",
    uk: "Клієнти приходять до мого фізичного закладу",
    en: "Clients come to my physical location"
  },
  {
    ru: "Я работаю с выездом к клиенту",
    uk: "Я працюю з виїздом до клієнта",
    en: "I work on-site at the client's location"
  },
  {
    ru: "Я предоставляю услуги онлайн",
    uk: "Я надаю послуги онлайн",
    en: "I provide services online"
  }
] as const;

const settingsExtras = {
  ru: {
    readFileFailed: "Не удалось прочитать файл.",
    uploadPhotoFailed: "Не удалось загрузить фото.",
    saveFailed: "Не удалось сохранить настройки.",
    categoriesPlaceholder: "Ногти, Брови и ресницы",
    joinRequestsTitle: "Запросы на присоединение",
    joinRequestsText: "Подтвердите сотрудников, которые запросили доступ к вашему бизнесу.",
    joinApprove: "Подтвердить",
    joinReject: "Отклонить",
    joinEmpty: "Новых запросов пока нет.",
    joinOwner: "Владелец бизнеса",
    joinRole: "Роль",
    joinRequestSaved: "Запрос обновлён.",
    publicBookingTitle: "Публичная ссылка для записи",
    publicBookingText: "Делитесь этой ссылкой с клиентами, публикуйте её в соцсетях и отправляйте мастерам. По ней откроется страница онлайн-записи.",
    publicBookingEnabled: "Онлайн-запись включена",
    publicBookingDisabled: "Онлайн-запись выключена",
    copyLink: "Копировать ссылку",
    openLink: "Открыть страницу",
    shareLink: "Поделиться",
    linkCopied: "Ссылка для записи скопирована.",
    linkSelected: "Ссылка выделена. Скопируйте её вручную, если браузер запретил буфер обмена.",
    closeSettings: "Закрыть настройки",
    logoutConfirm: "Выйти из кабинета? Если есть свежие изменения, мы постараемся сохранить их перед выходом.",
    telegramTitle: "Telegram-бот Timviz",
    telegramHint: "Подключите бот, управляйте уведомлениями и поддержкой прямо из кабинета.",
    telegramLoading: "Загружаем Telegram-настройки...",
    telegramConnected: "Бот подключен",
    telegramNotConnected: "Бот не подключен",
    telegramChat: "Чат",
    telegramUnavailable: "На сервере пока не настроен Telegram-бот.",
    telegramSectionNotifications: "Уведомления",
    telegramSectionSupport: "Поддержка",
    telegramSectionBot: "Управление ботом",
    telegramNotificationsHint: "Выберите, какие уведомления бот должен отправлять вам в Telegram.",
    telegramSupportHint: "Управляйте пересылкой сообщений в поддержку и быстрым контактом.",
    telegramBotHint: "Массово включайте или выключайте уведомления одним нажатием.",
    telegramConnectButton: "Подключить Telegram",
    telegramOpenBot: "Открыть бота",
    telegramCopyLink: "Копировать ссылку",
    telegramRefreshLink: "Обновить ссылку",
    telegramSaved: "Telegram-настройки обновлены.",
    telegramSaveFailed: "Не удалось обновить Telegram-настройки.",
    telegramAllOn: "Включить всё",
    telegramAllOff: "Выключить всё",
    telegramNewBookings: "Новые записи",
    telegramReminders: "Напоминания",
    telegramToday: "Сводка на сегодня",
    telegramForwarding: "Пересылка в поддержку",
    telegramTokenExpires: "Ссылка активна до"
  },
  uk: {
    readFileFailed: "Не вдалося прочитати файл.",
    uploadPhotoFailed: "Не вдалося завантажити фото.",
    saveFailed: "Не вдалося зберегти налаштування.",
    categoriesPlaceholder: "Нігті, Брови й вії",
    joinRequestsTitle: "Запити на приєднання",
    joinRequestsText: "Підтвердіть співробітників, які запросили доступ до вашого бізнесу.",
    joinApprove: "Підтвердити",
    joinReject: "Відхилити",
    joinEmpty: "Нових запитів поки немає.",
    joinOwner: "Власник бізнесу",
    joinRole: "Роль",
    joinRequestSaved: "Запит оновлено.",
    publicBookingTitle: "Публічне посилання для запису",
    publicBookingText: "Діліться цим посиланням із клієнтами, публікуйте його в соцмережах і надсилайте майстрам. За ним відкриється сторінка онлайн-запису.",
    publicBookingEnabled: "Онлайн-запис увімкнено",
    publicBookingDisabled: "Онлайн-запис вимкнено",
    copyLink: "Скопіювати посилання",
    openLink: "Відкрити сторінку",
    shareLink: "Поділитися",
    linkCopied: "Посилання для запису скопійовано.",
    linkSelected: "Посилання виділено. Скопіюйте його вручну, якщо браузер заборонив буфер обміну.",
    closeSettings: "Закрити налаштування",
    logoutConfirm: "Вийти з кабінету? Якщо є свіжі зміни, ми спробуємо зберегти їх перед виходом.",
    telegramTitle: "Telegram-бот Timviz",
    telegramHint: "Підключіть бота, керуйте сповіщеннями та підтримкою прямо з кабінету.",
    telegramLoading: "Завантажуємо Telegram-налаштування...",
    telegramConnected: "Бот підключений",
    telegramNotConnected: "Бот не підключений",
    telegramChat: "Чат",
    telegramUnavailable: "На сервері поки не налаштовано Telegram-бота.",
    telegramSectionNotifications: "Сповіщення",
    telegramSectionSupport: "Підтримка",
    telegramSectionBot: "Керування ботом",
    telegramNotificationsHint: "Оберіть, які сповіщення бот має надсилати вам у Telegram.",
    telegramSupportHint: "Керуйте пересилкою повідомлень у підтримку та швидким контактом.",
    telegramBotHint: "Масово вмикайте або вимикайте сповіщення одним натисканням.",
    telegramConnectButton: "Підключити Telegram",
    telegramOpenBot: "Відкрити бота",
    telegramCopyLink: "Скопіювати посилання",
    telegramRefreshLink: "Оновити посилання",
    telegramSaved: "Telegram-налаштування оновлено.",
    telegramSaveFailed: "Не вдалося оновити Telegram-налаштування.",
    telegramAllOn: "Увімкнути все",
    telegramAllOff: "Вимкнути все",
    telegramNewBookings: "Нові записи",
    telegramReminders: "Нагадування",
    telegramToday: "Зведення на сьогодні",
    telegramForwarding: "Пересилка в підтримку",
    telegramTokenExpires: "Посилання активне до"
  },
  en: {
    readFileFailed: "Could not read the file.",
    uploadPhotoFailed: "Could not upload the photo.",
    saveFailed: "Could not save settings.",
    categoriesPlaceholder: "Nails, Brows and lashes",
    joinRequestsTitle: "Join requests",
    joinRequestsText: "Approve specialists who requested access to your business.",
    joinApprove: "Approve",
    joinReject: "Reject",
    joinEmpty: "No new requests yet.",
    joinOwner: "Business owner",
    joinRole: "Role",
    joinRequestSaved: "Request updated.",
    publicBookingTitle: "Public booking link",
    publicBookingText: "Share this link with clients, post it on social media, and send it to your specialists. It opens the online booking page.",
    publicBookingEnabled: "Online booking is on",
    publicBookingDisabled: "Online booking is off",
    copyLink: "Copy link",
    openLink: "Open page",
    shareLink: "Share",
    linkCopied: "The booking link has been copied.",
    linkSelected: "The link is selected. Copy it manually if the browser blocked clipboard access.",
    closeSettings: "Close settings",
    logoutConfirm: "Sign out now? If there are recent changes, we will try to save them before leaving.",
    telegramTitle: "Timviz Telegram bot",
    telegramHint: "Connect the bot and manage alerts and support directly in your dashboard.",
    telegramLoading: "Loading Telegram settings...",
    telegramConnected: "Bot connected",
    telegramNotConnected: "Bot not connected",
    telegramChat: "Chat",
    telegramUnavailable: "Telegram bot is not configured on the server yet.",
    telegramSectionNotifications: "Notifications",
    telegramSectionSupport: "Support",
    telegramSectionBot: "Bot control",
    telegramNotificationsHint: "Choose which updates the bot should send you in Telegram.",
    telegramSupportHint: "Control support forwarding and quick contact.",
    telegramBotHint: "Turn all Telegram notifications on or off in one click.",
    telegramConnectButton: "Connect Telegram",
    telegramOpenBot: "Open bot",
    telegramCopyLink: "Copy link",
    telegramRefreshLink: "Refresh link",
    telegramSaved: "Telegram settings updated.",
    telegramSaveFailed: "Could not update Telegram settings.",
    telegramAllOn: "Enable all",
    telegramAllOff: "Disable all",
    telegramNewBookings: "New bookings",
    telegramReminders: "Reminders",
    telegramToday: "Today summary",
    telegramForwarding: "Forward to support",
    telegramTokenExpires: "Link is active until"
  }
} as const;

function localizeServiceMode(value: string, language: ProLanguage) {
  const match = serviceModeGroups.find((mode) =>
    Object.values(mode).some((label) => label.toLowerCase() === value.toLowerCase())
  );

  return match ? match[language] : value;
}

function inferCurrency(country: string) {
  const lower = country.toLowerCase();
  if (lower.includes("ukraine")) return "UAH";
  if (lower.includes("russia")) return "RUB";
  if (lower.includes("poland")) return "PLN";
  if (lower.includes("kingdom")) return "GBP";
  if (lower.includes("states")) return "USD";
  return "USD";
}

function normalizePhotos(photos: BusinessPhoto[] = []) {
  const trimmed = photos
    .filter((photo) => typeof photo.url === "string" && photo.url.trim().length > 0)
    .slice(0, MAX_BUSINESS_PHOTOS)
    .map((photo) => ({
      ...photo,
      url: photo.url.trim()
    }));

  if (trimmed.length === 0) {
    return [];
  }

  const primaryIndex = trimmed.findIndex((photo) => photo.isPrimary);

  return trimmed.map((photo, index) => ({
    ...photo,
    isPrimary: primaryIndex >= 0 ? primaryIndex === index : index === 0
  }));
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

export default function SettingsView({ initialData }: SettingsViewProps) {
  const router = useRouter();
  const initialLanguage = languageFromProfile(initialData.professional.language);
  const { t, language } = useProLanguage(initialLanguage);
  const copy = settingsExtras[language];
  const serviceModes = serviceModeGroups.map((mode) => mode[language]);
  const [data, setData] = useState(initialData);
  const selectedServiceMode = localizeServiceMode(data.business.serviceMode, language);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [joinRequests, setJoinRequests] = useState(initialData.joinRequests);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [telegramPanel, setTelegramPanel] = useState<TelegramPanelState | null>(null);
  const [telegramSection, setTelegramSection] = useState<TelegramSettingsSection>("notifications");
  const [isTelegramLoading, setIsTelegramLoading] = useState(true);
  const [isTelegramSaving, setIsTelegramSaving] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const isHydratedRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef("");
  const latestSnapshotRef = useRef("");
  const publicBookingInputRef = useRef<HTMLInputElement | null>(null);
  const publicBookingUrl = data.business.publicBookingUrl ?? "";
  const canUseNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  function formatTelegramExpiry(value: string) {
    if (!value) {
      return "";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleString();
  }

  async function loadTelegramPanel(silent = false) {
    if (!silent) {
      setIsTelegramLoading(true);
    }
    setTelegramError("");

    try {
      const response = await fetch("/api/pro/telegram/connect", {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      });

      const payload = (await response.json()) as
        | (TelegramPanelState & { ok?: boolean })
        | { error?: string };

      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error || copy.telegramSaveFailed : copy.telegramSaveFailed);
      }

      setTelegramPanel({
        deepLink: "deepLink" in payload && typeof payload.deepLink === "string" ? payload.deepLink : "",
        tokenExpiresAt: "tokenExpiresAt" in payload && typeof payload.tokenExpiresAt === "string" ? payload.tokenExpiresAt : "",
        connected: "connected" in payload ? payload.connected === true : false,
        chatId: "chatId" in payload && typeof payload.chatId === "string" ? payload.chatId : null,
        settings: {
          notificationsNewBooking:
            "settings" in payload && typeof payload.settings?.notificationsNewBooking === "boolean"
              ? payload.settings.notificationsNewBooking
              : true,
          notificationsReminder:
            "settings" in payload && typeof payload.settings?.notificationsReminder === "boolean"
              ? payload.settings.notificationsReminder
              : true,
          notificationsToday:
            "settings" in payload && typeof payload.settings?.notificationsToday === "boolean"
              ? payload.settings.notificationsToday
              : true,
          forwardingEnabled:
            "settings" in payload && typeof payload.settings?.forwardingEnabled === "boolean"
              ? payload.settings.forwardingEnabled
              : true
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.telegramSaveFailed;
      setTelegramError(message);
    } finally {
      setIsTelegramLoading(false);
    }
  }

  async function updateTelegramSettings(patch: Partial<TelegramPanelState["settings"]>) {
    setIsTelegramSaving(true);
    setTelegramError("");

    try {
      const response = await fetch("/api/pro/telegram/connect", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(patch)
      });

      const payload = (await response.json()) as
        | (TelegramPanelState & { ok?: boolean })
        | { error?: string };

      if (!response.ok) {
        throw new Error(payload && "error" in payload ? payload.error || copy.telegramSaveFailed : copy.telegramSaveFailed);
      }

      if ("connected" in payload) {
        setTelegramPanel({
          deepLink: typeof payload.deepLink === "string" ? payload.deepLink : telegramPanel?.deepLink || "",
          tokenExpiresAt:
            typeof payload.tokenExpiresAt === "string" ? payload.tokenExpiresAt : telegramPanel?.tokenExpiresAt || "",
          connected: payload.connected === true,
          chatId: typeof payload.chatId === "string" ? payload.chatId : null,
          settings: {
            notificationsNewBooking:
              typeof payload.settings?.notificationsNewBooking === "boolean"
                ? payload.settings.notificationsNewBooking
                : telegramPanel?.settings.notificationsNewBooking ?? true,
            notificationsReminder:
              typeof payload.settings?.notificationsReminder === "boolean"
                ? payload.settings.notificationsReminder
                : telegramPanel?.settings.notificationsReminder ?? true,
            notificationsToday:
              typeof payload.settings?.notificationsToday === "boolean"
                ? payload.settings.notificationsToday
                : telegramPanel?.settings.notificationsToday ?? true,
            forwardingEnabled:
              typeof payload.settings?.forwardingEnabled === "boolean"
                ? payload.settings.forwardingEnabled
                : telegramPanel?.settings.forwardingEnabled ?? true
          }
        });
      }

      setStatus(copy.telegramSaved);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.telegramSaveFailed;
      setTelegramError(message);
      setStatus(message);
    } finally {
      setIsTelegramSaving(false);
    }
  }

  function buildTelegramToggleClass(active: boolean) {
    return `${styles.settingsToggle} ${active ? styles.settingsToggleActive : ""}`;
  }

  useEffect(() => {
    window.localStorage.setItem("rezervo-pro-language", initialLanguage);
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: initialLanguage }));
  }, [initialLanguage]);

  useEffect(() => {
    void loadTelegramPanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateProfessional(field: keyof SettingsData["professional"], value: string) {
    setData((current) => ({
      ...current,
      professional: {
        ...current.professional,
        [field]: value,
        ...(field === "country" ? { currency: inferCurrency(value) } : {})
      }
    }));
  }

  function updateBusiness(
    field: Exclude<keyof SettingsData["business"], "photos">,
    value: string | string[] | number | null | boolean | "solo" | "team"
  ) {
    setData((current) => ({
      ...current,
      business: {
        ...current.business,
        [field]: value
      }
    }));
  }

  function updateBusinessPhotos(nextPhotos: BusinessPhoto[]) {
    setData((current) => ({
      ...current,
      business: {
        ...current.business,
        photos: normalizePhotos(nextPhotos)
      }
    }));
  }

  function selectPublicBookingUrl() {
    publicBookingInputRef.current?.focus();
    publicBookingInputRef.current?.select();
  }

  async function copyPublicBookingUrl() {
    if (!publicBookingUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicBookingUrl);
      setStatus(copy.linkCopied);
    } catch {
      selectPublicBookingUrl();
      setStatus(copy.linkSelected);
    }
  }

  async function sharePublicBookingUrl() {
    if (!publicBookingUrl) {
      return;
    }

    if (!canUseNativeShare) {
      await copyPublicBookingUrl();
      return;
    }

    try {
      await navigator.share({
        title: data.business.name || "Timviz",
        text: copy.publicBookingTitle,
        url: publicBookingUrl
      });
    } catch {
      // Ignore cancelled native share sheets.
    }
  }

  async function copyTelegramLink() {
    const deepLink = telegramPanel?.deepLink || "";
    if (!deepLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(deepLink);
      setStatus(copy.linkCopied);
    } catch {
      setStatus(copy.linkSelected);
    }
  }

  function openTelegramBotLink() {
    const deepLink = telegramPanel?.deepLink || "";
    if (!deepLink) {
      return;
    }
    window.open(deepLink, "_blank", "noopener,noreferrer");
  }

  async function toggleTelegramSetting(key: keyof TelegramPanelState["settings"]) {
    if (!telegramPanel || isTelegramSaving) {
      return;
    }

    await updateTelegramSettings({
      [key]: !telegramPanel.settings[key]
    });
  }

  async function handleBusinessPhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const currentPhotos = data.business.photos ?? [];
    const availableSlots = Math.max(0, MAX_BUSINESS_PHOTOS - currentPhotos.length);

    if (availableSlots === 0) {
      setStatus(t.settings.photoLimit);
      return;
    }

    try {
      const filesToRead = selectedFiles.slice(0, availableSlots);
      const uploaded = await Promise.all(
        filesToRead.map(async (file, index) => ({
          id: crypto.randomUUID(),
          url: await readFileAsDataUrl(file, copy.readFileFailed),
          isPrimary: currentPhotos.length === 0 && index === 0,
          createdAt: new Date().toISOString()
        }))
      );

      updateBusinessPhotos([...currentPhotos, ...uploaded]);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.uploadPhotoFailed);
    }
  }

  const mapEmbedUrl = useMemo(() => {
    if (data.business.addressLat === null || data.business.addressLon === null) {
      return "";
    }

    const delta = 0.008;
    const left = data.business.addressLon - delta;
    const right = data.business.addressLon + delta;
    const top = data.business.addressLat + delta;
    const bottom = data.business.addressLat - delta;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${data.business.addressLat}%2C${data.business.addressLon}`;
  }, [data.business.addressLat, data.business.addressLon]);
  const hasSelectedMapAddress = data.business.addressLat !== null && data.business.addressLon !== null;

  const structuredAddress = useMemo(() => {
    const lines = data.business.addressDetails
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      street: lines[0] || data.business.address || "",
      city: lines[1] || "",
      region: lines[2] || "",
      country: lines[3] || data.professional.country || ""
    };
  }, [data.business.address, data.business.addressDetails, data.professional.country]);

  useEffect(() => {
    if (data.business.address.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const response = await fetch(
          `/api/address/search?q=${encodeURIComponent(data.business.address)}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" }
          }
        );
        const payload = (await response.json()) as { results?: Array<{
          display_name: string;
          lat: string;
          lon: string;
          address?: Record<string, string>;
        }> };
        const result = Array.isArray(payload.results) ? payload.results : [];

        setAddressSuggestions(
          result.map((item) => {
            const address = item.address ?? {};
            const house = address.house_number ?? "";
            const street = address.road ?? address.pedestrian ?? address.footway ?? address.neighbourhood ?? "";
            const city = address.city ?? address.town ?? address.village ?? address.municipality ?? "";
            const region = address.state ?? address.region ?? address.county ?? "";
            const country = address.country ?? "";
            const postcode = address.postcode ?? "";
            const primaryLine = [street, house].filter(Boolean).join(", ") || item.display_name.split(",")[0]?.trim() || item.display_name;

            return {
              label: item.display_name,
              details: [primaryLine, city, region, postcode, country].filter(Boolean).join("\n"),
              street,
              house,
              city,
              region,
              country,
              postcode,
              lat: Number(item.lat),
              lon: Number(item.lon)
            };
          })
        );
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [data.business.address]);

  const autosaveSnapshot = useMemo(
    () =>
      JSON.stringify({
        professional: {
          firstName: data.professional.firstName,
          lastName: data.professional.lastName,
          email: data.professional.email,
          phone: data.professional.phone,
          country: data.professional.country,
          timezone: data.professional.timezone,
          language: data.professional.language,
          currency: data.professional.currency
        },
        business: {
          name: data.business.name,
          website: data.business.website,
          photos: data.business.photos ?? [],
          categories: data.business.categories,
          accountType: data.business.accountType,
          serviceMode: data.business.serviceMode,
          address: data.business.address,
          addressDetails: data.business.addressDetails,
          addressLat: data.business.addressLat,
          addressLon: data.business.addressLon,
          allowOnlineBooking: data.business.allowOnlineBooking === true
        }
      }),
    [data]
  );

  useEffect(() => {
    latestSnapshotRef.current = autosaveSnapshot;
  }, [autosaveSnapshot]);

  useEffect(() => {
    lastSavedSnapshotRef.current = JSON.stringify({
      professional: {
        firstName: initialData.professional.firstName,
        lastName: initialData.professional.lastName,
        email: initialData.professional.email,
        phone: initialData.professional.phone,
        country: initialData.professional.country,
        timezone: initialData.professional.timezone,
        language: initialData.professional.language,
        currency: initialData.professional.currency
      },
      business: {
        name: initialData.business.name,
        website: initialData.business.website,
        photos: initialData.business.photos ?? [],
        categories: initialData.business.categories,
        accountType: initialData.business.accountType,
        serviceMode: initialData.business.serviceMode,
        address: initialData.business.address,
        addressDetails: initialData.business.addressDetails,
        addressLat: initialData.business.addressLat,
        addressLon: initialData.business.addressLon,
        allowOnlineBooking: initialData.business.allowOnlineBooking === true
      }
    });
    isHydratedRef.current = true;
    setJoinRequests(initialData.joinRequests);
  }, [initialData]);

  async function handleJoinRequestAction(requestId: string, action: "approve" | "reject") {
    setStatus("");
    try {
      const response = await fetch("/api/pro/join-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || copy.saveFailed);
      }

      setJoinRequests((current) => current.filter((item) => item.id !== requestId));
      setStatus(copy.joinRequestSaved);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.saveFailed);
    }
  }

  function applyAddress(suggestion: AddressSuggestion) {
    setData((current) => ({
      ...current,
      business: {
        ...current.business,
        address: suggestion.label,
        addressDetails: suggestion.details,
        addressLat: suggestion.lat,
        addressLon: suggestion.lon
      },
      professional: {
        ...current.professional,
        country: suggestion.country || current.professional.country,
        currency: suggestion.country ? inferCurrency(suggestion.country) : current.professional.currency
      }
    }));
    setAddressSuggestions([]);
  }

  useEffect(() => {
    if (!isHydratedRef.current || isSaving || isTopUpLoading) {
      return;
    }

    if (autosaveSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      void saveSettings(0, true);
    }, 700);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [autosaveSnapshot, isSaving, isTopUpLoading]);

  async function saveSettings(topUpCredits = 0, silent = false) {
    const snapshotAtRequestStart = latestSnapshotRef.current;

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    setStatus("");
    topUpCredits ? setIsTopUpLoading(true) : setIsSaving(true);

    try {
      const response = await fetch("/api/pro/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professional: {
            firstName: data.professional.firstName,
            lastName: data.professional.lastName,
            email: data.professional.email,
            phone: data.professional.phone,
            country: data.professional.country,
            timezone: data.professional.timezone,
            language: data.professional.language,
            currency: data.professional.currency
          },
          business: {
            name: data.business.name,
            website: data.business.website,
            photos: data.business.photos ?? [],
            categories: data.business.categories,
            accountType: data.business.accountType,
            serviceMode: data.business.serviceMode,
            address: data.business.address,
            addressDetails: data.business.addressDetails,
            addressLat: data.business.addressLat,
            addressLon: data.business.addressLon,
            allowOnlineBooking: data.business.allowOnlineBooking === true
          },
          newPassword: password,
          topUpCredits
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || copy.saveFailed);
      }

      const next = payload as {
        workspace: {
          professional: SettingsData["professional"];
          business: SettingsData["business"];
          membership: SettingsData["membership"];
        };
        bookingCredits: SettingsData["bookingCredits"];
      };

      if (silent && latestSnapshotRef.current !== snapshotAtRequestStart) {
        return;
      }

      setData({
        professional: {
          ...next.workspace.professional,
          currency: next.workspace.professional.currency || data.professional.currency
        },
        business: next.workspace.business,
        membership: next.workspace.membership,
        joinRequests,
        bookingCredits: next.bookingCredits
      });
      lastSavedSnapshotRef.current = JSON.stringify({
        professional: {
          firstName: next.workspace.professional.firstName,
          lastName: next.workspace.professional.lastName,
          email: next.workspace.professional.email,
          phone: next.workspace.professional.phone,
          country: next.workspace.professional.country,
          timezone: next.workspace.professional.timezone,
          language: next.workspace.professional.language,
          currency: next.workspace.professional.currency || data.professional.currency
        },
        business: {
          name: next.workspace.business.name,
          website: next.workspace.business.website,
          photos: next.workspace.business.photos ?? [],
          categories: next.workspace.business.categories,
          accountType: next.workspace.business.accountType,
          serviceMode: next.workspace.business.serviceMode,
          address: next.workspace.business.address,
          addressDetails: next.workspace.business.addressDetails,
          addressLat: next.workspace.business.addressLat,
          addressLon: next.workspace.business.addressLon,
          allowOnlineBooking: next.workspace.business.allowOnlineBooking === true
        }
      });
      setPassword("");
      setStatus(topUpCredits ? t.settings.creditsAdded : silent ? t.common.savedAuto : t.settings.saved);

      const languageCode = languageFromProfile(data.professional.language);
      window.localStorage.setItem("rezervo-pro-language", languageCode);
      window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: languageCode }));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.saveFailed);
    } finally {
      setIsSaving(false);
      setIsTopUpLoading(false);
    }
  }

  async function handleLogoutConfirm() {
    if (typeof window !== "undefined" && !window.confirm(copy.logoutConfirm)) {
      return;
    }

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (!isSaving && autosaveSnapshot !== lastSavedSnapshotRef.current) {
      await saveSettings(0, true);
    }

    await fetch("/api/pro/logout", {
      method: "POST"
    });

    router.push("/pro/login");
    router.refresh();
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar
        active="settings"
        professionalId={initialData.professional.id}
        canManageStaff={initialData.membership.scope === "owner"}
      />
      <section className={styles.settingsShell}>
        <ProWorkspaceHeader
          businessName={initialData.business.name}
          viewerName={`${initialData.professional.firstName} ${initialData.professional.lastName}`.trim() || initialData.professional.email}
          viewerAvatarUrl={initialData.professional.avatarUrl}
          viewerInitials={`${initialData.professional.firstName?.[0] ?? ""}${initialData.professional.lastName?.[0] ?? ""}`.toUpperCase() || "RZ"}
          publicBookingUrl={initialData.business.publicBookingUrl}
          publicBookingEnabled={initialData.business.allowOnlineBooking === true}
          canTogglePublicBooking={initialData.membership.scope === "owner"}
        />

        <header className={styles.settingsHero}>
          <button
            type="button"
            className={styles.settingsCloseButton}
            aria-label={copy.closeSettings}
            title={copy.closeSettings}
            onClick={() => {
              void handleLogoutConfirm();
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
          <div>
            <p className={styles.eyebrow}>{t.settings.kicker}</p>
            <h1>{t.settings.title}</h1>
          </div>
          <div className={styles.settingsHeroActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void saveSettings()}
              disabled={isSaving}
            >
              {isSaving ? t.common.autosaving : autosaveSnapshot === lastSavedSnapshotRef.current ? t.common.savedAuto : t.common.saveNow}
            </button>
          </div>
        </header>

        {status ? <div className={styles.settingsStatus}>{status}</div> : null}

        <div className={styles.settingsGrid}>
          {data.membership.scope === "owner" ? (
            <section className={styles.settingsCard}>
              <div className={styles.settingsCardHeader}>
                <div>
                  <span>{copy.joinOwner}</span>
                  <h2>{copy.joinRequestsTitle}</h2>
                  <p className={styles.choiceText}>{copy.joinRequestsText}</p>
                </div>
              </div>
              <div className={styles.serviceStack}>
                {joinRequests.length === 0 ? (
                  <div className={styles.generatedBlock}>{copy.joinEmpty}</div>
                ) : (
                  joinRequests.map((request) => (
                    <div key={request.id} className={styles.serviceOption}>
                      <span className={styles.choiceTitle}>
                        {request.professional ? `${request.professional.firstName} ${request.professional.lastName}`.trim() : copy.joinOwner}
                      </span>
                      <span className={styles.choiceText}>{request.professional?.email || ""}</span>
                      <span className={styles.choiceText}>{request.professional?.phone || ""}</span>
                      <span className={styles.choiceText}>{copy.joinRole}: {request.role}</span>
                      <div className={styles.templateActions}>
                        <button type="button" className={styles.primaryButton} onClick={() => void handleJoinRequestAction(request.id, "approve")}>
                          {copy.joinApprove}
                        </button>
                        <button type="button" className={styles.ghostButton} onClick={() => void handleJoinRequestAction(request.id, "reject")}>
                          {copy.joinReject}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : null}

          <section className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div>
                <span>Telegram</span>
                <h2>{copy.telegramTitle}</h2>
              </div>
              <span
                className={`${styles.settingsShareStatus} ${telegramPanel?.connected ? styles.settingsShareStatusActive : ""}`}
              >
                {telegramPanel?.connected ? copy.telegramConnected : copy.telegramNotConnected}
              </span>
            </div>
            <p className={styles.settingsCardHint}>{copy.telegramHint}</p>

            {isTelegramLoading ? (
              <div className={styles.generatedBlock}>{copy.telegramLoading}</div>
            ) : null}

            {!isTelegramLoading && telegramError ? (
              <div className={styles.generatedBlock}>
                <strong>{copy.telegramUnavailable}</strong>
                <p className={styles.generatedHint}>{telegramError}</p>
                <div className={styles.templateActions}>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => void loadTelegramPanel()}
                  >
                    {copy.telegramRefreshLink}
                  </button>
                </div>
              </div>
            ) : null}

            {!isTelegramLoading && !telegramError && telegramPanel ? (
              <div className={styles.serviceStack}>
                <div className={styles.generatedBlock}>
                  <span className={styles.choiceText}>
                    {copy.telegramChat}: {telegramPanel.chatId || "—"}
                  </span>
                  <span className={styles.choiceText}>
                    {copy.telegramTokenExpires}: {formatTelegramExpiry(telegramPanel.tokenExpiresAt) || "—"}
                  </span>

                  <div className={styles.templateActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={openTelegramBotLink}
                      disabled={!telegramPanel.deepLink}
                    >
                      {telegramPanel.connected ? copy.telegramOpenBot : copy.telegramConnectButton}
                    </button>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => void copyTelegramLink()}
                      disabled={!telegramPanel.deepLink}
                    >
                      {copy.telegramCopyLink}
                    </button>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => void loadTelegramPanel()}
                      disabled={isTelegramSaving}
                    >
                      {copy.telegramRefreshLink}
                    </button>
                  </div>
                </div>

                <div className={styles.templateActions}>
                  <button
                    type="button"
                    className={telegramSection === "notifications" ? styles.primaryButton : styles.ghostButton}
                    onClick={() => setTelegramSection("notifications")}
                  >
                    {copy.telegramSectionNotifications}
                  </button>
                  <button
                    type="button"
                    className={telegramSection === "support" ? styles.primaryButton : styles.ghostButton}
                    onClick={() => setTelegramSection("support")}
                  >
                    {copy.telegramSectionSupport}
                  </button>
                  <button
                    type="button"
                    className={telegramSection === "bot" ? styles.primaryButton : styles.ghostButton}
                    onClick={() => setTelegramSection("bot")}
                  >
                    {copy.telegramSectionBot}
                  </button>
                </div>

                {telegramSection === "notifications" ? (
                  <div className={styles.generatedBlock}>
                    <p className={styles.generatedHint}>{copy.telegramNotificationsHint}</p>
                    <button
                      type="button"
                      className={buildTelegramToggleClass(telegramPanel.settings.notificationsNewBooking)}
                      onClick={() => void toggleTelegramSetting("notificationsNewBooking")}
                      disabled={isTelegramSaving}
                    >
                      <span className={styles.settingsToggleText}>{copy.telegramNewBookings}</span>
                      <span className={styles.settingsToggleTrack}>
                        <span className={styles.settingsToggleThumb} />
                      </span>
                    </button>
                    <button
                      type="button"
                      className={buildTelegramToggleClass(telegramPanel.settings.notificationsReminder)}
                      onClick={() => void toggleTelegramSetting("notificationsReminder")}
                      disabled={isTelegramSaving}
                    >
                      <span className={styles.settingsToggleText}>{copy.telegramReminders}</span>
                      <span className={styles.settingsToggleTrack}>
                        <span className={styles.settingsToggleThumb} />
                      </span>
                    </button>
                    <button
                      type="button"
                      className={buildTelegramToggleClass(telegramPanel.settings.notificationsToday)}
                      onClick={() => void toggleTelegramSetting("notificationsToday")}
                      disabled={isTelegramSaving}
                    >
                      <span className={styles.settingsToggleText}>{copy.telegramToday}</span>
                      <span className={styles.settingsToggleTrack}>
                        <span className={styles.settingsToggleThumb} />
                      </span>
                    </button>
                  </div>
                ) : null}

                {telegramSection === "support" ? (
                  <div className={styles.generatedBlock}>
                    <p className={styles.generatedHint}>{copy.telegramSupportHint}</p>
                    <button
                      type="button"
                      className={buildTelegramToggleClass(telegramPanel.settings.forwardingEnabled)}
                      onClick={() => void toggleTelegramSetting("forwardingEnabled")}
                      disabled={isTelegramSaving}
                    >
                      <span className={styles.settingsToggleText}>{copy.telegramForwarding}</span>
                      <span className={styles.settingsToggleTrack}>
                        <span className={styles.settingsToggleThumb} />
                      </span>
                    </button>
                    <div className={styles.templateActions}>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={openTelegramBotLink}
                        disabled={!telegramPanel.deepLink}
                      >
                        {copy.telegramOpenBot}
                      </button>
                    </div>
                  </div>
                ) : null}

                {telegramSection === "bot" ? (
                  <div className={styles.generatedBlock}>
                    <p className={styles.generatedHint}>{copy.telegramBotHint}</p>
                    <div className={styles.templateActions}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() =>
                          void updateTelegramSettings({
                            notificationsNewBooking: true,
                            notificationsReminder: true,
                            notificationsToday: true
                          })
                        }
                        disabled={isTelegramSaving}
                      >
                        {copy.telegramAllOn}
                      </button>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() =>
                          void updateTelegramSettings({
                            notificationsNewBooking: false,
                            notificationsReminder: false,
                            notificationsToday: false
                          })
                        }
                        disabled={isTelegramSaving}
                      >
                        {copy.telegramAllOff}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div>
                <span>{t.settings.owner}</span>
                <h2>{t.settings.contacts}</h2>
              </div>
            </div>
            <div className={styles.settingsFormGrid}>
              <label>
                {t.settings.firstName}
                <input className={styles.input} value={data.professional.firstName} onChange={(event) => updateProfessional("firstName", event.target.value)} />
              </label>
              <label>
                {t.settings.lastName}
                <input className={styles.input} value={data.professional.lastName} onChange={(event) => updateProfessional("lastName", event.target.value)} />
              </label>
              <label>
                {t.settings.email}
                <input className={styles.input} type="email" value={data.professional.email} onChange={(event) => updateProfessional("email", event.target.value)} />
              </label>
              <label>
                {t.settings.phone}
                <input className={styles.input} value={data.professional.phone} onChange={(event) => updateProfessional("phone", event.target.value)} placeholder="+38 067 000 00 00" />
              </label>
              <label className={styles.settingsWideField}>
                {t.settings.newPassword}
                <input className={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.settings.passwordPlaceholder} />
              </label>
            </div>
          </section>

          <section className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div>
                <span>{t.settings.business}</span>
                <h2>{t.settings.businessFormat}</h2>
              </div>
            </div>
            <div className={styles.settingsFormGrid}>
              <label>
                {t.settings.businessName}
                <input className={styles.input} value={data.business.name} onChange={(event) => updateBusiness("name", event.target.value)} />
              </label>
              <label>
                {t.settings.website}
                <input className={styles.input} value={data.business.website} onChange={(event) => updateBusiness("website", event.target.value)} placeholder="www.yoursite.com" />
              </label>
              <label>
                {t.settings.accountType}
                <select className={styles.select} value={data.business.accountType} onChange={(event) => updateBusiness("accountType", event.target.value as "solo" | "team")}>
                  <option value="solo">{t.settings.solo}</option>
                  <option value="team">{t.settings.team}</option>
                </select>
              </label>
              <label>
                {t.settings.serviceModel}
                <select className={styles.select} value={selectedServiceMode} onChange={(event) => updateBusiness("serviceMode", event.target.value)}>
                  {serviceModes.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </label>
              <label className={styles.settingsWideField}>
                {t.settings.categories}
                <input
                  className={styles.input}
                  value={data.business.categories.join(", ")}
                  onChange={(event) => updateBusiness("categories", event.target.value.split(","))}
                  placeholder={copy.categoriesPlaceholder}
                />
              </label>
              <div className={`${styles.settingsWideField} ${styles.settingsShareCard}`}>
                <div className={styles.settingsShareCardHeader}>
                  <div>
                    <strong>{copy.publicBookingTitle}</strong>
                    <p>{copy.publicBookingText}</p>
                  </div>
                  {data.membership.scope === "owner" ? (
                    <button
                      type="button"
                      className={`${styles.settingsShareToggle} ${data.business.allowOnlineBooking ? styles.settingsShareToggleActive : ""}`}
                      onClick={() =>
                        updateBusiness("allowOnlineBooking", !(data.business.allowOnlineBooking === true))
                      }
                      aria-pressed={data.business.allowOnlineBooking === true}
                      aria-label={t.settings.onlineBooking}
                    >
                      <span className={styles.settingsShareToggleLabel}>
                        {data.business.allowOnlineBooking ? copy.publicBookingEnabled : copy.publicBookingDisabled}
                      </span>
                      <span className={styles.settingsShareToggleTrack}>
                        <span className={styles.settingsShareToggleThumb} />
                      </span>
                    </button>
                  ) : (
                    <span className={`${styles.settingsShareStatus} ${data.business.allowOnlineBooking ? styles.settingsShareStatusActive : ""}`}>
                      {data.business.allowOnlineBooking ? copy.publicBookingEnabled : copy.publicBookingDisabled}
                    </span>
                  )}
                </div>

                <small className={styles.settingsInlineHint}>{t.settings.onlineBookingHint}</small>

                <div className={styles.settingsShareField}>
                  <input
                    ref={publicBookingInputRef}
                    className={styles.input}
                    readOnly
                    value={publicBookingUrl}
                    onFocus={(event) => event.currentTarget.select()}
                    onClick={(event) => event.currentTarget.select()}
                  />
                </div>

                <div className={styles.settingsShareActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={() => void copyPublicBookingUrl()}
                  >
                    {copy.copyLink}
                  </button>
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => {
                      if (!publicBookingUrl) {
                        return;
                      }

                      window.open(publicBookingUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    {copy.openLink}
                  </button>
                  {canUseNativeShare ? (
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => void sharePublicBookingUrl()}
                    >
                      {copy.shareLink}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div>
                <span>{t.settings.photos}</span>
                <h2>{t.settings.photosTitle}</h2>
              </div>
            </div>
            <p className={styles.settingsCardHint}>{t.settings.photosHint}</p>
            <div className={styles.settingsPhotoGrid}>
              {(data.business.photos ?? []).map((photo) => (
                <article key={photo.id} className={styles.settingsPhotoCard}>
                  <img src={photo.url} alt={data.business.name || t.settings.photosTitle} className={styles.settingsPhotoImage} />
                  <div className={styles.settingsPhotoActions}>
                    <span className={photo.isPrimary ? styles.settingsPhotoBadgePrimary : styles.settingsPhotoBadge}>
                      {photo.isPrimary ? t.settings.mainPhoto : t.settings.photos}
                    </span>
                    <div className={styles.settingsPhotoButtons}>
                      {!photo.isPrimary ? (
                        <button
                          type="button"
                          className={styles.photoActionButton}
                          onClick={() =>
                            updateBusinessPhotos(
                              (data.business.photos ?? []).map((item) => ({
                                ...item,
                                isPrimary: item.id === photo.id
                              }))
                            )
                          }
                        >
                          {t.settings.makeMainPhoto}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={styles.photoActionButton}
                        onClick={() =>
                          updateBusinessPhotos(
                            (data.business.photos ?? []).filter((item) => item.id !== photo.id)
                          )
                        }
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {(data.business.photos ?? []).length < MAX_BUSINESS_PHOTOS ? (
                <label className={styles.settingsPhotoUploader}>
                  <span>{(data.business.photos ?? []).length === 0 ? t.settings.uploadPhotos : t.settings.uploadMorePhotos}</span>
                  <small>{t.settings.photoLimit}</small>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => void handleBusinessPhotoUpload(event)}
                  />
                </label>
              ) : null}
            </div>
            {(data.business.photos ?? []).length === 0 ? (
              <p className={styles.settingsEmptyText}>{t.settings.noPhotos}</p>
            ) : null}
          </section>

          <section className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div>
                <span>{t.settings.localization}</span>
                <h2>{t.settings.countryLanguageCurrency}</h2>
              </div>
            </div>
            <div className={styles.settingsFormGrid}>
              <label>
                {t.settings.country}
                <select className={styles.select} value={data.professional.country} onChange={(event) => updateProfessional("country", event.target.value)}>
                  {countries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </label>
              <label>
                {t.settings.timezone}
                <select className={styles.select} value={data.professional.timezone} onChange={(event) => updateProfessional("timezone", event.target.value)}>
                  {timezones.map((timezone) => (
                    <option key={timezone.value} value={timezone.value}>{timezone.label}</option>
                  ))}
                </select>
              </label>
              <label>
                {t.settings.language}
                <select
                  className={styles.select}
                  value={languageFromProfile(data.professional.language)}
                  onChange={(event) => updateProfessional("language", languageLabels[event.target.value as ProLanguage])}
                >
                  {languages.map((language) => (
                    <option key={language} value={language}>{languageLabels[language]}</option>
                  ))}
                </select>
              </label>
              <label>
                {t.settings.currency}
                <select className={styles.select} value={data.professional.currency} onChange={(event) => updateProfessional("currency", event.target.value)}>
                  {currencies.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <div>
                <span>{t.settings.address}</span>
                <h2>{t.settings.addressTitle}</h2>
              </div>
            </div>
            <div className={styles.settingsFormGrid}>
              <label className={styles.settingsWideField}>
                {t.settings.findAddress}
                <input
                  className={styles.input}
                  value={data.business.address}
                  onFocus={(event) => event.currentTarget.select()}
                  onClick={(event) => event.currentTarget.select()}
                  onChange={(event) =>
                    setData((current) => ({
                      ...current,
                      business: {
                        ...current.business,
                        address: event.target.value,
                        addressDetails: "",
                        addressLat: null,
                        addressLon: null
                      }
                    }))
                  }
                  placeholder={t.settings.addressPlaceholder}
                />
              </label>
              <div className={`${styles.settingsWideField} ${styles.settingsAddressSearchList}`}>
                {isSearchingAddress ? <div className={styles.addressHint}>{t.settings.searchingAddress}</div> : null}
                {addressSuggestions.map((item) => (
                  <button
                    key={`${item.label}-${item.lat}-${item.lon}`}
                    type="button"
                    className={styles.addressSearchItem}
                    onClick={() => applyAddress(item)}
                  >
                    <span className={styles.addressSearchText}>
                      <strong>{[item.street, item.house].filter(Boolean).join(", ") || item.label}</strong>
                      <span>{[item.city, item.region, item.postcode, item.country].filter(Boolean).join(", ")}</span>
                    </span>
                    <span className={styles.addressSearchAction}>{t.settings.selectAddress}</span>
                  </button>
                ))}
              </div>
              {hasSelectedMapAddress ? (
                <div className={`${styles.settingsWideField} ${styles.settingsAddressSummary}`}>
                  <div>
                    <span>{t.settings.streetHouse}</span>
                    <strong>{structuredAddress.street || t.settings.addressNotSelected}</strong>
                  </div>
                  <div>
                    <span>{t.settings.city}</span>
                    <strong>{structuredAddress.city || "—"}</strong>
                  </div>
                  <div>
                    <span>{t.settings.region}</span>
                    <strong>{structuredAddress.region || "—"}</strong>
                  </div>
                  <div>
                    <span>{t.settings.country}</span>
                    <strong>{structuredAddress.country || "—"}</strong>
                  </div>
                </div>
              ) : null}
              {mapEmbedUrl ? (
                <iframe
                  title="Business address map"
                  className={`${styles.mapFrame} ${styles.settingsMapFrame}`}
                  src={mapEmbedUrl}
                />
              ) : addressSuggestions.length === 0 && !isSearchingAddress ? (
                <div className={`${styles.settingsWideField} ${styles.addressWarning}`}>
                  {t.settings.chooseAddressWarning}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
