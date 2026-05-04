import { NextResponse } from "next/server";
import {
  answerTelegramCallbackQuery,
  buildMenuCallbackData,
  buildSettingsMessage,
  connectTelegramChatByToken,
  ensureTelegramBotCommandsConfigured,
  forwardTelegramMessageToSupport,
  formatTodayBookingsMessage,
  getDashboardUrl,
  getTelegramMiniAppUrl,
  getTelegramConnectionByChatId,
  getTelegramText,
  getTodayBookingsForConnection,
  getTelegramWebhookSecret,
  normalizeTelegramUserLanguage,
  parseBotControlCallbackData,
  parseMenuCallbackData,
  parseReminderLeadCallbackData,
  parseBookingCallbackData,
  parseSettingsSectionCallbackData,
  parseSettingsCallbackData,
  setTelegramConnectionSettings,
  sendTelegramTextMessage,
  toggleTelegramConnectionSetting,
  touchTelegramConnection
} from "../../../../lib/telegram-bot";
import {
  cancelBookingFromCalendarAppointment,
  syncBookingStatusFromCalendarAppointment
} from "../../../../lib/bookings";
import {
  deleteCalendarAppointment,
  getAppointmentsForBusiness,
  updateCalendarAppointmentMeta
} from "../../../../lib/pro-calendar";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    caption?: string;
    chat?: { id?: number | string };
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      language_code?: string;
    };
    forward_origin?: unknown;
    forward_from?: unknown;
    forward_from_chat?: unknown;
  };
  callback_query?: {
    id?: string;
    data?: string;
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      language_code?: string;
    };
    message?: {
      message_id?: number;
      chat?: { id?: number | string };
    };
  };
};

const supportModeTtlMs = Math.max(
  60_000,
  Number.parseInt(process.env.TELEGRAM_BOOKING_SUPPORT_MODE_TTL_MS || "900000", 10) || 900_000
);
const supportModeByChat = new Map<string, number>();

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readChatId(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "";
  }
  return "";
}

function parseCommand(text: string) {
  const normalized = text.trim();
  if (!normalized.startsWith("/")) {
    return null;
  }

  const [commandRaw, ...argParts] = normalized.split(/\s+/);
  const command = commandRaw.split("@")[0]?.toLowerCase() || "";
  return {
    command,
    args: argParts
  };
}

function takeSupportMode(chatId: string) {
  const expiresAt = supportModeByChat.get(chatId);
  if (!expiresAt) {
    return false;
  }

  supportModeByChat.delete(chatId);
  if (expiresAt < Date.now()) {
    return false;
  }

  return true;
}

function enableSupportMode(chatId: string) {
  supportModeByChat.set(chatId, Date.now() + supportModeTtlMs);
}

function parseSupportPrefix(text: string) {
  const normalized = text.trim();
  const prefixes = [
    /^support\s*[:\-]\s*/i,
    /^поддержка\s*[:\-]\s*/i,
    /^підтримка\s*[:\-]\s*/i
  ];

  for (const pattern of prefixes) {
    if (pattern.test(normalized)) {
      return normalized.replace(pattern, "").trim();
    }
  }

  return "";
}

function isForwardedMessage(message: TelegramUpdate["message"]) {
  if (!message) {
    return false;
  }
  return Boolean(message.forward_origin || message.forward_from || message.forward_from_chat);
}

function buildDashboardKeyboard(preferredLanguage?: string | null) {
  const normalizedLanguage = normalizeTelegramUserLanguage(preferredLanguage);
  const text = getTelegramText(normalizedLanguage);
  return {
    inline_keyboard: [
      [
        {
          text: text.menuApp,
          url: getTelegramMiniAppUrl("/telegram", normalizedLanguage)
        }
      ],
      [
        {
          text: text.menuToday,
          callback_data: buildMenuCallbackData("today")
        },
        {
          text: text.menuSettings,
          callback_data: buildMenuCallbackData("settings")
        }
      ],
      [
        {
          text: text.menuSupport,
          callback_data: buildMenuCallbackData("support")
        },
        {
          text: text.openDashboard,
          url: getDashboardUrl("/pro/calendar")
        }
      ]
    ]
  };
}

