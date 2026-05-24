"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ProfileAvatar from "../../ProfileAvatar";
import FloatingPopover from "../FloatingPopover";
import ProSidebar from "../ProSidebar";
import ProWorkspaceHeader from "../ProWorkspaceHeader";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
import { localeBySiteLanguage } from "../../../lib/site-language";
import type { ProLanguage } from "../i18n";
import type { OnboardingCtaState } from "../../../lib/pro-onboarding";
import type { BusinessStaffSnapshot, StaffMemberSnapshot } from "../../../lib/pro-staff";
import {
  createEmptyWorkSchedule,
  defaultWorkTemplate,
  getDayBreaks,
  getDayScheduleForMode,
  getLastTemplateFromCustomSchedule,
  minutesToTime,
  normalizeCustomSchedule,
  normalizeWorkSchedule,
  timeToMinutes,
  workDays,
  type CustomSchedule,
  type WorkBreak,
  type WorkDayKey,
  type WorkDaySchedule,
  type WorkSchedule,
  type WorkScheduleMode
} from "../../../lib/work-schedule";

type StaffScheduleViewProps = {
  professionalId: string;
  snapshot: BusinessStaffSnapshot;
  onboardingCta: OnboardingCtaState;
  header: {
    viewerName: string;
    viewerAvatarUrl?: string;
    viewerInitials: string;
    isPremium?: boolean;
    publicBookingUrl?: string;
    publicBookingEnabled?: boolean;
  };
};

type ScheduleCopy = {
  sectionTitle: string;
  people: string;
  schedule: string;
  title: string;
  text: string;
  sort: string;
  sortByName: string;
  sortByHoursDesc: string;
  sortByHoursAsc: string;
  master: string;
  scheduleMode: string;
  weeklyMode: string;
  flexibleMode: string;
  month: string;
  today: string;
  options: string;
  add: string;
  addMember: string;
  membersList: string;
  openCurrentWeek: string;
  employee: string;
  change: string;
  noWork: string;
  hours: string;
  empty: string;
  footer: string;
  editDay: string;
  repeatingShifts: string;
  addFreeTime: string;
  deleteShift: string;
  dayRemoved: string;
  clearedAll: string;
  saved: string;
  failed: string;
  planSection: string;
  memberSection: string;
  viewMember: string;
  editMember: string;
  openAccess: string;
  removeAllShifts: string;
  plannerTitle: (name: string) => string;
  plannerText: string;
  repeatType: string;
  repeatWeekly: string;
  repeatForPeriod: string;
  startDate: string;
  endBehavior: string;
  untilChanged: string;
  untilDate: string;
  endDate: string;
  selectEndDate: string;
  invalidDateRange: string;
  businessHint: string;
  plannerHint: string;
  plannerSummary: string;
  close: string;
  save: string;
  saving: string;
  workingDay: string;
  workFrom: string;
  workTo: string;
  breakFrom: string;
  breakTo: string;
  addBreak: string;
  removeBreak: string;
  addWorkWindow: string;
  removeWorkWindow: string;
  invalidIntervalRange: string;
  overlappingIntervals: string;
  noRoomForInterval: string;
  restoreTemplate: string;
  dayEditorTitle: (name: string, date: string) => string;
  dayEditorText: string;
  flexibleDayEditorText: string;
  dayIntervalsTitle: string;
  resetDay: string;
  weekOf: string;
  notSelected: string;
};

type LocalizedWorkDay = {
  key: WorkDayKey;
  shortLabel: string;
  fullLabel: string;
};

type CalendarDayItem = {
  key: string;
  date: Date | null;
};

type CellMenuState = {
  memberId: string;
  dateKey: string;
  anchorEl: HTMLElement;
};

type PlannerState = {
  memberId: string;
  anchorDateKey?: string;
};

type PlannerApplyMode = "template" | "period";
type PlannerEndMode = "until-changed" | "until-date";
type WorkInterval = {
  startTime: string;
  endTime: string;
};

type DayEditorState = {
  memberId: string;
  dateKey: string;
  focusBreak?: boolean;
};

type EditableDaySchedule = {
  enabled: boolean;
  intervals: WorkInterval[];
};

type EditableWorkSchedule = Record<WorkDayKey, EditableDaySchedule>;

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const minutes = index * 15;
  return minutesToTime(minutes);
});

