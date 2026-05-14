import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as Localization from "expo-localization";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

type AppLanguage = "uk" | "ru" | "en";
type AuthMode = "login" | "register";
type AppTab = "calendar" | "services" | "clients" | "staff" | "settings";
type CalendarViewMode = "day" | "threeDays" | "week" | "month";

type MobileSession = {
  token: string;
  professionalId: string;
  email: string;
  displayName: string;
};

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  companyName: string;
};

type VisitServiceDraft = {
  id: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  priceAmount: number;
  durationMinutes: number;
};

type VisitDraft = {
  customerName: string;
  customerPhone: string;
  startTime: string;
  serviceId: string;
  appointmentDate: string;
  targetProfessionalId?: string;
  selectedClientId?: string;
  items: VisitServiceDraft[];
};

type BlockedTimeDraft = {
  date: string;
  startTime: string;
  endTime: string;
  targetProfessionalId?: string;
  label: string;
  title: string;
  appointment?: AppointmentRecord;
};

type ServiceRecord = {
  id: string;
  name: string;
  price: number;
  category?: string;
  durationMinutes?: number;
  color?: string;
  source?: "catalog" | "custom";
};

type ServiceTemplateRecord = {
  name: string;
  durationMinutes?: number;
  price?: number;
};

type ServiceCatalogCategory = {
  key: string;
  title: string;
  topSuggestions?: ServiceTemplateRecord[];
  popularServices?: ServiceTemplateRecord[];
};

type AppointmentRecord = {
  id: string;
  professionalId?: string;
  professionalName?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  kind: "appointment" | "blocked";
  customerName: string;
  customerPhone: string;
  serviceName: string;
  attendance: "pending" | "confirmed" | "arrived" | "no_show";
  priceAmount: number;
};

type WorkBreakRecord = {
  startTime: string;
  endTime: string;
};

type WorkIntervalRecord = {
  startTime: string;
  endTime: string;
};

type WorkDayScheduleRecord = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
  breaks?: WorkBreakRecord[];
  dayType?: "workday" | "day-off" | "holiday";
};

type WorkScheduleRecord = Record<string, WorkDayScheduleRecord>;

type ClientRecord = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  visitsCount: number;
  totalSales: number;
};

type WorkspaceSnapshot = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    email: string;
    phone: string;
    language: string;
    currency?: string;
    timezone: string;
    country: string;
    bookingCreditsTotal?: number;
  };
  business: {
    id: string;
    name: string;
    website?: string;
    categories?: string[];
    accountType?: "solo" | "team";
    serviceMode?: string;
    address: string;
    addressDetails?: string;
    addressLat?: number | null;
    addressLon?: number | null;
    publicBookingUrl?: string;
    allowOnlineBooking?: boolean;
    workScheduleMode?: string;
    photos?: Array<{
      id: string;
      url: string;
      isPrimary: boolean;
      createdAt: string;
      caption?: string;
      status?: "active" | "blocked";
    }>;
  };
  membership?: {
    scope: "owner" | "member" | "pending";
    role: string;
  };
  memberSchedule?: {
    workScheduleMode?: string;
    workSchedule?: WorkScheduleRecord;
    customSchedule?: Record<string, WorkDayScheduleRecord>;
  };
  services: ServiceRecord[];
  telegram?: {
    connected: boolean;
    chatId: string | null;
  };
};

type BusinessPhotoRecord = NonNullable<WorkspaceSnapshot["business"]["photos"]>[number];

type StaffMemberRecord = {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    language?: string;
    accountStatus?: "active" | "placeholder";
    createdAt?: string;
    avatarUrl?: string | null;
  };
  membership: {
    id?: string;
    role: string;
    scope: "owner" | "member";
    createdAt?: string;
    workScheduleMode: "fixed" | "flexible";
    workSchedule: WorkScheduleRecord;
    customSchedule?: Record<string, WorkDayScheduleRecord>;
  };
  source?: "owner" | "join_request" | "email_invitation" | "member";
  workspaceAccess?: "owner" | "active" | "invited" | "offline";
  pendingInvitation?: {
    id: string;
    email: string;
    createdAt: string;
  } | null;
  services?: string[];
  stats?: {
    totalBookings?: number;
    monthBookings?: number;
    upcomingBookings?: number;
    completedBookings?: number;
    revenue?: number;
  };
};

type StaffSnapshot = {
  business: {
    id: string;
    name: string;
    categories?: string[];
    accountType?: "solo" | "team";
    currency?: string;
  };
  summary?: {
    totalPeople?: number;
    activeEmployees?: number;
    pendingRequests?: number;
    pendingInvitations?: number;
    monthBookings?: number;
    monthRevenue?: number;
  };
  services?: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  members: StaffMemberRecord[];
  joinRequests?: Array<{
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
  invitations?: Array<{
    id: string;
    email: string;
    role: string;
    createdAt: string;
    invitedProfessional?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }>;
};

type ServiceDraftState = {
  name: string;
  category: string;
  durationMinutes: string;
  price: string;
  color: string;
};

type CalendarSnapshot = {
  appointments: AppointmentRecord[];
  teamMembers?: CalendarTeamMemberRecord[];
  viewedProfessionalId?: string;
  memberCalendars?: CalendarMemberDaySnapshotRecord[];
  stats: {
    day: { visitsCount: number; revenue: number };
    week: { visitsCount: number; revenue: number };
    month: { visitsCount: number; revenue: number };
  };
  recentActivity: Array<{
    id: string;
    appointmentDate: string;
    startTime: string;
    customerName: string;
    serviceName: string;
  }>;
};

type CalendarTeamMemberRecord = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
  scope: "owner" | "member";
  isViewer?: boolean;
};

type CalendarMemberDaySnapshotRecord = {
  professionalId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  role: string;
  scope: "owner" | "member";
  isViewer?: boolean;
  memberSchedule?: WorkspaceSnapshot["memberSchedule"];
  appointments: AppointmentRecord[];
};

type CalendarMemberView = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  scope: "owner" | "member";
  isViewer?: boolean;
  memberSchedule?: WorkspaceSnapshot["memberSchedule"];
};

type MobileNotificationRecord = {
  id: string;
  appointmentId?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  professionalId?: string;
  professionalName?: string;
  createdAt: string;
  status: "pending" | "confirmed" | "cancelled";
};

type MobileNotificationsPayload = {
  pendingOnlineBookings?: MobileNotificationRecord[];
  archivedOnlineBookings?: MobileNotificationRecord[];
  pendingJoinRequests?: Array<{
    id: string;
    createdAt: string;
    role: string;
    professionalName: string;
  }>;
};

type MobileSettingsSection = "general" | "online" | "services" | "schedule" | "telegram" | "address";

type SettingsDraftState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  businessName: string;
  website: string;
  accountType: "solo" | "team";
  serviceMode: string;
  categoriesText: string;
  country: string;
  timezone: string;
  language: AppLanguage;
  currency: string;
  allowOnlineBooking: boolean;
  address: string;
  addressDetails: string;
  addressLat: number | null;
  addressLon: number | null;
};

type AddressSuggestionRecord = {
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

type TelegramPanelState = {
  deepLink: string;
  tokenExpiresAt: string;
  connected: boolean;
  chatId: string | null;
  settings: {
    notificationsNewBooking: boolean;
    notificationsCabinetBooking: boolean;
    notificationsRescheduled: boolean;
    notificationsCancelled: boolean;
    notificationsReminder: boolean;
    notificationsToday: boolean;
    forwardingEnabled: boolean;
    reminderLeadMinutes: number;
  };
};

type TelegramBooleanSettingKey =
  | "notificationsNewBooking"
  | "notificationsCabinetBooking"
  | "notificationsRescheduled"
  | "notificationsCancelled"
  | "notificationsReminder"
  | "notificationsToday"
  | "forwardingEnabled";

const STORAGE_KEY = "timviz_mobile_session_v2";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://timviz.com").replace(/\/+$/, "");
const WORDMARK = require("./assets/timviz-wordmark.png");
const DEFAULT_SERVICE_CATEGORY = "Без категории";
const SERVICE_COLORS = ["#9AD86A", "#8ED1F2", "#FF9A84", "#F7C948", "#A78BFA", "#34D399", "#F472B6", "#60A5FA"];
const APP_ICON = require("./assets/timviz-icon.png");
const SETTINGS_SECTIONS: MobileSettingsSection[] = ["general", "online", "services", "schedule", "telegram", "address"];
const COUNTRY_OPTIONS = ["Ukraine", "Russia", "Poland", "United Kingdom", "United States", "Germany", "France", "Spain", "Italy", "International"];
const TIMEZONE_OPTIONS = ["Europe/Kiev", "Europe/Warsaw", "Europe/Berlin", "Europe/London", "America/New_York", "Europe/Moscow", "Asia/Dubai", "UTC"];
const TIMEZONE_LABELS: Record<string, string> = {
  "Europe/Kiev": "UTC+2 · Kyiv",
  "Europe/Warsaw": "UTC+1 · Warsaw",
  "Europe/Berlin": "UTC+1 · Berlin",
  "Europe/London": "UTC+0 · London",
  "America/New_York": "UTC-5 · New York",
  "Europe/Moscow": "UTC+3 · Moscow",
  "Asia/Dubai": "UTC+4 · Dubai",
  UTC: "UTC+0 · UTC",
};
const CURRENCY_OPTIONS = ["UAH", "EUR", "USD", "PLN", "GBP", "KZT", "GEL", "AED", "CAD"];
const TELEGRAM_REMINDER_LEAD_OPTIONS = [15, 30, 60, 120, 180, 1440];
const SERVICE_MODE_OPTIONS = [
  "Клиенты приходят в мое физическое заведение",
  "Я работаю с выездом к клиенту",
  "Я предоставляю услуги онлайн",
];

const languageNames: Record<AppLanguage, string> = {
  uk: "UA",
  ru: "RU",
  en: "EN",
};

const copy = {
  uk: {
    login: "Увійти",
    register: "Створити акаунт",
    email: "Email",
    password: "Пароль",
    firstName: "Ім'я",
    lastName: "Прізвище",
    phone: "Телефон",
    companyName: "Назва бізнесу",
    continue: "Продовжити",
    creating: "Створюємо...",
    signingIn: "Вхід...",
    calendar: "Календар",
    clients: "Клієнти",
    services: "Послуги",
    staff: "Співробітники",
    settings: "Налаштування",
    signOut: "Вийти",
    requiredTitle: "Потрібні дані",
    requiredText: "Заповніть усі поля.",
    loginError: "Помилка входу",
    registerError: "Помилка реєстрації",
    passwordHint: "Мінімум 6 символів",
    proTitle: "Timviz для майстра",
    proSubtitle: "Календар, послуги, клієнти й сповіщення в одному застосунку.",
    dashboard: "Робочий кабінет",
    home: "Головна",
    today: "Сьогодні",
    week: "Тиждень",
    month: "Місяць",
    newVisit: "Новий візит",
    editVisit: "Редагувати запис",
    bookTime: "Забронювати час",
    addBlockedTime: "Додати неробочий час",
    reservedTime: "Заброньований час",
    unavailableTime: "Неробочий час",
    chooseClient: "Обрати клієнта",
    withoutClient: "Без клієнта",
    quickBookingWithoutClient: "Швидкий запис без клієнта",
    chooseClientLater: "Можна обрати клієнта пізніше",
    chooseService: "Обрати послугу",
    addAnotherService: "Додати ще послугу +",
    total: "Разом",
    payable: "До сплати",
    saveVisit: "Зберегти запис",
    visitTab: "Візит",
    search: "Пошук",
    searchService: "Назва послуги",
    clientNameOrPhone: "Ім'я або телефон",
    addNewClient: "Додати нового клієнта",
    addAndSelectClient: "Додати й обрати",
    createClientFromSearch: "Створити клієнта",
    noClientFound: "Клієнта не знайдено. Можна створити нового.",
    newClientFormTitle: "Новий клієнт",
    newClientFormHint: "Додайте дані, і клієнт одразу буде обраний для візиту.",
    formOpened: "Форма відкрита нижче",
    clientName: "Ім'я клієнта",
    withoutService: "Послугу не обрано",
    setupAssistant: "Помічник налаштування",
    setupAssistantText: "Пройдіть кроки, щоб профіль був готовий до онлайн-запису.",
    setupProgress: "Готовність",
    setupServices: "Додайте послуги",
    setupSchedule: "Налаштуйте графік",
    setupBooking: "Увімкніть онлайн-запис",
    setupAddress: "Додайте адресу",
    setupTelegram: "Підключіть Telegram",
    staffSchedule: "Графік змін",
    staffScheduleHint: "Керуйте робочими днями співробітників так само, як у кабінеті на сайті.",
    teamMembers: "Учасники команди",
    teamMembersHint: "Додавайте співробітників, редагуйте контакти, роль і доступ до кабінету.",
    allTeam: "Вся команда",
    showWholeTeam: "Показати всю команду",
    selectedMasters: "Вибрані майстри",
    addMember: "Додати співробітника",
    editMember: "Редагувати співробітника",
    saveMember: "Зберегти співробітника",
    fullName: "Ім'я та прізвище",
    role: "Роль",
    workspaceAccess: "Доступ",
    invite: "Запросити",
    resendInvite: "Надіслати ще раз",
    revokeInvite: "Скасувати запрошення",
    sendInvite: "Надіслати запрошення на email",
    pendingInvites: "Очікують запрошення",
    monthBookings: "Записів за місяць",
    upcomingBookings: "Майбутні записи",
    scheduleMenu: "Графік",
    currentWeek: "На цьому тижні",
    previousWeek: "Попередній тиждень",
    nextWeek: "Наступний тиждень",
    chooseWeek: "Обрати тиждень",
    repeatingSchedule: "Повторюваний графік",
    oneWeekSchedule: "Тиждень календаря",
    applyToWeekdays: "Застосувати до всіх буднів",
    clearWeek: "Очистити тиждень",
    noWork: "Не працює",
    workIntervals: "Робочий час",
    addWorkTime: "Додати час",
    removeWorkTime: "Видалити час",
    monthPlanner: "Робочі дні місяця",
    selectedDays: "Обрано днів",
    applyToSelectedDays: "Застосувати до обраних",
    selectedDaysHint: "Оберіть дні на місяць і задайте їм однакові робочі інтервали.",
    noRoomForInterval: "Немає місця для ще одного інтервалу.",
    invalidIntervalRange: "Кінець має бути пізніше початку.",
    overlappingIntervals: "Інтервали не мають перетинатися.",
    addBreak: "Додати перерву",
    removeBreak: "Прибрати перерву",
    onThisWeek: "На цьому тижні",
    saveSchedule: "Зберегти графік",
    workFrom: "З",
    workTo: "До",
    breakFrom: "Перерва з",
    breakTo: "Перерва до",
    owner: "Власник",
    employee: "Співробітник",
    hoursShort: "год",
    workingDay: "Робочий день",
    dayOff: "Вихідний",
    bookingPage: "Картка компанії",
    bookingPageText: "Посилання для клієнтів і перемикач онлайн-запису.",
    onlineBookingOn: "Онлайн-запис увімкнено",
    onlineBookingOff: "Онлайн-запис вимкнено",
    openPage: "Відкрити сторінку",
    sharePage: "Поділитися",
    supportTitle: "Підтримка Timviz",
    supportGuideTitle: "Написати в підтримку",
    supportGuideText: "Опишіть, що ви робите, на якій сторінці виникло питання і що має вийти.",
    supportGreeting: "Вітаю! Напишіть питання щодо сайту, записів, налаштувань або оплати. Ми допоможемо розібратися.",
    supportPlaceholder: "Напишіть питання одним повідомленням...",
    supportSend: "Надіслати",
    supportSent: "Повідомлення надіслано.",
    supportFailed: "Не вдалося надіслати повідомлення.",
    notificationPendingBookings: "Непідтверджені онлайн-записи",
    notificationsArchive: "Архів",
    notificationEmpty: "Поки немає нових подій.",
    statusPending: "Очікує підтвердження",
    statusConfirmed: "Підтверджена",
    statusCancelled: "Скасована",
    myProfile: "Мій профіль",
    personalSettings: "Особисті налаштування",
    helpSupport: "Допомога і підтримка",
    language: "Мова",
    compact: "Стиснутий",
    dayView: "День",
    detailed: "Детально",
    threeDays: "3 дні",
    weekView: "Тиждень",
    monthView: "Місяць",
    selected: "Вибрано",
    visits: "візитів",
    closedBySchedule: "Вихідний",
    ready: "Готово",
    reminders: "Сповіщення",
    addVisit: "Додати запис",
    customer: "Клієнт",
    service: "Послуга",
    start: "Початок",
    end: "Кінець",
    save: "Зберегти",
    cancel: "Скасувати",
    noAppointments: "На цей день записів поки немає.",
    recent: "Останні записи",
    addService: "Додати послугу",
    yourServices: "Ваші послуги",
    ownService: "Своя послуга",
    generalCatalog: "Загальний каталог",
    serviceName: "Назва послуги",
    category: "Категорія",
    newCategory: "Нова категорія",
    selectedCategory: "Обрана категорія",
    editService: "Редагувати послугу",
    saveService: "Зберегти послугу",
    addFromCatalog: "Додати з каталогу",
    alreadyAdded: "У ваших послугах",
    catalogHint: "Оберіть готову послугу з загального каталогу Timviz.",
    myServicesHint: "Тут послуги, які доступні для запису клієнтів. Натисніть на послугу, щоб змінити ціну або час.",
    price: "Ціна",
    duration: "Хвилини",
    delete: "Видалити",
    addClient: "Додати клієнта",
    connected: "Підключено",
    notConnected: "Не підключено",
    telegramHint: "Підключення Telegram керується через налаштування кабінету. У застосунку видно поточний статус.",
    onlineBooking: "Онлайн-запис",
    address: "Адреса",
    publicPage: "Сторінка запису",
    settingsSaved: "Зміни збережено",
    settingsSaveError: "Не вдалося зберегти налаштування.",
    settingsGeneral: "Основне",
    settingsOnline: "Онлайн-запис",
    settingsServices: "Послуги",
    settingsSchedule: "Графік",
    settingsTelegram: "Telegram",
    settingsAddress: "Адреса",
    profileAndBusiness: "Профіль і бізнес",
    ownerContacts: "Контакти власника",
    avatarLink: "Аватар майстра",
    avatarHint: "Фото показується в календарі, картці майстра і верхньому меню.",
    changeAvatar: "Змінити аватар",
    deleteAvatar: "Видалити аватар",
    avatarPermission: "Дозвольте доступ до фото, щоб змінити аватар.",
    newPassword: "Новий пароль",
    leaveBlankPassword: "залиште порожнім, якщо пароль не змінюється",
    businessFormat: "Назва і формат",
    website: "Сайт",
    accountType: "Тип акаунта",
    soloAccount: "Я працюю один",
    teamAccount: "Команда",
    serviceMode: "Формат роботи",
    categoriesText: "Категорії",
    categoriesHint: "через кому",
    localization: "Країна, мова і валюта",
    country: "Країна",
    timezone: "Часовий пояс",
    currency: "Валюта",
    saveSettings: "Зберегти налаштування",
    publicLink: "Публічне посилання",
    copyLink: "Копіювати",
    manageServices: "Керувати послугами",
    manageSchedule: "Керувати графіком",
    joinRequests: "Запити на приєднання",
    noJoinRequests: "Нових запитів поки немає.",
    approve: "Підтвердити",
    reject: "Відхилити",
    businessPhotos: "Фото бізнесу",
    photosHint: "Перші фото відображаються на сторінці онлайн-запису.",
    streetAddress: "Адреса",
    addressDetails: "Деталі адреси",
    mapCoordinates: "Координати зберігаються з сайту; у застосунку редагується текстова адреса.",
    ownerOnlyHint: "Налаштування бізнесу може змінювати тільки власник акаунта.",
    launchChecklist: "Чекліст запуску",
    profileReady: "Профіль готовий",
    completedSteps: "виконано",
    photoUrl: "Посилання на фото",
    photoCaption: "Підпис до фото",
    addPhotoUrl: "Додати фото за посиланням",
    addPhoto: "Додати фото",
    uploadPhoto: "Завантажити фото",
    makePrimary: "Зробити головним",
    primaryPhoto: "Головне фото",
    addressSearch: "Знайти адресу на карті",
    addressPlaceholder: "Почніть вводити реальну адресу",
    searchingAddress: "Шукаємо адресу...",
    selectAddress: "Вибрати адресу",
    selectedAddress: "Вибрана адреса",
    streetHouse: "Будинок, вулиця",
    city: "Місто",
    region: "Регіон",
    postcode: "Індекс",
    openMap: "Відкрити карту",
    telegramConnectButton: "Підключити бота",
    telegramOpenBot: "Відкрити бота",
    telegramCopyLink: "Копіювати посилання",
    telegramRefreshLink: "Оновити посилання",
    telegramTokenExpires: "Посилання активне до",
    telegramSectionNotifications: "Сповіщення",
    telegramSectionReminders: "Нагадування",
    telegramSectionSupport: "Підтримка",
    telegramNotificationsHint: "Виберіть, які події бот має надсилати в Telegram.",
    telegramOnlineBookings: "Нові онлайн-записи",
    telegramCabinetBookings: "Нові записи з кабінету",
    telegramRescheduled: "Зміна часу запису",
    telegramCancelled: "Скасування запису",
    telegramRemindersHint: "Нагадування допомагають не пропустити майбутні візити.",
    telegramReminders: "Нагадування перед записом",
    telegramToday: "Зведення на сьогодні",
    telegramReminderLead: "Коли нагадувати",
    telegramSupportHint: "Питання клієнтів і підтримки можуть приходити прямо в Telegram.",
    telegramForwarding: "Пересилати підтримку в Telegram",
    telegramSaved: "Telegram оновлено",
    telegramSaveFailed: "Не вдалося оновити Telegram.",
    minutesBefore: "хв до запису",
    hoursBefore: "год до запису",
    dayBefore: "за день",
    empty: "Поки порожньо",
  },
  ru: {
    login: "Войти",
    register: "Создать аккаунт",
    email: "Email",
    password: "Пароль",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    companyName: "Название бизнеса",
    continue: "Продолжить",
    creating: "Создаем...",
    signingIn: "Вход...",
    calendar: "Календарь",
    clients: "Клиенты",
    services: "Услуги",
    staff: "Сотрудники",
    settings: "Настройки",
    signOut: "Выйти",
    requiredTitle: "Нужны данные",
    requiredText: "Заполните все поля.",
    loginError: "Ошибка входа",
    registerError: "Ошибка регистрации",
    passwordHint: "Минимум 6 символов",
    proTitle: "Timviz для мастера",
    proSubtitle: "Календарь, услуги, клиенты и уведомления в одном приложении.",
    dashboard: "Рабочий кабинет",
    home: "Главная",
    today: "Сегодня",
    week: "Неделя",
    month: "Месяц",
    newVisit: "Новый визит",
    editVisit: "Редактировать запись",
    bookTime: "Забронировать время",
    addBlockedTime: "Добавить нерабочее время",
    reservedTime: "Забронированное время",
    unavailableTime: "Нерабочее время",
    chooseClient: "Выбрать клиента",
    withoutClient: "Без клиента",
    quickBookingWithoutClient: "Быстрая запись без клиента",
    chooseClientLater: "Можно выбрать клиента позже",
    chooseService: "Выбрать услугу",
    addAnotherService: "Добавить еще услугу +",
    total: "Итого",
    payable: "К оплате",
    saveVisit: "Сохранить запись",
    visitTab: "Визит",
    search: "Поиск",
    searchService: "Название услуги",
    clientNameOrPhone: "Имя или телефон",
    addNewClient: "Добавить нового клиента",
    addAndSelectClient: "Добавить и выбрать",
    createClientFromSearch: "Создать клиента",
    noClientFound: "Клиент не найден. Можно создать нового.",
    newClientFormTitle: "Новый клиент",
    newClientFormHint: "Добавьте данные, и клиент сразу будет выбран для визита.",
    formOpened: "Форма открыта ниже",
    clientName: "Имя клиента",
    withoutService: "Услуга не выбрана",
    setupAssistant: "Помощник настройки",
    setupAssistantText: "Пройдите шаги, чтобы профиль был готов к онлайн-записи.",
    setupProgress: "Готовность",
    setupServices: "Добавьте услуги",
    setupSchedule: "Настройте график",
    setupBooking: "Включите онлайн-запись",
    setupAddress: "Добавьте адрес",
    setupTelegram: "Подключите Telegram",
    staffSchedule: "График смен",
    staffScheduleHint: "Управляйте рабочими днями сотрудников так же, как в кабинете на сайте.",
    teamMembers: "Участники команды",
    teamMembersHint: "Добавляйте сотрудников, редактируйте контакты, роль и доступ к кабинету.",
    allTeam: "Вся команда",
    showWholeTeam: "Показать всю команду",
    selectedMasters: "Выбранные мастера",
    addMember: "Добавить сотрудника",
    editMember: "Редактировать сотрудника",
    saveMember: "Сохранить сотрудника",
    fullName: "Имя и фамилия",
    role: "Роль",
    workspaceAccess: "Доступ",
    invite: "Пригласить",
    resendInvite: "Отправить еще раз",
    revokeInvite: "Отозвать приглашение",
    sendInvite: "Отправить приглашение на email",
    pendingInvites: "Ожидают приглашение",
    monthBookings: "Записей за месяц",
    upcomingBookings: "Будущие записи",
    scheduleMenu: "График",
    currentWeek: "На этой неделе",
    previousWeek: "Предыдущая неделя",
    nextWeek: "Следующая неделя",
    chooseWeek: "Выбрать неделю",
    repeatingSchedule: "Повторяющийся график",
    oneWeekSchedule: "Неделя календаря",
    applyToWeekdays: "Применить ко всем будням",
    clearWeek: "Очистить неделю",
    noWork: "Не работает",
    workIntervals: "Рабочее время",
    addWorkTime: "Добавить время",
    removeWorkTime: "Удалить время",
    monthPlanner: "Рабочие дни месяца",
    selectedDays: "Выбрано дней",
    applyToSelectedDays: "Применить к выбранным",
    selectedDaysHint: "Выберите дни на месяц и задайте им одинаковые рабочие интервалы.",
    noRoomForInterval: "Нет места для еще одного интервала.",
    invalidIntervalRange: "Конец должен быть позже начала.",
    overlappingIntervals: "Интервалы не должны пересекаться.",
    addBreak: "Добавить перерыв",
    removeBreak: "Убрать перерыв",
    onThisWeek: "На этой неделе",
    saveSchedule: "Сохранить график",
    workFrom: "С",
    workTo: "До",
    breakFrom: "Перерыв с",
    breakTo: "Перерыв до",
    owner: "Владелец",
    employee: "Сотрудник",
    hoursShort: "ч",
    workingDay: "Рабочий день",
    dayOff: "Выходной",
    bookingPage: "Карточка компании",
    bookingPageText: "Ссылка для клиентов и переключатель онлайн-записи.",
    onlineBookingOn: "Онлайн-запись включена",
    onlineBookingOff: "Онлайн-запись выключена",
    openPage: "Открыть страницу",
    sharePage: "Поделиться",
    supportTitle: "Поддержка Timviz",
    supportGuideTitle: "Написать в поддержку",
    supportGuideText: "Опишите, что вы делаете, на какой странице возник вопрос и что должно выйти.",
    supportGreeting: "Привет! Напишите вопрос по сайту, записям, настройкам или оплате. Мы поможем разобраться.",
    supportPlaceholder: "Напишите вопрос одним сообщением...",
    supportSend: "Отправить",
    supportSent: "Сообщение отправлено.",
    supportFailed: "Не удалось отправить сообщение.",
    notificationPendingBookings: "Неподтвержденные онлайн-записи",
    notificationsArchive: "Архив",
    notificationEmpty: "Пока нет новых событий.",
    statusPending: "Ожидает подтверждения",
    statusConfirmed: "Подтверждена",
    statusCancelled: "Отменена",
    myProfile: "Мой профиль",
    personalSettings: "Личные настройки",
    helpSupport: "Помощь и поддержка",
    language: "Язык",
    compact: "Сжатый",
    dayView: "День",
    detailed: "Подробно",
    threeDays: "3 дня",
    weekView: "Неделя",
    monthView: "Месяц",
    selected: "Выбрано",
    visits: "визитов",
    closedBySchedule: "Выходной",
    ready: "Готово",
    reminders: "Уведомления",
    addVisit: "Добавить запись",
    customer: "Клиент",
    service: "Услуга",
    start: "Начало",
    end: "Конец",
    save: "Сохранить",
    cancel: "Отмена",
    noAppointments: "На этот день записей пока нет.",
    recent: "Последние записи",
    addService: "Добавить услугу",
    yourServices: "Ваши услуги",
    ownService: "Своя услуга",
    generalCatalog: "Общий каталог",
    serviceName: "Название услуги",
    category: "Категория",
    newCategory: "Новая категория",
    selectedCategory: "Выбранная категория",
    editService: "Редактировать услугу",
    saveService: "Сохранить услугу",
    addFromCatalog: "Добавить из каталога",
    alreadyAdded: "В ваших услугах",
    catalogHint: "Выберите готовую услугу из общего каталога Timviz.",
    myServicesHint: "Тут услуги, которые доступны для записи клиентов. Нажмите на услугу, чтобы изменить цену или время.",
    price: "Цена",
    duration: "Минуты",
    delete: "Удалить",
    addClient: "Добавить клиента",
    connected: "Подключено",
    notConnected: "Не подключено",
    telegramHint: "Подключение Telegram управляется через настройки кабинета. В приложении виден текущий статус.",
    onlineBooking: "Онлайн-запись",
    address: "Адрес",
    publicPage: "Страница записи",
    settingsSaved: "Изменения сохранены",
    settingsSaveError: "Не удалось сохранить настройки.",
    settingsGeneral: "Основное",
    settingsOnline: "Онлайн-запись",
    settingsServices: "Услуги",
    settingsSchedule: "График",
    settingsTelegram: "Telegram",
    settingsAddress: "Адрес",
    profileAndBusiness: "Профиль и бизнес",
    ownerContacts: "Контакты владельца",
    avatarLink: "Аватар мастера",
    avatarHint: "Фото показывается в календаре, карточке мастера и верхнем меню.",
    changeAvatar: "Сменить аватар",
    deleteAvatar: "Удалить аватар",
    avatarPermission: "Разрешите доступ к фото, чтобы изменить аватар.",
    newPassword: "Новый пароль",
    leaveBlankPassword: "оставьте пустым, если пароль не меняется",
    businessFormat: "Название и формат",
    website: "Сайт",
    accountType: "Тип аккаунта",
    soloAccount: "Я работаю один",
    teamAccount: "Команда",
    serviceMode: "Формат работы",
    categoriesText: "Категории",
    categoriesHint: "через запятую",
    localization: "Страна, язык и валюта",
    country: "Страна",
    timezone: "Часовой пояс",
    currency: "Валюта",
    saveSettings: "Сохранить настройки",
    publicLink: "Публичная ссылка",
    copyLink: "Копировать",
    manageServices: "Управлять услугами",
    manageSchedule: "Управлять графиком",
    joinRequests: "Запросы на присоединение",
    noJoinRequests: "Новых запросов пока нет.",
    approve: "Подтвердить",
    reject: "Отклонить",
    businessPhotos: "Фото бизнеса",
    photosHint: "Первые фото отображаются на странице онлайн-записи.",
    streetAddress: "Адрес",
    addressDetails: "Детали адреса",
    mapCoordinates: "Координаты сохраняются с сайта; в приложении редактируется текстовый адрес.",
    ownerOnlyHint: "Настройки бизнеса может менять только владелец аккаунта.",
    launchChecklist: "Чеклист запуска",
    profileReady: "Профиль готов",
    completedSteps: "выполнено",
    photoUrl: "Ссылка на фото",
    photoCaption: "Подпись к фото",
    addPhotoUrl: "Добавить фото по ссылке",
    addPhoto: "Добавить фото",
    uploadPhoto: "Загрузить фото",
    makePrimary: "Сделать главным",
    primaryPhoto: "Главное фото",
    addressSearch: "Найти адрес на карте",
    addressPlaceholder: "Начните вводить реальный адрес",
    searchingAddress: "Ищем адрес...",
    selectAddress: "Выбрать адрес",
    selectedAddress: "Выбранный адрес",
    streetHouse: "Дом, улица",
    city: "Город",
    region: "Регион",
    postcode: "Индекс",
    openMap: "Открыть карту",
    telegramConnectButton: "Подключить бота",
    telegramOpenBot: "Открыть бота",
    telegramCopyLink: "Копировать ссылку",
    telegramRefreshLink: "Обновить ссылку",
    telegramTokenExpires: "Ссылка активна до",
    telegramSectionNotifications: "Уведомления",
    telegramSectionReminders: "Напоминания",
    telegramSectionSupport: "Поддержка",
    telegramNotificationsHint: "Выберите, какие события бот должен отправлять в Telegram.",
    telegramOnlineBookings: "Новые онлайн-записи",
    telegramCabinetBookings: "Новые записи из кабинета",
    telegramRescheduled: "Изменение времени записи",
    telegramCancelled: "Отмена записи",
    telegramRemindersHint: "Напоминания помогают не пропустить будущие визиты.",
    telegramReminders: "Напоминание перед записью",
    telegramToday: "Сводка на сегодня",
    telegramReminderLead: "Когда напоминать",
    telegramSupportHint: "Вопросы клиентов и поддержки могут приходить прямо в Telegram.",
    telegramForwarding: "Пересылать поддержку в Telegram",
    telegramSaved: "Telegram обновлен",
    telegramSaveFailed: "Не удалось обновить Telegram.",
    minutesBefore: "мин до записи",
    hoursBefore: "ч до записи",
    dayBefore: "за день",
    empty: "Пока пусто",
  },
  en: {
    login: "Sign in",
    register: "Create account",
    email: "Email",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    companyName: "Business name",
    continue: "Continue",
    creating: "Creating...",
    signingIn: "Signing in...",
    calendar: "Calendar",
    clients: "Clients",
    services: "Services",
    staff: "Staff",
    settings: "Settings",
    signOut: "Sign out",
    requiredTitle: "Missing details",
    requiredText: "Fill in all fields.",
    loginError: "Sign-in error",
    registerError: "Registration error",
    passwordHint: "At least 6 characters",
    proTitle: "Timviz for pros",
    proSubtitle: "Calendar, services, clients and alerts in one app.",
    dashboard: "Workspace",
    home: "Home",
    today: "Today",
    week: "Week",
    month: "Month",
    newVisit: "New visit",
    editVisit: "Edit appointment",
    bookTime: "Book time",
    addBlockedTime: "Add unavailable time",
    reservedTime: "Reserved time",
    unavailableTime: "Unavailable time",
    chooseClient: "Choose client",
    withoutClient: "No client",
    quickBookingWithoutClient: "Quick booking without client",
    chooseClientLater: "You can choose a client later",
    chooseService: "Choose service",
    addAnotherService: "Add another service +",
    total: "Total",
    payable: "To pay",
    saveVisit: "Save booking",
    visitTab: "Visit",
    search: "Search",
    searchService: "Service name",
    clientNameOrPhone: "Name or phone",
    addNewClient: "Add new client",
    addAndSelectClient: "Add and select",
    createClientFromSearch: "Create client",
    noClientFound: "No client found. You can create a new one.",
    newClientFormTitle: "New client",
    newClientFormHint: "Add the details and the client will be selected for this visit.",
    formOpened: "Form is open below",
    clientName: "Client name",
    withoutService: "No service selected",
    setupAssistant: "Setup assistant",
    setupAssistantText: "Finish the steps so your profile is ready for online booking.",
    setupProgress: "Readiness",
    setupServices: "Add services",
    setupSchedule: "Set schedule",
    setupBooking: "Enable online booking",
    setupAddress: "Add address",
    setupTelegram: "Connect Telegram",
    staffSchedule: "Shift schedule",
    staffScheduleHint: "Manage team working days like in the web workspace.",
    teamMembers: "Team members",
    teamMembersHint: "Add employees, edit contacts, role, and workspace access.",
    allTeam: "Whole team",
    showWholeTeam: "Show the full team",
    selectedMasters: "Selected masters",
    addMember: "Add employee",
    editMember: "Edit employee",
    saveMember: "Save employee",
    fullName: "Full name",
    role: "Role",
    workspaceAccess: "Access",
    invite: "Invite",
    resendInvite: "Resend invite",
    revokeInvite: "Revoke invite",
    sendInvite: "Send email invite",
    pendingInvites: "Pending invites",
    monthBookings: "Month bookings",
    upcomingBookings: "Upcoming bookings",
    scheduleMenu: "Schedule",
    currentWeek: "This week",
    previousWeek: "Previous week",
    nextWeek: "Next week",
    chooseWeek: "Choose week",
    repeatingSchedule: "Repeating schedule",
    oneWeekSchedule: "Calendar week",
    applyToWeekdays: "Apply to weekdays",
    clearWeek: "Clear week",
    noWork: "Off",
    workIntervals: "Work time",
    addWorkTime: "Add time",
    removeWorkTime: "Remove time",
    monthPlanner: "Month work days",
    selectedDays: "Selected days",
    applyToSelectedDays: "Apply to selected",
    selectedDaysHint: "Select month days and apply the same working intervals to them.",
    noRoomForInterval: "No room for another interval.",
    invalidIntervalRange: "End must be later than start.",
    overlappingIntervals: "Intervals cannot overlap.",
    addBreak: "Add break",
    removeBreak: "Remove break",
    onThisWeek: "This week",
    saveSchedule: "Save schedule",
    workFrom: "From",
    workTo: "To",
    breakFrom: "Break from",
    breakTo: "Break to",
    owner: "Owner",
    employee: "Employee",
    hoursShort: "h",
    workingDay: "Working day",
    dayOff: "Day off",
    bookingPage: "Company page",
    bookingPageText: "Client link and online booking switch.",
    onlineBookingOn: "Online booking is on",
    onlineBookingOff: "Online booking is off",
    openPage: "Open page",
    sharePage: "Share",
    supportTitle: "Timviz support",
    supportGuideTitle: "Write to support",
    supportGuideText: "Describe what you are doing, where the issue appeared, and what should happen.",
    supportGreeting: "Hi! Ask us about the site, bookings, settings, or payments. We will help.",
    supportPlaceholder: "Write your question in one message...",
    supportSend: "Send",
    supportSent: "Message sent.",
    supportFailed: "Could not send the message.",
    notificationPendingBookings: "Pending online bookings",
    notificationsArchive: "Archive",
    notificationEmpty: "There are no new updates yet.",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    myProfile: "My profile",
    personalSettings: "Personal settings",
    helpSupport: "Help and support",
    language: "Language",
    compact: "Compact",
    dayView: "Day",
    detailed: "Detailed",
    threeDays: "3 days",
    weekView: "Week",
    monthView: "Month",
    selected: "Selected",
    visits: "visits",
    closedBySchedule: "Closed",
    ready: "Done",
    reminders: "Alerts",
    addVisit: "Add booking",
    customer: "Client",
    service: "Service",
    start: "Start",
    end: "End",
    save: "Save",
    cancel: "Cancel",
    noAppointments: "No bookings for this day yet.",
    recent: "Recent bookings",
    addService: "Add service",
    yourServices: "Your services",
    ownService: "Custom service",
    generalCatalog: "Global catalog",
    serviceName: "Service name",
    category: "Category",
    newCategory: "New category",
    selectedCategory: "Selected category",
    editService: "Edit service",
    saveService: "Save service",
    addFromCatalog: "Add from catalog",
    alreadyAdded: "In your services",
    catalogHint: "Choose a ready-made service from the Timviz global catalog.",
    myServicesHint: "These services are available for client booking. Tap a service to change price or duration.",
    price: "Price",
    duration: "Minutes",
    delete: "Delete",
    addClient: "Add client",
    connected: "Connected",
    notConnected: "Not connected",
    telegramHint: "Telegram connection is managed in workspace settings. The app shows the current status.",
    onlineBooking: "Online booking",
    address: "Address",
    publicPage: "Booking page",
    settingsSaved: "Changes saved",
    settingsSaveError: "Could not save settings.",
    settingsGeneral: "General",
    settingsOnline: "Online booking",
    settingsServices: "Services",
    settingsSchedule: "Schedule",
    settingsTelegram: "Telegram",
    settingsAddress: "Address",
    profileAndBusiness: "Profile and business",
    ownerContacts: "Owner contacts",
    avatarLink: "Master avatar",
    avatarHint: "The photo appears in the calendar, master card, and top menu.",
    changeAvatar: "Change avatar",
    deleteAvatar: "Delete avatar",
    avatarPermission: "Allow photo access to change the avatar.",
    newPassword: "New password",
    leaveBlankPassword: "leave blank if unchanged",
    businessFormat: "Name and format",
    website: "Website",
    accountType: "Account type",
    soloAccount: "I work alone",
    teamAccount: "Team",
    serviceMode: "Work format",
    categoriesText: "Categories",
    categoriesHint: "comma separated",
    localization: "Country, language and currency",
    country: "Country",
    timezone: "Timezone",
    currency: "Currency",
    saveSettings: "Save settings",
    publicLink: "Public link",
    copyLink: "Copy",
    manageServices: "Manage services",
    manageSchedule: "Manage schedule",
    joinRequests: "Join requests",
    noJoinRequests: "There are no new requests yet.",
    approve: "Approve",
    reject: "Reject",
    businessPhotos: "Business photos",
    photosHint: "The first photos appear on the online booking page.",
    streetAddress: "Address",
    addressDetails: "Address details",
    mapCoordinates: "Coordinates are saved from the website; the app edits the text address.",
    ownerOnlyHint: "Only the account owner can change business settings.",
    launchChecklist: "Launch checklist",
    profileReady: "Profile ready",
    completedSteps: "completed",
    photoUrl: "Photo link",
    photoCaption: "Photo caption",
    addPhotoUrl: "Add photo by link",
    addPhoto: "Add photo",
    uploadPhoto: "Upload photo",
    makePrimary: "Make primary",
    primaryPhoto: "Primary photo",
    addressSearch: "Find address on map",
    addressPlaceholder: "Start typing a real address",
    searchingAddress: "Searching address...",
    selectAddress: "Choose address",
    selectedAddress: "Selected address",
    streetHouse: "House, street",
    city: "City",
    region: "Region",
    postcode: "Postcode",
    openMap: "Open map",
    telegramConnectButton: "Connect bot",
    telegramOpenBot: "Open bot",
    telegramCopyLink: "Copy link",
    telegramRefreshLink: "Refresh link",
    telegramTokenExpires: "Link active until",
    telegramSectionNotifications: "Notifications",
    telegramSectionReminders: "Reminders",
    telegramSectionSupport: "Support",
    telegramNotificationsHint: "Choose which events the bot should send to Telegram.",
    telegramOnlineBookings: "New online bookings",
    telegramCabinetBookings: "New workspace bookings",
    telegramRescheduled: "Booking time changed",
    telegramCancelled: "Booking cancelled",
    telegramRemindersHint: "Reminders help you avoid missing upcoming visits.",
    telegramReminders: "Reminder before booking",
    telegramToday: "Today summary",
    telegramReminderLead: "Reminder time",
    telegramSupportHint: "Client and support questions can arrive directly in Telegram.",
    telegramForwarding: "Forward support to Telegram",
    telegramSaved: "Telegram updated",
    telegramSaveFailed: "Could not update Telegram.",
    minutesBefore: "min before",
    hoursBefore: "h before",
    dayBefore: "one day before",
    empty: "Empty for now",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

function detectLanguage(): AppLanguage {
  const languageCode = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  if (languageCode === "ru") return "ru";
  if (languageCode === "uk") return "uk";
  return "en";
}

function getDetectedCountry() {
  const regionCode = Localization.getLocales()[0]?.regionCode?.toUpperCase();
  if (regionCode === "UA") return { country: "Ukraine", currency: "UAH", phonePrefix: "+380" };
  if (regionCode === "PL") return { country: "Poland", currency: "PLN", phonePrefix: "+48" };
  if (regionCode === "US") return { country: "United States", currency: "USD", phonePrefix: "+1" };
  if (regionCode === "GB") return { country: "United Kingdom", currency: "GBP", phonePrefix: "+44" };
  return { country: "Ukraine", currency: "UAH", phonePrefix: "+380" };
}

function getDetectedTimezone() {
  return Localization.getCalendars()[0]?.timeZone || "Europe/Kyiv";
}

function inferCurrency(country: string) {
  const normalized = country.toLowerCase();
  if (normalized.includes("ukraine") || normalized.includes("укра")) return "UAH";
  if (normalized.includes("poland") || normalized.includes("поль")) return "PLN";
  if (normalized.includes("united kingdom") || normalized.includes("великобритан")) return "GBP";
  if (normalized.includes("united states") || normalized.includes("сша")) return "USD";
  if (normalized.includes("germany") || normalized.includes("france") || normalized.includes("spain") || normalized.includes("italy")) return "EUR";
  return "UAH";
}

function formatReminderLead(minutes: number, t: Record<string, string>) {
  if (minutes >= 1440) return t.dayBefore;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} ${t.hoursBefore}`;
  return `${minutes} ${t.minutesBefore}`;
}

function normalizeTelegramPanel(payload: any, fallback?: TelegramPanelState | null): TelegramPanelState {
  const settings = payload?.settings || {};
  return {
    deepLink: typeof payload?.deepLink === "string" ? payload.deepLink : fallback?.deepLink || "",
    tokenExpiresAt: typeof payload?.tokenExpiresAt === "string" ? payload.tokenExpiresAt : fallback?.tokenExpiresAt || "",
    connected: payload?.connected === true,
    chatId: typeof payload?.chatId === "string" ? payload.chatId : null,
    settings: {
      notificationsNewBooking: typeof settings.notificationsNewBooking === "boolean" ? settings.notificationsNewBooking : fallback?.settings.notificationsNewBooking ?? true,
      notificationsCabinetBooking: typeof settings.notificationsCabinetBooking === "boolean" ? settings.notificationsCabinetBooking : fallback?.settings.notificationsCabinetBooking ?? true,
      notificationsRescheduled: typeof settings.notificationsRescheduled === "boolean" ? settings.notificationsRescheduled : fallback?.settings.notificationsRescheduled ?? true,
      notificationsCancelled: typeof settings.notificationsCancelled === "boolean" ? settings.notificationsCancelled : fallback?.settings.notificationsCancelled ?? true,
      notificationsReminder: typeof settings.notificationsReminder === "boolean" ? settings.notificationsReminder : fallback?.settings.notificationsReminder ?? true,
      notificationsToday: typeof settings.notificationsToday === "boolean" ? settings.notificationsToday : fallback?.settings.notificationsToday ?? true,
      forwardingEnabled: typeof settings.forwardingEnabled === "boolean" ? settings.forwardingEnabled : fallback?.settings.forwardingEnabled ?? true,
      reminderLeadMinutes: typeof settings.reminderLeadMinutes === "number" ? settings.reminderLeadMinutes : fallback?.settings.reminderLeadMinutes ?? 120,
    },
  };
}

function normalizeApiSession(result: any, fallbackEmail: string): MobileSession {
  return {
    token: String(result.token || ""),
    professionalId: String(result.professionalId || ""),
    email: String(result.profile?.email || fallbackEmail),
    displayName: String(result.profile?.displayName || result.profile?.email || fallbackEmail),
  };
}

function formatMoney(value: number, currency?: string) {
  const amount = Number.isFinite(value) ? value : 0;
  return `${amount.toLocaleString("uk-UA")} ${currency || "UAH"}`;
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function getRoundedTime(step = 10) {
  const now = new Date();
  const total = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.ceil(total / step) * step;
  const hours = Math.floor(rounded / 60) % 24;
  const minutes = rounded % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function shiftDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map((item) => Number(item));
  const base = Number.isFinite(hours) && Number.isFinite(mins) ? hours * 60 + mins : 9 * 60;
  const total = base + Math.max(0, minutes || 0);
  const nextHours = Math.floor(total / 60) % 24;
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function createLocalId(prefix = "draft") {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function createVisitServiceDraft(startTime: string, service?: ServiceRecord): VisitServiceDraft {
  const duration = Math.max(5, service?.durationMinutes || 15);
  return {
    id: createLocalId("service"),
    serviceId: service?.id || "",
    serviceName: service?.name || "",
    startTime,
    endTime: addMinutes(startTime, duration),
    priceAmount: Number(service?.price || 0),
    durationMinutes: duration,
  };
}

function createDefaultVisitDraft(date: string, startTime: string): VisitDraft {
  return {
    customerName: "",
    customerPhone: "",
    startTime,
    serviceId: "",
    appointmentDate: date,
    targetProfessionalId: undefined,
    selectedClientId: undefined,
    items: [createVisitServiceDraft(startTime)],
  };
}

function timeToMinutes(time: string) {
  const [hours, mins] = time.split(":").map((item) => Number(item));
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return 9 * 60;
  return hours * 60 + mins;
}

function minutesToTime(minutes: number) {
  const safeMinutes = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function isValidTime(time: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  return Boolean(match);
}

function safeText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function formatDayLabel(date: string, language: AppLanguage) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : language === "uk" ? "uk-UA" : "ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(parsed)
    .replace(".", "");
}

function getWeekDates(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const day = parsed.getDay() || 7;
  parsed.setDate(parsed.getDate() - day + 1);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(parsed);
    next.setDate(parsed.getDate() + index);
    return next.toISOString().slice(0, 10);
  });
}

function getCalendarModeDates(mode: CalendarViewMode, date: string) {
  if (mode === "threeDays") return [date, shiftDate(date, 1), shiftDate(date, 2)];
  if (mode === "week") return Array.from({ length: 7 }, (_, index) => shiftDate(date, index));
  if (mode === "month") {
    return getMonthGridDates(date);
  }
  return [date];
}

function getMonthGridDates(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  const first = new Date(year, month, 1, 12);
  const firstDay = first.getDay() || 7;
  first.setDate(first.getDate() - firstDay + 1);
  const daysInGrid = 42;
  return Array.from({ length: daysInGrid }, (_, index) => {
    const next = new Date(first);
    next.setDate(first.getDate() + index);
    return next.toISOString().slice(0, 10);
  });
}

function shiftCalendarDate(mode: CalendarViewMode, date: string, direction: -1 | 1) {
  if (mode === "threeDays") return shiftDate(date, direction * 3);
  if (mode === "week") return shiftDate(date, direction * 7);
  if (mode === "month") {
    const parsed = new Date(`${date}T12:00:00`);
    parsed.setMonth(parsed.getMonth() + direction);
    return parsed.toISOString().slice(0, 10);
  }
  return shiftDate(date, direction);
}

function formatShortDate(date: string, language: AppLanguage) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : language === "uk" ? "uk-UA" : "ru-RU", {
    weekday: "short",
    day: "numeric",
  })
    .format(parsed)
    .replace(".", "");
}

function formatTimeFromMinutes(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatCalendarTitle(mode: CalendarViewMode, date: string, language: AppLanguage) {
  if (mode === "day") return formatDayLabel(date, language);
  const locale = language === "en" ? "en-US" : language === "uk" ? "uk-UA" : "ru-RU";
  if (mode === "month") {
    return new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(`${date}T12:00:00`));
  }
  const range = mode === "week" ? getCalendarModeDates("week", date) : [date, shiftDate(date, 2)];
  const start = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${range[0]}T12:00:00`));
  const endDate = range[range.length - 1];
  const end = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(`${endDate}T12:00:00`));
  return `${start} - ${end}`.replace(/\./g, "");
}