async function handleStartCommand(input: {
  chatId: string;
  args: string[];
  user: NonNullable<TelegramUpdate["message"]>["from"];
}) {
  const startArg = normalizeText(input.args[0]);

  if (startArg.startsWith("connect_")) {
    const token = startArg.slice("connect_".length);
    const connected = await connectTelegramChatByToken({
      token,
      chatId: input.chatId,
      telegramUserId: input.user?.id ?? null,
      telegramUsername: input.user?.username ?? "",
      telegramFirstName: input.user?.first_name ?? "",
      telegramLastName: input.user?.last_name ?? "",
      telegramLanguageCode: input.user?.language_code ?? ""
    });

    if (connected) {
      const t = getTelegramText(connected.language);
      await sendTelegramTextMessage({
        chatId: input.chatId,
        text: `${t.connected}\n\n${t.mainMenuTitle}\n${t.mainMenuHint}`,
        replyMarkup: buildDashboardKeyboard(connected.language)
      });
      return;
    }

    const fallbackText = getTelegramText(normalizeTelegramUserLanguage(input.user?.language_code));
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: fallbackText.invalidToken,
      replyMarkup: buildDashboardKeyboard(input.user?.language_code)
    });
    return;
  }

  const existingConnection = await getTelegramConnectionByChatId(input.chatId).catch(() => null);
  if (existingConnection) {
    const activeConnection =
      (await touchTelegramConnection(
        existingConnection,
        input.user?.language_code || undefined
      ).catch(() => null)) || existingConnection;
    const t = getTelegramText(activeConnection.language);
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: `${t.mainMenuTitle}\n${t.help}`,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    });
    return;
  }

  const fallbackText = getTelegramText(normalizeTelegramUserLanguage(input.user?.language_code));
  await sendTelegramTextMessage({
    chatId: input.chatId,
    text: `${fallbackText.mainMenuTitle}\n${fallbackText.help}\n\n${fallbackText.connectHint}`,
    replyMarkup: buildDashboardKeyboard(input.user?.language_code)
  });
}

async function handleTodayCommand(chatId: string, preferredLanguage?: string | null) {
  const connection = await getTelegramConnectionByChatId(chatId);
  if (!connection) {
    const t = getTelegramText(normalizeTelegramUserLanguage(preferredLanguage));
    await sendTelegramTextMessage({
      chatId,
      text: `${t.noConnection}\n${t.connectHint}`,
      replyMarkup: buildDashboardKeyboard(preferredLanguage)
    });
    return;
  }

  const nextConnection = await touchTelegramConnection(connection, preferredLanguage || undefined);
  const activeConnection = nextConnection || connection;
  const bookings = await getTodayBookingsForConnection(activeConnection);
  const text = formatTodayBookingsMessage(activeConnection, bookings);

  await sendTelegramTextMessage({
    chatId,
    text,
    replyMarkup: buildDashboardKeyboard(activeConnection.language)
  });
}

async function handleSettingsCommand(chatId: string, preferredLanguage?: string | null) {
  const connection = await getTelegramConnectionByChatId(chatId);
  if (!connection) {
    const t = getTelegramText(normalizeTelegramUserLanguage(preferredLanguage));
    await sendTelegramTextMessage({
      chatId,
      text: `${t.noConnection}\n${t.connectHint}`,
      replyMarkup: buildDashboardKeyboard(preferredLanguage)
    });
    return;
  }

  const nextConnection = await touchTelegramConnection(connection, preferredLanguage || undefined);
  const activeConnection = nextConnection || connection;
  const payload = buildSettingsMessage(activeConnection, "home");
  await sendTelegramTextMessage({
    chatId,
    text: payload.text,
    replyMarkup: payload.replyMarkup
  });
}

