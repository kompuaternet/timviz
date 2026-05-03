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
  seedRootCatalogDefaults,
  upsertRootCatalogItem,
  type GlobalCatalogGroupKey
} from "./global-service-catalog";
import { getServiceLocalizedText, type LocalizedServiceText } from "./service-templates";

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
  scope: "owner" | "member" | "pending" | "unassigned";
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
const localCalendarStorePath = path.join(process.cwd(), "data", "pro-calendar.json");
const localBookingsStorePath = path.join(process.cwd(), "data", "bookings.json");

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

function splitCombinedServiceNames(value = "") {
  return value
    .split(/\s*\+\s*/)
    .map((part) => normalize(part))
    .filter(Boolean);
}

function matchesRemovedServiceName(value: string, removedNames: Set<string>) {
  const normalizedValue = normalize(value);
  if (!normalizedValue) {
    return false;
  }

  if (removedNames.has(normalizedValue)) {
    return true;
  }

  const parts = splitCombinedServiceNames(value);
  return parts.some((part) => removedNames.has(part));
}

function buildRemovedServiceNameSet(input: {
  name: string;
  localizedName?: Partial<LocalizedServiceText>;
}) {
  const inferredLocalized = getServiceLocalizedText(input.name, input.localizedName);
  const candidates = [
    input.name,
    input.localizedName?.ru,
    input.localizedName?.uk,
    input.localizedName?.en,
    inferredLocalized.ru,
    inferredLocalized.uk,
    inferredLocalized.en
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  return new Set(candidates.map((value) => normalize(value)));
}

function chunk<T>(items: T[], size = 200) {
  if (items.length <= size) {
    return [items];
  }

  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function isMissingOptionalTableOrColumn(message = "") {
  return (
    /relation .* does not exist/i.test(message) ||
    /could not find the table/i.test(message) ||
    /column .* does not exist/i.test(message)
  );
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

  const membershipUsers = directory.memberships.flatMap((membership) => {
      const professional = directory.professionals.find(
        (item) => item.id === membership.professionalId
      );
      const business = businessesById.get(membership.businessId);
      if (!professional || !business) {
        return [];
      }
      return [{
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
      } satisfies SuperadminUserRecord];
    });

  const assignedProfessionalIds = new Set(membershipUsers.map((item) => item.professionalId));
  const unassignedUsers = directory.professionals
    .filter((professional) => !assignedProfessionalIds.has(professional.id))
    .map((professional) => ({
      professionalId: professional.id,
      businessId: "",
      membershipId: "",
      fullName: getFullName(professional),
      firstName: professional.firstName,
      lastName: professional.lastName,
      email: professional.email,
      phone: professional.phone,
      businessName: "Не подключен к бизнесу",
      role: "Нет роли",
      scope: "unassigned" as const,
      country: professional.country,
      timezone: professional.timezone,
      language: professional.language,
      currency: professional.currency || "USD",
      bookingCreditsTotal: professional.bookingCreditsTotal ?? DEFAULT_BOOKING_CREDITS,
      walletBalance: walletBalances.get(professional.id) ?? professional.walletBalance ?? 0,
      servicesCount: 0,
      photosCount: 0,
      createdAt: professional.createdAt
    } satisfies SuperadminUserRecord));

  return [...membershipUsers, ...unassignedUsers]
    .filter((item) => matchesSearch([item.fullName, item.email, item.phone, item.businessName, item.role], query))
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
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        throw new Error("Supabase is not available.");
      }

      const { error } = await supabase.from("professionals").delete().eq("id", professionalId);
      if (error) {
        throw new Error(error.message);
      }

      return { ok: true };
    }

    const store = (await readLocalStore()) as {
      professionals: ProfessionalRecord[];
      businesses: Array<Record<string, unknown>>;
      services: Array<Record<string, unknown>>;
      memberships?: Array<Record<string, unknown>>;
    };

    store.professionals = store.professionals.filter((item) => item.id !== professionalId);
    await writeLocalStore(store);
    return { ok: true };
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
    localizedName: getServiceLocalizedText(service.name),
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
  const items = await getRootCatalogItems();
  if (items.length > 0) {
    return items;
  }

  await seedRootCatalogDefaults();
  return getRootCatalogItems();
}

export async function saveSuperadminCatalogItem(input: {
  id?: string;
  category: string;
  groupKey: GlobalCatalogGroupKey;
  name: string;
  localizedName?: Partial<LocalizedServiceText>;
  durationMinutes?: number;
  price?: number;
  sortOrder?: number;
}) {
  return upsertRootCatalogItem(input);
}

