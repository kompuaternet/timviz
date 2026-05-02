import type { LocalizedText, SiteLanguage } from "../data/mock-data";
import {
  addMinutesToTime,
  getDayBreaks,
  getDaySchedule,
  isWithinWorkingWindow,
  normalizeCustomSchedule,
  normalizeWorkSchedule,
  timeRangesOverlap
} from "./work-schedule";
import {
  getBusinessDirectorySnapshot,
  getPrimaryBusinessPhoto,
  normalizeBusinessPhotos,
  type BusinessDirectorySnapshot,
  type BusinessRecord,
  type MembershipRecord,
  type ProfessionalRecord,
  type ServiceRecord
} from "./pro-data";
import { getPublicCalendarAppointments, type PublicCalendarAppointment } from "./pro-calendar";
import { buildPublicBusinessPathMap } from "./public-business-path";
import { getServiceLocalizedText, localizeCategoryName } from "./service-templates";

export type PublicSearchSuggestion = {
  id: string;
  type: "procedure" | "business" | "professional";
  title: string;
  subtitle: string;
  distanceKm: number | null;
  image?: string;
  category?: string;
  localizedTitle?: LocalizedText;
  localizedSubtitle?: LocalizedText;
  localizedCategory?: LocalizedText;
};

export type PublicSearchResult = {
  id: string;
  pathId: string;
  type: "business" | "professional";
  title: string;
  subtitle: string;
  category: string;
  address: string;
  distanceKm: number | null;
  rating: string;
  reviews: number;
  services: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    color?: string;
    localizedName?: LocalizedText;
  }[];
  available: boolean;
  availabilityLabel: string;
  image: string;
  localizedSubtitle?: LocalizedText;
  localizedCategory?: LocalizedText;
  localizedAddress?: LocalizedText;
  localizedAvailabilityLabel?: LocalizedText;
  onlineBookingEnabled: boolean;
};

export type PublicSearchIndex = {
  suggestions: PublicSearchSuggestion[];
  results: PublicSearchResult[];
};

export type PublicSearchParams = {
  query?: string;
  kind?: string;
  date?: string;
  time?: string;
  location?: string;
  lat?: number | null;
  lon?: number | null;
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80"
];

const genericCopy = {
  venue: { ru: "Заведение", uk: "Заклад", en: "Venue" },
  business: { ru: "Бизнес", uk: "Бізнес", en: "Business" },
  professional: { ru: "Профессионал", uk: "Професіонал", en: "Professional" },
  services: { ru: "Услуги", uk: "Послуги", en: "Services" },
  noAddress: { ru: "Адрес пока не указан", uk: "Адресу ще немає", en: "Address not added yet" },
  chooseTime: { ru: "Можно выбрать время", uk: "Можна вибрати час", en: "Choose a time" },
  onlineBookingDisabled: {
    ru: "Онлайн-запись выключена",
    uk: "Онлайн-запис вимкнено",
    en: "Online booking is off"
  },
  noWorkingHours: { ru: "Нет рабочего времени", uk: "Немає робочого часу", en: "No working hours" },
  busyAtTime: { ru: "На это время занято", uk: "На цей час зайнято", en: "Busy at this time" }
} satisfies Record<string, LocalizedText>;

function normalize(value = "") {
  return value.toLowerCase().trim();
}

function localizedTimeLabel(template: LocalizedText, time: string) {
  return {
    ru: template.ru.replace("{time}", time),
    uk: template.uk.replace("{time}", time),
    en: template.en.replace("{time}", time)
  } satisfies LocalizedText;
}

function getLocalizedValues(text?: LocalizedText) {
  return text ? [text.ru, text.uk, text.en] : [];
}