async function handleAppCommand(chatId: string, preferredLanguage?: string | null) {
  const connection = await getTelegramConnectionByChatId(chatId);
  if (connection) {
    const nextConnection = await touchTelegramConnection(connection, preferredLanguage || undefined);
    const activeConnection = nextConnection || connection;
    const t = getTelegramText(activeConnection.language);
    await sendTelegramTextMessage({
      chatId,
      text: `${t.mainMenuTitle}\n${t.mainMenuHint}`,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    });
    return;
  }

  const t = getTelegramText(normalizeTelegramUserLanguage(preferredLanguage));
  await sendTelegramTextMessage({
    chatId,
    text: `${t.mainMenuTitle}\n${t.help}\n\n${t.connectHint}`,
    replyMarkup: buildDashboardKeyboard(preferredLanguage)
  });
}

async function handleSupportMessage(input: {
  chatId: string;
  preferredLanguage?: string | null;
  text?: string;
}) {
  const connection = await getTelegramConnectionByChatId(input.chatId);
  if (!connection) {
    const t = getTelegramText(normalizeTelegramUserLanguage(input.preferredLanguage));
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: `${t.noConnection}\n${t.connectHint}`,
      replyMarkup: buildDashboardKeyboard(input.preferredLanguage)
    });
    return;
  }

  const nextConnection = await touchTelegramConnection(connection, input.preferredLanguage || undefined);
  const activeConnection = nextConnection || connection;
  const t = getTelegramText(activeConnection.language);

  if (!input.text?.trim()) {
    enableSupportMode(input.chatId);
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: t.supportPrompt,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    });
    return;
  }

  if (!activeConnection.forwardingEnabled) {
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: t.forwardDisabled,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    });
    return;
  }

  const sent = await forwardTelegramMessageToSupport({
    connection: activeConnection,
    text: input.text,
    chatId: input.chatId
  });

  if (sent) {
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: t.forwardSuccess,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    });
    return;
  }

  await sendTelegramTextMessage({
    chatId: input.chatId,
    text: t.forwardDisabled,
    replyMarkup: buildDashboardKeyboard(activeConnection.language)
  });
}

async function handleForwardedText(input: {
  chatId: string;
  text: string;
  preferredLanguage?: string | null;
}) {
  const connection = await getTelegramConnectionByChatId(input.chatId);
  if (!connection) {
    return;
  }

  const nextConnection = await touchTelegramConnection(connection, input.preferredLanguage || undefined);
  const activeConnection = nextConnection || connection;
  const t = getTelegramText(activeConnection.language);
  if (!activeConnection.forwardingEnabled) {
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: t.forwardDisabled,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    });
    return;
  }

  const sent = await forwardTelegramMessageToSupport({
    connection: activeConnection,
    text: input.text,
    chatId: input.chatId
  });

  if (sent) {
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: t.forwardSuccess,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    });
  }
}

