import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ForMastersLanding from "../../for-masters/ForMastersLanding";
import { forMastersSeoCopy } from "../../../lib/for-masters-seo";
import { buildLanguageAlternates, buildMetadata } from "../../../lib/seo";
import { isSiteLanguage, siteLanguages, type SiteLanguage } from "../../../lib/site-language";

export const revalidate = 300;
export const dynamicParams = false;

type LocalizedForMastersPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export function generateStaticParams() {
  return siteLanguages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params
}: LocalizedForMastersPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) {
    return {};
  }

  const language = lang as SiteLanguage;
  const metadata = buildMetadata(`/${language}/for-masters`, forMastersSeoCopy[language], language);
  return {
    ...metadata,
    alternates: buildLanguageAlternates("/for-masters", language)
  };
}

export default async function LocalizedForMastersPage({
  params
}: LocalizedForMastersPageProps) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) {
    notFound();
  }

  return <ForMastersLanding language={lang as SiteLanguage} />;
}
