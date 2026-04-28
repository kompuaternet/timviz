import {
  getAppointmentsForBusiness,
  type CalendarAppointment,
  type CalendarAttendanceStatus
} from "./pro-calendar";
import {
  getBusinessDirectorySnapshot,
  getJoinRequestsForOwner,
  getWorkspaceSnapshot,
  type ProfessionalRecord
} from "./pro-data";

export type StaffMemberSource = "owner" | "join_request" | "email_invitation" | "member";

export type StaffMemberSnapshot = {
  professional: Pick<
    ProfessionalRecord,
    "id" | "firstName" | "lastName" | "email" | "phone" | "language" | "createdAt" | "avatarUrl"
  >;
  membership: {
    id: string;
    role: string;
    scope: "owner" | "member";
    createdAt: string;
  };
  source: StaffMemberSource;
  services: string[];
  createdServices: string[];
  performedServices: string[];
  visibleBusinessServicesCount: number;
  stats: {
    totalBookings: number;
    monthBookings: number;
    upcomingBookings: number;
    completedBookings: number;
    revenue: number;
    lastBookingAt: string | null;
    nextBookingAt: string | null;
  };
  recentAppointments: Array<{
    id: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    customerName: string;
    serviceName: string;
    attendance: CalendarAttendanceStatus;
    priceAmount: number;
  }>;
};

export type PendingStaffJoinRequestSnapshot = {
  id: string;
  role: string;
  createdAt: string;
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
};

