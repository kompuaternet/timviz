"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneLocalDigits,
  getPhoneRule,
  getPhoneValidationMessage,
  isPhoneValid,
  onlyPhoneDigits
} from "../../../lib/phone-format";
import { languageLabels, type ProLanguage } from "../i18n";
import styles from "../pro.module.css";

const countries = [
  "Ukraine",
  "Russia",
  "Poland",
  "United Kingdom",
  "United States",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Czech Republic",
  "Slovakia",
  "Moldova",
  "Romania",
  "Georgia",
  "Armenia",
  "Kazakhstan",
  "Lithuania",
  "Latvia",
  "Estonia",
  "Turkey",
  "United Arab Emirates",
  "Canada",
  "International"
];

const phoneCountries = countries;
const languages: ProLanguage[] = ["ru", "uk", "en"];
const currencies = ["USD", "RUB", "UAH", "EUR", "PLN", "GBP", "KZT", "GEL", "AED", "CAD"];
const liveDraftKey = "rezervo-pro-create-account-draft";
const setupDraftKey = "rezervo-pro-account-draft";
const timezones = [
  { value: "Pacific/Honolulu", label: "UTC-10 · Honolulu" },
  { value: "America/Anchorage", label: "UTC-9 · Anchorage" },
  { value: "America/Los_Angeles", label: "UTC-8 · Los Angeles" },
  { value: "America/Denver", label: "UTC-7 · Denver" },
  { value: "America/Chicago", label: "UTC-6 · Chicago" },
  { value: "America/New_York", label: "UTC-5 · New York" },
  { value: "America/Toronto", label: "UTC-5 · Toronto" },
  { value: "UTC", label: "UTC+0 · UTC" },
  { value: "Europe/London", label: "UTC+0 · London" },
  { value: "Europe/Warsaw", label: "UTC+1 · Warsaw" },
  { value: "Europe/Prague", label: "UTC+1 · Prague" },
  { value: "Europe/Berlin", label: "UTC+1 · Berlin" },
  { value: "Europe/Paris", label: "UTC+1 · Paris" },
  { value: "Europe/Madrid", label: "UTC+1 · Madrid" },
  { value: "Europe/Rome", label: "UTC+1 · Rome" },
  { value: "Europe/Kiev", label: "UTC+2 · Kyiv" },
  { value: "Europe/Kaliningrad", label: "UTC+2 · Kaliningrad" },
  { value: "Europe/Moscow", label: "UTC+3 · Moscow" },
  { value: "Europe/Samara", label: "UTC+4 · Samara" },
  { value: "Asia/Tbilisi", label: "UTC+4 · Tbilisi" },
  { value: "Asia/Yerevan", label: "UTC+4 · Yerevan" },
  { value: "Asia/Dubai", label: "UTC+4 · Dubai" },
  { value: "Asia/Yekaterinburg", label: "UTC+5 · Yekaterinburg" },
  { value: "Asia/Almaty", label: "UTC+6 · Almaty" },
  { value: "Asia/Omsk", label: "UTC+6 · Omsk" },
  { value: "Asia/Novosibirsk", label: "UTC+7 · Novosibirsk" },
  { value: "Asia/Krasnoyarsk", label: "UTC+7 · Krasnoyarsk" },
  { value: "Asia/Irkutsk", label: "UTC+8 · Irkutsk" },
  { value: "Asia/Yakutsk", label: "UTC+9 · Yakutsk" },
  { value: "Asia/Vladivostok", label: "UTC+10 · Vladivostok" },
  { value: "Asia/Magadan", label: "UTC+11 · Magadan" },
  { value: "Asia/Kamchatka", label: "UTC+12 · Kamchatka" }
];

