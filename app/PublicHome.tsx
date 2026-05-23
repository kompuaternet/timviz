"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicHomeStats } from "../lib/public-home-stats";
import { areMobileAppsAvailable, mobileApps } from "../lib/mobile-apps";
import type { PublicSearchIndex } from "../lib/public-search";
import { getNicheSlug, nicheCards } from "../lib/niche-pages";
import { getLocalizedPath, isSiteLanguage, publicFooterLabels, type SiteLanguage, withEnglishFallback } from "../lib/site-language";
import BrandLogo from "./BrandLogo";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import NicheLinksSection from "./NicheLinksSection";
import PublicHeaderAuthMenu from "./PublicHeaderAuthMenu";
import PublicSearch from "./PublicSearch";
type PublicLanguage = SiteLanguage;

type PublicHomeProps = {
  searchIndex: PublicSearchIndex;
  stats: PublicHomeStats;
  initialLanguage?: PublicLanguage;
};

const HOME_COUNTER_BASE = {
  partnerBusinesses: 1026,
  countries: 57,
  totalUsers: 1226
} as const;

function getLanguageLocale(language: PublicLanguage) {
  if (language === "uk") return "uk-UA";
  if (language === "fr") return "fr-FR";
  if (language === "pl") return "pl-PL";
  if (language === "cs") return "cs-CZ";
  if (language === "es") return "es-ES";
  if (language === "de") return "de-DE";
  if (language === "en") return "en-US";
  return "ru-RU";
}

function formatNumber(value: number, language: PublicLanguage) {
  return new Intl.NumberFormat(getLanguageLocale(language)).format(Math.max(0, Math.floor(value)));
}

function formatNumberWithPlus(value: number, language: PublicLanguage) {
  return `${formatNumber(value, language)}+`;
}

function formatCompactThousands(value: number, language: PublicLanguage) {
  if (value < 1000) {
    return formatNumber(value, language);
  }

  const thousands = Math.max(1, Math.floor(value / 1000));
  if (language === "en") {
    return `${formatNumber(thousands, language)}K`;
  }
  if (language !== "ru") {
    return `${formatNumber(thousands, language)}K`;
  }

  return `${formatNumber(thousands, language)} к`;
}

function formatStatsBig(totalBookings: number, language: PublicLanguage) {
  const compact = formatCompactThousands(totalBookings, language);
  if (language === "uk") {
    return `Понад ${compact}`;
  }
  if (language === "en") {
    return `Over ${compact}`;
  }
  if (language !== "ru") {
    return `Over ${compact}`;
  }
  return `Более ${compact}`;
}

