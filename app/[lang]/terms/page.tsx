import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicLegalPage from "../../PublicLegalPage";
import { buildLegalMetadata, legalCopy } from "../../../lib/legal";
import { isSiteLanguage } from "../../../lib/site-language";

type LegalPageProps = {
  params: Promise<{
    lang: string;
  }>;
  searchParams?: Promise<{
    source?: string;
  }>;
};

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    return {};
  }

  return buildLegalMetadata("terms", lang);
}

export default async function TermsPage({ params, searchParams }: LegalPageProps) {
  const { lang } = await params;
  const query = await searchParams;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const copy = legalCopy.terms[lang];
  return <PublicLegalPage copy={copy} language={lang} iosSafe={query?.source === "ios"} />;
}
