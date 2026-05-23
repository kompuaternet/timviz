"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLocalizedPath, type SiteLanguage, withExtraLanguageFallbacks } from "../lib/site-language";

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

const authMenuCopy: Record<SiteLanguage, AuthMenuCopy> = withExtraLanguageFallbacks<AuthMenuCopy>({
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
}, {
  fr: {
    login: "Connexion",
    myAccount: "Mon compte",
    customerLogin: "Connexion client",
    customerCabinet: "Compte client",
    masterLogin: "Connexion pro",
    masterCabinet: "Tableau de bord pro"
  },
  pl: {
    login: "Zaloguj się",
    myAccount: "Moje konto",
    customerLogin: "Logowanie klienta",
    customerCabinet: "Konto klienta",
    masterLogin: "Logowanie specjalisty",
    masterCabinet: "Panel specjalisty"
  },
  cs: {
    login: "Přihlásit se",
    myAccount: "Můj účet",
    customerLogin: "Přihlášení klienta",
    customerCabinet: "Účet klienta",
    masterLogin: "Přihlášení profesionála",
    masterCabinet: "Panel profesionála"
  },
  es: {
    login: "Iniciar sesión",
    myAccount: "Mi cuenta",
    customerLogin: "Acceso de cliente",
    customerCabinet: "Cuenta de cliente",
    masterLogin: "Acceso profesional",
    masterCabinet: "Panel profesional"
  },
  de: {
    login: "Einloggen",
    myAccount: "Mein Konto",
    customerLogin: "Kundenlogin",
    customerCabinet: "Kundenkonto",
    masterLogin: "Profi-Login",
    masterCabinet: "Profi-Dashboard"
  }
});

export default function PublicHeaderAuthMenu({ language }: PublicHeaderAuthMenuProps) {
  const t = authMenuCopy[language];
  const [customerAuthenticated, setCustomerAuthenticated] = useState(false);
  const [customerFullName, setCustomerFullName] = useState("");
  const [proAuthenticated, setProAuthenticated] = useState(false);
  const [proFullName, setProFullName] = useState("");
  const [proAvatarUrl, setProAvatarUrl] = useState("");

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
            proFullName?: string;
            proAvatarUrl?: string;
          };
          if (typeof cached.createdAt === "number" && now - cached.createdAt < ttlMs) {
            if (!cancelled) {
              setCustomerAuthenticated(cached.customerAuthenticated === true);
              setCustomerFullName(cached.customerFullName?.trim() || "");
              setProAuthenticated(cached.proAuthenticated === true);
              setProFullName(cached.proFullName?.trim() || "");
              setProAvatarUrl(cached.proAvatarUrl?.trim() || "");
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
            professional?: { authenticated?: boolean; fullName?: string | null; avatarUrl?: string | null };
          })
        )
        .catch(() => ({
          customer: { authenticated: false, fullName: null },
          professional: { authenticated: false, fullName: null, avatarUrl: null }
        }));

      if (cancelled) {
        return;
      }

      const nextCustomerAuthenticated = payload.customer?.authenticated === true;
      const nextCustomerFullName = payload.customer?.fullName?.trim() || "";
      const nextProAuthenticated = payload.professional?.authenticated === true;
      const nextProFullName = payload.professional?.fullName?.trim() || "";
      const nextProAvatarUrl = payload.professional?.avatarUrl?.trim() || "";

      setCustomerAuthenticated(nextCustomerAuthenticated);
      setCustomerFullName(nextCustomerFullName);
      setProAuthenticated(nextProAuthenticated);
      setProFullName(nextProFullName);
      setProAvatarUrl(nextProAvatarUrl);

      window.sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          createdAt: now,
          customerAuthenticated: nextCustomerAuthenticated,
          customerFullName: nextCustomerFullName,
          proAuthenticated: nextProAuthenticated,
          proFullName: nextProFullName,
          proAvatarUrl: nextProAvatarUrl
        })
      );
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthenticated = customerAuthenticated || proAuthenticated;
  const displayName = customerFullName || proFullName || (proAuthenticated ? t.masterCabinet : t.myAccount);
  const authMenuLabel = isAuthenticated ? displayName : t.login;
  const accountLabel = customerAuthenticated ? t.customerCabinet : t.customerLogin;
  const proLabel = proAuthenticated ? t.masterCabinet : t.masterLogin;
  const proHref = proAuthenticated ? "/pro" : "/pro/login";
  const avatarLabel = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

  return (
    <details className="public-menu public-entry-menu">
      <summary className="public-login-entry">
        {isAuthenticated ? (
          <span className="public-login-auth">
            {proAvatarUrl ? (
              <img src={proAvatarUrl} alt={authMenuLabel} className="public-login-avatar-image" />
            ) : (
              <span className="public-login-avatar-fallback">{avatarLabel}</span>
            )}
            <span className="public-login-name">{authMenuLabel}</span>
          </span>
        ) : (
          authMenuLabel
        )}
      </summary>
      <div className="public-menu-panel public-entry-panel">
        <Link href={getLocalizedPath(language, "/account")}>{accountLabel}</Link>
        <Link href={proHref}>{proLabel}</Link>
      </div>
    </details>
  );
}
