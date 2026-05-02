import { promises as fs } from "fs";
import path from "path";
import { getPublicAppUrl } from "./app-url";
import { getAppointmentsForBusiness, type CalendarAppointment } from "./pro-calendar";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type TelegramLanguage = "ru" | "uk" | "en";

export type TelegramConnection = {
  id: string;
  professionalId: string;
  businessId: string;
  connectToken: string;
  connectTokenExpiresAt: string;
  chatId: string;
  telegramUserId: number | null;
  telegramUsername: string;
  telegramFirstName: string;
  telegramLastName: string;
  language: TelegramLanguage;
  timezone: string;
  notificationsNewBooking: boolean;
  notificationsReminder: boolean;
  notificationsToday: boolean;
  forwardingEnabled: boolean;
  connectedAt: string | null;
  lastInteractionAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TelegramSettingKey =
  | "notificationsNewBooking"
  | "notificationsReminder"
  | "notificationsToday"
  | "forwardingEnabled";

type TelegramReminderEvent = {
  id: string;
  appointmentId: string;
  professionalId: string;
  businessId: string;
  chatId: string;
  reminderType: string;
  sentAt: string;
};

type TelegramStore = {
  connections: TelegramConnection[];
  reminderEvents: TelegramReminderEvent[];
};

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

type TelegramBotCommand = {
  command: string;
  description: string;
};

type TelegramInlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

type TelegramReplyMarkup = {
  inline_keyboard: TelegramInlineKeyboardButton[][];
};

type TelegramText = {
  connected: string;
  invalidToken: string;
  connectHint: string;
  help: string;
  todayEmpty: string;
  todayHeader: string;
  settingsTitle: string;
  noConnection: string;
  bookingCreated: string;
  reminderPrefix: string;
  confirm: string;
  cancel: string;
  openBooking: string;
  openDashboard: string;
  newBookingsLabel: string;
  remindersLabel: string;
  todayLabel: string;
  forwardingLabel: string;
  enabled: string;
  disabled: string;
  settingUpdated: string;
  forwardSuccess: string;
  forwardDisabled: string;
  actionDoneConfirm: string;
  actionDoneCancel: string;
  actionNotFound: string;
};

type TodayBookingItem = Pick<
  CalendarAppointment,
  "id" | "appointmentDate" | "startTime" | "serviceName" | "customerName" | "attendance"
>;

type ReminderRunStats = {
  processed: number;
  sent: number;
  skipped: number;
  errors: number;
};

const storePath = path.join(process.cwd(), "data", "telegram-bot.json");
const connectTokenTtlHours = Math.max(
  1,
  Number.parseInt(process.env.TELEGRAM_CONNECT_TOKEN_TTL_HOURS || "72", 10) || 72
);
const reminderWindowMin = Number.parseInt(process.env.TELEGRAM_REMINDER_WINDOW_MIN || "15", 10) || 15;
const commandsSyncTtlMs = Math.max(
  60_000,
  Number.parseInt(process.env.TELEGRAM_BOOKING_COMMANDS_SYNC_TTL_MS || "21600000", 10) || 21_600_000
);

let cachedBotUsername: string | null = null;
let cachedBotUsernameFetchedAt = 0;
let cachedCommandsSyncedAt = 0;
let activeCommandsSyncPromise: Promise<boolean> | null = null;

const BOOKING_CALLBACK_PREFIX = "tvbk";
const SETTINGS_CALLBACK_PREFIX = "tvst";

const textByLanguage: Record<TelegramLanguage, TelegramText> = {
  ru: {
    connected: "Telegram подключен. Теперь вы получаете новые записи прямо здесь.",
    invalidToken: "Ссылка подключения недействительна. Сгенерируйте новую ссылку в кабинете.",
    connectHint: "Подключите Telegram через кабинет Timviz и повторите команду.",
    help: "Timviz bot: /today — записи на сегодня, /settings — уведомления.",
    todayEmpty: "На сегодня записей нет.",
    todayHeader: "Записи на сегодня",
    settingsTitle: "Настройки уведомлений",
    noConnection: "Этот чат не подключен к Timviz.",
    bookingCreated: "Новая онлайн-запись",
    reminderPrefix: "Напоминание: запись через 2 часа",
    confirm: "Подтвердить",
    cancel: "Отменить",
    openBooking: "Открыть запись",
    openDashboard: "Открыть кабинет",
    newBookingsLabel: "Новые записи",
    remindersLabel: "Напоминания",
    todayLabel: "Команда /today",
    forwardingLabel: "Пересылка в поддержку",
    enabled: "вкл",
    disabled: "выкл",
    settingUpdated: "Настройка обновлена.",
    forwardSuccess: "Сообщение переслано в поддержку.",
    forwardDisabled: "Пересылка отключена в настройках.",
    actionDoneConfirm: "Запись подтверждена.",
    actionDoneCancel: "Запись отменена.",
    actionNotFound: "Запись уже обработана или не найдена."
  },
  uk: {
    connected: "Telegram підключено. Тепер нові записи приходять прямо сюди.",
    invalidToken: "Посилання підключення недійсне. Згенеруйте нове в кабінеті.",
    connectHint: "Підключіть Telegram у кабінеті Timviz і повторіть команду.",
    help: "Timviz bot: /today — записи на сьогодні, /settings — сповіщення.",
    todayEmpty: "На сьогодні записів немає.",
    todayHeader: "Записи на сьогодні",
    settingsTitle: "Налаштування сповіщень",
    noConnection: "Цей чат не підключено до Timviz.",
    bookingCreated: "Новий онлайн-запис",
    reminderPrefix: "Нагадування: запис через 2 години",
    confirm: "Підтвердити",
    cancel: "Скасувати",
    openBooking: "Відкрити запис",
    openDashboard: "Відкрити кабінет",
    newBookingsLabel: "Нові записи",
    remindersLabel: "Нагадування",
    todayLabel: "Команда /today",
    forwardingLabel: "Пересилка в підтримку",
    enabled: "увімк",
    disabled: "вимк",
    settingUpdated: "Налаштування оновлено.",
    forwardSuccess: "Повідомлення переслано в підтримку.",
    forwardDisabled: "Пересилку вимкнено в налаштуваннях.",
    actionDoneConfirm: "Запис підтверджено.",
    actionDoneCancel: "Запис скасовано.",
    actionNotFound: "Запис уже оброблено або не знайдено."
  },
  en: {
    connected: "Telegram is connected. New bookings will arrive here.",
    invalidToken: "Connection link is invalid. Generate a new one in dashboard.",
    connectHint: "Connect Telegram in Timviz dashboard and try again.",
    help: "Timviz bot: /today for today's bookings, /settings for notification toggles.",
    todayEmpty: "No bookings for today.",
    todayHeader: "Today's bookings",
    settingsTitle: "Notification settings",
    noConnection: "This chat is not connected to Timviz.",
    bookingCreated: "New online booking",
    reminderPrefix: "Reminder: booking in 2 hours",
    confirm: "Confirm",
    cancel: "Cancel",
    openBooking: "Open booking",
    openDashboard: "Open dashboard",
    newBookingsLabel: "New bookings",
    remindersLabel: "Reminders",
    todayLabel: "/today command",
    forwardingLabel: "Forward to support",
    enabled: "on",
    disabled: "off",
    settingUpdated: "Setting updated.",
    forwardSuccess: "Message forwarded to support.",
    forwardDisabled: "Forwarding is disabled in settings.",
    actionDoneConfirm: "Booking confirmed.",
    actionDoneCancel: "Booking cancelled.",
    actionNotFound: "Booking is already handled or not found."
  }
};

const commandsByLanguage: Record<TelegramLanguage, TelegramBotCommand[]> = {
  ru: [
    { command: "today", description: "Записи на сегодня" },
    { command: "settings", description: "Настройки уведомлений" }
  ],
  uk: [
    { command: "today", description: "Записи на сьогодні" },
    { command: "settings", description: "Налаштування сповіщень" }
  ],
  en: [
    { command: "today", description: "Today bookings" },
    { command: "settings", description: "Notification settings" }
  ]
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeLanguage(input: string | null | undefined): TelegramLanguage {
  if (input === "ru" || input === "uk" || input === "en") {
    return input;
  }
  return "en";
}

export function normalizeTelegramUserLanguage(
  languageCode: string | null | undefined,
  fallbackLanguage?: string | null
): TelegramLanguage {
  const normalized = (languageCode || "").trim().toLowerCase();

  if (normalized.startsWith("ru")) {
    return "ru";
  }

  if (normalized === "ua" || normalized.startsWith("uk")) {
    return "uk";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return normalizeLanguage(fallbackLanguage);
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapConnectionRow(row: Record<string, unknown>): TelegramConnection {
  return {
    id: String(row.id ?? ""),
    professionalId: String(row.professional_id ?? ""),
    businessId: String(row.business_id ?? ""),
    connectToken: String(row.connect_token ?? ""),
    connectTokenExpiresAt: String(row.connect_token_expires_at ?? new Date(0).toISOString()),
    chatId: String(row.chat_id ?? ""),
    telegramUserId: parseNumber(row.telegram_user_id),
    telegramUsername: String(row.telegram_username ?? ""),
    telegramFirstName: String(row.telegram_first_name ?? ""),
    telegramLastName: String(row.telegram_last_name ?? ""),
    language: normalizeLanguage(String(row.language ?? "")),
    timezone: String(row.timezone ?? "UTC") || "UTC",
    notificationsNewBooking: row.notifications_new_booking !== false,
    notificationsReminder: row.notifications_reminder !== false,
    notificationsToday: row.notifications_today !== false,
    forwardingEnabled: row.forwarding_enabled !== false,
    connectedAt: row.connected_at ? String(row.connected_at) : null,
    lastInteractionAt: row.last_interaction_at ? String(row.last_interaction_at) : null,
    createdAt: String(row.created_at ?? new Date(0).toISOString()),
    updatedAt: String(row.updated_at ?? new Date(0).toISOString())
  };
}

function mapReminderRow(row: Record<string, unknown>): TelegramReminderEvent {
  return {
    id: String(row.id ?? ""),
    appointmentId: String(row.appointment_id ?? ""),
    professionalId: String(row.professional_id ?? ""),
    businessId: String(row.business_id ?? ""),
    chatId: String(row.chat_id ?? ""),
    reminderType: String(row.reminder_type ?? "2h"),
    sentAt: String(row.sent_at ?? new Date(0).toISOString())
  };
}

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    const initial: TelegramStore = {
      connections: [],
      reminderEvents: []
    };
    await fs.writeFile(storePath, JSON.stringify(initial, null, 2) + "\n", "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<TelegramStore>;
  return {
    connections: Array.isArray(parsed.connections) ? parsed.connections : [],
    reminderEvents: Array.isArray(parsed.reminderEvents) ? parsed.reminderEvents : []
  } satisfies TelegramStore;
}

async function writeStore(store: TelegramStore) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function makeConnectToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function getBotToken() {
  return (
    process.env.TELEGRAM_BOOKING_BOT_TOKEN ||
    ""
  ).trim();
}

function getSupportChatId() {
  return (
    process.env.TELEGRAM_SUPPORT_CHAT_ID ||
    process.env.SUPPORT_TELEGRAM_CHAT_ID ||
    ""
  ).trim();
}

function getWebhookSecret() {
  return (
    process.env.TELEGRAM_BOOKING_WEBHOOK_SECRET ||
    ""
  ).trim();
}

export function isTelegramBotConfigured() {
  return Boolean(getBotToken());
}

export function getTelegramWebhookSecret() {
  return getWebhookSecret();
}

async function setTelegramCommandsForLanguage(
  language: TelegramLanguage | null
) {
  const commands = language ? commandsByLanguage[language] : commandsByLanguage.en;
  const payload: Record<string, unknown> = {
    commands
  };

  if (language) {
    payload.language_code = language;
  }

  await telegramApiRequest<boolean>("setMyCommands", payload);
}

export async function ensureTelegramBotCommandsConfigured(input: { force?: boolean } = {}) {
  if (!isTelegramBotConfigured()) {
    return false;
  }

  const force = input.force === true;
  if (!force && Date.now() - cachedCommandsSyncedAt < commandsSyncTtlMs) {
    return true;
  }

  if (!force && activeCommandsSyncPromise) {
    return activeCommandsSyncPromise;
  }

  const promise = (async () => {
    try {
      await setTelegramCommandsForLanguage(null);
      await setTelegramCommandsForLanguage("ru");
      await setTelegramCommandsForLanguage("uk");
      await setTelegramCommandsForLanguage("en");
      cachedCommandsSyncedAt = Date.now();
      return true;
    } catch {
      return false;
    }
  })();

  if (!force) {
    activeCommandsSyncPromise = promise.finally(() => {
      activeCommandsSyncPromise = null;
    });
    return activeCommandsSyncPromise;
  }

  return promise;
}

async function telegramApiRequest<T>(method: string, payload: Record<string, unknown>) {
  const token = getBotToken();

  if (!token) {
    throw new Error("TELEGRAM_BOOKING_BOT_TOKEN is not configured.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.status}`);
  }

  const data = (await response.json()) as TelegramApiResponse<T>;
  if (!data.ok) {
    throw new Error(data.description || "Telegram API request failed.");
  }

  return data.result as T;
}

export async function sendTelegramTextMessage(input: {
  chatId: string;
  text: string;
  replyMarkup?: TelegramReplyMarkup;
  disablePreview?: boolean;
}) {
  if (!isTelegramBotConfigured()) {
    return false;
  }

  const payload: Record<string, unknown> = {
    chat_id: input.chatId,
    text: input.text.slice(0, 4096),
    disable_web_page_preview: input.disablePreview !== false
  };

  if (input.replyMarkup) {
    payload.reply_markup = input.replyMarkup;
  }

  await telegramApiRequest("sendMessage", payload);
  return true;
}

export async function answerTelegramCallbackQuery(callbackQueryId: string, text?: string) {
  if (!isTelegramBotConfigured()) {
    return;
  }

  const payload: Record<string, unknown> = {
    callback_query_id: callbackQueryId
  };

  if (text?.trim()) {
    payload.text = text.trim().slice(0, 160);
  }

  await telegramApiRequest("answerCallbackQuery", payload);
}

export async function getTelegramBotUsername() {
  const fromEnv = (process.env.TELEGRAM_BOOKING_BOT_USERNAME || "").trim().replace(/^@/, "");
  if (fromEnv) {
    return fromEnv;
  }

  if (
    cachedBotUsername &&
    Date.now() - cachedBotUsernameFetchedAt < 5 * 60 * 1000
  ) {
    return cachedBotUsername;
  }

  if (!isTelegramBotConfigured()) {
    return null;
  }

  try {
    const me = await telegramApiRequest<{ username?: string }>("getMe", {});
    const username = String(me?.username ?? "").trim();
    if (username) {
      cachedBotUsername = username;
      cachedBotUsernameFetchedAt = Date.now();
      return username;
    }
  } catch {
    return null;
  }

  return null;
}

function toConnectionInsertPayload(input: TelegramConnection) {
  return {
    id: input.id,
    professional_id: input.professionalId,
    business_id: input.businessId,
    connect_token: input.connectToken,
    connect_token_expires_at: input.connectTokenExpiresAt,
    chat_id: input.chatId || null,
    telegram_user_id: input.telegramUserId,
    telegram_username: input.telegramUsername,
    telegram_first_name: input.telegramFirstName,
    telegram_last_name: input.telegramLastName,
    language: input.language,
    timezone: input.timezone,
    notifications_new_booking: input.notificationsNewBooking,
    notifications_reminder: input.notificationsReminder,
    notifications_today: input.notificationsToday,
    forwarding_enabled: input.forwardingEnabled,
    connected_at: input.connectedAt,
    last_interaction_at: input.lastInteractionAt,
    created_at: input.createdAt,
    updated_at: input.updatedAt
  };
}

async function upsertConnection(connection: TelegramConnection) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { data, error } = await supabase
      .from("telegram_connections")
      .upsert(toConnectionInsertPayload(connection), { onConflict: "professional_id" })
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Failed to save Telegram connection.");
    }

    return mapConnectionRow(data as Record<string, unknown>);
  }

  const store = await readStore();
  const existingIndex = store.connections.findIndex((item) => item.professionalId === connection.professionalId);

  if (existingIndex >= 0) {
    store.connections[existingIndex] = connection;
  } else {
    store.connections.push(connection);
  }

  await writeStore(store);
  return connection;
}

export async function getTelegramConnectionByProfessionalId(professionalId: string) {
  const id = professionalId.trim();
  if (!id) {
    return null;
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("telegram_connections")
      .select("*")
      .eq("professional_id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapConnectionRow(data as Record<string, unknown>) : null;
  }

  const store = await readStore();
  return store.connections.find((item) => item.professionalId === id) ?? null;
}

export async function getTelegramConnectionByChatId(chatId: string) {
  const normalized = chatId.trim();
  if (!normalized) {
    return null;
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("telegram_connections")
      .select("*")
      .eq("chat_id", normalized)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapConnectionRow(data as Record<string, unknown>) : null;
  }

  const store = await readStore();
  return store.connections.find((item) => item.chatId === normalized) ?? null;
}

export async function ensureTelegramConnectToken(input: {
  professionalId: string;
  businessId: string;
  language?: string;
  timezone?: string;
}) {
  const existing = await getTelegramConnectionByProfessionalId(input.professionalId);
  const now = new Date();
  const nextExpiry = new Date(now.getTime() + connectTokenTtlHours * 60 * 60 * 1000).toISOString();

  const nextConnection: TelegramConnection = {
    id: existing?.id || makeId("tgc"),
    professionalId: input.professionalId,
    businessId: input.businessId,
    connectToken: makeConnectToken(),
    connectTokenExpiresAt: nextExpiry,
    chatId: existing?.chatId ?? "",
    telegramUserId: existing?.telegramUserId ?? null,
    telegramUsername: existing?.telegramUsername ?? "",
    telegramFirstName: existing?.telegramFirstName ?? "",
    telegramLastName: existing?.telegramLastName ?? "",
    language: normalizeLanguage(input.language || existing?.language),
    timezone: (input.timezone || existing?.timezone || "UTC").trim() || "UTC",
    notificationsNewBooking: existing?.notificationsNewBooking ?? true,
    notificationsReminder: existing?.notificationsReminder ?? true,
    notificationsToday: existing?.notificationsToday ?? true,
    forwardingEnabled: existing?.forwardingEnabled ?? true,
    connectedAt: existing?.connectedAt ?? null,
    lastInteractionAt: existing?.lastInteractionAt ?? null,
    createdAt: existing?.createdAt || now.toISOString(),
    updatedAt: now.toISOString()
  };

  const saved = await upsertConnection(nextConnection);
  const botUsername = await getTelegramBotUsername();
  if (!botUsername) {
    throw new Error("Telegram bot username is missing. Set TELEGRAM_BOOKING_BOT_USERNAME.");
  }
  const deepLink = `https://t.me/${botUsername}?start=connect_${saved.connectToken}`;

  return {
    connection: saved,
    deepLink,
    tokenExpiresAt: saved.connectTokenExpiresAt
  };
}

async function findConnectionByConnectToken(token: string) {
  const normalized = token.trim();
  if (!normalized) {
    return null;
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("telegram_connections")
      .select("*")
      .eq("connect_token", normalized)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapConnectionRow(data as Record<string, unknown>) : null;
  }

  const store = await readStore();
  return store.connections.find((item) => item.connectToken === normalized) ?? null;
}

export async function connectTelegramChatByToken(input: {
  token: string;
  chatId: string;
  telegramUserId?: number | null;
  telegramUsername?: string;
  telegramFirstName?: string;
  telegramLastName?: string;
  telegramLanguageCode?: string;
}) {
  const connection = await findConnectionByConnectToken(input.token);
  if (!connection) {
    return null;
  }

  const tokenExpiryTs = new Date(connection.connectTokenExpiresAt).getTime();
  if (!Number.isFinite(tokenExpiryTs) || tokenExpiryTs < Date.now()) {
    return null;
  }

  const now = nowIso();
  const next: TelegramConnection = {
    ...connection,
    chatId: input.chatId.trim(),
    telegramUserId:
      typeof input.telegramUserId === "number" && Number.isFinite(input.telegramUserId)
        ? input.telegramUserId
        : connection.telegramUserId,
    telegramUsername: input.telegramUsername?.trim() || connection.telegramUsername,
    telegramFirstName: input.telegramFirstName?.trim() || connection.telegramFirstName,
    telegramLastName: input.telegramLastName?.trim() || connection.telegramLastName,
    language: normalizeTelegramUserLanguage(input.telegramLanguageCode, connection.language),
    connectedAt: connection.connectedAt || now,
    lastInteractionAt: now,
    updatedAt: now
  };

  return upsertConnection(next);
}

export async function touchTelegramConnection(
  connection: TelegramConnection,
  languageCode?: string
) {
  const nextLanguage = languageCode
    ? normalizeTelegramUserLanguage(languageCode, connection.language)
    : connection.language;

  const next: TelegramConnection = {
    ...connection,
    language: nextLanguage,
    lastInteractionAt: nowIso(),
    updatedAt: nowIso()
  };

  return upsertConnection(next);
}

export async function toggleTelegramConnectionSetting(
  connection: TelegramConnection,
  key: TelegramSettingKey
) {
  const next: TelegramConnection = {
    ...connection,
    [key]: !connection[key],
    updatedAt: nowIso()
  };

  return upsertConnection(next);
}

export function getTelegramText(language: string | null | undefined) {
  return textByLanguage[normalizeLanguage(language)];
}

export function getDashboardUrl(pathname = "/pro/calendar") {
  const base = getPublicAppUrl();
  if (!pathname.startsWith("/")) {
    return `${base}/${pathname}`;
  }
  return `${base}${pathname}`;
}

export function buildBookingCallbackData(action: "confirm" | "cancel", appointmentId: string) {
  const mode = action === "confirm" ? "c" : "x";
  return `${BOOKING_CALLBACK_PREFIX}:${mode}:${appointmentId}`;
}

export function parseBookingCallbackData(value: string) {
  const [prefix, action, appointmentId] = value.split(":");
  if (prefix !== BOOKING_CALLBACK_PREFIX || !appointmentId) {
    return null;
  }

  if (action === "c") {
    return { action: "confirm" as const, appointmentId };
  }

  if (action === "x") {
    return { action: "cancel" as const, appointmentId };
  }

  return null;
}

export function buildSettingsCallbackData(key: TelegramSettingKey) {
  const normalized = key === "notificationsNewBooking"
    ? "nb"
    : key === "notificationsReminder"
      ? "nr"
      : key === "notificationsToday"
        ? "nt"
        : "fw";
  return `${SETTINGS_CALLBACK_PREFIX}:${normalized}`;
}

export function parseSettingsCallbackData(value: string): TelegramSettingKey | null {
  const [prefix, key] = value.split(":");
  if (prefix !== SETTINGS_CALLBACK_PREFIX) {
    return null;
  }

  if (key === "nb") return "notificationsNewBooking";
  if (key === "nr") return "notificationsReminder";
  if (key === "nt") return "notificationsToday";
  if (key === "fw") return "forwardingEnabled";
  return null;
}

function toggleText(enabled: boolean, text: TelegramText) {
  return enabled ? text.enabled : text.disabled;
}

export function buildSettingsMessage(connection: TelegramConnection) {
  const text = getTelegramText(connection.language);
  return {
    text: `${text.settingsTitle}\n${text.connectHint}`,
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: `${text.newBookingsLabel}: ${toggleText(connection.notificationsNewBooking, text)}`,
            callback_data: buildSettingsCallbackData("notificationsNewBooking")
          }
        ],
        [
          {
            text: `${text.remindersLabel}: ${toggleText(connection.notificationsReminder, text)}`,
            callback_data: buildSettingsCallbackData("notificationsReminder")
          }
        ],
        [
          {
            text: `${text.todayLabel}: ${toggleText(connection.notificationsToday, text)}`,
            callback_data: buildSettingsCallbackData("notificationsToday")
          }
        ],
        [
          {
            text: `${text.forwardingLabel}: ${toggleText(connection.forwardingEnabled, text)}`,
            callback_data: buildSettingsCallbackData("forwardingEnabled")
          }
        ],
        [
          {
            text: text.openDashboard,
            url: getDashboardUrl("/pro/calendar")
          }
        ]
      ]
    } satisfies TelegramReplyMarkup
  };
}

