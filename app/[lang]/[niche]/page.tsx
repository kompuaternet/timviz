import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandLogo from "../../BrandLogo";
import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import { nichePageBySlug, nichePages, type NicheSlug } from "../../../lib/niche-pages";
import { buildLanguageAlternates, buildMetadata } from "../../../lib/seo";
import { getLocalizedPath, isSiteLanguage, siteLanguages, type SiteLanguage } from "../../../lib/site-language";

type LocalizedNichePageProps = {
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
  return siteLanguages.flatMap((lang) => nichePages.map((item) => ({ lang, niche: item.slug })));
}

export async function generateMetadata({ params }: LocalizedNichePageProps): Promise<Metadata> {
  const { lang, niche } = await params;
  if (!isSiteLanguage(lang) || !isNicheSlug(niche)) return {};

  const metadata = buildMetadata(`/${lang}/${niche}`, nichePageBySlug[niche].seo[lang], lang);
  return {
    ...metadata,
    alternates: buildLanguageAlternates(`/${niche}`, lang)
  };
}

export default async function LocalizedNichePage({ params }: LocalizedNichePageProps) {
  const { lang, niche } = await params;
  if (!isSiteLanguage(lang) || !isNicheSlug(niche)) {
    notFound();
  }

  const language = lang as SiteLanguage;
  const item = nichePageBySlug[niche];
  const t = pageCopy[language];
  const content = item.page[language];
  const related = nichePages.filter((entry) => entry.slug !== niche);

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
        <span>{item.card[language].icon}</span>
        <h1>{content.h1}</h1>
        <p>{content.lead}</p>
      </section>

      <section className="niche-page-content">
        {content.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

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

      <section className="niche-page-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaText}</p>
        <a className="business-primary" href="/pro/create-account">{t.ctaButton}</a>
      </section>
    </main>
  );
}