export type PendingStaffInvitationSnapshot = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  invitedProfessional: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type BusinessStaffSnapshot = {
  business: {
    id: string;
    name: string;
    categories: string[];
    accountType: "solo" | "team";
    currency: string;
  };
  summary: {
    totalPeople: number;
    activeEmployees: number;
    pendingRequests: number;
    pendingInvitations: number;
    monthBookings: number;
    monthRevenue: number;
  };
  services: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  members: StaffMemberSnapshot[];
  joinRequests: PendingStaffJoinRequestSnapshot[];
  invitations: PendingStaffInvitationSnapshot[];
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function isUpcomingAppointment(appointment: CalendarAppointment, nowDate: string, nowTime: string) {
  return (
    appointment.kind === "appointment" &&
    (appointment.appointmentDate > nowDate ||
      (appointment.appointmentDate === nowDate && appointment.startTime >= nowTime))
  );
}

function compareAppointmentDesc(left: CalendarAppointment, right: CalendarAppointment) {
  return `${right.appointmentDate}${right.startTime}${right.createdAt}`.localeCompare(
    `${left.appointmentDate}${left.startTime}${left.createdAt}`
  );
}

export async function getBusinessStaffSnapshot(ownerProfessionalId: string): Promise<BusinessStaffSnapshot | null> {
  const workspace = await getWorkspaceSnapshot(ownerProfessionalId);

  if (!workspace || workspace.membership.scope !== "owner") {
    return null;
  }

  const [directory, joinRequests, appointments] = await Promise.all([
    getBusinessDirectorySnapshot(),
    getJoinRequestsForOwner(ownerProfessionalId),
    getAppointmentsForBusiness(workspace.business.id)
  ]);

  const businessServices = directory.services
    .filter((item) => item.businessId === workspace.business.id && item.isBlocked !== true)
    .sort((left, right) => {
      const orderDiff = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
      return orderDiff || left.createdAt.localeCompare(right.createdAt);
    });
  const activeMemberships = directory.memberships.filter(
    (item) => item.businessId === workspace.business.id && item.scope !== "pending"
  );
  const now = new Date();
  const nowDate = now.toISOString().slice(0, 10);
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const monthPrefix = nowDate.slice(0, 7);

  const members: StaffMemberSnapshot[] = activeMemberships
    .map<StaffMemberSnapshot | null>((membership) => {
      const professional = directory.professionals.find((item) => item.id === membership.professionalId);

      if (!professional) {
        return null;
      }

      const memberAppointments = appointments
        .filter(
          (appointment) =>
            appointment.professionalId === professional.id && appointment.kind === "appointment"
        )
        .sort(compareAppointmentDesc);
      const createdServices = uniqueValues(
        businessServices
          .filter((service) => service.createdByProfessionalId === professional.id)
          .map((service) => service.name)
      );
      const performedServices = uniqueValues(
        memberAppointments.map((appointment) => appointment.serviceName.trim())
      );
      const acceptedInvitation = directory.staffInvitations.find(
        (item) =>
          item.businessId === workspace.business.id &&
          item.acceptedProfessionalId === professional.id &&
          item.status === "accepted"
      );
      const approvedJoinRequest = directory.joinRequests.find(
        (item) =>
          item.businessId === workspace.business.id &&
          item.professionalId === professional.id &&
          item.status === "approved"
      );
      const services = uniqueValues([...performedServices, ...createdServices]);
      const upcomingAppointments = memberAppointments.filter((appointment) =>
        isUpcomingAppointment(appointment, nowDate, nowTime)
      );
      const completedAppointments = memberAppointments.filter(
        (appointment) => appointment.attendance !== "pending"
      );
      const monthAppointments = memberAppointments.filter((appointment) =>
        appointment.appointmentDate.startsWith(monthPrefix)
      );
      const source: StaffMemberSource =
        membership.scope === "owner"
          ? "owner"
          : acceptedInvitation
            ? "email_invitation"
            : approvedJoinRequest
              ? "join_request"
              : "member";

      return {
        professional: {
          id: professional.id,
          firstName: professional.firstName,
          lastName: professional.lastName,
          email: professional.email,
          phone: professional.phone,
          language: professional.language,
          avatarUrl: professional.avatarUrl,
          createdAt: professional.createdAt
        },
        membership: {
          id: membership.id,
          role: membership.role,
          scope: membership.scope === "owner" ? "owner" : "member",
          createdAt: membership.createdAt
        },
        source,
        services,
        createdServices,
        performedServices,
        visibleBusinessServicesCount: businessServices.length,
        stats: {
          totalBookings: memberAppointments.length,
          monthBookings: monthAppointments.length,
          upcomingBookings: upcomingAppointments.length,
          completedBookings: completedAppointments.length,
          revenue: completedAppointments.reduce((sum, appointment) => sum + (appointment.priceAmount || 0), 0),
          lastBookingAt:
            memberAppointments.length > 0
              ? `${memberAppointments[0].appointmentDate}T${memberAppointments[0].startTime}`
              : null,
          nextBookingAt:
            upcomingAppointments.length > 0
              ? `${upcomingAppointments[upcomingAppointments.length - 1].appointmentDate}T${upcomingAppointments[upcomingAppointments.length - 1].startTime}`
              : null
        },
        recentAppointments: memberAppointments.slice(0, 4).map((appointment) => ({
          id: appointment.id,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          customerName: appointment.customerName,
          serviceName: appointment.serviceName,
          attendance: appointment.attendance,
          priceAmount: appointment.priceAmount
        }))
      };
    })
    .filter((item): item is StaffMemberSnapshot => item !== null)
    .sort((left, right) => {
      if (left.membership.scope !== right.membership.scope) {
        return left.membership.scope === "owner" ? -1 : 1;
      }

      return `${left.professional.firstName} ${left.professional.lastName}`.localeCompare(
        `${right.professional.firstName} ${right.professional.lastName}`,
        "ru"
      );
    });

  const pendingInvitations = directory.staffInvitations
    .filter((item) => item.businessId === workspace.business.id && item.status === "pending")
    .map((invitation) => {
      const invitedProfessional =
        directory.professionals.find((item) => item.email.trim().toLowerCase() === invitation.email) || null;

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        createdAt: invitation.createdAt,
        invitedProfessional: invitedProfessional
          ? {
              id: invitedProfessional.id,
              firstName: invitedProfessional.firstName,
              lastName: invitedProfessional.lastName
            }
          : null
      } satisfies PendingStaffInvitationSnapshot;
    });

  const monthAppointments = appointments.filter(
    (appointment) => appointment.kind === "appointment" && appointment.appointmentDate.startsWith(monthPrefix)
  );
  const completedMonthAppointments = monthAppointments.filter(
    (appointment) => appointment.attendance !== "pending"
  );

  return {
    business: {
      id: workspace.business.id,
      name: workspace.business.name,
      categories: workspace.business.categories,
      accountType: workspace.business.accountType,
      currency: workspace.professional.currency || "USD"
    },
    summary: {
      totalPeople: members.length,
      activeEmployees: members.filter((member) => member.membership.scope !== "owner").length,
      pendingRequests: joinRequests.length,
      pendingInvitations: pendingInvitations.length,
      monthBookings: monthAppointments.length,
      monthRevenue: completedMonthAppointments.reduce(
        (sum, appointment) => sum + (appointment.priceAmount || 0),
        0
      )
    },
    services: businessServices.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category || "Без категории"
    })),
    members,
    joinRequests: joinRequests.map((request) => ({
      id: request.id,
      role: request.role,
      createdAt: request.createdAt,
      professional: request.professional
        ? {
            id: request.professional.id,
            firstName: request.professional.firstName,
            lastName: request.professional.lastName,
            email: request.professional.email,
            phone: request.professional.phone
          }
        : null
    })),
    invitations: pendingInvitations
  };
}