function getInitialLanguage(): PublicLanguage {
  if (typeof window === "undefined") return "ru";
  let saved: string | null = null;
  try {
    saved =
      typeof window.localStorage?.getItem === "function"
        ? window.localStorage.getItem("rezervo-pro-language")
        : null;
  } catch {
    saved = null;
  }
  if (isSiteLanguage(saved)) return saved;

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

const businesses = [
  {
    name: "SORRY FOR MY HAIR",
    location: { ru: "Подольский район, Киев", uk: "Подільський район, Київ", en: "Podil district, Kyiv", fr: "Quartier Podil, Kyiv", pl: "Dzielnica Podil, Kijów", cs: "Čtvrť Podil, Kyjev", es: "Distrito Podil, Kyiv", de: "Bezirk Podil, Kyjiw" },
    category: { ru: "Парикмахерская", uk: "Перукарня", en: "Hair salon", fr: "Salon de coiffure", pl: "Salon fryzjerski", cs: "Kadeřnictví", es: "Peluquería", de: "Friseursalon" },
    rating: "5,0",
    reviews: "132",
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Soulmates Massage",
    location: { ru: "Печерск, Киев", uk: "Печерськ, Київ", en: "Pechersk, Kyiv", fr: "Petchersk, Kyiv", pl: "Peczersk, Kijów", cs: "Pečersk, Kyjev", es: "Pechersk, Kyiv", de: "Petschersk, Kyjiw" },
    category: { ru: "Массажный салон", uk: "Масажний салон", en: "Massage studio", fr: "Salon de massage", pl: "Gabinet masażu", cs: "Masážní studio", es: "Centro de masajes", de: "Massagestudio" },
    rating: "4,9",
    reviews: "86",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Beauty.Que",
    location: { ru: "Центр, Львов", uk: "Центр, Львів", en: "City center, Lviv", fr: "Centre-ville, Lviv", pl: "Centrum, Lwów", cs: "Centrum, Lvov", es: "Centro, Lviv", de: "Innenstadt, Lwiw" },
    category: { ru: "Ногти и ресницы", uk: "Нігті та вії", en: "Nails and lashes", fr: "Ongles et cils", pl: "Paznokcie i rzęsy", cs: "Nehty a řasy", es: "Uñas y pestañas", de: "Nägel und Wimpern" },
    rating: "5,0",
    reviews: "241",
    image: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "La Duette",
    location: { ru: "Оболонь, Киев", uk: "Оболонь, Київ", en: "Obolon, Kyiv", fr: "Obolon, Kyiv", pl: "Obołoń, Kijów", cs: "Oboloň, Kyjev", es: "Obolon, Kyiv", de: "Obolon, Kyjiw" },
    category: { ru: "Салон красоты", uk: "Салон краси", en: "Beauty salon", fr: "Institut de beauté", pl: "Salon kosmetyczny", cs: "Kosmetický salon", es: "Salón de belleza", de: "Kosmetikstudio" },
    rating: "5,0",
    reviews: "48",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80"
  }
];

function localizePublicValue(localized: Partial<Record<PublicLanguage, string>> & { en: string }, language: PublicLanguage) {
  return localized[language] ?? localized.en;
}

function localizePublicList(localized: Partial<Record<PublicLanguage, string[]>> & { en: string[] }, language: PublicLanguage) {
  return localized[language] ?? localized.en;
}

const copy = withEnglishFallback<Record<string, string | string[][]>>({
  ru: {
    navAria: "Главное меню",
    login: "Войти",
    clientLogin: "Вход для клиента",
    create: "Создать профиль компании",
    menu: "Меню",
    clients: "Для клиентов",
    browse: "Посмотреть бизнесы",
    clientAuth: "Вход или регистрация",
    app: "Скачать приложение",
    reviews: "Отзывы",
    business: "Для бизнеса",
    dashboard: "Войти в кабинет",
    businessLogin: "Вход для бизнеса",
    features: "Возможности для бизнеса",
    heroTitle: "Бронируйте услуги рядом",
    heroText: "Все услуги, которые нужны каждый день, теперь в одном месте.",
    bookedToday: "записей забронировано сегодня",
    recommended: "Рекомендуемые",
    seeAll: "Смотреть все →",
    appKicker: "Доступно для клиентов",
    appTitle: "Скачайте приложение Timviz",
    appText: "Записывайтесь к любимым мастерам, находите новые места, переносите визиты и получайте напоминания в одном удобном приложении.",
    appButton: "Скачать приложение",
    appSoon: "iOS и Android приложения скоро появятся 💜",
    appStore: "App Store",
    googlePlay: "Google Play",
    comingSoon: "Скоро",
    mobileAppsFooter: "Мобильные приложения скоро появятся",
    appCardTitle: "Trendy Studio",
    appCardMeta: "5.0 ★★★★★ · Лондон",
    appCardButton: "Записаться",
    reviewTitle: "Отзывы",
    reviewsList: [
      ["Лучшая система бронирования", "Отличный опыт, легко бронировать. Оплачивать процедуры удобно, а напоминания помогают не забывать о записи.", "Люси", "Лондон"],
      ["Простота поиска и записи", "Можно быстро найти хорошего мастера рядом и выбрать удобное время без переписок.", "Дэн", "Нью-Йорк"],
      ["Идеально для барберов", "Нашел несколько барбершопов, сравнил отзывы и записался за пару кликов.", "Дейл", "Сидней"]
    ],
    statsTitle: "Лучшая платформа для записи на услуги",
    statsText: "Одно решение для клиентов, мастеров и владельцев бизнеса.",
    statsLabel: "записей забронировано на Timviz",
    partners: "компаний-партнеров",
    countries: "стран используют Timviz",
    users: "пользователей Timviz",
    businessTitle: "Timviz для бизнеса",
    businessText: "Управляйте записями, услугами, клиентами, графиком мастеров и поддержкой из одного кабинета.",
    more: "Подробнее →",
    rating: "Отлично 5/5",
    ratingText: "Первые отзывы от партнеров Timviz",
    dashboardToday: "Сегодня",
    dashboardTeam: "Рабочая команда",
    about: "О Timviz",
    catalog: "Каталог",
    legal: "Юридическая информация",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    cityIn: "в",
    nichesTitle: "Для кого Timviz",
    nichesSubtitle: "Timviz подходит мастерам и салонам, которые работают по записи",
    prosFooter: "Для мастеров"
  },
  uk: {
    navAria: "Головне меню",
    login: "Увійти",
    clientLogin: "Вхід для клієнта",
    create: "Створити профіль компанії",
    menu: "Меню",
    clients: "Для клієнтів",
    browse: "Переглянути бізнеси",
    clientAuth: "Вхід або реєстрація",
    app: "Завантажити застосунок",
    reviews: "Відгуки",
    business: "Для бізнесу",
    dashboard: "Увійти в кабінет",
    businessLogin: "Вхід для бізнесу",
    features: "Можливості для бізнесу",
    heroTitle: "Бронюйте послуги поруч",
    heroText: "Усі послуги, які потрібні щодня, тепер в одному місці.",
    bookedToday: "записів заброньовано сьогодні",
    recommended: "Рекомендовані",
    seeAll: "Дивитися всі →",
    appKicker: "Доступно для клієнтів",
    appTitle: "Завантажте застосунок Timviz",
    appText: "Записуйтеся до улюблених майстрів, знаходьте нові місця, переносьте візити й отримуйте нагадування в одному зручному застосунку.",
    appButton: "Завантажити застосунок",
    appSoon: "Застосунки для iOS та Android скоро з’являться 💜",
    appStore: "App Store",
    googlePlay: "Google Play",
    comingSoon: "Скоро",
    mobileAppsFooter: "Мобільні застосунки скоро з’являться",
    appCardTitle: "Trendy Studio",
    appCardMeta: "5.0 ★★★★★ · Лондон",
    appCardButton: "Записатися",
    reviewTitle: "Відгуки",
    reviewsList: [
      ["Найкраща система бронювання", "Чудовий досвід, легко бронювати. Оплачувати процедури зручно, а нагадування допомагають не забути про запис.", "Люсі", "Лондон"],
      ["Простий пошук і запис", "Можна швидко знайти хорошого майстра поруч і вибрати зручний час без переписок.", "Ден", "Нью-Йорк"],
      ["Ідеально для барберів", "Знайшов кілька барбершопів, порівняв відгуки й записався за пару кліків.", "Дейл", "Сідней"]
    ],
    statsTitle: "Найкраща платформа для запису на послуги",
    statsText: "Одне рішення для клієнтів, майстрів і власників бізнесу.",
    statsLabel: "записів заброньовано на Timviz",
    partners: "компаній-партнерів",
    countries: "країн використовують Timviz",
    users: "користувачів Timviz",
    businessTitle: "Timviz для бізнесу",
    businessText: "Керуйте записами, послугами, клієнтами, графіком майстрів і підтримкою з одного кабінету.",
    more: "Детальніше →",
    rating: "Відмінно 5/5",
    ratingText: "Перші відгуки від партнерів Timviz",
    dashboardToday: "Сьогодні",
    dashboardTeam: "Робоча команда",
    about: "Про Timviz",
    catalog: "Каталог",
    legal: "Юридична інформація",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    cityIn: "у",
    nichesTitle: "Для кого Timviz",
    nichesSubtitle: "Timviz підходить майстрам і салонам, які працюють за записом",
    prosFooter: "Для майстрів"
  },
  en: {
    navAria: "Main menu",
    login: "Log in",
    clientLogin: "Client sign in",
    create: "Create company profile",
    menu: "Menu",
    clients: "For clients",
    browse: "Browse businesses",
    clientAuth: "Log in or register",
    app: "Download app",
    reviews: "Reviews",
    business: "For business",
    dashboard: "Open dashboard",
    businessLogin: "Business sign in",
    features: "Business features",
    heroTitle: "Book services nearby",
    heroText: "Everyday services, all in one place.",
    bookedToday: "bookings made today",
    recommended: "Recommended",
    seeAll: "See all →",
    appKicker: "Available for clients",
    appTitle: "Download the Timviz app",
    appText: "Book favorite professionals, discover new places, move visits and get reminders in one simple app.",
    appButton: "Download app",
    appSoon: "iOS and Android apps are coming soon 💜",
    appStore: "App Store",
    googlePlay: "Google Play",
    comingSoon: "Coming soon",
    mobileAppsFooter: "Mobile apps coming soon",
    appCardTitle: "Trendy Studio",
    appCardMeta: "5.0 ★★★★★ · London",
    appCardButton: "Book now",
    reviewTitle: "Reviews",
    reviewsList: [
      ["The best booking system", "A smooth experience and easy booking. Payments are convenient, and reminders help me never miss a visit.", "Lucy", "London"],
      ["Easy search and booking", "I can quickly find a great professional nearby and choose the right time without messaging.", "Dan", "New York"],
      ["Perfect for barbers", "I compared several barbershops, checked reviews and booked in a few clicks.", "Dale", "Sydney"]
    ],
    statsTitle: "A better platform for appointment services",
    statsText: "One solution for clients, professionals and business owners.",
    statsLabel: "bookings made on Timviz",
    partners: "partner businesses",
    countries: "countries use Timviz",
    users: "Timviz users",
    businessTitle: "Timviz for business",
    businessText: "Manage bookings, services, clients, team schedules and support from one workspace.",
    more: "Learn more →",
    rating: "Excellent 5/5",
    ratingText: "Early feedback from Timviz partners",
    dashboardToday: "Today",
    dashboardTeam: "Working staff",
    about: "About Timviz",
    catalog: "Catalog",
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of use",
    cityIn: "in",
    nichesTitle: "Who Timviz is for",
    nichesSubtitle: "Timviz is built for professionals and salons who work by appointment",
    prosFooter: "For professionals"
  }
}) satisfies Record<PublicLanguage, Record<string, string | string[][]>>;

Object.assign(copy, {
  fr: {
    ...copy.en,
    navAria: "Menu principal",
    login: "Connexion",
    clientLogin: "Connexion client",
    create: "Créer un profil d’entreprise",
    menu: "Menu",
    clients: "Pour les clients",
    browse: "Voir les entreprises",
    business: "Pour les entreprises",
    dashboard: "Ouvrir le tableau de bord",
    businessLogin: "Connexion entreprise",
    features: "Fonctionnalités business",
    heroTitle: "Réservez des services près de vous",
    heroText: "Tous les services du quotidien au même endroit.",
    bookedToday: "réservations effectuées aujourd’hui",
    recommended: "Recommandés",
    seeAll: "Voir tout →",
    appKicker: "Disponible pour les clients",
    appTitle: "Téléchargez l’application Timviz",
    appText: "Réservez vos professionnels favoris, découvrez de nouveaux lieux, déplacez vos rendez-vous et recevez des rappels dans une seule application.",
    appButton: "Télécharger l’application",
    appSoon: "Les applications iOS et Android arrivent bientôt",
    comingSoon: "Bientôt disponible",
    mobileAppsFooter: "Applications mobiles bientôt disponibles",
    appCardMeta: "5.0 ★★★★★ · Londres",
    appCardButton: "Réserver",
    reviewTitle: "Avis",
    reviewsList: [
      ["Le meilleur système de réservation", "Une expérience fluide et une réservation simple. Les rappels m’aident à ne manquer aucun rendez-vous.", "Lucy", "Londres"],
      ["Recherche et réservation faciles", "Je trouve rapidement un bon professionnel près de moi et je choisis l’heure sans messages.", "Dan", "New York"],
      ["Parfait pour les barbiers", "J’ai comparé plusieurs salons, vérifié les avis et réservé en quelques clics.", "Dale", "Sydney"]
    ],
    statsTitle: "Une meilleure plateforme pour les services sur rendez-vous",
    statsText: "Une solution pour les clients, les professionnels et les propriétaires.",
    statsLabel: "réservations effectuées sur Timviz",
    partners: "entreprises partenaires",
    countries: "pays utilisent Timviz",
    users: "utilisateurs Timviz",
    businessTitle: "Timviz pour les entreprises",
    businessText: "Gérez les réservations, les services, les clients, les plannings d’équipe et le support depuis un seul espace.",
    more: "En savoir plus →",
    about: "À propos de Timviz",
    catalog: "Catalogue",
    legal: "Mentions légales",
    privacy: "Politique de confidentialité",
    terms: "Conditions d’utilisation",
    cityIn: "à",
    nichesTitle: "Pour qui est Timviz",
    nichesSubtitle: "Timviz est conçu pour les professionnels et salons qui travaillent sur rendez-vous",
    prosFooter: "Pour les professionnels"
  },
  pl: {
    ...copy.en,
    navAria: "Menu główne",
    login: "Zaloguj się",
    clientLogin: "Logowanie klienta",
    create: "Utwórz profil firmy",
    menu: "Menu",
    clients: "Dla klientów",
    browse: "Zobacz firmy",
    business: "Dla biznesu",
    dashboard: "Otwórz panel",
    businessLogin: "Logowanie firmy",
    features: "Funkcje biznesowe",
    heroTitle: "Rezerwuj usługi w pobliżu",
    heroText: "Codzienne usługi w jednym miejscu.",
    bookedToday: "rezerwacji dokonano dzisiaj",
    recommended: "Polecane",
    seeAll: "Zobacz wszystkie →",
    appKicker: "Dostępne dla klientów",
    appTitle: "Pobierz aplikację Timviz",
    appText: "Rezerwuj ulubionych specjalistów, odkrywaj nowe miejsca, zmieniaj wizyty i otrzymuj przypomnienia w jednej prostej aplikacji.",
    appButton: "Pobierz aplikację",
    appSoon: "Aplikacje iOS i Android będą dostępne wkrótce",
    comingSoon: "Wkrótce",
    mobileAppsFooter: "Aplikacje mobilne już wkrótce",
    appCardMeta: "5.0 ★★★★★ · Londyn",
    appCardButton: "Zarezerwuj",
    reviewTitle: "Opinie",
    reviewsList: [
      ["Najlepszy system rezerwacji", "Płynne doświadczenie i łatwa rezerwacja. Przypomnienia pomagają mi nie przegapić wizyty.", "Lucy", "Londyn"],
      ["Łatwe wyszukiwanie i rezerwacja", "Szybko znajduję dobrego specjalistę w pobliżu i wybieram termin bez pisania wiadomości.", "Dan", "Nowy Jork"],
      ["Idealne dla barberów", "Porównałem kilka barber shopów, sprawdziłem opinie i zarezerwowałem w kilka kliknięć.", "Dale", "Sydney"]
    ],
    statsTitle: "Lepsza platforma dla usług umawianych na wizyty",
    statsText: "Jedno rozwiązanie dla klientów, specjalistów i właścicieli firm.",
    statsLabel: "rezerwacji dokonano w Timviz",
    partners: "firm partnerskich",
    countries: "krajów używa Timviz",
    users: "użytkowników Timviz",
    businessTitle: "Timviz dla biznesu",
    businessText: "Zarządzaj rezerwacjami, usługami, klientami, grafikami zespołu i obsługą z jednego miejsca.",
    more: "Dowiedz się więcej →",
    about: "O Timviz",
    catalog: "Katalog",
    legal: "Informacje prawne",
    privacy: "Polityka prywatności",
    terms: "Warunki korzystania",
    cityIn: "w",
    nichesTitle: "Dla kogo jest Timviz",
    nichesSubtitle: "Timviz jest dla specjalistów i salonów pracujących na zapisy",
    prosFooter: "Dla specjalistów"
  },
  cs: {
    ...copy.en,
    navAria: "Hlavní menu",
    login: "Přihlásit se",
    clientLogin: "Přihlášení klienta",
    create: "Vytvořit profil firmy",
    menu: "Menu",
    clients: "Pro klienty",
    browse: "Zobrazit podniky",
    business: "Pro firmy",
    dashboard: "Otevřít panel",
    businessLogin: "Přihlášení firmy",
    features: "Funkce pro firmy",
    heroTitle: "Rezervujte služby poblíž",
    heroText: "Každodenní služby na jednom místě.",
    bookedToday: "rezervací dnes vytvořeno",
    recommended: "Doporučené",
    seeAll: "Zobrazit vše →",
    appKicker: "Dostupné pro klienty",
    appTitle: "Stáhněte si aplikaci Timviz",
    appText: "Rezervujte oblíbené profesionály, objevujte nová místa, přesouvejte návštěvy a dostávejte připomenutí v jedné aplikaci.",
    appButton: "Stáhnout aplikaci",
    appSoon: "Aplikace pro iOS a Android budou brzy",
    comingSoon: "Již brzy",
    mobileAppsFooter: "Mobilní aplikace již brzy",
    appCardMeta: "5.0 ★★★★★ · Londýn",
    appCardButton: "Rezervovat",
    reviewTitle: "Recenze",
    reviewsList: [
      ["Nejlepší rezervační systém", "Plynulé používání a snadná rezervace. Připomenutí mi pomáhají nezmeškat návštěvu.", "Lucy", "Londýn"],
      ["Snadné hledání a rezervace", "Rychle najdu dobrého profesionála poblíž a vyberu čas bez psaní zpráv.", "Dan", "New York"],
      ["Perfektní pro barbery", "Porovnal jsem několik barber shopů, zkontroloval recenze a rezervoval na pár kliknutí.", "Dale", "Sydney"]
    ],
    statsTitle: "Lepší platforma pro služby na objednávku",
    statsText: "Jedno řešení pro klienty, profesionály a majitele firem.",
    statsLabel: "rezervací vytvořeno v Timviz",
    partners: "partnerských firem",
    countries: "zemí používá Timviz",
    users: "uživatelů Timviz",
    businessTitle: "Timviz pro firmy",
    businessText: "Spravujte rezervace, služby, klienty, rozvrhy týmu a podporu z jednoho prostoru.",
    more: "Zjistit více →",
    about: "O Timviz",
    catalog: "Katalog",
    legal: "Právní informace",
    privacy: "Zásady ochrany osobních údajů",
    terms: "Podmínky použití",
    cityIn: "v",
    nichesTitle: "Pro koho je Timviz",
    nichesSubtitle: "Timviz je pro profesionály a salony pracující na objednávky",
    prosFooter: "Pro profesionály"
  },
  es: {
    ...copy.en,
    navAria: "Menú principal",
    login: "Iniciar sesión",
    clientLogin: "Acceso de cliente",
    create: "Crear perfil de empresa",
    menu: "Menú",
    clients: "Para clientes",
    browse: "Ver empresas",
    business: "Para negocios",
    dashboard: "Abrir panel",
    businessLogin: "Acceso de negocio",
    features: "Funciones para negocios",
    heroTitle: "Reserva servicios cerca",
    heroText: "Servicios diarios, todos en un solo lugar.",
    bookedToday: "reservas hechas hoy",
    recommended: "Recomendados",
    seeAll: "Ver todo →",
    appKicker: "Disponible para clientes",
    appTitle: "Descarga la app Timviz",
    appText: "Reserva con tus profesionales favoritos, descubre nuevos lugares, cambia visitas y recibe recordatorios en una sola app.",
    appButton: "Descargar app",
    appSoon: "Las apps para iOS y Android llegarán pronto",
    comingSoon: "Próximamente",
    mobileAppsFooter: "Apps móviles próximamente",
    appCardMeta: "5.0 ★★★★★ · Londres",
    appCardButton: "Reservar",
    reviewTitle: "Reseñas",
    reviewsList: [
      ["El mejor sistema de reservas", "Una experiencia fluida y una reserva sencilla. Los recordatorios me ayudan a no perder ninguna visita.", "Lucy", "Londres"],
      ["Búsqueda y reserva fáciles", "Encuentro rápido un buen profesional cerca y elijo la hora sin mensajes.", "Dan", "Nueva York"],
      ["Perfecto para barberos", "Comparé varias barberías, revisé reseñas y reservé en pocos clics.", "Dale", "Sídney"]
    ],
    statsTitle: "Una mejor plataforma para servicios con cita",
    statsText: "Una solución para clientes, profesionales y dueños de negocios.",
    statsLabel: "reservas realizadas en Timviz",
    partners: "empresas asociadas",
    countries: "países usan Timviz",
    users: "usuarios de Timviz",
    businessTitle: "Timviz para negocios",
    businessText: "Gestiona reservas, servicios, clientes, horarios del equipo y soporte desde un solo espacio.",
    more: "Más información →",
    about: "Sobre Timviz",
    catalog: "Catálogo",
    legal: "Legal",
    privacy: "Política de privacidad",
    terms: "Términos de uso",
    cityIn: "en",
    nichesTitle: "Para quién es Timviz",
    nichesSubtitle: "Timviz está creado para profesionales y salones que trabajan con cita previa",
    prosFooter: "Para profesionales"
  },
  de: {
    ...copy.en,
    navAria: "Hauptmenü",
    login: "Einloggen",
    clientLogin: "Kundenlogin",
    create: "Firmenprofil erstellen",
    menu: "Menü",
    clients: "Für Kunden",
    browse: "Unternehmen ansehen",
    business: "Für Unternehmen",
    dashboard: "Dashboard öffnen",
    businessLogin: "Business-Login",
    features: "Business-Funktionen",
    heroTitle: "Services in deiner Nähe buchen",
    heroText: "Alltägliche Services an einem Ort.",
    bookedToday: "Buchungen heute erstellt",
    recommended: "Empfohlen",
    seeAll: "Alle ansehen →",
    appKicker: "Für Kunden verfügbar",
    appTitle: "Timviz App herunterladen",
    appText: "Buchen Sie Ihre Lieblingsprofis, entdecken Sie neue Orte, verschieben Sie Termine und erhalten Sie Erinnerungen in einer einfachen App.",
    appButton: "App herunterladen",
    appSoon: "iOS- und Android-Apps kommen bald",
    comingSoon: "Demnächst",
    mobileAppsFooter: "Mobile Apps kommen bald",
    appCardMeta: "5.0 ★★★★★ · London",
    appCardButton: "Buchen",
    reviewTitle: "Bewertungen",
    reviewsList: [
      ["Das beste Buchungssystem", "Eine reibungslose Erfahrung und einfache Buchung. Erinnerungen helfen mir, keinen Termin zu verpassen.", "Lucy", "London"],
      ["Einfache Suche und Buchung", "Ich finde schnell einen guten Profi in der Nähe und wähle die passende Zeit ohne Nachrichten.", "Dan", "New York"],
      ["Perfekt für Barber", "Ich habe mehrere Barbershops verglichen, Bewertungen geprüft und in wenigen Klicks gebucht.", "Dale", "Sydney"]
    ],
    statsTitle: "Eine bessere Plattform für Terminservices",
    statsText: "Eine Lösung für Kunden, Profis und Unternehmensinhaber.",
    statsLabel: "Buchungen auf Timviz erstellt",
    partners: "Partnerunternehmen",
    countries: "Länder nutzen Timviz",
    users: "Timviz Nutzer",
    businessTitle: "Timviz für Unternehmen",
    businessText: "Verwalten Sie Buchungen, Leistungen, Kunden, Teampläne und Support in einem Arbeitsbereich.",
    more: "Mehr erfahren →",
    about: "Über Timviz",
    catalog: "Katalog",
    legal: "Rechtliches",
    privacy: "Datenschutzrichtlinie",
    terms: "Nutzungsbedingungen",
    cityIn: "in",
    nichesTitle: "Für wen Timviz ist",
    nichesSubtitle: "Timviz ist für Profis und Salons, die mit Terminen arbeiten",
    prosFooter: "Für Profis"
  }
});

const cities = [
  {
    city: { ru: "Киев", uk: "Київ", en: "Kyiv", fr: "Kyiv", pl: "Kijów", cs: "Kyjev", es: "Kyiv", de: "Kyjiw" },
    links: {
      ru: ["Парикмахерские", "Ногти", "Брови и ресницы", "Массаж", "Спа и сауна"],
      uk: ["Перукарні", "Нігті", "Брови та вії", "Масаж", "Спа і сауна"],
      en: ["Hair salons", "Nails", "Brows and lashes", "Massage", "Spa and sauna"],
      fr: ["Coiffure", "Ongles", "Sourcils et cils", "Massage", "Spa et sauna"],
      pl: ["Fryzjerzy", "Paznokcie", "Brwi i rzęsy", "Masaż", "Spa i sauna"],
      cs: ["Kadeřnictví", "Nehty", "Obočí a řasy", "Masáž", "Spa a sauna"],
      es: ["Peluquerías", "Uñas", "Cejas y pestañas", "Masaje", "Spa y sauna"],
      de: ["Friseursalons", "Nägel", "Augenbrauen und Wimpern", "Massage", "Spa und Sauna"]
    }
  },
  {
    city: { ru: "Львов", uk: "Львів", en: "Lviv", fr: "Lviv", pl: "Lwów", cs: "Lvov", es: "Lviv", de: "Lwiw" },
    links: {
      ru: ["Салоны красоты", "Барберы", "Макияж", "Косметология", "Депиляция"],
      uk: ["Салони краси", "Барбери", "Макіяж", "Косметологія", "Депіляція"],
      en: ["Beauty salons", "Barbers", "Makeup", "Cosmetology", "Waxing"],
      fr: ["Instituts de beauté", "Barbiers", "Maquillage", "Cosmétologie", "Épilation"],
      pl: ["Salony kosmetyczne", "Barberzy", "Makijaż", "Kosmetologia", "Depilacja"],
      cs: ["Kosmetické salony", "Barbeři", "Make-up", "Kosmetologie", "Depilace"],
      es: ["Salones de belleza", "Barberos", "Maquillaje", "Cosmetología", "Depilación"],
      de: ["Kosmetikstudios", "Barber", "Make-up", "Kosmetik", "Waxing"]
    }
  }
];

const countryTabs = withEnglishFallback<string[]>({
  ru: ["Украина", "Польша", "Германия", "Франция", "Италия", "Канада", "США", "Испания"],
  uk: ["Україна", "Польща", "Німеччина", "Франція", "Італія", "Канада", "США", "Іспанія"],
  en: ["Ukraine", "Poland", "Germany", "France", "Italy", "Canada", "USA", "Spain"]
}) satisfies Record<PublicLanguage, string[]>;

Object.assign(countryTabs, {
  fr: ["Ukraine", "Pologne", "Allemagne", "France", "Italie", "Canada", "États-Unis", "Espagne"],
  pl: ["Ukraina", "Polska", "Niemcy", "Francja", "Włochy", "Kanada", "USA", "Hiszpania"],
  cs: ["Ukrajina", "Polsko", "Německo", "Francie", "Itálie", "Kanada", "USA", "Španělsko"],
  es: ["Ucrania", "Polonia", "Alemania", "Francia", "Italia", "Canadá", "EE. UU.", "España"],
  de: ["Ukraine", "Polen", "Deutschland", "Frankreich", "Italien", "Kanada", "USA", "Spanien"]
});

const dashboardServices = withEnglishFallback<string[]>({
  ru: ["Стрижка", "Окрашивание", "Массаж", "Маникюр"],
  uk: ["Стрижка", "Фарбування", "Масаж", "Манікюр"],
  en: ["Haircut", "Color", "Massage", "Manicure"]
}) satisfies Record<PublicLanguage, string[]>;

Object.assign(dashboardServices, {
  fr: ["Coupe", "Coloration", "Massage", "Manucure"],
  pl: ["Strzyżenie", "Koloryzacja", "Masaż", "Manicure"],
  cs: ["Střih", "Barvení", "Masáž", "Manikúra"],
  es: ["Corte", "Coloración", "Masaje", "Manicura"],
  de: ["Haarschnitt", "Farbe", "Massage", "Maniküre"]
});

const appDemoCity: Record<PublicLanguage, string> = {
  ru: "Лондон",
  uk: "Лондон",
  en: "London",
  fr: "Londres",
  pl: "Londyn",
  cs: "Londýn",
  es: "Londres",
  de: "London"
};

export default function PublicHome({ searchIndex, stats, initialLanguage = "ru" }: PublicHomeProps) {
  const [language, setLanguage] = useState<PublicLanguage>(initialLanguage);
  const t = copy[language];

  useEffect(() => {
    setLanguage(initialLanguage || getInitialLanguage());
    try {
      if (typeof window.localStorage?.setItem === "function") {
        window.localStorage.setItem("rezervo-pro-language", initialLanguage);
      }
    } catch {
      // Public landing should render even when storage is unavailable.
    }
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<PublicLanguage>).detail;
      if (isSiteLanguage(nextLanguage)) {
        setLanguage(nextLanguage);
      }
    };

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, [initialLanguage]);

  const reviews = t.reviewsList as string[][];
  const mobileAppsAvailable = areMobileAppsAvailable();
  const footerLabels = publicFooterLabels[language];

  return (
    <main className="public-home">
      <header className="public-header">
        <Link className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></Link>
        <nav className="public-nav" aria-label={String(t.navAria)}>
          <PublicHeaderAuthMenu language={language} />
          <Link href={getLocalizedPath(language, "/for-business")} className="public-company-button">{String(t.create)}</Link>
          <details className="public-menu">
            <summary aria-label={String(t.menu)} title={String(t.menu)}>
              <span>{String(t.menu)}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <strong>{String(t.clients)}</strong>
              <Link href={getLocalizedPath(language, "/catalog")}>{String(t.browse)}</Link>
              <Link href={getLocalizedPath(language, "/account")}>{String(t.clientAuth)}</Link>
              <a href="#app">{mobileAppsAvailable ? String(t.app) : String(t.mobileAppsFooter)}</a>
              <a href="#reviews">{String(t.reviews)}</a>
              <hr />
              <strong>{String(t.business)}</strong>
              <Link href={getLocalizedPath(language, "/for-business")}>{String(t.create)}</Link>
              <Link href="/pro/login">{String(t.dashboard)}</Link>
              <Link href={getLocalizedPath(language, "/for-business")}>{String(t.features)}</Link>
            </div>
          </details>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="public-hero">
        <div className="public-hero-glow" />
        <h1>{String(t.heroTitle)}</h1>
        <p>{String(t.heroText)}</p>

        <PublicSearch index={searchIndex} language={language} />

        <div className="public-hero-count">
          <strong>{formatNumber(stats.bookedToday, language)}</strong> {String(t.bookedToday)}
        </div>
      </section>

      <section className="public-section public-carousel-section">
        <div className="public-section-head">
          <h2>{String(t.recommended)}</h2>
          <Link href={getLocalizedPath(language, "/catalog")}>{String(t.seeAll)}</Link>
        </div>
        <div className="public-business-grid">
          {businesses.map((business) => (
            <Link className="public-business-card" href={getLocalizedPath(language, "/catalog")} key={business.name}>
              <img src={business.image} alt={business.name} />
              <div>
                <h3>{business.name}</h3>
                <span className="public-rating">★ {business.rating} <small>({business.reviews})</small></span>
              </div>
              <p>{localizePublicValue(business.location, language)}</p>
              <small>{localizePublicValue(business.category, language)}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="public-app-section" id="app">
        <div>
          <span className="public-kicker">{String(t.appKicker)}</span>
          <h2>{String(t.appTitle)}</h2>
          <p>{String(t.appText)}</p>
          {mobileAppsAvailable ? (
            <div className="public-app-badges" aria-label={String(t.appButton)}>
              {mobileApps.ios.enabled && mobileApps.ios.url ? (
                <a className="public-store-badge" href={mobileApps.ios.url} rel="noopener noreferrer" target="_blank">
                  <span>{String(t.appStore)}</span>
                </a>
              ) : null}
              {mobileApps.android.enabled && mobileApps.android.url ? (
                <a className="public-store-badge" href={mobileApps.android.url} rel="noopener noreferrer" target="_blank">
                  <span>{String(t.googlePlay)}</span>
                </a>
              ) : null}
            </div>
          ) : (
            <div className="public-mobile-soon" aria-label={String(t.appSoon)}>
              <span>{String(t.appSoon)}</span>
              <div className="public-app-badges public-app-badges-disabled" aria-hidden="true">
                <span className="public-store-badge public-store-badge-disabled">{String(t.appStore)}</span>
                <span className="public-store-badge public-store-badge-disabled">{String(t.googlePlay)}</span>
              </div>
              <strong>{String(t.comingSoon)}</strong>
            </div>
          )}
        </div>
        <div className="public-phone-stack" aria-hidden="true">
          <div className="public-phone-card">
            <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80" alt="" />
            <h3>{String(t.appCardTitle)}</h3>
            <p>{String(t.appCardMeta)}</p>
            <button>{String(t.appCardButton)}</button>
          </div>
          <div className="public-map-card">
            <span>{appDemoCity[language]}</span>
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <section className="public-section" id="reviews">
        <div className="public-section-head">
          <h2>{String(t.reviewTitle)}</h2>
        </div>
        <div className="public-review-grid">
          {reviews.map((review) => (
            <article className="public-review-card" key={review[0]}>
              <div className="public-stars">★★★★★</div>
              <h3>{review[0]}</h3>
              <p>{review[1]}</p>
              <footer>
                <span>{review[2].slice(0, 1)}</span>
                <div>
                  <strong>{review[2]}</strong>
                  <small>{review[3]}</small>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="public-stats-section">
        <h2>{String(t.statsTitle)}</h2>
        <p>{String(t.statsText)}</p>
        <strong>{formatStatsBig(stats.totalBookings, language)}</strong>
        <span>{String(t.statsLabel)}</span>
        <div className="public-stats-row">
          <div><b>{formatNumberWithPlus(stats.partnerBusinesses + HOME_COUNTER_BASE.partnerBusinesses, language)}</b><span>{String(t.partners)}</span></div>
          <div><b>{formatNumberWithPlus(stats.countries + HOME_COUNTER_BASE.countries, language)}</b><span>{String(t.countries)}</span></div>
          <div><b>{formatNumberWithPlus(stats.totalUsers + HOME_COUNTER_BASE.totalUsers, language)}</b><span>{String(t.users)}</span></div>
        </div>
      </section>

      <section className="public-business-section" id="business">
        <div>
          <h2>{String(t.businessTitle)}</h2>
          <p>{String(t.businessText)}</p>
          <Link href={getLocalizedPath(language, "/for-business")}>{String(t.more)}</Link>
          <div className="public-business-rating">
            <strong>{String(t.rating)}</strong>
            <span>★★★★★</span>
            <small>{String(t.ratingText)}</small>
          </div>
        </div>
        <div className="public-dashboard-preview">
          <div className="public-preview-top">
            <BrandLogo />
            <button>{String(t.dashboardToday)}</button>
            <button>{String(t.dashboardTeam)}</button>
          </div>
          <div className="public-preview-grid">
            <i className="blue">9:00 - 10:00<br />{dashboardServices[language][0]}</i>
            <i className="pink">9:30 - 11:00<br />{dashboardServices[language][1]}</i>
            <i className="green">11:30 - 12:30<br />{dashboardServices[language][2]}</i>
            <i className="yellow">13:00 - 14:00<br />{dashboardServices[language][3]}</i>
          </div>
        </div>
      </section>
      <NicheLinksSection
        language={language}
        title={String(t.nichesTitle)}
        subtitle={String(t.nichesSubtitle)}
        className="niche-links-section niche-links-section--home"
      />

      <section className="public-cities-section">
        <div className="public-country-tabs">
          {countryTabs[language].map((country, index) => (
            <span className={index === 0 ? "active" : ""} key={country}>{country}</span>
          ))}
        </div>
        <div className="public-city-grid">
          {cities.map((city) => (
            <div key={city.city.en}>
              <h3>{localizePublicValue(city.city, language)}</h3>
              {localizePublicList(city.links, language).map((link) => (
                <a
                  href={`${getLocalizedPath(language, "/city-preview")}?city=${encodeURIComponent(localizePublicValue(city.city, language))}&category=${encodeURIComponent(link)}`}
                  rel="nofollow"
                  key={link}
                >
                  {link} {String(t.cityIn)} {localizePublicValue(city.city, language)}
                </a>
              ))}
            </div>
          ))}
        </div>
      </section>

      <footer className="public-footer">
        <div>
          <Link className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></Link>
          <span className="public-footer-mobile-note">{mobileAppsAvailable ? String(t.appButton) : String(t.mobileAppsFooter)}</span>
        </div>
        <div>
          <h3>{String(t.about)}</h3>
          <a href="#reviews">{String(t.reviews)}</a>
          <a href="#app">{mobileAppsAvailable ? String(t.app) : String(t.mobileAppsFooter)}</a>
          <Link href={getLocalizedPath(language, "/catalog")}>{String(t.catalog)}</Link>
        </div>
        <div>
          <h3>{String(t.business)}</h3>
          <Link href={getLocalizedPath(language, "/for-business")}>{String(t.create)}</Link>
          <Link href="/pro/login">{String(t.login)}</Link>
          <Link href={getLocalizedPath(language, "/for-business")}>{String(t.features)}</Link>
        </div>
        <div>
          <h3>{String(t.prosFooter)}</h3>
          <Link href={getLocalizedPath(language, `/${getNicheSlug(language, "manicure")}`)}>{nicheCards.manicure[language].shortTitle}</Link>
          <Link href={getLocalizedPath(language, `/${getNicheSlug(language, "hairdressers")}`)}>{nicheCards.hairdressers[language].shortTitle}</Link>
          <Link href={getLocalizedPath(language, `/${getNicheSlug(language, "barbers")}`)}>{nicheCards.barbers[language].shortTitle}</Link>
          <Link href={getLocalizedPath(language, `/${getNicheSlug(language, "cosmetologists")}`)}>{nicheCards.cosmetologists[language].shortTitle}</Link>
          <Link href={getLocalizedPath(language, `/${getNicheSlug(language, "massage")}`)}>{nicheCards.massage[language].shortTitle}</Link>
        </div>
        <div>
          <h3>{String(t.legal)}</h3>
          <Link href={getLocalizedPath(language, "/pricing")}>{footerLabels.pricing}</Link>
          <Link href={getLocalizedPath(language, "/privacy")}>{String(t.privacy)}</Link>
          <Link href={getLocalizedPath(language, "/terms")}>{String(t.terms)}</Link>
          <Link href={getLocalizedPath(language, "/refund-policy")}>{footerLabels.refund}</Link>
          <Link href={getLocalizedPath(language, "/contact")}>{footerLabels.contact}</Link>
          <a href="mailto:adm@timviz.com">adm@timviz.com</a>
        </div>
      </footer>
    </main>
  );
}
