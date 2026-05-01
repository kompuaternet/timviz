import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HairdresserLanding, { buildHairdresserMetadata } from "../hairdresser-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") return {};
  return buildHairdresserMetadata(lang, "/ru/dlya-parikmaherov");
}

export default async function HairdresserRuRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") notFound();
  return <HairdresserLanding language={lang} />;
}
