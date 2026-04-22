export const workDays = [
  { key: "monday", shortLabel: "Пн", fullLabel: "Понедельник" },
  { key: "tuesday", shortLabel: "Вт", fullLabel: "Вторник" },
  { key: "wednesday", shortLabel: "Ср", fullLabel: "Среда" },
  { key: "thursday", shortLabel: "Чт", fullLabel: "Четверг" },
  { key: "friday", shortLabel: "Пт", fullLabel: "Пятница" },
  { key: "saturday", shortLabel: "Сб", fullLabel: "Суббота" },
  { key: "sunday", shortLabel: "Вс", fullLabel: "Воскресенье" }
] as const;

export type WorkDayKey = (typeof workDays)[number]["key"];

export type WorkBreak = {
  startTime: string;
  endTime: string;
};

export type WorkDaySchedule = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  breaks?: WorkBreak[];
  dayType?: "workday" | "day-off" | "holiday";
};

export type WorkSchedule = Record<WorkDayKey, WorkDaySchedule>;
export type CustomSchedule = Record<string, WorkDaySchedule>;

export type WorkScheduleMode = "fixed" | "flexible";

export const defaultWorkTemplate: Omit<WorkDaySchedule, "enabled"> = {
  startTime: "09:00",
  endTime: "18:00",
  breakStart: "13:00",
  breakEnd: "14:00",
  breaks: [{ startTime: "13:00", endTime: "14:00" }],
  dayType: "workday"
};

function normalizeBreaks(input: unknown, fallbackStart: string, fallbackEnd: string) {
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const candidate = item as Partial<WorkBreak>;
        const startTime = typeof candidate.startTime === "string" ? candidate.startTime : "";
        const endTime = typeof candidate.endTime === "string" ? candidate.endTime : "";

        if (!startTime || !endTime || startTime >= endTime) {
          return null;
        }

        return { startTime, endTime } satisfies WorkBreak;
      })
      .filter((item): item is WorkBreak => Boolean(item))
      .sort((left, right) => timeToMinutes(left.startTime) - timeToMinutes(right.startTime));
  }

  if (fallbackStart && fallbackEnd && fallbackStart < fallbackEnd) {
    return [{ startTime: fallbackStart, endTime: fallbackEnd }];
  }

  return [];
}

export function createEmptyWorkSchedule(): WorkSchedule {
  return Object.fromEntries(
    workDays.map((day) => [
      day.key,
      {
        enabled: false,
        ...defaultWorkTemplate,
        dayType: "day-off"
      }
    ])
  ) as WorkSchedule;
}

export function createDefaultWorkSchedule(): WorkSchedule {
  const schedule = createEmptyWorkSchedule();

  for (const day of workDays) {
    if (day.key === "saturday" || day.key === "sunday") {
      continue;
    }

    schedule[day.key] = {
      enabled: true,
      ...defaultWorkTemplate,
      dayType: "workday"
    };
  }

  return schedule;
}

export function createEmptyCustomSchedule(): CustomSchedule {
  return {};
}

export function normalizeWorkSchedule(input: unknown): WorkSchedule {
  const fallback = createEmptyWorkSchedule();

  if (!input || typeof input !== "object") {
    return fallback;
  }

  const source = input as Partial<Record<WorkDayKey, Partial<WorkDaySchedule>>>;

  for (const day of workDays) {
    const value = source[day.key];
    if (!value || typeof value !== "object") {
      continue;
    }

    fallback[day.key] = {
      enabled: Boolean(value.enabled),
      startTime: typeof value.startTime === "string" ? value.startTime : defaultWorkTemplate.startTime,
      endTime: typeof value.endTime === "string" ? value.endTime : defaultWorkTemplate.endTime,
      breakStart:
        typeof value.breakStart === "string" ? value.breakStart : defaultWorkTemplate.breakStart,
      breakEnd: typeof value.breakEnd === "string" ? value.breakEnd : defaultWorkTemplate.breakEnd,
      breaks: normalizeBreaks(
        (value as Partial<WorkDaySchedule>).breaks,
        typeof value.breakStart === "string" ? value.breakStart : defaultWorkTemplate.breakStart,
        typeof value.breakEnd === "string" ? value.breakEnd : defaultWorkTemplate.breakEnd
      ),
      dayType:
        value.dayType === "holiday"
          ? "holiday"
          : value.dayType === "day-off"
            ? "day-off"
            : Boolean(value.enabled)
              ? "workday"
              : "day-off"
    };
  }

  return fallback;
}

