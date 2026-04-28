"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProfileAvatar from "../../ProfileAvatar";
import ProSidebar from "../ProSidebar";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
import type { BusinessStaffSnapshot, StaffMemberSnapshot } from "../../../lib/pro-staff";
import {
  createEmptyCustomSchedule,
  createEmptyWorkSchedule,
  getDayBreaks,
  getDaySchedule,
  minutesToTime,
  normalizeCustomSchedule,
  normalizeWorkSchedule,
  timeToMinutes,
  workDays,
  type CustomSchedule,
  type WorkBreak,
  type WorkDayKey,
  type WorkDaySchedule,
  type WorkSchedule
} from "../../../lib/work-schedule";

type StaffScheduleViewProps = {
  professionalId: string;
  snapshot: BusinessStaffSnapshot;
};

type SortMode = "name" | "hours-desc" | "hours-asc";

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
  restoreTemplate: string;
  dayEditorTitle: (name: string, date: string) => string;
  dayEditorText: string;
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
};

type PlannerState = {
  memberId: string;
  anchorDateKey?: string;
};

type PlannerApplyMode = "template" | "period";
type PlannerEndMode = "until-changed" | "until-date";

type DayEditorState = {
  memberId: string;
  dateKey: string;
  focusBreak?: boolean;
};

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const minutes = index * 15;
  return minutesToTime(minutes);
});

const scheduleText: Record<"ru" | "uk" | "en", ScheduleCopy> = {
  ru: {
    sectionTitle: "Команда",
    people: "Участники команды",
    schedule: "График смен",
    title: "График смен",
    text:
      "Настройте персональные смены мастеров так, чтобы неделя команды выглядела как единая живая сетка. Здесь управляется именно рабочее время сотрудников для записи.",
    sort: "Сортировка",
    sortByName: "По имени",
    sortByHoursDesc: "По нагрузке сверху",
    sortByHoursAsc: "По нагрузке снизу",
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
    addFreeTime: "Добавить свободное время",
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
    plannerText:
      "Сохраните недельный шаблон сотрудника. Он станет основной сеткой для будущих недель, а отдельные исключения можно будет менять прямо в таблице.",
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
    breakFrom: "Перерыв с",
    breakTo: "До",
    addBreak: "Добавить свободное время",
    removeBreak: "Удалить перерыв",
    restoreTemplate: "Сбросить к шаблону недели",
    dayEditorTitle: (name, date) => `Изменить ${date} для ${name}`,
    dayEditorText:
      "Изменение затронет только выбранный день. Для постоянного шаблона используйте настройку повторяющихся смен.",
    resetDay: "Удалить настройку дня",
    weekOf: "Неделя",
    notSelected: "Не выбрано"
  },
  uk: {
    sectionTitle: "Команда",
    people: "Учасники команди",
    schedule: "Графік змін",
    title: "Графік змін",
    text:
      "Налаштуйте персональні зміни майстрів так, щоб тиждень команди виглядав як єдина жива сітка. Тут керується саме робочий час співробітників для запису.",
    sort: "Сортування",
    sortByName: "За іменем",
    sortByHoursDesc: "За навантаженням зверху",
    sortByHoursAsc: "За навантаженням знизу",
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
    addFreeTime: "Додати вільний час",
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
    plannerText:
      "Збережіть тижневий шаблон співробітника. Він стане основною сіткою для майбутніх тижнів, а окремі винятки можна буде змінювати прямо в таблиці.",
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
    breakFrom: "Перерва з",
    breakTo: "До",
    addBreak: "Додати вільний час",
    removeBreak: "Видалити перерву",
    restoreTemplate: "Скинути до шаблону тижня",
    dayEditorTitle: (name, date) => `Змінити ${date} для ${name}`,
    dayEditorText:
      "Зміна зачепить лише вибраний день. Для постійного шаблону використовуйте налаштування повторюваних змін.",
    resetDay: "Видалити налаштування дня",
    weekOf: "Тиждень",
    notSelected: "Не вибрано"
  },
  en: {
    sectionTitle: "Team",
    people: "Team members",
    schedule: "Shift schedule",
    title: "Shift schedule",
    text:
      "Set up personal specialist shifts so the whole team week feels like one live planning board. This screen controls staff availability used for bookings.",
    sort: "Sort",
    sortByName: "By name",
    sortByHoursDesc: "Most hours first",
    sortByHoursAsc: "Least hours first",
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
    addFreeTime: "Add time off",
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
    plannerText:
      "Save a weekly employee template. It becomes the base grid for future weeks, while date-specific exceptions stay editable from the table.",
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
    breakFrom: "Break from",
    breakTo: "To",
    addBreak: "Add time off",
    removeBreak: "Remove break",
    restoreTemplate: "Reset to weekly template",
    dayEditorTitle: (name, date) => `Edit ${date} for ${name}`,
    dayEditorText:
      "This change only affects the selected date. Use recurring shifts if you want to update the permanent weekly template.",
    resetDay: "Delete day override",
    weekOf: "Week",
    notSelected: "Not selected"
  }
};

