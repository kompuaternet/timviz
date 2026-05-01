import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandLogo from "../../BrandLogo";
import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import { nichePageBySlug, nichePages, type NicheSlug } from "../../../lib/niche-pages";
import {
  forBusinessFeatureBySlug,
  forBusinessFeaturePages,
  isFeatureSlug,
  isNicheAliasSlug,
  nicheAliasToPrimary
} from "../../../lib/for-business-seo-pages";
import { buildLanguageAlternates, buildMetadata } from "../../../lib/seo";
import { getLocalizedPath, isSiteLanguage, siteLanguages, type SiteLanguage } from "../../../lib/site-language";

type LocalizedSeoPageProps = {
  params: Promise<{ lang: string; niche: string }>;
};

const pageCopy = {
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    ctaTitle: "Запустите онлайн-запись с Timviz",
    ctaText: "Создайте профиль, добавьте услуги и принимайте записи без хаоса в мессенджерах.",
    ctaButton: "Создать профиль компании",
    otherTitle: "Другие направления"
  },
  uk: {
    home: "Головна",
    forBusiness: "Для бізнесу",
    ctaTitle: "Запустіть онлайн-запис із Timviz",
    ctaText: "Створіть профіль, додайте послуги й приймайте записи без хаосу в месенджерах.",
    ctaButton: "Створити профіль компанії",
    otherTitle: "Інші напрямки"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    ctaTitle: "Launch online booking with Timviz",
    ctaText: "Create your profile, add services and accept bookings with less manual admin.",
    ctaButton: "Create company profile",
    otherTitle: "Other directions"
  }
} satisfies Record<SiteLanguage, Record<string, string>>;

function isNicheSlug(value: string): value is NicheSlug {
  return value in nichePageBySlug;
}

export async function generateStaticParams() {
  const aliasSlugs = Object.keys(nicheAliasToPrimary);
  return siteLanguages.flatMap((lang) => [
    ...nichePages.map((item) => ({ lang, niche: item.slug })),
    ...forBusinessFeaturePages.map((item) => ({ lang, niche: item.slug })),
    ...aliasSlugs.map((slug) => ({ lang, niche: slug }))
  ]);
}

export async function generateMetadata({ params }: LocalizedSeoPageProps): Promise<Metadata> {
  const { lang, niche } = await params;
  if (!isSiteLanguage(lang)) return {};

  const canonicalSlug = isNicheAliasSlug(niche) ? nicheAliasToPrimary[niche] : niche;
  if (!isNicheSlug(canonicalSlug) && !isFeatureSlug(canonicalSlug)) {
    return {};
  }

  const seoCopy = isNicheSlug(canonicalSlug)
    ? nichePageBySlug[canonicalSlug].seo[lang]
    : forBusinessFeatureBySlug[canonicalSlug].seo[lang];
  const metadata = buildMetadata(`/${lang}/${canonicalSlug}`, seoCopy, lang);
  return {
    ...metadata,
    alternates: buildLanguageAlternates(`/${canonicalSlug}`, lang)
  };
}

export default async function LocalizedNichePage({ params }: LocalizedSeoPageProps) {
  const { lang, niche } = await params;
  const canonicalSlug = isNicheAliasSlug(niche) ? nicheAliasToPrimary[niche] : niche;

  if (!isSiteLanguage(lang) || (!isNicheSlug(canonicalSlug) && !isFeatureSlug(canonicalSlug))) {
    notFound();
  }

  const language = lang as SiteLanguage;
  const t = pageCopy[language];
  const isNichePage = isNicheSlug(canonicalSlug);
  const content = isNichePage
    ? nichePageBySlug[canonicalSlug].page[language]
    : forBusinessFeatureBySlug[canonicalSlug].copy[language];
  const related = isNichePage ? nichePages.filter((entry) => entry.slug !== canonicalSlug) : [];
  const icon = isNichePage ? nichePageBySlug[canonicalSlug].card[language].icon : "⚙";

  return (
    <main className="niche-page">
      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.forBusiness}>
          <a href={getLocalizedPath(language)}>{t.home}</a>
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href="/pro/login">Timviz Pro</a>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="niche-page-hero">
        <span>{icon}</span>
        <h1>{content.h1}</h1>
        <p>{content.lead}</p>
      </section>

      <section className="niche-page-content">
        {content.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      {isNichePage ? (
        <section className="niche-links-section niche-links-section--inner">
          <div className="niche-links-head">
            <h2>{t.otherTitle}</h2>
          </div>
          <div className="niche-links-grid">
            {related.map((entry) => {
              const card = entry.card[language];
              return (
                <a className="niche-link-card" href={getLocalizedPath(language, `/${entry.slug}`)} key={entry.slug}>
                  <span className="niche-link-icon" aria-hidden="true">{card.icon}</span>
                  <h3>{card.shortTitle}</h3>
                  <p>{card.description}</p>
                  <span className="niche-link-arrow" aria-hidden="true">→</span>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="niche-page-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaText}</p>
        <a className="business-primary" href="/pro/create-account">{t.ctaButton}</a>
      </section>
    </main>
  );
}
