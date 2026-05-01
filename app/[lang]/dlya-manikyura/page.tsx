import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ManicureLanding, { buildManicureMetadata } from "../manicure-page";
import { isSiteLanguage } from "../../../lib/site-language";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") return {};
  return buildManicureMetadata(lang, "/ru/dlya-manikyura");
}

export default async function ManicureRuRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSiteLanguage(lang) || lang !== "ru") notFound();
  return <ManicureLanding language={lang} />;
}
