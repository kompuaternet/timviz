export type PhoneRule = {
  country: string;
  prefix: string;
  digits: number;
  placeholder: string;
  helper: string;
  groups: number[];
};

const DEFAULT_RULE: PhoneRule = {
  country: "International",
  prefix: "+",
  digits: 12,
  placeholder: "номер без кода страны",
  helper: "Введите номер без кода страны.",
  groups: [3, 3, 3, 3]
};

const PHONE_RULES: PhoneRule[] = [
  {
    country: "Ukraine",
    prefix: "+38",
    digits: 10,
    placeholder: "067 000 00 00",
    helper: "Для Украины: +38 и 10 цифр номера.",
    groups: [3, 3, 2, 2]
  },
  {
    country: "Poland",
    prefix: "+48",
    digits: 9,
    placeholder: "500 600 700",
    helper: "Для Польши: +48 и 9 цифр номера.",
    groups: [3, 3, 3]
  },
  {
    country: "United Kingdom",
    prefix: "+44",
    digits: 10,
    placeholder: "7123 456 789",
    helper: "Для Великобритании: +44 и 10 цифр номера.",
    groups: [4, 3, 3]
  },
  {
    country: "United States",
    prefix: "+1",
    digits: 10,
    placeholder: "555 123 4567",
    helper: "Для США/Канады: +1 и 10 цифр номера.",
    groups: [3, 3, 4]
  },
  {
    country: "Canada",
    prefix: "+1",
    digits: 10,
    placeholder: "555 123 4567",
    helper: "Для Канады: +1 и 10 цифр номера.",
    groups: [3, 3, 4]
  },
  {
    country: "Russia",
    prefix: "+7",
    digits: 10,
    placeholder: "900 000 00 00",
    helper: "Для России: +7 и 10 цифр номера.",
    groups: [3, 3, 2, 2]
  },
  {
    country: "Kazakhstan",
    prefix: "+7",
    digits: 10,
    placeholder: "700 000 00 00",
    helper: "Для Казахстана: +7 и 10 цифр номера.",
    groups: [3, 3, 2, 2]
  },
  {
    country: "Germany",
    prefix: "+49",
    digits: 10,
    placeholder: "151 234 5678",
    helper: "Для Германии: +49 и 10 цифр номера.",
    groups: [3, 3, 4]
  },
  {
    country: "France",
    prefix: "+33",
    digits: 9,
    placeholder: "6 12 34 56 78",
    helper: "Для Франции: +33 и 9 цифр номера.",
    groups: [1, 2, 2, 2, 2]
  },
  {
    country: "Spain",
    prefix: "+34",
    digits: 9,
    placeholder: "600 000 000",
    helper: "Для Испании: +34 и 9 цифр номера.",
    groups: [3, 3, 3]
  },
  {
    country: "Italy",
    prefix: "+39",
    digits: 10,
    placeholder: "320 000 0000",
    helper: "Для Италии: +39 и 10 цифр номера.",
    groups: [3, 3, 4]
  },
  {
    country: "Czech Republic",
    prefix: "+420",
    digits: 9,
    placeholder: "600 000 000",
    helper: "Для Чехии: +420 и 9 цифр номера.",
    groups: [3, 3, 3]
  },
  {
    country: "Slovakia",
    prefix: "+421",
    digits: 9,
    placeholder: "900 000 000",
    helper: "Для Словакии: +421 и 9 цифр номера.",
    groups: [3, 3, 3]
  },
  {
    country: "Moldova",
    prefix: "+373",
    digits: 8,
    placeholder: "6000 0000",
    helper: "Для Молдовы: +373 и 8 цифр номера.",
    groups: [4, 4]
  },
  {
    country: "Romania",
    prefix: "+40",
    digits: 9,
    placeholder: "700 000 000",
    helper: "Для Румынии: +40 и 9 цифр номера.",
    groups: [3, 3, 3]
  },
  {
    country: "Georgia",
    prefix: "+995",
    digits: 9,
    placeholder: "500 00 00 00",
    helper: "Для Грузии: +995 и 9 цифр номера.",
    groups: [3, 2, 2, 2]
  },
  {
    country: "Armenia",
    prefix: "+374",
    digits: 8,
    placeholder: "77 000 000",
    helper: "Для Армении: +374 и 8 цифр номера.",
    groups: [2, 3, 3]
  },
  {
    country: "Lithuania",
    prefix: "+370",
    digits: 8,
    placeholder: "600 00 000",
    helper: "Для Литвы: +370 и 8 цифр номера.",
    groups: [3, 2, 3]
  },
  {
    country: "Latvia",
    prefix: "+371",
    digits: 8,
    placeholder: "2000 0000",
    helper: "Для Латвии: +371 и 8 цифр номера.",
    groups: [4, 4]
  },
  {
    country: "Estonia",
    prefix: "+372",
    digits: 7,
    placeholder: "500 0000",
    helper: "Для Эстонии: +372 и 7 цифр номера.",
    groups: [3, 4]
  },
  {
    country: "Turkey",
    prefix: "+90",
    digits: 10,
    placeholder: "500 000 0000",
    helper: "Для Турции: +90 и 10 цифр номера.",
    groups: [3, 3, 4]
  },
  {
    country: "United Arab Emirates",
    prefix: "+971",
    digits: 9,
    placeholder: "50 000 0000",
    helper: "Для ОАЭ: +971 и 9 цифр номера.",
    groups: [2, 3, 4]
  }
];

