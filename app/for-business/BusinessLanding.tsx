"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import NicheLinksSection from "../NicheLinksSection";

type LandingLanguage = SiteLanguage;

type LocalCopy = {
  logo: string;
  login: string;
  clientLogin: string;
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
  whyTitle: string;
  whyCards: Array<{ title: string; text: string }>;
  uiTitle: string;
  uiText: string;
  screenLabels: string[];
  stepsTitle: string;
  steps: Array<{ title: string; text: string }>;
  nichesTitle: string;
  niches: Array<{ title: string; text: string }>;
  compareTitle: string;
  compareWithout: string[];
  compareWith: string[];
  telegramTitle: string;
  telegramText: string;
  telegramCta: string;
  faqTitle: string;
  faqItems: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalText: string;
  finalHint: string;
  linksTitle: string;
  footer: string;
  privacy: string;
  terms: string;
  nichesSubtitle: string;
  mastersColumn: string;
};

const copy: Record<LandingLanguage, LocalCopy> = {
  uk: {
    logo: "timviz",
    login: "Увійти",
    clientLogin: "Вхід для клієнта",
    create: "Створити профіль компанії",
    menu: "Меню",
    clients: "Для клієнтів",
    catalog: "Переглянути бізнеси",
    business: "Для бізнесу",
    businessLogin: "Увійти в кабінет",
    heroBadge: "Платформа для майстрів і салонів",
    heroTitle: "Онлайн-запис клієнтів для майстрів і салонів",
    heroText:
      "Приймайте записи онлайн, ведіть календар, керуйте послугами та отримуйте сповіщення в Telegram.",
    primaryCta: "Почати безкоштовно",
    secondaryCta: "Подивитися можливості",
    proof: "Без складних налаштувань • запуск за кілька хвилин",
    screenshotAlt: "Інтерфейс Timviz для бізнесу",
    whyTitle: "Чому майстри переходять на Timviz",
    whyCards: [
      { title: "Менше дзвінків", text: "Клієнти самі обирають послугу, день і час." },
      { title: "Менше плутанини", text: "Усі записи видно в одному календарі." },
      {
        title: "Більше контролю",
        text: "Послуги, ціни, графік і клієнти зібрані в одному кабінеті."
      },
      { title: "Швидкі сповіщення", text: "Отримуйте важливі події в Telegram." }
    ],
    uiTitle: "Покажіть клієнтам тільки доступний час",
    uiText: "Покажіть клієнтам тільки доступний час, а самі керуйте записами з календаря.",
    screenLabels: [
      "Денний календар записів",
      "Тижневий розклад",
      "Місячний огляд",
      "Графік роботи"
    ],
    stepsTitle: "Як це працює",
    steps: [
      {
        title: "Створіть профіль",
        text: "Додайте назву бізнесу, категорію та формат роботи."
      },
      {
        title: "Налаштуйте послуги і графік",
        text: "Вкажіть ціни, тривалість і робочі дні."
      },
      {
        title: "Приймайте записи",
        text: "Клієнти записуються онлайн, а ви бачите все в календарі."
      }
    ],
    nichesTitle: "Для кого Timviz",
    niches: [
      { title: "Майстри манікюру", text: "Зручно керувати вікнами, перервами й повторними записами." },
      { title: "Перукарі", text: "Швидко комбінуйте послуги та тривалість для кожного клієнта." },
      { title: "Барбери", text: "Тримайте щільний графік під контролем без зайвих дзвінків." },
      { title: "Косметологи", text: "Легко планувати довгі процедури й бачити завантаження дня." },
      { title: "Масажисти", text: "Просто керувати сесіями різної тривалості та вільними слотами." },
      { title: "Салони краси", text: "Ведіть команду майстрів і всі записи в єдиному календарі." },
      { title: "Брови та вії", text: "Фіксуйте послуги, ціни та статуси візитів без хаосу в месенджерах." },
      { title: "Студії депіляції", text: "Швидкий запис клієнтів онлайн і чіткий розклад на кожен день." }
    ],
    compareTitle: "Без Timviz і з Timviz",
    compareWithout: [
      "записи в месенджерах",
      "клієнти губляться",
      "важко бачити вільний час",
      "ціни і послуги в різних місцях"
    ],
    compareWith: [
      "онлайн-запис 24/7",
      "календар записів",
      "послуги з ціною і тривалістю",
      "Telegram-сповіщення"
    ],
    telegramTitle: "Записи і сповіщення в Telegram",
    telegramText:
      "Підключіть Telegram, щоб отримувати нові записи, підтвердження, нагадування та звернення клієнтів без зайвих панелей.",
    telegramCta: "Підключити після реєстрації",
    faqTitle: "Поширені запитання",
    faqItems: [
      { q: "Що таке Timviz?", a: "Timviz — це сервіс, який обʼєднує онлайн-запис клієнтів, календар записів і керування послугами в одному кабінеті." },
      { q: "Чи підходить Timviz для одного майстра?", a: "Так, сервіс зручний як для одного майстра, так і для команди або салону." },
      { q: "Чи можна використовувати Timviz для салону?", a: "Так, ви можете вести кількох майстрів, графіки та записи в одному акаунті." },
      { q: "Як клієнти записуються онлайн?", a: "Ви даєте клієнтам публічне посилання, вони обирають послугу, день і час, а запис одразу потрапляє в календар." },
      { q: "Чи можна налаштувати послуги, ціни і тривалість?", a: "Так, у будь-який момент: відредагуйте назву послуги, вартість, тривалість і порядок відображення." },
      { q: "Чи є Telegram-сповіщення?", a: "Так, Timviz надсилає сповіщення про нові записи, зміни та інші важливі події в Telegram." },
      { q: "Чи можна почати безкоштовно?", a: "Так, ви можете створити профіль і швидко запустити онлайн-запис без складного старту." },
      { q: "Чи потрібен окремий сайт?", a: "Ні, достатньо профілю в Timviz і публічного посилання для запису клієнтів." }
    ],
    finalTitle: "Почніть приймати записи вже сьогодні",
    finalText:
      "Створіть профіль, додайте послуги і налаштуйте графік. Timviz допоможе швидко перейти від хаосу в месенджерах до зручного календаря записів.",
    finalHint: "Це займе кілька хвилин",
    linksTitle: "Корисні посилання",
    footer: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами",
    privacy: "Політика конфіденційності",
    terms: "Умови використання"
    ,
    nichesSubtitle: "Timviz підходить майстрам і салонам, які працюють за записом",
    mastersColumn: "Для майстрів"
  },
  ru: {
    logo: "timviz",
    login: "Войти",
    clientLogin: "Вход для клиента",
    create: "Создать профиль компании",
    menu: "Меню",
    clients: "Для клиентов",
    catalog: "Посмотреть бизнесы",
    business: "Для бизнеса",
    businessLogin: "Войти в кабинет",
    heroBadge: "Платформа для мастеров и салонов",
    heroTitle: "Онлайн-запись клиентов для мастеров и салонов",
    heroText:
      "Принимайте записи онлайн, ведите календарь, управляйте услугами и получайте уведомления в Telegram.",
    primaryCta: "Начать бесплатно",
    secondaryCta: "Посмотреть возможности",
    proof: "Без сложных настроек • запуск за несколько минут",
    screenshotAlt: "Интерфейс Timviz для бизнеса",
    whyTitle: "Почему мастера переходят на Timviz",
    whyCards: [
      { title: "Меньше звонков", text: "Клиенты сами выбирают услугу, день и время." },
      { title: "Меньше путаницы", text: "Все записи видны в одном календаре." },
      { title: "Больше контроля", text: "Услуги, цены, график и клиенты собраны в одном кабинете." },
      { title: "Быстрые уведомления", text: "Получайте важные события в Telegram." }
    ],
    uiTitle: "Покажите клиентам только доступное время",
    uiText: "Покажите клиентам только доступное время, а сами управляйте записями из календаря.",
    screenLabels: ["Дневной календарь записей", "Недельное расписание", "Месячный обзор", "График работы"],
    stepsTitle: "Как это работает",
    steps: [
      { title: "Создайте профиль", text: "Добавьте название бизнеса, категорию и формат работы." },
      { title: "Настройте услуги и график", text: "Укажите цены, длительность и рабочие дни." },
      { title: "Принимайте записи", text: "Клиенты записываются онлайн, а вы видите всё в календаре." }
    ],
    nichesTitle: "Для кого Timviz",
    niches: [
      { title: "Мастера маникюра", text: "Удобно управлять окнами, перерывами и повторными записями." },
      { title: "Парикмахеры", text: "Быстро комбинируйте услуги и длительность под каждого клиента." },
      { title: "Барберы", text: "Держите плотный график под контролем без лишних звонков." },
      { title: "Косметологи", text: "Легко планировать длинные процедуры и загрузку дня." },
      { title: "Массажисты", text: "Просто управлять сессиями разной длительности и свободными слотами." },
      { title: "Салоны красоты", text: "Ведите команду мастеров и все записи в едином календаре." },
      { title: "Брови и ресницы", text: "Фиксируйте услуги, цены и статусы визитов без хаоса в мессенджерах." },
      { title: "Студии депиляции", text: "Быстрая онлайн-запись клиентов и четкое расписание на каждый день." }
    ],
    compareTitle: "Без Timviz и с Timviz",
    compareWithout: [
      "записи в мессенджерах",
      "клиенты теряются",
      "сложно видеть свободное время",
      "цены и услуги в разных местах"
    ],
    compareWith: ["онлайн-запись 24/7", "календарь записей", "услуги с ценой и длительностью", "Telegram-уведомления"],
    telegramTitle: "Записи и уведомления в Telegram",
    telegramText:
      "Подключите Telegram, чтобы получать новые записи, подтверждения, напоминания и обращения клиентов без лишних панелей.",
    telegramCta: "Подключить после регистрации",
    faqTitle: "Частые вопросы",
    faqItems: [
      { q: "Что такое Timviz?", a: "Timviz — это сервис, который объединяет онлайн-запись клиентов, календарь записей и управление услугами в одном кабинете." },
      { q: "Подходит ли Timviz для одного мастера?", a: "Да, сервис удобен как для одного мастера, так и для команды или салона." },
      { q: "Можно ли использовать Timviz для салона?", a: "Да, вы можете вести нескольких мастеров, графики и записи в одном аккаунте." },
      { q: "Как клиенты записываются онлайн?", a: "Вы даёте клиентам публичную ссылку, они выбирают услугу, день и время, а запись сразу попадает в календарь." },
      { q: "Можно ли настроить услуги, цены и длительность?", a: "Да, в любой момент: меняйте название услуги, стоимость, длительность и порядок отображения." },
      { q: "Есть ли Telegram-уведомления?", a: "Да, Timviz отправляет уведомления о новых записях, изменениях и других важных событиях в Telegram." },
      { q: "Можно ли начать бесплатно?", a: "Да, вы можете создать профиль и быстро запустить онлайн-запись без сложного старта." },
      { q: "Нужен ли отдельный сайт?", a: "Нет, достаточно профиля в Timviz и публичной ссылки для записи клиентов." }
    ],
    finalTitle: "Начните принимать записи уже сегодня",
    finalText:
      "Создайте профиль, добавьте услуги и настройте график. Timviz поможет быстро перейти от хаоса в мессенджерах к удобному календарю записей.",
    finalHint: "Это займет несколько минут",
    linksTitle: "Полезные ссылки",
    footer: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования"
    ,
    nichesSubtitle: "Timviz подходит мастерам и салонам, которые работают по записи",
    mastersColumn: "Для мастеров"
  },
  en: {
    logo: "timviz",
    login: "Log in",
    clientLogin: "Client sign in",
    create: "Create company profile",
    menu: "Menu",
    clients: "For clients",
    catalog: "Browse businesses",
    business: "For business",
    businessLogin: "Open dashboard",
    heroBadge: "Platform for professionals and salons",
    heroTitle: "Online client booking for professionals and salons",
    heroText:
      "Accept bookings online, manage your calendar, control services and receive Telegram notifications.",
    primaryCta: "Start for free",
    secondaryCta: "See features",
    proof: "No complex setup • launch in minutes",
    screenshotAlt: "Timviz business interface",
    whyTitle: "Why professionals switch to Timviz",
    whyCards: [
      { title: "Fewer calls", text: "Clients choose service, day and time on their own." },
      { title: "Less confusion", text: "All bookings are visible in one calendar." },
      { title: "More control", text: "Services, prices, schedule and clients in one dashboard." },
      { title: "Fast alerts", text: "Get important events in Telegram." }
    ],
    uiTitle: "Show only available time to clients",
    uiText: "Show clients only available slots while you manage everything from one calendar.",
    screenLabels: ["Daily booking calendar", "Weekly schedule", "Monthly overview", "Working schedule"],
    stepsTitle: "How it works",
    steps: [
      { title: "Create your profile", text: "Add your business name, category and work format." },
      { title: "Set services and schedule", text: "Define prices, duration and working days." },
      { title: "Accept bookings", text: "Clients book online while you see everything in the calendar." }
    ],
    nichesTitle: "Who Timviz is for",
    niches: [
      { title: "Nail artists", text: "Manage slots, breaks and repeat visits with less manual work." },
      { title: "Hairdressers", text: "Quickly combine services and durations per client." },
      { title: "Barbers", text: "Keep busy schedules under control with fewer calls." },
      { title: "Cosmetologists", text: "Plan longer procedures and monitor daily workload." },
      { title: "Massage therapists", text: "Manage sessions with different durations and open slots." },
      { title: "Beauty salons", text: "Run team schedules and bookings in one shared calendar." },
      { title: "Brows & lashes", text: "Track services, prices and statuses without chat chaos." },
      { title: "Depilation studios", text: "Fast online booking and clear day-by-day schedules." }
    ],
    compareTitle: "Without Timviz vs With Timviz",
    compareWithout: [
      "bookings in messengers",
      "lost clients",
      "hard to see free time",
      "prices and services in different places"
    ],
    compareWith: ["24/7 online booking", "booking calendar", "services with price and duration", "Telegram notifications"],
    telegramTitle: "Bookings and alerts in Telegram",
    telegramText:
      "Connect Telegram to receive new bookings, confirmations, reminders and client requests without extra admin panels.",
    telegramCta: "Connect after sign up",
    faqTitle: "FAQ",
    faqItems: [
      { q: "What is Timviz?", a: "Timviz combines online client booking, calendar management and services in one dashboard." },
      { q: "Is Timviz suitable for solo professionals?", a: "Yes, it works great for solo specialists and growing teams." },
      { q: "Can I use Timviz for a salon?", a: "Yes, you can manage multiple staff members, schedules and bookings in one account." },
      { q: "How do clients book online?", a: "Share your booking link: clients pick a service, day and time and the visit appears in your calendar." },
      { q: "Can I customize services, prices and duration?", a: "Yes, all service parameters can be changed at any time." },
      { q: "Are Telegram notifications available?", a: "Yes, Timviz sends key booking events directly to Telegram." },
      { q: "Can I start for free?", a: "Yes, create your profile and start quickly." },
      { q: "Do I need a separate website?", a: "No, your Timviz business profile and booking link are enough to start." }
    ],
    finalTitle: "Start accepting bookings today",
    finalText:
      "Create your profile, add services and configure your schedule. Timviz helps you move from messenger chaos to a clear booking calendar.",
    finalHint: "It takes just a few minutes",
    linksTitle: "Useful links",
    footer: "Timviz for business · online client booking and service management",
    privacy: "Privacy policy",
    terms: "Terms of use"
    ,
    nichesSubtitle: "Timviz is built for professionals and salons who work by appointment",
    mastersColumn: "For professionals"
  }
};

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
  if (browserLanguage.startsWith("uk") || browserLanguage.startsWith("ua")) return "uk";
  if (browserLanguage.startsWith("en")) return "en";
  return "ru";
}