function getLocale(language: "ru" | "uk" | "en") {
  if (language === "uk") return "uk-UA";
  if (language === "en") return "en-US";
  return "ru-RU";
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

function formatHourCount(minutes: number, unit: string) {
  const hours = Math.round((minutes / 60) * 10) / 10;
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".", ",");
  return `${value} ${unit}`;
}

function createSuggestedBreak(day: Pick<WorkDaySchedule, "startTime" | "endTime" | "breaks" | "breakStart" | "breakEnd">) {
  const existing = getDayBreaks(day as WorkDaySchedule);
  const workStart = timeToMinutes(day.startTime);
  const workEnd = timeToMinutes(day.endTime);
  const anchor =
    existing.length > 0
      ? Math.min(workEnd - 30, timeToMinutes(existing[existing.length - 1].endTime) + 30)
      : Math.min(workEnd - 60, Math.max(workStart + 180, workStart + 60));
  const start = Math.max(workStart, Math.min(anchor, workEnd - 30));
  const end = Math.min(workEnd, start + 60);

  return {
    startTime: minutesToTime(start),
    endTime: minutesToTime(Math.max(start + 15, end))
  } satisfies WorkBreak;
}

function serializeDay(enabled: boolean, startTime: string, endTime: string, breaks: WorkBreak[]) {
  return {
    enabled,
    startTime,
    endTime,
    breakStart: breaks[0]?.startTime ?? startTime,
    breakEnd: breaks[0]?.endTime ?? startTime,
    breaks,
    dayType: enabled ? ("workday" as const) : ("day-off" as const)
  };
}

function makeMemberName(member: StaffMemberSnapshot) {
  return `${member.professional.firstName} ${member.professional.lastName}`.trim() || member.professional.email;
}

