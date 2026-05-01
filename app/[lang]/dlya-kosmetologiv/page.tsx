import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CosmetologistLanding, { buildCosmetologistMetadata } from "../cosmetologist-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") return {};
  return buildCosmetologistMetadata(lang, "/uk/dlya-kosmetologiv");
}

export default async function CosmetologistUkRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") notFound();
  return <CosmetologistLanding language={lang} />;
}
