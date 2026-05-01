import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BarberLanding, { buildBarberMetadata } from "../barber-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") return {};
  return buildBarberMetadata(lang, "/uk/dlya-barberiv");
}

export default async function BarberUkRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") notFound();
  return <BarberLanding language={lang} />;
}
