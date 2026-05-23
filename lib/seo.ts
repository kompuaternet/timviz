import type { Metadata } from "next";
import type { SiteLanguage } from "./site-language";
import { defaultSiteLanguage, getLocalizedPath, siteLanguages, withNestedExtraLanguageFallbacks } from "./site-language";

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
  en: "en_US",
  fr: "fr_FR",
  pl: "pl_PL",
  cs: "cs_CZ",
  es: "es_ES",
  de: "de_DE"
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
  const localizedMatch = pathname.match(/^\/(ru|uk|en|fr|pl|cs|es|de)(\/.*)?$/i);
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

export const seoCopy = withNestedExtraLanguageFallbacks<string, SeoCopy>({
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
}, {
  home: {
    fr: { title: "Timviz — logiciel de réservation pour professionnels", description: "Timviz aide les professionnels à gérer planning, clients et réservations en ligne avec un profil public et un lien de prise de rendez-vous.", keywords: ["réservation en ligne", "logiciel de rendez-vous", "agenda professionnel", "Timviz"] },
    pl: { title: "Timviz — system rezerwacji dla specjalistów", description: "Timviz pomaga specjalistom zarządzać grafikiem, klientami i rezerwacjami online w jednym narzędziu.", keywords: ["rezerwacje online", "system umawiania wizyt", "kalendarz specjalisty", "Timviz"] },
    cs: { title: "Timviz — rezervační software pro profesionály", description: "Timviz pomáhá profesionálům spravovat rozvrh, klienty a online rezervace v jednom systému.", keywords: ["online rezervace", "rezervační software", "kalendář profesionála", "Timviz"] },
    es: { title: "Timviz — software de reservas para profesionales", description: "Timviz ayuda a profesionales a gestionar horarios, clientes y reservas online desde una sola plataforma.", keywords: ["reservas online", "software de citas", "agenda profesional", "Timviz"] },
    de: { title: "Timviz — Buchungssoftware für Dienstleister", description: "Timviz hilft Dienstleistern, Kalender, Kunden und Online-Buchungen in einem System zu verwalten.", keywords: ["Online-Buchung", "Terminsoftware", "Kalender für Profis", "Timviz"] }
  },
  forBusiness: {
    fr: { title: "Réservation en ligne pour salons et professionnels — Timviz", description: "Timviz réunit réservation en ligne, agenda, services, équipe et notifications Telegram pour les salons et professionnels.", keywords: ["réservation en ligne", "agenda de rendez-vous", "CRM salon", "Timviz"] },
    pl: { title: "Rezerwacje online dla salonów i specjalistów — Timviz", description: "Timviz łączy rezerwacje online, kalendarz wizyt, usługi, grafik zespołu i powiadomienia Telegram.", keywords: ["rezerwacje online", "kalendarz wizyt", "CRM dla salonu", "Timviz"] },
    cs: { title: "Online rezervace pro salony a profesionály — Timviz", description: "Timviz spojuje online rezervace, kalendář, služby, týmové rozvrhy a Telegram upozornění.", keywords: ["online rezervace", "rezervační kalendář", "CRM pro salon", "Timviz"] },
    es: { title: "Reservas online para salones y profesionales — Timviz", description: "Timviz combina reservas online, calendario, servicios, equipo y notificaciones de Telegram para negocios de servicios.", keywords: ["reservas online", "calendario de citas", "CRM para salón", "Timviz"] },
    de: { title: "Online-Buchung für Salons und Profis — Timviz", description: "Timviz vereint Online-Buchung, Terminkalender, Leistungen, Teamplanung und Telegram-Benachrichtigungen.", keywords: ["Online-Buchung", "Terminplaner", "Salon CRM", "Timviz"] }
  },
  catalog: {
    fr: { title: "Profils publics Timviz — trouver une page de réservation", description: "Recherchez les profils Timviz ouverts et trouvez des professionnels disponibles pour envoyer une demande de réservation.", keywords: ["profil professionnel", "recherche Timviz", "page de réservation", "rendez-vous disponible"] },
    pl: { title: "Publiczne profile Timviz — wyszukiwarka rezerwacji", description: "Szukaj otwartych profili Timviz i znajdź specjalistów z dostępną stroną rezerwacji online.", keywords: ["profil specjalisty", "wyszukiwarka Timviz", "strona rezerwacji", "wolne terminy"] },
    cs: { title: "Veřejné profily Timviz — vyhledání rezervace", description: "Vyhledejte otevřené profily Timviz a najděte profesionály s dostupnou online rezervací.", keywords: ["profil profesionála", "vyhledávání Timviz", "rezervační stránka", "volné termíny"] },
    es: { title: "Perfiles públicos de Timviz — buscar páginas de reserva", description: "Busca perfiles abiertos de Timviz y encuentra profesionales con páginas de reserva online disponibles.", keywords: ["perfil profesional", "búsqueda Timviz", "página de reservas", "citas disponibles"] },
    de: { title: "Öffentliche Timviz-Profile — Buchungsseiten suchen", description: "Finde offene Timviz-Profile und Dienstleister mit verfügbarer Online-Buchungsseite.", keywords: ["Profi-Profil", "Timviz Suche", "Buchungsseite", "freie Termine"] }
  },
  createAccount: {
    fr: { title: "Créer un compte professionnel Timviz", description: "Créez un compte Timviz pour votre salon, studio ou activité indépendante et configurez services, horaires et réservations.", keywords: ["compte professionnel", "réservation salon", "logiciel salon", "Timviz"] },
    pl: { title: "Utwórz konto firmowe Timviz", description: "Załóż konto Timviz dla salonu, studia lub specjalisty i skonfiguruj usługi, grafik oraz rezerwacje online.", keywords: ["konto firmowe", "rezerwacje salonu", "oprogramowanie salonu", "Timviz"] },
    cs: { title: "Vytvořit firemní účet Timviz", description: "Založte účet Timviz pro salon, studio nebo samostatnou praxi a nastavte služby, pracovní dobu a rezervace.", keywords: ["firemní účet", "rezervace salonu", "software pro salon", "Timviz"] },
    es: { title: "Crear una cuenta de negocio en Timviz", description: "Crea una cuenta Timviz para tu salón, estudio o actividad profesional y configura servicios, horarios y reservas online.", keywords: ["cuenta de negocio", "reservas para salón", "software para salón", "Timviz"] },
    de: { title: "Timviz Geschäftskonto erstellen", description: "Erstelle ein Timviz-Konto für Salon, Studio oder Einzelpraxis und richte Leistungen, Arbeitszeiten und Online-Buchungen ein.", keywords: ["Geschäftskonto", "Salon Buchung", "Salon Software", "Timviz"] }
  }
}) satisfies Record<string, Record<SiteLanguage, SeoCopy>>;
