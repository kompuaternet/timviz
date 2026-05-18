import { randomUUID } from "crypto";
import { getAppointmentsForBusiness, type CalendarAppointment } from "./pro-calendar";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type PushLanguage = "ru" | "uk" | "en" | "fr" | "pl" | "cs" | "es" | "de";

export type PushBookingEventType = "online_created" | "cabinet_created" | "rescheduled" | "cancelled";

export type PushTokenRecord = {
  id: string;
  professionalId: string;
  businessId: string;
  expoPushToken: string;
  platform: string;
  deviceName: string;
  language: PushLanguage;
  timezone: string;
  notificationsNewBooking: boolean;
  notificationsCabinetBooking: boolean;
  notificationsRescheduled: boolean;
  notificationsCancelled: boolean;
  notificationsReminder: boolean;
  notificationsToday: boolean;
  reminderLeadMinutes: number;
  active: boolean;
  lastRegisteredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PushSettingKey =
  | "notificationsNewBooking"
  | "notificationsCabinetBooking"
  | "notificationsRescheduled"
  | "notificationsCancelled"
  | "notificationsReminder"
  | "notificationsToday";

type PushText = {
  enabledTitle: string;
  enabledBody: string;
  onlineBookingCreated: string;
  cabinetBookingCreated: string;
  bookingRescheduled: string;
  bookingCancelled: string;
  reminderPrefix: string;
  unknownClient: string;
  fromLabel: string;
  toLabel: string;
};

type ReminderRunStats = {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
};

const reminderWindowMin = Number.parseInt(process.env.PUSH_REMINDER_WINDOW_MIN || "15", 10) || 15;

const textByLanguage: Record<PushLanguage, PushText> = {
  ru: {
    enabledTitle: "Уведомления включены",
    enabledBody: "Timviz будет сообщать о новых заявках и напоминать о записях.",
    onlineBookingCreated: "Новая онлайн-запись",
    cabinetBookingCreated: "Новая запись",
    bookingRescheduled: "Запись перенесена",
    bookingCancelled: "Запись отменена",
    reminderPrefix: "Напоминание о записи",
    unknownClient: "Клиент",
    fromLabel: "Было",
    toLabel: "Стало"
  },
  uk: {
    enabledTitle: "Сповіщення увімкнено",
    enabledBody: "Timviz повідомлятиме про нові заявки та нагадуватиме про записи.",
    onlineBookingCreated: "Новий онлайн-запис",
    cabinetBookingCreated: "Новий запис",
    bookingRescheduled: "Запис перенесено",
    bookingCancelled: "Запис скасовано",
    reminderPrefix: "Нагадування про запис",
    unknownClient: "Клієнт",
    fromLabel: "Було",
    toLabel: "Стало"
  },
  en: {
    enabledTitle: "Notifications enabled",
    enabledBody: "Timviz will notify you about new requests and appointment reminders.",
    onlineBookingCreated: "New online booking",
    cabinetBookingCreated: "New appointment",
    bookingRescheduled: "Appointment rescheduled",
    bookingCancelled: "Appointment cancelled",
    reminderPrefix: "Appointment reminder",
    unknownClient: "Client",
    fromLabel: "From",
    toLabel: "To"
  },
  fr: {
    enabledTitle: "Notifications activées",
    enabledBody: "Timviz vous préviendra des nouvelles demandes et des rappels.",
    onlineBookingCreated: "Nouvelle réservation en ligne",
    cabinetBookingCreated: "Nouveau rendez-vous",
    bookingRescheduled: "Rendez-vous déplacé",
    bookingCancelled: "Rendez-vous annulé",
    reminderPrefix: "Rappel de rendez-vous",
    unknownClient: "Client",
    fromLabel: "Avant",
    toLabel: "Après"
  },
  pl: {
    enabledTitle: "Powiadomienia włączone",
    enabledBody: "Timviz będzie informować o nowych zgłoszeniach i przypomnieniach.",
    onlineBookingCreated: "Nowa rezerwacja online",
    cabinetBookingCreated: "Nowa wizyta",
    bookingRescheduled: "Wizyta przeniesiona",
    bookingCancelled: "Wizyta anulowana",
    reminderPrefix: "Przypomnienie o wizycie",
    unknownClient: "Klient",
    fromLabel: "Było",
    toLabel: "Jest"
  },
  cs: {
    enabledTitle: "Oznámení zapnuta",
    enabledBody: "Timviz vás upozorní na nové žádosti a připomenutí.",
    onlineBookingCreated: "Nová online rezervace",
    cabinetBookingCreated: "Nová rezervace",
    bookingRescheduled: "Rezervace přesunuta",
    bookingCancelled: "Rezervace zrušena",
    reminderPrefix: "Připomenutí rezervace",
    unknownClient: "Klient",
    fromLabel: "Původně",
    toLabel: "Nově"
  },
  es: {
    enabledTitle: "Notificaciones activadas",
    enabledBody: "Timviz avisará de nuevas solicitudes y recordatorios.",
    onlineBookingCreated: "Nueva reserva online",
    cabinetBookingCreated: "Nueva cita",
    bookingRescheduled: "Cita reprogramada",
    bookingCancelled: "Cita cancelada",
    reminderPrefix: "Recordatorio de cita",
    unknownClient: "Cliente",
    fromLabel: "Antes",
    toLabel: "Ahora"
  },
  de: {
    enabledTitle: "Benachrichtigungen aktiviert",
    enabledBody: "Timviz informiert über neue Anfragen und Erinnerungen.",
    onlineBookingCreated: "Neue Online-Buchung",
    cabinetBookingCreated: "Neuer Termin",
    bookingRescheduled: "Termin verschoben",
    bookingCancelled: "Termin storniert",
    reminderPrefix: "Terminerinnerung",
    unknownClient: "Kunde",
    fromLabel: "Vorher",
    toLabel: "Jetzt"
  }
};

function normalizeLanguage(value: unknown): PushLanguage {
  const language = String(value || "").trim().toLowerCase();
  return ["ru", "uk", "en", "fr", "pl", "cs", "es", "de"].includes(language)
    ? (language as PushLanguage)
    : "en";
}

function getPushText(language: PushLanguage) {
  return textByLanguage[language] || textByLanguage.en;
}

function normalizeReminderLeadMinutes(value: unknown, fallback = 120) {
  const minutes = Number(value);
  return [15, 30, 60, 120, 180, 1440].includes(minutes) ? minutes : fallback;
}

function mapPushToken(row: Record<string, any>): PushTokenRecord {
  return {
    id: String(row.id || ""),
    professionalId: String(row.professional_id || ""),
    businessId: String(row.business_id || ""),
    expoPushToken: String(row.expo_push_token || ""),
    platform: String(row.platform || ""),
    deviceName: String(row.device_name || ""),
    language: normalizeLanguage(row.language),
    timezone: String(row.timezone || "UTC"),
    notificationsNewBooking: row.notifications_new_booking !== false,
    notificationsCabinetBooking: row.notifications_cabinet_booking !== false,
    notificationsRescheduled: row.notifications_rescheduled !== false,
    notificationsCancelled: row.notifications_cancelled !== false,
    notificationsReminder: row.notifications_reminder !== false,
    notificationsToday: row.notifications_today !== false,
    reminderLeadMinutes: normalizeReminderLeadMinutes(row.reminder_lead_minutes),
    active: row.active !== false,
    lastRegisteredAt: String(row.last_registered_at || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || "")
  };
}

function canSendBookingEvent(record: PushTokenRecord, eventType: PushBookingEventType) {
  if (eventType === "online_created") return record.notificationsNewBooking;
  if (eventType === "cabinet_created") return record.notificationsCabinetBooking;
  if (eventType === "rescheduled") return record.notificationsRescheduled;
  return record.notificationsCancelled;
}

function buildBookingPush(input: {
  text: PushText;
  eventType: PushBookingEventType;
  appointmentDate: string;
  appointmentTime: string;
  previousAppointmentDate?: string;
  previousAppointmentTime?: string;
  customerName: string;
  serviceName: string;
}) {
  const title =
    input.eventType === "online_created"
      ? input.text.onlineBookingCreated
      : input.eventType === "cabinet_created"
      ? input.text.cabinetBookingCreated
      : input.eventType === "rescheduled"
      ? input.text.bookingRescheduled
      : input.text.bookingCancelled;

  if (input.eventType === "rescheduled") {
    const fromDate = input.previousAppointmentDate?.trim() || input.appointmentDate;
    const fromTime = input.previousAppointmentTime?.trim() || input.appointmentTime;
    return {
      title,
      body: `${input.customerName.trim() || input.text.unknownClient}: ${fromDate} ${fromTime} → ${input.appointmentDate} ${input.appointmentTime}`
    };
  }

  return {
    title,
    body: `${input.appointmentDate} ${input.appointmentTime} · ${input.customerName.trim() || input.text.unknownClient} · ${input.serviceName.trim() || "-"}`
  };
}

async function sendExpoPushMessages(messages: Array<Record<string, unknown>>) {
  if (!messages.length) {
    return { sent: 0, invalidTokens: [] as string[] };
  }

  const sent = { count: 0, invalidTokens: [] as string[] };
  for (let index = 0; index < messages.length; index += 100) {
    const chunk = messages.slice(index, index + 100);
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(chunk)
    });
    const payload = (await response.json().catch(() => ({}))) as {
      data?: Array<{ status?: string; message?: string; details?: { error?: string } }>;
    };
    payload.data?.forEach((item, itemIndex) => {
      if (item.status === "ok") {
        sent.count += 1;
      }
      if (item.details?.error === "DeviceNotRegistered") {
        const token = String(chunk[itemIndex]?.to || "");
        if (token) sent.invalidTokens.push(token);
      }
    });
  }

  return { sent: sent.count, invalidTokens: sent.invalidTokens };
}

