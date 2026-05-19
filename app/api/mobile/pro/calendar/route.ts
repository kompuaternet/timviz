import { NextResponse } from "next/server";
import { createApiTimer } from "../../../../../lib/api-timing";
import { getMobileProfessionalId } from "../_auth";
import {
  createBlockedCalendarTime,
  createCalendarAppointment,
  createCalendarAppointmentsBatch,
  deleteCalendarAppointment,
  getAppointmentsForBusinessDates,
  getCalendarNotificationsContext,
  getCalendarDaySnapshot,
  getCalendarRangeSnapshots,
  updateCalendarAppointmentMeta,
  updateCalendarAppointmentTime
} from "../../../../../lib/pro-calendar";
import {
  cancelBookingFromCalendarAppointment,
  getNotificationBookingsForSalonSlug,
  syncBookingStatusFromCalendarAppointment
} from "../../../../../lib/bookings";
import { getAppNotificationsForProfessional } from "../../../../../lib/app-notifications";
import { getJoinRequestsForOwner } from "../../../../../lib/pro-data";
import {
  resetTelegramReminderEventsForAppointment,
  sendBookingCancelledTelegramNotification,
  sendBookingRescheduledTelegramNotification,
  sendCabinetBookingTelegramNotification
} from "../../../../../lib/telegram-bot";
import {
  resetPushReminderEventsForAppointment,
  sendBookingCancelledPushNotification,
  sendBookingRescheduledPushNotification,
  sendCabinetBookingPushNotification
} from "../../../../../lib/push-notifications";

function normalizedTimeValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapBookingStatusForNotification(status: string) {
  return status === "pending" ? "pending" : status === "cancelled" ? "cancelled" : "confirmed";
}

function mapAttendanceToNotificationStatus(attendance: string) {
  return attendance === "pending" ? "pending" : "confirmed";
}

function parseCalendarDateList(value: string | null) {
  if (!value) return [];
  const seen = new Set<string>();
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 120);
}

async function getMobileOnlineBookingNotifications(professionalId: string) {
  const appNotificationsPromise = getAppNotificationsForProfessional(professionalId, { limit: 40 }).catch(() => []);
  const context = await getCalendarNotificationsContext({ professionalId });
  const businessId = context.businessId;
  if (!businessId) {
    return {
      pendingOnlineBookings: [],
      archivedOnlineBookings: [],
      pendingJoinRequests: [],
      appNotifications: await appNotificationsPromise
    };
  }

  const bookings = await getNotificationBookingsForSalonSlug(`business:${businessId}`);
  const memberNameMap = new Map(
    context.teamMembers.map((member) => [
      member.id,
      `${member.firstName} ${member.lastName}`.trim() || member.role
    ])
  );
  const businessAppointments = await getAppointmentsForBusinessDates(
    businessId,
    bookings.map((booking) => booking.appointmentDate)
  );
  const appointmentPool = businessAppointments.map((appointment) => ({
    ...appointment,
    professionalName: memberNameMap.get(appointment.professionalId) ?? ""
  }));

  const notifications = bookings
    .map((booking) => {
      const appointment =
        appointmentPool.find(
          (item) =>
            item.kind === "appointment" &&
            item.appointmentDate === booking.appointmentDate &&
            item.startTime === booking.appointmentTime &&
            item.customerName.trim().toLowerCase() === booking.customerName.trim().toLowerCase()
        ) ||
        appointmentPool.find(
          (item) =>
            item.kind === "appointment" &&
            item.appointmentDate === booking.appointmentDate &&
            item.startTime === booking.appointmentTime
        );
      const status =
        booking.status === "pending" && appointment?.kind === "appointment"
          ? mapAttendanceToNotificationStatus(appointment.attendance)
          : mapBookingStatusForNotification(booking.status);

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
        status
      };
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  const joinRequests = await getJoinRequestsForOwner(professionalId).catch(() => []);
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
          : "",
      professionalEmail: request.professional?.email || "",
      professionalPhone: request.professional?.phone || ""
    }));

  return {
    pendingOnlineBookings: notifications.filter((item) => item.status === "pending"),
    archivedOnlineBookings: notifications.filter((item) => item.status !== "pending").slice(0, 12),
    pendingJoinRequests,
    appNotifications: await appNotificationsPromise
  };
}

