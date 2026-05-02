import type { WorkspaceSnapshot } from "./pro-data";
import type { WorkSchedule } from "./work-schedule";

export type OnboardingStepId =
  | "services"
  | "schedule"
  | "booking"
  | "photo"
  | "telegram";

export type OnboardingCtaState = {
  completed: boolean;
  step: OnboardingStepId | null;
  href: string | null;
};

function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function hasWorkingHoursConfigured(schedule: WorkSchedule | undefined) {
  if (!schedule) {
    return false;
  }

  return Object.values(schedule).some((day) => {
    if (!day?.enabled) {
      return false;
    }

    if (!day.startTime || !day.endTime) {
      return false;
    }

    return timeToMinutes(day.endTime) > timeToMinutes(day.startTime);
  });
}

export function isWorkspaceSetupComplete(
  workspace: WorkspaceSnapshot,
  telegramConnected: boolean
) {
  const hasAddress = Boolean(
    workspace.business.address.trim() || workspace.business.addressDetails.trim()
  );

  const servicesReady = workspace.services.some(
    (service) =>
      Number.isFinite(service.price) &&
      service.price > 0 &&
      Number.isFinite(service.durationMinutes ?? Number.NaN) &&
      (service.durationMinutes ?? 0) > 0
  );

  const scheduleReady = hasWorkingHoursConfigured(
    workspace.membership.scope === "owner"
      ? workspace.business.workSchedule
      : workspace.memberSchedule.workSchedule
  );

  const bookingReady = workspace.business.allowOnlineBooking === true;
  const photoReady = (workspace.business.photos ?? []).some(
    (photo) => photo.status !== "blocked" && photo.url.trim().length > 0
  );

  return (
    servicesReady &&
    scheduleReady &&
    bookingReady &&
    photoReady &&
    hasAddress &&
    telegramConnected
  );
}

export function getOnboardingCtaState(
  workspace: WorkspaceSnapshot,
  telegramConnected: boolean
): OnboardingCtaState {
  const servicesReady = workspace.services.some(
    (service) =>
      Number.isFinite(service.price) &&
      service.price > 0 &&
      Number.isFinite(service.durationMinutes ?? Number.NaN) &&
      (service.durationMinutes ?? 0) > 0
  );

  if (!servicesReady) {
    return {
      completed: false,
      step: "services",
      href: "/pro/services"
    };
  }

  const scheduleReady = hasWorkingHoursConfigured(
    workspace.membership.scope === "owner"
      ? workspace.business.workSchedule
      : workspace.memberSchedule.workSchedule
  );

  if (!scheduleReady) {
    return {
      completed: false,
      step: "schedule",
      href: workspace.membership.scope === "owner" ? "/pro/staff/schedule" : "/pro/schedule"
    };
  }

  if (workspace.business.allowOnlineBooking !== true) {
    return {
      completed: false,
      step: "booking",
      href: "/pro/settings?section=online-booking"
    };
  }

  const photoReady = (workspace.business.photos ?? []).some(
    (photo) => photo.status !== "blocked" && photo.url.trim().length > 0
  );

  if (!photoReady) {
    return {
      completed: false,
      step: "photo",
      href: "/pro/settings?section=services"
    };
  }

  if (!telegramConnected) {
    return {
      completed: false,
      step: "telegram",
      href: "/pro/settings?section=telegram"
    };
  }

  return {
    completed: true,
    step: null,
    href: null
  };
}