function mapAttendanceLabel(attendance: string, language: TelegramLanguage) {
  if (attendance === "confirmed" || attendance === "arrived") {
    return language === "uk" ? "підтверджено" : language === "ru" ? "подтверждено" : "confirmed";
  }
  if (attendance === "no_show") {
    return language === "uk" ? "не прийшов" : language === "ru" ? "не пришел" : "no-show";
  }
  return language === "uk" ? "очікує" : language === "ru" ? "ожидает" : "pending";
}

function formatNowInTimezone(timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  const parts = formatter.formatToParts(new Date());
  const map = new Map(parts.map((part) => [part.type, part.value]));
  const year = map.get("year") || "1970";
  const month = map.get("month") || "01";
  const day = map.get("day") || "01";
  const hour = map.get("hour") || "00";
  const minute = map.get("minute") || "00";
  return {
    dateKey: `${year}-${month}-${day}`,
    timeKey: `${hour}:${minute}`
  };
}

function parseDateAndTimeToMs(dateKey: string, timeKey: string) {
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  const [hour, minute] = timeKey.split(":").map((part) => Number.parseInt(part, 10));
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return Number.NaN;
  }
  return Date.UTC(year, month - 1, day, hour, minute, 0, 0);
}

function minutesUntilAppointment(
  timezone: string,
  appointmentDate: string,
  appointmentTime: string
) {
  const now = formatNowInTimezone(timezone);
  const appointmentMs = parseDateAndTimeToMs(appointmentDate, appointmentTime);
  const nowMs = parseDateAndTimeToMs(now.dateKey, now.timeKey);

  if (!Number.isFinite(appointmentMs) || !Number.isFinite(nowMs)) {
    return Number.NaN;
  }

  return Math.round((appointmentMs - nowMs) / 60000);
}

