import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_BOOKING_CREDITS,
  getBusinessDirectorySnapshot,
  getWorkspaceSnapshot,
  normalizeBusinessPhotos,
  type BusinessPhoto,
  type ProfessionalRecord
} from "./pro-data";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import {
  deleteRootCatalogItem,
  getRootCatalogItems,
  upsertRootCatalogItem,
  type GlobalCatalogGroupKey
} from "./global-service-catalog";

export type SuperadminUserRecord = {
  professionalId: string;
  businessId: string;
  membershipId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  role: string;
  scope: "owner" | "member";
  country: string;
  timezone: string;
  language: string;
  currency: string;
  bookingCreditsTotal: number;
  walletBalance: number;
  servicesCount: number;
  photosCount: number;
  createdAt: string;
};

export type SuperadminServiceRecord = {
  id: string;
  businessId: string;
  businessName: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  color?: string;
  sortOrder: number;
  createdAt: string;
  isBlocked: boolean;
  source: "catalog" | "custom";
  moderationStatus: "pending" | "approved";
  moderatedAt?: string;
  addedByProfessionalId: string;
  addedByName: string;
};

export type SuperadminPhotoRecord = {
  id: string;
  businessId: string;
  businessName: string;
  url: string;
  caption: string;
  isPrimary: boolean;
  status: "active" | "blocked";
  createdAt: string;
  addedByProfessionalId: string;
  addedByName: string;
};

const localStorePath = path.join(process.cwd(), "data", "pro-data.json");

async function readLocalStore() {
  const content = await fs.readFile(localStorePath, "utf8");
  return JSON.parse(content) as {
    professionals: ProfessionalRecord[];
    businesses: Array<{ id: string; photos?: BusinessPhoto[] }>;
    services: Array<Record<string, unknown>>;
  };
}

async function writeLocalStore(input: unknown) {
  await fs.writeFile(localStorePath, JSON.stringify(input, null, 2) + "\n", "utf8");
}

function normalize(text = "") {
  return text.trim().toLowerCase();
}

function getFullName(input: { firstName?: string; lastName?: string }) {
  const value = `${input.firstName || ""} ${input.lastName || ""}`.trim();
  return value || "Без имени";
}

function matchesSearch(haystack: string[], query: string) {
  if (!query) {
    return true;
  }

  return haystack.some((value) => normalize(value).includes(query));
}

