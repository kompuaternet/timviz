"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildInternationalPhone,
  formatPhoneLocal,
  getPhoneLocalDigits,
  getPhoneRule,
  getPhoneValidationMessage,
  inferPhoneCountryFromLocales,
  isPhoneValid,
  onlyPhoneDigits,
  phoneCountries
} from "../../../lib/phone-format";
import { languageLabels, type ProLanguage } from "../i18n";
import styles from "../pro.module.css";

type CountryConfig = {
  country: string;
  currency: string;
  timezone: string;
};

const countryConfigs: CountryConfig[] = [
  { country: "Ukraine", currency: "UAH", timezone: "Europe/Kiev" },
  { country: "Poland", currency: "PLN", timezone: "Europe/Warsaw" },
  { country: "United Kingdom", currency: "GBP", timezone: "Europe/London" },
  { country: "United States", currency: "USD", timezone: "America/New_York" },
  { country: "Canada", currency: "CAD", timezone: "America/Toronto" },
  { country: "Germany", currency: "EUR", timezone: "Europe/Berlin" },
  { country: "France", currency: "EUR", timezone: "Europe/Paris" },
  { country: "Spain", currency: "EUR", timezone: "Europe/Madrid" },
  { country: "Italy", currency: "EUR", timezone: "Europe/Rome" },
  { country: "Czech Republic", currency: "CZK", timezone: "Europe/Prague" },
  { country: "Slovakia", currency: "EUR", timezone: "Europe/Prague" },
  { country: "Moldova", currency: "MDL", timezone: "Europe/Chisinau" },
  { country: "Romania", currency: "RON", timezone: "Europe/Bucharest" },
  { country: "Georgia", currency: "GEL", timezone: "Asia/Tbilisi" },
  { country: "Armenia", currency: "AMD", timezone: "Asia/Yerevan" },
  { country: "Kazakhstan", currency: "KZT", timezone: "Asia/Almaty" },
  { country: "Lithuania", currency: "EUR", timezone: "Europe/Vilnius" },
  { country: "Latvia", currency: "EUR", timezone: "Europe/Riga" },
  { country: "Estonia", currency: "EUR", timezone: "Europe/Tallinn" },
  { country: "Turkey", currency: "TRY", timezone: "Europe/Istanbul" },
  { country: "United Arab Emirates", currency: "AED", timezone: "Asia/Dubai" },
  { country: "Russia", currency: "RUB", timezone: "Europe/Moscow" },
  { country: "International", currency: "USD", timezone: "" }
];

