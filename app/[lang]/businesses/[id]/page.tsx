import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessView from "../../../businesses/[id]/BusinessView";
import { getPublicBusinessProfile } from "../../../../lib/public-business";
import { buildLanguageAlternates, buildMetadata } from "../../../../lib/seo";
import { getLocalizedPath, isSiteLanguage, type SiteLanguage } from "../../../../lib/site-language";

export const revalidate = 60;

type LocalizedBusinessPageProps = {
  params: Promise<{
    lang: string;
    id: string;
  }>;
};

const businessSeoCopy: Record<SiteLanguage, { fallbackDescription: string; description: (name: string) => string }> = {
  ru: {
    fallbackDescription: "Страница компании на Timviz.",
    description: (name) => `${name}. Услуги, адрес и онлайн-запись в Timviz.`
  },
  uk: {
    fallbackDescription: "Сторінка компанії на Timviz.",
    description: (name) => `${name}. Послуги, адреса та онлайн-запис у Timviz.`
  },
  en: {
    fallbackDescription: "Business page on Timviz.",
    description: (name) => `${name}. Services, address and online booking on Timviz.`
  },
  fr: {
    fallbackDescription: "Page d'entreprise sur Timviz.",
    description: (name) => `${name}. Services, adresse et réservation en ligne sur Timviz.`
  },
  pl: {
    fallbackDescription: "Strona firmy w Timviz.",
    description: (name) => `${name}. Usługi, adres i rezerwacja online w Timviz.`
  },
  cs: {
    fallbackDescription: "Stránka firmy na Timviz.",
    description: (name) => `${name}. Služby, adresa a online rezervace na Timviz.`
  },
  es: {
    fallbackDescription: "Página de empresa en Timviz.",
    description: (name) => `${name}. Servicios, dirección y reserva online en Timviz.`
  },
  de: {
    fallbackDescription: "Unternehmensseite auf Timviz.",
    description: (name) => `${name}. Leistungen, Adresse und Online-Buchung bei Timviz.`
  }
};

const businessCategoryCopy: Record<SiteLanguage, Record<string, string>> = {
  ru: {
    "ногти": "Ногти",
    "салон красоты": "Салон красоты",
    "парикмахер": "Парикмахер",
    "барбер": "Барбер",
    "косметология": "Косметология",
    "массаж": "Массаж"
  },
  uk: {
    "ногти": "Нігті",
    "салон красоты": "Салон краси",
    "парикмахер": "Перукар",
    "барбер": "Барбер",
    "косметология": "Косметологія",
    "массаж": "Масаж"
  },
  en: {
    "ногти": "Nails",
    "салон красоты": "Beauty salon",
    "парикмахер": "Hairdresser",
    "барбер": "Barber",
    "косметология": "Cosmetology",
    "массаж": "Massage"
  },
  fr: {
    "ногти": "Ongles",
    "салон красоты": "Salon de beauté",
    "парикмахер": "Coiffeur",
    "барбер": "Barbier",
    "косметология": "Cosmétologie",
    "массаж": "Massage"
  },
  pl: {
    "ногти": "Paznokcie",
    "салон красоты": "Salon kosmetyczny",
    "парикмахер": "Fryzjer",
    "барбер": "Barber",
    "косметология": "Kosmetologia",
    "массаж": "Masaż"
  },
  cs: {
    "ногти": "Nehty",
    "салон красоты": "Kosmetický salon",
    "парикмахер": "Kadeřník",
    "барбер": "Barber",
    "косметология": "Kosmetologie",
    "массаж": "Masáž"
  },
  es: {
    "ногти": "Uñas",
    "салон красоты": "Salón de belleza",
    "парикмахер": "Peluquero",
    "барбер": "Barbero",
    "косметология": "Cosmetología",
    "массаж": "Masaje"
  },
  de: {
    "ногти": "Nägel",
    "салон красоты": "Beauty-Salon",
    "парикмахер": "Friseur",
    "барбер": "Barber",
    "косметология": "Kosmetik",
    "массаж": "Massage"
  }
};

function localizeBusinessCategory(category: string, language: SiteLanguage) {
  return businessCategoryCopy[language][category.trim().toLowerCase()] ?? category;
}

export async function generateMetadata({
  params
}: LocalizedBusinessPageProps): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isSiteLanguage(lang)) {
    return {};
  }

  const profile = await getPublicBusinessProfile(id);

  if (!profile) {
    return buildMetadata(
      `/${lang}/businesses/${id}`,
      {
        title: "Timviz",
        description: businessSeoCopy[lang].fallbackDescription
      },
      lang,
      { noIndex: true }
    );
  }

  const category = localizeBusinessCategory(profile.business.categories[0] || "Timviz", lang);

  return {
    ...buildMetadata(
      `/${lang}/businesses/${profile.publicPathId}`,
      {
        title: `${profile.business.name} — ${category}`,
        description: businessSeoCopy[lang].description(profile.business.name)
      },
      lang
    ),
    alternates: buildLanguageAlternates(`/businesses/${profile.publicPathId}`, lang)
  };
}

export default async function LocalizedBusinessPage({
  params
}: LocalizedBusinessPageProps) {
  const { lang, id } = await params;
  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const profile = await getPublicBusinessProfile(id);

  if (!profile) {
    notFound();
  }

  return (
    <BusinessView
      business={profile.business}
      services={profile.services}
      bookings={profile.bookings}
      image={profile.image}
      photos={profile.photos}
      team={profile.team}
      initialLanguage={lang as SiteLanguage}
      returnPath={getLocalizedPath(lang as SiteLanguage, `/businesses/${profile.publicPathId}`)}
    />
  );
}
