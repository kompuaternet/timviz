export type BaseSiteLanguage = "ru" | "uk" | "en";
export type ExtraSiteLanguage = "fr" | "pl" | "cs" | "es" | "de";
export type SiteLanguage = BaseSiteLanguage | ExtraSiteLanguage;

export const baseSiteLanguages: BaseSiteLanguage[] = ["ru", "uk", "en"];
export const extraSiteLanguages: ExtraSiteLanguage[] = ["fr", "pl", "cs", "es", "de"];
export const siteLanguages: SiteLanguage[] = [...baseSiteLanguages, ...extraSiteLanguages];
export const defaultSiteLanguage: SiteLanguage = "ru";

type NicheKey = "manicure" | "hairdressers" | "barbers" | "cosmetologists" | "massage";

const englishNicheSlugs: Record<NicheKey, string> = {
  manicure: "for-nail-technicians",
  hairdressers: "for-hairdressers",
  barbers: "for-barbers",
  cosmetologists: "for-cosmetologists",
  massage: "for-massage-therapists"
};

const localizedExtraNicheSlugs: Record<ExtraSiteLanguage, Record<NicheKey, string>> = {
  fr: {
    manicure: "pour-prothesistes-ongulaires",
    hairdressers: "pour-coiffeurs",
    barbers: "pour-barbiers",
    cosmetologists: "pour-estheticiennes",
    massage: "pour-masseurs"
  },
  pl: {
    manicure: "dla-stylistek-paznokci",
    hairdressers: "dla-fryzjerow",
    barbers: "dla-barberow",
    cosmetologists: "dla-kosmetologow",
    massage: "dla-masazystow"
  },
  cs: {
    manicure: "pro-nehtove-specialisty",
    hairdressers: "pro-kaderniky",
    barbers: "pro-barbery",
    cosmetologists: "pro-kosmetology",
    massage: "pro-masery"
  },
  es: {
    manicure: "para-especialistas-en-unas",
    hairdressers: "para-peluqueros",
    barbers: "para-barberos",
    cosmetologists: "para-cosmetologos",
    massage: "para-masajistas"
  },
  de: {
    manicure: "fuer-nagelprofis",
    hairdressers: "fuer-friseure",
    barbers: "fuer-barber",
    cosmetologists: "fuer-kosmetiker",
    massage: "fuer-masseure"
  }
};

const nicheSlugMap: Record<SiteLanguage, Record<NicheKey, string>> = {
  ru: {
    manicure: "dlya-manikyura",
    hairdressers: "dlya-parikmaherov",
    barbers: "dlya-barberov",
    cosmetologists: "dlya-kosmetologov",
    massage: "dlya-massazhistov"
  },
  uk: {
    manicure: "dlya-manikyuru",
    hairdressers: "dlya-perukariv",
    barbers: "dlya-barberiv",
    cosmetologists: "dlya-kosmetologiv",
    massage: "dlya-masazhu"
  },
  en: englishNicheSlugs,
  ...localizedExtraNicheSlugs
};