const countries = countryConfigs.map((item) => item.country);
const languages: ProLanguage[] = ["ru", "uk", "en"];
const currencies = ["USD", "RUB", "UAH", "EUR", "PLN", "GBP", "KZT", "GEL", "AED", "CAD", "CZK", "MDL", "RON", "AMD", "TRY"];
const liveDraftKey = "rezervo-pro-create-account-draft";
const setupDraftKey = "rezervo-pro-account-draft";
const timezones = [
  { value: "", label: "" },
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
  { value: "Europe/Bucharest", label: "UTC+2 · Bucharest" },
  { value: "Europe/Chisinau", label: "UTC+2 · Chisinau" },
  { value: "Europe/Vilnius", label: "UTC+2 · Vilnius" },
  { value: "Europe/Riga", label: "UTC+2 · Riga" },
  { value: "Europe/Tallinn", label: "UTC+2 · Tallinn" },
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

function getCountryConfig(country: string) {
  return countryConfigs.find((item) => item.country === country) || countryConfigs[0];
}

function getBrowserLanguage(): ProLanguage {
  if (typeof window === "undefined") return "ru";

  const browserLanguages = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (browserLanguages.some((value) => value.startsWith("uk") || value.includes("-ua"))) return "uk";
  if (browserLanguages.some((value) => value.startsWith("en"))) return "en";
  return "ru";
}

function getBrowserRegion() {
  if (typeof window === "undefined") return "";
  const locale = navigator.language || "";
  return locale.split("-")[1]?.toUpperCase() || "";
}

function getCountryFromRegion(region: string) {
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
  return countriesByRegion[region] || "";
}

function getCountryFromTimezone(timezone: string) {
  const countriesByTimezone: Record<string, string> = {
    "Europe/Kiev": "Ukraine",
    "Europe/Warsaw": "Poland",
    "Europe/London": "United Kingdom",
    "America/New_York": "United States",
    "America/Toronto": "Canada",
    "Europe/Berlin": "Germany",
    "Europe/Paris": "France",
    "Europe/Madrid": "Spain",
    "Europe/Rome": "Italy",
    "Europe/Prague": "Czech Republic",
    "Europe/Chisinau": "Moldova",
    "Europe/Bucharest": "Romania",
    "Asia/Tbilisi": "Georgia",
    "Asia/Yerevan": "Armenia",
    "Asia/Almaty": "Kazakhstan",
    "Europe/Vilnius": "Lithuania",
    "Europe/Riga": "Latvia",
    "Europe/Tallinn": "Estonia",
    "Europe/Istanbul": "Turkey",
    "Asia/Dubai": "United Arab Emirates",
    "Europe/Moscow": "Russia"
  };

  return countriesByTimezone[timezone] || "";
}

function getBrowserCountry() {
  if (typeof window === "undefined") return "Ukraine";

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const localeCandidates = [
    navigator.language,
    ...(navigator.languages ?? []),
    Intl.DateTimeFormat().resolvedOptions().locale
  ].filter(Boolean);

  return (
    inferPhoneCountryFromLocales(localeCandidates) ||
    getCountryFromRegion(getBrowserRegion()) ||
    getCountryFromTimezone(browserTimezone) ||
    "Ukraine"
  );
}

function getBrowserTimezone() {
  if (typeof window === "undefined") return "";
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezones.some((timezone) => timezone.value === browserTimezone) ? browserTimezone : "";
}

function inferCurrency(country: string) {
  return getCountryConfig(country).currency || "USD";
}

function inferTimezone(country: string) {
  return getCountryConfig(country).timezone || "";
}

type CreateAccountLiveDraft = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
  phone?: string;
  country?: string;
  phoneCountry?: string;
  timezone?: string;
  currency?: string;
  termsAccepted?: boolean;
  step?: "entry" | "details";
};

type SetupAccountDraft = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
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
  return `G-${randomPart}-timviz`;
}