async function handleCallbackQuery(update: TelegramUpdate) {
  const callback = update.callback_query;
  if (!callback?.id) {
    return;
  }

  const chatId = readChatId(callback.message?.chat?.id);
  const data = normalizeText(callback.data);
  const connection = chatId ? await getTelegramConnectionByChatId(chatId) : null;

  if (!connection) {
    const fallback = getTelegramText(normalizeTelegramUserLanguage(callback.from?.language_code));
    await answerTelegramCallbackQuery(callback.id, fallback.noConnection).catch(() => undefined);
    return;
  }

  const preferredLanguage = callback.from?.language_code;
  const touchedConnection = await touchTelegramConnection(
    connection,
    preferredLanguage
  ).catch(() => null);
  const activeConnection = touchedConnection || connection;

  const t = getTelegramText(activeConnection.language);
  const menuAction = parseMenuCallbackData(data);
  if (menuAction) {
    await answerTelegramCallbackQuery(callback.id).catch(() => undefined);

    if (menuAction === "today") {
      await handleTodayCommand(chatId, activeConnection.language);
      return;
    }

    if (menuAction === "settings") {
      await handleSettingsCommand(chatId, activeConnection.language);
      return;
    }

    if (menuAction === "support") {
      await handleSupportMessage({ chatId, preferredLanguage: activeConnection.language });
      return;
    }

    if (menuAction === "app") {
      await handleAppCommand(chatId, activeConnection.language);
      return;
    }

    await sendTelegramTextMessage({
      chatId,
      text: `${t.mainMenuTitle}\n${t.help}`,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    }).catch(() => undefined);
    return;
  }

  const settingsKey = parseSettingsCallbackData(data);
  const settingsSection = parseSettingsSectionCallbackData(data);
  const botControlAction = parseBotControlCallbackData(data);
  const reminderLeadMinutes = parseReminderLeadCallbackData(data);

  if (settingsSection) {
    await answerTelegramCallbackQuery(callback.id).catch(() => undefined);
    const payload = buildSettingsMessage(activeConnection, settingsSection);
    await sendTelegramTextMessage({
      chatId,
      text: payload.text,
      replyMarkup: payload.replyMarkup
    }).catch(() => undefined);
    return;
  }

  if (botControlAction) {
    const nextConnection = await setTelegramConnectionSettings(activeConnection, {
      notificationsNewBooking: botControlAction === "all_on",
      notificationsCabinetBooking: botControlAction === "all_on",
      notificationsRescheduled: botControlAction === "all_on",
      notificationsCancelled: botControlAction === "all_on",
      notificationsReminder: botControlAction === "all_on",
      notificationsToday: botControlAction === "all_on"
    });

    await answerTelegramCallbackQuery(
      callback.id,
      botControlAction === "all_on" ? t.botUpdatedAllOn : t.botUpdatedAllOff
    ).catch(() => undefined);

    const payload = buildSettingsMessage(nextConnection || activeConnection, "bot");
    await sendTelegramTextMessage({
      chatId,
      text: payload.text,
      replyMarkup: payload.replyMarkup
    }).catch(() => undefined);
    return;
  }

  if (typeof reminderLeadMinutes === "number") {
    const nextConnection = await setTelegramConnectionSettings(activeConnection, {
      reminderLeadMinutes
    });

    await answerTelegramCallbackQuery(callback.id, t.reminderLeadUpdated).catch(() => undefined);

    const payload = buildSettingsMessage(nextConnection || activeConnection, "reminders");
    await sendTelegramTextMessage({
      chatId,
      text: payload.text,
      replyMarkup: payload.replyMarkup
    }).catch(() => undefined);
    return;
  }

  if (settingsKey) {
    const nextConnection = await toggleTelegramConnectionSetting(activeConnection, settingsKey);
    await answerTelegramCallbackQuery(callback.id, t.settingUpdated).catch(() => undefined);

    if (nextConnection) {
      const section =
        settingsKey === "forwardingEnabled"
          ? "support"
          : settingsKey === "notificationsReminder" || settingsKey === "notificationsToday"
            ? "reminders"
            : "notifications";
      const payload = buildSettingsMessage(nextConnection, section);
      await sendTelegramTextMessage({
        chatId,
        text: payload.text,
        replyMarkup: payload.replyMarkup
      }).catch(() => undefined);
    }
    return;
  }

  const bookingAction = parseBookingCallbackData(data);
  if (!bookingAction) {
    await answerTelegramCallbackQuery(callback.id).catch(() => undefined);
    return;
  }

  const businessAppointments = await getAppointmentsForBusiness(activeConnection.businessId);
  const appointment = businessAppointments.find(
    (item) =>
      item.id === bookingAction.appointmentId &&
      item.kind === "appointment" &&
      item.professionalId === activeConnection.professionalId
  );

  if (!appointment) {
    await answerTelegramCallbackQuery(callback.id, t.actionNotFound).catch(() => undefined);
    return;
  }

  if (bookingAction.action === "confirm") {
    const updated = await updateCalendarAppointmentMeta({
      professionalId: activeConnection.professionalId,
      appointmentId: appointment.id,
      attendance: "confirmed",
      priceAmount: appointment.priceAmount,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      serviceName: appointment.serviceName,
      notes: appointment.notes
    });

    await syncBookingStatusFromCalendarAppointment({
      businessId: updated.businessId,
      appointmentDate: updated.appointmentDate,
      appointmentTime: updated.startTime,
      customerName: updated.customerName,
      customerPhone: updated.customerPhone,
      customerNotes: updated.notes,
      serviceName: updated.serviceName,
      attendance: updated.attendance
    });

    await answerTelegramCallbackQuery(callback.id, t.actionDoneConfirm).catch(() => undefined);
    await sendTelegramTextMessage({
      chatId,
      text: t.actionDoneConfirm,
      replyMarkup: buildDashboardKeyboard(activeConnection.language)
    }).catch(() => undefined);
    return;
  }

  const deleted = await deleteCalendarAppointment({
    professionalId: activeConnection.professionalId,
    appointmentId: appointment.id
  });

  if (deleted.kind === "appointment") {
    await cancelBookingFromCalendarAppointment({
      businessId: deleted.businessId,
      appointmentDate: deleted.appointmentDate,
      appointmentTime: deleted.startTime,
      customerName: deleted.customerName,
      customerPhone: deleted.customerPhone,
      customerNotes: deleted.notes,
      serviceName: deleted.serviceName
    });
  }

  await answerTelegramCallbackQuery(callback.id, t.actionDoneCancel).catch(() => undefined);
  await sendTelegramTextMessage({
    chatId,
    text: t.actionDoneCancel,
    replyMarkup: buildDashboardKeyboard(activeConnection.language)
  }).catch(() => undefined);
}

