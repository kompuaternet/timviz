import type { Metadata } from "next";
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
  const localizedMatch = pathname.match(/^\/(ru|uk|en)(\/.*)?$/i);
  const localizedAlternates = localizedMatch
    ? buildLanguageAlternates(localizedMatch[2] || "/", localizedMatch[1].toLowerCase() as SiteLanguage)
    : null;
  const image = options?.image ?? defaultImage;

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: localizedAlternates ?? { canonical },
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
      title: "Timviz — онлайн-запись и календарь для мастеров",
      description:
        "Timviz помогает мастерам вести расписание, клиентов и онлайн-записи в одном сервисе. Бесплатный старт, публичный профиль и удобная запись клиентов.",
      keywords: [
        "онлайн запись на услуги",
        "запись онлайн салон красоты",
        "онлайн запись для мастеров",
        "календарь для мастера",
        "запись на стрижку онлайн",
        "запись на маникюр онлайн",
        "барбершоп онлайн запись",
        "Timviz"
      ]
    },
    uk: {
      title: "Timviz — онлайн-запис і календар для майстрів",
      description:
        "Timviz допомагає майстрам вести розклад, клієнтів і онлайн-записи в одному сервісі. Безкоштовний старт, публічний профіль і зручний запис клієнтів.",
      keywords: [
        "онлайн запис на послуги",
        "запис онлайн салон краси",
        "онлайн запис для майстрів",
        "календар для майстра",
        "запис на стрижку онлайн",
        "запис на манікюр онлайн",
        "барбершоп онлайн запис",
        "Timviz"
      ]
    },
    en: {
      title: "Timviz — appointment scheduling software for service professionals",
      description:
        "Timviz helps service professionals manage schedules, clients and online bookings in one SaaS product with a public profile and client booking link.",
      keywords: [
        "online booking beauty services",
        "book salon appointment online",
        "appointment scheduling software",
        "barbershop online booking",
        "book massage online",
        "book manicure online",
        "booking calendar for professionals",
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
      title: "Публичные профили Timviz — поиск доступных страниц записи",
      description:
        "Поиск открытых профилей Timviz. Некоторые мастера делают страницу онлайн-записи видимой, чтобы клиентам было проще открыть профиль и отправить запрос.",
      keywords: [
        "публичный профиль мастера",
        "поиск профилей Timviz",
        "страница онлайн-записи",
        "свободные окна салон",
        "онлайн запись маникюр",
        "онлайн запись массаж"
      ]
    },
    uk: {
      title: "Публічні профілі Timviz — пошук доступних сторінок запису",
      description:
        "Пошук відкритих профілів Timviz. Деякі майстри роблять сторінку онлайн-запису видимою, щоб клієнтам було простіше відкрити профіль і надіслати запит.",
      keywords: [
        "публічний профіль майстра",
        "пошук профілів Timviz",
        "сторінка онлайн-запису",
        "вільні вікна салон",
        "онлайн запис манікюр",
        "онлайн запис масаж"
      ]
    },
    en: {
      title: "Timviz public profiles — search available booking pages",
      description:
        "Search open Timviz profiles. Some professionals make their booking page visible so clients can find the profile and send a booking request.",
      keywords: [
        "public professional profile",
        "Timviz profile search",
        "online booking page",
        "available appointment slots",
        "beauty service booking",
        "appointment scheduling software"
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
