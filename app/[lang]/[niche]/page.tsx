import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandLogo from "../../BrandLogo";
import BusinessIcon from "../../BusinessIcon";
import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import {
  getAllNicheParams,
  getNicheKeyBySlug,
  getNicheSlug,
  nicheCards,
  nicheContent,
  nicheKeys,
  nicheSeo
} from "../../../lib/niche-pages";
import {
  forBusinessFeatureBySlug,
  forBusinessFeaturePages,
  isFeatureSlug
} from "../../../lib/for-business-seo-pages";
import { buildMetadata } from "../../../lib/seo";
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
    otherTitle: "Другие направления",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами"
  },
  uk: {
    home: "Головна",
    forBusiness: "Для бізнесу",
    ctaTitle: "Запустіть онлайн-запис із Timviz",
    ctaText: "Створіть профіль, додайте послуги й приймайте записи без хаосу в месенджерах.",
    ctaButton: "Створити профіль компанії",
    otherTitle: "Інші напрямки",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    ctaTitle: "Launch online booking with Timviz",
    ctaText: "Create your profile, add services and accept bookings with less manual admin.",
    ctaButton: "Create company profile",
    otherTitle: "Other directions",
    privacy: "Privacy policy",
    terms: "Terms of use",
    footerText: "Timviz for business · online client booking and service management"
  }
} satisfies Record<SiteLanguage, Record<string, string>>;

export async function generateStaticParams() {
  return siteLanguages.flatMap((lang) => [
    ...getAllNicheParams().filter((item) => item.lang === lang).map((item) => ({ lang, niche: item.niche })),
    ...forBusinessFeaturePages.map((item) => ({ lang, niche: item.slug }))
  ]);
}

export async function generateMetadata({ params }: LocalizedSeoPageProps): Promise<Metadata> {
  const { lang, niche } = await params;
  if (!isSiteLanguage(lang)) return {};

  const nicheKey = getNicheKeyBySlug(lang, niche);
  const featurePage = isFeatureSlug(niche) ? forBusinessFeatureBySlug[niche] : null;
  if (!nicheKey && !featurePage) {
    return {};
  }

  const pathname = `/${lang}/${niche}`;
  const seoCopy = nicheKey ? nicheSeo[nicheKey][lang] : featurePage!.seo[lang];
  const metadata = buildMetadata(pathname, seoCopy, lang);
  return {
    ...metadata,
    alternates: nicheKey
      ? {
          canonical: `https://timviz.com${pathname}`,
          languages: {
            uk: `https://timviz.com/uk/${getNicheSlug("uk", nicheKey)}`,
            ru: `https://timviz.com/ru/${getNicheSlug("ru", nicheKey)}`,
            en: `https://timviz.com/en/${getNicheSlug("en", nicheKey)}`,
            "x-default": `https://timviz.com/en/${getNicheSlug("en", nicheKey)}`
          }
        }
      : metadata.alternates
  };
}

export default async function LocalizedNichePage({ params }: LocalizedSeoPageProps) {
  const { lang, niche } = await params;
  const nicheKey = isSiteLanguage(lang) ? getNicheKeyBySlug(lang, niche) : null;
  const featurePage = isFeatureSlug(niche) ? forBusinessFeatureBySlug[niche] : null;

  if (!isSiteLanguage(lang) || (!nicheKey && !featurePage)) {
    notFound();
  }

  const language = lang as SiteLanguage;
  const t = pageCopy[language];
  const isNichePage = Boolean(nicheKey);
  const content = nicheKey ? nicheContent[nicheKey][language] : featurePage!.copy[language];
  const related = nicheKey ? nicheKeys.filter((key) => key !== nicheKey) : [];
  const iconName = nicheKey ?? "default";

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
        <span className="niche-page-hero-icon"><BusinessIcon name={iconName} className="niche-page-hero-icon-svg" /></span>
        <h1>{content.h1}</h1>
        <p>{content.lead}</p>
      </section>

      <section className="niche-page-content">
        {content.body.map((paragraph: string) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      {isNichePage ? (
        <section className="niche-links-section niche-links-section--inner">
          <div className="niche-links-head">
            <h2>{t.otherTitle}</h2>
          </div>
          <div className="niche-links-grid">
            {related.map((key) => {
              const card = nicheCards[key][language];
              return (
                <a className="niche-link-card" href={getLocalizedPath(language, `/${getNicheSlug(language, key)}`)} key={key}>
                  <span className="niche-link-icon" aria-hidden="true">
                    <BusinessIcon name={key} className="niche-link-icon-svg" />
                  </span>
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

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footerText}</span>
        <div className="business-footer-links">
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
        </div>
      </footer>
    </main>
  );
}
