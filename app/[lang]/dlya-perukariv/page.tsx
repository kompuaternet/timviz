import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HairdresserLanding, { buildHairdresserMetadata } from "../hairdresser-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") return {};
  return buildHairdresserMetadata(lang, "/uk/dlya-perukariv");
}

export default async function HairdresserUkRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") notFound();
  return <HairdresserLanding language={lang} />;
}
