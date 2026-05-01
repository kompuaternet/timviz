export type CountryPricingProfile = {
  country: string;
  iso3: string;
  currency: string;
  pppPrivateConsumption: number;
  pppYear: number;
};

export type PricingContext = {
  country?: string;
  currency?: string;
};

const REFERENCE_UKRAINE_PPP = 11.8646230019296;

const COUNTRY_PRICING_PROFILES: CountryPricingProfile[] = [
  { country: "Ukraine", iso3: "UKR", currency: "UAH", pppPrivateConsumption: 11.8646230019296, pppYear: 2025 },
  { country: "Poland", iso3: "POL", currency: "PLN", pppPrivateConsumption: 2.008043, pppYear: 2024 },
  { country: "United Kingdom", iso3: "GBR", currency: "GBP", pppPrivateConsumption: 0.682739, pppYear: 2024 },
  { country: "United States", iso3: "USA", currency: "USD", pppPrivateConsumption: 1, pppYear: 2024 },
  { country: "Canada", iso3: "CAN", currency: "CAD", pppPrivateConsumption: 1.240903, pppYear: 2024 },
  { country: "Germany", iso3: "DEU", currency: "EUR", pppPrivateConsumption: 0.701547, pppYear: 2024 },
  { country: "France", iso3: "FRA", currency: "EUR", pppPrivateConsumption: 0.716934, pppYear: 2024 },
  { country: "Spain", iso3: "ESP", currency: "EUR", pppPrivateConsumption: 0.588481, pppYear: 2024 },
  { country: "Italy", iso3: "ITA", currency: "EUR", pppPrivateConsumption: 0.625157, pppYear: 2024 },
  { country: "Czech Republic", iso3: "CZE", currency: "CZK", pppPrivateConsumption: 14.326373, pppYear: 2024 },
  { country: "Slovakia", iso3: "SVK", currency: "EUR", pppPrivateConsumption: 0.545311, pppYear: 2024 },
  { country: "Moldova", iso3: "MDA", currency: "MDL", pppPrivateConsumption: 8.77294960538386, pppYear: 2025 },
  { country: "Romania", iso3: "ROU", currency: "RON", pppPrivateConsumption: 2.05657177858732, pppYear: 2024 },
  { country: "Georgia", iso3: "GEO", currency: "GEL", pppPrivateConsumption: 1.08749274580272, pppYear: 2025 },
  { country: "Armenia", iso3: "ARM", currency: "AMD", pppPrivateConsumption: 158.529692605186, pppYear: 2025 },
  { country: "Kazakhstan", iso3: "KAZ", currency: "KZT", pppPrivateConsumption: 190.98276551719, pppYear: 2025 },
  { country: "Lithuania", iso3: "LTU", currency: "EUR", pppPrivateConsumption: 0.526455, pppYear: 2024 },
  { country: "Latvia", iso3: "LVA", currency: "EUR", pppPrivateConsumption: 0.533129, pppYear: 2024 },
  { country: "Estonia", iso3: "EST", currency: "EUR", pppPrivateConsumption: 0.646078, pppYear: 2024 },
  { country: "Turkey", iso3: "TUR", currency: "TRY", pppPrivateConsumption: 12.551671, pppYear: 2024 },
  { country: "United Arab Emirates", iso3: "ARE", currency: "AED", pppPrivateConsumption: 2.56310995667988, pppYear: 2024 },
  { country: "Russia", iso3: "RUS", currency: "RUB", pppPrivateConsumption: 30.7531677427568, pppYear: 2025 },
  { country: "International", iso3: "INT", currency: "USD", pppPrivateConsumption: 1, pppYear: 2024 }
];

