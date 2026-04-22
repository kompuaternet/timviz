import { promises as fs } from "fs";
import path from "path";
import { getWorkspaceSnapshot } from "./pro-data";
import { getClientDirectory } from "./pro-calendar";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type ClientRecord = {
  id: string;
  professionalId: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string;
  notes: string;
  notificationsTelegram: boolean;
  marketingTelegram: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClientListItem = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  telegram: string;
  notes: string;
  notificationsTelegram: boolean;
  marketingTelegram: boolean;
  visitsCount: number;
  totalSales: number;
  createdAt: string;
};

type ClientStore = {
  clients: ClientRecord[];
};

type ClientRow = {
  id: string;
  professional_id: string;
  business_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  telegram?: string | null;
  notes?: string | null;
  notifications_telegram?: boolean | null;
  marketing_telegram?: boolean | null;
  created_at: string;
  updated_at: string;
};

const storePath = path.join(process.cwd(), "data", "pro-clients.json");

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function mapSupabaseClient(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    professionalId: row.professional_id,
    businessId: row.business_id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    telegram: row.telegram ?? "",
    notes: row.notes ?? "",
    notificationsTelegram: row.notifications_telegram !== false,
    marketingTelegram: row.marketing_telegram === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    const initial: ClientStore = { clients: [] };
    await fs.writeFile(storePath, JSON.stringify(initial, null, 2) + "\n", "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const file = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(file) as Partial<ClientStore>;

  return {
    clients: Array.isArray(parsed.clients) ? parsed.clients : []
  } satisfies ClientStore;
}

async function writeStore(data: ClientStore) {
  await fs.writeFile(storePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function readManualClients(professionalId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("pro_clients")
      .select(
        "id, professional_id, business_id, first_name, last_name, email, phone, telegram, notes, notifications_telegram, marketing_telegram, created_at, updated_at"
      )
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => mapSupabaseClient(row as ClientRow));
  }

  const store = await readStore();
  return store.clients.filter((client) => client.professionalId === professionalId);
}

function getFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim() || "Клиент";
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

export async function getClientsList(professionalId: string): Promise<ClientListItem[]> {
  const workspace = await getWorkspaceSnapshot(professionalId);

  if (!workspace) {
    return [];
  }

  const [manualClients, appointmentClients] = await Promise.all([
    readManualClients(professionalId),
    getClientDirectory(professionalId)
  ]);

  const merged = new Map<string, ClientListItem>();

  for (const client of manualClients) {
    const fullName = getFullName(client.firstName, client.lastName);
    const key = `${fullName.toLowerCase()}::${client.phone.trim()}`;

    merged.set(key, {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      fullName,
      email: client.email,
      phone: client.phone,
      telegram: client.telegram,
      notes: client.notes,
      notificationsTelegram: client.notificationsTelegram,
      marketingTelegram: client.marketingTelegram,
      visitsCount: 0,
      totalSales: 0,
      createdAt: client.createdAt
    });
  }

  for (const client of appointmentClients) {
    const { firstName, lastName } = splitName(client.name);
    const key = `${client.name.toLowerCase()}::${client.phone.trim()}`;
    const existing = merged.get(key);

    if (existing) {
      existing.visitsCount = client.visitsCount;
      existing.totalSales = client.totalSales;
      if (new Date(client.createdAt).getTime() < new Date(existing.createdAt).getTime()) {
        existing.createdAt = client.createdAt;
      }
      continue;
    }

    merged.set(key, {
      id: `derived_${client.id}`,
      firstName,
      lastName,
      fullName: client.name,
      email: "",
      phone: client.phone,
      telegram: "",
      notes: "",
      notificationsTelegram: true,
      marketingTelegram: false,
      visitsCount: client.visitsCount,
      totalSales: client.totalSales,
      createdAt: client.createdAt
    });
  }

  return Array.from(merged.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export async function createClientProfile(input: {
  professionalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string;
  notes: string;
  notificationsTelegram: boolean;
  marketingTelegram: boolean;
}) {
  const workspace = await getWorkspaceSnapshot(input.professionalId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  if (!input.firstName.trim()) {
    throw new Error("Имя клиента обязательно.");
  }

  const timestamp = new Date().toISOString();

  const client: ClientRecord = {
    id: makeId("client"),
    professionalId: input.professionalId,
    businessId: workspace.business.id,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    telegram: input.telegram.trim(),
    notes: input.notes.trim(),
    notificationsTelegram: input.notificationsTelegram,
    marketingTelegram: input.marketingTelegram,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error } = await supabase.from("pro_clients").insert({
      id: client.id,
      professional_id: client.professionalId,
      business_id: client.businessId,
      first_name: client.firstName,
      last_name: client.lastName,
      email: client.email,
      phone: client.phone,
      telegram: client.telegram,
      notes: client.notes,
      notifications_telegram: client.notificationsTelegram,
      marketing_telegram: client.marketingTelegram,
      created_at: client.createdAt,
      updated_at: client.updatedAt
    });

    if (error) {
      throw new Error(error.message);
    }

    return client;
  }

  const store = await readStore();
  store.clients.push(client);
  await writeStore(store);
  return client;
}

export async function updateClientProfile(input: {
  professionalId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string;
  notes: string;
  notificationsTelegram: boolean;
  marketingTelegram: boolean;
}) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const updatedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("pro_clients")
      .update({
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        telegram: input.telegram.trim(),
        notes: input.notes.trim(),
        notifications_telegram: input.notificationsTelegram,
        marketing_telegram: input.marketingTelegram,
        updated_at: updatedAt
      })
      .eq("id", input.clientId)
      .eq("professional_id", input.professionalId)
      .select(
        "id, professional_id, business_id, first_name, last_name, email, phone, telegram, notes, notifications_telegram, marketing_telegram, created_at, updated_at"
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Клиент не найден.");
    }

    return mapSupabaseClient(data as ClientRow);
  }

  const store = await readStore();
  const client = store.clients.find(
    (item) => item.id === input.clientId && item.professionalId === input.professionalId
  );

  if (!client) {
    throw new Error("Клиент не найден.");
  }

  client.firstName = input.firstName.trim();
  client.lastName = input.lastName.trim();
  client.email = input.email.trim();
  client.phone = input.phone.trim();
  client.telegram = input.telegram.trim();
  client.notes = input.notes.trim();
  client.notificationsTelegram = input.notificationsTelegram;
  client.marketingTelegram = input.marketingTelegram;
  client.updatedAt = new Date().toISOString();

  await writeStore(store);
  return client;
}

export async function mergeClientsByPhone(professionalId: string) {
  const ownClients = await readManualClients(professionalId);
  const grouped = new Map<string, ClientRecord[]>();

  for (const client of ownClients) {
    const phone = client.phone.trim();
    if (!phone) {
      continue;
    }
    const list = grouped.get(phone) ?? [];
    list.push(client);
    grouped.set(phone, list);
  }

  const idsToDelete = new Set<string>();

  for (const [, clients] of grouped) {
    if (clients.length < 2) {
      continue;
    }

    clients.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    const primary = clients[0];

    for (const duplicate of clients.slice(1)) {
      primary.firstName = primary.firstName || duplicate.firstName;
      primary.lastName = primary.lastName || duplicate.lastName;
      primary.email = primary.email || duplicate.email;
      primary.telegram = primary.telegram || duplicate.telegram;
      primary.notes = primary.notes || duplicate.notes;
      primary.notificationsTelegram = primary.notificationsTelegram || duplicate.notificationsTelegram;
      primary.marketingTelegram = primary.marketingTelegram || duplicate.marketingTelegram;
      idsToDelete.add(duplicate.id);
    }
  }

  if (idsToDelete.size === 0) {
    return { merged: 0 };
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    for (const [, clients] of grouped) {
      if (clients.length < 2) {
        continue;
      }

      clients.sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
      const primary = clients[0];

      const { error: updateError } = await supabase
        .from("pro_clients")
        .update({
          first_name: primary.firstName,
          last_name: primary.lastName,
          email: primary.email,
          telegram: primary.telegram,
          notes: primary.notes,
          notifications_telegram: primary.notificationsTelegram,
          marketing_telegram: primary.marketingTelegram,
          updated_at: new Date().toISOString()
        })
        .eq("id", primary.id)
        .eq("professional_id", professionalId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    const { error: deleteError } = await supabase
      .from("pro_clients")
      .delete()
      .eq("professional_id", professionalId)
      .in("id", Array.from(idsToDelete));

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return { merged: idsToDelete.size };
  }

  const store = await readStore();
  const primaryUpdates = new Map(ownClients.map((client) => [client.id, client]));

  store.clients = store.clients
    .map((client) => {
      const next = primaryUpdates.get(client.id);
      return next ? next : client;
    })
    .filter((client) => !idsToDelete.has(client.id));

  await writeStore(store);
  return { merged: idsToDelete.size };
}