function compareMembers(left: StaffMemberSnapshot, right: StaffMemberSnapshot, sortMode: SortMode, weekDays: Array<{ key: string }>) {
  if (sortMode === "name") {
    return makeMemberName(left).localeCompare(makeMemberName(right), "ru");
  }

  const leftHours = weekDays.reduce(
    (sum, day) =>
      sum +
      getDayDurationMinutes(getDaySchedule(day.key, left.membership.workSchedule, left.membership.customSchedule)),
    0
  );
  const rightHours = weekDays.reduce(
    (sum, day) =>
      sum +
      getDayDurationMinutes(getDaySchedule(day.key, right.membership.workSchedule, right.membership.customSchedule)),
    0
  );

  if (sortMode === "hours-asc") {
    return leftHours - rightHours || makeMemberName(left).localeCompare(makeMemberName(right), "ru");
  }

  return rightHours - leftHours || makeMemberName(left).localeCompare(makeMemberName(right), "ru");
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

type SaveScheduleInput = {
  memberId: string;
  workScheduleMode: StaffMemberSnapshot["membership"]["workScheduleMode"];
  workSchedule: WorkSchedule;
  customSchedule: CustomSchedule;
  successText: string;
};

function SchedulePlannerModal({
  member,
  businessName,
  businessCategories,
  localizedWorkDays,
  anchorDateKey,
  copy,
  locale,
  onClose,
  onSave
}: {
  member: StaffMemberSnapshot;
  businessName: string;
  businessCategories: string[];
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
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(initialSchedule);
  const [applyMode, setApplyMode] = useState<PlannerApplyMode>("template");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endMode, setEndMode] = useState<PlannerEndMode>("until-changed");
  const [endDate, setEndDate] = useState(() => toDateKey(addDays(fromDateKey(defaultStartDate), 27)));
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    setWorkSchedule(normalizeWorkSchedule(member.membership.workSchedule));
    const nextStartDate = anchorDateKey || toDateKey(new Date());
    setApplyMode("template");
    setStartDate(nextStartDate);
    setEndMode("until-changed");
    setEndDate(toDateKey(addDays(fromDateKey(nextStartDate), 27)));
    setStatusText("");
  }, [anchorDateKey, member]);

  const totalMinutes = useMemo(
    () =>
      localizedWorkDays.reduce((sum, day) => {
        return sum + getDayDurationMinutes(workSchedule[day.key]);
      }, 0),
    [localizedWorkDays, workSchedule]
  );

  function updateDay(dayKey: WorkDayKey, patch: Partial<WorkDaySchedule>) {
    setWorkSchedule((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        ...patch,
        dayType: patch.enabled === false ? "day-off" : "workday"
      }
    }));
  }

  async function handleSave() {
    for (const day of localizedWorkDays) {
      const value = workSchedule[day.key];
      if (!value.enabled) {
        continue;
      }

      if (timeToMinutes(value.startTime) >= timeToMinutes(value.endTime)) {
        setStatusText(copy.failed);
        return;
      }
    }

    if (applyMode === "period") {
      if (!endDate) {
        setStatusText(copy.selectEndDate);
        return;
      }

      if (endDate < startDate) {
        setStatusText(copy.invalidDateRange);
        return;
      }
    }

    setIsSaving(true);
    let success = false;

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
        nextCustomSchedule[dateKey] = serializeDay(
          template.enabled,
          template.startTime,
          template.endTime,
          getDayBreaks(template)
        );
      }

      success = await onSave({
        memberId: member.professional.id,
        workScheduleMode: member.membership.workScheduleMode,
        workSchedule: member.membership.workSchedule,
        customSchedule: nextCustomSchedule,
        successText: copy.saved
      });
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

          nextCustomSchedule[dateKey] = serializeDay(false, template.startTime, template.endTime, getDayBreaks(template));
        }
      }

      success = await onSave({
        memberId: member.professional.id,
        workScheduleMode: "fixed",
        workSchedule,
        customSchedule: nextCustomSchedule,
        successText: copy.saved
      });
    }

    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setStatusText(copy.failed);
    }
  }

  return (
    <div className={styles.staffPlannerBackdrop} onClick={onClose}>
      <div className={styles.staffPlannerShell} onClick={(event) => event.stopPropagation()}>
        <div className={styles.staffPlannerTopBar}>
          <button type="button" className={styles.staffStudioGhostButton} onClick={onClose}>
            {copy.close}
          </button>
          <button type="button" className={styles.staffStudioPrimaryButton} onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? copy.saving : copy.save}
          </button>
        </div>

        <div className={styles.staffPlannerBody}>
          <div className={styles.staffPlannerIntro}>
            <h1 className={styles.staffStudioTitle}>{copy.plannerTitle(makeMemberName(member))}</h1>
            <p className={styles.staffStudioText}>{copy.plannerText}</p>
          </div>

          <div className={styles.staffPlannerLayout}>
            <aside className={styles.staffPlannerSidebar}>
              <div className={styles.staffPlannerInfoCard}>
                <strong>{businessName}</strong>
                <span>{businessCategories.join(" · ") || copy.notSelected}</span>
                <p>{copy.businessHint}</p>
              </div>

              <div className={styles.staffPlannerInfoCard}>
                <label className={styles.staffDrawerField}>
                  <span>{copy.repeatType}</span>
                  <select
                    className={styles.select}
                    value={applyMode}
                    onChange={(event) => {
                      const nextMode = event.target.value as PlannerApplyMode;
                      setApplyMode(nextMode);
                      setEndMode(nextMode === "period" ? "until-date" : "until-changed");
                      if (nextMode === "period" && endDate < startDate) {
                        setEndDate(startDate);
                      }
                      setStatusText("");
                    }}
                  >
                    <option value="template">{copy.repeatWeekly}</option>
                    <option value="period">{copy.repeatForPeriod}</option>
                  </select>
                </label>

                <label className={styles.staffDrawerField}>
                  <span>{copy.startDate}</span>
                  <input
                    type="date"
                    className={styles.input}
                    value={formatInputDate(startDate)}
                    onChange={(event) => {
                      const nextStartDate = event.target.value;
                      setStartDate(nextStartDate);
                      if (endMode === "until-date" && endDate < nextStartDate) {
                        setEndDate(nextStartDate);
                      }
                      setStatusText("");
                    }}
                  />
                </label>

                <label className={styles.staffDrawerField}>
                  <span>{copy.endBehavior}</span>
                  <select
                    className={styles.select}
                    value={endMode}
                    onChange={(event) => {
                      const nextMode = event.target.value as PlannerEndMode;
                      setEndMode(nextMode);
                      if (nextMode === "until-date" && endDate < startDate) {
                        setEndDate(startDate);
                      }
                      setStatusText("");
                    }}
                  >
                    <option value="until-changed" disabled={applyMode === "period"}>
                      {copy.untilChanged}
                    </option>
                    <option value="until-date" disabled={applyMode === "template"}>
                      {copy.untilDate}
                    </option>
                  </select>
                </label>

                {endMode === "until-date" ? (
                  <label className={styles.staffDrawerField}>
                    <span>{copy.endDate}</span>
                    <input
                      type="date"
                      className={styles.input}
                      value={formatInputDate(endDate)}
                      min={formatInputDate(startDate)}
                      onChange={(event) => {
                        setEndDate(event.target.value);
                        setStatusText("");
                      }}
                    />
                  </label>
                ) : null}
              </div>

              <div className={styles.staffPlannerHintCard}>{copy.plannerHint}</div>
            </aside>

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
                  const dayHours = formatHourCount(getDayDurationMinutes(daySchedule), copy.hours);

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

                      <div className={styles.staffPlannerTimeRow}>
                        <select
                          className={styles.select}
                          value={daySchedule.startTime}
                          disabled={!daySchedule.enabled}
                          onChange={(event) => updateDay(day.key, { startTime: event.target.value })}
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option key={`start-${day.key}-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                        <span className={styles.staffPlannerTimeDivider}>{copy.workTo}</span>
                        <select
                          className={styles.select}
                          value={daySchedule.endTime}
                          disabled={!daySchedule.enabled}
                          onChange={(event) => updateDay(day.key, { endTime: event.target.value })}
                        >
                          {TIME_OPTIONS.map((time) => (
                            <option key={`end-${day.key}-${time}`} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
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
  onSave
}: {
  member: StaffMemberSnapshot;
  dateKey: string;
  locale: string;
  copy: ScheduleCopy;
  focusBreak?: boolean;
  onClose: () => void;
  onSave: (payload: SaveScheduleInput) => Promise<boolean>;
}) {
  const sourceSchedule = useMemo(
    () => getDaySchedule(dateKey, member.membership.workSchedule, member.membership.customSchedule),
    [dateKey, member.membership.customSchedule, member.membership.workSchedule]
  );
  const hasOverride = Boolean(member.membership.customSchedule[dateKey]);
  const [enabled, setEnabled] = useState(sourceSchedule.enabled);
  const [startTime, setStartTime] = useState(sourceSchedule.startTime);
  const [endTime, setEndTime] = useState(sourceSchedule.endTime);
  const [breaks, setBreaks] = useState<WorkBreak[]>(() => {
    const initialBreaks = getDayBreaks(sourceSchedule);
    return focusBreak && initialBreaks.length === 0
      ? [createSuggestedBreak(sourceSchedule)]
      : initialBreaks;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    const nextSchedule = getDaySchedule(dateKey, member.membership.workSchedule, member.membership.customSchedule);
    const nextBreaks = getDayBreaks(nextSchedule);
    setEnabled(nextSchedule.enabled);
    setStartTime(nextSchedule.startTime);
    setEndTime(nextSchedule.endTime);
    setBreaks(focusBreak && nextBreaks.length === 0 ? [createSuggestedBreak(nextSchedule)] : nextBreaks);
    setStatusText("");
  }, [dateKey, focusBreak, member]);

  function addBreak() {
    setBreaks((current) => [
      ...current,
      createSuggestedBreak({
        startTime,
        endTime,
        breakStart: current[0]?.startTime ?? startTime,
        breakEnd: current[0]?.endTime ?? startTime,
        breaks: current
      })
    ]);
  }

  function updateBreak(index: number, field: keyof WorkBreak, value: string) {
    setBreaks((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  }

  function removeBreak(index: number) {
    setBreaks((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function saveDay() {
    if (enabled && timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      setStatusText(copy.failed);
      return;
    }

    setIsSaving(true);
    const nextCustomSchedule = normalizeCustomSchedule(member.membership.customSchedule);
    nextCustomSchedule[dateKey] = serializeDay(enabled, startTime, endTime, breaks);

    const success = await onSave({
      memberId: member.professional.id,
      workScheduleMode: member.membership.workScheduleMode,
      workSchedule: member.membership.workSchedule,
      customSchedule: nextCustomSchedule,
      successText: copy.saved
    });

    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setStatusText(copy.failed);
    }
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

  return (
    <div className={styles.staffDayModalBackdrop} onClick={onClose}>
      <div className={styles.staffDayModal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.staffDayModalHeader}>
          <div>
            <h2>{copy.dayEditorTitle(makeMemberName(member), formattedDate)}</h2>
            <p>{copy.dayEditorText}</p>
          </div>
          <button type="button" className={styles.staffStudioGhostButton} onClick={onClose}>
            {copy.close}
          </button>
        </div>

        <label className={styles.staffDayToggle}>
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span>{copy.workingDay}</span>
        </label>

        <div className={styles.staffDayModalGrid}>
          <label className={styles.staffDrawerField}>
            <span>{copy.workFrom}</span>
            <select className={styles.select} value={startTime} disabled={!enabled} onChange={(event) => setStartTime(event.target.value)}>
              {TIME_OPTIONS.map((time) => (
                <option key={`modal-start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.staffDrawerField}>
            <span>{copy.workTo}</span>
            <select className={styles.select} value={endTime} disabled={!enabled} onChange={(event) => setEndTime(event.target.value)}>
              {TIME_OPTIONS.map((time) => (
                <option key={`modal-end-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.staffDayBreaks}>
          {breaks.map((item, index) => (
            <div key={`${item.startTime}-${item.endTime}-${index}`} className={styles.staffDayBreakRow}>
              <label className={styles.staffDrawerField}>
                <span>{copy.breakFrom}</span>
                <select
                  className={styles.select}
                  value={item.startTime}
                  disabled={!enabled}
                  onChange={(event) => updateBreak(index, "startTime", event.target.value)}
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={`break-start-${index}-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.staffDrawerField}>
                <span>{copy.breakTo}</span>
                <select
                  className={styles.select}
                  value={item.endTime}
                  disabled={!enabled}
                  onChange={(event) => updateBreak(index, "endTime", event.target.value)}
                >
                  {TIME_OPTIONS.map((time) => (
                    <option key={`break-end-${index}-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <button type="button" className={styles.staffSecondaryButton} onClick={() => removeBreak(index)} disabled={!enabled}>
                {copy.removeBreak}
              </button>
            </div>
          ))}

          <button type="button" className={styles.staffStudioGhostButton} onClick={addBreak} disabled={!enabled}>
            {copy.addBreak}
          </button>
        </div>

        {statusText ? <div className={styles.staffStudioStatus}>{statusText}</div> : null}

        <div className={styles.staffDayModalActions}>
          <button
            type="button"
            className={styles.staffSecondaryButton}
            onClick={() => void resetToTemplate()}
            disabled={isSaving || !hasOverride}
          >
            {copy.restoreTemplate}
          </button>

          <div className={styles.staffDayModalActionsRight}>
            <button type="button" className={styles.staffStudioGhostButton} onClick={onClose}>
              {copy.close}
            </button>
            <button type="button" className={styles.staffStudioPrimaryButton} onClick={() => void saveDay()} disabled={isSaving}>
              {isSaving ? copy.saving : copy.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffScheduleView({ professionalId, snapshot }: StaffScheduleViewProps) {
  const { language, t } = useProLanguage();
  const copy = scheduleText[language];
  const locale = getLocale(language);
  const [members, setMembers] = useState(snapshot.members);
  const [weekDate, setWeekDate] = useState(() => startOfWeek(new Date()));
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState(() => startOfMonth(new Date()));
  const [rowMenuMemberId, setRowMenuMemberId] = useState<string | null>(null);
  const [cellMenu, setCellMenu] = useState<CellMenuState | null>(null);
  const [plannerState, setPlannerState] = useState<PlannerState | null>(null);
  const [dayEditorState, setDayEditorState] = useState<DayEditorState | null>(null);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    setMembers(snapshot.members);
  }, [snapshot.members]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-staff-floating-root]")) {
        return;
      }

      setSortMenuOpen(false);
      setOptionsMenuOpen(false);
      setAddMenuOpen(false);
      setCalendarOpen(false);
      setRowMenuMemberId(null);
      setCellMenu(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
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

  const sortedMembers = useMemo(
    () => [...members].sort((left, right) => compareMembers(left, right, sortMode, weekDays)),
    [members, sortMode, weekDays]
  );

  const teamHoursByDay = useMemo(() => {
    return new Map(
      weekDays.map((day) => [
        day.key,
        sortedMembers.reduce((sum, member) => {
          const daySchedule = getDaySchedule(
            day.key,
            member.membership.workSchedule,
            member.membership.customSchedule
          );
          return sum + getDayDurationMinutes(daySchedule);
        }, 0)
      ])
    );
  }, [sortedMembers, weekDays]);

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
    const source = getDaySchedule(dateKey, member.membership.workSchedule, member.membership.customSchedule);
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

  async function handleClearAllShifts(member: StaffMemberSnapshot) {
    const confirmed =
      typeof window === "undefined" ? true : window.confirm(copy.removeAllShifts);

    if (!confirmed) {
      return;
    }

    setRowMenuMemberId(null);
    await persistMemberSchedule({
      memberId: member.professional.id,
      workScheduleMode: "fixed",
      workSchedule: createEmptyWorkSchedule(),
      customSchedule: createEmptyCustomSchedule(),
      successText: copy.clearedAll
    });
  }

  return (
    <main className={`${styles.workspaceShell} ${styles.scheduleShell}`}>
      <ProSidebar active="staff" professionalId={professionalId} canManageStaff />

      <section className={styles.staffStudioShell}>
        <aside className={styles.staffStudioSidebar}>
          <div className={styles.staffStudioSidebarCard}>
            <strong>{copy.sectionTitle}</strong>
            <nav className={styles.staffStudioLocalNav}>
              <Link href="/pro/staff" className={styles.staffStudioLocalLink}>
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

            <div className={styles.staffStudioTopActions}>
              <div className={styles.staffControlMenuWrap} data-staff-floating-root>
                <button
                  type="button"
                  className={styles.staffStudioGhostButton}
                  onClick={() => {
                    setOptionsMenuOpen((value) => !value);
                    setAddMenuOpen(false);
                  }}
                >
                  {copy.options}
                  <span aria-hidden="true">⌄</span>
                </button>

                {optionsMenuOpen ? (
                  <div className={styles.staffControlMenu}>
                    <Link href="/pro/staff" className={styles.staffControlMenuItem}>
                      {copy.membersList}
                    </Link>
                    <button
                      type="button"
                      className={styles.staffControlMenuItem}
                      onClick={() => {
                        setWeekDate(startOfWeek(new Date()));
                        setOptionsMenuOpen(false);
                      }}
                    >
                      {copy.openCurrentWeek}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className={styles.staffControlMenuWrap} data-staff-floating-root>
                <button
                  type="button"
                  className={styles.staffStudioPrimaryButton}
                  onClick={() => {
                    setAddMenuOpen((value) => !value);
                    setOptionsMenuOpen(false);
                  }}
                >
                  {copy.add}
                  <span aria-hidden="true">⌄</span>
                </button>

                {addMenuOpen ? (
                  <div className={styles.staffControlMenu}>
                    <Link href="/pro/staff?openAdd=1" className={styles.staffControlMenuItem}>
                      {copy.addMember}
                    </Link>
                    <Link href="/pro/staff" className={styles.staffControlMenuItem}>
                      {copy.membersList}
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {statusText ? <div className={styles.staffStudioStatus}>{statusText}</div> : null}

          <div className={styles.staffStudioToolbar}>
            <div className={styles.staffScheduleTopBar}>
              <div className={styles.staffControlMenuWrap} data-staff-floating-root>
                <button
                  type="button"
                  className={styles.staffStudioGhostButton}
                  onClick={() => {
                    setSortMenuOpen((value) => !value);
                    setCalendarOpen(false);
                  }}
                >
                  {copy.sort}
                  <span aria-hidden="true">⇅</span>
                </button>

                {sortMenuOpen ? (
                  <div className={styles.staffControlMenu}>
                    <button
                      type="button"
                      className={styles.staffControlMenuItem}
                      onClick={() => {
                        setSortMode("name");
                        setSortMenuOpen(false);
                      }}
                    >
                      {copy.sortByName}
                    </button>
                    <button
                      type="button"
                      className={styles.staffControlMenuItem}
                      onClick={() => {
                        setSortMode("hours-desc");
                        setSortMenuOpen(false);
                      }}
                    >
                      {copy.sortByHoursDesc}
                    </button>
                    <button
                      type="button"
                      className={styles.staffControlMenuItem}
                      onClick={() => {
                        setSortMode("hours-asc");
                        setSortMenuOpen(false);
                      }}
                    >
                      {copy.sortByHoursAsc}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className={styles.staffScheduleToolbarRight}>
                <button
                  type="button"
                  className={styles.staffStudioGhostButton}
                  onClick={() => setWeekDate(startOfWeek(new Date()))}
                >
                  {copy.today}
                </button>

                <div className={styles.staffScheduleRangeBox} data-staff-floating-root>
                  <button type="button" className={styles.staffScheduleRangeButton} onClick={() => setWeekDate(addDays(weekDate, -7))}>
                    ‹
                  </button>
                  <button
                    type="button"
                    className={styles.staffScheduleRangeLabelButton}
                    onClick={() => {
                      setPickerMonthDate(startOfMonth(weekDate));
                      setCalendarOpen((value) => !value);
                      setSortMenuOpen(false);
                    }}
                  >
                    {rangeLabel}
                  </button>
                  <button type="button" className={styles.staffScheduleRangeButton} onClick={() => setWeekDate(addDays(weekDate, 7))}>
                    ›
                  </button>

                  {calendarOpen ? (
                    <div className={styles.staffScheduleCalendarPopover}>
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
                          const isSelectedWeek = selectedWeekKeys.has(dateKey);
                          const isCurrentAnchor = dateKey === weekDays[0]?.key;

                          return (
                            <button
                              key={item.key}
                              type="button"
                              className={`${styles.staffScheduleCalendarDay} ${
                                isSelectedWeek ? styles.staffScheduleCalendarDayRange : ""
                              } ${isCurrentAnchor ? styles.staffScheduleCalendarDayActive : ""}`}
                              onClick={() => {
                                setWeekDate(startOfWeek(item.date as Date));
                                setCalendarOpen(false);
                              }}
                            >
                              {item.date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {sortedMembers.length === 0 ? (
            <div className={styles.staffStudioEmpty}>{copy.empty}</div>
          ) : (
            <section className={styles.staffScheduleBoard}>
              <div className={styles.staffScheduleBoardScroller}>
                <div className={styles.staffScheduleHead}>
                  <div className={styles.staffScheduleMemberHead}>
                    <span>{copy.employee}</span>
                    <Link href="/pro/staff" className={styles.staffScheduleInlineLink}>
                      {copy.change}
                    </Link>
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
                  {sortedMembers.map((member, memberIndex) => {
                    const memberHours = weekDays.reduce((sum, day) => {
                      return (
                        sum +
                        getDayDurationMinutes(
                          getDaySchedule(
                            day.key,
                            member.membership.workSchedule,
                            member.membership.customSchedule
                          )
                        )
                      );
                    }, 0);
                    const shouldOpenMenuUp = memberIndex >= Math.max(0, sortedMembers.length - 2);

                    return (
                      <article key={member.professional.id} className={styles.staffScheduleRow}>
                        <div className={styles.staffScheduleMemberCell}>
                          <Link href={`/pro/staff/${member.professional.id}?tab=profile`} className={styles.staffScheduleMemberIdentity}>
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
                          </Link>

                          <div className={styles.staffControlMenuWrap} data-staff-floating-root>
                            <button
                              type="button"
                              className={styles.staffScheduleMemberAction}
                              onClick={() => {
                                setRowMenuMemberId((value) => (value === member.professional.id ? null : member.professional.id));
                                setCellMenu(null);
                              }}
                              aria-label={copy.editMember}
                            >
                              ✎
                            </button>

                            {rowMenuMemberId === member.professional.id ? (
                              <div
                                className={`${styles.staffControlMenu} ${styles.staffScheduleMemberMenu} ${
                                  shouldOpenMenuUp ? styles.staffScheduleMemberMenuUp : ""
                                }`}
                              >
                                <strong className={styles.staffScheduleMenuTitle}>{copy.planSection}</strong>
                                <button
                                  type="button"
                                  className={styles.staffControlMenuItem}
                                  onClick={() => {
                                    setPlannerState({ memberId: member.professional.id, anchorDateKey: weekDays[0]?.key });
                                    setRowMenuMemberId(null);
                                  }}
                                >
                                  {copy.repeatingShifts}
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.staffControlMenuItem} ${styles.staffControlMenuDanger}`}
                                  onClick={() => void handleClearAllShifts(member)}
                                >
                                  {copy.removeAllShifts}
                                </button>
                                <div className={styles.staffControlMenuDivider} />
                                <strong className={styles.staffScheduleMenuTitle}>{copy.memberSection}</strong>
                                <Link href={`/pro/staff/${member.professional.id}?tab=profile`} className={styles.staffControlMenuItem}>
                                  {copy.viewMember}
                                </Link>
                                <Link href={`/pro/staff/${member.professional.id}?tab=profile`} className={styles.staffControlMenuItem}>
                                  {copy.editMember}
                                </Link>
                                <Link href={`/pro/staff/${member.professional.id}?tab=access`} className={styles.staffControlMenuItem}>
                                  {copy.openAccess}
                                </Link>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {weekDays.map((day) => {
                          const daySchedule = getDaySchedule(
                            day.key,
                            member.membership.workSchedule,
                            member.membership.customSchedule
                          );
                          const label = daySchedule.enabled ? `${daySchedule.startTime} - ${daySchedule.endTime}` : copy.noWork;
                          const isCellMenuOpen =
                            cellMenu?.memberId === member.professional.id && cellMenu.dateKey === day.key;

                          return (
                            <div key={`${member.professional.id}-${day.key}`} className={styles.staffScheduleShiftWrap} data-staff-floating-root>
                              <button
                                type="button"
                                className={`${styles.staffScheduleShiftButton} ${
                                  daySchedule.enabled ? styles.staffScheduleShiftCellActive : styles.staffScheduleShiftCellOff
                                }`}
                                onClick={() => {
                                  setCellMenu(isCellMenuOpen ? null : { memberId: member.professional.id, dateKey: day.key });
                                  setRowMenuMemberId(null);
                                }}
                              >
                                {label}
                              </button>

                              {isCellMenuOpen ? (
                                <div
                                  className={`${styles.staffControlMenu} ${styles.staffScheduleCellMenu} ${
                                    shouldOpenMenuUp ? styles.staffScheduleCellMenuUp : ""
                                  }`}
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
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <div className={styles.staffStudioNotice}>{copy.footer}</div>
        </section>
      </section>

      {plannerState && plannerMember ? (
        <SchedulePlannerModal
          member={plannerMember}
          businessName={snapshot.business.name}
          businessCategories={snapshot.business.categories}
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
        />
      ) : null}
    </main>
  );
}
