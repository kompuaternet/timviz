import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ManicureLanding, { buildManicureMetadata } from "../manicure-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") return {};
  return buildManicureMetadata(lang, "/en/for-nail-technicians");
}

export default async function ManicureEnRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "en") notFound();
  return <ManicureLanding language={lang} />;
}
