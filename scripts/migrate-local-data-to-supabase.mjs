import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(import.meta.dirname, "..");

function parseEnv(content) {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parseEnv(content);
  } catch {
    return {};
  }
}

async function loadJson(relativePath, fallback) {
  try {
    const content = await fs.readFile(path.join(root, relativePath), "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

function chunk(items, size = 200) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function normalizePhotos(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  const trimmed = input
    .filter((item) => item && typeof item === "object" && typeof item.url === "string" && item.url.trim())
    .slice(0, 5)
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `business-photo-${index + 1}`,
      url: item.url.trim(),
      isPrimary: item.isPrimary === true,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date(0).toISOString()
    }));

  if (trimmed.length === 0) {
    return [];
  }

  const primaryIndex = trimmed.findIndex((item) => item.isPrimary);
  return trimmed.map((item, index) => ({
    ...item,
    isPrimary: primaryIndex >= 0 ? index === primaryIndex : index === 0
  }));
}

function normalizeAppointment(appointment) {
  return {
    id: appointment.id,
    business_id: appointment.businessId,
    professional_id: appointment.professionalId,
    appointment_date: appointment.appointmentDate,
    start_time: appointment.startTime,
    end_time: appointment.endTime,
    kind: appointment.kind === "blocked" ? "blocked" : "appointment",
    customer_name: appointment.customerName ?? "",
    customer_phone: appointment.customerPhone ?? "",
    service_name: appointment.serviceName ?? "",
    notes: appointment.notes ?? "",
    attendance:
      appointment.attendance === "arrived" || appointment.attendance === "no_show"
        ? appointment.attendance
        : "pending",
    price_amount:
      typeof appointment.priceAmount === "number" && Number.isFinite(appointment.priceAmount)
        ? Math.max(0, appointment.priceAmount)
        : 0,
    created_at: appointment.createdAt ?? new Date(0).toISOString()
  };
}

async function upsertRows(supabase, table, rows, onConflict = "id") {
  if (rows.length === 0) {
    console.log(`${table}: 0 rows`);
    return;
  }

  for (const batch of chunk(rows)) {
    const { error } = await supabase.from(table).upsert(batch, { onConflict });
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
  }

  console.log(`${table}: ${rows.length} rows`);
}

