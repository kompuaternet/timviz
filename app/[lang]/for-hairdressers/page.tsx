import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HairdresserLanding, { buildHairdresserMetadata } from "../hairdresser-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") return {};
  return buildHairdresserMetadata(lang, "/en/for-hairdressers");
}

export default async function HairdresserEnRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") notFound();
  return <HairdresserLanding language={lang} />;
}
