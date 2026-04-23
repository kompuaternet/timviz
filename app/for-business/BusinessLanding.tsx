"use client";

import { useEffect, useState } from "react";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";

type LandingLanguage = SiteLanguage;

const copy = {
  ru: {
    logo: "timviz",
    login: "Войти",
    create: "Создать профиль компании",
    menu: "Меню",
    clients: "Для клиентов",
    catalog: "Посмотреть бизнесы",
    business: "Для бизнеса",
    businessLogin: "Войти в кабинет",
    heroBadge: "Платформа для салонов, мастеров и студий",
    heroTitle: "Запись клиентов.\nКалендарь.\nВсё в одном месте.",
    heroText:
      "Timviz помогает мастерам, салонам, барбершопам, nail-студиям, массажным кабинетам и wellness-бизнесам принимать записи онлайн, управлять графиком и видеть всю историю клиента.",
    primaryCta: "Зарегистрировать бизнес",
    secondaryCta: "Посмотреть возможности",
    proof: "Быстрый старт: услуги, график и календарь в одном кабинете",
    screenshotAlt: "Календарь и график работы Timviz для бизнеса",
    stats: [
      ["24/7", "клиенты записываются без звонков"],
      ["Старт", "регистрация и настройка без сложных шагов"],
      ["3 языка", "русский, украинский и английский интерфейс"]
    ],
    featuresTitle: "Что получает бизнес",
    featuresText:
      "Система строится вокруг реального процесса: график работы задает доступные слоты, услуги подтягивают длительность и цену, а календарь показывает загрузку на день, неделю и месяц.",
    features: [
      {
        title: "Умный календарь записей",
        text: "Видите день, неделю и месяц, переносите визиты, добавляете записи поверх существующих с предупреждением и быстро блокируете нерабочее время."
      },
      {
        title: "График работы и смены",
        text: "Настраивайте рабочие дни, перерывы и свободный график на год вперед. Именно этот график определяет, когда клиент может записаться."
      },
      {
        title: "Услуги, цены и цвета",
        text: "После регистрации подтягиваются шаблоны услуг по категории. Можно добавлять свои услуги, менять цену, длительность, цвет и порядок."
      },
      {
        title: "Клиенты и история визитов",
        text: "База клиентов, быстрый поиск по телефону и имени, сохранение нового клиента из записи и история посещений в одном месте."
      },
      {
        title: "Доход и статистика",
        text: "Показываем сумму записей за день, неделю и месяц, количество визитов и будущую аналитику по услугам, мастерам и периодам."
      },
      {
        title: "Поддержка в Telegram",
        text: "Клиент пишет в поддержку на сайте, а владелец сервиса получает сообщение в Telegram и может отвечать без лишних панелей."
      }
    ],
    workflowTitle: "Как бизнес начинает работать",
    workflow: [
      "Создайте аккаунт владельца или присоединитесь к существующему салону.",
      "Укажите название бизнеса, категорию, формат работы, адрес и язык интерфейса.",
      "Выберите услуги из каталога или добавьте свои с ценой и длительностью.",
      "Настройте график работы, и Timviz начнет показывать свободные слоты для записи."
    ],
    screensTitle: "Интерфейс, который помогает каждый день",
    screensText:
      "Календарь не просто красивый экран. Это рабочее место: здесь видно свободное время, наложения записей, выручку и состояние визитов.",
    screenLabels: ["День", "Неделя", "Месяц", "График работы"],
    seoTitle: "Кому подходит Timviz",
    seoText:
      "Платформа подходит для салонов красоты, парикмахерских, барбершопов, мастеров маникюра, бровистов, массажистов, косметологов, студий депиляции, фитнес-специалистов и любых услуг по записи. Клиенты находят бизнес в каталоге, выбирают услугу, адрес и удобное время, а владелец видит запись в календаре.",
    finalTitle: "Начните принимать записи уже сегодня",
    finalText:
      "Создайте бизнес-профиль, настройте услуги и график. Дальше мы подключим монетизацию, Telegram-бота и приложение, но уже сейчас можно отрабатывать основной процесс записи.",
    footer: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами"
  },
  uk: {
    logo: "timviz",
    login: "Увійти",
    create: "Створити профіль компанії",
    menu: "Меню",
    clients: "Для клієнтів",
    catalog: "Переглянути бізнеси",
    business: "Для бізнесу",
    businessLogin: "Увійти в кабінет",
    heroBadge: "Платформа для салонів, майстрів і студій",
    heroTitle: "Запис клієнтів.\nКалендар.\nУсе в одному місці.",
    heroText:
      "Timviz допомагає майстрам, салонам, барбершопам, nail-студіям, масажним кабінетам і wellness-бізнесам приймати записи онлайн, керувати графіком і бачити всю історію клієнта.",
    primaryCta: "Зареєструвати бізнес",
    secondaryCta: "Подивитися можливості",
    proof: "Швидкий старт: послуги, графік і календар в одному кабінеті",
    screenshotAlt: "Календар і графік роботи Timviz для бізнесу",
    stats: [
      ["24/7", "клієнти записуються без дзвінків"],
      ["Старт", "реєстрація і налаштування без складних кроків"],
      ["3 мови", "український, російський та англійський інтерфейс"]
    ],
    featuresTitle: "Що отримує бізнес",
    featuresText:
      "Система побудована навколо реального процесу: графік роботи задає доступні слоти, послуги підтягують тривалість і ціну, а календар показує завантаження на день, тиждень і місяць.",
    features: [
      {
        title: "Розумний календар записів",
        text: "Бачите день, тиждень і місяць, переносите візити, додаєте записи з накладанням із попередженням і швидко блокуєте неробочий час."
      },
      {
        title: "Графік роботи і зміни",
        text: "Налаштовуйте робочі дні, перерви і вільний графік на рік вперед. Саме цей графік визначає, коли клієнт може записатися."
      },
      {
        title: "Послуги, ціни і кольори",
        text: "Після реєстрації підтягуються шаблони послуг за категорією. Можна додавати свої послуги, змінювати ціну, тривалість, колір і порядок."
      },
      {
        title: "Клієнти та історія візитів",
        text: "База клієнтів, швидкий пошук за телефоном і ім'ям, збереження нового клієнта із запису та історія відвідувань в одному місці."
      },
      {
        title: "Дохід і статистика",
        text: "Показуємо суму записів за день, тиждень і місяць, кількість візитів і майбутню аналітику за послугами, майстрами та періодами."
      },
      {
        title: "Підтримка в Telegram",
        text: "Клієнт пише в підтримку на сайті, а власник сервісу отримує повідомлення в Telegram і може відповідати без зайвих панелей."
      }
    ],
    workflowTitle: "Як бізнес починає працювати",
    workflow: [
      "Створіть акаунт власника або приєднайтесь до існуючого салону.",
      "Вкажіть назву бізнесу, категорію, формат роботи, адресу та мову інтерфейсу.",
      "Оберіть послуги з каталогу або додайте свої з ціною і тривалістю.",
      "Налаштуйте графік роботи, і Timviz почне показувати вільні слоти для запису."
    ],
    screensTitle: "Інтерфейс, який допомагає щодня",
    screensText:
      "Календар не просто красивий екран. Це робоче місце: тут видно вільний час, накладання записів, виручку і стан візитів.",
    screenLabels: ["День", "Тиждень", "Місяць", "Графік роботи"],
    seoTitle: "Кому підходить Timviz",
    seoText:
      "Платформа підходить для салонів краси, перукарень, барбершопів, майстрів манікюру, бровістів, масажистів, косметологів, студій депіляції, фітнес-спеціалістів і будь-яких послуг за записом. Клієнти знаходять бізнес у каталозі, обирають послугу, адресу і зручний час, а власник бачить запис у календарі.",
    finalTitle: "Почніть приймати записи вже сьогодні",
    finalText:
      "Створіть бізнес-профіль, налаштуйте послуги і графік. Далі ми підключимо монетизацію, Telegram-бота і застосунок, але вже зараз можна відпрацювати основний процес запису.",
    footer: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами"
  },
  en: {
    logo: "timviz",
    login: "Log in",
    create: "Create company profile",
    menu: "Menu",
    clients: "For clients",
    catalog: "Browse businesses",
    business: "For business",
    businessLogin: "Open dashboard",
    heroBadge: "Platform for salons, professionals and studios",
    heroTitle: "Client booking.\nCalendar.\nEverything in one place.",
    heroText:
      "Timviz helps independent professionals, salons, barbershops, nail studios, massage rooms and wellness businesses accept online bookings, manage schedules and keep client history in one place.",
    primaryCta: "Register your business",
    secondaryCta: "Explore features",
    proof: "Fast start: services, schedule and calendar in one workspace",
    screenshotAlt: "Timviz business calendar and working schedule",
    stats: [
      ["24/7", "clients book without phone calls"],
      ["Setup", "registration and launch without complex steps"],
      ["3 languages", "English, Ukrainian and Russian interface"]
    ],
    featuresTitle: "What your business gets",
    featuresText:
      "The system follows the real booking flow: working hours create available slots, services bring duration and price, and the calendar shows load for day, week and month.",
    features: [
      {
        title: "Smart booking calendar",
        text: "View day, week and month, move visits, add overlapping bookings with a warning and quickly block unavailable time."
      },
      {
        title: "Working schedule and shifts",
        text: "Set working days, breaks and flexible schedules up to a year ahead. This schedule defines when clients can book."
      },
      {
        title: "Services, prices and colors",
        text: "Category templates are added after registration. You can add custom services and edit price, duration, color and order."
      },
      {
        title: "Clients and visit history",
        text: "Client database, fast search by phone or name, quick client creation from a booking and complete visit history in one place."
      },
      {
        title: "Revenue and statistics",
        text: "Track bookings for today, week and month, visit count and future analytics by services, team members and periods."
      },
      {
        title: "Telegram support",
        text: "A user writes to support on the website, while the service owner receives the message in Telegram and can reply quickly."
      }
    ],
    workflowTitle: "How your business starts",
    workflow: [
      "Create an owner account or join an existing salon.",
      "Add business name, category, service format, address and interface language.",
      "Choose services from the catalog or add custom services with price and duration.",
      "Set your working schedule and Timviz will show available booking slots."
    ],
    screensTitle: "A workspace for everyday operations",
    screensText:
      "The calendar is not just a pretty screen. It is your operating desk: free time, overlaps, revenue and visit status are visible where work happens.",
    screenLabels: ["Day", "Week", "Month", "Working schedule"],
    seoTitle: "Who Timviz is for",
    seoText:
      "Timviz works for beauty salons, hair salons, barbershops, nail artists, brow artists, massage therapists, cosmetologists, waxing studios, fitness professionals and any appointment-based service. Clients find a business in the catalog, choose a service, address and time, while the owner sees the booking in the calendar.",
    finalTitle: "Start accepting bookings today",
    finalText:
      "Create a business profile, set services and working hours. Monetization, Telegram bot and the app will come next, while the core booking process already works now.",
    footer: "Timviz for business · online booking and service management"
  }
} satisfies Record<LandingLanguage, {
  logo: string;
  login: string;
  create: string;
  menu: string;
  clients: string;
  catalog: string;
  business: string;
  businessLogin: string;
  heroBadge: string;
  heroTitle: string;
  heroText: string;
  primaryCta: string;
  secondaryCta: string;
  proof: string;
  screenshotAlt: string;
  stats: string[][];
  featuresTitle: string;
  featuresText: string;
  features: Array<{ title: string; text: string }>;
  workflowTitle: string;
  workflow: string[];
  screensTitle: string;
  screensText: string;
  screenLabels: string[];
  seoTitle: string;
  seoText: string;
  finalTitle: string;
  finalText: string;
  footer: string;
}>;

