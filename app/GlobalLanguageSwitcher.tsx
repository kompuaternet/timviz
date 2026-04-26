"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getLanguageFromPathname, isSiteLanguage, switchLocalizedPath, type SiteLanguage } from "../lib/site-language";

const languages: Array<{ code: SiteLanguage; short: string; label: string }> = [
  { code: "ru", short: "RU", label: "Русский" },
  { code: "uk", short: "UA", label: "Українська" },
  { code: "en", short: "EN", label: "English" }
];

const switcherLabels: Record<SiteLanguage, string> = {
  ru: "Выбор языка интерфейса",
  uk: "Вибір мови інтерфейсу",
  en: "Choose interface language"
};

function getBrowserLanguage(): SiteLanguage {
  if (typeof window === "undefined") return "ru";

  const savedLanguage = window.localStorage.getItem("rezervo-pro-language");
  if (isSiteLanguage(savedLanguage)) return savedLanguage;

  const candidates = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (candidates.some((value) => value.startsWith("uk") || value.includes("-ua"))) return "uk";
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
    window.localStorage.setItem("rezervo-pro-language", initialLanguage);
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
    window.localStorage.setItem("rezervo-pro-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: nextLanguage }));

    if (routeLanguage && pathname) {
      router.push(switchLocalizedPath(pathname, nextLanguage));
    }
  }

  const activeLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const isInline = mode === "inline";
  const hasInlinePublicHeader =
    pathname === "/" ||
    pathname === "/for-business" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/ru" ||
    pathname === "/uk" ||
    pathname === "/en" ||
    pathname === "/ru/for-business" ||
    pathname === "/uk/for-business" ||
    pathname === "/en/for-business" ||
    pathname === "/ru/privacy" ||
    pathname === "/uk/privacy" ||
    pathname === "/en/privacy" ||
    pathname === "/ru/terms" ||
    pathname === "/uk/terms" ||
    pathname === "/en/terms" ||
    pathname?.startsWith("/businesses/") ||
    pathname?.startsWith("/ru/businesses/") ||
    pathname?.startsWith("/uk/businesses/") ||
    pathname?.startsWith("/en/businesses/") ||
    pathname?.startsWith("/pro/create-account") ||
    pathname?.startsWith("/pro/setup");

  if (!isInline && hasInlinePublicHeader) {
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
