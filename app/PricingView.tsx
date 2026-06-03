"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import PublicHeaderAuthMenu from "./PublicHeaderAuthMenu";
import { getLocalizedPath, publicFooterLabels, type SiteLanguage , withEnglishFallback } from "../lib/site-language";
import type { PricingCopy, PricingPlanKey } from "../lib/pricing";
import { trackAdsEvent } from "../lib/ads-events";

type PricingViewProps = {
  language: SiteLanguage;
  copy: PricingCopy;
  user: {
    id: string;
    email: string;
  } | null;
};

const planOrder: PricingPlanKey[] = ["free", "monthly", "yearly"];
const MONOBANK_TERMS_URL = "https://monobank.ua/umovy";

const footerCopy = withEnglishFallback<Record<string, string>>({
  ru: {
    about: "Timviz",
    catalog: "Поиск профилей",
    business: "Бизнесу",
    pricing: "Тарифы",
    legal: "Юридическая информация",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    subscription: "Условия подписки",
    refund: "Политика возвратов",
    contact: "Контакты",
    support: "Поддержка"
  },
  uk: {
    about: "Timviz",
    catalog: "Пошук профілів",
    business: "Бізнесу",
    pricing: "Тарифи",
    legal: "Юридична інформація",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    subscription: "Умови підписки",
    refund: "Політика повернень",
    contact: "Контакти",
    support: "Підтримка"
  },
  en: {
    about: "Timviz",
    catalog: "Profile search",
    business: "For business",
    pricing: "Pricing",
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of use",
    subscription: "Subscription terms",
    refund: "Refund policy",
    contact: "Contact",
    support: "Support"
  }
}) satisfies Record<SiteLanguage, Record<string, string>>;

Object.assign(footerCopy, {
  fr: {
    about: "Timviz",
    catalog: "Recherche de profils",
    business: "Pour les entreprises",
    pricing: "Tarifs",
    legal: "Mentions légales",
    privacy: "Politique de confidentialité",
    terms: "Conditions d’utilisation",
    subscription: "Conditions d’abonnement",
    refund: "Politique de remboursement",
    contact: "Contact",
    support: "Support"
  },
  pl: {
    about: "Timviz",
    catalog: "Wyszukiwanie profili",
    business: "Dla biznesu",
    pricing: "Cennik",
    legal: "Informacje prawne",
    privacy: "Polityka prywatności",
    terms: "Warunki korzystania",
    subscription: "Warunki subskrypcji",
    refund: "Polityka zwrotów",
    contact: "Kontakt",
    support: "Pomoc"
  },
  cs: {
    about: "Timviz",
    catalog: "Vyhledávání profilů",
    business: "Pro firmy",
    pricing: "Ceník",
    legal: "Právní informace",
    privacy: "Zásady ochrany osobních údajů",
    terms: "Podmínky použití",
    subscription: "Podmínky předplatného",
    refund: "Zásady vrácení peněz",
    contact: "Kontakt",
    support: "Podpora"
  },
  es: {
    about: "Timviz",
    catalog: "Búsqueda de perfiles",
    business: "Para negocios",
    pricing: "Precios",
    legal: "Legal",
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    subscription: "Condiciones de suscripción",
    refund: "Política de reembolso",
    contact: "Contacto",
    support: "Soporte"
  },
  de: {
    about: "Timviz",
    catalog: "Profilsuche",
    business: "Für Unternehmen",
    pricing: "Preise",
    legal: "Rechtliches",
    privacy: "Datenschutzrichtlinie",
    terms: "Nutzungsbedingungen",
    subscription: "Abo-Bedingungen",
    refund: "Rückerstattungsrichtlinie",
    contact: "Kontakt",
    support: "Support"
  }
});

for (const language of Object.keys(publicFooterLabels) as SiteLanguage[]) {
  footerCopy[language] = {
    ...footerCopy[language],
    pricing: publicFooterLabels[language].pricing,
    refund: publicFooterLabels[language].refund,
    contact: publicFooterLabels[language].contact
  };
}

