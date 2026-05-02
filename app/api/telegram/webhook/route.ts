import { NextResponse } from "next/server";
import {
  answerTelegramCallbackQuery,
  buildSettingsMessage,
  connectTelegramChatByToken,
  forwardTelegramMessageToSupport,
  formatTodayBookingsMessage,
  getDashboardUrl,
  getTelegramConnectionByChatId,
  getTelegramText,
  getTodayBookingsForConnection,
  getTelegramWebhookSecret,
  parseBookingCallbackData,
  parseSettingsCallbackData,
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
    };
    message?: {
      message_id?: number;
      chat?: { id?: number | string };
    };
  };
};

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

function isForwardedMessage(message: TelegramUpdate["message"]) {
  if (!message) {
    return false;
  }
  return Boolean(message.forward_origin || message.forward_from || message.forward_from_chat);
}

function buildDashboardKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: "Open dashboard",
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
      telegramLastName: input.user?.last_name ?? ""
    });

    if (connected) {
      const t = getTelegramText(connected.language);
      await sendTelegramTextMessage({
        chatId: input.chatId,
        text: t.connected,
        replyMarkup: buildDashboardKeyboard()
      });
      return;
    }

    const fallbackText = getTelegramText("en");
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: fallbackText.invalidToken,
      replyMarkup: buildDashboardKeyboard()
    });
    return;
  }

  const fallbackText = getTelegramText("en");
  await sendTelegramTextMessage({
    chatId: input.chatId,
    text: fallbackText.help,
    replyMarkup: buildDashboardKeyboard()
  });
}

async function handleTodayCommand(chatId: string) {
  const connection = await getTelegramConnectionByChatId(chatId);
  if (!connection) {
    const t = getTelegramText("en");
    await sendTelegramTextMessage({
      chatId,
      text: `${t.noConnection}\n${t.connectHint}`,
      replyMarkup: buildDashboardKeyboard()
    });
    return;
  }

  await touchTelegramConnection(connection);
  const bookings = await getTodayBookingsForConnection(connection);
  const text = formatTodayBookingsMessage(connection, bookings);

  await sendTelegramTextMessage({
    chatId,
    text,
    replyMarkup: buildDashboardKeyboard()
  });
}

async function handleSettingsCommand(chatId: string) {
  const connection = await getTelegramConnectionByChatId(chatId);
  if (!connection) {
    const t = getTelegramText("en");
    await sendTelegramTextMessage({
      chatId,
      text: `${t.noConnection}\n${t.connectHint}`,
      replyMarkup: buildDashboardKeyboard()
    });
    return;
  }

  const payload = buildSettingsMessage(connection);
  await sendTelegramTextMessage({
    chatId,
    text: payload.text,
    replyMarkup: payload.replyMarkup
  });
}

async function handleForwardedText(input: {
  chatId: string;
  text: string;
}) {
  const connection = await getTelegramConnectionByChatId(input.chatId);
  if (!connection) {
    return;
  }

  const t = getTelegramText(connection.language);
  if (!connection.forwardingEnabled) {
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: t.forwardDisabled,
      replyMarkup: buildDashboardKeyboard()
    });
    return;
  }

  const sent = await forwardTelegramMessageToSupport({
    connection,
    text: input.text,
    chatId: input.chatId
  });

  if (sent) {
    await sendTelegramTextMessage({
      chatId: input.chatId,
      text: t.forwardSuccess,
      replyMarkup: buildDashboardKeyboard()
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
    const fallback = getTelegramText("en");
    await answerTelegramCallbackQuery(callback.id, fallback.noConnection).catch(() => undefined);
    return;
  }

  await touchTelegramConnection(connection).catch(() => undefined);

  const t = getTelegramText(connection.language);
  const settingsKey = parseSettingsCallbackData(data);

  if (settingsKey) {
    const nextConnection = await toggleTelegramConnectionSetting(connection, settingsKey);
    await answerTelegramCallbackQuery(callback.id, t.settingUpdated).catch(() => undefined);

    if (nextConnection) {
      const payload = buildSettingsMessage(nextConnection);
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

  const businessAppointments = await getAppointmentsForBusiness(connection.businessId);
  const appointment = businessAppointments.find(
    (item) =>
      item.id === bookingAction.appointmentId &&
      item.kind === "appointment" &&
      item.professionalId === connection.professionalId
  );

  if (!appointment) {
    await answerTelegramCallbackQuery(callback.id, t.actionNotFound).catch(() => undefined);
    return;
  }

  if (bookingAction.action === "confirm") {
    const updated = await updateCalendarAppointmentMeta({
      professionalId: connection.professionalId,
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
      replyMarkup: buildDashboardKeyboard()
    }).catch(() => undefined);
    return;
  }

  const deleted = await deleteCalendarAppointment({
    professionalId: connection.professionalId,
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
    replyMarkup: buildDashboardKeyboard()
  }).catch(() => undefined);
}

async function handleMessage(update: TelegramUpdate) {
  const message = update.message;
  const chatId = readChatId(message?.chat?.id);

  if (!chatId || !message) {
    return;
  }

  const text = normalizeText(message.text || message.caption);
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
    await handleTodayCommand(chatId);
    return;
  }

  if (command?.command === "/settings") {
    await handleSettingsCommand(chatId);
    return;
  }

  if (isForwardedMessage(message) && text) {
    await handleForwardedText({ chatId, text });
    return;
  }

  const connection = await getTelegramConnectionByChatId(chatId);
  const t = getTelegramText(connection?.language || "en");
  await sendTelegramTextMessage({
    chatId,
    text: t.help,
    replyMarkup: buildDashboardKeyboard()
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
