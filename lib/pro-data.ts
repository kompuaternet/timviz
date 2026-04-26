import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { hashPassword, verifyPassword } from "./pro-auth";
import {
  createEmptyCustomSchedule,
  createDefaultWorkSchedule,
  createEmptyWorkSchedule,
  normalizeCustomSchedule,
  normalizeWorkSchedule,
  normalizeWorkScheduleMode,
  type CustomSchedule,
  type WorkSchedule,
  type WorkScheduleMode
} from "./work-schedule";

export type AccountDraft = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  timezone: string;
  language: string;
  currency?: string;
};

export type SetupDraft = {
  ownerMode: "owner" | "member";
  joinBusinessName: string;
  joinBusinessRole: string;
  companyName: string;
  website: string;
  categories: string[];
  services: string[];
  accountType: "solo" | "team";
  serviceMode: string;
  address: string;
  addressDetails: string;
  addressLat: number | null;
  addressLon: number | null;
  workScheduleMode?: WorkScheduleMode;
  workSchedule?: WorkSchedule;
  customSchedule?: CustomSchedule;
};

export type BusinessPhoto = {
  id: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
  createdByProfessionalId?: string;
  caption?: string;
  status?: "active" | "blocked";
  blockedAt?: string;
};

export type BusinessRecord = {
  id: string;
  name: string;
  website: string;
  categories: string[];
  accountType: "solo" | "team";
  serviceMode: string;
  address: string;
  addressDetails: string;
  addressLat: number | null;
  addressLon: number | null;
  workScheduleMode: WorkScheduleMode;
  workSchedule: WorkSchedule;
  customSchedule: CustomSchedule;
  allowOnlineBooking?: boolean;
  photos?: BusinessPhoto[];
  ownerProfessionalId: string | null;
  createdAt: string;
};

export type ProfessionalRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone: string;
  country: string;
  timezone: string;
  language: string;
  currency?: string;
  bookingCreditsTotal?: number;
  walletBalance?: number;
  ownerMode: "owner" | "member";
  createdAt: string;
};

export type MembershipRecord = {
  id: string;
  businessId: string;
  professionalId: string;
  role: string;
  scope: "owner" | "member";
  createdAt: string;
};

export type ServiceRecord = {
  id: string;
  businessId: string;
  name: string;
  price: number;
  category?: string;
  durationMinutes?: number;
  color?: string;
  sortOrder?: number;
  createdByProfessionalId?: string;
  source?: "catalog" | "custom";
  moderationStatus?: "pending" | "approved";
  moderatedAt?: string;
  isBlocked?: boolean;
  createdAt: string;
};

type ProDataStore = {
  businesses: BusinessRecord[];
  professionals: ProfessionalRecord[];
  memberships: MembershipRecord[];
  services: ServiceRecord[];
};

export type WorkspaceSnapshot = {
  professional: ProfessionalRecord;
  business: BusinessRecord;
  membership: MembershipRecord;
  services: ServiceRecord[];
};

export type BusinessDirectorySnapshot = {
  businesses: BusinessRecord[];
  professionals: ProfessionalRecord[];
  memberships: MembershipRecord[];
  services: ServiceRecord[];
};

const storePath = path.join(process.cwd(), "data", "pro-data.json");

const defaultServiceColors = [
  "#8bd7e8",
  "#ffd166",
  "#7ed6bd",
  "#b794f4",
  "#f6729a",
  "#a5d76e",
  "#ff9f80",
  "#90cdf4"
];

export const DEFAULT_BOOKING_CREDITS = 500;

function normalizeServiceSource(value: unknown): "catalog" | "custom" {
  return value === "custom" ? "custom" : "catalog";
}

function normalizeBusinessRecord(business: BusinessRecord): BusinessRecord {
  return {
    ...business,
    workScheduleMode: normalizeWorkScheduleMode(business.workScheduleMode),
    workSchedule: normalizeWorkSchedule(business.workSchedule),
    customSchedule: normalizeCustomSchedule(business.customSchedule),
    allowOnlineBooking: business.allowOnlineBooking === true,
    photos: normalizeBusinessPhotos(business.photos)
  };
}

function normalizeServiceModerationStatus(value: unknown): "pending" | "approved" {
  return value === "pending" ? "pending" : "approved";
}

function normalizeServiceRecord(service: ServiceRecord): ServiceRecord {
  const source = normalizeServiceSource(service.source);

  return {
    ...service,
    price: typeof service.price === "number" ? service.price : inferServicePrice(service.name),
    category: service.category || "Без категории",
    durationMinutes:
      typeof service.durationMinutes === "number"
        ? service.durationMinutes
        : inferServiceDuration(service.name),
    color: service.color || getDefaultServiceColor(service.name),
    sortOrder: typeof service.sortOrder === "number" ? service.sortOrder : 0,
    source,
    moderationStatus: normalizeServiceModerationStatus(service.moderationStatus),
    moderatedAt:
      typeof service.moderatedAt === "string" && service.moderatedAt.trim()
        ? service.moderatedAt.trim()
        : undefined
  };
}

export function inferCurrencyFromCountry(country = "") {
  const normalized = country.toLowerCase();

  if (normalized.includes("ukraine") || normalized.includes("укра")) {
    return "UAH";
  }

  if (normalized.includes("russia") || normalized.includes("росси")) {
    return "RUB";
  }

  if (normalized.includes("poland") || normalized.includes("поль")) {
    return "PLN";
  }

  if (normalized.includes("united kingdom") || normalized.includes("britain") || normalized.includes("англ")) {
    return "GBP";
  }

  if (normalized.includes("united states") || normalized.includes("usa") || normalized.includes("сша")) {
    return "USD";
  }

  return "USD";
}

