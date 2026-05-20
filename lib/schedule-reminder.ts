const scheduleReminderPrefix = "rezervo-pro-schedule-reminder";

export function getScheduleReminderKey(professionalId: string) {
  return `${scheduleReminderPrefix}:${professionalId}`;
}

function getSafeLocalStorage() {
  if (typeof window === "undefined") return undefined;

  try {
    const storage = window.localStorage;
    return typeof storage?.getItem === "function" ? storage : undefined;
  } catch {
    return undefined;
  }
}

export function hasPendingScheduleReminder(professionalId: string) {
  if (typeof window === "undefined" || !professionalId) {
    return false;
  }

  return getSafeLocalStorage()?.getItem(getScheduleReminderKey(professionalId)) === "pending";
}

export function markScheduleReminderPending(professionalId: string) {
  if (typeof window === "undefined" || !professionalId) {
    return;
  }

  try {
    getSafeLocalStorage()?.setItem(getScheduleReminderKey(professionalId), "pending");
  } catch {
    // A missing storage backend should not block onboarding.
  }
}

export function clearScheduleReminder(professionalId: string) {
  if (typeof window === "undefined" || !professionalId) {
    return;
  }

  try {
    getSafeLocalStorage()?.removeItem(getScheduleReminderKey(professionalId));
  } catch {
    // A missing storage backend should not block onboarding.
  }
}
