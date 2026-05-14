import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";
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
type AppTab = "calendar" | "services" | "clients" | "telegram" | "settings";
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
  selectedClientId?: string;
  items: VisitServiceDraft[];
};

type BlockedTimeDraft = {
  date: string;
  startTime: string;
  endTime: string;
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
    email: string;
    phone: string;
    language: string;
    currency?: string;
    timezone: string;
    country: string;
  };
  business: {
    id: string;
    name: string;
    address: string;
    publicBookingUrl?: string;
    allowOnlineBooking?: boolean;
    workScheduleMode?: string;
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

type ServiceDraftState = {
  name: string;
  category: string;
  durationMinutes: string;
  price: string;
  color: string;
};

type CalendarSnapshot = {
  appointments: AppointmentRecord[];
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

const STORAGE_KEY = "timviz_mobile_session_v2";
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://timviz.com").replace(/\/+$/, "");
const WORDMARK = require("./assets/timviz-wordmark.png");
const DEFAULT_SERVICE_CATEGORY = "Без категории";
const SERVICE_COLORS = ["#9AD86A", "#8ED1F2", "#FF9A84", "#F7C948", "#A78BFA", "#34D399", "#F472B6", "#60A5FA"];
const APP_ICON = require("./assets/timviz-icon.png");

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
    telegram: "Telegram",
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
    telegram: "Telegram",
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
    telegram: "Telegram",
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
    selectedClientId: undefined,
    items: [createVisitServiceDraft(startTime)],
  };
}

