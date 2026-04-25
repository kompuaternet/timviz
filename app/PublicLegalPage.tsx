import BrandLogo from "./BrandLogo";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import { getLocalizedPath, type SiteLanguage } from "../lib/site-language";
import type { legalCopy } from "../lib/legal";

type LegalCopy = (typeof legalCopy)["privacy"]["ru"];

const chromeCopy = {
  ru: {
    navAria: "Главное меню",
    login: "Войти",
    create: "Создать профиль компании",
    menu: "Меню",
    clients: "Для клиентов",
    browse: "Посмотреть бизнесы",
    clientAuth: "Вход или регистрация",
    business: "Для бизнеса",
    dashboard: "Войти в кабинет",
    features: "Возможности для бизнеса",
    about: "О Timviz",
    catalog: "Каталог",
    legal: "Юридическая информация",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования"
  },
  uk: {
    navAria: "Головне меню",
    login: "Увійти",
    create: "Створити профіль компанії",
    menu: "Меню",
    clients: "Для клієнтів",
    browse: "Переглянути бізнеси",
    clientAuth: "Вхід або реєстрація",
    business: "Для бізнесу",
    dashboard: "Увійти в кабінет",
    features: "Можливості для бізнесу",
    about: "Про Timviz",
    catalog: "Каталог",
    legal: "Юридична інформація",
    privacy: "Політика конфіденційності",
    terms: "Умови використання"
  },
  en: {
    navAria: "Main menu",
    login: "Log in",
    create: "Create company profile",
    menu: "Menu",
    clients: "For clients",
    browse: "Browse businesses",
    clientAuth: "Log in or register",
    business: "For business",
    dashboard: "Open dashboard",
    features: "Business features",
    about: "About Timviz",
    catalog: "Catalog",
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of use"
  }
} satisfies Record<SiteLanguage, Record<string, string>>;

type PublicLegalPageProps = {
  copy: LegalCopy;
  language: SiteLanguage;
};

export default function PublicLegalPage({ copy, language }: PublicLegalPageProps) {
  const t = chromeCopy[language];

  return (
    <main className="public-home legal-page">
      <header className="public-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="public-nav" aria-label={t.navAria}>
          <a href="/pro/login" className="public-login">{t.login}</a>
          <a href={getLocalizedPath(language, "/for-business")} className="public-company-button">{t.create}</a>
          <details className="public-menu">
            <summary>
              <span>{t.menu}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <strong>{t.clients}</strong>
              <a href={getLocalizedPath(language, "/catalog")}>{t.browse}</a>
              <a href={getLocalizedPath(language, "/catalog")}>{t.clientAuth}</a>
              <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
              <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
              <hr />
              <strong>{t.business}</strong>
              <a href={getLocalizedPath(language, "/for-business")}>{t.create}</a>
              <a href="/pro/login">{t.dashboard}</a>
              <a href={getLocalizedPath(language, "/for-business")}>{t.features}</a>
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
        </div>
      </section>

      <section className="legal-content">
        {copy.sections.map((section) => (
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
          <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        </div>
        <div>
          <h3>{t.about}</h3>
          <a href={getLocalizedPath(language, "/catalog")}>{t.catalog}</a>
          <a href={getLocalizedPath(language, "/for-business")}>{t.features}</a>
        </div>
        <div>
          <h3>{t.business}</h3>
          <a href={getLocalizedPath(language, "/for-business")}>{t.create}</a>
          <a href="/pro/login">{t.login}</a>
        </div>
        <div>
          <h3>{t.legal}</h3>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
        </div>
      </footer>
    </main>
  );
}
