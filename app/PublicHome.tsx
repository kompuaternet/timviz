"use client";

import { useEffect, useState } from "react";
import type { PublicSearchIndex } from "../lib/public-search";
import { getNicheSlug } from "../lib/niche-pages";
import { getLocalizedPath, isSiteLanguage, type SiteLanguage } from "../lib/site-language";
import BrandLogo from "./BrandLogo";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import NicheLinksSection from "./NicheLinksSection";
import PublicSearch from "./PublicSearch";
type PublicLanguage = SiteLanguage;

type PublicHomeProps = {
  searchIndex: PublicSearchIndex;
  initialLanguage?: PublicLanguage;
};

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

const businesses = [
  {
    name: "SORRY FOR MY HAIR",
    location: { ru: "Подольский район, Киев", uk: "Подільський район, Київ", en: "Podil district, Kyiv" },
    category: { ru: "Парикмахерская", uk: "Перукарня", en: "Hair salon" },
    rating: "5,0",
    reviews: "132",
    image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Soulmates Massage",
    location: { ru: "Печерск, Киев", uk: "Печерськ, Київ", en: "Pechersk, Kyiv" },
    category: { ru: "Массажный салон", uk: "Масажний салон", en: "Massage studio" },
    rating: "4,9",
    reviews: "86",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "Beauty.Que",
    location: { ru: "Центр, Львов", uk: "Центр, Львів", en: "City center, Lviv" },
    category: { ru: "Ногти и ресницы", uk: "Нігті та вії", en: "Nails and lashes" },
    rating: "5,0",
    reviews: "241",
    image: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=80"
  },
  {
    name: "La Duette",
    location: { ru: "Оболонь, Киев", uk: "Оболонь, Київ", en: "Obolon, Kyiv" },
    category: { ru: "Салон красоты", uk: "Салон краси", en: "Beauty salon" },
    rating: "5,0",
    reviews: "48",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80"
  }
];

const copy = {
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
    statsBig: "Более 1 млрд",
    statsLabel: "записей забронировано на Timviz",
    partners: "компаний-партнеров",
    countries: "стран используют Timviz",
    pros: "мастеров и профессионалов",
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
    statsBig: "Понад 1 млрд",
    statsLabel: "записів заброньовано на Timviz",
    partners: "компаній-партнерів",
    countries: "країн використовують Timviz",
    pros: "майстрів і професіоналів",
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
    statsBig: "Over 1B",
    statsLabel: "bookings made on Timviz",
    partners: "partner businesses",
    countries: "countries use Timviz",
    pros: "professionals and experts",
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
} satisfies Record<PublicLanguage, Record<string, string | string[][]>>;

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

export default function PublicHome({ searchIndex, initialLanguage = "ru" }: PublicHomeProps) {
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

  const reviews = t.reviewsList as string[][];

  return (
    <main className="public-home">
      <header className="public-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="public-nav" aria-label={String(t.navAria)}>
          <details className="public-menu public-entry-menu">
            <summary className="public-login-entry">{String(t.login)}</summary>
            <div className="public-menu-panel public-entry-panel">
              <a href={getLocalizedPath(language, "/account")}>{String(t.clientLogin)}</a>
              <a href="/pro/login">{String(t.businessLogin)}</a>
            </div>
          </details>
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

        <PublicSearch index={searchIndex} language={language} />

        <div className="public-hero-count">
          <strong>597 087</strong> {String(t.bookedToday)}
        </div>
      </section>

      <section className="public-section public-carousel-section">
        <div className="public-section-head">
          <h2>{String(t.recommended)}</h2>
          <a href={getLocalizedPath(language, "/catalog")}>{String(t.seeAll)}</a>
        </div>
        <div className="public-business-grid">
          {businesses.map((business) => (
            <a className="public-business-card" href={getLocalizedPath(language, "/catalog")} key={business.name}>
              <img src={business.image} alt={business.name} />
              <div>
                <h3>{business.name}</h3>
                <span className="public-rating">★ {business.rating} <small>({business.reviews})</small></span>
              </div>
              <p>{business.location[language]}</p>
              <small>{business.category[language]}</small>
            </a>
          ))}
        </div>
      </section>

      <section className="public-app-section" id="app">
        <div>
          <span className="public-kicker">{String(t.appKicker)}</span>
          <h2>{String(t.appTitle)}</h2>
          <p>{String(t.appText)}</p>
          <button type="button" className="public-download-button">{String(t.appButton)} ⌘</button>
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
        <strong>{String(t.statsBig)}</strong>
        <span>{String(t.statsLabel)}</span>
        <div className="public-stats-row">
          <div><b>130 000+</b><span>{String(t.partners)}</span></div>
          <div><b>120+</b><span>{String(t.countries)}</span></div>
          <div><b>450 000+</b><span>{String(t.pros)}</span></div>
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
                <a href={getLocalizedPath(language, "/catalog")} key={link}>{link} {String(t.cityIn)} {city.city[language]}</a>
              ))}
            </div>
          ))}
        </div>
      </section>

      <footer className="public-footer">
        <div>
          <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
          <button type="button" className="public-download-button">{String(t.appButton)}</button>
        </div>
        <div>
          <h3>{String(t.about)}</h3>
          <a href="#reviews">{String(t.reviews)}</a>
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
          <a href={getLocalizedPath(language, "/privacy")}>{String(t.privacy)}</a>
          <a href={getLocalizedPath(language, "/terms")}>{String(t.terms)}</a>
        </div>
      </footer>
    </main>
  );
}