function getBrowserLanguage(): ProLanguage {
  if (typeof window === "undefined") return "ru";

  const browserLanguages = [
    navigator.language,
    ...(navigator.languages ?? [])
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (browserLanguages.some((value) => value.startsWith("uk") || value.includes("-ua"))) {
    return "uk";
  }

  if (browserLanguages.some((value) => value.startsWith("en"))) {
    return "en";
  }

  return "ru";
}

function getBrowserCountry() {
  if (typeof window === "undefined") return "Ukraine";

  const locale = navigator.language || "";
  const region = locale.split("-")[1]?.toUpperCase();
  const countriesByRegion: Record<string, string> = {
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

  return countriesByRegion[region] || "Ukraine";
}

function getBrowserTimezone() {
  if (typeof window === "undefined") return "Europe/Kiev";

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezones.some((timezone) => timezone.value === browserTimezone)
    ? browserTimezone
    : "Europe/Kiev";
}

function inferCurrency(country: string) {
  const lower = country.toLowerCase();
  if (lower.includes("ukraine")) return "UAH";
  if (lower.includes("russia")) return "RUB";
  if (lower.includes("poland")) return "PLN";
  if (lower.includes("kingdom")) return "GBP";
  if (lower.includes("kazakhstan")) return "KZT";
  if (lower.includes("georgia")) return "GEL";
  if (lower.includes("emirates")) return "AED";
  if (lower.includes("canada")) return "CAD";
  if (
    lower.includes("germany") ||
    lower.includes("france") ||
    lower.includes("spain") ||
    lower.includes("italy") ||
    lower.includes("czech") ||
    lower.includes("slovakia") ||
    lower.includes("lithuania") ||
    lower.includes("latvia") ||
    lower.includes("estonia")
  ) {
    return "EUR";
  }
  return "USD";
}

type CreateAccountLiveDraft = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  country?: string;
  phoneCountry?: string;
  timezone?: string;
  currency?: string;
  termsAccepted?: boolean;
};

type SetupAccountDraft = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  country?: string;
  timezone?: string;
  currency?: string;
};

