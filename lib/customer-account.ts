import { promises as fs } from "fs";
import path from "path";
import { getAllBookings, type BookingRecord } from "./bookings";
import { getPrimaryBusinessPhoto, getBusinessDirectorySnapshot } from "./pro-data";
import { getPublicBusinessPathId } from "./public-business-path";
import type { PublicCustomerSession } from "./public-customer-auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export type CustomerAddress = {
  id: string;
  label: string;
  title: string;
  address: string;
};

export type CustomerNotifications = {
  bookingSms: boolean;
  bookingWhatsapp: boolean;
  marketingEmail: boolean;
  marketingSms: boolean;
  marketingWhatsapp: boolean;
};

export type CustomerAccountRecord = {
  email: string;
  givenName: string;
  familyName: string;
  fullName: string;
  phone: string;
  birthday: string;
  gender: string;
  addresses: CustomerAddress[];
  favoriteBusinessIds: string[];
  notifications: CustomerNotifications;
  createdAt: string;
  updatedAt: string;
};

export type CustomerBookingSummary = {
  id: string;
  businessId: string;
  businessName: string;
  businessImage: string;
  businessPath: string;
  businessAddress: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: BookingRecord["status"];
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  createdAt: string;
};

type CustomerAccountStore = {
  accounts: CustomerAccountRecord[];
};

const storePath = path.join(process.cwd(), "data", "customer-accounts.json");

function createAddressId() {
  return `addr_${crypto.randomUUID()}`;
}

function getDefaultNotifications(): CustomerNotifications {
  return {
    bookingSms: true,
    bookingWhatsapp: true,
    marketingEmail: false,
    marketingSms: false,
    marketingWhatsapp: false
  };
}

function normalizeAddresses(value: unknown): CustomerAddress[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const source = item as Partial<CustomerAddress>;
      const title = typeof source.title === "string" ? source.title.trim() : "";
      const address = typeof source.address === "string" ? source.address.trim() : "";

      if (!title && !address) {
        return null;
      }

      return {
        id: typeof source.id === "string" && source.id.trim() ? source.id.trim() : createAddressId(),
        label: typeof source.label === "string" && source.label.trim() ? source.label.trim() : "other",
        title,
        address
      } satisfies CustomerAddress;
    })
    .filter((item): item is CustomerAddress => Boolean(item));
}

function normalizeNotifications(value: unknown): CustomerNotifications {
  if (!value || typeof value !== "object") {
    return getDefaultNotifications();
  }

  const source = value as Partial<CustomerNotifications>;
  const defaults = getDefaultNotifications();

  return {
    bookingSms: source.bookingSms ?? defaults.bookingSms,
    bookingWhatsapp: source.bookingWhatsapp ?? defaults.bookingWhatsapp,
    marketingEmail: source.marketingEmail ?? defaults.marketingEmail,
    marketingSms: source.marketingSms ?? defaults.marketingSms,
    marketingWhatsapp: source.marketingWhatsapp ?? defaults.marketingWhatsapp
  };
}

function normalizeAccountRecord(account: Partial<CustomerAccountRecord> & { email: string }): CustomerAccountRecord {
  const email = account.email.trim().toLowerCase();
  const givenName = account.givenName?.trim() || "";
  const familyName = account.familyName?.trim() || "";
  const fullName =
    account.fullName?.trim() || `${givenName} ${familyName}`.trim() || email.split("@")[0] || "Customer";
  const createdAt = account.createdAt || new Date().toISOString();

  return {
    email,
    givenName,
    familyName,
    fullName,
    phone: account.phone?.trim() || "",
    birthday: account.birthday?.trim() || "",
    gender: account.gender?.trim() || "",
    addresses: normalizeAddresses(account.addresses),
    favoriteBusinessIds: Array.isArray(account.favoriteBusinessIds)
      ? account.favoriteBusinessIds.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    notifications: normalizeNotifications(account.notifications),
    createdAt,
    updatedAt: account.updatedAt || createdAt
  };
}

function makeSeedAccount(session: PublicCustomerSession): CustomerAccountRecord {
  return normalizeAccountRecord({
    email: session.email,
    givenName: session.givenName,
    familyName: session.familyName,
    fullName: session.fullName
  });
}

async function ensureStore() {
  try {
    await fs.access(storePath);
  } catch {
    const initial: CustomerAccountStore = { accounts: [] };
    await fs.writeFile(storePath, JSON.stringify(initial, null, 2) + "\n", "utf8");
  }
}