const COUNTRY_BY_REGION: Record<string, string> = {
  UA: "Ukraine",
  RU: "Russia",
  PL: "Poland",
  GB: "United Kingdom",
  US: "United States",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  CZ: "Czech Republic",
  SK: "Slovakia",
  MD: "Moldova",
  RO: "Romania",
  GE: "Georgia",
  AM: "Armenia",
  KZ: "Kazakhstan",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  TR: "Turkey",
  AE: "United Arab Emirates",
  CA: "Canada"
};

const ADDRESS_COUNTRY_MATCHERS: Array<{ country: string; patterns: string[] }> = [
  { country: "Ukraine", patterns: ["ukraine", "украина", "україна"] },
  { country: "Poland", patterns: ["poland", "польша", "польща"] },
  { country: "United Kingdom", patterns: ["united kingdom", "great britain", "британия", "велика британія"] },
  { country: "United States", patterns: ["united states", "usa", "сша"] },
  { country: "Canada", patterns: ["canada", "канада"] },
  { country: "Germany", patterns: ["germany", "германия", "німеччина"] },
  { country: "France", patterns: ["france", "франция", "франція"] },
  { country: "Spain", patterns: ["spain", "испания", "іспанія"] },
  { country: "Italy", patterns: ["italy", "италия", "італія"] },
  { country: "Czech Republic", patterns: ["czech republic", "чехия", "чехія"] },
  { country: "Slovakia", patterns: ["slovakia", "словакия", "словаччина"] },
  { country: "Moldova", patterns: ["moldova", "молдова"] },
  { country: "Romania", patterns: ["romania", "румыния", "румунія"] },
  { country: "Georgia", patterns: ["georgia", "грузия", "грузія"] },
  { country: "Armenia", patterns: ["armenia", "армения", "вірменія"] },
  { country: "Kazakhstan", patterns: ["kazakhstan", "казахстан"] },
  { country: "Lithuania", patterns: ["lithuania", "литва", "литва"] },
  { country: "Latvia", patterns: ["latvia", "латвия", "латвія"] },
  { country: "Estonia", patterns: ["estonia", "эстония", "естонія"] },
  { country: "Turkey", patterns: ["turkey", "турция", "туреччина"] },
  { country: "United Arab Emirates", patterns: ["united arab emirates", "uae", "оаэ", "оае"] }
];