export default function PricingView({ language, copy, user }: PricingViewProps) {
  const footer = footerCopy[language];
  const [message, setMessage] = useState("");
  const [loadingBilling, setLoadingBilling] = useState<Exclude<PricingPlanKey, "free"> | null>(null);

  useEffect(() => {
    trackAdsEvent("pricing_view", {
      language,
      signed_in: Boolean(user)
    });
  }, [language, user]);

  function goFree() {
    trackAdsEvent("sign_up_start", {
      source: "pricing_free",
      plan: "free",
      language,
      signed_in: Boolean(user)
    });
    window.location.assign(user ? "/pro/calendar" : "/pro/create-account");
  }

  async function openWebBilling(plan: Exclude<PricingPlanKey, "free">) {
    setMessage("");
    const returnTo = `${getLocalizedPath(language, "/pricing")}?plan=${plan}`;
    trackAdsEvent("checkout_start", {
      source: "pricing",
      plan,
      language,
      signed_in: Boolean(user),
      currency: "USD",
      value: plan === "yearly" ? 29 : 3
    });
    if (!user) {
      setMessage(copy.loginRequired);
      window.location.assign(`/pro/login?return_to=${encodeURIComponent(returnTo)}`);
      return;
    }

    setLoadingBilling(plan);
    setMessage(copy.startingCheckout);
    try {
      const response = await fetch("/api/billing/monobank/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing: plan })
      });
      const payload = (await response.json().catch(() => ({}))) as { paymentUrl?: string; pageUrl?: string; error?: string };
      const url = payload.paymentUrl || payload.pageUrl;
      if (!response.ok || !url) {
        throw new Error(copy.billingError);
      }
      trackAdsEvent("checkout_redirect", {
        source: "pricing",
        plan,
        language,
        currency: "USD",
        value: plan === "yearly" ? 29 : 3
      });
      window.location.assign(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.billingError);
      setLoadingBilling(null);
    }
  }

  return (
    <main className="public-home pricing-page">
      <header className="public-header">
        <Link className="public-logo" href={getLocalizedPath(language)}>
          <BrandLogo />
        </Link>
        <nav className="public-nav" aria-label={copy.title}>
          <PublicHeaderAuthMenu language={language} />
          <Link href={getLocalizedPath(language, "/for-business")} className="public-company-button">
            Timviz Pro
          </Link>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="pricing-hero">
        <span>{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
        <div className="pricing-trust-row">
          <strong>{copy.trialBadge}</strong>
          <strong>{copy.cancelAnytime}</strong>
          <strong>{copy.secureBilling}</strong>
        </div>
      </section>

      <section className="pricing-grid" aria-label={copy.title}>
        {planOrder.map((planKey) => {
          const plan = copy.plans[planKey];
          const isYearly = planKey === "yearly";
          return (
            <article className={`pricing-card ${isYearly ? "pricing-card-featured" : ""}`} key={planKey}>
              <div className="pricing-card-head">
                <div>
                  <h2>{plan.name}</h2>
                  <p>{plan.tagline}</p>
                </div>
                {plan.badge ? <span>{plan.badge}</span> : null}
              </div>
              <div className="pricing-price">
                <strong>{plan.price}</strong>
                <span>{plan.billing}</span>
              </div>
              {plan.savings ? <p className="pricing-savings">{plan.savings}</p> : null}
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{copy.features[feature]}</li>
                ))}
              </ul>
              <button
                type="button"
                className={`pricing-button ${isYearly ? "pricing-button-primary" : ""}`}
                onClick={() => (planKey === "free" ? goFree() : void openWebBilling(planKey))}
                disabled={loadingBilling === planKey}
              >
                {copy.buttons[planKey]}
              </button>
            </article>
          );
        })}
      </section>

      <p className="pricing-subscription-notice">
        {copy.subscriptionNotice.prefix}{" "}
        <Link href={getLocalizedPath(language, "/subscription-terms")}>
          {copy.subscriptionNotice.subscriptionTerms}
        </Link>
        {copy.subscriptionNotice.middle}
        <a href={MONOBANK_TERMS_URL} target="_blank" rel="noopener noreferrer">
          {copy.subscriptionNotice.monobankTerms}
        </a>
        {copy.subscriptionNotice.suffix}
      </p>

      {message ? <p className="pricing-message">{message}</p> : null}

      <section className="pricing-faq">
        <h2>{copy.faqTitle}</h2>
        <div>
          {copy.faq.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="public-footer pricing-footer">
        <div>
          <Link className="public-logo" href={getLocalizedPath(language)}>
            <BrandLogo />
          </Link>
          <p>{copy.secureBilling}</p>
        </div>
        <div>
          <h3>{footer.about}</h3>
          <Link href={getLocalizedPath(language, "/catalog")}>{footer.catalog}</Link>
          <Link href={getLocalizedPath(language, "/for-business")}>{footer.business}</Link>
          <Link href={getLocalizedPath(language, "/pricing")}>{footer.pricing}</Link>
        </div>
        <div>
          <h3>{footer.legal}</h3>
          <Link href={getLocalizedPath(language, "/privacy")}>{footer.privacy}</Link>
          <Link href={getLocalizedPath(language, "/terms")}>{footer.terms}</Link>
          <Link href={getLocalizedPath(language, "/refund-policy")}>{footer.refund}</Link>
          <Link href={getLocalizedPath(language, "/contact")}>{footer.contact}</Link>
          <a href="mailto:adm@timviz.com">{footer.support}: adm@timviz.com</a>
        </div>
      </footer>
    </main>
  );
}
