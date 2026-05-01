import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MassageLanding, { buildMassageMetadata } from "../massage-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") return {};
  return buildMassageMetadata(lang, "/uk/dlya-masazhu");
}

export default async function MassageUkRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") notFound();
  return <MassageLanding language={lang} />;
}