export async function GET(request: Request) {
  const timer = createApiTimer("api/mobile/pro/calendar GET");

  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      timer({ status: 401 });
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const url = new URL(request.url);
    const appointmentDate = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const targetProfessionalId = url.searchParams.get("targetProfessionalId") || undefined;
    const mode = url.searchParams.get("mode") || "day";

    if (mode === "notifications") {
      const notifications = await getMobileOnlineBookingNotifications(professionalId);
      timer({ status: 200 });
      return NextResponse.json(notifications);
    }

    if (mode === "range") {
      const dates = parseCalendarDateList(url.searchParams.get("dates"));
      const snapshots = await getCalendarRangeSnapshots({
        professionalId,
        appointmentDates: dates,
        targetProfessionalId,
        includeMeta: url.searchParams.get("meta") === "1"
      });

      timer({ status: 200 });
      return NextResponse.json({ snapshots });
    }

    const snapshot = await getCalendarDaySnapshot({
      professionalId,
      appointmentDate,
      targetProfessionalId,
      includeMeta: url.searchParams.get("meta") === "1"
    });

    timer({ status: 200 });
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load calendar.";
    timer({ status: 400, error: true });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
          .flatMap((item) => {
            const notificationPayload = {
              professionalId: item.professionalId,
              businessId: item.businessId,
              appointmentId: item.id,
              appointmentDate: item.appointmentDate,
              appointmentTime: item.startTime,
              customerName: item.customerName,
              serviceName: item.serviceName
            };
            return [
              sendCabinetBookingTelegramNotification(notificationPayload),
              sendCabinetBookingPushNotification(notificationPayload)
            ];
          })
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
      priceAmount: typeof body.priceAmount === "number" ? body.priceAmount : Number(body.priceAmount || 0),
      attendance: body.attendance
    });

    const notificationPayload = {
      professionalId: appointment.professionalId,
      businessId: appointment.businessId,
      appointmentId: appointment.id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.startTime,
      customerName: appointment.customerName,
      serviceName: appointment.serviceName
    };
    await Promise.allSettled([
      sendCabinetBookingTelegramNotification(notificationPayload),
      sendCabinetBookingPushNotification(notificationPayload)
    ]);

    return NextResponse.json(appointment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create appointment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

      if (
        previousAppointmentTime &&
        (previousAppointmentTime !== appointment.startTime ||
          (!!previousAppointmentDate && previousAppointmentDate !== appointment.appointmentDate))
      ) {
        await resetTelegramReminderEventsForAppointment({
          appointmentId: appointment.id,
          professionalId: appointment.professionalId
        }).catch(() => undefined);
        await resetPushReminderEventsForAppointment({
          appointmentId: appointment.id,
          professionalId: appointment.professionalId
        }).catch(() => undefined);

        const notificationPayload = {
          professionalId: appointment.professionalId,
          businessId: appointment.businessId,
          appointmentId: appointment.id,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.startTime,
          previousAppointmentDate: previousAppointmentDate || appointment.appointmentDate,
          previousAppointmentTime,
          customerName: appointment.customerName,
          serviceName: appointment.serviceName
        };
        await Promise.allSettled([
          sendBookingRescheduledTelegramNotification(notificationPayload),
          sendBookingRescheduledPushNotification(notificationPayload)
        ]);
      }
    }

    return NextResponse.json(appointment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update appointment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
      await resetPushReminderEventsForAppointment({
        appointmentId: deletedAppointment.id,
        professionalId: deletedAppointment.professionalId
      }).catch(() => undefined);

      const notificationPayload = {
        professionalId: deletedAppointment.professionalId,
        businessId: deletedAppointment.businessId,
        appointmentId: deletedAppointment.id,
        appointmentDate: deletedAppointment.appointmentDate,
        appointmentTime: deletedAppointment.startTime,
        customerName: deletedAppointment.customerName,
        serviceName: deletedAppointment.serviceName
      };
      await Promise.allSettled([
        sendBookingCancelledTelegramNotification(notificationPayload),
        sendBookingCancelledPushNotification(notificationPayload)
      ]);
    }

    return NextResponse.json({ ok: true, appointmentId: deletedAppointment.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete appointment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
