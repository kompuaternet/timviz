import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../lib/pro-data";
import {
  addSupportUserMessage,
  addTelegramSupportReplies,
  attachTelegramMessageId,
  getOrCreateSupportTicket,
  getSupportMessagesForTicket
} from "../../../../lib/pro-support";

function sanitize(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim().slice(0, 4000) : fallback;
}

function getTelegramConfig() {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN || process.env.SUPPORT_TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_SUPPORT_CHAT_ID || process.env.SUPPORT_TELEGRAM_CHAT_ID
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticketId = sanitize(searchParams.get("ticketId"));
  const after = sanitize(searchParams.get("after"));
  const { token, chatId } = getTelegramConfig();

  if (!ticketId) {
    return NextResponse.json({ ok: true, messages: [] });
  }

  if (!token || !chatId) {
    return NextResponse.json({ ok: false, messages: [] }, { status: 503 });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
    cache: "no-store"
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, messages: [] }, { status: 502 });
  }

  const payload = await response.json() as {
    result?: Array<{
      update_id: number;
      message?: {
        date?: number;
        message_id?: number;
        text?: string;
        chat?: { id?: number | string };
        reply_to_message?: { message_id?: number };
      };
    }>;
  };

  const updates = (payload.result ?? [])
    .filter((item) => String(item.message?.chat?.id ?? "") === String(chatId))
    .map((item) => ({
      updateId: item.update_id,
      messageId: Number(item.message?.message_id ?? 0),
      text: sanitize(item.message?.text),
      replyToMessageId: Number(item.message?.reply_to_message?.message_id ?? 0) || undefined
    }))
    .filter((item) => item.messageId > 0 && item.text);

  await addTelegramSupportReplies(updates);
  const messages = (await getSupportMessagesForTicket(ticketId, after))
    .filter((message) => message.source === "support");

  return NextResponse.json({
    ok: true,
    messages: messages.map((message) => ({
      id: message.id,
      role: message.source === "support" ? "bot" : "user",
      text: message.text,
      createdAt: message.createdAt
    }))
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = sanitize(body.message);
  const ticketId = sanitize(body.ticketId);
  const page = sanitize(body.page, "unknown");
  const language = sanitize(body.language, "unknown");

  if (message.length < 2) {
    return NextResponse.json({ error: "Message is too short." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value);
  const workspace = professionalId ? await getWorkspaceSnapshot(professionalId).catch(() => null) : null;

  const professional = workspace?.professional;
  const business = workspace?.business;
  const ticket = await getOrCreateSupportTicket({
    ticketId,
    professionalId,
    businessName: business?.name || "Unknown business",
    userName: [professional?.firstName, professional?.lastName].filter(Boolean).join(" ") || "Unknown user",
    email: professional?.email || "-",
    phone: professional?.phone || "-",
    page,
    language
  });
  const supportMessage = await addSupportUserMessage(ticket.id, message);
  const supportText = [
    `🛟 Timviz support request ${ticket.id}`,
    "Ответь reply на это сообщение, чтобы ответ попал именно этому клиенту.",
    "",
    `Business: ${business?.name || "Unknown business"}`,
    `User: ${[professional?.firstName, professional?.lastName].filter(Boolean).join(" ") || "Unknown user"}`,
    `Email: ${professional?.email || "-"}`,
    `Phone: ${professional?.phone || "-"}`,
    `Professional ID: ${professionalId || "-"}`,
    `Ticket: ${ticket.id}`,
    `Page: ${page}`,
    `Language: ${language}`,
    "",
    "Message:",
    message
  ].join("\n");

  const { token, chatId } = getTelegramConfig();

  if (!token || !chatId) {
    return NextResponse.json({
      ok: false,
      error: "Telegram support bot is not configured."
    }, { status: 503 });
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: supportText,
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: "Telegram delivery failed." }, { status: 502 });
  }

  const telegramPayload = await response.json() as { result?: { message_id?: number } };
  const telegramMessageId = telegramPayload.result?.message_id;

  if (typeof telegramMessageId === "number") {
    await attachTelegramMessageId(supportMessage.id, telegramMessageId);
  }

  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
