"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { trackAdsEvent } from "../../../lib/ads-events";
import TurnstileWidget from "../TurnstileWidget";
import { isProLanguage, languageLabels, type ProLanguage } from "../i18n";
import styles from "../pro.module.css";

type CountryConfig = {
  country: string;
  currency: string;
  timezone: string;
};

type TelegramRuntime = {
  openLink?: (url: string, options?: { try_instant_view?: boolean; try_browser?: string }) => void;
  initData?: string;
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
const languages = Object.keys(languageLabels) as ProLanguage[];
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
  if (browserLanguages.some((value) => value.startsWith("fr"))) return "fr";
  if (browserLanguages.some((value) => value.startsWith("pl"))) return "pl";
  if (browserLanguages.some((value) => value.startsWith("cs") || value.startsWith("cz"))) return "cs";
  if (browserLanguages.some((value) => value.startsWith("es"))) return "es";
  if (browserLanguages.some((value) => value.startsWith("de"))) return "de";
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

type FieldErrors = Partial<Record<"firstName" | "email" | "password" | "confirmPassword" | "phone" | "terms" | "captcha", string>>;

function readStoredJson<T>(storage: Storage | undefined, key: string) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function getSafeLocalStorage() {
  if (typeof window === "undefined") return undefined;

  try {
    const storage = window.localStorage;
    return typeof storage?.getItem === "function" && typeof storage?.setItem === "function"
      ? storage
      : undefined;
  } catch {
    return undefined;
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

function isStrongEnoughPassword(password: string) {
  return password.length >= 8 && /[a-zа-яіїєґ]/i.test(password) && /\d/.test(password);
}

function logFunnelStep(step: string, payload?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.info(`[funnel] ${step}`, payload ?? "");
}

const formCopy = {
  ru: {
    introEyebrow: "Timviz для профессионалов",
    introTitle: "Создайте аккаунт мастера",
    introText: "Начните с email или Google. Настройки бизнеса можно добавить позже.",
    introEmailPlaceholder: "Введите email",
    introContinue: "Продолжить регистрацию",
    introOr: "или",
    introGoogle: "Войти через Google",
    introApple: "Продолжить с Apple",
    introChecking: "Проверяем...",
    introHelper: "Вы клиент и хотите открыть профиль мастера?",
    introHelperLink: "Перейти к поиску профилей",
    detailsTitle: "Создайте аккаунт мастера",
    detailsText: "Осталось добавить основные данные. Календарь откроется сразу после регистрации.",
    firstName: "Имя",
    firstNamePlaceholder: "Введите свое имя",
    lastName: "Фамилия",
    lastNamePlaceholder: "Введите свою фамилию",
    password: "Пароль",
    passwordPlaceholder: "Создайте пароль",
    confirmPassword: "Повторите пароль",
    passwordHint: "Минимум 8 символов, буква и цифра",
    email: "Email",
    phone: "Номер мобильного",
    phonePlaceholder: "Например: 67 123 45 67",
    phoneHelper: "Телефон нужен для уведомлений и связи с клиентами.",
    optionalDetails: "Дополнительно",
    prefixAria: "Выбрать телефонный префикс",
    prefixSearch: "Поиск по стране или коду",
    country: "Страна",
    currency: "Валюта",
    timezone: "Часовой пояс",
    timezonePlaceholder: "Выберите часовой пояс",
    cabinetLanguage: "Язык кабинета",
    terms: "Я принимаю политику конфиденциальности, условия предоставления услуг и условия сотрудничества.",
    submit: "Создать аккаунт мастера",
    login: "Уже есть аккаунт?",
    loginLink: "Войти в кабинет",
    accountExistsTitle: "Этот email уже зарегистрирован",
    accountExistsText: "Можно сразу войти в кабинет или восстановить пароль, чтобы не создавать второй аккаунт.",
    forgotPassword: "Восстановить пароль",
    googleNotice: "Аккаунт не найден. Завершите регистрацию бизнеса через Google.",
    mobileRequired: "Введите номер телефона",
    nameRequired: "Введите имя",
    emailRequired: "Введите email",
    passwordRequired: "Создайте пароль",
    termsRequired: "Примите условия, чтобы продолжить"
    ,
    passwordWeak: "Пароль: минимум 8 символов, буква и цифра",
    passwordMismatch: "Пароли не совпадают.",
    checkEmailTitle: "Проверьте email",
    checkEmailText: "Мы отправили ссылку для подтверждения. Перейдите по ссылке, чтобы активировать аккаунт.",
    resend: "Отправить ещё раз",
    resendWait: "Отправить ещё раз можно через 60 секунд."
  },
  uk: {
    introEyebrow: "Timviz для професіоналів",
    introTitle: "Створіть акаунт майстра",
    introText: "Почніть з email або Google. Налаштування бізнесу можна додати пізніше.",
    introEmailPlaceholder: "Введіть email",
    introContinue: "Продовжити реєстрацію",
    introOr: "або",
    introGoogle: "Увійти через Google",
    introApple: "Продовжити з Apple",
    introChecking: "Перевіряємо...",
    introHelper: "Ви клієнт і хочете відкрити профіль майстра?",
    introHelperLink: "Перейти до пошуку профілів",
    detailsTitle: "Створіть акаунт майстра",
    detailsText: "Залишилося додати основні дані. Календар відкриється одразу після реєстрації.",
    firstName: "Ім'я",
    firstNamePlaceholder: "Введіть своє ім'я",
    lastName: "Прізвище",
    lastNamePlaceholder: "Введіть своє прізвище",
    password: "Пароль",
    passwordPlaceholder: "Створіть пароль",
    confirmPassword: "Повторіть пароль",
    passwordHint: "Мінімум 8 символів, літера і цифра",
    email: "Email",
    phone: "Номер мобільного",
    phonePlaceholder: "Наприклад: 67 123 45 67",
    phoneHelper: "Телефон потрібен для сповіщень і зв'язку з клієнтами.",
    optionalDetails: "Додатково",
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
    mobileRequired: "Введіть номер телефону",
    nameRequired: "Введіть ім'я",
    emailRequired: "Введіть email",
    passwordRequired: "Створіть пароль",
    termsRequired: "Прийміть умови, щоб продовжити"
    ,
    passwordWeak: "Пароль: мінімум 8 символів, літера і цифра",
    passwordMismatch: "Паролі не збігаються.",
    checkEmailTitle: "Перевірте email",
    checkEmailText: "Ми надіслали посилання для підтвердження. Перейдіть за посиланням, щоб активувати акаунт.",
    resend: "Надіслати ще раз",
    resendWait: "Надіслати ще раз можна через 60 секунд."
  },
  en: {
    introEyebrow: "Timviz for professionals",
    introTitle: "Create a master account",
    introText: "Start with email or Google. Business settings can be added later.",
    introEmailPlaceholder: "Enter your email",
    introContinue: "Continue registration",
    introOr: "or",
    introGoogle: "Continue with Google",
    introApple: "Continue with Apple",
    introChecking: "Checking...",
    introHelper: "Are you a client looking to book a service?",
    introHelperLink: "Go to the client catalog",
    detailsTitle: "Create a master account",
    detailsText: "Add the essentials. Your calendar opens right after registration.",
    firstName: "First name",
    firstNamePlaceholder: "Enter your first name",
    lastName: "Last name",
    lastNamePlaceholder: "Enter your last name",
    password: "Password",
    passwordPlaceholder: "Create a password",
    confirmPassword: "Repeat password",
    passwordHint: "At least 8 characters, one letter and one digit",
    email: "Email",
    phone: "Mobile number",
    phonePlaceholder: "For example: 67 123 45 67",
    phoneHelper: "Phone is needed for notifications and client contact.",
    optionalDetails: "Additional",
    prefixAria: "Choose phone prefix",
    prefixSearch: "Search by country or code",
    country: "Country",
    currency: "Currency",
    timezone: "Time zone",
    timezonePlaceholder: "Choose a time zone",
    cabinetLanguage: "Workspace language",
    terms: "I accept the privacy policy, terms of service and cooperation terms.",
    submit: "Create master account",
    login: "Already have an account?",
    loginLink: "Sign in",
    accountExistsTitle: "This email is already registered",
    accountExistsText: "You can sign in right away or reset your password instead of creating a second account.",
    forgotPassword: "Reset password",
    googleNotice: "Account not found. Finish business registration with Google.",
    mobileRequired: "Enter your phone number",
    nameRequired: "Enter your name",
    emailRequired: "Enter your email",
    passwordRequired: "Create a password",
    termsRequired: "Accept the terms to continue"
    ,
    passwordWeak: "Password: at least 8 characters, one letter and one digit",
    passwordMismatch: "Passwords do not match.",
    checkEmailTitle: "Check your email",
    checkEmailText: "We sent a confirmation link. Open it to activate your account.",
    resend: "Send again",
    resendWait: "You can send again in 60 seconds."
  },
  fr: {
    introEyebrow: "Timviz pour les pros",
    introTitle: "Créer un compte pro",
    introText: "Commencez avec email ou Google. Les réglages de l’entreprise pourront être ajoutés plus tard.",
    introEmailPlaceholder: "Entrez votre email",
    introContinue: "Continuer l’inscription",
    introOr: "ou",
    introGoogle: "Continuer avec Google",
    introApple: "Continuer avec Apple",
    introChecking: "Vérification...",
    introHelper: "Vous êtes client et voulez réserver un service ?",
    introHelperLink: "Aller au catalogue client",
    detailsTitle: "Créer un compte pro",
    detailsText: "Ajoutez les informations essentielles. Votre calendrier s’ouvrira juste après l’inscription.",
    firstName: "Prénom",
    firstNamePlaceholder: "Entrez votre prénom",
    lastName: "Nom",
    lastNamePlaceholder: "Entrez votre nom",
    password: "Mot de passe",
    passwordPlaceholder: "Créez un mot de passe",
    confirmPassword: "Répéter le mot de passe",
    passwordHint: "Au moins 8 caractères, une lettre et un chiffre",
    email: "Email",
    phone: "Téléphone mobile",
    phonePlaceholder: "Par exemple : 67 123 45 67",
    phoneHelper: "Le téléphone sert aux notifications et au contact client.",
    optionalDetails: "Informations supplémentaires",
    prefixAria: "Choisir l’indicatif téléphonique",
    prefixSearch: "Recherche par pays ou code",
    country: "Pays",
    currency: "Devise",
    timezone: "Fuseau horaire",
    timezonePlaceholder: "Choisissez un fuseau horaire",
    cabinetLanguage: "Langue du cabinet",
    terms: "J’accepte la politique de confidentialité, les conditions d’utilisation et les conditions de coopération.",
    submit: "Créer le compte pro",
    login: "Vous avez déjà un compte ?",
    loginLink: "Se connecter",
    accountExistsTitle: "Cet email est déjà enregistré",
    accountExistsText: "Vous pouvez vous connecter ou réinitialiser le mot de passe sans créer un second compte.",
    forgotPassword: "Réinitialiser le mot de passe",
    googleNotice: "Compte introuvable. Terminez l’inscription professionnelle avec Google.",
    mobileRequired: "Entrez le numéro de téléphone",
    nameRequired: "Entrez le prénom",
    emailRequired: "Entrez l’email",
    passwordRequired: "Créez un mot de passe",
    termsRequired: "Acceptez les conditions pour continuer",
    passwordWeak: "Mot de passe : au moins 8 caractères, une lettre et un chiffre",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    checkEmailTitle: "Vérifiez votre email",
    checkEmailText: "Nous avons envoyé un lien de confirmation. Ouvrez-le pour activer le compte.",
    resend: "Renvoyer",
    resendWait: "Vous pourrez renvoyer dans 60 secondes."
  },
  pl: {
    introEyebrow: "Timviz dla profesjonalistów",
    introTitle: "Utwórz konto specjalisty",
    introText: "Zacznij od emaila lub Google. Ustawienia firmy można dodać później.",
    introEmailPlaceholder: "Wpisz email",
    introContinue: "Kontynuuj rejestrację",
    introOr: "lub",
    introGoogle: "Kontynuuj z Google",
    introApple: "Kontynuuj z Apple",
    introChecking: "Sprawdzamy...",
    introHelper: "Jesteś klientem i chcesz zarezerwować usługę?",
    introHelperLink: "Przejdź do katalogu",
    detailsTitle: "Utwórz konto specjalisty",
    detailsText: "Dodaj podstawowe dane. Kalendarz otworzy się zaraz po rejestracji.",
    firstName: "Imię",
    firstNamePlaceholder: "Wpisz imię",
    lastName: "Nazwisko",
    lastNamePlaceholder: "Wpisz nazwisko",
    password: "Hasło",
    passwordPlaceholder: "Utwórz hasło",
    confirmPassword: "Powtórz hasło",
    passwordHint: "Minimum 8 znaków, litera i cyfra",
    email: "Email",
    phone: "Numer telefonu",
    phonePlaceholder: "Na przykład: 67 123 45 67",
    phoneHelper: "Telefon jest potrzebny do powiadomień i kontaktu z klientami.",
    optionalDetails: "Dodatkowo",
    prefixAria: "Wybierz prefiks telefonu",
    prefixSearch: "Szukaj po kraju lub kodzie",
    country: "Kraj",
    currency: "Waluta",
    timezone: "Strefa czasowa",
    timezonePlaceholder: "Wybierz strefę czasową",
    cabinetLanguage: "Język panelu",
    terms: "Akceptuję politykę prywatności, regulamin usług i warunki współpracy.",
    submit: "Utwórz konto specjalisty",
    login: "Masz już konto?",
    loginLink: "Zaloguj się",
    accountExistsTitle: "Ten email jest już zarejestrowany",
    accountExistsText: "Możesz od razu się zalogować albo odzyskać hasło zamiast tworzyć drugie konto.",
    forgotPassword: "Odzyskaj hasło",
    googleNotice: "Nie znaleziono konta. Dokończ rejestrację firmy przez Google.",
    mobileRequired: "Wpisz numer telefonu",
    nameRequired: "Wpisz imię",
    emailRequired: "Wpisz email",
    passwordRequired: "Utwórz hasło",
    termsRequired: "Zaakceptuj warunki, aby kontynuować",
    passwordWeak: "Hasło: minimum 8 znaków, litera i cyfra",
    passwordMismatch: "Hasła nie są takie same.",
    checkEmailTitle: "Sprawdź email",
    checkEmailText: "Wysłaliśmy link potwierdzający. Otwórz go, aby aktywować konto.",
    resend: "Wyślij ponownie",
    resendWait: "Ponownie można wysłać za 60 sekund."
  },
  cs: {
    introEyebrow: "Timviz pro profesionály",
    introTitle: "Vytvořit účet specialisty",
    introContinue: "Pokračovat v registraci",
    introGoogle: "Pokračovat přes Google",
    introApple: "Pokračovat přes Apple",
    detailsTitle: "Vytvořit účet specialisty",
    firstName: "Jméno",
    lastName: "Příjmení",
    password: "Heslo",
    confirmPassword: "Zopakujte heslo",
    phone: "Mobilní číslo",
    country: "Země",
    currency: "Měna",
    timezone: "Časové pásmo",
    cabinetLanguage: "Jazyk kabinetu",
    submit: "Vytvořit účet specialisty",
    login: "Už máte účet?",
    loginLink: "Přihlásit se",
    forgotPassword: "Obnovit heslo",
    checkEmailTitle: "Zkontrolujte email",
    resend: "Odeslat znovu"
  },
  es: {
    introEyebrow: "Timviz para profesionales",
    introTitle: "Crear cuenta profesional",
    introContinue: "Continuar registro",
    introGoogle: "Continuar con Google",
    introApple: "Continuar con Apple",
    detailsTitle: "Crear cuenta profesional",
    firstName: "Nombre",
    lastName: "Apellido",
    password: "Contraseña",
    confirmPassword: "Repetir contraseña",
    phone: "Teléfono móvil",
    country: "País",
    currency: "Moneda",
    timezone: "Zona horaria",
    cabinetLanguage: "Idioma del panel",
    submit: "Crear cuenta profesional",
    login: "¿Ya tienes cuenta?",
    loginLink: "Iniciar sesión",
    forgotPassword: "Restablecer contraseña",
    checkEmailTitle: "Revisa tu email",
    resend: "Enviar de nuevo"
  },
  de: {
    introEyebrow: "Timviz für Profis",
    introTitle: "Profi-Konto erstellen",
    introContinue: "Registrierung fortsetzen",
    introGoogle: "Mit Google fortfahren",
    introApple: "Mit Apple fortfahren",
    detailsTitle: "Profi-Konto erstellen",
    firstName: "Vorname",
    lastName: "Nachname",
    password: "Passwort",
    confirmPassword: "Passwort wiederholen",
    phone: "Mobilnummer",
    country: "Land",
    currency: "Währung",
    timezone: "Zeitzone",
    cabinetLanguage: "Sprache des Arbeitsbereichs",
    submit: "Profi-Konto erstellen",
    login: "Schon ein Konto?",
    loginLink: "Anmelden",
    forgotPassword: "Passwort zurücksetzen",
    checkEmailTitle: "E-Mail prüfen",
    resend: "Erneut senden"
  }
} as const;

export default function CreateAccountForm() {
  const router = useRouter();
  const prefixMenuRef = useRef<HTMLDivElement | null>(null);
  const hasHydratedDraftRef = useRef(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Ukraine");
  const [phoneCountry, setPhoneCountry] = useState("Ukraine");
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState<ProLanguage>("ru");
  const [currency, setCurrency] = useState("UAH");
  const [phoneError, setPhoneError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [isPrefixOpen, setIsPrefixOpen] = useState(false);
  const [prefixSearch, setPrefixSearch] = useState("");
  const [googleNotice, setGoogleNotice] = useState("");
  const [existingAccountEmail, setExistingAccountEmail] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [step, setStep] = useState<"entry" | "details">("entry");
  const [isTelegramSource, setIsTelegramSource] = useState(false);
  const [signupSource, setSignupSource] = useState("");
  const [telegramStartParam, setTelegramStartParam] = useState("setup");
  const [emailConfirmationSent, setEmailConfirmationSent] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");
  const [authProviderMode, setAuthProviderMode] = useState<"email" | "google" | "apple">("email");

  const phoneRule = getPhoneRule(phoneCountry);
  const phoneIsValid = isPhoneValid(phoneCountry, phone);
  const t = {
    ...formCopy.en,
    ...((formCopy as unknown as Record<string, Partial<typeof formCopy.en>>)[language] ?? {})
  } as typeof formCopy.en;
  const phonePlaceholder = phoneCountry === "Ukraine" ? t.phonePlaceholder : phoneRule.placeholder;
  const captchaRequired = authProviderMode === "email";

  const handleCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
    if (token) {
      setFieldErrors((current) => (current.captcha ? { ...current, captcha: "" } : current));
    }
  }, []);

  function applyLanguage(nextLanguage: ProLanguage) {
    setLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      try {
        getSafeLocalStorage()?.setItem("rezervo-pro-language", nextLanguage);
      } catch {
        // Language switching should keep working even when storage is unavailable.
      }
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

  const loginHref = useMemo(() => {
    const params = new URLSearchParams();
    if (inviteToken) {
      params.set("invite", inviteToken);
    }
    if (isTelegramSource) {
      params.set("source", "telegram");
      params.set("startapp", telegramStartParam || "setup");
    }
    const query = params.toString();
    return query ? `/pro/login?${query}` : "/pro/login";
  }, [inviteToken, isTelegramSource, telegramStartParam]);

  const forgotPasswordHref = useMemo(() => {
    if (!existingAccountEmail) {
      return "/pro/forgot-password";
    }
    const params = new URLSearchParams();
    params.set("email", existingAccountEmail);
    if (isTelegramSource) {
      params.set("source", "telegram");
      params.set("startapp", telegramStartParam || "setup");
    }
    return `/pro/forgot-password?${params.toString()}`;
  }, [existingAccountEmail, isTelegramSource, telegramStartParam]);

  const googleRegisterHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("mode", "register");
    if (inviteToken) {
      params.set("invite", inviteToken);
    }
    if (isTelegramSource) {
      params.set("source", "telegram");
      const returnToQuery = new URLSearchParams();
      returnToQuery.set("source", "telegram");
      returnToQuery.set("startapp", telegramStartParam || "setup");
      params.set("return_to", `/telegram?${returnToQuery.toString()}`);
    }
    return `/api/pro/auth/google/start?${params.toString()}`;
  }, [inviteToken, isTelegramSource, telegramStartParam]);

  function handleGoogleRegister() {
    if (typeof window === "undefined") {
      return;
    }

    let targetHref = googleRegisterHref;
    if (!isTelegramSource) {
      const [pathname, rawQuery = ""] = googleRegisterHref.split("?");
      const params = new URLSearchParams(rawQuery);
      params.set("return_to", `${window.location.pathname}${window.location.search}`);
      targetHref = `${pathname}?${params.toString()}`;
    }

    const absolute = new URL(targetHref, window.location.origin).toString();
    const telegramRuntime = (
      window as Window & {
        Telegram?: { WebApp?: TelegramRuntime };
      }
    ).Telegram?.WebApp;

    if ((isTelegramSource || Boolean(telegramRuntime?.initData)) && telegramRuntime?.openLink) {
      telegramRuntime.openLink(absolute, { try_instant_view: false });
      return;
    }

    window.location.assign(absolute);
  }

  function handleAppleRegister() {
    if (typeof window === "undefined") return;
    window.location.assign("/api/pro/auth/apple/start");
  }

  useEffect(() => {
    logFunnelStep("visited_create_account");
    const localStorage = getSafeLocalStorage();
    const savedLanguage = localStorage?.getItem("rezervo-pro-language") ?? null;
    const initialLanguage = isProLanguage(savedLanguage)
      ? savedLanguage
      : getBrowserLanguage();
    const browserCountry = getBrowserCountry();
    const browserTimezone = getBrowserTimezone();
    const params = new URLSearchParams(window.location.search);
    const sourceFromQuery = params.get("source")?.trim().toLowerCase() || "";
    trackAdsEvent("sign_up_start", {
      source: sourceFromQuery || "pro_create_account",
      language: initialLanguage
    });
    const queryStartParam =
      params.get("startapp")?.trim() ||
      params.get("start_param")?.trim() ||
      params.get("tgWebAppStartParam")?.trim() ||
      "";
    const runtimeStartParam = (() => {
      try {
        const telegram = (
          window as Window & {
            Telegram?: { WebApp?: { initData?: string; initDataUnsafe?: { start_param?: string } } };
          }
        ).Telegram;
        return String(telegram?.WebApp?.initDataUnsafe?.start_param || "").trim();
      } catch {
        return "";
      }
    })();
    const isTelegramRuntime = (() => {
      try {
        const telegram = (
          window as Window & {
            Telegram?: { WebApp?: { initData?: string } };
          }
        ).Telegram;
        return Boolean(telegram?.WebApp?.initData);
      } catch {
        return false;
      }
    })();
    const inviteFromQuery = params.get("invite")?.trim() || "";
    const emailFromQuery = params.get("email")?.trim() || "";
    const avatarFromQuery = params.get("avatarUrl")?.trim() || "";
    const providerFromQuery = params.get("google") === "1" ? "google" : params.get("apple") === "1" ? "apple" : "email";
    const liveDraft = readStoredJson<CreateAccountLiveDraft>(window.sessionStorage, liveDraftKey);
    const setupDraft = readStoredJson<SetupAccountDraft>(localStorage, setupDraftKey);
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
    setAuthProviderMode(providerFromQuery);
    setIsTelegramSource(sourceFromQuery === "telegram" || isTelegramRuntime);
    setSignupSource(sourceFromQuery);
    setTelegramStartParam(queryStartParam || runtimeStartParam || "setup");
    try {
      localStorage?.setItem("rezervo-pro-language", initialLanguage);
    } catch {
      // The form can keep using the in-memory language when storage is unavailable.
    }
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
    setPassword((current) => {
      const nextPassword = current || makeGeneratedPassword();
      setConfirmPassword(nextPassword);
      return nextPassword;
    });
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
      if (isProLanguage(nextLanguage)) setLanguage(nextLanguage);
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
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

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

  async function requestCaptchaFallbackToken() {
    try {
      const response = await fetch("/api/mobile/captcha/fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "web-create-account", language })
      });
      const payload = (await response.json().catch(() => ({}))) as { token?: string };
      const token = typeof payload.token === "string" ? payload.token.trim() : "";
      if (!response.ok || !token) return "";
      setCaptchaToken(token);
      return token;
    } catch {
      return "";
    }
  }

  async function moveToDetails() {
    if (!email.trim()) {
      setFieldErrors({ email: t.emailRequired });
      return;
    }

    setIsCheckingEmail(true);
    logFunnelStep("email_step_completed");
    const exists = await emailAlreadyExists(email);
    setIsCheckingEmail(false);

    if (exists) {
      setExistingAccountEmail(email.trim());
      return;
    }

    setStep("details");
  }

  function scrollToFirstInvalid(errors: FieldErrors) {
    const firstKey = (["firstName", "email", "phone", "password", "terms"] as const).find((key) => errors[key]);
    if (!firstKey) {
      return;
    }

    const target = document.getElementById(firstKey === "terms" ? "termsAccepted" : firstKey);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target instanceof HTMLElement) {
      window.setTimeout(() => target.focus(), 250);
    }
  }

  function validateDetails() {
    const errors: FieldErrors = {};

    if (!firstName.trim()) {
      errors.firstName = t.nameRequired;
    }
    if (!email.trim()) {
      errors.email = t.emailRequired;
    }
    if (!phone.trim()) {
      errors.phone = t.mobileRequired;
    } else if (!phoneIsValid) {
      errors.phone = getPhoneValidationMessage(phoneCountry);
    }
    if (!password.trim()) {
      errors.password = t.passwordRequired;
    } else if (!isStrongEnoughPassword(password)) {
      errors.password = t.passwordWeak;
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = t.passwordMismatch;
    }
    if (!termsAccepted) {
      errors.terms = t.termsRequired;
    }

    setFieldErrors(errors);
    setPhoneError(errors.phone || "");
    if (Object.keys(errors).length > 0) {
      logFunnelStep("details_step_failed_validation", Object.keys(errors));
      scrollToFirstInvalid(errors);
      return false;
    }

    return true;
  }

  async function createMasterAccount() {
    logFunnelStep("details_step_attempted");
    if (!validateDetails()) {
      return;
    }

    setIsCheckingEmail(true);
    const exists = await emailAlreadyExists(email);

    if (exists) {
      setIsCheckingEmail(false);
      setExistingAccountEmail(email.trim());
      setStep("entry");
      return;
    }

    const account = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      authProvider: authProviderMode,
      emailConfirmed: authProviderMode !== "email",
      signupSource,
      avatarUrl,
      phone: buildInternationalPhone(phoneCountry, phone),
      country,
      timezone: timezone || inferTimezone(country),
      language: languageLabels[language],
      currency
    };

    try {
      getSafeLocalStorage()?.setItem(setupDraftKey, JSON.stringify(account));
    } catch {
      // Registration still proceeds even if draft persistence is unavailable.
    }

    logFunnelStep("details_step_completed");

    if (inviteToken) {
      const params = new URLSearchParams();
      params.set("invite", inviteToken);
      if (isTelegramSource) {
        params.set("source", "telegram");
        params.set("startapp", telegramStartParam || "setup");
      }
      router.push(`/pro/setup?${params.toString()}`);
      return;
    }

    logFunnelStep("setup_started");

    const registrationCaptchaToken = captchaRequired && !captchaToken ? await requestCaptchaFallbackToken() : captchaToken;

    const submitRegistration = (token: string) => fetch("/api/pro/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        website: "",
        captchaToken: token,
        account,
        setup: {
          ownerMode: "owner",
          joinBusinessId: "",
          joinBusinessName: "",
          joinBusinessRole: "",
          companyName: firstName.trim() || email.trim().split("@")[0] || "Компания",
          website: "",
          categories: [],
          services: [],
          accountType: "solo",
          serviceMode: "Клиенты приходят в мое физическое заведение",
          address: "",
          addressDetails: "",
          addressLat: null,
          addressLon: null
        },
        invitationToken: inviteToken || undefined
      })
    });

    let response = await submitRegistration(registrationCaptchaToken);
    let result = await response.json().catch(() => ({}));
    if (!response.ok && captchaRequired && /робот|robot|captcha|security|перевір|провер/i.test(String(result.error || ""))) {
      const fallbackToken = await requestCaptchaFallbackToken();
      if (fallbackToken) {
        response = await submitRegistration(fallbackToken);
        result = await response.json().catch(() => ({}));
      }
    }
    setIsCheckingEmail(false);

    if (!response.ok) {
      const error = String(result.error || t.emailRequired);
      if (/робот|robot|captcha|security|перевір|провер/i.test(error)) {
        setCaptchaToken("");
        setFieldErrors({ captcha: error });
      } else {
        setFieldErrors({ email: error });
      }
      return;
    }

    logFunnelStep("setup_completed");
    trackAdsEvent("sign_up_complete", {
      event_id: result.metaRegistrationEventId || undefined,
      source: signupSource || "pro_create_account",
      language,
      workspace_ready: result.workspaceReady === true
    });
    trackAdsEvent("business_profile_created", {
      source: signupSource || "pro_create_account",
      language,
      owner_mode: "owner"
    });
    if (result.trialStarted === true) {
      trackAdsEvent("pro_trial_started", {
        source: signupSource || "pro_create_account",
        language
      });
    }

    if (result.emailConfirmationRequired) {
      window.sessionStorage.removeItem(liveDraftKey);
      setEmailConfirmationSent(result.email || email.trim());
      setIsCheckingEmail(false);
      return;
    }

    window.sessionStorage.removeItem(liveDraftKey);
    router.push("/pro/calendar");
    router.refresh();
  }

  async function resendConfirmation() {
    if (!emailConfirmationSent || resendCooldown > 0) return;
    setIsCheckingEmail(true);
    const response = await fetch("/api/pro/email/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailConfirmationSent, language, captchaToken })
    });
    const result = await response.json().catch(() => ({}));
    setIsCheckingEmail(false);
    if (!response.ok) {
      setFieldErrors({ email: result.error || t.resendWait });
      setResendCooldown(Number(result.retryAfter || 60));
      return;
    }
    setResendCooldown(60);
  }

  if (emailConfirmationSent) {
    return (
      <div className={`${styles.panel} ${styles.authStartPanel}`}>
        <div>
          <p className={styles.eyebrow}>Timviz</p>
          <h1 className={styles.heroTitle}>{t.checkEmailTitle}</h1>
          <p className={styles.heroSubtitle}>{t.checkEmailText}</p>
        </div>
        <div className={styles.confirmEmailBox}>{emailConfirmationSent}</div>
        <TurnstileWidget onToken={handleCaptchaToken} />
        {fieldErrors.email ? <div className={styles.addressWarning}>{fieldErrors.email}</div> : null}
        <button type="button" className={styles.primaryButton} disabled={isCheckingEmail || resendCooldown > 0} onClick={() => void resendConfirmation()}>
          {resendCooldown > 0 ? `${t.resend} · ${resendCooldown}` : t.resend}
        </button>
        <a className={styles.ghostButton} href={loginHref}>{t.loginLink}</a>
      </div>
    );
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
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors((current) => ({ ...current, email: "" }));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                moveToDetails();
              }
            }}
          />
          {fieldErrors.email ? <span className={styles.fieldError}>{fieldErrors.email}</span> : null}
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
                href={`${loginHref}${
                  loginHref.includes("?") ? "&" : "?"
                }email=${encodeURIComponent(existingAccountEmail)}`}
                className={styles.primaryButton}
              >
                {t.loginLink}
              </a>
              <a
                href={forgotPasswordHref}
                className={styles.ghostButton}
              >
                {t.forgotPassword}
              </a>
            </div>
          </div>
        ) : null}

        <div className={styles.socialDivider}>{t.introOr}</div>

        <div className={styles.socialStack}>
          <button
            type="button"
            className={styles.socialButton}
            onClick={handleGoogleRegister}
          >
            <span className={`${styles.socialIcon} ${styles.google}`}>G</span>
            <span>{t.introGoogle}</span>
          </button>
          <button
            type="button"
            className={`${styles.socialButton} ${styles.appleButton}`}
            onClick={handleAppleRegister}
          >
            <span className={styles.appleGlyph}>●</span>
            <span>{t.introApple}</span>
          </button>
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
          <input
            id="firstName"
            className={styles.input}
            placeholder={t.firstNamePlaceholder}
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              setFieldErrors((current) => ({ ...current, firstName: "" }));
            }}
          />
          {fieldErrors.firstName ? <span className={styles.fieldError}>{fieldErrors.firstName}</span> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="email">{t.email}</label>
          <input
            id="email"
            type="email"
            className={styles.input}
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors((current) => ({ ...current, email: "" }));
            }}
          />
          {fieldErrors.email ? <span className={styles.fieldError}>{fieldErrors.email}</span> : null}
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
              placeholder={phonePlaceholder}
              value={phone}
              onChange={(event) => {
                setPhone(formatPhoneLocal(event.target.value, phoneRule));
                setPhoneError("");
                setFieldErrors((current) => ({ ...current, phone: "" }));
              }}
              onBlur={() => {
                if (phone.trim() && !phoneIsValid) {
                  setPhoneError(getPhoneValidationMessage(phoneCountry));
                }
              }}
            />
          </div>
          <span className={styles.fieldHint}>{t.phoneHelper}</span>
          {phoneError ? <span className={styles.fieldError}>{phoneError}</span> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="password">{t.password}</label>
          <input
            id="password"
            type="password"
            className={styles.input}
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, password: "" }));
            }}
          />
          <span className={styles.fieldHint}>{t.passwordHint}</span>
          {fieldErrors.password ? <span className={styles.fieldError}>{fieldErrors.password}</span> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="confirmPassword">{t.confirmPassword}</label>
          <input
            id="confirmPassword"
            type="password"
            className={styles.input}
            placeholder={t.confirmPassword}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setFieldErrors((current) => ({ ...current, confirmPassword: "" }));
            }}
          />
          {fieldErrors.confirmPassword ? <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span> : null}
        </div>
      </div>

      <details
        className={styles.createOptionalDetails}
        open={isAdditionalOpen}
        onToggle={(event) => setIsAdditionalOpen(event.currentTarget.open)}
      >
        <summary>{t.optionalDetails}</summary>
        <div className={`${styles.fieldStack} ${styles.createAccountGrid}`}>
          <div className={styles.field}>
            <label htmlFor="lastName">{t.lastName}</label>
            <input id="lastName" className={styles.input} placeholder={t.lastNamePlaceholder} value={lastName} onChange={(event) => setLastName(event.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="country">{t.country}</label>
            <select id="country" className={styles.select} value={country} onChange={(event) => syncCountry(event.target.value, "country")}>
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
            <select id="cabinetLanguage" className={styles.select} value={language} onChange={(event) => applyLanguage(event.target.value as ProLanguage)}>
              {languages.map((languageOption) => (
                <option key={languageOption} value={languageOption}>{languageLabels[languageOption]}</option>
              ))}
            </select>
          </div>
        </div>
      </details>

      {googleNotice ? <div className={styles.addressWarning}>{googleNotice}</div> : null}

      <label className={styles.terms}>
        <input
          id="termsAccepted"
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => {
            setTermsAccepted(event.target.checked);
            setFieldErrors((current) => ({ ...current, terms: "" }));
          }}
        />
        <span>{t.terms}</span>
      </label>
      {fieldErrors.terms ? <span className={styles.fieldError}>{fieldErrors.terms}</span> : null}
      <div id="captchaCheck">
        {captchaRequired ? <TurnstileWidget onToken={handleCaptchaToken} /> : null}
        {fieldErrors.captcha ? <span className={styles.fieldError}>{fieldErrors.captcha}</span> : null}
      </div>

      <div className={styles.createAccountActions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={isCheckingEmail}
          onClick={() => void createMasterAccount()}
        >
          {isCheckingEmail ? t.introChecking : t.submit}
        </button>
        <a
          className={styles.mutedLink}
          href={loginHref}
        >
          {t.loginLink}
        </a>
      </div>

      <div className={styles.createMobileStickyCta}>
        <button type="button" className={styles.primaryButton} disabled={isCheckingEmail} onClick={() => void createMasterAccount()}>
          {isCheckingEmail ? t.introChecking : t.submit}
        </button>
        <a className={styles.mutedLink} href={loginHref}>{t.loginLink}</a>
      </div>
    </div>
  );
}
