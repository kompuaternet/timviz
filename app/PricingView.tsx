"use client";

import { useEffect, useMemo, useState } from "react";
import BrandLogo from "./BrandLogo";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import PublicHeaderAuthMenu from "./PublicHeaderAuthMenu";
import { getLocalizedPath, type SiteLanguage } from "../lib/site-language";
import type { PricingCopy, PricingPlanKey } from "../lib/pricing";

type PaddleCheckoutBilling = "monthly" | "yearly";

type PaddleWindow = Window & {
  Paddle?: {
    Environment?: {
      set(environment: string): void;
    };
    Initialize(options: { token: string; eventCallback?: (event: unknown) => void }): void;
    Checkout: {
      open(options: {
        items: Array<{ priceId: string; quantity: number }>;
        customer?: { email: string };
        customData?: Record<string, string>;
        settings?: { displayMode: "overlay"; theme: "light" };
      }): void;
    };
  };
};

type PricingViewProps = {
  language: SiteLanguage;
  copy: PricingCopy;
  user: {
    id: string;
    email: string;
  } | null;
  paddle: {
    token: string;
    environment: string;
    monthlyPriceId: string;
    yearlyPriceId: string;
  };
};

const planOrder: PricingPlanKey[] = ["free", "monthly", "yearly"];

const footerCopy = {
  ru: {
    about: "Timviz",
    catalog: "Каталог",
    business: "Бизнесу",
    pricing: "Тарифы",
    legal: "Юридическая информация",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    refund: "Политика возвратов",
    contact: "Контакты",
    support: "Поддержка"
  },
  uk: {
    about: "Timviz",
    catalog: "Каталог",
    business: "Бізнесу",
    pricing: "Тарифи",
    legal: "Юридична інформація",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    refund: "Політика повернень",
    contact: "Контакти",
    support: "Підтримка"
  },
  en: {
    about: "Timviz",
    catalog: "Catalog",
    business: "For business",
    pricing: "Pricing",
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of use",
    refund: "Refund policy",
    contact: "Contact",
    support: "Support"
  }
} satisfies Record<SiteLanguage, Record<string, string>>;

export default function PricingView({ language, copy, user, paddle }: PricingViewProps) {
  const [message, setMessage] = useState("");
  const [loadingBilling, setLoadingBilling] = useState<PaddleCheckoutBilling | null>(null);
  const footer = footerCopy[language];

  useEffect(() => {
    if (!paddle.token) {
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-paddle-js]");
    if (existing) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.dataset.paddleJs = "true";
    document.head.appendChild(script);
  }, [paddle.token]);

  const checkoutPriceIds = useMemo(
    () => ({
      monthly: paddle.monthlyPriceId,
      yearly: paddle.yearlyPriceId
    }),
    [paddle.monthlyPriceId, paddle.yearlyPriceId]
  );

  function goFree() {
    window.location.assign(user ? "/pro/calendar" : "/pro/create-account");
  }

  function redirectToLogin(billing: PaddleCheckoutBilling) {
    const returnTo = `${getLocalizedPath(language, "/pricing")}?checkout=${billing}`;
    window.location.assign(`/pro/login?return_to=${encodeURIComponent(returnTo)}`);
  }

  function initializePaddle(billing: PaddleCheckoutBilling) {
    const paddleClient = (window as PaddleWindow).Paddle;

    if (!paddleClient || !paddle.token) {
      return false;
    }

    if (paddle.environment && paddle.environment !== "production") {
      paddleClient.Environment?.set(paddle.environment);
    }

    paddleClient.Initialize({
      token: paddle.token,
      eventCallback: (event) => {
        const payload = event && typeof event === "object" ? (event as Record<string, unknown>) : {};
        const name = String(payload.name || payload.event || "");
        if (!name.includes("checkout.completed")) {
          return;
        }

        fetch("/api/paddle/checkout-completed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: payload,
            billing,
            priceId: checkoutPriceIds[billing],
            userId: user?.id,
            email: user?.email
          })
        }).catch(() => {});
      }
    });
    return true;
  }

  function openCheckout(billing: PaddleCheckoutBilling) {
    setMessage("");

    if (!user) {
      setMessage(copy.loginRequired);
      redirectToLogin(billing);
      return;
    }

    const priceId = checkoutPriceIds[billing];
    if (!paddle.token || !priceId) {
      setMessage(copy.missingConfig);
      return;
    }

    setLoadingBilling(billing);
    setMessage(copy.startingCheckout);

    const tryOpen = () => {
      if (!initializePaddle(billing)) {
        window.setTimeout(tryOpen, 160);
        return;
      }

      (window as PaddleWindow).Paddle?.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: {
          user_id: user.id,
          professional_id: user.id,
          email: user.email,
          plan: "premium",
          billing
        },
        settings: {
          displayMode: "overlay",
          theme: "light"
        }
      });
      setLoadingBilling(null);
    };

    tryOpen();
  }

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "monthly" || checkout === "yearly") {
      openCheckout(checkout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <main className="public-home pricing-page">
      <header className="public-header">
        <a className="public-logo" href={getLocalizedPath(language)}>
          <BrandLogo />
        </a>
        <nav className="public-nav" aria-label="Pricing navigation">
          <PublicHeaderAuthMenu language={language} />
          <a href={getLocalizedPath(language, "/for-business")} className="public-company-button">
            Timviz Pro
          </a>
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
          <strong>{copy.securePaddle}</strong>
        </div>
      </section>

      <section className="pricing-grid" aria-label="Timviz pricing plans">
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
                onClick={() =>
                  planKey === "free" ? goFree() : openCheckout(planKey === "monthly" ? "monthly" : "yearly")
                }
                disabled={loadingBilling === planKey}
              >
                {copy.buttons[planKey]}
              </button>
            </article>
          );
        })}
      </section>

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
          <a className="public-logo" href={getLocalizedPath(language)}>
            <BrandLogo />
          </a>
          <p>{copy.securePaddle}</p>
        </div>
        <div>
          <h3>{footer.about}</h3>
          <a href={getLocalizedPath(language, "/catalog")}>{footer.catalog}</a>
          <a href={getLocalizedPath(language, "/for-business")}>{footer.business}</a>
          <a href={getLocalizedPath(language, "/pricing")}>{footer.pricing}</a>
        </div>
        <div>
          <h3>{footer.legal}</h3>
          <a href={getLocalizedPath(language, "/privacy")}>{footer.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{footer.terms}</a>
          <a href={getLocalizedPath(language, "/refund-policy")}>{footer.refund}</a>
          <a href={getLocalizedPath(language, "/contact")}>{footer.contact}</a>
          <a href="mailto:adm@timviz.com">{footer.support}: adm@timviz.com</a>
        </div>
      </footer>
    </main>
  );
}