export function normalizeCustomSchedule(input: unknown): CustomSchedule {
  const fallback = createEmptyCustomSchedule();

  if (!input || typeof input !== "object") {
    return fallback;
  }

  const source = input as Record<string, Partial<WorkDaySchedule>>;

  for (const [dateKey, value] of Object.entries(source)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    fallback[dateKey] = {
      enabled: Boolean(value.enabled),
      startTime: typeof value.startTime === "string" ? value.startTime : defaultWorkTemplate.startTime,
      endTime: typeof value.endTime === "string" ? value.endTime : defaultWorkTemplate.endTime,
      breakStart:
        typeof value.breakStart === "string" ? value.breakStart : defaultWorkTemplate.breakStart,
      breakEnd: typeof value.breakEnd === "string" ? value.breakEnd : defaultWorkTemplate.breakEnd,
      breaks: normalizeBreaks(
        (value as Partial<WorkDaySchedule>).breaks,
        typeof value.breakStart === "string" ? value.breakStart : defaultWorkTemplate.breakStart,
        typeof value.breakEnd === "string" ? value.breakEnd : defaultWorkTemplate.breakEnd
      ),
      dayType:
        value.dayType === "holiday"
          ? "holiday"
          : value.dayType === "day-off"
            ? "day-off"
            : Boolean(value.enabled)
              ? "workday"
              : "day-off"
    };
  }

  return fallback;
}

export function normalizeWorkScheduleMode(input: unknown): WorkScheduleMode {
  return input === "flexible" ? "flexible" : "fixed";
}

export function getLastEnabledTemplate(schedule: WorkSchedule) {
  for (let index = workDays.length - 1; index >= 0; index -= 1) {
    const day = workDays[index];
    const item = schedule[day.key];
    if (!item?.enabled) {
      continue;
    }

    return {
      startTime: item.startTime,
      endTime: item.endTime,
      breakStart: item.breakStart,
      breakEnd: item.breakEnd,
      breaks: getDayBreaks(item)
    };
  }

  return { ...defaultWorkTemplate };
}

export function getLastTemplateFromCustomSchedule(customSchedule: CustomSchedule) {
  const lastDate = Object.keys(customSchedule)
    .sort()
    .reverse()
    .find((dateKey) => customSchedule[dateKey]?.enabled);

  if (!lastDate) {
    return { ...defaultWorkTemplate };
  }

  const item = customSchedule[lastDate];

  return {
    startTime: item.startTime,
    endTime: item.endTime,
    breakStart: item.breakStart,
    breakEnd: item.breakEnd,
    breaks: getDayBreaks(item)
  };
}

export function getDayBreaks(daySchedule: WorkDaySchedule | null | undefined) {
  if (!daySchedule) {
    return [];
  }

  return normalizeBreaks(daySchedule.breaks, daySchedule.breakStart, daySchedule.breakEnd);
}

export function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number) {
  const safe = Math.max(0, Math.min(minutes, 24 * 60 - 1));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

export function addMinutesToTime(time: string, minutesToAdd: number) {
  return minutesToTime(timeToMinutes(time) + minutesToAdd);
}

export function getDaySchedule(dateKey: string, workSchedule: WorkSchedule, customSchedule: CustomSchedule): WorkDaySchedule {
  const custom = customSchedule[dateKey];
  if (custom) {
    return custom;
  }

  const dayIndex = new Date(`${dateKey}T00:00:00`).getDay();
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  return workSchedule[dayKeys[dayIndex]];
}

export function isWithinBreak(time: string, daySchedule: WorkDaySchedule | null) {
  if (!daySchedule || !daySchedule.enabled) {
    return false;
  }

  return getDayBreaks(daySchedule).some(
    (breakRange) => time >= breakRange.startTime && time < breakRange.endTime
  );
}

export function isWithinWorkingWindow(time: string, daySchedule: WorkDaySchedule | null) {
  if (!daySchedule || !daySchedule.enabled) {
    return false;
  }

  if (time < daySchedule.startTime || time >= daySchedule.endTime) {
    return false;
  }

  return !isWithinBreak(time, daySchedule);
}

export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB);
}
