import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  cancelBookingFromCalendarAppointment,
  updateBookingStatus,
  getBookingsForSalonSlug,
  syncBookingStatusFromCalendarAppointment,
  type BookingRecord,
  type BookingStatus
} from "../../../../lib/bookings";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import { getJoinRequestsForOwner } from "../../../../lib/pro-data";
import {
  resetTelegramReminderEventsForAppointment,
  sendBookingCancelledTelegramNotification,
  sendBookingRescheduledTelegramNotification,
  sendCabinetBookingTelegramNotification
} from "../../../../lib/telegram-bot";
import {
  createBlockedCalendarTime,
  createCalendarAppointment,
  createCalendarAppointmentsBatch,
  deleteCalendarAppointment,
  getAppointmentsForBusiness,
  getCalendarNotificationsContext,
  getCalendarDaySnapshot,
  updateCalendarAppointmentMeta,
  updateCalendarAppointmentTime
} from "../../../../lib/pro-calendar";

type CalendarRouteAppointment = {
  id: string;
  professionalId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  kind: "appointment" | "blocked";
  customerName: string;
  customerPhone: string;
  serviceName: string;
  notes: string;
  attendance: "pending" | "confirmed" | "arrived" | "no_show";
  priceAmount: number;
};

type CalendarRouteSnapshot = Awaited<ReturnType<typeof getCalendarDaySnapshot>> & {
  pendingOnlineBookings?: Array<Record<string, string>>;
  archivedOnlineBookings?: Array<Record<string, string>>;
  pendingJoinRequests?: Array<Record<string, string>>;
};

type CalendarRouteTeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

type PendingBookingSyncPayload = {
  businessId: string;
  appointmentDate: string;
  appointmentTime: string;
  previousAppointmentTime?: string;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  previousCustomerName?: string;
  previousCustomerPhone?: string;
  serviceName: string;
  attendance: "pending" | "confirmed" | "arrived" | "no_show";
};

function mapBookingStatusForNotification(status: BookingStatus) {
  return status === "pending" ? "pending" : status === "cancelled" ? "cancelled" : "confirmed";
}