const screenAssets: Record<LandingLanguage, string[]> = {
  ru: ["/for-business/ru-day.png", "/for-business/ru-week.png", "/for-business/ru-month.png", "/for-business/ru-schedule-wide.png"],
  uk: ["/for-business/uk-day.png", "/for-business/uk-week.png", "/for-business/uk-month.png", "/for-business/ru-schedule-wide.png"],
  en: ["/for-business/en-day.png", "/for-business/en-week.png", "/for-business/en-month.png", "/for-business/en-schedule.png"]
};

function getInitialLanguage(): LandingLanguage {
  if (typeof window === "undefined") return "ru";
  const saved = window.localStorage.getItem("rezervo-pro-language");
  if (saved === "uk" || saved === "en" || saved === "ru") return saved;

  const browserLanguage = window.navigator.language.toLowerCase();
  const browserLanguages = window.navigator.languages?.map((item) => item.toLowerCase()) ?? [];
  const candidates = [browserLanguage, ...browserLanguages];
  if (candidates.some((item) => item.startsWith("uk") || item.startsWith("ua"))) return "uk";
  if (candidates.some((item) => item.startsWith("en"))) return "en";
  return "ru";
}

type BusinessLandingProps = {
  initialLanguage?: LandingLanguage;
};

export default function BusinessLanding({ initialLanguage = "ru" }: BusinessLandingProps) {
  const [language, setLanguage] = useState<LandingLanguage>(initialLanguage);
  const t = copy[language];
  const assets = screenAssets[language];

  useEffect(() => {
    setLanguage(initialLanguage || getInitialLanguage());
    window.localStorage.setItem("rezervo-pro-language", initialLanguage);
    const onLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<LandingLanguage>).detail;
      if (next === "ru" || next === "uk" || next === "en") setLanguage(next);
    };
    window.addEventListener("rezervo-language-change", onLanguageChange);
    return () => window.removeEventListener("rezervo-language-change", onLanguageChange);
  }, [initialLanguage]);

  return (
    <main className="business-landing">
      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.menu}>
          <a href="/pro/login" className="public-login">{t.login}</a>
          <a href="/pro/create-account" className="public-company-button">{t.create}</a>
          <details className="public-menu">
            <summary>
              <span>{t.menu}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <strong>{t.clients}</strong>
              <a href={getLocalizedPath(language, "/catalog")}>{t.catalog}</a>
              <hr />
              <strong>{t.business}</strong>
              <a href="/pro/create-account">{t.create}</a>
              <a href="/pro/login">{t.businessLogin}</a>
            </div>
          </details>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="business-hero">
        <div className="business-hero-copy">
          <span>{t.heroBadge}</span>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <div className="business-hero-actions">
            <a className="business-primary" href="/pro/create-account">{t.primaryCta}</a>
            <a className="business-secondary" href="#features">{t.secondaryCta}</a>
          </div>
          <small>{t.proof}</small>
        </div>
        <div className="business-hero-visual">
          <img src={assets[0]} alt={t.screenshotAlt} />
        </div>
      </section>

      <section className="business-stats" aria-label="Timviz stats">
        {t.stats.map((stat) => (
          <div key={stat[0]}>
            <strong>{stat[0]}</strong>
            <span>{stat[1]}</span>
          </div>
        ))}
      </section>

      <section className="business-feature-section" id="features">
        <div className="business-section-head">
          <span>{t.business}</span>
          <h2>{t.featuresTitle}</h2>
          <p>{t.featuresText}</p>
        </div>
        <div className="business-feature-grid">
          {t.features.map((feature, index) => (
            <article key={feature.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="business-screens-section">
        <div className="business-section-head">
          <span>Timviz OS</span>
          <h2>{t.screensTitle}</h2>
          <p>{t.screensText}</p>
        </div>
        <div className="business-screen-grid">
          {assets.map((asset, index) => (
            <article key={asset}>
              <div>
                <span>{t.screenLabels[index]}</span>
              </div>
              <img src={asset} alt={`${t.screenshotAlt}: ${t.screenLabels[index]}`} />
            </article>
          ))}
        </div>
      </section>

      <section className="business-workflow-section">
        <div>
          <span>{t.primaryCta}</span>
          <h2>{t.workflowTitle}</h2>
        </div>
        <ol>
          {t.workflow.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="business-seo-section">
        <h2>{t.seoTitle}</h2>
        <p>{t.seoText}</p>
      </section>

      <section className="business-final-section">
        <h2>{t.finalTitle}</h2>
        <p>{t.finalText}</p>
        <a className="business-primary" href="/pro/create-account">{t.primaryCta}</a>
      </section>

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footer}</span>
      </footer>
    </main>
  );
}
