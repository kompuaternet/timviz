"use client";

import { useEffect, useState } from "react";
import { getLocalizedPath, type SiteLanguage } from "../lib/site-language";

type PublicHeaderAuthMenuProps = {
  language: SiteLanguage;
};

type AuthMenuCopy = {
  login: string;
  myAccount: string;
  customerLogin: string;
  customerCabinet: string;
  masterLogin: string;
  masterCabinet: string;
};

const authMenuCopy: Record<SiteLanguage, AuthMenuCopy> = {
  ru: {
    login: "Войти",
    myAccount: "Мой кабинет",
    customerLogin: "Вход для клиента",
    customerCabinet: "Кабинет клиента",
    masterLogin: "Вход для мастера",
    masterCabinet: "Кабинет мастера"
  },
  uk: {
    login: "Увійти",
    myAccount: "Мій кабінет",
    customerLogin: "Вхід для клієнта",
    customerCabinet: "Кабінет клієнта",
    masterLogin: "Вхід для майстра",
    masterCabinet: "Кабінет майстра"
  },
  en: {
    login: "Log in",
    myAccount: "My account",
    customerLogin: "Client sign in",
    customerCabinet: "Customer account",
    masterLogin: "Master sign in",
    masterCabinet: "Master dashboard"
  }
};

export default function PublicHeaderAuthMenu({ language }: PublicHeaderAuthMenuProps) {
  const t = authMenuCopy[language];
  const [customerAuthenticated, setCustomerAuthenticated] = useState(false);
  const [customerFullName, setCustomerFullName] = useState("");
  const [proAuthenticated, setProAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      const [customerPayload, proPayload] = await Promise.all([
        fetch("/api/public/auth/session", { cache: "no-store" })
          .then(async (response) =>
            ((await response.json()) as { authenticated?: boolean; customer?: { fullName?: string } | null })
          )
          .catch(() => ({ authenticated: false, customer: null })),
        fetch("/api/pro/auth/session", { cache: "no-store" })
          .then(async (response) => ((await response.json()) as { authenticated?: boolean }))
          .catch(() => ({ authenticated: false }))
      ]);

      if (cancelled) {
        return;
      }

      setCustomerAuthenticated(customerPayload.authenticated === true);
      setCustomerFullName(customerPayload.customer?.fullName?.trim() || "");
      setProAuthenticated(proPayload.authenticated === true);
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  const authMenuLabel = customerAuthenticated ? customerFullName || t.myAccount : t.login;
  const accountLabel = customerAuthenticated ? t.customerCabinet : t.customerLogin;
  const proLabel = proAuthenticated ? t.masterCabinet : t.masterLogin;
  const proHref = proAuthenticated ? "/pro" : "/pro/login";

  return (
    <details className="public-menu public-entry-menu">
      <summary className="public-login-entry">{authMenuLabel}</summary>
      <div className="public-menu-panel public-entry-panel">
        <a href={getLocalizedPath(language, "/account")}>{accountLabel}</a>
        <a href={proHref}>{proLabel}</a>
      </div>
    </details>
  );
}

