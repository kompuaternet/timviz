import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { syncBookingStatusFromCalendarAppointment } from "../../../../lib/bookings";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import {
  createBlockedCalendarTime,
  createCalendarAppointment,
  deleteCalendarAppointment,
  getCalendarDaySnapshot,
  updateCalendarAppointmentMeta,
  updateCalendarAppointmentTime
} from "../../../../lib/pro-calendar";

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

    return NextResponse.json(result);
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
    const result = await deleteCalendarAppointment({ professionalId, targetProfessionalId, appointmentId });

    return NextResponse.json(result);
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
