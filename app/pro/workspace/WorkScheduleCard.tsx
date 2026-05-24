"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
import { localeBySiteLanguage } from "../../../lib/site-language";
import {
  defaultWorkTemplate,
  getDayBreaks,
  getLastEnabledTemplate,
  getLastTemplateFromCustomSchedule,
  normalizeCustomSchedule,
  normalizeWorkSchedule,
  normalizeWorkScheduleMode,
  workDays,
  type CustomSchedule,
  type WorkDayKey,
  type WorkBreak,
  type WorkDaySchedule,
  type WorkSchedule,
  type WorkScheduleMode
} from "../../../lib/work-schedule";

type WorkScheduleCardProps = {
  canEdit: boolean;
  initialMode: WorkScheduleMode;
  initialSchedule: WorkSchedule;
  initialCustomSchedule: CustomSchedule;
  layout?: "aside" | "page";
  targetProfessionalId?: string;
};

type Template = typeof defaultWorkTemplate;
type WorkInterval = {
  startTime: string;
  endTime: string;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leading = (firstDay.getDay() + 6) % 7;
  const days: Array<{ date: Date | null; key: string }> = [];

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

function buildAvailableMonths(locale: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 12 }, (_, index) => {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + index, 1);

    return {
      key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      date: monthDate,
      label: monthDate.toLocaleDateString(locale, {
        month: "long",
        year: "numeric"
      })
    };
  });
}

function getDateRange(startKey: string, endKey: string) {
  const start = new Date(`${startKey}T00:00:00`);
  const end = new Date(`${endKey}T00:00:00`);
  const min = start <= end ? start : end;
  const max = start <= end ? end : start;
  const items: string[] = [];

  for (const cursor = new Date(min); cursor <= max; cursor.setDate(cursor.getDate() + 1)) {
    items.push(toDateKey(new Date(cursor)));
  }

  return items;
}

