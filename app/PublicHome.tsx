"use client";

import { useEffect, useState } from "react";
import type { PublicHomeStats } from "../lib/public-home-stats";
import type { PublicSearchIndex } from "../lib/public-search";
import { getNicheSlug } from "../lib/niche-pages";
import { getLocalizedPath, isSiteLanguage, type SiteLanguage } from "../lib/site-language";
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
  return `Более ${compact}`;
}

function getInitialLanguage(): PublicLanguage {
  if (typeof window === "undefined") return "ru";
  const saved = window.localStorage.getItem("rezervo-pro-language");
  if (isSiteLanguage(saved)) return saved;

  const candidates = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (candidates.some((value) => value.startsWith("uk") || value.includes("-ua"))) return "uk";
  if (candidates.some((value) => value.startsWith("en"))) return "en";
  return "ru";
}

const copy = {
  ru: {
    navAria: "Главное меню",
    login: "Войти",
    clientLogin: "Вход для клиента",
    create: "Создать профиль компании",
    menu: "Меню",
    clients: "Для клиентов",
    browse: "Поиск профилей",
    clientAuth: "Вход или регистрация",
    app: "Публичный профиль",
    reviews: "О сервисе",
    business: "Для бизнеса",
    dashboard: "Войти в кабинет",
    businessLogin: "Вход для бизнеса",
    features: "Возможности для бизнеса",
    heroTitle: "Timviz — онлайн-запись и календарь для мастеров",
    heroText: "Ведите записи, клиентов, расписание и онлайн-бронирования в одном сервисе. Клиенты могут записываться сами по вашей ссылке, а также находить ваш профиль в Timviz.",
    primaryCta: "Начать бесплатно",
    secondaryCta: "Найти мастера",
    bookedToday: "записей обработано сегодня",
    recommended: "Для мастеров и сервисного бизнеса",
    seeAll: "Начать бесплатно →",
    appKicker: "Публичный профиль мастера",
    appTitle: "Профиль мастера, который удобно отправить клиентам",
    appText: "Каждый мастер может получить публичную страницу с услугами, расписанием и кнопкой онлайн-записи. Клиенты могут открыть профиль по ссылке, выбрать удобное время и отправить запрос на запись.",
    appButton: "Начать бесплатно",
    appSoon: "iOS и Android приложения скоро появятся 💜",
    appStore: "App Store",
    googlePlay: "Google Play",
    comingSoon: "Скоро",
    mobileAppsFooter: "Мобильные приложения скоро появятся",
    appCardTitle: "Trendy Studio",
    appCardMeta: "5.0 ★★★★★ · Лондон",
    appCardButton: "Запрос на запись",
    reviewTitle: "Что умеет Timviz",
    reviewsList: [
      ["Лучшая система бронирования", "Отличный опыт, легко бронировать. Оплачивать процедуры удобно, а напоминания помогают не забывать о записи.", "Люси", "Лондон"],
      ["Простота поиска и записи", "Можно быстро найти хорошего мастера рядом и выбрать удобное время без переписок.", "Дэн", "Нью-Йорк"],
      ["Идеально для барберов", "Нашел несколько барбершопов, сравнил отзывы и записался за пару кликов.", "Дейл", "Сидней"]
    ],
    statsTitle: "Timviz — SaaS для записи и управления расписанием",
    statsText: "Timviz продаёт подписку на программное обеспечение для мастеров и сервисного бизнеса, а не услуги третьих лиц.",
    statsLabel: "записей обработано через рабочие инструменты Timviz",
    partners: "бизнес-профилей",
    countries: "стран используют Timviz",
    users: "пользователей Timviz",
    businessTitle: "Timviz для бизнеса",
    businessText: "Управляйте записями, услугами, клиентами, рабочими часами, ссылкой онлайн-записи и уведомлениями из одного кабинета.",
    more: "Подробнее →",
    rating: "Отлично 5/5",
    ratingText: "Первые отзывы от партнеров Timviz",
    dashboardToday: "Сегодня",
    dashboardTeam: "Рабочая команда",
    about: "О Timviz",
    catalog: "Поиск профилей",
    legal: "Юридическая информация",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    cityIn: "в",
    nichesTitle: "Для кого Timviz",
    nichesSubtitle: "Timviz помогает специалистам вести расписание, принимать онлайн-записи и управлять клиентами без таблиц, блокнотов и хаоса.",
    prosFooter: "Для мастеров",
    audienceCards: ["Парикмахеры и барберы", "Ногтевой сервис", "Косметологи", "Бровисты и визажисты", "Массажисты", "Репетиторы", "Фитнес-тренеры", "Другие услуги по записи"],
    featureCards: ["Онлайн-календарь записей", "Рабочие часы и услуги", "Самостоятельная запись клиента по ссылке", "Клиентская база", "Напоминания и уведомления", "Аналитика для мастера", "Публичный профиль мастера", "Поиск доступных профилей Timviz"],
    searchTitle: "Поиск открытых профилей",
    searchText: "Некоторые мастера могут сделать свой профиль видимым в поиске Timviz, чтобы клиентам было проще найти страницу для записи.",
    profileDisclaimer: "Timviz не продаёт услуги мастеров и не принимает оплату за услуги клиентов. Сервис предоставляет программные инструменты для записи и управления расписанием.",
    saasStatement: "Timviz is a SaaS appointment scheduling and business management platform for service professionals. We provide software tools for managing appointments, clients, working hours, online booking pages, notifications, and analytics. Timviz does not sell third-party services, does not act as a marketplace, and does not process payments between clients and service providers.",
    footerSoftware: "Timviz is appointment scheduling software for service professionals."
  },
  uk: {
    navAria: "Головне меню",
    login: "Увійти",
    clientLogin: "Вхід для клієнта",
    create: "Створити профіль компанії",
    menu: "Меню",
    clients: "Для клієнтів",
    browse: "Пошук профілів",
    clientAuth: "Вхід або реєстрація",
    app: "Публічний профіль",
    reviews: "Про сервіс",
    business: "Для бізнесу",
    dashboard: "Увійти в кабінет",
    businessLogin: "Вхід для бізнесу",
    features: "Можливості для бізнесу",
    heroTitle: "Timviz — онлайн-запис і календар для майстрів",
    heroText: "Ведіть записи, клієнтів, розклад і онлайн-бронювання в одному сервісі. Клієнти можуть записуватися самостійно за вашим посиланням, а також знаходити ваш профіль у Timviz.",
    primaryCta: "Почати безкоштовно",
    secondaryCta: "Знайти майстра",
    bookedToday: "записів оброблено сьогодні",
    recommended: "Для майстрів і сервісного бізнесу",
    seeAll: "Почати безкоштовно →",
    appKicker: "Публічний профіль майстра",
    appTitle: "Профіль майстра, який зручно надсилати клієнтам",
    appText: "Кожен майстер може отримати публічну сторінку з послугами, розкладом і кнопкою онлайн-запису. Клієнти можуть відкрити профіль за посиланням, вибрати зручний час і надіслати запит на запис.",
    appButton: "Почати безкоштовно",
    appSoon: "Застосунки для iOS та Android скоро з’являться 💜",
    appStore: "App Store",
    googlePlay: "Google Play",
    comingSoon: "Скоро",
    mobileAppsFooter: "Мобільні застосунки скоро з’являться",
    appCardTitle: "Trendy Studio",
    appCardMeta: "5.0 ★★★★★ · Лондон",
    appCardButton: "Запит на запис",
    reviewTitle: "Що вміє Timviz",
    reviewsList: [
      ["Найкраща система бронювання", "Чудовий досвід, легко бронювати. Оплачувати процедури зручно, а нагадування допомагають не забути про запис.", "Люсі", "Лондон"],
      ["Простий пошук і запис", "Можна швидко знайти хорошого майстра поруч і вибрати зручний час без переписок.", "Ден", "Нью-Йорк"],
      ["Ідеально для барберів", "Знайшов кілька барбершопів, порівняв відгуки й записався за пару кліків.", "Дейл", "Сідней"]
    ],
    statsTitle: "Timviz — SaaS для запису і керування розкладом",
    statsText: "Timviz продає підписку на програмне забезпечення для майстрів і сервісного бізнесу, а не послуги третіх осіб.",
    statsLabel: "записів оброблено через робочі інструменти Timviz",
    partners: "бізнес-профілів",
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
    catalog: "Пошук профілів",
    legal: "Юридична інформація",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    cityIn: "у",
    nichesTitle: "Для кого Timviz",
    nichesSubtitle: "Timviz допомагає спеціалістам вести розклад, приймати онлайн-записи та керувати клієнтами без таблиць, блокнотів і хаосу.",
    prosFooter: "Для майстрів",
    audienceCards: ["Перукарі та барбери", "Нігтьовий сервіс", "Косметологи", "Бровісти та візажисти", "Масажисти", "Репетитори", "Фітнес-тренери", "Інші послуги за записом"],
    featureCards: ["Онлайн-календар записів", "Робочі години та послуги", "Самостійний запис клієнта за посиланням", "Клієнтська база", "Нагадування і сповіщення", "Аналітика для майстра", "Публічний профіль майстра", "Пошук доступних профілів Timviz"],
    searchTitle: "Пошук відкритих профілів",
    searchText: "Деякі майстри можуть зробити свій профіль видимим у пошуку Timviz, щоб клієнтам було простіше знайти сторінку для запису.",
    profileDisclaimer: "Timviz не продає послуги майстрів і не приймає оплату за послуги клієнтів. Сервіс надає програмні інструменти для запису та керування розкладом.",
    saasStatement: "Timviz is a SaaS appointment scheduling and business management platform for service professionals. We provide software tools for managing appointments, clients, working hours, online booking pages, notifications, and analytics. Timviz does not sell third-party services, does not act as a marketplace, and does not process payments between clients and service providers.",
    footerSoftware: "Timviz is appointment scheduling software for service professionals."
  },
  en: {
    navAria: "Main menu",
    login: "Log in",
    clientLogin: "Client sign in",
    create: "Create company profile",
    menu: "Menu",
    clients: "For clients",
    browse: "Search profiles",
    clientAuth: "Log in or register",
    app: "Public profile",
    reviews: "About",
    business: "For business",
    dashboard: "Open dashboard",
    businessLogin: "Business sign in",
    features: "Business features",
    heroTitle: "Timviz — online booking and calendar for service professionals",
    heroText: "Manage appointments, clients, working hours and online bookings in one service. Clients can book through your link and may also find your Timviz profile.",
    primaryCta: "Start for free",
    secondaryCta: "Find a professional",
    bookedToday: "appointments handled today",
    recommended: "For professionals and service businesses",
    seeAll: "Start for free →",
    appKicker: "Public professional profile",
    appTitle: "A professional profile you can send to clients",
    appText: "Every professional can get a public page with services, schedule and an online booking button. Clients can open the profile by link, choose a convenient time and send a booking request.",
    appButton: "Start for free",
    appSoon: "iOS and Android apps are coming soon 💜",
    appStore: "App Store",
    googlePlay: "Google Play",
    comingSoon: "Coming soon",
    mobileAppsFooter: "Mobile apps coming soon",
    appCardTitle: "Trendy Studio",
    appCardMeta: "5.0 ★★★★★ · London",
    appCardButton: "Request booking",
    reviewTitle: "What Timviz does",
    reviewsList: [
      ["The best booking system", "A smooth experience and easy booking. Payments are convenient, and reminders help me never miss a visit.", "Lucy", "London"],
      ["Easy search and booking", "I can quickly find a great professional nearby and choose the right time without messaging.", "Dan", "New York"],
      ["Perfect for barbers", "I compared several barbershops, checked reviews and booked in a few clicks.", "Dale", "Sydney"]
    ],
    statsTitle: "Timviz is SaaS for appointment scheduling",
    statsText: "Timviz sells software subscriptions for service professionals and businesses, not third-party services.",
    statsLabel: "appointments handled with Timviz tools",
    partners: "business profiles",
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
    catalog: "Profile search",
    legal: "Legal",
    privacy: "Privacy policy",
    terms: "Terms of use",
    cityIn: "in",
    nichesTitle: "Who Timviz is for",
    nichesSubtitle: "Timviz helps specialists manage schedules, online bookings and clients without spreadsheets, notebooks or operational chaos.",
    prosFooter: "For professionals",
    audienceCards: ["Hairdressers and barbers", "Nail services", "Cosmetologists", "Brow artists and makeup artists", "Massage therapists", "Tutors", "Fitness trainers", "Other appointment-based services"],
    featureCards: ["Online appointment calendar", "Working hours and services", "Self-booking by client link", "Client database", "Reminders and notifications", "Analytics for professionals", "Public professional profile", "Search available Timviz profiles"],
    searchTitle: "Search open profiles",
    searchText: "Some professionals can make their profile visible in Timviz search so clients can more easily find the booking page.",
    profileDisclaimer: "Timviz does not sell professionals' services and does not accept payment for client services. The service provides software tools for booking and schedule management.",
    saasStatement: "Timviz is a SaaS appointment scheduling and business management platform for service professionals. We provide software tools for managing appointments, clients, working hours, online booking pages, notifications, and analytics. Timviz does not sell third-party services, does not act as a marketplace, and does not process payments between clients and service providers.",
    footerSoftware: "Timviz is appointment scheduling software for service professionals."
  }
} satisfies Record<PublicLanguage, Record<string, string | string[] | string[][]>>;

