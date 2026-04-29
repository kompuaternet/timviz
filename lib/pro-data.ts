import { promises as fs } from "fs";
import path from "path";
import { getPublicAppUrl } from "./app-url";
import { isMailerConfigured, sendMail } from "./mailer";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { hashPassword, verifyPassword } from "./pro-auth";
import { getPublicBusinessPathId } from "./public-business-path";
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
  avatarUrl?: string;
};

export type SetupDraft = {
  ownerMode: "owner" | "member";
  joinBusinessId?: string;
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
  publicBookingPath?: string;
  publicBookingUrl?: string;
  ownerProfessionalId: string | null;
  createdAt: string;
};

export type ProfessionalAccountStatus = "active" | "placeholder";

export type ProfessionalRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  phone: string;
  country: string;
  timezone: string;
  language: string;
  currency?: string;
  bookingCreditsTotal?: number;
  walletBalance?: number;
  ownerMode: "owner" | "member";
  accountStatus?: ProfessionalAccountStatus;
  createdAt: string;
};

export type MembershipRecord = {
  id: string;
  businessId: string;
  professionalId: string;
  role: string;
  scope: "owner" | "member" | "pending";
  workScheduleMode?: WorkScheduleMode;
  workSchedule?: WorkSchedule;
  customSchedule?: CustomSchedule;
  createdAt: string;
};

export type JoinRequestRecord = {
  id: string;
  businessId: string;
  professionalId: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
};

export type StaffInvitationStatus = "pending" | "accepted" | "revoked";

export type StaffInvitationRecord = {
  id: string;
  businessId: string;
  email: string;
  role: string;
  invitedByProfessionalId?: string;
  acceptedProfessionalId?: string;
  token: string;
  status: StaffInvitationStatus;
  createdAt: string;
  acceptedAt?: string;
  revokedAt?: string;
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
  joinRequests?: JoinRequestRecord[];
  staffInvitations?: StaffInvitationRecord[];
};

export type WorkspaceSnapshot = {
  professional: ProfessionalRecord;
  business: BusinessRecord;
  membership: MembershipRecord;
  memberSchedule: {
    workScheduleMode: WorkScheduleMode;
    workSchedule: WorkSchedule;
    customSchedule: CustomSchedule;
  };
  services: ServiceRecord[];
};

export function decorateBusinessWithPublicBookingLink(
  business: BusinessRecord,
  businesses: Pick<BusinessRecord, "id" | "name" | "createdAt">[]
): BusinessRecord {
  const pathId = getPublicBusinessPathId(
    {
      id: business.id,
      name: business.name,
      createdAt: business.createdAt
    },
    businesses
  );
  const publicBookingPath = `/salons/${pathId}`;

  return {
    ...business,
    publicBookingPath,
    publicBookingUrl: `${getPublicAppUrl()}${publicBookingPath}`
  };
}

export type BusinessDirectorySnapshot = {
  businesses: BusinessRecord[];
  professionals: ProfessionalRecord[];
  memberships: MembershipRecord[];
  services: ServiceRecord[];
  joinRequests: JoinRequestRecord[];
  staffInvitations: StaffInvitationRecord[];
};

export type JoinBusinessSearchResult = {
  businessId: string;
  businessPath: string;
  businessName: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  categories: string[];
  photoUrl: string;
};

const placeholderEmailDomain = "placeholder.timviz.local";

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

let activeDirectorySnapshotPromise: Promise<BusinessDirectorySnapshot> | null = null;

function isMissingTableError(message: string | undefined, tableName: string) {
  return (
    typeof message === "string" &&
    message.includes(`Could not find the table 'public.${tableName}' in the schema cache`)
  );
}

function isMissingJoinRequestsTableError(message?: string) {
  return isMissingTableError(message, "business_join_requests");
}

function isMissingStaffInvitationsTableError(message?: string) {
  return isMissingTableError(message, "business_staff_invitations");
}

function normalizeServiceSource(value: unknown): "catalog" | "custom" {
  return value === "custom" ? "custom" : "catalog";
}

function normalizeProfessionalAccountStatus(value: unknown): ProfessionalAccountStatus {
  return value === "placeholder" ? "placeholder" : "active";
}

function buildPlaceholderProfessionalEmail(professionalId: string) {
  return `staff+${professionalId}@${placeholderEmailDomain}`;
}

export function isPlaceholderProfessionalEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(`@${placeholderEmailDomain}`);
}

export function getProfessionalContactEmail(
  professional: Pick<ProfessionalRecord, "email" | "accountStatus">
) {
  const normalizedEmail = professional.email.trim();

  if (
    normalizeProfessionalAccountStatus(professional.accountStatus) === "placeholder" &&
    isPlaceholderProfessionalEmail(normalizedEmail)
  ) {
    return "";
  }

  return normalizedEmail;
}

function normalizeMembershipScope(value: unknown): MembershipRecord["scope"] {
  if (value === "owner" || value === "member" || value === "pending") {
    return value;
  }

  return "member";
}

function normalizeAvatarUrl(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const candidate = value.trim();
  if (!candidate) {
    return "";
  }

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
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
    avatarUrl: normalizeAvatarUrl(professional.avatarUrl),
    accountStatus: normalizeProfessionalAccountStatus(professional.accountStatus),
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

function normalizeMembershipRecord(membership: MembershipRecord): MembershipRecord {
  return {
    ...membership,
    role: membership.role?.trim() || "Specialist",
    scope: normalizeMembershipScope(membership.scope),
    workScheduleMode:
      typeof membership.workScheduleMode === "undefined"
        ? undefined
        : normalizeWorkScheduleMode(membership.workScheduleMode),
    workSchedule:
      typeof membership.workSchedule === "undefined"
        ? undefined
        : normalizeWorkSchedule(membership.workSchedule),
    customSchedule:
      typeof membership.customSchedule === "undefined"
        ? undefined
        : normalizeCustomSchedule(membership.customSchedule)
  };
}

export function resolveMembershipSchedule(
  membership: MembershipRecord,
  business: Pick<BusinessRecord, "workScheduleMode" | "workSchedule" | "customSchedule">
) {
  return {
    workScheduleMode: normalizeWorkScheduleMode(membership.workScheduleMode ?? business.workScheduleMode),
    workSchedule: normalizeWorkSchedule(membership.workSchedule ?? business.workSchedule),
    customSchedule: normalizeCustomSchedule(membership.customSchedule ?? business.customSchedule)
  };
}

function buildMembershipScheduleFromBusiness(
  business: Pick<BusinessRecord, "workScheduleMode" | "workSchedule" | "customSchedule">
) {
  const resolved = resolveMembershipSchedule(
    {
      id: "",
      businessId: "",
      professionalId: "",
      role: "",
      scope: "member",
      createdAt: "",
      workScheduleMode: business.workScheduleMode,
      workSchedule: business.workSchedule,
      customSchedule: business.customSchedule
    },
    business
  );

  return {
    workScheduleMode: resolved.workScheduleMode,
    workSchedule: resolved.workSchedule,
    customSchedule: resolved.customSchedule
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
  avatar_url?: string | null;
  phone: string;
  country: string;
  timezone: string;
  language: string;
  currency?: string | null;
  booking_credits_total?: number | null;
  wallet_balance?: number | null;
  owner_mode: string;
  account_status?: string | null;
  created_at: string;
}): ProfessionalRecord {
  return normalizeProfessionalRecord({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    passwordHash: row.password_hash,
    avatarUrl: row.avatar_url ?? undefined,
    phone: row.phone,
    country: row.country,
    timezone: row.timezone,
    language: row.language,
    currency: row.currency ?? undefined,
    bookingCreditsTotal:
      typeof row.booking_credits_total === "number" ? row.booking_credits_total : undefined,
    walletBalance: typeof row.wallet_balance === "number" ? row.wallet_balance : undefined,
    ownerMode: row.owner_mode === "member" ? "member" : "owner",
    accountStatus: normalizeProfessionalAccountStatus(row.account_status),
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
  scope: "owner" | "member" | "pending";
  work_schedule_mode?: WorkScheduleMode | null;
  work_schedule?: unknown;
  custom_schedule?: unknown;
  created_at: string;
}): MembershipRecord {
  return normalizeMembershipRecord({
    id: row.id,
    businessId: row.business_id,
    professionalId: row.professional_id,
    role: row.role,
    scope: normalizeMembershipScope(row.scope),
    workScheduleMode: row.work_schedule_mode ?? undefined,
    workSchedule: typeof row.work_schedule === "undefined" ? undefined : normalizeWorkSchedule(row.work_schedule),
    customSchedule:
      typeof row.custom_schedule === "undefined"
        ? undefined
        : normalizeCustomSchedule(row.custom_schedule),
    createdAt: row.created_at
  });
}

function normalizeJoinRequestStatus(value: unknown): "pending" | "approved" | "rejected" {
  if (value === "approved" || value === "rejected") {
    return value;
  }

  return "pending";
}

function mapSupabaseJoinRequestRow(row: {
  id: string;
  business_id: string;
  professional_id: string;
  role: string;
  status?: string | null;
  created_at: string;
  resolved_at?: string | null;
}): JoinRequestRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    professionalId: row.professional_id,
    role: row.role,
    status: normalizeJoinRequestStatus(row.status),
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? undefined
  };
}