const scheduleText = {
  ru: {
    sectionTitle: "Команда",
    people: "Участники команды",
    schedule: "График смен",
    title: "График смен",
    text: "Выберите мастера и настройте его рабочие дни.",
    sort: "Сортировка",
    sortByName: "По имени",
    sortByHoursDesc: "По нагрузке сверху",
    sortByHoursAsc: "По нагрузке снизу",
    master: "Мастер",
    scheduleMode: "Режим графика",
    weeklyMode: "По неделе",
    flexibleMode: "Свободный",
    month: "Месяц",
    today: "На этой неделе",
    options: "Варианты",
    add: "Добавить",
    addMember: "Новый участник команды",
    membersList: "Участники команды",
    openCurrentWeek: "Открыть текущую неделю",
    employee: "Член команды",
    change: "Изменить",
    noWork: "Не работает",
    hours: "ч",
    empty: "Сначала добавьте сотрудников в команду.",
    footer:
      "В списке сотрудников отображается доступность мастеров для бронирования. Общий график компании остаётся стартовым шаблоном, но каждый мастер дальше живёт по своему личному расписанию.",
    editDay: "Изменить этот день",
    repeatingShifts: "Установить повторяющиеся смены",
    addFreeTime: "Добавить рабочее время",
    deleteShift: "Удалить эту смену",
    dayRemoved: "Смена на этот день удалена.",
    clearedAll: "Личный график сотрудника очищен.",
    saved: "График сохранён.",
    failed: "Не удалось сохранить график.",
    planSection: "Запланировать",
    memberSection: "Участник команды",
    viewMember: "Просмотр сотрудника",
    editMember: "Изменить участника команды",
    openAccess: "Доступ и кабинет",
    removeAllShifts: "Удалить все смены",
    plannerTitle: (name) => `Установить повторяющиеся смены для ${name}`,
    plannerText: "Сохраните недельный шаблон сотрудника.",
    repeatType: "Как применять",
    repeatWeekly: "Сделать основным графиком",
    repeatForPeriod: "Применить на выбранный период",
    startDate: "Дата начала",
    endBehavior: "Завершение",
    untilChanged: "Пока не измените график",
    untilDate: "До выбранной даты",
    endDate: "Дата завершения",
    selectEndDate: "Выберите дату завершения.",
    invalidDateRange: "Дата завершения должна быть не раньше даты начала.",
    businessHint: "График сотрудника применяется внутри текущего бизнеса и влияет на календарь мастера и онлайн-запись.",
    plannerHint: "Исключения по конкретным датам по-прежнему редактируются из недельной таблицы.",
    plannerSummary: "Еженедельно",
    close: "Закрыть",
    save: "Сохранить",
    saving: "Сохраняем...",
    workingDay: "Рабочий день",
    workFrom: "С",
    workTo: "До",
    breakFrom: "Рабочий интервал с",
    breakTo: "До",
    addBreak: "Добавить время",
    removeBreak: "Удалить рабочий интервал",
    addWorkWindow: "Добавить время",
    removeWorkWindow: "Удалить рабочий интервал",
    invalidIntervalRange: "В каждом рабочем интервале время окончания должно быть позже времени начала.",
    overlappingIntervals: "Интервалы пересекаются.",
    noRoomForInterval:
      "Для нового рабочего интервала в этом дне уже не осталось места. Измените текущее время или удалите лишний интервал.",
    restoreTemplate: "Сбросить к шаблону недели",
    dayEditorTitle: (name, date) => `Изменить ${date} для ${name}`,
    dayEditorText:
      "Изменение затронет только выбранный день. Для постоянного шаблона используйте настройку повторяющихся смен.",
    flexibleDayEditorText: "Этот день работает отдельно от недельного графика.",
    dayIntervalsTitle: "Рабочее время",
    resetDay: "Удалить настройку дня",
    weekOf: "Неделя",
    notSelected: "Не выбрано"
  },
  uk: {
    sectionTitle: "Команда",
    people: "Учасники команди",
    schedule: "Графік змін",
    title: "Графік змін",
    text: "Оберіть майстра й налаштуйте його робочі дні.",
    sort: "Сортування",
    sortByName: "За іменем",
    sortByHoursDesc: "За навантаженням зверху",
    sortByHoursAsc: "За навантаженням знизу",
    master: "Майстер",
    scheduleMode: "Режим графіка",
    weeklyMode: "За тижнем",
    flexibleMode: "Вільний",
    month: "Місяць",
    today: "На цьому тижні",
    options: "Варіанти",
    add: "Додати",
    addMember: "Новий учасник команди",
    membersList: "Учасники команди",
    openCurrentWeek: "Відкрити поточний тиждень",
    employee: "Член команди",
    change: "Змінити",
    noWork: "Не працює",
    hours: "год",
    empty: "Спочатку додайте співробітників до команди.",
    footer:
      "У списку співробітників показано доступність майстрів для бронювання. Загальний графік компанії лишається стартовим шаблоном, але далі кожен майстер живе за власним розкладом.",
    editDay: "Змінити цей день",
    repeatingShifts: "Встановити повторювані зміни",
    addFreeTime: "Додати робочий час",
    deleteShift: "Видалити цю зміну",
    dayRemoved: "Зміну на цей день видалено.",
    clearedAll: "Особистий графік співробітника очищено.",
    saved: "Графік збережено.",
    failed: "Не вдалося зберегти графік.",
    planSection: "Запланувати",
    memberSection: "Учасник команди",
    viewMember: "Перегляд співробітника",
    editMember: "Змінити учасника команди",
    openAccess: "Доступ і кабінет",
    removeAllShifts: "Видалити всі зміни",
    plannerTitle: (name) => `Встановити повторювані зміни для ${name}`,
    plannerText: "Збережіть тижневий шаблон співробітника.",
    repeatType: "Як застосувати",
    repeatWeekly: "Зробити основним графіком",
    repeatForPeriod: "Застосувати на вибраний період",
    startDate: "Дата початку",
    endBehavior: "Завершення",
    untilChanged: "Поки не зміните графік",
    untilDate: "До вибраної дати",
    endDate: "Дата завершення",
    selectEndDate: "Оберіть дату завершення.",
    invalidDateRange: "Дата завершення має бути не раніше дати початку.",
    businessHint: "Графік співробітника застосовується всередині поточного бізнесу й впливає на календар майстра та онлайн-запис.",
    plannerHint: "Винятки за конкретними датами й надалі редагуються прямо з тижневої таблиці.",
    plannerSummary: "Щотижня",
    close: "Закрити",
    save: "Зберегти",
    saving: "Зберігаємо...",
    workingDay: "Робочий день",
    workFrom: "З",
    workTo: "До",
    breakFrom: "Робочий інтервал з",
    breakTo: "До",
    addBreak: "Додати час",
    removeBreak: "Видалити робочий інтервал",
    addWorkWindow: "Додати час",
    removeWorkWindow: "Видалити робочий інтервал",
    invalidIntervalRange: "У кожному робочому інтервалі час завершення має бути пізніше за час початку.",
    overlappingIntervals: "Інтервали перетинаються.",
    noRoomForInterval:
      "Для нового робочого інтервалу в цьому дні вже не залишилося місця. Змініть поточний час або приберіть зайвий інтервал.",
    restoreTemplate: "Скинути до шаблону тижня",
    dayEditorTitle: (name, date) => `Змінити ${date} для ${name}`,
    dayEditorText:
      "Зміна зачепить лише вибраний день. Для постійного шаблону використовуйте налаштування повторюваних змін.",
    flexibleDayEditorText: "Цей день працює окремо від тижневого графіка.",
    dayIntervalsTitle: "Робочий час",
    resetDay: "Видалити налаштування дня",
    weekOf: "Тиждень",
    notSelected: "Не вибрано"
  },
  en: {
    sectionTitle: "Team",
    people: "Team members",
    schedule: "Shift schedule",
    title: "Shift schedule",
    text: "Choose a specialist and set their working days.",
    sort: "Sort",
    sortByName: "By name",
    sortByHoursDesc: "Most hours first",
    sortByHoursAsc: "Least hours first",
    master: "Specialist",
    scheduleMode: "Schedule mode",
    weeklyMode: "Weekly",
    flexibleMode: "Flexible",
    month: "Month",
    today: "This week",
    options: "Options",
    add: "Add",
    addMember: "New team member",
    membersList: "Team members",
    openCurrentWeek: "Open current week",
    employee: "Team member",
    change: "Change",
    noWork: "Not working",
    hours: "h",
    empty: "Add employees to the team first.",
    footer:
      "This table shows the real booking availability of specialists. The business schedule stays a starting template, but each specialist now follows a personal schedule.",
    editDay: "Edit this day",
    repeatingShifts: "Set recurring shifts",
    addFreeTime: "Add working time",
    deleteShift: "Delete this shift",
    dayRemoved: "The shift for this day was removed.",
    clearedAll: "The employee personal schedule was cleared.",
    saved: "Schedule saved.",
    failed: "Could not save schedule.",
    planSection: "Plan",
    memberSection: "Team member",
    viewMember: "View employee",
    editMember: "Edit team member",
    openAccess: "Access and workspace",
    removeAllShifts: "Delete all shifts",
    plannerTitle: (name) => `Set recurring shifts for ${name}`,
    plannerText: "Save the employee weekly template.",
    repeatType: "How to apply",
    repeatWeekly: "Set as base schedule",
    repeatForPeriod: "Apply for selected period",
    startDate: "Start date",
    endBehavior: "End",
    untilChanged: "Until you change it",
    untilDate: "Until selected date",
    endDate: "End date",
    selectEndDate: "Choose an end date.",
    invalidDateRange: "The end date must be on or after the start date.",
    businessHint: "The employee schedule is applied inside the current business and affects both the calendar and online booking.",
    plannerHint: "Date-specific exceptions are still managed directly from the weekly board.",
    plannerSummary: "Weekly",
    close: "Close",
    save: "Save",
    saving: "Saving...",
    workingDay: "Working day",
    workFrom: "From",
    workTo: "To",
    breakFrom: "Working interval from",
    breakTo: "To",
    addBreak: "Add time",
    removeBreak: "Remove working interval",
    addWorkWindow: "Add time",
    removeWorkWindow: "Remove working interval",
    invalidIntervalRange: "Each working interval must end after it starts.",
    overlappingIntervals: "Intervals overlap.",
    noRoomForInterval:
      "There is no room left for another working interval in this day. Adjust the current time or remove an extra interval.",
    restoreTemplate: "Reset to weekly template",
    dayEditorTitle: (name, date) => `Edit ${date} for ${name}`,
    dayEditorText:
      "This change only affects the selected date. Use recurring shifts if you want to update the permanent weekly template.",
    flexibleDayEditorText: "This day is managed separately from the weekly schedule.",
    dayIntervalsTitle: "Working time",
    resetDay: "Delete day override",
    weekOf: "Week",
    notSelected: "Not selected"
  },
  fr: {
    sectionTitle: "Équipe",
    people: "Membres de l’équipe",
    schedule: "Planning d’équipe",
    title: "Planning d’équipe",
    text: "Choisissez un spécialiste et configurez ses jours de travail.",
    sort: "Tri",
    sortByName: "Par nom",
    sortByHoursDesc: "Plus d’heures d’abord",
    sortByHoursAsc: "Moins d’heures d’abord",
    master: "Spécialiste",
    scheduleMode: "Mode d’horaire",
    weeklyMode: "Hebdomadaire",
    flexibleMode: "Flexible",
    month: "Mois",
    today: "Cette semaine",
    options: "Options",
    add: "Ajouter",
    addMember: "Nouveau membre",
    membersList: "Membres de l’équipe",
    noWork: "Ne travaille pas",
    hours: "h",
    empty: "Ajoutez d’abord des employés à l’équipe.",
    editDay: "Modifier ce jour",
    repeatingShifts: "Définir des shifts récurrents",
    addFreeTime: "Ajouter du temps de travail",
    deleteShift: "Supprimer ce shift",
    saved: "Planning enregistré.",
    failed: "Impossible d’enregistrer le planning.",
    close: "Fermer",
    save: "Enregistrer",
    saving: "Enregistrement...",
    workingDay: "Jour travaillé",
    workFrom: "De",
    workTo: "À",
    addBreak: "Ajouter du temps",
    removeBreak: "Supprimer l’intervalle",
    weekOf: "Semaine",
    notSelected: "Non sélectionné"
  },
  pl: {
    sectionTitle: "Zespół",
    people: "Członkowie zespołu",
    schedule: "Grafik zmian",
    title: "Grafik zmian",
    text: "Wybierz specjalistę i ustaw jego dni pracy.",
    sort: "Sortowanie",
    sortByName: "Według nazwy",
    sortByHoursDesc: "Najwięcej godzin",
    sortByHoursAsc: "Najmniej godzin",
    master: "Specjalista",
    scheduleMode: "Tryb grafiku",
    weeklyMode: "Tygodniowy",
    flexibleMode: "Elastyczny",
    month: "Miesiąc",
    today: "Ten tydzień",
    options: "Opcje",
    add: "Dodaj",
    addMember: "Nowy członek zespołu",
    membersList: "Członkowie zespołu",
    noWork: "Nie pracuje",
    hours: "godz.",
    empty: "Najpierw dodaj pracowników do zespołu.",
    editDay: "Edytuj ten dzień",
    repeatingShifts: "Ustaw powtarzalne zmiany",
    addFreeTime: "Dodaj czas pracy",
    deleteShift: "Usuń tę zmianę",
    saved: "Grafik zapisany.",
    failed: "Nie udało się zapisać grafiku.",
    close: "Zamknij",
    save: "Zapisz",
    saving: "Zapisywanie...",
    workingDay: "Dzień pracy",
    workFrom: "Od",
    workTo: "Do",
    addBreak: "Dodaj czas",
    removeBreak: "Usuń przedział pracy",
    weekOf: "Tydzień",
    notSelected: "Nie wybrano"
  },
  cs: {
    sectionTitle: "Tým",
    people: "Členové týmu",
    schedule: "Rozvrh směn",
    title: "Rozvrh směn",
    text: "Vyberte specialistu a nastavte jeho pracovní dny.",
    sort: "Řazení",
    sortByName: "Podle jména",
    master: "Specialista",
    scheduleMode: "Režim rozvrhu",
    weeklyMode: "Týdenní",
    flexibleMode: "Flexibilní",
    month: "Měsíc",
    today: "Tento týden",
    options: "Možnosti",
    add: "Přidat",
    noWork: "Nepracuje",
    hours: "h",
    saved: "Rozvrh uložen.",
    failed: "Rozvrh se nepodařilo uložit.",
    close: "Zavřít",
    save: "Uložit",
    saving: "Ukládání...",
    weekOf: "Týden",
    notSelected: "Nevybráno"
  },
  es: {
    sectionTitle: "Equipo",
    people: "Miembros del equipo",
    schedule: "Horario de turnos",
    title: "Horario de turnos",
    text: "Elige un especialista y configura sus días de trabajo.",
    sort: "Ordenar",
    sortByName: "Por nombre",
    master: "Especialista",
    scheduleMode: "Modo de horario",
    weeklyMode: "Semanal",
    flexibleMode: "Flexible",
    month: "Mes",
    today: "Esta semana",
    options: "Opciones",
    add: "Añadir",
    noWork: "No trabaja",
    hours: "h",
    saved: "Horario guardado.",
    failed: "No se pudo guardar el horario.",
    close: "Cerrar",
    save: "Guardar",
    saving: "Guardando...",
    weekOf: "Semana",
    notSelected: "No seleccionado"
  },
  de: {
    sectionTitle: "Team",
    people: "Teammitglieder",
    schedule: "Schichtplan",
    title: "Schichtplan",
    text: "Wähle einen Spezialisten und richte seine Arbeitstage ein.",
    sort: "Sortierung",
    sortByName: "Nach Name",
    master: "Spezialist",
    scheduleMode: "Zeitplanmodus",
    weeklyMode: "Wöchentlich",
    flexibleMode: "Flexibel",
    month: "Monat",
    today: "Diese Woche",
    options: "Optionen",
    add: "Hinzufügen",
    noWork: "Arbeitet nicht",
    hours: "Std.",
    saved: "Zeitplan gespeichert.",
    failed: "Zeitplan konnte nicht gespeichert werden.",
    close: "Schließen",
    save: "Speichern",
    saving: "Speichern...",
    weekOf: "Woche",
    notSelected: "Nicht ausgewählt"
  }
} satisfies Record<string, Partial<ScheduleCopy>>;

