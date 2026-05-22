import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicLegalPage from "../../PublicLegalPage";
import { buildLegalMetadata, legalCopy } from "../../../lib/legal";
import { isSiteLanguage } from "../../../lib/site-language";

type LegalPageProps = {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ source?: string }>;
};

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { lang } = await params;
  return isSiteLanguage(lang) ? buildLegalMetadata("support", lang) : {};
}

export default async function SupportPage({ params, searchParams }: LegalPageProps) {
  const { lang } = await params;
  const query = await searchParams;
  if (!isSiteLanguage(lang)) notFound();
  return <PublicLegalPage copy={legalCopy.support[lang]} language={lang} iosSafe={query?.source === "ios"} />;
}
