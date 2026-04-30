"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "../../ProfileAvatar";
import styles from "../pro.module.css";
import FloatingPopover from "../FloatingPopover";
import ProSidebar from "../ProSidebar";
import SupportWidget from "../SupportWidget";
import { languageFromProfile, profileLanguageFromCode } from "../i18n";
import {
  getDayBreaks,
  getDaySchedule as resolveDaySchedule,
  isWithinWorkingWindow as isTimeWithinWorkingWindow,
  type CustomSchedule,
  type WorkDaySchedule,
  type WorkSchedule,
  type WorkScheduleMode
} from "../../../lib/work-schedule";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneEditingState,
  getPhoneRule,
  getPhoneValidationMessage,
  isPhoneValid,
  onlyPhoneDigits,
  phoneCountries
} from "../../../lib/phone-format";

type CalendarAppointment = {
  id: string;
  professionalId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  kind: "appointment" | "blocked";
  customerName: string;
  customerPhone: string;
  serviceName: string;
  notes: string;
  attendance: "pending" | "confirmed" | "arrived" | "no_show";
  priceAmount: number;
};

type CalendarClient = {
  name: string;
  phone: string;
};

type CalendarDirectoryClient = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  visitsCount: number;
};

type CalendarPeriodStats = {
  visitsCount: number;
  revenue: number;
};

type CalendarSnapshot = {
  viewer: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
    scope: "owner" | "member";
    language?: string;
    country?: string;
    currency?: string;
  };
  teamMembers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
    scope: "owner" | "member";
    isViewer: boolean;
  }>;
  viewedProfessionalId: string;
  memberCalendars: Array<{
    professionalId: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
    scope: "owner" | "member";
    isViewer: boolean;
    memberSchedule: {
      workScheduleMode: WorkScheduleMode;
      workSchedule: WorkSchedule;
      customSchedule: CustomSchedule;
    };
    appointments: CalendarAppointment[];
  }>;
  workspace: {
    professional: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string;
      language?: string;
      country?: string;
      currency?: string;
    };
    business: {
      name: string;
      accountType: "solo" | "team";
      categories: string[];
      allowOnlineBooking?: boolean;
      publicBookingPath?: string;
      publicBookingUrl?: string;
      workScheduleMode: WorkScheduleMode;
      workSchedule: WorkSchedule;
      customSchedule: CustomSchedule;
    };
    membership: {
      scope: "owner" | "member";
      role: string;
    };
    memberSchedule: {
      workScheduleMode: WorkScheduleMode;
      workSchedule: WorkSchedule;
      customSchedule: CustomSchedule;
    };
    services: Array<{
      id: string;
      name: string;
      price: number;
      durationMinutes?: number;
      color?: string;
    }>;
  };
  appointments: CalendarAppointment[];
  clients: CalendarClient[];
  recentActivity: Array<{
    id: string;
    appointmentDate: string;
    startTime: string;
    customerName: string;
    serviceName: string;
    professionalId: string;
    professionalName: string;
    createdAt: string;
  }>;
  stats?: {
    day: CalendarPeriodStats;
    week: CalendarPeriodStats;
    month: CalendarPeriodStats;
  };
};

type CalendarDayViewProps = {
  professionalId: string;
  initialDate: string;
};

type AppLanguage = "ru" | "uk" | "en";
type AppLocale = "ru-RU" | "uk-UA" | "en-US";
type CalendarViewMode = "day" | "threeDay" | "week" | "month";

type QuickMenuState = {
  visible: boolean;
  x: number;
  y: number;
  time: string;
  professionalId: string;
};

type DrawerStage = "closed" | "visit" | "service-picker" | "client-search" | "details" | "notifications";
type CalendarToastTone = "info" | "success" | "warning" | "error";

type VisitServiceDraft = {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  priceAmount: number;
};

type CalendarToastState = {
  id: number;
  text: string;
  tone: CalendarToastTone;
};

const SERVICE_COLORS = [
  "#f56d95",
  "#b9ebff",
  "#9cbe4a",
  "#9b73bd",
  "#ffcb78",
  "#7dd4c2"
];

const CALENDAR_HOUR_HEIGHT = 96;
const CALENDAR_MOBILE_HOUR_HEIGHT = 144;
const CALENDAR_GRID_STEP_MINUTES = 10;
const TIME_SELECT_STEP_MINUTES = 5;
const MIN_BOOKING_CARD_HEIGHT = 64;
const MOBILE_MIN_BOOKING_CARD_HEIGHT = 86;

const CALENDAR_TEXT: Record<AppLanguage, {
  today: string;
  day: string;
  threeDays: string;
  week: string;
  month: string;
  daySchedule: string;
  waitlist: string;
  weekJump: string;
  closed: string;
  closedBySchedule: string;
  services: string;
  dailyCalendar: string;
  visits: string;
  selected: string;
  masterFallback: string;
  back: string;
  quickNewVisit: string;
  quickBlockBusy: string;
  quickAddOffTime: string;
  blockedBusySaved: string;
  blockedOffTimeSaved: string;
  outsideScheduleWarning: string;
  chooseTimeAndService: string;
  chooseServiceForEveryBlock: string;
  partBlocked: string;
  pastTimeBlocked: string;
  saveVisitFailed: string;
  enterClientName: string;
  addClientFailed: string;
  blockTimeFailed: string;
  blockedRemoved: string;
  visitRemoved: string;
  visitUpdated: string;
  blockedSaveFailed: string;
  blockedUpdated: string;
  visitSaved: string;
  visitSavedOverlap: string;
  deleteBlockFailed: string;
  newVisitTitle: string;
  customer: string;
  quickBookingWithoutClient: string;
  chooseClientLater: string;
  visitTab: string;
  currentDay: string;
  chooseService: string;
  start: string;
  end: string;
  primaryService: string;
  additionalService: string;
  addAnotherService: string;
  removeService: string;
  overlapWarning: string;
  serviceBlocksOverlap: string;
  total: string;
  payable: string;
  cancelUpper: string;
  saveUpper: string;
  savingUpper: string;
  searchPlaceholder: string;
  serviceDurationMinutes: string;
  addNewService: (name: string) => string;
  chooseClient: string;
  clientNameOrPhone: string;
  clientSearchHint: string;
  withoutClient: string;
  withoutClientHint: string;
  newClient: string;
  hideForm: string;
  newClientHint: string;
  addClientTitle: string;
  addClientText: string;
  clientName: string;
  phone: string;
  exampleName: string;
  addAndChoose: string;
  clients: string;
  noPhone: string;
  allTeam: string;
  chosenMasters: (count: number) => string;
  showAllTeam: string;
  selectedMasters: string;
  myMarker: string;
  visitsCountLabel: (count: number) => string;
  clientNotFound: string;
  clientsEmpty: string;
  clientNotFoundHint: string;
  clientsEmptyHint: string;
  addNamedClient: (name: string) => string;
  blockedTimeFallback: string;
  walkInClient: string;
  saveTime: string;
  deleteBlock: string;
  deleteVisit: string;
  moveVisit: string;
  resizeVisit: string;
  service: string;
  specialist: string;
  visitDateTime: string;
  attendanceStatus: string;
  attendancePending: string;
  attendanceConfirmed: string;
  attendanceArrived: string;
  attendanceNoShow: string;
  price: string;
  notesLabel: string;
  quickContact: string;
  call: string;
  whatsapp: string;
  telegram: string;
  viber: string;
  prefixAria: string;
  prefixSearch: string;
  contactPhoneHint: string;
  changeClient: string;
  saveVisit: string;
  deleteVisitConfirmTitle: string;
  deleteBlockConfirmTitle: string;
  deleteConfirmText: string;
  deleteCancel: string;
  deleteConfirm: string;
  newClientModalTitle: string;
  newClientModalText: string;
  addClientDataUpper: string;
  notNowUpper: string;
  chooseSpecialist: string;
  refresh: string;
  notifications: string;
  notificationsEmpty: string;
  recentBookings: string;
  accountMenu: string;
  myProfile: string;
  personalSettings: string;
  helpSupport: string;
  logout: string;
  language: string;
  publicLink: string;
  publicLinkTitle: string;
  publicLinkHint: string;
  publicLinkCopy: string;
  publicLinkOpen: string;
  publicLinkShare: string;
  publicLinkCopied: string;
  publicLinkSelected: string;
  publicLinkDisabled: string;
  publicLinkEnabled: string;
  recentBookingTitle: string;
}> = {
  ru: {
    today: "Сегодня",
    day: "День",
    threeDays: "3 дня",
    week: "Неделя",
    month: "Месяц",
    daySchedule: "Расписание на день",
    waitlist: "Список ожидания",
    weekJump: "Перейти к неделе",
    closed: "выходной",
    closedBySchedule: "Выходной по графику",
    services: "услуг",
    dailyCalendar: "дневной календарь",
    visits: "визитов",
    selected: "Выбрано",
    masterFallback: "Мастер",
    back: "Назад",
    quickNewVisit: "Новый визит",
    quickBlockBusy: "Забронировать время",
    quickAddOffTime: "Добавить нерабочее время",
    blockedBusySaved: "Время забронировано.",
    blockedOffTimeSaved: "Нерабочее время добавлено.",
    outsideScheduleWarning: "Вы создаете визит вне рабочего графика.",
    chooseTimeAndService: "Сначала выбери время и услугу.",
    chooseServiceForEveryBlock: "Выбери услугу для каждого блока визита.",
    partBlocked: "Часть времени уже заблокирована.",
    pastTimeBlocked: "Нельзя сохранить визит на прошедшее время.",
    saveVisitFailed: "Не удалось сохранить визит.",
    enterClientName: "Введите имя клиента.",
    addClientFailed: "Не удалось добавить клиента.",
    blockTimeFailed: "Не удалось заблокировать время.",
    blockedRemoved: "Блок времени удален.",
    visitRemoved: "Визит удален.",
    visitUpdated: "Визит обновлен.",
    blockedSaveFailed: "Не удалось сохранить блок времени.",
    blockedUpdated: "Блок времени обновлен.",
    visitSaved: "Визит сохранен.",
    visitSavedOverlap: "Визит сохранен с наложением по времени.",
    deleteBlockFailed: "Не удалось удалить блок.",
    newVisitTitle: "Новый визит",
    customer: "Клиент",
    quickBookingWithoutClient: "Быстрая запись без клиента",
    chooseClientLater: "Можно выбрать клиента позже",
    visitTab: "ВИЗИТ",
    currentDay: "Сегодня",
    chooseService: "Выбрать услугу",
    start: "Начало",
    end: "Конец",
    primaryService: "Услуга",
    additionalService: "Доп. услуга",
    addAnotherService: "ДОБАВИТЬ ЕЩЕ УСЛУГУ ＋",
    removeService: "Удалить услугу",
    overlapWarning: "Есть наложение на существующие записи, но сохранить можно.",
    serviceBlocksOverlap: "Услуги внутри одной записи не должны пересекаться по времени.",
    total: "Итого",
    payable: "К оплате",
    cancelUpper: "ОТМЕНИТЬ",
    saveUpper: "СОХРАНИТЬ",
    savingUpper: "СОХРАНЯЕМ",
    searchPlaceholder: "Поиск",
    serviceDurationMinutes: "мин.",
    addNewService: (name) => `Добавить новую услугу "${name}"`,
    chooseClient: "Выбрать клиента",
    clientNameOrPhone: "Имя или телефон",
    clientSearchHint: "Найди клиента из базы, добавь нового за пару секунд или оставь визит без клиента.",
    withoutClient: "Без клиента",
    withoutClientHint: "Быстрая запись, в календаре будет показано “Клиент”",
    newClient: "Новый клиент",
    hideForm: "Скрыть форму",
    newClientHint: "Имя обязательно, телефон можно добавить позже",
    addClientTitle: "Добавить клиента",
    addClientText: "После сохранения клиент сразу привяжется к визиту.",
    clientName: "Имя клиента",
    phone: "Телефон",
    exampleName: "Например, Иван",
    addAndChoose: "Добавить и выбрать",
    clients: "Клиенты",
    noPhone: "Без телефона",
    allTeam: "Вся команда",
    chosenMasters: (count) => `Выбрано: ${count}`,
    showAllTeam: "Показать всю команду",
    selectedMasters: "Выбранные мастера",
    myMarker: "(вы)",
    visitsCountLabel: (count) => `${count} визитов`,
    clientNotFound: "Клиент не найден",
    clientsEmpty: "Список клиентов пустой",
    clientNotFoundHint: "Можно добавить нового клиента прямо здесь или сохранить запись без клиента.",
    clientsEmptyHint: "Добавьте первого клиента или сделайте быструю запись без клиента.",
    addNamedClient: (name) => `Добавить “${name}”`,
    blockedTimeFallback: "Забронированное время",
    walkInClient: "Клиент без бронирования",
    saveTime: "Сохранить время",
    deleteBlock: "Удалить блок",
    deleteVisit: "Удалить визит",
    moveVisit: "Перетащить запись",
    resizeVisit: "Изменить длительность записи",
    service: "Услуга",
    specialist: "Мастер",
    visitDateTime: "Дата и время",
    attendanceStatus: "Статус визита",
    attendancePending: "Ожидается",
    attendanceConfirmed: "Подтверждена",
    attendanceArrived: "Пришел",
    attendanceNoShow: "Не пришел",
    price: "Цена",
    notesLabel: "Заметка",
    quickContact: "Быстрая связь",
    call: "Позвонить",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    viber: "Viber",
    prefixAria: "Выбрать телефонный префикс",
    prefixSearch: "Поиск по стране или коду",
    contactPhoneHint: "Добавьте телефон клиента, чтобы быстро написать ему в мессенджер.",
    changeClient: "Сменить клиента",
    saveVisit: "Сохранить визит",
    deleteVisitConfirmTitle: "Вы точно хотите удалить запись?",
    deleteBlockConfirmTitle: "Вы точно хотите удалить блок времени?",
    deleteConfirmText: "Удаление сотрет запись из календаря и отменит быстрый возврат. Это действие нельзя отменить.",
    deleteCancel: "Нет",
    deleteConfirm: "Да, удалить",
    newClientModalTitle: "Новый клиент?",
    newClientModalText: "Добавь данные клиента, чтобы отправлять напоминания о визитах и мотивировать его на повторные записи.",
    addClientDataUpper: "ДОБАВИТЬ ДАННЫЕ КЛИЕНТА",
    notNowUpper: "НЕ СЕЙЧАС",
    chooseSpecialist: "Выбрать специалиста",
    refresh: "Обновить",
    notifications: "Уведомления",
    notificationsEmpty: "Пока нет новых событий.",
    recentBookings: "Недавние записи",
    accountMenu: "Меню аккаунта",
    myProfile: "Мой профиль",
    personalSettings: "Личные настройки",
    helpSupport: "Помощь и поддержка",
    logout: "Выйти",
    language: "Язык",
    publicLink: "Публичная ссылка",
    publicLinkTitle: "Ссылка для онлайн-записи",
    publicLinkHint: "Отправляйте ссылку клиентам, публикуйте в соцсетях или копируйте в один тап.",
    publicLinkCopy: "Копировать",
    publicLinkOpen: "Открыть страницу",
    publicLinkShare: "Поделиться",
    publicLinkCopied: "Ссылка для записи скопирована.",
    publicLinkSelected: "Ссылка выделена. Скопируйте её вручную, если браузер запретил доступ к буферу.",
    publicLinkDisabled: "Онлайн-запись выключена",
    publicLinkEnabled: "Онлайн-запись включена",
    recentBookingTitle: "Новая запись"
  },
  uk: {
    today: "Сьогодні",
    day: "День",
    threeDays: "3 дні",
    week: "Тиждень",
    month: "Місяць",
    daySchedule: "Розклад на день",
    waitlist: "Список очікування",
    weekJump: "Перейти до тижня",
    closed: "вихідний",
    closedBySchedule: "Вихідний за графіком",
    services: "послуг",
    dailyCalendar: "денний календар",
    visits: "візитів",
    selected: "Вибрано",
    masterFallback: "Майстер",
    back: "Назад",
    quickNewVisit: "Новий візит",
    quickBlockBusy: "Забронювати час",
    quickAddOffTime: "Додати неробочий час",
    blockedBusySaved: "Час заброньовано.",
    blockedOffTimeSaved: "Неробочий час додано.",
    outsideScheduleWarning: "Ви створюєте візит поза робочим графіком.",
    chooseTimeAndService: "Спочатку оберіть час і послугу.",
    chooseServiceForEveryBlock: "Оберіть послугу для кожного блоку візиту.",
    partBlocked: "Частину часу вже заблоковано.",
    pastTimeBlocked: "Не можна зберегти візит на минулий час.",
    saveVisitFailed: "Не вдалося зберегти візит.",
    enterClientName: "Введіть ім'я клієнта.",
    addClientFailed: "Не вдалося додати клієнта.",
    blockTimeFailed: "Не вдалося заблокувати час.",
    blockedRemoved: "Блок часу видалено.",
    visitRemoved: "Візит видалено.",
    visitUpdated: "Візит оновлено.",
    blockedSaveFailed: "Не вдалося зберегти блок часу.",
    blockedUpdated: "Блок часу оновлено.",
    visitSaved: "Візит збережено.",
    visitSavedOverlap: "Візит збережено з накладанням у часі.",
    deleteBlockFailed: "Не вдалося видалити блок.",
    newVisitTitle: "Новий візит",
    customer: "Клієнт",
    quickBookingWithoutClient: "Швидкий запис без клієнта",
    chooseClientLater: "Можна вибрати клієнта пізніше",
    visitTab: "ВІЗИТ",
    currentDay: "Сьогодні",
    chooseService: "Оберіть послугу",
    start: "Початок",
    end: "Кінець",
    primaryService: "Послуга",
    additionalService: "Дод. послуга",
    addAnotherService: "ДОДАТИ ЩЕ ПОСЛУГУ ＋",
    removeService: "Видалити послугу",
    overlapWarning: "Є накладення на наявні записи, але зберегти можна.",
    serviceBlocksOverlap: "Послуги в межах одного запису не повинні накладатися за часом.",
    total: "Разом",
    payable: "До оплати",
    cancelUpper: "СКАСУВАТИ",
    saveUpper: "ЗБЕРЕГТИ",
    savingUpper: "ЗБЕРІГАЄМО",
    searchPlaceholder: "Пошук",
    serviceDurationMinutes: "хв.",
    addNewService: (name) => `Додати нову послугу "${name}"`,
    chooseClient: "Оберіть клієнта",
    clientNameOrPhone: "Ім'я або телефон",
    clientSearchHint: "Знайдіть клієнта з бази, додайте нового за пару секунд або залиште візит без клієнта.",
    withoutClient: "Без клієнта",
    withoutClientHint: "Швидкий запис, у календарі буде показано “Клієнт”",
    newClient: "Новий клієнт",
    hideForm: "Сховати форму",
    newClientHint: "Ім'я обов'язкове, телефон можна додати пізніше",
    addClientTitle: "Додати клієнта",
    addClientText: "Після збереження клієнт одразу прив'яжеться до візиту.",
    clientName: "Ім'я клієнта",
    phone: "Телефон",
    exampleName: "Наприклад, Іван",
    addAndChoose: "Додати та вибрати",
    clients: "Клієнти",
    noPhone: "Без телефону",
    allTeam: "Вся команда",
    chosenMasters: (count) => `Обрано: ${count}`,
    showAllTeam: "Показати всю команду",
    selectedMasters: "Обрані майстри",
    myMarker: "(ви)",
    visitsCountLabel: (count) => `${count} візитів`,
    clientNotFound: "Клієнта не знайдено",
    clientsEmpty: "Список клієнтів порожній",
    clientNotFoundHint: "Можна додати нового клієнта прямо тут або зберегти запис без клієнта.",
    clientsEmptyHint: "Додайте першого клієнта або зробіть швидкий запис без клієнта.",
    addNamedClient: (name) => `Додати “${name}”`,
    blockedTimeFallback: "Заброньований час",
    walkInClient: "Клієнт без бронювання",
    saveTime: "Зберегти час",
    deleteBlock: "Видалити блок",
    deleteVisit: "Видалити візит",
    moveVisit: "Перетягнути запис",
    resizeVisit: "Змінити тривалість запису",
    service: "Послуга",
    specialist: "Майстер",
    visitDateTime: "Дата й час",
    attendanceStatus: "Статус візиту",
    attendancePending: "Очікується",
    attendanceConfirmed: "Підтверджено",
    attendanceArrived: "Прийшов",
    attendanceNoShow: "Не прийшов",
    price: "Ціна",
    notesLabel: "Нотатка",
    quickContact: "Швидкий зв'язок",
    call: "Зателефонувати",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    viber: "Viber",
    prefixAria: "Вибрати телефонний префікс",
    prefixSearch: "Пошук за країною або кодом",
    contactPhoneHint: "Додайте телефон клієнта, щоб швидко написати йому в месенджер.",
    changeClient: "Змінити клієнта",
    saveVisit: "Зберегти візит",
    deleteVisitConfirmTitle: "Ви точно хочете видалити запис?",
    deleteBlockConfirmTitle: "Ви точно хочете видалити блок часу?",
    deleteConfirmText: "Видалення прибере запис із календаря. Повернути дію після підтвердження не вийде.",
    deleteCancel: "Ні",
    deleteConfirm: "Так, видалити",
    newClientModalTitle: "Новий клієнт?",
    newClientModalText: "Додайте дані клієнта, щоб надсилати нагадування про візити й мотивувати його на повторні записи.",
    addClientDataUpper: "ДОДАТИ ДАНІ КЛІЄНТА",
    notNowUpper: "НЕ ЗАРАЗ",
    chooseSpecialist: "Обрати спеціаліста",
    refresh: "Оновити",
    notifications: "Сповіщення",
    notificationsEmpty: "Поки немає нових подій.",
    recentBookings: "Останні записи",
    accountMenu: "Меню акаунта",
    myProfile: "Мій профіль",
    personalSettings: "Особисті налаштування",
    helpSupport: "Допомога і підтримка",
    logout: "Вийти",
    language: "Мова",
    publicLink: "Публічне посилання",
    publicLinkTitle: "Посилання для онлайн-запису",
    publicLinkHint: "Надсилайте посилання клієнтам, публікуйте в соцмережах або копіюйте в один дотик.",
    publicLinkCopy: "Скопіювати",
    publicLinkOpen: "Відкрити сторінку",
    publicLinkShare: "Поділитися",
    publicLinkCopied: "Посилання для запису скопійовано.",
    publicLinkSelected: "Посилання виділено. Скопіюйте його вручну, якщо браузер заборонив буфер обміну.",
    publicLinkDisabled: "Онлайн-запис вимкнено",
    publicLinkEnabled: "Онлайн-запис увімкнено",
    recentBookingTitle: "Новий запис"
  },
  en: {
    today: "Today",
    day: "Day",
    threeDays: "3 days",
    week: "Week",
    month: "Month",
    daySchedule: "Day schedule",
    waitlist: "Waitlist",
    weekJump: "Jump to week",
    closed: "closed",
    closedBySchedule: "Closed by schedule",
    services: "services",
    dailyCalendar: "day calendar",
    visits: "visits",
    selected: "Selected",
    masterFallback: "Professional",
    back: "Back",
    quickNewVisit: "New visit",
    quickBlockBusy: "Block this time",
    quickAddOffTime: "Add unavailable time",
    blockedBusySaved: "Time has been blocked.",
    blockedOffTimeSaved: "Unavailable time added.",
    outsideScheduleWarning: "You are creating a visit outside working hours.",
    chooseTimeAndService: "Choose a time and service first.",
    chooseServiceForEveryBlock: "Choose a service for each visit block.",
    partBlocked: "Part of the selected time is already blocked.",
    pastTimeBlocked: "You cannot save a visit in the past.",
    saveVisitFailed: "Failed to save the visit.",
    enterClientName: "Enter the client name.",
    addClientFailed: "Failed to add the client.",
    blockTimeFailed: "Failed to block the time.",
    blockedRemoved: "Time block deleted.",
    visitRemoved: "Visit deleted.",
    visitUpdated: "Visit updated.",
    blockedSaveFailed: "Failed to save the time block.",
    blockedUpdated: "Time block updated.",
    visitSaved: "Visit saved.",
    visitSavedOverlap: "Visit saved with a time overlap.",
    deleteBlockFailed: "Failed to delete the block.",
    newVisitTitle: "New visit",
    customer: "Client",
    quickBookingWithoutClient: "Quick booking without a client",
    chooseClientLater: "You can choose a client later",
    visitTab: "VISIT",
    currentDay: "Today",
    chooseService: "Choose a service",
    start: "Start",
    end: "End",
    primaryService: "Service",
    additionalService: "Extra service",
    addAnotherService: "ADD ANOTHER SERVICE ＋",
    removeService: "Remove service",
    overlapWarning: "There is an overlap with existing bookings, but saving is allowed.",
    serviceBlocksOverlap: "Services inside one appointment cannot overlap each other.",
    total: "Total",
    payable: "To pay",
    cancelUpper: "CANCEL",
    saveUpper: "SAVE",
    savingUpper: "SAVING",
    searchPlaceholder: "Search",
    serviceDurationMinutes: "min.",
    addNewService: (name) => `Add a new service "${name}"`,
    chooseClient: "Choose a client",
    clientNameOrPhone: "Name or phone",
    clientSearchHint: "Find a client from your database, add a new one in seconds, or keep the visit without a client.",
    withoutClient: "Without client",
    withoutClientHint: "Quick booking, the calendar will show “Client”",
    newClient: "New client",
    hideForm: "Hide form",
    newClientHint: "Name is required, phone can be added later",
    addClientTitle: "Add client",
    addClientText: "After saving, the client will be linked to the visit immediately.",
    clientName: "Client name",
    phone: "Phone",
    exampleName: "For example, John",
    addAndChoose: "Add and choose",
    clients: "Clients",
    noPhone: "No phone",
    allTeam: "All team",
    chosenMasters: (count) => `Selected: ${count}`,
    showAllTeam: "Show full team",
    selectedMasters: "Selected specialists",
    myMarker: "(you)",
    visitsCountLabel: (count) => `${count} visits`,
    clientNotFound: "Client not found",
    clientsEmpty: "Client list is empty",
    clientNotFoundHint: "You can add a new client right here or save the booking without a client.",
    clientsEmptyHint: "Add your first client or create a quick booking without one.",
    addNamedClient: (name) => `Add “${name}”`,
    blockedTimeFallback: "Blocked time",
    walkInClient: "Walk-in client",
    saveTime: "Save time",
    deleteBlock: "Delete block",
    deleteVisit: "Delete visit",
    moveVisit: "Move appointment",
    resizeVisit: "Change appointment duration",
    service: "Service",
    specialist: "Specialist",
    visitDateTime: "Date and time",
    attendanceStatus: "Visit status",
    attendancePending: "Pending",
    attendanceConfirmed: "Confirmed",
    attendanceArrived: "Arrived",
    attendanceNoShow: "No-show",
    price: "Price",
    notesLabel: "Note",
    quickContact: "Quick contact",
    call: "Call",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    viber: "Viber",
    prefixAria: "Choose phone prefix",
    prefixSearch: "Search by country or code",
    contactPhoneHint: "Add the client's phone to quickly message them in a messenger.",
    changeClient: "Change client",
    saveVisit: "Save visit",
    deleteVisitConfirmTitle: "Are you sure you want to delete this appointment?",
    deleteBlockConfirmTitle: "Are you sure you want to delete this blocked time?",
    deleteConfirmText: "This will remove the item from the calendar. You won't be able to undo it afterwards.",
    deleteCancel: "No",
    deleteConfirm: "Yes, delete",
    newClientModalTitle: "New client?",
    newClientModalText: "Add client details to send visit reminders and encourage repeat bookings.",
    addClientDataUpper: "ADD CLIENT DETAILS",
    notNowUpper: "NOT NOW",
    chooseSpecialist: "Choose specialist",
    refresh: "Refresh",
    notifications: "Notifications",
    notificationsEmpty: "There are no new updates yet.",
    recentBookings: "Recent bookings",
    accountMenu: "Account menu",
    myProfile: "My profile",
    personalSettings: "Personal settings",
    helpSupport: "Help and support",
    logout: "Log out",
    language: "Language",
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
    recentBookingTitle: "New booking"
  }
};

