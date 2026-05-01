import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandLogo from "../../BrandLogo";
import GlobalLanguageSwitcher from "../../GlobalLanguageSwitcher";
import { buildLanguageAlternates, buildMetadata } from "../../../lib/seo";
import { getLocalizedPath, isSiteLanguage, type SiteLanguage } from "../../../lib/site-language";

type PageProps = {
  params: Promise<{ lang: string }>;
};

type Copy = {
  home: string;
  forBusiness: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  microcopy: string;
  sampleClient: string;
  sampleService: string;
  sampleStatus: string;
  problemsTitle: string;
  problems: string[];
  solutionTitle: string;
  solutionText: string;
  solutionCards: string[];
  servicesTitle: string;
  servicesText: string;
  servicesList: string[];
  serviceSample: string;
  calendarTitle: string;
  calendarText: string;
  calendarItems: string[];
  howTitle: string;
  howSteps: string[];
  compareTitle: string;
  compareLeftTitle: string;
  compareRightTitle: string;
  compareLeft: string[];
  compareRight: string[];
  telegramTitle: string;
  telegramText: string;
  telegramCta: string;
  reasonsTitle: string;
  reasons: string[];
  otherTitle: string;
  otherCards: Array<{ title: string; text: string; href: string }>;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalText: string;
  finalButton: string;
  finalMicrocopy: string;
  middleCtaTitle: string;
  middleCtaText: string;
  middleCtaButton: string;
  privacy: string;
  terms: string;
  footerText: string;
  screenshotAltCalendar: string;
  screenshotAltServices: string;
  screenshotAltTelegram: string;
};