const formCopy = {
  ru: {
    introEyebrow: "Timviz для профессионалов",
    introTitle: "Создайте аккаунт или войдите для управления бизнесом.",
    introText: "Начните с Google или продолжите по email. На следующем шаге мы попросим только основные данные.",
    introEmailPlaceholder: "Введите email",
    introContinue: "Продолжить",
    introOr: "или",
    introGoogle: "Войти через Google",
    introChecking: "Проверяем...",
    introHelper: "Вы клиент и хотите записаться на услугу?",
    introHelperLink: "Перейти к клиентскому каталогу",
    detailsTitle: "Проверьте и подтвердите",
    detailsText: "Имя, телефон, страна, валюта и часовой пояс можно изменить сейчас. Именно эти данные мы используем для первого рабочего кабинета.",
    firstName: "Имя",
    firstNamePlaceholder: "Введите свое имя",
    lastName: "Фамилия",
    lastNamePlaceholder: "Введите свою фамилию",
    password: "Пароль",
    passwordPlaceholder: "Создайте пароль",
    email: "Email",
    phone: "Номер мобильного",
    phonePlaceholder: "Введите номер мобильного телефона",
    prefixAria: "Выбрать телефонный префикс",
    prefixSearch: "Поиск по стране или коду",
    country: "Страна",
    currency: "Валюта",
    timezone: "Часовой пояс",
    timezonePlaceholder: "Выберите часовой пояс",
    cabinetLanguage: "Язык кабинета",
    terms: "Я принимаю политику конфиденциальности, условия предоставления услуг и условия сотрудничества.",
    submit: "Продолжить",
    login: "Уже есть аккаунт?",
    loginLink: "Войти в кабинет",
    accountExistsTitle: "Этот email уже зарегистрирован",
    accountExistsText: "Можно сразу войти в кабинет или восстановить пароль, чтобы не создавать второй аккаунт.",
    forgotPassword: "Восстановить пароль",
    googleNotice: "Аккаунт не найден. Завершите регистрацию бизнеса через Google.",
    mobileRequired: "Номер мобильного требуется"
  },
  uk: {
    introEyebrow: "Timviz для професіоналів",
    introTitle: "Створіть акаунт або увійдіть для керування бізнесом.",
    introText: "Почніть з Google або продовжіть за email. На наступному кроці ми попросимо лише основні дані.",
    introEmailPlaceholder: "Введіть email",
    introContinue: "Продовжити",
    introOr: "або",
    introGoogle: "Увійти через Google",
    introChecking: "Перевіряємо...",
    introHelper: "Ви клієнт і хочете записатися на послугу?",
    introHelperLink: "Перейти до клієнтського каталогу",
    detailsTitle: "Перевірте і підтвердіть",
    detailsText: "Ім'я, телефон, країну, валюту і часовий пояс можна змінити зараз. Саме ці дані ми використаємо для першого робочого кабінету.",
    firstName: "Ім'я",
    firstNamePlaceholder: "Введіть своє ім'я",
    lastName: "Прізвище",
    lastNamePlaceholder: "Введіть своє прізвище",
    password: "Пароль",
    passwordPlaceholder: "Створіть пароль",
    email: "Email",
    phone: "Номер мобільного",
    phonePlaceholder: "Введіть номер мобільного телефону",
    prefixAria: "Вибрати телефонний префікс",
    prefixSearch: "Пошук за країною або кодом",
    country: "Країна",
    currency: "Валюта",
    timezone: "Часовий пояс",
    timezonePlaceholder: "Виберіть часовий пояс",
    cabinetLanguage: "Мова кабінету",
    terms: "Я приймаю політику конфіденційності, умови надання послуг та умови співпраці.",
    submit: "Продовжити",
    login: "Вже є акаунт?",
    loginLink: "Увійти в кабінет",
    accountExistsTitle: "Цей email уже зареєстрований",
    accountExistsText: "Можна одразу увійти в кабінет або відновити пароль, щоб не створювати другий акаунт.",
    forgotPassword: "Відновити пароль",
    googleNotice: "Акаунт не знайдено. Завершіть реєстрацію бізнесу через Google.",
    mobileRequired: "Номер мобільного обов'язковий"
  },
  en: {
    introEyebrow: "Timviz for professionals",
    introTitle: "Create an account or sign in to run your business.",
    introText: "Start with Google or continue with email. On the next step we only ask for the essentials.",
    introEmailPlaceholder: "Enter your email",
    introContinue: "Continue",
    introOr: "or",
    introGoogle: "Continue with Google",
    introChecking: "Checking...",
    introHelper: "Are you a client looking to book a service?",
    introHelperLink: "Go to the client catalog",
    detailsTitle: "Review and confirm",
    detailsText: "You can adjust your name, phone, country, currency and time zone now. We use these details to set up your first workspace.",
    firstName: "First name",
    firstNamePlaceholder: "Enter your first name",
    lastName: "Last name",
    lastNamePlaceholder: "Enter your last name",
    password: "Password",
    passwordPlaceholder: "Create a password",
    email: "Email",
    phone: "Mobile number",
    phonePlaceholder: "Enter your mobile number",
    prefixAria: "Choose phone prefix",
    prefixSearch: "Search by country or code",
    country: "Country",
    currency: "Currency",
    timezone: "Time zone",
    timezonePlaceholder: "Choose a time zone",
    cabinetLanguage: "Workspace language",
    terms: "I accept the privacy policy, terms of service and cooperation terms.",
    submit: "Continue",
    login: "Already have an account?",
    loginLink: "Sign in",
    accountExistsTitle: "This email is already registered",
    accountExistsText: "You can sign in right away or reset your password instead of creating a second account.",
    forgotPassword: "Reset password",
    googleNotice: "Account not found. Finish business registration with Google.",
    mobileRequired: "Mobile number is required"
  }
} satisfies Record<ProLanguage, Record<string, string>>;