const cities = [
  {
    city: { ru: "Киев", uk: "Київ", en: "Kyiv" },
    links: {
      ru: ["Парикмахерские", "Ногти", "Брови и ресницы", "Массаж", "Спа и сауна"],
      uk: ["Перукарні", "Нігті", "Брови та вії", "Масаж", "Спа і сауна"],
      en: ["Hair salons", "Nails", "Brows and lashes", "Massage", "Spa and sauna"]
    }
  },
  {
    city: { ru: "Львов", uk: "Львів", en: "Lviv" },
    links: {
      ru: ["Салоны красоты", "Барберы", "Макияж", "Косметология", "Депиляция"],
      uk: ["Салони краси", "Барбери", "Макіяж", "Косметологія", "Депіляція"],
      en: ["Beauty salons", "Barbers", "Makeup", "Cosmetology", "Waxing"]
    }
  }
];

const countryTabs = {
  ru: ["Украина", "Польша", "Германия", "Франция", "Италия", "Канада", "США", "Испания"],
  uk: ["Україна", "Польща", "Німеччина", "Франція", "Італія", "Канада", "США", "Іспанія"],
  en: ["Ukraine", "Poland", "Germany", "France", "Italy", "Canada", "USA", "Spain"]
} satisfies Record<PublicLanguage, string[]>;

