import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MassageLanding, { buildMassageMetadata } from "../massage-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") return {};
  return buildMassageMetadata(lang, "/ru/dlya-massazhistov");
}

export default async function MassageRuRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") notFound();
  return <MassageLanding language={lang} />;
}