export const phoneCountries = [...PHONE_RULES.map((rule) => rule.country), DEFAULT_RULE.country];

export function isKnownPhoneCountry(country = "") {
  return PHONE_RULES.some((rule) => rule.country === country);
}

export function getPhoneRule(country = "") {
  const normalized = country.toLowerCase();

  return (
    PHONE_RULES.find((rule) => {
      const ruleCountry = rule.country.toLowerCase();
      return normalized.includes(ruleCountry) || ruleCountry.includes(normalized);
    }) ?? DEFAULT_RULE
  );
}

export function onlyPhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatPhoneLocal(value: string, rule: PhoneRule) {
  const digits = onlyPhoneDigits(value).slice(0, rule.digits);
  const parts: string[] = [];
  let offset = 0;

  for (const groupLength of rule.groups) {
    const part = digits.slice(offset, offset + groupLength);
    if (!part) {
      break;
    }
    parts.push(part);
    offset += groupLength;
  }

  if (offset < digits.length) {
    parts.push(digits.slice(offset));
  }

  return parts.join(" ");
}

export function getPhoneLocalDigits(fullPhone: string, rule: PhoneRule) {
  const prefixDigits = onlyPhoneDigits(rule.prefix);
  const digits = onlyPhoneDigits(fullPhone);
  const localDigits = digits.startsWith(prefixDigits) ? digits.slice(prefixDigits.length) : digits;
  return localDigits.slice(0, rule.digits);
}

export function inferPhoneCountryFromPhone(fullPhone = "") {
  const digits = onlyPhoneDigits(fullPhone);

  if (!digits) {
    return "";
  }

  return (
    PHONE_RULES.slice()
      .sort((left, right) => onlyPhoneDigits(right.prefix).length - onlyPhoneDigits(left.prefix).length)
      .find((rule) => digits.startsWith(onlyPhoneDigits(rule.prefix)))?.country ?? ""
  );
}

export function buildInternationalPhone(country: string, localPhone: string) {
  const rule = getPhoneRule(country);
  const digits = onlyPhoneDigits(localPhone).slice(0, rule.digits);

  if (!digits) {
    return "";
  }

  return `${rule.prefix} ${formatPhoneLocal(digits, rule)}`;
}

export function isPhoneValid(country: string, localPhone: string) {
  const rule = getPhoneRule(country);
  return onlyPhoneDigits(localPhone).length === rule.digits;
}

export function getPhoneValidationMessage(country: string) {
  const rule = getPhoneRule(country);
  return `Проверьте номер: нужно ${rule.digits} цифр без кода страны.`;
}

export function inferPhoneCountryFromLocale(locale = "") {
  const region = locale.split("-")[1]?.toUpperCase();
  return region ? COUNTRY_BY_REGION[region] || "" : "";
}

export function inferPhoneCountryFromLocales(locales: string | string[] = []) {
  const candidates = Array.isArray(locales) ? locales : [locales];

  for (const candidate of candidates) {
    const country = inferPhoneCountryFromLocale(candidate);
    if (country) {
      return country;
    }
  }

  return "";
}

export function inferPhoneCountryFromAddress(address = "") {
  const normalized = address.toLowerCase();

  for (const matcher of ADDRESS_COUNTRY_MATCHERS) {
    if (matcher.patterns.some((pattern) => normalized.includes(pattern))) {
      return matcher.country;
    }
  }

  return "";
}

export function getPhoneEditingState(fullPhone = "", fallbackCountry = "Ukraine") {
  const country =
    inferPhoneCountryFromPhone(fullPhone) ||
    (isKnownPhoneCountry(fallbackCountry) ? fallbackCountry : "Ukraine");
  const rule = getPhoneRule(country);

  return {
    country,
    localPhone: formatPhoneLocal(getPhoneLocalDigits(fullPhone, rule), rule)
  };
}