function normalizeStaffInvitationStatus(value: unknown): StaffInvitationStatus {
  if (value === "accepted" || value === "revoked") {
    return value;
  }

  return "pending";
}

function mapSupabaseStaffInvitationRow(row: {
  id: string;
  business_id: string;
  email: string;
  role?: string | null;
  invited_by_professional_id?: string | null;
  accepted_professional_id?: string | null;
  token: string;
  status?: string | null;
  created_at: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
}): StaffInvitationRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    email: row.email.trim().toLowerCase(),
    role: row.role?.trim() || "Specialist",
    invitedByProfessionalId: row.invited_by_professional_id ?? undefined,
    acceptedProfessionalId: row.accepted_professional_id ?? undefined,
    token: row.token,
    status: normalizeStaffInvitationStatus(row.status),
    createdAt: row.created_at,
    acceptedAt: row.accepted_at ?? undefined,
    revokedAt: row.revoked_at ?? undefined
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
  const parsed = JSON.parse(file) as ProDataStore;
  return {
    ...parsed,
    joinRequests: Array.isArray(parsed.joinRequests) ? parsed.joinRequests : [],
    staffInvitations: Array.isArray(parsed.staffInvitations) ? parsed.staffInvitations : []
  };
}

async function writeStore(data: ProDataStore) {
  activeDirectorySnapshotPromise = null;
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

  store.memberships = store.memberships.map((membership) => normalizeMembershipRecord(membership));
  store.services = store.services.map((service) => normalizeServiceRecord(service));

  if (changed) {
    await writeStore(store);
  }

  return store;
}

async function loadBusinessDirectorySnapshot(): Promise<BusinessDirectorySnapshot> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return {
        businesses: [],
        professionals: [],
        memberships: [],
        services: [],
        joinRequests: [],
        staffInvitations: []
      };
    }

    const [
      { data: businesses, error: businessesError },
      { data: professionals, error: professionalsError },
      { data: memberships, error: membershipsError },
      { data: services, error: servicesError },
      { data: joinRequests, error: joinRequestsError },
      { data: staffInvitations, error: staffInvitationsError }
    ] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: true }),
      supabase.from("professionals").select("*").order("created_at", { ascending: true }),
      supabase.from("business_memberships").select("*").order("created_at", { ascending: true }),
      supabase.from("business_services").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      supabase.from("business_join_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("business_staff_invitations").select("*").order("created_at", { ascending: false })
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
    if (joinRequestsError && !isMissingJoinRequestsTableError(joinRequestsError.message)) {
      throw new Error(joinRequestsError.message);
    }
    if (staffInvitationsError && !isMissingStaffInvitationsTableError(staffInvitationsError.message)) {
      throw new Error(staffInvitationsError.message);
    }

    return {
      businesses: (businesses ?? []).map(mapSupabaseBusinessRow).filter((business) => !isDemoBusinessRecord(business)),
      professionals: (professionals ?? []).map(mapSupabaseProfessionalRow),
      memberships: (memberships ?? []).map(mapSupabaseMembershipRow),
      services: (services ?? []).map(mapSupabaseServiceRow),
      joinRequests: (joinRequests ?? []).map(mapSupabaseJoinRequestRow),
      staffInvitations: (staffInvitations ?? []).map(mapSupabaseStaffInvitationRow)
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
    memberships: store.memberships.map(normalizeMembershipRecord),
    services: store.services.map((service) => normalizeServiceRecord(service)),
    joinRequests: (store.joinRequests ?? []).map((request) => ({
      ...request,
      status: normalizeJoinRequestStatus(request.status)
    })),
    staffInvitations: (store.staffInvitations ?? []).map((invitation) => ({
      ...invitation,
      email: invitation.email.trim().toLowerCase(),
      role: invitation.role?.trim() || "Specialist",
      status: normalizeStaffInvitationStatus(invitation.status)
    }))
  };
}

export async function getBusinessDirectorySnapshot(): Promise<BusinessDirectorySnapshot> {
  if (activeDirectorySnapshotPromise) {
    return activeDirectorySnapshotPromise;
  }

  activeDirectorySnapshotPromise = loadBusinessDirectorySnapshot().finally(() => {
    activeDirectorySnapshotPromise = null;
  });

  return activeDirectorySnapshotPromise;
}

