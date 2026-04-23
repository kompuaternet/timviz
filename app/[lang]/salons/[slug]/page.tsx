import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSalonBySlug, getLocalizedText } from "../../../../data/mock-data";
import { getAllBookings } from "../../../../lib/bookings";
import { buildLanguageAlternates, buildMetadata } from "../../../../lib/seo";
import { isSiteLanguage, type SiteLanguage } from "../../../../lib/site-language";
import SalonView from "../../../salons/[slug]/SalonView";

export const dynamic = "force-dynamic";

type LocalizedSalonPageProps = {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
};

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
        description: "Online booking on Timviz."
      },
      lang,
      { noIndex: true }
    );
  }

  const city = getLocalizedText(salon.city, lang);
  const category = getLocalizedText(salon.category, lang);
  const description = getLocalizedText(salon.description, lang);

  const metadata = buildMetadata(
    `/${lang}/salons/${slug}`,
    {
      title:
        lang === "uk"
          ? `${salon.name} — ${category} у ${city}`
          : lang === "en"
            ? `${salon.name} — ${category} in ${city}`
            : `${salon.name} — ${category} в ${city}`,
      description:
        lang === "uk"
          ? `${description} Онлайн-запис у ${salon.name}, адреса, послуги, вільні вікна та ціни в Timviz.`
          : lang === "en"
            ? `${description} See services, address, prices and available booking slots for ${salon.name} on Timviz.`
            : `${description} Онлайн-запись в ${salon.name}, адрес, услуги, свободные окна и цены в Timviz.`,
      keywords: [
        salon.name,
        category,
        city,
        lang === "uk" ? "онлайн-запис" : lang === "en" ? "online booking" : "онлайн-запись",
        lang === "uk" ? "запис на послуги" : lang === "en" ? "service booking" : "запись на услуги"
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
    notFound();
  }

  const bookings = (await getAllBookings()).filter((booking) => booking.salonSlug === slug);
  return <SalonView salon={salon} bookings={bookings} initialLanguage={lang as SiteLanguage} />;
}