async function main() {
  const env = {
    ...(await loadEnvFile(path.join(root, ".env"))),
    ...(await loadEnvFile(path.join(root, ".env.local"))),
    ...process.env
  };

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const proData = await loadJson("data/pro-data.json", {
    professionals: [],
    businesses: [],
    memberships: [],
    services: []
  });
  const proCalendar = await loadJson("data/pro-calendar.json", { appointments: [] });
  const proClients = await loadJson("data/pro-clients.json", { clients: [] });
  const proSupport = await loadJson("data/pro-support.json", {
    tickets: [],
    messages: []
  });
  const bookings = await loadJson("data/bookings.json", []);

  const professionals = (proData.professionals ?? []).map((professional) => ({
    id: professional.id,
    first_name: professional.firstName ?? "",
    last_name: professional.lastName ?? "",
    email: professional.email ?? "",
    password_hash: professional.passwordHash ?? "",
    phone: professional.phone ?? "",
    country: professional.country ?? "",
    timezone: professional.timezone ?? "",
    language: professional.language ?? "en",
    currency: professional.currency ?? "USD",
    booking_credits_total:
      typeof professional.bookingCreditsTotal === "number" ? professional.bookingCreditsTotal : 500,
    owner_mode: professional.ownerMode ?? "owner",
    created_at: professional.createdAt ?? new Date(0).toISOString()
  }));

  const businesses = (proData.businesses ?? []).map((business) => ({
    id: business.id,
    name: business.name ?? "",
    website: business.website ?? "",
    categories: Array.isArray(business.categories) ? business.categories : [],
    account_type: business.accountType ?? "team",
    service_mode: business.serviceMode ?? "",
    address: business.address ?? "",
    address_details: business.addressDetails ?? "",
    address_lat: typeof business.addressLat === "number" ? business.addressLat : null,
    address_lon: typeof business.addressLon === "number" ? business.addressLon : null,
    work_schedule_mode: business.workScheduleMode ?? "fixed",
    work_schedule: business.workSchedule ?? {},
    custom_schedule: business.customSchedule ?? {},
    photos: normalizePhotos(business.photos),
    owner_professional_id: business.ownerProfessionalId ?? null,
    created_at: business.createdAt ?? new Date(0).toISOString()
  }));

  const memberships = (proData.memberships ?? []).map((membership) => ({
    id: membership.id,
    business_id: membership.businessId,
    professional_id: membership.professionalId,
    role: membership.role ?? "owner",
    scope: membership.scope ?? "owner",
    created_at: membership.createdAt ?? new Date(0).toISOString()
  }));

  const services = (proData.services ?? []).map((service, index) => ({
    id: service.id,
    business_id: service.businessId,
    name: service.name ?? "",
    price: typeof service.price === "number" ? service.price : 0,
    category: service.category ?? "Без категории",
    duration_minutes: typeof service.durationMinutes === "number" ? service.durationMinutes : 60,
    color: service.color ?? null,
    sort_order: typeof service.sortOrder === "number" ? service.sortOrder : index,
    created_at: service.createdAt ?? new Date(0).toISOString()
  }));

  const calendarAppointments = (proCalendar.appointments ?? [])
    .filter((appointment) => appointment?.id && appointment.businessId && appointment.professionalId)
    .map(normalizeAppointment);

  const clients = (proClients.clients ?? []).map((client) => ({
    id: client.id,
    professional_id: client.professionalId,
    business_id: client.businessId,
    first_name: client.firstName ?? "",
    last_name: client.lastName ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    telegram: client.telegram ?? "",
    notes: client.notes ?? "",
    notifications_telegram: client.notificationsTelegram !== false,
    marketing_telegram: client.marketingTelegram === true,
    created_at: client.createdAt ?? new Date(0).toISOString(),
    updated_at: client.updatedAt ?? client.createdAt ?? new Date(0).toISOString()
  }));

  const supportTickets = (proSupport.tickets ?? []).map((ticket) => ({
    id: ticket.id,
    professional_id: ticket.professionalId ?? null,
    business_name: ticket.businessName ?? "",
    user_name: ticket.userName ?? "",
    email: ticket.email ?? "",
    phone: ticket.phone ?? "",
    page: ticket.page ?? "",
    language: ticket.language ?? "en",
    status: ticket.status === "closed" ? "closed" : "open",
    created_at: ticket.createdAt ?? new Date(0).toISOString(),
    updated_at: ticket.updatedAt ?? ticket.createdAt ?? new Date(0).toISOString()
  }));

  const supportMessages = (proSupport.messages ?? []).map((message) => ({
    id: message.id,
    ticket_id: message.ticketId,
    source: message.source === "support" ? "support" : "user",
    text: message.text ?? "",
    created_at: message.createdAt ?? new Date(0).toISOString(),
    telegram_message_id:
      typeof message.telegramMessageId === "number" ? message.telegramMessageId : null,
    telegram_update_id:
      typeof message.telegramUpdateId === "number" ? message.telegramUpdateId : null
  }));

  const bookingRows = bookings.map((booking) => ({
    id: booking.id,
    salon_slug: booking.salonSlug,
    salon_name: booking.salonName,
    service_name: booking.serviceName,
    appointment_date: booking.appointmentDate,
    appointment_time: booking.appointmentTime,
    customer_name: booking.customerName,
    customer_phone: booking.customerPhone,
    customer_notes: booking.customerNotes ?? "",
    status: booking.status ?? "confirmed",
    created_at: booking.createdAt ?? new Date(0).toISOString()
  }));

  console.log("Run supabase/schema.sql in the Supabase SQL editor before this import.");

  await upsertRows(supabase, "professionals", professionals);
  await upsertRows(supabase, "businesses", businesses);
  await upsertRows(supabase, "business_memberships", memberships);
  await upsertRows(supabase, "business_services", services);
  await upsertRows(supabase, "calendar_appointments", calendarAppointments);
  await upsertRows(supabase, "pro_clients", clients);
  await upsertRows(supabase, "support_tickets", supportTickets);
  await upsertRows(supabase, "support_messages", supportMessages);
  await upsertRows(supabase, "bookings", bookingRows);

  console.log("Supabase migration finished.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
