import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type SupportTicket = {
  id: string;
  professionalId: string | null;
  businessName: string;
  userName: string;
  email: string;
  phone: string;
  page: string;
  language: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  source: "user" | "support";
  text: string;
  createdAt: string;
  telegramMessageId?: number;
  telegramUpdateId?: number;
};

type SupportStore = {
  nextTicketNumber: number;
  processedTelegramUpdateIds: number[];
  tickets: SupportTicket[];
  messages: SupportMessage[];
};

type TicketInput = {
  ticketId?: string;
  professionalId: string | null;
  businessName: string;
  userName: string;
  email: string;
  phone: string;
  page: string;
  language: string;
};

type SupportTicketRow = {
  id: string;
  professional_id?: string | null;
  business_name?: string | null;
  user_name?: string | null;
  email?: string | null;
  phone?: string | null;
  page?: string | null;
  language?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
};

type SupportMessageRow = {
  id: string;
  ticket_id: string;
  source: string;
  text: string;
  created_at: string;
  telegram_message_id?: number | null;
  telegram_update_id?: number | null;
};

const storePath = path.join(process.cwd(), "data", "pro-support.json");

function makeMessageId() {
  return `msg_${crypto.randomUUID()}`;
}

function makeSupportTicketId() {
  return `SUP-${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

function mapSupportTicket(row: SupportTicketRow): SupportTicket {
  return {
    id: row.id,
    professionalId: row.professional_id ?? null,
    businessName: row.business_name ?? "",
    userName: row.user_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    page: row.page ?? "",
    language: row.language ?? "en",
    status: row.status === "closed" ? "closed" : "open",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSupportMessage(row: SupportMessageRow): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    source: row.source === "support" ? "support" : "user",
    text: row.text,
    createdAt: row.created_at,
    telegramMessageId:
      typeof row.telegram_message_id === "number" ? row.telegram_message_id : undefined,
    telegramUpdateId:
      typeof row.telegram_update_id === "number" ? row.telegram_update_id : undefined
  };
}

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    const initial: SupportStore = {
      nextTicketNumber: 1001,
      processedTelegramUpdateIds: [],
      tickets: [],
      messages: []
    };
    await fs.writeFile(storePath, JSON.stringify(initial, null, 2) + "\n", "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const file = await fs.readFile(storePath, "utf8");
  const store = JSON.parse(file) as Partial<SupportStore>;

  return {
    nextTicketNumber: store.nextTicketNumber ?? 1001,
    processedTelegramUpdateIds: store.processedTelegramUpdateIds ?? [],
    tickets: store.tickets ?? [],
    messages: store.messages ?? []
  } satisfies SupportStore;
}

async function writeStore(store: SupportStore) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

export async function getOrCreateSupportTicket(input: TicketInput) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    if (input.ticketId) {
      const { data: existing, error: existingError } = await supabase
        .from("support_tickets")
        .select("id, professional_id, business_name, user_name, email, phone, page, language, status, created_at, updated_at")
        .eq("id", input.ticketId)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message);
      }

      if (existing) {
        const nextUpdatedAt = new Date().toISOString();
        const { data, error } = await supabase
          .from("support_tickets")
          .update({
            professional_id: input.professionalId || existing.professional_id || null,
            business_name: input.businessName || existing.business_name || "",
            user_name: input.userName || existing.user_name || "",
            email: input.email || existing.email || "",
            phone: input.phone || existing.phone || "",
            page: input.page || existing.page || "",
            language: input.language || existing.language || "en",
            updated_at: nextUpdatedAt
          })
          .eq("id", input.ticketId)
          .select("id, professional_id, business_name, user_name, email, phone, page, language, status, created_at, updated_at")
          .maybeSingle();

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error("Support ticket not found.");
        }

        return mapSupportTicket(data as SupportTicketRow);
      }
    }

    const ticket: SupportTicket = {
      id: makeSupportTicketId(),
      professionalId: input.professionalId,
      businessName: input.businessName,
      userName: input.userName,
      email: input.email,
      phone: input.phone,
      page: input.page,
      language: input.language,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabase.from("support_tickets").insert({
      id: ticket.id,
      professional_id: ticket.professionalId,
      business_name: ticket.businessName,
      user_name: ticket.userName,
      email: ticket.email,
      phone: ticket.phone,
      page: ticket.page,
      language: ticket.language,
      status: ticket.status,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt
    });

    if (error) {
      throw new Error(error.message);
    }

    return ticket;
  }

  const store = await readStore();
  const existingTicket = input.ticketId
    ? store.tickets.find((ticket) => ticket.id === input.ticketId)
    : null;

  if (existingTicket) {
    existingTicket.professionalId = input.professionalId || existingTicket.professionalId;
    existingTicket.businessName = input.businessName || existingTicket.businessName;
    existingTicket.userName = input.userName || existingTicket.userName;
    existingTicket.email = input.email || existingTicket.email;
    existingTicket.phone = input.phone || existingTicket.phone;
    existingTicket.page = input.page || existingTicket.page;
    existingTicket.language = input.language || existingTicket.language;
    existingTicket.updatedAt = new Date().toISOString();
    await writeStore(store);
    return existingTicket;
  }

  const ticket: SupportTicket = {
    id: `SUP-${store.nextTicketNumber}`,
    professionalId: input.professionalId,
    businessName: input.businessName,
    userName: input.userName,
    email: input.email,
    phone: input.phone,
    page: input.page,
    language: input.language,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.nextTicketNumber += 1;
  store.tickets.push(ticket);
  await writeStore(store);

  return ticket;
}

export async function addSupportUserMessage(ticketId: string, text: string) {
  const message: SupportMessage = {
    id: makeMessageId(),
    ticketId,
    source: "user",
    text,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error: messageError } = await supabase.from("support_messages").insert({
      id: message.id,
      ticket_id: message.ticketId,
      source: message.source,
      text: message.text,
      created_at: message.createdAt
    });

    if (messageError) {
      throw new Error(messageError.message);
    }

    const { error: ticketError } = await supabase
      .from("support_tickets")
      .update({ updated_at: message.createdAt })
      .eq("id", ticketId);

    if (ticketError) {
      throw new Error(ticketError.message);
    }

    return message;
  }

  const store = await readStore();
  store.messages.push(message);
  await writeStore(store);
  return message;
}

export async function attachTelegramMessageId(messageId: string, telegramMessageId: number) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return;
    }

    const { error } = await supabase
      .from("support_messages")
      .update({ telegram_message_id: telegramMessageId })
      .eq("id", messageId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const store = await readStore();
  const message = store.messages.find((item) => item.id === messageId);

  if (message) {
    message.telegramMessageId = telegramMessageId;
    await writeStore(store);
  }
}

export async function addTelegramSupportReplies(
  updates: Array<{
    updateId: number;
    messageId: number;
    text: string;
    replyToMessageId?: number;
  }>
) {
  if (updates.length === 0) {
    return [];
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const updateIds = updates.map((update) => update.updateId);
    const replyMessageIds = updates
      .map((update) => update.replyToMessageId)
      .filter((value): value is number => typeof value === "number");
    const ticketIdsFromText = Array.from(
      new Set(
        updates
          .map((update) => update.text.match(/\bSUP-\d+\b/)?.[0])
          .filter((value): value is string => Boolean(value))
      )
    );

    const [
      { data: existingUpdates, error: existingUpdatesError },
      { data: repliedMessages, error: repliedMessagesError },
      { data: referencedTickets, error: referencedTicketsError }
    ] = await Promise.all([
      supabase
        .from("support_messages")
        .select("telegram_update_id")
        .in("telegram_update_id", updateIds),
      replyMessageIds.length > 0
        ? supabase
            .from("support_messages")
            .select("ticket_id, telegram_message_id")
            .in("telegram_message_id", replyMessageIds)
        : Promise.resolve({ data: [], error: null }),
      ticketIdsFromText.length > 0
        ? supabase
            .from("support_tickets")
            .select("id")
            .in("id", ticketIdsFromText)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (existingUpdatesError) {
      throw new Error(existingUpdatesError.message);
    }
    if (repliedMessagesError) {
      throw new Error(repliedMessagesError.message);
    }
    if (referencedTicketsError) {
      throw new Error(referencedTicketsError.message);
    }

    const existingUpdateIds = new Set(
      (existingUpdates ?? [])
        .map((item) => item.telegram_update_id)
        .filter((value): value is number => typeof value === "number")
    );
    const repliedMessageMap = new Map(
      (repliedMessages ?? []).map((message) => [message.telegram_message_id, message.ticket_id])
    );
    const knownTicketIds = new Set((referencedTickets ?? []).map((ticket) => ticket.id));

    const newMessages: SupportMessage[] = [];

    for (const update of updates) {
      if (existingUpdateIds.has(update.updateId) || !update.text.trim() || update.text.startsWith("/")) {
        continue;
      }

      const ticketIdFromReply =
        typeof update.replyToMessageId === "number"
          ? repliedMessageMap.get(update.replyToMessageId)
          : undefined;
      const ticketIdFromText = update.text.match(/\bSUP-\d+\b/)?.[0];
      const ticketId =
        ticketIdFromReply ||
        (ticketIdFromText && knownTicketIds.has(ticketIdFromText) ? ticketIdFromText : "");

      if (!ticketId) {
        continue;
      }

      const createdAt = new Date().toISOString();
      newMessages.push({
        id: makeMessageId(),
        ticketId,
        source: "support",
        text: update.text.trim(),
        createdAt,
        telegramMessageId: update.messageId,
        telegramUpdateId: update.updateId
      });
    }

    if (newMessages.length === 0) {
      return [];
    }

    const { error: insertError } = await supabase.from("support_messages").insert(
      newMessages.map((message) => ({
        id: message.id,
        ticket_id: message.ticketId,
        source: message.source,
        text: message.text,
        created_at: message.createdAt,
        telegram_message_id: message.telegramMessageId,
        telegram_update_id: message.telegramUpdateId
      }))
    );

    if (insertError) {
      throw new Error(insertError.message);
    }

    const latestByTicket = new Map<string, string>();
    for (const message of newMessages) {
      const current = latestByTicket.get(message.ticketId);
      if (!current || current < message.createdAt) {
        latestByTicket.set(message.ticketId, message.createdAt);
      }
    }

    for (const [ticketId, updatedAt] of latestByTicket.entries()) {
      const { error } = await supabase
        .from("support_tickets")
        .update({ updated_at: updatedAt })
        .eq("id", ticketId);

      if (error) {
        throw new Error(error.message);
      }
    }

    return newMessages;
  }

  const store = await readStore();
  const newMessages: SupportMessage[] = [];

  for (const update of updates) {
    if (store.processedTelegramUpdateIds.includes(update.updateId)) {
      continue;
    }

    store.processedTelegramUpdateIds.push(update.updateId);

    const repliedMessage = update.replyToMessageId
      ? store.messages.find((message) => message.telegramMessageId === update.replyToMessageId)
      : null;
    const ticketIdFromText = update.text.match(/\bSUP-\d+\b/)?.[0];
    const ticket = repliedMessage
      ? store.tickets.find((item) => item.id === repliedMessage.ticketId)
      : ticketIdFromText
        ? store.tickets.find((item) => item.id === ticketIdFromText)
        : null;

    if (!ticket || !update.text.trim() || update.text.startsWith("/")) {
      continue;
    }

    const message: SupportMessage = {
      id: makeMessageId(),
      ticketId: ticket.id,
      source: "support",
      text: update.text.trim(),
      createdAt: new Date().toISOString(),
      telegramMessageId: update.messageId,
      telegramUpdateId: update.updateId
    };

    ticket.updatedAt = message.createdAt;
    store.messages.push(message);
    newMessages.push(message);
  }

  store.processedTelegramUpdateIds = store.processedTelegramUpdateIds.slice(-500);
  await writeStore(store);

  return newMessages;
}

export async function getSupportMessagesForTicket(ticketId: string, after = "") {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return [];
    }

    let query = supabase
      .from("support_messages")
      .select("id, ticket_id, source, text, created_at, telegram_message_id, telegram_update_id")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (after) {
      query = query.gt("created_at", after);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapSupportMessage(row as SupportMessageRow));
  }

  const store = await readStore();
  const afterTime = after ? new Date(after).getTime() : 0;

  return store.messages
    .filter((message) => message.ticketId === ticketId)
    .filter((message) => !after || new Date(message.createdAt).getTime() > afterTime)
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}
