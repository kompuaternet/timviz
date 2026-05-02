import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessLanding from "../../for-business/BusinessLanding";
import { buildLanguageAlternates, buildMetadata, seoCopy } from "../../../lib/seo";
import { isSiteLanguage, siteLanguages, type SiteLanguage } from "../../../lib/site-language";

export const revalidate = 300;
export const dynamicParams = false;

type LocalizedForBusinessPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export function generateStaticParams() {
  return siteLanguages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params
}: LocalizedForBusinessPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) {
    return {};
  }

  const metadata = buildMetadata(`/${lang}/for-business`, seoCopy.forBusiness[lang], lang);
  return {
    ...metadata,
    alternates: buildLanguageAlternates("/for-business", lang)
  };
}

export default async function LocalizedForBusinessPage({
  params
}: LocalizedForBusinessPageProps) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) {
    notFound();
  }

  return <BusinessLanding initialLanguage={lang as SiteLanguage} />;
}
