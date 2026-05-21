import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicLegalPage from "../../PublicLegalPage";
import { buildLegalMetadata, legalCopy } from "../../../lib/legal";
import { isSiteLanguage } from "../../../lib/site-language";

type LegalPageProps = {
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { lang } = await params;
  return isSiteLanguage(lang) ? buildLegalMetadata("subscription-terms", lang) : {};
}

export default async function SubscriptionTermsPage({ params }: LegalPageProps) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();
  return <PublicLegalPage copy={legalCopy["subscription-terms"][lang]} language={lang} />;
}