type BusinessLandingProps = {
  initialLanguage?: LandingLanguage;
};

export default function BusinessLanding({ initialLanguage = "ru" }: BusinessLandingProps) {
  const [language, setLanguage] = useState<LandingLanguage>(initialLanguage);
  const t = copy[language];
  const assets = screenAssets[language];
  const createProfileLink = "/pro/create-account";

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

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: t.faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a
        }
      }))
    }),
    [t.faqItems]
  );

  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Timviz",
          item: `https://timviz.com${getLocalizedPath(language)}`
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t.business,
          item: `https://timviz.com${getLocalizedPath(language, "/for-business")}`
        }
      ]
    }),
    [language, t.business]
  );

  return (
    <main className="business-landing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.menu}>
          <details className="public-menu public-entry-menu">
            <summary className="public-login-entry">{t.login}</summary>
            <div className="public-menu-panel public-entry-panel">
              <a href={getLocalizedPath(language, "/account")}>{t.clientLogin}</a>
              <a href="/pro/login">{t.businessLogin}</a>
            </div>
          </details>
          <a href={createProfileLink} className="public-company-button">{t.create}</a>
          <details className="public-menu">
            <summary>
              <span>{t.menu}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <strong>{t.clients}</strong>
              <a href={getLocalizedPath(language, "/catalog")}>{t.catalog}</a>
              <a href={getLocalizedPath(language, "/account")}>{t.clientLogin}</a>
              <hr />
              <strong>{t.business}</strong>
              <a href={createProfileLink}>{t.create}</a>
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
            <a className="business-primary" href={createProfileLink}>{t.primaryCta}</a>
            <a className="business-secondary" href="#features">{t.secondaryCta}</a>
          </div>
          <small>{t.proof}</small>
        </div>
        <div className="business-hero-visual">
          <img src={assets[0]} alt={t.screenshotAlt} />
        </div>
      </section>

      <section className="business-feature-section" id="features">
        <div className="business-section-head">
          <h2>{t.whyTitle}</h2>
        </div>
        <div className="business-feature-grid business-feature-grid--compact">
          {t.whyCards.map((feature, index) => (
            <article key={feature.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
        <div className="business-inline-cta">
          <a className="business-primary" href={createProfileLink}>{t.primaryCta}</a>
        </div>
      </section>

      <section className="business-screens-section">
        <div className="business-section-head">
          <h2>{t.uiTitle}</h2>
          <p>{t.uiText}</p>
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
          <h2>{t.stepsTitle}</h2>
        </div>
        <ol>
          {t.steps.map((step) => (
            <li key={step.title}>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.nichesTitle}</h2>
        </div>
        <div className="business-feature-grid business-feature-grid--4">
          {t.niches.map((niche) => (
            <article key={niche.title}>
              <h3>{niche.title}</h3>
              <p>{niche.text}</p>
            </article>
          ))}
        </div>
      </section>
      <NicheLinksSection
        language={language}
        title={t.nichesTitle}
        subtitle={t.nichesSubtitle}
        className="niche-links-section niche-links-section--business"
      />

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.compareTitle}</h2>
        </div>
        <div className="business-compare-grid">
          <article>
            <h3>Без Timviz</h3>
            <ul>
              {t.compareWithout.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article>
            <h3>З Timviz</h3>
            <ul>
              {t.compareWith.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <section className="business-seo-section">
        <h2>{t.telegramTitle}</h2>
        <p>{t.telegramText}</p>
        <a className="business-secondary" href={createProfileLink}>{t.telegramCta}</a>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.faqTitle}</h2>
        </div>
        <div className="business-faq-list">
          {t.faqItems.map((item) => (
            <details key={item.q} className="business-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.linksTitle}</h2>
        </div>
        <div className="business-footer-links">
          <a href={getLocalizedPath(language)}>{getLocalizedPath(language)}</a>
          <a href={getLocalizedPath(language, "/for-business")}>{getLocalizedPath(language, "/for-business")}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{getLocalizedPath(language, "/privacy")}</a>
          <a href={getLocalizedPath(language, "/terms")}>{getLocalizedPath(language, "/terms")}</a>
        </div>
      </section>

      <section className="business-final-section">
        <h2>{t.finalTitle}</h2>
        <p>{t.finalText}</p>
        <a className="business-primary" href={createProfileLink}>{copy[language].create}</a>
        <small>{t.finalHint}</small>
      </section>

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footer}</span>
        <div className="business-footer-links">
          <a href={getLocalizedPath(language, "/dlya-manikyuru")}>{language === "uk" ? "Майстри манікюру" : language === "ru" ? "Мастера маникюра" : "Nail artists"}</a>
          <a href={getLocalizedPath(language, "/dlya-perukariv")}>{language === "uk" ? "Перукарі" : language === "ru" ? "Парикмахеры" : "Hairdressers"}</a>
          <a href={getLocalizedPath(language, "/dlya-barberiv")}>{language === "uk" ? "Барбери" : language === "ru" ? "Барберы" : "Barbers"}</a>
          <a href={getLocalizedPath(language, "/dlya-kosmetologiv")}>{language === "uk" ? "Косметологи" : language === "ru" ? "Косметологи" : "Cosmetologists"}</a>
          <a href={getLocalizedPath(language, "/dlya-masazhu")}>{language === "uk" ? "Масажисти" : language === "ru" ? "Массажисты" : "Massage therapists"}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
        </div>
      </footer>
    </main>
  );
}