export async function getSuperadminUsers(search = ""): Promise<SuperadminUserRecord[]> {
  const directory = await getBusinessDirectorySnapshot();
  const query = normalize(search);
  const businessesById = new Map(directory.businesses.map((business) => [business.id, business]));
  const servicesByBusiness = new Map<string, number>();

  for (const service of directory.services) {
    if (service.isBlocked) {
      continue;
    }

    servicesByBusiness.set(service.businessId, (servicesByBusiness.get(service.businessId) ?? 0) + 1);
  }

  const walletBalances = new Map<string, number>();
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from("professionals").select("id, wallet_balance");
      if (error && !/wallet_balance/i.test(error.message)) {
        throw new Error(error.message);
      }
      for (const row of data ?? []) {
        if (typeof row.wallet_balance === "number") {
          walletBalances.set(String(row.id), row.wallet_balance);
        }
      }
    }
  }

  return directory.memberships
    .map((membership) => {
      const professional = directory.professionals.find(
        (item) => item.id === membership.professionalId
      );
      const business = businessesById.get(membership.businessId);
      if (!professional || !business) {
        return null;
      }
      return {
        professionalId: professional.id,
        businessId: business.id,
        membershipId: membership.id,
        fullName: getFullName(professional),
        firstName: professional.firstName,
        lastName: professional.lastName,
        email: professional.email,
        phone: professional.phone,
        businessName: business.name,
        role: membership.role,
        scope: membership.scope,
        country: professional.country,
        timezone: professional.timezone,
        language: professional.language,
        currency: professional.currency || "USD",
        bookingCreditsTotal: professional.bookingCreditsTotal ?? DEFAULT_BOOKING_CREDITS,
        walletBalance: walletBalances.get(professional.id) ?? professional.walletBalance ?? 0,
        servicesCount: servicesByBusiness.get(business.id) ?? 0,
        photosCount: normalizeBusinessPhotos(business.photos).filter((photo) => photo.status !== "blocked").length,
        createdAt: professional.createdAt
      } satisfies SuperadminUserRecord;
    })
    .filter((item): item is SuperadminUserRecord => Boolean(item))
    .filter((item) =>
      matchesSearch(
        [item.fullName, item.email, item.phone, item.businessName, item.role],
        query
      )
    )
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export async function setProfessionalBalances(input: {
  professionalId: string;
  bookingCreditsTotal?: number;
  walletBalance?: number;
}) {
  const bookingCreditsTotal =
    typeof input.bookingCreditsTotal === "number" && Number.isFinite(input.bookingCreditsTotal)
      ? Math.max(0, Math.round(input.bookingCreditsTotal))
      : undefined;
  const walletBalance =
    typeof input.walletBalance === "number" && Number.isFinite(input.walletBalance)
      ? Math.max(0, Math.round(input.walletBalance))
      : undefined;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    const updates: Record<string, number> = {};
    if (typeof bookingCreditsTotal === "number") {
      updates.booking_credits_total = bookingCreditsTotal;
    }
    if (typeof walletBalance === "number") {
      updates.wallet_balance = walletBalance;
    }

    const { error } = await supabase.from("professionals").update(updates).eq("id", input.professionalId);
    if (error) {
      if (/wallet_balance/i.test(error.message)) {
        throw new Error("В базе ещё нет поля wallet_balance. Нужно применить обновлённый schema.sql.");
      }
      throw new Error(error.message);
    }

    return { ok: true };
  }

  const store = await readLocalStore();
  const professional = store.professionals.find((item) => item.id === input.professionalId);
  if (!professional) {
    throw new Error("Пользователь не найден.");
  }

  if (typeof bookingCreditsTotal === "number") {
    professional.bookingCreditsTotal = bookingCreditsTotal;
  }
  if (typeof walletBalance === "number") {
    professional.walletBalance = walletBalance;
  }
  await writeLocalStore(store);
  return { ok: true };
}

export async function deleteProfessionalAsSuperadmin(professionalId: string) {
  const directory = await getBusinessDirectorySnapshot();
  const membership = directory.memberships.find((item) => item.professionalId === professionalId);

  if (!membership) {
    throw new Error("Пользователь не найден.");
  }

  const businessMembers = directory.memberships.filter((item) => item.businessId === membership.businessId);
  const otherMembers = businessMembers.filter((item) => item.professionalId !== professionalId);
  const isOwner = membership.scope === "owner";

  if (isOwner && otherMembers.length > 0) {
    throw new Error("Нельзя удалить владельца, пока в бизнесе ещё есть сотрудники. Сначала уберите остальных пользователей из этого бизнеса.");
  }

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    if (isOwner) {
      const { error: businessError } = await supabase.from("businesses").delete().eq("id", membership.businessId);
      if (businessError) {
        throw new Error(businessError.message);
      }
    }

    const { error } = await supabase.from("professionals").delete().eq("id", professionalId);
    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  }

  const store = await readLocalStore() as {
    professionals: ProfessionalRecord[];
    businesses: Array<Record<string, unknown>>;
    services: Array<Record<string, unknown>>;
    memberships?: Array<Record<string, unknown>>;
  };

  store.professionals = store.professionals.filter((item) => item.id !== professionalId);

  if (Array.isArray(store.memberships)) {
    store.memberships = store.memberships.filter((item) => String(item.professionalId) !== professionalId);
  }

  if (isOwner) {
    store.businesses = store.businesses.filter((item) => String(item.id) !== membership.businessId);
    store.services = store.services.filter((item) => String(item.businessId) !== membership.businessId);
    if (Array.isArray(store.memberships)) {
      store.memberships = store.memberships.filter((item) => String(item.businessId) !== membership.businessId);
    }
  }

  await writeLocalStore(store);
  return { ok: true };
}