const copy: Record<SiteLanguage, Copy> = {
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для мастера маникюра",
    subtitle: "Принимайте записи клиентов онлайн, ведите календарь, услуги, цены и рабочий график в одном кабинете.",
    ctaPrimary: "Начать бесплатно",
    ctaSecondary: "Посмотреть возможности",
    microcopy: "Без сложных настроек • запуск за несколько минут",
    sampleClient: "Клиент: Анна К.",
    sampleService: "Маникюр с покрытием · 90 мин",
    sampleStatus: "Статус: Подтверждено",
    problemsTitle: "Знакомо мастеру маникюра?",
    problems: ["Клиенты пишут в Instagram, Telegram и Viber", "Записи теряются в переписках", "Сложно помнить цену и длительность каждой услуги", "Бывают накладки по времени", "Клиенты забывают о записи", "Трудно видеть свободные окна на день"],
    solutionTitle: "Timviz наводит порядок в записях",
    solutionText: "Timviz помогает мастеру маникюра принимать онлайн-запись клиентов, показывать свободное время, вести календарь процедур и управлять услугами без хаоса в мессенджерах.",
    solutionCards: ["Онлайн-запись 24/7", "Календарь записей", "Услуги с ценой и длительностью", "Рабочие дни и свободные окна", "Telegram-уведомления", "Клиентская страница для записи"],
    servicesTitle: "Настройте услуги маникюра за несколько минут",
    servicesText: "Добавьте услуги, укажите цену и длительность, чтобы клиент сразу понимал, сколько стоит процедура и сколько времени она занимает.",
    servicesList: ["Маникюр", "Маникюр с покрытием", "Гель-лак", "Наращивание ногтей", "Коррекция", "Снятие покрытия", "Дизайн ногтей", "Педикюр", "Укрепление ногтей", "Ремонт ногтя"],
    serviceSample: "Маникюр с покрытием — 90 мин — 650 грн",
    calendarTitle: "Календарь записей для мастера маникюра",
    calendarText: "В календаре видно все записи, длительность процедур, свободные окна и загруженность дня. Это помогает не ставить клиентов слишком близко и не терять время между визитами.",
    calendarItems: ["дневной календарь", "недельный график", "свободные окна", "статусы записей", "повторные визиты"],
    howTitle: "Как работает онлайн-запись",
    howSteps: ["Создайте профиль мастера", "Добавьте услуги, цены и длительность", "Настройте рабочие дни", "Получайте записи клиентов онлайн"],
    compareTitle: "Без Timviz и с Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "С Timviz",
    compareLeft: ["записи в разных мессенджерах", "нужно вручную искать свободное время", "клиентам надо ждать ответа", "легко забыть или перепутать запись"],
    compareRight: ["запись клиентов онлайн", "календарь с доступным временем", "услуги с ценой и длительностью", "уведомления в Telegram", "меньше ручных переписок"],
    telegramTitle: "Новые записи — сразу в Telegram",
    telegramText: "Подключите Telegram-бот Timviz, чтобы получать уведомления о новых записях, подтверждать заявки и быстро открывать календарь.",
    telegramCta: "Подключить после регистрации",
    reasonsTitle: "Почему мастеру удобно начать с Timviz",
    reasons: ["можно начать бесплатно", "не нужен отдельный сайт", "подходит для одного мастера", "можно работать без сложной CRM", "все на русском и украинском", "клиентам удобно записываться с телефона"],
    otherTitle: "Timviz подходит не только для маникюра",
    otherCards: [
      { title: "Для парикмахеров", text: "Календарь записей для стрижек и окрашиваний.", href: "/dlya-parikmaherov" },
      { title: "Для барберов", text: "Быстрые записи и плотный график без накладок.", href: "/dlya-barberov" },
      { title: "Для косметологов", text: "Удобная запись на консультации и процедуры.", href: "/dlya-kosmetologov" },
      { title: "Для массажистов", text: "Гибкое управление сеансами разной длительности.", href: "/dlya-massazhistov" }
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "Что такое Timviz для мастера маникюра?", a: "Timviz — это сервис онлайн-записи для мастеров красоты с календарем записей, услугами, ценами и графиком работы." },
      { q: "Можно ли принимать онлайн-запись клиентов?", a: "Да, клиенты выбирают услугу и время сами, а запись сразу появляется в вашем календаре." },
      { q: "Можно ли указать цену и длительность услуг?", a: "Да, вы задаете стоимость и длительность каждой услуги маникюра отдельно." },
      { q: "Подходит ли Timviz для одного мастера?", a: "Да, платформа отлично подходит для частных мастеров без отдельного администратора." },
      { q: "Можно ли вести календарь записей?", a: "Да, доступен календарь записей с дневным и недельным представлением." },
      { q: "Есть ли Telegram-уведомления?", a: "Да, Timviz отправляет Telegram-уведомления о новых записях и изменениях." },
      { q: "Нужно ли создавать отдельный сайт?", a: "Нет, достаточно профиля Timviz и клиентской страницы для записи онлайн." },
      { q: "Можно ли начать бесплатно?", a: "Да, вы можете запустить сервис онлайн-записи бесплатно и настроить всё за несколько минут." }
    ],
    finalTitle: "Начните принимать записи на маникюр онлайн",
    finalText: "Создайте профиль, добавьте услуги и рабочие дни. Timviz поможет клиентам записываться без лишних переписок.",
    finalButton: "Создать профиль мастера",
    finalMicrocopy: "Это займёт несколько минут",
    middleCtaTitle: "Готовы принимать записи онлайн?",
    middleCtaText: "Добавьте услуги, график работы и начните получать записи без лишних переписок.",
    middleCtaButton: "Создать профиль компании",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    screenshotAltCalendar: "Календарь записей для мастера маникюра в Timviz",
    screenshotAltServices: "Услуги и цены мастера маникюра в Timviz",
    screenshotAltTelegram: "Telegram-уведомления о новых записях Timviz"
  },
  uk: {
    home: "Головна", forBusiness: "Для бізнесу", title: "Онлайн-запис для майстра манікюру", subtitle: "Приймайте онлайн-запис клієнтів, ведіть календар, послуги, ціни та графік роботи в одному кабінеті.", ctaPrimary: "Почати безкоштовно", ctaSecondary: "Подивитися можливості", microcopy: "Без складних налаштувань • запуск за кілька хвилин", sampleClient: "Клієнт: Анна К.", sampleService: "Манікюр із покриттям · 90 хв", sampleStatus: "Статус: Підтверджено", problemsTitle: "Знайомо майстру манікюру?", problems: ["Клієнти пишуть у Instagram, Telegram і Viber", "Записи губляться в переписках", "Складно пам'ятати ціну й тривалість послуг", "Бувають накладки за часом", "Клієнти забувають про запис", "Важко бачити вільні вікна на день"], solutionTitle: "Timviz наводить порядок у записах", solutionText: "Timviz допомагає майстру манікюру приймати онлайн-запис клієнтів, показувати вільний час і вести календар процедур без хаосу в месенджерах.", solutionCards: ["Онлайн-запис 24/7", "Календар записів", "Послуги з ціною і тривалістю", "Робочі дні та вільні вікна", "Telegram-сповіщення", "Клієнтська сторінка для запису"], servicesTitle: "Налаштуйте послуги манікюру за кілька хвилин", servicesText: "Додайте послуги, вкажіть ціну і тривалість, щоб клієнт одразу бачив вартість і час процедури.", servicesList: ["Манікюр", "Манікюр із покриттям", "Гель-лак", "Нарощування нігтів", "Корекція", "Зняття покриття", "Дизайн нігтів", "Педикюр", "Зміцнення нігтів", "Ремонт нігтя"], serviceSample: "Манікюр із покриттям — 90 хв — 650 грн", calendarTitle: "Календар записів для майстра манікюру", calendarText: "У календарі видно всі записи, тривалість процедур, вільні вікна та завантаженість дня.", calendarItems: ["денний календар", "тижневий графік", "вільні вікна", "статуси записів", "повторні візити"], howTitle: "Як працює онлайн-запис", howSteps: ["Створіть профіль майстра", "Додайте послуги, ціни та тривалість", "Налаштуйте робочі дні", "Отримуйте записи клієнтів онлайн"], compareTitle: "Без Timviz і з Timviz", compareLeftTitle: "Без Timviz", compareRightTitle: "З Timviz", compareLeft: ["записи в різних месенджерах", "потрібно вручну шукати вільний час", "клієнтам треба чекати відповіді", "легко забути або переплутати запис"], compareRight: ["запис клієнтів онлайн", "календар із доступним часом", "послуги з ціною і тривалістю", "сповіщення в Telegram", "менше ручних переписок"], telegramTitle: "Нові записи — одразу в Telegram", telegramText: "Підключіть Telegram-бот Timviz, щоб отримувати сповіщення про нові записи і швидко відкривати календар.", telegramCta: "Підключити після реєстрації", reasonsTitle: "Чому майстру зручно почати з Timviz", reasons: ["можна почати безкоштовно", "не потрібен окремий сайт", "підходить для одного майстра", "можна працювати без складної CRM", "усе українською та російською", "клієнтам зручно записуватись із телефона"], otherTitle: "Timviz підходить не тільки для манікюру", otherCards: [{ title: "Для перукарів", text: "Календар записів для стрижок і фарбувань.", href: "/dlya-parikmaherov" }, { title: "Для барберів", text: "Швидкі записи та щільний графік без накладок.", href: "/dlya-barberov" }, { title: "Для косметологів", text: "Зручний запис на консультації та процедури.", href: "/dlya-kosmetologov" }, { title: "Для масажистів", text: "Гнучке керування сеансами різної тривалості.", href: "/dlya-massazhistov" }], faqTitle: "FAQ", faq: [{ q: "Що таке Timviz для майстра манікюру?", a: "Timviz — це сервіс онлайн-запису з календарем, послугами, цінами й графіком роботи." }, { q: "Чи можна приймати онлайн-запис клієнтів?", a: "Так, клієнти самі обирають послугу й час, а запис одразу потрапляє в календар." }, { q: "Чи можна вказати ціну і тривалість послуг?", a: "Так, ціна і тривалість налаштовуються окремо для кожної послуги." }, { q: "Чи підходить Timviz для одного майстра?", a: "Так, платформа підходить для приватних майстрів без адміністратора." }, { q: "Чи можна вести календар записів?", a: "Так, доступний денний і тижневий календар записів." }, { q: "Чи є Telegram-сповіщення?", a: "Так, Timviz надсилає Telegram-сповіщення про нові записи та зміни." }, { q: "Чи потрібен окремий сайт?", a: "Ні, достатньо профілю Timviz і сторінки запису клієнтів." }, { q: "Чи можна почати безкоштовно?", a: "Так, запуск займає кілька хвилин і старт доступний безкоштовно." }], finalTitle: "Почніть приймати записи на манікюр онлайн", finalText: "Створіть профіль, додайте послуги й робочі дні. Timviz допоможе клієнтам записуватись без зайвих переписок.", finalButton: "Створити профіль майстра", finalMicrocopy: "Це займе кілька хвилин", middleCtaTitle: "Готові приймати записи онлайн?", middleCtaText: "Додайте послуги, графік роботи і почніть отримувати записи без зайвих переписок.", middleCtaButton: "Створити профіль компанії", privacy: "Політика конфіденційності", terms: "Умови використання", footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами", screenshotAltCalendar: "Календар записів для майстра манікюру в Timviz", screenshotAltServices: "Послуги та ціни майстра манікюру в Timviz", screenshotAltTelegram: "Telegram-сповіщення про нові записи Timviz"
  },
  en: {
    home: "Home", forBusiness: "For business", title: "Online booking for nail artists", subtitle: "Accept client bookings online and manage services, prices and working schedule from one dashboard.", ctaPrimary: "Start for free", ctaSecondary: "See features", microcopy: "No complex setup • launch in minutes", sampleClient: "Client: Anna K.", sampleService: "Manicure with coating · 90 min", sampleStatus: "Status: Confirmed", problemsTitle: "Does this sound familiar?", problems: ["Clients text in Instagram, Telegram and Viber", "Bookings get lost in chats", "Hard to track price and duration", "Time overlaps happen", "Clients forget visits", "No clear view of free slots"], solutionTitle: "Timviz brings structure to bookings", solutionText: "Timviz helps nail artists accept online client bookings, show available time, run a procedure calendar and manage services without messenger chaos.", solutionCards: ["24/7 online booking", "Booking calendar", "Services with price and duration", "Working days and free slots", "Telegram notifications", "Client booking page"], servicesTitle: "Set up manicure services in minutes", servicesText: "Add services with pricing and duration so clients know cost and time before booking.", servicesList: ["Manicure", "Manicure with coating", "Gel polish", "Nail extension", "Correction", "Coating removal", "Nail design", "Pedicure", "Nail strengthening", "Nail repair"], serviceSample: "Manicure with coating — 90 min — 650 UAH", calendarTitle: "Booking calendar for nail artists", calendarText: "The calendar shows all appointments, service duration, free slots and daily workload.", calendarItems: ["daily calendar", "weekly schedule", "free slots", "booking statuses", "repeat visits"], howTitle: "How online booking works", howSteps: ["Create your professional profile", "Add services, prices and duration", "Set working days", "Receive online bookings"], compareTitle: "Without Timviz vs With Timviz", compareLeftTitle: "Without Timviz", compareRightTitle: "With Timviz", compareLeft: ["bookings in multiple messengers", "manual free-slot search", "clients wait for reply", "easy to miss or mix up visits"], compareRight: ["online client booking", "calendar with available time", "services with price and duration", "Telegram notifications", "less manual messaging"], telegramTitle: "New bookings in Telegram", telegramText: "Connect Timviz Telegram bot to receive booking alerts and open your calendar quickly.", telegramCta: "Connect after sign up", reasonsTitle: "Why Timviz is easy to start", reasons: ["free start", "no separate website needed", "works for solo professionals", "no complex CRM required", "available in RU and UK", "easy booking from phone"], otherTitle: "Timviz works beyond manicure", otherCards: [{ title: "For hairdressers", text: "Booking calendar for cuts and coloring.", href: "/dlya-parikmaherov" }, { title: "For barbers", text: "Fast booking flow for busy schedules.", href: "/dlya-barberov" }, { title: "For cosmetologists", text: "Convenient booking for consultations and procedures.", href: "/dlya-kosmetologov" }, { title: "For massage therapists", text: "Flexible management of session durations.", href: "/dlya-massazhistov" }], faqTitle: "FAQ", faq: [{ q: "What is Timviz for nail artists?", a: "Timviz is an online booking service with appointment calendar, services, pricing and schedule management." }, { q: "Can I accept online client bookings?", a: "Yes, clients can pick service and time, and booking appears instantly in your calendar." }, { q: "Can I set price and duration per service?", a: "Yes, each service can have its own pricing and duration." }, { q: "Is Timviz good for solo professionals?", a: "Yes, it is designed for solo specialists and growing service teams." }, { q: "Can I manage a booking calendar?", a: "Yes, you get daily and weekly calendar views with statuses." }, { q: "Are Telegram notifications available?", a: "Yes, Timviz sends Telegram updates for new and changed bookings." }, { q: "Do I need a separate website?", a: "No, your Timviz profile and booking page are enough." }, { q: "Can I start for free?", a: "Yes, you can launch quickly with a free start." }], finalTitle: "Start accepting manicure bookings online", finalText: "Create your profile, add services and working days. Timviz helps clients book without endless messaging.", finalButton: "Create professional profile", finalMicrocopy: "It takes just a few minutes", middleCtaTitle: "Ready to accept bookings online?", middleCtaText: "Add services and working schedule to start receiving bookings faster.", middleCtaButton: "Create company profile", privacy: "Privacy policy", terms: "Terms of use", footerText: "Timviz for business · online client booking and service management", screenshotAltCalendar: "Booking calendar for nail artists in Timviz", screenshotAltServices: "Nail artist services and pricing in Timviz", screenshotAltTelegram: "Telegram notifications for new Timviz bookings"
  }
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) return {};

  const metadata = buildMetadata(
    `/${lang}/dlya-manikyuru`,
    {
      title:
        lang === "ru"
          ? "Онлайн-запись для мастера маникюра — календарь и CRM | Timviz"
          : lang === "uk"
            ? "Онлайн-запис для майстра манікюру — календар і CRM | Timviz"
            : "Online booking for nail artists — calendar and CRM | Timviz",
      description:
        lang === "ru"
          ? "Timviz — сервис онлайн-записи для мастеров маникюра: календарь клиентов, услуги, цены, длительность процедур, график работы и Telegram-уведомления."
          : lang === "uk"
            ? "Timviz — сервіс онлайн-запису для майстрів манікюру: календар клієнтів, послуги, ціни, тривалість процедур, графік роботи та Telegram-сповіщення."
            : "Timviz is online booking software for nail artists: client calendar, service pricing, duration settings, work schedule and Telegram notifications.",
      keywords: [
        "онлайн запись для мастера маникюра",
        "программа для записи клиентов",
        "календарь записей для мастера маникюра",
        "crm для мастера маникюра",
        "запись клиентов онлайн",
        "программа для ногтевого мастера",
        "сервис онлайн-записи"
      ]
    },
    lang
  );

  return {
    ...metadata,
    alternates: buildLanguageAlternates("/dlya-manikyuru", lang)
  };
}

