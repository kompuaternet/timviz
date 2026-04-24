import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildLegalMetadata, legalCopy } from "../../../lib/legal";
import { isSiteLanguage } from "../../../lib/site-language";

type LegalPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    return {};
  }

  return buildLegalMetadata("terms", lang);
}

export default async function TermsPage({ params }: LegalPageProps) {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const copy = legalCopy.terms[lang];

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px 72px" }}>
      <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6f61ff" }}>
        {copy.eyebrow}
      </div>
      <h1 style={{ margin: 0, fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: 1.02 }}>
        {copy.heading}
      </h1>
      <p style={{ maxWidth: 760, marginTop: 18, fontSize: 18, lineHeight: 1.65, color: "#4b5563" }}>
        {copy.intro}
      </p>

      <div style={{ display: "grid", gap: 28, marginTop: 40 }}>
        {copy.sections.map((section) => (
          <section key={section.title} style={{ padding: 24, border: "1px solid rgba(15, 23, 42, 0.08)", borderRadius: 8, background: "rgba(255, 255, 255, 0.82)" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 28, lineHeight: 1.15 }}>{section.title}</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0, fontSize: 17, lineHeight: 1.7, color: "#475569" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