function normalizeProfessionalRecord(professional: ProfessionalRecord): ProfessionalRecord {
  return {
    ...professional,
    currency: professional.currency || inferCurrencyFromCountry(professional.country),
    bookingCreditsTotal:
      typeof professional.bookingCreditsTotal === "number"
        ? Math.max(0, professional.bookingCreditsTotal)
        : DEFAULT_BOOKING_CREDITS,
    walletBalance:
      typeof professional.walletBalance === "number"
        ? Math.max(0, professional.walletBalance)
        : 0
  };
}

export function normalizeBusinessPhotos(input: unknown): BusinessPhoto[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const rows = input
    .map((item, index): BusinessPhoto | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<BusinessPhoto>;
      const url = typeof candidate.url === "string" ? candidate.url.trim() : "";

      if (!url) {
        return null;
      }

      return {
        id:
          typeof candidate.id === "string" && candidate.id.trim()
            ? candidate.id.trim()
            : `business-photo-${index + 1}`,
        url,
        isPrimary: candidate.isPrimary === true,
        createdAt:
          typeof candidate.createdAt === "string" && candidate.createdAt.trim()
            ? candidate.createdAt.trim()
            : new Date(0).toISOString(),
        createdByProfessionalId:
          typeof candidate.createdByProfessionalId === "string" && candidate.createdByProfessionalId.trim()
            ? candidate.createdByProfessionalId.trim()
            : undefined,
        caption:
          typeof candidate.caption === "string" && candidate.caption.trim()
            ? candidate.caption.trim()
            : undefined,
        status: candidate.status === "blocked" ? "blocked" : "active",
        blockedAt:
          typeof candidate.blockedAt === "string" && candidate.blockedAt.trim()
            ? candidate.blockedAt.trim()
            : undefined
      } satisfies BusinessPhoto;
    });

  const photos = rows.filter((photo): photo is BusinessPhoto => photo !== null).slice(0, 5);

  if (photos.length === 0) {
    return [];
  }

  const primaryIndex = photos.findIndex((photo) => photo.isPrimary);

  return photos.map((photo, index) => ({
    ...photo,
    isPrimary: primaryIndex >= 0 ? index === primaryIndex : index === 0
  }));
}

export function getPrimaryBusinessPhoto(business: Pick<BusinessRecord, "photos">) {
  const photos = normalizeBusinessPhotos(business.photos).filter((photo) => photo.status !== "blocked");
  return photos.find((photo) => photo.isPrimary)?.url ?? photos[0]?.url ?? "";
}

function mapSupabaseProfessionalRow(row: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  phone: string;
  country: string;
  timezone: string;
  language: string;
  currency?: string | null;
  booking_credits_total?: number | null;
  wallet_balance?: number | null;
  owner_mode: string;
  created_at: string;
}): ProfessionalRecord {
  return normalizeProfessionalRecord({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    passwordHash: row.password_hash,
    phone: row.phone,
    country: row.country,
    timezone: row.timezone,
    language: row.language,
    currency: row.currency ?? undefined,
    bookingCreditsTotal:
      typeof row.booking_credits_total === "number" ? row.booking_credits_total : undefined,
    walletBalance: typeof row.wallet_balance === "number" ? row.wallet_balance : undefined,
    ownerMode: row.owner_mode === "member" ? "member" : "owner",
    createdAt: row.created_at
  });
}

function mapSupabaseBusinessRow(row: {
  id: string;
  name: string;
  website?: string | null;
  categories?: unknown;
  account_type: "solo" | "team";
  service_mode: string;
  address?: string | null;
  address_details?: string | null;
  address_lat?: number | null;
  address_lon?: number | null;
  work_schedule_mode?: WorkScheduleMode | null;
  work_schedule?: unknown;
  custom_schedule?: unknown;
  allow_online_booking?: boolean | null;
  photos?: unknown;
  owner_professional_id?: string | null;
  created_at: string;
}): BusinessRecord {
  return normalizeBusinessRecord({
    id: row.id,
    name: row.name,
    website: row.website ?? "",
    categories: Array.isArray(row.categories) ? (row.categories as string[]) : [],
    accountType: row.account_type,
    serviceMode: row.service_mode,
    address: row.address ?? "",
    addressDetails: row.address_details ?? "",
    addressLat: row.address_lat ?? null,
    addressLon: row.address_lon ?? null,
    workScheduleMode: normalizeWorkScheduleMode(row.work_schedule_mode),
    workSchedule: normalizeWorkSchedule(row.work_schedule),
    customSchedule: normalizeCustomSchedule(row.custom_schedule),
    allowOnlineBooking: row.allow_online_booking === true,
    photos: normalizeBusinessPhotos(row.photos),
    ownerProfessionalId: row.owner_professional_id ?? null,
    createdAt: row.created_at
  });
}

function mapSupabaseMembershipRow(row: {
  id: string;
  business_id: string;
  professional_id: string;
  role: string;
  scope: "owner" | "member";
  created_at: string;
}): MembershipRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    professionalId: row.professional_id,
    role: row.role,
    scope: row.scope,
    createdAt: row.created_at
  };
}