export async function getSuperadminServices(search = ""): Promise<SuperadminServiceRecord[]> {
  const directory = await getBusinessDirectorySnapshot();
  const query = normalize(search);
  const businessesById = new Map(directory.businesses.map((business) => [business.id, business]));
  const professionalsById = new Map(directory.professionals.map((professional) => [professional.id, professional]));

  const rows = directory.services
    .map((service): SuperadminServiceRecord | null => {
      if (service.source !== "custom") {
        return null;
      }
      const business = businessesById.get(service.businessId);
      if (!business) {
        return null;
      }
      const addedByProfessionalId =
        service.createdByProfessionalId ||
        business.ownerProfessionalId ||
        directory.memberships.find((item) => item.businessId === business.id)?.professionalId ||
        "";
      const addedByProfessional = professionalsById.get(addedByProfessionalId);
      return {
        id: service.id,
        businessId: business.id,
        businessName: business.name,
        name: service.name,
        category: service.category || "Без категории",
        durationMinutes: service.durationMinutes || 60,
        price: service.price || 0,
        color: service.color,
        sortOrder: service.sortOrder || 0,
        createdAt: service.createdAt,
        isBlocked: service.isBlocked === true,
        source: service.source === "custom" ? "custom" : "catalog",
        moderationStatus: service.moderationStatus === "pending" ? "pending" : "approved",
        moderatedAt: service.moderatedAt,
        addedByProfessionalId,
        addedByName: addedByProfessional ? getFullName(addedByProfessional) : "Неизвестно"
      } satisfies SuperadminServiceRecord;
    });

  return rows
    .filter((item): item is SuperadminServiceRecord => item !== null)
    .filter((item) =>
      matchesSearch([item.name, item.category, item.businessName, item.addedByName], query)
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function setServiceBlocked(serviceId: string, isBlocked: boolean) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }
    const { error } = await supabase
      .from("business_services")
      .update({ is_blocked: isBlocked })
      .eq("id", serviceId);
    if (error) {
      if (/is_blocked/i.test(error.message)) {
        throw new Error("В базе ещё нет поля is_blocked. Нужно применить обновлённый schema.sql.");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  }

  const store = await readLocalStore();
  const service = (store.services as Array<Record<string, unknown>>).find((item) => item.id === serviceId);
  if (!service) {
    throw new Error("Услуга не найдена.");
  }
  service.isBlocked = isBlocked;
  await writeLocalStore(store);
  return { ok: true };
}

export async function setServiceModerationStatus(serviceId: string, moderationStatus: "pending" | "approved") {
  const moderatedAt = moderationStatus === "approved" ? new Date().toISOString() : null;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }
    const { error } = await supabase
      .from("business_services")
      .update({
        moderation_status: moderationStatus,
        moderated_at: moderatedAt
      })
      .eq("id", serviceId);
    if (error) {
      if (/moderation_status|moderated_at/i.test(error.message)) {
        throw new Error("В базе ещё нет полей moderation_status и moderated_at. Нужно применить обновлённый schema.sql.");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  }

  const store = await readLocalStore();
  const service = (store.services as Array<Record<string, unknown>>).find((item) => item.id === serviceId);
  if (!service) {
    throw new Error("Услуга не найдена.");
  }
  service.moderationStatus = moderationStatus;
  service.moderatedAt = moderatedAt ?? undefined;
  await writeLocalStore(store);
  return { ok: true };
}

export async function promoteServiceToRootCatalog(input: {
  serviceId: string;
  category: string;
  groupKey: GlobalCatalogGroupKey;
}) {
  const directory = await getBusinessDirectorySnapshot();
  const service = directory.services.find((item) => item.id === input.serviceId);

  if (!service) {
    throw new Error("Услуга не найдена.");
  }

  await upsertRootCatalogItem({
    category: input.category.trim() || service.category || "Без категории",
    groupKey: input.groupKey,
    name: service.name,
    durationMinutes: service.durationMinutes || 60,
    price: service.price || 0,
    sortOrder: 0
  });

  await setServiceModerationStatus(service.id, "approved");
  return { ok: true };
}

export async function deleteServiceAsSuperadmin(serviceId: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }
    const { error } = await supabase.from("business_services").delete().eq("id", serviceId);
    if (error) {
      throw new Error(error.message);
    }
    return { ok: true };
  }

  const store = await readLocalStore();
  store.services = (store.services as Array<Record<string, unknown>>).filter((item) => item.id !== serviceId);
  await writeLocalStore(store);
  return { ok: true };
}

