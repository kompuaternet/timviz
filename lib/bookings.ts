import { promises as fs } from "fs";
import path from "path";
import { getSalonBySlug } from "../data/mock-data";
import { getPublicBookingSlots } from "./public-booking";
import { getBusinessDirectorySnapshot, type BusinessRecord, type ServiceRecord } from "./pro-data";
import { createCalendarAppointment, getPublicCalendarAppointments } from "./pro-calendar";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { addMinutesToTime } from "./work-schedule";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type BookingRecord = {
  id: string;
  salonSlug: string;
  salonName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  status: BookingStatus;
  source: "local" | "supabase";
  createdAt: string;
};

export type BookingInput = {
  salonSlug: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
};

export type PublicBusinessBookingInput = {
  businessId: string;
  serviceName: string;
  serviceNames?: string[];
  professionalId?: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
};

const bookingsPath = path.join(process.cwd(), "data", "bookings.json");

function createBookingId() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RZV-${randomPart}`;
}

async function readLocalBookings() {
  const file = await fs.readFile(bookingsPath, "utf8");
  return JSON.parse(file) as BookingRecord[];
}

async function writeLocalBookings(bookings: BookingRecord[]) {
  await fs.writeFile(bookingsPath, JSON.stringify(bookings, null, 2) + "\n", "utf8");
}

async function validateBookingInput(input: BookingInput) {
  const salon = getSalonBySlug(input.salonSlug);

  if (!salon) {
    throw new Error("Salon not found.");
  }

  const service = salon.services.find((item) => item.name === input.serviceName);

  if (!service) {
    throw new Error("Service not found.");
  }

  if (!input.customerName.trim()) {
    throw new Error("Customer name is required.");
  }

  if (!input.customerPhone.trim()) {
    throw new Error("Customer phone is required.");
  }

  if (!input.appointmentDate.trim()) {
    throw new Error("Appointment date is required.");
  }

  const existingBookings = (await getAllBookings()).filter(
    (booking) =>
      booking.salonSlug === salon.slug &&
      booking.appointmentDate === input.appointmentDate &&
      booking.status !== "cancelled"
  );
  const availableSlots = getPublicBookingSlots({
    config: {
      workSchedule: salon.workSchedule,
      bookingIntervalMinutes: salon.bookingIntervalMinutes,
      services: salon.services.map((item) => ({
        name: item.name,
        durationMinutes: item.durationMinutes
      }))
    },
    date: input.appointmentDate,
    serviceName: input.serviceName,
    bookings: existingBookings.map((booking) => ({
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      serviceName: booking.serviceName
    }))
  });

  if (!availableSlots.includes(input.appointmentTime)) {
    throw new Error("Time slot not found.");
  }

  return { salon, service };
}

export async function createBooking(input: BookingInput) {
  const { salon } = await validateBookingInput(input);

  const booking: BookingRecord = {
    id: createBookingId(),
    salonSlug: salon.slug,
    salonName: salon.name,
    serviceName: input.serviceName,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerNotes: input.customerNotes.trim(),
    status: "confirmed",
    source: isSupabaseConfigured() ? "supabase" : "local",
    createdAt: new Date().toISOString()
  };

  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase.from("bookings").insert({
      id: booking.id,
      salon_slug: booking.salonSlug,
      salon_name: booking.salonName,
      service_name: booking.serviceName,
      appointment_date: booking.appointmentDate,
      appointment_time: booking.appointmentTime,
      customer_name: booking.customerName,
      customer_phone: booking.customerPhone,
      customer_notes: booking.customerNotes,
      status: booking.status,
      created_at: booking.createdAt
    });

    if (error) {
      throw new Error(error.message);
    }

    return booking;
  }

  const bookings = await readLocalBookings();
  bookings.unshift(booking);
  await writeLocalBookings(bookings);
  return booking;
}

function getOwnerProfessionalId(business: BusinessRecord, ownerProfessionalIds: string[]) {
  return business.ownerProfessionalId || ownerProfessionalIds[0] || "";
}

function getBusinessProfessionalIds(
  businessId: string,
  directory: Awaited<ReturnType<typeof getBusinessDirectorySnapshot>>
) {
  return directory.memberships
    .filter((membership) => membership.businessId === businessId)
    .map((membership) => membership.professionalId)
    .filter(Boolean);
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

export async function createBusinessBooking(input: PublicBusinessBookingInput) {
  const directory = await getBusinessDirectorySnapshot();
  const business = directory.businesses.find((item) => item.id === input.businessId);

  if (!business) {
    throw new Error("Business not found.");
  }

  if (business.allowOnlineBooking !== true) {
    throw new Error("Online booking is not enabled for this business.");
  }

  const businessServices = directory.services
    .filter((service) => service.businessId === business.id)
    .filter(isServicePubliclyVisible);
  const requestedServiceNames = Array.from(
    new Set(
      (input.serviceNames?.length ? input.serviceNames : [input.serviceName])
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

  if (requestedServiceNames.length === 0) {
    throw new Error("Service not found.");
  }

  const selectedServices = requestedServiceNames
    .map((name) => businessServices.find((item) => item.name === name))
    .filter((item): item is ServiceRecord => Boolean(item));

  if (selectedServices.length !== requestedServiceNames.length) {
    throw new Error("Service not found.");
  }

  const primaryService = selectedServices[0];
  const totalDurationMinutes = selectedServices.reduce(
    (sum, item) => sum + Math.max(5, item.durationMinutes ?? 60),
    0
  );
  const totalPrice = selectedServices.reduce((sum, item) => sum + Math.max(0, item.price || 0), 0);
  const combinedServiceName = selectedServices.map((item) => item.name).join(" + ");

  const ownerProfessionalIds = directory.memberships
    .filter((membership) => membership.businessId === business.id && membership.scope === "owner")
    .map((membership) => membership.professionalId);
  const requestedProfessionalId = input.professionalId?.trim() || "";
  const allProfessionalIds = getBusinessProfessionalIds(business.id, directory);
  const candidateProfessionalIds = requestedProfessionalId
    ? allProfessionalIds.filter((item) => item === requestedProfessionalId)
    : allProfessionalIds;

  if (!candidateProfessionalIds.length) {
    const ownerProfessionalId = getOwnerProfessionalId(business, ownerProfessionalIds);

    if (!ownerProfessionalId) {
      throw new Error("Business owner not found.");
    }

    candidateProfessionalIds.push(ownerProfessionalId);
  }

  if (!input.customerName.trim()) {
    throw new Error("Customer name is required.");
  }

  if (!input.customerPhone.trim()) {
    throw new Error("Customer phone is required.");
  }

  if (!input.appointmentDate.trim()) {
    throw new Error("Appointment date is required.");
  }

  const bookingConfig = {
    workSchedule: business.workSchedule,
    customSchedule: business.customSchedule,
    bookingIntervalMinutes: 15,
    services: businessServices.map((item) => ({
      name: item.name,
      durationMinutes: item.durationMinutes ?? 60
    }))
  };
  const publicAppointments = await getPublicCalendarAppointments();

  const professionalId = candidateProfessionalIds.find((candidateId) => {
    const candidateBookings = publicAppointments
      .filter(
        (appointment) =>
          appointment.businessId === business.id &&
          appointment.professionalId === candidateId &&
          (appointment.kind === "blocked" ||
            (appointment.kind === "appointment" && appointment.attendance !== "pending"))
      )
      .map((appointment) => ({
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.startTime,
        endTime: appointment.endTime,
        serviceName: appointment.kind === "blocked" ? "blocked" : "",
        professionalId: appointment.professionalId
      }));

    const availableSlots = getPublicBookingSlots({
      config: bookingConfig,
      date: input.appointmentDate,
      serviceName: primaryService.name,
      durationMinutesOverride: totalDurationMinutes,
      bookings: candidateBookings
    });

    return availableSlots.includes(input.appointmentTime);
  });

  if (!professionalId) {
    throw new Error("Time slot not found.");
  }

  const booking: BookingRecord = {
    id: createBookingId(),
    salonSlug: `business:${business.id}`,
    salonName: business.name,
    serviceName: combinedServiceName,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerNotes: input.customerNotes.trim(),
    status: "pending",
    source: isSupabaseConfigured() ? "supabase" : "local",
    createdAt: new Date().toISOString()
  };

  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase.from("bookings").insert({
      id: booking.id,
      salon_slug: booking.salonSlug,
      salon_name: booking.salonName,
      service_name: booking.serviceName,
      appointment_date: booking.appointmentDate,
      appointment_time: booking.appointmentTime,
      customer_name: booking.customerName,
      customer_phone: booking.customerPhone,
      customer_notes: booking.customerNotes,
      status: booking.status,
      created_at: booking.createdAt
    });

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const bookings = await readLocalBookings();
    bookings.unshift(booking);
    await writeLocalBookings(bookings);
  }

  await createCalendarAppointment({
    professionalId,
    appointmentDate: input.appointmentDate,
    startTime: input.appointmentTime,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    serviceName: combinedServiceName,
    notes: input.customerNotes,
    priceAmount: totalPrice,
    attendance: "pending",
    endTime: addMinutesToTime(input.appointmentTime, totalDurationMinutes),
    allowMissingService: selectedServices.length > 1
  });

  return booking;
}

export async function getBookingById(id: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, salon_slug, salon_name, service_name, appointment_date, appointment_time, customer_name, customer_phone, customer_notes, status, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      salonSlug: data.salon_slug,
      salonName: data.salon_name,
      serviceName: data.service_name,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerNotes: data.customer_notes ?? "",
      status: (data.status as BookingStatus) ?? "confirmed",
      source: "supabase",
      createdAt: data.created_at
    } satisfies BookingRecord;
  }

  const bookings = await readLocalBookings();
  return bookings.find((booking) => booking.id === id) ?? null;
}

export async function getAllBookings() {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, salon_slug, salon_name, service_name, appointment_date, appointment_time, customer_name, customer_phone, customer_notes, status, created_at"
      )
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((item) => ({
      id: item.id,
      salonSlug: item.salon_slug,
      salonName: item.salon_name,
      serviceName: item.service_name,
      appointmentDate: item.appointment_date,
      appointmentTime: item.appointment_time,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      customerNotes: item.customer_notes ?? "",
      status: (item.status as BookingStatus) ?? "confirmed",
      source: "supabase" as const,
      createdAt: item.created_at
    }));
  }

  const bookings = await readLocalBookings();
  return bookings.sort((left, right) => {
    const leftKey = `${left.appointmentDate}T${left.appointmentTime}`;
    const rightKey = `${right.appointmentDate}T${right.appointmentTime}`;
    return leftKey.localeCompare(rightKey);
  });
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const bookings = await readLocalBookings();
  const nextBookings = bookings.map((booking) =>
    booking.id === id ? { ...booking, status } : booking
  );
  await writeLocalBookings(nextBookings);
}
