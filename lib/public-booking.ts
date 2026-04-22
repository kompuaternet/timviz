import {
  addMinutesToTime,
  getDayBreaks,
  getDaySchedule,
  normalizeCustomSchedule,
  normalizeWorkSchedule,
  timeRangesOverlap,
  timeToMinutes,
  minutesToTime,
  type CustomSchedule,
  type WorkSchedule
} from "./work-schedule";

export type PublicBookableService = {
  name: string;
  durationMinutes: number;
};

export type PublicBookingEntry = {
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
};

export type PublicBookingConfig = {
  workSchedule: WorkSchedule;
  customSchedule?: CustomSchedule;
  bookingIntervalMinutes?: number;
  services: PublicBookableService[];
};

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getServiceDuration(services: PublicBookableService[], serviceName: string) {
  return services.find((service) => service.name === serviceName)?.durationMinutes ?? 60;
}

export function getPublicBookingSlots(input: {
  config: PublicBookingConfig;
  date: string;
  serviceName: string;
  bookings?: PublicBookingEntry[];
}) {
  if (!input.date.trim()) {
    return [];
  }

  const workSchedule = normalizeWorkSchedule(input.config.workSchedule);
  const customSchedule = normalizeCustomSchedule(input.config.customSchedule);
  const daySchedule = getDaySchedule(input.date, workSchedule, customSchedule);

  if (!daySchedule?.enabled) {
    return [];
  }

  const interval = Math.max(5, input.config.bookingIntervalMinutes ?? 15);
  const duration = getServiceDuration(input.config.services, input.serviceName);
  const dayStart = timeToMinutes(daySchedule.startTime);
  const dayEnd = timeToMinutes(daySchedule.endTime);
  const breaks = getDayBreaks(daySchedule);
  const busyRanges = (input.bookings ?? [])
    .filter((booking) => booking.appointmentDate === input.date)
    .map((booking) => {
      const start = booking.appointmentTime;
      const end = addMinutesToTime(start, getServiceDuration(input.config.services, booking.serviceName));
      return { start, end };
    });

  const slots: string[] = [];

  for (let minutes = dayStart; minutes + duration <= dayEnd; minutes += interval) {
    const start = minutesToTime(minutes);
    const end = minutesToTime(minutes + duration);

    if (breaks.some((breakItem) => timeRangesOverlap(start, end, breakItem.startTime, breakItem.endTime))) {
      continue;
    }

    if (busyRanges.some((range) => timeRangesOverlap(start, end, range.start, range.end))) {
      continue;
    }

    slots.push(start);
  }

  return slots;
}

export function findNextPublicBookingDate(input: {
  config: PublicBookingConfig;
  serviceName: string;
  bookings?: PublicBookingEntry[];
  startDate: string;
  horizonDays?: number;
}) {
  const horizonDays = Math.max(1, input.horizonDays ?? 45);
  const start = new Date(`${input.startDate}T00:00:00`);

  for (let offset = 0; offset < horizonDays; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const dateKey = formatDateKey(date);

    if (
      getPublicBookingSlots({
        config: input.config,
        date: dateKey,
        serviceName: input.serviceName,
        bookings: input.bookings
      }).length > 0
    ) {
      return dateKey;
    }
  }

  return input.startDate;
}