function sortByTime(left: { startTime: string }, right: { startTime: string }) {
  return left.startTime.localeCompare(right.startTime);
}

export async function getTodayBookingsForConnection(connection: TelegramConnection) {
  const todayDate = formatNowInTimezone(connection.timezone).dateKey;
  const appointments = await getAppointmentsForBusiness(connection.businessId);

  return appointments
    .filter(
      (item) =>
        item.kind === "appointment" &&
        item.professionalId === connection.professionalId &&
        item.appointmentDate === todayDate
    )
    .sort(sortByTime)
    .map((item) => ({
      id: item.id,
      appointmentDate: item.appointmentDate,
      startTime: item.startTime,
      serviceName: item.serviceName,
      customerName: item.customerName,
      attendance: item.attendance
    })) satisfies TodayBookingItem[];
}

export function formatTodayBookingsMessage(connection: TelegramConnection, bookings: TodayBookingItem[]) {
  const text = getTelegramText(connection.language);
  if (!bookings.length) {
    return text.todayEmpty;
  }

  const lines = bookings
    .slice(0, 20)
    .map((item) => {
      const status = mapAttendanceLabel(item.attendance, connection.language);
      const name = item.customerName.trim() || "Client";
      const service = item.serviceName.trim() || "-";
      return `${item.startTime} • ${name} • ${service} • ${status}`;
    });

  return `${text.todayHeader}\n${lines.join("\n")}`;
}