function mapSupabaseServiceRow(row: {
  id: string;
  business_id: string;
  name: string;
  price?: number | null;
  category?: string | null;
  duration_minutes?: number | null;
  color?: string | null;
  sort_order?: number | null;
  created_by_professional_id?: string | null;
  source?: string | null;
  moderation_status?: string | null;
  moderated_at?: string | null;
  is_blocked?: boolean | null;
  created_at: string;
}): ServiceRecord {
  return normalizeServiceRecord({
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    price: typeof row.price === "number" ? row.price : inferServicePrice(row.name),
    category: row.category || "Без категории",
    durationMinutes:
      typeof row.duration_minutes === "number" ? row.duration_minutes : inferServiceDuration(row.name),
    color: row.color || getDefaultServiceColor(row.name),
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    createdByProfessionalId: row.created_by_professional_id ?? undefined,
    source: row.source === "custom" ? "custom" : "catalog",
    moderationStatus: row.moderation_status === "pending" ? "pending" : "approved",
    moderatedAt: row.moderated_at ?? undefined,
    isBlocked: row.is_blocked === true,
    createdAt: row.created_at
  });
}

function getDefaultServiceColor(serviceName: string, index = 0) {
  let hash = index;
  for (const char of serviceName) {
    hash = (hash * 31 + char.charCodeAt(0)) % defaultServiceColors.length;
  }

  return defaultServiceColors[Math.abs(hash) % defaultServiceColors.length];
}

const demoBusinesses = [
  {
    name: "Studio Aura",
    website: "https://studio-aura.example",
    categories: ["Салон красоты"],
    accountType: "team" as const,
    serviceMode: "Клиенты приходят в мое физическое заведение",
    address: "ул. Саксаганского, 48, Киев, Украина",
    addressDetails: "ул. Саксаганского, 48\nКиев\nУкраина",
    addressLat: 50.4338,
    addressLon: 30.5078,
    workScheduleMode: "fixed" as const,
    workSchedule: createEmptyWorkSchedule(),
    customSchedule: createEmptyCustomSchedule()
  },
  {
    name: "Barber Drive",
    website: "https://barber-drive.example",
    categories: ["Парикмахер"],
    accountType: "team" as const,
    serviceMode: "Клиенты приходят в мое физическое заведение",
    address: "ул. Городоцкая, 91, Львов, Украина",
    addressDetails: "ул. Городоцкая, 91\nЛьвов\nУкраина",
    addressLat: 49.8397,
    addressLon: 24.0132,
    workScheduleMode: "fixed" as const,
    workSchedule: createEmptyWorkSchedule(),
    customSchedule: createEmptyCustomSchedule()
  },
  {
    name: "Nail Yard",
    website: "https://nail-yard.example",
    categories: ["Ногти"],
    accountType: "team" as const,
    serviceMode: "Клиенты приходят в мое физическое заведение",
    address: "Французский бульвар, 22, Одесса, Украина",
    addressDetails: "Французский бульвар, 22\nОдесса\nУкраина",
    addressLat: 46.4572,
    addressLon: 30.7533,
    workScheduleMode: "fixed" as const,
    workSchedule: createEmptyWorkSchedule(),
    customSchedule: createEmptyCustomSchedule()
  }
];

function isDemoBusinessRecord(input: {
  name?: string | null;
  website?: string | null;
  address?: string | null;
}) {
  const normalizedName = String(input.name ?? "").trim().toLowerCase();
  const normalizedWebsite = String(input.website ?? "").trim().toLowerCase();
  const normalizedAddress = String(input.address ?? "").trim().toLowerCase();

  if (normalizedWebsite.endsWith(".example") || normalizedWebsite.includes(".example/")) {
    return true;
  }

  return demoBusinesses.some((item) => {
    return (
      normalizedName === item.name.trim().toLowerCase() &&
      normalizedAddress === item.address.trim().toLowerCase()
    );
  });
}

function inferServicePrice(serviceName: string) {
  if (/балаяж|окраш|цвет/i.test(serviceName)) {
    return 1200;
  }

  if (/педикюр|наращ|массаж|спа/i.test(serviceName)) {
    return 900;
  }

  if (/маникюр|укладк|бород/i.test(serviceName)) {
    return 650;
  }

  if (/стрижк/i.test(serviceName)) {
    return 500;
  }

  return 700;
}

