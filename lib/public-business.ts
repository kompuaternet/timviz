import {
  getPrimaryBusinessPhoto,
  getBusinessDirectorySnapshot,
  type BusinessRecord,
  type ServiceRecord
} from "./pro-data";
import { getPublicCalendarAppointments } from "./pro-calendar";

export type PublicBusinessProfile = {
  business: BusinessRecord;
  services: ServiceRecord[];
  ownerProfessionalId: string;
  image: string;
  bookings: {
    appointmentDate: string;
    appointmentTime: string;
    serviceName: string;
  }[];
};

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
  const business = directory.businesses.find((item) => item.id === businessId);

  if (!business) {
    return null;
  }

  const ownerMemberships = directory.memberships.filter(
    (membership) => membership.businessId === business.id && membership.scope === "owner"
  );
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
    image:
      getPrimaryBusinessPhoto(business) ||
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
    bookings: appointments
      .filter(
        (appointment) =>
          appointment.businessId === business.id &&
          appointment.professionalId === ownerProfessionalId &&
          appointment.kind === "appointment"
      )
      .map((appointment) => ({
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.startTime,
        serviceName: ""
      }))
  };
}
