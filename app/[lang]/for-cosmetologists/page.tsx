import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CosmetologistLanding, { buildCosmetologistMetadata } from "../cosmetologist-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") return {};
  return buildCosmetologistMetadata(lang, "/en/for-cosmetologists");
}

export default async function CosmetologistEnRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") notFound();
  return <CosmetologistLanding language={lang} />;
}
