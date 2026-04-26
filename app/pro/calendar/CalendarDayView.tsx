"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../pro.module.css";
import ProSidebar from "../ProSidebar";
import { languageFromProfile } from "../i18n";
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
  getPhoneRule,
  getPhoneValidationMessage,
  isPhoneValid
} from "../../../lib/phone-format";

type CalendarAppointment = {
  id: string;
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
  workspace: {
    professional: {
      firstName: string;
      lastName: string;
      language?: string;
      country?: string;
      currency?: string;
    };
    business: {
      name: string;
      accountType: "solo" | "team";
      categories: string[];
      workScheduleMode: WorkScheduleMode;
      workSchedule: WorkSchedule;
      customSchedule: CustomSchedule;
    };
    membership: {
      scope: "owner" | "member";
      role: string;
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
type CalendarViewMode = "day" | "week" | "month";

type QuickMenuState = {
  visible: boolean;
  x: number;
  y: number;
  time: string;
};

type DrawerStage = "closed" | "visit" | "service-picker" | "client-search" | "details";

type VisitServiceDraft = {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  priceAmount: number;
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
  addAnotherService: string;
  overlapWarning: string;
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
  service: string;
  attendanceStatus: string;
  attendancePending: string;
  attendanceConfirmed: string;
  attendanceArrived: string;
  attendanceNoShow: string;
  price: string;
  saveVisit: string;
  newClientModalTitle: string;
  newClientModalText: string;
  addClientDataUpper: string;
  notNowUpper: string;
}> = {
  ru: {
    today: "Сегодня",
    day: "День",
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
    addAnotherService: "ДОБАВИТЬ ЕЩЕ УСЛУГУ ＋",
    overlapWarning: "Есть наложение на существующие записи, но сохранить можно.",
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
    service: "Услуга",
    attendanceStatus: "Статус визита",
    attendancePending: "Ожидается",
    attendanceConfirmed: "Подтверждена",
    attendanceArrived: "Пришел",
    attendanceNoShow: "Не пришел",
    price: "Цена",
    saveVisit: "Сохранить визит",
    newClientModalTitle: "Новый клиент?",
    newClientModalText: "Добавь данные клиента, чтобы отправлять напоминания о визитах и мотивировать его на повторные записи.",
    addClientDataUpper: "ДОБАВИТЬ ДАННЫЕ КЛИЕНТА",
    notNowUpper: "НЕ СЕЙЧАС"
  },
  uk: {
    today: "Сьогодні",
    day: "День",
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
    addAnotherService: "ДОДАТИ ЩЕ ПОСЛУГУ ＋",
    overlapWarning: "Є накладення на наявні записи, але зберегти можна.",
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
    service: "Послуга",
    attendanceStatus: "Статус візиту",
    attendancePending: "Очікується",
    attendanceConfirmed: "Підтверджено",
    attendanceArrived: "Прийшов",
    attendanceNoShow: "Не прийшов",
    price: "Ціна",
    saveVisit: "Зберегти візит",
    newClientModalTitle: "Новий клієнт?",
    newClientModalText: "Додайте дані клієнта, щоб надсилати нагадування про візити й мотивувати його на повторні записи.",
    addClientDataUpper: "ДОДАТИ ДАНІ КЛІЄНТА",
    notNowUpper: "НЕ ЗАРАЗ"
  },
  en: {
    today: "Today",
    day: "Day",
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
    addAnotherService: "ADD ANOTHER SERVICE ＋",
    overlapWarning: "There is an overlap with existing bookings, but saving is allowed.",
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
    service: "Service",
    attendanceStatus: "Visit status",
    attendancePending: "Pending",
    attendanceConfirmed: "Confirmed",
    attendanceArrived: "Arrived",
    attendanceNoShow: "No-show",
    price: "Price",
    saveVisit: "Save visit",
    newClientModalTitle: "New client?",
    newClientModalText: "Add client details to send visit reminders and encourage repeat bookings.",
    addClientDataUpper: "ADD CLIENT DETAILS",
    notNowUpper: "NOT NOW"
  }
};

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

function isWithinWorkingWindow(time: string, daySchedule: WorkDaySchedule | null) {
  return isTimeWithinWorkingWindow(time, daySchedule);
}

function appointmentsOverlap(startA: string, endA: string, startB: string, endB: string) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB);
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
  const topOffset = 24;
  const dayStartMinutes = 0;
  const dayEndMinutes = 24 * 60;
  const dragStepMinutes = 5;
  const minimumAppointmentDuration = 15;
  const timeOptionCount = (24 * 60) / TIME_SELECT_STEP_MINUTES;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("day");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<AppLanguage>("ru");
  const [snapshot, setSnapshot] = useState<CalendarSnapshot | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [quickMenu, setQuickMenu] = useState<QuickMenuState>({ visible: false, x: 0, y: 0, time: "" });
  const [drawerStage, setDrawerStage] = useState<DrawerStage>("closed");
  const [statusText, setStatusText] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [attendanceDraft, setAttendanceDraft] = useState<"pending" | "confirmed" | "arrived" | "no_show">("pending");
  const [priceAmountDraft, setPriceAmountDraft] = useState("0");
  const [visitItems, setVisitItems] = useState<VisitServiceDraft[]>([]);
  const [editingServiceIndex, setEditingServiceIndex] = useState(0);
  const [serviceQuery, setServiceQuery] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [directoryClients, setDirectoryClients] = useState<CalendarDirectoryClient[]>([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CalendarClient | null>(null);
  const [showClientPrompt, setShowClientPrompt] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const calendarHourHeight = isMobileViewport ? CALENDAR_MOBILE_HOUR_HEIGHT : CALENDAR_HOUR_HEIGHT;
  const minuteHeight = calendarHourHeight / 60;
  const slotHeight = minuteHeight * CALENDAR_GRID_STEP_MINUTES;
  const calendarGridHeight = topOffset + dayEndMinutes * minuteHeight;
  const bookingCardMinHeight = isMobileViewport ? MOBILE_MIN_BOOKING_CARD_HEIGHT : MIN_BOOKING_CARD_HEIGHT;

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
    if (!snapshot?.workspace.professional.language) {
      return;
    }

    setUiLanguage(languageFromProfile(snapshot.workspace.professional.language));
  }, [snapshot?.workspace.professional.language]);

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

  useEffect(() => {
    void fetch(`/api/pro/calendar?date=${selectedDate}`)
      .then((response) => response.json())
      .then((data: CalendarSnapshot) => {
        setSnapshot(data);
        setSelectedTime("");
        setQuickMenu({ visible: false, x: 0, y: 0, time: "" });
        setDrawerStage("closed");
        setSelectedAppointmentId(null);
        setStatusText("");
        setVisitItems([]);
        setSelectedCustomer(null);
        setServiceQuery("");
        setClientQuery("");
        setShowNewClientForm(false);
        setNewClientName("");
        setNewClientPhone("");
      });
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

  const todayDate = formatDateKey(new Date());
  const initials = useMemo(() => {
    if (!snapshot) {
      return "RZ";
    }
    return `${snapshot.workspace.professional.firstName?.[0] ?? ""}${snapshot.workspace.professional.lastName?.[0] ?? ""}`.toUpperCase() || "RZ";
  }, [snapshot]);

  const t = CALENDAR_TEXT[uiLanguage];
  const locale = getLocale(uiLanguage);
  const accountCountry = snapshot?.workspace.professional.country;
  const accountCurrency = snapshot?.workspace.professional.currency;
  const phoneRule = getPhoneRule(accountCountry);
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
  const selectedMonthLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, {
    month: "long"
  });
  const selectedYearLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, {
    year: "numeric"
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
    viewMode === "month" ? selectedMonthLabel : viewMode === "week" ? selectedWeekLabel : selectedDateLong;
  const viewModeOptions: Array<{ value: CalendarViewMode; label: string }> = [
    { value: "day", label: t.day },
    { value: "week", label: t.week },
    { value: "month", label: t.month }
  ];
  const monthGrid = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);
  const hours = Array.from({ length: 24 }, (_, index) => index);
  const scheduleOverrides = useMemo<CustomSchedule>(() => {
    if (!snapshot) {
      return {};
    }

    return snapshot.workspace.business.workScheduleMode === "flexible"
      ? snapshot.workspace.business.customSchedule
      : {};
  }, [snapshot]);

  const daySchedule = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    return resolveDaySchedule(selectedDate, snapshot.workspace.business.workSchedule, scheduleOverrides);
  }, [scheduleOverrides, selectedDate, snapshot]);

  const monthSchedules = useMemo(() => {
    if (!snapshot) {
      return new Map<string, WorkDaySchedule>();
    }

    return new Map(
      monthGrid.map((day) => [
        day.key,
        resolveDaySchedule(day.key, snapshot.workspace.business.workSchedule, scheduleOverrides)
      ])
    );
  }, [monthGrid, scheduleOverrides, snapshot]);

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

  useEffect(() => {
    const frame = scrollFrameRef.current;
    if (!frame) {
      return;
    }

    const targetMinutes =
      selectedDate === todayDate
        ? Math.max(dayStartMinutes, new Date().getHours() * 60 + new Date().getMinutes() - 90)
        : Math.max(dayStartMinutes, workStartMinutes - 60);

    frame.scrollTo({
      top: Math.max(0, topOffset + targetMinutes * minuteHeight - 40),
      behavior: "smooth"
    });
  }, [selectedDate, todayDate, workStartMinutes, minuteHeight]);

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
    () => (snapshot?.appointments ?? []).find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [selectedAppointmentId, snapshot?.appointments]
  );
  const calendarStats = snapshot?.stats ?? {
    day: { visitsCount: 0, revenue: 0 },
    week: { visitsCount: 0, revenue: 0 },
    month: { visitsCount: 0, revenue: 0 }
  };

  const visitTotal = useMemo(
    () => visitItems.reduce((sum, item) => sum + Number(item.priceAmount || 0), 0),
    [visitItems]
  );

  const visitHasOverlap = useMemo(() => {
    const appointments = snapshot?.appointments ?? [];
    return visitItems.some((item) =>
      appointments.some(
        (appointment) =>
          appointment.kind === "appointment" &&
          appointmentsOverlap(item.startTime, item.endTime, appointment.startTime, appointment.endTime)
      )
    );
  }, [snapshot?.appointments, visitItems]);

  const blockedSelection = useMemo(() => {
    const blockedAppointments = (snapshot?.appointments ?? []).filter((appointment) => appointment.kind === "blocked");
    return visitItems.some((item) =>
      blockedAppointments.some((appointment) =>
        appointmentsOverlap(item.startTime, item.endTime, appointment.startTime, appointment.endTime)
      )
    );
  }, [snapshot?.appointments, visitItems]);

  const appointmentLayouts = useMemo(
    () => getAppointmentLayouts(snapshot?.appointments ?? []),
    [snapshot?.appointments]
  );
  const miniCalendarWeekdays = useMemo(
    () => {
      const sundayFirst = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(Date.UTC(2024, 0, 7 + index));
        return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
          .format(date)
          .replace(".", "");
      });
      return sundayFirst;
    },
    [locale]
  );

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

        return {
          ...current,
          appointments: current.appointments.map((appointment) => {
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
          })
        };
      });
    }

    async function handlePointerUp() {
      if (!dragRef.current || !snapshot) {
        dragRef.current = null;
        setDraggingId(null);
        return;
      }

      const appointment = snapshot.appointments.find((item) => item.id === dragRef.current?.appointmentId);
      if (appointment) {
        await fetch("/api/pro/calendar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
  }, [snapshot, minuteHeight]);

  async function refreshSnapshot() {
    const refreshed = await fetch(`/api/pro/calendar?date=${selectedDate}`).then((response) => response.json());
    setSnapshot(refreshed);
  }

  function openNewVisit(slot: string) {
    const initialItem = createDraftService(slot);
    setSelectedTime(slot);
    setQuickMenu({ visible: false, x: 0, y: 0, time: "" });
    setVisitItems([initialItem]);
    setSelectedCustomer(null);
    setServiceQuery("");
    setClientQuery("");
    setShowClientPrompt(false);
    setStatusText(isWithinWorkingWindow(slot, daySchedule) ? "" : t.outsideScheduleWarning);
    setDrawerStage("visit");
  }

  function handleSlotClick(slot: string, clientX: number, top: number, bodyWidth: number) {
    if (isMobileViewport) {
      openNewVisit(slot);
      return;
    }

    const left = Math.min(Math.max(40, clientX - 140), bodyWidth - 280);
    setSelectedTime(slot);
    setQuickMenu({
      visible: true,
      x: left,
      y: top + 26,
      time: slot
    });
    setDrawerStage("closed");
    setStatusText("");
  }

  function updateVisitItem(index: number, patch: Partial<VisitServiceDraft>) {
    setVisitItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const nextItem = { ...item, ...patch };

        if (patch.startTime && !patch.endTime) {
          const originalDuration = Math.max(15, timeToMinutes(item.endTime) - timeToMinutes(item.startTime));
          nextItem.endTime = minutesToTime(timeToMinutes(patch.startTime) + originalDuration);
        }

        if (patch.endTime && timeToMinutes(patch.endTime) <= timeToMinutes(nextItem.startTime)) {
          nextItem.endTime = minutesToTime(timeToMinutes(nextItem.startTime) + 15);
        }

        return nextItem;
      })
    );
  }

  function selectService(serviceName: string, price: number, durationMinutes?: number) {
    const duration = durationMinutes || getServiceDurationMinutes(serviceName, snapshot?.workspace.services ?? []);
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

  async function saveVisit(saveWithoutClient = false) {
    if (visitItems.length === 0) {
      setStatusText(t.chooseTimeAndService);
      return;
    }

    if (visitItems.some((item) => !item.serviceName.trim())) {
      setStatusText(t.chooseServiceForEveryBlock);
      return;
    }

    if (blockedSelection) {
      setStatusText(t.partBlocked);
      return;
    }

    const now = Date.now();
    if (
      selectedDate === todayDate &&
      visitItems.some((item) => getDateTimeValue(selectedDate, item.startTime) < now)
    ) {
      setStatusText(t.pastTimeBlocked);
      return;
    }

    if (!selectedCustomer && !saveWithoutClient) {
      setDrawerStage("closed");
      setShowClientPrompt(true);
      return;
    }

    setIsSavingVisit(true);
    setStatusText("");
    const firstVisitStartTime = visitItems[0]?.startTime ?? "";
    setShowClientPrompt(false);
    setDrawerStage("closed");
    setQuickMenu({ visible: false, x: 0, y: 0, time: "" });

    for (const item of visitItems) {
      const response = await fetch("/api/pro/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        setStatusText(payload.error || t.saveVisitFailed);
        setIsSavingVisit(false);
        return;
      }
    }

    await refreshSnapshot();
    setIsSavingVisit(false);
    setVisitItems([]);
    setSelectedCustomer(null);
    setStatusText(visitHasOverlap ? t.visitSavedOverlap : t.visitSaved);

    if (firstVisitStartTime) {
      window.setTimeout(() => {
        scrollCalendarToTime(Math.max(dayStartMinutes, timeToMinutes(firstVisitStartTime) - 30));
      }, 80);
    }
  }

  async function createAndSelectClient() {
    const name = newClientName.trim() || clientQuery.trim();

    if (!name) {
      setStatusText(t.enterClientName);
      return;
    }

    if (newClientPhone.trim() && !isPhoneValid(accountCountry ?? "", newClientPhone)) {
      setStatusText(getPhoneValidationMessage(accountCountry ?? ""));
      return;
    }

    const fullPhone = buildInternationalPhone(accountCountry ?? "", newClientPhone);

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
      setStatusText(payload.error || t.addClientFailed);
      return;
    }

    setSelectedCustomer({ name, phone: fullPhone });
    setClientQuery("");
    setNewClientName("");
    setNewClientPhone("");
    setShowNewClientForm(false);
    setDrawerStage("visit");
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
        appointmentDate: selectedDate,
        startTime: selectedTime,
        endTime: minutesToTime(timeToMinutes(selectedTime) + 30),
        serviceName
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatusText(payload.error || t.blockTimeFailed);
      return;
    }

    await refreshSnapshot();
    setQuickMenu({ visible: false, x: 0, y: 0, time: "" });
    setStatusText(kindLabel);
  }

  async function deleteSelectedAppointment() {
    if (!selectedAppointment) {
      return;
    }

    const response = await fetch(`/api/pro/calendar?appointmentId=${encodeURIComponent(selectedAppointment.id)}`, {
      method: "DELETE"
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatusText(payload.error || t.deleteBlockFailed);
      return;
    }

    await refreshSnapshot();
    setDrawerStage("closed");
    setSelectedAppointmentId(null);
    setStatusText(selectedAppointment.kind === "blocked" ? t.blockedRemoved : t.visitRemoved);
  }

  async function saveAppointmentMeta() {
    if (!selectedAppointment || selectedAppointment.kind !== "appointment") {
      return;
    }

    const response = await fetch("/api/pro/calendar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "meta",
        appointmentId: selectedAppointment.id,
        attendance: attendanceDraft,
        priceAmount: Number(priceAmountDraft || 0)
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatusText(payload.error || t.saveVisitFailed);
      return;
    }

    await refreshSnapshot();
    setDrawerStage("closed");
    setSelectedAppointmentId(null);
    setStatusText(t.visitUpdated);
  }

  async function saveBlockedTime() {
    if (!selectedAppointment || selectedAppointment.kind !== "blocked") {
      return;
    }

    const response = await fetch("/api/pro/calendar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selectedAppointment.id,
        startTime: selectedAppointment.startTime,
        endTime: selectedAppointment.endTime
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatusText(payload.error || t.blockedSaveFailed);
      return;
    }

    await refreshSnapshot();
    setDrawerStage("closed");
    setSelectedAppointmentId(null);
    setStatusText(t.blockedUpdated);
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
        )
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

  return (
    <main className={`${styles.workspaceShell} ${styles.calendarV2Shell} ${overlayActive ? styles.calendarV2Expanded : ""}`}>
      <ProSidebar active="calendar" professionalId={professionalId} />

      <aside className={styles.calendarLeftPanel}>
        <div className={styles.calendarViewRail}>
          <button type="button" className={styles.calendarPanelBack} aria-label={t.back}>‹</button>
          <div className={styles.calendarViewDropdown}>
            <button
              type="button"
              className={styles.calendarViewModeButton}
              onClick={() => setViewMenuOpen((value) => !value)}
              aria-expanded={viewMenuOpen}
            >
              <span>{viewModeOptions.find((option) => option.value === viewMode)?.label ?? t.day}</span>
              <span className={styles.calendarViewClose}>×</span>
              <span className={styles.calendarViewChevron}>⌄</span>
            </button>
            {viewMenuOpen ? (
              <div className={styles.calendarViewMenu}>
                {viewModeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={option.value === viewMode ? styles.calendarViewMenuActive : ""}
                    onClick={() => {
                      setViewMode(option.value);
                      setViewMenuOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    {option.value === viewMode ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.miniCalendarCard}>
          <div className={styles.miniCalendarHeader}>
            <strong>
              <span>{selectedMonthLabel}</span>
              <span>{selectedYearLabel}</span>
            </strong>
            <div className={styles.miniCalendarNav}>
              <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, -30))}>‹</button>
              <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, 30))}>›</button>
            </div>
          </div>

          <div className={styles.miniCalendarWeekdays}>
            {miniCalendarWeekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className={styles.miniCalendarGrid}>
            {monthGrid.map((day) => {
              const schedule = monthSchedules.get(day.key) ?? null;
              const isWorkingDay = Boolean(schedule?.enabled);
              const scheduleLabel = getScheduleLabel(schedule, t.closed);

              return (
                <button
                  key={day.key}
                  type="button"
                  title={scheduleLabel}
                  className={`${styles.miniCalendarDay} ${day.outside ? styles.miniCalendarDayOutside : ""} ${isWorkingDay ? styles.miniCalendarDayWork : styles.miniCalendarDayOff} ${day.key === todayDate ? styles.miniCalendarDayToday : ""} ${day.key === selectedDate ? styles.miniCalendarDayActive : ""}`}
                  onClick={() => setSelectedDate(day.key)}
                >
                  <span>{day.day}</span>
                  <small>{isWorkingDay ? scheduleLabel : t.closed}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.weekJumpBlock}>
          <strong>{t.weekJump}</strong>
          <div className={styles.weekJumpGrid}>
            {[1, 2, 3, 4, 5, 6, -1, -2, -3, -4, -5, -6].map((week) => (
              <button
                key={week}
                type="button"
                onClick={() => setSelectedDate(addDays(selectedDate, week * 7))}
              >
                {week > 0 ? `+${week}` : week}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className={styles.calendarCenterShell}>
        <header className={styles.calendarTopBarV2}>
          <div className={styles.calendarTopLeft}>
            {isMobileViewport ? (
              <div className={styles.calendarViewDropdown}>
                <button
                  type="button"
                  className={`${styles.calendarViewModeButton} ${styles.calendarTopMobileModeButton}`}
                  onClick={() => setViewMenuOpen((value) => !value)}
                  aria-expanded={viewMenuOpen}
                >
                  <span>{viewModeOptions.find((option) => option.value === viewMode)?.label ?? t.day}</span>
                  <span className={styles.calendarViewChevron}>⌄</span>
                </button>
                {viewMenuOpen ? (
                  <div className={`${styles.calendarViewMenu} ${styles.calendarTopMobileMenu}`}>
                    {viewModeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={option.value === viewMode ? styles.calendarViewMenuActive : ""}
                        onClick={() => {
                          setViewMode(option.value);
                          setViewMenuOpen(false);
                        }}
                      >
                        <span>{option.label}</span>
                        {option.value === viewMode ? <span>✓</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <button type="button" className={styles.calendarTodayButton} onClick={() => setSelectedDate(todayDate)}>
                {t.today}
              </button>
            )}
            <button type="button" className={styles.calendarSquareButton} onClick={() => moveVisiblePeriod(-1)}>‹</button>
            <div className={styles.calendarDatePill}>
              <strong>{activeDateLabel}</strong>
              <span>{viewMode === "day" ? (selectedDayIsWorking ? `${formatDisplayTime(minutesToTime(workStartMinutes))} - ${formatDisplayTime(minutesToTime(workEndMinutes))}` : t.closedBySchedule) : t.selected}</span>
            </div>
            <button type="button" className={styles.calendarSquareButton} onClick={() => moveVisiblePeriod(1)}>›</button>
          </div>
        </header>

        <div className={styles.calendarTitleRow}>
          <div className={styles.calendarTitleMeta}>
            <strong>{snapshot?.workspace.professional.firstName || t.masterFallback}</strong>
            <span>{`${snapshot?.workspace.services.length ?? 0} ${t.services} · ${viewMode === "day" ? t.dailyCalendar : viewModeOptions.find((option) => option.value === viewMode)?.label}`}</span>
          </div>
          <div className={styles.calendarStatsStrip} aria-label={t.dailyCalendar}>
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
        </div>

        {statusText ? <div className={styles.calendarInlineStatus}>{statusText}</div> : null}

        {viewMode === "day" ? (
        <div ref={scrollFrameRef} className={styles.calendarV2ScrollFrame}>
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
                  onClick={() => openNewVisit(getSuggestedVisitStartTime())}
                  aria-label={t.quickNewVisit}
                >
                  +
                </button>
              ) : null}
            </div>

            <div
              className={styles.calendarV2Body}
              style={{
                minHeight: `${calendarGridHeight}px`,
                ["--calendar-slot-step-height" as never]: `${slotHeight}px`,
                ["--calendar-hour-block-height" as never]: `${calendarHourHeight}px`
              }}
            >
              {!selectedDayIsWorking ? (
                <div
                  className={styles.nonWorkingZone}
                  style={{ top: `${topOffset}px`, height: `${dayEndMinutes * minuteHeight}px` }}
                />
              ) : (
                <>
                  <div
                    className={styles.nonWorkingZone}
                    style={{ top: `${topOffset}px`, height: `${Math.max(0, workStartMinutes) * minuteHeight}px` }}
                  />
                  <div
                    className={styles.nonWorkingZone}
                    style={{ top: `${topOffset + workEndMinutes * minuteHeight}px`, height: `${Math.max(0, dayEndMinutes - workEndMinutes) * minuteHeight}px` }}
                  />
                </>
              )}
              {selectedDayIsWorking
                ? dayBreaks.map((breakItem) => (
                    <div
                      key={`${breakItem.startTime}-${breakItem.endTime}`}
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
                  <span className={styles.nowBadge}>
                    {new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
                  </span>
                </div>
              ) : null}

              {Array.from({ length: (dayEndMinutes - dayStartMinutes) / CALENDAR_GRID_STEP_MINUTES }, (_, index) => {
                const slotMinutes = dayStartMinutes + index * CALENDAR_GRID_STEP_MINUTES;
                const slot = minutesToTime(slotMinutes);
                const top = topOffset + index * slotHeight;
                const inWorkingHours = isWithinWorkingWindow(slot, daySchedule);

                return (
                  <button
                    key={slot}
                    type="button"
                    className={`${styles.calendarSlotButton} ${selectedTime === slot ? styles.calendarSlotActive : ""} ${!inWorkingHours ? styles.calendarSlotOffHours : ""}`}
                    style={{ top: `${top}px`, height: `${slotHeight}px` }}
                    onClick={(event) => {
                      const bodyRect = (event.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect();
                      handleSlotClick(slot, event.clientX - bodyRect.left, top, bodyRect.width);
                    }}
                  >
                    {slot}
                  </button>
                );
              })}

              {quickMenu.visible ? (
                <div className={styles.calendarQuickMenu} style={{ left: `${quickMenu.x}px`, top: `${quickMenu.y}px` }}>
                  <button
                    type="button"
                    className={styles.calendarQuickMenuAction}
                    onClick={() => {
                      setQuickMenu({ visible: false, x: 0, y: 0, time: "" });
                      openNewVisit(quickMenu.time);
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

              {(snapshot?.appointments ?? []).map((appointment) => {
                const top = topOffset + timeToMinutes(appointment.startTime) * minuteHeight;
                const height = Math.max(bookingCardMinHeight, (timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)) * minuteHeight);
                const isPastAppointment = getDateTimeValue(appointment.appointmentDate, appointment.endTime) < Date.now();
                const isBlocked = appointment.kind === "blocked";
                const isPendingApproval = appointment.attendance === "pending";
                const bookingColor = isBlocked
                  ? "#d9dce4"
                  : getServiceColor(appointment.serviceName, snapshot?.workspace.services ?? []);
                const layout = appointmentLayouts.get(appointment.id) ?? { lane: 0, laneCount: 1 };
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
                    onPointerDown={(event) => {
                      dragRef.current = {
                        startY: event.clientY,
                        originalStartMinutes: timeToMinutes(appointment.startTime),
                        originalEndMinutes: timeToMinutes(appointment.endTime),
                        appointmentId: appointment.id,
                        mode: "move"
                      };
                      setDraggingId(appointment.id);
                    }}
                    onClick={() => {
                      if (isBlocked) {
                        setSelectedAppointmentId(appointment.id);
                        setDrawerStage("details");
                        setQuickMenu({ visible: false, x: 0, y: 0, time: "" });
                        return;
                      }
                      setSelectedAppointmentId(appointment.id);
                      setAttendanceDraft(appointment.attendance);
                      setPriceAmountDraft(String(appointment.priceAmount ?? 0));
                      setDrawerStage("details");
                      setQuickMenu({ visible: false, x: 0, y: 0, time: "" });
                    }}
                  >
                    <span className={styles.bookingTime}>{`${formatDisplayTime(appointment.startTime)} - ${formatDisplayTime(appointment.endTime)}`}</span>
                    <strong className={styles.bookingTitle}>
                      {isBlocked ? appointment.serviceName || t.blockedTimeFallback : appointment.customerName || t.walkInClient}
                    </strong>
                    {!isBlocked ? <span className={styles.bookingService}>{appointment.serviceName}</span> : null}
                    <button
                      type="button"
                      className={styles.bookingResizeHandle}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        dragRef.current = {
                          startY: event.clientY,
                          originalStartMinutes: timeToMinutes(appointment.startTime),
                          originalEndMinutes: timeToMinutes(appointment.endTime),
                          appointmentId: appointment.id,
                          mode: "resize"
                        };
                        setDraggingId(appointment.id);
                      }}
                    />
                  </article>
                );
              })}
            </div>
          </div>
        </div>
        ) : viewMode === "week" ? (
          <div className={styles.calendarOverviewPanel}>
            <div className={styles.calendarWeekOverviewGrid}>
              {weekKeys.map((dayKey) => {
                const schedule = snapshot
                  ? resolveDaySchedule(dayKey, snapshot.workspace.business.workSchedule, scheduleOverrides)
                  : null;
                const dayAppointments = dayKey === selectedDate ? snapshot?.appointments ?? [] : [];
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
                const dayAppointments = day.key === selectedDate ? snapshot?.appointments ?? [] : [];
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
        {drawerStage === "visit" ? (
          <div className={styles.calendarV2Panel}>
            <div className={styles.calendarV2PanelHeader}>
              <button type="button" className={styles.calendarDrawerBack} onClick={() => setDrawerStage("closed")}>←</button>
              <strong>{t.newVisitTitle}</strong>
            </div>

            <button type="button" className={styles.calendarCustomerCard} onClick={() => setDrawerStage("client-search")}>
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

            {visitHasOverlap ? <div className={styles.calendarOverlapWarning}>{t.overlapWarning}</div> : null}
            {blockedSelection ? <div className={styles.calendarPastWarning}>{t.partBlocked}</div> : null}

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
              <button type="button" className={styles.calendarDrawerBack} onClick={() => setDrawerStage("visit")}>←</button>
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
              <button type="button" className={styles.calendarDrawerBack} onClick={() => setDrawerStage("visit")}>←</button>
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
                  setSelectedCustomer(null);
                  setClientQuery("");
                  setDrawerStage("visit");
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
              <div className={styles.calendarQuickClientForm}>
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
                  <div className={styles.phoneRow}>
                    <div className={styles.phoneCode}>{phoneRule.prefix}</div>
                    <input
                      className={styles.phoneInput}
                      inputMode="numeric"
                      value={newClientPhone}
                      onChange={(event) => setNewClientPhone(formatPhoneLocal(event.target.value, phoneRule))}
                      placeholder={phoneRule.placeholder}
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
                      onClick={() => {
                        setSelectedCustomer(client);
                        setClientQuery("");
                        setDrawerStage("visit");
                      }}
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
              <strong>{selectedAppointment.kind === "blocked" ? selectedAppointment.serviceName : selectedAppointment.customerName || t.customer}</strong>
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
              <div className={styles.field}>
                <label>{t.service}</label>
                <div className={styles.select}>{selectedAppointment.serviceName}</div>
              </div>
              <div className={styles.field}>
                <label>{t.customer}</label>
                <div className={styles.select}>{selectedAppointment.customerName || t.walkInClient}</div>
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
                  value={priceAmountDraft}
                  onChange={(event) => setPriceAmountDraft(event.target.value)}
                />
              </div>
              <button type="button" className={styles.primaryButton} onClick={() => void saveAppointmentMeta()}>
                {t.saveVisit}
              </button>
            </div>
            )}
          </div>
        ) : (
          <div className={styles.calendarDrawerPlaceholder} />
        )}
      </aside>

      {showClientPrompt ? (
        <div className={styles.calendarModalBackdrop}>
          <div className={styles.calendarModalCard}>
            <div className={styles.calendarModalAvatar}>◌</div>
            <h3>{t.newClientModalTitle}</h3>
            <p>{t.newClientModalText}</p>
            <button type="button" className={styles.primaryButton} onClick={() => { setShowClientPrompt(false); setDrawerStage("client-search"); }}>
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