function isWeekend(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

function isSameMonth(left: string, right: string) {
  return left.slice(0, 7) === right.slice(0, 7);
}

const dayScheduleKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function getFallbackSchedule(date: string): WorkDayScheduleRecord {
  const weekend = isWeekend(date);
  return {
    enabled: !weekend,
    startTime: "09:00",
    endTime: "18:00",
    breaks: [],
    dayType: weekend ? "day-off" : "workday",
  };
}

function getScheduleForDate(workspace: WorkspaceSnapshot | null, date: string): WorkDayScheduleRecord {
  const custom = workspace?.memberSchedule?.customSchedule?.[date];
  if (custom) return normalizeScheduleDay(custom, date);
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  const schedule = workspace?.memberSchedule?.workSchedule?.[dayScheduleKeys[dayIndex]];
  return normalizeScheduleDay(schedule, date);
}

function getMemberScheduleForDate(member: CalendarMemberView | null, workspace: WorkspaceSnapshot | null, date: string): WorkDayScheduleRecord {
  if (!member?.memberSchedule) return getScheduleForDate(workspace, date);
  const custom = member.memberSchedule.customSchedule?.[date];
  if (custom) return normalizeScheduleDay(custom, date);
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  return normalizeScheduleDay(member.memberSchedule.workSchedule?.[dayScheduleKeys[dayIndex]], date);
}

function normalizeScheduleDay(day: WorkDayScheduleRecord | undefined, date: string): WorkDayScheduleRecord {
  const fallback = getFallbackSchedule(date);
  if (!day) return fallback;
  const enabled = day.enabled === true && day.dayType !== "day-off" && day.dayType !== "holiday";
  const startTime = typeof day.startTime === "string" && day.startTime ? day.startTime : fallback.startTime;
  const endTime = typeof day.endTime === "string" && day.endTime ? day.endTime : fallback.endTime;
  const breaks = Array.isArray(day.breaks)
    ? day.breaks
        .filter((item) => item?.startTime && item?.endTime && item.startTime < item.endTime)
        .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
    : day.breakStart && day.breakEnd && day.breakStart < day.breakEnd
      ? [{ startTime: day.breakStart, endTime: day.breakEnd }]
      : [];

  return {
    ...day,
    enabled,
    startTime,
    endTime,
    breaks,
    dayType: enabled ? "workday" : day.dayType || "day-off",
  };
}

function getWorkTimeLabel(schedule: WorkDayScheduleRecord, t: Record<string, string>) {
  if (!schedule.enabled) return t.closedBySchedule;
  return `${schedule.startTime}-${schedule.endTime}`;
}

function getWorkTimeParts(schedule: WorkDayScheduleRecord) {
  return {
    start: schedule.startTime,
    end: schedule.endTime,
  };
}

function getDayBreaksRecord(day: WorkDayScheduleRecord | undefined) {
  if (!day) return [];
  if (Array.isArray(day.breaks)) {
    return day.breaks
      .filter((item) => item?.startTime && item?.endTime && item.startTime < item.endTime)
      .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
      .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));
  }
  if (day.breakStart && day.breakEnd && day.breakStart < day.breakEnd) {
    return [{ startTime: day.breakStart, endTime: day.breakEnd }];
  }
  return [];
}

function getDayIntervalsRecord(day: WorkDayScheduleRecord | undefined) {
  if (!day) return [{ startTime: "09:00", endTime: "18:00" }];
  const dayStart = timeToMinutes(day.startTime);
  const dayEnd = timeToMinutes(day.endTime);
  if (dayStart >= dayEnd) {
    return [{ startTime: day.startTime, endTime: day.endTime }];
  }

  const intervals: WorkIntervalRecord[] = [];
  let cursor = dayStart;
  for (const item of getDayBreaksRecord(day)) {
    const breakStart = Math.max(dayStart, Math.min(dayEnd, timeToMinutes(item.startTime)));
    const breakEnd = Math.max(dayStart, Math.min(dayEnd, timeToMinutes(item.endTime)));
    if (breakStart > cursor) {
      intervals.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(breakStart) });
    }
    cursor = Math.max(cursor, breakEnd);
  }
  if (cursor < dayEnd) {
    intervals.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(dayEnd) });
  }
  return intervals.length ? intervals : [{ startTime: day.startTime, endTime: day.endTime }];
}

function validateWorkIntervals(intervals: WorkIntervalRecord[]) {
  const sorted = [...intervals]
    .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
    .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));

  if (sorted.some((item) => timeToMinutes(item.startTime) >= timeToMinutes(item.endTime))) {
    return { ok: false as const, reason: "range" as const, intervals: sorted };
  }

  const normalized: WorkIntervalRecord[] = [];
  for (const interval of sorted) {
    const previous = normalized[normalized.length - 1];
    if (!previous) {
      normalized.push(interval);
      continue;
    }
    if (timeToMinutes(interval.startTime) < timeToMinutes(previous.endTime)) {
      return { ok: false as const, reason: "overlap" as const, intervals: sorted };
    }
    if (interval.startTime === previous.endTime) {
      previous.endTime = interval.endTime;
      continue;
    }
    normalized.push(interval);
  }

  return { ok: true as const, reason: null, intervals: normalized };
}

function serializeIntervalsToDay(enabled: boolean, intervals: WorkIntervalRecord[], fallback?: WorkDayScheduleRecord) {
  const validation = validateWorkIntervals(intervals);
  const normalized = validation.ok ? validation.intervals : intervals;
  const fallbackStart = fallback?.startTime || normalized[0]?.startTime || "09:00";
  const fallbackEnd = fallback?.endTime || normalized[normalized.length - 1]?.endTime || "18:00";

  if (!enabled || normalized.length === 0) {
    return {
      enabled: false,
      startTime: fallbackStart,
      endTime: fallbackEnd,
      breakStart: fallbackStart,
      breakEnd: fallbackStart,
      breaks: [],
      dayType: "day-off" as const,
    };
  }

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const breaks: WorkBreakRecord[] = [];
  for (let index = 0; index < normalized.length - 1; index += 1) {
    const current = normalized[index];
    const next = normalized[index + 1];
    breaks.push({ startTime: current.endTime, endTime: next.startTime });
  }

  return {
    enabled: true,
    startTime: first.startTime,
    endTime: last.endTime,
    breakStart: breaks[0]?.startTime || first.startTime,
    breakEnd: breaks[0]?.endTime || first.startTime,
    breaks,
    dayType: "workday" as const,
  };
}

function getIntervalsDurationMinutes(intervals: WorkIntervalRecord[]) {
  return intervals.reduce((sum, item) => sum + Math.max(0, timeToMinutes(item.endTime) - timeToMinutes(item.startTime)), 0);
}

function formatMoneylessHours(minutes: number, unit: string) {
  const hours = Math.round((minutes / 60) * 10) / 10;
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".", ",");
  return `${value} ${unit}`;
}

function createSplitWorkIntervals(interval: WorkIntervalRecord) {
  const start = timeToMinutes(interval.startTime);
  const end = timeToMinutes(interval.endTime);
  const duration = end - start;
  if (duration < 180) return null;
  const gap = 60;
  const firstEnd = Math.round((start + (duration - gap) / 2) / 15) * 15;
  const safeFirstEnd = Math.max(start + 60, Math.min(firstEnd, end - gap - 60));
  const secondStart = safeFirstEnd + gap;
  if (safeFirstEnd <= start || secondStart >= end) return null;
  return [
    { startTime: minutesToTime(start), endTime: minutesToTime(safeFirstEnd) },
    { startTime: minutesToTime(secondStart), endTime: minutesToTime(end) },
  ];
}

function createWorkIntervalAfter(intervals: WorkIntervalRecord[], index: number) {
  const current = intervals[index];
  if (!current) return null;
  const next = intervals[index + 1];
  const minGap = 15;
  const currentEnd = timeToMinutes(current.endTime);
  const nextStart = next ? timeToMinutes(next.startTime) : 24 * 60;
  if (nextStart - currentEnd > minGap) {
    const windowStart = currentEnd + minGap;
    const desiredEnd = Math.min(nextStart - minGap, windowStart + 60);
    if (desiredEnd - windowStart >= 15) {
      return { startTime: minutesToTime(windowStart), endTime: minutesToTime(desiredEnd) };
    }
  }
  const desiredStart = Math.min(currentEnd + 60, 24 * 60 - 30);
  const desiredEnd = Math.min(24 * 60 - 1, desiredStart + 60);
  if (desiredEnd - desiredStart < 15) return null;
  return { startTime: minutesToTime(desiredStart), endTime: minutesToTime(desiredEnd) };
}

function insertWorkIntervalRecord(intervals: WorkIntervalRecord[], index: number) {
  if (intervals.length === 1) {
    const split = createSplitWorkIntervals(intervals[0]);
    if (split) return split;
  }
  const suggestion = createWorkIntervalAfter(intervals, index);
  if (!suggestion) return null;
  return [...intervals.slice(0, index + 1), suggestion, ...intervals.slice(index + 1)];
}