async function readLocalStore() {
  await ensureStore();
  const file = await fs.readFile(storePath, "utf8");
  const parsed = JSON.parse(file) as Partial<CustomerAccountStore>;
  const accounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
  return {
    accounts: accounts
      .map((account) => {
        if (!account || typeof account !== "object" || typeof (account as { email?: unknown }).email !== "string") {
          return null;
        }
        return normalizeAccountRecord(account as CustomerAccountRecord);
      })
      .filter((account): account is CustomerAccountRecord => Boolean(account))
  } satisfies CustomerAccountStore;
}

async function writeLocalStore(store: CustomerAccountStore) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

function mapSupabaseAccount(row: Record<string, unknown>): CustomerAccountRecord {
  return normalizeAccountRecord({
    email: String(row.email ?? ""),
    givenName: String(row.given_name ?? ""),
    familyName: String(row.family_name ?? ""),
    fullName: String(row.full_name ?? ""),
    phone: String(row.phone ?? ""),
    birthday: String(row.birthday ?? ""),
    gender: String(row.gender ?? ""),
    addresses: row.addresses as unknown as CustomerAddress[],
    favoriteBusinessIds: row.favorite_business_ids as unknown as string[],
    notifications: row.notifications as unknown as CustomerNotifications,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  });
}

export async function getCustomerAccount(session: PublicCustomerSession) {
  const supabase = getSupabaseAdmin();

  if (supabase && isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("customer_accounts")
      .select(
        "email, given_name, family_name, full_name, phone, birthday, gender, addresses, favorite_business_ids, notifications, created_at, updated_at"
      )
      .eq("email", session.email)
      .maybeSingle();

    if (error && !/customer_accounts/i.test(error.message)) {
      throw new Error(error.message);
    }

    if (data) {
      return mapSupabaseAccount(data as Record<string, unknown>);
    }
  }

  const store = await readLocalStore();
  return store.accounts.find((account) => account.email === session.email) ?? makeSeedAccount(session);
}

export async function upsertCustomerAccount(
  session: PublicCustomerSession,
  patch: Partial<CustomerAccountRecord>
) {
  const nextAccount = normalizeAccountRecord({
    ...(await getCustomerAccount(session)),
    ...patch,
    email: session.email,
    updatedAt: new Date().toISOString()
  });

  const supabase = getSupabaseAdmin();
  if (supabase && isSupabaseConfigured()) {
    const payload = {
      email: nextAccount.email,
      given_name: nextAccount.givenName,
      family_name: nextAccount.familyName,
      full_name: nextAccount.fullName,
      phone: nextAccount.phone,
      birthday: nextAccount.birthday,
      gender: nextAccount.gender,
      addresses: nextAccount.addresses,
      favorite_business_ids: nextAccount.favoriteBusinessIds,
      notifications: nextAccount.notifications,
      updated_at: nextAccount.updatedAt
    };

    const { error } = await supabase.from("customer_accounts").upsert(payload, { onConflict: "email" });
    if (!error) {
      return nextAccount;
    }

    if (!/customer_accounts/i.test(error.message)) {
      throw new Error(error.message);
    }
  }

  const store = await readLocalStore();
  const existingIndex = store.accounts.findIndex((account) => account.email === session.email);

  if (existingIndex >= 0) {
    store.accounts[existingIndex] = nextAccount;
  } else {
    store.accounts.unshift(nextAccount);
  }

  await writeLocalStore(store);
  return nextAccount;
}

export async function getCustomerDashboard(session: PublicCustomerSession) {
  const [account, bookings, directory] = await Promise.all([
    getCustomerAccount(session),
    getAllBookings(),
    getBusinessDirectorySnapshot()
  ]);

  const summaries = bookings
    .filter((booking) => booking.customerEmail?.trim().toLowerCase() === session.email)
    .map((booking) => {
      const businessId = booking.salonSlug.startsWith("business:") ? booking.salonSlug.slice("business:".length) : "";
      const business = businessId ? directory.businesses.find((item) => item.id === businessId) : null;

      return {
        id: booking.id,
        businessId,
        businessName: business?.name || booking.salonName,
        businessImage:
          (business ? getPrimaryBusinessPhoto(business) : "") ||
          "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
        businessPath: business ? getPublicBusinessPathId(business) : "",
        businessAddress: business?.address || "",
        serviceName: booking.serviceName,
        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,
        status: booking.status,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerNotes: booking.customerNotes,
        createdAt: booking.createdAt
      } satisfies CustomerBookingSummary;
    })
    .sort((left, right) => `${left.appointmentDate}T${left.appointmentTime}`.localeCompare(`${right.appointmentDate}T${right.appointmentTime}`));

  const latestPhone = account.phone || summaries.slice().reverse().find((item) => item.customerPhone.trim())?.customerPhone || "";
  return {
    account: latestPhone && !account.phone ? { ...account, phone: latestPhone } : account,
    bookings: summaries
  };
}