export default function CreateAccountForm() {
  const router = useRouter();
  const prefixMenuRef = useRef<HTMLDivElement | null>(null);
  const hasHydratedDraftRef = useRef(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Ukraine");
  const [phoneCountry, setPhoneCountry] = useState("Ukraine");
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState<ProLanguage>("ru");
  const [currency, setCurrency] = useState("UAH");
  const [phoneError, setPhoneError] = useState("");
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");
  const [existingAccountEmail, setExistingAccountEmail] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [step, setStep] = useState<"entry" | "details">("entry");

  const phoneRule = getPhoneRule(phoneCountry);
  const phoneIsValid = isPhoneValid(phoneCountry, phone);
  const t = formCopy[language];

  function applyLanguage(nextLanguage: ProLanguage) {
    setLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rezervo-pro-language", nextLanguage);
      document.documentElement.lang = nextLanguage;
      window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: nextLanguage }));
    }
  }

  const filteredPhoneCountries = useMemo(() => {
    const query = prefixSearch.trim().toLowerCase();
    if (!query) return phoneCountries;
    return phoneCountries.filter((optionCountry) => {
      const optionRule = getPhoneRule(optionCountry);
      return optionCountry.toLowerCase().includes(query) || optionRule.prefix.toLowerCase().includes(query);
    });
  }, [prefixSearch]);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("rezervo-pro-language");
    const initialLanguage = languages.includes(savedLanguage as ProLanguage)
      ? (savedLanguage as ProLanguage)
      : getBrowserLanguage();
    const browserCountry = getBrowserCountry();
    const browserTimezone = getBrowserTimezone();
    const params = new URLSearchParams(window.location.search);
    const inviteFromQuery = params.get("invite")?.trim() || "";
    const emailFromQuery = params.get("email")?.trim() || "";
    const avatarFromQuery = params.get("avatarUrl")?.trim() || "";
    const liveDraft = readStoredJson<CreateAccountLiveDraft>(window.sessionStorage, liveDraftKey);
    const setupDraft = readStoredJson<SetupAccountDraft>(window.localStorage, setupDraftKey);
    const draftCountry = isKnownCountry(liveDraft?.country)
      ? liveDraft.country
      : isKnownCountry(setupDraft?.country)
        ? setupDraft.country
        : browserCountry;
    const hasStoredPhone =
      typeof liveDraft?.phone === "string"
        ? liveDraft.phone.trim().length > 0
        : typeof setupDraft?.phone === "string"
          ? setupDraft.phone.trim().length > 0
          : false;
    const storedPhoneCountry = isKnownCountry(liveDraft?.phoneCountry) ? liveDraft.phoneCountry : "";
    const draftPhoneCountry = hasStoredPhone ? storedPhoneCountry || draftCountry : draftCountry;
    const draftPhoneRule = getPhoneRule(draftPhoneCountry);
    const draftPhone = typeof liveDraft?.phone === "string"
      ? formatPhoneLocal(liveDraft.phone, draftPhoneRule)
      : typeof setupDraft?.phone === "string"
        ? formatPhoneLocal(getPhoneLocalDigits(setupDraft.phone, draftPhoneRule), draftPhoneRule)
        : "";

    setLanguage(initialLanguage);
    setFirstName(liveDraft?.firstName ?? setupDraft?.firstName ?? "");
    setLastName(liveDraft?.lastName ?? setupDraft?.lastName ?? "");
    setEmail(emailFromQuery || liveDraft?.email || setupDraft?.email || "");
    setPassword(liveDraft?.password ?? setupDraft?.password ?? "");
    setAvatarUrl(avatarFromQuery || liveDraft?.avatarUrl || setupDraft?.avatarUrl || "");
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
          : browserTimezone || inferTimezone(draftCountry)
    );
    setTermsAccepted(liveDraft?.termsAccepted ?? true);
    setStep(liveDraft?.step === "details" || setupDraft?.email ? "details" : "entry");
    setInviteToken(inviteFromQuery);
    window.localStorage.setItem("rezervo-pro-language", initialLanguage);
    document.documentElement.lang = initialLanguage;
    window.dispatchEvent(new CustomEvent("rezervo-language-change", { detail: initialLanguage }));
    hasHydratedDraftRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedDraftRef.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("google") !== "1") return;

    const emailFromGoogle = params.get("email")?.trim() || "";
    const firstNameFromGoogle = params.get("firstName")?.trim() || "";
    const lastNameFromGoogle = params.get("lastName")?.trim() || "";
    const avatarFromGoogle = params.get("avatarUrl")?.trim() || "";
    const localeFromGoogle = params.get("locale")?.toUpperCase() || "";
    const cameFromLogin = params.get("google_from") === "login";
    const googleCountry = localeFromGoogle ? getCountryFromRegion(localeFromGoogle.split(/[-_]/).pop() || "") : "";

    if (emailFromGoogle) setEmail(emailFromGoogle);
    if (firstNameFromGoogle) setFirstName(firstNameFromGoogle);
    if (lastNameFromGoogle) setLastName(lastNameFromGoogle);
    if (avatarFromGoogle) setAvatarUrl(avatarFromGoogle);
    setPassword((current) => current || makeGeneratedPassword());
    setTermsAccepted(true);
    setStep("details");

    if (googleCountry) {
      setCountry(googleCountry);
      setPhoneCountry(googleCountry);
      setCurrency(inferCurrency(googleCountry));
      setTimezone(inferTimezone(googleCountry));
    }

    setGoogleNotice(cameFromLogin ? t.googleNotice : "");
  }, [t.googleNotice]);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<ProLanguage>).detail;
      if (languages.includes(nextLanguage)) setLanguage(nextLanguage);
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
    }
    document.addEventListener("mousedown", closeFloatingMenus);
    return () => document.removeEventListener("mousedown", closeFloatingMenus);
  }, []);

  useEffect(() => {
    if (!hasHydratedDraftRef.current) return;

    window.sessionStorage.setItem(
      liveDraftKey,
      JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        avatarUrl,
        phone,
        country,
        phoneCountry,
        timezone,
        currency,
        termsAccepted,
        step
      } satisfies CreateAccountLiveDraft)
    );
  }, [avatarUrl, country, currency, email, firstName, lastName, password, phone, phoneCountry, step, termsAccepted, timezone]);

  useEffect(() => {
    setExistingAccountEmail("");
  }, [email]);

  function syncCountry(nextCountry: string, source: "country" | "prefix") {
    setCountry(nextCountry);
    setPhoneCountry(nextCountry);
    setCurrency(inferCurrency(nextCountry));
    setTimezone(inferTimezone(nextCountry));
    setPhone((current) => formatPhoneForCountry(current, nextCountry));
    setPhoneError("");
    if (source === "prefix") {
      setIsPrefixOpen(false);
      setPrefixSearch("");
    }
  }

  async function emailAlreadyExists(emailToCheck: string) {
    const response = await fetch("/api/pro/account/check-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: emailToCheck.trim() })
    });
    const result = await response.json().catch(() => ({ exists: false }));
    return Boolean(result.exists);
  }

  async function moveToDetails() {
    if (!email.trim()) return;

    setIsCheckingEmail(true);
    const exists = await emailAlreadyExists(email);
    setIsCheckingEmail(false);

    if (exists) {
      setExistingAccountEmail(email.trim());
      return;
    }

    setStep("details");
  }

  async function continueToSetup() {
    if (!phone.trim()) {
      setPhoneError(t.mobileRequired);
      return;
    }
    if (!phoneIsValid) {
      setPhoneError(getPhoneValidationMessage(phoneCountry));
      return;
    }

    setIsCheckingEmail(true);
    const exists = await emailAlreadyExists(email);
    setIsCheckingEmail(false);

    if (exists) {
      setExistingAccountEmail(email.trim());
      setStep("entry");
      return;
    }

    window.localStorage.setItem(
      setupDraftKey,
      JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        avatarUrl,
        phone: buildInternationalPhone(phoneCountry, phone),
        country,
        timezone,
        language: languageLabels[language],
        currency
      })
    );

    router.push(inviteToken ? `/pro/setup?invite=${encodeURIComponent(inviteToken)}` : "/pro/setup");
  }

  if (step === "entry") {
    return (
      <div className={`${styles.panel} ${styles.createEntryPanel}`}>
        <div className={styles.createEntryIntro}>
          <p className={styles.eyebrow}>{t.introEyebrow}</p>
          <h1 className={`${styles.heroTitle} ${styles.createHeroTitle}`}>{t.introTitle}</h1>
          <p className={styles.heroSubtitle}>{t.introText}</p>
        </div>

        <div className={styles.createEntryStack}>
          <input
            type="email"
            className={`${styles.input} ${styles.createEntryInput}`}
            placeholder={t.introEmailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                moveToDetails();
              }
            }}
          />
          <button type="button" className={`${styles.primaryButton} ${styles.createEntryPrimary}`} onClick={moveToDetails} disabled={!email.trim()}>
            {isCheckingEmail ? t.introChecking : t.introContinue}
          </button>
        </div>

        {existingAccountEmail ? (
          <div className={styles.existingAccountNotice}>
            <strong>{t.accountExistsTitle}</strong>
            <p>{t.accountExistsText}</p>
            <div className={styles.existingAccountActions}>
              <a
                href={`/pro/login?email=${encodeURIComponent(existingAccountEmail)}${
                  inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""
                }`}
                className={styles.primaryButton}
              >
                {t.loginLink}
              </a>
              <a
                href={`/pro/forgot-password?email=${encodeURIComponent(existingAccountEmail)}`}
                className={styles.ghostButton}
              >
                {t.forgotPassword}
              </a>
            </div>
          </div>
        ) : null}

        <div className={styles.socialDivider}>{t.introOr}</div>

        <div className={styles.socialStack}>
          <a
            href={`/api/pro/auth/google/start?mode=register${
              inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""
            }`}
            className={styles.socialButton}
          >
            <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
            <span>{t.introGoogle}</span>
          </a>
        </div>

        <div className={styles.helperBlock}>
          <strong>{t.introHelper}</strong>
          <div>
            <a href={`/${language}/catalog`} className={styles.mutedLink}>{t.introHelperLink}</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.panel} ${styles.createDetailsPanel}`}>
      <button type="button" className={styles.createBackButton} onClick={() => setStep("entry")} aria-label="Back">
        <span aria-hidden="true">←</span>
      </button>

      <div className={styles.createDetailsIntro}>
        <h1 className={`${styles.heroTitle} ${styles.createHeroTitle}`}>{t.detailsTitle}</h1>
        <p className={styles.heroSubtitle}>{t.detailsText}</p>
      </div>

      <div className={`${styles.fieldStack} ${styles.createAccountGrid}`}>
        <div className={styles.field}>
          <label htmlFor="firstName">{t.firstName}</label>
          <input id="firstName" className={styles.input} placeholder={t.firstNamePlaceholder} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName">{t.lastName}</label>
          <input id="lastName" className={styles.input} placeholder={t.lastNamePlaceholder} value={lastName} onChange={(event) => setLastName(event.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">{t.password}</label>
          <input id="password" type="password" className={styles.input} placeholder={t.passwordPlaceholder} value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="email">{t.email}</label>
          <input id="email" type="email" className={styles.input} placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className={`${styles.field} ${styles.createFieldFull}`}>
          <label htmlFor="phone">{t.phone}</label>
          <div className={`${styles.phoneRow} ${styles.createPhoneRowWide}`}>
            <div className={styles.phonePrefixPicker} ref={prefixMenuRef}>
              <button
                type="button"
                className={`${styles.phonePrefixButton} ${styles.phonePrefixButtonWide} ${isPrefixOpen ? styles.phonePrefixButtonOpen : ""}`}
                aria-label={t.prefixAria}
                aria-expanded={isPrefixOpen}
                onClick={() => setIsPrefixOpen((value) => !value)}
              >
                <span>{phoneRule.prefix}</span>
                <span aria-hidden="true">⌄</span>
              </button>
              {isPrefixOpen ? (
                <div className={`${styles.phonePrefixMenu} ${styles.phonePrefixMenuRich}`}>
                  <div className={styles.phonePrefixSearchWrap}>
                    <input
                      type="text"
                      className={styles.phonePrefixSearch}
                      placeholder={t.prefixSearch}
                      value={prefixSearch}
                      onChange={(event) => setPrefixSearch(event.target.value)}
                    />
                  </div>
                  <div className={styles.phonePrefixList}>
                    {filteredPhoneCountries.map((phoneCountryOption) => {
                      const optionRule = getPhoneRule(phoneCountryOption);
                      const active = phoneCountry === phoneCountryOption;
                      return (
                        <button
                          key={phoneCountryOption}
                          type="button"
                          className={active ? styles.phonePrefixOptionActive : ""}
                          onClick={() => syncCountry(phoneCountryOption, "prefix")}
                        >
                          <span>{phoneCountryOption}</span>
                          <strong>{optionRule.prefix}</strong>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <input
              id="phone"
              className={styles.phoneInput}
              inputMode="numeric"
              placeholder={t.phonePlaceholder}
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
          <label htmlFor="country">{t.country}</label>
          <select
            id="country"
            className={styles.select}
            value={country}
            onChange={(event) => syncCountry(event.target.value, "country")}
          >
            {countries.map((countryOption) => (
              <option key={countryOption} value={countryOption}>{countryOption}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="currency">{t.currency}</label>
          <select id="currency" className={styles.select} value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {currencies.map((currencyOption) => (
              <option key={currencyOption} value={currencyOption}>{currencyOption}</option>
            ))}
          </select>
        </div>
        <div className={`${styles.field} ${styles.createFieldFull}`}>
          <label htmlFor="timezone">{t.timezone}</label>
          <select id="timezone" className={styles.select} value={timezone} onChange={(event) => setTimezone(event.target.value)}>
            <option value="">{t.timezonePlaceholder}</option>
            {timezones.filter((option) => option.value).map((timezoneOption) => (
              <option key={timezoneOption.value} value={timezoneOption.value}>{timezoneOption.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="cabinetLanguage">{t.cabinetLanguage}</label>
          <select
            id="cabinetLanguage"
            className={styles.select}
            value={language}
            onChange={(event) => applyLanguage(event.target.value as ProLanguage)}
          >
            {languages.map((languageOption) => (
              <option key={languageOption} value={languageOption}>
                {languageLabels[languageOption]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.createFieldSpacer} aria-hidden="true" />
      </div>

      {googleNotice ? <div className={styles.addressWarning}>{googleNotice}</div> : null}

      <label className={styles.terms}>
        <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
        <span>{t.terms}</span>
      </label>

      <div className={styles.createAccountActions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!termsAccepted || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !phoneIsValid || isCheckingEmail}
          onClick={() => void continueToSetup()}
        >
          {isCheckingEmail ? t.introChecking : t.submit}
        </button>
        <a
          className={styles.mutedLink}
          href={inviteToken ? `/pro/login?invite=${encodeURIComponent(inviteToken)}` : "/pro/login"}
        >
          {t.loginLink}
        </a>
      </div>
    </div>
  );
}
