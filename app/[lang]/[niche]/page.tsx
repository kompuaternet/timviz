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
  getFeaturePageCopy,
  getFeaturePageSeo,
  isFeatureSlug
} from "../../../lib/for-business-seo-pages";
import { buildMetadata } from "../../../lib/seo";
import { getLocalizedPath, isSiteLanguage, publicFooterLabels, siteLanguages, type SiteLanguage, withEnglishFallback } from "../../../lib/site-language";
import { siteUrl } from "../../../lib/seo";

type LocalizedSeoPageProps = {
  params: Promise<{ lang: string; niche: string }>;
};

const pageCopy = withEnglishFallback<Record<string, string>>({
  ru: {
    home: "Главная",
    forBusiness: "Бизнесу",
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
    forBusiness: "Бізнесу",
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
}) satisfies Record<SiteLanguage, Record<string, string>>;

Object.assign(pageCopy, {
  fr: {
    home: "Accueil",
    forBusiness: "Pour les pros",
    ctaTitle: "Lancez la réservation en ligne avec Timviz",
    ctaText: "Créez votre profil, ajoutez vos services et acceptez les réservations avec moins d'administration manuelle.",
    ctaButton: "Créer un profil d'entreprise",
    otherTitle: "Autres secteurs",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    footerText: "Timviz pour les pros · réservation client en ligne et gestion des services"
  },
  pl: {
    home: "Strona główna",
    forBusiness: "Dla firm",
    ctaTitle: "Uruchom rezerwacje online z Timviz",
    ctaText: "Utwórz profil, dodaj usługi i przyjmuj rezerwacje bez chaosu w komunikatorach.",
    ctaButton: "Utwórz profil firmy",
    otherTitle: "Inne branże",
    privacy: "Polityka prywatności",
    terms: "Warunki korzystania",
    footerText: "Timviz dla firm · rezerwacje klientów online i zarządzanie usługami"
  },
  cs: {
    home: "Domů",
    forBusiness: "Pro firmy",
    ctaTitle: "Spusťte online rezervace s Timviz",
    ctaText: "Vytvořte profil, přidejte služby a přijímejte rezervace bez chaosu ve zprávách.",
    ctaButton: "Vytvořit profil firmy",
    otherTitle: "Další obory",
    privacy: "Zásady ochrany osobních údajů",
    terms: "Podmínky použití",
    footerText: "Timviz pro firmy · online rezervace klientů a správa služeb"
  },
  es: {
    home: "Inicio",
    forBusiness: "Para empresas",
    ctaTitle: "Activa las reservas online con Timviz",
    ctaText: "Crea tu perfil, añade servicios y recibe reservas con menos gestión manual.",
    ctaButton: "Crear perfil de empresa",
    otherTitle: "Otros sectores",
    privacy: "Política de privacidad",
    terms: "Condiciones de uso",
    footerText: "Timviz para empresas · reservas online y gestión de servicios"
  },
  de: {
    home: "Startseite",
    forBusiness: "Für Unternehmen",
    ctaTitle: "Starten Sie Online-Buchungen mit Timviz",
    ctaText: "Erstellen Sie Ihr Profil, fügen Sie Leistungen hinzu und nehmen Sie Buchungen ohne Nachrichtenchaos an.",
    ctaButton: "Unternehmensprofil erstellen",
    otherTitle: "Weitere Bereiche",
    privacy: "Datenschutz",
    terms: "Nutzungsbedingungen",
    footerText: "Timviz für Unternehmen · Online-Kundenbuchung und Leistungsverwaltung"
  }
});

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
  const seoCopy = nicheKey ? nicheSeo[nicheKey][lang] : getFeaturePageSeo(featurePage!, lang);
  const metadata = buildMetadata(pathname, seoCopy, lang);
  return {
    ...metadata,
    alternates: nicheKey
      ? {
          canonical: `${siteUrl}${pathname}`,
          languages: {
            ...Object.fromEntries(
              siteLanguages.map((language) => [
                language,
                `${siteUrl}${getLocalizedPath(language, `/${getNicheSlug(language, nicheKey)}`)}`
              ])
            ),
            "x-default": `${siteUrl}${getLocalizedPath("en", `/${getNicheSlug("en", nicheKey)}`)}`
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
  const footerLabels = publicFooterLabels[language];
  const isNichePage = Boolean(nicheKey);
  const content = nicheKey ? nicheContent[nicheKey][language] : getFeaturePageCopy(featurePage!, language);
  const related = nicheKey ? nicheKeys.filter((key) => key !== nicheKey) : [];
  const iconName = nicheKey ?? "default";

  return (
    <main className="niche-page">
      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.forBusiness}>
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href="/pro/login">Pro</a>
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
          <a href={getLocalizedPath(language, "/pricing")}>{footerLabels.pricing}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
          <a href={getLocalizedPath(language, "/refund-policy")}>{footerLabels.refund}</a>
          <a href={getLocalizedPath(language, "/contact")}>{footerLabels.contact}</a>
          <a href="mailto:adm@timviz.com">adm@timviz.com</a>
        </div>
      </footer>
    </main>
  );
}
