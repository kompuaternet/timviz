import type { Metadata } from "next";
import { headers } from "next/headers";
import type { SiteLanguage } from "./site-language";
import { defaultSiteLanguage, getLocalizedPath, siteLanguages } from "./site-language";

export const siteUrl = "https://timviz.com";
export const siteName = "Timviz";

export type SeoCopy = {
  title: string;
  description: string;
  keywords?: string[];
};

const localeMap: Record<SiteLanguage, string> = {
  ru: "ru_RU",
  uk: "uk_UA",
  en: "en_US"
};

const defaultImage = "/brand/timviz-logo-web.png";

export async function getRequestLanguage(defaultLanguage: SiteLanguage = "ru"): Promise<SiteLanguage> {
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language")?.toLowerCase() ?? "";

  if (acceptLanguage.includes("uk")) {
    return "uk";
  }

  if (acceptLanguage.includes("en")) {
    return "en";
  }

  return defaultLanguage;
}

export function buildCanonical(pathname: string) {
  if (!pathname || pathname === "/") {
    return siteUrl;
  }

  return `${siteUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function buildLanguageAlternates(
  pathname = "/",
  currentLanguage: SiteLanguage = defaultSiteLanguage
) {
  const languages = Object.fromEntries(
    siteLanguages.map((language) => [language, buildCanonical(getLocalizedPath(language, pathname))])
  ) as Record<SiteLanguage, string>;

  return {
    canonical: languages[currentLanguage],
    languages: {
      ...languages,
      "x-default": languages[defaultSiteLanguage]
    }
  };
}

export function buildMetadata(
  pathname: string,
  copy: SeoCopy,
  language: SiteLanguage,
  options?: {
    image?: string;
    noIndex?: boolean;
    type?: "website" | "article";
  }
): Metadata {
  const canonical = buildCanonical(pathname);
  const image = options?.image ?? defaultImage;

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: {
      canonical
    },
    robots: options?.noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true
          }
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1
          }
        },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: canonical,
      siteName,
      locale: localeMap[language],
      type: options?.type ?? "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: copy.title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [image]
    }
  };
}

export const seoCopy = {
  home: {
    ru: {
      title: "Timviz — онлайн-запись на услуги, поиск салонов и мастеров рядом",
      description:
        "Timviz помогает быстро найти салон, барбершоп, массаж, ногти, брови и другие услуги рядом. Удобная запись онлайн, свободные окна, адрес, фото и отзывы в одном месте.",
      keywords: [
        "онлайн запись на услуги",
        "запись онлайн салон красоты",
        "записаться к мастеру онлайн",
        "поиск салонов рядом",
        "запись на стрижку онлайн",
        "запись на маникюр онлайн",
        "барбершоп онлайн запись",
        "Timviz"
      ]
    },
    uk: {
      title: "Timviz — онлайн-запис на послуги, пошук салонів і майстрів поруч",
      description:
        "Timviz допомагає швидко знайти салон, барбершоп, масаж, нігті, брови та інші послуги поруч. Зручний онлайн-запис, вільні вікна, адреса, фото й відгуки в одному місці.",
      keywords: [
        "онлайн запис на послуги",
        "запис онлайн салон краси",
        "записатися до майстра онлайн",
        "пошук салонів поруч",
        "запис на стрижку онлайн",
        "запис на манікюр онлайн",
        "барбершоп онлайн запис",
        "Timviz"
      ]
    },
    en: {
      title: "Timviz — online booking for beauty and wellness services nearby",
      description:
        "Find salons, barbershops, massage studios, nail services and beauty professionals nearby. Book online, compare available times, view photos, addresses and reviews in one place.",
      keywords: [
        "online booking beauty services",
        "book salon appointment online",
        "find beauty services nearby",
        "barbershop online booking",
        "book massage online",
        "book manicure online",
        "appointment booking platform",
        "Timviz"
      ]
    }
  },
  forBusiness: {
    ru: {
      title: "Онлайн-запись клиентов для мастеров и салонов — Timviz",
      description:
        "Timviz — сервис для онлайн-записи клиентов, календаря записей, услуг, графика работы и Telegram-уведомлений для мастеров и салонов.",
      keywords: [
        "онлайн-запис клієнтів",
        "програма для запису клієнтів",
        "календар записів",
        "CRM для салону",
        "запис клієнтів онлайн",
        "онлайн-запис для майстрів"
      ]
    },
    uk: {
      title: "Онлайн-запис клієнтів для майстрів і салонів — Timviz",
      description:
        "Timviz — сервіс для онлайн-запису клієнтів, календаря записів, послуг, графіка роботи та Telegram-сповіщень для майстрів і салонів.",
      keywords: [
        "онлайн-запис клієнтів",
        "календар записів",
        "програма для запису клієнтів",
        "CRM для салону",
        "онлайн-запис для майстрів",
        "запис клієнтів онлайн"
      ]
    },
    en: {
      title: "Online client booking for masters and salons — Timviz",
      description:
        "Timviz helps service businesses run online client booking, appointment calendar, services, team schedule and Telegram notifications in one place.",
      keywords: [
        "online client booking",
        "appointment calendar",
        "crm for salon",
        "booking software for professionals",
        "online booking for masters",
        "salon scheduling software"
      ]
    }
  },
  catalog: {
    ru: {
      title: "Каталог Timviz — салоны, мастера и запись на услуги онлайн",
      description:
        "Ищите салоны, мастеров и свободные окна по времени, адресу и услуге. Timviz показывает удобную онлайн-запись, цены, адреса, отзывы и фото.",
      keywords: [
        "каталог салонов красоты",
        "запись на услуги онлайн",
        "найти мастера рядом",
        "свободные окна салон",
        "онлайн запись маникюр",
        "онлайн запись массаж"
      ]
    },
    uk: {
      title: "Каталог Timviz — салони, майстри та онлайн-запис на послуги",
      description:
        "Шукайте салони, майстрів і вільні вікна за часом, адресою та послугою. Timviz показує зручний онлайн-запис, ціни, адреси, відгуки й фото.",
      keywords: [
        "каталог салонів краси",
        "запис на послуги онлайн",
        "знайти майстра поруч",
        "вільні вікна салон",
        "онлайн запис манікюр",
        "онлайн запис масаж"
      ]
    },
    en: {
      title: "Timviz catalog — salons, professionals and online service booking",
      description:
        "Search salons and professionals by service, time and location. Compare prices, photos, reviews and available time slots before you book.",
      keywords: [
        "salon directory",
        "book services online",
        "find professionals nearby",
        "available appointment slots",
        "beauty service booking",
        "service marketplace"
      ]
    }
  },
  createAccount: {
    ru: {
      title: "Регистрация бизнеса в Timviz — создайте кабинет для онлайн-записи",
      description:
        "Создайте кабинет Timviz для салона, студии, барбершопа или частного мастера. Настройте запись клиентов, график, услуги и профиль компании.",
      keywords: [
        "регистрация салона онлайн запись",
        "создать кабинет мастера",
        "регистрация барбершопа crm",
        "кабинет для записи клиентов"
      ]
    },
    uk: {
      title: "Реєстрація бізнесу в Timviz — створіть кабінет для онлайн-запису",
      description:
        "Створіть кабінет Timviz для салону, студії, барбершопу або приватного майстра. Налаштуйте запис клієнтів, графік, послуги та профіль компанії.",
      keywords: [
        "реєстрація салону онлайн запис",
        "створити кабінет майстра",
        "реєстрація барбершопу crm",
        "кабінет для запису клієнтів"
      ]
    },
    en: {
      title: "Create a Timviz business account for online bookings",
      description:
        "Create a business account for your salon, studio, barbershop or solo practice. Set up client booking, services, working hours and your business profile.",
      keywords: [
        "create booking account",
        "business signup booking software",
        "salon software registration",
        "professional booking account"
      ]
    }
  }
} satisfies Record<string, Record<SiteLanguage, SeoCopy>>;
