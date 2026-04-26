import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessView from "../../../businesses/[id]/BusinessView";
import { getPublicBusinessProfile } from "../../../../lib/public-business";
import { buildLanguageAlternates, buildMetadata } from "../../../../lib/seo";
import { getLocalizedPath, isSiteLanguage, type SiteLanguage } from "../../../../lib/site-language";

export const dynamic = "force-dynamic";

type LocalizedBusinessPageProps = {
  params: Promise<{
    lang: string;
    id: string;
  }>;
};

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
        description: "Business page on Timviz."
      },
      lang,
      { noIndex: true }
    );
  }

  const category = profile.business.categories[0] || "Timviz";

  return {
    ...buildMetadata(
      `/${lang}/businesses/${id}`,
      {
        title:
          lang === "uk"
            ? `${profile.business.name} — ${category}`
            : lang === "en"
              ? `${profile.business.name} — ${category}`
              : `${profile.business.name} — ${category}`,
        description:
          lang === "uk"
            ? `${profile.business.name}. Послуги, адреса та онлайн-запис у Timviz.`
            : lang === "en"
              ? `${profile.business.name}. Services, address and online booking on Timviz.`
              : `${profile.business.name}. Услуги, адрес и онлайн-запись в Timviz.`
      },
      lang
    ),
    alternates: buildLanguageAlternates(`/businesses/${id}`, lang)
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
      initialLanguage={lang as SiteLanguage}
      returnPath={getLocalizedPath(lang as SiteLanguage, `/businesses/${id}`)}
    />
  );
}