export async function createProfessionalSetup(input: {
  account: AccountDraft;
  setup: SetupDraft;
  invitationToken?: string;
}) {
  const normalizedEmail = input.account.email.trim().toLowerCase();
  const invitationPreview = input.invitationToken
    ? await getStaffInvitationPreviewByToken(input.invitationToken)
    : null;

  if (input.invitationToken && (!invitationPreview || invitationPreview.status !== "pending")) {
    throw new Error("Приглашение недействительно или уже использовано.");
  }

  if (invitationPreview && invitationPreview.email !== normalizedEmail) {
    throw new Error("Этот email не совпадает с адресом из приглашения.");
  }

  if (invitationPreview && input.setup.ownerMode !== "member") {
    throw new Error("Приглашение можно принять только как сотрудник команды.");
  }

  const existingProfessional = await getProfessionalProfileByEmail(normalizedEmail);
  const placeholderActivation =
    Boolean(invitationPreview) &&
    Boolean(existingProfessional) &&
    normalizeProfessionalAccountStatus(existingProfessional?.accountStatus) === "placeholder";

  if (existingProfessional && !placeholderActivation) {
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

    const professionalId = placeholderActivation && existingProfessional ? existingProfessional.id : makeId("pro");
    const professionalPayload = {
      first_name: input.account.firstName,
      last_name: input.account.lastName,
      email: normalizedEmail,
      password_hash: hashPassword(input.account.password),
      avatar_url: normalizeAvatarUrl(input.account.avatarUrl),
      phone: input.account.phone,
      country: input.account.country,
      timezone: input.account.timezone,
      language: input.account.language,
      currency: input.account.currency || inferCurrencyFromCountry(input.account.country),
      booking_credits_total:
        existingProfessional?.bookingCreditsTotal ?? DEFAULT_BOOKING_CREDITS,
      owner_mode: input.setup.ownerMode,
      account_status: "active",
      created_at: existingProfessional?.createdAt ?? createdAt
    };

    if (placeholderActivation && existingProfessional) {
      const { error: professionalError } = await supabase
        .from("professionals")
        .update(professionalPayload)
        .eq("id", professionalId);

      if (professionalError) {
        throw new Error(professionalError.message);
      }
    } else {
      const { error: professionalError } = await supabase.from("professionals").insert({
        id: professionalId,
        ...professionalPayload
      });

      if (professionalError) {
        throw new Error(professionalError.message);
      }
    }

    let businessId: string;

    let targetBusiness:
      | Pick<BusinessRecord, "id" | "workScheduleMode" | "workSchedule" | "customSchedule">
      | null = null;

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

      targetBusiness = {
        id: businessId,
        workScheduleMode: initialWorkScheduleMode,
        workSchedule: initialWorkSchedule,
        customSchedule: initialCustomSchedule
      };

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
      const targetBusinessId = invitationPreview?.businessId || input.setup.joinBusinessId?.trim() || "";
      if (!targetBusinessId) {
        throw new Error("Business not selected for membership request.");
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, work_schedule_mode, work_schedule, custom_schedule")
        .eq("id", targetBusinessId)
        .maybeSingle();

      if (businessError) {
        throw new Error(businessError.message);
      }

      if (!business?.id) {
        throw new Error("Business not found for membership.");
      }

      businessId = business.id;
      targetBusiness = {
        id: business.id,
        workScheduleMode: normalizeWorkScheduleMode((business as { work_schedule_mode?: WorkScheduleMode | null }).work_schedule_mode),
        workSchedule: normalizeWorkSchedule((business as { work_schedule?: unknown }).work_schedule),
        customSchedule: normalizeCustomSchedule((business as { custom_schedule?: unknown }).custom_schedule)
      };
    }

    const memberSchedule = targetBusiness
      ? buildMembershipScheduleFromBusiness(targetBusiness)
      : {
          workScheduleMode: initialWorkScheduleMode,
          workSchedule: initialWorkSchedule,
          customSchedule: initialCustomSchedule
        };

    if (input.setup.ownerMode === "owner") {
      const membershipId = makeId("membership");
      const { error: membershipError } = await supabase.from("business_memberships").insert({
        id: membershipId,
        business_id: businessId,
        professional_id: professionalId,
        role: "owner",
        scope: input.setup.ownerMode,
        work_schedule_mode: memberSchedule.workScheduleMode,
        work_schedule: memberSchedule.workSchedule,
        custom_schedule: memberSchedule.customSchedule,
        created_at: createdAt
      });

      if (membershipError) {
        throw new Error(membershipError.message);
      }
    } else if (invitationPreview) {
      const { data: existingMemberships, error: membershipLookupError } = await supabase
        .from("business_memberships")
        .select("id, scope")
        .eq("business_id", businessId)
        .eq("professional_id", professionalId);

      if (membershipLookupError) {
        throw new Error(membershipLookupError.message);
      }

      const pendingMembership = (existingMemberships ?? []).find((item) => item.scope === "pending");
      const activeMembership = (existingMemberships ?? []).find((item) => item.scope !== "pending");

      if (pendingMembership) {
        const { error: membershipError } = await supabase
          .from("business_memberships")
          .update({
            role: invitationPreview.role,
            scope: "member"
          })
          .eq("id", pendingMembership.id);

        if (membershipError) {
          throw new Error(membershipError.message);
        }
      } else if (activeMembership) {
        const { error: membershipError } = await supabase
          .from("business_memberships")
          .update({
            role: invitationPreview.role
          })
          .eq("id", activeMembership.id);

        if (membershipError) {
          throw new Error(membershipError.message);
        }
      } else {
        const membershipId = makeId("membership");
        const { error: membershipError } = await supabase.from("business_memberships").insert({
          id: membershipId,
          business_id: businessId,
          professional_id: professionalId,
          role: invitationPreview.role,
          scope: "member",
          work_schedule_mode: memberSchedule.workScheduleMode,
          work_schedule: memberSchedule.workSchedule,
          custom_schedule: memberSchedule.customSchedule,
          created_at: createdAt
        });

        if (membershipError) {
          throw new Error(membershipError.message);
        }
      }

      const { error: invitationError } = await supabase
        .from("business_staff_invitations")
        .update({
          status: "accepted",
          accepted_professional_id: professionalId,
          accepted_at: createdAt,
          revoked_at: null
        })
        .eq("id", invitationPreview.id);

      if (invitationError && !isMissingStaffInvitationsTableError(invitationError.message)) {
        throw new Error(invitationError.message);
      }
    } else {
      const joinRequestId = makeId("join");
      const { error: joinRequestError } = await supabase.from("business_join_requests").insert({
        id: joinRequestId,
        business_id: businessId,
        professional_id: professionalId,
        role: input.setup.joinBusinessRole || "Specialist",
        status: "pending",
        created_at: createdAt
      });

      if (joinRequestError) {
        if (!isMissingJoinRequestsTableError(joinRequestError.message)) {
          throw new Error(joinRequestError.message);
        }

        const { error: membershipError } = await supabase.from("business_memberships").insert({
          id: joinRequestId,
          business_id: businessId,
          professional_id: professionalId,
          role: input.setup.joinBusinessRole || "Specialist",
          scope: "pending",
          work_schedule_mode: memberSchedule.workScheduleMode,
          work_schedule: memberSchedule.workSchedule,
          custom_schedule: memberSchedule.customSchedule,
          created_at: createdAt
        });

        if (membershipError) {
          throw new Error(membershipError.message);
        }
      }
    }

    return {
      professionalId,
      workspaceReady: input.setup.ownerMode === "owner" || Boolean(invitationPreview)
    };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professionalId = placeholderActivation && existingProfessional ? existingProfessional.id : makeId("pro");

  const professional: ProfessionalRecord = normalizeProfessionalRecord({
    id: professionalId,
    firstName: input.account.firstName,
    lastName: input.account.lastName,
    email: normalizedEmail,
    passwordHash: hashPassword(input.account.password),
    avatarUrl: normalizeAvatarUrl(input.account.avatarUrl),
    phone: input.account.phone,
    country: input.account.country,
    timezone: input.account.timezone,
    language: input.account.language,
    currency: input.account.currency || inferCurrencyFromCountry(input.account.country),
    bookingCreditsTotal: existingProfessional?.bookingCreditsTotal ?? DEFAULT_BOOKING_CREDITS,
    ownerMode: input.setup.ownerMode,
    accountStatus: "active",
    createdAt: existingProfessional?.createdAt ?? createdAt
  });

  if (placeholderActivation && existingProfessional) {
    const existingIndex = store.professionals.findIndex((item) => item.id === professionalId);
    if (existingIndex >= 0) {
      store.professionals[existingIndex] = professional;
    } else {
      store.professionals.push(professional);
    }
  } else {
    store.professionals.push(professional);
  }

  let businessId: string;

  let targetBusiness:
    | Pick<BusinessRecord, "id" | "workScheduleMode" | "workSchedule" | "customSchedule">
    | null = null;

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
    targetBusiness = {
      id: business.id,
      workScheduleMode: business.workScheduleMode,
      workSchedule: business.workSchedule,
      customSchedule: business.customSchedule
    };

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
      (item) => item.id === (invitationPreview?.businessId || input.setup.joinBusinessId)
    );

    if (!business) {
      throw new Error("Business not found for membership.");
    }

    businessId = business.id;
    targetBusiness = {
      id: business.id,
      workScheduleMode: business.workScheduleMode,
      workSchedule: business.workSchedule,
      customSchedule: business.customSchedule
    };
  }

  const memberSchedule = targetBusiness
    ? buildMembershipScheduleFromBusiness(targetBusiness)
    : {
        workScheduleMode: initialWorkScheduleMode,
        workSchedule: initialWorkSchedule,
        customSchedule: initialCustomSchedule
      };

  if (input.setup.ownerMode === "owner") {
    store.memberships.push(
      normalizeMembershipRecord({
      id: makeId("membership"),
      businessId,
      professionalId,
      role: "owner",
      scope: input.setup.ownerMode,
      workScheduleMode: memberSchedule.workScheduleMode,
      workSchedule: memberSchedule.workSchedule,
      customSchedule: memberSchedule.customSchedule,
      createdAt
      })
    );
  } else if (invitationPreview) {
    const existingMembership = store.memberships.find(
      (item) => item.businessId === businessId && item.professionalId === professionalId
    );

    if (existingMembership) {
      existingMembership.role = invitationPreview.role;
      existingMembership.scope = "member";
    } else {
      store.memberships.push(
        normalizeMembershipRecord({
          id: makeId("membership"),
          businessId,
          professionalId,
          role: invitationPreview.role,
          scope: "member",
          workScheduleMode: memberSchedule.workScheduleMode,
          workSchedule: memberSchedule.workSchedule,
          customSchedule: memberSchedule.customSchedule,
          createdAt
        })
      );
    }

    const invitation = (store.staffInvitations ?? []).find((item) => item.id === invitationPreview.id);
    if (invitation) {
      invitation.status = "accepted";
      invitation.acceptedProfessionalId = professionalId;
      invitation.acceptedAt = createdAt;
      delete invitation.revokedAt;
    }
  } else {
    store.joinRequests?.push({
      id: makeId("join"),
      businessId,
      professionalId,
      role: input.setup.joinBusinessRole || "Specialist",
      status: "pending",
      createdAt
    });
  }

  await writeStore(store);
  return {
    professionalId,
    workspaceReady: input.setup.ownerMode === "owner" || Boolean(invitationPreview)
  };
}

