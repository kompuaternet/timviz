import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HairdresserLanding, { buildHairdresserMetadata } from "../hairdresser-page";
import LocalizedNichePage, { generateMetadata as generateLocalizedNicheMetadata } from "../[niche]/page";
import { isEnglishSlugLanguage, isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || !isEnglishSlugLanguage(lang)) return {};
  if (lang !== "en") return generateLocalizedNicheMetadata({ params: Promise.resolve({ lang, niche: "for-hairdressers" }) });
  return buildHairdresserMetadata(lang, `/${lang}/for-hairdressers`);
}

export default async function HairdresserEnRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || !isEnglishSlugLanguage(lang)) notFound();
  if (lang !== "en") return <LocalizedNichePage params={Promise.resolve({ lang, niche: "for-hairdressers" })} />;
  return <HairdresserLanding language={lang} />;
}
