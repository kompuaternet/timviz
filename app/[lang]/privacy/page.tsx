import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicLegalPage from "../../PublicLegalPage";
import { buildLegalMetadata, legalCopy } from "../../../lib/legal";
import { isSiteLanguage } from "../../../lib/site-language";

type LegalPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    return {};
  }

  return buildLegalMetadata("privacy", lang);
}

export default async function PrivacyPage({ params }: LegalPageProps) {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const copy = legalCopy.privacy[lang];
  return <PublicLegalPage copy={copy} language={lang} />;
}
