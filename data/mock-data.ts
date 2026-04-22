import { createEmptyWorkSchedule, type WorkDayKey, type WorkSchedule } from "../lib/work-schedule";

export type SiteLanguage = "ru" | "uk" | "en";

export type LocalizedText = Record<SiteLanguage, string>;

export type Service = {
  id: string;
  name: string;
  localizedName: LocalizedText;
  durationMinutes: number;
  price: number;
};

export type Salon = {
  slug: string;
  name: string;
  country: string;
  city: LocalizedText;
  category: LocalizedText;
  rating: number;
  reviews: number;
  accent: string;
  description: LocalizedText;
  address: LocalizedText;
  hours: LocalizedText;
  features: Record<SiteLanguage, string[]>;
  services: Service[];
  slots: string[];
  workSchedule: WorkSchedule;
  bookingIntervalMinutes: number;
  type: "business" | "professional";
};

export type LocalizedSalon = {
  slug: string;
  name: string;
  city: string;
  category: string;
  rating: number;
  reviews: number;
  priceLabel: string;
  accent: string;
  description: string;
  address: string;
  hours: string;
  features: string[];
  services: Array<{
    id: string;
    bookingName: string;
    name: string;
    duration: string;
    durationMinutes: number;
    price: string;
    priceValue: number;
  }>;
  slots: string[];
  type: "business" | "professional";
};

function createSalonSchedule(input: {
  days: WorkDayKey[];
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}) {
  const schedule = createEmptyWorkSchedule();

  for (const day of input.days) {
    schedule[day] = {
      enabled: true,
      startTime: input.startTime,
      endTime: input.endTime,
      breakStart: input.breakStart ?? "00:00",
      breakEnd: input.breakEnd ?? "00:00",
      dayType: "workday"
    };
  }

  return schedule;
}

const localeByLanguage: Record<SiteLanguage, string> = {
  ru: "ru-RU",
  uk: "uk-UA",
  en: "en-US"
};

const durationUnitByLanguage: Record<SiteLanguage, string> = {
  ru: "мин",
  uk: "хв",
  en: "min"
};

