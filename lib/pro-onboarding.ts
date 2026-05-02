import type { WorkspaceSnapshot } from "./pro-data";
import type { WorkSchedule } from "./work-schedule";

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