function inferServiceDuration(serviceName: string) {
  if (/балаяж|окраш|цвет|наращ|комплекс|спа|массаж/i.test(serviceName)) {
    return 90;
  }

  if (/маникюр|стрижк|уклад|бров|ресниц|бород/i.test(serviceName)) {
    return 45;
  }

  return 60;
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function readStore() {
  const file = await fs.readFile(storePath, "utf8");
  return JSON.parse(file) as ProDataStore;
}

async function writeStore(data: ProDataStore) {
  await fs.writeFile(storePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function ensureDemoBusinessesInLocalStore() {
  const store = await readStore();
  let changed = false;

  store.businesses = store.businesses.map((business) => {
    const nextMode = normalizeWorkScheduleMode(business.workScheduleMode);
    const nextSchedule = normalizeWorkSchedule(business.workSchedule);
    const nextPhotos = normalizeBusinessPhotos(business.photos);

    if (
      business.workScheduleMode !== nextMode ||
      business.workSchedule !== nextSchedule ||
      JSON.stringify(business.photos ?? []) !== JSON.stringify(nextPhotos) ||
      business.allowOnlineBooking !== (business.allowOnlineBooking === true)
    ) {
      changed = true;
    }

    return normalizeBusinessRecord({
      ...business,
      workScheduleMode: nextMode,
      workSchedule: nextSchedule,
      customSchedule: normalizeCustomSchedule(business.customSchedule),
      photos: nextPhotos
    });
  });

  store.professionals = store.professionals.map((professional) => {
    const nextProfessional = normalizeProfessionalRecord(professional);

    if (
      professional.currency !== nextProfessional.currency ||
      professional.bookingCreditsTotal !== nextProfessional.bookingCreditsTotal
    ) {
      changed = true;
    }

    return nextProfessional;
  });

  store.services = store.services.map((service) => normalizeServiceRecord(service));

  if (changed) {
    await writeStore(store);
  }

  return store;
}

export async function getBusinessDirectorySnapshot(): Promise<BusinessDirectorySnapshot> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { businesses: [], professionals: [], memberships: [], services: [] };
    }

    const [
      { data: businesses, error: businessesError },
      { data: professionals, error: professionalsError },
      { data: memberships, error: membershipsError },
      { data: services, error: servicesError }
    ] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: true }),
      supabase.from("professionals").select("*").order("created_at", { ascending: true }),
      supabase.from("business_memberships").select("*").order("created_at", { ascending: true }),
      supabase.from("business_services").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true })
    ]);

    if (businessesError) {
      throw new Error(businessesError.message);
    }
    if (professionalsError) {
      throw new Error(professionalsError.message);
    }
    if (membershipsError) {
      throw new Error(membershipsError.message);
    }
    if (servicesError) {
      throw new Error(servicesError.message);
    }

    return {
      businesses: (businesses ?? []).map(mapSupabaseBusinessRow).filter((business) => !isDemoBusinessRecord(business)),
      professionals: (professionals ?? []).map(mapSupabaseProfessionalRow),
      memberships: (memberships ?? []).map(mapSupabaseMembershipRow),
      services: (services ?? []).map(mapSupabaseServiceRow)
    };
  }

  const store = await ensureDemoBusinessesInLocalStore();

  return {
    businesses: store.businesses
      .map((business) => ({
        ...normalizeBusinessRecord(business)
      }))
      .filter((business) => !isDemoBusinessRecord(business)),
    professionals: store.professionals.map(normalizeProfessionalRecord),
    memberships: [...store.memberships],
    services: store.services.map((service) => normalizeServiceRecord(service))
  };
}

export async function createProfessionalSetup(input: {
  account: AccountDraft;
  setup: SetupDraft;
}) {
  const normalizedEmail = input.account.email.trim().toLowerCase();
  const existingProfessionalId = await getProfessionalIdByEmail(normalizedEmail);
  if (existingProfessionalId) {
    throw new Error("Пользователь с таким email уже существует.");
  }

  const createdAt = new Date().toISOString();
  const initialWorkSchedule =
    input.setup.ownerMode === "owner" && !input.setup.workSchedule
      ? createDefaultWorkSchedule()
      : normalizeWorkSchedule(input.setup.workSchedule);
  const initialCustomSchedule = normalizeCustomSchedule(input.setup.customSchedule);
  const initialWorkScheduleMode = normalizeWorkScheduleMode(input.setup.workScheduleMode);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const professionalId = makeId("pro");
    const { error: professionalError } = await supabase.from("professionals").insert({
      id: professionalId,
      first_name: input.account.firstName,
      last_name: input.account.lastName,
      email: normalizedEmail,
      password_hash: hashPassword(input.account.password),
      phone: input.account.phone,
      country: input.account.country,
      timezone: input.account.timezone,
      language: input.account.language,
      currency: input.account.currency || inferCurrencyFromCountry(input.account.country),
      booking_credits_total: DEFAULT_BOOKING_CREDITS,
      owner_mode: input.setup.ownerMode,
      created_at: createdAt
    });

    if (professionalError) {
      throw new Error(professionalError.message);
    }

    let businessId: string;

    if (input.setup.ownerMode === "owner") {
      businessId = makeId("biz");
      const { error: businessError } = await supabase.from("businesses").insert({
        id: businessId,
        name: input.setup.companyName,
        website: input.setup.website,
        categories: input.setup.categories,
        account_type: input.setup.accountType,
        service_mode: input.setup.serviceMode,
        address: input.setup.address,
        address_details: input.setup.addressDetails,
        address_lat: input.setup.addressLat,
        address_lon: input.setup.addressLon,
        work_schedule_mode: initialWorkScheduleMode,
        work_schedule: initialWorkSchedule,
        custom_schedule: initialCustomSchedule,
        allow_online_booking: false,
        photos: [],
        owner_professional_id: professionalId,
        created_at: createdAt
      });

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (input.setup.services.length > 0) {
        const servicesPayload = input.setup.services.map((service, index) => ({
          id: makeId("svc"),
          business_id: businessId,
          name: service,
          price: inferServicePrice(service),
          category: input.setup.categories[0] || "Без категории",
          duration_minutes: inferServiceDuration(service),
          color: getDefaultServiceColor(service, index),
          sort_order: index,
          created_by_professional_id: professionalId,
          source: "catalog",
          moderation_status: "approved",
          moderated_at: createdAt,
          is_blocked: false,
          created_at: createdAt
        }));
        let { error: servicesError } = await supabase.from("business_services").insert(servicesPayload);

        if (servicesError && /created_by_professional_id|is_blocked|source|moderation_status|moderated_at/i.test(servicesError.message)) {
          ({ error: servicesError } = await supabase.from("business_services").insert(
            servicesPayload.map(
              ({ created_by_professional_id, source, moderation_status, moderated_at, is_blocked, ...service }) =>
                service
            )
          ));
        }

        if (servicesError) {
          throw new Error(servicesError.message);
        }
      }
    } else {
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("name", input.setup.joinBusinessName)
        .maybeSingle();

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (!business?.id) {
        throw new Error("Business not found for membership.");
      }

      businessId = business.id;
    }

    const membershipId = makeId("membership");
    const { error: membershipError } = await supabase.from("business_memberships").insert({
      id: membershipId,
      business_id: businessId,
      professional_id: professionalId,
      role: input.setup.ownerMode === "owner" ? "owner" : input.setup.joinBusinessRole,
      scope: input.setup.ownerMode,
      created_at: createdAt
    });

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    return { professionalId };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professionalId = makeId("pro");

  const professional: ProfessionalRecord = {
    id: professionalId,
    firstName: input.account.firstName,
    lastName: input.account.lastName,
    email: normalizedEmail,
    passwordHash: hashPassword(input.account.password),
    phone: input.account.phone,
    country: input.account.country,
    timezone: input.account.timezone,
    language: input.account.language,
    currency: input.account.currency || inferCurrencyFromCountry(input.account.country),
    bookingCreditsTotal: DEFAULT_BOOKING_CREDITS,
    ownerMode: input.setup.ownerMode,
    createdAt
  };

  store.professionals.push(professional);

  let businessId: string;

  if (input.setup.ownerMode === "owner") {
    const business: BusinessRecord = {
      id: makeId("biz"),
      name: input.setup.companyName,
      website: input.setup.website,
      categories: input.setup.categories,
      accountType: input.setup.accountType,
      serviceMode: input.setup.serviceMode,
      address: input.setup.address,
      addressDetails: input.setup.addressDetails,
      addressLat: input.setup.addressLat,
      addressLon: input.setup.addressLon,
      workScheduleMode: initialWorkScheduleMode,
      workSchedule: initialWorkSchedule,
        customSchedule: initialCustomSchedule,
        allowOnlineBooking: false,
        photos: [],
        ownerProfessionalId: professionalId,
        createdAt
    };

    store.businesses.push(business);
    businessId = business.id;

    store.services.push(
      ...input.setup.services.map((service) => ({
        id: makeId("svc"),
        businessId,
        name: service,
        price: inferServicePrice(service),
        category: input.setup.categories[0] || "Без категории",
        durationMinutes: inferServiceDuration(service),
        createdByProfessionalId: professionalId,
        source: "catalog" as const,
        moderationStatus: "approved" as const,
        moderatedAt: createdAt,
        isBlocked: false,
        createdAt
      }))
    );
  } else {
    const business = store.businesses.find(
      (item) => item.name === input.setup.joinBusinessName
    );

    if (!business) {
      throw new Error("Business not found for membership.");
    }

    businessId = business.id;
  }

  store.memberships.push({
    id: makeId("membership"),
    businessId,
    professionalId,
    role: input.setup.ownerMode === "owner" ? "owner" : input.setup.joinBusinessRole,
    scope: input.setup.ownerMode,
    createdAt
  });

  await writeStore(store);
  return { professionalId };
}

