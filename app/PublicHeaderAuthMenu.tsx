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
      const cacheKey = "timviz.publicAuthMenuSession.v1";
      const ttlMs = 60 * 1000;
      const now = Date.now();

      const cachedRaw = window.sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as {
            createdAt?: number;
            customerAuthenticated?: boolean;
            customerFullName?: string;
            proAuthenticated?: boolean;
          };
          if (typeof cached.createdAt === "number" && now - cached.createdAt < ttlMs) {
            if (!cancelled) {
              setCustomerAuthenticated(cached.customerAuthenticated === true);
              setCustomerFullName(cached.customerFullName?.trim() || "");
              setProAuthenticated(cached.proAuthenticated === true);
            }
            return;
          }
        } catch {
          window.sessionStorage.removeItem(cacheKey);
        }
      }

      const payload = await fetch("/api/public/auth/menu-session", { cache: "no-store" })
        .then(async (response) =>
          ((await response.json()) as {
            customer?: { authenticated?: boolean; fullName?: string | null };
            professional?: { authenticated?: boolean };
          })
        )
        .catch(() => ({ customer: { authenticated: false, fullName: null }, professional: { authenticated: false } }));

      if (cancelled) {
        return;
      }

      const nextCustomerAuthenticated = payload.customer?.authenticated === true;
      const nextCustomerFullName = payload.customer?.fullName?.trim() || "";
      const nextProAuthenticated = payload.professional?.authenticated === true;

      setCustomerAuthenticated(nextCustomerAuthenticated);
      setCustomerFullName(nextCustomerFullName);
      setProAuthenticated(nextProAuthenticated);

      window.sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          createdAt: now,
          customerAuthenticated: nextCustomerAuthenticated,
          customerFullName: nextCustomerFullName,
          proAuthenticated: nextProAuthenticated
        })
      );
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
