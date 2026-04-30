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
  customerEmail?: string;
  customerPhone: string;
  customerNotes: string;
  status: BookingStatus;
  source: "local" | "supabase";
  createdAt: string;
};

type BookingMatchInput = {
  appointmentDate: string;
  appointmentTime: string;
  previousAppointmentTime?: string;
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
  previousCustomerName?: string;
  previousCustomerPhone?: string;
  serviceName: string;
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
  customerEmail?: string;
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

function mapBookingRow(item: Record<string, unknown>) {
  return {
    id: String(item.id ?? ""),
    salonSlug: String(item.salon_slug ?? ""),
    salonName: String(item.salon_name ?? ""),
    serviceName: String(item.service_name ?? ""),
    appointmentDate: String(item.appointment_date ?? ""),
    appointmentTime: String(item.appointment_time ?? ""),
    customerName: String(item.customer_name ?? ""),
    customerEmail: String(item.customer_email ?? ""),
    customerPhone: String(item.customer_phone ?? ""),
    customerNotes: String(item.customer_notes ?? ""),
    status: (item.status as BookingStatus) ?? "confirmed",
    source: "supabase" as const,
    createdAt: String(item.created_at ?? "")
  } satisfies BookingRecord;
}

async function fetchSupabaseBookingsForSalonSlug(salonSlug: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [] as BookingRecord[];
  }

  const primaryResult = await supabase
    .from("bookings")
    .select(
      "id, salon_slug, salon_name, service_name, appointment_date, appointment_time, customer_name, customer_email, customer_phone, customer_notes, status, created_at"
    )
    .eq("salon_slug", salonSlug)
    .order("created_at", { ascending: false });

  let rows = (primaryResult.data as Array<Record<string, unknown>> | null) ?? [];
  let error = primaryResult.error;

  if (error && /customer_email/i.test(error.message)) {
    const fallbackResult = await supabase
      .from("bookings")
      .select(
        "id, salon_slug, salon_name, service_name, appointment_date, appointment_time, customer_name, customer_phone, customer_notes, status, created_at"
      )
      .eq("salon_slug", salonSlug)
      .order("created_at", { ascending: false });
    rows = (fallbackResult.data as Array<Record<string, unknown>> | null) ?? [];
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  return rows.map(mapBookingRow);
}

function pickMatchingBookingCandidate(items: BookingRecord[], input: BookingMatchInput) {
  const normalizedPhone = input.customerPhone.trim();
  const previousPhone = input.previousCustomerPhone?.trim() ?? "";
  const normalizedName = input.customerName.trim().toLowerCase();
  const previousName = input.previousCustomerName?.trim().toLowerCase() ?? "";
  const normalizedServiceName = input.serviceName.trim().toLowerCase();

  return (
    (previousPhone
      ? items.find((item) => item.customerPhone.trim() && item.customerPhone.trim() === previousPhone) ?? null
      : null) ??
    items.find((item) => item.customerPhone.trim() && item.customerPhone.trim() === normalizedPhone) ??
    (previousName
      ? items.find((item) => item.customerName.trim().toLowerCase() === previousName) ?? null
      : null) ??
    items.find((item) => item.customerName.trim().toLowerCase() === normalizedName) ??
    items.find((item) => item.serviceName.trim().toLowerCase() === normalizedServiceName) ??
    null
  );
}

async function syncMatchedBookingFromCalendarAppointment(
  businessId: string,
  input: BookingMatchInput,
  nextStatus: BookingStatus
) {
  const salonSlug = `business:${businessId}`;
  const normalizedPhone = input.customerPhone.trim();
  const normalizedNotes = input.customerNotes?.trim() ?? "";
  const previousAppointmentTime = input.previousAppointmentTime?.trim() ?? "";
  const timesToCheck = Array.from(new Set([input.appointmentTime, previousAppointmentTime].filter(Boolean)));

  if (isSupabaseConfigured()) {
    const candidates = await fetchSupabaseBookingsForSalonSlug(salonSlug);
    const scopedCandidates = candidates.filter(
      (item) => item.appointmentDate === input.appointmentDate && timesToCheck.includes(item.appointmentTime)
    );
    const match = pickMatchingBookingCandidate(scopedCandidates, input);

    if (
      !match ||
      (match.status === nextStatus &&
        match.customerName === input.customerName.trim() &&
        match.customerPhone === normalizedPhone &&
        (match.customerNotes ?? "") === normalizedNotes &&
        match.appointmentTime === input.appointmentTime &&
        match.serviceName.trim() === input.serviceName.trim())
    ) {
      return;
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return;
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: nextStatus,
        customer_name: input.customerName.trim(),
        customer_phone: normalizedPhone,
        customer_notes: normalizedNotes,
        appointment_time: input.appointmentTime,
        service_name: input.serviceName.trim()
      })
      .eq("id", match.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return;
  }

  const bookings = await readLocalBookings();
  const scopedCandidates = bookings.filter(
    (item) =>
      item.salonSlug === salonSlug &&
      item.appointmentDate === input.appointmentDate &&
      timesToCheck.includes(item.appointmentTime)
  );
  const match = pickMatchingBookingCandidate(scopedCandidates, input);

  if (
    !match ||
    (match.status === nextStatus &&
      match.customerName === input.customerName.trim() &&
      match.customerPhone === normalizedPhone &&
      (match.customerNotes ?? "") === normalizedNotes &&
      match.appointmentTime === input.appointmentTime &&
      match.serviceName.trim() === input.serviceName.trim())
  ) {
    return;
  }

  const nextBookings = bookings.map((item) =>
    item.id === match.id
      ? {
          ...item,
          status: nextStatus,
          customerName: input.customerName.trim(),
          customerPhone: normalizedPhone,
          customerNotes: normalizedNotes,
          appointmentTime: input.appointmentTime,
          serviceName: input.serviceName.trim()
        }
      : item
  );
  await writeLocalBookings(nextBookings);
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
    customerEmail: "",
    customerPhone: input.customerPhone.trim(),
    customerNotes: input.customerNotes.trim(),
    status: "confirmed",
    source: isSupabaseConfigured() ? "supabase" : "local",
    createdAt: new Date().toISOString()
  };

  const supabase = getSupabaseAdmin();

  if (supabase) {
    let { error } = await supabase.from("bookings").insert({
      id: booking.id,
      salon_slug: booking.salonSlug,
      salon_name: booking.salonName,
      service_name: booking.serviceName,
      appointment_date: booking.appointmentDate,
      appointment_time: booking.appointmentTime,
      customer_name: booking.customerName,
      customer_email: booking.customerEmail,
      customer_phone: booking.customerPhone,
      customer_notes: booking.customerNotes,
      status: booking.status,
      created_at: booking.createdAt
    });

    if (error && /customer_email/i.test(error.message)) {
      ({ error } = await supabase.from("bookings").insert({
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
      }));
    }

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
    customerEmail: input.customerEmail?.trim().toLowerCase() || "",
    customerPhone: input.customerPhone.trim(),
    customerNotes: input.customerNotes.trim(),
    status: "pending",
    source: isSupabaseConfigured() ? "supabase" : "local",
    createdAt: new Date().toISOString()
  };

  const supabase = getSupabaseAdmin();

  if (supabase) {
    let { error } = await supabase.from("bookings").insert({
      id: booking.id,
      salon_slug: booking.salonSlug,
      salon_name: booking.salonName,
      service_name: booking.serviceName,
      appointment_date: booking.appointmentDate,
      appointment_time: booking.appointmentTime,
      customer_name: booking.customerName,
      customer_email: booking.customerEmail,
      customer_phone: booking.customerPhone,
      customer_notes: booking.customerNotes,
      status: booking.status,
      created_at: booking.createdAt
    });

    if (error && /customer_email/i.test(error.message)) {
      ({ error } = await supabase.from("bookings").insert({
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
      }));
    }

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const bookings = await readLocalBookings();
    bookings.unshift(booking);
    await writeLocalBookings(bookings);
  }

  try {
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
  } catch (error) {
    await deleteBooking(booking.id).catch(() => undefined);
    throw error;
  }

  return booking;
}