function mapAttendanceToNotificationStatus(attendance: string) {
  return attendance === "pending" ? "pending" : "confirmed";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

function parseAppointmentTimestamp(date: string, time: string) {
  if (!date || !time) {
    return Number.NaN;
  }

  const timestamp = new Date(`${date}T${time}:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function normalizedTimeValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickMatchingAppointment(
  appointments: Array<CalendarRouteAppointment & { professionalName: string }>,
  booking: BookingRecord
) {
  const normalizedPhone = booking.customerPhone.trim();
  const normalizedName = booking.customerName.trim().toLowerCase();
  const normalizedService = booking.serviceName.trim().toLowerCase();
  const exactScoped = appointments.filter(
    (item) =>
      item.kind === "appointment" &&
      item.appointmentDate === booking.appointmentDate &&
      item.startTime === booking.appointmentTime
  );
  const sameDateScoped = appointments.filter(
    (item) =>
      item.kind === "appointment" &&
      item.appointmentDate === booking.appointmentDate
  );

  const bookingMinutes = timeToMinutes(booking.appointmentTime);
  const rankedSameDateMatches = sameDateScoped
    .map((item) => {
      const phoneMatches = !!normalizedPhone && item.customerPhone.trim() === normalizedPhone;
      const nameMatches = item.customerName.trim().toLowerCase() === normalizedName;
      const serviceMatches = item.serviceName.trim().toLowerCase() === normalizedService;
      const itemMinutes = timeToMinutes(item.startTime);
      const timeDistance =
        Number.isFinite(bookingMinutes) && Number.isFinite(itemMinutes)
          ? Math.abs(itemMinutes - bookingMinutes)
          : 9999;
      let score = 0;

      if (phoneMatches) score += 100;
      if (nameMatches) score += 60;
      if (serviceMatches) score += 40;
      if (item.startTime === booking.appointmentTime) score += 30;
      score -= Math.min(timeDistance, 12 * 60) / 10;

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return rankedSameDateMatches[0]?.item ?? exactScoped[0] ?? sameDateScoped[0] ?? null;
}

async function getOnlineBookingNotifications(input: {
  businessId: string;
  teamMembers: CalendarRouteTeamMember[];
  viewerProfessionalId: string;
}) {
  const businessId = input.businessId;

  if (!businessId) {
    return {
      pendingOnlineBookings: [],
      archivedOnlineBookings: [],
      pendingJoinRequests: []
    };
  }

  const bookings = await getBookingsForSalonSlug(`business:${businessId}`);
  const memberNameMap = new Map(
    input.teamMembers.map((member) => [
      member.id,
      `${member.firstName} ${member.lastName}`.trim() || member.role
    ])
  );
  const businessAppointments = await getAppointmentsForBusiness(businessId);
  const appointmentPool = businessAppointments.map((appointment) => ({
      ...appointment,
      professionalName: memberNameMap.get(appointment.professionalId) ?? ""
    }));

  const mismatchedPendingBookings: PendingBookingSyncPayload[] = [];
  const orphanedPendingBookingIds: string[] = [];
  const now = Date.now();
  const orphanGraceMs = 2 * 60 * 1000;

  const notifications = bookings
    .map((booking) => {
      const appointment = pickMatchingAppointment(appointmentPool, booking);
      const hasDriftedFromBooking =
        !!appointment &&
        appointment.kind === "appointment" &&
        (
          appointment.startTime !== booking.appointmentTime ||
          appointment.serviceName.trim() !== booking.serviceName.trim() ||
          appointment.customerName.trim() !== booking.customerName.trim() ||
          appointment.customerPhone.trim() !== booking.customerPhone.trim()
        );
      const bookingCreatedAt = new Date(booking.createdAt).getTime();
      const bookingScheduledAt = parseAppointmentTimestamp(booking.appointmentDate, booking.appointmentTime);
      const shouldArchiveAsOrphan =
        booking.status === "pending" &&
        !appointment &&
        (
          (Number.isFinite(bookingCreatedAt) && now - bookingCreatedAt > orphanGraceMs) ||
          (Number.isFinite(bookingScheduledAt) && bookingScheduledAt < now - orphanGraceMs)
        );
      const effectiveStatus =
        shouldArchiveAsOrphan
          ? "cancelled"
          : booking.status === "pending" && appointment
          ? mapAttendanceToNotificationStatus(appointment.attendance)
          : mapBookingStatusForNotification(booking.status);

      if (shouldArchiveAsOrphan) {
        orphanedPendingBookingIds.push(booking.id);
      }

      if (
        booking.status === "pending" &&
        appointment?.kind === "appointment" &&
        (effectiveStatus !== "pending" || hasDriftedFromBooking)
      ) {
        mismatchedPendingBookings.push({
          businessId,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.startTime,
          previousAppointmentTime: hasDriftedFromBooking ? booking.appointmentTime : undefined,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          customerNotes: appointment.notes,
          previousCustomerName: hasDriftedFromBooking ? booking.customerName : undefined,
          previousCustomerPhone: hasDriftedFromBooking ? booking.customerPhone : undefined,
          serviceName: appointment.serviceName,
          attendance: appointment.attendance
        });
      }

      return {
        id: booking.id,
        bookingId: booking.id,
        appointmentId: appointment?.id ?? "",
        appointmentDate: booking.appointmentDate,
        startTime: booking.appointmentTime,
        endTime: appointment?.endTime ?? "",
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        serviceName: booking.serviceName,
        professionalId: appointment?.professionalId ?? "",
        professionalName: appointment?.professionalName ?? "",
        createdAt: booking.createdAt,
        status: effectiveStatus
      };
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  if (mismatchedPendingBookings.length) {
    await Promise.allSettled(
      mismatchedPendingBookings.map((item) =>
        syncBookingStatusFromCalendarAppointment({
          businessId: item.businessId,
          appointmentDate: item.appointmentDate,
          appointmentTime: item.appointmentTime,
          previousAppointmentTime: item.previousAppointmentTime,
          customerName: item.customerName,
          customerPhone: item.customerPhone,
          customerNotes: item.customerNotes,
          previousCustomerName: item.previousCustomerName,
          previousCustomerPhone: item.previousCustomerPhone,
          serviceName: item.serviceName,
          attendance: item.attendance
        })
      )
    );
  }

  if (orphanedPendingBookingIds.length) {
    await Promise.allSettled(
      orphanedPendingBookingIds.map((id) => updateBookingStatus(id, "cancelled"))
    );
  }

  const joinRequests = await getJoinRequestsForOwner(input.viewerProfessionalId).catch(() => []);
  const pendingJoinRequests = joinRequests
    .filter((item) => item.status === "pending" && !item.viewedAt)
    .map((request) => ({
      id: request.id,
      createdAt: request.createdAt,
      role: request.role,
      professionalId: request.professionalId,
      professionalName:
        request.professional
          ? `${request.professional.firstName} ${request.professional.lastName}`.trim() ||
            request.professional.email ||
            request.professional.phone
          : ""
    }));

  return {
    pendingOnlineBookings: notifications.filter((item) => item.status === "pending"),
    archivedOnlineBookings: notifications.filter((item) => item.status !== "pending").slice(0, 12),
    pendingJoinRequests
  };
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const appointmentDate = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const targetProfessionalId = url.searchParams.get("targetProfessionalId") || undefined;
    const mode = url.searchParams.get("mode");

    if (mode === "notifications") {
      const context = await getCalendarNotificationsContext({ professionalId });
      const notifications = await getOnlineBookingNotifications({
        ...context,
        viewerProfessionalId: professionalId
      });
      return NextResponse.json(notifications);
    }

    const result = await getCalendarDaySnapshot({ professionalId, appointmentDate, targetProfessionalId });
    const notifications = await getOnlineBookingNotifications({
      businessId: result.workspace.business.id,
      teamMembers: result.teamMembers,
      viewerProfessionalId: professionalId
    });
    const decoratedResult: CalendarRouteSnapshot = {
      ...(result as CalendarRouteSnapshot),
      ...notifications
    };

    return NextResponse.json(decoratedResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load calendar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.kind === "blocked") {
      const blocked = await createBlockedCalendarTime({
        professionalId,
        targetProfessionalId: body.targetProfessionalId,
        appointmentDate: body.appointmentDate,
        startTime: body.startTime,
        endTime: body.endTime,
        serviceName: body.serviceName
      });

      return NextResponse.json(blocked);
    }

    if (Array.isArray(body.items) && body.items.length > 0) {
      const appointments = await createCalendarAppointmentsBatch({
        professionalId,
        targetProfessionalId: body.targetProfessionalId,
        items: body.items.map((item: Record<string, unknown>) => ({
          appointmentDate: typeof item.appointmentDate === "string" ? item.appointmentDate : body.appointmentDate,
          startTime: typeof item.startTime === "string" ? item.startTime : "",
          endTime: typeof item.endTime === "string" ? item.endTime : undefined,
          customerName: typeof item.customerName === "string" ? item.customerName : "",
          customerPhone: typeof item.customerPhone === "string" ? item.customerPhone : "",
          serviceName: typeof item.serviceName === "string" ? item.serviceName : "",
          notes: typeof item.notes === "string" ? item.notes : "",
          priceAmount: typeof item.priceAmount === "number" ? item.priceAmount : undefined,
          attendance:
            item.attendance === "pending" ||
            item.attendance === "confirmed" ||
            item.attendance === "arrived" ||
            item.attendance === "no_show"
              ? item.attendance
              : undefined
        }))
      });

      await Promise.allSettled(
        appointments
          .filter((item) => item.kind === "appointment")
          .map((item) =>
            sendCabinetBookingTelegramNotification({
              professionalId: item.professionalId,
              businessId: item.businessId,
              appointmentId: item.id,
              appointmentDate: item.appointmentDate,
              appointmentTime: item.startTime,
              customerName: item.customerName,
              serviceName: item.serviceName
            })
          )
      );

      return NextResponse.json({ appointments });
    }

    const appointment = await createCalendarAppointment({
      professionalId,
      targetProfessionalId: body.targetProfessionalId,
      appointmentDate: body.appointmentDate,
      startTime: body.startTime,
      endTime: body.endTime,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      serviceName: body.serviceName,
      notes: body.notes ?? "",
      priceAmount: typeof body.priceAmount === "number" ? body.priceAmount : undefined,
      attendance: body.attendance
    });

    await sendCabinetBookingTelegramNotification({
      professionalId: appointment.professionalId,
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.startTime,
      customerName: appointment.customerName,
      serviceName: appointment.serviceName
    }).catch(() => undefined);

    return NextResponse.json(appointment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create appointment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId") || "";
    const targetProfessionalId = searchParams.get("targetProfessionalId") || undefined;
    const deletedAppointment = await deleteCalendarAppointment({ professionalId, targetProfessionalId, appointmentId });

    if (deletedAppointment.kind === "appointment") {
      await cancelBookingFromCalendarAppointment({
        businessId: deletedAppointment.businessId,
        appointmentDate: deletedAppointment.appointmentDate,
        appointmentTime: deletedAppointment.startTime,
        customerName: deletedAppointment.customerName,
        customerPhone: deletedAppointment.customerPhone,
        customerNotes: deletedAppointment.notes,
        serviceName: deletedAppointment.serviceName
      });

      await resetTelegramReminderEventsForAppointment({
        appointmentId: deletedAppointment.id,
        professionalId: deletedAppointment.professionalId
      }).catch(() => undefined);

      await sendBookingCancelledTelegramNotification({
        professionalId: deletedAppointment.professionalId,
        businessId: deletedAppointment.businessId,
        appointmentId: deletedAppointment.id,
        appointmentDate: deletedAppointment.appointmentDate,
        appointmentTime: deletedAppointment.startTime,
        customerName: deletedAppointment.customerName,
        serviceName: deletedAppointment.serviceName
      }).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, appointmentId: deletedAppointment.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete appointment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.mode === "meta") {
      const appointment = await updateCalendarAppointmentMeta({
        professionalId,
        targetProfessionalId: body.targetProfessionalId,
        appointmentId: body.appointmentId,
        attendance: body.attendance,
        priceAmount: Number(body.priceAmount ?? 0),
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        startTime: body.startTime,
        endTime: body.endTime,
        serviceName: body.serviceName,
        notes: body.notes
      });

      if (appointment.kind === "appointment") {
        await syncBookingStatusFromCalendarAppointment({
          businessId: appointment.businessId,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.startTime,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          customerNotes: appointment.notes,
          previousCustomerName: body.previousCustomerName,
          previousCustomerPhone: body.previousCustomerPhone,
          previousAppointmentTime: body.previousAppointmentTime,
          serviceName: appointment.serviceName,
          attendance: appointment.attendance
        });

        const previousAppointmentTime = normalizedTimeValue(body.previousAppointmentTime);
        const previousAppointmentDate =
          normalizedTimeValue(body.previousAppointmentDate) || appointment.appointmentDate;
        const hasScheduleChanged =
          !!previousAppointmentTime &&
          (
            previousAppointmentTime !== appointment.startTime ||
            previousAppointmentDate !== appointment.appointmentDate
          );

        if (hasScheduleChanged) {
          await resetTelegramReminderEventsForAppointment({
            appointmentId: appointment.id,
            professionalId: appointment.professionalId
          }).catch(() => undefined);

          await sendBookingRescheduledTelegramNotification({
            professionalId: appointment.professionalId,
            businessId: appointment.businessId,
            appointmentId: appointment.id,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.startTime,
            previousAppointmentDate,
            previousAppointmentTime,
            customerName: appointment.customerName,
            serviceName: appointment.serviceName
          }).catch(() => undefined);
        }
      }

      return NextResponse.json(appointment);
    }

    const previousAppointmentTime = normalizedTimeValue(body.previousAppointmentTime);
    const previousAppointmentDate = normalizedTimeValue(body.previousAppointmentDate);
    const appointment = await updateCalendarAppointmentTime({
      professionalId,
      targetProfessionalId: body.targetProfessionalId,
      appointmentId: body.appointmentId,
      startTime: body.startTime,
      endTime: body.endTime
    });

    if (appointment.kind === "appointment") {
      await syncBookingStatusFromCalendarAppointment({
        businessId: appointment.businessId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.startTime,
        previousAppointmentTime,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        customerNotes: appointment.notes,
        serviceName: appointment.serviceName,
        attendance: appointment.attendance
      });

      const hasScheduleChanged =
        !!previousAppointmentTime &&
        (
          previousAppointmentTime !== appointment.startTime ||
          (!!previousAppointmentDate && previousAppointmentDate !== appointment.appointmentDate)
        );

      if (hasScheduleChanged) {
        await resetTelegramReminderEventsForAppointment({
          appointmentId: appointment.id,
          professionalId: appointment.professionalId
        }).catch(() => undefined);

        await sendBookingRescheduledTelegramNotification({
          professionalId: appointment.professionalId,
          businessId: appointment.businessId,
          appointmentId: appointment.id,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.startTime,
          previousAppointmentDate: previousAppointmentDate || appointment.appointmentDate,
          previousAppointmentTime,
          customerName: appointment.customerName,
          serviceName: appointment.serviceName
        }).catch(() => undefined);
      }
    }

    return NextResponse.json(appointment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move appointment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
