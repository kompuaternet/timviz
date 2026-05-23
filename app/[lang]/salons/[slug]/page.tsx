import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getSalonBySlug, getLocalizedText } from "../../../../data/mock-data";
import { getAllBookings } from "../../../../lib/bookings";
import { getPublicBusinessProfile } from "../../../../lib/public-business";
import { buildLanguageAlternates, buildMetadata } from "../../../../lib/seo";
import { getContentLanguage, getLocalizedPath, isSiteLanguage, type SiteLanguage } from "../../../../lib/site-language";
import SalonView from "../../../salons/[slug]/SalonView";

export const dynamic = "force-dynamic";

type LocalizedSalonPageProps = {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
};

const salonSeoCopy: Record<SiteLanguage, {
  fallbackDescription: string;
  title: (name: string, category: string, city: string) => string;
  description: (description: string, name: string) => string;
  onlineBookingKeyword: string;
  serviceBookingKeyword: string;
}> = {
  ru: {
    fallbackDescription: "Онлайн-запись в Timviz.",
    title: (name, category, city) => `${name} — ${category} в ${city}`,
    description: (description, name) => `${description} Онлайн-запись в ${name}, адрес, услуги, свободные окна и цены в Timviz.`,
    onlineBookingKeyword: "онлайн-запись",
    serviceBookingKeyword: "запись на услуги"
  },
  uk: {
    fallbackDescription: "Онлайн-запис у Timviz.",
    title: (name, category, city) => `${name} — ${category} у ${city}`,
    description: (description, name) => `${description} Онлайн-запис у ${name}, адреса, послуги, вільні вікна та ціни в Timviz.`,
    onlineBookingKeyword: "онлайн-запис",
    serviceBookingKeyword: "запис на послуги"
  },
  en: {
    fallbackDescription: "Online booking on Timviz.",
    title: (name, category, city) => `${name} — ${category} in ${city}`,
    description: (description, name) => `${description} See services, address, prices and available booking slots for ${name} on Timviz.`,
    onlineBookingKeyword: "online booking",
    serviceBookingKeyword: "service booking"
  },
  fr: {
    fallbackDescription: "Réservation en ligne sur Timviz.",
    title: (name, category, city) => `${name} — ${category} à ${city}`,
    description: (description, name) => `${description} Consultez les services, l’adresse, les prix et les créneaux disponibles pour ${name} sur Timviz.`,
    onlineBookingKeyword: "réservation en ligne",
    serviceBookingKeyword: "réservation de service"
  },
  pl: {
    fallbackDescription: "Rezerwacja online w Timviz.",
    title: (name, category, city) => `${name} — ${category} w ${city}`,
    description: (description, name) => `${description} Zobacz usługi, adres, ceny i wolne terminy dla ${name} w Timviz.`,
    onlineBookingKeyword: "rezerwacja online",
    serviceBookingKeyword: "rezerwacja usługi"
  },
  cs: {
    fallbackDescription: "Online rezervace na Timviz.",
    title: (name, category, city) => `${name} — ${category} v ${city}`,
    description: (description, name) => `${description} Podívejte se na služby, adresu, ceny a volné termíny pro ${name} na Timviz.`,
    onlineBookingKeyword: "online rezervace",
    serviceBookingKeyword: "rezervace služby"
  },
  es: {
    fallbackDescription: "Reserva online en Timviz.",
    title: (name, category, city) => `${name} — ${category} en ${city}`,
    description: (description, name) => `${description} Consulta servicios, dirección, precios y horarios disponibles para ${name} en Timviz.`,
    onlineBookingKeyword: "reserva online",
    serviceBookingKeyword: "reserva de servicio"
  },
  de: {
    fallbackDescription: "Online-Buchung bei Timviz.",
    title: (name, category, city) => `${name} — ${category} in ${city}`,
    description: (description, name) => `${description} Leistungen, Adresse, Preise und verfügbare Termine für ${name} bei Timviz ansehen.`,
    onlineBookingKeyword: "Online-Buchung",
    serviceBookingKeyword: "Servicebuchung"
  }
};

const legacySalonValueCopy: Record<SiteLanguage, Record<string, string>> = {
  ru: {},
  uk: {},
  en: {},
  fr: {
    "Beauty salon": "Institut de beauté",
    "Barbershop": "Barbier",
    "Nail studio": "Studio d’ongles",
    "Kyiv": "Kyiv",
    "Lviv": "Lviv"
  },
  pl: {
    "Beauty salon": "Salon kosmetyczny",
    "Barbershop": "Barber shop",
    "Nail studio": "Studio paznokci",
    "Kyiv": "Kijów",
    "Lviv": "Lwów"
  },
  cs: {
    "Beauty salon": "Kosmetický salon",
    "Barbershop": "Barber shop",
    "Nail studio": "Nehtové studio",
    "Kyiv": "Kyjev",
    "Lviv": "Lvov"
  },
  es: {
    "Beauty salon": "Salón de belleza",
    "Barbershop": "Barbería",
    "Nail studio": "Estudio de uñas",
    "Kyiv": "Kyiv",
    "Lviv": "Lviv"
  },
  de: {
    "Beauty salon": "Kosmetikstudio",
    "Barbershop": "Barbershop",
    "Nail studio": "Nagelstudio",
    "Kyiv": "Kyjiw",
    "Lviv": "Lwiw"
  }
};

function localizeLegacySalonValue(value: string, language: SiteLanguage) {
  return legacySalonValueCopy[language][value] ?? value;
}

export async function generateMetadata({
  params
}: LocalizedSalonPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isSiteLanguage(lang)) {
    return {};
  }

  const salon = getSalonBySlug(slug);

  if (!salon) {
    return buildMetadata(
      `/${lang}/salons/${slug}`,
      {
        title: "Timviz",
        description: salonSeoCopy[lang].fallbackDescription
      },
      lang,
      { noIndex: true }
    );
  }

  const contentLanguage = getContentLanguage(lang);
  const city = localizeLegacySalonValue(getLocalizedText(salon.city, contentLanguage), lang);
  const category = localizeLegacySalonValue(getLocalizedText(salon.category, contentLanguage), lang);
  const description = getLocalizedText(salon.description, contentLanguage);
  const seo = salonSeoCopy[lang];

  const metadata = buildMetadata(
    `/${lang}/salons/${slug}`,
    {
      title: seo.title(salon.name, category, city),
      description: seo.description(description, salon.name),
      keywords: [
        salon.name,
        category,
        city,
        seo.onlineBookingKeyword,
        seo.serviceBookingKeyword
      ]
    },
    lang,
    { type: "article" }
  );

  return {
    ...metadata,
    alternates: buildLanguageAlternates(`/salons/${slug}`, lang)
  };
}

export default async function LocalizedSalonPage({
  params
}: LocalizedSalonPageProps) {
  const { lang, slug } = await params;
  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const salon = getSalonBySlug(slug);
  if (!salon) {
    const business = await getPublicBusinessProfile(slug);
    if (business) {
      permanentRedirect(getLocalizedPath(lang as SiteLanguage, `/businesses/${business.publicPathId}`));
    }
  }

  if (!salon) {
    notFound();
  }

  const bookings = (await getAllBookings()).filter((booking) => booking.salonSlug === slug);
  return <SalonView salon={salon} bookings={bookings} initialLanguage={lang as SiteLanguage} />;
}