async function isReminderAlreadySent(input: {
  appointmentId: string;
  professionalId: string;
  reminderType: string;
}) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return false;
    }

    const { data, error } = await supabase
      .from("telegram_reminder_events")
      .select("id")
      .eq("appointment_id", input.appointmentId)
      .eq("professional_id", input.professionalId)
      .eq("reminder_type", input.reminderType)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.id);
  }

  const store = await readStore();
  return store.reminderEvents.some(
    (item) =>
      item.appointmentId === input.appointmentId &&
      item.professionalId === input.professionalId &&
      item.reminderType === input.reminderType
  );
}

async function markReminderSent(input: {
  appointmentId: string;
  professionalId: string;
  businessId: string;
  chatId: string;
  reminderType: string;
}) {
  const row: TelegramReminderEvent = {
    id: makeId("tgr"),
    appointmentId: input.appointmentId,
    professionalId: input.professionalId,
    businessId: input.businessId,
    chatId: input.chatId,
    reminderType: input.reminderType,
    sentAt: nowIso()
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return;
    }

    const { error } = await supabase
      .from("telegram_reminder_events")
      .upsert(
        {
          id: row.id,
          appointment_id: row.appointmentId,
          professional_id: row.professionalId,
          business_id: row.businessId,
          chat_id: row.chatId,
          reminder_type: row.reminderType,
          sent_at: row.sentAt
        },
        {
          onConflict: "appointment_id,professional_id,reminder_type"
        }
      );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const store = await readStore();
  const exists = store.reminderEvents.some(
    (item) =>
      item.appointmentId === row.appointmentId &&
      item.professionalId === row.professionalId &&
      item.reminderType === row.reminderType
  );
  if (!exists) {
    store.reminderEvents.push(row);
    await writeStore(store);
  }
}

