import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MassageLanding, { buildMassageMetadata } from "../massage-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") return {};
  return buildMassageMetadata(lang, "/en/for-massage-therapists");
}

export default async function MassageEnRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") notFound();
  return <MassageLanding language={lang} />;
}
