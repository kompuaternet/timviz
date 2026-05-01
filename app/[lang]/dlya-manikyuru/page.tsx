import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ManicureLanding, { buildManicureMetadata } from "../manicure-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") return {};
  return buildManicureMetadata(lang, "/uk/dlya-manikyuru");
}

export default async function ManicureUkRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "uk") notFound();
  return <ManicureLanding language={lang} />;
}