export async function getWorkspaceSnapshot(
  professionalId: string
): Promise<WorkspaceSnapshot | null> {
  const directory = await getBusinessDirectorySnapshot();
  const professional = directory.professionals.find((item) => item.id === professionalId);

  if (!professional) {
    return null;
  }

  const membership = directory.memberships.find(
    (item) => item.professionalId === professionalId
  );

  if (!membership) {
    return null;
  }

  const business = directory.businesses.find((item) => item.id === membership.businessId);

  if (!business) {
    return null;
  }

  const services = directory.services
    .filter((item) => item.businessId === business.id && item.isBlocked !== true)
    .sort((left, right) => {
      const orderDiff = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
      return orderDiff || left.createdAt.localeCompare(right.createdAt);
    });

  return {
    professional,
    business,
    membership,
    services
  };
}

export async function authenticateProfessional(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("professionals")
      .select(
        "id, first_name, last_name, email, password_hash, phone, country, timezone, language, owner_mode, created_at"
      )
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return verifyPassword(password, data.password_hash) ? data.id : null;
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professional = store.professionals.find((item) => item.email.trim().toLowerCase() === normalizedEmail);

  if (!professional) {
    return null;
  }

  return verifyPassword(password, professional.passwordHash) ? professional.id : null;
}

export async function getProfessionalIdByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("professionals")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.id || null;
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professional = store.professionals.find(
    (item) => item.email.trim().toLowerCase() === normalizedEmail
  );
  return professional?.id || null;
}

export async function updateBusinessScheduleForProfessional(input: {
  professionalId: string;
  workScheduleMode: WorkScheduleMode;
  workSchedule: WorkSchedule;
  customSchedule: CustomSchedule;
}) {
  const nextMode = normalizeWorkScheduleMode(input.workScheduleMode);
  const nextSchedule = normalizeWorkSchedule(input.workSchedule);
  const nextCustomSchedule = normalizeCustomSchedule(input.customSchedule);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("business_memberships")
      .select("business_id, scope")
      .eq("professional_id", input.professionalId)
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (!membership?.business_id) {
      throw new Error("Business membership not found.");
    }

    if (membership.scope !== "owner") {
      throw new Error("Only business owner can edit the business schedule now.");
    }

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        work_schedule_mode: nextMode,
        work_schedule: nextSchedule,
        custom_schedule: nextCustomSchedule
      })
      .eq("id", membership.business_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { ok: true };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const membership = store.memberships.find(
    (item) => item.professionalId === input.professionalId
  );

  if (!membership) {
    throw new Error("Business membership not found.");
  }

  if (membership.scope !== "owner") {
    throw new Error("Only business owner can edit the business schedule now.");
  }

  const business = store.businesses.find((item) => item.id === membership.businessId);

  if (!business) {
    throw new Error("Business not found.");
  }

  business.workScheduleMode = nextMode;
  business.workSchedule = nextSchedule;
  business.customSchedule = nextCustomSchedule;

  await writeStore(store);
  return { ok: true };
}

