import Link from "next/link";
import BrandLogo from "./BrandLogo";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import PublicHeaderAuthMenu from "./PublicHeaderAuthMenu";
import { getLocalizedPath, type SiteLanguage } from "../lib/site-language";
import type { legalCopy } from "../lib/legal";

type LegalCopy = (typeof legalCopy)[keyof typeof legalCopy]["ru"];

const chromeCopy = {
  ru: {
    navAria: "Главное меню",
    login: "Войти",
    clientLogin: "Вход для клиента",
    create: "Создать профиль компании",
    menu: "Меню",
    clients: "Для клиентов",
    browse: "Поиск профилей",
    clientAuth: "Вход или регистрация",
    business: "Для бизнеса",
    dashboard: "Войти в кабинет",
    businessLogin: "Вход для бизнеса",
    features: "Возможности для бизнеса",
    about: "О Timviz",
    catalog: "Поиск профилей",
    legal: "Юридическая информация",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    refund: "Политика возвратов",
    contact: "Контакты",
    support: "Поддержка"
  },
  uk: {
    navAria: "Головне меню",
    login: "Увійти",
    clientLogin: "Вхід для клієнта",
    create: "Створити профіль компанії",
    menu: "Меню",
    clients: "Для клієнтів",
    browse: "Пошук профілів",
    clientAuth: "Вхід або реєстрація",
    business: "Для бізнесу",
    dashboard: "Увійти в кабінет",
    businessLogin: "Вхід для бізнесу",
    features: "Можливості для бізнесу",
    about: "Про Timviz",
    catalog: "Пошук профілів",
    legal: "Юридична інформація",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    refund: "Політика повернень",
    contact: "Контакти",
    support: "Підтримка"
  },
  en: {
    navAria: "Main menu",
    login: "Log in",
    clientLogin: "Client sign in",
    create: "Create company profile",
    menu: "Menu",
    clients: "For clients",
    browse: "Search profiles",
    clientAuth: "Log in or register",
    business: "For business",
    dashboard: "Open dashboard",
    businessLogin: "Business sign in",
    features: "Business features",
    about: "About Timviz",
    catalog: "Profile search",
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of use",
    refund: "Refund policy",
    contact: "Contact",
    support: "Support"
  }
} satisfies Record<SiteLanguage, Record<string, string>>;

type PublicLegalPageProps = {
  copy: LegalCopy;
  language: SiteLanguage;
  iosSafe?: boolean;
};

const iosUnsafePattern = /monobank|website payments|website payment|платеж[а-яё\s]*на сайте|платежі[а-яіїєґ\s]*на сайті|оплат[а-яё\s]*на сайте|оплат[а-яіїєґ\s]*на сайті/i;

function getVisibleSections(copy: LegalCopy, iosSafe?: boolean) {
  if (!iosSafe) return copy.sections;
  return copy.sections
    .filter((section) => !iosUnsafePattern.test(section.title))
    .map((section) => ({
      ...section,
      paragraphs: section.paragraphs.filter((paragraph) => !iosUnsafePattern.test(paragraph))
    }))
    .filter((section) => section.paragraphs.length > 0);
}

export default function PublicLegalPage({ copy, language, iosSafe }: PublicLegalPageProps) {
  const t = chromeCopy[language];
  const sections = getVisibleSections(copy, iosSafe);

  return (
    <main className="public-home legal-page">
      <header className="public-header">
        <Link className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></Link>
        <nav className="public-nav" aria-label={t.navAria}>
          <PublicHeaderAuthMenu language={language} />
          <Link href={getLocalizedPath(language, "/for-business")} className="public-company-button">{t.create}</Link>
          <details className="public-menu">
            <summary>
              <span>{t.menu}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <strong>{t.clients}</strong>
              <Link href={getLocalizedPath(language, "/catalog")}>{t.browse}</Link>
              <Link href={getLocalizedPath(language, "/account")}>{t.clientAuth}</Link>
              <Link href={getLocalizedPath(language, "/privacy")}>{t.privacy}</Link>
              <Link href={getLocalizedPath(language, "/terms")}>{t.terms}</Link>
              <Link href={getLocalizedPath(language, "/refund-policy")}>{t.refund}</Link>
              <Link href={getLocalizedPath(language, "/contact")}>{t.contact}</Link>
              <hr />
              <strong>{t.business}</strong>
              <Link href={getLocalizedPath(language, "/for-business")}>{t.create}</Link>
              <Link href="/pro/login">{t.dashboard}</Link>
              <Link href={getLocalizedPath(language, "/for-business")}>{t.features}</Link>
            </div>
          </details>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="legal-hero">
        <div className="legal-hero-glow" />
        <div className="legal-hero-copy">
          <span>{copy.eyebrow}</span>
          <h1>{copy.heading}</h1>
          <p>{copy.intro}</p>
          <p className="legal-updated">Updated: May 14, 2026 · Support: adm@timviz.com · Timviz SaaS appointment scheduling software.</p>
        </div>
      </section>

      <section className="legal-content">
        {sections.map((section) => (
          <article className="legal-card" key={section.title}>
            <h2>{section.title}</h2>
            <div className="legal-card-body">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>

      <footer className="public-footer legal-footer">
        <div>
          <Link className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></Link>
        </div>
        <div>
          <h3>{t.about}</h3>
          <Link href={getLocalizedPath(language, "/catalog")}>{t.catalog}</Link>
          <Link href={getLocalizedPath(language, "/for-business")}>{t.features}</Link>
        </div>
        <div>
          <h3>{t.business}</h3>
          <Link href={getLocalizedPath(language, "/for-business")}>{t.create}</Link>
          <Link href="/pro/login">{t.login}</Link>
        </div>
        <div>
          <h3>{t.legal}</h3>
          <Link href={getLocalizedPath(language, "/privacy")}>{t.privacy}</Link>
          <Link href={getLocalizedPath(language, "/terms")}>{t.terms}</Link>
          <Link href={getLocalizedPath(language, "/refund-policy")}>{t.refund}</Link>
          <Link href={getLocalizedPath(language, "/contact")}>{t.contact}</Link>
          <a href="mailto:adm@timviz.com">{t.support}: adm@timviz.com</a>
        </div>
      </footer>
    </main>
  );
}