function timeToMinutes(time: string) {
  const [hours, mins] = time.split(":").map((item) => Number(item));
  if (!Number.isFinite(hours) || !Number.isFinite(mins)) return 9 * 60;
  return hours * 60 + mins;
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
  const [activeTab, setActiveTab] = useState<AppTab>("calendar");
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
  const [timeAction, setTimeAction] = useState<{ date: string; time: string } | null>(null);
  const [serviceDraft, setServiceDraft] = useState<ServiceDraftState>({ name: "", category: DEFAULT_SERVICE_CATEGORY, durationMinutes: "60", price: "0", color: SERVICE_COLORS[0] });
  const [clientDraft, setClientDraft] = useState({ firstName: "", lastName: "", phone: "", email: "" });

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
      const [workspaceResult, calendarResult, clientsResult, servicesResult] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mobile/pro/workspace/${currentSession.professionalId}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/calendar?date=${encodeURIComponent(date)}`, { headers }).then((item) =>
          item.json()
        ),
        fetch(`${API_BASE_URL}/api/mobile/pro/clients`, { headers }).then((item) => item.json()),
        fetch(`${API_BASE_URL}/api/mobile/pro/services`, { headers }).then((item) => item.json()),
      ]);

      if (workspaceResult?.error) throw new Error(workspaceResult.error);
      if (calendarResult?.error) throw new Error(calendarResult.error);
      if (clientsResult?.error) throw new Error(clientsResult.error);
      if (servicesResult?.error) throw new Error(servicesResult.error);

      setWorkspace(workspaceResult);
      setCalendar(calendarResult);
      setClients(Array.isArray(clientsResult.clients) ? clientsResult.clients : []);
      setServiceCatalog(Array.isArray(servicesResult.catalog) ? servicesResult.catalog : []);
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
            await apiFetch(`/api/mobile/pro/calendar?appointmentId=${encodeURIComponent(appointment.id)}`, { method: "DELETE" });
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

  async function createBlockedTime(date: string, startTime: string, endTime: string, label: string) {
    setBusy(true);
    try {
      await apiFetch("/api/mobile/pro/calendar", {
        method: "POST",
        body: JSON.stringify({
          kind: "blocked",
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
          onTelegramPress={() => setActiveTab("telegram")}
          onSettingsPress={() => setActiveTab("settings")}
          onSignOut={signOut}
        />

        {activeTab === "calendar" ? (
          <CalendarTab
            t={t}
            language={language}
            workspace={workspace}
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
            {activeTab === "telegram" ? <TelegramTab t={t} workspace={workspace} /> : null}
            {activeTab === "settings" ? (
              <SettingsTab
                t={t}
                language={language}
                setLanguage={setLanguage}
                workspace={workspace}
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
  timeAction: { date: string; time: string } | null;
  setTimeAction: (action: { date: string; time: string } | null) => void;
  onDeleteAppointment: (appointment: AppointmentRecord) => void;
  onMoveAppointment: (appointment: AppointmentRecord) => void;
  onResizeAppointment: (appointment: AppointmentRecord) => void;
  onUpdateBlockedTime: (appointment: AppointmentRecord, startTime: string, endTime: string) => Promise<boolean>;
  onCreateBlockedTime: (date: string, startTime: string, endTime: string, label: string) => Promise<void>;
  busy: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
  loadCalendarDays: (dates: string[]) => Promise<Record<string, CalendarSnapshot>>;
}) {
  const currency = workspace?.professional.currency;
  const services = workspace?.services || [];
  const [isCompact, setIsCompact] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
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
  const selectedSchedule = getScheduleForDate(workspace, selectedDate);
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

  function openComposerAt(time: string, date = selectedDate) {
    setEditingAppointment(null);
    setSelectedDate(date);
    setVisitDraft(createDefaultVisitDraft(date, time));
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

  function openBlockedTimeComposer(action: { date: string; time: string }, label: string, title: string) {
    setBlockedTimeDraft({
      date: action.date,
      startTime: action.time,
      endTime: addMinutes(action.time, 60),
      label,
      title,
    });
  }

  function openBlockedAppointmentEditor(appointment: AppointmentRecord) {
    setBlockedTimeDraft({
      date: appointment.appointmentDate || selectedDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
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
      : (await onCreateBlockedTime(blockedTimeDraft.date, startTime, endTime, blockedTimeDraft.label), true);
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
          style={[styles.modeButton, isCompact && styles.modeButtonActive]}
          onPress={() => setIsCompact((current) => !current)}
        >
          <Text style={[styles.modeButtonText, isCompact && styles.modeButtonTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.66}>
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
          <View style={styles.masterStrip}>
            <View style={styles.masterAvatar}>
              <Text style={styles.masterAvatarText}>{workspace?.professional.firstName?.slice(0, 1).toUpperCase() || "T"}</Text>
            </View>
            <Text style={styles.masterName}>
              {`${workspace?.professional.firstName || ""} ${workspace?.professional.lastName || ""}`.trim() || "Timviz"}
            </Text>
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
            <CalendarTimeline
              date={selectedDate}
              appointments={calendar?.appointments || []}
              currency={currency}
              compact={isCompact}
              schedule={selectedSchedule}
              t={t}
              onTimePress={(time) => setTimeAction({ date: selectedDate, time })}
              onAppointmentPress={openAppointmentEditor}
              onBlockedAppointmentPress={openBlockedAppointmentEditor}
              onAppointmentDelete={onDeleteAppointment}
              onAppointmentMove={onMoveAppointment}
              onAppointmentResize={onResizeAppointment}
            />
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
          getAppointmentsForDate={getAppointmentsForDate}
          onSelectDate={(date) => chooseDate(date, viewMode)}
          onOpenDay={(date) => chooseDate(date, "day")}
          onCreateAt={(date) => openComposerAt("09:00", date)}
        />
      )}

      <Pressable
        style={styles.fabButton}
        onPress={() => {
          setEditingAppointment(null);
          setVisitDraft(createDefaultVisitDraft(selectedDate, getRoundedTime(10)));
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
                <Field label={t.search} value={clientQuery} onChangeText={setClientQuery} placeholder={t.clientNameOrPhone} />
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
                    <Text style={styles.clientOptionTitle}>{clientCreateOpen ? t.cancel : t.addNewClient}</Text>
                    <Text style={styles.clientOptionCaption}>{t.clientNameOrPhone}</Text>
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
                    <View style={styles.twoColumns}>
                      <Field label={t.firstName} value={newClientDraft.firstName} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, firstName: value })} />
                      <Field label={t.lastName} value={newClientDraft.lastName} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, lastName: value })} />
                    </View>
                    <Field label={t.phone} value={newClientDraft.phone} onChangeText={(value) => setNewClientDraft({ ...newClientDraft, phone: value })} keyboardType="phone-pad" />
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
                <Field label={t.search} value={serviceQuery} onChangeText={setServiceQuery} placeholder={t.searchService} />
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
                openComposerAt(action.time, action.date);
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

function CalendarOverview({
  t,
  language,
  mode,
  selectedDate,
  dates,
  currency,
  workspace,
  getAppointmentsForDate,
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
  getAppointmentsForDate: (date: string) => AppointmentRecord[];
  onSelectDate: (date: string) => void;
  onOpenDay: (date: string) => void;
  onCreateAt: (date: string) => void;
}) {
  if (mode === "month") {
    return (
      <ScrollView style={styles.overviewScroll} contentContainerStyle={styles.monthGrid} showsVerticalScrollIndicator={false}>
        {dates.map((date) => {
          const appointments = getAppointmentsForDate(date);
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

  const cardWidth = mode === "threeDays" ? 168 : 142;

  return (
    <ScrollView
      style={styles.overviewScroll}
      horizontal
      contentContainerStyle={styles.summaryStrip}
      showsHorizontalScrollIndicator={false}
    >
      {dates.map((date) => {
        const appointments = getAppointmentsForDate(date);
        const schedule = getScheduleForDate(workspace, date);
        const workParts = getWorkTimeParts(schedule);
        const selected = date === selectedDate;
        const closed = !schedule.enabled;
        return (
          <Pressable
            key={date}
            style={[styles.summaryCard, { width: cardWidth }, closed && styles.summaryCardClosed, selected && styles.summaryCardActive]}
            onPress={() => onSelectDate(date)}
            onLongPress={() => onCreateAt(date)}
          >
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryDate, selected && styles.summaryDateActive]}>{formatShortDate(date, language)}</Text>
              {appointments.length ? (
                <View style={styles.dayCountBadge}>
                  <Text style={styles.dayCountBadgeText}>{appointments.length}</Text>
                </View>
              ) : selected ? (
                <View style={styles.summaryDot} />
              ) : null}
            </View>
            {closed ? (
              <View style={styles.summaryClosedBadge}>
                <Ionicons name="moon-outline" size={15} color="#64748B" />
                <Text style={styles.summaryClosedBadgeText}>{getClosedShortLabel(language)}</Text>
              </View>
            ) : (
              <View style={styles.summaryHoursRow}>
                <Text style={styles.summaryHoursPart}>{workParts.start}</Text>
                <Text style={styles.summaryHoursPart}>{workParts.end}</Text>
              </View>
            )}
            <View style={styles.summaryVisitsLine}>
              <Ionicons name="people-outline" size={15} color={appointments.length ? "#6D4AFF" : "#94A3B8"} />
              <Text style={[styles.summaryCountCompact, appointments.length ? styles.summaryCountCompactActive : null]}>{appointments.length}</Text>
            </View>
            <View style={styles.summaryAppointments}>
              {appointments.slice(0, 3).map((appointment) => (
                <View key={appointment.id} style={styles.summaryAppointment}>
                  <Text style={styles.summaryAppointmentTime}>{appointment.startTime}</Text>
                  <Text style={styles.summaryAppointmentText} numberOfLines={1}>
                    {appointment.customerName || appointment.serviceName || t.newVisit}
                  </Text>
                </View>
              ))}
              {!appointments.length && !closed ? (
                <Pressable style={styles.summaryAddButton} onPress={() => onCreateAt(date)}>
                  <Ionicons name="add" size={18} color="#5B21B6" />
                  <Text style={styles.summaryAddText}>{t.addVisit}</Text>
                </Pressable>
              ) : null}
            </View>
            <Pressable style={styles.openDayButton} onPress={() => onOpenDay(date)}>
              <Text style={styles.openDayButtonText}>{t.dayView}</Text>
            </Pressable>
          </Pressable>
        );
      })}
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
}) {
  const { width } = useWindowDimensions();
  const startHour = 0;
  const endHour = 23;
  const workStart = schedule.enabled ? timeToMinutes(schedule.startTime) : 9 * 60;
  const workEnd = schedule.enabled ? timeToMinutes(schedule.endTime) : 18 * 60;
  const workHourHeight = compact ? 72 : 88;
  const offHourHeight = compact ? workHourHeight / 10 : workHourHeight;
  const timelineHeight = getScaledMinuteTop(24 * 60);
  const timeColumnWidth = 43;
  const gridWidth = Math.max(280, width - timeColumnWidth);
  const laneGap = 8;
  const appointmentMinHeight = 68;
  const appointmentMinVisibleMinutes = Math.ceil((appointmentMinHeight / workHourHeight) * 60);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = getScaledMinuteTop(nowMinutes);
  const showCurrentTime = date === getTodayIso();
  const breaks = schedule.enabled ? schedule.breaks || [] : [];
  const closedRanges = schedule.enabled
    ? [
        { start: 0, end: workStart, label: "00:00 - " + schedule.startTime, kind: "off" },
        ...breaks.map((item) => ({
          start: timeToMinutes(item.startTime),
          end: timeToMinutes(item.endTime),
          label: `${item.startTime} - ${item.endTime}`,
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
    const end = Math.max(timeToMinutes(appointment.endTime), start + 30);
    const overlapping = regularAppointments
      .filter((item) => {
        const itemStart = timeToMinutes(item.startTime);
        const itemEnd = Math.max(timeToMinutes(item.endTime), itemStart + 30);
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
    if (safe <= workStart) return (safe / 60) * offHourHeight;
    const beforeWork = (workStart / 60) * offHourHeight;
    if (safe <= workEnd) return beforeWork + ((safe - workStart) / 60) * workHourHeight;
    return beforeWork + ((workEnd - workStart) / 60) * workHourHeight + ((safe - workEnd) / 60) * offHourHeight;
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
    <View style={[styles.timeline, { height: timelineHeight }]}>
      {Array.from({ length: endHour - startHour + 1 }).map((_, index) => {
        const hour = startHour + index;
        const rowStart = hour * 60;
        const rowEnd = (hour + 1) * 60;
        const top = getScaledMinuteTop(rowStart);
        const height = getRangeHeight(rowStart, rowEnd);
        const showLabel = height >= 18 || hour === Math.floor(workStart / 60);
        return (
          <View key={hour} style={[styles.hourRow, { top, height }]}>
            <Text style={[styles.hourText, !showLabel && styles.hourTextHidden]}>{showLabel ? `${String(hour).padStart(2, "0")}:00` : ""}</Text>
            <View style={styles.hourGrid}>
              <View style={styles.majorLine} />
              {height >= 34
                ? [1, 2, 3, 4, 5].map((part) => <View key={part} style={[styles.minorLine, { top: (height / 6) * part }]} />)
                : null}
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
            },
          ]}
        >
          {range.kind !== "off" && getRangeHeight(range.start, range.end) >= 24 ? <Text style={styles.closedBlockText}>{range.label}</Text> : null}
        </View>
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

      {compact && schedule.enabled ? (
        <View pointerEvents="none" style={[styles.boundaryTimeLabel, { top: Math.max(0, getScaledMinuteTop(workEnd) - 9) }]}>
          <Text style={styles.boundaryTimeText}>{schedule.endTime}</Text>
        </View>
      ) : null}

      {showCurrentTime && nowTop >= 0 && nowTop <= timelineHeight ? (
        <View style={[styles.currentTimeLine, { top: nowTop }]}>
          <View style={styles.currentTimeDot} />
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
        const blockGap = laneCount > 1 ? 8 : 0;
        const blockWidth = laneCount > 1 ? (availableWidth - blockGap * (laneCount - 1)) / laneCount : availableWidth;
        const blockLeft = timeColumnWidth + laneGap + laneIndex * (blockWidth + blockGap);

        return (
          <Pressable
            key={appointment.id}
            style={[
              styles.appointmentBlock,
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
              style={styles.appointmentDeleteButton}
              onPress={(event) => {
                event.stopPropagation();
                onAppointmentDelete(appointment);
              }}
            >
              <Ionicons name="close" size={16} color="#F43F5E" />
            </Pressable>
            <Pressable
              style={styles.appointmentMoveButton}
              onPress={(event) => {
                event.stopPropagation();
                onAppointmentMove(appointment);
              }}
            >
              <Ionicons name="move" size={15} color="#475569" />
            </Pressable>
            <Text style={styles.appointmentTime}>
              {appointment.startTime} - {appointment.endTime}
            </Text>
            <Text style={styles.appointmentClient} numberOfLines={2}>
              {appointment.customerName || "Клиент"}
            </Text>
            <Text style={styles.appointmentService} numberOfLines={1}>
              {appointment.serviceName}
            </Text>
            <Text style={styles.appointmentPrice}>{formatMoney(appointment.priceAmount, currency)}</Text>
            <Pressable
              style={styles.appointmentHandle}
              onPress={(event) => {
                event.stopPropagation();
                onAppointmentResize(appointment);
              }}
            />
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
  onTelegramPress,
  onSettingsPress,
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
  onTelegramPress: () => void;
  onSettingsPress: () => void;
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
                      if (item.id === "booking" || item.id === "address") setPanel("share");
                      if (item.id === "telegram") onTelegramPress();
                      if (item.id === "schedule") setActiveTab("settings");
                      if (item.id !== "booking" && item.id !== "address") close();
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
                <Pressable style={styles.accountMenuItem} onPress={() => { close(); onSettingsPress(); }}>
                  <Text style={styles.accountMenuItemText}>{t.myProfile}</Text>
                </Pressable>
                <Pressable style={styles.accountMenuItem} onPress={() => { close(); onSettingsPress(); }}>
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
    { tab: "telegram", icon: "people-outline", label: t.telegram },
    { tab: "settings", icon: "settings-outline", label: t.settings },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = activeTab === item.tab;
        return (
          <Pressable key={item.tab} onPress={() => setActiveTab(item.tab)} style={[styles.bottomNavItem, active && styles.bottomNavItemActive]}>
            <Ionicons name={item.icon} size={19} color={active ? "#FFFFFF" : "#64748B"} />
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

function TelegramTab({ t, workspace }: { t: Record<string, string>; workspace: WorkspaceSnapshot | null }) {
  const connected = workspace?.telegram?.connected;
  return (
    <View style={styles.sectionStack}>
      <Panel title="Telegram">
        <View style={styles.telegramStatus}>
          <View style={[styles.telegramDot, connected ? styles.telegramDotConnected : styles.telegramDotMuted]} />
          <View>
            <Text style={styles.listTitle}>{connected ? t.connected : t.notConnected}</Text>
            <Text style={styles.listCaption}>{connected ? workspace?.telegram?.chatId : "Timviz bot"}</Text>
          </View>
        </View>
        <Text style={styles.emptyText}>{t.telegramHint}</Text>
      </Panel>
    </View>
  );
}

function SettingsTab({
  t,
  language,
  setLanguage,
  workspace,
  onSignOut,
  busy,
}: {
  t: Record<string, string>;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  workspace: WorkspaceSnapshot | null;
  onSignOut: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      <Panel title={t.settings}>
        <LanguageSwitch language={language} setLanguage={setLanguage} />
        <InfoLine label={t.onlineBooking} value={workspace?.business.allowOnlineBooking ? t.connected : t.notConnected} />
        <InfoLine label={t.address} value={workspace?.business.address || t.empty} />
        <InfoLine label={t.publicPage} value={workspace?.business.publicBookingUrl || t.empty} />
        <SecondaryButton label={t.signOut} onPress={onSignOut} disabled={busy} />
      </Panel>
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
    backgroundColor: "#F8FAFC",
  },
  authScreen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    borderRadius: 8,
    backgroundColor: "#EEF2F7",
  },
  languageButton: {
    minWidth: 40,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  languageButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  languageText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },
  languageTextActive: {
    color: "#0F172A",
  },
  authCard: {
    width: "100%",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  segment: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  segmentButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  segmentButtonActive: {
    backgroundColor: "#0F172A",
  },
  segmentText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#FFFFFF",
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
    gap: 6,
  },
  fieldHeader: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  hint: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 18,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
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
    borderRadius: 14,
    backgroundColor: "#15100D",
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
    borderRadius: 16,
    backgroundColor: "#F4F1ED",
  },
  supportGuideTitle: {
    color: "#171717",
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
    backgroundColor: "#15100D",
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
  },
  hourText: {
    width: 43,
    paddingTop: 2,
    paddingRight: 5,
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
  boundaryTimeLabel: {
    position: "absolute",
    left: 0,
    width: 43,
    height: 18,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 5,
    zIndex: 2,
  },
  boundaryTimeText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
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
    borderRadius: 8,
    padding: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  appointmentDeleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    zIndex: 4,
  },
  appointmentMoveButton: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    zIndex: 4,
  },
  appointmentTime: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },
  appointmentClient: {
    marginTop: 3,
    color: "#0F172A",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
  },
  appointmentService: {
    marginTop: 2,
    color: "#0F172A",
    fontSize: 13,
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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  visitEditorSheet: {
    maxHeight: "92%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
  },
  sheetClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    padding: 12,
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#FAF7FF",
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
    left: 5,
    right: 5,
    bottom: 2,
    minHeight: 56,
    paddingHorizontal: 3,
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 7 : 4,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
  },
  bottomNavItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 8,
  },
  bottomNavItemActive: {
    backgroundColor: "#241642",
  },
  bottomNavText: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "900",
  },
  bottomNavTextActive: {
    color: "#FFFFFF",
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
    paddingTop: 18,
    paddingBottom: 34,
  },
  workspaceHero: {
    marginBottom: 14,
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
    fontSize: 30,
    lineHeight: 36,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  tabButtonActive: {
    borderColor: "#0F172A",
    backgroundColor: "#0F172A",
  },
  tabText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  sectionStack: {
    gap: 12,
  },
  servicesModeRow: {
    flexDirection: "row",
    gap: 8,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  servicesModeButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: "#F8FAFC",
  },
  servicesModeButtonActive: {
    backgroundColor: "#0F172A",
  },
  servicesModeText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  servicesModeTextActive: {
    color: "#FFFFFF",
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  panelTitle: {
    color: "#0F172A",
    fontSize: 18,
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  choiceChipActive: {
    borderColor: "#7C3AED",
    backgroundColor: "#F3E8FF",
  },
  choiceText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },
  choiceTextActive: {
    color: "#5B21B6",
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
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
    borderColor: "#111827",
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E2EF",
    backgroundColor: "#F8FAFC",
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