const dashboardServices = {
  ru: ["Стрижка", "Окрашивание", "Массаж", "Маникюр"],
  uk: ["Стрижка", "Фарбування", "Масаж", "Манікюр"],
  en: ["Haircut", "Color", "Massage", "Manicure"]
} satisfies Record<PublicLanguage, string[]>;

export default function PublicHome({ searchIndex, stats, initialLanguage = "ru" }: PublicHomeProps) {
  const [language, setLanguage] = useState<PublicLanguage>(initialLanguage);
  const t = copy[language];

  useEffect(() => {
    setLanguage(initialLanguage || getInitialLanguage());
    window.localStorage.setItem("rezervo-pro-language", initialLanguage);
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<PublicLanguage>).detail;
      if (isSiteLanguage(nextLanguage)) {
        setLanguage(nextLanguage);
      }
    };

    window.addEventListener("rezervo-language-change", handleLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", handleLanguageChange);
  }, [initialLanguage]);

  const audienceCards = t.audienceCards as string[];
  const featureCards = t.featureCards as string[];
  return (
    <main className="public-home">
      <header className="public-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="public-nav" aria-label={String(t.navAria)}>
          <PublicHeaderAuthMenu language={language} />
          <a href={getLocalizedPath(language, "/for-business")} className="public-company-button">{String(t.create)}</a>
          <details className="public-menu">
            <summary>
              <span>{String(t.menu)}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <strong>{String(t.clients)}</strong>
              <a href={getLocalizedPath(language, "/catalog")}>{String(t.browse)}</a>
              <a href={getLocalizedPath(language, "/account")}>{String(t.clientAuth)}</a>
              <a href="#app">{String(t.app)}</a>
              <a href="#reviews">{String(t.reviews)}</a>
              <hr />
              <strong>{String(t.business)}</strong>
              <a href={getLocalizedPath(language, "/for-business")}>{String(t.create)}</a>
              <a href="/pro/login">{String(t.dashboard)}</a>
              <a href={getLocalizedPath(language, "/for-business")}>{String(t.features)}</a>
            </div>
          </details>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="public-hero">
        <div className="public-hero-glow" />
        <h1>{String(t.heroTitle)}</h1>
        <p>{String(t.heroText)}</p>

        <div className="public-hero-actions">
          <a className="business-primary" href="/pro/create-account">{String(t.primaryCta)}</a>
          <a className="business-secondary" href="#profile-search">{String(t.secondaryCta)}</a>
        </div>

        <div className="public-hero-count">
          <strong>{formatNumber(stats.bookedToday, language)}</strong> {String(t.bookedToday)}
        </div>
      </section>

      <section className="public-section public-carousel-section">
        <div className="public-section-head">
          <h2>{String(t.recommended)}</h2>
          <a href="/pro/create-account">{String(t.seeAll)}</a>
        </div>
        <div className="public-business-grid">
          {audienceCards.map((item, index) => (
            <article className="public-business-card public-saas-card" key={item}>
              <div>
                <span className="public-rating">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item}</h3>
              </div>
              <p>{String(t.nichesSubtitle)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-app-section" id="app">
        <div>
          <span className="public-kicker">{String(t.appKicker)}</span>
          <h2>{String(t.appTitle)}</h2>
          <p>{String(t.appText)}</p>
          <p className="public-saas-note">{String(t.profileDisclaimer)}</p>
          <a className="business-primary" href="/pro/create-account">{String(t.appButton)}</a>
        </div>
        <div className="public-phone-stack" aria-hidden="true">
          <div className="public-phone-card">
            <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=700&q=80" alt="" />
            <h3>{String(t.appCardTitle)}</h3>
            <p>{String(t.appCardMeta)}</p>
            <button>{String(t.appCardButton)}</button>
          </div>
          <div className="public-map-card">
            <span>{language === "en" ? "London" : "Лондон"}</span>
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
          {featureCards.map((feature, index) => (
            <article className="public-review-card public-saas-feature" key={feature}>
              <div className="public-stars">{String(index + 1).padStart(2, "0")}</div>
              <h3>{feature}</h3>
              <p>{index === featureCards.length - 1 ? String(t.searchText) : String(t.businessText)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-search-section" id="profile-search">
        <div className="public-section-head">
          <div>
            <h2>{String(t.searchTitle)}</h2>
            <p>{String(t.searchText)}</p>
          </div>
        </div>
        <PublicSearch index={searchIndex} language={language} />
      </section>

      <section className="public-stats-section">
        <h2>{String(t.statsTitle)}</h2>
        <p>{String(t.statsText)}</p>
        <p className="public-saas-statement">{String(t.saasStatement)}</p>
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
          <a href={getLocalizedPath(language, "/for-business")}>{String(t.more)}</a>
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
              <h3>{city.city[language]}</h3>
              {city.links[language].map((link) => (
                <a
                  href={`${getLocalizedPath(language, "/city-preview")}?city=${encodeURIComponent(city.city[language])}&category=${encodeURIComponent(link)}`}
                  rel="nofollow"
                  key={link}
                >
                  {link} {String(t.cityIn)} {city.city[language]}
                </a>
              ))}
            </div>
          ))}
        </div>
      </section>

      <footer className="public-footer">
        <div>
          <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
          <span className="public-footer-mobile-note">{String(t.footerSoftware)}</span>
        </div>
        <div>
          <h3>{String(t.about)}</h3>
          <a href="#reviews">{String(t.features)}</a>
          <a href="#app">{String(t.app)}</a>
          <a href={getLocalizedPath(language, "/catalog")}>{String(t.catalog)}</a>
        </div>
        <div>
          <h3>{String(t.business)}</h3>
          <a href={getLocalizedPath(language, "/for-business")}>{String(t.create)}</a>
          <a href="/pro/login">{String(t.login)}</a>
          <a href={getLocalizedPath(language, "/for-business")}>{String(t.features)}</a>
        </div>
        <div>
          <h3>{String(t.prosFooter)}</h3>
          <a href={getLocalizedPath(language, `/${getNicheSlug(language, "manicure")}`)}>{language === "uk" ? "Майстри манікюру" : language === "ru" ? "Мастера маникюра" : "Nail artists"}</a>
          <a href={getLocalizedPath(language, `/${getNicheSlug(language, "hairdressers")}`)}>{language === "uk" ? "Перукарі" : language === "ru" ? "Парикмахеры" : "Hairdressers"}</a>
          <a href={getLocalizedPath(language, `/${getNicheSlug(language, "barbers")}`)}>{language === "uk" ? "Барбери" : language === "ru" ? "Барберы" : "Barbers"}</a>
          <a href={getLocalizedPath(language, `/${getNicheSlug(language, "cosmetologists")}`)}>{language === "uk" ? "Косметологи" : language === "ru" ? "Косметологи" : "Cosmetologists"}</a>
          <a href={getLocalizedPath(language, `/${getNicheSlug(language, "massage")}`)}>{language === "uk" ? "Масажисти" : language === "ru" ? "Массажисты" : "Massage therapists"}</a>
        </div>
        <div>
          <h3>{String(t.legal)}</h3>
          <a href={getLocalizedPath(language, "/pricing")}>{language === "uk" ? "Тарифи" : language === "en" ? "Pricing" : "Тарифы"}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{String(t.privacy)}</a>
          <a href={getLocalizedPath(language, "/terms")}>{String(t.terms)}</a>
          <a href={getLocalizedPath(language, "/refund-policy")}>{language === "uk" ? "Політика повернень" : language === "en" ? "Refund policy" : "Политика возвратов"}</a>
          <a href={getLocalizedPath(language, "/contact")}>{language === "uk" ? "Контакти" : language === "en" ? "Contact" : "Контакты"}</a>
          <a href="mailto:adm@timviz.com">adm@timviz.com</a>
          <span className="public-footer-mobile-note">{String(t.footerSoftware)}</span>
        </div>
      </footer>
    </main>
  );
}