const COUNTRY_BY_NORMALIZED_NAME = new Map(
  COUNTRY_PRICING_PROFILES.map((item) => [normalizeCountryName(item.country), item])
);

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  ukraine: "Ukraine",
  украина: "Ukraine",
  україна: "Ukraine",
  poland: "Poland",
  польша: "Poland",
  польща: "Poland",
  "united kingdom": "United Kingdom",
  uk: "United Kingdom",
  britain: "United Kingdom",
  великобритания: "United Kingdom",
  британія: "United Kingdom",
  "united states": "United States",
  usa: "United States",
  us: "United States",
  сша: "United States",
  canada: "Canada",
  канада: "Canada",
  germany: "Germany",
  германия: "Germany",
  німеччина: "Germany",
  france: "France",
  франция: "France",
  франція: "France",
  spain: "Spain",
  испания: "Spain",
  іспанія: "Spain",
  italy: "Italy",
  италия: "Italy",
  італія: "Italy",
  "czech republic": "Czech Republic",
  czechia: "Czech Republic",
  чехия: "Czech Republic",
  чехія: "Czech Republic",
  slovakia: "Slovakia",
  словакия: "Slovakia",
  словаччина: "Slovakia",
  moldova: "Moldova",
  молдова: "Moldova",
  romania: "Romania",
  румыния: "Romania",
  румунія: "Romania",
  georgia: "Georgia",
  грузия: "Georgia",
  грузія: "Georgia",
  armenia: "Armenia",
  армения: "Armenia",
  вірменія: "Armenia",
  kazakhstan: "Kazakhstan",
  казахстан: "Kazakhstan",
  lithuania: "Lithuania",
  литва: "Lithuania",
  latvia: "Latvia",
  латвия: "Latvia",
  estonia: "Estonia",
  эстония: "Estonia",
  turkey: "Turkey",
  turkiye: "Turkey",
  турция: "Turkey",
  туреччина: "Turkey",
  "united arab emirates": "United Arab Emirates",
  uae: "United Arab Emirates",
  оаэ: "United Arab Emirates",
  emirates: "United Arab Emirates",
  russia: "Russia",
  россия: "Russia",
  росія: "Russia",
  international: "International"
};

const CURRENCY_FALLBACK_PPP: Record<string, number> = {
  USD: 1,
  EUR: 0.65,
  GBP: 0.68,
  CAD: 1.24,
  UAH: 11.86,
  PLN: 2.01,
  CZK: 14.33,
  MDL: 8.77,
  RON: 2.06,
  GEL: 1.09,
  AMD: 158.53,
  KZT: 190.98,
  TRY: 12.55,
  RUB: 30.75,
  AED: 2.56
};

const ROUNDING_STEP_BY_CURRENCY: Record<string, number> = {
  UAH: 10,
  RUB: 10,
  KZT: 50,
  AMD: 100,
  MDL: 5,
  RON: 5,
  TRY: 10,
  PLN: 5,
  EUR: 5,
  USD: 5,
  CAD: 5,
  GBP: 5,
  GEL: 2,
  AED: 5,
  CZK: 10
};

function normalizeCountryName(value = "") {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeCurrency(value = "") {
  return value.trim().toUpperCase();
}

function resolveCountryFromAlias(country = "") {
  const normalized = normalizeCountryName(country);
  if (!normalized) {
    return "";
  }

  return COUNTRY_NAME_ALIASES[normalized] || country.trim();
}

function resolveCountryPricingProfile(country = "", currency = "") {
  const aliasedCountry = resolveCountryFromAlias(country);
  const byCountry = COUNTRY_BY_NORMALIZED_NAME.get(normalizeCountryName(aliasedCountry));
  if (byCountry) {
    return byCountry;
  }

  const normalizedCurrency = normalizeCurrency(currency);
  if (normalizedCurrency) {
    const byCurrency = COUNTRY_PRICING_PROFILES.find((item) => item.currency === normalizedCurrency);
    if (byCurrency) {
      return byCurrency;
    }
  }

  return COUNTRY_BY_NORMALIZED_NAME.get("international") ?? COUNTRY_PRICING_PROFILES[0];
}

export function inferCurrencyFromCountryName(country = "") {
  return resolveCountryPricingProfile(country).currency;
}

function getRoundingStep(currency: string) {
  return ROUNDING_STEP_BY_CURRENCY[normalizeCurrency(currency)] ?? 5;
}

function roundWithStep(value: number, step: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return step;
  }

  return Math.max(step, Math.round(value / step) * step);
}

export function convertBaseUahPriceToCountryPrice(basePriceUah: number, context: PricingContext = {}) {
  const safeBase = Number.isFinite(basePriceUah) && basePriceUah > 0 ? basePriceUah : 700;
  const profile = resolveCountryPricingProfile(context.country, context.currency);
  const currency = normalizeCurrency(context.currency || profile.currency || "USD");
  const ppp =
    profile.pppPrivateConsumption ||
    CURRENCY_FALLBACK_PPP[currency] ||
    1;

  const internationalDollarPrice = safeBase / REFERENCE_UKRAINE_PPP;
  const localPrice = internationalDollarPrice * ppp;
  return roundWithStep(localPrice, getRoundingStep(currency));
}

export function getCountryPricingProfiles() {
  return COUNTRY_PRICING_PROFILES;
}