function buildDashboardKeyboard(text: TelegramText, path = "/pro/calendar") {
  return {
    inline_keyboard: [
      [
        {
          text: text.openDashboard,
          url: getDashboardUrl(path)
        }
      ]
    ]
  } satisfies TelegramReplyMarkup;
}

function buildBookingKeyboard(
  language: TelegramLanguage,
  appointmentId: string,
  appointmentDate: string
) {
  const text = getTelegramText(language);
  return {
    inline_keyboard: [
      [
        {
          text: text.confirm,
          callback_data: buildBookingCallbackData("confirm", appointmentId)
        },
        {
          text: text.cancel,
          callback_data: buildBookingCallbackData("cancel", appointmentId)
        }
      ],
      [
        {
          text: text.openBooking,
          url: getDashboardUrl(`/pro/calendar?date=${encodeURIComponent(appointmentDate)}&panel=notifications`)
        }
      ]
    ]
  } satisfies TelegramReplyMarkup;
}

export async function sendBookingTelegramNotification(input: {
  professionalId: string;
  businessId: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  customerName: string;
  serviceName: string;
}) {
  const connection = await getTelegramConnectionByProfessionalId(input.professionalId);
  if (!connection || !connection.chatId || !connection.connectedAt) {
    return { sent: false, reason: "not_connected" as const };
  }

  if (!connection.notificationsNewBooking) {
    return { sent: false, reason: "disabled" as const };
  }

  const text = getTelegramText(connection.language);
  const message = [
    `${text.bookingCreated}`,
    `${input.appointmentDate} ${input.appointmentTime}`,
    `${input.customerName.trim() || "Client"}`,
    `${input.serviceName.trim() || "-"}`
  ].join("\n");

  await sendTelegramTextMessage({
    chatId: connection.chatId,
    text: message,
    replyMarkup: buildBookingKeyboard(connection.language, input.appointmentId, input.appointmentDate)
  });

  return { sent: true as const };
}

