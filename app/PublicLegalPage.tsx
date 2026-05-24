import Link from "next/link";
import BrandLogo from "./BrandLogo";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import PublicHeaderAuthMenu from "./PublicHeaderAuthMenu";
import { getLocalizedPath, publicFooterLabels, type SiteLanguage , withEnglishFallback } from "../lib/site-language";
import type { legalCopy } from "../lib/legal";

type LegalCopy = (typeof legalCopy)[keyof typeof legalCopy]["ru"];

const chromeCopy = withEnglishFallback<Record<string, string>>({
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
    support: "Поддержка",
    updatedLine: "Обновлено: 14 мая 2026 · Поддержка: adm@timviz.com · SaaS-сервис Timviz для онлайн-записи."
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
    support: "Підтримка",
    updatedLine: "Оновлено: 14 травня 2026 · Підтримка: adm@timviz.com · SaaS-сервіс Timviz для онлайн-запису."
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
    support: "Support",
    updatedLine: "Updated: May 14, 2026 · Support: adm@timviz.com · Timviz SaaS appointment scheduling software."
  }
}) satisfies Record<SiteLanguage, Record<string, string>>;

Object.assign(chromeCopy, {
  fr: {
    navAria: "Menu principal",
    login: "Connexion",
    clientLogin: "Connexion client",
    create: "Créer un profil d’entreprise",
    menu: "Menu",
    clients: "Pour les clients",
    browse: "Recherche de profils",
    clientAuth: "Connexion ou inscription",
    business: "Pour les entreprises",
    dashboard: "Ouvrir le tableau de bord",
    businessLogin: "Connexion entreprise",
    features: "Fonctionnalités business",
    about: "À propos de Timviz",
    catalog: "Recherche de profils",
    legal: "Mentions légales",
    privacy: "Politique de confidentialité",
    terms: "Conditions d’utilisation",
    refund: "Politique de remboursement",
    contact: "Contact",
    support: "Assistance",
    updatedLine: "Mis à jour : 14 mai 2026 · Assistance : adm@timviz.com · Logiciel SaaS Timviz pour la réservation en ligne."
  },
  pl: {
    navAria: "Menu główne",
    login: "Zaloguj się",
    clientLogin: "Logowanie klienta",
    create: "Utwórz profil firmy",
    menu: "Menu",
    clients: "Dla klientów",
    browse: "Wyszukiwanie profili",
    clientAuth: "Logowanie lub rejestracja",
    business: "Dla biznesu",
    dashboard: "Otwórz panel",
    businessLogin: "Logowanie firmy",
    features: "Funkcje biznesowe",
    about: "O Timviz",
    catalog: "Wyszukiwanie profili",
    legal: "Informacje prawne",
    privacy: "Polityka prywatności",
    terms: "Warunki korzystania",
    refund: "Polityka zwrotów",
    contact: "Kontakt",
    support: "Pomoc",
    updatedLine: "Zaktualizowano: 14 maja 2026 · Pomoc: adm@timviz.com · SaaS Timviz do rezerwacji online."
  },
  cs: {
    navAria: "Hlavní menu",
    login: "Přihlásit se",
    clientLogin: "Přihlášení klienta",
    create: "Vytvořit profil firmy",
    menu: "Menu",
    clients: "Pro klienty",
    browse: "Vyhledávání profilů",
    clientAuth: "Přihlášení nebo registrace",
    business: "Pro firmy",
    dashboard: "Otevřít panel",
    businessLogin: "Přihlášení firmy",
    features: "Funkce pro firmy",
    about: "O Timviz",
    catalog: "Vyhledávání profilů",
    legal: "Právní informace",
    privacy: "Zásady ochrany osobních údajů",
    terms: "Podmínky použití",
    refund: "Zásady vrácení peněz",
    contact: "Kontakt",
    support: "Podpora",
    updatedLine: "Aktualizováno: 14. května 2026 · Podpora: adm@timviz.com · SaaS Timviz pro online rezervace."
  },
  es: {
    navAria: "Menú principal",
    login: "Iniciar sesión",
    clientLogin: "Acceso de cliente",
    create: "Crear perfil de empresa",
    menu: "Menú",
    clients: "Para clientes",
    browse: "Búsqueda de perfiles",
    clientAuth: "Iniciar sesión o registrarse",
    business: "Para negocios",
    dashboard: "Abrir panel",
    businessLogin: "Acceso de negocio",
    features: "Funciones para negocios",
    about: "Sobre Timviz",
    catalog: "Búsqueda de perfiles",
    legal: "Legal",
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    refund: "Política de reembolso",
    contact: "Contacto",
    support: "Soporte",
    updatedLine: "Actualizado: 14 de mayo de 2026 · Soporte: adm@timviz.com · Software SaaS Timviz para reservas online."
  },
  de: {
    navAria: "Hauptmenü",
    login: "Einloggen",
    clientLogin: "Kundenlogin",
    create: "Firmenprofil erstellen",
    menu: "Menü",
    clients: "Für Kunden",
    browse: "Profilsuche",
    clientAuth: "Einloggen oder registrieren",
    business: "Für Unternehmen",
    dashboard: "Dashboard öffnen",
    businessLogin: "Business-Login",
    features: "Business-Funktionen",
    about: "Über Timviz",
    catalog: "Profilsuche",
    legal: "Rechtliches",
    privacy: "Datenschutzrichtlinie",
    terms: "Nutzungsbedingungen",
    refund: "Rückerstattungsrichtlinie",
    contact: "Kontakt",
    support: "Hilfe",
    updatedLine: "Aktualisiert: 14. Mai 2026 · Hilfe: adm@timviz.com · Timviz SaaS-Software für Online-Buchungen."
  }
});

for (const language of Object.keys(publicFooterLabels) as SiteLanguage[]) {
  chromeCopy[language] = {
    ...chromeCopy[language],
    pricing: publicFooterLabels[language].pricing,
    refund: publicFooterLabels[language].refund,
    contact: publicFooterLabels[language].contact
  };
}

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
            <summary aria-label={t.menu} title={t.menu}>
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
          <p className="legal-updated">{t.updatedLine}</p>
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