function formatMoney(value: number, language: SiteLanguage) {
  return new Intl.NumberFormat(localeByLanguage[language], {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDuration(value: number, language: SiteLanguage) {
  return `${value} ${durationUnitByLanguage[language]}`;
}

export function getLocalizedText(text: LocalizedText, language: SiteLanguage) {
  return text[language];
}

export const salons: Salon[] = [
  {
    slug: "studio-aura",
    name: "Studio Aura",
    country: "Ukraine",
    city: { ru: "Киев", uk: "Київ", en: "Kyiv" },
    category: { ru: "Салон красоты", uk: "Салон краси", en: "Beauty salon" },
    rating: 4.9,
    reviews: 214,
    accent: "accent-coral",
    description: {
      ru: "Современный салон для окрашивания, стрижек и ухода с удобной онлайн-записью и командным расписанием.",
      uk: "Сучасний салон для фарбування, стрижок і догляду зі зручним онлайн-записом і командним розкладом.",
      en: "A modern salon for color, cuts and care with easy online booking and a team schedule."
    },
    address: {
      ru: "ул. Саксаганского, 48",
      uk: "вул. Саксаганського, 48",
      en: "48 Saksahanskoho St"
    },
    hours: {
      ru: "Пн-Вс · 09:00-21:00",
      uk: "Пн-Нд · 09:00-21:00",
      en: "Mon-Sun · 09:00-21:00"
    },
    features: {
      ru: ["Онлайн-оплата", "Telegram-напоминания", "4 мастера"],
      uk: ["Онлайн-оплата", "Telegram-нагадування", "4 майстри"],
      en: ["Online payments", "Telegram reminders", "4 professionals"]
    },
    services: [
      {
        id: "womens-haircut",
        name: "Женская стрижка",
        localizedName: { ru: "Женская стрижка", uk: "Жіноча стрижка", en: "Women's haircut" },
        durationMinutes: 60,
        price: 900
      },
      {
        id: "root-color",
        name: "Окрашивание roots",
        localizedName: { ru: "Окрашивание roots", uk: "Фарбування roots", en: "Root color" },
        durationMinutes: 120,
        price: 2200
      },
      {
        id: "styling",
        name: "Укладка",
        localizedName: { ru: "Укладка", uk: "Укладка", en: "Styling" },
        durationMinutes: 45,
        price: 700
      }
    ],
    slots: ["10:00", "11:30", "14:00", "17:30"],
    workSchedule: createSalonSchedule({
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      startTime: "09:00",
      endTime: "21:00"
    }),
    bookingIntervalMinutes: 15,
    type: "business"
  },
  {
    slug: "barber-drive",
    name: "Barber Drive",
    country: "Ukraine",
    city: { ru: "Львов", uk: "Львів", en: "Lviv" },
    category: { ru: "Барбершоп", uk: "Барбершоп", en: "Barbershop" },
    rating: 4.8,
    reviews: 167,
    accent: "accent-forest",
    description: {
      ru: "Быстрый мужской груминг, четкий тайминг и повторные записи без звонков и переписок.",
      uk: "Швидкий чоловічий грумінг, чіткий таймінг і повторні записи без дзвінків та листування.",
      en: "Fast men's grooming, sharp timing and repeat bookings without calls or back-and-forth messages."
    },
    address: {
      ru: "ул. Городоцкая, 91",
      uk: "вул. Городоцька, 91",
      en: "91 Horodotska St"
    },
    hours: {
      ru: "Пн-Сб · 10:00-20:00",
      uk: "Пн-Сб · 10:00-20:00",
      en: "Mon-Sat · 10:00-20:00"
    },
    features: {
      ru: ["Повторная запись", "Лояльность", "3 барбера"],
      uk: ["Повторний запис", "Лояльність", "3 барбери"],
      en: ["Repeat bookings", "Loyalty", "3 barbers"]
    },
    services: [
      {
        id: "mens-haircut",
        name: "Мужская стрижка",
        localizedName: { ru: "Мужская стрижка", uk: "Чоловіча стрижка", en: "Men's haircut" },
        durationMinutes: 45,
        price: 650
      },
      {
        id: "haircut-beard",
        name: "Стрижка + борода",
        localizedName: { ru: "Стрижка + борода", uk: "Стрижка + борода", en: "Haircut + beard" },
        durationMinutes: 60,
        price: 900
      },
      {
        id: "royal-shave",
        name: "Королевское бритье",
        localizedName: { ru: "Королевское бритье", uk: "Королівське гоління", en: "Royal shave" },
        durationMinutes: 40,
        price: 500
      }
    ],
    slots: ["09:30", "12:00", "15:00", "18:00"],
    workSchedule: createSalonSchedule({
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      startTime: "10:00",
      endTime: "20:00"
    }),
    bookingIntervalMinutes: 15,
    type: "professional"
  },
  {
    slug: "nail-yard",
    name: "Nail Yard",
    country: "Ukraine",
    city: { ru: "Одесса", uk: "Одеса", en: "Odesa" },
    category: { ru: "Ногтевая студия", uk: "Нігтьова студія", en: "Nail studio" },
    rating: 4.9,
    reviews: 302,
    accent: "accent-sand",
    description: {
      ru: "Студия маникюра с плотной загрузкой мастеров, удобным календарем и чистой клиентской коммуникацией.",
      uk: "Студія манікюру зі щільним завантаженням майстрів, зручним календарем і чистою клієнтською комунікацією.",
      en: "A nail studio with a busy team schedule, a clean calendar and smooth client communication."
    },
    address: {
      ru: "Французский бульвар, 22",
      uk: "Французький бульвар, 22",
      en: "22 Frantsuzkyi Blvd"
    },
    hours: {
      ru: "Пн-Вс · 08:00-20:00",
      uk: "Пн-Нд · 08:00-20:00",
      en: "Mon-Sun · 08:00-20:00"
    },
    features: {
      ru: ["Управление окнами", "SMS/Telegram", "6 мастеров"],
      uk: ["Керування вікнами", "SMS/Telegram", "6 майстрів"],
      en: ["Gap management", "SMS/Telegram", "6 professionals"]
    },
    services: [
      {
        id: "manicure-cover",
        name: "Маникюр + покрытие",
        localizedName: { ru: "Маникюр + покрытие", uk: "Манікюр + покриття", en: "Manicure + coating" },
        durationMinutes: 90,
        price: 950
      },
      {
        id: "pedicure",
        name: "Педикюр",
        localizedName: { ru: "Педикюр", uk: "Педикюр", en: "Pedicure" },
        durationMinutes: 75,
        price: 1100
      },
      {
        id: "gel-strengthening",
        name: "Укрепление гелем",
        localizedName: { ru: "Укрепление гелем", uk: "Зміцнення гелем", en: "Gel strengthening" },
        durationMinutes: 120,
        price: 1300
      }
    ],
    slots: ["08:30", "10:30", "13:00", "16:30"],
    workSchedule: createSalonSchedule({
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      startTime: "08:00",
      endTime: "20:00"
    }),
    bookingIntervalMinutes: 15,
    type: "business"
  }
];

export function getSalonBySlug(slug: string) {
  return salons.find((salon) => salon.slug === slug);
}

export function getLocalizedSalon(salon: Salon, language: SiteLanguage): LocalizedSalon {
  const minPrice = Math.min(...salon.services.map((service) => service.price));

  return {
    slug: salon.slug,
    name: salon.name,
    city: salon.city[language],
    category: salon.category[language],
    rating: salon.rating,
    reviews: salon.reviews,
    priceLabel: formatMoney(minPrice, language),
    accent: salon.accent,
    description: salon.description[language],
    address: salon.address[language],
    hours: salon.hours[language],
    features: salon.features[language],
    services: salon.services.map((service) => ({
      id: service.id,
      bookingName: service.name,
      name: service.localizedName[language],
      duration: formatDuration(service.durationMinutes, language),
      durationMinutes: service.durationMinutes,
      price: formatMoney(service.price, language),
      priceValue: service.price
    })),
    slots: salon.slots,
    type: salon.type
  };
}
