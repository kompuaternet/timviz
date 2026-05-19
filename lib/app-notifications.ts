import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type AppNotificationType =
  | "online_booking"
  | "team_invitation"
  | "team_join_request"
  | "admin_message";

export type AppNotificationRecord = {
  id: string;
  professionalId: string;
  businessId?: string;
  type: AppNotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  payload: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
};

export type AppNotificationInput = {
  professionalId: string;
  businessId?: string;
  type: AppNotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  payload?: Record<string, unknown>;
};

const localAppNotificationsPath = path.join(process.cwd(), "data", "app-notifications.json");

function getErrorMessage(error: unknown) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}

function isMissingAppNotificationsStorageError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("app_notifications") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("could not find the table"))
  );
}

function normalizePayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function normalizeRecord(input: AppNotificationRecord): AppNotificationRecord {
  return {
    ...input,
    businessId: input.businessId || undefined,
    actionUrl: input.actionUrl || undefined,
    payload: normalizePayload(input.payload),
    readAt: input.readAt || undefined
  };
}

function mapAppNotification(row: Record<string, any>): AppNotificationRecord {
  return normalizeRecord({
    id: String(row.id || ""),
    professionalId: String(row.professional_id || ""),
    businessId: row.business_id ? String(row.business_id) : undefined,
    type: String(row.type || "admin_message") as AppNotificationType,
    title: String(row.title || ""),
    body: String(row.body || ""),
    actionUrl: row.action_url ? String(row.action_url) : undefined,
    payload: normalizePayload(row.payload),
    readAt: row.read_at ? String(row.read_at) : undefined,
    createdAt: String(row.created_at || new Date().toISOString())
  });
}

async function readLocalAppNotifications() {
  try {
    const content = await fs.readFile(localAppNotificationsPath, "utf8");
    const parsed = JSON.parse(content) as AppNotificationRecord[];
    return Array.isArray(parsed) ? parsed.map(normalizeRecord) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeLocalAppNotifications(records: AppNotificationRecord[]) {
  await fs.mkdir(path.dirname(localAppNotificationsPath), { recursive: true });
  await fs.writeFile(localAppNotificationsPath, JSON.stringify(records, null, 2) + "\n", "utf8");
}

async function createLocalAppNotification(input: AppNotificationInput) {
  const now = new Date().toISOString();
  const record = normalizeRecord({
    id: randomUUID(),
    professionalId: input.professionalId,
    businessId: input.businessId,
    type: input.type,
    title: input.title.trim(),
    body: input.body.trim(),
    actionUrl: input.actionUrl?.trim() || undefined,
    payload: normalizePayload(input.payload),
    createdAt: now
  });
  const records = await readLocalAppNotifications();
  records.unshift(record);
  await writeLocalAppNotifications(records.slice(0, 2000));
  return record;
}

export async function createAppNotification(input: AppNotificationInput) {
  if (!input.professionalId.trim() || !input.title.trim()) {
    throw new Error("Notification recipient and title are required.");
  }

  if (!isSupabaseConfigured()) {
    return createLocalAppNotification(input);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return createLocalAppNotification(input);
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const { data, error } = await supabase
    .from("app_notifications")
    .insert({
      id,
      professional_id: input.professionalId,
      business_id: input.businessId || null,
      type: input.type,
      title: input.title.trim(),
      body: input.body.trim(),
      action_url: input.actionUrl?.trim() || "",
      payload: normalizePayload(input.payload),
      created_at: now
    })
    .select("*")
    .single();

  if (isMissingAppNotificationsStorageError(error)) {
    return createLocalAppNotification(input);
  }
  if (error) {
    throw new Error(error.message);
  }
  return mapAppNotification(data as Record<string, any>);
}

export async function createAppNotifications(inputs: AppNotificationInput[]) {
  const filtered = inputs.filter((input) => input.professionalId.trim() && input.title.trim());
  if (!filtered.length) return [];
  const results = await Promise.allSettled(filtered.map((input) => createAppNotification(input)));
  return results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
}

export async function getAppNotificationsForProfessional(
  professionalId: string,
  options: { limit?: number; includeRead?: boolean } = {}
) {
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  if (!professionalId.trim()) return [];

  if (!isSupabaseConfigured()) {
    const records = await readLocalAppNotifications();
    return records
      .filter((record) => record.professionalId === professionalId)
      .filter((record) => options.includeRead !== false || !record.readAt)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return getAppNotificationsForProfessional(professionalId, { ...options, limit });
  }

  let query = supabase
    .from("app_notifications")
    .select("*")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.includeRead === false) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;
  if (isMissingAppNotificationsStorageError(error)) {
    const records = await readLocalAppNotifications();
    return records
      .filter((record) => record.professionalId === professionalId)
      .filter((record) => options.includeRead !== false || !record.readAt)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }
  if (error) return [];
  return (data || []).map((row) => mapAppNotification(row as Record<string, any>));
}

export async function markAppNotificationsRead(professionalId: string, ids?: string[]) {
  const normalizedIds = Array.from(new Set((ids || []).map((id) => id.trim()).filter(Boolean)));
  const readAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const records = await readLocalAppNotifications();
    const next = records.map((record) => {
      const matchesProfessional = record.professionalId === professionalId;
      const matchesId = !normalizedIds.length || normalizedIds.includes(record.id);
      return matchesProfessional && matchesId ? { ...record, readAt } : record;
    });
    await writeLocalAppNotifications(next);
    return { readAt };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const records = await readLocalAppNotifications();
    const next = records.map((record) => {
      const matchesProfessional = record.professionalId === professionalId;
      const matchesId = !normalizedIds.length || normalizedIds.includes(record.id);
      return matchesProfessional && matchesId ? { ...record, readAt } : record;
    });
    await writeLocalAppNotifications(next);
    return { readAt };
  }

  let query = supabase
    .from("app_notifications")
    .update({ read_at: readAt })
    .eq("professional_id", professionalId);
  if (normalizedIds.length) {
    query = query.in("id", normalizedIds);
  }
  const { error } = await query;
  if (isMissingAppNotificationsStorageError(error)) {
    const records = await readLocalAppNotifications();
    const next = records.map((record) => {
      const matchesProfessional = record.professionalId === professionalId;
      const matchesId = !normalizedIds.length || normalizedIds.includes(record.id);
      return matchesProfessional && matchesId ? { ...record, readAt } : record;
    });
    await writeLocalAppNotifications(next);
  }
  if (error && !isMissingAppNotificationsStorageError(error)) {
    throw new Error(error.message);
  }
  return { readAt };
}
