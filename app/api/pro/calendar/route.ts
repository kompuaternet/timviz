import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  cancelBookingFromCalendarAppointment,
  getBookingsForSalonSlug,
  syncBookingStatusFromCalendarAppointment,
  type BookingRecord,
  type BookingStatus
} from "../../../../lib/bookings";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import {
  createBlockedCalendarTime,
  createCalendarAppointment,
  deleteCalendarAppointment,
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
};

function mapBookingStatusForNotification(status: BookingStatus) {
  return status === "pending" ? "pending" : status === "cancelled" ? "cancelled" : "confirmed";
}

function pickMatchingAppointment(
  appointments: Array<CalendarRouteAppointment & { professionalName: string }>,
  booking: BookingRecord
) {
  const normalizedPhone = booking.customerPhone.trim();
  const normalizedName = booking.customerName.trim().toLowerCase();
  const normalizedService = booking.serviceName.trim().toLowerCase();
  const scoped = appointments.filter(
    (item) =>
      item.kind === "appointment" &&
      item.appointmentDate === booking.appointmentDate &&
      item.startTime === booking.appointmentTime
  );

  return (
    scoped.find((item) => item.customerPhone.trim() && item.customerPhone.trim() === normalizedPhone) ??
    scoped.find((item) => item.customerName.trim().toLowerCase() === normalizedName) ??
    scoped.find((item) => item.serviceName.trim().toLowerCase() === normalizedService) ??
    scoped[0] ??
    null
  );
}

async function decorateSnapshotWithOnlineBookingNotifications(snapshot: CalendarRouteSnapshot) {
  const businessId = snapshot.workspace.business.id;

  if (!businessId) {
    return snapshot;
  }

  const bookings = await getBookingsForSalonSlug(`business:${businessId}`);
  const appointmentPool = snapshot.memberCalendars.flatMap((member) =>
    member.appointments.map((appointment) => ({
      ...appointment,
      professionalName: `${member.firstName} ${member.lastName}`.trim() || member.role
    }))
  );

  const notifications = bookings
    .map((booking) => {
      const appointment = pickMatchingAppointment(appointmentPool, booking);

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
        status: mapBookingStatusForNotification(booking.status)
      };
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

  return {
    ...snapshot,
    pendingOnlineBookings: notifications.filter((item) => item.status === "pending"),
    archivedOnlineBookings: notifications.filter((item) => item.status !== "pending").slice(0, 12)
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
    const result = await getCalendarDaySnapshot({ professionalId, appointmentDate, targetProfessionalId });
    const decoratedResult = await decorateSnapshotWithOnlineBookingNotifications(result as CalendarRouteSnapshot);

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
      }

      return NextResponse.json(appointment);
    }

    const appointment = await updateCalendarAppointmentTime({
      professionalId,
      targetProfessionalId: body.targetProfessionalId,
      appointmentId: body.appointmentId,
      startTime: body.startTime,
      endTime: body.endTime
    });

    return NextResponse.json(appointment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move appointment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
