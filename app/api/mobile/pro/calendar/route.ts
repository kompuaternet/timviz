import { NextResponse } from "next/server";
import { createApiTimer } from "../../../../../lib/api-timing";
import { getMobileProfessionalId } from "../_auth";
import {
  createBlockedCalendarTime,
  createCalendarAppointment,
  createCalendarAppointmentsBatch,
  deleteCalendarAppointment,
  getCalendarDaySnapshot,
  updateCalendarAppointmentMeta,
  updateCalendarAppointmentTime
} from "../../../../../lib/pro-calendar";
import {
  cancelBookingFromCalendarAppointment,
  syncBookingStatusFromCalendarAppointment
} from "../../../../../lib/bookings";
import {
  resetTelegramReminderEventsForAppointment,
  sendBookingCancelledTelegramNotification,
  sendBookingRescheduledTelegramNotification,
  sendCabinetBookingTelegramNotification
} from "../../../../../lib/telegram-bot";

function normalizedTimeValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
    const snapshot = await getCalendarDaySnapshot({ professionalId, appointmentDate, targetProfessionalId });

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
      priceAmount: typeof body.priceAmount === "number" ? body.priceAmount : Number(body.priceAmount || 0),
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
