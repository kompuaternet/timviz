import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessLanding from "../../for-business/BusinessLanding";
import { buildLanguageAlternates, buildMetadata, seoCopy } from "../../../lib/seo";
import { isSiteLanguage, type SiteLanguage } from "../../../lib/site-language";

type LocalizedForBusinessPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

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