const latinNicheAliases: Record<string, NicheKey> = {
  "for-nail-technicians": "manicure",
  "for-hairdressers": "hairdressers",
  "for-barbers": "barbers",
  "for-cosmetologists": "cosmetologists",
  "for-massage-therapists": "massage",
  "dlya-manikyura": "manicure",
  "dlya-manikyuru": "manicure",
  "dlia-manikyura": "manicure",
  "dlia-manikyuru": "manicure",
  "dlj-manikyura": "manicure",
  "dlj-manikyuru": "manicure",
  "dli-manikyura": "manicure",
  "dli-manikyuru": "manicure",
  "dlya-parikmaherov": "hairdressers",
  "dlya-perukariv": "hairdressers",
  "dlia-parikmaherov": "hairdressers",
  "dlia-perukariv": "hairdressers",
  "dlj-parikmaherov": "hairdressers",
  "dlj-perukariv": "hairdressers",
  "dlj-perukoriv": "hairdressers",
  "dli-parikmaherov": "hairdressers",
  "dli-perukariv": "hairdressers",
  "dli-perukoriv": "hairdressers",
  "dlya-barberov": "barbers",
  "dlya-barberiv": "barbers",
  "dlia-barberov": "barbers",
  "dlia-barberiv": "barbers",
  "dlj-barberov": "barbers",
  "dlj-barberiv": "barbers",
  "dli-barberov": "barbers",
  "dli-barberiv": "barbers",
  "dlya-kosmetologov": "cosmetologists",
  "dlya-kosmetologiv": "cosmetologists",
  "dlia-kosmetologov": "cosmetologists",
  "dlia-kosmetologiv": "cosmetologists",
  "dlj-kosmetologov": "cosmetologists",
  "dlj-kosmetologiv": "cosmetologists",
  "dli-kosmetologov": "cosmetologists",
  "dli-kosmetologiv": "cosmetologists",
  "dlya-massazha": "massage",
  "dlya-massazhu": "massage",
  "dlya-massazhistov": "massage",
  "dlya-masazhistiv": "massage",
  "dlia-massazha": "massage",
  "dlia-massazhu": "massage",
  "dlia-massazhistov": "massage",
  "dlia-masazhistiv": "massage",
  "dlj-massazha": "massage",
  "dlj-massazhu": "massage",
  "dlj-massazhistov": "massage",
  "dlj-masazhistiv": "massage",
  "dli-massazha": "massage",
  "dli-massazhu": "massage",
  "dli-massazhistov": "massage",
  "dli-masazhistiv": "massage"
};

const nicheSlugAliases: Record<SiteLanguage, Record<string, NicheKey>> = {
  ru: {
    "dlya-manikyuru": "manicure",
    "dlya-perukariv": "hairdressers",
    "dlya-barberiv": "barbers",
    "dlya-kosmetologiv": "cosmetologists",
    "dlya-masazhu": "massage",
    "dlya-masazhistiv": "massage",
    "for-nail-technicians": "manicure",
    "for-hairdressers": "hairdressers",
    "for-barbers": "barbers",
    "for-cosmetologists": "cosmetologists",
    "for-massage-therapists": "massage"
  },
  uk: {
    "dlya-manikyura": "manicure",
    "dlya-parikmaherov": "hairdressers",
    "dlya-barberov": "barbers",
    "dlya-kosmetologov": "cosmetologists",
    "dlya-masazhu": "massage",
    "dlya-masazhistiv": "massage",
    "dlya-massazha": "massage",
    "dlya-massazhistov": "massage",
    "for-nail-technicians": "manicure",
    "for-hairdressers": "hairdressers",
    "for-barbers": "barbers",
    "for-cosmetologists": "cosmetologists",
    "for-massage-therapists": "massage"
  },
  en: latinNicheAliases,
  fr: latinNicheAliases,
  pl: latinNicheAliases,
  cs: latinNicheAliases,
  es: latinNicheAliases,
  de: latinNicheAliases
};

export function isSiteLanguage(value: string | null | undefined): value is SiteLanguage {
  return typeof value === "string" && (siteLanguages as string[]).includes(value);
}

export function isBaseSiteLanguage(value: string | null | undefined): value is BaseSiteLanguage {
  return typeof value === "string" && (baseSiteLanguages as string[]).includes(value);
}

export function isEnglishSlugLanguage(value: string | null | undefined): value is "en" | ExtraSiteLanguage {
  return value === "en" || (typeof value === "string" && (extraSiteLanguages as string[]).includes(value));
}

export function getContentLanguage(language: SiteLanguage): BaseSiteLanguage {
  return isBaseSiteLanguage(language) ? language : "en";
}

export function withEnglishFallback<T>(record: Record<BaseSiteLanguage, T>): Record<SiteLanguage, T> {
  return {
    ...record,
    fr: record.en,
    pl: record.en,
    cs: record.en,
    es: record.en,
    de: record.en
  };
}

