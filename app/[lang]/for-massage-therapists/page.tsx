import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MassageLanding, { buildMassageMetadata } from "../massage-page";
import LocalizedNichePage, { generateMetadata as generateLocalizedNicheMetadata } from "../[niche]/page";
import { isEnglishSlugLanguage, isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || !isEnglishSlugLanguage(lang)) return {};
  if (lang !== "en") return generateLocalizedNicheMetadata({ params: Promise.resolve({ lang, niche: "for-massage-therapists" }) });
  return buildMassageMetadata(lang, `/${lang}/for-massage-therapists`);
}

export default async function MassageEnRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || !isEnglishSlugLanguage(lang)) notFound();
  if (lang !== "en") return <LocalizedNichePage params={Promise.resolve({ lang, niche: "for-massage-therapists" })} />;
  return <MassageLanding language={lang} />;
}