export async function getBookingById(id: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const primaryResult = await supabase
      .from("bookings")
      .select(
        "id, salon_slug, salon_name, service_name, appointment_date, appointment_time, customer_name, customer_email, customer_phone, customer_notes, status, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    let bookingRow = primaryResult.data as Record<string, unknown> | null;
    let error = primaryResult.error;

    if (error && /customer_email/i.test(error.message)) {
      const fallbackResult = await supabase
        .from("bookings")
        .select(
          "id, salon_slug, salon_name, service_name, appointment_date, appointment_time, customer_name, customer_phone, customer_notes, status, created_at"
        )
        .eq("id", id)
        .maybeSingle();
      bookingRow = fallbackResult.data as Record<string, unknown> | null;
      error = fallbackResult.error;
    }

    if (error) {
      throw new Error(error.message);
    }

    if (!bookingRow) {
      return null;
    }

    return {
      id: String(bookingRow.id ?? ""),
      salonSlug: String(bookingRow.salon_slug ?? ""),
      salonName: String(bookingRow.salon_name ?? ""),
      serviceName: String(bookingRow.service_name ?? ""),
      appointmentDate: String(bookingRow.appointment_date ?? ""),
      appointmentTime: String(bookingRow.appointment_time ?? ""),
      customerName: String(bookingRow.customer_name ?? ""),
      customerEmail: String(bookingRow.customer_email ?? ""),
      customerPhone: String(bookingRow.customer_phone ?? ""),
      customerNotes: String(bookingRow.customer_notes ?? ""),
      status: (bookingRow.status as BookingStatus) ?? "confirmed",
      source: "supabase",
      createdAt: String(bookingRow.created_at ?? "")
    } satisfies BookingRecord;
  }

  const bookings = await readLocalBookings();
  return bookings.find((booking) => booking.id === id) ?? null;
}

