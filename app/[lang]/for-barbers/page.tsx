import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BarberLanding, { buildBarberMetadata } from "../barber-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") return {};
  return buildBarberMetadata(lang, "/en/for-barbers");
}

export default async function BarberEnRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") notFound();
  return <BarberLanding language={lang} />;
}