function getLocale(language: ProLanguage) {
  return localeBySiteLanguage[language];
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const shift = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - shift);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(base: Date, offset: number) {
  const next = new Date(base);
  next.setDate(base.getDate() + offset);
  return next;
}

function addMonths(base: Date, offset: number) {
  const next = new Date(base);
  next.setMonth(base.getMonth() + offset, 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function buildMonthDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leading = (firstDay.getDay() + 6) % 7;
  const days: CalendarDayItem[] = [];

  for (let index = 0; index < leading; index += 1) {
    days.push({ date: null, key: `empty-start-${index}` });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(year, month, day);
    days.push({ date, key: toDateKey(date) });
  }

  while (days.length % 7 !== 0) {
    days.push({ date: null, key: `empty-end-${days.length}` });
  }

  return days;
}

function getWeekdayKey(dateKey: string): WorkDayKey {
  const index = (fromDateKey(dateKey).getDay() + 6) % 7;
  return workDays[index].key;
}

function getDayDurationMinutes(daySchedule: WorkDaySchedule | null | undefined) {
  if (!daySchedule?.enabled) {
    return 0;
  }

  const workMinutes = Math.max(0, timeToMinutes(daySchedule.endTime) - timeToMinutes(daySchedule.startTime));
  const breakMinutes = getDayBreaks(daySchedule).reduce(
    (sum, item) => sum + Math.max(0, timeToMinutes(item.endTime) - timeToMinutes(item.startTime)),
    0
  );

  return Math.max(0, workMinutes - breakMinutes);
}

function getDayIntervals(daySchedule: WorkDaySchedule | null | undefined) {
  if (!daySchedule) {
    return [] as WorkInterval[];
  }

  if (Array.isArray(daySchedule.intervals) && daySchedule.intervals.length > 0) {
    return daySchedule.intervals
      .filter((item) => item?.startTime && item?.endTime)
      .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
      .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));
  }

  const dayStart = timeToMinutes(daySchedule.startTime);
  const dayEnd = timeToMinutes(daySchedule.endTime);

  if (dayStart >= dayEnd) {
    return [
      {
        startTime: daySchedule.startTime,
        endTime: daySchedule.endTime
      }
    ];
  }

  const intervals: WorkInterval[] = [];
  let cursor = dayStart;

  for (const item of getDayBreaks(daySchedule)) {
    const breakStart = Math.max(dayStart, Math.min(dayEnd, timeToMinutes(item.startTime)));
    const breakEnd = Math.max(dayStart, Math.min(dayEnd, timeToMinutes(item.endTime)));

    if (breakStart > cursor) {
      intervals.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(breakStart)
      });
    }

    cursor = Math.max(cursor, breakEnd);
  }

  if (cursor < dayEnd) {
    intervals.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(dayEnd)
    });
  }

  return intervals.length > 0
    ? intervals
    : [
        {
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime
        }
      ];
}

function validateIntervals(intervals: WorkInterval[]) {
  const sorted = [...intervals]
    .map((item) => ({
      startTime: item.startTime,
      endTime: item.endTime
    }))
    .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));

  if (sorted.some((item) => timeToMinutes(item.startTime) >= timeToMinutes(item.endTime))) {
    return {
      ok: false as const,
      reason: "range" as const,
      intervals: sorted
    };
  }

  const normalized: WorkInterval[] = [];

  for (const interval of sorted) {
    const previous = normalized[normalized.length - 1];

    if (!previous) {
      normalized.push(interval);
      continue;
    }

    if (timeToMinutes(interval.startTime) < timeToMinutes(previous.endTime)) {
      return {
        ok: false as const,
        reason: "overlap" as const,
        intervals: sorted
      };
    }

    if (interval.startTime === previous.endTime) {
      previous.endTime = interval.endTime;
      continue;
    }

    normalized.push(interval);
  }

  return {
    ok: true as const,
    reason: null,
    intervals: normalized
  };
}

function serializeIntervals(
  enabled: boolean,
  intervals: WorkInterval[],
  fallback: Pick<WorkDaySchedule, "startTime" | "endTime">
) {
  const validation = validateIntervals(intervals);
  const normalized = validation.ok ? validation.intervals : intervals;

  if (!enabled || normalized.length === 0) {
    return serializeDay(false, fallback.startTime, fallback.endTime, []);
  }

  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  const breaks: WorkBreak[] = [];

  for (let index = 0; index < normalized.length - 1; index += 1) {
    const current = normalized[index];
    const next = normalized[index + 1];
    breaks.push({
      startTime: current.endTime,
      endTime: next.startTime
    });
  }

  return serializeDay(true, first.startTime, last.endTime, breaks);
}

function getIntervalsDurationMinutes(intervals: WorkInterval[]) {
  return intervals.reduce((sum, interval) => {
    return sum + Math.max(0, timeToMinutes(interval.endTime) - timeToMinutes(interval.startTime));
  }, 0);
}

function createEditableDaySchedule(daySchedule: WorkDaySchedule, focusBreak = false): EditableDaySchedule {
  const intervals = getDayIntervals(daySchedule);

  if (focusBreak && intervals.length < 2) {
    const nextIntervals = insertWorkInterval(intervals, 0);
    if (nextIntervals) {
      return {
        enabled: true,
        intervals: nextIntervals
      };
    }
  }

  return {
    enabled: daySchedule.enabled,
    intervals
  };
}

function createEditableWorkSchedule(schedule: WorkSchedule) {
  return Object.fromEntries(
    workDays.map((day) => [day.key, createEditableDaySchedule(schedule[day.key])])
  ) as EditableWorkSchedule;
}

function getFallbackRange(
  intervals: WorkInterval[],
  fallback: Pick<WorkDaySchedule, "startTime" | "endTime">
) {
  if (intervals.length === 0) {
    return fallback;
  }

  const sorted = [...intervals].sort(
    (left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime)
  );

  return {
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime
  };
}

function getIntervalError(reason: "range" | "overlap" | null, copy: ScheduleCopy) {
  if (reason === "range") {
    return copy.invalidIntervalRange;
  }

  if (reason === "overlap") {
    return copy.overlappingIntervals;
  }

  return copy.failed;
}

function formatHourCount(minutes: number, unit: string) {
  const hours = Math.round((minutes / 60) * 10) / 10;
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".", ",");
  return `${value} ${unit}`;
}

