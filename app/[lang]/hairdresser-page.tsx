import type { Metadata } from "next";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import { buildMetadata } from "../../lib/seo";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";

type HairCopy = {
  home: string;
  forBusiness: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaSecondary: string;
  microcopy: string;
  sampleClient: string;
  sampleService: string;
  sampleStatus: string;
  problemsTitle: string;
  problems: string[];
  solutionTitle: string;
  solution: string[];
  servicesTitle: string;
  serviceItems: string[];
  serviceExample: string;
  calendarTitle: string;
  calendarText: string;
  howTitle: string;
  howSteps: string[];
  compareTitle: string;
  without: string[];
  with: string[];
  telegramTitle: string;
  audienceTitle: string;
  audienceText: string;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalButton: string;
  linksTitle: string;
  links: Array<{ label: string; href: string }>;
  footerText: string;
  privacy: string;
  terms: string;
  altCalendar: string;
  altService: string;
};

const copy: Record<SiteLanguage, HairCopy> = {
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для парикмахеров",
    subtitle: "Принимайте записи клиентов онлайн, управляйте расписанием и не теряйте клиентов",
    cta: "Начать бесплатно",
    ctaSecondary: "Посмотреть возможности",
    microcopy: "Без сложных настроек • запуск за несколько минут",
    sampleClient: "Клиент: Ольга М.",
    sampleService: "Стрижка + укладка · 75 мин",
    sampleStatus: "Статус: Подтверждено",
    problemsTitle: "Знакомо парикмахеру?",
    problems: [
      "клиенты пишут в WhatsApp / Telegram / Instagram",
      "сложно записывать вручную",
      "путаются записи",
      "трудно учитывать длительность стрижек",
      "накладки по времени",
      "клиенты забывают о записи"
    ],
    solutionTitle: "Timviz решает это",
    solution: [
      "онлайн-запись клиентов",
      "календарь записей",
      "услуги с ценой и длительностью",
      "рабочие дни",
      "Telegram уведомления"
    ],
    servicesTitle: "Настройте услуги парикмахера",
    serviceItems: ["стрижка", "женская стрижка", "мужская стрижка", "окрашивание", "укладка", "сложные окрашивания", "уход за волосами", "восстановление"],
    serviceExample: "Стрижка — 60 мин — 500 грн",
    calendarTitle: "Календарь записей для парикмахера",
    calendarText: "Видите все записи, длительность процедур и свободное время.",
    howTitle: "Как это работает",
    howSteps: ["Создайте профиль", "Добавьте услуги", "Настройте график", "Получайте записи"],
    compareTitle: "Без Timviz и с Timviz",
    without: ["записи в мессенджерах", "путаница"],
    with: ["календарь", "онлайн запись", "структура"],
    telegramTitle: "Получайте записи в Telegram",
    audienceTitle: "Для кого",
    audienceText: "Подходит для всех, кто работает по записи клиентов",
    faqTitle: "FAQ",
    faq: [
      { q: "Как работает онлайн-запись для парикмахера?", a: "Клиент выбирает услугу и время, а запись клиентов онлайн сразу попадает в календарь записей." },
      { q: "Можно ли настроить длительность стрижек?", a: "Да, каждая услуга парикмахера настраивается с ценой и длительностью." },
      { q: "Подходит ли для одного мастера?", a: "Да, это CRM для парикмахера и для небольших студий." },
      { q: "Можно ли работать без сайта?", a: "Да, достаточно профиля в Timviz и клиентской ссылки на запись." },
      { q: "Есть ли Telegram уведомления?", a: "Да, сервис отправляет Telegram уведомления о новых записях." }
    ],
    finalTitle: "Создать профиль парикмахера",
    finalButton: "Создать профиль парикмахера",
    linksTitle: "Полезные ссылки",
    links: [
      { label: "Для бизнеса", href: "/for-business" },
      { label: "Для мастеров маникюра", href: "/dlya-manikyuru" },
      { label: "Для барберов", href: "/dlya-barberov" },
      { label: "Для косметологов", href: "/dlya-kosmetologov" }
    ],
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    altCalendar: "Календарь записей для парикмахера в Timviz",
    altService: "Услуги парикмахера и цены в Timviz"
  },
  uk: {
    home: "Головна", forBusiness: "Для бізнесу", title: "Онлайн-запис для перукарів", subtitle: "Приймайте записи клієнтів онлайн, керуйте розкладом і не втрачайте клієнтів", cta: "Почати безкоштовно", ctaSecondary: "Подивитися можливості", microcopy: "Без складних налаштувань • запуск за кілька хвилин", sampleClient: "Клієнт: Ольга М.", sampleService: "Стрижка + укладка · 75 хв", sampleStatus: "Статус: Підтверджено", problemsTitle: "Знайомо перукарю?", problems: ["клієнти пишуть у WhatsApp / Telegram / Instagram", "складно записувати вручну", "плутаються записи", "важко враховувати тривалість стрижок", "накладки за часом", "клієнти забувають про запис"], solutionTitle: "Timviz вирішує це", solution: ["онлайн-запис клієнтів", "календар записів", "послуги з ціною і тривалістю", "робочі дні", "Telegram сповіщення"], servicesTitle: "Налаштуйте послуги перукаря", serviceItems: ["стрижка", "жіноча стрижка", "чоловіча стрижка", "фарбування", "укладка", "складні фарбування", "догляд за волоссям", "відновлення"], serviceExample: "Стрижка — 60 хв — 500 грн", calendarTitle: "Календар записів для перукаря", calendarText: "Бачите всі записи, тривалість процедур і вільний час.", howTitle: "Як це працює", howSteps: ["Створіть профіль", "Додайте послуги", "Налаштуйте графік", "Отримуйте записи"], compareTitle: "Без Timviz і з Timviz", without: ["записи в месенджерах", "плутанина"], with: ["календар", "онлайн запис", "структура"], telegramTitle: "Отримуйте записи у Telegram", audienceTitle: "Для кого", audienceText: "Підходить для всіх, хто працює за записом клієнтів", faqTitle: "FAQ", faq: [{ q: "Як працює онлайн-запис для перукаря?", a: "Клієнт обирає послугу і час, а запис одразу потрапляє в календар." }, { q: "Чи можна налаштувати тривалість стрижок?", a: "Так, кожна послуга налаштовується з ціною і тривалістю." }, { q: "Чи підходить для одного майстра?", a: "Так, Timviz підходить для одного перукаря й команди." }, { q: "Чи можна працювати без сайту?", a: "Так, достатньо профілю Timviz і посилання на запис." }, { q: "Чи є Telegram сповіщення?", a: "Так, сервіс надсилає сповіщення про нові записи." }], finalTitle: "Створити профіль перукаря", finalButton: "Створити профіль перукаря", linksTitle: "Корисні посилання", links: [{ label: "Для бізнесу", href: "/for-business" }, { label: "Для майстрів манікюру", href: "/dlya-manikyuru" }, { label: "Для барберів", href: "/dlya-barberov" }, { label: "Для косметологів", href: "/dlya-kosmetologov" }], footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами", privacy: "Політика конфіденційності", terms: "Умови використання", altCalendar: "Календар записів для перукаря в Timviz", altService: "Послуги перукаря і ціни в Timviz"
  },
  en: {
    home: "Home", forBusiness: "For business", title: "Online booking for hairdressers", subtitle: "Accept client bookings online, manage schedule and keep clients from dropping off", cta: "Start for free", ctaSecondary: "See features", microcopy: "No complex setup • launch in minutes", sampleClient: "Client: Olga M.", sampleService: "Haircut + styling · 75 min", sampleStatus: "Status: Confirmed", problemsTitle: "Does this look familiar?", problems: ["clients text in WhatsApp / Telegram / Instagram", "manual booking is hard", "appointments get mixed up", "hard to track haircut duration", "time overlaps", "clients forget bookings"], solutionTitle: "Timviz solves this", solution: ["online client booking", "booking calendar", "services with price and duration", "working days", "Telegram notifications"], servicesTitle: "Set up hairdresser services", serviceItems: ["haircut", "women's haircut", "men's haircut", "coloring", "styling", "complex coloring", "hair care", "restoration"], serviceExample: "Haircut — 60 min — 500 UAH", calendarTitle: "Booking calendar for hairdressers", calendarText: "See all appointments, service duration and available time.", howTitle: "How it works", howSteps: ["Create profile", "Add services", "Set schedule", "Get bookings"], compareTitle: "Without Timviz vs with Timviz", without: ["messenger-based booking", "confusion"], with: ["calendar", "online booking", "structure"], telegramTitle: "Get bookings in Telegram", audienceTitle: "Who it is for", audienceText: "Perfect for anyone who works by appointments", faqTitle: "FAQ", faq: [{ q: "How does online booking work for hairdressers?", a: "Clients pick service and time, then appointments appear in your booking calendar." }, { q: "Can I set haircut duration?", a: "Yes, each service has custom duration and pricing." }, { q: "Is it good for solo professionals?", a: "Yes, it works for solo hairdressers and teams." }, { q: "Can I use it without a website?", a: "Yes, Timviz profile and booking page are enough." }, { q: "Are Telegram notifications available?", a: "Yes, you get Telegram notifications for new bookings." }], finalTitle: "Create hairdresser profile", finalButton: "Create hairdresser profile", linksTitle: "Useful links", links: [{ label: "For business", href: "/for-business" }, { label: "For nail artists", href: "/dlya-manikyuru" }, { label: "For barbers", href: "/dlya-barberov" }, { label: "For cosmetologists", href: "/dlya-kosmetologov" }], footerText: "Timviz for business · online client booking and service management", privacy: "Privacy policy", terms: "Terms of use", altCalendar: "Hairdresser booking calendar in Timviz", altService: "Hairdresser services and prices in Timviz"
  }
};

