import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicHome from "../PublicHome";
import { getPublicHomeStats } from "../../lib/public-home-stats";
import { getPublicSearchIndex } from "../../lib/public-search";
import { buildLanguageAlternates, buildMetadata, seoCopy } from "../../lib/seo";
import { isSiteLanguage, type SiteLanguage } from "../../lib/site-language";

export const revalidate = 60;

type LocalizedHomePageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export async function generateMetadata({
  params
}: LocalizedHomePageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    return {};
  }

  const metadata = buildMetadata(`/${lang}`, seoCopy.home[lang], lang);
  return {
    ...metadata,
    alternates: buildLanguageAlternates("/", lang)
  };
}

export default async function LocalizedHomePage({ params }: LocalizedHomePageProps) {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const [searchIndex, stats] = await Promise.all([getPublicSearchIndex(), getPublicHomeStats()]);
  return <PublicHome searchIndex={searchIndex} stats={stats} initialLanguage={lang as SiteLanguage} />;
}