export async function removeSuperadminCatalogItem(itemId: string) {
  const normalizedItemId = itemId.trim();
  if (!normalizedItemId) {
    throw new Error("Элемент каталога не найден.");
  }

  const catalogItems = await getRootCatalogItems();
  const itemToRemove = catalogItems.find((item) => item.id === normalizedItemId);

  if (!itemToRemove) {
    await deleteRootCatalogItem(normalizedItemId);
    return {
      ok: true,
      removedCatalogItemId: normalizedItemId,
      removedServicesCount: 0,
      removedCalendarAppointmentsCount: 0,
      removedLegacyBookingsCount: 0
    };
  }

  const removedNames = buildRemovedServiceNameSet({
    name: itemToRemove.name,
    localizedName: itemToRemove.localizedName
  });

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      throw new Error("Supabase is not available.");
    }

    let serviceRows: Array<{
      id: string;
      business_id: string;
      name: string;
      source?: string | null;
    }> = [];

    let fetchServicesError: { message?: string } | null = null;
    let hasSourceColumn = true;

    {
      const { data, error } = await supabase
        .from("business_services")
        .select("id, business_id, name, source");
      if (error) {
        if (/source/i.test(error.message)) {
          hasSourceColumn = false;
          const fallback = await supabase
            .from("business_services")
            .select("id, business_id, name");
          serviceRows =
            (fallback.data as Array<{
              id: string;
              business_id: string;
              name: string;
            }> | null)?.map((row) => ({ ...row, source: null })) ?? [];
          fetchServicesError = fallback.error;
        } else {
          fetchServicesError = error;
        }
      } else {
        serviceRows =
          (data as Array<{
            id: string;
            business_id: string;
            name: string;
            source?: string | null;
          }> | null) ?? [];
      }
    }

    if (fetchServicesError) {
      throw new Error(fetchServicesError.message || "Не удалось загрузить услуги бизнеса.");
    }

    const matchedServices = serviceRows.filter((service) => {
      const matchesName = matchesRemovedServiceName(service.name, removedNames);
      if (!matchesName) {
        return false;
      }
      if (!hasSourceColumn) {
        return true;
      }
      return (service.source || "catalog") === "catalog";
    });

    const serviceIdsToRemove = matchedServices.map((service) => service.id);
    const affectedBusinessIds = Array.from(new Set(matchedServices.map((service) => service.business_id)));

    if (serviceIdsToRemove.length > 0) {
      for (const idsChunk of chunk(serviceIdsToRemove, 200)) {
        const { error } = await supabase
          .from("business_services")
          .delete()
          .in("id", idsChunk);
        if (error) {
          throw new Error(error.message);
        }
      }
    }

    const appointmentIdsToRemove: string[] = [];

    if (affectedBusinessIds.length > 0) {
      for (const businessChunk of chunk(affectedBusinessIds, 100)) {
        const { data, error } = await supabase
          .from("calendar_appointments")
          .select("id, service_name, kind")
          .in("business_id", businessChunk)
          .eq("kind", "appointment");

        if (error) {
          if (!isMissingOptionalTableOrColumn(error.message)) {
            throw new Error(error.message);
          }
          continue;
        }

        const rows =
          (data as Array<{ id: string; service_name?: string | null; kind?: string | null }> | null) ??
          [];

        for (const row of rows) {
          if (!row?.id || row.kind === "blocked") {
            continue;
          }
          if (matchesRemovedServiceName(String(row.service_name || ""), removedNames)) {
            appointmentIdsToRemove.push(row.id);
          }
        }
      }
    }

    if (appointmentIdsToRemove.length > 0) {
      for (const idsChunk of chunk(appointmentIdsToRemove, 200)) {
        const { error } = await supabase
          .from("calendar_appointments")
          .delete()
          .in("id", idsChunk);
        if (error) {
          throw new Error(error.message);
        }

        const reminderDelete = await supabase
          .from("telegram_reminder_events")
          .delete()
          .in("appointment_id", idsChunk);
        if (reminderDelete.error && !isMissingOptionalTableOrColumn(reminderDelete.error.message)) {
          throw new Error(reminderDelete.error.message);
        }
      }
    }

    const bookingIdsToRemove: string[] = [];
    const affectedSalonSlugs = affectedBusinessIds.map((businessId) => `business:${businessId}`);

    if (affectedSalonSlugs.length > 0) {
      for (const slugsChunk of chunk(affectedSalonSlugs, 100)) {
        const { data, error } = await supabase
          .from("bookings")
          .select("id, service_name")
          .in("salon_slug", slugsChunk);

        if (error) {
          if (!isMissingOptionalTableOrColumn(error.message)) {
            throw new Error(error.message);
          }
          continue;
        }

        const rows =
          (data as Array<{ id: string; service_name?: string | null }> | null) ?? [];

        for (const row of rows) {
          if (!row?.id) {
            continue;
          }
          if (matchesRemovedServiceName(String(row.service_name || ""), removedNames)) {
            bookingIdsToRemove.push(row.id);
          }
        }
      }
    }

    if (bookingIdsToRemove.length > 0) {
      for (const idsChunk of chunk(bookingIdsToRemove, 200)) {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .in("id", idsChunk);
        if (error) {
          throw new Error(error.message);
        }
      }
    }

    await deleteRootCatalogItem(normalizedItemId);

    return {
      ok: true,
      removedCatalogItemId: normalizedItemId,
      removedServicesCount: serviceIdsToRemove.length,
      removedCalendarAppointmentsCount: appointmentIdsToRemove.length,
      removedLegacyBookingsCount: bookingIdsToRemove.length
    };
  }

  const store = (await readLocalStore()) as {
    professionals: ProfessionalRecord[];
    businesses: Array<Record<string, unknown>>;
    services: Array<Record<string, unknown>>;
    memberships?: Array<Record<string, unknown>>;
  };

  const localServices = (store.services ?? []) as Array<{
    id: string;
    businessId: string;
    name: string;
    source?: string;
  }>;
  const matchedLocalServices = localServices.filter((service) => {
    const matchesName = matchesRemovedServiceName(service.name, removedNames);
    if (!matchesName) {
      return false;
    }
    return (service.source || "catalog") === "catalog";
  });
  const localServiceIdsToRemove = new Set(matchedLocalServices.map((service) => service.id));
  const affectedBusinessIds = new Set(matchedLocalServices.map((service) => service.businessId));

  store.services = localServices.filter((service) => !localServiceIdsToRemove.has(service.id));
  await writeLocalStore(store);

  try {
    const calendarRaw = await fs.readFile(localCalendarStorePath, "utf8");
    const calendarStore = JSON.parse(calendarRaw) as {
      appointments?: Array<{
        id: string;
        businessId: string;
        kind?: string;
        serviceName?: string;
      }>;
    };
    const appointments = Array.isArray(calendarStore.appointments)
      ? calendarStore.appointments
      : [];
    calendarStore.appointments = appointments.filter((appointment) => {
      if (!affectedBusinessIds.has(String(appointment.businessId || ""))) {
        return true;
      }
      if ((appointment.kind || "appointment") === "blocked") {
        return true;
      }
      return !matchesRemovedServiceName(String(appointment.serviceName || ""), removedNames);
    });
    await fs.writeFile(localCalendarStorePath, JSON.stringify(calendarStore, null, 2) + "\n", "utf8");
  } catch {
    // Ignore missing local calendar store in production.
  }

  try {
    const bookingsRaw = await fs.readFile(localBookingsStorePath, "utf8");
    const parsedBookings = JSON.parse(bookingsRaw);
    const bookingsStore = (Array.isArray(parsedBookings) ? parsedBookings : []) as Array<{
      salonSlug?: string;
      serviceName?: string;
    }>;
    const affectedSlugs = new Set(Array.from(affectedBusinessIds).map((businessId) => `business:${businessId}`));
    const nextBookings = bookingsStore.filter((booking) => {
      if (!affectedSlugs.has(String(booking.salonSlug || ""))) {
        return true;
      }
      return !matchesRemovedServiceName(String(booking.serviceName || ""), removedNames);
    });
    await fs.writeFile(localBookingsStorePath, JSON.stringify(nextBookings, null, 2) + "\n", "utf8");
  } catch {
    // Ignore missing local bookings store in production.
  }

  await deleteRootCatalogItem(normalizedItemId);

  return {
    ok: true,
    removedCatalogItemId: normalizedItemId,
    removedServicesCount: localServiceIdsToRemove.size
  };
}

export async function seedSuperadminCatalogDefaults(options?: { force?: boolean }) {
  return seedRootCatalogDefaults(options);
}

export async function getProfessionalWorkspaceForAdmin(professionalId: string) {
  return getWorkspaceSnapshot(professionalId);
}