export function buildHairdresserMetadata(lang: SiteLanguage, pathname: string): Metadata {
  const title =
    lang === "uk"
      ? "Онлайн-запис для перукарів — календар і CRM | Timviz"
      : lang === "ru"
        ? "Онлайн-запись для парикмахеров — календарь и CRM | Timviz"
        : "Online booking for hairdressers — calendar & CRM | Timviz";

  const description =
    lang === "ru"
      ? "Timviz — сервис онлайн-записи для парикмахеров: календарь записей, услуги, цены, длительность стрижек и уведомления в Telegram."
      : lang === "uk"
        ? "Timviz — сервіс онлайн-запису для перукарів: календар записів, послуги, ціни, тривалість стрижок і сповіщення в Telegram."
        : "Timviz is online booking software for hairdressers with booking calendar, service pricing, haircut duration setup and Telegram notifications.";

  const metadata = buildMetadata(pathname, { title, description }, lang);
  return {
    ...metadata,
    alternates: {
      canonical: `https://timviz.com${pathname}`,
      languages: {
        uk: "https://timviz.com/uk/dlya-perukariv",
        ru: "https://timviz.com/ru/dlya-parikmaherov",
        en: "https://timviz.com/en/for-hairdressers",
        "x-default": "https://timviz.com/en/for-hairdressers"
      }
    }
  };
}