async function handleMessage(update: TelegramUpdate) {
  const message = update.message;
  const chatId = readChatId(message?.chat?.id);

  if (!chatId || !message) {
    return;
  }

  const text = normalizeText(message.text || message.caption);
  const preferredLanguage = message.from?.language_code;
  const command = parseCommand(text);

  if (command?.command === "/start") {
    await handleStartCommand({
      chatId,
      args: command.args,
      user: message.from
    });
    return;
  }

  if (command?.command === "/today") {
    await handleTodayCommand(chatId, preferredLanguage);
    return;
  }

  if (command?.command === "/settings") {
    await handleSettingsCommand(chatId, preferredLanguage);
    return;
  }

  if (command?.command === "/support") {
    const supportText = normalizeText(command.args.join(" "));
    await handleSupportMessage({
      chatId,
      preferredLanguage,
      text: supportText
    });
    return;
  }

  if (command?.command === "/app") {
    await handleAppCommand(chatId, preferredLanguage);
    return;
  }

  const supportPrefixedText = text ? parseSupportPrefix(text) : "";
  if (supportPrefixedText) {
    await handleSupportMessage({
      chatId,
      preferredLanguage,
      text: supportPrefixedText
    });
    return;
  }

  if (text && takeSupportMode(chatId)) {
    await handleSupportMessage({
      chatId,
      preferredLanguage,
      text
    });
    return;
  }

  if (isForwardedMessage(message) && text) {
    await handleForwardedText({ chatId, text, preferredLanguage });
    return;
  }

  const connection = await getTelegramConnectionByChatId(chatId);
  const t = getTelegramText(
    connection?.language || normalizeTelegramUserLanguage(preferredLanguage)
  );
  await sendTelegramTextMessage({
    chatId,
    text: `${t.mainMenuTitle}\n${t.help}`,
    replyMarkup: buildDashboardKeyboard(connection?.language || preferredLanguage)
  });
}

function isWebhookAuthorized(request: Request) {
  const expected = getTelegramWebhookSecret();
  if (!expected) {
    return true;
  }

  const fromHeader = request.headers.get("x-telegram-bot-api-secret-token") || "";
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("secret") || "";
  return fromHeader === expected || fromQuery === expected;
}

export async function POST(request: Request) {
  try {
    if (!isWebhookAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
    if (!update) {
      return NextResponse.json({ ok: true });
    }

    await ensureTelegramBotCommandsConfigured().catch(() => false);

    if (update.callback_query) {
      await handleCallbackQuery(update);
      return NextResponse.json({ ok: true });
    }

    if (update.message) {
      await handleMessage(update);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to handle Telegram update.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
