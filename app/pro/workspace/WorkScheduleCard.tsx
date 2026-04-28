"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../pro.module.css";
import { useProLanguage } from "../useProLanguage";
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
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
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

function createSuggestedBreak(day: Pick<WorkDaySchedule, "startTime" | "endTime" | "breaks" | "breakStart" | "breakEnd">) {
  const existing = getDayBreaks(day as unknown as WorkDaySchedule);
  const workStart = timeToMinutes(day.startTime);
  const workEnd = timeToMinutes(day.endTime);
  const anchor = existing.length > 0
    ? Math.min(workEnd - 30, timeToMinutes(existing[existing.length - 1].endTime) + 30)
    : Math.min(workEnd - 60, Math.max(workStart + 180, workStart + 60));
  const start = Math.max(workStart, Math.min(anchor, workEnd - 30));
  const end = Math.min(workEnd, start + 60);

  return {
    startTime: minutesToTime(start),
    endTime: minutesToTime(Math.max(start + 15, end))
  } satisfies WorkBreak;
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
  const locale = language === "uk" ? "uk-UA" : language === "en" ? "en-US" : "ru-RU";
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

  function updateDay(dayKey: WorkDayKey, field: keyof Template, value: string) {
    setSchedule((current) => {
      const nextSchedule = {
        ...current,
        [dayKey]: {
          ...current[dayKey],
          [field]: value,
          dayType: "workday"
        }
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

  function updateCustomDate(field: keyof Template, value: string) {
    if (!selectedDateKey) {
      return;
    }

    setCustomSchedule((current) => {
      const base = current[selectedDateKey] ?? {
        enabled: true,
        ...lastCustomTemplate,
        dayType: "workday" as const
      };
      const nextDay: WorkDaySchedule = {
        ...base,
        enabled: true,
        dayType: "workday",
        [field]: value
      };

      rememberCustomTemplate(nextDay);
      return {
        ...current,
        [selectedDateKey]: nextDay
      };
    });
  }

  function addDayBreak(dayKey: WorkDayKey) {
    setSchedule((current) => {
      const currentDay = current[dayKey];
      const nextDay = syncLegacyBreakFields({
        ...currentDay,
        breaks: [...getDayBreaks(currentDay), createSuggestedBreak(currentDay)],
        dayType: "workday" as const
      });
      const nextSchedule = {
        ...current,
        [dayKey]: nextDay
      };
      rememberTemplate(nextSchedule, dayKey);
      return nextSchedule;
    });
  }

  function updateDayBreak(dayKey: WorkDayKey, breakIndex: number, field: keyof WorkBreak, value: string) {
    setSchedule((current) => {
      const currentDay = current[dayKey];
      const breaks = getDayBreaks(currentDay).map((item, index) =>
        index === breakIndex ? { ...item, [field]: value } : item
      );
      const nextDay = syncLegacyBreakFields({
        ...currentDay,
        breaks,
        dayType: "workday" as const
      });
      const nextSchedule = {
        ...current,
        [dayKey]: nextDay
      };
      rememberTemplate(nextSchedule, dayKey);
      return nextSchedule;
    });
  }

  function removeDayBreak(dayKey: WorkDayKey, breakIndex: number) {
    setSchedule((current) => {
      const currentDay = current[dayKey];
      const nextDay = syncLegacyBreakFields({
        ...currentDay,
        breaks: getDayBreaks(currentDay).filter((_, index) => index !== breakIndex),
        dayType: "workday" as const
      });
      const nextSchedule = {
        ...current,
        [dayKey]: nextDay
      };
      rememberTemplate(nextSchedule, dayKey);
      return nextSchedule;
    });
  }

  function addCustomBreak() {
    if (!selectedDateKey) {
      return;
    }

    setCustomSchedule((current) => {
      const base = current[selectedDateKey] ?? {
        enabled: true,
        ...lastCustomTemplate,
        dayType: "workday" as const
      };
      const nextDay: WorkDaySchedule = syncLegacyBreakFields({
        ...base,
        enabled: true,
        dayType: "workday",
        breaks: [...getDayBreaks(base), createSuggestedBreak(base)]
      });

      rememberCustomTemplate(nextDay);
      return {
        ...current,
        [selectedDateKey]: nextDay
      };
    });
  }

  function updateCustomBreak(breakIndex: number, field: keyof WorkBreak, value: string) {
    if (!selectedDateKey) {
      return;
    }

    setCustomSchedule((current) => {
      const base = current[selectedDateKey] ?? {
        enabled: true,
        ...lastCustomTemplate,
        dayType: "workday" as const
      };
      const breaks = getDayBreaks(base).map((item, index) =>
        index === breakIndex ? { ...item, [field]: value } : item
      );
      const nextDay: WorkDaySchedule = syncLegacyBreakFields({
        ...base,
        enabled: true,
        dayType: "workday",
        breaks
      });

      rememberCustomTemplate(nextDay);
      return {
        ...current,
        [selectedDateKey]: nextDay
      };
    });
  }

  function removeCustomBreak(breakIndex: number) {
    if (!selectedDateKey) {
      return;
    }

    setCustomSchedule((current) => {
      const base = current[selectedDateKey] ?? {
        enabled: true,
        ...lastCustomTemplate,
        dayType: "workday" as const
      };
      const nextDay: WorkDaySchedule = syncLegacyBreakFields({
        ...base,
        enabled: true,
        dayType: "workday",
        breaks: getDayBreaks(base).filter((_, index) => index !== breakIndex)
      });

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
    onChange: (field: keyof Template, value: string) => void,
    onAddBreak: () => void,
    onUpdateBreak: (breakIndex: number, field: keyof WorkBreak, value: string) => void,
    onRemoveBreak: (breakIndex: number) => void
  ) {
    const breaks = getDayBreaks(day);

    return (
      <div className={styles.scheduleFieldStack}>
        <div className={styles.scheduleFieldRow}>
          <label className={styles.scheduleField}>
            <span>{t.schedule.workFrom}</span>
            <input type="time" className={styles.input} value={day.startTime} onChange={(event) => onChange("startTime", event.target.value)} disabled={!canEdit} />
          </label>
          <label className={styles.scheduleField}>
            <span>{t.schedule.workTo}</span>
            <input type="time" className={styles.input} value={day.endTime} onChange={(event) => onChange("endTime", event.target.value)} disabled={!canEdit} />
          </label>
        </div>

        {breaks.map((breakItem, breakIndex) => (
          <div key={`${breakItem.startTime}-${breakItem.endTime}-${breakIndex}`} className={styles.scheduleBreakCard}>
            <div className={styles.scheduleFieldRow}>
              <label className={styles.scheduleField}>
                <span>{t.schedule.breakFrom}</span>
                <input
                  type="time"
                  className={styles.input}
                  value={breakItem.startTime}
                  onChange={(event) => onUpdateBreak(breakIndex, "startTime", event.target.value)}
                  disabled={!canEdit}
                />
              </label>
              <label className={styles.scheduleField}>
                <span>{t.schedule.breakTo}</span>
                <input
                  type="time"
                  className={styles.input}
                  value={breakItem.endTime}
                  onChange={(event) => onUpdateBreak(breakIndex, "endTime", event.target.value)}
                  disabled={!canEdit}
                />
              </label>
            </div>
            <button type="button" className={styles.ghostButton} onClick={onAddBreak} disabled={!canEdit}>
              {t.schedule.addAnotherBreak}
            </button>
            <button type="button" className={styles.ghostButton} onClick={() => onRemoveBreak(breakIndex)} disabled={!canEdit}>
              {t.schedule.removeBreak}
            </button>
          </div>
        ))}

        {breaks.length === 0 ? (
          <button type="button" className={styles.ghostButton} onClick={onAddBreak} disabled={!canEdit}>
            {t.schedule.addBreak}
          </button>
        ) : null}
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
                    (field, value) => updateDay(day.key, field, value),
                    () => addDayBreak(day.key),
                    (breakIndex, field, value) => updateDayBreak(day.key, breakIndex, field, value),
                    (breakIndex) => removeDayBreak(day.key, breakIndex)
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
                      updateCustomDate,
                      addCustomBreak,
                      updateCustomBreak,
                      removeCustomBreak
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
