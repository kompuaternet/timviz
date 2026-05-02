import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import CatalogView from "../../catalog/CatalogView";
import { buildLanguageAlternates, buildMetadata, seoCopy } from "../../../lib/seo";
import { isSiteLanguage, siteLanguages, type SiteLanguage } from "../../../lib/site-language";

export const revalidate = 300;
export const dynamicParams = false;

type LocalizedCatalogPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export function generateStaticParams() {
  return siteLanguages.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params
}: LocalizedCatalogPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) {
    return {};
  }

  const baseCopy = seoCopy.catalog[lang];

  const metadata = buildMetadata(
    `/${lang}/catalog`,
    {
      title: baseCopy.title,
      description: baseCopy.description,
      keywords: baseCopy.keywords
    },
    lang
  );

  return {
    ...metadata,
    alternates: buildLanguageAlternates("/catalog", lang)
  };
}

export default async function LocalizedCatalogPage({
  params
}: LocalizedCatalogPageProps) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) {
    notFound();
  }

  return (
    <Suspense fallback={<main className="company-page catalog-page" />}>
      <CatalogView
        initialLanguage={lang as SiteLanguage}
      />
    </Suspense>
  );
}