async function updateBusinessPhotos(
  businessId: string,
  mutate: (photos: BusinessPhoto[], businessOwnerId?: string | null) => BusinessPhoto[]
) {
  const directory = await getBusinessDirectorySnapshot();
  const business = directory.businesses.find((item) => item.id === businessId);
  if (!business) {
    throw new Error("Компания не найдена.");
  }

  const nextPhotos = mutate(normalizeBusinessPhotos(business.photos), business.ownerProfessionalId);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }
    const { error } = await supabase.from("businesses").update({ photos: nextPhotos }).eq("id", businessId);
    if (error) {
      throw new Error(error.message);
    }
    return { ok: true };
  }

  const store = await readLocalStore();
  const localBusiness = store.businesses.find((item) => item.id === businessId);
  if (!localBusiness) {
    throw new Error("Компания не найдена.");
  }
  localBusiness.photos = nextPhotos;
  await writeLocalStore(store);
  return { ok: true };
}

export async function getSuperadminPhotos(search = ""): Promise<SuperadminPhotoRecord[]> {
  const directory = await getBusinessDirectorySnapshot();
  const query = normalize(search);
  const professionalsById = new Map(directory.professionals.map((professional) => [professional.id, professional]));

  return directory.businesses
    .flatMap((business) =>
      normalizeBusinessPhotos(business.photos).map((photo) => {
        const addedByProfessionalId = photo.createdByProfessionalId || business.ownerProfessionalId || "";
        const addedBy = professionalsById.get(addedByProfessionalId);
        return {
          id: photo.id,
          businessId: business.id,
          businessName: business.name,
          url: photo.url,
          caption: photo.caption || "",
          isPrimary: photo.isPrimary,
          status: photo.status === "blocked" ? "blocked" : "active",
          createdAt: photo.createdAt,
          addedByProfessionalId,
          addedByName: addedBy ? getFullName(addedBy) : "Неизвестно"
        } satisfies SuperadminPhotoRecord;
      })
    )
    .filter((item) =>
      matchesSearch([item.businessName, item.caption, item.addedByName], query)
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function setPhotoBlocked(input: {
  businessId: string;
  photoId: string;
  isBlocked: boolean;
}) {
  return updateBusinessPhotos(input.businessId, (photos) =>
    photos.map((photo) =>
      photo.id === input.photoId
        ? {
            ...photo,
            status: input.isBlocked ? "blocked" : "active",
            blockedAt: input.isBlocked ? new Date().toISOString() : undefined,
            isPrimary: input.isBlocked ? false : photo.isPrimary
          }
        : photo
    )
  );
}

export async function deletePhotoAsSuperadmin(input: { businessId: string; photoId: string }) {
  return updateBusinessPhotos(input.businessId, (photos) => {
    const filtered = photos.filter((photo) => photo.id !== input.photoId);
    if (filtered.length > 0 && !filtered.some((photo) => photo.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    return filtered;
  });
}

export async function getSuperadminCatalogItems() {
  return getRootCatalogItems();
}

export async function saveSuperadminCatalogItem(input: {
  id?: string;
  category: string;
  groupKey: GlobalCatalogGroupKey;
  name: string;
  durationMinutes?: number;
  price?: number;
  sortOrder?: number;
}) {
  return upsertRootCatalogItem(input);
}

export async function removeSuperadminCatalogItem(itemId: string) {
  return deleteRootCatalogItem(itemId);
}

export async function getProfessionalWorkspaceForAdmin(professionalId: string) {
  return getWorkspaceSnapshot(professionalId);
}