function ContactChannelIcon({ kind }: { kind: "call" | "whatsapp" | "telegram" | "viber" }) {
  if (kind === "call") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7.2 4.8c.4-.4 1-.6 1.6-.4l2 .7c.7.2 1.1.9 1 1.6l-.3 2.3c1.2 2.3 3.1 4.2 5.4 5.4l2.3-.3c.7-.1 1.4.3 1.6 1l.7 2c.2.6 0 1.2-.4 1.6l-1 1c-.8.8-2 1.1-3.1.8-6.7-1.8-12-7.1-13.8-13.8-.3-1.1 0-2.3.8-3.1l1-1Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (kind === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.6a8.4 8.4 0 0 0-7.2 12.7l-1 4 4.1-1A8.4 8.4 0 1 0 12 3.6Zm4.8 11.9c-.2.5-1 .9-1.5 1-.4.1-.9.2-1.4 0-1-.3-2.2-1-3.3-2-1-1-1.8-2.2-2-3.2-.1-.5-.1-1 .1-1.4.1-.4.5-1.2 1-1.4.2-.1.4-.1.5 0 .1 0 .3 0 .4.3l.7 1.6c.1.2.1.4 0 .6l-.3.5c-.1.2-.2.3 0 .6.3.6.8 1.2 1.3 1.7.5.5 1.1 1 1.7 1.3.2.1.4.1.6 0l.5-.3c.2-.1.4-.1.6 0l1.6.7c.2.1.3.2.3.4.1.1.1.3 0 .5Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (kind === "telegram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="m20.4 5.2-2.6 13c-.2.9-.7 1.1-1.5.7l-4.2-3.1-2 .2-.9 3c-.1.3-.3.4-.6.4-.2 0-.4-.1-.6-.2l.3-4 7.3-6.6c.3-.3-.1-.4-.4-.2l-9 5.7-3.9-1.2c-.9-.3-.9-.9.2-1.3L19 4.3c.8-.3 1.5.2 1.3.9Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.1 3.5c4.7 0 8.6 3.4 8.6 7.7 0 4.2-3.9 7.7-8.6 7.7-.4 0-.8 0-1.2-.1l-4.6 2.4 1.2-3.8c-2.4-1.4-4-3.8-4-6.2 0-4.3 3.9-7.7 8.6-7.7Zm3.4 9.7c.2-.1.3-.4.2-.6l-.5-1c-.1-.2-.4-.3-.6-.2l-1 .5a.5.5 0 0 1-.5 0 5.5 5.5 0 0 1-1.2-1 5.5 5.5 0 0 1-1-1.2.5.5 0 0 1 0-.5l.5-1a.5.5 0 0 0-.2-.6l-1-.5a.5.5 0 0 0-.6.2l-.4.8c-.4.8-.4 1.7 0 2.5.4.8 1 1.7 1.8 2.5s1.7 1.4 2.5 1.8c.8.4 1.7.4 2.5 0l.8-.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoveHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6 15.8 6.5h-2.4v3h-2.8v-3H8.2L12 2.6Zm0 18.8-3.8-3.9h2.4v-3h2.8v3h2.4L12 21.4ZM2.6 12l3.9-3.8v2.4h3v2.8h-3v2.4L2.6 12Zm18.8 0-3.9 3.8v-2.4h-3v-2.8h3V8.2l3.9 3.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function addDays(dateKey: string, amount: number) {
  const next = new Date(`${dateKey}T00:00:00`);
  next.setDate(next.getDate() + amount);
  return formatDateKey(next);
}

function addMonths(dateKey: string, amount: number) {
  const current = new Date(`${dateKey}T00:00:00`);
  const next = new Date(current.getFullYear(), current.getMonth() + amount, 1);
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(current.getDate(), maxDay));
  return formatDateKey(next);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const mondayIndex = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayIndex);
  return formatDateKey(date);
}

function getWeekKeys(dateKey: string) {
  const firstDay = startOfWeek(dateKey);
  return Array.from({ length: 7 }, (_, index) => addDays(firstDay, index));
}

function getDateRangeKeys(dateKey: string, length: number) {
  return Array.from({ length }, (_, index) => addDays(dateKey, index));
}

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === "ru" || value === "uk" || value === "en";
}

function getLocale(language: AppLanguage): AppLocale {
  if (language === "uk") {
    return "uk-UA";
  }

  if (language === "en") {
    return "en-US";
  }

  return "ru-RU";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const safe = Math.max(0, Math.min(minutes, 24 * 60 - 5));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function getNormalizedContactPhone(phone: string, country: string | undefined) {
  const trimmed = phone.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    const digits = onlyPhoneDigits(trimmed);
    return digits.length >= 8 ? `+${digits}` : "";
  }

  if (!isPhoneValid(country ?? "", trimmed)) {
    return "";
  }

  return buildInternationalPhone(country ?? "", trimmed).replace(/\s+/g, " ").trim();
}

function getContactLinks(phone: string) {
  const digits = onlyPhoneDigits(phone);
  const normalizedPhone = digits ? `+${digits}` : "";

  return {
    call: normalizedPhone ? `tel:${normalizedPhone}` : "",
    whatsapp: digits ? `https://wa.me/${digits}` : "",
    telegram: digits ? `tg://resolve?phone=${digits}` : "",
    viber: normalizedPhone ? `viber://chat?number=${encodeURIComponent(normalizedPhone)}` : ""
  };
}

function getPersonInitial(name: string, fallback = "C") {
  return name.trim()[0]?.toUpperCase() ?? fallback;
}

function isWithinWorkingWindow(time: string, daySchedule: WorkDaySchedule | null) {
  return isTimeWithinWorkingWindow(time, daySchedule);
}

function appointmentsOverlap(startA: string, endA: string, startB: string, endB: string) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB);
}

function sortAppointmentsByTime(appointments: CalendarAppointment[]) {
  return [...appointments].sort(
    (left, right) =>
      getDateTimeValue(left.appointmentDate, left.startTime) - getDateTimeValue(right.appointmentDate, right.startTime) ||
      getDateTimeValue(left.appointmentDate, left.endTime) - getDateTimeValue(right.appointmentDate, right.endTime)
  );
}

function getServiceDuration(serviceName: string) {
  if (/бал|окраш|colour|color|педикюр|спа|full set|наращ|массаж/i.test(serviceName)) {
    return 120;
  }

  if (/маникюр|стрижк|уклад|brow|lash/i.test(serviceName)) {
    return 30;
  }

  return 60;
}