function getClosedShortLabel(language: AppLanguage) {
  return "of";
}

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(() => detectLanguage());
  const [mode, setMode] = useState<AuthMode>("login");
  const [session, setSession] = useState<MobileSession | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [calendar, setCalendar] = useState<CalendarSnapshot | null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogCategory[]>([]);
  const [staffSnapshot, setStaffSnapshot] = useState<StaffSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("calendar");
  const [settingsSection, setSettingsSection] = useState<MobileSettingsSection>("general");
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [loadingSession, setLoadingSession] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visitComposerOpen, setVisitComposerOpen] = useState(false);
  const detectedCountry = useMemo(() => getDetectedCountry(), []);
  const detectedTimezone = useMemo(() => getDetectedTimezone(), []);
  const t = copy[language];

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: detectedCountry.phonePrefix,
    companyName: "",
  });
  const [visitDraft, setVisitDraft] = useState<VisitDraft>(() => createDefaultVisitDraft(selectedDate, "09:00"));
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null);
  const [timeAction, setTimeAction] = useState<{ date: string; time: string; targetProfessionalId?: string } | null>(null);
  const [serviceDraft, setServiceDraft] = useState<ServiceDraftState>({ name: "", category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
  const [clientDraft, setClientDraft] = useState({ firstName: "", lastName: "", phone: "", email: "" });

  function openSettingsSection(section: MobileSettingsSection = "general") {
    setSettingsSection(section);
    setActiveTab("settings");
  }

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) {
        setLoadingSession(false);
        return;
      }
      try {
        setSession(JSON.parse(raw) as MobileSession);
      } catch {
        setSession(null);
      }
      setLoadingSession(false);
    });
  }, []);

  useEffect(() => {
    if (session) {
      refreshAll(session, selectedDate);
    }
  }, [session, selectedDate]);

  async function apiFetch(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || `HTTP ${response.status}`);
    }
    return result;
  }

  const loadCalendarDays = useCallback(async (dates: string[]) => {
    if (!session) return {};
    const uniqueDates = Array.from(new Set(dates)).filter(Boolean);
    const headers = { Authorization: `Bearer ${session.token}` };
    const entries = await Promise.all(
      uniqueDates.map(async (date) => {
        const response = await fetch(`${API_BASE_URL}/api/mobile/pro/calendar?date=${encodeURIComponent(date)}`, { headers });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result?.error) {
          return [date, null] as const;
        }
        return [date, result as CalendarSnapshot] as const;
      })
    );

    return Object.fromEntries(entries.filter((entry): entry is readonly [string, CalendarSnapshot] => Boolean(entry[1])));
  }, [session]);

  async function refreshAll(currentSession = session, date = selectedDate) {
    if (!currentSession) return;

    setRefreshing(true);
    try {
      const headers = { Authorization: `Bearer ${currentSession.token}` };
      const [workspaceResult, calendarResult, clientsResult, servicesResult, staffResult] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mobile/pro/workspace/${currentSession.professionalId}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/calendar?date=${encodeURIComponent(date)}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/clients`, { headers }).then((item) => item.json()),
        fetch(`${API_BASE_URL}/api/mobile/pro/services`, { headers }).then((item) => item.json()),
        fetch(`${API_BASE_URL}/api/mobile/pro/staff`, { headers }).then((item) => item.json().catch(() => null)).catch(() => null),
      ]);

      if (workspaceResult?.error) throw new Error(workspaceResult.error);
      if (calendarResult?.error) throw new Error(calendarResult.error);
      if (clientsResult?.error) throw new Error(clientsResult.error);
      if (servicesResult?.error) throw new Error(servicesResult.error);
      if (staffResult?.error) throw new Error(staffResult.error);

      setWorkspace(workspaceResult);
      setCalendar(calendarResult);
      setClients(Array.isArray(clientsResult.clients) ? clientsResult.clients : []);
      setServiceCatalog(Array.isArray(servicesResult.catalog) ? servicesResult.catalog : []);
      setStaffSnapshot(staffResult || null);
      setVisitDraft((current) => ({
        ...current,
        customerName: safeText(current.customerName),
        customerPhone: safeText(current.customerPhone),
        startTime: safeText(current.startTime) || "09:00",
        appointmentDate: safeText(current.appointmentDate) || date,
        serviceId: current.serviceId || workspaceResult.services?.[0]?.id || "",
        items: Array.isArray(current.items) && current.items.length ? current.items : [createVisitServiceDraft(safeText(current.startTime) || "09:00")],
      }));
    } catch (error) {
      Alert.alert("Timviz", error instanceof Error ? error.message : "Failed to load workspace.");
    } finally {
      setRefreshing(false);
    }
  }

  async function persistSession(nextSession: MobileSession) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    await refreshAll(nextSession, selectedDate);
  }

  async function signIn() {
    const email = loginForm.email.trim().toLowerCase();
    if (!email || !loginForm.password.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginForm.password }),
      });
      const result = await response.json();
      if (!response.ok) {
        Alert.alert(t.loginError, result?.error || t.loginError);
        return;
      }
      await persistSession(normalizeApiSession(result, email));
    } catch (error) {
      Alert.alert(t.loginError, error instanceof Error ? error.message : t.loginError);
    } finally {
      setBusy(false);
    }
  }

  async function register() {
    const payload = {
      ...registerForm,
      email: registerForm.email.trim().toLowerCase(),
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
      phone: registerForm.phone.trim(),
      companyName: registerForm.companyName.trim(),
      language,
      country: detectedCountry.country,
      currency: detectedCountry.currency,
      timezone: detectedTimezone,
    };

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.email ||
      !payload.password ||
      !payload.phone ||
      !payload.companyName
    ) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/pro/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        Alert.alert(t.registerError, result?.error || t.registerError);
        return;
      }
      await persistSession(normalizeApiSession(result, payload.email));
    } catch (error) {
      Alert.alert(t.registerError, error instanceof Error ? error.message : t.registerError);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setWorkspace(null);
    setCalendar(null);
    setClients([]);
    setServiceCatalog([]);
    setStaffSnapshot(null);
    setBusy(false);
  }

  function getNormalizedVisitItems() {
    return (Array.isArray(visitDraft.items) ? visitDraft.items : []).map((item) => ({
      ...item,
      serviceId: safeText(item.serviceId),
      serviceName: safeText(item.serviceName).trim(),
      startTime: safeText(item.startTime).trim(),
      endTime: safeText(item.endTime).trim(),
      priceAmount: Number(item.priceAmount || 0),
      durationMinutes: Number(item.durationMinutes || 15),
    }));
  }

  async function createVisit() {
    const items = getNormalizedVisitItems();
    if (!items.length || items.some((item) => !item.serviceName || !isValidTime(item.startTime) || !isValidTime(item.endTime) || timeToMinutes(item.endTime) <= timeToMinutes(item.startTime))) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }

    const appointmentDate = visitDraft.appointmentDate || selectedDate;
    const customerName = safeText(visitDraft.customerName).trim();
    const customerPhone = safeText(visitDraft.customerPhone).trim();
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/calendar", {
        method: "POST",
        body: JSON.stringify({
          targetProfessionalId: visitDraft.targetProfessionalId,
          items: items.map((item) => ({
            appointmentDate,
            startTime: item.startTime,
            endTime: item.endTime,
            customerName,
            customerPhone,
            serviceName: item.serviceName,
            priceAmount: item.priceAmount,
            attendance: "confirmed",
            notes: "",
          })),
        }),
      });
      setVisitDraft(createDefaultVisitDraft(appointmentDate, items[0]?.startTime || "09:00"));
      await refreshAll(session, appointmentDate);
      return true;
    } catch (error) {
      Alert.alert(t.addVisit, error instanceof Error ? error.message : t.addVisit);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function saveEditedVisit() {
    if (!editingAppointment) return false;
    const items = getNormalizedVisitItems();
    if (!items.length || items.some((item) => !item.serviceName || !isValidTime(item.startTime) || !isValidTime(item.endTime) || timeToMinutes(item.endTime) <= timeToMinutes(item.startTime))) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }

    const primaryItem = items[0];
    const extraItems = items.slice(1);
    const appointmentDate = visitDraft.appointmentDate || editingAppointment.appointmentDate || selectedDate;
    const customerName = safeText(visitDraft.customerName).trim();
    const customerPhone = safeText(visitDraft.customerPhone).trim();
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/calendar", {
        method: "PATCH",
        body: JSON.stringify({
          mode: "meta",
          targetProfessionalId: editingAppointment.professionalId || visitDraft.targetProfessionalId,
          appointmentId: editingAppointment.id,
          customerName,
          customerPhone,
          startTime: primaryItem.startTime,
          endTime: primaryItem.endTime,
          serviceName: primaryItem.serviceName,
          priceAmount: primaryItem.priceAmount,
          attendance: editingAppointment.attendance,
          previousCustomerName: editingAppointment.customerName,
          previousCustomerPhone: editingAppointment.customerPhone,
          previousAppointmentTime: editingAppointment.startTime,
        }),
      });
      if (extraItems.length) {
        await apiFetch("/api/mobile/pro/calendar", {
          method: "POST",
          body: JSON.stringify({
            targetProfessionalId: editingAppointment.professionalId || visitDraft.targetProfessionalId,
            items: extraItems.map((item) => ({
              appointmentDate,
              startTime: item.startTime,
              endTime: item.endTime,
              customerName,
              customerPhone,
              serviceName: item.serviceName,
              priceAmount: item.priceAmount,
              attendance: editingAppointment.attendance,
              notes: "",
            })),
          }),
        });
      }
      await refreshAll(session, appointmentDate);
      setEditingAppointment(null);
      return true;
    } catch (error) {
      Alert.alert(t.editVisit, error instanceof Error ? error.message : t.editVisit);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createClientFromVisit(input: { fullName: string; phone: string; email: string }) {
    const parts = input.fullName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length && !input.phone.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return null;
    }

    setBusy(true);
    try {
      const result = await apiFetch("/api/mobile/pro/clients", {
        method: "POST",
        body: JSON.stringify({
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" "),
          phone: input.phone.trim(),
          email: input.email.trim(),
          notificationsTelegram: true,
          marketingTelegram: false,
        }),
      });
      await refreshAll();
      return result?.client as ClientRecord;
    } catch (error) {
      Alert.alert(t.addClient, error instanceof Error ? error.message : t.addClient);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function deleteAppointment(appointment: AppointmentRecord) {
    Alert.alert(t.delete, appointment.serviceName || t.newVisit, [
      { text: t.cancel || "Cancel", style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            const target = appointment.professionalId ? `&targetProfessionalId=${encodeURIComponent(appointment.professionalId)}` : "";
            await apiFetch(`/api/mobile/pro/calendar?appointmentId=${encodeURIComponent(appointment.id)}${target}`, { method: "DELETE" });
            await refreshAll(session, appointment.appointmentDate || selectedDate);
          } catch (error) {
            Alert.alert(t.delete, error instanceof Error ? error.message : t.delete);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  async function updateAppointmentTime(appointment: AppointmentRecord, startTime: string, endTime: string) {
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/calendar", {
        method: "PATCH",
        body: JSON.stringify({
          targetProfessionalId: appointment.professionalId,
          appointmentId: appointment.id,
          startTime,
          endTime,
          previousAppointmentTime: appointment.startTime,
          previousAppointmentDate: appointment.appointmentDate,
        }),
      });
      await refreshAll(session, appointment.appointmentDate || selectedDate);
      return true;
    } catch (error) {
      Alert.alert(t.editVisit, error instanceof Error ? error.message : t.editVisit);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createBlockedTime(date: string, startTime: string, endTime: string, label: string, targetProfessionalId?: string) {
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/calendar", {
        method: "POST",
        body: JSON.stringify({
          kind: "blocked",
          targetProfessionalId,
          appointmentDate: date,
          startTime,
          endTime,
          serviceName: label,
        }),
      });
      await refreshAll(session, date);
    } catch (error) {
      Alert.alert(label, error instanceof Error ? error.message : label);
    } finally {
      setBusy(false);
    }
  }

  async function createService() {
    if (!serviceDraft.name.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }

    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/services", {
        method: "POST",
        body: JSON.stringify({
          name: serviceDraft.name.trim(),
          category: serviceDraft.category.trim() || DEFAULT_SERVICE_CATEGORY,
          durationMinutes: Number(serviceDraft.durationMinutes || 60),
          price: Number(serviceDraft.price || 0),
          color: serviceDraft.color || SERVICE_COLORS[0],
          source: "custom",
        }),
      });
      setServiceDraft({ name: "", category: serviceDraft.category || DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
      await refreshAll();
      return true;
    } catch (error) {
      Alert.alert(t.addService, error instanceof Error ? error.message : t.addService);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function updateService(serviceId: string, draft: ServiceDraftState) {
    if (!draft.name.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return false;
    }

    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/services", {
        method: "PATCH",
        body: JSON.stringify({
          serviceId,
          name: draft.name.trim(),
          category: draft.category.trim() || DEFAULT_SERVICE_CATEGORY,
          durationMinutes: Number(draft.durationMinutes || 60),
          price: Number(draft.price || 0),
          color: draft.color || SERVICE_COLORS[0],
        }),
      });
      await refreshAll();
      return true;
    } catch (error) {
      Alert.alert(t.editService, error instanceof Error ? error.message : t.editService);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addCatalogService(service: ServiceTemplateRecord & { category: string }) {
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/services", {
        method: "POST",
        body: JSON.stringify({
          name: service.name,
          category: service.category || DEFAULT_SERVICE_CATEGORY,
          durationMinutes: Number(service.durationMinutes || 60),
          price: Number(service.price || 0),
          color: SERVICE_COLORS[(workspace?.services.length || 0) % SERVICE_COLORS.length],
          source: "catalog",
        }),
      });
      await refreshAll();
    } catch (error) {
      Alert.alert(t.addFromCatalog, error instanceof Error ? error.message : t.addFromCatalog);
    } finally {
      setBusy(false);
    }
  }

  async function saveStaffSchedule(
    member: StaffMemberRecord,
    workSchedule: WorkScheduleRecord,
    customSchedule: Record<string, WorkDayScheduleRecord> = member.membership.customSchedule || {},
    workScheduleMode: "fixed" | "flexible" = member.membership.workScheduleMode || "fixed"
  ) {
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/staff", {
        method: "POST",
        body: JSON.stringify({
          action: "saveSchedule",
          targetProfessionalId: member.professional.id,
          workScheduleMode,
          workSchedule,
          customSchedule,
        }),
      });
      await refreshAll();
      return true;
    } catch (error) {
      Alert.alert(t.staffSchedule, error instanceof Error ? error.message : t.staffSchedule);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function removeService(serviceId: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/mobile/pro/services?serviceId=${encodeURIComponent(serviceId)}`, { method: "DELETE" });
      await refreshAll();
    } catch (error) {
      Alert.alert(t.delete, error instanceof Error ? error.message : t.delete);
    } finally {
      setBusy(false);
    }
  }

  async function createClient() {
    if (!clientDraft.firstName.trim() && !clientDraft.phone.trim()) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }

    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/clients", {
        method: "POST",
        body: JSON.stringify({
          firstName: clientDraft.firstName.trim(),
          lastName: clientDraft.lastName.trim(),
          phone: clientDraft.phone.trim(),
          email: clientDraft.email.trim(),
          notificationsTelegram: true,
          marketingTelegram: false,
        }),
      });
      setClientDraft({ firstName: "", lastName: "", phone: "", email: "" });
      await refreshAll();
    } catch (error) {
      Alert.alert(t.addClient, error instanceof Error ? error.message : t.addClient);
    } finally {
      setBusy(false);
    }
  }

  if (loadingSession) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  if (session) {
    return (
      <SafeAreaView style={styles.appScreen}>
        <WorkspaceHeader
          t={t}
          language={language}
          setLanguage={setLanguage}
          session={session}
          workspace={workspace}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          apiFetch={apiFetch}
          onRefreshWorkspace={() => refreshAll()}
          onOpenNotification={(item) => {
            setActiveTab("calendar");
            setSelectedDate(item.appointmentDate);
          }}
          onOpenSettingsSection={openSettingsSection}
          onSignOut={signOut}
        />

        {activeTab === "calendar" ? (
          <CalendarTab
            t={t}
            language={language}
            workspace={workspace}
            staff={staffSnapshot}
            calendar={calendar}
            clients={clients}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            visitDraft={visitDraft}
            setVisitDraft={setVisitDraft}
            onCreateVisit={createVisit}
            onUpdateVisit={saveEditedVisit}
            onCreateClientFromVisit={createClientFromVisit}
            editingAppointment={editingAppointment}
            setEditingAppointment={setEditingAppointment}
            timeAction={timeAction}
            setTimeAction={setTimeAction}
            onDeleteAppointment={deleteAppointment}
            onMoveAppointment={(appointment) => updateAppointmentTime(appointment, addMinutes(appointment.startTime, 10), addMinutes(appointment.endTime, 10))}
            onResizeAppointment={(appointment) => updateAppointmentTime(appointment, appointment.startTime, addMinutes(appointment.endTime, 10))}
            onUpdateBlockedTime={updateAppointmentTime}
            onCreateBlockedTime={createBlockedTime}
            busy={busy}
            refreshing={refreshing}
            onRefresh={() => refreshAll()}
            composerOpen={visitComposerOpen}
            setComposerOpen={setVisitComposerOpen}
            loadCalendarDays={loadCalendarDays}
          />
        ) : (
          <ScrollView
            style={styles.workspaceScroll}
            contentContainerStyle={styles.workspaceContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => refreshAll()} tintColor="#7C3AED" />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.workspaceHero}>
              <Text style={styles.workspaceEyebrow}>{t.dashboard}</Text>
              <Text style={styles.workspaceTitle}>{t[activeTab]}</Text>
              <Text style={styles.workspaceSubtitle}>{workspace?.business.name || session.displayName}</Text>
            </View>

            {activeTab === "services" ? (
              <ServicesTab
                t={t}
                workspace={workspace}
                catalog={serviceCatalog}
                draft={serviceDraft}
                setDraft={setServiceDraft}
                onCreate={createService}
                onUpdate={updateService}
                onAddCatalog={addCatalogService}
                onDelete={removeService}
                busy={busy}
              />
            ) : null}
            {activeTab === "clients" ? (
              <ClientsTab
                t={t}
                clients={clients}
                draft={clientDraft}
                setDraft={setClientDraft}
                onCreate={createClient}
                busy={busy}
              />
            ) : null}
            {activeTab === "staff" ? (
              <StaffWorkspaceTab
                t={t}
                language={language}
                staff={staffSnapshot}
                workspace={workspace}
                busy={busy}
                apiFetch={apiFetch}
                onRefreshWorkspace={() => refreshAll(session, selectedDate)}
                onSaveSchedule={saveStaffSchedule}
              />
            ) : null}
            {activeTab === "settings" ? (
              <SettingsTab
                t={t}
                language={language}
                setLanguage={setLanguage}
                workspace={workspace}
                staff={staffSnapshot}
                apiFetch={apiFetch}
                onRefreshWorkspace={() => refreshAll(session, selectedDate)}
                setActiveTab={setActiveTab}
                activeSection={settingsSection}
                setActiveSection={setSettingsSection}
                onSignOut={signOut}
                busy={busy}
              />
            ) : null}
          </ScrollView>
        )}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.authScreen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <BrandLogo />
            <LanguageSwitch language={language} setLanguage={setLanguage} />
          </View>

          <View style={styles.authIntro}>
            <Image source={APP_ICON} style={styles.authIcon} />
            <Text style={styles.authTitle}>{t.proTitle}</Text>
            <Text style={styles.authSubtitle}>{t.proSubtitle}</Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.segment}>
              <Pressable onPress={() => setMode("login")} style={[styles.segmentButton, mode === "login" && styles.segmentButtonActive]}>
                <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>{t.login}</Text>
              </Pressable>
              <Pressable onPress={() => setMode("register")} style={[styles.segmentButton, mode === "register" && styles.segmentButtonActive]}>
                <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>{t.register}</Text>
              </Pressable>
            </View>

            {mode === "login" ? (
              <View style={styles.form}>
                <Field
                  label={t.email}
                  value={loginForm.email}
                  onChangeText={(value) => setLoginForm((current) => ({ ...current, email: value }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@email.com"
                />
                <Field
                  label={t.password}
                  value={loginForm.password}
                  onChangeText={(value) => setLoginForm((current) => ({ ...current, password: value }))}
                  secureTextEntry
                />
                <PrimaryButton label={busy ? t.signingIn : t.login} onPress={signIn} disabled={busy} />
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.twoColumns}>
                  <Field label={t.firstName} value={registerForm.firstName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, firstName: value }))} />
                  <Field label={t.lastName} value={registerForm.lastName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, lastName: value }))} />
                </View>
                <Field label={t.email} value={registerForm.email} onChangeText={(value) => setRegisterForm((current) => ({ ...current, email: value }))} keyboardType="email-address" autoCapitalize="none" placeholder="you@email.com" />
                <Field label={t.password} hint={t.passwordHint} value={registerForm.password} onChangeText={(value) => setRegisterForm((current) => ({ ...current, password: value }))} secureTextEntry />
                <Field label={t.phone} value={registerForm.phone} onChangeText={(value) => setRegisterForm((current) => ({ ...current, phone: value }))} keyboardType="phone-pad" />
                <Field label={t.companyName} value={registerForm.companyName} onChangeText={(value) => setRegisterForm((current) => ({ ...current, companyName: value }))} />
                <PrimaryButton label={busy ? t.creating : t.continue} onPress={register} disabled={busy} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function CalendarTab({
  t,
  language,
  workspace,
  staff,
  calendar,
  clients,
  selectedDate,
  setSelectedDate,
  visitDraft,
  setVisitDraft,
  onCreateVisit,
  onUpdateVisit,
  onCreateClientFromVisit,
  editingAppointment,
  setEditingAppointment,
  timeAction,
  setTimeAction,
  onDeleteAppointment,
  onMoveAppointment,
  onResizeAppointment,
  onUpdateBlockedTime,
  onCreateBlockedTime,
  busy,
  refreshing,
  onRefresh,
  composerOpen,
  setComposerOpen,
  loadCalendarDays,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  workspace: WorkspaceSnapshot | null;
  staff: StaffSnapshot | null;
  calendar: CalendarSnapshot | null;
  clients: ClientRecord[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  visitDraft: VisitDraft;
  setVisitDraft: (draft: VisitDraft) => void;
  onCreateVisit: () => Promise<boolean>;
  onUpdateVisit: () => Promise<boolean>;
  onCreateClientFromVisit: (input: { fullName: string; phone: string; email: string }) => Promise<ClientRecord | null>;
  editingAppointment: AppointmentRecord | null;
  setEditingAppointment: (appointment: AppointmentRecord | null) => void;
  timeAction: { date: string; time: string; targetProfessionalId?: string } | null;
  setTimeAction: (action: { date: string; time: string; targetProfessionalId?: string } | null) => void;
  onDeleteAppointment: (appointment: AppointmentRecord) => void;
  onMoveAppointment: (appointment: AppointmentRecord) => void;
  onResizeAppointment: (appointment: AppointmentRecord) => void;
  onUpdateBlockedTime: (appointment: AppointmentRecord, startTime: string, endTime: string) => Promise<boolean>;
  onCreateBlockedTime: (date: string, startTime: string, endTime: string, label: string, targetProfessionalId?: string) => Promise<void>;
  busy: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
  loadCalendarDays: (dates: string[]) => Promise<Record<string, CalendarSnapshot>>;
}) {
  const currency = workspace?.professional.currency;
  const services = workspace?.services || [];
  const { width: screenWidth } = useWindowDimensions();
  const [isCompact, setIsCompact] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [blockedTimeDraft, setBlockedTimeDraft] = useState<BlockedTimeDraft | null>(null);
  const [visitPickerMode, setVisitPickerMode] = useState<"client" | "service" | null>(null);
  const [editingServiceIndex, setEditingServiceIndex] = useState(0);
  const [serviceQuery, setServiceQuery] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientCreateOpen, setClientCreateOpen] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState({ firstName: "", lastName: "", phone: "" });
  const visibleDates = useMemo(() => getCalendarModeDates(viewMode, selectedDate), [selectedDate, viewMode]);
  const visibleDatesKey = visibleDates.join("|");
  const [rangeSnapshots, setRangeSnapshots] = useState<Record<string, CalendarSnapshot>>({});
  const calendarMembers = useMemo<CalendarMemberView[]>(() => {
    const map = new Map<string, CalendarMemberView>();
    const addMember = (member: CalendarMemberView) => {
      if (!member.id) return;
      map.set(member.id, { ...map.get(member.id), ...member, name: member.name.trim() || t.employee });
    };
    for (const member of makeStaffMembers(staff, workspace, t)) {
      addMember({
        id: member.professional.id,
        name: makeStaffMemberName(member, t.employee),
        avatarUrl: member.professional.avatarUrl,
        role: member.membership.role || t.employee,
        scope: member.membership.scope,
        isViewer: member.professional.id === workspace?.professional.id,
        memberSchedule: {
          workScheduleMode: member.membership.workScheduleMode,
          workSchedule: member.membership.workSchedule,
          customSchedule: member.membership.customSchedule,
        },
      });
    }
    for (const member of calendar?.teamMembers || []) {
      addMember({
        id: member.id,
        name: `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.role || t.employee,
        avatarUrl: member.avatarUrl,
        role: member.role || t.employee,
        scope: member.scope,
        isViewer: member.isViewer,
      });
    }
    for (const member of calendar?.memberCalendars || []) {
      addMember({
        id: member.professionalId,
        name: `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.role || t.employee,
        avatarUrl: member.avatarUrl,
        role: member.role || t.employee,
        scope: member.scope,
        isViewer: member.isViewer,
        memberSchedule: member.memberSchedule,
      });
    }
    if (workspace?.professional.id && !map.has(workspace.professional.id)) {
      addMember({
        id: workspace.professional.id,
        name: `${workspace.professional.firstName || ""} ${workspace.professional.lastName || ""}`.trim() || "Timviz",
        avatarUrl: workspace.professional.avatarUrl,
        role: workspace.membership?.role || t.owner,
        scope: workspace.membership?.scope === "member" ? "member" : "owner",
        isViewer: true,
        memberSchedule: workspace.memberSchedule,
      });
    }
    return Array.from(map.values());
  }, [calendar?.memberCalendars, calendar?.teamMembers, staff, t, workspace]);
  const selectedMembers = calendarMembers.filter((member) => selectedMemberIds.includes(member.id));
  const primaryMember = selectedMembers[0] || calendarMembers[0] || null;
  const visibleCalendarMembers = selectedMembers.length ? selectedMembers : calendarMembers.slice(0, 1);
  const dayMemberColumnWidth = Math.floor(
    visibleCalendarMembers.length > 1
      ? Math.max(164, (screenWidth - 54) / visibleCalendarMembers.length)
      : Math.max(280, screenWidth - 54)
  );
  const selectedSchedule = getMemberScheduleForDate(primaryMember, workspace, selectedDate);
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentRecord[]>();
    for (const [date, snapshot] of Object.entries(rangeSnapshots)) {
      map.set(date, snapshot.appointments || []);
    }
    for (const appointment of calendar?.appointments || []) {
      const key = appointment.appointmentDate || selectedDate;
      const list = map.get(key) || [];
      if (list.some((item) => item.id === appointment.id)) {
        continue;
      }
      list.push(appointment);
      map.set(key, list);
    }
    return map;
  }, [calendar?.appointments, rangeSnapshots, selectedDate]);
  const viewOptions: Array<{ value: CalendarViewMode; label: string }> = [
    { value: "day", label: t.dayView },
    { value: "threeDays", label: t.threeDays },
    { value: "week", label: t.weekView },
    { value: "month", label: t.monthView },
  ];
  const activeViewLabel = viewOptions.find((item) => item.value === viewMode)?.label || t.dayView;
  const titleText = formatCalendarTitle(viewMode, selectedDate, language);
  const selectedClient = visitDraft.selectedClientId ? clients.find((client) => client.id === visitDraft.selectedClientId) || null : null;
  const draftVisitItems = Array.isArray(visitDraft.items) && visitDraft.items.length ? visitDraft.items : [createVisitServiceDraft(visitDraft.startTime || "09:00")];
  const visitTotal = draftVisitItems.reduce((sum, item) => sum + Number(item.priceAmount || 0), 0);
  const filteredServices = services.filter((service) => service.name.toLowerCase().includes(serviceQuery.trim().toLowerCase()));
  const filteredClients = clients.filter((client) => {
    const query = clientQuery.trim().toLowerCase();
    if (!query) return true;
    return `${client.fullName || ""} ${client.phone || ""} ${client.email || ""}`.toLowerCase().includes(query);
  });
  const hasClientSearch = clientQuery.trim().length > 0;
  const showCreateFromSearch = hasClientSearch && filteredClients.length === 0 && !clientCreateOpen;
  const filteredMembers = calendarMembers.filter((member) => {
    const query = memberQuery.trim().toLowerCase();
    if (!query) return true;
    return `${member.name} ${member.role}`.toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!calendarMembers.length) return;
    const validIds = new Set(calendarMembers.map((member) => member.id));
    setSelectedMemberIds((current) => {
      const kept = current.filter((id) => validIds.has(id));
      if (kept.length) return kept;
      const preferred = calendar?.viewedProfessionalId || workspace?.professional.id || calendarMembers[0].id;
      return preferred && validIds.has(preferred) ? [preferred] : [calendarMembers[0].id];
    });
  }, [calendar?.viewedProfessionalId, calendarMembers, workspace?.professional.id]);

  useEffect(() => {
    if (viewMode === "day") return;
    let cancelled = false;
    loadCalendarDays(visibleDates)
      .then((snapshots) => {
        if (!cancelled) setRangeSnapshots((current) => ({ ...current, ...snapshots }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [loadCalendarDays, viewMode, visibleDatesKey]);

  function getAppointmentsForDate(date: string) {
    return appointmentsByDate.get(date) || [];
  }

  function getSnapshotForDate(date: string) {
    return date === selectedDate ? calendar : rangeSnapshots[date] || null;
  }

  function getAppointmentsForMember(date: string, memberId: string) {
    const snapshot = getSnapshotForDate(date);
    const memberCalendar = snapshot?.memberCalendars?.find((member) => member.professionalId === memberId);
    if (memberCalendar) return memberCalendar.appointments || [];
    return getAppointmentsForDate(date).filter((appointment) => (appointment.professionalId || workspace?.professional.id || memberId) === memberId);
  }

  function getScheduleForMember(date: string, member: CalendarMemberView | null) {
    return getMemberScheduleForDate(member, workspace, date);
  }

  function toggleMember(memberId: string) {
    setSelectedMemberIds((current) => {
      if (current.includes(memberId)) {
        return current.length > 1 ? current.filter((id) => id !== memberId) : current;
      }
      return [...current, memberId];
    });
  }

  function selectAllMembers() {
    setSelectedMemberIds(calendarMembers.map((member) => member.id));
  }

  function setDraftClient(client: ClientRecord | null) {
    setVisitDraft({
      ...visitDraft,
      selectedClientId: client?.id,
      customerName: client?.fullName || "",
      customerPhone: client?.phone || "",
    });
    setClientQuery("");
    setClientCreateOpen(false);
    setVisitPickerMode(null);
  }

  function getClientDraftFromQuery(query: string) {
    const value = query.trim();
    if (!value) return { firstName: "", lastName: "", phone: "" };
    const looksLikePhone = /^[+\d\s().-]+$/.test(value) && /\d/.test(value);
    if (looksLikePhone) return { firstName: "", lastName: "", phone: value };
    const parts = value.split(/\s+/).filter(Boolean);
    return { firstName: parts[0] || "", lastName: parts.slice(1).join(" "), phone: "" };
  }

  function openInlineClientForm(seed = clientQuery) {
    setNewClientDraft(getClientDraftFromQuery(seed));
    setClientCreateOpen(true);
  }

  async function createInlineClient() {
    const fullName = [newClientDraft.firstName, newClientDraft.lastName].map((item) => item.trim()).filter(Boolean).join(" ");
    const client = await onCreateClientFromVisit({
      fullName,
      phone: newClientDraft.phone.trim(),
      email: "",
    });
    if (client) setDraftClient(client);
  }

  function updateVisitItem(index: number, patch: Partial<VisitServiceDraft>) {
    const draftItems = Array.isArray(visitDraft.items) && visitDraft.items.length ? visitDraft.items : [createVisitServiceDraft(visitDraft.startTime || "09:00")];
    setVisitDraft({
      ...visitDraft,
      items: draftItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        if (patch.startTime && !patch.endTime && timeToMinutes(safeText(next.endTime)) <= timeToMinutes(patch.startTime)) {
          next.endTime = addMinutes(patch.startTime, next.durationMinutes || 15);
        }
        return next;
      }),
    });
  }

  function selectVisitService(service: ServiceRecord) {
    const duration = Math.max(5, service.durationMinutes || 60);
    const draftItems = Array.isArray(visitDraft.items) ? visitDraft.items : [];
    const currentItem = draftItems[editingServiceIndex] || createVisitServiceDraft(visitDraft.startTime || "09:00");
    updateVisitItem(editingServiceIndex, {
      serviceId: service.id,
      serviceName: service.name,
      priceAmount: Number(service.price || 0),
      durationMinutes: duration,
      endTime: addMinutes(currentItem.startTime, duration),
    });
    setServiceQuery("");
    setVisitPickerMode(null);
  }

  function addAnotherService() {
    const draftItems = Array.isArray(visitDraft.items) && visitDraft.items.length ? visitDraft.items : [createVisitServiceDraft(visitDraft.startTime || "09:00")];
    const lastItem = draftItems[draftItems.length - 1];
    const nextStart = lastItem?.endTime || visitDraft.startTime || "09:00";
    setVisitDraft({
      ...visitDraft,
      items: [...draftItems, createVisitServiceDraft(nextStart)],
    });
  }

  function removeVisitService(index: number) {
    const draftItems = Array.isArray(visitDraft.items) ? visitDraft.items : [];
    if (draftItems.length <= 1) return;
    setVisitDraft({
      ...visitDraft,
      items: draftItems.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  function openComposerAt(time: string, date = selectedDate, targetProfessionalId = primaryMember?.id) {
    setEditingAppointment(null);
    setSelectedDate(date);
    setVisitDraft({ ...createDefaultVisitDraft(date, time), targetProfessionalId });
    setComposerOpen(true);
  }

  function openAppointmentEditor(appointment: AppointmentRecord) {
    const matchedService = services.find((service) => service.name === appointment.serviceName) || services[0];
    const matchedClient = clients.find((client) => {
      const samePhone = appointment.customerPhone && client.phone === appointment.customerPhone;
      const sameName = appointment.customerName && client.fullName === appointment.customerName;
      return samePhone || sameName;
    });
    setEditingAppointment(appointment);
    setSelectedDate(appointment.appointmentDate || selectedDate);
    setVisitDraft({
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      startTime: appointment.startTime,
      serviceId: matchedService?.id || "",
      appointmentDate: appointment.appointmentDate || selectedDate,
      targetProfessionalId: appointment.professionalId || primaryMember?.id,
      selectedClientId: matchedClient?.id,
      items: [
        {
          id: appointment.id,
          serviceId: matchedService?.id || "",
          serviceName: appointment.serviceName,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          priceAmount: Number(appointment.priceAmount || matchedService?.price || 0),
          durationMinutes: Math.max(5, timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)),
        },
      ],
    });
    setComposerOpen(true);
  }

  function openBlockedTimeComposer(action: { date: string; time: string; targetProfessionalId?: string }, label: string, title: string) {
    setBlockedTimeDraft({
      date: action.date,
      startTime: action.time,
      endTime: addMinutes(action.time, 60),
      targetProfessionalId: action.targetProfessionalId,
      label,
      title,
    });
  }

  function openBlockedAppointmentEditor(appointment: AppointmentRecord) {
    setBlockedTimeDraft({
      date: appointment.appointmentDate || selectedDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      targetProfessionalId: appointment.professionalId,
      label: appointment.serviceName || t.unavailableTime,
      title: appointment.serviceName || t.unavailableTime,
      appointment,
    });
  }

  async function saveBlockedTimeDraft() {
    if (!blockedTimeDraft) return;
    const startTime = blockedTimeDraft.startTime.trim();
    const endTime = blockedTimeDraft.endTime.trim();
    if (!isValidTime(startTime) || !isValidTime(endTime) || timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }
    const saved = blockedTimeDraft.appointment
      ? await onUpdateBlockedTime(blockedTimeDraft.appointment, startTime, endTime)
      : (await onCreateBlockedTime(blockedTimeDraft.date, startTime, endTime, blockedTimeDraft.label, blockedTimeDraft.targetProfessionalId), true);
    if (saved) setBlockedTimeDraft(null);
  }

  function chooseDate(date: string, nextMode: CalendarViewMode = viewMode) {
    setSelectedDate(date);
    if (nextMode !== viewMode) setViewMode(nextMode);
  }

  return (
    <View style={styles.calendarScreen}>
      <View style={styles.calendarToolbar}>
        <Pressable style={styles.dateButton} onPress={() => setSelectedDate(shiftCalendarDate(viewMode, selectedDate, -1))}>
          <Ionicons name="chevron-back" size={18} color="#0F172A" />
        </Pressable>
        <View style={styles.datePill}>
          <Text style={styles.dateText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>
            {titleText}
          </Text>
          <Text style={styles.dateSubText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>
            {viewMode === "day" ? getWorkTimeLabel(selectedSchedule, t) : t.selected}
          </Text>
        </View>
        <Pressable style={styles.dateButton} onPress={() => setSelectedDate(shiftCalendarDate(viewMode, selectedDate, 1))}>
          <Ionicons name="chevron-forward" size={18} color="#0F172A" />
        </Pressable>
        <View style={styles.toolbarSpacer} />
        <Pressable
          style={styles.modeButton}
          onPress={() => setIsCompact((current) => !current)}
        >
          <Text style={styles.modeButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.66}>
            {isCompact ? t.detailed : t.compact}
          </Text>
        </Pressable>
        <Pressable style={styles.modeButton} onPress={() => setViewMenuOpen(true)}>
          <Text style={styles.modeButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.66}>
            {activeViewLabel}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#475569" />
        </Pressable>
      </View>

      {viewMode === "day" ? (
        <>
          <ScrollView
            horizontal
            style={styles.teamCalendarHorizontal}
            contentContainerStyle={styles.teamCalendarHorizontalContent}
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.teamCalendarBoard}>
              <View style={styles.teamCalendarHeaderRow}>
                <View style={styles.teamPickerRail}>
                  <Pressable style={styles.teamPickerButton} onPress={() => setMemberPickerOpen(true)}>
                    <Ionicons name="people-outline" size={19} color="#0F172A" />
                    {calendarMembers.length > 1 ? (
                      <View style={styles.teamPickerBadge}>
                        <Text style={styles.teamPickerBadgeText}>{selectedMembers.length || 1}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                </View>
                {visibleCalendarMembers.map((member) => {
                  return (
                    <View key={member.id} style={[styles.teamDayHeader, { width: dayMemberColumnWidth }]}>
                      <MemberAvatar member={member} size={34} />
                      <Text style={styles.masterName} numberOfLines={1}>{member.name}</Text>
                    </View>
                  );
                })}
              </View>
              <ScrollView
                style={styles.calendarScroll}
                contentContainerStyle={styles.calendarContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
                showsVerticalScrollIndicator
                alwaysBounceVertical
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.teamCalendarBodyRow}>
                  <CalendarTimeAxis date={selectedDate} compact={isCompact} schedule={selectedSchedule} />
                  {visibleCalendarMembers.map((member) => {
                    const memberAppointments = getAppointmentsForMember(selectedDate, member.id);
                    const memberSchedule = getScheduleForMember(selectedDate, member);
                    return (
                      <View key={member.id} style={[styles.teamDayColumn, { width: dayMemberColumnWidth }]}>
                        <CalendarTimeline
                          date={selectedDate}
                          appointments={memberAppointments}
                          currency={currency}
                          compact={isCompact}
                          schedule={memberSchedule}
                          t={t}
                          columnWidth={dayMemberColumnWidth}
                          showTimeColumn={false}
                          onTimePress={(time) => setTimeAction({ date: selectedDate, time, targetProfessionalId: member.id })}
                          onAppointmentPress={openAppointmentEditor}
                          onBlockedAppointmentPress={openBlockedAppointmentEditor}
                          onAppointmentDelete={onDeleteAppointment}
                          onAppointmentMove={onMoveAppointment}
                          onAppointmentResize={onResizeAppointment}
                        />
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </>
      ) : (
        <CalendarOverview
          t={t}
          language={language}
          mode={viewMode}
          selectedDate={selectedDate}
          dates={visibleDates}
          currency={currency}
          workspace={workspace}
          members={selectedMembers.length ? selectedMembers : calendarMembers.slice(0, 1)}
          getAppointmentsForDate={getAppointmentsForDate}
          getAppointmentsForMember={getAppointmentsForMember}
          getScheduleForMember={getScheduleForMember}
          onSelectDate={(date) => chooseDate(date, viewMode)}
          onOpenDay={(date) => chooseDate(date, "day")}
          onCreateAt={(date, memberId) => openComposerAt("09:00", date, memberId)}
        />
      )}

      <Pressable
        style={styles.fabButton}
        onPress={() => {
          setEditingAppointment(null);
          setVisitDraft({ ...createDefaultVisitDraft(selectedDate, getRoundedTime(10)), targetProfessionalId: primaryMember?.id });
          setComposerOpen(true);
        }}
      >
        <Ionicons name="add" size={34} color="#FFFFFF" />
      </Pressable>

      <Modal transparent visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.visitSheet, styles.visitEditorSheet]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {visitPickerMode === "client" ? t.chooseClient : visitPickerMode === "service" ? t.chooseService : editingAppointment ? t.editVisit : t.newVisit}
              </Text>
              <Pressable
                style={styles.sheetClose}
                onPress={() => {
                  if (visitPickerMode) {
                    setVisitPickerMode(null);
                    return;
                  }
                  setComposerOpen(false);
                  setEditingAppointment(null);
                }}
              >
                <Ionicons name={visitPickerMode ? "chevron-back" : "close"} size={22} color="#0F172A" />
              </Pressable>
            </View>
            {visitPickerMode === "client" ? (
              <>
                <SearchInput value={clientQuery} onChangeText={setClientQuery} placeholder={t.clientNameOrPhone} />
                <Pressable style={styles.clientOptionCard} onPress={() => setDraftClient(null)}>
                  <View style={styles.clientAvatar}>
                    <Ionicons name="person-outline" size={18} color="#6D4AFF" />
                  </View>
                  <View style={styles.clientOptionText}>
                    <Text style={styles.clientOptionTitle}>{t.quickBookingWithoutClient}</Text>
                    <Text style={styles.clientOptionCaption}>{t.chooseClientLater}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </Pressable>
                <Pressable
                  style={[styles.clientOptionCard, clientCreateOpen && styles.clientOptionCardActive]}
                  onPress={() => {
                    if (clientCreateOpen) {
                      setClientCreateOpen(false);
                      return;
                    }
                    openInlineClientForm();
                  }}
                >
                  <View style={styles.clientAvatar}>
                    <Ionicons name={clientCreateOpen ? "chevron-up" : "add"} size={20} color="#6D4AFF" />
                  </View>
                  <View style={styles.clientOptionText}>
                    <Text style={styles.clientOptionTitle}>{t.addNewClient}</Text>
                    <Text style={styles.clientOptionCaption}>{clientCreateOpen ? t.formOpened : t.clientNameOrPhone}</Text>
                  </View>
                  <Ionicons name={clientCreateOpen ? "chevron-up" : "chevron-forward"} size={18} color="#94A3B8" />
                </Pressable>
                {showCreateFromSearch ? (
                  <Pressable style={styles.clientCreateSuggestion} onPress={() => openInlineClientForm(clientQuery)}>
                    <Ionicons name="search" size={17} color="#6D4AFF" />
                    <View style={styles.clientOptionText}>
                      <Text style={styles.clientOptionTitle}>{t.createClientFromSearch}: {clientQuery.trim()}</Text>
                      <Text style={styles.clientOptionCaption}>{t.noClientFound}</Text>
                    </View>
                  </Pressable>
                ) : null}
                {clientCreateOpen ? (
                  <View style={styles.inlineClientForm}>
                    <View>
                      <Text style={styles.inlineClientFormTitle}>{t.newClientFormTitle}</Text>
                      <Text style={styles.inlineClientFormHint}>{t.newClientFormHint}</Text>
                    </View>
                    <InlineClientInput label={t.firstName} value={newClientDraft.firstName} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, firstName: value })} />
                    <InlineClientInput label={t.lastName} value={newClientDraft.lastName} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, lastName: value })} />
                    <InlineClientInput label={t.phone} value={newClientDraft.phone} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, phone: value })} keyboardType="phone-pad" />
                    <PrimaryButton label={t.addAndSelectClient} onPress={() => void createInlineClient()} disabled={busy} />
                  </View>
                ) : null}
                <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
                  {filteredClients.map((client) => (
                    <Pressable key={client.id} style={styles.clientOptionCard} onPress={() => setDraftClient(client)}>
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>{(client.fullName || client.phone || "C").slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <View style={styles.clientOptionText}>
                        <Text style={styles.clientOptionTitle}>{client.fullName || client.phone}</Text>
                        <Text style={styles.clientOptionCaption}>{client.phone || client.email || t.clients}</Text>
                      </View>
                    </Pressable>
                  ))}
                  {!filteredClients.length && hasClientSearch ? <Text style={styles.emptyText}>{t.noClientFound}</Text> : null}
                </ScrollView>
              </>
            ) : visitPickerMode === "service" ? (
              <>
                <SearchInput value={serviceQuery} onChangeText={setServiceQuery} placeholder={t.searchService} />
                <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
                  {filteredServices.map((service) => (
                    <Pressable key={service.id} style={styles.serviceOptionCard} onPress={() => selectVisitService(service)}>
                      <View style={[styles.serviceTone, { backgroundColor: service.color || "#6D4AFF" }]} />
                      <View style={styles.clientOptionText}>
                        <Text style={styles.clientOptionTitle}>{service.name}</Text>
                        <Text style={styles.clientOptionCaption}>{service.durationMinutes || 60} {t.duration}</Text>
                      </View>
                      <Text style={styles.serviceOptionPrice}>{formatMoney(service.price, currency)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <ScrollView style={styles.visitEditorScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Pressable style={styles.visitClientCard} onPress={() => setVisitPickerMode("client")}>
                    <View style={styles.clientAvatarLarge}>
                      <Text style={styles.clientAvatarLargeText}>{selectedClient ? (selectedClient.fullName || "C").slice(0, 1).toUpperCase() : "○"}</Text>
                    </View>
                    <View style={styles.clientOptionText}>
                      <Text style={styles.visitCardEyebrow}>{t.customer}</Text>
                      <Text style={styles.visitClientTitle}>{selectedClient ? selectedClient.fullName : visitDraft.customerName || t.quickBookingWithoutClient}</Text>
                      <Text style={styles.clientOptionCaption}>{visitDraft.customerPhone || t.chooseClientLater}</Text>
                    </View>
                    <Ionicons name="add" size={18} color="#6D4AFF" />
                  </Pressable>

                  <View style={styles.visitSectionHeader}>
                    <Text style={styles.visitSectionTitle}>{t.visitTab || t.newVisit}</Text>
                    <Text style={styles.visitSectionDate}>{formatDayLabel(visitDraft.appointmentDate || selectedDate, language)}</Text>
                  </View>

                  {draftVisitItems.map((item, index) => (
                    <View key={item.id} style={styles.visitServiceCard}>
                      <View style={styles.visitServiceCardHeader}>
                        <Pressable
                          style={styles.visitServicePickerButton}
                          onPress={() => {
                            setEditingServiceIndex(index);
                            setVisitPickerMode("service");
                          }}
                        >
                          <Text style={[styles.visitServicePickerText, !item.serviceName && styles.mutedText]} numberOfLines={1}>
                            {item.serviceName || t.chooseService} →
                          </Text>
                        </Pressable>
                        {draftVisitItems.length > 1 ? (
                          <Pressable style={styles.smallIconButton} onPress={() => removeVisitService(index)}>
                            <Ionicons name="trash-outline" size={18} color="#DC2626" />
                          </Pressable>
                        ) : null}
                      </View>
                      <View style={styles.twoColumns}>
                        <Field label={t.start} value={item.startTime} onChangeText={(value) => updateVisitItem(index, { startTime: value })} keyboardType="numbers-and-punctuation" placeholder="09:00" />
                        <Field label={t.end} value={item.endTime} onChangeText={(value) => updateVisitItem(index, { endTime: value })} keyboardType="numbers-and-punctuation" placeholder="10:00" />
                      </View>
                      <View style={styles.visitServiceMeta}>
                        <Text style={styles.clientOptionCaption}>{item.serviceName || t.withoutService}</Text>
                        <Text style={styles.visitServicePrice}>{formatMoney(item.priceAmount, currency)}</Text>
                      </View>
                    </View>
                  ))}
                  <Pressable style={styles.addAnotherServiceButton} onPress={addAnotherService}>
                    <Text style={styles.addAnotherServiceText}>{t.addAnotherService}</Text>
                  </Pressable>
                </ScrollView>
                <View style={styles.visitTotals}>
                  <Text style={styles.clientOptionCaption}>{t.total}</Text>
                  <Text style={styles.visitTotalValue}>{formatMoney(visitTotal, currency)}</Text>
                  <Text style={styles.clientOptionCaption}>{t.payable}</Text>
                  <Text style={styles.visitTotalValue}>{formatMoney(visitTotal, currency)}</Text>
                </View>
                <PrimaryButton
                  label={editingAppointment ? t.save : t.saveVisit}
                  onPress={async () => {
                    const saved = editingAppointment ? await onUpdateVisit() : await onCreateVisit();
                    if (saved) {
                      setComposerOpen(false);
                      setEditingAppointment(null);
                    }
                  }}
                  disabled={busy || !services.length}
                />
                {editingAppointment ? (
                  <Pressable
                    style={[styles.secondaryButton, styles.dangerButton, busy && styles.disabled]}
                    disabled={busy}
                    onPress={() => {
                      setComposerOpen(false);
                      onDeleteAppointment(editingAppointment);
                    }}
                  >
                    <Text style={styles.dangerButtonText}>{t.delete}</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={memberPickerOpen} animationType="fade" onRequestClose={() => setMemberPickerOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMemberPickerOpen(false)}>
          <Pressable style={styles.teamPickerMenu} onPress={(event) => event.stopPropagation()}>
            <SearchInput value={memberQuery} onChangeText={setMemberQuery} placeholder={t.search} />
            <Text style={styles.teamPickerSectionTitle}>{t.teamMembers}</Text>
            {calendarMembers.length > 1 ? (
              <Pressable style={[styles.teamPickerOption, selectedMemberIds.length === calendarMembers.length && styles.teamPickerOptionActive]} onPress={selectAllMembers}>
                <View style={[styles.teamCheckBox, selectedMemberIds.length === calendarMembers.length && styles.teamCheckBoxActive]}>
                  {selectedMemberIds.length === calendarMembers.length ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                </View>
                <View style={styles.clientOptionText}>
                  <Text style={styles.clientOptionTitle}>{t.allTeam}</Text>
                  <Text style={styles.clientOptionCaption}>{t.showWholeTeam}</Text>
                </View>
              </Pressable>
            ) : null}
            <Text style={styles.teamPickerSectionTitle}>{t.selectedMasters}</Text>
            <ScrollView style={styles.teamPickerList} showsVerticalScrollIndicator={false}>
              {filteredMembers.map((member) => {
                const active = selectedMemberIds.includes(member.id);
                return (
                  <Pressable key={member.id} style={[styles.teamPickerOption, active && styles.teamPickerOptionActive]} onPress={() => toggleMember(member.id)}>
                    <View style={[styles.teamCheckBox, active && styles.teamCheckBoxActive]}>
                      {active ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                    </View>
                    <MemberAvatar member={member} size={34} />
                    <View style={styles.clientOptionText}>
                      <Text style={[styles.clientOptionTitle, active && styles.teamPickerOptionTitleActive]}>{member.name}</Text>
                      <Text style={styles.clientOptionCaption}>{member.scope === "owner" ? t.owner : member.role || t.employee}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={viewMenuOpen} animationType="fade" onRequestClose={() => setViewMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setViewMenuOpen(false)}>
          <View style={styles.viewMenu}>
            {viewOptions.map((option) => {
              const active = option.value === viewMode;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.viewMenuItem, active && styles.viewMenuItemActive]}
                  onPress={() => {
                    setViewMode(option.value);
                    setViewMenuOpen(false);
                  }}
                >
                  <Text style={[styles.viewMenuText, active && styles.viewMenuTextActive]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color="#7C3AED" /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(timeAction)} animationType="fade" onRequestClose={() => setTimeAction(null)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setTimeAction(null)}>
          <View style={styles.timeActionMenu}>
            <Text style={styles.timeActionTitle}>{timeAction?.time}</Text>
            <Pressable
              style={styles.timeActionItem}
              onPress={() => {
                if (!timeAction) return;
                const action = timeAction;
                setTimeAction(null);
                openComposerAt(action.time, action.date, action.targetProfessionalId);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#0F172A" />
              <Text style={styles.timeActionText}>{t.newVisit}</Text>
            </Pressable>
            <Pressable
              style={styles.timeActionItem}
              onPress={() => {
                if (!timeAction) return;
                const action = timeAction;
                setTimeAction(null);
                openBlockedTimeComposer(action, t.reservedTime, t.reservedTime);
              }}
            >
              <Ionicons name="time-outline" size={20} color="#0F172A" />
              <Text style={styles.timeActionText}>{t.bookTime}</Text>
            </Pressable>
            <Pressable
              style={styles.timeActionItem}
              onPress={() => {
                if (!timeAction) return;
                const action = timeAction;
                setTimeAction(null);
                openBlockedTimeComposer(action, t.unavailableTime, t.unavailableTime);
              }}
            >
              <Ionicons name="ban-outline" size={20} color="#0F172A" />
              <Text style={styles.timeActionText}>{t.addBlockedTime}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal transparent visible={Boolean(blockedTimeDraft)} animationType="slide" onRequestClose={() => setBlockedTimeDraft(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.visitSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{blockedTimeDraft?.title || t.unavailableTime}</Text>
              <Pressable style={styles.sheetClose} onPress={() => setBlockedTimeDraft(null)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </Pressable>
            </View>
            <View style={styles.blockedTimeSummary}>
              <Ionicons name="time-outline" size={18} color="#6D4AFF" />
              <Text style={styles.blockedTimeSummaryText}>
                {blockedTimeDraft ? formatDayLabel(blockedTimeDraft.date, language) : ""}
              </Text>
            </View>
            <View style={styles.twoColumns}>
              <Field
                label={t.start}
                value={blockedTimeDraft?.startTime || ""}
                onChangeText={(value) => setBlockedTimeDraft((current) => (current ? { ...current, startTime: value } : current))}
                keyboardType="numbers-and-punctuation"
                placeholder="09:00"
              />
              <Field
                label={t.end}
                value={blockedTimeDraft?.endTime || ""}
                onChangeText={(value) => setBlockedTimeDraft((current) => (current ? { ...current, endTime: value } : current))}
                keyboardType="numbers-and-punctuation"
                placeholder="10:00"
              />
            </View>
            <PrimaryButton label={t.save} onPress={saveBlockedTimeDraft} disabled={busy} />
            {blockedTimeDraft?.appointment ? (
              <Pressable
                style={[styles.secondaryButton, styles.dangerButton, busy && styles.disabled]}
                disabled={busy}
                onPress={() => {
                  const appointment = blockedTimeDraft.appointment;
                  setBlockedTimeDraft(null);
                  if (appointment) onDeleteAppointment(appointment);
                }}
              >
                <Text style={styles.dangerButtonText}>{t.delete}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MemberAvatar({ member, size = 34 }: { member: CalendarMemberView; size?: number }) {
  const initials = member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("") || "T";
  return (
    <View style={[styles.masterAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {member.avatarUrl ? (
        <Image source={{ uri: member.avatarUrl }} style={[styles.memberAvatarImage, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.masterAvatarText, { fontSize: Math.max(12, size / 2.2) }]}>{initials}</Text>
      )}
    </View>
  );
}

function CalendarTimeAxis({ date, compact, schedule }: { date: string; compact: boolean; schedule: WorkDayScheduleRecord }) {
  const startHour = 0;
  const endHour = 23;
  const workStart = schedule.enabled ? timeToMinutes(schedule.startTime) : 9 * 60;
  const workEnd = schedule.enabled ? timeToMinutes(schedule.endTime) : 18 * 60;
  const workHourHeight = compact ? 72 : 88;
  const offHourHeight = compact ? workHourHeight / 10 : workHourHeight;
  const breakHourHeight = compact ? workHourHeight / 2.5 : workHourHeight;
  const breaks = schedule.enabled ? schedule.breaks || [] : [];
  const compactBreaks = breaks
    .map((item) => ({
      start: Math.max(workStart, Math.min(workEnd, timeToMinutes(item.startTime))),
      end: Math.max(workStart, Math.min(workEnd, timeToMinutes(item.endTime))),
    }))
    .filter((item) => item.end > item.start)
    .sort((left, right) => left.start - right.start);
  const compactSegments = (() => {
    if (!compact || !schedule.enabled) return [];
    const segments: Array<{ start: number; end: number; height: number }> = [];
    const pushSegment = (start: number, end: number, height: number) => {
      if (end > start) segments.push({ start, end, height });
    };
    let cursor = 0;
    pushSegment(cursor, workStart, offHourHeight);
    cursor = workStart;
    for (const item of compactBreaks) {
      pushSegment(cursor, item.start, workHourHeight);
      pushSegment(item.start, item.end, breakHourHeight);
      cursor = Math.max(cursor, item.end);
    }
    pushSegment(cursor, workEnd, workHourHeight);
    pushSegment(workEnd, 24 * 60, offHourHeight);
    return segments;
  })();

  function getScaledMinuteTop(minutes: number) {
    const safe = Math.max(0, Math.min(24 * 60, minutes));
    if (!compact) return (safe / 60) * workHourHeight;
    if (!schedule.enabled) return (safe / 60) * offHourHeight;
    let top = 0;
    for (const segment of compactSegments) {
      if (safe >= segment.end) {
        top += ((segment.end - segment.start) / 60) * segment.height;
      } else if (safe > segment.start) {
        top += ((safe - segment.start) / 60) * segment.height;
        break;
      } else {
        break;
      }
    }
    return top;
  }

  function getRangeHeight(start: number, end: number) {
    return Math.max(1, getScaledMinuteTop(end) - getScaledMinuteTop(start));
  }

  const timelineHeight = getScaledMinuteTop(24 * 60);
  const now = new Date();
  const nowTop = getScaledMinuteTop(now.getHours() * 60 + now.getMinutes());
  const showCurrentTime = date === getTodayIso();

  return (
    <View style={[styles.timeAxisColumn, { height: timelineHeight }]}>
      {Array.from({ length: endHour - startHour + 1 }).map((_, index) => {
        const hour = startHour + index;
        const rowStart = hour * 60;
        const rowEnd = (hour + 1) * 60;
        const top = getScaledMinuteTop(rowStart);
        const height = getRangeHeight(rowStart, rowEnd);
        const showLabel = height >= 18 || hour === Math.floor(workStart / 60);
        return (
          <View key={hour} pointerEvents="none" style={[styles.timeAxisHour, { top, height }]}>
            <Text style={[styles.hourText, !showLabel && styles.hourTextHidden]}>{showLabel ? `${String(hour).padStart(2, "0")}:00` : ""}</Text>
          </View>
        );
      })}
      {showCurrentTime && nowTop >= 0 && nowTop <= timelineHeight ? (
        <View pointerEvents="none" style={[styles.timeAxisCurrentDot, { top: nowTop - 5 }]} />
      ) : null}
    </View>
  );
}

function CalendarOverview({
  t,
  language,
  mode,
  selectedDate,
  dates,
  currency,
  workspace,
  members,
  getAppointmentsForDate,
  getAppointmentsForMember,
  getScheduleForMember,
  onSelectDate,
  onOpenDay,
  onCreateAt,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  mode: CalendarViewMode;
  selectedDate: string;
  dates: string[];
  currency?: string;
  workspace: WorkspaceSnapshot | null;
  members: CalendarMemberView[];
  getAppointmentsForDate: (date: string) => AppointmentRecord[];
  getAppointmentsForMember: (date: string, memberId: string) => AppointmentRecord[];
  getScheduleForMember: (date: string, member: CalendarMemberView | null) => WorkDayScheduleRecord;
  onSelectDate: (date: string) => void;
  onOpenDay: (date: string) => void;
  onCreateAt: (date: string, memberId?: string) => void;
}) {
  if (mode === "month") {
    return (
      <ScrollView style={styles.overviewScroll} contentContainerStyle={styles.monthGrid} showsVerticalScrollIndicator={false}>
        {dates.map((date) => {
          const appointments = members.length ? members.flatMap((member) => getAppointmentsForMember(date, member.id)) : getAppointmentsForDate(date);
          const schedule = getScheduleForDate(workspace, date);
          const workParts = getWorkTimeParts(schedule);
          const selected = date === selectedDate;
          const muted = !isSameMonth(date, selectedDate);
          const closed = !schedule.enabled;
          return (
            <Pressable
              key={date}
              style={[styles.monthCell, closed && styles.summaryCardClosed, selected && styles.monthCellActive, muted && styles.monthCellMuted]}
              onPress={() => onOpenDay(date)}
            >
              <View style={styles.monthCellTop}>
                <Text style={[styles.monthDayNumber, selected && styles.summaryDateActive, closed && styles.summaryClosedText, muted && styles.mutedText]}>
                  {Number(date.slice(-2))}
                </Text>
                {appointments.length ? (
                  <View style={styles.dayCountBadge}>
                    <Text style={styles.dayCountBadgeText}>{appointments.length}</Text>
                  </View>
                ) : null}
              </View>
              {closed ? (
                <View style={styles.closedBadge}>
                  <Ionicons name="moon-outline" size={12} color="#64748B" />
                  <Text style={styles.closedBadgeText}>{getClosedShortLabel(language)}</Text>
                </View>
              ) : (
                <View style={styles.compactWorkTime}>
                  <Text style={[styles.monthWorkText, muted && styles.mutedText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                    {workParts.start}
                  </Text>
                  <Text style={[styles.monthWorkText, muted && styles.mutedText]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                    {workParts.end}
                  </Text>
                </View>
              )}
              <View style={styles.visitMiniLine}>
                <Ionicons name="people-outline" size={12} color={appointments.length ? "#6D4AFF" : "#94A3B8"} />
                <Text style={[styles.visitMiniText, appointments.length ? styles.visitMiniTextActive : null]}>{appointments.length}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  const dayColumnWidth = mode === "threeDays" ? 102 : 92;
  const memberRowHeight = 122;

  return (
    <ScrollView
      style={styles.overviewScroll}
      horizontal
      contentContainerStyle={styles.teamOverviewContent}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.teamOverviewGrid}>
        <View style={styles.teamOverviewHeaderRow}>
          <View style={styles.teamOverviewMemberHeader} />
          {dates.map((date) => {
            const selected = date === selectedDate;
            return (
              <Pressable
                key={date}
                style={[styles.teamOverviewDateHeader, { width: dayColumnWidth }, selected && styles.teamOverviewDateHeaderActive]}
                onPress={() => onSelectDate(date)}
              >
                <Text style={[styles.teamOverviewDateNumber, selected && styles.summaryDateActive]}>{Number(date.slice(8, 10))}</Text>
                <Text style={styles.teamOverviewDateWeekday}>{formatShortDate(date, language).split(" ").slice(-1)[0]}</Text>
              </Pressable>
            );
          })}
        </View>
        {(members.length ? members : []).map((member) => (
          <View key={member.id} style={[styles.teamOverviewRow, { minHeight: memberRowHeight }]}>
            <Pressable style={styles.teamOverviewMemberCell} onPress={() => onOpenDay(selectedDate)}>
              <MemberAvatar member={member} size={38} />
              <Text style={styles.teamOverviewMemberName} numberOfLines={2}>{member.name}</Text>
            </Pressable>
            {dates.map((date) => {
              const appointments = getAppointmentsForMember(date, member.id);
              const schedule = getScheduleForMember(date, member);
              const selected = date === selectedDate;
              return (
                <Pressable
                  key={`${member.id}-${date}`}
                  style={[styles.teamOverviewDayCell, { width: dayColumnWidth, minHeight: memberRowHeight }, !schedule.enabled && styles.summaryCardClosed, selected && styles.teamOverviewDayCellActive]}
                  onPress={() => onOpenDay(date)}
                  onLongPress={() => onCreateAt(date, member.id)}
                >
                  {appointments.slice(0, 3).map((appointment, index) => (
                    <View key={appointment.id} style={[styles.teamOverviewAppointmentBar, { backgroundColor: index % 3 === 0 ? "#8DD8C7" : index % 3 === 1 ? "#FF9A82" : "#9ED96B" }]}>
                      <Text style={styles.teamOverviewAppointmentText}>{appointment.startTime}</Text>
                    </View>
                  ))}
                  {appointments.length > 3 ? <Text style={styles.teamOverviewMoreText}>+{appointments.length - 3}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function CalendarTimeline({
  date,
  appointments,
  currency,
  compact,
  schedule,
  t,
  onTimePress,
  onAppointmentPress,
  onBlockedAppointmentPress,
  onAppointmentDelete,
  onAppointmentMove,
  onAppointmentResize,
  columnWidth,
  showTimeColumn = true,
}: {
  date: string;
  appointments: AppointmentRecord[];
  currency?: string;
  compact: boolean;
  schedule: WorkDayScheduleRecord;
  t: Record<string, string>;
  onTimePress: (time: string) => void;
  onAppointmentPress: (appointment: AppointmentRecord) => void;
  onBlockedAppointmentPress: (appointment: AppointmentRecord) => void;
  onAppointmentDelete: (appointment: AppointmentRecord) => void;
  onAppointmentMove: (appointment: AppointmentRecord) => void;
  onAppointmentResize: (appointment: AppointmentRecord) => void;
  columnWidth?: number;
  showTimeColumn?: boolean;
}) {
  const { width } = useWindowDimensions();
  const startHour = 0;
  const endHour = 23;
  const workStart = schedule.enabled ? timeToMinutes(schedule.startTime) : 9 * 60;
  const workEnd = schedule.enabled ? timeToMinutes(schedule.endTime) : 18 * 60;
  const workHourHeight = compact ? 72 : 88;
  const offHourHeight = compact ? workHourHeight / 10 : workHourHeight;
  const breakHourHeight = compact ? workHourHeight / 2.5 : workHourHeight;
  const timeColumnWidth = showTimeColumn ? 43 : 0;
  const effectiveWidth = columnWidth || width;
  const gridWidth = Math.max(140, effectiveWidth - timeColumnWidth);
  const laneGap = 0;
  const appointmentMinHeight = 68;
  const appointmentMinVisibleMinutes = Math.ceil((appointmentMinHeight / workHourHeight) * 60);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showCurrentTime = date === getTodayIso();
  const breaks = schedule.enabled ? schedule.breaks || [] : [];
  const compactBreaks = breaks
    .map((item) => ({
      start: Math.max(workStart, Math.min(workEnd, timeToMinutes(item.startTime))),
      end: Math.max(workStart, Math.min(workEnd, timeToMinutes(item.endTime))),
      label: `${item.startTime} - ${item.endTime}`,
    }))
    .filter((item) => item.end > item.start)
    .sort((left, right) => left.start - right.start);
  const compactSegments = (() => {
    if (!compact || !schedule.enabled) return [];
    const segments: Array<{ start: number; end: number; height: number }> = [];
    const pushSegment = (start: number, end: number, height: number) => {
      if (end > start) segments.push({ start, end, height });
    };
    let cursor = 0;
    pushSegment(cursor, workStart, offHourHeight);
    cursor = workStart;
    for (const item of compactBreaks) {
      pushSegment(cursor, item.start, workHourHeight);
      pushSegment(item.start, item.end, breakHourHeight);
      cursor = Math.max(cursor, item.end);
    }
    pushSegment(cursor, workEnd, workHourHeight);
    pushSegment(workEnd, 24 * 60, offHourHeight);
    return segments;
  })();
  const timelineHeight = getScaledMinuteTop(24 * 60);
  const nowTop = getScaledMinuteTop(nowMinutes);
  const closedRanges = schedule.enabled
    ? [
        { start: 0, end: workStart, label: "00:00 - " + schedule.startTime, kind: "off" },
        ...compactBreaks.map((item) => ({
          start: item.start,
          end: item.end,
          label: item.label,
          kind: "break",
        })),
        { start: workEnd, end: 24 * 60, label: `${schedule.endTime} - 24:00`, kind: "off" },
      ].filter((item) => item.end > item.start)
    : [{ start: 0, end: 24 * 60, label: t.closedBySchedule, kind: "closed" }];
  const blockedAppointments = appointments
    .filter((appointment) => appointment.kind === "blocked")
    .map((appointment) => ({
      appointment,
      start: timeToMinutes(appointment.startTime),
      end: Math.max(timeToMinutes(appointment.endTime), timeToMinutes(appointment.startTime) + 10),
      label: appointment.serviceName || t.closedBySchedule,
    }));
  const regularAppointments = appointments.filter((appointment) => appointment.kind !== "blocked");
  const appointmentLayouts = regularAppointments.map((appointment) => {
    const start = timeToMinutes(appointment.startTime);
    const end = Math.max(timeToMinutes(appointment.endTime), start + 5);
    const overlapping = regularAppointments
      .filter((item) => {
        const itemStart = timeToMinutes(item.startTime);
        const itemEnd = Math.max(timeToMinutes(item.endTime), itemStart + 5);
        return start < itemEnd && end > itemStart;
      })
      .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime) || left.id.localeCompare(right.id));
    const laneCount = Math.max(1, overlapping.length);
    const laneIndex = Math.max(0, overlapping.findIndex((item) => item.id === appointment.id));
    return { appointment, start, end, laneCount, laneIndex };
  });

  function getScaledMinuteTop(minutes: number) {
    const safe = Math.max(0, Math.min(24 * 60, minutes));
    if (!compact) return (safe / 60) * workHourHeight;
    if (!schedule.enabled) return (safe / 60) * offHourHeight;
    let top = 0;
    for (const segment of compactSegments) {
      if (safe >= segment.end) {
        top += ((segment.end - segment.start) / 60) * segment.height;
      } else if (safe > segment.start) {
        top += ((safe - segment.start) / 60) * segment.height;
        break;
      } else {
        break;
      }
    }
    return top;
  }

  function getRangeHeight(start: number, end: number) {
    return Math.max(1, getScaledMinuteTop(end) - getScaledMinuteTop(start));
  }

  function isWorkingSlot(minutes: number) {
    if (!schedule.enabled || minutes < workStart || minutes >= workEnd) return false;
    return !breaks.some((item) => {
      const start = timeToMinutes(item.startTime);
      const end = timeToMinutes(item.endTime);
      return minutes >= start && minutes < end;
    });
  }

  return (
    <View style={[styles.timeline, { height: timelineHeight, width: effectiveWidth }]}>
      {Array.from({ length: endHour - startHour + 1 }).map((_, index) => {
        const hour = startHour + index;
        const rowStart = hour * 60;
        const rowEnd = (hour + 1) * 60;
        const top = getScaledMinuteTop(rowStart);
        const height = getRangeHeight(rowStart, rowEnd);
        const showLabel = height >= 18 || hour === Math.floor(workStart / 60);
        return (
          <View pointerEvents="none" key={hour} style={[styles.hourRow, { top, height }]}>
            {showTimeColumn ? (
              <Text style={[styles.hourText, !showLabel && styles.hourTextHidden]}>{showLabel ? `${String(hour).padStart(2, "0")}:00` : ""}</Text>
            ) : null}
            <View style={styles.hourGrid}>
              {(height >= 34 ? [0, 1, 2, 3, 4, 5, 6] : [0, 6]).map((part) => (
                <View
                  key={part}
                  style={[
                    part === 0 || part === 6 ? styles.majorLine : styles.minorLine,
                    { top: (height / 6) * part },
                  ]}
                />
              ))}
            </View>
          </View>
        );
      })}

      {Array.from({ length: (endHour - startHour + 1) * 6 }).map((_, index) => {
        const minutes = startHour * 60 + index * 10;
        if (!isWorkingSlot(minutes)) return null;
        return (
          <Pressable
            key={minutes}
            style={[
              styles.timeSlotHitbox,
              {
                top: getScaledMinuteTop(minutes),
                left: timeColumnWidth,
                height: getRangeHeight(minutes, minutes + 10),
              },
            ]}
            onPress={() => onTimePress(formatTimeFromMinutes(minutes))}
          />
        );
      })}

      {closedRanges.map((range, index) => (
        <View
          key={`${range.start}-${range.end}-${index}`}
          pointerEvents="none"
          style={[
            styles.closedBlock,
            {
              top: getScaledMinuteTop(range.start),
              height: getRangeHeight(range.start, range.end),
              left: timeColumnWidth + 1,
            },
          ]}
        />
      ))}

      {blockedAppointments.map((range) => (
        <Pressable
          key={range.appointment.id}
          style={[
            styles.closedBlock,
            styles.editableClosedBlock,
            {
              top: getScaledMinuteTop(range.start),
              height: getRangeHeight(range.start, range.end),
              left: timeColumnWidth + 1,
            },
          ]}
          onPress={() => onBlockedAppointmentPress(range.appointment)}
        >
          {getRangeHeight(range.start, range.end) >= 24 ? (
            <>
              <Text style={styles.closedBlockText}>{range.label}</Text>
              <Text style={styles.closedBlockTimeText}>{range.appointment.startTime} - {range.appointment.endTime}</Text>
            </>
          ) : null}
        </Pressable>
      ))}

      {showCurrentTime && nowTop >= 0 && nowTop <= timelineHeight ? (
        <View style={[styles.currentTimeLine, { top: nowTop, left: timeColumnWidth }]}>
          {showTimeColumn ? <View style={styles.currentTimeDot} /> : null}
        </View>
      ) : null}

      {appointmentLayouts.map(({ appointment, start, end, laneCount, laneIndex }, index) => {
        const top = getScaledMinuteTop(start);
        const nextTouchingStart = regularAppointments
          .filter((item) => item.id !== appointment.id)
          .map((item) => timeToMinutes(item.startTime))
          .filter((itemStart) => itemStart >= end)
          .sort((left, right) => left - right)[0];
        const actualHeight = getRangeHeight(start, end);
        const maxHeightBeforeNext = typeof nextTouchingStart === "number" ? getRangeHeight(start, nextTouchingStart) : Infinity;
        const height = Math.max(actualHeight, Math.min(appointmentMinHeight, maxHeightBeforeNext));
        const color = index % 3 === 0 ? "#FF9A82" : index % 3 === 1 ? "#FFD166" : "#9ED96B";
        const availableWidth = gridWidth - laneGap * 2;
        const blockGap = laneCount > 1 ? 2 : 0;
        const blockWidth = laneCount > 1 ? (availableWidth - blockGap * (laneCount - 1)) / laneCount : availableWidth;
        const blockLeft = timeColumnWidth + laneGap + laneIndex * (blockWidth + blockGap);
        const isNarrowCard = blockWidth < 92;
        const isTightCard = height < 64 || isNarrowCard;
        const isTinyCard = height < 44 || blockWidth < 68;
        const timeLabel = isTinyCard ? appointment.startTime : `${appointment.startTime} - ${appointment.endTime}`;

        return (
          <Pressable
            key={appointment.id}
            style={[
              styles.appointmentBlock,
              isTightCard && styles.appointmentBlockTight,
              {
                top,
                height,
                left: blockLeft,
                width: blockWidth,
                backgroundColor: color,
              },
            ]}
            onPress={() => onAppointmentPress(appointment)}
          >
            <Pressable
              style={[styles.appointmentDeleteButton, isTightCard && styles.appointmentDeleteButtonTight]}
              onPress={(event) => {
                event.stopPropagation();
                onAppointmentDelete(appointment);
              }}
            >
              <Ionicons name="close" size={isTightCard ? 11 : 13} color="#F43F5E" />
            </Pressable>
            <Pressable
              style={[styles.appointmentMoveButton, isTightCard && styles.appointmentMoveButtonTight]}
              onPress={(event) => {
                event.stopPropagation();
                onAppointmentMove(appointment);
              }}
            >
              <Ionicons name="move" size={isTightCard ? 10 : 12} color="#475569" />
            </Pressable>
            <Text style={[styles.appointmentTime, isTightCard && styles.appointmentTimeTight]} numberOfLines={1} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.82}>
              {timeLabel}
            </Text>
            <Text style={[styles.appointmentClient, isTightCard && styles.appointmentClientTight]} numberOfLines={isTightCard ? 1 : 2} ellipsizeMode="tail">
              {appointment.customerName || "Клиент"}
            </Text>
            {!isTightCard ? (
              <Text style={styles.appointmentService} numberOfLines={1}>
                {appointment.serviceName}
              </Text>
            ) : null}
            <Text style={styles.appointmentPrice}>{formatMoney(appointment.priceAmount, currency)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WorkspaceHeader({
  t,
  language,
  setLanguage,
  session,
  workspace,
  activeTab,
  setActiveTab,
  apiFetch,
  onRefreshWorkspace,
  onOpenNotification,
  onOpenSettingsSection,
  onSignOut,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  session: MobileSession;
  workspace: WorkspaceSnapshot | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onRefreshWorkspace: () => void;
  onOpenNotification: (item: MobileNotificationRecord) => void;
  onOpenSettingsSection: (section?: MobileSettingsSection) => void;
  onSignOut: () => void;
}) {
  const title = activeTab === "calendar" ? "денний календар" : t[activeTab];
  const [panel, setPanel] = useState<"setup" | "share" | "support" | "notifications" | "account" | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportTicketId, setSupportTicketId] = useState("");
  const [supportStatus, setSupportStatus] = useState("");
  const [notifications, setNotifications] = useState<MobileNotificationsPayload>({});
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [busy, setBusy] = useState(false);
  const publicBookingUrl = workspace?.business.publicBookingUrl || "";
  const onlineBookingEnabled = workspace?.business.allowOnlineBooking === true;
  const setupItems = [
    { id: "services", title: t.setupServices, done: Boolean(workspace?.services?.length), icon: "pricetag-outline" as const },
    { id: "schedule", title: t.setupSchedule, done: Boolean(workspace?.memberSchedule?.workSchedule || workspace?.memberSchedule?.customSchedule), icon: "time-outline" as const },
    { id: "booking", title: t.setupBooking, done: onlineBookingEnabled, icon: "cloud-upload-outline" as const },
    { id: "address", title: t.setupAddress, done: Boolean(workspace?.business.address), icon: "location-outline" as const },
    { id: "telegram", title: t.setupTelegram, done: Boolean(workspace?.telegram?.connected), icon: "chatbubble-ellipses-outline" as const },
  ];
  const setupDone = setupItems.filter((item) => item.done).length;
  const setupMissingCount = setupItems.length - setupDone;
  const pendingCount = (notifications.pendingOnlineBookings?.length || 0) + (notifications.pendingJoinRequests?.length || 0);

  async function openPanel(nextPanel: typeof panel) {
    setPanel(nextPanel);
    if (nextPanel === "notifications") {
      setLoadingNotifications(true);
      try {
        const payload = await apiFetch("/api/mobile/pro/calendar?mode=notifications");
        setNotifications(payload || {});
      } catch {
        setNotifications({});
      } finally {
        setLoadingNotifications(false);
      }
    }
  }

  async function togglePublicBooking() {
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({ business: { allowOnlineBooking: !onlineBookingEnabled } }),
      });
      onRefreshWorkspace();
    } catch (error) {
      Alert.alert(t.bookingPage, error instanceof Error ? error.message : t.supportFailed);
    } finally {
      setBusy(false);
    }
  }

  async function shareBookingPage() {
    if (!publicBookingUrl) return;
    await Share.share({ message: publicBookingUrl, url: publicBookingUrl }).catch(() => undefined);
  }

  async function openBookingPage() {
    if (!publicBookingUrl) return;
    await Linking.openURL(publicBookingUrl).catch(() => undefined);
  }

  async function sendSupportMessage() {
    const message = supportMessage.trim();
    if (!message) return;
    setBusy(true);
    setSupportStatus("");
    try {
      const payload = await apiFetch("/api/mobile/pro/support", {
        method: "POST",
        body: JSON.stringify({ message, ticketId: supportTicketId, language, page: "mobile-app" }),
      });
      setSupportTicketId(payload?.ticketId || supportTicketId);
      setSupportMessage("");
      setSupportStatus(t.supportSent);
    } catch {
      setSupportStatus(t.supportFailed);
    } finally {
      setBusy(false);
    }
  }

  function renderPanel() {
    if (!panel) return null;
    const close = () => setPanel(null);
    return (
      <Modal transparent visible animationType="slide" onRequestClose={close}>
        <View style={styles.headerPanelBackdrop}>
          <View style={styles.headerPanel}>
            <View style={styles.headerPanelTop}>
              <View>
                <Text style={styles.headerPanelEyebrow}>Timviz</Text>
                <Text style={styles.headerPanelTitle}>
                  {panel === "setup" ? t.setupAssistant : panel === "share" ? t.bookingPage : panel === "support" ? t.supportTitle : panel === "notifications" ? t.reminders : t.accountMenu || t.settings}
                </Text>
              </View>
              <Pressable style={styles.headerPanelClose} onPress={close}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </Pressable>
            </View>

            {panel === "setup" ? (
              <View style={styles.headerPanelBody}>
                <Text style={styles.panelHint}>{t.setupAssistantText}</Text>
                <View style={styles.setupProgressRow}>
                  <Text style={styles.setupProgressTitle}>{t.setupProgress}</Text>
                  <Text style={styles.setupProgressValue}>{setupDone}/{setupItems.length}</Text>
                </View>
                {setupItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.setupStep}
                    onPress={() => {
                      if (item.id === "services") setActiveTab("services");
                      if (item.id === "booking") onOpenSettingsSection("online");
                      if (item.id === "address") onOpenSettingsSection("address");
                      if (item.id === "telegram") onOpenSettingsSection("telegram");
                      if (item.id === "schedule") onOpenSettingsSection("schedule");
                      close();
                    }}
                  >
                    <View style={[styles.setupStepIcon, item.done && styles.setupStepIconDone]}>
                      <Ionicons name={item.done ? "checkmark" : item.icon} size={18} color={item.done ? "#FFFFFF" : "#6D4AFF"} />
                    </View>
                    <Text style={styles.setupStepText}>{item.title}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </Pressable>
                ))}
              </View>
            ) : null}

            {panel === "share" ? (
              <View style={styles.headerPanelBody}>
                <Text style={styles.panelHint}>{t.bookingPageText}</Text>
                <Pressable style={styles.shareToggleRow} onPress={togglePublicBooking} disabled={busy}>
                  <View>
                    <Text style={styles.shareToggleTitle}>{onlineBookingEnabled ? t.onlineBookingOn : t.onlineBookingOff}</Text>
                    <Text style={styles.clientOptionCaption}>{workspace?.business.name || "Timviz"}</Text>
                  </View>
                  <View style={[styles.mobileSwitch, onlineBookingEnabled && styles.mobileSwitchActive]}>
                    <View style={[styles.mobileSwitchThumb, onlineBookingEnabled && styles.mobileSwitchThumbActive]} />
                  </View>
                </Pressable>
                <TextInput value={publicBookingUrl} editable={false} style={styles.shareUrlInput} />
                <View style={styles.headerPanelActions}>
                  <Pressable style={styles.headerGhostButton} onPress={openBookingPage} disabled={!publicBookingUrl}>
                    <Text style={styles.headerGhostButtonText}>{t.openPage}</Text>
                  </Pressable>
                  <Pressable style={styles.headerPrimaryButton} onPress={shareBookingPage} disabled={!publicBookingUrl}>
                    <Text style={styles.headerPrimaryButtonText}>{t.sharePage}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {panel === "support" ? (
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.headerPanelKeyboard}>
                <ScrollView
                  style={styles.headerPanelScrollBody}
                  contentContainerStyle={styles.supportPanelContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.supportGuideCard}>
                    <Text style={styles.supportGuideTitle}>{t.supportGuideTitle}</Text>
                    <Text style={styles.panelHint}>{t.supportGuideText}</Text>
                    {supportTicketId ? <Text style={styles.supportTicket}>{supportTicketId}</Text> : null}
                  </View>
                  <Text style={styles.supportBubble}>{t.supportGreeting}</Text>
                  <TextInput
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                    placeholder={t.supportPlaceholder}
                    multiline
                    style={styles.supportInput}
                  />
                  {supportStatus ? <Text style={styles.supportStatusText}>{supportStatus}</Text> : null}
                </ScrollView>
                <View style={styles.supportPanelFooter}>
                  <Pressable style={[styles.headerPrimaryButton, styles.headerPrimaryButtonFull, busy && styles.disabled]} onPress={sendSupportMessage} disabled={busy}>
                    <Text style={styles.headerPrimaryButtonText}>{t.supportSend}</Text>
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            ) : null}

            {panel === "notifications" ? (
              <ScrollView style={styles.headerPanelBody} showsVerticalScrollIndicator={false}>
                <View style={styles.notificationHeading}>
                  <Text style={styles.notificationHeadingText}>{t.notificationPendingBookings}</Text>
                  <Text style={styles.notificationBadgeText}>{notifications.pendingOnlineBookings?.length || 0}</Text>
                </View>
                {loadingNotifications ? <ActivityIndicator color="#6D4AFF" /> : null}
                {!loadingNotifications && !(notifications.pendingOnlineBookings?.length || notifications.pendingJoinRequests?.length) ? (
                  <View style={styles.notificationEmptyCard}>
                    <Text style={styles.notificationCardTitle}>{t.reminders}</Text>
                    <Text style={styles.clientOptionCaption}>{t.notificationEmpty}</Text>
                  </View>
                ) : null}
                {(notifications.pendingOnlineBookings || []).map((item) => (
                  <NotificationCard
                    key={item.id}
                    item={item}
                    t={t}
                    onPress={() => {
                      close();
                      onOpenNotification(item);
                    }}
                  />
                ))}
                <View style={styles.notificationHeading}>
                  <Text style={styles.notificationHeadingText}>{t.notificationsArchive}</Text>
                  <Text style={styles.notificationBadgeText}>{notifications.archivedOnlineBookings?.length || 0}</Text>
                </View>
                {(notifications.archivedOnlineBookings || []).map((item) => (
                  <NotificationCard key={item.id} item={item} t={t} />
                ))}
              </ScrollView>
            ) : null}

            {panel === "account" ? (
              <View style={styles.headerPanelBody}>
                <View style={styles.accountMenuHeader}>
                  <View style={styles.accountAvatarLarge}>
                    <Text style={styles.accountAvatarLargeText}>{session.displayName.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.accountName}>{session.displayName}</Text>
                    <Text style={styles.clientOptionCaption}>{workspace?.business.name || session.email}</Text>
                  </View>
                </View>
                <Pressable style={styles.accountMenuItem} onPress={() => { close(); onOpenSettingsSection("general"); }}>
                  <Text style={styles.accountMenuItemText}>{t.myProfile}</Text>
                </Pressable>
                <Pressable style={styles.accountMenuItem} onPress={() => { close(); onOpenSettingsSection("general"); }}>
                  <Text style={styles.accountMenuItemText}>{t.personalSettings}</Text>
                </Pressable>
                <Pressable style={styles.accountMenuItem} onPress={() => setPanel("support")}>
                  <Text style={styles.accountMenuItemText}>{t.helpSupport}</Text>
                </Pressable>
                <Text style={styles.accountMenuLabel}>{t.language}</Text>
                <View style={styles.accountLanguageRow}>
                  {(["ru", "uk", "en"] as AppLanguage[]).map((item) => (
                    <Pressable key={item} style={[styles.accountLanguageButton, language === item && styles.accountLanguageButtonActive]} onPress={() => setLanguage(item)}>
                      <Text style={[styles.accountLanguageText, language === item && styles.accountLanguageTextActive]}>{languageNames[item]}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={styles.accountLogout} onPress={() => { close(); void onSignOut(); }}>
                  <Text style={styles.accountLogoutText}>{t.signOut}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.nativeHeader}>
      <View style={styles.headerTitleStack}>
        <Text style={styles.nativeHeaderTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.headerBusinessInline} numberOfLines={1}>
          {workspace?.business.name || session.displayName}
        </Text>
      </View>
      <View style={styles.nativeHeaderActions}>
        <AppIconButton icon="rocket" active={panel === "setup"} badge={setupMissingCount} badgeTone="red" onPress={() => void openPanel("setup")} />
        <AppIconButton icon="cloud-upload-outline" active={panel === "share"} onPress={() => void openPanel("share")} />
        <AppIconButton icon="chatbubble-ellipses-outline" tone="cyan" active={panel === "support"} onPress={() => void openPanel("support")} />
        <AppIconButton icon="notifications-outline" active={panel === "notifications"} badge={pendingCount} onPress={() => void openPanel("notifications")} />
        <Pressable style={styles.profilePill} onPress={() => void openPanel("account")}>
          <View style={styles.smallAvatar}>
            <Text style={styles.smallAvatarText}>{session.displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Ionicons name="chevron-down" size={12} color="#64748B" />
        </Pressable>
      </View>
      {renderPanel()}
    </View>
  );
}

function AppIconButton({
  icon,
  active,
  tone,
  badge,
  badgeTone,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  active?: boolean;
  tone?: "cyan";
  badge?: number;
  badgeTone?: "red";
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.headerIconButton, active && styles.headerIconButtonActive, tone === "cyan" && styles.headerIconButtonCyan]}>
      <Ionicons name={icon} size={20} color={active ? "#FFFFFF" : tone === "cyan" ? "#0891B2" : "#432C75"} />
      {badge ? (
        <View style={[styles.headerIconBadge, badgeTone === "red" && styles.headerIconBadgeRed]}>
          <Text style={styles.headerIconBadgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function NotificationCard({
  item,
  t,
  onPress,
}: {
  item: MobileNotificationRecord;
  t: Record<string, string>;
  onPress?: () => void;
}) {
  const statusText = item.status === "cancelled" ? t.statusCancelled : item.status === "confirmed" ? t.statusConfirmed : t.statusPending;
  return (
    <Pressable style={styles.notificationCard} onPress={onPress} disabled={!onPress}>
      <View style={styles.notificationCardHeader}>
        <Text style={styles.notificationCardTitle}>{item.customerName || t.customer}</Text>
        <Text style={styles.clientOptionCaption}>{formatShortDate(item.appointmentDate, "ru")}</Text>
      </View>
      <Text style={styles.notificationService}>{item.serviceName}</Text>
      <Text style={styles.clientOptionCaption}>
        {item.appointmentDate} · {item.startTime}{item.professionalName ? ` · ${item.professionalName}` : ""}
      </Text>
      <View style={[styles.notificationStatusPill, item.status === "cancelled" ? styles.notificationStatusCancelled : item.status === "confirmed" ? styles.notificationStatusConfirmed : null]}>
        <Text style={[styles.notificationStatusText, item.status === "cancelled" ? styles.notificationStatusCancelledText : item.status === "confirmed" ? styles.notificationStatusConfirmedText : null]}>{statusText}</Text>
      </View>
    </Pressable>
  );
}

function BottomNavigation({
  activeTab,
  setActiveTab,
  t,
}: {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  t: Record<string, string>;
}) {
  const items: Array<{ tab: AppTab; icon: ComponentProps<typeof Ionicons>["name"]; label: string }> = [
    { tab: "calendar", icon: "home-outline", label: t.home },
    { tab: "services", icon: "pricetag-outline", label: t.services },
    { tab: "clients", icon: "id-card-outline", label: t.clients },
    { tab: "staff", icon: "people-outline", label: t.staff },
    { tab: "settings", icon: "settings-outline", label: t.settings },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = activeTab === item.tab;
        return (
          <Pressable key={item.tab} onPress={() => setActiveTab(item.tab)} style={[styles.bottomNavItem, active && styles.bottomNavItemActive]}>
            <Ionicons name={item.icon} size={19} color={active ? "#6D4AFF" : "#64748B"} />
            <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ServicesTab({
  t,
  workspace,
  catalog,
  draft,
  setDraft,
  onCreate,
  onUpdate,
  onAddCatalog,
  onDelete,
  busy,
}: {
  t: Record<string, string>;
  workspace: WorkspaceSnapshot | null;
  catalog: ServiceCatalogCategory[];
  draft: ServiceDraftState;
  setDraft: (draft: ServiceDraftState) => void;
  onCreate: () => Promise<boolean>;
  onUpdate: (serviceId: string, draft: ServiceDraftState) => Promise<boolean>;
  onAddCatalog: (service: ServiceTemplateRecord & { category: string }) => void;
  onDelete: (serviceId: string) => void;
  busy: boolean;
}) {
  const services = workspace?.services || [];
  const currency = workspace?.professional.currency;
  const [mode, setMode] = useState<"mine" | "custom" | "catalog">("mine");
  const [editId, setEditId] = useState("");
  const [editDraft, setEditDraft] = useState<ServiceDraftState>({ name: "", category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
  const [customCategory, setCustomCategory] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [activeCatalogCategory, setActiveCatalogCategory] = useState("");

  const categories = useMemo(() => {
    const names = [
      ...services.map((service) => service.category || ""),
      ...catalog.map((item) => item.title),
      draft.category,
      customCategory,
      DEFAULT_SERVICE_CATEGORY,
    ]
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [catalog, customCategory, draft.category, services]);

  const currentCatalogCategory = activeCatalogCategory || catalog[0]?.title || categories[0] || DEFAULT_SERVICE_CATEGORY;
  const catalogServices = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return catalog
      .filter((group) => query || group.title === currentCatalogCategory)
      .flatMap((group) => [...(group.topSuggestions || []), ...(group.popularServices || [])].map((service) => ({ ...service, category: group.title })))
      .filter((service) => !query || service.name.toLowerCase().includes(query));
  }, [catalog, catalogQuery, currentCatalogCategory]);

  function startEdit(service: ServiceRecord) {
    setEditId(service.id);
    setEditDraft({
      name: service.name,
      category: service.category || DEFAULT_SERVICE_CATEGORY,
      durationMinutes: String(service.durationMinutes || 60),
      price: String(service.price || 0),
      color: service.color || SERVICE_COLORS[0],
    });
  }

  async function saveEdit() {
    const saved = await onUpdate(editId, editDraft);
    if (saved) {
      setEditId("");
    }
  }

  function addCustomCategory() {
    const value = customCategory.trim();
    if (!value) return;
    setDraft({ ...draft, category: value });
    setActiveCatalogCategory(value);
    setCustomCategory("");
  }

  function serviceExists(serviceName: string) {
    return services.some((service) => service.name.trim().toLowerCase() === serviceName.trim().toLowerCase());
  }

  async function saveCustomService() {
    const created = await onCreate();
    if (created) {
      setMode("mine");
    }
  }

  return (
    <View style={styles.sectionStack}>
      <View style={styles.servicesModeRow}>
        {[
          { id: "mine", label: t.yourServices },
          { id: "custom", label: t.ownService },
          { id: "catalog", label: t.generalCatalog },
        ].map((item) => {
          const active = mode === item.id;
          return (
            <Pressable key={item.id} style={[styles.servicesModeButton, active && styles.servicesModeButtonActive]} onPress={() => setMode(item.id as "mine" | "custom" | "catalog")}>
              <Text style={[styles.servicesModeText, active && styles.servicesModeTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === "mine" ? (
        <Panel title={t.yourServices}>
          <Text style={styles.emptyText}>{t.myServicesHint}</Text>
          {services.length ? (
            services.map((service) => {
              const isEditing = editId === service.id;
              return (
                <View key={service.id} style={styles.serviceManageCard}>
                  {isEditing ? (
                    <View style={styles.serviceEditStack}>
                      <Field label={t.serviceName} value={editDraft.name} onChangeText={(value) => setEditDraft({ ...editDraft, name: value })} />
                      <CategoryChips categories={categories} selected={editDraft.category} onSelect={(category) => setEditDraft({ ...editDraft, category })} />
                      <View style={styles.twoColumns}>
                        <Field label={t.duration} value={editDraft.durationMinutes} onChangeText={(value) => setEditDraft({ ...editDraft, durationMinutes: value })} keyboardType="number-pad" />
                        <Field label={t.price} value={editDraft.price} onChangeText={(value) => setEditDraft({ ...editDraft, price: value })} keyboardType="number-pad" />
                      </View>
                      <ColorSwatches value={editDraft.color} onChange={(color) => setEditDraft({ ...editDraft, color })} />
                      <View style={styles.serviceActionRow}>
                        <SecondaryButton label={t.cancel} onPress={() => setEditId("")} disabled={busy} />
                        <PrimaryButton label={t.saveService} onPress={() => void saveEdit()} disabled={busy} />
                      </View>
                    </View>
                  ) : (
                    <Pressable style={styles.serviceManageSummary} onPress={() => startEdit(service)}>
                      <View style={styles.serviceColorRow}>
                        <View style={[styles.serviceDot, { backgroundColor: service.color || "#7C3AED" }]} />
                        <View style={styles.serviceTextBlock}>
                          <Text style={styles.listTitle}>{service.name}</Text>
                          <Text style={styles.listCaption}>{service.category || DEFAULT_SERVICE_CATEGORY} · {service.durationMinutes || 60} {t.duration.toLowerCase()}</Text>
                        </View>
                      </View>
                      <View style={styles.rowRight}>
                        <Text style={styles.moneyText}>{formatMoney(service.price, currency)}</Text>
                        <Pressable style={styles.iconGhostButton} onPress={() => startEdit(service)}>
                          <Ionicons name="create-outline" size={18} color="#334155" />
                        </Pressable>
                        <Pressable style={styles.smallDanger} onPress={() => onDelete(service.id)}>
                          <Text style={styles.smallDangerText}>×</Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t.empty}</Text>
          )}
        </Panel>
      ) : null}

      {mode === "custom" ? (
        <Panel title={t.ownService}>
          <Field label={t.serviceName} value={draft.name} onChangeText={(value) => setDraft({ ...draft, name: value })} />
          <Text style={styles.label}>{t.selectedCategory}</Text>
          <CategoryChips categories={categories} selected={draft.category} onSelect={(category) => setDraft({ ...draft, category })} />
          <View style={styles.categoryAddRow}>
            <Field label={t.newCategory} value={customCategory} onChangeText={setCustomCategory} />
            <Pressable style={styles.categoryAddButton} onPress={addCustomCategory}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.twoColumns}>
            <Field label={t.duration} value={draft.durationMinutes} onChangeText={(value) => setDraft({ ...draft, durationMinutes: value })} keyboardType="number-pad" />
            <Field label={t.price} value={draft.price} onChangeText={(value) => setDraft({ ...draft, price: value })} keyboardType="number-pad" />
          </View>
          <ColorSwatches value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
          <PrimaryButton label={t.addService} onPress={() => void saveCustomService()} disabled={busy} />
        </Panel>
      ) : null}

      {mode === "catalog" ? (
        <Panel title={t.generalCatalog}>
          <Text style={styles.emptyText}>{t.catalogHint}</Text>
          <Field label={t.search} value={catalogQuery} onChangeText={setCatalogQuery} placeholder={t.searchService} />
          <CategoryChips categories={catalog.map((item) => item.title)} selected={currentCatalogCategory} onSelect={setActiveCatalogCategory} />
          {catalogServices.length ? (
            catalogServices.map((service) => {
              const exists = serviceExists(service.name);
              return (
                <Pressable key={`${service.category}-${service.name}`} style={[styles.catalogServiceCard, exists && styles.catalogServiceCardActive]} onPress={() => !exists && onAddCatalog(service)} disabled={busy || exists}>
                  <View style={styles.serviceTextBlock}>
                    <Text style={styles.listTitle}>{service.name}</Text>
                    <Text style={styles.listCaption}>{service.category} · {service.durationMinutes || 60} {t.duration.toLowerCase()} · {formatMoney(Number(service.price || 0), currency)}</Text>
                  </View>
                  <View style={[styles.catalogAddBadge, exists && styles.catalogAddBadgeDone]}>
                    <Ionicons name={exists ? "checkmark" : "add"} size={20} color={exists ? "#166534" : "#FFFFFF"} />
                  </View>
                  <Text style={[styles.catalogStateText, exists && styles.catalogStateTextDone]}>{exists ? t.alreadyAdded : t.addFromCatalog}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.emptyText}>{t.empty}</Text>
          )}
        </Panel>
      ) : null}
    </View>
  );
}

function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}) {
  const safeCategories = categories.length ? categories : [DEFAULT_SERVICE_CATEGORY];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicePicker}>
      {safeCategories.map((category) => {
        const active = category === selected;
        return (
          <Pressable key={category} style={[styles.choiceChip, active && styles.choiceChipActive]} onPress={() => onSelect(category)}>
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{category}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ColorSwatches({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <View style={styles.colorSwatchRow}>
      {SERVICE_COLORS.map((color) => (
        <Pressable key={color} style={[styles.colorSwatch, { backgroundColor: color }, value === color && styles.colorSwatchActive]} onPress={() => onChange(color)} />
      ))}
    </View>
  );
}

function ClientsTab({
  t,
  clients,
  draft,
  setDraft,
  onCreate,
  busy,
}: {
  t: Record<string, string>;
  clients: ClientRecord[];
  draft: { firstName: string; lastName: string; phone: string; email: string };
  setDraft: (draft: { firstName: string; lastName: string; phone: string; email: string }) => void;
  onCreate: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      <Panel title={t.addClient}>
        <View style={styles.twoColumns}>
          <Field label={t.firstName} value={draft.firstName} onChangeText={(value) => setDraft({ ...draft, firstName: value })} />
          <Field label={t.lastName} value={draft.lastName} onChangeText={(value) => setDraft({ ...draft, lastName: value })} />
        </View>
        <Field label={t.phone} value={draft.phone} onChangeText={(value) => setDraft({ ...draft, phone: value })} keyboardType="phone-pad" />
        <Field label={t.email} value={draft.email} onChangeText={(value) => setDraft({ ...draft, email: value })} keyboardType="email-address" autoCapitalize="none" />
        <PrimaryButton label={t.addClient} onPress={onCreate} disabled={busy} />
      </Panel>

      <Panel title={t.clients}>
        {clients.length ? (
          clients.map((client) => (
            <View key={client.id} style={styles.listItem}>
              <View>
                <Text style={styles.listTitle}>{client.fullName || client.phone}</Text>
                <Text style={styles.listCaption}>{client.phone || client.email}</Text>
              </View>
              <Text style={styles.badgeText}>{client.visitsCount}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t.empty}</Text>
        )}
      </Panel>
    </View>
  );
}

const staffWeekKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function makeStaffMembers(staff: StaffSnapshot | null, workspace: WorkspaceSnapshot | null, t: Record<string, string>): StaffMemberRecord[] {
  return staff?.members?.length
    ? staff.members
    : workspace
      ? [
          {
            professional: workspace.professional,
            membership: {
              role: t.owner,
              scope: "owner" as const,
              workScheduleMode: workspace.memberSchedule?.workScheduleMode === "flexible" ? "flexible" as const : "fixed" as const,
              workSchedule: workspace.memberSchedule?.workSchedule || {},
              customSchedule: workspace.memberSchedule?.customSchedule || {},
            },
            workspaceAccess: "owner" as const,
            pendingInvitation: null,
            stats: {
              monthBookings: 0,
              upcomingBookings: 0,
            },
          },
        ]
      : [];
}

function makeStaffMemberName(member: StaffMemberRecord, fallback: string) {
  return `${member.professional.firstName || ""} ${member.professional.lastName || ""}`.trim() || member.professional.email || fallback;
}

function splitStaffFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function StaffWorkspaceTab({
  t,
  language,
  staff,
  workspace,
  busy,
  apiFetch,
  onRefreshWorkspace,
  onSaveSchedule,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  staff: StaffSnapshot | null;
  workspace: WorkspaceSnapshot | null;
  busy: boolean;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onRefreshWorkspace: () => void;
  onSaveSchedule: (member: StaffMemberRecord, workSchedule: WorkScheduleRecord, customSchedule?: Record<string, WorkDayScheduleRecord>, mode?: "fixed" | "flexible") => Promise<boolean>;
}) {
  const [section, setSection] = useState<"members" | "schedule">("members");

  return (
    <View style={styles.sectionStack}>
      <View style={styles.staffLocalNav}>
        <Pressable style={[styles.staffLocalNavItem, section === "members" && styles.staffLocalNavItemActive]} onPress={() => setSection("members")}>
          <Ionicons name="people-outline" size={18} color={section === "members" ? "#6D4AFF" : "#64748B"} />
          <Text style={[styles.staffLocalNavText, section === "members" && styles.staffLocalNavTextActive]}>{t.teamMembers}</Text>
        </Pressable>
        <Pressable style={[styles.staffLocalNavItem, section === "schedule" && styles.staffLocalNavItemActive]} onPress={() => setSection("schedule")}>
          <Ionicons name="calendar-outline" size={18} color={section === "schedule" ? "#6D4AFF" : "#64748B"} />
          <Text style={[styles.staffLocalNavText, section === "schedule" && styles.staffLocalNavTextActive]}>{t.staffSchedule}</Text>
        </Pressable>
      </View>

      {section === "members" ? (
        <StaffMembersTab
          t={t}
          staff={staff}
          workspace={workspace}
          busy={busy}
          apiFetch={apiFetch}
          onRefreshWorkspace={onRefreshWorkspace}
          onOpenSchedule={() => setSection("schedule")}
        />
      ) : (
        <StaffScheduleTab
          t={t}
          language={language}
          staff={staff}
          workspace={workspace}
          busy={busy}
          onSaveSchedule={onSaveSchedule}
          onOpenMembers={() => setSection("members")}
        />
      )}
    </View>
  );
}

function StaffMembersTab({
  t,
  staff,
  workspace,
  busy,
  apiFetch,
  onRefreshWorkspace,
  onOpenSchedule,
}: {
  t: Record<string, string>;
  staff: StaffSnapshot | null;
  workspace: WorkspaceSnapshot | null;
  busy: boolean;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onRefreshWorkspace: () => void;
  onOpenSchedule: () => void;
}) {
  const members = makeStaffMembers(staff, workspace, t);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState("");
  const [draft, setDraft] = useState({ fullName: "", role: t.employee, email: "", phone: "", sendInvitation: false });
  const [editDraft, setEditDraft] = useState({ fullName: "", role: "", email: "", phone: "" });

  async function staffAction(body: Record<string, unknown>) {
    setSaving(true);
    try {
      await apiFetch("/api/mobile/pro/staff", {
        method: "POST",
        body: JSON.stringify(body),
      });
      onRefreshWorkspace();
      return true;
    } catch (error) {
      Alert.alert(t.staff, error instanceof Error ? error.message : t.staff);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function createMember() {
    const parsed = splitStaffFullName(draft.fullName);
    if (!parsed.firstName) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }
    const ok = await staffAction({
      action: "createMember",
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      role: draft.role,
      email: draft.email,
      phone: draft.phone,
      sendInvitation: draft.sendInvitation,
    });
    if (ok) {
      setDraft({ fullName: "", role: t.employee, email: "", phone: "", sendInvitation: false });
      setAddOpen(false);
    }
  }

  function startEdit(member: StaffMemberRecord) {
    setEditId(member.professional.id);
    setEditDraft({
      fullName: makeStaffMemberName(member, t.employee),
      role: member.membership.role || t.employee,
      email: member.professional.email || "",
      phone: member.professional.phone || "",
    });
  }

  async function updateMember(member: StaffMemberRecord) {
    const parsed = splitStaffFullName(editDraft.fullName);
    if (!parsed.firstName) {
      Alert.alert(t.requiredTitle, t.requiredText);
      return;
    }
    const ok = await staffAction({
      action: "updateMember",
      memberProfessionalId: member.professional.id,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      role: editDraft.role,
      email: editDraft.email,
      phone: editDraft.phone,
    });
    if (ok) setEditId("");
  }

  async function inviteMember(member: StaffMemberRecord) {
    if (!member.professional.email) {
      startEdit(member);
      return;
    }
    await staffAction({
      action: "inviteMember",
      memberProfessionalId: member.professional.id,
      email: member.professional.email,
      role: member.membership.role,
    });
  }

  async function revokeInvitation(invitationId: string) {
    await staffAction({ action: "revokeInvitation", invitationId });
  }

  async function resolveJoinRequest(requestId: string, requestAction: "approve" | "reject") {
    await staffAction({ action: "resolveJoinRequest", requestId, requestAction });
  }

  return (
    <View style={styles.sectionStack}>
      <Panel title={t.teamMembers}>
        <Text style={styles.emptyText}>{t.teamMembersHint}</Text>
        <View style={styles.staffSummaryRow}>
          <View style={styles.staffSummaryTile}>
            <Text style={styles.statValue}>{staff?.summary?.totalPeople || members.length}</Text>
            <Text style={styles.statLabel}>{t.staff}</Text>
          </View>
          <View style={styles.staffSummaryTile}>
            <Text style={styles.statValue}>{staff?.summary?.pendingInvitations || 0}</Text>
            <Text style={styles.statLabel}>{t.pendingInvites}</Text>
          </View>
        </View>
        <View style={styles.settingsActionRow}>
          <SecondaryButton label={t.staffSchedule} onPress={onOpenSchedule} />
          <PrimaryButton label={addOpen ? t.cancel : t.addMember} onPress={() => setAddOpen(!addOpen)} disabled={busy || saving} />
        </View>
      </Panel>

      {addOpen ? (
        <Panel title={t.addMember}>
          <Field label={t.fullName} value={draft.fullName} onChangeText={(value) => setDraft({ ...draft, fullName: value })} />
          <Field label={t.role} value={draft.role} onChangeText={(value) => setDraft({ ...draft, role: value })} />
          <Field label={t.email} value={draft.email} onChangeText={(value) => setDraft({ ...draft, email: value })} keyboardType="email-address" autoCapitalize="none" />
          <Field label={t.phone} value={draft.phone} onChangeText={(value) => setDraft({ ...draft, phone: value })} keyboardType="phone-pad" />
          <Pressable style={styles.staffToggleRow} onPress={() => setDraft({ ...draft, sendInvitation: !draft.sendInvitation })}>
            <Text style={styles.settingsCardTitle}>{t.sendInvite}</Text>
            <View style={[styles.mobileSwitch, draft.sendInvitation && styles.mobileSwitchActive]}>
              <View style={[styles.mobileSwitchThumb, draft.sendInvitation && styles.mobileSwitchThumbActive]} />
            </View>
          </Pressable>
          <PrimaryButton label={t.addMember} onPress={() => void createMember()} disabled={busy || saving} />
        </Panel>
      ) : null}

      {members.map((member) => {
        const editing = editId === member.professional.id;
        const name = makeStaffMemberName(member, t.employee);
        const isOwner = member.membership.scope === "owner";
        const access = member.workspaceAccess === "owner" ? t.owner : member.workspaceAccess === "active" ? t.connected : member.workspaceAccess === "invited" ? t.pendingInvites : t.notConnected;
        return (
          <Panel key={member.professional.id} title={name}>
            {editing ? (
              <View style={styles.sectionStack}>
                <Field label={t.fullName} value={editDraft.fullName} onChangeText={(value) => setEditDraft({ ...editDraft, fullName: value })} />
                <Field label={t.role} value={editDraft.role} onChangeText={(value) => setEditDraft({ ...editDraft, role: value })} editable={!isOwner} />
                <Field label={t.email} value={editDraft.email} onChangeText={(value) => setEditDraft({ ...editDraft, email: value })} keyboardType="email-address" autoCapitalize="none" editable={!isOwner} />
                <Field label={t.phone} value={editDraft.phone} onChangeText={(value) => setEditDraft({ ...editDraft, phone: value })} keyboardType="phone-pad" />
                <View style={styles.settingsActionRow}>
                  <SecondaryButton label={t.cancel} onPress={() => setEditId("")} disabled={saving} />
                  <PrimaryButton label={t.saveMember} onPress={() => void updateMember(member)} disabled={saving || busy} />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.staffMemberCardTop}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>{name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.staffMemberCardInfo}>
                    <Text style={styles.settingsCardTitle}>{name}</Text>
                    <Text style={styles.clientOptionCaption}>{member.membership.role || t.employee} · {access}</Text>
                    <Text style={styles.clientOptionCaption}>{member.professional.email || member.professional.phone || t.empty}</Text>
                  </View>
                  <Pressable style={styles.iconGhostButton} onPress={() => startEdit(member)}>
                    <Ionicons name="create-outline" size={18} color="#334155" />
                  </Pressable>
                </View>
                <View style={styles.settingsSummaryGrid}>
                  <View style={styles.settingsSummaryTile}>
                    <Text style={styles.statValue}>{member.stats?.monthBookings || 0}</Text>
                    <Text style={styles.statLabel}>{t.monthBookings}</Text>
                  </View>
                  <View style={styles.settingsSummaryTile}>
                    <Text style={styles.statValue}>{member.stats?.upcomingBookings || 0}</Text>
                    <Text style={styles.statLabel}>{t.upcomingBookings}</Text>
                  </View>
                </View>
                <View style={styles.settingsActionRow}>
                  <SecondaryButton label={t.scheduleMenu} onPress={onOpenSchedule} />
                  {!isOwner && member.pendingInvitation ? (
                    <SecondaryButton label={t.revokeInvite} onPress={() => void revokeInvitation(member.pendingInvitation?.id || "")} disabled={saving || busy} />
                  ) : !isOwner ? (
                    <SecondaryButton label={member.workspaceAccess === "invited" ? t.resendInvite : t.invite} onPress={() => void inviteMember(member)} disabled={saving || busy} />
                  ) : null}
                </View>
              </>
            )}
          </Panel>
        );
      })}

      <Panel title={t.joinRequests}>
        {staff?.joinRequests?.length ? (
          staff.joinRequests.map((request) => (
            <View key={request.id} style={styles.joinRequestCard}>
              <View>
                <Text style={styles.settingsMiniTitle}>{request.professional ? `${request.professional.firstName} ${request.professional.lastName}`.trim() || request.professional.email : t.empty}</Text>
                <Text style={styles.clientOptionCaption}>{request.professional?.email || request.professional?.phone || request.role}</Text>
              </View>
              <View style={styles.joinRequestActions}>
                <Pressable style={styles.joinRejectButton} onPress={() => void resolveJoinRequest(request.id, "reject")} disabled={saving}>
                  <Ionicons name="close" size={18} color="#DC2626" />
                </Pressable>
                <Pressable style={styles.joinApproveButton} onPress={() => void resolveJoinRequest(request.id, "approve")} disabled={saving}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{t.noJoinRequests}</Text>
        )}
      </Panel>
    </View>
  );
}

function StaffScheduleTab({
  t,
  language,
  staff,
  workspace,
  busy,
  onSaveSchedule,
  onOpenMembers,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  staff: StaffSnapshot | null;
  workspace: WorkspaceSnapshot | null;
  busy: boolean;
  onSaveSchedule: (member: StaffMemberRecord, workSchedule: WorkScheduleRecord, customSchedule?: Record<string, WorkDayScheduleRecord>, mode?: "fixed" | "flexible") => Promise<boolean>;
  onOpenMembers: () => void;
}) {
  const members = makeStaffMembers(staff, workspace, t);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const selectedMember = members.find((member) => member.professional.id === selectedMemberId) || members[0] || null;
  const [workDraft, setWorkDraft] = useState<WorkScheduleRecord>({});
  const [customDraft, setCustomDraft] = useState<Record<string, WorkDayScheduleRecord>>({});
  const [scheduleMode, setScheduleMode] = useState<"fixed" | "flexible">("fixed");
  const [weekStart, setWeekStart] = useState(getWeekDates(getTodayIso())[0]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(getTodayIso().slice(0, 7) + "-01");
  const [selectedMonthDates, setSelectedMonthDates] = useState<string[]>([]);
  const weekDates = getWeekDates(weekStart);
  const weekTitle = formatCalendarTitle("week", weekDates[0], language);
  const monthDates = getMonthGridDates(pickerMonth);
  const monthTitle = new Intl.DateTimeFormat(language === "en" ? "en-US" : language === "uk" ? "uk-UA" : "ru-RU", { month: "long", year: "numeric" }).format(new Date(`${pickerMonth}T12:00:00`));

  useEffect(() => {
    if (!selectedMemberId && members[0]?.professional.id) {
      setSelectedMemberId(members[0].professional.id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (!selectedMember) return;
    setWorkDraft(copyWorkSchedule(selectedMember.membership.workSchedule, weekDates[0]));
    setCustomDraft({ ...(selectedMember.membership.customSchedule || {}) });
    setScheduleMode(selectedMember.membership.workScheduleMode || "fixed");
  }, [selectedMember?.professional.id, weekStart]);

  const weeklyMinutes = weekDates.reduce((sum, date, index) => {
    const day = getDraftDay(staffWeekKeys[index], date);
    if (!day.enabled) return sum;
    return sum + getIntervalsDurationMinutes(getDayIntervalsRecord(day));
  }, 0);

  function getDraftDay(key: string, date: string) {
    if (scheduleMode === "flexible") {
      return normalizeScheduleDay(customDraft[date] || selectedMember?.membership.customSchedule?.[date], date);
    }
    return normalizeScheduleDay(workDraft[key], date);
  }

  function setDaySchedule(key: string, date: string, next: WorkDayScheduleRecord) {
    if (scheduleMode === "flexible") {
      setCustomDraft({ ...customDraft, [date]: next });
      return;
    }
    setWorkDraft({ ...workDraft, [key]: next });
  }

  function updateDayEnabled(key: string, date: string, enabled: boolean) {
    const current = getDraftDay(key, date);
    const intervals = getDayIntervalsRecord(current);
    setDaySchedule(key, date, serializeIntervalsToDay(enabled, intervals, current));
  }

  function updateDayInterval(key: string, date: string, index: number, field: keyof WorkIntervalRecord, value: string) {
    const current = getDraftDay(key, date);
    const intervals = getDayIntervalsRecord(current).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
    setDaySchedule(key, date, serializeIntervalsToDay(true, intervals, current));
  }

  function addDayInterval(key: string, date: string, index: number) {
    const current = getDraftDay(key, date);
    const nextIntervals = insertWorkIntervalRecord(getDayIntervalsRecord(current), index);
    if (!nextIntervals) {
      Alert.alert(t.staffSchedule, t.noRoomForInterval);
      return;
    }
    setDaySchedule(key, date, serializeIntervalsToDay(true, nextIntervals, current));
  }

  function removeDayInterval(key: string, date: string, index: number) {
    const current = getDraftDay(key, date);
    const nextIntervals = getDayIntervalsRecord(current).filter((_, itemIndex) => itemIndex !== index);
    setDaySchedule(key, date, serializeIntervalsToDay(nextIntervals.length > 0, nextIntervals, current));
  }

  function applyToWeekdays() {
    const monday = getDraftDay("monday", weekDates[0]);
    if (scheduleMode === "flexible") {
      const next = { ...customDraft };
      weekDates.slice(0, 5).forEach((date) => {
        next[date] = { ...monday };
      });
      setCustomDraft(next);
      return;
    }
    const next = { ...workDraft };
    staffWeekKeys.slice(0, 5).forEach((key) => {
      next[key] = { ...monday };
    });
    setWorkDraft(next);
  }

  function clearWeek() {
    if (scheduleMode === "flexible") {
      const next = { ...customDraft };
      weekDates.forEach((date, index) => {
        const current = getDraftDay(staffWeekKeys[index], date);
        next[date] = serializeIntervalsToDay(false, getDayIntervalsRecord(current), current);
      });
      setCustomDraft(next);
      return;
    }
    const next = { ...workDraft };
    staffWeekKeys.forEach((key, index) => {
      const current = getDraftDay(key, weekDates[index]);
      next[key] = serializeIntervalsToDay(false, getDayIntervalsRecord(current), current);
    });
    setWorkDraft(next);
  }

  function toggleMonthDate(date: string) {
    const selected = selectedMonthDates.includes(date);
    if (selected) {
      setSelectedMonthDates((current) => current.filter((item) => item !== date));
      return;
    }

    const existing = customDraft[date] || selectedMember?.membership.customSchedule?.[date];
    if (!existing) {
      setCustomDraft((current) => ({
        ...current,
        [date]: serializeIntervalsToDay(true, [
          { startTime: "09:00", endTime: "13:00" },
          { startTime: "14:00", endTime: "18:00" },
        ], getFallbackSchedule(date)),
      }));
    }
    setSelectedMonthDates((current) => [...current, date].sort());
  }

  function getMonthDraftDay(date: string) {
    return normalizeScheduleDay(customDraft[date] || selectedMember?.membership.customSchedule?.[date], date);
  }

  function setMonthDateSchedule(date: string, next: WorkDayScheduleRecord) {
    setCustomDraft((current) => ({ ...current, [date]: next }));
  }

  function updateMonthDateEnabled(date: string, enabled: boolean) {
    const current = getMonthDraftDay(date);
    setMonthDateSchedule(date, serializeIntervalsToDay(enabled, getDayIntervalsRecord(current), current));
  }

  function updateMonthDateInterval(date: string, index: number, field: keyof WorkIntervalRecord, value: string) {
    const current = getMonthDraftDay(date);
    const intervals = getDayIntervalsRecord(current).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
    setMonthDateSchedule(date, serializeIntervalsToDay(true, intervals, current));
  }

  function addMonthDateInterval(date: string, index: number) {
    const current = getMonthDraftDay(date);
    const nextIntervals = insertWorkIntervalRecord(getDayIntervalsRecord(current), index);
    if (!nextIntervals) {
      Alert.alert(t.staffSchedule, t.noRoomForInterval);
      return;
    }
    setMonthDateSchedule(date, serializeIntervalsToDay(true, nextIntervals, current));
  }

  function removeMonthDateInterval(date: string, index: number) {
    const current = getMonthDraftDay(date);
    const nextIntervals = getDayIntervalsRecord(current).filter((_, itemIndex) => itemIndex !== index);
    setMonthDateSchedule(date, serializeIntervalsToDay(nextIntervals.length > 0, nextIntervals, current));
  }

  function validateMonthSelectionBeforeSave() {
    for (const date of selectedMonthDates) {
      const day = getMonthDraftDay(date);
      if (!day.enabled) continue;
      const validation = validateWorkIntervals(getDayIntervalsRecord(day));
      if (!validation.ok) {
        Alert.alert(t.staffSchedule, validation.reason === "overlap" ? t.overlappingIntervals : t.invalidIntervalRange);
        return false;
      }
    }

    return true;
  }

  function applyMonthSelection() {
    if (!selectedMonthDates.length) {
      Alert.alert(t.monthPlanner, t.selectedDaysHint);
      return;
    }
    if (!validateMonthSelectionBeforeSave()) {
      return;
    }
    const nextWeek = getWeekDates(selectedMonthDates[0])[0];
    setWeekStart(nextWeek);
    setCalendarOpen(false);
  }
  function validateScheduleBeforeSave() {
    if (!validateMonthSelectionBeforeSave()) {
      return false;
    }

    const daysToCheck = scheduleMode === "flexible"
      ? weekDates.map((date, index) => getDraftDay(staffWeekKeys[index], date))
      : staffWeekKeys.map((key, index) => getDraftDay(key, weekDates[index]));

    for (const day of daysToCheck) {
      if (!day.enabled) continue;
      const validation = validateWorkIntervals(getDayIntervalsRecord(day));
      if (!validation.ok) {
        Alert.alert(t.staffSchedule, validation.reason === "overlap" ? t.overlappingIntervals : t.invalidIntervalRange);
        return false;
      }
    }

    return true;
  }

  function shiftMonth(monthDate: string, months: number) {
    const date = new Date(`${monthDate}T12:00:00`);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().slice(0, 10);
  }

  if (!selectedMember) {
    return (
      <View style={styles.sectionStack}>
        <Panel title={t.staffSchedule}>
          <Text style={styles.emptyText}>{t.empty}</Text>
        </Panel>
      </View>
    );
  }

  return (
    <View style={styles.sectionStack}>
      <Panel title={t.staffSchedule}>
        <Text style={styles.emptyText}>{t.staffScheduleHint}</Text>
        <View style={styles.staffSummaryRow}>
          <View style={styles.staffSummaryTile}>
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>{t.staff}</Text>
          </View>
          <View style={styles.staffSummaryTile}>
            <Text style={styles.statValue}>{Math.round(weeklyMinutes / 60)}</Text>
            <Text style={styles.statLabel}>{t.hoursShort}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.staffMemberRail}>
          {members.map((member) => {
            const active = member.professional.id === selectedMember.professional.id;
            const name = makeStaffMemberName(member, t.employee);
            return (
              <Pressable key={member.professional.id} style={[styles.staffMemberChip, active && styles.staffMemberChipActive]} onPress={() => setSelectedMemberId(member.professional.id)}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>{name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={[styles.staffMemberName, active && styles.staffMemberNameActive]}>{name}</Text>
                  <Text style={[styles.staffMemberRole, active && styles.staffMemberNameActive]}>{member.membership.scope === "owner" ? t.owner : member.membership.role || t.employee}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </Panel>

      <Panel title={t.chooseWeek}>
        <View style={styles.staffWeekHeader}>
          <Text style={styles.listTitle}>{weekTitle}</Text>
          <Text style={styles.listCaption}>{makeStaffMemberName(selectedMember, t.employee)}</Text>
        </View>
        <View style={styles.staffCalendarControls}>
          <Pressable style={styles.dateButton} onPress={() => setWeekStart(shiftDate(weekStart, -7))}>
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </Pressable>
          <Pressable style={styles.staffWeekPickerButton} onPress={() => { setPickerMonth(weekStart.slice(0, 7) + "-01"); setCalendarOpen(!calendarOpen); }}>
            <Text style={styles.staffWeekPickerText}>{weekTitle}</Text>
          </Pressable>
          <Pressable style={styles.dateButton} onPress={() => setWeekStart(shiftDate(weekStart, 7))}>
            <Ionicons name="chevron-forward" size={22} color="#0F172A" />
          </Pressable>
        </View>
        <View style={styles.settingsActionRow}>
          <SecondaryButton label={t.currentWeek} onPress={() => setWeekStart(getWeekDates(getTodayIso())[0])} />
          <SecondaryButton label={t.teamMembers} onPress={onOpenMembers} />
        </View>
        {calendarOpen ? (
          <View style={styles.staffCalendarBox}>
            <View style={styles.staffDayHeader}>
              <Pressable style={styles.iconGhostButton} onPress={() => setPickerMonth(shiftMonth(pickerMonth, -1))}>
                <Ionicons name="chevron-back" size={18} color="#334155" />
              </Pressable>
              <Text style={styles.settingsCardTitle}>{monthTitle}</Text>
              <Pressable style={styles.iconGhostButton} onPress={() => setPickerMonth(shiftMonth(pickerMonth, 1))}>
                <Ionicons name="chevron-forward" size={18} color="#334155" />
              </Pressable>
            </View>
            <View style={styles.staffCalendarGrid}>
              {monthDates.map((date) => {
                const inMonth = date.slice(0, 7) === pickerMonth.slice(0, 7);
                const selected = weekDates.includes(date);
                return (
                  <Pressable
                    key={date}
                    style={[styles.staffCalendarDay, !inMonth && styles.staffCalendarDayMuted, selected && styles.staffCalendarDayActive]}
                    onPress={() => {
                      setWeekStart(getWeekDates(date)[0]);
                      setCalendarOpen(false);
                    }}
                  >
                    <Text style={[styles.staffCalendarDayText, selected && styles.staffCalendarDayTextActive]}>{Number(date.slice(8, 10))}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </Panel>

      <Panel title={t.scheduleMenu}>
        <View style={styles.servicesModeRow}>
          {[
            { id: "fixed", label: t.repeatingSchedule },
            { id: "flexible", label: t.oneWeekSchedule },
          ].map((item) => {
            const active = scheduleMode === item.id;
            return (
              <Pressable key={item.id} style={[styles.servicesModeButton, active && styles.servicesModeButtonActive]} onPress={() => setScheduleMode(item.id as "fixed" | "flexible")}>
                <Text style={[styles.servicesModeText, active && styles.servicesModeTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.settingsActionRow}>
          <SecondaryButton label={t.applyToWeekdays} onPress={applyToWeekdays} />
          <SecondaryButton label={t.clearWeek} onPress={clearWeek} />
        </View>
        {scheduleMode === "flexible" ? (
          <View style={styles.staffMonthPlanner}>
            <View>
              <Text style={styles.settingsCardTitle}>{t.monthPlanner}</Text>
              <Text style={styles.clientOptionCaption}>{t.selectedDaysHint}</Text>
            </View>
            <View style={styles.staffCalendarGrid}>
              {monthDates.map((date) => {
                const inMonth = date.slice(0, 7) === pickerMonth.slice(0, 7);
                const selected = selectedMonthDates.includes(date);
                const working = customDraft[date]?.enabled === true;
                return (
                  <Pressable
                    key={`month-${date}`}
                    style={[
                      styles.staffCalendarDay,
                      !inMonth && styles.staffCalendarDayMuted,
                      working && styles.staffCalendarDayWork,
                      selected && styles.staffCalendarDayActive,
                    ]}
                    onPress={() => toggleMonthDate(date)}
                  >
                    <Text style={[styles.staffCalendarDayText, selected && styles.staffCalendarDayTextActive]}>{Number(date.slice(8, 10))}</Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedMonthDates.length ? (
              <View style={styles.staffSelectedDaysStack}>
                {selectedMonthDates.map((date) => {
                  const day = getMonthDraftDay(date);
                  const intervals = getDayIntervalsRecord(day);
                  return (
                    <View key={date} style={styles.staffSelectedDayCard}>
                      <View style={styles.staffDayHeader}>
                        <View>
                          <Text style={styles.staffDayTitle}>{formatShortDate(date, language)}</Text>
                          <Text style={styles.clientOptionCaption}>{day.enabled ? formatMoneylessHours(getIntervalsDurationMinutes(intervals), t.hoursShort) : t.noWork}</Text>
                        </View>
                        <Pressable style={[styles.mobileSwitch, day.enabled && styles.mobileSwitchActive]} onPress={() => updateMonthDateEnabled(date, !day.enabled)}>
                          <View style={[styles.mobileSwitchThumb, day.enabled && styles.mobileSwitchThumbActive]} />
                        </Pressable>
                      </View>
                      {day.enabled ? (
                        <View style={styles.staffIntervalsBox}>
                          <Text style={styles.staffTimeLabel}>{t.workIntervals}</Text>
                          <WorkIntervalsEditor
                            t={t}
                            intervals={intervals}
                            onChange={(intervalIndex, field, value) => updateMonthDateInterval(date, intervalIndex, field, value)}
                            onAddAfter={(intervalIndex) => addMonthDateInterval(date, intervalIndex)}
                            onRemove={(intervalIndex) => removeMonthDateInterval(date, intervalIndex)}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
            <View style={styles.settingsActionRow}>
              <Text style={styles.badgeText}>{selectedMonthDates.length}</Text>
              <PrimaryButton label={t.applyToSelectedDays} onPress={applyMonthSelection} disabled={busy} />
            </View>
          </View>
        ) : null}
        {staffWeekKeys.map((key, index) => {
          const date = weekDates[index] || getTodayIso();
          const day = getDraftDay(key, date);
          const active = day.enabled;
          const intervals = getDayIntervalsRecord(day);
          return (
            <View key={key} style={styles.staffDayCard}>
              <View style={styles.staffDayHeader}>
                <View>
                  <Text style={styles.staffDayTitle}>{formatShortDate(weekDates[index] || getTodayIso(), language)}</Text>
                  <Text style={styles.clientOptionCaption}>{active ? `${t.workingDay} · ${formatMoneylessHours(getIntervalsDurationMinutes(intervals), t.hoursShort)}` : t.dayOff}</Text>
                </View>
                <Pressable style={[styles.mobileSwitch, active && styles.mobileSwitchActive]} onPress={() => updateDayEnabled(key, date, !active)}>
                  <View style={[styles.mobileSwitchThumb, active && styles.mobileSwitchThumbActive]} />
                </Pressable>
              </View>
              {active ? (
                <View style={styles.staffIntervalsBox}>
                  <Text style={styles.staffTimeLabel}>{t.workIntervals}</Text>
                  <WorkIntervalsEditor
                    t={t}
                    intervals={intervals}
                    onChange={(intervalIndex, field, value) => updateDayInterval(key, date, intervalIndex, field, value)}
                    onAddAfter={(intervalIndex) => addDayInterval(key, date, intervalIndex)}
                    onRemove={(intervalIndex) => removeDayInterval(key, date, intervalIndex)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        <PrimaryButton label={t.saveSchedule} onPress={() => { if (validateScheduleBeforeSave()) void onSaveSchedule(selectedMember, workDraft, customDraft, scheduleMode); }} disabled={busy} />
      </Panel>
    </View>
  );
}

function copyWorkSchedule(schedule: WorkScheduleRecord | undefined, anchorDate = getTodayIso()) {
  const source = schedule || {};
  return Object.fromEntries(
    staffWeekKeys.map((key, index) => {
      const date = shiftDate(getWeekDates(anchorDate)[0], index);
      return [key, normalizeScheduleDay(source[key], date)];
    })
  ) as WorkScheduleRecord;
}

function WorkIntervalsEditor({
  t,
  intervals,
  onChange,
  onAddAfter,
  onRemove,
}: {
  t: Record<string, string>;
  intervals: WorkIntervalRecord[];
  onChange: (index: number, field: keyof WorkIntervalRecord, value: string) => void;
  onAddAfter: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <View style={styles.staffIntervalsStack}>
      {intervals.map((interval, index) => (
        <View key={index} style={styles.staffIntervalRow}>
          <StaffTimeInput label={t.workFrom} value={interval.startTime} onChangeText={(value) => onChange(index, "startTime", value)} />
          <StaffTimeInput label={t.workTo} value={interval.endTime} onChangeText={(value) => onChange(index, "endTime", value)} />
          <View style={styles.staffIntervalActions}>
            <Pressable style={styles.staffIntervalIconButton} onPress={() => onAddAfter(index)} accessibilityLabel={t.addWorkTime}>
              <Ionicons name="add-circle-outline" size={22} color="#334155" />
            </Pressable>
            <Pressable style={styles.staffIntervalIconButton} onPress={() => onRemove(index)} accessibilityLabel={t.removeWorkTime}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function StaffTimeInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.staffTimeField}>
      <Text style={styles.staffTimeLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType="numbers-and-punctuation" style={styles.staffTimeInput} />
    </View>
  );
}

function makeSettingsDraft(workspace: WorkspaceSnapshot | null, language: AppLanguage): SettingsDraftState {
  return {
    firstName: workspace?.professional.firstName || "",
    lastName: workspace?.professional.lastName || "",
    email: workspace?.professional.email || "",
    phone: workspace?.professional.phone || "",
    avatarUrl: workspace?.professional.avatarUrl || "",
    businessName: workspace?.business.name || "",
    website: workspace?.business.website || "",
    accountType: workspace?.business.accountType || "solo",
    serviceMode: workspace?.business.serviceMode || SERVICE_MODE_OPTIONS[0],
    categoriesText: (workspace?.business.categories || []).join(", "),
    country: workspace?.professional.country || "Ukraine",
    timezone: workspace?.professional.timezone || "Europe/Kiev",
    language,
    currency: workspace?.professional.currency || "UAH",
    allowOnlineBooking: workspace?.business.allowOnlineBooking === true,
    address: workspace?.business.address || "",
    addressDetails: workspace?.business.addressDetails || "",
    addressLat: typeof workspace?.business.addressLat === "number" ? workspace.business.addressLat : null,
    addressLon: typeof workspace?.business.addressLon === "number" ? workspace.business.addressLon : null,
  };
}

function settingsSectionLabel(section: MobileSettingsSection, t: Record<string, string>) {
  if (section === "general") return t.settingsGeneral;
  if (section === "online") return t.settingsOnline;
  if (section === "services") return t.settingsServices;
  if (section === "schedule") return t.settingsSchedule;
  if (section === "telegram") return t.settingsTelegram;
  return t.settingsAddress;
}

function SettingsTab({
  t,
  language,
  setLanguage,
  workspace,
  staff,
  apiFetch,
  onRefreshWorkspace,
  setActiveTab,
  activeSection,
  setActiveSection,
  onSignOut,
  busy,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  workspace: WorkspaceSnapshot | null;
  staff: StaffSnapshot | null;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  onRefreshWorkspace: () => void;
  setActiveTab: (tab: AppTab) => void;
  activeSection: MobileSettingsSection;
  setActiveSection: (section: MobileSettingsSection) => void;
  onSignOut: () => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState<SettingsDraftState>(() => makeSettingsDraft(workspace, language));
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [pendingJoinRequests, setPendingJoinRequests] = useState<NonNullable<MobileNotificationsPayload["pendingJoinRequests"]>>([]);
  const [photoDraft, setPhotoDraft] = useState({ url: "", caption: "" });
  const [addressSearchValue, setAddressSearchValue] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestionRecord[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [telegramPanel, setTelegramPanel] = useState<TelegramPanelState | null>(null);
  const [telegramSection, setTelegramSection] = useState<"notifications" | "reminders" | "support">("notifications");
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [isTelegramSaving, setIsTelegramSaving] = useState(false);
  const [telegramError, setTelegramError] = useState("");
  const isOwner = workspace?.membership?.scope !== "member";
  const publicBookingUrl = workspace?.business.publicBookingUrl || "";
  const photos = workspace?.business.photos?.filter((photo) => photo.status !== "blocked") || [];

  useEffect(() => {
    setDraft(makeSettingsDraft(workspace, language));
    setNewPassword("");
    setAddressSearchValue(workspace?.business.address || "");
  }, [workspace, language]);

  useEffect(() => {
    apiFetch("/api/mobile/pro/calendar?mode=notifications")
      .then((payload) => setPendingJoinRequests(payload?.pendingJoinRequests || []))
      .catch(() => setPendingJoinRequests([]));
  }, [workspace?.business.id]);

  useEffect(() => {
    if (activeSection !== "telegram" || telegramPanel || isTelegramLoading) return;
    void loadTelegramPanel(true);
  }, [activeSection, telegramPanel, isTelegramLoading]);

  useEffect(() => {
    const query = addressSearchValue.trim();
    if (activeSection !== "address" || query.length < 3) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/address/search?q=${encodeURIComponent(query)}`, {
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => ({}));
        const results = Array.isArray(payload?.results) ? payload.results : [];
        if (cancelled) return;
        setAddressSuggestions(
          results.map((item: any) => {
            const address = item.address || {};
            const house = String(address.house_number || "");
            const street = String(address.road || address.pedestrian || address.footway || address.neighbourhood || "");
            const city = String(address.city || address.town || address.village || address.municipality || "");
            const region = String(address.state || address.region || address.county || "");
            const country = String(address.country || "");
            const postcode = String(address.postcode || "");
            const displayName = String(item.display_name || "");
            const primaryLine = [street, house].filter(Boolean).join(", ") || displayName.split(",")[0]?.trim() || displayName;
            return {
              label: displayName,
              details: [primaryLine, city, region, postcode, country].filter(Boolean).join("\n"),
              street,
              house,
              city,
              region,
              country,
              postcode,
              lat: Number(item.lat),
              lon: Number(item.lon),
            };
          })
        );
      } catch {
        if (!cancelled) setAddressSuggestions([]);
      } finally {
        if (!cancelled) setIsSearchingAddress(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeSection, addressSearchValue]);

  function updateDraft<K extends keyof SettingsDraftState>(key: K, value: SettingsDraftState[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatusText("");
  }

  async function saveSettings() {
    if (!workspace) return;
    setSaving(true);
    setStatusText("");
    try {
      const nextLanguage: AppLanguage = ["uk", "ru", "en"].includes(draft.language) ? draft.language : language;
      await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({
          professional: {
            firstName: draft.firstName,
            lastName: draft.lastName,
            avatarUrl: draft.avatarUrl,
            email: draft.email,
            phone: draft.phone,
            country: draft.country,
            timezone: draft.timezone,
            language: nextLanguage,
            currency: draft.currency,
          },
          business: isOwner
            ? {
                name: draft.businessName,
                website: draft.website,
                accountType: draft.accountType,
                serviceMode: draft.serviceMode,
                categories: draft.categoriesText.split(",").map((item) => item.trim()).filter(Boolean),
                allowOnlineBooking: draft.allowOnlineBooking,
                address: draft.address,
                addressDetails: draft.addressDetails,
                addressLat: draft.addressLat,
                addressLon: draft.addressLon,
              }
            : undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });
      setLanguage(nextLanguage);
      setNewPassword("");
      setStatusText(t.settingsSaved);
      onRefreshWorkspace();
    } catch (error) {
      Alert.alert(t.settings, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function copyPublicLink() {
    if (!publicBookingUrl) return;
    await Share.share({ message: publicBookingUrl, url: publicBookingUrl }).catch(() => undefined);
  }

  async function openPublicLink() {
    if (!publicBookingUrl) return;
    await Linking.openURL(publicBookingUrl).catch(() => undefined);
  }

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.avatarLink, t.avatarPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    updateDraft("avatarUrl", `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`);
  }

  function removeAvatar() {
    updateDraft("avatarUrl", "");
  }

  async function resolveJoinRequest(requestId: string, action: "approve" | "reject") {
    setSaving(true);
    try {
      await apiFetch("/api/mobile/pro/join-requests", {
        method: "POST",
        body: JSON.stringify({ requestId, action }),
      });
      setPendingJoinRequests((items) => items.filter((item) => item.id !== requestId));
      onRefreshWorkspace();
    } catch (error) {
      Alert.alert(t.joinRequests, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function saveBusinessPhotos(nextPhotos: BusinessPhotoRecord[]) {
    if (!workspace || !isOwner) return;
    setSaving(true);
    setStatusText("");
    try {
      await apiFetch("/api/mobile/pro/settings", {
        method: "PATCH",
        body: JSON.stringify({ business: { photos: nextPhotos } }),
      });
      setStatusText(t.settingsSaved);
      onRefreshWorkspace();
    } catch (error) {
      Alert.alert(t.businessPhotos, error instanceof Error ? error.message : t.settingsSaveError);
    } finally {
      setSaving(false);
    }
  }

  function addBusinessPhoto() {
    const url = photoDraft.url.trim();
    if (!url) {
      Alert.alert(t.businessPhotos, t.requiredText);
      return;
    }
    const nextPhoto: BusinessPhotoRecord = {
      id: createLocalId("photo"),
      url,
      caption: photoDraft.caption.trim(),
      isPrimary: photos.length === 0,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    setPhotoDraft({ url: "", caption: "" });
    void saveBusinessPhotos([...photos, nextPhoto]);
  }

  async function pickBusinessPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.businessPhotos, t.avatarPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.82,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    const nextPhoto: BusinessPhotoRecord = {
      id: createLocalId("photo"),
      url: `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`,
      caption: photoDraft.caption.trim(),
      isPrimary: photos.length === 0,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    setPhotoDraft({ url: "", caption: "" });
    void saveBusinessPhotos([...photos, nextPhoto]);
  }

  function makePrimaryPhoto(photoId: string) {
    void saveBusinessPhotos(photos.map((photo) => ({ ...photo, isPrimary: photo.id === photoId })));
  }

  function removeBusinessPhoto(photoId: string) {
    const remaining = photos.filter((photo) => photo.id !== photoId);
    const hasPrimary = remaining.some((photo) => photo.isPrimary);
    void saveBusinessPhotos(remaining.map((photo, index) => ({ ...photo, isPrimary: hasPrimary ? photo.isPrimary : index === 0 })));
  }

  function applyAddressSuggestion(suggestion: AddressSuggestionRecord) {
    updateDraft("address", suggestion.label);
    updateDraft("addressDetails", suggestion.details);
    updateDraft("addressLat", Number.isFinite(suggestion.lat) ? suggestion.lat : null);
    updateDraft("addressLon", Number.isFinite(suggestion.lon) ? suggestion.lon : null);
    if (suggestion.country) {
      updateDraft("country", suggestion.country);
      updateDraft("currency", inferCurrency(suggestion.country));
    }
    setAddressSearchValue(suggestion.label);
    setAddressSuggestions([]);
  }

  async function openMap() {
    if (typeof draft.addressLat === "number" && typeof draft.addressLon === "number") {
      await Linking.openURL(`https://www.openstreetmap.org/?mlat=${draft.addressLat}&mlon=${draft.addressLon}#map=16/${draft.addressLat}/${draft.addressLon}`).catch(() => undefined);
      return;
    }
    if (draft.address.trim()) {
      await Linking.openURL(`https://www.openstreetmap.org/search?query=${encodeURIComponent(draft.address.trim())}`).catch(() => undefined);
    }
  }

  async function loadTelegramPanel(silent = false) {
    if (!silent) setIsTelegramLoading(true);
    setTelegramError("");
    try {
      const payload = await apiFetch("/api/mobile/pro/telegram/connect");
      setTelegramPanel(normalizeTelegramPanel(payload, telegramPanel));
    } catch (error) {
      setTelegramError(error instanceof Error ? error.message : t.telegramSaveFailed);
    } finally {
      setIsTelegramLoading(false);
    }
  }

  async function updateTelegramSettings(patch: Partial<TelegramPanelState["settings"]>) {
    setIsTelegramSaving(true);
    setTelegramError("");
    try {
      const payload = await apiFetch("/api/mobile/pro/telegram/connect", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setTelegramPanel(normalizeTelegramPanel(payload, telegramPanel));
      setStatusText(t.telegramSaved);
      onRefreshWorkspace();
    } catch (error) {
      setTelegramError(error instanceof Error ? error.message : t.telegramSaveFailed);
    } finally {
      setIsTelegramSaving(false);
    }
  }

  function toggleTelegramSetting(key: TelegramBooleanSettingKey) {
    if (!telegramPanel || isTelegramSaving) return;
    void updateTelegramSettings({ [key]: !telegramPanel.settings[key] });
  }

  async function openTelegramBot() {
    if (!telegramPanel?.deepLink) return;
    await Linking.openURL(telegramPanel.deepLink).catch(() => undefined);
  }

  async function shareTelegramLink() {
    if (!telegramPanel?.deepLink) return;
    await Share.share({ message: telegramPanel.deepLink, url: telegramPanel.deepLink }).catch(() => undefined);
  }

  return (
    <View style={styles.sectionStack}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.settingsSectionRail}>
        {SETTINGS_SECTIONS.map((section) => (
          <Pressable
            key={section}
            style={[styles.settingsSectionChip, activeSection === section && styles.settingsSectionChipActive]}
            onPress={() => setActiveSection(section)}
          >
            <Text style={[styles.settingsSectionText, activeSection === section && styles.settingsSectionTextActive]}>{settingsSectionLabel(section, t)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {statusText ? <Text style={styles.settingsStatusText}>{statusText}</Text> : null}
      {!isOwner ? <Text style={styles.settingsMutedNotice}>{t.ownerOnlyHint}</Text> : null}

      {activeSection === "general" ? (
        <>
          <Panel title={t.ownerContacts}>
            <View style={styles.settingsAvatarRow}>
              {draft.avatarUrl ? (
                <Image source={{ uri: draft.avatarUrl }} style={styles.settingsAvatarImage} />
              ) : (
                <View style={styles.settingsAvatar}>
                  <Text style={styles.settingsAvatarText}>{(draft.firstName || draft.email || "T").slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.settingsAvatarInfo}>
                <Text style={styles.settingsCardTitle}>{t.avatarLink}</Text>
                <Text style={styles.clientOptionCaption}>{t.avatarHint}</Text>
                <View style={styles.settingsAvatarActions}>
                  <SecondaryButton label={t.changeAvatar} onPress={pickAvatar} disabled={saving || busy} />
                  <SecondaryButton label={t.deleteAvatar} onPress={removeAvatar} disabled={saving || busy || !draft.avatarUrl} />
                </View>
              </View>
            </View>
            <Field label={t.firstName} value={draft.firstName} onChangeText={(value) => updateDraft("firstName", value)} />
            <Field label={t.lastName} value={draft.lastName} onChangeText={(value) => updateDraft("lastName", value)} />
            <Field label={t.email} value={draft.email} onChangeText={(value) => updateDraft("email", value)} keyboardType="email-address" autoCapitalize="none" />
            <Field label={t.phone} value={draft.phone} onChangeText={(value) => updateDraft("phone", value)} keyboardType="phone-pad" />
            <Field label={t.newPassword} hint={t.leaveBlankPassword} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          </Panel>

          <Panel title={t.businessFormat}>
            <Field label={t.companyName} value={draft.businessName} editable={isOwner} onChangeText={(value) => updateDraft("businessName", value)} />
            <Field label={t.website} value={draft.website} editable={isOwner} onChangeText={(value) => updateDraft("website", value)} placeholder="www.yoursite.com" autoCapitalize="none" />
            <Text style={styles.label}>{t.accountType}</Text>
            <View style={styles.settingsChoiceRow}>
              {[
                { value: "solo" as const, label: t.soloAccount },
                { value: "team" as const, label: t.teamAccount },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  disabled={!isOwner}
                  style={[styles.settingsChoice, draft.accountType === item.value && styles.settingsChoiceActive]}
                  onPress={() => updateDraft("accountType", item.value)}
                >
                  <Text style={[styles.settingsChoiceText, draft.accountType === item.value && styles.settingsChoiceTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Panel>

          <Panel title={t.localization}>
            <LanguageSwitch language={draft.language} setLanguage={(value) => updateDraft("language", value)} />
            <SettingsOptionRail label={t.country} value={draft.country} options={COUNTRY_OPTIONS} onSelect={(value) => updateDraft("country", value)} />
            <SettingsOptionRail label={t.timezone} value={draft.timezone} options={TIMEZONE_OPTIONS} onSelect={(value) => updateDraft("timezone", value)} renderLabel={(value) => TIMEZONE_LABELS[value] || value} />
            <SettingsOptionRail label={t.currency} value={draft.currency} options={CURRENCY_OPTIONS} onSelect={(value) => updateDraft("currency", value)} />
          </Panel>

          <Panel title={t.joinRequests}>
            {pendingJoinRequests.length === 0 ? <Text style={styles.emptyText}>{t.noJoinRequests}</Text> : null}
            {pendingJoinRequests.map((request) => (
              <View key={request.id} style={styles.joinRequestCard}>
                <View>
                  <Text style={styles.settingsMiniTitle}>{request.professionalName}</Text>
                  <Text style={styles.clientOptionCaption}>{request.role}</Text>
                </View>
                <View style={styles.joinRequestActions}>
                  <Pressable style={styles.joinApproveButton} onPress={() => resolveJoinRequest(request.id, "approve")} disabled={saving}>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </Pressable>
                  <Pressable style={styles.joinRejectButton} onPress={() => resolveJoinRequest(request.id, "reject")} disabled={saving}>
                    <Ionicons name="close" size={18} color="#DC2626" />
                  </Pressable>
                </View>
              </View>
            ))}
          </Panel>
        </>
      ) : null}

      {activeSection === "online" ? (
        <Panel title={t.settingsOnline}>
          <Pressable style={styles.shareToggleRow} onPress={() => updateDraft("allowOnlineBooking", !draft.allowOnlineBooking)} disabled={!isOwner}>
            <View>
              <Text style={styles.shareToggleTitle}>{draft.allowOnlineBooking ? t.onlineBookingOn : t.onlineBookingOff}</Text>
              <Text style={styles.clientOptionCaption}>{workspace?.business.name || t.companyName}</Text>
            </View>
            <View style={[styles.mobileSwitch, draft.allowOnlineBooking && styles.mobileSwitchActive]}>
              <View style={[styles.mobileSwitchThumb, draft.allowOnlineBooking && styles.mobileSwitchThumbActive]} />
            </View>
          </Pressable>
          <InfoLine label={t.publicLink} value={publicBookingUrl || t.empty} />
          <View style={styles.settingsActionRow}>
            <SecondaryButton label={t.openPage} onPress={openPublicLink} disabled={!publicBookingUrl} />
            <SecondaryButton label={t.copyLink} onPress={copyPublicLink} disabled={!publicBookingUrl} />
          </View>
        </Panel>
      ) : null}

      {activeSection === "services" ? (
        <>
          <Panel title={t.businessFormat}>
            <Text style={styles.label}>{t.serviceMode}</Text>
            <View style={styles.settingsStackedChoices}>
              {SERVICE_MODE_OPTIONS.map((item) => (
                <Pressable
                  key={item}
                  disabled={!isOwner}
                  style={[styles.settingsLongChoice, draft.serviceMode === item && styles.settingsChoiceActive]}
                  onPress={() => updateDraft("serviceMode", item)}
                >
                  <Text style={[styles.settingsChoiceText, draft.serviceMode === item && styles.settingsChoiceTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Field label={t.categoriesText} hint={t.categoriesHint} value={draft.categoriesText} editable={isOwner} onChangeText={(value) => updateDraft("categoriesText", value)} />
          </Panel>

          <Panel title={t.settingsServices}>
            <View style={styles.settingsSummaryGrid}>
              <View style={styles.settingsSummaryTile}>
                <Text style={styles.statValue}>{workspace?.services.length || 0}</Text>
                <Text style={styles.statLabel}>{t.yourServices}</Text>
              </View>
              <View style={styles.settingsSummaryTile}>
                <Text style={styles.statValue}>{workspace?.business.categories?.length || 0}</Text>
                <Text style={styles.statLabel}>{t.categoriesText}</Text>
              </View>
            </View>
            <Text style={styles.emptyText}>{t.myServicesHint}</Text>
            {(workspace?.services || []).slice(0, 4).map((service) => (
              <View key={service.id} style={styles.settingsMiniRow}>
                <View style={[styles.serviceDot, { backgroundColor: service.color || "#8ED1F2" }]} />
                <View style={styles.settingsMiniInfo}>
                  <Text style={styles.settingsMiniTitle}>{service.name}</Text>
                  <Text style={styles.clientOptionCaption}>{service.durationMinutes || 0} хв</Text>
                </View>
                <Text style={styles.settingsMiniPrice}>{formatMoney(service.price, workspace?.professional.currency || "UAH")}</Text>
              </View>
            ))}
            <SecondaryButton label={t.manageServices} onPress={() => setActiveTab("services")} />
          </Panel>

          <Panel title={t.businessPhotos}>
            <Text style={styles.emptyText}>{t.photosHint}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.settingsPhotoRail}>
              {photos.length ? photos.map((photo) => (
                <View key={photo.id} style={styles.settingsPhotoCard}>
                  <Image source={{ uri: photo.url }} style={styles.settingsPhoto} />
                  <View style={styles.settingsPhotoActions}>
                    <Text style={styles.settingsPhotoBadge}>{photo.isPrimary ? t.primaryPhoto : photo.caption || t.businessPhotos}</Text>
                    {!photo.isPrimary ? <SecondaryButton label={t.makePrimary} onPress={() => makePrimaryPhoto(photo.id)} disabled={!isOwner || saving} /> : null}
                    <SecondaryButton label={t.delete} onPress={() => removeBusinessPhoto(photo.id)} disabled={!isOwner || saving} />
                  </View>
                </View>
              )) : (
                <View style={styles.settingsPhotoPlaceholder}>
                  <Ionicons name="image-outline" size={24} color="#94A3B8" />
                </View>
              )}
            </ScrollView>
            <Field label={t.photoUrl} value={photoDraft.url} editable={isOwner} onChangeText={(value) => setPhotoDraft((current) => ({ ...current, url: value }))} placeholder="https://..." autoCapitalize="none" />
            <Field label={t.photoCaption} value={photoDraft.caption} editable={isOwner} onChangeText={(value) => setPhotoDraft((current) => ({ ...current, caption: value }))} />
            <View style={styles.settingsActionRow}>
              <SecondaryButton label={t.uploadPhoto} onPress={pickBusinessPhoto} disabled={!isOwner || saving} />
              <SecondaryButton label={t.addPhoto} onPress={addBusinessPhoto} disabled={!isOwner || saving} />
            </View>
          </Panel>
        </>
      ) : null}

      {activeSection === "schedule" ? (
        <Panel title={t.settingsSchedule}>
          <View style={styles.settingsSummaryGrid}>
            <View style={styles.settingsSummaryTile}>
              <Text style={styles.statValue}>{staff?.summary?.totalPeople || staff?.members.length || 1}</Text>
              <Text style={styles.statLabel}>{t.staff}</Text>
            </View>
            <View style={styles.settingsSummaryTile}>
              <Text style={styles.statValue}>{workspace?.memberSchedule?.workScheduleMode === "flexible" ? t.compact : t.weekView}</Text>
              <Text style={styles.statLabel}>{t.staffSchedule}</Text>
            </View>
          </View>
          <Text style={styles.emptyText}>{t.staffScheduleHint}</Text>
          <SecondaryButton label={t.manageSchedule} onPress={() => setActiveTab("staff")} />
        </Panel>
      ) : null}

      {activeSection === "telegram" ? (
        <Panel title={t.settingsTelegram}>
          <View style={styles.telegramStatus}>
            <View style={[styles.telegramDot, telegramPanel?.connected || workspace?.telegram?.connected ? styles.telegramDotConnected : styles.telegramDotDisconnected]} />
            <View style={styles.settingsMiniInfo}>
              <Text style={styles.settingsCardTitle}>{telegramPanel?.connected || workspace?.telegram?.connected ? t.connected : t.notConnected}</Text>
              <Text style={styles.clientOptionCaption}>{telegramPanel?.chatId || workspace?.telegram?.chatId || t.telegramHint}</Text>
            </View>
          </View>
          {telegramError ? <Text style={styles.settingsMutedNotice}>{telegramError}</Text> : null}
          {isTelegramLoading ? <ActivityIndicator color="#6D4AFF" /> : null}
          {telegramPanel ? (
            <>
              <InfoLine label={t.telegramTokenExpires} value={telegramPanel.tokenExpiresAt || t.empty} />
              <View style={styles.settingsActionRow}>
                <SecondaryButton label={telegramPanel.connected ? t.telegramOpenBot : t.telegramConnectButton} onPress={openTelegramBot} disabled={!telegramPanel.deepLink} />
                <SecondaryButton label={t.telegramCopyLink} onPress={shareTelegramLink} disabled={!telegramPanel.deepLink} />
                <SecondaryButton label={t.telegramRefreshLink} onPress={() => void loadTelegramPanel()} disabled={isTelegramLoading || isTelegramSaving} />
              </View>
              <View style={styles.servicesModeRow}>
                {[
                  { id: "notifications" as const, label: t.telegramSectionNotifications },
                  { id: "reminders" as const, label: t.telegramSectionReminders },
                  { id: "support" as const, label: t.telegramSectionSupport },
                ].map((item) => (
                  <Pressable key={item.id} style={[styles.servicesModeButton, telegramSection === item.id && styles.servicesModeButtonActive]} onPress={() => setTelegramSection(item.id)}>
                    <Text style={[styles.servicesModeText, telegramSection === item.id && styles.servicesModeTextActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              {telegramSection === "notifications" ? (
                <View>
                  <Text style={styles.emptyText}>{t.telegramNotificationsHint}</Text>
                  <SettingsToggleRow label={t.telegramOnlineBookings} value={telegramPanel.settings.notificationsNewBooking} onPress={() => toggleTelegramSetting("notificationsNewBooking")} disabled={isTelegramSaving} />
                  <SettingsToggleRow label={t.telegramCabinetBookings} value={telegramPanel.settings.notificationsCabinetBooking} onPress={() => toggleTelegramSetting("notificationsCabinetBooking")} disabled={isTelegramSaving} />
                  <SettingsToggleRow label={t.telegramRescheduled} value={telegramPanel.settings.notificationsRescheduled} onPress={() => toggleTelegramSetting("notificationsRescheduled")} disabled={isTelegramSaving} />
                  <SettingsToggleRow label={t.telegramCancelled} value={telegramPanel.settings.notificationsCancelled} onPress={() => toggleTelegramSetting("notificationsCancelled")} disabled={isTelegramSaving} />
                </View>
              ) : null}
              {telegramSection === "reminders" ? (
                <View>
                  <Text style={styles.emptyText}>{t.telegramRemindersHint}</Text>
                  <SettingsToggleRow label={t.telegramReminders} value={telegramPanel.settings.notificationsReminder} onPress={() => toggleTelegramSetting("notificationsReminder")} disabled={isTelegramSaving} />
                  <SettingsToggleRow label={t.telegramToday} value={telegramPanel.settings.notificationsToday} onPress={() => toggleTelegramSetting("notificationsToday")} disabled={isTelegramSaving} />
                  <SettingsOptionRail
                    label={t.telegramReminderLead}
                    value={String(telegramPanel.settings.reminderLeadMinutes)}
                    options={TELEGRAM_REMINDER_LEAD_OPTIONS.map(String)}
                    onSelect={(value) => void updateTelegramSettings({ reminderLeadMinutes: Number(value) || 120 })}
                    renderLabel={(value) => formatReminderLead(Number(value), t)}
                  />
                </View>
              ) : null}
              {telegramSection === "support" ? (
                <View>
                  <Text style={styles.emptyText}>{t.telegramSupportHint}</Text>
                  <SettingsToggleRow label={t.telegramForwarding} value={telegramPanel.settings.forwardingEnabled} onPress={() => toggleTelegramSetting("forwardingEnabled")} disabled={isTelegramSaving} />
                </View>
              ) : null}
            </>
          ) : (
            <SecondaryButton label={t.telegramRefreshLink} onPress={() => void loadTelegramPanel()} disabled={isTelegramLoading} />
          )}
        </Panel>
      ) : null}

      {activeSection === "address" ? (
        <Panel title={t.settingsAddress}>
          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <Text style={styles.label}>{t.addressSearch}</Text>
            </View>
            <SearchInput
              value={addressSearchValue}
              onChangeText={setAddressSearchValue}
              placeholder={t.addressPlaceholder}
              editable={isOwner}
              selectTextOnFocus
            />
          </View>
          {isSearchingAddress ? <Text style={styles.emptyText}>{t.searchingAddress}</Text> : null}
          {addressSuggestions.map((suggestion) => (
            <Pressable key={`${suggestion.label}-${suggestion.lat}-${suggestion.lon}`} style={styles.addressSuggestionCard} onPress={() => applyAddressSuggestion(suggestion)}>
              <View style={styles.settingsMiniInfo}>
                <Text style={styles.settingsMiniTitle}>{[suggestion.street, suggestion.house].filter(Boolean).join(", ") || suggestion.label}</Text>
                <Text style={styles.clientOptionCaption}>{[suggestion.city, suggestion.region, suggestion.postcode, suggestion.country].filter(Boolean).join(", ")}</Text>
              </View>
              <Text style={styles.addressSuggestionAction}>{t.selectAddress}</Text>
            </Pressable>
          ))}
          <Field label={t.streetAddress} value={draft.address} editable={isOwner} onChangeText={(value) => updateDraft("address", value)} />
          <View style={styles.field}>
            <Text style={styles.label}>{t.addressDetails}</Text>
            <TextInput
              value={draft.addressDetails}
              editable={isOwner}
              onChangeText={(value) => updateDraft("addressDetails", value)}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
              style={[styles.input, styles.settingsMultilineInput, !isOwner && styles.inputDisabled]}
            />
          </View>
          <View style={styles.settingsSummaryGrid}>
            <View style={styles.settingsSummaryTile}>
              <Text style={styles.statLabel}>{t.streetHouse}</Text>
              <Text style={styles.settingsMiniTitle}>{draft.addressDetails.split("\n")[0] || draft.address || t.empty}</Text>
            </View>
            <View style={styles.settingsSummaryTile}>
              <Text style={styles.statLabel}>{t.country}</Text>
              <Text style={styles.settingsMiniTitle}>{draft.country || t.empty}</Text>
            </View>
          </View>
          <InfoLine label={t.selectedAddress} value={typeof draft.addressLat === "number" && typeof draft.addressLon === "number" ? `${draft.addressLat.toFixed(5)}, ${draft.addressLon.toFixed(5)}` : t.empty} />
          <View style={styles.settingsActionRow}>
            <SecondaryButton label={t.openMap} onPress={openMap} disabled={!draft.address && typeof draft.addressLat !== "number"} />
          </View>
        </Panel>
      ) : null}

      <Panel title={t.profileAndBusiness}>
        <PrimaryButton label={saving ? t.signingIn : t.saveSettings} onPress={saveSettings} disabled={saving || busy || !workspace} />
        <SecondaryButton label={t.signOut} onPress={onSignOut} disabled={busy || saving} />
      </Panel>
    </View>
  );
}

function SettingsToggleRow({ label, value, onPress, disabled }: { label: string; value: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable style={[styles.settingsToggleRow, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.settingsToggleText}>{label}</Text>
      <View style={[styles.mobileSwitch, value && styles.mobileSwitchActive]}>
        <View style={[styles.mobileSwitchThumb, value && styles.mobileSwitchThumbActive]} />
      </View>
    </Pressable>
  );
}

function SettingsOptionRail({
  label,
  value,
  options,
  onSelect,
  renderLabel,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  renderLabel?: (value: string) => string;
}) {
  return (
    <View style={styles.settingsOptionBlock}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.settingsOptionRail}>
        {options.map((item) => (
          <Pressable key={item} style={[styles.choiceChip, value === item && styles.choiceChipActive]} onPress={() => onSelect(item)}>
            <Text style={[styles.choiceText, value === item && styles.choiceTextActive]}>{renderLabel ? renderLabel(item) : item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <Image source={WORDMARK} style={[styles.wordmark, compact && styles.wordmarkCompact]} resizeMode="contain" />;
}

function LanguageSwitch({
  language,
  setLanguage,
}: {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}) {
  return (
    <View style={styles.languageRow}>
      {(["uk", "ru", "en"] as AppLanguage[]).map((item) => (
        <Pressable key={item} onPress={() => setLanguage(item)} style={[styles.languageButton, language === item && styles.languageButtonActive]}>
          <Text style={[styles.languageText, language === item && styles.languageTextActive]}>{languageNames[item]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({
  label,
  hint,
  ...props
}: {
  label: string;
  hint?: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <TextInput {...props} autoCorrect={false} placeholderTextColor="#94A3B8" style={[styles.input, props.editable === false && styles.inputDisabled]} />
    </View>
  );
}

function SearchInput({
  value,
  onChangeText,
  placeholder,
  editable = true,
  selectTextOnFocus,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable?: boolean;
  selectTextOnFocus?: boolean;
}) {
  return (
    <View style={[styles.searchInputShell, !editable && styles.inputDisabled]}>
      <Ionicons name="search" size={18} color="#64748B" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        autoCorrect={false}
        editable={editable}
        selectTextOnFocus={selectTextOnFocus}
        style={styles.searchInput}
      />
      {editable && value.trim() ? (
        <Pressable style={styles.searchClearButton} onPress={() => onChangeText("")}>
          <Ionicons name="close" size={16} color="#64748B" />
        </Pressable>
      ) : null}
    </View>
  );
}

function InlineClientInput({
  label,
  ...props
}: {
  label: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inlineClientField}>
      <Text style={styles.inlineClientLabel}>{label}</Text>
      <TextInput
        {...props}
        autoCorrect={false}
        placeholderTextColor="#94A3B8"
        style={styles.inlineClientInput}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.primaryButton, disabled && styles.disabled]} disabled={disabled}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.secondaryButton, disabled && styles.disabled]} disabled={disabled}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function StatTile({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statCaption}>{caption}</Text>
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F8FC",
  },
  authScreen: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  keyboard: {
    flex: 1,
  },
  authContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  wordmark: {
    width: 132,
    height: 38,
  },
  wordmarkCompact: {
    width: 118,
    height: 34,
  },
  authIntro: {
    alignItems: "center",
    marginBottom: 18,
  },
  authIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    marginBottom: 10,
  },
  authTitle: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  authSubtitle: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  languageRow: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "#EEF2F7",
  },
  languageButton: {
    minWidth: 40,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  languageButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9D2FF",
    shadowColor: "#6D4AFF",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  languageText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },
  languageTextActive: {
    color: "#5B4BDB",
  },
  authCard: {
    width: "100%",
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6ECF5",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
  },
  segment: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#EEF2F7",
  },
  segmentButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  segmentButtonActive: {
    borderWidth: 1,
    borderColor: "#D9D2FF",
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#5B4BDB",
  },
  form: {
    gap: 12,
  },
  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },
  field: {
    flex: 1,
    gap: 7,
  },
  fieldHeader: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    flexShrink: 1,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  hint: {
    flexShrink: 1,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: "#F8FAFC",
    color: "#475569",
  },
  primaryButton: {
    minHeight: 56,
    marginTop: 4,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D4AFF",
    paddingHorizontal: 18,
    shadowColor: "#6D4AFF",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  dangerButton: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
  },
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.62,
  },
  appScreen: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  nativeHeader: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  headerTitleStack: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  nativeHeaderTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
  },
  headerBusinessInline: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  nativeHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#FFFFFF",
  },
  headerIconBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D4AFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  headerIconBadgeRed: {
    backgroundColor: "#EF4444",
  },
  headerIconBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
  headerIconButtonActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#7047EE",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  headerIconButtonCyan: {
    borderColor: "#BAE6FD",
    backgroundColor: "#ECFEFF",
  },
  profilePill: {
    height: 34,
    minWidth: 52,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  smallAvatar: {
    width: 25,
    height: 25,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9A7A72",
  },
  smallAvatarText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  headerPanelBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  headerPanel: {
    maxHeight: "88%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  headerPanelTop: {
    minHeight: 88,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#18AFC0",
  },
  headerPanelEyebrow: {
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  headerPanelTitle: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  headerPanelClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  headerPanelBody: {
    padding: 16,
  },
  panelHint: {
    color: "#4B5563",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  setupProgressRow: {
    marginTop: 14,
    marginBottom: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    backgroundColor: "#F3E8FF",
  },
  setupProgressTitle: {
    color: "#4C1D95",
    fontSize: 14,
    fontWeight: "900",
  },
  setupProgressValue: {
    color: "#4C1D95",
    fontSize: 16,
    fontWeight: "900",
  },
  setupStep: {
    minHeight: 58,
    marginTop: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  setupStepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E8FF",
  },
  setupStepIconDone: {
    backgroundColor: "#22C55E",
  },
  setupStepText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  shareToggleRow: {
    marginTop: 14,
    minHeight: 72,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
  },
  shareToggleTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  mobileSwitch: {
    width: 54,
    height: 32,
    padding: 3,
    borderRadius: 16,
    backgroundColor: "#CBD5E1",
  },
  mobileSwitchActive: {
    backgroundColor: "#6D4AFF",
  },
  mobileSwitchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
  mobileSwitchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  shareUrlInput: {
    minHeight: 48,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    color: "#475569",
    backgroundColor: "#F8FAFC",
  },
  headerPanelActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  headerGhostButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  headerGhostButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  headerPrimaryButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#6D4AFF",
    shadowColor: "#6D4AFF",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
  },
  headerPrimaryButtonFull: {
    flex: 0,
  },
  headerPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  headerPanelKeyboard: {
    flexShrink: 1,
  },
  headerPanelScrollBody: {
    flexShrink: 1,
  },
  supportPanelContent: {
    padding: 16,
    paddingBottom: 12,
  },
  supportPanelFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  supportGuideCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  supportGuideTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
  supportTicket: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: "hidden",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "#5B4BDB",
  },
  supportBubble: {
    marginTop: 14,
    maxWidth: "86%",
    padding: 12,
    borderRadius: 14,
    overflow: "hidden",
    color: "#171717",
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: "#F1F2F4",
  },
  supportInput: {
    minHeight: 92,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8CFC7",
    color: "#0F172A",
    textAlignVertical: "top",
  },
  supportStatusText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  notificationHeading: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationHeadingText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  notificationBadgeText: {
    minWidth: 28,
    paddingVertical: 6,
    borderRadius: 14,
    overflow: "hidden",
    textAlign: "center",
    color: "#6D4AFF",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "#EEF2FF",
  },
  notificationEmptyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#F8FAFC",
  },
  notificationCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  notificationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  notificationCardTitle: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  notificationService: {
    marginTop: 10,
    color: "#667085",
    fontSize: 14,
    fontWeight: "700",
  },
  notificationStatusPill: {
    marginTop: 10,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#FEF3C7",
  },
  notificationStatusConfirmed: {
    backgroundColor: "#D1FAE5",
  },
  notificationStatusCancelled: {
    backgroundColor: "#FCE7F3",
  },
  notificationStatusText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "900",
  },
  notificationStatusConfirmedText: {
    color: "#047857",
  },
  notificationStatusCancelledText: {
    color: "#BE123C",
  },
  accountMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  accountAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EC4899",
  },
  accountAvatarLargeText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },
  accountName: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  accountMenuItem: {
    minHeight: 54,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  accountMenuItemText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  accountMenuLabel: {
    marginTop: 14,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  accountLanguageRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  accountLanguageButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
  },
  accountLanguageButtonActive: {
    borderColor: "#A5B4FC",
    backgroundColor: "#EEF2FF",
  },
  accountLanguageText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  accountLanguageTextActive: {
    color: "#6D4AFF",
  },
  accountLogout: {
    minHeight: 54,
    justifyContent: "center",
  },
  accountLogoutText: {
    color: "#E11D48",
    fontSize: 15,
    fontWeight: "900",
  },
  calendarScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  calendarToolbar: {
    minHeight: 54,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  toolbarSpacer: {
    flex: 1,
  },
  modeButton: {
    minWidth: 54,
    maxWidth: 92,
    flexShrink: 1,
    height: 38,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  modeButtonActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#F3E8FF",
  },
  modeButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  modeButtonTextActive: {
    color: "#4C1D95",
  },
  dateStrip: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  dateStripContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 7,
  },
  dateChip: {
    height: 32,
    minWidth: 62,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  dateChipActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#F3E8FF",
  },
  dateChipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
  },
  dateChipTextActive: {
    color: "#4C1D95",
  },
  masterStrip: {
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  masterAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9A7A72",
    overflow: "hidden",
  },
  memberAvatarImage: {
    resizeMode: "cover",
  },
  masterAvatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  masterName: {
    marginTop: 5,
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "900",
  },
  calendarScroll: {
    flex: 1,
    minHeight: 0,
  },
  calendarContent: {
    paddingBottom: 10,
  },
  teamCalendarHorizontal: {
    flex: 1,
  },
  teamCalendarHorizontalContent: {
    alignItems: "stretch",
  },
  teamCalendarBoard: {
    flex: 1,
  },
  teamCalendarHeaderRow: {
    flexDirection: "row",
    height: 70,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  teamCalendarBodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  teamPickerRail: {
    width: 54,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  teamPickerRailBody: {
    width: 54,
    alignSelf: "stretch",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  timeAxisColumn: {
    width: 54,
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  timeAxisHour: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "flex-end",
  },
  timeAxisCurrentDot: {
    position: "absolute",
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F43F5E",
    backgroundColor: "#FFFFFF",
    zIndex: 5,
  },
  teamPickerButton: {
    width: 44,
    height: 44,
    marginTop: 12,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  teamPickerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#6D4AFF",
  },
  teamPickerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  teamDayColumn: {
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  teamDayHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  teamPickerMenu: {
    width: "82%",
    maxHeight: "72%",
    marginLeft: 48,
    marginTop: 132,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  teamPickerSectionTitle: {
    marginTop: 12,
    marginBottom: 7,
    color: "#7B8498",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  teamPickerList: {
    maxHeight: 360,
  },
  teamPickerOption: {
    minHeight: 66,
    marginBottom: 7,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  teamPickerOptionActive: {
    backgroundColor: "#EEF2FF",
  },
  teamPickerOptionTitleActive: {
    color: "#5B21F3",
  },
  teamCheckBox: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  teamCheckBoxActive: {
    borderColor: "#6D4AFF",
    backgroundColor: "#6D4AFF",
  },
  overviewScroll: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },
  summaryStrip: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  teamOverviewContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  teamOverviewGrid: {
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  teamOverviewHeaderRow: {
    flexDirection: "row",
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  teamOverviewMemberHeader: {
    width: 78,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  teamOverviewDateHeader: {
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  teamOverviewDateHeaderActive: {
    backgroundColor: "#F3E8FF",
  },
  teamOverviewDateNumber: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  teamOverviewDateWeekday: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },
  teamOverviewRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  teamOverviewMemberCell: {
    width: 78,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  teamOverviewMemberName: {
    marginTop: 6,
    textAlign: "center",
    color: "#0F172A",
    fontSize: 11,
    lineHeight: 12,
    fontWeight: "900",
  },
  teamOverviewDayCell: {
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  teamOverviewDayCellActive: {
    borderWidth: 2,
    borderColor: "#B9A8FF",
    backgroundColor: "#FBFAFF",
  },
  teamOverviewAppointmentBar: {
    height: 18,
    marginBottom: 5,
    paddingHorizontal: 5,
    justifyContent: "center",
    borderRadius: 5,
  },
  teamOverviewAppointmentText: {
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "900",
  },
  teamOverviewMoreText: {
    color: "#6D4AFF",
    fontSize: 11,
    fontWeight: "900",
  },
  summaryCard: {
    minHeight: 214,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  summaryCardActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#FAF7FF",
  },
  summaryCardClosed: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  summaryHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryDate: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  summaryDateActive: {
    color: "#6D4AFF",
  },
  summaryDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#7047EE",
  },
  summaryHours: {
    marginTop: 8,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryHoursRow: {
    marginTop: 8,
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  summaryHoursPart: {
    color: "#0F172A",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "900",
  },
  summaryClosedText: {
    color: "#64748B",
    fontSize: 16,
  },
  summaryCount: {
    marginTop: 8,
    color: "#5B21B6",
    fontSize: 13,
    fontWeight: "900",
  },
  dayCountBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#6D4AFF",
  },
  dayCountBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  summaryClosedBadge: {
    marginTop: 8,
    height: 30,
    paddingHorizontal: 9,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    backgroundColor: "#EEF2F7",
  },
  summaryClosedBadgeText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryVisitsLine: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  summaryCountCompact: {
    color: "#94A3B8",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
  },
  summaryCountCompactActive: {
    color: "#6D4AFF",
  },
  summaryAppointments: {
    marginTop: 12,
    gap: 7,
  },
  summaryAppointment: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#FFE4DB",
  },
  summaryAppointmentTime: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
  },
  summaryAppointmentText: {
    marginTop: 2,
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  summaryAddButton: {
    height: 38,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
  },
  summaryAddText: {
    color: "#5B21B6",
    fontSize: 12,
    fontWeight: "900",
  },
  openDayButton: {
    marginTop: "auto",
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  openDayButtonText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
  },
  monthGrid: {
    padding: 10,
    paddingBottom: 130,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  monthCell: {
    width: "12.85%",
    minHeight: 74,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#FFFFFF",
  },
  monthCellTop: {
    minHeight: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  monthCellActive: {
    borderColor: "#F43F5E",
    borderWidth: 2,
    backgroundColor: "#FFF7F8",
  },
  monthCellMuted: {
    opacity: 0.45,
  },
  monthDayNumber: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  monthWorkText: {
    color: "#64748B",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
  },
  compactWorkTime: {
    marginTop: 5,
    minHeight: 20,
    width: "100%",
  },
  closedBadge: {
    marginTop: 7,
    height: 24,
    paddingHorizontal: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 7,
    backgroundColor: "#EEF2F7",
  },
  closedBadgeText: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  visitMiniLine: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  visitMiniText: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "900",
  },
  visitMiniTextActive: {
    color: "#6D4AFF",
  },
  mutedText: {
    color: "#94A3B8",
  },
  timeline: {
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  hourRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    zIndex: 1,
  },
  hourText: {
    width: 43,
    paddingRight: 5,
    height: 18,
    lineHeight: 18,
    marginTop: -9,
    textAlign: "right",
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  hourTextHidden: {
    opacity: 0,
  },
  hourGrid: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
  },
  majorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: "#DDE4EE",
  },
  minorLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#EEF2F7",
  },
  closedBlock: {
    position: "absolute",
    left: 44,
    right: 0,
    justifyContent: "center",
    paddingLeft: 12,
    backgroundColor: "#F8FAFC",
    opacity: 0.88,
    zIndex: 0,
  },
  editableClosedBlock: {
    zIndex: 2,
    borderLeftWidth: 3,
    borderLeftColor: "#6D4AFF",
    backgroundColor: "#F1F5F9",
    opacity: 0.96,
  },
  closedBlockText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
  },
  closedBlockTimeText: {
    marginTop: 2,
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
  },
  timeSlotHitbox: {
    position: "absolute",
    right: 0,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  currentTimeLine: {
    position: "absolute",
    left: 43,
    right: 0,
    height: 2,
    backgroundColor: "#F43F5E",
    zIndex: 2,
  },
  currentTimeDot: {
    position: "absolute",
    left: -5,
    top: -5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F43F5E",
    backgroundColor: "#FFFFFF",
  },
  appointmentBlock: {
    position: "absolute",
    zIndex: 3,
    borderRadius: 7,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 23,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  appointmentBlockTight: {
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 21,
  },
  appointmentDeleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    zIndex: 4,
  },
  appointmentDeleteButtonTight: {
    top: 5,
    right: 5,
    width: 19,
    height: 19,
    borderRadius: 10,
  },
  appointmentMoveButton: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    zIndex: 4,
  },
  appointmentMoveButtonTight: {
    right: 5,
    bottom: 5,
    width: 19,
    height: 19,
    borderRadius: 10,
  },
  appointmentTime: {
    color: "#0F172A",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
  },
  appointmentTimeTight: {
    fontSize: 10,
    lineHeight: 12,
  },
  appointmentClient: {
    marginTop: 2,
    color: "#0F172A",
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "900",
  },
  appointmentClientTight: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 15,
  },
  appointmentService: {
    marginTop: 1,
    color: "#0F172A",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
  },
  appointmentPrice: {
    display: "none",
  },
  appointmentHandle: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
    zIndex: 5,
  },
  fabButton: {
    position: "absolute",
    right: 24,
    bottom: 88,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7047EE",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  menuBackdrop: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 108,
    paddingRight: 12,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
  },
  viewMenu: {
    width: 190,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  timeActionMenu: {
    width: 284,
    marginTop: 118,
    marginRight: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  timeActionTitle: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "900",
  },
  timeActionItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  timeActionText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  viewMenuItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
  },
  viewMenuItemActive: {
    backgroundColor: "#F3E8FF",
  },
  viewMenuText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  viewMenuTextActive: {
    color: "#5B21B6",
  },
  visitSheet: {
    gap: 12,
    padding: 18,
    paddingBottom: 28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
  },
  visitEditorSheet: {
    maxHeight: "92%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 2,
  },
  sheetTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
  },
  sheetClose: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  blockedTimeSummary: {
    minHeight: 46,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    backgroundColor: "#FAF7FF",
  },
  blockedTimeSummaryText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
  },
  visitEditorScroll: {
    maxHeight: 460,
  },
  visitClientCard: {
    minHeight: 92,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    backgroundColor: "#FBFAFF",
  },
  clientAvatarLarge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E8FF",
  },
  clientAvatarLargeText: {
    color: "#6D4AFF",
    fontSize: 19,
    fontWeight: "900",
  },
  visitCardEyebrow: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },
  visitClientTitle: {
    marginTop: 2,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  visitSectionHeader: {
    marginTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  visitSectionTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  visitSectionDate: {
    marginTop: 6,
    color: "#334155",
    fontSize: 15,
    fontWeight: "800",
  },
  visitServiceCard: {
    marginTop: 12,
    padding: 10,
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  visitServiceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  visitServicePickerButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  visitServicePickerText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  smallIconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },
  visitServiceMeta: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  visitServicePrice: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },
  addAnotherServiceButton: {
    marginTop: 12,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  addAnotherServiceText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  visitTotals: {
    minHeight: 40,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  visitTotalValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },
  pickerList: {
    maxHeight: 470,
  },
  searchInputShell: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#F8FAFC",
  },
  searchInput: {
    flex: 1,
    minHeight: 50,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  searchClearButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  clientOptionCard: {
    minHeight: 62,
    marginBottom: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  clientOptionCardActive: {
    borderColor: "#C4B5FD",
    backgroundColor: "#FBFAFF",
  },
  clientCreateSuggestion: {
    minHeight: 64,
    marginBottom: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#F5F3FF",
  },
  inlineClientForm: {
    marginBottom: 10,
    padding: 14,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#FAF7FF",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  inlineClientField: {
    gap: 6,
  },
  inlineClientLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },
  inlineClientInput: {
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    backgroundColor: "#FFFFFF",
  },
  inlineClientFormTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },
  inlineClientFormHint: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E8FF",
  },
  clientAvatarText: {
    color: "#6D4AFF",
    fontSize: 15,
    fontWeight: "900",
  },
  clientOptionText: {
    flex: 1,
    minWidth: 0,
  },
  clientOptionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  clientOptionCaption: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  serviceOptionCard: {
    minHeight: 64,
    marginBottom: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  serviceTone: {
    width: 12,
    height: 38,
    borderRadius: 6,
  },
  serviceOptionPrice: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },
  bottomNav: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 8,
    minHeight: 64,
    paddingHorizontal: 5,
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 10 : 6,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 4,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
  },
  bottomNavItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 17,
  },
  bottomNavItemActive: {
    borderWidth: 1,
    borderColor: "#D9D2FF",
    backgroundColor: "#F1EDFF",
  },
  bottomNavText: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "900",
  },
  bottomNavTextActive: {
    color: "#5B4BDB",
  },
  appHeader: {
    height: 62,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EC4899",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  workspaceScroll: {
    flex: 1,
  },
  workspaceContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 108,
  },
  workspaceHero: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  workspaceEyebrow: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  workspaceTitle: {
    marginTop: 6,
    color: "#0F172A",
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
  },
  workspaceSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  tabButton: {
    paddingHorizontal: 14,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  tabButtonActive: {
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
  },
  tabText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#4F46E5",
  },
  sectionStack: {
    gap: 14,
  },
  servicesModeRow: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#EEF2F7",
  },
  servicesModeButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  servicesModeButtonActive: {
    borderWidth: 1,
    borderColor: "#D9D2FF",
    backgroundColor: "#FFFFFF",
  },
  servicesModeText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  servicesModeTextActive: {
    color: "#5B4BDB",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  dateButtonText: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
  },
  datePill: {
    minWidth: 126,
    height: 43,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  dateText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  dateSubText: {
    marginTop: 1,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statTile: {
    flex: 1,
    minHeight: 82,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  statValue: {
    color: "#0F172A",
    fontSize: 23,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  statCaption: {
    marginTop: 2,
    color: "#334155",
    fontSize: 12,
    fontWeight: "800",
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
  },
  panelTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },
  panelBody: {
    gap: 10,
    marginTop: 12,
  },
  servicePicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 2,
  },
  choiceChip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDE6F3",
    backgroundColor: "#FFFFFF",
  },
  choiceChipActive: {
    borderColor: "#A5B4FC",
    backgroundColor: "#EEF2FF",
  },
  choiceText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },
  choiceTextActive: {
    color: "#4F46E5",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  serviceManageCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#FFFFFF",
  },
  serviceManageSummary: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  serviceTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  serviceEditStack: {
    padding: 12,
    gap: 10,
  },
  serviceActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  iconGhostButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },
  colorSwatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  colorSwatchActive: {
    borderColor: "#6D4AFF",
  },
  categoryAddRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  categoryAddButton: {
    width: 50,
    height: 50,
    marginBottom: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D4AFF",
  },
  catalogServiceCard: {
    minHeight: 72,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#F8FAFF",
  },
  catalogServiceCardActive: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  catalogAddBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D4AFF",
  },
  catalogAddBadgeDone: {
    backgroundColor: "#DCFCE7",
  },
  catalogStateText: {
    width: 74,
    color: "#432C75",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  catalogStateTextDone: {
    color: "#166534",
  },
  listItemCompact: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  listTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  listText: {
    marginTop: 2,
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
  },
  listCaption: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  moneyText: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "900",
  },
  emptyText: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  serviceColorRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallDanger: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  smallDangerText: {
    color: "#DC2626",
    fontSize: 20,
    fontWeight: "900",
  },
  badgeText: {
    minWidth: 34,
    textAlign: "center",
    color: "#5B21B6",
    fontSize: 14,
    fontWeight: "900",
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
  },
  staffLocalNav: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#EEF2F7",
  },
  staffLocalNavItem: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
    backgroundColor: "transparent",
  },
  staffLocalNavItemActive: {
    borderWidth: 1,
    borderColor: "#D9D2FF",
    backgroundColor: "#FFFFFF",
  },
  staffLocalNavText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  staffLocalNavTextActive: {
    color: "#5B4BDB",
  },
  staffSummaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  staffSummaryTile: {
    flex: 1,
    minHeight: 74,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  staffMemberRail: {
    gap: 10,
    paddingVertical: 2,
  },
  staffMemberChip: {
    minWidth: 190,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#FFFFFF",
  },
  staffMemberChipActive: {
    borderColor: "#6D4AFF",
    backgroundColor: "#F5F3FF",
  },
  staffAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9FE",
  },
  staffAvatarText: {
    color: "#6D4AFF",
    fontSize: 16,
    fontWeight: "900",
  },
  staffMemberName: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  staffMemberNameActive: {
    color: "#4C1D95",
  },
  staffMemberRole: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },
  staffMemberCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  staffMemberCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  staffToggleRow: {
    minHeight: 56,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  staffWeekHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  staffCalendarControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  staffWeekPickerButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    backgroundColor: "#FFFFFF",
  },
  staffWeekPickerText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  staffCalendarBox: {
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  staffCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  staffCalendarDay: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#EEF2FF",
  },
  staffCalendarDayMuted: {
    opacity: 0.35,
  },
  staffCalendarDayActive: {
    backgroundColor: "#6D4AFF",
  },
  staffCalendarDayWork: {
    backgroundColor: "#DCFCE7",
  },
  staffCalendarDayText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
  },
  staffCalendarDayTextActive: {
    color: "#FFFFFF",
  },
  staffMonthPlanner: {
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  staffSelectedDaysStack: {
    gap: 10,
  },
  staffSelectedDayCard: {
    gap: 8,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#FFFFFF",
  },
  staffDayCard: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  staffDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  staffDayTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  staffTimeGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  staffIntervalsBox: {
    marginTop: 10,
    gap: 8,
  },
  staffIntervalsStack: {
    gap: 10,
  },
  staffIntervalRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  staffIntervalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 1,
  },
  staffIntervalIconButton: {
    width: 34,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
  },
  staffTimeField: {
    flex: 1,
    minWidth: 92,
    gap: 5,
  },
  staffTimeLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
  },
  staffTimeInput: {
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2F1",
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    backgroundColor: "#FFFFFF",
  },
  settingsHero: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  settingsEyebrow: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  settingsHeroTitle: {
    marginTop: 5,
    color: "#0F172A",
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
  },
  settingsHeroText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "800",
  },
  settingsSectionRail: {
    gap: 8,
    paddingRight: 8,
  },
  settingsSectionChip: {
    minHeight: 38,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2EF",
    backgroundColor: "#FFFFFF",
  },
  settingsSectionChipActive: {
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
  },
  settingsSectionText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900",
  },
  settingsSectionTextActive: {
    color: "#4F46E5",
  },
  settingsStatusText: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    overflow: "hidden",
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
    backgroundColor: "#DCFCE7",
  },
  settingsMutedNotice: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    overflow: "hidden",
    color: "#92400E",
    fontSize: 13,
    fontWeight: "800",
    backgroundColor: "#FEF3C7",
  },
  settingsAvatarRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#FFFFFF",
  },
  settingsAvatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EC4899",
  },
  settingsAvatarText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },
  settingsAvatarImage: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
  },
  settingsAvatarInfo: {
    flex: 1,
    minWidth: 0,
  },
  settingsAvatarActions: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  settingsCardTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  settingsChoiceRow: {
    flexDirection: "row",
    gap: 8,
  },
  settingsChoice: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2EF",
    backgroundColor: "#FFFFFF",
  },
  settingsChoiceActive: {
    borderColor: "#C7D2FE",
    backgroundColor: "#EEF2FF",
  },
  settingsChoiceText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  settingsChoiceTextActive: {
    color: "#4F46E5",
  },
  settingsStackedChoices: {
    gap: 8,
  },
  settingsLongChoice: {
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2EF",
    backgroundColor: "#FFFFFF",
  },
  settingsOptionBlock: {
    gap: 8,
  },
  settingsOptionRail: {
    gap: 8,
    paddingRight: 8,
  },
  settingsActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  settingsSummaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  settingsSummaryTile: {
    flex: 1,
    minHeight: 78,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  settingsMiniRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  settingsMiniInfo: {
    flex: 1,
    minWidth: 0,
  },
  settingsMiniTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  settingsMiniPrice: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
  },
  joinRequestCard: {
    minHeight: 66,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#FFFFFF",
  },
  joinRequestActions: {
    flexDirection: "row",
    gap: 8,
  },
  joinApproveButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
  },
  joinRejectButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  settingsToggleRow: {
    minHeight: 58,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#F8FAFF",
  },
  settingsToggleText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  addressSuggestionCard: {
    minHeight: 66,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D9D2FF",
    backgroundColor: "#F8FAFF",
  },
  addressSuggestionAction: {
    color: "#5B4BDB",
    fontSize: 12,
    fontWeight: "900",
  },
  settingsMultilineInput: {
    minHeight: 104,
    height: 104,
    paddingTop: 12,
    paddingBottom: 12,
  },
  settingsPhotosBox: {
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  settingsPhotoRail: {
    gap: 10,
    paddingRight: 8,
  },
  settingsPhotoCard: {
    width: 160,
    gap: 8,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    backgroundColor: "#FFFFFF",
  },
  settingsPhoto: {
    width: "100%",
    height: 110,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  settingsPhotoActions: {
    gap: 8,
  },
  settingsPhotoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
    color: "#5B4BDB",
    fontSize: 12,
    fontWeight: "900",
    backgroundColor: "#EEF2FF",
  },
  settingsPhotoPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  telegramStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  telegramDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  telegramDotConnected: {
    backgroundColor: "#22C55E",
  },
  telegramDotDisconnected: {
    backgroundColor: "#CBD5E1",
  },
  telegramDotMuted: {
    backgroundColor: "#CBD5E1",
  },
  infoLine: {
    gap: 4,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },
  infoValue: {
    color: "#0F172A",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },
});