export default function HairdresserLanding({ language }: { language: SiteLanguage }) {
  const t = copy[language];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } }))
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Timviz", item: `https://timviz.com${getLocalizedPath(language)}` },
      { "@type": "ListItem", position: 2, name: t.forBusiness, item: `https://timviz.com${getLocalizedPath(language, "/for-business")}` },
      {
        "@type": "ListItem",
        position: 3,
        name: t.title,
        item: `https://timviz.com${language === "en" ? "/en/for-hairdressers" : language === "ru" ? "/ru/dlya-parikmaherov" : "/uk/dlya-perukariv"}`
      }
    ]
  };

  return (
    <main className="manicure-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <header className="business-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <nav className="business-nav" aria-label={t.forBusiness}>
          <a href={getLocalizedPath(language)}>{t.home}</a>
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href="/pro/login">Timviz Pro</a>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="manicure-hero" id="top">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
          <div className="business-hero-actions">
            <a className="business-primary" href="/pro/create-account">{t.cta}</a>
            <a className="business-secondary" href="#solution">{t.ctaSecondary}</a>
          </div>
          <small>{t.microcopy}</small>
        </div>
        <aside className="manicure-hero-card">
          <img src="/for-business/ru-day.png" alt={t.altCalendar} loading="lazy" />
          <div><strong>{t.sampleClient}</strong><p>{t.sampleService}</p><span>{t.sampleStatus}</span></div>
        </aside>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.problemsTitle}</h2></div>
        <div className="business-feature-grid business-feature-grid--compact">{t.problems.map((item) => <article key={item}><h3>{item}</h3></article>)}</div>
      </section>

      <section className="business-feature-section" id="solution">
        <div className="business-section-head"><h2>{t.solutionTitle}</h2></div>
        <div className="business-feature-grid business-feature-grid--compact">{t.solution.map((item) => <article key={item}><h3>{item}</h3></article>)}</div>
      </section>

      <section className="business-screens-section">
        <div className="business-section-head"><h2>{t.servicesTitle}</h2></div>
        <div className="manicure-services-grid">
          <div className="manicure-services-list">{t.serviceItems.map((item) => <span key={item}>{item}</span>)}</div>
          <article className="manicure-service-card"><img src="/for-business/ru-week.png" alt={t.altService} loading="lazy" /><strong>{t.serviceExample}</strong></article>
        </div>
      </section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.calendarTitle}</h2><p>{t.calendarText}</p></div></section>

      <section className="business-workflow-section"><div><h2>{t.howTitle}</h2></div><ol>{t.howSteps.map((step) => <li key={step}><div><strong>{step}</strong></div></li>)}</ol></section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.compareTitle}</h2></div><div className="business-compare-grid"><article><h3>{language === "en" ? "Without Timviz" : "Без Timviz"}</h3><ul>{t.without.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>{language === "en" ? "With Timviz" : "С Timviz"}</h3><ul>{t.with.map((item) => <li key={item}>{item}</li>)}</ul></article></div></section>

      <section className="business-seo-section"><h2>{t.telegramTitle}</h2></section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.audienceTitle}</h2><p>{t.audienceText}</p></div></section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.faqTitle}</h2></div><div className="business-faq-list">{t.faq.map((item) => <details key={item.q} className="business-faq-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>

      <section className="business-final-section"><h2>{t.finalTitle}</h2><a className="business-primary" href="/pro/create-account">{t.finalButton}</a></section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.linksTitle}</h2></div><div className="business-footer-links">{t.links.map((link) => <a key={link.href} href={getLocalizedPath(language, link.href)}>{link.label}</a>)}</div></section>

      <footer className="business-footer"><a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a><span>{t.footerText}</span><div className="business-footer-links"><a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a><a href={getLocalizedPath(language, "/terms")}>{t.terms}</a></div></footer>
    </main>
  );
}