export async function getAllBookings() {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const primaryResult = await supabase
      .from("bookings")
      .select(
        "id, salon_slug, salon_name, service_name, appointment_date, appointment_time, customer_name, customer_email, customer_phone, customer_notes, status, created_at"
      )
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    let rows = (primaryResult.data as Array<Record<string, unknown>> | null) ?? [];
    let error = primaryResult.error;

    if (error && /customer_email/i.test(error.message)) {
      const fallbackResult = await supabase
        .from("bookings")
        .select(
          "id, salon_slug, salon_name, service_name, appointment_date, appointment_time, customer_name, customer_phone, customer_notes, status, created_at"
        )
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });
      rows = (fallbackResult.data as Array<Record<string, unknown>> | null) ?? [];
      error = fallbackResult.error;
    }

    if (error) {
      throw new Error(error.message);
    }

    return rows.map(mapBookingRow);
  }

  const bookings = await readLocalBookings();
  return bookings.sort((left, right) => {
    const leftKey = `${left.appointmentDate}T${left.appointmentTime}`;
    const rightKey = `${right.appointmentDate}T${right.appointmentTime}`;
    return leftKey.localeCompare(rightKey);
  });
}

export async function getBookingsForSalonSlug(salonSlug: string) {
  if (isSupabaseConfigured()) {
    return fetchSupabaseBookingsForSalonSlug(salonSlug);
  }

  const bookings = await readLocalBookings();
  return bookings
    .filter((item) => item.salonSlug === salonSlug)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
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

export async function deleteBooking(id: string) {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const bookings = await readLocalBookings();
  const nextBookings = bookings.filter((booking) => booking.id !== id);
  await writeLocalBookings(nextBookings);
}

function mapAttendanceToBookingStatus(attendance: string): BookingStatus {
  if (attendance === "pending") {
    return "pending";
  }

  if (attendance === "confirmed" || attendance === "arrived" || attendance === "no_show") {
    return "confirmed";
  }

  return "pending";
}

export async function syncBookingStatusFromCalendarAppointment(input: {
  businessId: string;
  appointmentDate: string;
  appointmentTime: string;
  previousAppointmentTime?: string;
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
  previousCustomerName?: string;
  previousCustomerPhone?: string;
  serviceName: string;
  attendance: string;
}) {
  await syncMatchedBookingFromCalendarAppointment(
    input.businessId,
    input,
    mapAttendanceToBookingStatus(input.attendance)
  );
}

export async function cancelBookingFromCalendarAppointment(input: {
  businessId: string;
  appointmentDate: string;
  appointmentTime: string;
  previousAppointmentTime?: string;
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
  previousCustomerName?: string;
  previousCustomerPhone?: string;
  serviceName: string;
}) {
  await syncMatchedBookingFromCalendarAppointment(input.businessId, input, "cancelled");
}