function getSearchableText(parts: Array<string | undefined>, localizedParts: Array<LocalizedText | undefined> = []) {
  return [...parts, ...localizedParts.flatMap((item) => getLocalizedValues(item))]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(latA: number | null | undefined, lonA: number | null | undefined, latB: number | null | undefined, lonB: number | null | undefined) {
  if (
    typeof latA !== "number" ||
    typeof lonA !== "number" ||
    typeof latB !== "number" ||
    typeof lonB !== "number"
  ) {
    return null;
  }

  const radius = 6371;
  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

async function readProStore(): Promise<BusinessDirectorySnapshot> {
  return getBusinessDirectorySnapshot();
}

async function readCalendarStore(): Promise<{ appointments: PublicCalendarAppointment[] }> {
  return {
    appointments: await getPublicCalendarAppointments()
  };
}

function getPrimaryProfessional(business: BusinessRecord, memberships: MembershipRecord[], professionals: ProfessionalRecord[]) {
  const ownerMembership =
    memberships.find((membership) => membership.businessId === business.id && membership.scope === "owner") ??
    memberships.find((membership) => membership.businessId === business.id);

  if (!ownerMembership) {
    return null;
  }

  return professionals.find((professional) => professional.id === ownerMembership.professionalId) ?? null;
}

function getResultType(business: BusinessRecord) {
  const mode = normalize(business.serviceMode);
  if (business.accountType === "solo" && !mode.includes("физическое")) {
    return "professional" as const;
  }

  return "business" as const;
}

function isBusinessAvailable(input: {
  business: BusinessRecord;
  professionalIds: string[];
  services: ServiceRecord[];
  appointments: PublicCalendarAppointment[];
  date?: string;
  time?: string;
  query?: string;
}) {
  if (!input.date || !input.time) {
    if (input.business.allowOnlineBooking !== true) {
      return {
        available: false,
        label: genericCopy.onlineBookingDisabled.ru,
        localizedLabel: genericCopy.onlineBookingDisabled
      };
    }

    return { available: true, label: genericCopy.chooseTime.ru, localizedLabel: genericCopy.chooseTime };
  }

  if (input.business.allowOnlineBooking !== true) {
    return {
      available: false,
      label: genericCopy.onlineBookingDisabled.ru,
      localizedLabel: genericCopy.onlineBookingDisabled
    };
  }

  const workSchedule = normalizeWorkSchedule(input.business.workSchedule);
  const customSchedule = normalizeCustomSchedule(input.business.customSchedule);
  const daySchedule = getDaySchedule(input.date, workSchedule, customSchedule);
  const query = normalize(input.query);
  const matchedService =
    input.services.find((service) => normalize(service.name).includes(query)) ?? input.services[0];
  const duration = matchedService?.durationMinutes || 60;
  const endTime = addMinutesToTime(input.time, duration);
  const breaks = getDayBreaks(daySchedule);

  if (
    !isWithinWorkingWindow(input.time, daySchedule) ||
    endTime > daySchedule.endTime ||
    breaks.some((breakItem) => timeRangesOverlap(input.time!, endTime, breakItem.startTime, breakItem.endTime))
  ) {
    return { available: false, label: genericCopy.noWorkingHours.ru, localizedLabel: genericCopy.noWorkingHours };
  }

  const candidateIds = input.professionalIds.length > 0 ? input.professionalIds : ["business"];
  const busyIds = new Set(
    input.appointments
      .filter(
        (appointment) =>
          appointment.businessId === input.business.id &&
          appointment.appointmentDate === input.date &&
          timeRangesOverlap(input.time!, endTime, appointment.startTime, appointment.endTime)
      )
      .map((appointment) => appointment.professionalId || "business")
  );

  const hasFreeMaster = candidateIds.some((id) => !busyIds.has(id));

  return hasFreeMaster
    ? {
        available: true,
        label: `Свободно на ${input.time}`,
        localizedLabel: localizedTimeLabel(
          { ru: "Свободно на {time}", uk: "Є вікно на {time}", en: "Available at {time}" },
          input.time
        )
      }
    : { available: false, label: genericCopy.busyAtTime.ru, localizedLabel: genericCopy.busyAtTime };
}

export async function getPublicSearchIndex(params: PublicSearchParams = {}): Promise<PublicSearchIndex> {
  const [store, calendarStore] = await Promise.all([readProStore(), readCalendarStore()]);
  const publicPathMap = buildPublicBusinessPathMap(store.businesses);
  const businessesById = new Map(store.businesses.map((business) => [business.id, business]));
  const servicesByBusiness = new Map<string, ServiceRecord[]>();
  const membershipsByBusiness = new Map<string, MembershipRecord[]>();
  const lat = params.lat ?? null;
  const lon = params.lon ?? null;

  for (const service of store.services) {
    if (service.isBlocked === true) {
      continue;
    }
    if ((service.source === "custom" || (!service.source && service.createdByProfessionalId)) && service.moderationStatus === "pending") {
      continue;
    }
    const list = servicesByBusiness.get(service.businessId) ?? [];
    list.push(service);
    servicesByBusiness.set(service.businessId, list);
  }

  for (const membership of store.memberships) {
    const list = membershipsByBusiness.get(membership.businessId) ?? [];
    list.push(membership);
    membershipsByBusiness.set(membership.businessId, list);
  }

  const registeredResults = store.businesses.map((business, index): PublicSearchResult => {
    const normalizedBusiness = {
      ...business,
      photos: normalizeBusinessPhotos(business.photos)
    };
    const businessServices = (servicesByBusiness.get(business.id) ?? []).sort(
      (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.name.localeCompare(right.name)
    );
    const memberships = membershipsByBusiness.get(normalizedBusiness.id) ?? [];
    const primaryProfessional = getPrimaryProfessional(normalizedBusiness, memberships, store.professionals);
    const type = getResultType(normalizedBusiness);
    const title =
      type === "professional" && primaryProfessional
        ? `${primaryProfessional.firstName} ${primaryProfessional.lastName}`.trim()
        : normalizedBusiness.name;
    const distanceKm = getDistanceKm(lat, lon, normalizedBusiness.addressLat, normalizedBusiness.addressLon);
    const availability = isBusinessAvailable({
      business: normalizedBusiness,
      professionalIds: memberships.map((membership) => membership.professionalId),
      services: businessServices,
      appointments: calendarStore.appointments,
      date: params.date,
      time: params.time,
      query: params.query
    });

    const fallbackCategory = normalizedBusiness.categories[0] || genericCopy.services.ru;
    const localizedCategory = normalizedBusiness.categories[0]
      ? {
          ru: localizeCategoryName(normalizedBusiness.categories[0], "ru"),
          uk: localizeCategoryName(normalizedBusiness.categories[0], "uk"),
          en: localizeCategoryName(normalizedBusiness.categories[0], "en")
        }
      : genericCopy.services;
    const localizedSubtitle =
      type === "professional"
        ? normalizedBusiness.categories[0]
          ? undefined
          : {
              ru: `${genericCopy.professional.ru} · ${normalizedBusiness.name}`,
              uk: `${genericCopy.professional.uk} · ${normalizedBusiness.name}`,
              en: `${genericCopy.professional.en} · ${normalizedBusiness.name}`
            }
        : normalizedBusiness.serviceMode.includes("физическое")
          ? genericCopy.venue
          : genericCopy.business;
    const localizedAddress = normalizedBusiness.address ? undefined : genericCopy.noAddress;

    return {
      id: normalizedBusiness.id,
      pathId: publicPathMap.get(normalizedBusiness.id) ?? normalizedBusiness.id,
      type,
      title,
      subtitle:
        type === "professional"
          ? `${normalizedBusiness.categories[0] || genericCopy.professional.ru} · ${normalizedBusiness.name}`
          : normalizedBusiness.serviceMode.includes("физическое")
            ? genericCopy.venue.ru
            : genericCopy.business.ru,
      category: fallbackCategory,
      address: normalizedBusiness.address || genericCopy.noAddress.ru,
      distanceKm,
      rating: "5,0",
      reviews: Math.max(8, 40 - index * 3),
      services: businessServices.map((service) => ({
        id: service.id,
        name: service.name,
        localizedName: getServiceLocalizedText(service.name),
        price: service.price || 0,
        durationMinutes: service.durationMinutes || 60,
        color: service.color
      })),
      available: availability.available,
      availabilityLabel: availability.label,
      localizedSubtitle,
      localizedCategory,
      localizedAddress,
      localizedAvailabilityLabel: availability.localizedLabel,
      image: getPrimaryBusinessPhoto(normalizedBusiness) || fallbackImages[index % fallbackImages.length],
      onlineBookingEnabled: normalizedBusiness.allowOnlineBooking === true
    };
  });

  const results = [...registeredResults].sort((left, right) => {
    if (left.distanceKm === null && right.distanceKm === null) return left.title.localeCompare(right.title);
    if (left.distanceKm === null) return 1;
    if (right.distanceKm === null) return -1;
    return left.distanceKm - right.distanceKm;
  });

  const procedureSuggestions = uniqueBy(
    results.flatMap((result) =>
      result.services.map((service) => ({
        id: `procedure_${service.name}`,
        type: "procedure" as const,
        title: service.name,
        subtitle: result.category,
        distanceKm: result.distanceKm,
        category: result.category,
        localizedTitle: service.localizedName,
        localizedSubtitle: result.localizedCategory,
        localizedCategory: result.localizedCategory
      }))
    ),
    (item) => normalize(item.title)
  );

  const businessSuggestions = results
    .filter((result) => result.type === "business")
    .map((result) => ({
      id: `business_${result.id}`,
      type: "business" as const,
      title: result.title,
      subtitle: `${result.category} · ${result.address}`,
      distanceKm: result.distanceKm,
      image: result.image,
      category: result.category,
      localizedCategory: result.localizedCategory,
      localizedSubtitle:
        result.localizedCategory && result.localizedAddress
          ? {
              ru: `${result.localizedCategory.ru} · ${result.localizedAddress.ru}`,
              uk: `${result.localizedCategory.uk} · ${result.localizedAddress.uk}`,
              en: `${result.localizedCategory.en} · ${result.localizedAddress.en}`
            }
          : undefined
    }));

  const professionalSuggestions = results
    .filter((result) => result.type === "professional")
    .map((result) => ({
      id: `professional_${result.id}`,
      type: "professional" as const,
      title: result.title,
      subtitle: result.subtitle,
      distanceKm: result.distanceKm,
      image: result.image,
      category: result.category,
      localizedSubtitle: result.localizedSubtitle,
      localizedCategory: result.localizedCategory
    }));

  return {
    suggestions: [...procedureSuggestions, ...businessSuggestions, ...professionalSuggestions],
    results
  };
}

export function filterPublicSearchResults(index: PublicSearchIndex, params: PublicSearchParams) {
  const query = normalize(params.query);
  const location = normalize(params.location);
  const kind = params.kind;

  return index.results.filter((result) => {
    if (params.date && params.time && !result.available) {
      return false;
    }

    if (kind === "business" && result.type !== "business") {
      return false;
    }

    if (kind === "professional" && result.type !== "professional") {
      return false;
    }

    if (location) {
      const locationHaystack = getSearchableText(
        [result.address, result.subtitle, result.title, result.category],
        [result.localizedAddress, result.localizedSubtitle, result.localizedCategory]
      );
      if (!locationHaystack.includes(location)) {
        return false;
      }
    }

    if (!query) {
      return true;
    }

    const haystack = getSearchableText(
      [
        result.title,
        result.subtitle,
        result.category,
        result.address,
        ...result.services.map((service) => service.name)
      ],
      [
        result.localizedSubtitle,
        result.localizedCategory,
        result.localizedAddress,
        ...result.services.map((service) => service.localizedName)
      ]
    );

    return haystack.includes(query);
  });
}
