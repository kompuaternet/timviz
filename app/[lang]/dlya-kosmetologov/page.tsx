import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CosmetologistLanding, { buildCosmetologistMetadata } from "../cosmetologist-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") return {};
  return buildCosmetologistMetadata(lang, "/ru/dlya-kosmetologov");
}

export default async function CosmetologistRuRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") notFound();
  return <CosmetologistLanding language={lang} />;
}