function createIntervalAfter(intervals: WorkInterval[], index: number) {
  const current = intervals[index];
  if (!current) {
    return null;
  }

  const next = intervals[index + 1];
  const minGap = 15;
  const currentEnd = timeToMinutes(current.endTime);
  const nextStart = next ? timeToMinutes(next.startTime) : 24 * 60;

  if (nextStart - currentEnd > minGap) {
    const windowStart = currentEnd + minGap;
    const desiredEnd = Math.min(nextStart - minGap, windowStart + 60);

    if (desiredEnd - windowStart >= 15) {
      return {
        startTime: minutesToTime(windowStart),
        endTime: minutesToTime(desiredEnd)
      } satisfies WorkInterval;
    }
  }

  const desiredGap = currentEnd < timeToMinutes("14:00") ? 60 : 15;
  const desiredDuration = currentEnd < timeToMinutes("14:00") ? 240 : 60;
  const desiredStart = Math.min(currentEnd + desiredGap, 24 * 60 - 30);
  const desiredEnd = Math.min(24 * 60 - 1, desiredStart + desiredDuration);

  if (desiredEnd - desiredStart < 15) {
    return null;
  }

  return {
    startTime: minutesToTime(desiredStart),
    endTime: minutesToTime(desiredEnd)
  } satisfies WorkInterval;
}

function createSplitIntervals(interval: WorkInterval) {
  const start = timeToMinutes(interval.startTime);
  const end = timeToMinutes(interval.endTime);
  const duration = end - start;

  if (duration < 360) {
    return null;
  }

  const gap = 60;
  const firstEnd = Math.round((start + (duration - gap) / 2) / 15) * 15;
  const safeFirstEnd = Math.max(start + 60, Math.min(firstEnd, end - gap - 60));
  const secondStart = safeFirstEnd + gap;

  if (safeFirstEnd <= start || secondStart >= end) {
    return null;
  }

  return [
    {
      startTime: minutesToTime(start),
      endTime: minutesToTime(safeFirstEnd)
    },
    {
      startTime: minutesToTime(secondStart),
      endTime: minutesToTime(end)
    }
  ] satisfies WorkInterval[];
}

function insertWorkInterval(intervals: WorkInterval[], index: number) {
  if (intervals.length === 1) {
    const split = createSplitIntervals(intervals[0]);
    if (split) {
      return split;
    }
  }

  const suggestion = createIntervalAfter(intervals, index);
  if (!suggestion) {
    return null;
  }

  return [...intervals.slice(0, index + 1), suggestion, ...intervals.slice(index + 1)];
}

function formatIntervalLabel(interval: WorkInterval) {
  return `${interval.startTime} - ${interval.endTime}`;
}

function serializeDay(enabled: boolean, startTime: string, endTime: string, breaks: WorkBreak[]) {
  const intervals = getDayIntervals({ enabled, startTime, endTime, breakStart: breaks[0]?.startTime ?? startTime, breakEnd: breaks[0]?.endTime ?? startTime, breaks });

  return {
    enabled,
    startTime,
    endTime,
    intervals,
    breakStart: breaks[0]?.startTime ?? startTime,
    breakEnd: breaks[0]?.endTime ?? startTime,
    breaks,
    dayType: enabled ? ("workday" as const) : ("day-off" as const)
  };
}

function makeMemberName(member: StaffMemberSnapshot) {
  return `${member.professional.firstName} ${member.professional.lastName}`.trim() || member.professional.email;
}

function resolveMemberDaySchedule(member: StaffMemberSnapshot, dateKey: string) {
  return getDayScheduleForMode(
    dateKey,
    member.membership.workSchedule,
    member.membership.customSchedule,
    member.membership.workScheduleMode
  );
}

function formatInputDate(dateKey: string) {
  return dateKey;
}