async function deactivatePushTokens(tokens: string[]) {
  if (!tokens.length || !isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase
    .from("mobile_push_tokens")
    .update({ active: false, updated_at: new Date().toISOString() })
    .in("expo_push_token", tokens);
}

export async function upsertMobilePushToken(input: {
  professionalId: string;
  businessId: string;
  expoPushToken: string;
  platform: string;
  deviceName: string;
  language: string;
  timezone: string;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("mobile_push_tokens")
    .select("*")
    .eq("expo_push_token", input.expoPushToken)
    .maybeSingle();

  const base = {
    professional_id: input.professionalId,
    business_id: input.businessId,
    expo_push_token: input.expoPushToken,
    platform: input.platform,
    device_name: input.deviceName,
    language: normalizeLanguage(input.language),
    timezone: input.timezone || "UTC",
    active: true,
    last_registered_at: now,
    updated_at: now
  };

  const { data, error } = existing?.id
    ? await supabase.from("mobile_push_tokens").update(base).eq("id", existing.id).select("*").single()
    : await supabase
        .from("mobile_push_tokens")
        .insert({
          id: randomUUID(),
          ...base,
          created_at: now
        })
        .select("*")
        .single();

  if (error) throw new Error(error.message);
  return mapPushToken(data);
}

export async function getMobilePushTokensForProfessional(professionalId: string) {
  if (!isSupabaseConfigured()) return [] as PushTokenRecord[];
  const supabase = getSupabaseAdmin();
  if (!supabase) return [] as PushTokenRecord[];

  const { data, error } = await supabase
    .from("mobile_push_tokens")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("active", true)
    .order("updated_at", { ascending: false });

  if (error) return [];
  return (data || []).map(mapPushToken);
}

export async function getMobilePushState(professionalId: string) {
  const tokens = await getMobilePushTokensForProfessional(professionalId);
  const primary = tokens[0];
  return {
    connected: Boolean(primary),
    tokenCount: tokens.length,
    settings: {
      notificationsNewBooking: primary?.notificationsNewBooking ?? true,
      notificationsCabinetBooking: primary?.notificationsCabinetBooking ?? true,
      notificationsRescheduled: primary?.notificationsRescheduled ?? true,
      notificationsCancelled: primary?.notificationsCancelled ?? true,
      notificationsReminder: primary?.notificationsReminder ?? true,
      notificationsToday: primary?.notificationsToday ?? true,
      reminderLeadMinutes: primary?.reminderLeadMinutes ?? 120
    }
  };
}

export async function updateMobilePushSettings(
  professionalId: string,
  settings: Partial<Record<PushSettingKey, boolean>> & { reminderLeadMinutes?: number }
) {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof settings.notificationsNewBooking === "boolean") patch.notifications_new_booking = settings.notificationsNewBooking;
  if (typeof settings.notificationsCabinetBooking === "boolean") patch.notifications_cabinet_booking = settings.notificationsCabinetBooking;
  if (typeof settings.notificationsRescheduled === "boolean") patch.notifications_rescheduled = settings.notificationsRescheduled;
  if (typeof settings.notificationsCancelled === "boolean") patch.notifications_cancelled = settings.notificationsCancelled;
  if (typeof settings.notificationsReminder === "boolean") patch.notifications_reminder = settings.notificationsReminder;
  if (typeof settings.notificationsToday === "boolean") patch.notifications_today = settings.notificationsToday;
  if (typeof settings.reminderLeadMinutes === "number") patch.reminder_lead_minutes = normalizeReminderLeadMinutes(settings.reminderLeadMinutes);

  const { error } = await supabase
    .from("mobile_push_tokens")
    .update(patch)
    .eq("professional_id", professionalId)
    .eq("active", true);

  if (error) throw new Error(error.message);
  return getMobilePushState(professionalId);
}

export async function unregisterMobilePushToken(professionalId: string, expoPushToken: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  if (!supabase || !expoPushToken) return;
  await supabase
    .from("mobile_push_tokens")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("professional_id", professionalId)
    .eq("expo_push_token", expoPushToken);
}

export async function sendBookingPushNotification(input: {
  eventType: PushBookingEventType;
  professionalId: string;
  businessId: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  previousAppointmentDate?: string;
  previousAppointmentTime?: string;
  customerName: string;
  serviceName: string;
}) {
  const records = (await getMobilePushTokensForProfessional(input.professionalId)).filter((record) =>
    canSendBookingEvent(record, input.eventType)
  );
  const messages = records.map((record) => {
    const text = getPushText(record.language);
    const push = buildBookingPush({ text, ...input });
    return {
      to: record.expoPushToken,
      sound: "default",
      title: push.title,
      body: push.body,
      data: {
        type: input.eventType,
        appointmentId: input.appointmentId,
        appointmentDate: input.appointmentDate
      }
    };
  });

  const result = await sendExpoPushMessages(messages);
  await deactivatePushTokens(result.invalidTokens);
  return { sent: result.sent };
}

export function sendOnlineBookingPushNotification(input: Omit<Parameters<typeof sendBookingPushNotification>[0], "eventType">) {
  return sendBookingPushNotification({ eventType: "online_created", ...input });
}

export function sendCabinetBookingPushNotification(input: Omit<Parameters<typeof sendBookingPushNotification>[0], "eventType">) {
  return sendBookingPushNotification({ eventType: "cabinet_created", ...input });
}

export function sendBookingRescheduledPushNotification(input: Omit<Parameters<typeof sendBookingPushNotification>[0], "eventType">) {
  return sendBookingPushNotification({ eventType: "rescheduled", ...input });
}

export function sendBookingCancelledPushNotification(input: Omit<Parameters<typeof sendBookingPushNotification>[0], "eventType">) {
  return sendBookingPushNotification({ eventType: "cancelled", ...input });
}

function sortByTime(left: CalendarAppointment, right: CalendarAppointment) {
  return `${left.appointmentDate} ${left.startTime}`.localeCompare(`${right.appointmentDate} ${right.startTime}`);
}

function minutesUntilAppointment(timezone: string, appointmentDate: string, appointmentTime: string) {
  const localNow = new Date(new Date().toLocaleString("en-US", { timeZone: timezone || "UTC" }));
  const [year, month, day] = appointmentDate.split("-").map((part) => Number(part));
  const [hours, minutes] = appointmentTime.split(":").map((part) => Number(part));
  if (![year, month, day, hours, minutes].every(Number.isFinite)) return Number.NaN;
  const appointmentLocal = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return (appointmentLocal.getTime() - localNow.getTime()) / 60000;
}

async function isPushReminderAlreadySent(input: {
  appointmentId: string;
  professionalId: string;
  reminderType: string;
}) {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { data } = await supabase
    .from("mobile_push_events")
    .select("id")
    .eq("appointment_id", input.appointmentId)
    .eq("professional_id", input.professionalId)
    .eq("event_type", input.reminderType)
    .maybeSingle();
  return Boolean(data?.id);
}

async function markPushReminderSent(input: {
  appointmentId: string;
  professionalId: string;
  businessId: string;
  eventType: string;
}) {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("mobile_push_events").insert({
    id: randomUUID(),
    appointment_id: input.appointmentId,
    professional_id: input.professionalId,
    business_id: input.businessId,
    event_type: input.eventType
  });
}

export async function resetPushReminderEventsForAppointment(input: {
  appointmentId: string;
  professionalId: string;
}) {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase
    .from("mobile_push_events")
    .delete()
    .eq("appointment_id", input.appointmentId)
    .eq("professional_id", input.professionalId);
}

export async function processPushReminders() {
  const stats: ReminderRunStats = { processed: 0, sent: 0, skipped: 0, errors: 0 };
  if (!isSupabaseConfigured()) return stats;
  const supabase = getSupabaseAdmin();
  if (!supabase) return stats;

  const { data, error } = await supabase
    .from("mobile_push_tokens")
    .select("*")
    .eq("active", true)
    .eq("notifications_reminder", true);

  if (error) {
    stats.errors += 1;
    return stats;
  }

  const grouped = new Map<string, PushTokenRecord[]>();
  (data || []).map(mapPushToken).forEach((record) => {
    const current = grouped.get(record.professionalId) || [];
    current.push(record);
    grouped.set(record.professionalId, current);
  });

  for (const records of grouped.values()) {
    const primary = records[0];
    if (!primary) continue;
    try {
      const text = getPushText(primary.language);
      const appointments = await getAppointmentsForBusiness(primary.businessId);
      const ownAppointments = appointments
        .filter(
          (item) =>
            item.kind === "appointment" &&
            item.professionalId === primary.professionalId &&
            (item.attendance === "pending" || item.attendance === "confirmed")
        )
        .sort(sortByTime);

      for (const appointment of ownAppointments) {
        stats.processed += 1;
        const reminderLeadMinutes = normalizeReminderLeadMinutes(primary.reminderLeadMinutes, 120);
        const diff = minutesUntilAppointment(primary.timezone, appointment.appointmentDate, appointment.startTime);
        if (
          !Number.isFinite(diff) ||
          diff < reminderLeadMinutes - reminderWindowMin ||
          diff > reminderLeadMinutes + reminderWindowMin
        ) {
          stats.skipped += 1;
          continue;
        }

        const reminderType = `push_lead_${reminderLeadMinutes}m`;
        if (
          await isPushReminderAlreadySent({
            appointmentId: appointment.id,
            professionalId: primary.professionalId,
            reminderType
          })
        ) {
          stats.skipped += 1;
          continue;
        }

        const result = await sendExpoPushMessages(
          records.map((record) => ({
            to: record.expoPushToken,
            sound: "default",
            title: text.reminderPrefix,
            body: `${appointment.appointmentDate} ${appointment.startTime} · ${appointment.customerName.trim() || text.unknownClient} · ${appointment.serviceName.trim() || "-"}`,
            data: {
              type: "reminder",
              appointmentId: appointment.id,
              appointmentDate: appointment.appointmentDate
            }
          }))
        );
        await deactivatePushTokens(result.invalidTokens);
        await markPushReminderSent({
          appointmentId: appointment.id,
          professionalId: primary.professionalId,
          businessId: primary.businessId,
          eventType: reminderType
        });
        stats.sent += result.sent;
      }
    } catch {
      stats.errors += 1;
    }
  }

  return stats;
}
