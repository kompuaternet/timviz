import {
  getPrimaryBusinessPhoto,
  getBusinessDirectorySnapshot,
  resolveMembershipSchedule,
  type BusinessRecord,
  type ServiceRecord
} from "./pro-data";
import { getPublicCalendarAppointments } from "./pro-calendar";
import { findBusinessIdByPublicPath, getPublicBusinessPathId } from "./public-business-path";

export type PublicBusinessProfile = {
  business: BusinessRecord;
  services: ServiceRecord[];
  ownerProfessionalId: string;
  publicPathId: string;
  image: string;
  photos: string[];
  team: Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    role: string;
    scope: "owner" | "member";
    workScheduleMode: BusinessRecord["workScheduleMode"];
    workSchedule: BusinessRecord["workSchedule"];
    customSchedule: BusinessRecord["customSchedule"];
  }>;
  bookings: {
    appointmentDate: string;
    appointmentTime: string;
    endTime: string;
    serviceName: string;
    professionalId?: string;
  }[];
};

function findBusinessByToken(
  token: string,
  directory: Awaited<ReturnType<typeof getBusinessDirectorySnapshot>>
) {
  const direct = directory.businesses.find((item) => item.id === token);
  if (direct) {
    return direct;
  }

  const resolvedBusinessId = findBusinessIdByPublicPath(token, directory.businesses);
  if (resolvedBusinessId) {
    return directory.businesses.find((item) => item.id === resolvedBusinessId) ?? null;
  }

  return null;
}

function isServicePubliclyVisible(service: ServiceRecord) {
  if (service.isBlocked === true) {
    return false;
  }

  if (service.source === "custom") {
    return service.moderationStatus === "approved";
  }

  return true;
}

export async function getPublicBusinessProfile(
  businessId: string
): Promise<PublicBusinessProfile | null> {
  const directory = await getBusinessDirectorySnapshot();
  const business = findBusinessByToken(businessId, directory);

  if (!business) {
    return null;
  }

  const ownerMemberships = directory.memberships.filter(
    (membership) => membership.businessId === business.id && membership.scope === "owner"
  );
  const team = directory.memberships
    .filter((membership) => membership.businessId === business.id && membership.scope !== "pending")
    .map<{
      id: string;
      firstName: string;
      lastName: string;
        avatarUrl?: string;
        role: string;
        scope: "owner" | "member";
        workScheduleMode: BusinessRecord["workScheduleMode"];
        workSchedule: BusinessRecord["workSchedule"];
        customSchedule: BusinessRecord["customSchedule"];
      } | null>((membership) => {
      const professional = directory.professionals.find(
        (item) => item.id === membership.professionalId
      );

      if (!professional) {
        return null;
      }

      const resolvedSchedule = resolveMembershipSchedule(membership, business);

      return {
        id: professional.id,
        firstName: professional.firstName,
        lastName: professional.lastName,
        avatarUrl: professional.avatarUrl || undefined,
        role: membership.role,
        scope: membership.scope === "owner" ? "owner" : "member",
        workScheduleMode: resolvedSchedule.workScheduleMode,
        workSchedule: resolvedSchedule.workSchedule,
        customSchedule: resolvedSchedule.customSchedule
      };
    })
    .filter(
      (
        item
      ): item is {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
        role: string;
        scope: "owner" | "member";
        workScheduleMode: BusinessRecord["workScheduleMode"];
        workSchedule: BusinessRecord["workSchedule"];
        customSchedule: BusinessRecord["customSchedule"];
      } => Boolean(item)
    )
    .sort((left, right) => {
      if (left.scope !== right.scope) {
        return left.scope === "owner" ? -1 : 1;
      }

      return `${left.firstName} ${left.lastName}`.localeCompare(
        `${right.firstName} ${right.lastName}`,
        "ru"
      );
    });
  const ownerProfessionalId =
    business.ownerProfessionalId || ownerMemberships[0]?.professionalId || "";

  if (!ownerProfessionalId) {
    return null;
  }

  const services = directory.services
    .filter((service) => service.businessId === business.id)
    .filter(isServicePubliclyVisible)
    .sort(
      (left, right) =>
        (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
        left.name.localeCompare(right.name, "ru")
    );

  const appointments = await getPublicCalendarAppointments();

  return {
    business,
    services,
    ownerProfessionalId,
    publicPathId: getPublicBusinessPathId(business, directory.businesses),
    image:
      getPrimaryBusinessPhoto(business) ||
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    photos: [
      getPrimaryBusinessPhoto(business) ||
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
      ...((business.photos ?? [])
        .filter((photo) => photo.status !== "blocked")
        .map((photo) => photo.url)
        .filter(Boolean) as string[])
    ].filter((url, index, items) => items.indexOf(url) === index).slice(0, 5),
    team,
    bookings: appointments
      .filter(
        (appointment) =>
          appointment.businessId === business.id &&
          (appointment.kind === "blocked" ||
            (appointment.kind === "appointment" && appointment.attendance !== "pending"))
      )
      .map((appointment) => ({
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.startTime,
        endTime: appointment.endTime,
        serviceName: appointment.kind === "blocked" ? "blocked" : "",
        professionalId: appointment.professionalId
      }))
  };
}