function readStoredJson<T>(storage: Storage, key: string) {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function isKnownCountry(value: string | undefined): value is string {
  return typeof value === "string" && countries.includes(value);
}

function isKnownCurrency(value: string | undefined): value is string {
  return typeof value === "string" && currencies.includes(value);
}

function isKnownTimezone(value: string | undefined): value is string {
  return typeof value === "string" && timezones.some((timezone) => timezone.value === value);
}

function formatPhoneForCountry(value: string, country: string) {
  return formatPhoneLocal(onlyPhoneDigits(value), getPhoneRule(country));
}

function makeGeneratedPassword() {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `G-${randomPart}-rezervo`;
}

const formCopy = {
  ru: {
    eyebrow: "Timviz для бизнеса",
    title: "Создайте рабочий кабинет для записей",
    firstName: "Имя",
    firstNamePlaceholder: "Введите свое имя",
    lastName: "Фамилия",
    lastNamePlaceholder: "Введите свою фамилию",
    password: "Пароль",
    passwordPlaceholder: "Введите новый пароль",
    email: "Email",
    phone: "Префикс и номер телефона",
    prefixAria: "Выбрать телефонный префикс",
    country: "Страна",
    currency: "Валюта",
    timezone: "Часовой пояс",
    terms: "Я принимаю политику конфиденциальности, условия предоставления услуг и условия сотрудничества.",
    submit: "Создать аккаунт",
    login: "Уже есть аккаунт?",
    google: "Продолжить через Google",
    googleFromLogin: "Аккаунт не найден. Завершите регистрацию бизнеса через Google."
  },
  uk: {
    eyebrow: "Timviz для бізнесу",
    title: "Створіть робочий кабінет для записів",
    firstName: "Ім'я",
    firstNamePlaceholder: "Введіть своє ім'я",
    lastName: "Прізвище",
    lastNamePlaceholder: "Введіть своє прізвище",
    password: "Пароль",
    passwordPlaceholder: "Введіть новий пароль",
    email: "Email",
    phone: "Префікс і номер телефону",
    prefixAria: "Вибрати телефонний префікс",
    country: "Країна",
    currency: "Валюта",
    timezone: "Часовий пояс",
    terms: "Я приймаю політику конфіденційності, умови надання послуг та умови співпраці.",
    submit: "Створити акаунт",
    login: "Вже є акаунт?",
    google: "Продовжити через Google",
    googleFromLogin: "Акаунт не знайдено. Завершіть реєстрацію бізнесу через Google."
  },
  en: {
    eyebrow: "Timviz for business",
    title: "Create a booking workspace",
    firstName: "First name",
    firstNamePlaceholder: "Enter your first name",
    lastName: "Last name",
    lastNamePlaceholder: "Enter your last name",
    password: "Password",
    passwordPlaceholder: "Enter a new password",
    email: "Email",
    phone: "Phone prefix and number",
    prefixAria: "Choose phone prefix",
    country: "Country",
    currency: "Currency",
    timezone: "Time zone",
    terms: "I accept the privacy policy, terms of service and cooperation terms.",
    submit: "Create account",
    login: "Already have an account?",
    google: "Continue with Google",
    googleFromLogin: "Account not found. Complete business registration with Google."
  }
} satisfies Record<ProLanguage, Record<string, string>>;

export default function CreateAccountForm() {
  const router = useRouter();
  const prefixMenuRef = useRef<HTMLDivElement | null>(null);
  const countryMenuRef = useRef<HTMLDivElement | null>(null);
  const timezoneMenuRef = useRef<HTMLDivElement | null>(null);
  const hasHydratedDraftRef = useRef(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Ukraine");
  const [phoneCountry, setPhoneCountry] = useState("Ukraine");
  const [timezone, setTimezone] = useState("Europe/Kiev");
  const [language, setLanguage] = useState<ProLanguage>("ru");
  const [currency, setCurrency] = useState("UAH");
  const [phoneError, setPhoneError] = useState("");
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [googleNotice, setGoogleNotice] = useState("");

  const phoneRule = getPhoneRule(phoneCountry);
  const phoneIsValid = isPhoneValid(phoneCountry, phone);
  const timezoneLabel = timezones.find((timezoneOption) => timezoneOption.value === timezone)?.label ?? timezone;
  const t = formCopy[language];

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("rezervo-pro-language");
    const initialLanguage = languages.includes(savedLanguage as ProLanguage)
      ? (savedLanguage as ProLanguage)
      : getBrowserLanguage();
    const initialCountry = getBrowserCountry();
    const liveDraft = readStoredJson<CreateAccountLiveDraft>(window.sessionStorage, liveDraftKey);
    const setupDraft = readStoredJson<SetupAccountDraft>(window.localStorage, setupDraftKey);
    const draftCountry = isKnownCountry(liveDraft?.country)
      ? liveDraft.country
      : isKnownCountry(setupDraft?.country)
        ? setupDraft.country
        : initialCountry;
    const draftPhoneCountry = isKnownCountry(liveDraft?.phoneCountry)
      ? liveDraft.phoneCountry
      : draftCountry;
    const draftPhoneRule = getPhoneRule(draftPhoneCountry);
    const draftPhone = typeof liveDraft?.phone === "string"
      ? formatPhoneLocal(liveDraft.phone, draftPhoneRule)
      : typeof setupDraft?.phone === "string"
        ? formatPhoneLocal(getPhoneLocalDigits(setupDraft.phone, draftPhoneRule), draftPhoneRule)
        : "";

    setLanguage(initialLanguage);
    setFirstName(liveDraft?.firstName ?? setupDraft?.firstName ?? "");
    setLastName(liveDraft?.lastName ?? setupDraft?.lastName ?? "");
    setEmail(liveDraft?.email ?? setupDraft?.email ?? "");
    setPassword(liveDraft?.password ?? setupDraft?.password ?? "");
    setPhone(draftPhone);
    setCountry(draftCountry);
    setPhoneCountry(draftPhoneCountry);
    setCurrency(
      isKnownCurrency(liveDraft?.currency)
        ? liveDraft.currency
        : isKnownCurrency(setupDraft?.currency)
          ? setupDraft.currency
          : inferCurrency(draftCountry)
    );
    setTimezone(
      isKnownTimezone(liveDraft?.timezone)
        ? liveDraft.timezone
        : isKnownTimezone(setupDraft?.timezone)
          ? setupDraft.timezone
          : getBrowserTimezone()
    );
    setTermsAccepted(liveDraft?.termsAccepted ?? true);
    window.localStorage.setItem("rezervo-pro-language", initialLanguage);
    document.documentElement.lang = initialLanguage;
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: initialLanguage }));
    hasHydratedDraftRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedDraftRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("google") !== "1") {
      return;
    }

    const emailFromGoogle = params.get("email")?.trim() || "";
    const firstNameFromGoogle = params.get("firstName")?.trim() || "";
    const lastNameFromGoogle = params.get("lastName")?.trim() || "";
    const localeFromGoogle = params.get("locale")?.toUpperCase() || "";
    const cameFromLogin = params.get("google_from") === "login";

    if (emailFromGoogle) {
      setEmail(emailFromGoogle);
    }
    if (firstNameFromGoogle) {
      setFirstName(firstNameFromGoogle);
    }
    if (lastNameFromGoogle) {
      setLastName(lastNameFromGoogle);
    }
    setPassword((current) => current || makeGeneratedPassword());
    setTermsAccepted(true);

    if (localeFromGoogle.endsWith("UA")) {
      setCountry("Ukraine");
      setPhoneCountry("Ukraine");
      setTimezone((current) => current || "Europe/Kiev");
    } else if (localeFromGoogle.endsWith("US")) {
      setCountry("United States");
      setPhoneCountry("United States");
      setTimezone((current) => current || "America/New_York");
    }

    setGoogleNotice(cameFromLogin ? t.googleFromLogin : "");
  }, [t.googleFromLogin]);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<ProLanguage>).detail;
      if (languages.includes(nextLanguage)) {
        setLanguage(nextLanguage);
      }
    };

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, []);

  useEffect(() => {
    function closeFloatingMenus(event: MouseEvent) {
      const target = event.target as Node;

      if (!prefixMenuRef.current?.contains(target)) {
        setIsPrefixOpen(false);
      }

      if (!countryMenuRef.current?.contains(target)) {
        setIsCountryOpen(false);
      }

      if (!timezoneMenuRef.current?.contains(target)) {
        setIsTimezoneOpen(false);
      }
    }

    document.addEventListener("mousedown", closeFloatingMenus);
    return () => document.removeEventListener("mousedown", closeFloatingMenus);
  }, []);

  useEffect(() => {
    if (!hasHydratedDraftRef.current) {
      return;
    }

    window.sessionStorage.setItem(
      liveDraftKey,
      JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        phone,
        country,
        phoneCountry,
        timezone,
        currency,
        termsAccepted
      } satisfies CreateAccountLiveDraft)
    );
  }, [country, currency, email, firstName, lastName, password, phone, phoneCountry, termsAccepted, timezone]);

  function continueToSetup() {
    if (!phoneIsValid) {
      setPhoneError(getPhoneValidationMessage(phoneCountry));
      return;
    }

    window.localStorage.setItem(
      "rezervo-pro-account-draft",
      JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        phone: buildInternationalPhone(phoneCountry, phone),
        country,
        timezone,
        language: languageLabels[language],
        currency
      })
    );

    router.push("/pro/setup");
  }

  return (
    <>
    <div className={styles.panel}>
      <div>
        <p className={styles.eyebrow}>{t.eyebrow}</p>
        <h1 className={`${styles.heroTitle} ${styles.createHeroTitle}`}>
          {t.title}
        </h1>
      </div>

      <div className={`${styles.fieldStack} ${styles.createAccountGrid}`}>
        <div className={styles.field}>
          <label htmlFor="firstName">{t.firstName}</label>
          <input
            id="firstName"
            className={styles.input}
            placeholder={t.firstNamePlaceholder}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName">{t.lastName}</label>
          <input
            id="lastName"
            className={styles.input}
            placeholder={t.lastNamePlaceholder}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">{t.password}</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="email">{t.email}</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="phone">{t.phone}</label>
          <div className={`${styles.phoneRow} ${styles.createPhoneRow}`}>
            <div className={styles.phonePrefixPicker} ref={prefixMenuRef}>
              <button
                type="button"
                className={`${styles.phonePrefixButton} ${isPrefixOpen ? styles.phonePrefixButtonOpen : ""}`}
                aria-label={t.prefixAria}
                aria-expanded={isPrefixOpen}
                onClick={() => setIsPrefixOpen((value) => !value)}
              >
                <span>{phoneRule.prefix}</span>
                <span aria-hidden="true">⌄</span>
              </button>
              {isPrefixOpen ? (
                <div className={styles.phonePrefixMenu}>
                  {phoneCountries.map((phoneCountryOption) => {
                    const optionRule = getPhoneRule(phoneCountryOption);
                    return (
                      <button
                        key={phoneCountryOption}
                        type="button"
                        className={phoneCountry === phoneCountryOption ? styles.phonePrefixOptionActive : ""}
                        onClick={() => {
                          setPhoneCountry(phoneCountryOption);
                          setPhone((current) => formatPhoneForCountry(current, phoneCountryOption));
                          setPhoneError("");
                          setIsPrefixOpen(false);
                        }}
                      >
                        <strong>{optionRule.prefix}</strong>
                        <span>{phoneCountryOption}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <input
              id="phone"
              className={styles.phoneInput}
              inputMode="numeric"
              placeholder={phoneRule.placeholder}
              value={phone}
              onChange={(event) => {
                setPhone(formatPhoneLocal(event.target.value, phoneRule));
                setPhoneError("");
              }}
              onBlur={() => {
                if (phone.trim() && !phoneIsValid) {
                  setPhoneError(getPhoneValidationMessage(phoneCountry));
                }
              }}
            />
          </div>
          {phoneError ? <span className={styles.fieldError}>{phoneError}</span> : null}
        </div>
        <div className={styles.field}>
          <label id="country-label">{t.country}</label>
          <div className={styles.createSelectPicker} ref={countryMenuRef}>
            <button
              type="button"
              className={`${styles.createSelectButton} ${isCountryOpen ? styles.createSelectButtonOpen : ""}`}
              aria-labelledby="country-label"
              aria-expanded={isCountryOpen}
              onClick={() => setIsCountryOpen((value) => !value)}
            >
              <span>{country}</span>
              <span aria-hidden="true">⌄</span>
            </button>
            {isCountryOpen ? (
              <div className={styles.createSelectMenu}>
                {countries.map((countryOption) => (
                  <button
                    key={countryOption}
                    type="button"
                    className={country === countryOption ? styles.createSelectOptionActive : ""}
                    onClick={() => {
                      setCountry(countryOption);
                      setPhoneCountry(countryOption);
                      setCurrency(inferCurrency(countryOption));
                      setPhone((current) => formatPhoneForCountry(current, countryOption));
                      setPhoneError("");
                      setIsCountryOpen(false);
                    }}
                  >
                    {countryOption}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="currency">{t.currency}</label>
          <select
            id="currency"
            className={styles.select}
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {currencies.map((currencyOption) => (
              <option key={currencyOption} value={currencyOption}>
                {currencyOption}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label id="timezone-label">{t.timezone}</label>
          <div className={styles.createSelectPicker} ref={timezoneMenuRef}>
            <button
              type="button"
              className={`${styles.createSelectButton} ${isTimezoneOpen ? styles.createSelectButtonOpen : ""}`}
              aria-labelledby="timezone-label"
              aria-expanded={isTimezoneOpen}
              onClick={() => setIsTimezoneOpen((value) => !value)}
            >
              <span>{timezoneLabel}</span>
              <span aria-hidden="true">⌄</span>
            </button>
            {isTimezoneOpen ? (
              <div className={styles.createSelectMenu}>
                {timezones.map((timezoneOption) => (
                  <button
                    key={timezoneOption.value}
                    type="button"
                    className={timezone === timezoneOption.value ? styles.createSelectOptionActive : ""}
                    onClick={() => {
                      setTimezone(timezoneOption.value);
                      setIsTimezoneOpen(false);
                    }}
                  >
                    {timezoneOption.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <a href="/api/pro/auth/google/start?mode=register" className={styles.ghostButton}>
        {t.google}
      </a>

      {googleNotice ? <div className={styles.addressWarning}>{googleNotice}</div> : null}

      <label className={styles.terms}>
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
        />
        <span>
          {t.terms}
        </span>
      </label>

      <div className={styles.createAccountActions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={
            !termsAccepted ||
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !password.trim() ||
            !phoneIsValid
          }
          onClick={continueToSetup}
        >
          {t.submit}
        </button>
        <a className={styles.mutedLink} href="/pro/login">{t.login}</a>
      </div>
    </div>
    </>
  );
}