function isWeekendDate(dateKey: string) {
  const day = new Date(`${dateKey}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const safe = Math.max(0, Math.min(value, 24 * 60 - 1));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function syncLegacyBreakFields<T extends Pick<WorkDaySchedule, "startTime" | "breakStart" | "breakEnd" | "breaks">>(day: T) {
  const breaks = getDayBreaks(day as unknown as WorkDaySchedule);
  if (breaks.length === 0) {
    return {
      ...day,
      breakStart: day.startTime,
      breakEnd: day.startTime,
      breaks: []
    };
  }

  return {
    ...day,
    breakStart: breaks[0].startTime,
    breakEnd: breaks[0].endTime,
    breaks
  };
}

function getDayIntervals(day: Pick<WorkDaySchedule, "startTime" | "endTime" | "breaks" | "breakStart" | "breakEnd">) {
  const explicitIntervals = (day as Pick<WorkDaySchedule, "intervals">).intervals;
  if (Array.isArray(explicitIntervals) && explicitIntervals.length > 0) {
    return explicitIntervals
      .filter((item) => item?.startTime && item?.endTime)
      .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
      .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));
  }

  const dayStart = timeToMinutes(day.startTime);
  const dayEnd = timeToMinutes(day.endTime);

  if (dayStart >= dayEnd) {
    return [{ startTime: day.startTime, endTime: day.endTime }] satisfies WorkInterval[];
  }

  const intervals: WorkInterval[] = [];
  let cursor = dayStart;

  for (const item of getDayBreaks(day as unknown as WorkDaySchedule)) {
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

  return intervals.length > 0 ? intervals : [{ startTime: day.startTime, endTime: day.endTime }];
}

function validateWorkIntervals(intervals: WorkInterval[]) {
  const sorted = [...intervals]
    .map((item) => ({ startTime: item.startTime, endTime: item.endTime }))
    .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));

  if (sorted.some((item) => timeToMinutes(item.startTime) >= timeToMinutes(item.endTime))) {
    return { ok: false as const, reason: "range" as const, intervals: sorted };
  }

  const normalized: WorkInterval[] = [];

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

function serializeIntervalsToDay(
  enabled: boolean,
  intervals: WorkInterval[],
  fallback: Pick<WorkDaySchedule, "startTime" | "endTime">
) {
  const validation = validateWorkIntervals(intervals);
  const normalized = validation.ok ? validation.intervals : intervals;

  if (!enabled || normalized.length === 0) {
    return syncLegacyBreakFields({
      enabled: false,
      startTime: fallback.startTime,
      endTime: fallback.endTime,
      intervals,
      breakStart: fallback.startTime,
      breakEnd: fallback.startTime,
      breaks: [],
      dayType: "day-off" as const
    });
  }

  const sorted = [...normalized].sort(
    (left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime)
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const breaks: WorkBreak[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    if (current.endTime < next.startTime) {
      breaks.push({ startTime: current.endTime, endTime: next.startTime });
    }
  }

  return syncLegacyBreakFields({
    enabled: true,
    startTime: first.startTime,
    endTime: last.endTime,
    intervals: sorted,
    breakStart: breaks[0]?.startTime ?? first.startTime,
    breakEnd: breaks[0]?.endTime ?? first.startTime,
    breaks,
    dayType: "workday" as const
  });
}

function getIntervalFallback(day: WorkDaySchedule, intervals: WorkInterval[]) {
  if (intervals.length === 0) {
    return { startTime: day.startTime, endTime: day.endTime };
  }

  const sorted = [...intervals].sort(
    (left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime)
  );

  return {
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime
  };
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
      return { startTime: minutesToTime(windowStart), endTime: minutesToTime(desiredEnd) } satisfies WorkInterval;
    }
  }

  const desiredGap = currentEnd < timeToMinutes("14:00") ? 60 : 15;
  const desiredDuration = currentEnd < timeToMinutes("14:00") ? 240 : 60;
  const desiredStart = Math.min(currentEnd + desiredGap, 24 * 60 - 30);
  const desiredEnd = Math.min(24 * 60 - 1, desiredStart + desiredDuration);

  if (desiredEnd - desiredStart < 15) {
    return null;
  }

  return { startTime: minutesToTime(desiredStart), endTime: minutesToTime(desiredEnd) } satisfies WorkInterval;
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
    { startTime: minutesToTime(start), endTime: minutesToTime(safeFirstEnd) },
    { startTime: minutesToTime(secondStart), endTime: minutesToTime(end) }
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

export default function WorkScheduleCard({
  canEdit,
  initialMode,
  initialSchedule,
  initialCustomSchedule,
  layout = "aside",
  targetProfessionalId
}: WorkScheduleCardProps) {
  const { t, language } = useProLanguage();
  const locale = localeBySiteLanguage[language];
  const availableMonths = useMemo(() => buildAvailableMonths(locale), [locale]);
  const localizedWorkDays = useMemo(
    () =>
      workDays.map((day, index) => ({
        ...day,
        shortLabel: t.schedule.weekDaysShort[index] || day.shortLabel,
        fullLabel: t.schedule.weekDaysFull[index] || day.fullLabel
      })),
    [t.schedule.weekDaysFull, t.schedule.weekDaysShort]
  );
  const [scheduleMode, setScheduleMode] = useState<WorkScheduleMode>(
    normalizeWorkScheduleMode(initialMode)
  );
  const [schedule, setSchedule] = useState<WorkSchedule>(normalizeWorkSchedule(initialSchedule));
  const [customSchedule, setCustomSchedule] = useState<CustomSchedule>(
    normalizeCustomSchedule(initialCustomSchedule)
  );
  const [lastTemplate, setLastTemplate] = useState<Template>(
    getLastEnabledTemplate(normalizeWorkSchedule(initialSchedule))
  );
  const [lastCustomTemplate, setLastCustomTemplate] = useState<Template>(
    getLastTemplateFromCustomSchedule(normalizeCustomSchedule(initialCustomSchedule))
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(availableMonths[0]?.key ?? "");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [, setReferenceDateKey] = useState(toDateKey(new Date()));
  const autoSaveTimerRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef("");

  const selectedMonth =
    availableMonths.find((month) => month.key === selectedMonthKey) ?? availableMonths[0];
  const monthDays = useMemo(
    () => (selectedMonth ? buildMonthDays(selectedMonth.date) : []),
    [selectedMonth]
  );
  const activeDays = useMemo(
    () => localizedWorkDays.filter((day) => schedule[day.key].enabled),
    [localizedWorkDays, schedule]
  );
  const activeCustomDates = useMemo(
    () => Object.entries(customSchedule).filter(([, value]) => value.enabled || value.dayType === "holiday"),
    [customSchedule]
  );
  const selectedDateSchedule = selectedDateKey ? customSchedule[selectedDateKey] : null;
  const autosaveSnapshot = useMemo(
    () =>
      JSON.stringify({
        workScheduleMode: scheduleMode,
        workSchedule: schedule,
        customSchedule
      }),
    [customSchedule, schedule, scheduleMode]
  );

  useEffect(() => {
    lastSavedSnapshotRef.current = JSON.stringify({
      workScheduleMode: normalizeWorkScheduleMode(initialMode),
      workSchedule: normalizeWorkSchedule(initialSchedule),
      customSchedule: normalizeCustomSchedule(initialCustomSchedule)
    });
  }, [initialCustomSchedule, initialMode, initialSchedule]);

  useEffect(() => {
    if (!canEdit || isSaving || autosaveSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      void saveSchedule(true);
    }, 700);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autosaveSnapshot, canEdit, isSaving]);

  function rememberTemplate(nextSchedule: WorkSchedule, dayKey: WorkDayKey) {
    const day = nextSchedule[dayKey];
    if (!day.enabled) {
      return;
    }

    setLastTemplate({
      startTime: day.startTime,
      endTime: day.endTime,
      intervals: getDayIntervals(day),
      breakStart: day.breakStart,
      breakEnd: day.breakEnd,
      breaks: getDayBreaks(day),
      dayType: "workday"
    });
  }

  function rememberCustomTemplate(day: WorkDaySchedule) {
    if (!day.enabled) {
      return;
    }

    setLastCustomTemplate({
      startTime: day.startTime,
      endTime: day.endTime,
      intervals: getDayIntervals(day),
      breakStart: day.breakStart,
      breakEnd: day.breakEnd,
      breaks: getDayBreaks(day),
      dayType: "workday"
    });
  }

  function toggleDay(dayKey: WorkDayKey) {
    setSchedule((current) => {
      const currentDay = current[dayKey];

      if (currentDay.enabled) {
        return {
          ...current,
          [dayKey]: {
            ...currentDay,
            enabled: false,
            dayType: "day-off"
          }
        };
      }

      const nextTemplate = activeDays.length > 0 ? lastTemplate : defaultWorkTemplate;
      const nextSchedule = {
        ...current,
        [dayKey]: syncLegacyBreakFields({
          enabled: true,
          ...nextTemplate,
          dayType: "workday"
        })
      };

      rememberTemplate(nextSchedule, dayKey);
      return nextSchedule;
    });
  }

  function ensureDate(dateKey: string) {
    setSelectedDateKey(dateKey);
    setReferenceDateKey(dateKey);
  }

  function setDateType(dateKey: string, dayType: "workday" | "day-off" | "holiday", keepSelection = true) {
    setSelectedDateKey(keepSelection ? dateKey : null);
    setReferenceDateKey(dateKey);

    setCustomSchedule((current) => {
      const base = current[dateKey] ?? {
        enabled: true,
        ...lastCustomTemplate,
        dayType: "workday" as const
      };

      const nextDay: WorkDaySchedule = {
        ...base,
        enabled: dayType === "workday",
        dayType
      };

      if (dayType === "workday") {
        rememberCustomTemplate(syncLegacyBreakFields(nextDay));
      }

      return {
        ...current,
        [dateKey]: nextDay
      };
    });
  }

  function addDayInterval(dayKey: WorkDayKey, intervalIndex: number) {
    setSchedule((current) => {
      const currentDay = current[dayKey];
      const intervals = getDayIntervals(currentDay);
      const nextIntervals = insertWorkInterval(intervals, intervalIndex);
      if (!nextIntervals) {
        setStatusText(t.schedule.noRoomForInterval);
        return current;
      }
      const nextDay = serializeIntervalsToDay(true, nextIntervals, getIntervalFallback(currentDay, intervals));
      const nextSchedule = {
        ...current,
        [dayKey]: nextDay
      };
      rememberTemplate(nextSchedule, dayKey);
      return nextSchedule;
    });
  }

  function updateDayInterval(dayKey: WorkDayKey, intervalIndex: number, field: keyof WorkInterval, value: string) {
    setSchedule((current) => {
      const currentDay = current[dayKey];
      const intervals = getDayIntervals(currentDay).map((item, index) =>
        index === intervalIndex ? { ...item, [field]: value } : item
      );
      const nextDay = serializeIntervalsToDay(true, intervals, getIntervalFallback(currentDay, intervals));
      const nextSchedule = {
        ...current,
        [dayKey]: nextDay
      };
      rememberTemplate(nextSchedule, dayKey);
      return nextSchedule;
    });
  }

  function removeDayInterval(dayKey: WorkDayKey, intervalIndex: number) {
    setSchedule((current) => {
      const currentDay = current[dayKey];
      const intervals = getDayIntervals(currentDay);
      const nextIntervals = intervals.filter((_, index) => index !== intervalIndex);
      const nextDay = serializeIntervalsToDay(nextIntervals.length > 0, nextIntervals, getIntervalFallback(currentDay, intervals));
      const nextSchedule = {
        ...current,
        [dayKey]: nextDay
      };
      rememberTemplate(nextSchedule, dayKey);
      return nextSchedule;
    });
  }

  function addCustomInterval(intervalIndex: number) {
    if (!selectedDateKey) {
      return;
    }

    setCustomSchedule((current) => {
      const base = current[selectedDateKey] ?? {
        enabled: true,
        ...lastCustomTemplate,
        dayType: "workday" as const
      };
      const intervals = getDayIntervals(base);
      const nextIntervals = insertWorkInterval(intervals, intervalIndex);
      if (!nextIntervals) {
        setStatusText(t.schedule.noRoomForInterval);
        return current;
      }
      const nextDay: WorkDaySchedule = serializeIntervalsToDay(true, nextIntervals, getIntervalFallback(base, intervals));

      rememberCustomTemplate(nextDay);
      return {
        ...current,
        [selectedDateKey]: nextDay
      };
    });
  }

  function updateCustomInterval(intervalIndex: number, field: keyof WorkInterval, value: string) {
    if (!selectedDateKey) {
      return;
    }

    setCustomSchedule((current) => {
      const base = current[selectedDateKey] ?? {
        enabled: true,
        ...lastCustomTemplate,
        dayType: "workday" as const
      };
      const intervals = getDayIntervals(base).map((item, index) =>
        index === intervalIndex ? { ...item, [field]: value } : item
      );
      const nextDay: WorkDaySchedule = serializeIntervalsToDay(true, intervals, getIntervalFallback(base, intervals));

      rememberCustomTemplate(nextDay);
      return {
        ...current,
        [selectedDateKey]: nextDay
      };
    });
  }

  function removeCustomInterval(intervalIndex: number) {
    if (!selectedDateKey) {
      return;
    }

    setCustomSchedule((current) => {
      const base = current[selectedDateKey] ?? {
        enabled: true,
        ...lastCustomTemplate,
        dayType: "workday" as const
      };
      const intervals = getDayIntervals(base);
      const nextIntervals = intervals.filter((_, index) => index !== intervalIndex);
      const nextDay: WorkDaySchedule = serializeIntervalsToDay(nextIntervals.length > 0, nextIntervals, getIntervalFallback(base, intervals));

      rememberCustomTemplate(nextDay);
      return {
        ...current,
        [selectedDateKey]: nextDay
      };
    });
  }

  function applyRangeTemplate() {
    if (!rangeStart || !rangeEnd) {
      setStatusText(t.schedule.selectRangeError);
      return;
    }

    const template = selectedDateSchedule?.enabled ? selectedDateSchedule : { ...lastCustomTemplate, dayType: "workday" as const };
    const range = getDateRange(rangeStart, rangeEnd);

    setCustomSchedule((current) => {
      const next = { ...current };

      for (const dateKey of range) {
        if (!includeWeekends && isWeekendDate(dateKey)) {
          continue;
        }

        next[dateKey] = {
          enabled: true,
          startTime: template.startTime,
          endTime: template.endTime,
          intervals: template.intervals ?? getDayIntervals(template as WorkDaySchedule),
          breakStart: template.breakStart,
          breakEnd: template.breakEnd,
          breaks: template.breaks ?? [],
          dayType: "workday"
        };
      }

      return next;
    });

    setStatusText(t.schedule.templateAppliedRange.replace("{count}", String(range.length)));
  }

  function applyHolidayPreset() {
    if (!selectedMonth) {
      return;
    }

    const presets = monthDays
      .filter((item) => item.date)
      .map((item) => toDateKey(item.date as Date))
      .filter((dateKey) => isWeekendDate(dateKey));

    setCustomSchedule((current) => {
      const next = { ...current };
      for (const dateKey of presets) {
        next[dateKey] = {
          ...(next[dateKey] ?? { ...lastCustomTemplate }),
          enabled: false,
          dayType: "holiday",
          startTime: next[dateKey]?.startTime ?? lastCustomTemplate.startTime,
          endTime: next[dateKey]?.endTime ?? lastCustomTemplate.endTime,
          intervals: next[dateKey]?.intervals ?? lastCustomTemplate.intervals ?? [],
          breakStart: next[dateKey]?.breakStart ?? lastCustomTemplate.breakStart,
          breakEnd: next[dateKey]?.breakEnd ?? lastCustomTemplate.breakEnd,
          breaks: next[dateKey]?.breaks ?? lastCustomTemplate.breaks ?? []
        };
      }
      return next;
    });

    setStatusText(t.schedule.monthWeekendsMarked);
  }

  function shiftMonth(offset: number) {
    if (!selectedMonth) {
      return;
    }

    const nextDate = new Date(
      selectedMonth.date.getFullYear(),
      selectedMonth.date.getMonth() + offset,
      1
    );
    const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    const exists = availableMonths.find((month) => month.key === nextKey);

    if (exists) {
      setSelectedMonthKey(nextKey);
    }
  }

  async function saveSchedule(silent = false) {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const invalidWeeklyDay = Object.values(schedule).find((day) => {
      return day.enabled && !validateWorkIntervals(getDayIntervals(day)).ok;
    });
    const invalidCustomDay = Object.values(customSchedule).find((day) => {
      return day.enabled && !validateWorkIntervals(getDayIntervals(day)).ok;
    });
    const invalidDay = invalidWeeklyDay || invalidCustomDay;

    if (invalidDay) {
      const validation = validateWorkIntervals(getDayIntervals(invalidDay));
      setStatusText(validation.reason === "overlap" ? t.schedule.overlappingIntervals : t.schedule.invalidIntervalRange);
      return;
    }

    setIsSaving(true);
    setStatusText("");

    const response = await fetch("/api/pro/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        targetProfessionalId,
        workScheduleMode: scheduleMode,
        workSchedule: schedule,
        customSchedule
      })
    });

    const result = await response.json();

    setIsSaving(false);
    if (response.ok) {
      lastSavedSnapshotRef.current = autosaveSnapshot;
      setStatusText(silent ? t.schedule.autoSaved : t.schedule.savedManual);
    } else {
      setStatusText(result.error || t.schedule.saveFailed);
    }
  }

  const summaryText =
    scheduleMode === "fixed"
      ? activeDays.length === 0
        ? t.schedule.fixedEmptySummary
        : t.schedule.activeDaysSummary.replace("{count}", String(activeDays.length))
      : activeCustomDates.length === 0
        ? t.schedule.flexibleEmptySummary
        : t.schedule.flexibleActiveSummary.replace("{count}", String(activeCustomDates.length));

  function renderScheduleFields(
    day: WorkDaySchedule,
    onChangeInterval: (intervalIndex: number, field: keyof WorkInterval, value: string) => void,
    onAddInterval: (intervalIndex: number) => void,
    onRemoveInterval: (intervalIndex: number) => void
  ) {
    const intervals = getDayIntervals(day);

    return (
      <div className={styles.scheduleFieldStack}>
        {intervals.map((interval, intervalIndex) => (
          <div key={`${interval.startTime}-${interval.endTime}-${intervalIndex}`} className={styles.scheduleBreakCard}>
            <strong className={styles.scheduleHint}>{t.schedule.workingInterval}</strong>
            <div className={styles.scheduleFieldRow}>
              <label className={styles.scheduleField}>
                <span>{t.schedule.workFrom}</span>
                <input
                  type="time"
                  className={styles.input}
                  value={interval.startTime}
                  onChange={(event) => onChangeInterval(intervalIndex, "startTime", event.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label className={styles.scheduleField}>
                <span>{t.schedule.workTo}</span>
                <input
                  type="time"
                  className={styles.input}
                  value={interval.endTime}
                  onChange={(event) => onChangeInterval(intervalIndex, "endTime", event.target.value)}
                  disabled={!canEdit}
                />
              </label>
            </div>
            <button type="button" className={styles.ghostButton} onClick={() => onAddInterval(intervalIndex)} disabled={!canEdit}>
              {t.schedule.addWorkTime}
            </button>
            <button type="button" className={styles.ghostButton} onClick={() => onRemoveInterval(intervalIndex)} disabled={!canEdit}>
              {t.schedule.removeWorkTime}
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${styles.asideCard} ${layout === "page" ? styles.schedulePageCard : ""}`}>
      <div className={styles.scheduleHeader}>
        <div>
          <strong>{t.schedule.title}</strong>
          <p className={styles.scheduleHint}>{summaryText}</p>
        </div>
        <div className={styles.scheduleModeSwitch}>
          <button
            type="button"
            className={`${styles.scheduleModeButton} ${scheduleMode === "fixed" ? styles.scheduleModeActive : ""}`}
            onClick={() => setScheduleMode("fixed")}
            disabled={!canEdit}
          >
            {t.schedule.modeWeek}
          </button>
          <button
            type="button"
            className={`${styles.scheduleModeButton} ${scheduleMode === "flexible" ? styles.scheduleModeActive : ""}`}
            onClick={() => setScheduleMode("flexible")}
            disabled={!canEdit}
          >
            {t.schedule.modeCalendar}
          </button>
        </div>
      </div>

      {scheduleMode === "fixed" ? (
        <>
          <div className={styles.scheduleDays}>
            {localizedWorkDays.map((day) => (
              <button
                key={day.key}
                type="button"
                className={`${styles.scheduleDayButton} ${schedule[day.key].enabled ? styles.scheduleDayActive : ""}`}
                onClick={() => toggleDay(day.key)}
                disabled={!canEdit}
                title={day.fullLabel}
              >
                {day.shortLabel}
              </button>
            ))}
          </div>

          {activeDays.length > 0 ? (
            <div className={styles.scheduleEditorList}>
              {activeDays.map((day) => (
                <div key={day.key} className={styles.scheduleEditorCard}>
                  <div className={styles.scheduleEditorTop}>
                    <strong>{day.fullLabel}</strong>
                    <span className={styles.scheduleEditorBadge}>{t.schedule.regular}</span>
                  </div>
                  {renderScheduleFields(
                    schedule[day.key],
                    (intervalIndex, field, value) => updateDayInterval(day.key, intervalIndex, field, value),
                    (intervalIndex) => addDayInterval(day.key, intervalIndex),
                    (intervalIndex) => removeDayInterval(day.key, intervalIndex)
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.scheduleEmpty}>{t.schedule.enableDayHint}</div>
          )}
        </>
      ) : (
        <div className={styles.scheduleExperience}>
          <div className={styles.scheduleControlsRow}>
            <div className={styles.calendarNavigator}>
              <button type="button" className={styles.navigatorArrow} onClick={() => shiftMonth(-1)}>
                ←
              </button>
              <div className={styles.navigatorLabel}>{selectedMonth?.label}</div>
              <button type="button" className={styles.navigatorArrow} onClick={() => shiftMonth(1)}>
                →
              </button>
            </div>
          </div>

          <div className={styles.scheduleCanvas}>
            <div className={styles.calendarPanel}>
              <div className={styles.calendarWeekdays}>
                {t.schedule.weekDaysShort.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className={styles.calendarGrid}>
                {monthDays.map((item) => {
                  if (!item.date) {
                    return <div key={item.key} className={styles.calendarBlank} />;
                  }

                  const dateKey = item.key;
                  const entry = customSchedule[dateKey];
                  const selected = selectedDateKey === dateKey;
                  const dayType = entry?.dayType ?? (entry?.enabled ? "workday" : isWeekendDate(dateKey) ? "day-off" : "day-off");
                  const isHoliday = dayType === "holiday";
                  const isWorkday = dayType === "workday" && entry?.enabled;

                  const dayBadge = isHoliday
                    ? t.schedule.holidayShort
                    : isWorkday
                      ? t.schedule.workdayShort
                      : t.schedule.dayOffShort;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      className={`${styles.calendarDay} ${isWorkday ? styles.calendarDayActive : ""} ${selected ? styles.calendarDaySelected : ""} ${isHoliday ? styles.calendarHoliday : ""}`}
                      onClick={() => {
                        if (selectedDateKey === dateKey) {
                          setDateType(dateKey, "day-off", false);
                          return;
                        }

                        setDateType(dateKey, "workday");
                      }}
                      disabled={!canEdit}
                    >
                      <span>{item.date.getDate()}</span>
                      <small>{dayBadge}</small>
                    </button>
                  );
                })}
              </div>

            </div>

            <div className={styles.scheduleSidePanel}>
              {selectedDateKey ? (
                <div className={styles.scheduleEditorCard}>
                  <div className={styles.scheduleEditorTop}>
                    <strong>
                      {new Date(`${selectedDateKey}T00:00:00`).toLocaleDateString(
                        locale,
                        {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                        }
                      )}
                    </strong>
                  </div>

                  <div className={styles.dayTypeTabs}>
                    <button type="button" className={`${styles.dayTypeButton} ${selectedDateSchedule?.dayType === "workday" ? styles.dayTypeActive : ""}`} onClick={() => setDateType(selectedDateKey, "workday")} disabled={!canEdit}>
                      {t.schedule.workday}
                    </button>
                    <button type="button" className={`${styles.dayTypeButton} ${selectedDateSchedule?.dayType === "day-off" ? styles.dayTypeActive : ""}`} onClick={() => setDateType(selectedDateKey, "day-off")} disabled={!canEdit}>
                      {t.schedule.dayOff}
                    </button>
                    <button type="button" className={`${styles.dayTypeButton} ${selectedDateSchedule?.dayType === "holiday" ? styles.dayTypeHoliday : ""}`} onClick={() => setDateType(selectedDateKey, "holiday")} disabled={!canEdit}>
                      {t.schedule.holiday}
                    </button>
                  </div>

                  {selectedDateSchedule?.dayType === "workday" ? (
                    renderScheduleFields(
                      selectedDateSchedule,
                      updateCustomInterval,
                      addCustomInterval,
                      removeCustomInterval
                    )
                  ) : (
                    <div className={styles.scheduleEmpty}>
                      {selectedDateSchedule?.dayType === "holiday"
                        ? t.schedule.holidayDateNote
                        : t.schedule.dayOffDateNote}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.scheduleEditorCard}>
                  <strong>{t.schedule.selectDate}</strong>
                  <p className={styles.scheduleHint}>{t.schedule.selectDateHint}</p>
                </div>
              )}

              <div className={styles.rangeApplyCard}>
                <strong>{t.schedule.rangeTemplate}</strong>
                <div className={styles.rangeApplyFields}>
                  <input type="date" className={styles.input} value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} disabled={!canEdit} />
                  <input type="date" className={styles.input} value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} disabled={!canEdit} />
                </div>
                <label className={styles.rangeCheckbox}>
                  <input type="checkbox" checked={includeWeekends} onChange={(event) => setIncludeWeekends(event.target.checked)} disabled={!canEdit} />
                  <span>{t.schedule.includeWeekends}</span>
                </label>
                <div className={styles.rangeApplyActions}>
                  <button type="button" className={styles.ghostButton} onClick={applyRangeTemplate} disabled={!canEdit}>
                    {t.schedule.applyTemplate}
                  </button>
                  <button type="button" className={styles.ghostButton} onClick={applyHolidayPreset} disabled={!canEdit}>
                    {t.schedule.markMonthWeekends}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {canEdit ? (
        <div className={styles.scheduleActions}>
          <button type="button" className={styles.primaryButton} onClick={() => void saveSchedule()} disabled={isSaving}>
            {isSaving ? t.schedule.saveAuto : autosaveSnapshot === lastSavedSnapshotRef.current ? t.schedule.saved : t.schedule.saveNow}
          </button>
          {statusText ? <span className={styles.scheduleStatus}>{statusText}</span> : null}
        </div>
      ) : (
        <div className={styles.scheduleReadOnly}>{t.schedule.readOnly}</div>
      )}
    </div>
  );
}