function formatRangeLabel(weekDays: Array<{ date: Date }>, locale: string) {
  const start = weekDays[0]?.date;
  const end = weekDays[6]?.date;

  if (!start || !end) {
    return "";
  }

  const startLabel = start.toLocaleDateString(locale, {
    day: "numeric",
    month: "short"
  });
  const endLabel = end.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return `${startLabel} – ${endLabel}`;
}

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v8M6 10h8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M6.5 6.5v8m3.5-8v8m3.5-8v8M4.5 5.5h11M7 3.5h6m-7 2 1 10a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l1-10"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function WorkIntervalsEditor({
  intervals,
  enabled,
  copy,
  onChange,
  onAddAfter,
  onRemove
}: {
  intervals: WorkInterval[];
  enabled: boolean;
  copy: ScheduleCopy;
  onChange: (index: number, field: keyof WorkInterval, value: string) => void;
  onAddAfter: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className={styles.staffPlannerIntervals}>
      {intervals.map((interval, index) => (
        <div key={`${interval.startTime}-${interval.endTime}-${index}`} className={styles.staffPlannerIntervalRow}>
          <select
            className={styles.select}
            value={interval.startTime}
            disabled={!enabled}
            onChange={(event) => onChange(index, "startTime", event.target.value)}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={`interval-start-${index}-${time}`} value={time}>
                {time}
              </option>
            ))}
          </select>
          <span className={styles.staffPlannerTimeDivider}>{copy.workTo}</span>
          <select
            className={styles.select}
            value={interval.endTime}
            disabled={!enabled}
            onChange={(event) => onChange(index, "endTime", event.target.value)}
          >
            {TIME_OPTIONS.map((time) => (
              <option key={`interval-end-${index}-${time}`} value={time}>
                {time}
              </option>
            ))}
          </select>
          <div className={styles.staffPlannerIntervalActions}>
            <button
              type="button"
              className={styles.staffPlannerIconButton}
              onClick={() => onAddAfter(index)}
              disabled={!enabled}
              aria-label={copy.addWorkWindow}
              title={copy.addWorkWindow}
            >
              <PlusCircleIcon />
            </button>
            <button
              type="button"
              className={`${styles.staffPlannerIconButton} ${styles.staffPlannerIconButtonDanger}`}
              onClick={() => onRemove(index)}
              disabled={!enabled}
              aria-label={copy.removeWorkWindow}
              title={copy.removeWorkWindow}
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

type SaveScheduleInput = {
  memberId: string;
  workScheduleMode: StaffMemberSnapshot["membership"]["workScheduleMode"];
  workSchedule: WorkSchedule;
  customSchedule: CustomSchedule;
  successText: string;
};

type SaveScheduleBuildResult =
  | {
      payload: SaveScheduleInput;
    }
  | {
      error: string;
    };

function SchedulePlannerModal({
  member,
  localizedWorkDays,
  anchorDateKey,
  copy,
  locale,
  onClose,
  onSave
}: {
  member: StaffMemberSnapshot;
  localizedWorkDays: LocalizedWorkDay[];
  anchorDateKey?: string;
  copy: ScheduleCopy;
  locale: string;
  onClose: () => void;
  onSave: (payload: SaveScheduleInput) => Promise<boolean>;
}) {
  const initialSchedule = useMemo(
    () => normalizeWorkSchedule(member.membership.workSchedule),
    [member.membership.workSchedule]
  );
  const defaultStartDate = anchorDateKey || toDateKey(new Date());
  const [workSchedule, setWorkSchedule] = useState<EditableWorkSchedule>(() => createEditableWorkSchedule(initialSchedule));
  const [applyMode, setApplyMode] = useState<PlannerApplyMode>("template");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endMode, setEndMode] = useState<PlannerEndMode>("until-changed");
  const [endDate, setEndDate] = useState(() => toDateKey(addDays(fromDateKey(defaultStartDate), 27)));
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSignatureRef = useRef("");

  useEffect(() => {
    const nextSchedule = createEditableWorkSchedule(normalizeWorkSchedule(member.membership.workSchedule));
    const nextStartDate = anchorDateKey || toDateKey(new Date());
    const nextEndDate = toDateKey(addDays(fromDateKey(nextStartDate), 27));
    setWorkSchedule(nextSchedule);
    setApplyMode("template");
    setStartDate(nextStartDate);
    setEndMode("until-changed");
    setEndDate(nextEndDate);
    setStatusText("");
    lastSavedSignatureRef.current = JSON.stringify({
      workSchedule: nextSchedule,
      applyMode: "template" satisfies PlannerApplyMode,
      startDate: nextStartDate,
      endMode: "until-changed" satisfies PlannerEndMode,
      endDate: nextEndDate
    });
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, [anchorDateKey, member]);

  const totalMinutes = useMemo(
    () =>
      localizedWorkDays.reduce((sum, day) => {
        const item = workSchedule[day.key];
        return sum + (item.enabled ? getIntervalsDurationMinutes(item.intervals) : 0);
      }, 0),
    [localizedWorkDays, workSchedule]
  );

  const plannerSignature = useMemo(
    () =>
      JSON.stringify({
        workSchedule,
        applyMode,
        startDate,
        endMode,
        endDate
      }),
    [applyMode, endDate, endMode, startDate, workSchedule]
  );

  function updateDay(dayKey: WorkDayKey, patch: Partial<EditableDaySchedule>) {
    setWorkSchedule((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        ...patch
      }
    }));
    setStatusText("");
  }

  function updateDayInterval(dayKey: WorkDayKey, index: number, field: keyof WorkInterval, value: string) {
    setWorkSchedule((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        intervals: current[dayKey].intervals.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        )
      }
    }));
    setStatusText("");
  }

  function addDayInterval(dayKey: WorkDayKey, index: number) {
    const nextIntervals = insertWorkInterval(workSchedule[dayKey].intervals, index);
    if (!nextIntervals) {
      setStatusText(copy.noRoomForInterval);
      return;
    }

    setWorkSchedule((current) => ({
      ...current,
      [dayKey]: {
        enabled: true,
        intervals: nextIntervals
      }
    }));
    setStatusText("");
  }

  function removeDayInterval(dayKey: WorkDayKey, index: number) {
    const nextIntervals = workSchedule[dayKey].intervals.filter((_, itemIndex) => itemIndex !== index);

    setWorkSchedule((current) => ({
      ...current,
      [dayKey]: {
        enabled: nextIntervals.length > 0 ? current[dayKey].enabled : false,
        intervals: nextIntervals.length > 0 ? nextIntervals : current[dayKey].intervals
      }
    }));
    setStatusText("");
  }

  function buildPlannerPayload(): SaveScheduleBuildResult {
    for (const day of localizedWorkDays) {
      const value = workSchedule[day.key];
      if (!value.enabled) {
        continue;
      }

      const validation = validateIntervals(value.intervals);
      if (!validation.ok) {
        return { error: getIntervalError(validation.reason, copy) } as const;
      }
    }

    if (applyMode === "period") {
      if (!endDate) {
        return { error: copy.selectEndDate } as const;
      }

      if (endDate < startDate) {
        return { error: copy.invalidDateRange } as const;
      }
    }

    if (applyMode === "period") {
      const nextCustomSchedule = normalizeCustomSchedule(member.membership.customSchedule);

      for (
        let cursor = fromDateKey(startDate);
        toDateKey(cursor) <= endDate;
        cursor.setDate(cursor.getDate() + 1)
      ) {
        const dateKey = toDateKey(new Date(cursor));
        const weekdayKey = getWeekdayKey(dateKey);
        const template = workSchedule[weekdayKey];
        const fallbackRange = getFallbackRange(template.intervals, initialSchedule[weekdayKey]);
        nextCustomSchedule[dateKey] = serializeIntervals(template.enabled, template.intervals, fallbackRange);
      }

      return {
        payload: {
        memberId: member.professional.id,
        workScheduleMode: member.membership.workScheduleMode,
        workSchedule: member.membership.workSchedule,
        customSchedule: nextCustomSchedule,
        successText: copy.saved
        }
      } as const;
    } else {
      const nextCustomSchedule = normalizeCustomSchedule(member.membership.customSchedule);
      const todayKey = toDateKey(new Date());

      if (startDate > todayKey) {
        for (
          let cursor = new Date(`${todayKey}T00:00:00`);
          toDateKey(cursor) < startDate;
          cursor.setDate(cursor.getDate() + 1)
        ) {
          const dateKey = toDateKey(new Date(cursor));
          const weekdayKey = getWeekdayKey(dateKey);
          const template = workSchedule[weekdayKey];

          if (!template.enabled) {
            continue;
          }

          const fallbackRange = getFallbackRange(template.intervals, initialSchedule[weekdayKey]);
          nextCustomSchedule[dateKey] = serializeDay(false, fallbackRange.startTime, fallbackRange.endTime, []);
        }
      }

      const nextWorkSchedule = localizedWorkDays.reduce((accumulator, day) => {
        const template = workSchedule[day.key];
        const fallbackRange = getFallbackRange(template.intervals, initialSchedule[day.key]);
        accumulator[day.key] = serializeIntervals(template.enabled, template.intervals, fallbackRange);
        return accumulator;
      }, createEmptyWorkSchedule());

      return {
        payload: {
        memberId: member.professional.id,
        workScheduleMode: "fixed",
        workSchedule: nextWorkSchedule,
        customSchedule: nextCustomSchedule,
        successText: copy.saved
        }
      } as const;
    }
  }

  async function persistPlanner(closeAfter = false) {
    const built = buildPlannerPayload();
    if ("error" in built) {
      setStatusText(built.error);
      return false;
    }

    if (plannerSignature === lastSavedSignatureRef.current) {
      if (closeAfter) {
        onClose();
      }
      return true;
    }

    setIsSaving(true);
    setStatusText(copy.saving);
    const success = await onSave(built.payload);
    setIsSaving(false);

    if (success) {
      lastSavedSignatureRef.current = plannerSignature;
      setStatusText(copy.saved);
      if (closeAfter) {
        onClose();
      }
    } else {
      setStatusText(copy.failed);
    }

    return success;
  }

  useEffect(() => {
    if (isSaving) {
      return;
    }

    if (plannerSignature === lastSavedSignatureRef.current) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void persistPlanner(false);
    }, 700);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [isSaving, plannerSignature]);

  async function handleDismiss() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (!isSaving && plannerSignature !== lastSavedSignatureRef.current) {
      const built = buildPlannerPayload();
      if ("error" in built) {
        onClose();
        return;
      }

      await persistPlanner(true);
      return;
    }

    onClose();
  }

  return (
    <div className={styles.staffPlannerBackdrop} onClick={() => void handleDismiss()}>
      <div className={styles.staffPlannerShell} onClick={(event) => event.stopPropagation()}>
        <div className={styles.staffPlannerTopBar}>
          <button type="button" className={styles.staffStudioGhostButton} onClick={() => void handleDismiss()}>
            {copy.close}
          </button>
          <button type="button" className={styles.staffStudioPrimaryButton} onClick={() => void persistPlanner(true)} disabled={isSaving}>
            {isSaving ? copy.saving : copy.save}
          </button>
        </div>

        <div className={styles.staffPlannerBody}>
          <div className={styles.staffPlannerIntro}>
            <h1 className={styles.staffStudioTitle}>{copy.plannerTitle(makeMemberName(member))}</h1>
            <p className={styles.staffStudioText}>{copy.plannerText}</p>
          </div>

          <div className={styles.staffPlannerLayout}>
            <section className={styles.staffPlannerPanel}>
              <div className={styles.staffPlannerPanelHeader}>
                <div>
                  <h2>{copy.plannerSummary}</h2>
                  <span>{formatHourCount(totalMinutes, copy.hours)}</span>
                </div>
              </div>

              <div className={styles.staffPlannerDays}>
                {localizedWorkDays.map((day) => {
                  const daySchedule = workSchedule[day.key];
                  const dayHours = formatHourCount(
                    daySchedule.enabled ? getIntervalsDurationMinutes(daySchedule.intervals) : 0,
                    copy.hours
                  );

                  return (
                    <div key={day.key} className={styles.staffPlannerDayRow}>
                      <label className={styles.staffPlannerDayToggle}>
                        <input
                          type="checkbox"
                          checked={daySchedule.enabled}
                          onChange={(event) => updateDay(day.key, { enabled: event.target.checked })}
                        />
                        <div className={styles.staffPlannerDayMeta}>
                          <strong>{day.fullLabel}</strong>
                          <span>{daySchedule.enabled ? dayHours : copy.noWork}</span>
                        </div>
                      </label>

                      <WorkIntervalsEditor
                        intervals={daySchedule.intervals}
                        enabled={daySchedule.enabled}
                        copy={copy}
                        onChange={(index, field, value) => updateDayInterval(day.key, index, field, value)}
                        onAddAfter={(index) => addDayInterval(day.key, index)}
                        onRemove={(index) => removeDayInterval(day.key, index)}
                      />
                    </div>
                  );
                })}
              </div>

              {statusText ? <div className={styles.staffStudioStatus}>{statusText}</div> : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayScheduleModal({
  member,
  dateKey,
  locale,
  copy,
  focusBreak = false,
  onClose,
  onSave,
  onTemplateSaved
}: {
  member: StaffMemberSnapshot;
  dateKey: string;
  locale: string;
  copy: ScheduleCopy;
  focusBreak?: boolean;
  onClose: () => void;
  onSave: (payload: SaveScheduleInput) => Promise<boolean>;
  onTemplateSaved?: (memberId: string, intervals: WorkInterval[]) => void;
}) {
  const sourceSchedule = useMemo(
    () => resolveMemberDaySchedule(member, dateKey),
    [dateKey, member.membership.customSchedule, member.membership.workSchedule, member.membership.workScheduleMode]
  );
  const hasOverride = Boolean(member.membership.customSchedule[dateKey]);
  const [enabled, setEnabled] = useState(sourceSchedule.enabled);
  const [intervals, setIntervals] = useState<WorkInterval[]>(() => createEditableDaySchedule(sourceSchedule, focusBreak).intervals);
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSignatureRef = useRef("");

  useEffect(() => {
    const nextSchedule = resolveMemberDaySchedule(member, dateKey);
    const nextEditableSchedule = createEditableDaySchedule(nextSchedule, focusBreak);
    setEnabled(nextSchedule.enabled);
    setIntervals(nextEditableSchedule.intervals);
    setStatusText("");
    lastSavedSignatureRef.current = JSON.stringify({
      enabled: nextSchedule.enabled,
      intervals: nextEditableSchedule.intervals
    });
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, [dateKey, focusBreak, member]);

  const daySignature = useMemo(
    () =>
      JSON.stringify({
        enabled,
        intervals
      }),
    [enabled, intervals]
  );

  function updateInterval(index: number, field: keyof WorkInterval, value: string) {
    setIntervals((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
    setStatusText("");
  }

  function addInterval(index: number) {
    const nextIntervals = insertWorkInterval(intervals, index);
    if (!nextIntervals) {
      setStatusText(copy.noRoomForInterval);
      return;
    }

    setIntervals(nextIntervals);
    setEnabled(true);
    setStatusText("");
  }

  function removeInterval(index: number) {
    const nextIntervals = intervals.filter((_, itemIndex) => itemIndex !== index);
    if (nextIntervals.length === 0) {
      setEnabled(false);
      setStatusText("");
      return;
    }

    setIntervals(nextIntervals);
    setStatusText("");
  }

  function buildDayPayload(): SaveScheduleBuildResult {
    const validation = validateIntervals(intervals);
    if (enabled && !validation.ok) {
      return { error: getIntervalError(validation.reason, copy) } as const;
    }

    const nextCustomSchedule = normalizeCustomSchedule(member.membership.customSchedule);
    const fallbackRange = getFallbackRange(intervals, sourceSchedule);
    nextCustomSchedule[dateKey] = serializeIntervals(enabled, intervals, fallbackRange);

    return {
      payload: {
        memberId: member.professional.id,
        workScheduleMode: member.membership.workScheduleMode,
        workSchedule: member.membership.workSchedule,
        customSchedule: nextCustomSchedule,
        successText: copy.saved
      }
    } as const;
  }

  async function saveDay(closeAfter = false) {
    const built = buildDayPayload();
    if ("error" in built) {
      setStatusText(built.error);
      return false;
    }

    if (daySignature === lastSavedSignatureRef.current) {
      if (closeAfter) {
        onClose();
      }
      return true;
    }

    setIsSaving(true);
    setStatusText(copy.saving);
    const success = await onSave(built.payload);

    setIsSaving(false);

    if (success) {
      lastSavedSignatureRef.current = daySignature;
      if (enabled) {
        onTemplateSaved?.(member.professional.id, intervals);
      }
      setStatusText(copy.saved);
      if (closeAfter) {
        onClose();
      }
    } else {
      setStatusText(copy.failed);
    }

    return success;
  }

  async function resetToTemplate() {
    const nextCustomSchedule = normalizeCustomSchedule(member.membership.customSchedule);
    delete nextCustomSchedule[dateKey];
    setIsSaving(true);
    const success = await onSave({
      memberId: member.professional.id,
      workScheduleMode: member.membership.workScheduleMode,
      workSchedule: member.membership.workSchedule,
      customSchedule: nextCustomSchedule,
      successText: copy.saved
    });
    setIsSaving(false);

    if (success) {
      if (member.membership.workScheduleMode === "flexible") {
        onTemplateSaved?.(member.professional.id, []);
      }
      onClose();
    } else {
      setStatusText(copy.failed);
    }
  }

  const formattedDate = fromDateKey(dateKey).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  useEffect(() => {
    if (isSaving) {
      return;
    }

    if (daySignature === lastSavedSignatureRef.current) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      void saveDay(false);
    }, 700);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [daySignature, isSaving]);

  async function handleDismiss() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (!isSaving && daySignature !== lastSavedSignatureRef.current) {
      const built = buildDayPayload();
      if ("error" in built) {
        onClose();
        return;
      }

      await saveDay(true);
      return;
    }

    onClose();
  }

  return (
    <div className={styles.staffDayModalBackdrop} onClick={() => void handleDismiss()}>
      <div className={styles.staffDayModal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.staffDayModalHeader}>
          <div>
            <h2>{copy.dayEditorTitle(makeMemberName(member), formattedDate)}</h2>
            <p>{member.membership.workScheduleMode === "flexible" ? copy.flexibleDayEditorText : copy.dayEditorText}</p>
          </div>
          <button type="button" className={styles.staffStudioGhostButton} onClick={() => void handleDismiss()}>
            {copy.close}
          </button>
        </div>

        <label className={styles.staffDayToggle}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              setStatusText("");
            }}
          />
          <span>{copy.workingDay}</span>
        </label>

        <div className={styles.staffDayIntervals}>
          <div className={styles.staffDayIntervalsHeader}>
            <strong>{copy.dayIntervalsTitle}</strong>
            <span>{enabled ? formatHourCount(getIntervalsDurationMinutes(intervals), copy.hours) : copy.noWork}</span>
          </div>

          <WorkIntervalsEditor
            intervals={intervals}
            enabled={enabled}
            copy={copy}
            onChange={updateInterval}
            onAddAfter={addInterval}
            onRemove={removeInterval}
          />
        </div>

        {statusText ? <div className={styles.staffStudioStatus}>{statusText}</div> : null}

        <div className={styles.staffDayModalActions}>
          <button
            type="button"
            className={styles.staffSecondaryButton}
            onClick={() => void resetToTemplate()}
            disabled={isSaving || !hasOverride}
          >
            {member.membership.workScheduleMode === "flexible" ? copy.resetDay : copy.restoreTemplate}
          </button>

          <div className={styles.staffDayModalActionsRight}>
            <button type="button" className={styles.staffStudioGhostButton} onClick={() => void handleDismiss()}>
              {copy.close}
            </button>
            <button type="button" className={styles.staffStudioPrimaryButton} onClick={() => void saveDay(true)} disabled={isSaving}>
              {isSaving ? copy.saving : copy.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffScheduleView({ professionalId, snapshot, onboardingCta, header }: StaffScheduleViewProps) {
  const { language, t } = useProLanguage();
  const copy = {
    ...scheduleText.en,
    ...((scheduleText as unknown as Record<string, Partial<ScheduleCopy>>)[language] ?? {})
  } as ScheduleCopy;
  const locale = getLocale(language);
  const [members, setMembers] = useState(snapshot.members);
  const [selectedMemberId, setSelectedMemberId] = useState(() => snapshot.members[0]?.professional.id || "");
  const [weekDate, setWeekDate] = useState(() => startOfWeek(new Date()));
  const [calendarAnchor, setCalendarAnchor] = useState<HTMLElement | null>(null);
  const [pickerMonthDate, setPickerMonthDate] = useState(() => startOfMonth(new Date()));
  const [cellMenu, setCellMenu] = useState<CellMenuState | null>(null);
  const [plannerState, setPlannerState] = useState<PlannerState | null>(null);
  const [dayEditorState, setDayEditorState] = useState<DayEditorState | null>(null);
  const [statusText, setStatusText] = useState("");
  const flexibleTemplateRef = useRef<Record<string, WorkInterval[]>>({});

  function closeFloatingMenus() {
    setCalendarAnchor(null);
    setCellMenu(null);
  }

  useEffect(() => {
    setMembers(snapshot.members);
  }, [snapshot.members]);

  useEffect(() => {
    if (members.length === 0) {
      setSelectedMemberId("");
      return;
    }

    if (!members.some((member) => member.professional.id === selectedMemberId)) {
      setSelectedMemberId(members[0].professional.id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-staff-floating-root]")) {
        return;
      }

      closeFloatingMenus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeFloatingMenus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const localizedWorkDays = useMemo<LocalizedWorkDay[]>(
    () =>
      workDays.map((day, index) => ({
        key: day.key,
        shortLabel: t.schedule.weekDaysShort[index] || day.shortLabel,
        fullLabel: t.schedule.weekDaysFull[index] || day.fullLabel
      })),
    [t.schedule.weekDaysFull, t.schedule.weekDaysShort]
  );

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekDate, index);
        return {
          date,
          key: toDateKey(date),
          short: date.toLocaleDateString(locale, { weekday: "short" }),
          label: date.toLocaleDateString(locale, { day: "numeric", month: "short" })
        };
      }),
    [locale, weekDate]
  );

  const selectedWeekKeys = useMemo(() => new Set(weekDays.map((day) => day.key)), [weekDays]);
  const rangeLabel = useMemo(() => formatRangeLabel(weekDays, locale), [locale, weekDays]);
  const monthDays = useMemo(() => buildMonthDays(pickerMonthDate), [pickerMonthDate]);

  const selectedMember = useMemo(
    () =>
      members.find((member) => member.professional.id === selectedMemberId) ||
      members.find((member) => member.professional.id === professionalId) ||
      members[0] ||
      null,
    [members, professionalId, selectedMemberId]
  );
  const visibleMembers = selectedMember ? [selectedMember] : [];
  const selectedScheduleMode: WorkScheduleMode = selectedMember?.membership.workScheduleMode || "fixed";

  const teamHoursByDay = useMemo(() => {
    return new Map(
      weekDays.map((day) => [
        day.key,
        visibleMembers.reduce((sum, member) => {
          const daySchedule = resolveMemberDaySchedule(member, day.key);
          return sum + getDayDurationMinutes(daySchedule);
        }, 0)
      ])
    );
  }, [visibleMembers, weekDays]);

  const plannerMember =
    plannerState ? members.find((item) => item.professional.id === plannerState.memberId) || null : null;
  const dayEditorMember =
    dayEditorState ? members.find((item) => item.professional.id === dayEditorState.memberId) || null : null;

  async function persistMemberSchedule(input: SaveScheduleInput) {
    const response = await fetch("/api/pro/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        targetProfessionalId: input.memberId,
        workScheduleMode: input.workScheduleMode,
        workSchedule: input.workSchedule,
        customSchedule: input.customSchedule
      })
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatusText(String(payload.error || copy.failed));
      return false;
    }

    setMembers((current) =>
      current.map((member) =>
        member.professional.id === input.memberId
          ? {
              ...member,
              membership: {
                ...member.membership,
                workScheduleMode: input.workScheduleMode,
                workSchedule: normalizeWorkSchedule(input.workSchedule),
                customSchedule: normalizeCustomSchedule(input.customSchedule)
              }
            }
          : member
      )
    );
    setStatusText(input.successText);
    return true;
  }

  async function handleDeleteShift(member: StaffMemberSnapshot, dateKey: string) {
    const source = resolveMemberDaySchedule(member, dateKey);
    const nextCustomSchedule = normalizeCustomSchedule(member.membership.customSchedule);
    nextCustomSchedule[dateKey] = serializeDay(false, source.startTime, source.endTime, getDayBreaks(source));
    setCellMenu(null);
    await persistMemberSchedule({
      memberId: member.professional.id,
      workScheduleMode: member.membership.workScheduleMode,
      workSchedule: member.membership.workSchedule,
      customSchedule: nextCustomSchedule,
      successText: copy.dayRemoved
    });
  }

  function getFlexibleTemplateIntervals(member: StaffMemberSnapshot) {
    const remembered = flexibleTemplateRef.current[member.professional.id];
    if (remembered?.length) {
      return remembered;
    }

    const template = getLastTemplateFromCustomSchedule(member.membership.customSchedule);
    return template.intervals?.length
      ? template.intervals.map((interval) => ({ startTime: interval.startTime, endTime: interval.endTime }))
      : (defaultWorkTemplate.intervals || []).map((interval) => ({ startTime: interval.startTime, endTime: interval.endTime }));
  }

  function rememberFlexibleTemplate(memberId: string, intervals: WorkInterval[]) {
    if (intervals.length === 0) {
      delete flexibleTemplateRef.current[memberId];
      return;
    }

    flexibleTemplateRef.current[memberId] = intervals.map((interval) => ({ ...interval }));
  }

  async function handleScheduleModeChange(member: StaffMemberSnapshot, nextMode: WorkScheduleMode) {
    if (member.membership.workScheduleMode === nextMode) {
      return;
    }

    await persistMemberSchedule({
      memberId: member.professional.id,
      workScheduleMode: nextMode,
      workSchedule: member.membership.workSchedule,
      customSchedule: member.membership.customSchedule,
      successText: copy.saved
    });
  }

  async function handleFlexibleDateClick(member: StaffMemberSnapshot, dateKey: string) {
    closeFloatingMenus();

    if (member.membership.workScheduleMode !== "flexible") {
      const modeChanged = await persistMemberSchedule({
        memberId: member.professional.id,
        workScheduleMode: "flexible",
        workSchedule: member.membership.workSchedule,
        customSchedule: member.membership.customSchedule,
        successText: copy.saved
      });

      if (!modeChanged) {
        return;
      }
    }

    if (member.membership.customSchedule[dateKey]) {
      setDayEditorState({ memberId: member.professional.id, dateKey });
      return;
    }

    const intervals = getFlexibleTemplateIntervals(member);
    const fallbackRange = getFallbackRange(intervals, defaultWorkTemplate);
    const nextCustomSchedule = normalizeCustomSchedule(member.membership.customSchedule);
    nextCustomSchedule[dateKey] = serializeIntervals(true, intervals, fallbackRange);
    rememberFlexibleTemplate(member.professional.id, intervals);

    const saved = await persistMemberSchedule({
      memberId: member.professional.id,
      workScheduleMode: "flexible",
      workSchedule: member.membership.workSchedule,
      customSchedule: nextCustomSchedule,
      successText: copy.saved
    });

    if (saved) {
      setDayEditorState({ memberId: member.professional.id, dateKey });
    }
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar active="staff" professionalId={professionalId} canManageStaff />

      <section className={styles.staffStudioShell}>
        <ProWorkspaceHeader
          businessName={snapshot.business.name}
          viewerName={header.viewerName}
          viewerAvatarUrl={header.viewerAvatarUrl}
          viewerInitials={header.viewerInitials}
          isPremium={header.isPremium === true}
          publicBookingUrl={header.publicBookingUrl}
          publicBookingEnabled={header.publicBookingEnabled === true}
          canTogglePublicBooking
          onboardingCta={onboardingCta}
        />

        <aside className={styles.staffStudioSidebar}>
          <div className={styles.staffStudioSidebarCard}>
            <strong>{copy.sectionTitle}</strong>
            <nav className={styles.staffStudioLocalNav}>
              <Link href="/pro/staff/members" className={styles.staffStudioLocalLink}>
                {copy.people}
              </Link>
              <Link href="/pro/staff/schedule" className={`${styles.staffStudioLocalLink} ${styles.staffStudioLocalLinkActive}`}>
                {copy.schedule}
              </Link>
            </nav>
          </div>
        </aside>

        <section className={styles.staffStudioMain}>
          <div className={styles.staffStudioHeader}>
            <div>
              <h1 className={styles.staffStudioTitle}>{copy.title}</h1>
              <p className={styles.staffStudioText}>{copy.text}</p>
            </div>
          </div>

          {statusText ? <div className={styles.staffStudioStatus}>{statusText}</div> : null}

          <div className={styles.staffStudioToolbar}>
            <div className={styles.staffScheduleTopBar}>
              <div className={styles.staffScheduleMasterPicker}>
                <label>
                  <span>{copy.master}</span>
                  {members.length > 1 ? (
                    <select
                      className={styles.select}
                      value={selectedMember?.professional.id || ""}
                      onChange={(event) => {
                        closeFloatingMenus();
                        setSelectedMemberId(event.target.value);
                      }}
                    >
                      {members.map((member) => (
                        <option key={member.professional.id} value={member.professional.id}>
                          {makeMemberName(member)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <strong>{selectedMember ? makeMemberName(selectedMember) : copy.notSelected}</strong>
                  )}
                </label>
              </div>

              <div className={styles.staffScheduleToolbarRight}>
                {selectedMember ? (
                  <div className={styles.staffScheduleModeSwitch} aria-label={copy.scheduleMode}>
                    <button
                      type="button"
                      className={selectedScheduleMode === "fixed" ? styles.staffScheduleModeButtonActive : styles.staffScheduleModeButton}
                      onClick={() => void handleScheduleModeChange(selectedMember, "fixed")}
                    >
                      {copy.weeklyMode}
                    </button>
                    <button
                      type="button"
                      className={selectedScheduleMode === "flexible" ? styles.staffScheduleModeButtonActive : styles.staffScheduleModeButton}
                      onClick={() => void handleScheduleModeChange(selectedMember, "flexible")}
                    >
                      {copy.flexibleMode}
                    </button>
                  </div>
                ) : null}

                {selectedScheduleMode === "fixed" ? (
                  <button
                    type="button"
                    className={styles.staffStudioGhostButton}
                    onClick={() => {
                      closeFloatingMenus();
                      setWeekDate(startOfWeek(new Date()));
                    }}
                  >
                    {copy.today}
                  </button>
                ) : null}

                <div className={styles.staffScheduleRangeBox} data-staff-floating-root>
                  <button
                    type="button"
                    className={styles.staffScheduleRangeButton}
                    onClick={() => {
                      closeFloatingMenus();
                      if (selectedScheduleMode === "fixed") {
                        setWeekDate(addDays(weekDate, -7));
                      } else {
                        setPickerMonthDate(addMonths(pickerMonthDate, -1));
                      }
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={styles.staffScheduleRangeLabelButton}
                    onClick={(event) => {
                      const nextAnchor = calendarAnchor ? null : event.currentTarget;
                      if (selectedScheduleMode === "fixed") {
                        setPickerMonthDate(startOfMonth(weekDate));
                      }
                      closeFloatingMenus();
                      setCalendarAnchor(nextAnchor);
                    }}
                  >
                    {selectedScheduleMode === "fixed"
                      ? rangeLabel
                      : pickerMonthDate.toLocaleDateString(locale, { month: "long", year: "numeric" })}
                  </button>
                  <button
                    type="button"
                    className={styles.staffScheduleRangeButton}
                    onClick={() => {
                      closeFloatingMenus();
                      if (selectedScheduleMode === "fixed") {
                        setWeekDate(addDays(weekDate, 7));
                      } else {
                        setPickerMonthDate(addMonths(pickerMonthDate, 1));
                      }
                    }}
                  >
                    ›
                  </button>

                  <FloatingPopover
                    open={Boolean(calendarAnchor)}
                    anchorEl={calendarAnchor}
                    className={styles.staffScheduleCalendarPopover}
                    placement="bottom-end"
                  >
                      <div className={styles.staffScheduleCalendarHeader}>
                        <button type="button" className={styles.staffScheduleCalendarNav} onClick={() => setPickerMonthDate(addMonths(pickerMonthDate, -1))}>
                          ‹
                        </button>
                        <strong>
                          {pickerMonthDate.toLocaleDateString(locale, {
                            month: "long",
                            year: "numeric"
                          })}
                        </strong>
                        <button type="button" className={styles.staffScheduleCalendarNav} onClick={() => setPickerMonthDate(addMonths(pickerMonthDate, 1))}>
                          ›
                        </button>
                      </div>

                      <div className={styles.staffScheduleCalendarWeekdays}>
                        {localizedWorkDays.map((day) => (
                          <span key={day.key}>{day.shortLabel}</span>
                        ))}
                      </div>

                      <div className={styles.staffScheduleCalendarGrid}>
                        {monthDays.map((item) => {
                          if (!item.date) {
                            return <span key={item.key} className={styles.staffScheduleCalendarEmpty} />;
                          }

                          const dateKey = toDateKey(item.date);
                          const isSelectedWeek = selectedScheduleMode === "fixed" && selectedWeekKeys.has(dateKey);
                          const isCurrentAnchor = selectedScheduleMode === "fixed" && dateKey === weekDays[0]?.key;

                          return (
                            <button
                              key={item.key}
                              type="button"
                              className={`${styles.staffScheduleCalendarDay} ${
                                isSelectedWeek ? styles.staffScheduleCalendarDayRange : ""
                              } ${isCurrentAnchor ? styles.staffScheduleCalendarDayActive : ""}`}
                              onClick={() => {
                                if (selectedScheduleMode === "fixed") {
                                  setWeekDate(startOfWeek(item.date as Date));
                                } else {
                                  setPickerMonthDate(startOfMonth(item.date as Date));
                                }
                                setCalendarAnchor(null);
                              }}
                            >
                              {item.date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                  </FloatingPopover>
                </div>
              </div>
            </div>
          </div>

          {visibleMembers.length === 0 ? (
            <div className={styles.staffStudioEmpty}>{copy.empty}</div>
          ) : selectedScheduleMode === "fixed" ? (
            <section className={styles.staffScheduleBoard}>
              <div className={styles.staffScheduleBoardScroller}>
                <div className={styles.staffScheduleHead}>
                  <div className={styles.staffScheduleMemberHead}>
                    <span>{copy.employee}</span>
                    <button
                      type="button"
                      className={styles.staffScheduleInlineButton}
                      onClick={() => {
                        if (selectedMember) {
                          setPlannerState({ memberId: selectedMember.professional.id, anchorDateKey: weekDays[0]?.key });
                        }
                      }}
                    >
                      {copy.repeatingShifts}
                    </button>
                  </div>

                  {weekDays.map((day) => (
                    <div key={day.key} className={styles.staffScheduleDayHead}>
                      <strong>{day.short}</strong>
                      <span>{day.label}</span>
                      <small>{formatHourCount(teamHoursByDay.get(day.key) || 0, copy.hours)}</small>
                    </div>
                  ))}
                </div>

                <div className={styles.staffScheduleRows}>
                  {visibleMembers.map((member) => {
                    const memberHours = weekDays.reduce((sum, day) => {
                      return sum + getDayDurationMinutes(resolveMemberDaySchedule(member, day.key));
                    }, 0);

                    return (
                      <article key={member.professional.id} className={styles.staffScheduleRow}>
                        <div className={styles.staffScheduleMemberCell}>
                          <div className={styles.staffScheduleMemberIdentity}>
                            <ProfileAvatar
                              avatarUrl={member.professional.avatarUrl}
                              initials={`${member.professional.firstName?.[0] ?? ""}${member.professional.lastName?.[0] ?? ""}`.trim() || "M"}
                              label={makeMemberName(member)}
                              className={styles.staffScheduleAvatar}
                              imageClassName={styles.avatarImage}
                              fallbackClassName={styles.avatarFallback}
                            />
                            <div className={styles.staffScheduleMemberMeta}>
                              <strong>{makeMemberName(member)}</strong>
                              <span>{formatHourCount(memberHours, copy.hours)}</span>
                            </div>
                          </div>
                        </div>

                        {weekDays.map((day) => {
                          const daySchedule = resolveMemberDaySchedule(member, day.key);
                          const dayIntervals = daySchedule.enabled ? getDayIntervals(daySchedule) : [];
                          const intervalLabel = dayIntervals.map((interval) => formatIntervalLabel(interval)).join(" · ");
                          const isCellMenuOpen =
                            cellMenu?.memberId === member.professional.id && cellMenu.dateKey === day.key;

                          return (
                            <div
                              key={`${member.professional.id}-${day.key}`}
                              className={styles.staffScheduleShiftWrap}
                              data-staff-floating-root
                            >
                              <div className={styles.staffScheduleMobileDayLabel}>
                                <strong>{day.short}</strong>
                                <span>{day.label}</span>
                                <small>{formatHourCount(getDayDurationMinutes(daySchedule), copy.hours)}</small>
                              </div>
                              <button
                                type="button"
                                className={`${styles.staffScheduleShiftButton} ${
                                  daySchedule.enabled ? styles.staffScheduleShiftCellActive : styles.staffScheduleShiftCellOff
                                }`}
                                aria-label={daySchedule.enabled ? intervalLabel : copy.noWork}
                                onClick={(event) => {
                                  const anchorEl = event.currentTarget;
                                  const nextState =
                                    isCellMenuOpen ? null : { memberId: member.professional.id, dateKey: day.key, anchorEl };
                                  closeFloatingMenus();
                                  setCellMenu(nextState);
                                }}
                              >
                                {daySchedule.enabled ? (
                                  <span className={styles.staffScheduleShiftLabels}>
                                    {dayIntervals.map((interval, index) => (
                                      <span key={`${member.professional.id}-${day.key}-${index}`}>
                                        {formatIntervalLabel(interval)}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  copy.noWork
                                )}
                              </button>

                              <FloatingPopover
                                open={isCellMenuOpen}
                                anchorEl={isCellMenuOpen ? cellMenu?.anchorEl ?? null : null}
                                className={`${styles.staffControlMenu} ${styles.staffScheduleCellMenu}`}
                                placement="bottom-start"
                              >
                                  <button
                                    type="button"
                                    className={styles.staffControlMenuItem}
                                    onClick={() => {
                                      setDayEditorState({ memberId: member.professional.id, dateKey: day.key });
                                      setCellMenu(null);
                                    }}
                                  >
                                    {copy.editDay}
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.staffControlMenuItem}
                                    onClick={() => {
                                      setPlannerState({ memberId: member.professional.id, anchorDateKey: day.key });
                                      setCellMenu(null);
                                    }}
                                  >
                                    {copy.repeatingShifts}
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.staffControlMenuItem}
                                    onClick={() => {
                                      setDayEditorState({
                                        memberId: member.professional.id,
                                        dateKey: day.key,
                                        focusBreak: true
                                      });
                                      setCellMenu(null);
                                    }}
                                  >
                                    {copy.addFreeTime}
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.staffControlMenuItem} ${styles.staffControlMenuDanger}`}
                                    onClick={() => void handleDeleteShift(member, day.key)}
                                  >
                                    {copy.deleteShift}
                                  </button>
                              </FloatingPopover>
                            </div>
                          );
                        })}
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : selectedMember ? (
            <section className={styles.staffFlexibleCalendarPanel}>
              <div className={styles.staffScheduleCalendarWeekdays}>
                {localizedWorkDays.map((day) => (
                  <span key={day.key}>{day.shortLabel}</span>
                ))}
              </div>

              <div className={styles.staffFlexibleCalendarGrid}>
                {monthDays.map((item) => {
                  if (!item.date) {
                    return <span key={item.key} className={styles.staffScheduleCalendarEmpty} />;
                  }

                  const dateKey = toDateKey(item.date);
                  const daySchedule = resolveMemberDaySchedule(selectedMember, dateKey);
                  const dayIntervals = daySchedule.enabled ? getDayIntervals(daySchedule) : [];

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`${styles.staffFlexibleCalendarDay} ${
                        daySchedule.enabled ? styles.staffFlexibleCalendarDayActive : ""
                      }`}
                      onClick={() => void handleFlexibleDateClick(selectedMember, dateKey)}
                    >
                      <strong>{item.date.getDate()}</strong>
                      {daySchedule.enabled ? (
                        <span>
                          {dayIntervals.map((interval) => formatIntervalLabel(interval)).join(" · ")}
                        </span>
                      ) : (
                        <span>{copy.noWork}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </section>
      </section>

      {plannerState && plannerMember ? (
        <SchedulePlannerModal
          member={plannerMember}
          localizedWorkDays={localizedWorkDays}
          anchorDateKey={plannerState.anchorDateKey}
          copy={copy}
          locale={locale}
          onClose={() => setPlannerState(null)}
          onSave={persistMemberSchedule}
        />
      ) : null}

      {dayEditorState && dayEditorMember ? (
        <DayScheduleModal
          member={dayEditorMember}
          dateKey={dayEditorState.dateKey}
          focusBreak={dayEditorState.focusBreak}
          locale={locale}
          copy={copy}
          onClose={() => setDayEditorState(null)}
          onSave={persistMemberSchedule}
          onTemplateSaved={rememberFlexibleTemplate}
        />
      ) : null}
    </main>
  );
}