export default async function ManicureLandingPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();

  const language = lang as SiteLanguage;
  const t = copy[language];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };
  const breadcrumbSchema = {
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
        name: t.forBusiness,
        item: `https://timviz.com${getLocalizedPath(language, "/for-business")}`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: t.title,
        item: `https://timviz.com${getLocalizedPath(language, "/dlya-manikyuru")}`
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
            <a className="business-primary" href="/pro/create-account">{t.ctaPrimary}</a>
            <a className="business-secondary" href="#solution">{t.ctaSecondary}</a>
          </div>
          <small>{t.microcopy}</small>
        </div>
        <aside className="manicure-hero-card">
          <img src="/for-business/ru-day.png" alt={t.screenshotAltCalendar} loading="lazy" />
          <div>
            <strong>{t.sampleClient}</strong>
            <p>{t.sampleService}</p>
            <span>{t.sampleStatus}</span>
          </div>
        </aside>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.problemsTitle}</h2></div>
        <div className="business-feature-grid business-feature-grid--compact">
          {t.problems.map((item) => <article key={item}><h3>{item}</h3></article>)}
        </div>
      </section>

      <section className="business-feature-section" id="solution">
        <div className="business-section-head">
          <h2>{t.solutionTitle}</h2>
          <p>{t.solutionText}</p>
        </div>
        <div className="business-feature-grid business-feature-grid--compact">
          {t.solutionCards.map((item) => <article key={item}><h3>{item}</h3></article>)}
        </div>
        <div className="business-inline-cta">
          <h3>{t.middleCtaTitle}</h3>
          <p>{t.middleCtaText}</p>
          <a className="business-primary" href="/pro/create-account">{t.middleCtaButton}</a>
        </div>
      </section>

      <section className="business-screens-section">
        <div className="business-section-head">
          <h2>{t.servicesTitle}</h2>
          <p>{t.servicesText}</p>
        </div>
        <div className="manicure-services-grid">
          <div className="manicure-services-list">
            {t.servicesList.map((item) => <span key={item}>{item}</span>)}
          </div>
          <article className="manicure-service-card">
            <img src="/for-business/ru-week.png" alt={t.screenshotAltServices} loading="lazy" />
            <strong>{t.serviceSample}</strong>
          </article>
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head">
          <h2>{t.calendarTitle}</h2>
          <p>{t.calendarText}</p>
        </div>
        <ul className="business-seo-list">
          {t.calendarItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section className="business-workflow-section">
        <div><h2>{t.howTitle}</h2></div>
        <ol>
          {t.howSteps.map((step) => (
            <li key={step}><div><strong>{step}</strong></div></li>
          ))}
        </ol>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.compareTitle}</h2></div>
        <div className="business-compare-grid">
          <article>
            <h3>{t.compareLeftTitle}</h3>
            <ul>{t.compareLeft.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <h3>{t.compareRightTitle}</h3>
            <ul>{t.compareRight.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
      </section>

      <section className="business-seo-section">
        <h2>{t.telegramTitle}</h2>
        <p>{t.telegramText}</p>
        <img src="/for-business/ru-month.png" alt={t.screenshotAltTelegram} loading="lazy" className="manicure-telegram-image" />
        <a className="business-secondary" href="/pro/create-account">{t.telegramCta}</a>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.reasonsTitle}</h2></div>
        <ul className="business-seo-list">{t.reasons.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.otherTitle}</h2></div>
        <div className="niche-links-grid">
          {t.otherCards.map((card) => (
            <a className="niche-link-card" href={getLocalizedPath(language, card.href)} key={card.href}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <span className="niche-link-arrow" aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.faqTitle}</h2></div>
        <div className="business-faq-list">
          {t.faq.map((item) => (
            <details key={item.q} className="business-faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="business-final-section">
        <h2>{t.finalTitle}</h2>
        <p>{t.finalText}</p>
        <a className="business-primary" href="/pro/create-account">{t.finalButton}</a>
        <small>{t.finalMicrocopy}</small>
      </section>

      <footer className="business-footer">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
        <span>{t.footerText}</span>
        <div className="business-footer-links">
          <a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a>
          <a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a>
          <a href={getLocalizedPath(language, "/terms")}>{t.terms}</a>
        </div>
      </footer>
    </main>
  );
}