export type WorkspaceSettingsUpdate = {
  professional?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    country?: string;
    timezone?: string;
    language?: string;
    currency?: string;
  };
  business?: {
    name?: string;
    website?: string;
    categories?: string[];
    accountType?: "solo" | "team";
    serviceMode?: string;
    address?: string;
    addressDetails?: string;
    addressLat?: number | null;
    addressLon?: number | null;
    allowOnlineBooking?: boolean;
    photos?: BusinessPhoto[];
  };
  newPassword?: string;
  topUpCredits?: number;
};

export async function updateWorkspaceSettingsForProfessional(
  professionalId: string,
  input: WorkspaceSettingsUpdate
) {
  const workspace = await getWorkspaceSnapshot(professionalId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const nextProfessional = input.professional ?? {};
  const nextBusiness = input.business ?? {};
  const nextCategories = Array.isArray(nextBusiness.categories)
    ? nextBusiness.categories.map((category) => category.trim()).filter(Boolean)
    : undefined;
  const topUpCredits =
    typeof input.topUpCredits === "number" && Number.isFinite(input.topUpCredits)
      ? Math.max(0, Math.floor(input.topUpCredits))
      : 0;
  const password = input.newPassword?.trim() ?? "";
  const existingPhotos = normalizeBusinessPhotos(workspace.business.photos);

  if (password && password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const professionalUpdates: Record<string, string | number> = {};
    if (typeof nextProfessional.firstName === "string") professionalUpdates.first_name = nextProfessional.firstName.trim();
    if (typeof nextProfessional.lastName === "string") professionalUpdates.last_name = nextProfessional.lastName.trim();
    if (typeof nextProfessional.email === "string") professionalUpdates.email = nextProfessional.email.trim();
    if (typeof nextProfessional.phone === "string") professionalUpdates.phone = nextProfessional.phone.trim();
    if (typeof nextProfessional.country === "string") professionalUpdates.country = nextProfessional.country.trim();
    if (typeof nextProfessional.timezone === "string") professionalUpdates.timezone = nextProfessional.timezone.trim();
    if (typeof nextProfessional.language === "string") professionalUpdates.language = nextProfessional.language.trim();
    if (typeof nextProfessional.currency === "string") professionalUpdates.currency = nextProfessional.currency.trim();
    if (password) professionalUpdates.password_hash = hashPassword(password);
    if (topUpCredits > 0) {
      professionalUpdates.booking_credits_total =
        (workspace.professional.bookingCreditsTotal ?? DEFAULT_BOOKING_CREDITS) + topUpCredits;
    }

    if (Object.keys(professionalUpdates).length > 0) {
      const { error } = await supabase.from("professionals").update(professionalUpdates).eq("id", professionalId);
      if (error) {
        throw new Error(error.message);
      }
    }

    if (workspace.membership.scope === "owner") {
      const businessUpdates: Record<
        string,
        string | string[] | number | null | boolean | BusinessPhoto[]
      > = {};
      if (typeof nextBusiness.name === "string") businessUpdates.name = nextBusiness.name.trim();
      if (typeof nextBusiness.website === "string") businessUpdates.website = nextBusiness.website.trim();
      if (nextCategories) businessUpdates.categories = nextCategories;
      if (typeof nextBusiness.accountType === "string") businessUpdates.account_type = nextBusiness.accountType;
      if (typeof nextBusiness.serviceMode === "string") businessUpdates.service_mode = nextBusiness.serviceMode.trim();
      if (typeof nextBusiness.address === "string") businessUpdates.address = nextBusiness.address.trim();
      if (typeof nextBusiness.addressDetails === "string") businessUpdates.address_details = nextBusiness.addressDetails.trim();
      if (typeof nextBusiness.addressLat === "number" || nextBusiness.addressLat === null) businessUpdates.address_lat = nextBusiness.addressLat;
      if (typeof nextBusiness.addressLon === "number" || nextBusiness.addressLon === null) businessUpdates.address_lon = nextBusiness.addressLon;
      if (typeof nextBusiness.allowOnlineBooking === "boolean") businessUpdates.allow_online_booking = nextBusiness.allowOnlineBooking;
      if (Array.isArray(nextBusiness.photos)) {
        businessUpdates.photos = normalizeBusinessPhotos(nextBusiness.photos).map((photo) => {
          const existing = existingPhotos.find((item) => item.id === photo.id);
          return {
            ...photo,
            createdByProfessionalId: photo.createdByProfessionalId || existing?.createdByProfessionalId || professionalId,
            status: photo.status || existing?.status || "active",
            blockedAt: photo.blockedAt || existing?.blockedAt
          };
        });
      }

      if (Object.keys(businessUpdates).length > 0) {
        const { error } = await supabase.from("businesses").update(businessUpdates).eq("id", workspace.business.id);
        if (error) {
          throw new Error(error.message);
        }
      }
    }

    return getWorkspaceSnapshot(professionalId);
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professional = store.professionals.find((item) => item.id === professionalId);
  const membership = store.memberships.find((item) => item.professionalId === professionalId);

  if (!professional || !membership) {
    throw new Error("Workspace not found.");
  }

  if (typeof nextProfessional.firstName === "string") professional.firstName = nextProfessional.firstName.trim();
  if (typeof nextProfessional.lastName === "string") professional.lastName = nextProfessional.lastName.trim();
  if (typeof nextProfessional.email === "string") professional.email = nextProfessional.email.trim();
  if (typeof nextProfessional.phone === "string") professional.phone = nextProfessional.phone.trim();
  if (typeof nextProfessional.country === "string") professional.country = nextProfessional.country.trim();
  if (typeof nextProfessional.timezone === "string") professional.timezone = nextProfessional.timezone.trim();
  if (typeof nextProfessional.language === "string") professional.language = nextProfessional.language.trim();
  professional.currency = nextProfessional.currency?.trim() || professional.currency || inferCurrencyFromCountry(professional.country);
  professional.bookingCreditsTotal =
    (typeof professional.bookingCreditsTotal === "number"
      ? professional.bookingCreditsTotal
      : DEFAULT_BOOKING_CREDITS) + topUpCredits;

  if (password) {
    professional.passwordHash = hashPassword(password);
  }

  if (membership.scope === "owner") {
    const business = store.businesses.find((item) => item.id === membership.businessId);

    if (!business) {
      throw new Error("Business not found.");
    }

    if (typeof nextBusiness.name === "string") business.name = nextBusiness.name.trim();
    if (typeof nextBusiness.website === "string") business.website = nextBusiness.website.trim();
    if (nextCategories) business.categories = nextCategories;
    if (nextBusiness.accountType === "solo" || nextBusiness.accountType === "team") business.accountType = nextBusiness.accountType;
    if (typeof nextBusiness.serviceMode === "string") business.serviceMode = nextBusiness.serviceMode.trim();
    if (typeof nextBusiness.address === "string") business.address = nextBusiness.address.trim();
    if (typeof nextBusiness.addressDetails === "string") business.addressDetails = nextBusiness.addressDetails.trim();
    if (typeof nextBusiness.addressLat === "number" || nextBusiness.addressLat === null) business.addressLat = nextBusiness.addressLat;
    if (typeof nextBusiness.addressLon === "number" || nextBusiness.addressLon === null) business.addressLon = nextBusiness.addressLon;
    if (typeof nextBusiness.allowOnlineBooking === "boolean") business.allowOnlineBooking = nextBusiness.allowOnlineBooking;
    if (Array.isArray(nextBusiness.photos)) {
      business.photos = normalizeBusinessPhotos(nextBusiness.photos).map((photo) => {
        const existing = existingPhotos.find((item) => item.id === photo.id);
        return {
          ...photo,
          createdByProfessionalId: photo.createdByProfessionalId || existing?.createdByProfessionalId || professionalId,
          status: photo.status || existing?.status || "active",
          blockedAt: photo.blockedAt || existing?.blockedAt
        };
      });
    }
  }

  await writeStore(store);
  return getWorkspaceSnapshot(professionalId);
}

export async function ensureServiceForProfessional(input: {
  professionalId: string;
  serviceName: string;
  category?: string;
  durationMinutes?: number;
  price?: number;
  color?: string;
  source?: "catalog" | "custom";
}) {
  const serviceName = input.serviceName.trim();

  if (!serviceName) {
    throw new Error("Service name is required.");
  }

  const workspace = await getWorkspaceSnapshot(input.professionalId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const existing = workspace.services.find(
    (service) => service.name.toLowerCase() === serviceName.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  const createdAt = new Date().toISOString();
  const sortOrder = workspace.services.length;
  const color = input.color || getDefaultServiceColor(serviceName, sortOrder);
  const source = input.source === "catalog" ? "catalog" : "custom";
  const moderationStatus = source === "custom" ? "pending" : "approved";
  const moderatedAt = source === "custom" ? null : createdAt;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const service = {
      id: makeId("svc"),
      business_id: workspace.business.id,
      name: serviceName,
      price:
        typeof input.price === "number" && Number.isFinite(input.price)
          ? Math.max(0, input.price)
          : inferServicePrice(serviceName),
      category: input.category || "Без категории",
      duration_minutes:
        typeof input.durationMinutes === "number" && Number.isFinite(input.durationMinutes)
          ? Math.max(5, input.durationMinutes)
          : inferServiceDuration(serviceName),
      color,
      sort_order: sortOrder,
      created_by_professional_id: input.professionalId,
      source,
      moderation_status: moderationStatus,
      moderated_at: moderatedAt,
      is_blocked: false,
      created_at: createdAt
    };

    let { error } = await supabase.from("business_services").insert(service);

    if (error && /created_by_professional_id|is_blocked|source|moderation_status|moderated_at/i.test(error.message)) {
      ({ error } = await supabase.from("business_services").insert({
        id: service.id,
        business_id: service.business_id,
        name: service.name,
        price: service.price,
        category: service.category,
        duration_minutes: service.duration_minutes,
        color: service.color,
        sort_order: service.sort_order,
        created_at: service.created_at
      }));
    }

    if (error) {
      throw new Error(error.message);
    }

    const createdService: ServiceRecord = {
      id: service.id,
      businessId: service.business_id,
      name: service.name,
      price: typeof service.price === "number" ? service.price : inferServicePrice(service.name),
      category: service.category,
      durationMinutes: service.duration_minutes,
      color: service.color,
      sortOrder: service.sort_order,
      createdByProfessionalId: input.professionalId,
      source,
      moderationStatus,
      moderatedAt: moderatedAt ?? undefined,
      isBlocked: false,
      createdAt: service.created_at
    };
    return normalizeServiceRecord(createdService);
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const service: ServiceRecord = {
    id: makeId("svc"),
    businessId: workspace.business.id,
    name: serviceName,
    price:
      typeof input.price === "number" && Number.isFinite(input.price)
        ? Math.max(0, input.price)
        : inferServicePrice(serviceName),
    category: input.category || "Без категории",
    durationMinutes:
      typeof input.durationMinutes === "number" && Number.isFinite(input.durationMinutes)
        ? Math.max(5, input.durationMinutes)
        : inferServiceDuration(serviceName),
    color,
    sortOrder,
    createdByProfessionalId: input.professionalId,
    source,
    moderationStatus,
    moderatedAt: moderatedAt ?? undefined,
    isBlocked: false,
    createdAt
  };

  store.services.push(service);
  await writeStore(store);

  return normalizeServiceRecord(service);
}

export async function addServicesForProfessional(input: {
  professionalId: string;
  services: Array<{
    name: string;
    category?: string;
    durationMinutes?: number;
    price?: number;
    color?: string;
    source?: "catalog" | "custom";
  }>;
}) {
  const created = [];

  for (const service of input.services) {
    created.push(
      await ensureServiceForProfessional({
        professionalId: input.professionalId,
        serviceName: service.name,
        category: service.category,
        durationMinutes: service.durationMinutes,
        price: service.price,
        color: service.color,
        source: service.source
      })
    );
  }

  return created;
}

export async function updateServiceForProfessional(input: {
  professionalId: string;
  serviceId: string;
  name?: string;
  category?: string;
  durationMinutes?: number;
  price?: number;
  color?: string;
}) {
  const workspace = await getWorkspaceSnapshot(input.professionalId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const existing = workspace.services.find((service) => service.id === input.serviceId);

  if (!existing) {
    throw new Error("Service not found.");
  }

  const nextName = typeof input.name === "string" ? input.name.trim() : existing.name;

  if (!nextName) {
    throw new Error("Service name is required.");
  }

  const updates = {
    name: nextName,
    category: input.category || existing.category || "Без категории",
    price:
      typeof input.price === "number" && Number.isFinite(input.price)
        ? Math.max(0, input.price)
        : existing.price,
    durationMinutes:
      typeof input.durationMinutes === "number" && Number.isFinite(input.durationMinutes)
        ? Math.max(5, input.durationMinutes)
        : existing.durationMinutes || inferServiceDuration(nextName),
    color: input.color || existing.color || getDefaultServiceColor(nextName)
  };
  const shouldResetModeration =
    normalizeServiceSource(existing.source) === "custom" &&
    (existing.name !== updates.name ||
      (existing.category || "Без категории") !== updates.category ||
      (existing.durationMinutes || inferServiceDuration(existing.name)) !== updates.durationMinutes ||
      existing.price !== updates.price);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error } = await supabase
      .from("business_services")
      .update({
        name: updates.name,
        category: updates.category,
        price: updates.price,
        duration_minutes: updates.durationMinutes,
        color: updates.color,
        ...(shouldResetModeration
          ? {
              moderation_status: "pending",
              moderated_at: null
            }
          : {})
      })
      .eq("id", input.serviceId)
      .eq("business_id", workspace.business.id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      ...existing,
      ...updates,
      moderationStatus: shouldResetModeration ? "pending" : existing.moderationStatus,
      moderatedAt: shouldResetModeration ? undefined : existing.moderatedAt
    };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const service = store.services.find(
    (item) => item.id === input.serviceId && item.businessId === workspace.business.id
  );

  if (!service) {
    throw new Error("Service not found.");
  }

  Object.assign(service, updates);
  if (shouldResetModeration) {
    service.moderationStatus = "pending";
    delete service.moderatedAt;
  }
  await writeStore(store);

  return normalizeServiceRecord(service as ServiceRecord);
}

export async function deleteServiceForProfessional(input: {
  professionalId: string;
  serviceId: string;
}) {
  const workspace = await getWorkspaceSnapshot(input.professionalId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error } = await supabase
      .from("business_services")
      .delete()
      .eq("id", input.serviceId)
      .eq("business_id", workspace.business.id);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  store.services = store.services.filter(
    (item) => !(item.id === input.serviceId && item.businessId === workspace.business.id)
  );
  await writeStore(store);

  return { ok: true };
}

export async function reorderServicesForProfessional(input: {
  professionalId: string;
  serviceIds: string[];
}) {
  const workspace = await getWorkspaceSnapshot(input.professionalId);

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const orderMap = new Map(input.serviceIds.map((serviceId, index) => [serviceId, index]));

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    for (const [serviceId, sortOrder] of orderMap.entries()) {
      const { error } = await supabase
        .from("business_services")
        .update({ sort_order: sortOrder })
        .eq("id", serviceId)
        .eq("business_id", workspace.business.id);

      if (error) {
        throw new Error(error.message);
      }
    }

    return { ok: true };
  }

  const store = await ensureDemoBusinessesInLocalStore();

  for (const service of store.services) {
    if (service.businessId !== workspace.business.id) {
      continue;
    }

    const nextOrder = orderMap.get(service.id);
    if (typeof nextOrder === "number") {
      service.sortOrder = nextOrder;
    }
  }

  await writeStore(store);
  return { ok: true };
}
