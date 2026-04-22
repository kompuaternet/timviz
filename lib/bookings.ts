import { promises as fs } from "fs";
import path from "path";
import { getSalonBySlug } from "../data/mock-data";
import { getPublicBookingSlots } from "./public-booking";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type BookingStatus = "confirmed" | "completed" | "cancelled";

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