export async function getWorkspaceSnapshot(
  professionalId: string
): Promise<WorkspaceSnapshot | null> {
  const directory = await getBusinessDirectorySnapshot();
  const professional = directory.professionals.find((item) => item.id === professionalId);

  if (!professional) {
    return null;
  }

  if (normalizeProfessionalAccountStatus(professional.accountStatus) !== "active") {
    return null;
  }

  const membership = directory.memberships.find(
    (item) => item.professionalId === professionalId && item.scope !== "pending"
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

  const decoratedBusiness = decorateBusinessWithPublicBookingLink(
    business,
    directory.businesses.map((item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt
    }))
  );

  return {
    professional,
    business: decoratedBusiness,
    membership,
    memberSchedule: resolveMembershipSchedule(membership, decoratedBusiness),
    services
  };
}

export async function getPendingJoinRequestForProfessional(professionalId: string) {
  const directory = await getBusinessDirectorySnapshot();
  const request = directory.joinRequests.find(
    (item) => item.professionalId === professionalId && item.status === "pending"
  );
  if (request) {
    const business = directory.businesses.find((item) => item.id === request.businessId) || null;
    return business ? { request, business } : null;
  }

  const pendingMembership = directory.memberships.find(
    (item) => item.professionalId === professionalId && item.scope === "pending"
  );

  if (!pendingMembership) {
    return null;
  }

  const business = directory.businesses.find((item) => item.id === pendingMembership.businessId) || null;
  if (!business) {
    return null;
  }

  return {
    request: {
      id: pendingMembership.id,
      businessId: pendingMembership.businessId,
      professionalId: pendingMembership.professionalId,
      role: pendingMembership.role,
      status: "pending" as const,
      createdAt: pendingMembership.createdAt
    },
    business
  };
}

function makeInvitationToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function normalizeInvitationLanguage(value = "") {
  const normalized = value.trim().toLowerCase();

  if (normalized.includes("ук") || normalized.includes("ua")) {
    return "uk" as const;
  }

  if (normalized.includes("en")) {
    return "en" as const;
  }

  return "ru" as const;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function getProfessionalProfileById(professionalId: string) {
  const directory = await getBusinessDirectorySnapshot();
  return directory.professionals.find((item) => item.id === professionalId) || null;
}

export async function getProfessionalProfileByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const directory = await getBusinessDirectorySnapshot();
  return directory.professionals.find((item) => item.email.trim().toLowerCase() === normalizedEmail) || null;
}

