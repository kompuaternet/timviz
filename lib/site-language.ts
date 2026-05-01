export type SiteLanguage = "ru" | "uk" | "en";

export const siteLanguages: SiteLanguage[] = ["ru", "uk", "en"];
export const defaultSiteLanguage: SiteLanguage = "ru";

type NicheKey = "manicure" | "hairdressers" | "barbers" | "cosmetologists" | "massage";

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
  en: {
    manicure: "for-nail-technicians",
    hairdressers: "for-hairdressers",
    barbers: "for-barbers",
    cosmetologists: "for-cosmetologists",
    massage: "for-massage-therapists"
  }
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
  en: {
    "dlya-manikyura": "manicure",
    "dlya-manikyuru": "manicure",
    "dlya-parikmaherov": "hairdressers",
    "dlya-perukariv": "hairdressers",
    "dlya-barberov": "barbers",
    "dlya-barberiv": "barbers",
    "dlya-kosmetologov": "cosmetologists",
    "dlya-kosmetologiv": "cosmetologists",
    "dlya-massazha": "massage",
    "dlya-massazhu": "massage",
    "dlya-massazhistov": "massage",
    "dlya-masazhistiv": "massage"
  }
};

export function isSiteLanguage(value: string | null | undefined): value is SiteLanguage {
  return value === "ru" || value === "uk" || value === "en";
}

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