export async function processTelegramReminders() {
  const stats: ReminderRunStats = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0
  };

  const connections = await getAllConnectedTelegramConnections();
  for (const connection of connections) {
    if (!connection.notificationsReminder || !connection.chatId) {
      stats.skipped += 1;
      continue;
    }

    const text = getTelegramText(connection.language);
    try {
      const appointments = await getAppointmentsForBusiness(connection.businessId);
      const ownAppointments = appointments
        .filter(
          (item) =>
            item.kind === "appointment" &&
            item.professionalId === connection.professionalId &&
            (item.attendance === "pending" || item.attendance === "confirmed")
        )
        .sort(sortByTime);

      for (const appointment of ownAppointments) {
        stats.processed += 1;
        const diff = minutesUntilAppointment(
          connection.timezone,
          appointment.appointmentDate,
          appointment.startTime
        );

        if (!Number.isFinite(diff) || diff < 120 - reminderWindowMin || diff > 120 + reminderWindowMin) {
          stats.skipped += 1;
          continue;
        }

        const reminderType = "2h";
        const alreadySent = await isReminderAlreadySent({
          appointmentId: appointment.id,
          professionalId: connection.professionalId,
          reminderType
        });
        if (alreadySent) {
          stats.skipped += 1;
          continue;
        }

        const reminderMessage = [
          text.reminderPrefix,
          `${appointment.appointmentDate} ${appointment.startTime}`,
          `${appointment.customerName.trim() || "Client"}`,
          `${appointment.serviceName.trim() || "-"}`
        ].join("\n");

        await sendTelegramTextMessage({
          chatId: connection.chatId,
          text: reminderMessage,
          replyMarkup: buildDashboardKeyboard(
            text,
            `/pro/calendar?date=${encodeURIComponent(appointment.appointmentDate)}`
          )
        });

        await markReminderSent({
          appointmentId: appointment.id,
          professionalId: connection.professionalId,
          businessId: connection.businessId,
          chatId: connection.chatId,
          reminderType
        });

        stats.sent += 1;
      }
    } catch {
      stats.errors += 1;
    }
  }

  return stats;
}

export async function getAllConnectedTelegramConnections() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return [] as TelegramConnection[];
    }

    const { data, error } = await supabase
      .from("telegram_connections")
      .select("*")
      .not("chat_id", "is", null);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? [])
      .map((row) => mapConnectionRow(row as Record<string, unknown>))
      .filter((item) => item.chatId && item.connectedAt);
  }

  const store = await readStore();
  return store.connections.filter((item) => item.chatId && item.connectedAt);
}

export async function forwardTelegramMessageToSupport(input: {
  connection: TelegramConnection;
  text: string;
  chatId: string;
}) {
  const supportChatId = getSupportChatId();
  if (!supportChatId) {
    return false;
  }

  const messageText = input.text.trim();
  if (!messageText) {
    return false;
  }

  const supportText = [
    "↪️ Forwarded from Timviz Telegram bot",
    `Professional ID: ${input.connection.professionalId}`,
    `Business ID: ${input.connection.businessId}`,
    `Chat ID: ${input.chatId}`,
    "",
    messageText,
    "",
    getDashboardUrl("/pro/calendar")
  ].join("\n");

  await sendTelegramTextMessage({
    chatId: supportChatId,
    text: supportText
  });

  return true;
}
