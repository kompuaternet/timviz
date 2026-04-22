const scheduleReminderPrefix = "rezervo-pro-schedule-reminder";

export function getScheduleReminderKey(professionalId: string) {
  return `${scheduleReminderPrefix}:${professionalId}`;
}

export function hasPendingScheduleReminder(professionalId: string) {
  if (typeof window === "undefined" || !professionalId) {
    return false;
  }

  return window.localStorage.getItem(getScheduleReminderKey(professionalId)) === "pending";
}

export function markScheduleReminderPending(professionalId: string) {
  if (typeof window === "undefined" || !professionalId) {
    return;
  }

  window.localStorage.setItem(getScheduleReminderKey(professionalId), "pending");
}

export function clearScheduleReminder(professionalId: string) {
  if (typeof window === "undefined" || !professionalId) {
    return;
  }

  window.localStorage.removeItem(getScheduleReminderKey(professionalId));
}