export async function createManualStaffMember(input: {
  ownerProfessionalId: string;
  firstName: string;
  lastName?: string;
  role?: string;
  email?: string;
  phone?: string;
  sendInvitation?: boolean;
  request?: Request;
}) {
  const workspace = await getWorkspaceSnapshot(input.ownerProfessionalId);

  if (!workspace || workspace.membership.scope !== "owner") {
    throw new Error("Only business owners can add employees.");
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName?.trim() || "";
  const role = input.role?.trim() || "Specialist";
  const normalizedEmail = input.email?.trim().toLowerCase() || "";
  const phone = input.phone?.trim() || "";

  if (!firstName) {
    throw new Error("Имя сотрудника обязательно.");
  }

  const directory = await getBusinessDirectorySnapshot();
  const memberSchedule = buildMembershipScheduleFromBusiness(workspace.business);
  const existingProfessional = normalizedEmail
    ? directory.professionals.find((item) => item.email.trim().toLowerCase() === normalizedEmail) || null
    : null;
  const existingMembership = existingProfessional
    ? directory.memberships.find(
        (item) =>
          item.professionalId === existingProfessional.id &&
          item.businessId === workspace.business.id &&
          item.scope !== "pending"
      ) || null
    : null;
  const existingMembershipOutsideBusiness = existingProfessional
    ? directory.memberships.find(
        (item) =>
          item.professionalId === existingProfessional.id &&
          item.businessId !== workspace.business.id &&
          item.scope !== "pending"
      ) || null
    : null;

  if (
    existingProfessional &&
    normalizeProfessionalAccountStatus(existingProfessional.accountStatus) === "active" &&
    existingMembership
  ) {
    throw new Error("Этот сотрудник уже есть в вашей команде.");
  }

  if (existingMembershipOutsideBusiness) {
    throw new Error("Этот email уже привязан к другому бизнес-аккаунту.");
  }

  const createdAt = new Date().toISOString();
  const professionalId = existingProfessional?.id || makeId("pro");
  const professionalEmail = normalizedEmail || buildPlaceholderProfessionalEmail(professionalId);
  const accountStatus: ProfessionalAccountStatus = normalizedEmail ? "placeholder" : "placeholder";

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    if (existingProfessional) {
      const { error } = await supabase
        .from("professionals")
        .update({
          first_name: firstName,
          last_name: lastName,
          email: professionalEmail,
          phone,
          owner_mode: "member",
          account_status: accountStatus
        })
        .eq("id", professionalId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from("professionals").insert({
        id: professionalId,
        first_name: firstName,
        last_name: lastName,
        email: professionalEmail,
        password_hash: hashPassword(`placeholder-${crypto.randomUUID()}`),
        avatar_url: "",
        phone,
        country: workspace.professional.country,
        timezone: workspace.professional.timezone,
        language: workspace.professional.language,
        currency: workspace.professional.currency || inferCurrencyFromCountry(workspace.professional.country),
        booking_credits_total: DEFAULT_BOOKING_CREDITS,
        wallet_balance: 0,
        owner_mode: "member",
        account_status: accountStatus,
        created_at: createdAt
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    if (existingMembership) {
      const { error } = await supabase
        .from("business_memberships")
        .update({
          role,
          work_schedule_mode: memberSchedule.workScheduleMode,
          work_schedule: memberSchedule.workSchedule,
          custom_schedule: memberSchedule.customSchedule
        })
        .eq("id", existingMembership.id);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from("business_memberships").insert({
        id: makeId("membership"),
        business_id: workspace.business.id,
        professional_id: professionalId,
        role,
        scope: "member",
        work_schedule_mode: memberSchedule.workScheduleMode,
        work_schedule: memberSchedule.workSchedule,
        custom_schedule: memberSchedule.customSchedule,
        created_at: createdAt
      });

      if (error && !/duplicate/i.test(error.message)) {
        throw new Error(error.message);
      }
    }
  } else {
    const store = await ensureDemoBusinessesInLocalStore();
    const storeProfessional = store.professionals.find((item) => item.id === professionalId);

    if (storeProfessional) {
      storeProfessional.firstName = firstName;
      storeProfessional.lastName = lastName;
      storeProfessional.email = professionalEmail;
      storeProfessional.phone = phone;
      storeProfessional.ownerMode = "member";
      storeProfessional.accountStatus = accountStatus;
    } else {
      store.professionals.push(
        normalizeProfessionalRecord({
          id: professionalId,
          firstName,
          lastName,
          email: professionalEmail,
          passwordHash: hashPassword(`placeholder-${crypto.randomUUID()}`),
          avatarUrl: "",
          phone,
          country: workspace.professional.country,
          timezone: workspace.professional.timezone,
          language: workspace.professional.language,
          currency: workspace.professional.currency || inferCurrencyFromCountry(workspace.professional.country),
          bookingCreditsTotal: DEFAULT_BOOKING_CREDITS,
          walletBalance: 0,
          ownerMode: "member",
          accountStatus,
          createdAt
        })
      );
    }

    const storeMembership = store.memberships.find(
      (item) =>
        item.professionalId === professionalId &&
        item.businessId === workspace.business.id &&
        item.scope !== "pending"
    );

    if (storeMembership) {
      storeMembership.role = role;
      storeMembership.workScheduleMode = memberSchedule.workScheduleMode;
      storeMembership.workSchedule = memberSchedule.workSchedule;
      storeMembership.customSchedule = memberSchedule.customSchedule;
    } else {
      store.memberships.push(
        normalizeMembershipRecord({
          id: makeId("membership"),
          businessId: workspace.business.id,
          professionalId,
          role,
          scope: "member",
          workScheduleMode: memberSchedule.workScheduleMode,
          workSchedule: memberSchedule.workSchedule,
          customSchedule: memberSchedule.customSchedule,
          createdAt
        })
      );
    }

    await writeStore(store);
  }

  let invitation: Awaited<ReturnType<typeof createStaffInvitation>> | null = null;

  if (input.sendInvitation) {
    if (!normalizedEmail) {
      throw new Error("Чтобы отправить приглашение, укажите email сотрудника.");
    }

    invitation = await createStaffInvitation({
      ownerProfessionalId: input.ownerProfessionalId,
      memberProfessionalId: professionalId,
      email: normalizedEmail,
      role,
      request: input.request
    });
  }

  return {
    professionalId,
    invitation
  };
}

export async function updateStaffMemberByOwner(input: {
  ownerProfessionalId: string;
  memberProfessionalId: string;
  firstName: string;
  lastName?: string;
  role?: string;
  email?: string;
  phone?: string;
}) {
  const workspace = await getWorkspaceSnapshot(input.ownerProfessionalId);

  if (!workspace || workspace.membership.scope !== "owner") {
    throw new Error("Only business owners can update employees.");
  }

  const directory = await getBusinessDirectorySnapshot();
  const membership = directory.memberships.find(
    (item) =>
      item.professionalId === input.memberProfessionalId &&
      item.businessId === workspace.business.id &&
      item.scope !== "pending"
  );

  if (!membership) {
    throw new Error("Employee not found.");
  }

  const professional = directory.professionals.find((item) => item.id === input.memberProfessionalId);
  if (!professional) {
    throw new Error("Professional not found.");
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName?.trim() || "";
  const role = input.role?.trim() || membership.role;
  const phone = input.phone?.trim() || "";
  const normalizedEmail = input.email?.trim().toLowerCase() || "";

  if (!firstName) {
    throw new Error("Имя сотрудника обязательно.");
  }

  const conflictingProfessional =
    normalizedEmail
      ? directory.professionals.find(
          (item) =>
            item.id !== professional.id && item.email.trim().toLowerCase() === normalizedEmail
        ) || null
      : null;

  if (conflictingProfessional) {
    const conflictMembership =
      directory.memberships.find(
        (item) => item.professionalId === conflictingProfessional.id && item.scope !== "pending"
      ) || null;

    if (!conflictMembership || conflictMembership.businessId !== workspace.business.id) {
      throw new Error("Этот email уже используется другим аккаунтом.");
    }
  }

  const nextEmail =
    normalizedEmail ||
    (normalizeProfessionalAccountStatus(professional.accountStatus) === "placeholder"
      ? buildPlaceholderProfessionalEmail(professional.id)
      : professional.email);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error: professionalError } = await supabase
      .from("professionals")
      .update({
        first_name: firstName,
        last_name: lastName,
        email: nextEmail,
        phone,
        account_status:
          normalizeProfessionalAccountStatus(professional.accountStatus) === "active" ? "active" : "placeholder"
      })
      .eq("id", professional.id);

    if (professionalError) {
      throw new Error(professionalError.message);
    }

    const { error: membershipError } = await supabase
      .from("business_memberships")
      .update({ role })
      .eq("id", membership.id);

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (normalizedEmail) {
      const { error: invitationError } = await supabase
        .from("business_staff_invitations")
        .update({ email: normalizedEmail, role })
        .eq("business_id", workspace.business.id)
        .eq("status", "pending")
        .eq("email", professional.email);

      if (invitationError && !isMissingStaffInvitationsTableError(invitationError.message)) {
        throw new Error(invitationError.message);
      }
    }
  } else {
    const store = await ensureDemoBusinessesInLocalStore();
    const storeProfessional = store.professionals.find((item) => item.id === professional.id);
    const storeMembership = store.memberships.find((item) => item.id === membership.id);

    if (!storeProfessional || !storeMembership) {
      throw new Error("Employee not found.");
    }

    storeProfessional.firstName = firstName;
    storeProfessional.lastName = lastName;
    storeProfessional.email = nextEmail;
    storeProfessional.phone = phone;
    storeMembership.role = role;
    for (const invitation of store.staffInvitations ?? []) {
      if (
        invitation.businessId === workspace.business.id &&
        invitation.status === "pending" &&
        invitation.email === professional.email.trim().toLowerCase()
      ) {
        invitation.email = normalizedEmail || invitation.email;
        invitation.role = role;
      }
    }

    await writeStore(store);
  }

  return { ok: true };
}

export async function getStaffInvitationPreviewByToken(token: string) {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    return null;
  }

  const directory = await getBusinessDirectorySnapshot();
  const invitation = directory.staffInvitations.find((item) => item.token === normalizedToken) || null;

  if (!invitation) {
    return null;
  }

  const business = directory.businesses.find((item) => item.id === invitation.businessId) || null;
  if (!business) {
    return null;
  }

  const acceptedProfessional = invitation.acceptedProfessionalId
    ? directory.professionals.find((item) => item.id === invitation.acceptedProfessionalId) || null
    : null;
  const hasExistingAccount = directory.professionals.some(
    (item) =>
      item.email.trim().toLowerCase() === invitation.email &&
      normalizeProfessionalAccountStatus(item.accountStatus) === "active"
  );

  return {
    ...invitation,
    business: {
      id: business.id,
      name: business.name,
      categories: business.categories,
      address: business.address
    },
    acceptedProfessional,
    hasExistingAccount
  };
}

export async function createStaffInvitation(input: {
  ownerProfessionalId: string;
  email: string;
  role?: string;
  memberProfessionalId?: string;
  request?: Request;
}) {
  const workspace = await getWorkspaceSnapshot(input.ownerProfessionalId);

  if (!workspace || workspace.membership.scope !== "owner") {
    throw new Error("Only business owners can invite employees.");
  }

  if (!isMailerConfigured()) {
    throw new Error("Почта для приглашений пока не настроена.");
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email сотрудника обязателен.");
  }

  const role = input.role?.trim() || "Specialist";
  const directory = await getBusinessDirectorySnapshot();
  const business = directory.businesses.find((item) => item.id === workspace.business.id) || workspace.business;
  const explicitMembership = input.memberProfessionalId
    ? directory.memberships.find(
        (item) =>
          item.professionalId === input.memberProfessionalId &&
          item.businessId === workspace.business.id &&
          item.scope !== "pending"
      ) || null
    : null;
  const explicitProfessional = explicitMembership
    ? directory.professionals.find((item) => item.id === explicitMembership.professionalId) || null
    : null;
  const emailProfessional =
    directory.professionals.find((item) => item.email.trim().toLowerCase() === normalizedEmail) || null;
  const invitedProfessional = explicitProfessional || emailProfessional;
  const invitedMembership = invitedProfessional
    ? directory.memberships.find(
        (item) => item.professionalId === invitedProfessional.id && item.scope !== "pending"
      ) || null
    : null;
  const invitedStatus = invitedProfessional
    ? normalizeProfessionalAccountStatus(invitedProfessional.accountStatus)
    : null;

  if (
    invitedProfessional &&
    invitedMembership?.businessId === workspace.business.id &&
    invitedStatus === "active"
  ) {
    throw new Error("Этот сотрудник уже подключен к вашему бизнесу.");
  }

  if (invitedMembership && invitedMembership.businessId !== workspace.business.id) {
    throw new Error("Этот email уже привязан к другому бизнес-аккаунту.");
  }

  if (
    explicitProfessional &&
    invitedStatus === "placeholder" &&
    explicitProfessional.email.trim().toLowerCase() !== normalizedEmail
  ) {
    if (
      emailProfessional &&
      emailProfessional.id !== explicitProfessional.id
    ) {
      throw new Error("Этот email уже используется другим сотрудником.");
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        throw new Error("Supabase is not available.");
      }

      const { error } = await supabase
        .from("professionals")
        .update({ email: normalizedEmail })
        .eq("id", explicitProfessional.id);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const store = await ensureDemoBusinessesInLocalStore();
      const professional = store.professionals.find((item) => item.id === explicitProfessional.id);
      if (!professional) {
        throw new Error("Professional not found.");
      }

      professional.email = normalizedEmail;
      await writeStore(store);
    }
  }

  const timestamp = new Date().toISOString();
  const token = makeInvitationToken();
  const existingPending = directory.staffInvitations.find(
    (item) =>
      item.businessId === workspace.business.id &&
      item.email === normalizedEmail &&
      item.status === "pending"
  );

  const invitationId = existingPending?.id || makeId("invite");

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    if (existingPending) {
      const { error } = await supabase
        .from("business_staff_invitations")
        .update({
          email: normalizedEmail,
          role,
          token,
          status: "pending",
          invited_by_professional_id: input.ownerProfessionalId,
          accepted_professional_id: null,
          created_at: timestamp,
          accepted_at: null,
          revoked_at: null
        })
        .eq("id", existingPending.id);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabase.from("business_staff_invitations").insert({
        id: invitationId,
        business_id: workspace.business.id,
        email: normalizedEmail,
        role,
        invited_by_professional_id: input.ownerProfessionalId,
        token,
        status: "pending",
        created_at: timestamp
      });

      if (error) {
        throw new Error(error.message);
      }
    }
  } else {
    const store = await ensureDemoBusinessesInLocalStore();
    const invitations = store.staffInvitations ?? [];
    const existingIndex = invitations.findIndex((item) => item.id === invitationId);
    const nextInvitation: StaffInvitationRecord = {
      id: invitationId,
      businessId: workspace.business.id,
      email: normalizedEmail,
      role,
      invitedByProfessionalId: input.ownerProfessionalId,
      token,
      status: "pending",
      createdAt: timestamp
    };

    if (existingIndex >= 0) {
      invitations[existingIndex] = nextInvitation;
    } else {
      invitations.push(nextInvitation);
    }

    store.staffInvitations = invitations;
    await writeStore(store);
  }

  const inviteUrl = `${getPublicAppUrl(input.request)}/pro/invite?token=${encodeURIComponent(token)}`;
  const language = normalizeInvitationLanguage(workspace.professional.language);
  const ownerName =
    `${workspace.professional.firstName} ${workspace.professional.lastName}`.trim() || workspace.professional.email;
  const copy =
    language === "uk"
      ? {
          subject: `${business.name} запрошує вас до Timviz`,
          headline: `Вас запросили до команди ${business.name}`,
          body: `${ownerName} надіслав запрошення приєднатися до бізнес-кабінету Timviz у ролі "${role}".`,
          cta: "Прийняти запрошення",
          footnote:
            "Перейдіть за посиланням, увійдіть або створіть акаунт на цей email, після чого запрошення буде підтверджене."
        }
      : language === "en"
        ? {
            subject: `${business.name} invited you to Timviz`,
            headline: `You were invited to join ${business.name}`,
            body: `${ownerName} sent you an invitation to join the Timviz business workspace as "${role}".`,
            cta: "Accept invitation",
            footnote:
              "Open the link, sign in or create an account with this email, and the invitation will be confirmed."
          }
        : {
            subject: `${business.name} приглашает вас в Timviz`,
            headline: `Вас пригласили в команду ${business.name}`,
            body: `${ownerName} отправил приглашение присоединиться к бизнес-кабинету Timviz в роли "${role}".`,
            cta: "Принять приглашение",
            footnote:
              "Откройте ссылку, войдите или создайте аккаунт на этот email, после чего приглашение подтвердится."
          };
  const safeHeadline = escapeHtml(copy.headline);
  const safeBody = escapeHtml(copy.body);
  const safeCta = escapeHtml(copy.cta);
  const safeFootnote = escapeHtml(copy.footnote);

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f5f7ff;padding:32px 16px;color:#171411">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(23,20,17,.08);border-radius:24px;padding:32px">
        <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;margin-bottom:12px">Timviz</div>
        <div style="font-size:24px;font-weight:800;letter-spacing:-0.03em;margin-bottom:12px">${safeHeadline}</div>
        <p style="font-size:16px;line-height:1.6;color:#5f5a65;margin:0 0 24px">${safeBody}</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:16px 28px;border-radius:999px;background:#111111;color:#ffffff;font-weight:800;text-decoration:none">${safeCta}</a>
        <p style="font-size:13px;line-height:1.6;color:#81766b;margin:24px 0 0">${safeFootnote}</p>
        <p style="font-size:13px;line-height:1.6;color:#81766b;margin:12px 0 0;word-break:break-all">${escapeHtml(inviteUrl)}</p>
      </div>
    </div>
  `;

  await sendMail({
    to: normalizedEmail,
    subject: copy.subject,
    html,
    text: `${copy.headline}\n\n${copy.body}\n\n${inviteUrl}\n\n${copy.footnote}`
  });

  return {
    id: invitationId,
    email: normalizedEmail,
    role,
    inviteUrl
  };
}

export async function revokeStaffInvitation(input: {
  ownerProfessionalId: string;
  invitationId: string;
}) {
  const workspace = await getWorkspaceSnapshot(input.ownerProfessionalId);

  if (!workspace || workspace.membership.scope !== "owner") {
    throw new Error("Only business owners can manage invitations.");
  }

  const invitationId = input.invitationId.trim();
  if (!invitationId) {
    throw new Error("Invitation id is required.");
  }

  const timestamp = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { data, error } = await supabase
      .from("business_staff_invitations")
      .update({
        status: "revoked",
        revoked_at: timestamp
      })
      .eq("id", invitationId)
      .eq("business_id", workspace.business.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Invitation not found.");
    }

    return { ok: true };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const invitation = (store.staffInvitations ?? []).find(
    (item) =>
      item.id === invitationId &&
      item.businessId === workspace.business.id &&
      item.status === "pending"
  );

  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  invitation.status = "revoked";
  invitation.revokedAt = timestamp;
  await writeStore(store);

  return { ok: true };
}

export async function acceptStaffInvitation(input: {
  professionalId: string;
  invitationToken: string;
}) {
  const invitationPreview = await getStaffInvitationPreviewByToken(input.invitationToken);

  if (!invitationPreview || invitationPreview.status !== "pending") {
    throw new Error("Приглашение недействительно или уже использовано.");
  }

  const professional = await getProfessionalProfileById(input.professionalId);

  if (!professional) {
    throw new Error("Professional not found.");
  }

  if (professional.email.trim().toLowerCase() !== invitationPreview.email) {
    throw new Error("Войдите под тем email, на который пришло приглашение.");
  }

  const directory = await getBusinessDirectorySnapshot();
  const targetBusiness = directory.businesses.find((item) => item.id === invitationPreview.business.id) || null;
  const activeMembership =
    directory.memberships.find(
      (item) => item.professionalId === input.professionalId && item.scope !== "pending"
    ) || null;
  const pendingMembership =
    directory.memberships.find(
      (item) =>
        item.professionalId === input.professionalId &&
        item.businessId === invitationPreview.business.id &&
        item.scope === "pending"
    ) || null;
  const resolvedAt = new Date().toISOString();

  if (activeMembership && activeMembership.businessId !== invitationPreview.business.id) {
    throw new Error("Этот аккаунт уже привязан к другому бизнесу.");
  }

  const memberSchedule = targetBusiness
    ? buildMembershipScheduleFromBusiness(targetBusiness)
    : {
        workScheduleMode: "fixed" as const,
        workSchedule: createEmptyWorkSchedule(),
        customSchedule: createEmptyCustomSchedule()
      };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    if (pendingMembership) {
      const { error } = await supabase
        .from("business_memberships")
        .update({
          scope: "member",
          role: invitationPreview.role,
          work_schedule_mode: memberSchedule.workScheduleMode,
          work_schedule: memberSchedule.workSchedule,
          custom_schedule: memberSchedule.customSchedule
        })
        .eq("id", pendingMembership.id);

      if (error) {
        throw new Error(error.message);
      }
    } else if (activeMembership) {
      const { error } = await supabase
        .from("business_memberships")
        .update({
          role: invitationPreview.role
        })
        .eq("id", activeMembership.id);

      if (error) {
        throw new Error(error.message);
      }
    } else if (!activeMembership) {
      const { error } = await supabase.from("business_memberships").insert({
        id: makeId("membership"),
        business_id: invitationPreview.business.id,
        professional_id: input.professionalId,
        role: invitationPreview.role,
        scope: "member",
        work_schedule_mode: memberSchedule.workScheduleMode,
        work_schedule: memberSchedule.workSchedule,
        custom_schedule: memberSchedule.customSchedule,
        created_at: resolvedAt
      });

      if (error && !/duplicate/i.test(error.message)) {
        throw new Error(error.message);
      }
    }

    const { error: joinRequestError } = await supabase
      .from("business_join_requests")
      .update({
        status: "approved",
        resolved_at: resolvedAt
      })
      .eq("business_id", invitationPreview.business.id)
      .eq("professional_id", input.professionalId)
      .eq("status", "pending");

    if (joinRequestError && !isMissingJoinRequestsTableError(joinRequestError.message)) {
      throw new Error(joinRequestError.message);
    }

    const { error: invitationError } = await supabase
      .from("business_staff_invitations")
      .update({
        status: "accepted",
        accepted_professional_id: input.professionalId,
        accepted_at: resolvedAt,
        revoked_at: null
      })
      .eq("id", invitationPreview.id);

    if (invitationError) {
      throw new Error(invitationError.message);
    }

    return {
      ok: true,
      businessId: invitationPreview.business.id
    };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const storePendingMembership = store.memberships.find(
    (item) =>
      item.professionalId === input.professionalId &&
      item.businessId === invitationPreview.business.id &&
      item.scope === "pending"
  );
  const storeActiveMembership = store.memberships.find(
    (item) => item.professionalId === input.professionalId && item.scope !== "pending"
  );

  if (storePendingMembership) {
    storePendingMembership.scope = "member";
    storePendingMembership.role = invitationPreview.role;
    storePendingMembership.workScheduleMode = memberSchedule.workScheduleMode;
    storePendingMembership.workSchedule = memberSchedule.workSchedule;
    storePendingMembership.customSchedule = memberSchedule.customSchedule;
  } else if (storeActiveMembership) {
    storeActiveMembership.role = invitationPreview.role;
  } else if (!storeActiveMembership) {
    store.memberships.push(
      normalizeMembershipRecord({
      id: makeId("membership"),
      businessId: invitationPreview.business.id,
      professionalId: input.professionalId,
      role: invitationPreview.role,
      scope: "member",
      workScheduleMode: memberSchedule.workScheduleMode,
      workSchedule: memberSchedule.workSchedule,
      customSchedule: memberSchedule.customSchedule,
      createdAt: resolvedAt
      })
    );
  }

  for (const request of store.joinRequests ?? []) {
    if (
      request.businessId === invitationPreview.business.id &&
      request.professionalId === input.professionalId &&
      request.status === "pending"
    ) {
      request.status = "approved";
      request.resolvedAt = resolvedAt;
    }
  }

  const invitation = (store.staffInvitations ?? []).find((item) => item.id === invitationPreview.id);
  if (!invitation) {
    throw new Error("Invitation not found.");
  }

  invitation.status = "accepted";
  invitation.acceptedProfessionalId = input.professionalId;
  invitation.acceptedAt = resolvedAt;
  delete invitation.revokedAt;

  await writeStore(store);

  return {
    ok: true,
    businessId: invitationPreview.business.id
  };
}

export async function searchJoinableBusinesses(query: string): Promise<JoinBusinessSearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedDigits = normalizedQuery.replace(/\D/g, "");
  if (!normalizedQuery) {
    return [];
  }

  const directory = await getBusinessDirectorySnapshot();
  const pathBusinesses = directory.businesses.map((business) => ({
    id: business.id,
    name: business.name,
    createdAt: business.createdAt
  }));

  return directory.businesses
    .map((business) => {
      const ownerMembership =
        directory.memberships.find((item) => item.businessId === business.id && item.scope === "owner") || null;
      const owner = ownerMembership
        ? directory.professionals.find((item) => item.id === ownerMembership.professionalId) || null
        : business.ownerProfessionalId
          ? directory.professionals.find((item) => item.id === business.ownerProfessionalId) || null
          : null;
      const team = directory.memberships
        .filter((item) => item.businessId === business.id && item.scope !== "pending")
        .map((membership) => directory.professionals.find((item) => item.id === membership.professionalId))
        .filter(Boolean) as ProfessionalRecord[];
      const haystack = [
        business.name,
        business.address,
        business.addressDetails,
        owner?.firstName,
        owner?.lastName,
        owner?.email,
        owner?.phone,
        ...team.flatMap((item) => [item.firstName, item.lastName, item.email, item.phone])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const phoneDigits = [
        owner?.phone,
        ...team.map((item) => item.phone)
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\D/g, "");

      if (!haystack.includes(normalizedQuery) && (!normalizedDigits || !phoneDigits.includes(normalizedDigits))) {
        return null;
      }

      const city =
        business.addressDetails
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)[1] || business.address;

      return {
        businessId: business.id,
        businessPath: getPublicBusinessPathId(
          {
            id: business.id,
            name: business.name,
            createdAt: business.createdAt
          },
          pathBusinesses
        ),
        businessName: business.name,
        city,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : "",
        ownerEmail: owner?.email || "",
        ownerPhone: owner?.phone || "",
        categories: business.categories,
        photoUrl: getPrimaryBusinessPhoto(business)
      } satisfies JoinBusinessSearchResult;
    })
    .filter((item): item is JoinBusinessSearchResult => Boolean(item))
    .slice(0, 20);
}

export async function getJoinRequestsForOwner(ownerProfessionalId: string) {
  const workspace = await getWorkspaceSnapshot(ownerProfessionalId);
  if (!workspace || workspace.membership.scope !== "owner") {
    return [];
  }

  const directory = await getBusinessDirectorySnapshot();
  const tableRequests = directory.joinRequests
    .filter((item) => item.businessId === workspace.business.id && item.status === "pending")
    .map((request) => {
      const professional = directory.professionals.find((item) => item.id === request.professionalId) || null;
      return {
        ...request,
        professional
      };
    });

  if (tableRequests.length > 0) {
    return tableRequests;
  }

  return directory.memberships
    .filter((item) => item.businessId === workspace.business.id && item.scope === "pending")
    .map((membership) => {
      const professional =
        directory.professionals.find((item) => item.id === membership.professionalId) || null;
      return {
        id: membership.id,
        businessId: membership.businessId,
        professionalId: membership.professionalId,
        role: membership.role,
        status: "pending" as const,
        createdAt: membership.createdAt,
        professional
      };
    });
}

export async function resolveJoinRequestForOwner(input: {
  ownerProfessionalId: string;
  requestId: string;
  action: "approve" | "reject";
}) {
  const workspace = await getWorkspaceSnapshot(input.ownerProfessionalId);
  if (!workspace || workspace.membership.scope !== "owner") {
    throw new Error("Only business owners can manage join requests.");
  }

  const resolvedAt = new Date().toISOString();
  const memberSchedule = buildMembershipScheduleFromBusiness(workspace.business);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { data: request, error: requestError } = await supabase
      .from("business_join_requests")
      .select("*")
      .eq("id", input.requestId)
      .eq("business_id", workspace.business.id)
      .maybeSingle();

    const canUseJoinRequestsTable = !requestError || !isMissingJoinRequestsTableError(requestError.message);

    if (requestError && !isMissingJoinRequestsTableError(requestError.message)) {
      throw new Error(requestError.message);
    }

    if (!canUseJoinRequestsTable || !request) {
      const { data: pendingMembership, error: membershipLookupError } = await supabase
        .from("business_memberships")
        .select("*")
        .eq("id", input.requestId)
        .eq("business_id", workspace.business.id)
        .eq("scope", "pending")
        .maybeSingle();

      if (membershipLookupError) {
        throw new Error(membershipLookupError.message);
      }

      if (!pendingMembership) {
        throw new Error("Join request not found.");
      }

      if (input.action === "approve") {
        const { error: membershipUpdateError } = await supabase
          .from("business_memberships")
          .update({
            scope: "member",
            work_schedule_mode: memberSchedule.workScheduleMode,
            work_schedule: memberSchedule.workSchedule,
            custom_schedule: memberSchedule.customSchedule
          })
          .eq("id", pendingMembership.id);

        if (membershipUpdateError) {
          throw new Error(membershipUpdateError.message);
        }
      } else {
        const { error: membershipDeleteError } = await supabase
          .from("business_memberships")
          .delete()
          .eq("id", pendingMembership.id);

        if (membershipDeleteError) {
          throw new Error(membershipDeleteError.message);
        }
      }

      return { ok: true };
    }

    if (input.action === "approve") {
      const membershipPayload = {
        id: makeId("membership"),
        business_id: request.business_id,
        professional_id: request.professional_id,
        role: request.role,
        scope: "member",
        work_schedule_mode: memberSchedule.workScheduleMode,
        work_schedule: memberSchedule.workSchedule,
        custom_schedule: memberSchedule.customSchedule,
        created_at: resolvedAt
      };

      const { error: membershipError } = await supabase.from("business_memberships").insert(membershipPayload);
      if (membershipError && !/duplicate/i.test(membershipError.message)) {
        throw new Error(membershipError.message);
      }
    }

    const { error: updateError } = await supabase
      .from("business_join_requests")
      .update({
        status: input.action === "approve" ? "approved" : "rejected",
        resolved_at: resolvedAt
      })
      .eq("id", input.requestId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { ok: true };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const request = (store.joinRequests ?? []).find(
    (item) => item.id === input.requestId && item.businessId === workspace.business.id
  );

  if (!request) {
    throw new Error("Join request not found.");
  }

  if (input.action === "approve") {
    const existingMembership = store.memberships.find(
      (item) => item.businessId === request.businessId && item.professionalId === request.professionalId
    );
    if (existingMembership) {
      existingMembership.scope = "member";
      existingMembership.role = request.role;
      existingMembership.workScheduleMode = memberSchedule.workScheduleMode;
      existingMembership.workSchedule = memberSchedule.workSchedule;
      existingMembership.customSchedule = memberSchedule.customSchedule;
    } else {
      store.memberships.push(
        normalizeMembershipRecord({
        id: makeId("membership"),
        businessId: request.businessId,
        professionalId: request.professionalId,
        role: request.role,
        scope: "member",
        workScheduleMode: memberSchedule.workScheduleMode,
        workSchedule: memberSchedule.workSchedule,
        customSchedule: memberSchedule.customSchedule,
        createdAt: resolvedAt
        })
      );
    }
  }

  request.status = input.action === "approve" ? "approved" : "rejected";
  request.resolvedAt = resolvedAt;
  await writeStore(store);
  return { ok: true };
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
        "id, first_name, last_name, email, password_hash, phone, country, timezone, language, owner_mode, account_status, created_at"
      )
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    if (normalizeProfessionalAccountStatus(data.account_status) !== "active") {
      return null;
    }

    return verifyPassword(password, data.password_hash) ? data.id : null;
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professional = store.professionals.find((item) => item.email.trim().toLowerCase() === normalizedEmail);

  if (!professional) {
    return null;
  }

  if (normalizeProfessionalAccountStatus(professional.accountStatus) !== "active") {
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

export async function professionalExistsByEmail(email: string) {
  const professional = await getProfessionalProfileByEmail(email);
  return Boolean(professional && normalizeProfessionalAccountStatus(professional.accountStatus) === "active");
}

export async function getProfessionalPasswordResetProfile(email: string) {
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
      .select("id, first_name, last_name, email, password_hash")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email,
      passwordHash: data.password_hash
    };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professional = store.professionals.find(
    (item) => item.email.trim().toLowerCase() === normalizedEmail
  );

  if (!professional) {
    return null;
  }

  return {
    id: professional.id,
    firstName: professional.firstName,
    lastName: professional.lastName,
    email: professional.email,
    passwordHash: professional.passwordHash
  };
}

export async function updateProfessionalPasswordByEmail(email: string, nextPassword: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const nextPasswordHash = hashPassword(nextPassword);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error } = await supabase
      .from("professionals")
      .update({ password_hash: nextPasswordHash })
      .ilike("email", normalizedEmail);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professional = store.professionals.find(
    (item) => item.email.trim().toLowerCase() === normalizedEmail
  );

  if (!professional) {
    throw new Error("Professional not found.");
  }

  professional.passwordHash = nextPasswordHash;
  await writeStore(store);
  return { ok: true };
}

export async function updateProfessionalAvatar(professionalId: string, avatarUrl: string) {
  const normalizedAvatarUrl = normalizeAvatarUrl(avatarUrl);

  if (!professionalId || !normalizedAvatarUrl) {
    return { ok: false };
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { error } = await supabase
      .from("professionals")
      .update({ avatar_url: normalizedAvatarUrl })
      .eq("id", professionalId);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const professional = store.professionals.find((item) => item.id === professionalId);

  if (!professional) {
    throw new Error("Professional not found.");
  }

  professional.avatarUrl = normalizedAvatarUrl;
  await writeStore(store);
  return { ok: true };
}

export async function updateBusinessScheduleForProfessional(input: {
  professionalId: string;
  targetProfessionalId?: string;
  workScheduleMode: WorkScheduleMode;
  workSchedule: WorkSchedule;
  customSchedule: CustomSchedule;
}) {
  const nextMode = normalizeWorkScheduleMode(input.workScheduleMode);
  const nextSchedule = normalizeWorkSchedule(input.workSchedule);
  const nextCustomSchedule = normalizeCustomSchedule(input.customSchedule);
  const targetProfessionalId = input.targetProfessionalId?.trim() || input.professionalId;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("business_memberships")
      .select("id, business_id, scope")
      .eq("professional_id", input.professionalId)
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (!membership?.business_id) {
      throw new Error("Business membership not found.");
    }

    const { data: targetMembership, error: targetMembershipError } = await supabase
      .from("business_memberships")
      .select("id, business_id, scope")
      .eq("professional_id", targetProfessionalId)
      .eq("business_id", membership.business_id)
      .maybeSingle();

    if (targetMembershipError) {
      throw new Error(targetMembershipError.message);
    }

    if (!targetMembership?.id) {
      throw new Error("Target employee membership not found.");
    }

    if (targetProfessionalId !== input.professionalId && membership.scope !== "owner") {
      throw new Error("Only business owner can edit another employee schedule.");
    }

    const { error: membershipUpdateError } = await supabase
      .from("business_memberships")
      .update({
        work_schedule_mode: nextMode,
        work_schedule: nextSchedule,
        custom_schedule: nextCustomSchedule
      })
      .eq("id", targetMembership.id);

    if (membershipUpdateError) {
      throw new Error(membershipUpdateError.message);
    }

    if (targetMembership.scope === "owner") {
      const { error: businessUpdateError } = await supabase
        .from("businesses")
        .update({
          work_schedule_mode: nextMode,
          work_schedule: nextSchedule,
          custom_schedule: nextCustomSchedule
        })
        .eq("id", membership.business_id);

      if (businessUpdateError) {
        throw new Error(businessUpdateError.message);
      }
    }

    return { ok: true };
  }

  const store = await ensureDemoBusinessesInLocalStore();
  const membership = store.memberships.find((item) => item.professionalId === input.professionalId);

  if (!membership) {
    throw new Error("Business membership not found.");
  }

  const targetMembership = store.memberships.find(
    (item) => item.professionalId === targetProfessionalId && item.businessId === membership.businessId
  );

  if (!targetMembership) {
    throw new Error("Target employee membership not found.");
  }

  if (targetProfessionalId !== input.professionalId && membership.scope !== "owner") {
    throw new Error("Only business owner can edit another employee schedule.");
  }

  const business = store.businesses.find((item) => item.id === membership.businessId);

  if (!business) {
    throw new Error("Business not found.");
  }

  targetMembership.workScheduleMode = nextMode;
  targetMembership.workSchedule = nextSchedule;
  targetMembership.customSchedule = nextCustomSchedule;

  if (targetMembership.scope === "owner") {
    business.workScheduleMode = nextMode;
    business.workSchedule = nextSchedule;
    business.customSchedule = nextCustomSchedule;
  }

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