function getDateTimeValue(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00`).getTime();
}

function formatDisplayTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getScheduleLabel(schedule: WorkDaySchedule | null, closedLabel: string) {
  if (!schedule || !schedule.enabled) {
    return closedLabel;
  }

  return `${formatDisplayTime(schedule.startTime)}-${formatDisplayTime(schedule.endTime)}`;
}

function buildDisplayName(firstName = "", lastName = "", fallback = "") {
  return `${firstName} ${lastName}`.trim() || fallback;
}

function formatActivityTime(createdAt: string, locale: AppLocale) {
  const created = new Date(createdAt);
  const now = Date.now();
  const diffMinutes = Math.max(0, Math.round((now - created.getTime()) / 60000));

  if (diffMinutes < 60) {
    return locale === "uk-UA"
      ? `${diffMinutes} хв тому`
      : locale === "en-US"
        ? `${diffMinutes} min ago`
        : `${diffMinutes} мин назад`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return locale === "uk-UA"
      ? `${diffHours} год тому`
      : locale === "en-US"
        ? `${diffHours} hr ago`
        : `${diffHours} ч назад`;
  }

  return created.toLocaleDateString(locale, {
    day: "numeric",
    month: "short"
  });
}

function getServiceColor(serviceName: string, services: CalendarSnapshot["workspace"]["services"]) {
  const service = services.find((item) => item.name === serviceName);

  if (service?.color) {
    return service.color;
  }

  let hash = 0;
  for (const char of serviceName) {
    hash = (hash * 31 + char.charCodeAt(0)) % SERVICE_COLORS.length;
  }
  return SERVICE_COLORS[Math.abs(hash) % SERVICE_COLORS.length];
}

function getServiceDurationMinutes(serviceName: string, services: CalendarSnapshot["workspace"]["services"]) {
  const service = services.find((item) => item.name === serviceName);
  return service?.durationMinutes || getServiceDuration(serviceName);
}

function formatMoney(value: number, currency: string | undefined, locale: AppLocale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function getMonthGrid(dateKey: string) {
  const active = new Date(`${dateKey}T00:00:00`);
  const first = new Date(active.getFullYear(), active.getMonth(), 1);
  const mondayIndex = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayIndex);

  return Array.from({ length: 35 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return {
      key: formatDateKey(current),
      day: current.getDate(),
      outside: current.getMonth() !== active.getMonth()
    };
  });
}

function createDraftService(startTime: string, serviceName = "", priceAmount = 0, duration = 15): VisitServiceDraft {
  return {
    id: crypto.randomUUID(),
    serviceName,
    startTime,
    endTime: minutesToTime(timeToMinutes(startTime) + duration),
    priceAmount
  };
}

function patchDraftService(item: VisitServiceDraft, patch: Partial<VisitServiceDraft>) {
  const nextItem = { ...item, ...patch };

  if (patch.startTime && !patch.endTime) {
    const originalDuration = Math.max(15, timeToMinutes(item.endTime) - timeToMinutes(item.startTime));
    nextItem.endTime = minutesToTime(timeToMinutes(patch.startTime) + originalDuration);
  }

  if (patch.endTime && timeToMinutes(patch.endTime) <= timeToMinutes(nextItem.startTime)) {
    nextItem.endTime = minutesToTime(timeToMinutes(nextItem.startTime) + 15);
  }

  return nextItem;
}

function roundMinutesToStep(minutes: number, step = TIME_SELECT_STEP_MINUTES) {
  return Math.ceil(minutes / step) * step;
}

function getAppointmentLayouts(appointments: CalendarAppointment[]) {
  const sorted = [...appointments].sort(
    (left, right) =>
      timeToMinutes(left.startTime) - timeToMinutes(right.startTime) ||
      timeToMinutes(left.endTime) - timeToMinutes(right.endTime)
  );
  const layouts = new Map<string, { lane: number; laneCount: number }>();
  const groups: CalendarAppointment[][] = [];

  for (const appointment of sorted) {
    const lastGroup = groups[groups.length - 1];

    if (!lastGroup) {
      groups.push([appointment]);
      continue;
    }

    const groupEnd = Math.max(...lastGroup.map((item) => timeToMinutes(item.endTime)));
    if (timeToMinutes(appointment.startTime) < groupEnd) {
      lastGroup.push(appointment);
      continue;
    }

    groups.push([appointment]);
  }

  for (const group of groups) {
    const laneEnds: number[] = [];
    const assigned = new Map<string, number>();

    for (const appointment of group) {
      const start = timeToMinutes(appointment.startTime);
      let lane = laneEnds.findIndex((end) => end <= start);

      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }

      laneEnds[lane] = timeToMinutes(appointment.endTime);
      assigned.set(appointment.id, lane);
    }

    const laneCount = Math.max(1, laneEnds.length);
    for (const appointment of group) {
      layouts.set(appointment.id, {
        lane: assigned.get(appointment.id) ?? 0,
        laneCount
      });
    }
  }

  return layouts;
}

export default function CalendarDayView({ professionalId, initialDate }: CalendarDayViewProps) {
  const router = useRouter();
  const topOffset = 24;
  const dayStartMinutes = 0;
  const dayEndMinutes = 24 * 60;
  const dragStepMinutes = 5;
  const minimumAppointmentDuration = 15;
  const timeOptionCount = (24 * 60) / TIME_SELECT_STEP_MINUTES;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(professionalId);
  const [visibleProfessionalIds, setVisibleProfessionalIds] = useState<string[]>([professionalId]);
  const [activeToolbarMenu, setActiveToolbarMenu] = useState<null | "view" | "team" | "share" | "account">(null);
  const [uiLanguage, setUiLanguage] = useState<AppLanguage>("ru");
  const [snapshot, setSnapshot] = useState<CalendarSnapshot | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [quickMenu, setQuickMenu] = useState<QuickMenuState>({
    visible: false,
    x: 0,
    y: 0,
    time: "",
    professionalId
  });
  const [drawerStage, setDrawerStage] = useState<DrawerStage>("closed");
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [toast, setToast] = useState<CalendarToastState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [attendanceDraft, setAttendanceDraft] = useState<"pending" | "confirmed" | "arrived" | "no_show">("pending");
  const [priceAmountDraft, setPriceAmountDraft] = useState("0");
  const [detailsCustomerNameDraft, setDetailsCustomerNameDraft] = useState("");
  const [detailsCustomerPhoneDraft, setDetailsCustomerPhoneDraft] = useState("");
  const [detailsCustomerPhoneCountryDraft, setDetailsCustomerPhoneCountryDraft] = useState("Ukraine");
  const [detailsStartTimeDraft, setDetailsStartTimeDraft] = useState("09:00");
  const [detailsEndTimeDraft, setDetailsEndTimeDraft] = useState("09:15");
  const [detailsServiceNameDraft, setDetailsServiceNameDraft] = useState("");
  const [detailsNotesDraft, setDetailsNotesDraft] = useState("");
  const [visitItems, setVisitItems] = useState<VisitServiceDraft[]>([]);
  const [editingServiceIndex, setEditingServiceIndex] = useState(0);
  const [servicePickerReturnStage, setServicePickerReturnStage] = useState<"visit" | "details">("visit");
  const [serviceQuery, setServiceQuery] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [directoryClients, setDirectoryClients] = useState<CalendarDirectoryClient[]>([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientPhoneCountry, setNewClientPhoneCountry] = useState("Ukraine");
  const [isNewClientPrefixOpen, setIsNewClientPrefixOpen] = useState(false);
  const [newClientPrefixSearch, setNewClientPrefixSearch] = useState("");
  const [isDetailsPrefixOpen, setIsDetailsPrefixOpen] = useState(false);
  const [detailsPrefixSearch, setDetailsPrefixSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CalendarClient | null>(null);
  const [clientSearchReturnStage, setClientSearchReturnStage] = useState<"visit" | "details">("visit");
  const [showClientPrompt, setShowClientPrompt] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<CalendarAppointment | null>(null);
  const [isDeletingAppointment, setIsDeletingAppointment] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileTeamButtonPosition, setMobileTeamButtonPosition] = useState<{ top: number; left: number } | null>(null);
  const [teamQuery, setTeamQuery] = useState("");
  const mobileDayHourColumnWidth = 52;
  const dayMemberColumnWidth = isMobileViewport ? 164 : 280;
  const teamBoardDayWidth = isMobileViewport ? 92 : 180;
  const calendarHourHeight = isMobileViewport ? CALENDAR_MOBILE_HOUR_HEIGHT : CALENDAR_HOUR_HEIGHT;
  const minuteHeight = calendarHourHeight / 60;
  const slotHeight = minuteHeight * CALENDAR_GRID_STEP_MINUTES;
  const calendarGridHeight = topOffset + dayEndMinutes * minuteHeight;
  const bookingCardMinHeight = isMobileViewport ? MOBILE_MIN_BOOKING_CARD_HEIGHT : MIN_BOOKING_CARD_HEIGHT;
  const viewMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const teamMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileTeamMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const shareMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const viewMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const teamMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const shareMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const accountMenuPanelRef = useRef<HTMLDivElement | null>(null);
  const shareLinkInputRef = useRef<HTMLInputElement | null>(null);
  const quickMenuRef = useRef<HTMLDivElement | null>(null);
  const newClientPrefixMenuRef = useRef<HTMLDivElement | null>(null);
  const detailsPrefixMenuRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef<
    | {
        startY: number;
        originalStartMinutes: number;
        originalEndMinutes: number;
        appointmentId: string;
        mode: "move" | "resize";
      }
    | null
  >(null);
  const scrollFrameRef = useRef<HTMLDivElement | null>(null);

  function showToast(text: string, tone: CalendarToastTone = "info") {
    setToast({
      id: Date.now() + Math.round(Math.random() * 1000),
      text,
      tone
    });
  }

  function applyPhoneDraft(
    phone: string,
    fallbackCountry: string,
    setters: {
      setCountry: (country: string) => void;
      setPhone: (value: string) => void;
    }
  ) {
    const phoneState = getPhoneEditingState(phone, fallbackCountry);
    setters.setCountry(phoneState.country);
    setters.setPhone(phoneState.localPhone);
  }

  function openClientSearch(returnStage: "visit" | "details") {
    setClientSearchReturnStage(returnStage);
    setDrawerStage("client-search");
  }

  function updateDraftTime(
    nextStartTime: string,
    nextEndTime: string,
    setters: {
      setStart: (value: string) => void;
      setEnd: (value: string) => void;
    }
  ) {
    const normalizedStart = nextStartTime;
    let normalizedEnd = nextEndTime;

    if (timeToMinutes(normalizedEnd) <= timeToMinutes(normalizedStart)) {
      normalizedEnd = minutesToTime(timeToMinutes(normalizedStart) + 15);
    }

    setters.setStart(normalizedStart);
    setters.setEnd(normalizedEnd);
  }

  function applySelectedClient(client: CalendarClient | null) {
    setSelectedCustomer(client);
    setClientQuery("");
    setShowNewClientForm(false);
    setNewClientName("");
    setNewClientPhone("");
    setNewClientPhoneCountry(accountCountry);

    if (clientSearchReturnStage === "details" && selectedAppointment?.kind === "appointment") {
      setDetailsCustomerNameDraft(client?.name ?? "");
      applyPhoneDraft(client?.phone ?? "", accountCountry, {
        setCountry: setDetailsCustomerPhoneCountryDraft,
        setPhone: setDetailsCustomerPhoneDraft
      });
      setDrawerStage("details");
      return;
    }

    setDrawerStage("visit");
  }

  function requestDeleteAppointment(appointment: CalendarAppointment) {
    setDeleteConfirmTarget(appointment);
  }

  function closeDeleteConfirm() {
    if (isDeletingAppointment) {
      return;
    }
    setDeleteConfirmTarget(null);
  }

  function renderCalendarToast() {
    if (!toast) {
      return null;
    }

    const toneClassName =
      toast.tone === "success"
        ? styles.calendarToastSuccess
        : toast.tone === "warning"
          ? styles.calendarToastWarning
          : toast.tone === "error"
            ? styles.calendarToastError
            : styles.calendarToastInfo;

    return (
      <div className={styles.calendarToastViewport} aria-live="polite" aria-atomic="true">
        <div className={`${styles.calendarToast} ${toneClassName}`} role="status">
          <span>{toast.text}</span>
          <button
            type="button"
            className={styles.calendarToastClose}
            aria-label="Close message"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("rezervo-pro-language");
    if (isAppLanguage(storedLanguage)) {
      setUiLanguage(storedLanguage);
    }

    function handleLanguageChange(event: Event) {
      const nextLanguage = (event as CustomEvent<string>).detail;
      if (isAppLanguage(nextLanguage)) {
        setUiLanguage(nextLanguage);
      }
    }

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    if (!snapshot?.viewer.language) {
      return;
    }

    setUiLanguage(languageFromProfile(snapshot.viewer.language));
  }, [snapshot?.viewer.language]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 980px)");
    const syncViewport = () => setIsMobileViewport(media.matches);
    syncViewport();

    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  function buildCalendarUrl(dateKey = selectedDate, targetId = selectedProfessionalId) {
    const params = new URLSearchParams({ date: dateKey });

    if (targetId) {
      params.set("targetProfessionalId", targetId);
    }

    return `/api/pro/calendar?${params.toString()}`;
  }

  async function loadSnapshot(dateKey = selectedDate, targetId = selectedProfessionalId) {
    const response = await fetch(buildCalendarUrl(dateKey, targetId));
    const data = (await response.json()) as CalendarSnapshot;
    const allowedIds = (data.memberCalendars ?? []).map((member) => member.professionalId);
    const nextVisibleIds =
      visibleProfessionalIds.filter((memberId) => allowedIds.includes(memberId)) ||
      [];

    setSnapshot(data);
    setSelectedProfessionalId(data.viewedProfessionalId || professionalId);
    setVisibleProfessionalIds(
      nextVisibleIds.length
        ? nextVisibleIds
        : [data.viewedProfessionalId || professionalId].filter(Boolean)
    );
    setSelectedTime("");
    setQuickMenu({
      visible: false,
      x: 0,
      y: 0,
      time: "",
      professionalId: data.viewedProfessionalId || professionalId
    });
    setActiveToolbarMenu(null);
    setDrawerStage("closed");
    setSelectedAppointmentId(null);
    setToast(null);
    setVisitItems([]);
    setSelectedCustomer(null);
    setClientSearchReturnStage("visit");
    setServiceQuery("");
    setClientQuery("");
    setShowNewClientForm(false);
    setNewClientName("");
    setNewClientPhone("");
    setTeamQuery("");
    setDeleteConfirmTarget(null);
    setIsDeletingAppointment(false);
  }

  useEffect(() => {
    void loadSnapshot(selectedDate, selectedProfessionalId);
  }, [selectedDate]);

  useEffect(() => {
    if (drawerStage !== "client-search") {
      return;
    }

    void fetch("/api/pro/clients")
      .then((response) => response.json())
      .then((payload: { clients?: CalendarDirectoryClient[] }) => {
        setDirectoryClients(payload.clients ?? []);
      })
      .catch(() => setDirectoryClients([]));
  }, [drawerStage]);

  useEffect(() => {
    if (!activeToolbarMenu) {
      return;
    }

    const teamAnchor = isMobileViewport ? mobileTeamMenuButtonRef.current : teamMenuButtonRef.current;
    const anchor =
      activeToolbarMenu === "view"
        ? viewMenuButtonRef.current
        : activeToolbarMenu === "team"
          ? teamAnchor
          : activeToolbarMenu === "share"
            ? shareMenuButtonRef.current
            : accountMenuButtonRef.current;
    const panel =
      activeToolbarMenu === "view"
        ? viewMenuPanelRef.current
        : activeToolbarMenu === "team"
          ? teamMenuPanelRef.current
          : activeToolbarMenu === "share"
            ? shareMenuPanelRef.current
            : accountMenuPanelRef.current;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if ((anchor && anchor.contains(target)) || (panel && panel.contains(target))) {
        return;
      }

      setActiveToolbarMenu(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveToolbarMenu(null);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeToolbarMenu, isMobileViewport]);

  useEffect(() => {
    if (!quickMenu.visible) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (quickMenuRef.current?.contains(target)) {
        return;
      }

      setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [quickMenu.visible]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, toast.tone === "success" ? 2400 : toast.tone === "warning" ? 3200 : toast.tone === "error" ? 4000 : 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  async function applyLanguage(nextLanguage: AppLanguage) {
    if (nextLanguage === uiLanguage) {
      setActiveToolbarMenu(null);
      return;
    }

    setUiLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.localStorage.setItem("rezervo-pro-language", nextLanguage);
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: nextLanguage }));
    setActiveToolbarMenu(null);

    try {
      await fetch("/api/pro/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: profileLanguageFromCode(nextLanguage) })
      });
    } catch {
      // Keep the local language choice even if remote save is temporarily unavailable.
    }
  }

  async function handleAccountLogout() {
    await fetch("/api/pro/logout", { method: "POST" });
    router.push("/pro/login");
    router.refresh();
  }

  const todayDate = formatDateKey(new Date());
  const t = CALENDAR_TEXT[uiLanguage];
  const locale = getLocale(uiLanguage);
  const accountCountry = snapshot?.viewer.country || "Ukraine";
  const accountCurrency = snapshot?.viewer.currency;
  const newClientPhoneRule = getPhoneRule(newClientPhoneCountry || accountCountry);
  const detailsCustomerPhoneRule = getPhoneRule(detailsCustomerPhoneCountryDraft || accountCountry);
  const viewedProfessionalName = buildDisplayName(
    snapshot?.workspace.professional.firstName,
    snapshot?.workspace.professional.lastName,
    t.masterFallback
  );
  const viewedProfessionalInitials = useMemo(() => {
    if (!snapshot) {
      return "RZ";
    }

    return `${snapshot.workspace.professional.firstName?.[0] ?? ""}${snapshot.workspace.professional.lastName?.[0] ?? ""}`.toUpperCase() || "RZ";
  }, [snapshot]);
  const viewerName = buildDisplayName(
    snapshot?.viewer.firstName,
    snapshot?.viewer.lastName,
    viewedProfessionalName
  );
  const viewerInitials = `${snapshot?.viewer.firstName?.[0] ?? ""}${snapshot?.viewer.lastName?.[0] ?? ""}`.toUpperCase() || viewedProfessionalInitials;
  const teamMembers = snapshot?.teamMembers ?? [];
  const memberCalendars = snapshot?.memberCalendars ?? [];
  const recentActivity = snapshot?.recentActivity ?? [];
  const canSwitchProfessional = snapshot?.viewer.scope === "owner" && teamMembers.length > 1;
  const filteredTeamMembers = useMemo(() => {
    const query = teamQuery.trim().toLowerCase();

    if (!query) {
      return memberCalendars;
    }

    return memberCalendars.filter((member) =>
      buildDisplayName(member.firstName, member.lastName, t.masterFallback).toLowerCase().includes(query)
    );
  }, [memberCalendars, teamQuery, t.masterFallback]);
  const visibleCalendars = useMemo(() => {
    const allowed = new Set(visibleProfessionalIds);
    const calendars = memberCalendars.filter((member) => allowed.has(member.professionalId));
    return calendars.length ? calendars : memberCalendars.filter((member) => member.professionalId === selectedProfessionalId);
  }, [memberCalendars, selectedProfessionalId, visibleProfessionalIds]);
  const visibleCalendarIds = useMemo(
    () => visibleCalendars.map((member) => member.professionalId),
    [visibleCalendars]
  );
  const isShowingAllTeam = memberCalendars.length > 1 && visibleCalendarIds.length === memberCalendars.length;
  const isTeamMultiView = visibleCalendarIds.length > 1;
  const publicBookingUrl = snapshot?.workspace.business.publicBookingUrl ?? "";
  const publicBookingEnabled = snapshot?.workspace.business.allowOnlineBooking === true;
  const canUseNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";
  const filteredNewClientPhoneCountries = useMemo(() => {
    const query = newClientPrefixSearch.trim().toLowerCase();
    if (!query) {
      return phoneCountries;
    }

    return phoneCountries.filter((country) => {
      const rule = getPhoneRule(country);
      return country.toLowerCase().includes(query) || rule.prefix.toLowerCase().includes(query);
    });
  }, [newClientPrefixSearch]);
  const filteredDetailsPhoneCountries = useMemo(() => {
    const query = detailsPrefixSearch.trim().toLowerCase();
    if (!query) {
      return phoneCountries;
    }

    return phoneCountries.filter((country) => {
      const rule = getPhoneRule(country);
      return country.toLowerCase().includes(query) || rule.prefix.toLowerCase().includes(query);
    });
  }, [detailsPrefixSearch]);

  function selectPublicBookingLink() {
    shareLinkInputRef.current?.focus();
    shareLinkInputRef.current?.select();
  }

  async function copyPublicBookingLink(closeMenu = false) {
    if (!publicBookingUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(publicBookingUrl);
      showToast(t.publicLinkCopied, "success");
    } catch {
      selectPublicBookingLink();
      showToast(t.publicLinkSelected, "info");
    }

    if (closeMenu) {
      setActiveToolbarMenu(null);
    }
  }

  async function sharePublicBookingLink() {
    if (!publicBookingUrl) {
      return;
    }

    if (!canUseNativeShare) {
      await copyPublicBookingLink(true);
      return;
    }

    try {
      await navigator.share({
        title: snapshot?.workspace.business.name || "Timviz",
        text: t.publicLinkTitle,
        url: publicBookingUrl
      });
      setActiveToolbarMenu(null);
    } catch {
      // Ignore cancelled native share sheets.
    }
  }
  const allVisibleAppointments = useMemo(
    () => visibleCalendars.flatMap((member) => member.appointments),
    [visibleCalendars]
  );
  const focusedMemberCalendar =
    memberCalendars.find((member) => member.professionalId === selectedProfessionalId) ??
    memberCalendars[0] ??
    null;
  const calendarSelectorLabel = isShowingAllTeam
    ? t.allTeam
    : visibleCalendars.length === 1
      ? buildDisplayName(visibleCalendars[0]?.firstName, visibleCalendars[0]?.lastName, t.masterFallback)
      : t.chosenMasters(visibleCalendars.length);
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
  const selectedDateLong = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
  const threeDayKeys = useMemo(() => getDateRangeKeys(selectedDate, 3), [selectedDate]);
  const selectedThreeDayLabel = `${new Date(`${threeDayKeys[0]}T00:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short"
  })} - ${new Date(`${threeDayKeys[2]}T00:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short"
  })}`;
  const selectedMonthLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, {
    month: "long"
  });
  const weekKeys = useMemo(() => getWeekKeys(selectedDate), [selectedDate]);
  const selectedWeekLabel = `${new Date(`${weekKeys[0]}T00:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short"
  })} - ${new Date(`${weekKeys[6]}T00:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "short"
  })}`;
  const activeDateLabel =
    viewMode === "month"
      ? selectedMonthLabel
      : viewMode === "week"
        ? selectedWeekLabel
        : viewMode === "threeDay"
          ? selectedThreeDayLabel
          : selectedDateLong;
  const viewModeOptions: Array<{ value: CalendarViewMode; label: string }> = [
    { value: "day", label: t.day },
    { value: "threeDay", label: t.threeDays },
    { value: "week", label: t.week },
    { value: "month", label: t.month }
  ];
  const monthGrid = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const scheduleOverrides = useMemo<CustomSchedule>(() => {
    if (!focusedMemberCalendar) {
      return {};
    }

    return focusedMemberCalendar.memberSchedule.workScheduleMode === "flexible"
      ? focusedMemberCalendar.memberSchedule.customSchedule
      : {};
  }, [focusedMemberCalendar]);

  const daySchedule = useMemo(() => {
    if (!focusedMemberCalendar) {
      return null;
    }

    return resolveDaySchedule(selectedDate, focusedMemberCalendar.memberSchedule.workSchedule, scheduleOverrides);
  }, [focusedMemberCalendar, scheduleOverrides, selectedDate]);

  const monthSchedules = useMemo(() => {
    if (!focusedMemberCalendar) {
      return new Map<string, WorkDaySchedule>();
    }

    return new Map(
      monthGrid.map((day) => [
        day.key,
        resolveDaySchedule(day.key, focusedMemberCalendar.memberSchedule.workSchedule, scheduleOverrides)
      ])
    );
  }, [focusedMemberCalendar, monthGrid, scheduleOverrides]);

  const workStartMinutes = daySchedule ? timeToMinutes(daySchedule.startTime) : 9 * 60;
  const workEndMinutes = daySchedule ? timeToMinutes(daySchedule.endTime) : 18 * 60;
  const dayBreaks = useMemo(
    () =>
      getDayBreaks(daySchedule).map((breakItem) => ({
        ...breakItem,
        startMinutes: timeToMinutes(breakItem.startTime),
        endMinutes: timeToMinutes(breakItem.endTime)
      })),
    [daySchedule]
  );
  const selectedDayIsWorking = Boolean(daySchedule?.enabled);
  const teamBoardKeys = viewMode === "threeDay" ? threeDayKeys : weekKeys;
  const teamAppointmentsByMemberAndDay = useMemo(
    () =>
      new Map(
        visibleCalendars.map((member) => [
          member.professionalId,
          new Map(
            teamBoardKeys.map((dayKey) => [
              dayKey,
              sortAppointmentsByTime(member.appointments.filter((appointment) => appointment.appointmentDate === dayKey))
            ])
          )
        ])
      ),
    [teamBoardKeys, visibleCalendars]
  );
  const visibleAppointmentsByDay = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    const sourceKeys = monthGrid.map((day) => day.key);

    for (const dayKey of sourceKeys) {
      map.set(
        dayKey,
        sortAppointmentsByTime(allVisibleAppointments.filter((appointment) => appointment.appointmentDate === dayKey))
      );
    }

    return map;
  }, [allVisibleAppointments, monthGrid]);

  useEffect(() => {
    if (!memberCalendars.length) {
      return;
    }

    const allowedIds = new Set(memberCalendars.map((member) => member.professionalId));
    setVisibleProfessionalIds((current) => {
      const next = current.filter((memberId) => allowedIds.has(memberId));
      if (next.length) {
        return next;
      }
      return [selectedProfessionalId];
    });
  }, [memberCalendars, selectedProfessionalId]);

  useEffect(() => {
    if (!isMobileViewport || !canSwitchProfessional) {
      setMobileTeamButtonPosition(null);
      return;
    }

    const updatePosition = () => {
      const frameRect = scrollFrameRef.current?.getBoundingClientRect();
      if (!frameRect) {
        return;
      }

      setMobileTeamButtonPosition({
        top: Math.max(96, Math.round(frameRect.top + 12)),
        left: Math.round(frameRect.left + Math.max(2, (mobileDayHourColumnWidth - 48) / 2))
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [canSwitchProfessional, isMobileViewport, mobileDayHourColumnWidth, viewMode, selectedDate, visibleCalendarIds.length]);

  useEffect(() => {
    const frame = scrollFrameRef.current;
    if (!frame) {
      return;
    }

    const targetMinutes =
      selectedDate === todayDate
        ? (() => {
            const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
            return currentMinutes >= workStartMinutes
              ? Math.max(dayStartMinutes, currentMinutes - 2)
              : Math.max(dayStartMinutes, workStartMinutes - 2);
          })()
        : Math.max(dayStartMinutes, workStartMinutes - 2);

    frame.scrollTo({
      top: Math.max(0, topOffset + targetMinutes * minuteHeight - 40),
      behavior: "smooth"
    });
  }, [selectedDate, todayDate, workStartMinutes, minuteHeight]);

  function ensureFormFieldVisible(target: HTMLElement | null, behavior: ScrollBehavior = "smooth") {
    if (!target || typeof window === "undefined" || window.innerWidth > 820) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior
      });
    });
  }

  function scrollCalendarToTime(targetMinutes: number, behavior: ScrollBehavior = "smooth") {
    const frame = scrollFrameRef.current;
    if (!frame) {
      return;
    }

    frame.scrollTo({
      top: Math.max(0, topOffset + targetMinutes * minuteHeight - Math.max(40, frame.clientHeight * 0.22)),
      behavior
    });
  }

  function getVisibleAnchorMinutes() {
    const frame = scrollFrameRef.current;
    if (!frame || frame.clientHeight <= 0) {
      return null;
    }

    return Math.max(
      dayStartMinutes,
      roundMinutesToStep(Math.round((frame.scrollTop + frame.clientHeight * 0.28 - topOffset) / minuteHeight))
    );
  }

  function getSuggestedVisitStartTime() {
    if (selectedTime) {
      return selectedTime;
    }

    const visibleAnchorMinutes = getVisibleAnchorMinutes();
    const now = new Date();
    let candidateMinutes =
      visibleAnchorMinutes ??
      (selectedDate === todayDate
        ? roundMinutesToStep(now.getHours() * 60 + now.getMinutes())
        : workStartMinutes);

    if (selectedDate === todayDate) {
      candidateMinutes = Math.max(candidateMinutes, roundMinutesToStep(now.getHours() * 60 + now.getMinutes()));
    }

    if (daySchedule?.enabled) {
      candidateMinutes = Math.max(candidateMinutes, workStartMinutes);

      const overlappingBreak = dayBreaks.find(
        (breakItem) => candidateMinutes >= breakItem.startMinutes && candidateMinutes < breakItem.endMinutes
      );
      if (overlappingBreak) {
        candidateMinutes = overlappingBreak.endMinutes;
      }

      if (candidateMinutes >= workEndMinutes) {
        candidateMinutes = Math.max(workStartMinutes, workEndMinutes - minimumAppointmentDuration);
      }
    }

    return minutesToTime(candidateMinutes);
  }

  const nowLineTop = useMemo(() => {
    if (selectedDate !== todayDate) {
      return null;
    }
    const now = new Date();
    return Math.max(0, now.getHours() * 60 + now.getMinutes()) * minuteHeight;
  }, [minuteHeight, selectedDate, todayDate]);

  const filteredServices = useMemo(() => {
    const items = snapshot?.workspace.services ?? [];
    if (!serviceQuery.trim()) {
      return items;
    }
    return items.filter((service) => service.name.toLowerCase().includes(serviceQuery.trim().toLowerCase()));
  }, [serviceQuery, snapshot?.workspace.services]);

  const filteredClients = useMemo(() => {
    const manualClients = directoryClients.map((client) => ({
      name: client.fullName,
      phone: client.phone,
      visitsCount: client.visitsCount
    }));
    const appointmentClients = (snapshot?.clients ?? []).map((client) => ({
      ...client,
      visitsCount: 0
    }));
    const clients = Array.from(
      new Map([...manualClients, ...appointmentClients].map((client) => [`${client.name.toLowerCase()}::${client.phone}`, client])).values()
    );
    const query = clientQuery.trim().toLowerCase();

    if (!query) {
      return clients.slice(0, 10);
    }

    return clients.filter((client) => `${client.name} ${client.phone}`.toLowerCase().includes(query));
  }, [clientQuery, directoryClients, snapshot?.clients]);

  const selectedAppointment = useMemo(
    () => allVisibleAppointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [allVisibleAppointments, selectedAppointmentId]
  );
  const selectedAppointmentMember = useMemo(
    () =>
      selectedAppointment
        ? memberCalendars.find((member) => member.professionalId === selectedAppointment.professionalId) ?? null
        : null,
    [memberCalendars, selectedAppointment]
  );
  const selectedAppointmentDateLabel = useMemo(() => {
    if (!selectedAppointment) {
      return selectedDateLabel;
    }

    return new Date(`${selectedAppointment.appointmentDate}T00:00:00`).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }, [locale, selectedAppointment, selectedDateLabel]);
  const selectedAppointmentContactPhone = useMemo(
    () =>
      getNormalizedContactPhone(
        detailsCustomerPhoneDraft || selectedAppointment?.customerPhone || "",
        detailsCustomerPhoneDraft ? detailsCustomerPhoneCountryDraft : accountCountry
      ),
    [accountCountry, detailsCustomerPhoneCountryDraft, detailsCustomerPhoneDraft, selectedAppointment]
  );
  const selectedAppointmentContactLinks = useMemo(
    () => getContactLinks(selectedAppointmentContactPhone),
    [selectedAppointmentContactPhone]
  );
  const appointmentContactActions = useMemo(
    () => [
      { key: "call", label: t.call, shortLabel: "☎", href: selectedAppointmentContactLinks.call, external: false },
      { key: "whatsapp", label: t.whatsapp, shortLabel: "WA", href: selectedAppointmentContactLinks.whatsapp, external: true },
      { key: "telegram", label: t.telegram, shortLabel: "TG", href: selectedAppointmentContactLinks.telegram, external: false },
      { key: "viber", label: t.viber, shortLabel: "VB", href: selectedAppointmentContactLinks.viber, external: false }
    ],
    [selectedAppointmentContactLinks.call, selectedAppointmentContactLinks.telegram, selectedAppointmentContactLinks.viber, selectedAppointmentContactLinks.whatsapp, t.call, t.telegram, t.viber, t.whatsapp]
  );
  const calendarStats = snapshot?.stats ?? {
    day: { visitsCount: 0, revenue: 0 },
    week: { visitsCount: 0, revenue: 0 },
    month: { visitsCount: 0, revenue: 0 }
  };
  const focusedAppointments = focusedMemberCalendar?.appointments ?? snapshot?.appointments ?? [];

  const visitTotal = useMemo(
    () => visitItems.reduce((sum, item) => sum + Number(item.priceAmount || 0), 0),
    [visitItems]
  );

  const visitHasOverlap = useMemo(() => {
    const appointments = focusedAppointments;
    return visitItems.some((item) =>
      appointments.some(
        (appointment) =>
          appointment.kind === "appointment" &&
          appointmentsOverlap(item.startTime, item.endTime, appointment.startTime, appointment.endTime)
      )
    );
  }, [focusedAppointments, visitItems]);

  const blockedSelection = useMemo(() => {
    const blockedAppointments = focusedAppointments.filter((appointment) => appointment.kind === "blocked");
    return visitItems.some((item) =>
      blockedAppointments.some((appointment) =>
        appointmentsOverlap(item.startTime, item.endTime, appointment.startTime, appointment.endTime)
      )
    );
  }, [focusedAppointments, visitItems]);

  const appointmentLayoutsByProfessional = useMemo(
    () =>
      new Map(
        visibleCalendars.map((member) => [
          member.professionalId,
          getAppointmentLayouts(member.appointments)
        ])
      ),
    [visibleCalendars]
  );

  useEffect(() => {
    setNewClientPhoneCountry((current) => current || accountCountry);
    setDetailsCustomerPhoneCountryDraft((current) => current || accountCountry);
  }, [accountCountry]);

  useEffect(() => {
    if (!selectedAppointment || selectedAppointment.kind !== "appointment") {
      return;
    }

    const draftDuration = Math.max(
      15,
      timeToMinutes(selectedAppointment.endTime) - timeToMinutes(selectedAppointment.startTime)
    );
    setAttendanceDraft(selectedAppointment.attendance);
    setPriceAmountDraft(String(selectedAppointment.priceAmount ?? 0));
    setDetailsCustomerNameDraft(selectedAppointment.customerName || "");
    setDetailsStartTimeDraft(selectedAppointment.startTime);
    setDetailsEndTimeDraft(selectedAppointment.endTime);
    setDetailsServiceNameDraft(selectedAppointment.serviceName || "");
    setVisitItems([
      createDraftService(
        selectedAppointment.startTime,
        selectedAppointment.serviceName || "",
        selectedAppointment.priceAmount ?? 0,
        draftDuration
      )
    ]);
    setEditingServiceIndex(0);
    applyPhoneDraft(selectedAppointment.customerPhone || "", accountCountry, {
      setCountry: setDetailsCustomerPhoneCountryDraft,
      setPhone: setDetailsCustomerPhoneDraft
    });
    setDetailsNotesDraft(selectedAppointment.notes || "");
  }, [accountCountry, selectedAppointment]);

  useEffect(() => {
    function handlePrefixOutsideClick(event: PointerEvent) {
      const target = event.target as Node | null;

      if (newClientPrefixMenuRef.current && !newClientPrefixMenuRef.current.contains(target)) {
        setIsNewClientPrefixOpen(false);
      }

      if (detailsPrefixMenuRef.current && !detailsPrefixMenuRef.current.contains(target)) {
        setIsDetailsPrefixOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePrefixOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", handlePrefixOutsideClick);
    };
  }, []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!dragRef.current || !snapshot) {
        return;
      }

      const deltaY = event.clientY - dragRef.current.startY;
      const deltaSteps = Math.round(deltaY / (minuteHeight * dragStepMinutes));

      setSnapshot((current) => {
        if (!current) {
          return current;
        }

        const patchAppointment = (appointment: CalendarAppointment) => {
          if (appointment.id !== dragRef.current?.appointmentId) {
            return appointment;
          }

          const originalDuration = dragRef.current.originalEndMinutes - dragRef.current.originalStartMinutes;

          if (dragRef.current.mode === "resize") {
            const nextEndMinutes = Math.min(
              dayEndMinutes,
              Math.max(
                dragRef.current.originalStartMinutes + minimumAppointmentDuration,
                dragRef.current.originalEndMinutes + deltaSteps * dragStepMinutes
              )
            );

            return { ...appointment, endTime: minutesToTime(nextEndMinutes) };
          }

          const nextMinutes = Math.min(
            dayEndMinutes - originalDuration,
            Math.max(dayStartMinutes, dragRef.current.originalStartMinutes + deltaSteps * dragStepMinutes)
          );

          return {
            ...appointment,
            startTime: minutesToTime(nextMinutes),
            endTime: minutesToTime(nextMinutes + originalDuration)
          };
        };

        return {
          ...current,
          appointments: current.appointments.map(patchAppointment),
          memberCalendars: current.memberCalendars.map((member) => ({
            ...member,
            appointments: member.appointments.map(patchAppointment)
          }))
        };
      });
    }

    async function handlePointerUp() {
      if (!dragRef.current || !snapshot) {
        dragRef.current = null;
        setDraggingId(null);
        return;
      }

      const appointment = snapshot.memberCalendars
        .flatMap((member) => member.appointments)
        .find((item) => item.id === dragRef.current?.appointmentId);
      if (appointment) {
        await fetch("/api/pro/calendar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetProfessionalId: appointment.professionalId,
            appointmentId: appointment.id,
            startTime: appointment.startTime,
            endTime: appointment.endTime
          })
        });
      }

      dragRef.current = null;
      setDraggingId(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [minuteHeight, snapshot]);

  async function refreshSnapshot() {
    await loadSnapshot(selectedDate, selectedProfessionalId);
  }

  function startAppointmentDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    appointment: CalendarAppointment,
    targetProfessionalId: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedProfessionalId(targetProfessionalId);
    dragRef.current = {
      startY: event.clientY,
      originalStartMinutes: timeToMinutes(appointment.startTime),
      originalEndMinutes: timeToMinutes(appointment.endTime),
      appointmentId: appointment.id,
      mode: "move"
    };
    setDraggingId(appointment.id);
  }

  function startAppointmentResize(
    event: React.PointerEvent<HTMLButtonElement>,
    appointment: CalendarAppointment,
    targetProfessionalId: string
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedProfessionalId(targetProfessionalId);
    dragRef.current = {
      startY: event.clientY,
      originalStartMinutes: timeToMinutes(appointment.startTime),
      originalEndMinutes: timeToMinutes(appointment.endTime),
      appointmentId: appointment.id,
      mode: "resize"
    };
    setDraggingId(appointment.id);
  }

  function openNewVisit(slot: string, targetProfessionalId = selectedProfessionalId) {
    const targetMember = memberCalendars.find((member) => member.professionalId === targetProfessionalId) ?? null;
    const targetScheduleOverrides =
      targetMember?.memberSchedule.workScheduleMode === "flexible"
        ? targetMember.memberSchedule.customSchedule
        : {};
    const targetDaySchedule = targetMember
      ? resolveDaySchedule(selectedDate, targetMember.memberSchedule.workSchedule, targetScheduleOverrides)
      : daySchedule;

    setSelectedProfessionalId(targetProfessionalId);
    const initialItem = createDraftService(slot);
    setSelectedTime(slot);
    setActiveToolbarMenu(null);
    setQuickMenu({ visible: false, x: 0, y: 0, time: "", professionalId: targetProfessionalId });
    setVisitItems([initialItem]);
    setSelectedCustomer(null);
    setClientSearchReturnStage("visit");
    setServiceQuery("");
    setClientQuery("");
    setShowClientPrompt(false);
    setDeleteConfirmTarget(null);
    if (isWithinWorkingWindow(slot, targetDaySchedule)) {
      setToast(null);
    } else {
      showToast(t.outsideScheduleWarning, "warning");
    }
    setDrawerStage("visit");
  }

  function handleSlotClick(slot: string, clientX: number, top: number, bodyWidth: number, targetProfessionalId: string) {
    if (isMobileViewport) {
      openNewVisit(slot, targetProfessionalId);
      return;
    }

    const left = Math.min(Math.max(40, clientX - 140), bodyWidth - 280);
    setSelectedProfessionalId(targetProfessionalId);
    setSelectedTime(slot);
    setQuickMenu({
      visible: true,
      x: left,
      y: top + 26,
      time: slot,
      professionalId: targetProfessionalId
    });
    setDrawerStage("closed");
    setToast(null);
  }

  function updateVisitItem(index: number, patch: Partial<VisitServiceDraft>) {
    setVisitItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? patchDraftService(item, patch) : item))
    );
  }

  function updateDetailsVisitItem(index: number, patch: Partial<VisitServiceDraft>) {
    if (index === 0) {
      const primaryItem = patchDraftService(
        {
          id: visitItems[0]?.id ?? crypto.randomUUID(),
          serviceName: detailsServiceNameDraft,
          startTime: detailsStartTimeDraft,
          endTime: detailsEndTimeDraft,
          priceAmount: Number(priceAmountDraft || 0)
        },
        patch
      );

      setDetailsServiceNameDraft(primaryItem.serviceName);
      setDetailsStartTimeDraft(primaryItem.startTime);
      setDetailsEndTimeDraft(primaryItem.endTime);
      setPriceAmountDraft(String(primaryItem.priceAmount ?? 0));
    }

    updateVisitItem(index, patch);
  }

  function selectService(serviceName: string, price: number, durationMinutes?: number) {
    const duration = durationMinutes || getServiceDurationMinutes(serviceName, snapshot?.workspace.services ?? []);
    if (servicePickerReturnStage === "details") {
      const currentItem =
        visitItems[editingServiceIndex] ??
        createDraftService(
          editingServiceIndex === 0 ? detailsStartTimeDraft : detailsEndTimeDraft,
          "",
          0,
          duration
        );
      updateDetailsVisitItem(editingServiceIndex, {
        serviceName,
        priceAmount: price,
        endTime: minutesToTime(timeToMinutes(currentItem.startTime) + duration)
      });
      setDrawerStage("details");
      setServiceQuery("");
      return;
    }

    setVisitItems((current) =>
      current.map((item, index) =>
        index === editingServiceIndex
          ? {
              ...item,
              serviceName,
              priceAmount: price,
              endTime: minutesToTime(timeToMinutes(item.startTime) + duration)
            }
          : item
      )
    );
    setDrawerStage("visit");
    setServiceQuery("");
  }

  function addAnotherService() {
    setVisitItems((current) => {
      const lastItem = current[current.length - 1];
      const nextStart = lastItem ? lastItem.endTime : selectedTime || minutesToTime(workStartMinutes);
      return [...current, createDraftService(nextStart)];
    });
  }

  function addAnotherDetailService() {
    setVisitItems((current) => {
      const source =
        current.length > 0
          ? current
          : [
              createDraftService(
                detailsStartTimeDraft,
                detailsServiceNameDraft,
                Number(priceAmountDraft || 0),
                Math.max(15, timeToMinutes(detailsEndTimeDraft) - timeToMinutes(detailsStartTimeDraft))
              )
            ];
      const lastItem = source[source.length - 1];
      return [...source, createDraftService(lastItem.endTime)];
    });
  }

  function removeDetailService(index: number) {
    if (index === 0) {
      return;
    }
    setVisitItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function saveVisit(saveWithoutClient = false) {
    if (visitItems.length === 0) {
      showToast(t.chooseTimeAndService, "warning");
      return;
    }

    if (visitItems.some((item) => !item.serviceName.trim())) {
      showToast(t.chooseServiceForEveryBlock, "warning");
      return;
    }

    if (blockedSelection) {
      showToast(t.partBlocked, "error");
      return;
    }

    const now = Date.now();
    if (
      selectedDate === todayDate &&
      visitItems.some((item) => getDateTimeValue(selectedDate, item.startTime) < now)
    ) {
      showToast(t.pastTimeBlocked, "error");
      return;
    }

    if (!selectedCustomer && !saveWithoutClient) {
      setDrawerStage("closed");
      setShowClientPrompt(true);
      return;
    }

    setIsSavingVisit(true);
    setToast(null);
    const firstVisitStartTime = visitItems[0]?.startTime ?? "";
    setShowClientPrompt(false);
    setDrawerStage("closed");
    setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));

    for (const item of visitItems) {
      const response = await fetch("/api/pro/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetProfessionalId: selectedProfessionalId,
          appointmentDate: selectedDate,
          startTime: item.startTime,
          endTime: item.endTime,
          serviceName: item.serviceName,
          customerName: selectedCustomer?.name ?? "",
          customerPhone: selectedCustomer?.phone ?? "",
          priceAmount: item.priceAmount,
          notes: ""
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        showToast(payload.error || t.saveVisitFailed, "error");
        setIsSavingVisit(false);
        return;
      }
    }

    await refreshSnapshot();
    setIsSavingVisit(false);
    setVisitItems([]);
    setSelectedCustomer(null);
    showToast(visitHasOverlap ? t.visitSavedOverlap : t.visitSaved, visitHasOverlap ? "warning" : "success");

    if (firstVisitStartTime) {
      window.setTimeout(() => {
        scrollCalendarToTime(Math.max(dayStartMinutes, timeToMinutes(firstVisitStartTime) - 30));
      }, 80);
    }
  }

  async function createAndSelectClient() {
    const name = newClientName.trim() || clientQuery.trim();

    if (!name) {
      showToast(t.enterClientName, "warning");
      return;
    }

    if (newClientPhone.trim() && !isPhoneValid(newClientPhoneCountry || accountCountry, newClientPhone)) {
      showToast(getPhoneValidationMessage(newClientPhoneCountry || accountCountry), "warning");
      return;
    }

    const fullPhone = buildInternationalPhone(newClientPhoneCountry || accountCountry, newClientPhone);

    const response = await fetch("/api/pro/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: name,
        lastName: "",
        email: "",
        phone: fullPhone,
        telegram: "",
        notes: "",
        notificationsTelegram: true,
        marketingTelegram: false
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      showToast(payload.error || t.addClientFailed, "error");
      return;
    }

    applySelectedClient({ name, phone: fullPhone });
  }

  async function createBlocked(kindLabel: string, serviceName: string) {
    if (!selectedTime) {
      return;
    }
    const response = await fetch("/api/pro/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "blocked",
        targetProfessionalId: quickMenu.professionalId || selectedProfessionalId,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        endTime: minutesToTime(timeToMinutes(selectedTime) + 30),
        serviceName
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      showToast(payload.error || t.blockTimeFailed, "error");
      return;
    }

    await refreshSnapshot();
    setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
    showToast(kindLabel, "success");
  }

  async function deleteAppointment(appointment: CalendarAppointment, closeDrawer = false) {
    if (!appointment) {
      return false;
    }

    const params = new URLSearchParams({
      appointmentId: appointment.id,
      targetProfessionalId: appointment.professionalId
    });
    const response = await fetch(`/api/pro/calendar?${params.toString()}`, {
      method: "DELETE"
    });
    const payload = await response.json();

    if (!response.ok) {
      showToast(payload.error || t.deleteBlockFailed, "error");
      return false;
    }

    await refreshSnapshot();
    if (closeDrawer || selectedAppointmentId === appointment.id) {
      setDrawerStage("closed");
      setSelectedAppointmentId(null);
    }
    showToast(appointment.kind === "blocked" ? t.blockedRemoved : t.visitRemoved, "success");
    return true;
  }

  async function deleteSelectedAppointment() {
    if (!selectedAppointment) {
      return;
    }

    requestDeleteAppointment(selectedAppointment);
  }

  async function confirmDeleteAppointment() {
    if (!deleteConfirmTarget) {
      return;
    }

    setIsDeletingAppointment(true);
    const shouldCloseDrawer = selectedAppointmentId === deleteConfirmTarget.id || drawerStage === "details";
    const deleted = await deleteAppointment(deleteConfirmTarget, shouldCloseDrawer);
    setIsDeletingAppointment(false);

    if (deleted) {
      setDeleteConfirmTarget(null);
    }
  }

  async function saveAppointmentMeta() {
    if (!selectedAppointment || selectedAppointment.kind !== "appointment") {
      return;
    }

    const normalizedCustomerName = detailsCustomerNameDraft.trim() || selectedAppointment.customerName;
    let normalizedCustomerPhone = "";
    const trimmedPhone = detailsCustomerPhoneDraft.trim();
    const draftItems = visitItems.length
      ? visitItems
      : [
          createDraftService(
            detailsStartTimeDraft,
            detailsServiceNameDraft || selectedAppointment.serviceName,
            Number(priceAmountDraft || selectedAppointment.priceAmount || 0),
            Math.max(15, timeToMinutes(detailsEndTimeDraft) - timeToMinutes(detailsStartTimeDraft))
          )
        ];
    const normalizedStartTime = detailsStartTimeDraft;
    let normalizedEndTime = detailsEndTimeDraft;

    if (timeToMinutes(normalizedEndTime) <= timeToMinutes(normalizedStartTime)) {
      normalizedEndTime = minutesToTime(timeToMinutes(normalizedStartTime) + 15);
      setDetailsEndTimeDraft(normalizedEndTime);
      setVisitItems((current) =>
        current.map((item, index) => (index === 0 ? { ...item, endTime: normalizedEndTime } : item))
      );
    }

    const normalizedItems = draftItems.map((item, index) =>
      index === 0
        ? {
            ...item,
            serviceName: (detailsServiceNameDraft.trim() || selectedAppointment.serviceName).trim(),
            startTime: normalizedStartTime,
            endTime: normalizedEndTime,
            priceAmount: Math.max(0, Number(priceAmountDraft || 0))
          }
        : item
    );

    if (trimmedPhone) {
      if (!isPhoneValid(detailsCustomerPhoneCountryDraft || accountCountry, trimmedPhone)) {
        showToast(getPhoneValidationMessage(detailsCustomerPhoneCountryDraft || accountCountry), "warning");
        return;
      }

      normalizedCustomerPhone = buildInternationalPhone(detailsCustomerPhoneCountryDraft || accountCountry, trimmedPhone);
    }

    if (normalizedItems.some((item) => !item.serviceName.trim())) {
      showToast(t.chooseServiceForEveryBlock, "warning");
      return;
    }

    const hasSelfOverlap = normalizedItems.some((item, index) =>
      normalizedItems.some(
        (otherItem, otherIndex) =>
          otherIndex > index &&
          appointmentsOverlap(item.startTime, item.endTime, otherItem.startTime, otherItem.endTime)
      )
    );

    if (hasSelfOverlap) {
      showToast(t.serviceBlocksOverlap, "error");
      return;
    }

    const externalAppointments = focusedAppointments.filter(
      (appointment) => appointment.kind === "appointment" && appointment.id !== selectedAppointment.id
    );
    const hasExternalOverlap = normalizedItems.some((item) =>
      externalAppointments.some((appointment) =>
        appointmentsOverlap(item.startTime, item.endTime, appointment.startTime, appointment.endTime)
      )
    );
    const blockedAppointments = focusedAppointments.filter((appointment) => appointment.kind === "blocked");
    const touchesBlockedTime = normalizedItems.some((item) =>
      blockedAppointments.some((appointment) =>
        appointmentsOverlap(item.startTime, item.endTime, appointment.startTime, appointment.endTime)
      )
    );

    if (touchesBlockedTime) {
      showToast(t.partBlocked, "error");
      return;
    }

    const response = await fetch("/api/pro/calendar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "meta",
        targetProfessionalId: selectedAppointment.professionalId,
        appointmentId: selectedAppointment.id,
        attendance: attendanceDraft,
        priceAmount: normalizedItems[0]?.priceAmount ?? 0,
        customerName: normalizedCustomerName,
        customerPhone: normalizedCustomerPhone,
        startTime: normalizedItems[0]?.startTime ?? normalizedStartTime,
        endTime: normalizedItems[0]?.endTime ?? normalizedEndTime,
        serviceName: normalizedItems[0]?.serviceName ?? selectedAppointment.serviceName,
        notes: detailsNotesDraft.trim(),
        previousCustomerName: selectedAppointment.customerName,
        previousCustomerPhone: selectedAppointment.customerPhone,
        previousAppointmentTime: selectedAppointment.startTime
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      showToast(payload.error || t.saveVisitFailed, "error");
      return;
    }

    for (const item of normalizedItems.slice(1)) {
      const extraResponse = await fetch("/api/pro/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetProfessionalId: selectedAppointment.professionalId,
          appointmentDate: selectedAppointment.appointmentDate,
          startTime: item.startTime,
          endTime: item.endTime,
          serviceName: item.serviceName,
          customerName: normalizedCustomerName,
          customerPhone: normalizedCustomerPhone,
          priceAmount: item.priceAmount,
          attendance: attendanceDraft,
          notes: detailsNotesDraft.trim()
        })
      });
      const extraPayload = await extraResponse.json();

      if (!extraResponse.ok) {
        showToast(extraPayload.error || t.saveVisitFailed, "error");
        return;
      }
    }

    await refreshSnapshot();
    setDrawerStage("closed");
    setSelectedAppointmentId(null);
    showToast(hasExternalOverlap ? t.visitSavedOverlap : t.visitUpdated, hasExternalOverlap ? "warning" : "success");
  }

  async function saveBlockedTime() {
    if (!selectedAppointment || selectedAppointment.kind !== "blocked") {
      return;
    }

    const response = await fetch("/api/pro/calendar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetProfessionalId: selectedAppointment.professionalId,
        appointmentId: selectedAppointment.id,
        startTime: selectedAppointment.startTime,
        endTime: selectedAppointment.endTime
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      showToast(payload.error || t.blockedSaveFailed, "error");
      return;
    }

    await refreshSnapshot();
    setDrawerStage("closed");
    setSelectedAppointmentId(null);
    showToast(t.blockedUpdated, "success");
  }

  function updateSelectedBlockedTime(patch: Partial<Pick<CalendarAppointment, "startTime" | "endTime">>) {
    if (!selectedAppointment || selectedAppointment.kind !== "blocked") {
      return;
    }

    setSnapshot((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        appointments: current.appointments.map((appointment) =>
          appointment.id === selectedAppointment.id ? { ...appointment, ...patch } : appointment
        ),
        memberCalendars: current.memberCalendars.map((member) => ({
          ...member,
          appointments: member.appointments.map((appointment) =>
            appointment.id === selectedAppointment.id ? { ...appointment, ...patch } : appointment
          )
        }))
      };
    });
  }

  const overlayActive = drawerStage !== "closed";

  function moveVisiblePeriod(direction: -1 | 1) {
    if (viewMode === "month") {
      setSelectedDate(addMonths(selectedDate, direction));
      return;
    }

    if (viewMode === "week") {
      setSelectedDate(addDays(selectedDate, direction * 7));
      return;
    }

    if (viewMode === "threeDay") {
      setSelectedDate(addDays(selectedDate, direction * 3));
      return;
    }

    setSelectedDate(addDays(selectedDate, direction));
  }

  function jumpToCurrentTime() {
    if (selectedDate !== todayDate) {
      setSelectedDate(todayDate);
      return;
    }

    const now = new Date();
    scrollCalendarToTime(Math.max(dayStartMinutes, now.getHours() * 60 + now.getMinutes() - 30));
  }

  function getMemberScheduleForDate(member: CalendarSnapshot["memberCalendars"][number], dayKey: string) {
    const overrides =
      member.memberSchedule.workScheduleMode === "flexible"
        ? member.memberSchedule.customSchedule
        : {};

    return resolveDaySchedule(dayKey, member.memberSchedule.workSchedule, overrides);
  }

  function getMemberSchedule(member: CalendarSnapshot["memberCalendars"][number]) {
    return getMemberScheduleForDate(member, selectedDate);
  }

  function getMemberInitials(member: CalendarSnapshot["memberCalendars"][number]) {
    return `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "RZ";
  }

  function toggleVisibleProfessional(memberId: string) {
    setVisibleProfessionalIds((current) => {
      const exists = current.includes(memberId);
      if (exists && current.length === 1) {
        return current;
      }

      const next = exists ? current.filter((id) => id !== memberId) : [...current, memberId];
      if (!next.includes(selectedProfessionalId) && next[0]) {
        setSelectedProfessionalId(next[0]);
      }
      return next;
    });
  }

  function showWholeTeam() {
    const ids = memberCalendars.map((member) => member.professionalId);
    if (!ids.length) {
      return;
    }

    setVisibleProfessionalIds(ids);
    if (!ids.includes(selectedProfessionalId)) {
      setSelectedProfessionalId(ids[0]);
    }
  }

  function toggleTeamMemberSelection(memberId: string) {
    const isVisible = visibleProfessionalIds.includes(memberId);

    if (!isVisible) {
      setSelectedProfessionalId(memberId);
      setVisibleProfessionalIds((current) =>
        current.includes(memberId) ? current : [...current, memberId]
      );
      return;
    }

    if (visibleProfessionalIds.length === 1) {
      setSelectedProfessionalId(memberId);
      return;
    }

    toggleVisibleProfessional(memberId);
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.calendarV2Shell} ${overlayActive ? styles.calendarV2Expanded : ""}`}>
      <ProSidebar
        active="calendar"
        professionalId={professionalId}
        canManageStaff={snapshot?.viewer.scope === "owner"}
      />

      <section className={styles.calendarCenterShell}>
        <div className={styles.calendarWorkspaceHeader}>
          <div className={styles.calendarWorkspaceMeta}>
            <span>{snapshot?.workspace.business.name ?? "Timviz"}</span>
            <strong>{t.dailyCalendar}</strong>
          </div>

          <div className={styles.calendarWorkspaceActions}>
            <button
              ref={shareMenuButtonRef}
              type="button"
              className={`${styles.calendarIconButton} ${styles.calendarShareButton} ${activeToolbarMenu === "share" ? styles.calendarIconButtonActive : ""}`}
              aria-label={t.publicLink}
              onClick={() => {
                setDrawerStage("closed");
                setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
                setActiveToolbarMenu((current) => (current === "share" ? null : "share"));
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 16V5" />
                <path d="M8.5 8.5 12 5l3.5 3.5" />
                <path d="M6 14.5v2.3A2.2 2.2 0 0 0 8.2 19h7.6a2.2 2.2 0 0 0 2.2-2.2v-2.3" />
              </svg>
            </button>

            <button
              type="button"
              className={`${styles.calendarIconButton} ${styles.calendarSupportButton}`}
              aria-label={t.helpSupport}
              onClick={() => {
                setActiveToolbarMenu(null);
                setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
                setDrawerStage("closed");
                setIsSupportOpen(true);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4.8c4.3 0 7.8 3 7.8 6.8s-3.5 6.8-7.8 6.8c-1.3 0-2.6-.3-3.7-.8l-2.9 1 .8-2.7c-1-1-1.8-2.5-1.8-4.3 0-3.8 3.5-6.8 7.8-6.8Z" />
                <path d="M10.15 10.05a2.22 2.22 0 0 1 4.2.95c0 1.3-1.18 1.8-1.9 2.34-.51.38-.79.69-.79 1.43" />
                <circle cx="11.95" cy="15.55" r="0.72" fill="currentColor" stroke="none" />
              </svg>
            </button>

            <button
              type="button"
              className={`${styles.calendarIconButton} ${drawerStage === "notifications" ? styles.calendarIconButtonActive : ""}`}
              aria-label={t.notifications}
              onClick={() => {
                setActiveToolbarMenu(null);
                setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
                setDrawerStage((current) => (current === "notifications" ? "closed" : "notifications"));
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6.7 8.8a5.3 5.3 0 1 1 10.6 0c0 5.1 2.1 6.1 2.1 6.1H4.6s2.1-1 2.1-6.1" />
                <path d="M10.2 18.2a2.1 2.1 0 0 0 3.6 0" />
              </svg>
              {recentActivity.length ? <span className={styles.calendarNotificationBadge}>{recentActivity.length}</span> : null}
            </button>

            <button
              ref={accountMenuButtonRef}
              type="button"
              className={styles.calendarProfileButton}
              aria-label={t.accountMenu}
              onClick={() => {
                setDrawerStage("closed");
                setActiveToolbarMenu((current) => (current === "account" ? null : "account"));
              }}
            >
              <ProfileAvatar
                avatarUrl={snapshot?.viewer.avatarUrl}
                initials={viewerInitials}
                label={viewerName}
                className={styles.calendarHeaderAvatar}
                imageClassName={styles.avatarImage}
                fallbackClassName={styles.avatarFallback}
              />
              <div className={styles.calendarProfileMeta}>
                <strong>{viewerName}</strong>
                <span>{snapshot?.workspace.business.name ?? snapshot?.viewer.role}</span>
              </div>
              <span className={styles.calendarToolbarChevron}>⌄</span>
            </button>

            <FloatingPopover
              open={activeToolbarMenu === "share"}
              anchorEl={shareMenuButtonRef.current}
              panelRef={shareMenuPanelRef}
              className={`${styles.calendarAccountMenu} ${styles.calendarShareMenu}`}
              placement="bottom-end"
              offset={12}
            >
              <div className={styles.calendarShareMenuHero}>
                <span className={styles.calendarShareMenuEyebrow}>{t.publicLink}</span>
                <strong>{t.publicLinkTitle}</strong>
                <p>{t.publicLinkHint}</p>
                <span className={`${styles.calendarShareStatusPill} ${publicBookingEnabled ? styles.calendarShareStatusPillActive : ""}`}>
                  {publicBookingEnabled ? t.publicLinkEnabled : t.publicLinkDisabled}
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
                <button
                  type="button"
                  className={styles.calendarSharePrimaryAction}
                  onClick={() => void copyPublicBookingLink()}
                >
                  {t.publicLinkCopy}
                </button>
                <button
                  type="button"
                  className={styles.calendarShareGhostAction}
                  onClick={() => {
                    if (!publicBookingUrl) {
                      return;
                    }

                    setActiveToolbarMenu(null);
                    window.open(publicBookingUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  {t.publicLinkOpen}
                </button>
                {canUseNativeShare ? (
                  <button
                    type="button"
                    className={styles.calendarShareGhostAction}
                    onClick={() => void sharePublicBookingLink()}
                  >
                    {t.publicLinkShare}
                  </button>
                ) : null}
              </div>
            </FloatingPopover>

            <FloatingPopover
              open={activeToolbarMenu === "account"}
              anchorEl={accountMenuButtonRef.current}
              panelRef={accountMenuPanelRef}
              className={styles.calendarAccountMenu}
              placement="bottom-end"
              offset={12}
            >
              <div className={styles.calendarAccountMenuHeader}>
                <ProfileAvatar
                  avatarUrl={snapshot?.viewer.avatarUrl}
                  initials={viewerInitials}
                  label={viewerName}
                  className={styles.calendarAccountMenuAvatar}
                  imageClassName={styles.avatarImage}
                  fallbackClassName={styles.avatarFallback}
                />
                <div>
                  <strong>{viewerName}</strong>
                  <span>{snapshot?.workspace.business.name ?? "Timviz"}</span>
                </div>
              </div>

              <div className={styles.calendarAccountMenuSection}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolbarMenu(null);
                    router.push("/pro/settings");
                  }}
                >
                  {t.myProfile}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolbarMenu(null);
                    router.push("/pro/settings");
                  }}
                >
                  {t.personalSettings}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveToolbarMenu(null);
                    setIsSupportOpen(true);
                  }}
                >
                  {t.helpSupport}
                </button>
              </div>

              <div className={styles.calendarAccountMenuSection}>
                <span className={styles.calendarAccountMenuLabel}>{t.language}</span>
                <div className={styles.calendarLanguageOptions}>
                  {(["ru", "uk", "en"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.calendarLanguageOption} ${uiLanguage === option ? styles.calendarLanguageOptionActive : ""}`}
                      onClick={() => void applyLanguage(option)}
                    >
                      {option === "ru" ? "RU" : option === "uk" ? "UA" : "EN"}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.calendarAccountMenuSection}>
                <button
                  type="button"
                  className={styles.calendarDangerMenuItem}
                  onClick={() => {
                    void handleAccountLogout();
                  }}
                >
                  {t.logout}
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

        <header className={styles.calendarTopBarV2}>
          <div className={styles.calendarTopLeft}>
            <button type="button" className={styles.calendarTodayButton} onClick={jumpToCurrentTime}>
              {t.today}
            </button>
            <button type="button" className={styles.calendarSquareButton} onClick={() => moveVisiblePeriod(-1)}>‹</button>
            <div className={styles.calendarDatePill}>
              <strong>{activeDateLabel}</strong>
              <span>{viewMode === "day" ? (selectedDayIsWorking ? `${formatDisplayTime(minutesToTime(workStartMinutes))} - ${formatDisplayTime(minutesToTime(workEndMinutes))}` : t.closedBySchedule) : t.selected}</span>
            </div>
            <button type="button" className={styles.calendarSquareButton} onClick={() => moveVisiblePeriod(1)}>›</button>

            {canSwitchProfessional && !isMobileViewport ? (
              <>
                <button
                  ref={teamMenuButtonRef}
                  type="button"
                  className={styles.calendarTeamButton}
                  aria-label={t.chooseSpecialist}
                  onClick={() => {
                    setDrawerStage("closed");
                    setActiveToolbarMenu((current) => (current === "team" ? null : "team"));
                  }}
                >
                  <span>{calendarSelectorLabel}</span>
                  <span className={styles.calendarToolbarChevron}>⌄</span>
                </button>

                <FloatingPopover
                  open={activeToolbarMenu === "team"}
                  anchorEl={isMobileViewport ? mobileTeamMenuButtonRef.current : teamMenuButtonRef.current}
                  panelRef={teamMenuPanelRef}
                  className={styles.calendarToolbarMenu}
                  placement="bottom-start"
                  offset={12}
                >
                  <div className={styles.calendarToolbarMenuSearch}>
                    <span>⌕</span>
                    <input
                      value={teamQuery}
                      onChange={(event) => setTeamQuery(event.target.value)}
                      placeholder={t.searchPlaceholder}
                    />
                  </div>
                  <div className={styles.calendarToolbarMenuSectionLabel}>{t.chooseSpecialist}</div>
                  <div className={styles.calendarToolbarMenuList}>
                    <button
                      type="button"
                      className={`${styles.calendarToolbarMenuItem} ${isShowingAllTeam ? styles.calendarToolbarMenuItemActive : ""}`}
                      onClick={() => {
                        showWholeTeam();
                        setSelectedProfessionalId(memberCalendars[0]?.professionalId ?? selectedProfessionalId);
                      }}
                    >
                      <span className={`${styles.calendarToolbarMenuCheck} ${isShowingAllTeam ? styles.calendarToolbarMenuCheckActive : ""}`}>
                        {isShowingAllTeam ? "✓" : ""}
                      </span>
                      <div>
                        <strong>{t.allTeam}</strong>
                        <span>{t.showAllTeam}</span>
                      </div>
                    </button>
                  </div>
                  <div className={styles.calendarToolbarMenuSectionLabel}>{t.selectedMasters}</div>
                  <div className={styles.calendarToolbarMenuList}>
                    {filteredTeamMembers.map((member) => {
                      const memberLabel = buildDisplayName(member.firstName, member.lastName, t.masterFallback);
                      const isVisible = visibleCalendarIds.includes(member.professionalId);
                      return (
                        <button
                          key={member.professionalId}
                          type="button"
                          aria-pressed={isVisible}
                          className={`${styles.calendarToolbarMenuItem} ${isVisible ? styles.calendarToolbarMenuItemActive : ""}`}
                          onClick={() => toggleTeamMemberSelection(member.professionalId)}
                        >
                          <span className={`${styles.calendarToolbarMenuCheck} ${isVisible ? styles.calendarToolbarMenuCheckActive : ""}`}>
                            {isVisible ? "✓" : ""}
                          </span>
                          <ProfileAvatar
                            avatarUrl={member.avatarUrl}
                            initials={getMemberInitials(member)}
                            label={memberLabel}
                            className={styles.calendarToolbarMenuAvatar}
                            imageClassName={styles.avatarImage}
                            fallbackClassName={styles.avatarFallback}
                          />
                          <div>
                            <strong>{memberLabel}{member.isViewer ? ` ${t.myMarker}` : ""}</strong>
                            <span>{member.scope === "owner" ? member.role || "Owner" : member.role}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </FloatingPopover>
              </>
            ) : null}
          </div>

          <div className={styles.calendarTopRight}>
            {visibleCalendarIds.length === 1 && !isMobileViewport ? (
              <div className={`${styles.calendarStatsStrip} ${styles.calendarStatsStripCompact}`} aria-label={t.dailyCalendar}>
                <div>
                  <span>{t.today}</span>
                  <strong>{calendarStats.day.visitsCount} / {formatMoney(calendarStats.day.revenue, accountCurrency, locale)}</strong>
                </div>
                <div>
                  <span>{t.week}</span>
                  <strong>{calendarStats.week.visitsCount} / {formatMoney(calendarStats.week.revenue, accountCurrency, locale)}</strong>
                </div>
                <div>
                  <span>{t.month}</span>
                  <strong>{calendarStats.month.visitsCount} / {formatMoney(calendarStats.month.revenue, accountCurrency, locale)}</strong>
                </div>
              </div>
            ) : null}

            <div className={styles.calendarTopRightActionGroup}>
              <button
                ref={viewMenuButtonRef}
                type="button"
                className={styles.calendarViewPill}
                aria-expanded={activeToolbarMenu === "view"}
                onClick={() => {
                  setDrawerStage("closed");
                  setActiveToolbarMenu((current) => (current === "view" ? null : "view"));
                }}
              >
                <span>{viewModeOptions.find((option) => option.value === viewMode)?.label ?? t.day}</span>
                <span className={styles.calendarToolbarChevron}>⌄</span>
              </button>

              <FloatingPopover
                open={activeToolbarMenu === "view"}
                anchorEl={viewMenuButtonRef.current}
                panelRef={viewMenuPanelRef}
                className={styles.calendarToolbarMenu}
                placement="bottom-end"
                offset={12}
              >
                <div className={styles.calendarToolbarMenuList}>
                  {viewModeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.calendarToolbarMenuItem} ${option.value === viewMode ? styles.calendarToolbarMenuItemActive : ""}`}
                      onClick={() => {
                        setViewMode(option.value);
                        setActiveToolbarMenu(null);
                      }}
                    >
                      <div>
                        <strong>{option.label}</strong>
                        <span>
                          {option.value === "day"
                            ? t.daySchedule
                            : option.value === "threeDay"
                              ? t.threeDays
                              : option.value === "week"
                                ? t.week
                                : t.month}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </FloatingPopover>

              <button
                type="button"
                className={styles.calendarPrimaryAction}
                onClick={() => openNewVisit(getSuggestedVisitStartTime())}
              >
                + {t.quickNewVisit}
              </button>
            </div>
          </div>
        </header>

        {canSwitchProfessional && isMobileViewport && mobileTeamButtonPosition ? (
          <>
            <button
              ref={mobileTeamMenuButtonRef}
              type="button"
              className={styles.calendarMobileTeamFab}
              aria-label={t.chooseSpecialist}
              title={calendarSelectorLabel}
              style={mobileTeamButtonPosition}
              onClick={() => {
                setDrawerStage("closed");
                setActiveToolbarMenu((current) => (current === "team" ? null : "team"));
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="9" r="3.2" />
                <circle cx="16.5" cy="10.5" r="2.6" />
                <path d="M4.5 18.3c.7-2.6 2.9-4.2 5.5-4.2s4.8 1.6 5.5 4.2" />
                <path d="M13.8 18.3c.4-1.6 1.7-2.8 3.5-3.1 1.2-.2 2.4 0 3.2.5" />
              </svg>
              {visibleCalendarIds.length > 1 ? (
                <span className={styles.calendarMobileTeamFabBadge}>{visibleCalendarIds.length}</span>
              ) : null}
            </button>

            <FloatingPopover
              open={activeToolbarMenu === "team"}
              anchorEl={mobileTeamMenuButtonRef.current}
              panelRef={teamMenuPanelRef}
              className={styles.calendarToolbarMenu}
              placement="bottom-start"
              offset={12}
            >
              <div className={styles.calendarToolbarMenuSearch}>
                <span>⌕</span>
                <input
                  value={teamQuery}
                  onChange={(event) => setTeamQuery(event.target.value)}
                  placeholder={t.searchPlaceholder}
                />
              </div>
              <div className={styles.calendarToolbarMenuSectionLabel}>{t.chooseSpecialist}</div>
              <div className={styles.calendarToolbarMenuList}>
                <button
                  type="button"
                  className={`${styles.calendarToolbarMenuItem} ${isShowingAllTeam ? styles.calendarToolbarMenuItemActive : ""}`}
                  onClick={() => {
                    showWholeTeam();
                    setSelectedProfessionalId(memberCalendars[0]?.professionalId ?? selectedProfessionalId);
                  }}
                >
                  <span className={`${styles.calendarToolbarMenuCheck} ${isShowingAllTeam ? styles.calendarToolbarMenuCheckActive : ""}`}>
                    {isShowingAllTeam ? "✓" : ""}
                  </span>
                  <div>
                    <strong>{t.allTeam}</strong>
                    <span>{t.showAllTeam}</span>
                  </div>
                </button>
              </div>
              <div className={styles.calendarToolbarMenuSectionLabel}>{t.selectedMasters}</div>
              <div className={styles.calendarToolbarMenuList}>
                {filteredTeamMembers.map((member) => {
                  const memberLabel = buildDisplayName(member.firstName, member.lastName, t.masterFallback);
                  const isVisible = visibleCalendarIds.includes(member.professionalId);
                  return (
                    <button
                      key={member.professionalId}
                      type="button"
                      aria-pressed={isVisible}
                      className={`${styles.calendarToolbarMenuItem} ${isVisible ? styles.calendarToolbarMenuItemActive : ""}`}
                      onClick={() => toggleTeamMemberSelection(member.professionalId)}
                    >
                      <span className={`${styles.calendarToolbarMenuCheck} ${isVisible ? styles.calendarToolbarMenuCheckActive : ""}`}>
                        {isVisible ? "✓" : ""}
                      </span>
                      <ProfileAvatar
                        avatarUrl={member.avatarUrl}
                        initials={getMemberInitials(member)}
                        label={memberLabel}
                        className={styles.calendarToolbarMenuAvatar}
                        imageClassName={styles.avatarImage}
                        fallbackClassName={styles.avatarFallback}
                      />
                      <div>
                        <strong>{memberLabel}{member.isViewer ? ` ${t.myMarker}` : ""}</strong>
                        <span>{member.scope === "owner" ? member.role || "Owner" : member.role}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </FloatingPopover>
          </>
        ) : null}

        {renderCalendarToast()}

        {viewMode === "day" ? (
        <>
        <div ref={scrollFrameRef} className={styles.calendarV2ScrollFrame}>
          <div className={styles.calendarDayColumnsHeader}>
            <div className={styles.calendarDayHourSpacer} />
            <div
              className={styles.calendarDayMemberHeaderGrid}
              style={{ gridTemplateColumns: `repeat(${Math.max(1, visibleCalendars.length)}, minmax(${dayMemberColumnWidth}px, 1fr))` }}
            >
              {visibleCalendars.map((member) => {
                const memberLabel = buildDisplayName(member.firstName, member.lastName, t.masterFallback);
                return (
                  <button
                  key={member.professionalId}
                  type="button"
                  className={`${styles.calendarDayMemberHeaderCard} ${selectedProfessionalId === member.professionalId ? styles.calendarDayMemberHeaderCardActive : ""}`}
                  onClick={() => setSelectedProfessionalId(member.professionalId)}
                >
                    <ProfileAvatar
                      avatarUrl={member.avatarUrl}
                      initials={getMemberInitials(member)}
                      label={memberLabel}
                      className={styles.calendarDayMemberHeaderAvatar}
                      imageClassName={styles.avatarImage}
                      fallbackClassName={styles.avatarFallback}
                    />
                    <strong>{memberLabel}</strong>
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.calendarV2Grid} style={{ minHeight: `${calendarGridHeight}px` }}>
            <div className={styles.calendarV2HourColumn}>
              {hours.map((hour) => (
                <div key={hour} className={styles.calendarV2HourLabel} style={{ top: `${topOffset + hour * calendarHourHeight}px` }}>
                  {`${String(hour).padStart(2, "0")}:00`}
                </div>
              ))}
              {isMobileViewport && drawerStage === "closed" ? (
                <button
                  type="button"
                  className={styles.calendarMobilePlusButton}
                  onClick={() => openNewVisit(getSuggestedVisitStartTime(), selectedProfessionalId)}
                  aria-label="Добавить запись"
                  title="Добавить запись"
                >
                  <span>+</span>
                </button>
              ) : null}
            </div>

            <div
              className={styles.calendarDayMembersGrid}
              style={{ gridTemplateColumns: `repeat(${Math.max(1, visibleCalendars.length)}, minmax(${dayMemberColumnWidth}px, 1fr))` }}
            >
              {visibleCalendars.map((member) => {
                const memberSchedule = getMemberSchedule(member);
                const memberScheduleOverrides =
                  member.memberSchedule.workScheduleMode === "flexible"
                    ? member.memberSchedule.customSchedule
                    : {};
                const memberDaySchedule = resolveDaySchedule(selectedDate, member.memberSchedule.workSchedule, memberScheduleOverrides);
                const memberBreaks = getDayBreaks(memberDaySchedule).map((breakItem) => ({
                  ...breakItem,
                  startMinutes: timeToMinutes(breakItem.startTime),
                  endMinutes: timeToMinutes(breakItem.endTime)
                }));
                const memberWorkStartMinutes = memberDaySchedule ? timeToMinutes(memberDaySchedule.startTime) : 9 * 60;
                const memberWorkEndMinutes = memberDaySchedule ? timeToMinutes(memberDaySchedule.endTime) : 18 * 60;
                const memberIsWorking = Boolean(memberDaySchedule?.enabled);
                const memberLayouts = appointmentLayoutsByProfessional.get(member.professionalId) ?? new Map();

                return (
                  <div
                    key={member.professionalId}
                    className={`${styles.calendarV2Body} ${styles.calendarDayMemberColumn} ${selectedProfessionalId === member.professionalId ? styles.calendarDayMemberColumnActive : ""}`}
                    style={{
                      minHeight: `${calendarGridHeight}px`,
                      ["--calendar-slot-step-height" as never]: `${slotHeight}px`,
                      ["--calendar-hour-block-height" as never]: `${calendarHourHeight}px`
                    }}
                  >
                    {!memberIsWorking ? (
                      <div
                        className={styles.nonWorkingZone}
                        style={{ top: `${topOffset}px`, height: `${dayEndMinutes * minuteHeight}px` }}
                      />
                    ) : (
                      <>
                        <div
                          className={styles.nonWorkingZone}
                          style={{ top: `${topOffset}px`, height: `${Math.max(0, memberWorkStartMinutes) * minuteHeight}px` }}
                        />
                        <div
                          className={styles.nonWorkingZone}
                          style={{ top: `${topOffset + memberWorkEndMinutes * minuteHeight}px`, height: `${Math.max(0, dayEndMinutes - memberWorkEndMinutes) * minuteHeight}px` }}
                        />
                      </>
                    )}

                    {memberIsWorking
                      ? memberBreaks.map((breakItem) => (
                          <div
                            key={`${member.professionalId}-${breakItem.startTime}-${breakItem.endTime}`}
                            className={styles.nonWorkingZone}
                            style={{
                              top: `${topOffset + breakItem.startMinutes * minuteHeight}px`,
                              height: `${(breakItem.endMinutes - breakItem.startMinutes) * minuteHeight}px`
                            }}
                          />
                        ))
                      : null}

                    {nowLineTop !== null ? (
                      <div className={styles.nowLine} style={{ top: `${nowLineTop + topOffset}px` }}>
                        {selectedProfessionalId === member.professionalId ? (
                          <span className={styles.nowBadge}>
                            {new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {Array.from({ length: (dayEndMinutes - dayStartMinutes) / CALENDAR_GRID_STEP_MINUTES }, (_, index) => {
                      const slotMinutes = dayStartMinutes + index * CALENDAR_GRID_STEP_MINUTES;
                      const slot = minutesToTime(slotMinutes);
                      const top = topOffset + index * slotHeight;
                      const inWorkingHours = isWithinWorkingWindow(slot, memberSchedule);

                      return (
                        <button
                          key={`${member.professionalId}-${slot}`}
                          type="button"
                          className={`${styles.calendarSlotButton} ${selectedTime === slot && selectedProfessionalId === member.professionalId ? styles.calendarSlotActive : ""} ${!inWorkingHours ? styles.calendarSlotOffHours : ""}`}
                          style={{ top: `${top}px`, height: `${slotHeight}px` }}
                          onClick={(event) => {
                            const bodyRect = (event.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();
                            handleSlotClick(slot, event.clientX - bodyRect.left, top, bodyRect.width, member.professionalId);
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}

                    {quickMenu.visible && quickMenu.professionalId === member.professionalId ? (
                      <div
                        ref={quickMenuRef}
                        className={styles.calendarQuickMenu}
                        style={{ left: `${quickMenu.x}px`, top: `${quickMenu.y}px` }}
                      >
                        <button
                          type="button"
                          className={styles.calendarQuickMenuAction}
                          onClick={() => {
                            setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
                            openNewVisit(quickMenu.time, member.professionalId);
                          }}
                        >
                          {t.quickNewVisit}
                        </button>
                        <button
                          type="button"
                          className={styles.calendarQuickMenuAction}
                          onClick={() => void createBlocked(t.blockedBusySaved, t.blockedTimeFallback)}
                        >
                          {t.quickBlockBusy}
                        </button>
                        <button
                          type="button"
                          className={styles.calendarQuickMenuAction}
                          onClick={() => void createBlocked(t.blockedOffTimeSaved, t.quickAddOffTime)}
                        >
                          {t.quickAddOffTime}
                        </button>
                      </div>
                    ) : null}

                    {member.appointments.map((appointment) => {
                      const top = topOffset + timeToMinutes(appointment.startTime) * minuteHeight;
                      const height = Math.max(bookingCardMinHeight, (timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)) * minuteHeight);
                      const isPastAppointment = getDateTimeValue(appointment.appointmentDate, appointment.endTime) < Date.now();
                      const isBlocked = appointment.kind === "blocked";
                      const isPendingApproval = appointment.attendance === "pending";
                      const bookingColor = isBlocked
                        ? "#d9dce4"
                        : getServiceColor(appointment.serviceName, snapshot?.workspace.services ?? []);
                      const layout = memberLayouts.get(appointment.id) ?? { lane: 0, laneCount: 1 };
                      const laneWidth = 100 / layout.laneCount;

                      return (
                        <article
                          key={appointment.id}
                          className={`${styles.bookingBlock} ${draggingId === appointment.id ? styles.bookingDragging : ""} ${isBlocked ? styles.bookingBlocked : ""} ${isPastAppointment && !isBlocked ? styles.bookingPast : ""} ${isPendingApproval && !isBlocked ? styles.bookingPending : ""}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `calc(${layout.lane * laneWidth}% + 0px)`,
                            width: `calc(${laneWidth}% - 8px)`,
                            right: "auto",
                            background: isBlocked ? undefined : bookingColor
                          }}
                          onClick={() => {
                            setSelectedProfessionalId(member.professionalId);
                            if (isBlocked) {
                              setSelectedAppointmentId(appointment.id);
                              setDrawerStage("details");
                              setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
                              return;
                            }
                            setSelectedAppointmentId(appointment.id);
                            setAttendanceDraft(appointment.attendance);
                            setPriceAmountDraft(String(appointment.priceAmount ?? 0));
                            setDrawerStage("details");
                            setQuickMenu((current) => ({ ...current, visible: false, x: 0, y: 0, time: "" }));
                          }}
                        >
                          <div className={styles.bookingControlRow}>
                            <button
                              type="button"
                              className={styles.bookingDeleteButton}
                              aria-label={isBlocked ? t.deleteBlock : t.deleteVisit}
                              title={isBlocked ? t.deleteBlock : t.deleteVisit}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                requestDeleteAppointment(appointment);
                              }}
                            />
                          </div>
                          <span className={styles.bookingTime}>{`${formatDisplayTime(appointment.startTime)} - ${formatDisplayTime(appointment.endTime)}`}</span>
                          <strong className={styles.bookingTitle}>
                            {isBlocked ? appointment.serviceName || t.blockedTimeFallback : appointment.customerName || t.walkInClient}
                          </strong>
                          {!isBlocked ? <span className={styles.bookingService}>{appointment.serviceName}</span> : null}
                          <button
                            type="button"
                            className={styles.bookingDragHandle}
                            aria-label={t.moveVisit}
                            title={t.moveVisit}
                            onPointerDown={(event) => startAppointmentDrag(event, appointment, member.professionalId)}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          >
                            <MoveHandleIcon />
                          </button>
                          <button
                            type="button"
                            className={styles.bookingResizeHandle}
                            aria-label={t.resizeVisit}
                            title={t.resizeVisit}
                            onPointerDown={(event) => startAppointmentResize(event, appointment, member.professionalId)}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          />
                        </article>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </>
        ) : viewMode === "threeDay" || (isTeamMultiView && viewMode === "week") ? (
          <div className={styles.calendarOverviewPanel}>
            <div className={styles.calendarTeamBoardShell}>
              <div
                className={styles.calendarTeamBoardHeader}
                style={{
                  gridTemplateColumns: `76px repeat(${teamBoardKeys.length}, minmax(${teamBoardDayWidth}px, 1fr))`
                }}
              >
                <div className={styles.calendarTeamBoardMemberSpacer} />
                {teamBoardKeys.map((dayKey) => {
                  const isActive = dayKey === selectedDate;
                  const isToday = dayKey === todayDate;
                  return (
                    <button
                      key={dayKey}
                      type="button"
                      className={`${styles.calendarTeamBoardDayHeader} ${isActive ? styles.calendarTeamBoardDayHeaderActive : ""} ${isToday ? styles.calendarTeamBoardDayHeaderToday : ""}`}
                      onClick={() => setSelectedDate(dayKey)}
                    >
                      <strong>{new Date(`${dayKey}T00:00:00`).toLocaleDateString(locale, { day: "numeric" })}</strong>
                      <span>{new Date(`${dayKey}T00:00:00`).toLocaleDateString(locale, { weekday: "short" })}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.calendarTeamBoardRows}>
                {visibleCalendars.map((member) => {
                  const memberLabel = buildDisplayName(member.firstName, member.lastName, t.masterFallback);
                  return (
                    <div
                      key={member.professionalId}
                      className={styles.calendarTeamBoardRow}
                      style={{
                        gridTemplateColumns: `76px repeat(${teamBoardKeys.length}, minmax(${teamBoardDayWidth}px, 1fr))`
                      }}
                    >
                      <button
                        type="button"
                        className={`${styles.calendarTeamMemberRail} ${selectedProfessionalId === member.professionalId ? styles.calendarTeamMemberRailActive : ""}`}
                        onClick={() => setSelectedProfessionalId(member.professionalId)}
                      >
                        <ProfileAvatar
                          avatarUrl={member.avatarUrl}
                          initials={getMemberInitials(member)}
                          label={memberLabel}
                          className={styles.calendarTeamMemberAvatar}
                          imageClassName={styles.avatarImage}
                          fallbackClassName={styles.avatarFallback}
                        />
                        <strong>{memberLabel}</strong>
                      </button>

                      {teamBoardKeys.map((dayKey) => {
                        const schedule = getMemberScheduleForDate(member, dayKey);
                        const isClosed = !schedule?.enabled;
                        const isActive = dayKey === selectedDate;
                        const dayAppointments = teamAppointmentsByMemberAndDay.get(member.professionalId)?.get(dayKey) ?? [];
                        const visibleItems = dayAppointments.slice(0, isMobileViewport ? 2 : 3);
                        const hiddenCount = Math.max(0, dayAppointments.length - visibleItems.length);

                        return (
                          <button
                            key={`${member.professionalId}-${dayKey}`}
                            type="button"
                            className={`${styles.calendarTeamBoardCell} ${isClosed ? styles.calendarTeamBoardCellClosed : ""} ${isActive ? styles.calendarTeamBoardCellActive : ""}`}
                            onClick={() => {
                              setSelectedDate(dayKey);
                              setSelectedProfessionalId(member.professionalId);
                              setViewMode("day");
                            }}
                          >
                            {visibleItems.length ? (
                              <div className={styles.calendarTeamBoardCellList}>
                                {visibleItems.map((appointment) => (
                                  <span
                                    key={appointment.id}
                                    className={`${styles.calendarTeamBoardPill} ${appointment.kind === "blocked" ? styles.calendarTeamBoardPillBlocked : ""}`}
                                    style={appointment.kind === "blocked" ? undefined : { background: getServiceColor(appointment.serviceName, snapshot?.workspace.services ?? []) }}
                                  >
                                    <strong>{formatDisplayTime(appointment.startTime)}</strong>
                                    <span>{appointment.kind === "blocked" ? appointment.serviceName || t.blockedTimeFallback : appointment.customerName || t.walkInClient}</span>
                                  </span>
                                ))}
                                {hiddenCount > 0 ? (
                                  <span className={styles.calendarTeamBoardMore}>+{hiddenCount}</span>
                                ) : null}
                              </div>
                            ) : isClosed ? (
                              <span className={styles.calendarTeamBoardClosedLabel}>{t.closedBySchedule}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : isTeamMultiView && viewMode === "month" ? (
          <div className={styles.calendarOverviewPanel}>
            <div className={styles.calendarMonthTeamGrid}>
              {monthGrid.map((day) => {
                const dayAppointments = visibleAppointmentsByDay.get(day.key) ?? [];
                const isWorkingDay = visibleCalendars.some((member) => Boolean(getMemberScheduleForDate(member, day.key)?.enabled));
                const visibleItems = dayAppointments.slice(0, isMobileViewport ? 2 : 3);
                const hiddenCount = Math.max(0, dayAppointments.length - visibleItems.length);

                return (
                  <button
                    key={day.key}
                    type="button"
                    className={`${styles.calendarMonthTeamDay} ${day.outside ? styles.calendarMonthOverviewOutside : ""} ${isWorkingDay ? styles.calendarOverviewWorking : styles.calendarOverviewClosed} ${day.key === todayDate ? styles.calendarOverviewToday : ""} ${day.key === selectedDate ? styles.calendarTeamBoardCellActive : ""}`}
                    onClick={() => {
                      setSelectedDate(day.key);
                      setViewMode("day");
                    }}
                  >
                    <div className={styles.calendarMonthTeamDayHeader}>
                      <strong>{day.day}</strong>
                      {hiddenCount > 0 ? <span>+{hiddenCount}</span> : null}
                    </div>
                    {visibleItems.length ? (
                      <div className={styles.calendarMonthTeamDayList}>
                        {visibleItems.map((appointment) => (
                          <span
                            key={appointment.id}
                            className={`${styles.calendarMonthTeamPill} ${appointment.kind === "blocked" ? styles.calendarTeamBoardPillBlocked : ""}`}
                            style={appointment.kind === "blocked" ? undefined : { background: getServiceColor(appointment.serviceName, snapshot?.workspace.services ?? []) }}
                          >
                            <strong>{formatDisplayTime(appointment.startTime)}</strong>
                            <span>{appointment.kind === "blocked" ? appointment.serviceName || t.blockedTimeFallback : appointment.customerName || t.walkInClient}</span>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : viewMode === "week" ? (
          <div className={styles.calendarOverviewPanel}>
            <div className={styles.calendarWeekOverviewGrid}>
              {weekKeys.map((dayKey) => {
                const schedule = snapshot
                  ? resolveDaySchedule(dayKey, snapshot.workspace.memberSchedule.workSchedule, scheduleOverrides)
                  : null;
                const dayAppointments = dayKey === selectedDate ? focusedAppointments : [];
                return (
                  <button
                    key={dayKey}
                    type="button"
                    className={`${styles.calendarWeekOverviewDay} ${schedule?.enabled ? styles.calendarOverviewWorking : styles.calendarOverviewClosed} ${dayKey === todayDate ? styles.calendarOverviewToday : ""}`}
                    onClick={() => {
                      setSelectedDate(dayKey);
                      setViewMode("day");
                    }}
                  >
                    <span>
                      {new Date(`${dayKey}T00:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric" })}
                    </span>
                    <strong>{schedule?.enabled ? getScheduleLabel(schedule, t.closed) : t.closedBySchedule}</strong>
                    <small>{dayAppointments.length} {t.visits}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.calendarOverviewPanel}>
            <div className={styles.calendarMonthOverviewGrid}>
              {monthGrid.map((day) => {
                const schedule = monthSchedules.get(day.key) ?? null;
                const isWorkingDay = Boolean(schedule?.enabled);
                const dayAppointments = day.key === selectedDate ? focusedAppointments : [];
                return (
                  <button
                    key={day.key}
                    type="button"
                    className={`${styles.calendarMonthOverviewDay} ${day.outside ? styles.calendarMonthOverviewOutside : ""} ${isWorkingDay ? styles.calendarOverviewWorking : styles.calendarOverviewClosed} ${day.key === todayDate ? styles.calendarOverviewToday : ""}`}
                    onClick={() => {
                      setSelectedDate(day.key);
                      setViewMode("day");
                    }}
                  >
                    <strong>{day.day}</strong>
                    <span>{isWorkingDay ? getScheduleLabel(schedule, t.closed) : t.closed}</span>
                    {dayAppointments.length ? <small>{dayAppointments.length} {t.visits}</small> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <aside className={`${styles.calendarV2Drawer} ${overlayActive ? styles.calendarV2DrawerOpen : ""}`}>
        {drawerStage === "notifications" ? (
          <div className={styles.calendarV2Panel}>
            <div className={styles.calendarV2PanelHeader}>
              <button type="button" className={styles.calendarDrawerBack} onClick={() => setDrawerStage("closed")}>←</button>
              <strong>{t.notifications}</strong>
            </div>

            <div className={styles.calendarNotificationsPanel}>
              <div className={styles.calendarNotificationsHeading}>
                <strong>{t.recentBookings}</strong>
                <span>{recentActivity.length}</span>
              </div>

              {recentActivity.length ? (
                <div className={styles.calendarNotificationsList}>
                  {recentActivity.map((item) => (
                    <article key={item.id} className={styles.calendarNotificationCard}>
                      <div className={styles.calendarNotificationCardHeader}>
                        <strong>{t.recentBookingTitle}</strong>
                        <span>{formatActivityTime(item.createdAt, locale)}</span>
                      </div>
                      <div className={styles.calendarNotificationCardBody}>
                        <strong>{item.customerName || t.walkInClient}</strong>
                        <span>{item.serviceName}</span>
                        <small>
                          {new Date(`${item.appointmentDate}T00:00:00`).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "short"
                          })} · {formatDisplayTime(item.startTime)} · {item.professionalName}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.calendarNotificationEmpty}>
                  <strong>{t.notifications}</strong>
                  <span>{t.notificationsEmpty}</span>
                </div>
              )}
            </div>
          </div>
        ) : drawerStage === "visit" ? (
          <div className={styles.calendarV2Panel}>
            <div className={styles.calendarV2PanelHeader}>
              <button type="button" className={styles.calendarDrawerBack} onClick={() => setDrawerStage("closed")}>←</button>
              <strong>{t.newVisitTitle}</strong>
            </div>

            <button type="button" className={styles.calendarCustomerCard} onClick={() => openClientSearch("visit")}>
              <div className={styles.calendarCustomerAvatar}>{selectedCustomer ? selectedCustomer.name[0]?.toUpperCase() : "◌"}</div>
              <div>
                <span>{t.customer}</span>
                <strong>{selectedCustomer ? selectedCustomer.name : t.quickBookingWithoutClient}</strong>
                <small>{selectedCustomer?.phone || t.chooseClientLater}</small>
              </div>
              <span className={styles.calendarCustomerPlus}>＋</span>
            </button>

            <div className={styles.calendarDrawerTabs}>
              <button type="button" className={styles.calendarDrawerTabActive}>{t.visitTab}</button>
            </div>

            <div className={styles.calendarDrawerDateRow}>
              <strong>{t.currentDay}</strong>
              <span>{selectedDateLabel}</span>
            </div>

            <div className={styles.calendarVisitList}>
              {visitItems.map((item, index) => (
                <div key={item.id} className={styles.calendarVisitCard}>
                  <div className={styles.calendarVisitDrag}>⋮</div>
                  <div className={styles.calendarVisitContent}>
                    <button
                      type="button"
                      className={styles.calendarVisitServicePicker}
                      onClick={() => {
                        setEditingServiceIndex(index);
                        setServicePickerReturnStage("visit");
                        setDrawerStage("service-picker");
                      }}
                    >
                      {item.serviceName || t.chooseService} →
                    </button>

                    <div className={styles.calendarVisitTimeGrid}>
                      <label>
                        <span>{t.start}</span>
                        <select
                          className={styles.select}
                          value={item.startTime}
                          onChange={(event) => updateVisitItem(index, { startTime: event.target.value })}
                        >
                          {Array.from({ length: timeOptionCount }, (_, slotIndex) => {
                            const time = minutesToTime(slotIndex * TIME_SELECT_STEP_MINUTES);
                            return (
                              <option key={time} value={time}>
                                {formatDisplayTime(time)}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <label>
                        <span>{t.end}</span>
                        <select
                          className={styles.select}
                          value={item.endTime}
                          onChange={(event) => updateVisitItem(index, { endTime: event.target.value })}
                        >
                          {Array.from({ length: timeOptionCount }, (_, slotIndex) => {
                            const time = minutesToTime(slotIndex * TIME_SELECT_STEP_MINUTES);
                            return (
                              <option key={time} value={time}>
                                {formatDisplayTime(time)}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    </div>

                    {item.serviceName ? (
                      <div className={styles.calendarVisitMeta}>
                        <span>{item.serviceName}</span>
                        <strong>{formatMoney(item.priceAmount, accountCurrency, locale)}</strong>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className={styles.calendarAddServiceButton} onClick={addAnotherService}>
              {t.addAnotherService}
            </button>

            <div className={styles.calendarTotals}>
              <span>{t.total}</span>
              <strong>{formatMoney(visitTotal, accountCurrency, locale)}</strong>
              <span>{t.payable}</span>
              <strong>{formatMoney(visitTotal, accountCurrency, locale)}</strong>
            </div>

            <div className={styles.calendarDrawerFooter}>
              <button type="button" className={styles.calendarSecondaryAction} onClick={() => setDrawerStage("closed")}>
                {t.cancelUpper}
              </button>
              <button type="button" className={styles.primaryButton} disabled={isSavingVisit} onClick={() => void saveVisit()}>
                {isSavingVisit ? t.savingUpper : t.saveUpper}
              </button>
            </div>
          </div>
        ) : drawerStage === "service-picker" ? (
          <div className={styles.calendarV2Panel}>
            <div className={styles.calendarV2PanelHeader}>
              <button
                type="button"
                className={styles.calendarDrawerBack}
                onClick={() => setDrawerStage(servicePickerReturnStage === "details" && selectedAppointment ? "details" : "visit")}
              >
                ←
              </button>
              <strong>{t.chooseService}</strong>
            </div>

            <div className={styles.calendarSearchField}>
              <span>⌕</span>
              <input
                value={serviceQuery}
                onChange={(event) => setServiceQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
              />
            </div>

            <div className={styles.calendarServiceDrawerList}>
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className={styles.calendarServiceDrawerItem}
                  onClick={() => selectService(service.name, service.price, service.durationMinutes)}
                >
                  <span className={styles.calendarServiceTone} style={{ background: getServiceColor(service.name, snapshot?.workspace.services ?? []) }} />
                  <div>
                    <strong>{service.name}</strong>
                    <span>{service.durationMinutes || getServiceDurationMinutes(service.name, snapshot?.workspace.services ?? [])} {t.serviceDurationMinutes}</span>
                  </div>
                  <strong>{formatMoney(service.price, accountCurrency, locale)}</strong>
                </button>
              ))}

              {serviceQuery.trim() && filteredServices.length === 0 ? (
                <button
                  type="button"
                  className={styles.calendarCreateService}
                  onClick={() => selectService(serviceQuery.trim(), 50, 60)}
                >
                  {t.addNewService(serviceQuery.trim())}
                </button>
              ) : null}
            </div>
          </div>
        ) : drawerStage === "client-search" ? (
          <div className={styles.calendarV2Panel}>
            <div className={styles.calendarV2PanelHeader}>
              <button
                type="button"
                className={styles.calendarDrawerBack}
                onClick={() => setDrawerStage(clientSearchReturnStage === "details" && selectedAppointment ? "details" : "visit")}
              >
                ←
              </button>
              <strong>{t.chooseClient}</strong>
            </div>

            <div className={styles.calendarSearchField}>
              <span>⌕</span>
              <input
                value={clientQuery}
                onChange={(event) => setClientQuery(event.target.value)}
                placeholder={t.clientNameOrPhone}
              />
            </div>
            <p className={styles.calendarPanelHint}>
              {t.clientSearchHint}
            </p>

            <div className={styles.calendarClientQuickActions}>
              <button
                type="button"
                onClick={() => {
                  applySelectedClient(null);
                }}
              >
                <strong>{t.withoutClient}</strong>
                <span>{t.withoutClientHint}</span>
              </button>
              <button type="button" onClick={() => {
                setShowNewClientForm((value) => !value);
                setNewClientName(clientQuery.trim());
              }}>
                <strong>{showNewClientForm ? t.hideForm : t.newClient}</strong>
                <span>{t.newClientHint}</span>
              </button>
            </div>

            {showNewClientForm ? (
              <div
                className={styles.calendarQuickClientForm}
                onFocusCapture={(event) => {
                  ensureFormFieldVisible(event.target as HTMLElement, "smooth");
                }}
              >
                <div>
                  <strong>{t.addClientTitle}</strong>
                  <span>{t.addClientText}</span>
                </div>
                <label>
                  <span>{t.clientName}</span>
                  <input
                    className={styles.input}
                    value={newClientName}
                    onChange={(event) => setNewClientName(event.target.value)}
                    placeholder={t.exampleName}
                  />
                </label>
                <label>
                  <span>{t.phone}</span>
                  <div className={`${styles.phoneRow} ${styles.calendarAppointmentPhoneRow}`}>
                    <div className={styles.phonePrefixPicker} ref={newClientPrefixMenuRef}>
                      <button
                        type="button"
                        className={`${styles.phonePrefixButton} ${styles.phonePrefixButtonWide} ${isNewClientPrefixOpen ? styles.phonePrefixButtonOpen : ""}`}
                        aria-label={t.prefixAria}
                        aria-expanded={isNewClientPrefixOpen}
                        onClick={() => {
                          ensureFormFieldVisible(newClientPrefixMenuRef.current, "smooth");
                          setIsNewClientPrefixOpen((value) => !value);
                        }}
                      >
                        <div className={styles.calendarPrefixButtonText}>
                          <strong>{getPhoneRule(newClientPhoneCountry).prefix}</strong>
                          <span>{newClientPhoneCountry}</span>
                        </div>
                        <span aria-hidden="true">⌄</span>
                      </button>
                      {isNewClientPrefixOpen ? (
                        <div className={`${styles.phonePrefixMenu} ${styles.phonePrefixMenuRich}`}>
                          <div className={styles.phonePrefixSearchWrap}>
                            <input
                              type="search"
                              className={styles.phonePrefixSearch}
                              placeholder={t.prefixSearch}
                              value={newClientPrefixSearch}
                              onChange={(event) => setNewClientPrefixSearch(event.target.value)}
                              autoFocus
                            />
                          </div>
                          <div className={styles.phonePrefixList}>
                            {filteredNewClientPhoneCountries.map((phoneCountryOption) => {
                              const optionRule = getPhoneRule(phoneCountryOption);
                              const active = newClientPhoneCountry === phoneCountryOption;
                              return (
                                <button
                                  key={phoneCountryOption}
                                  type="button"
                                  className={active ? styles.phonePrefixOptionActive : ""}
                                  onClick={() => {
                                    setNewClientPhoneCountry(phoneCountryOption);
                                    setNewClientPhone(formatPhoneLocal(onlyPhoneDigits(newClientPhone), optionRule));
                                    setIsNewClientPrefixOpen(false);
                                    setNewClientPrefixSearch("");
                                  }}
                                >
                                  <span>{phoneCountryOption}</span>
                                  <strong>{optionRule.prefix}</strong>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <input
                      className={styles.phoneInput}
                      inputMode="numeric"
                      value={newClientPhone}
                      onChange={(event) => setNewClientPhone(formatPhoneLocal(event.target.value, newClientPhoneRule))}
                      placeholder={newClientPhoneRule.placeholder}
                    />
                  </div>
                </label>
                <button type="button" className={styles.primaryButton} onClick={() => void createAndSelectClient()}>
                  {t.addAndChoose}
                </button>
              </div>
            ) : null}

            {filteredClients.length > 0 ? (
              <div className={styles.calendarClientResultsBlock}>
                <div className={styles.calendarClientSectionHeader}>
                  <strong>{t.clients}</strong>
                  <span>{filteredClients.length}</span>
                </div>
                <div className={styles.calendarClientResults}>
                  {filteredClients.map((client) => (
                    <button
                      key={`${client.name}-${client.phone}`}
                      type="button"
                      className={styles.calendarClientResultItem}
                      onClick={() => applySelectedClient(client)}
                    >
                      <div className={styles.calendarEntityAvatar}>{client.name[0]?.toUpperCase() ?? t.customer[0]?.toUpperCase() ?? "C"}</div>
                      <div>
                        <strong>{client.name}</strong>
                        <span>{client.phone || t.noPhone}{client.visitsCount ? ` · ${t.visitsCountLabel(client.visitsCount)}` : ""}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.calendarClientEmpty}>
                <strong>{clientQuery.trim() ? t.clientNotFound : t.clientsEmpty}</strong>
                <span>{clientQuery.trim() ? t.clientNotFoundHint : t.clientsEmptyHint}</span>
                {clientQuery.trim() && !showNewClientForm ? (
                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={() => {
                      setShowNewClientForm(true);
                      setNewClientName(clientQuery.trim());
                    }}
                  >
                    {t.addNamedClient(clientQuery.trim())}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : drawerStage === "details" && selectedAppointment ? (
          <div className={styles.calendarV2Panel}>
            <div className={styles.calendarV2PanelHeader}>
              <button type="button" className={styles.calendarDrawerBack} onClick={() => setDrawerStage("closed")}>←</button>
              <strong>
                {selectedAppointment.kind === "blocked"
                  ? selectedAppointment.serviceName
                  : detailsCustomerNameDraft.trim() || selectedAppointment.customerName || t.customer}
              </strong>
            </div>

            {selectedAppointment.kind === "blocked" ? (
              <div className={styles.fieldStack}>
                <div className={styles.calendarBlockedInfo}>
                  <strong>{selectedAppointment.serviceName}</strong>
                  <span>{selectedDateLabel} · {formatDisplayTime(selectedAppointment.startTime)} - {formatDisplayTime(selectedAppointment.endTime)}</span>
                </div>
                <div className={styles.calendarVisitTimeGrid}>
                  <label>
                    <span>{t.start}</span>
                    <select
                      className={styles.select}
                      value={selectedAppointment.startTime}
                      onChange={(event) => updateSelectedBlockedTime({ startTime: event.target.value })}
                    >
                      {Array.from({ length: timeOptionCount }, (_, slotIndex) => {
                        const time = minutesToTime(slotIndex * TIME_SELECT_STEP_MINUTES);
                        return (
                          <option key={time} value={time}>
                            {formatDisplayTime(time)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label>
                    <span>{t.end}</span>
                    <select
                      className={styles.select}
                      value={selectedAppointment.endTime}
                      onChange={(event) => updateSelectedBlockedTime({ endTime: event.target.value })}
                    >
                      {Array.from({ length: timeOptionCount }, (_, slotIndex) => {
                        const time = minutesToTime(slotIndex * TIME_SELECT_STEP_MINUTES);
                        return (
                          <option key={time} value={time}>
                            {formatDisplayTime(time)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>
                <button type="button" className={styles.primaryButton} onClick={() => void saveBlockedTime()}>
                  {t.saveTime}
                </button>
                <button type="button" className={styles.dangerButton} onClick={() => void deleteSelectedAppointment()}>
                  {t.deleteBlock}
                </button>
              </div>
            ) : (
              <div className={styles.fieldStack}>
                <div className={styles.calendarAppointmentContactCard}>
                  <button
                    type="button"
                    className={styles.calendarAppointmentContactTopButton}
                    onClick={() => openClientSearch("details")}
                  >
                    <div className={styles.calendarAppointmentContactTop}>
                      <div className={styles.calendarCustomerAvatar}>
                        {getPersonInitial(detailsCustomerNameDraft || selectedAppointment.customerName || t.customer, t.customer[0] ?? "C")}
                      </div>
                      <div className={styles.calendarAppointmentContactMeta}>
                        <strong>{detailsCustomerNameDraft.trim() || selectedAppointment.customerName || t.walkInClient}</strong>
                        <span>{selectedAppointmentContactPhone || detailsCustomerPhoneDraft.trim() || t.noPhone}</span>
                        <small>{t.changeClient}</small>
                      </div>
                    </div>
                  </button>

                  <div className={styles.calendarAppointmentContactActions}>
                    {appointmentContactActions.map((action) =>
                      action.href ? (
                        <a
                          key={action.key}
                          className={`${styles.calendarContactAction} ${styles[`calendarContactAction${action.key[0].toUpperCase()}${action.key.slice(1)}` as keyof typeof styles] ?? ""}`}
                          href={action.href}
                          target={action.external ? "_blank" : undefined}
                          rel={action.external ? "noopener noreferrer" : undefined}
                          aria-label={action.label}
                          title={action.label}
                        >
                          <span className={styles.calendarContactActionIcon}>
                            <ContactChannelIcon kind={action.key as "call" | "whatsapp" | "telegram" | "viber"} />
                          </span>
                        </a>
                      ) : (
                        <button
                          key={action.key}
                          type="button"
                          className={`${styles.calendarContactActionDisabled} ${styles[`calendarContactAction${action.key[0].toUpperCase()}${action.key.slice(1)}` as keyof typeof styles] ?? ""}`}
                          disabled
                          aria-label={action.label}
                          title={action.label}
                        >
                          <span className={styles.calendarContactActionIcon}>
                            <ContactChannelIcon kind={action.key as "call" | "whatsapp" | "telegram" | "viber"} />
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {!selectedAppointmentContactPhone ? (
                  <div className={styles.calendarInlineHint}>{t.contactPhoneHint}</div>
                ) : null}

                <div className={styles.calendarAppointmentSummaryGrid}>
                  <div className={styles.calendarAppointmentSummaryCard}>
                    <span>{t.visitDateTime}</span>
                    <strong>{selectedAppointmentDateLabel}</strong>
                    <small>{formatDisplayTime(detailsStartTimeDraft)} - {formatDisplayTime(detailsEndTimeDraft)}</small>
                  </div>
                </div>

                <div
                  className={`${styles.createAccountGrid} ${styles.calendarAppointmentEditGrid}`}
                  onFocusCapture={(event) => {
                    ensureFormFieldVisible(event.target as HTMLElement, "smooth");
                  }}
                >
                  <div className={styles.field}>
                    <div className={styles.calendarAppointmentServiceStack}>
                      {visitItems.map((item, index) => (
                        <div key={item.id} className={styles.calendarAppointmentServiceEditor}>
                          <div className={styles.calendarAppointmentServiceHeader}>
                            <strong>{index === 0 ? t.primaryService : `${t.additionalService} ${index}`}</strong>
                            {index > 0 ? (
                              <button
                                type="button"
                                className={styles.calendarAppointmentServiceRemove}
                                onClick={() => removeDetailService(index)}
                                aria-label={t.removeService}
                                title={t.removeService}
                              >
                                ×
                              </button>
                            ) : null}
                          </div>

                          <div className={styles.calendarAppointmentServiceFieldLabels}>
                            <span>{t.service}</span>
                            <span>{t.start}</span>
                            <span>{t.end}</span>
                          </div>

                          <div className={styles.calendarAppointmentServiceFieldGrid}>
                            <button
                              type="button"
                              className={styles.calendarVisitServicePicker}
                              onClick={() => {
                                setEditingServiceIndex(index);
                                setServicePickerReturnStage("details");
                                setDrawerStage("service-picker");
                              }}
                            >
                              <span>{index === 0 ? detailsServiceNameDraft || t.chooseService : item.serviceName || t.chooseService}</span>
                              <span aria-hidden="true">⌄</span>
                            </button>
                            <select
                              className={styles.select}
                              value={index === 0 ? detailsStartTimeDraft : item.startTime}
                              onChange={(event) =>
                                index === 0
                                  ? updateDetailsVisitItem(index, { startTime: event.target.value })
                                  : updateVisitItem(index, { startTime: event.target.value })
                              }
                            >
                              {Array.from({ length: timeOptionCount }, (_, slotIndex) => {
                                const time = minutesToTime(slotIndex * TIME_SELECT_STEP_MINUTES);
                                return (
                                  <option key={time} value={time}>
                                    {formatDisplayTime(time)}
                                  </option>
                                );
                              })}
                            </select>
                            <select
                              className={styles.select}
                              value={index === 0 ? detailsEndTimeDraft : item.endTime}
                              onChange={(event) =>
                                index === 0
                                  ? updateDetailsVisitItem(index, { endTime: event.target.value })
                                  : updateVisitItem(index, { endTime: event.target.value })
                              }
                            >
                              {Array.from({ length: timeOptionCount }, (_, slotIndex) => {
                                const time = minutesToTime(slotIndex * TIME_SELECT_STEP_MINUTES);
                                return (
                                  <option key={time} value={time}>
                                    {formatDisplayTime(time)}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className={styles.calendarVisitMeta}>
                            <span>{index === 0 ? detailsServiceNameDraft || t.chooseService : item.serviceName || t.chooseService}</span>
                            <strong>{formatMoney(index === 0 ? Number(priceAmountDraft || 0) : item.priceAmount, accountCurrency, locale)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" className={styles.calendarAddServiceButton} onClick={addAnotherDetailService}>
                      {t.addAnotherService}
                    </button>
                  </div>
                  <div className={`${styles.field} ${styles.calendarAppointmentCustomerField}`}>
                    <label htmlFor="customerName">{t.customer}</label>
                    <input
                      id="customerName"
                      className={styles.input}
                      value={detailsCustomerNameDraft}
                      onChange={(event) => setDetailsCustomerNameDraft(event.target.value)}
                    />
                  </div>
                  <div className={`${styles.field} ${styles.calendarAppointmentPhoneField}`}>
                    <label htmlFor="customerPhone">{t.phone}</label>
                    <div className={`${styles.phoneRow} ${styles.calendarAppointmentPhoneRow}`}>
                      <div className={styles.phonePrefixPicker} ref={detailsPrefixMenuRef}>
                        <button
                          type="button"
                          className={`${styles.phonePrefixButton} ${styles.phonePrefixButtonWide} ${isDetailsPrefixOpen ? styles.phonePrefixButtonOpen : ""}`}
                          aria-label={t.prefixAria}
                          aria-expanded={isDetailsPrefixOpen}
                          onClick={() => {
                            ensureFormFieldVisible(detailsPrefixMenuRef.current, "smooth");
                            setIsDetailsPrefixOpen((value) => !value);
                          }}
                        >
                          <div className={styles.calendarPrefixButtonText}>
                            <strong>{detailsCustomerPhoneRule.prefix}</strong>
                            <span>{detailsCustomerPhoneCountryDraft}</span>
                          </div>
                          <span aria-hidden="true">⌄</span>
                        </button>
                        {isDetailsPrefixOpen ? (
                          <div className={`${styles.phonePrefixMenu} ${styles.phonePrefixMenuRich}`}>
                            <div className={styles.phonePrefixSearchWrap}>
                              <input
                                type="search"
                                className={styles.phonePrefixSearch}
                                placeholder={t.prefixSearch}
                                value={detailsPrefixSearch}
                                onChange={(event) => setDetailsPrefixSearch(event.target.value)}
                                autoFocus
                              />
                            </div>
                            <div className={styles.phonePrefixList}>
                              {filteredDetailsPhoneCountries.map((phoneCountryOption) => {
                                const optionRule = getPhoneRule(phoneCountryOption);
                                const active = detailsCustomerPhoneCountryDraft === phoneCountryOption;
                                return (
                                  <button
                                    key={phoneCountryOption}
                                    type="button"
                                    className={active ? styles.phonePrefixOptionActive : ""}
                                    onClick={() => {
                                      setDetailsCustomerPhoneCountryDraft(phoneCountryOption);
                                      setDetailsCustomerPhoneDraft(
                                        formatPhoneLocal(onlyPhoneDigits(detailsCustomerPhoneDraft), optionRule)
                                      );
                                      setIsDetailsPrefixOpen(false);
                                      setDetailsPrefixSearch("");
                                    }}
                                  >
                                    <span>{phoneCountryOption}</span>
                                    <strong>{optionRule.prefix}</strong>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <input
                        id="customerPhone"
                        className={styles.phoneInput}
                        inputMode="numeric"
                        placeholder={detailsCustomerPhoneRule.placeholder}
                        value={detailsCustomerPhoneDraft}
                        onChange={(event) =>
                          setDetailsCustomerPhoneDraft(formatPhoneLocal(event.target.value, detailsCustomerPhoneRule))
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="attendanceStatus">{t.attendanceStatus}</label>
                    <select
                      id="attendanceStatus"
                      className={styles.select}
                      value={attendanceDraft}
                      onChange={(event) => setAttendanceDraft(event.target.value as "pending" | "confirmed" | "arrived" | "no_show")}
                    >
                      <option value="pending">{t.attendancePending}</option>
                      <option value="confirmed">{t.attendanceConfirmed}</option>
                      <option value="arrived">{t.attendanceArrived}</option>
                      <option value="no_show">{t.attendanceNoShow}</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="priceAmount">{t.price}</label>
                    <input
                      id="priceAmount"
                      className={styles.input}
                      inputMode="decimal"
                      value={priceAmountDraft}
                      onChange={(event) => {
                        setPriceAmountDraft(event.target.value);
                        const nextPrice = Number(event.target.value || 0);
                        setVisitItems((current) =>
                          current.map((item, index) =>
                            index === 0
                              ? {
                                  ...item,
                                  priceAmount: Number.isFinite(nextPrice) ? Math.max(0, nextPrice) : 0
                                }
                              : item
                          )
                        );
                      }}
                    />
                  </div>
                </div>

                <div className={styles.calendarAppointmentEditGrid}>
                  <div className={styles.field}>
                    <label htmlFor="appointmentNotes">{t.notesLabel}</label>
                    <textarea
                      id="appointmentNotes"
                      className={styles.textarea}
                      value={detailsNotesDraft}
                      onChange={(event) => setDetailsNotesDraft(event.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.calendarDrawerFooter}>
                  <button type="button" className={styles.dangerButton} onClick={() => void deleteSelectedAppointment()}>
                    {t.deleteVisit}
                  </button>
                  <button type="button" className={styles.primaryButton} onClick={() => void saveAppointmentMeta()}>
                    {t.saveVisit}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.calendarDrawerPlaceholder} />
        )}
      </aside>

      {deleteConfirmTarget ? (
        <div className={styles.calendarModalBackdrop}>
          <div className={`${styles.calendarModalCard} ${styles.calendarDeleteConfirmCard}`}>
            <button
              type="button"
              className={styles.calendarDeleteConfirmClose}
              onClick={closeDeleteConfirm}
              aria-label={t.deleteCancel}
            >
              ×
            </button>
            <div className={styles.calendarDeleteConfirmIcon}>×</div>
            <h3>{deleteConfirmTarget.kind === "blocked" ? t.deleteBlockConfirmTitle : t.deleteVisitConfirmTitle}</h3>
            <p>{t.deleteConfirmText}</p>
            <div className={styles.calendarDeleteConfirmActions}>
              <button type="button" className={styles.primaryButton} onClick={closeDeleteConfirm}>
                {t.deleteCancel}
              </button>
              <button
                type="button"
                className={styles.calendarDeleteConfirmDanger}
                disabled={isDeletingAppointment}
                onClick={() => void confirmDeleteAppointment()}
              >
                {t.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showClientPrompt ? (
        <div className={styles.calendarModalBackdrop}>
          <div className={styles.calendarModalCard}>
            <div className={styles.calendarModalAvatar}>◌</div>
            <h3>{t.newClientModalTitle}</h3>
            <p>{t.newClientModalText}</p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => {
                setShowClientPrompt(false);
                openClientSearch("visit");
              }}
            >
              {t.addClientDataUpper}
            </button>
            <button type="button" className={styles.ghostButton} onClick={() => void saveVisit(true)}>
              {t.notNowUpper}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
