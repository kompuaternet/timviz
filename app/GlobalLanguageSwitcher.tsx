"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getLanguageFromPathname, isSiteLanguage, switchLocalizedPath, type SiteLanguage } from "../lib/site-language";

const languages: Array<{ code: SiteLanguage; short: string; label: string }> = [
  { code: "ru", short: "RU", label: "Русский" },
  { code: "uk", short: "UA", label: "Українська" },
  { code: "en", short: "EN", label: "English" },
  { code: "fr", short: "FR", label: "Français" },
  { code: "pl", short: "PL", label: "Polski" },
  { code: "cs", short: "CS", label: "Čeština" },
  { code: "es", short: "ES", label: "Español" },
  { code: "de", short: "DE", label: "Deutsch" }
];

const switcherLabels: Record<SiteLanguage, string> = {
  ru: "Выбор языка интерфейса",
  uk: "Вибір мови інтерфейсу",
  en: "Choose interface language",
  fr: "Choisir la langue de l’interface",
  pl: "Wybór języka interfejsu",
  cs: "Výběr jazyka rozhraní",
  es: "Elegir idioma de la interfaz",
  de: "Sprache der Oberfläche wählen"
};

function getBrowserLanguage(): SiteLanguage {
  if (typeof window === "undefined") return "ru";

  let savedLanguage: string | null = null;
  try {
    savedLanguage =
      typeof window.localStorage?.getItem === "function"
        ? window.localStorage.getItem("rezervo-pro-language")
        : null;
  } catch {
    savedLanguage = null;
  }
  if (isSiteLanguage(savedLanguage)) return savedLanguage;

  const candidates = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (candidates.some((value) => value.startsWith("uk") || value.includes("-ua"))) return "uk";
  if (candidates.some((value) => value.startsWith("fr"))) return "fr";
  if (candidates.some((value) => value.startsWith("pl"))) return "pl";
  if (candidates.some((value) => value.startsWith("cs") || value.startsWith("cz"))) return "cs";
  if (candidates.some((value) => value.startsWith("es"))) return "es";
  if (candidates.some((value) => value.startsWith("de"))) return "de";
  if (candidates.some((value) => value.startsWith("en"))) return "en";
  return "ru";
}

type GlobalLanguageSwitcherProps = {
  mode?: "fixed" | "inline";
};

export default function GlobalLanguageSwitcher({ mode = "fixed" }: GlobalLanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [language, setLanguage] = useState<SiteLanguage>("ru");
  const [isOpen, setIsOpen] = useState(false);
  const routeLanguage = getLanguageFromPathname(pathname);

  useEffect(() => {
    const initialLanguage = routeLanguage ?? getBrowserLanguage();
    setLanguage(initialLanguage);
    try {
      if (typeof window.localStorage?.setItem === "function") {
        window.localStorage.setItem("rezervo-pro-language", initialLanguage);
      }
    } catch {
      // Language switching should not depend on browser storage availability.
    }
    document.documentElement.lang = initialLanguage;
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: initialLanguage }));

    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<SiteLanguage>).detail;
      if (!isSiteLanguage(nextLanguage)) return;

      setLanguage(nextLanguage);
      document.documentElement.lang = nextLanguage;
    };

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      window.removeEventListener("rezervo-language-change", handleLanguageChange);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, [routeLanguage]);

  function changeLanguage(nextLanguage: SiteLanguage) {
    setLanguage(nextLanguage);
    setIsOpen(false);
    try {
      if (typeof window.localStorage?.setItem === "function") {
        window.localStorage.setItem("rezervo-pro-language", nextLanguage);
      }
    } catch {
      // Language switching should not depend on browser storage availability.
    }
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: nextLanguage }));

    if (routeLanguage && pathname) {
      router.push(switchLocalizedPath(pathname, nextLanguage));
    }
  }

  const activeLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const isInline = mode === "inline";
  const publicPathname = pathname?.replace(/^\/(ru|uk|en|fr|pl|cs|es|de)(?=\/|$)/, "") || pathname;
  const normalizedPublicPathname = publicPathname === "" ? "/" : publicPathname;
  const hasInlinePublicHeader =
    normalizedPublicPathname === "/" ||
    normalizedPublicPathname === "/catalog" ||
    normalizedPublicPathname === "/for-business" ||
    normalizedPublicPathname === "/privacy" ||
    normalizedPublicPathname === "/terms" ||
    normalizedPublicPathname === "/pricing" ||
    normalizedPublicPathname === "/refund-policy" ||
    normalizedPublicPathname === "/contact" ||
    normalizedPublicPathname?.startsWith("/dlya-") ||
    normalizedPublicPathname?.startsWith("/for-") ||
    normalizedPublicPathname?.startsWith("/kalendar-zapisey") ||
    normalizedPublicPathname?.startsWith("/telegram-bot-dlya-zapisey") ||
    normalizedPublicPathname?.startsWith("/crm-dlya-salona") ||
    normalizedPublicPathname?.startsWith("/programma-dlya-zapisi-klientov") ||
    normalizedPublicPathname?.startsWith("/businesses/") ||
    normalizedPublicPathname?.startsWith("/account") ||
    pathname?.startsWith("/pro/create-account") ||
    pathname?.startsWith("/pro/setup");
  const useEmbeddedCalendarLanguageMenu = pathname?.startsWith("/pro/calendar");
  const hideForAuthenticatedPro =
    pathname?.startsWith("/pro") &&
    !pathname?.startsWith("/pro/create-account") &&
    !pathname?.startsWith("/pro/setup") &&
    !pathname?.startsWith("/pro/login");

  if (!isInline && (hasInlinePublicHeader || useEmbeddedCalendarLanguageMenu || hideForAuthenticatedPro)) {
    return null;
  }

  const routeClass = pathname?.startsWith("/pro/create-account")
    ? "global-language-switcher-auth"
    : pathname?.startsWith("/pro/calendar")
      ? "global-language-switcher-pro-calendar"
      : pathname?.startsWith("/pro")
        ? "global-language-switcher-pro"
        : "global-language-switcher-public";

  return (
    <div
      className={`global-language-switcher ${isInline ? "global-language-switcher-inline" : routeClass}`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="global-language-trigger"
        aria-label={switcherLabels[language]}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span>{activeLanguage.short}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen ? (
        <div className="global-language-menu">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              className={item.code === language ? "global-language-option-active" : ""}
              onClick={() => changeLanguage(item.code)}
            >
              <strong>{item.short}</strong>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