export function withExtraLanguageFallbacks<T>(
  record: Record<BaseSiteLanguage, T>,
  extra: Partial<Record<ExtraSiteLanguage, Partial<T>>>
): Record<SiteLanguage, T> {
  const fallback = withEnglishFallback(record);
  for (const language of extraSiteLanguages) {
    fallback[language] = { ...(fallback.en as T & object), ...(extra[language] as object | undefined) } as T;
  }
  return fallback;
}

export function withNestedEnglishFallback<Key extends string, T>(
  record: Record<Key, Record<BaseSiteLanguage, T>>
): Record<Key, Record<SiteLanguage, T>> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, withEnglishFallback(value as Record<BaseSiteLanguage, T>)])
  ) as Record<Key, Record<SiteLanguage, T>>;
}

export function withNestedExtraLanguageFallbacks<Key extends string, T>(
  record: Record<Key, Record<BaseSiteLanguage, T>>,
  extra: Partial<Record<Key, Partial<Record<ExtraSiteLanguage, Partial<T>>>>>
): Record<Key, Record<SiteLanguage, T>> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      withExtraLanguageFallbacks(value as Record<BaseSiteLanguage, T>, extra[key as Key] ?? {})
    ])
  ) as Record<Key, Record<SiteLanguage, T>>;
}

export const publicFooterLabels: Record<SiteLanguage, { pricing: string; refund: string; contact: string }> = {
  ru: { pricing: "Тарифы", refund: "Политика возвратов", contact: "Контакты" },
  uk: { pricing: "Тарифи", refund: "Політика повернень", contact: "Контакти" },
  en: { pricing: "Pricing", refund: "Refund policy", contact: "Contact" },
  fr: { pricing: "Tarifs", refund: "Politique de remboursement", contact: "Contact" },
  pl: { pricing: "Cennik", refund: "Polityka zwrotów", contact: "Kontakt" },
  cs: { pricing: "Ceník", refund: "Zásady vrácení peněz", contact: "Kontakt" },
  es: { pricing: "Precios", refund: "Política de reembolso", contact: "Contacto" },
  de: { pricing: "Preise", refund: "Rückerstattungsrichtlinie", contact: "Kontakt" }
};

export const localeBySiteLanguage: Record<SiteLanguage, string> = {
  ru: "ru-RU",
  uk: "uk-UA",
  en: "en-US",
  fr: "fr-FR",
  pl: "pl-PL",
  cs: "cs-CZ",
  es: "es-ES",
  de: "de-DE"
};

export function getLocalizedPath(language: SiteLanguage, pathname = "/") {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\/+/, "");
  return `/${language}${normalized ? `/${normalized}` : ""}`;
}

function getNicheKeyBySlug(language: SiteLanguage, slug: string): NicheKey | null {
  const mapped = (Object.keys(nicheSlugMap[language]) as NicheKey[]).find(
    (key) => nicheSlugMap[language][key] === slug
  );
  if (mapped) return mapped;
  return nicheSlugAliases[language][slug] ?? null;
}

export function switchLocalizedPath(pathname: string, language: SiteLanguage) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isSiteLanguage(segments[0])) {
    const sourceLanguage = segments[0];
    const firstSegmentAfterLanguage = segments[1];
    if (firstSegmentAfterLanguage) {
      const nicheKey = getNicheKeyBySlug(sourceLanguage, firstSegmentAfterLanguage);
      if (nicheKey) {
        segments[1] = nicheSlugMap[language][nicheKey];
      }
    }
    segments[0] = language;
    return `/${segments.join("/")}`;
  }

  return getLocalizedPath(language, pathname);
}

export function getLanguageFromPathname(pathname: string | null | undefined) {
  const firstSegment = pathname?.split("/").filter(Boolean)[0];
  return isSiteLanguage(firstSegment) ? firstSegment : null;
}
