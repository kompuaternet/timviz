import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BarberLanding, { buildBarberMetadata } from "../barber-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") return {};
  return buildBarberMetadata(lang, "/ru/dlya-barberov");
}

export default async function BarberRuRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") notFound();
  return <BarberLanding language={lang} />;
}
