import type { Metadata } from "next";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import { buildMetadata } from "../../lib/seo";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";

type InfoCard = {
  title: string;
  text: string;
  benefit?: string;
};

type HairCopy = {
  home: string;
  forBusiness: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaSecondary: string;
  ctaAfterHero: string;
  ctaAfterFeatures: string;
  ctaBottom: string;
  microcopy: string;
  sampleClient: string;
  sampleService: string;
  sampleStatus: string;
  problemsTitle: string;
  problems: InfoCard[];
  solutionTitle: string;
  solution: InfoCard[];
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
  nicheTitle: string;
  nicheText: string;
  socialTitle: string;
  socialText: string;
  seoBlockTitle: string;
  seoParagraphs: string[];
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

const ruSeoParagraphs = [
  "Если вы парикмахер и хотите стабильно принимать запись клиентов онлайн, ключевая задача — убрать хаос из мессенджеров. Когда запись на стрижку идет через WhatsApp, Telegram и Instagram одновременно, вы тратите время не на работу, а на ручную координацию. Timviz работает как программа для записи клиентов и помогает собрать все обращения в единую систему. Клиент видит понятную форму, выбирает услугу парикмахера и доступный слот, а вы сразу получаете структурированную запись без лишних звонков.",
  "Для мастера, который ведет плотный график работы парикмахера, критично видеть реальную картину дня. Календарь записей в Timviz показывает длительность каждой процедуры, статус визита и свободные окна между клиентами. Это снижает риск накладок, когда две записи попадают в один и тот же промежуток. Вместо ручного пересчета времени вы работаете с автоматизированным расписанием, где учтены стрижка, окрашивание, укладка и сложные процедуры с индивидуальной длительностью.",
  "Timviz подходит не только как сервис онлайн-записи, но и как легкая CRM для парикмахера. В одном кабинете находятся услуги, цены, рабочие дни и поток заявок. Это особенно важно, если вы работаете без администратора и управляете всем самостоятельно. Программа для записи клиентов помогает стандартизировать процесс: клиент заранее видит цену, вы заранее видите нагрузку, а значит меньше переносов и меньше недопониманий в день приема.",
  "Онлайн запись для парикмахеров дает измеримый эффект в ежедневной работе: меньше потерянных обращений, быстрее подтверждение записи, выше дисциплина клиентов. Когда система автоматически предлагает только свободное время, запись клиентов без звонков становится реальным рабочим сценарием, а не теорией. Для салонов и частных мастеров это означает более ровную загрузку, снижение пауз между услугами и более предсказуемую выручку в течение недели.",
  "Отдельный плюс Timviz — управление услугами парикмахера с разной сложностью. В реальной практике простая мужская стрижка и сложное окрашивание требуют разного времени и подготовки. В Timviz вы настраиваете длительность, описание и стоимость каждой услуги, чтобы клиент выбирал корректный формат записи. Так программа для записи клиентов снижает операционные ошибки: меньше случаев, когда записали короткий слот под длинную процедуру.",
  "Календарь записей также решает задачу повторных визитов и планирования вперед. Вы можете быстро оценить неделю, увидеть загруженные часы и предлагать клиентам удобные альтернативы без длительной переписки. Это делает работу более профессиональной: вместо отложенных ответов у вас есть конкретные окна и понятная логика расписания. В результате запись на стрижку и другие услуги становится прозрачной и удобной как для мастера, так и для клиента.",
  "Для многих мастеров ключевой вопрос — как не пропускать новые заявки. Telegram уведомления в Timviz закрывают этот риск: вы сразу получаете сигнал о новой записи, изменении времени или подтверждении визита. Даже если вы заняты у клиента, после процедуры можно быстро открыть календарь и проверить обновления. Такая связка CRM для парикмахера и мгновенных уведомлений помогает держать сервис на высоком уровне без постоянного мониторинга нескольких чатов.",
  "Если вам нужна программа для записи клиентов, которая не требует долгого внедрения, Timviz позволяет стартовать за несколько минут. Вы создаете профиль, добавляете услуги парикмахера, задаете график работы парикмахера и делитесь ссылкой на клиентскую запись онлайн. С этого момента поток заявок идет в понятную систему, а не теряется в сообщениях. Именно так онлайн запись для парикмахеров превращается в инструмент роста, а не просто еще один канал коммуникации."
];

const copy: Record<SiteLanguage, HairCopy> = {
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для парикмахеров",
    subtitle: "Принимайте записи клиентов онлайн, управляйте расписанием и не теряйте клиентов",
    cta: "Начать бесплатно",
    ctaSecondary: "Посмотреть возможности",
    ctaAfterHero: "Начать бесплатно",
    ctaAfterFeatures: "Начать бесплатно",
    ctaBottom: "Создать профиль парикмахера",
    microcopy: "Без сложных настроек • запуск за 2 минуты",
    sampleClient: "Клиент: Ольга М.",
    sampleService: "Стрижка + укладка · 75 мин",
    sampleStatus: "Статус: Подтверждено",
    problemsTitle: "Знакомо парикмахеру?",
    problems: [
      { title: "Клиенты пишут в Instagram", text: "Клиенты пишут в Instagram, Telegram и Viber, и записи легко теряются." },
      { title: "Записи теряются", text: "Сложно отследить все записи и изменения, особенно в пиковые часы." },
      { title: "Сложно учитывать длительность", text: "Разная длительность стрижек и окрашивания вызывает путаницу в расписании." },
      { title: "Накладки по времени", text: "Клиенты могут записаться на одно и то же время без единого календаря." },
      { title: "Клиенты забывают о записи", text: "Без напоминаний растет количество пропусков и переносов в последний момент." },
      { title: "Не видно свободные окна", text: "Сложно быстро понять, где есть свободное время в течение дня." }
    ],
    solutionTitle: "Timviz решает это",
    solution: [
      { title: "24/7 онлайн-запись", text: "Клиенты записываются сами в любое время без звонков.", benefit: "Меньше ручной работы" },
      { title: "Календарь записей", text: "Все записи видны в одном календаре с актуальными статусами.", benefit: "Полный контроль дня" },
      { title: "Услуги с ценой", text: "Услуги с ценой и длительностью — без путаницы.", benefit: "Прозрачность для клиента" },
      { title: "Рабочие дни", text: "Настройка рабочих дней и свободных окон под ваш график.", benefit: "Гибкий ритм работы" },
      { title: "Telegram уведомления", text: "Получайте записи и подтверждения в Telegram.", benefit: "Быстрая реакция" },
      { title: "Клиентская страница", text: "Персональная страница для записи клиентов без лишних шагов.", benefit: "Больше завершенных записей" }
    ],
    servicesTitle: "Настройте услуги парикмахера",
    serviceItems: ["стрижка", "женская стрижка", "мужская стрижка", "окрашивание", "укладка", "сложные окрашивания", "уход за волосами", "восстановление"],
    serviceExample: "Стрижка — 60 мин — 500 грн",
    calendarTitle: "Календарь записей для парикмахера",
    calendarText: "Видите все записи, длительность процедур и свободное время.",
    howTitle: "Как это работает",
    howSteps: ["Создайте профиль", "Добавьте услуги", "Начните получать записи"],
    compareTitle: "Без Timviz и с Timviz",
    without: ["записи в мессенджерах", "путаница"],
    with: ["календарь", "онлайн запись", "структура"],
    telegramTitle: "Получайте записи в Telegram",
    nicheTitle: "Подходит для парикмахеров и салонов",
    nicheText: "Удобно для стрижек, окрашивания, укладки и сложных процедур с разной длительностью.",
    socialTitle: "Мастера уже используют Timviz",
    socialText: "Парикмахеры переходят на Timviz, чтобы сократить ручные переписки и быстрее подтверждать записи.",
    seoBlockTitle: "Программа для записи клиентов для парикмахеров",
    seoParagraphs: ruSeoParagraphs,
    faqTitle: "FAQ",
    faq: [
      { q: "Как работает онлайн-запись для парикмахера?", a: "Клиент выбирает услугу и время, а запись клиентов онлайн сразу попадает в календарь записей." },
      { q: "Можно ли настроить длительность стрижек?", a: "Да, каждая услуга парикмахера настраивается с ценой и длительностью." },
      { q: "Подходит ли для одного мастера?", a: "Да, это CRM для парикмахера и для небольших студий." },
      { q: "Можно ли работать без сайта?", a: "Да, достаточно профиля в Timviz и клиентской ссылки на запись." },
      { q: "Есть ли Telegram уведомления?", a: "Да, сервис отправляет Telegram уведомления о новых записях." },
      { q: "Можно ли принимать запись на стрижку без звонков?", a: "Да, клиентская запись онлайн позволяет клиентам записываться самостоятельно." },
      { q: "Подходит ли Timviz для сложных окрашиваний?", a: "Да, вы можете задать длительность и стоимость сложных процедур отдельно." }
    ],
    finalTitle: "Готовы увеличить записи без хаоса?",
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
    home: "Головна",
    forBusiness: "Для бізнесу",
    title: "Онлайн-запис для перукарів",
    subtitle: "Приймайте записи клієнтів онлайн, керуйте розкладом і не втрачайте клієнтів",
    cta: "Почати безкоштовно",
    ctaSecondary: "Подивитися можливості",
    ctaAfterHero: "Почати безкоштовно",
    ctaAfterFeatures: "Почати безкоштовно",
    ctaBottom: "Створити профіль перукаря",
    microcopy: "Без складних налаштувань • запуск за 2 хвилини",
    sampleClient: "Клієнт: Ольга М.",
    sampleService: "Стрижка + укладка · 75 хв",
    sampleStatus: "Статус: Підтверджено",
    problemsTitle: "Знайомо перукарю?",
    problems: [
      { title: "Клієнти пишуть у месенджери", text: "Записи з Instagram, Telegram і Viber легко губляться." },
      { title: "Складно вести вручну", text: "Важко швидко оновлювати записи й зміни вручну." },
      { title: "Плутається тривалість", text: "Стрижки та фарбування мають різний таймінг, що створює хаос." },
      { title: "Накладки за часом", text: "Без єдиного календаря легко допустити перетини в розкладі." },
      { title: "Клієнти забувають", text: "Без нагадувань частіше виникають пропуски візитів." },
      { title: "Не видно вільні вікна", text: "Складно швидко запропонувати клієнту вільний час." }
    ],
    solutionTitle: "Timviz вирішує це",
    solution: [
      { title: "Онлайн-запис 24/7", text: "Клієнти записуються самостійно у зручний час.", benefit: "Менше дзвінків" },
      { title: "Календар записів", text: "Усі записи в одному календарі.", benefit: "Чіткий контроль" },
      { title: "Послуги з ціною", text: "Ціна і тривалість кожної послуги фіксуються одразу.", benefit: "Менше помилок" },
      { title: "Робочі дні", text: "Гнучко налаштовуйте графік і вільні вікна.", benefit: "Зручний розклад" },
      { title: "Telegram", text: "Отримуйте нові записи і підтвердження в Telegram.", benefit: "Швидкий відгук" },
      { title: "Сторінка запису", text: "Клієнтська сторінка для запису без зайвих кроків.", benefit: "Вища конверсія" }
    ],
    servicesTitle: "Налаштуйте послуги перукаря",
    serviceItems: ["стрижка", "жіноча стрижка", "чоловіча стрижка", "фарбування", "укладка", "складні фарбування", "догляд за волоссям", "відновлення"],
    serviceExample: "Стрижка — 60 хв — 500 грн",
    calendarTitle: "Календар записів для перукаря",
    calendarText: "Бачите всі записи, тривалість процедур і вільний час.",
    howTitle: "Як це працює",
    howSteps: ["Створіть профіль", "Додайте послуги", "Почніть отримувати записи"],
    compareTitle: "Без Timviz і з Timviz",
    without: ["записи в месенджерах", "плутанина"],
    with: ["календар", "онлайн запис", "структура"],
    telegramTitle: "Отримуйте записи у Telegram",
    nicheTitle: "Підходить для перукарів і салонів",
    nicheText: "Для стрижки, фарбування, укладки й складних процедур різної тривалості.",
    socialTitle: "Майстри вже використовують Timviz",
    socialText: "Перукарі переходять на Timviz, щоб зменшити ручну комунікацію і прискорити підтвердження візитів.",
    seoBlockTitle: "Програма для запису клієнтів для перукарів",
    seoParagraphs: [
      "Timviz допомагає перукарям приймати онлайн-запис клієнтів без хаосу в месенджерах.",
      "Календар записів показує зайнятість, вільні вікна та тривалість послуг.",
      "Ви керуєте послугами, цінами та робочими днями в одному кабінеті."
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "Як працює онлайн-запис для перукаря?", a: "Клієнт обирає послугу і час, а запис одразу потрапляє в календар." },
      { q: "Чи можна налаштувати тривалість стрижок?", a: "Так, кожна послуга налаштовується з ціною і тривалістю." },
      { q: "Чи підходить для одного майстра?", a: "Так, Timviz підходить для одного перукаря й команди." },
      { q: "Чи можна працювати без сайту?", a: "Так, достатньо профілю Timviz і посилання на запис." },
      { q: "Чи є Telegram сповіщення?", a: "Так, сервіс надсилає сповіщення про нові записи." },
      { q: "Чи є календар записів?", a: "Так, ви бачите всі візити й вільні слоти в одному місці." }
    ],
    finalTitle: "Готові збільшити записи без хаосу?",
    finalButton: "Створити профіль перукаря",
    linksTitle: "Корисні посилання",
    links: [
      { label: "Для бізнесу", href: "/for-business" },
      { label: "Для майстрів манікюру", href: "/dlya-manikyuru" },
      { label: "Для барберів", href: "/dlya-barberov" },
      { label: "Для косметологів", href: "/dlya-kosmetologov" }
    ],
    footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    altCalendar: "Календар записів для перукаря в Timviz",
    altService: "Послуги перукаря і ціни в Timviz"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    title: "Online booking for hairdressers",
    subtitle: "Accept bookings online, manage schedule and keep clients from dropping off",
    cta: "Start for free",
    ctaSecondary: "See features",
    ctaAfterHero: "Start for free",
    ctaAfterFeatures: "Start for free",
    ctaBottom: "Create hairdresser profile",
    microcopy: "No complex setup • launch in 2 minutes",
    sampleClient: "Client: Olga M.",
    sampleService: "Haircut + styling · 75 min",
    sampleStatus: "Status: Confirmed",
    problemsTitle: "Common booking issues",
    problems: [
      { title: "Messages are scattered", text: "Bookings spread across Instagram, Telegram and WhatsApp." },
      { title: "Manual tracking is hard", text: "It takes too much time to track edits and cancellations." },
      { title: "Duration conflicts", text: "Different service duration causes calendar gaps and overlaps." },
      { title: "Time overlaps", text: "Two clients can accidentally land in the same slot." },
      { title: "Clients forget visits", text: "No reminders means more no-shows." },
      { title: "No clear free slots", text: "Hard to quickly propose accurate available time." }
    ],
    solutionTitle: "Timviz fixes this",
    solution: [
      { title: "24/7 online booking", text: "Clients book on their own anytime.", benefit: "Fewer calls" },
      { title: "Booking calendar", text: "All appointments in one schedule.", benefit: "Clear control" },
      { title: "Priced services", text: "Each service has duration and price.", benefit: "No confusion" },
      { title: "Working days", text: "Set your workdays and free slots.", benefit: "Flexible planning" },
      { title: "Telegram alerts", text: "Get instant booking updates.", benefit: "Fast response" },
      { title: "Client booking page", text: "Share one page for self-booking.", benefit: "Better conversion" }
    ],
    servicesTitle: "Set up hairdresser services",
    serviceItems: ["haircut", "women's haircut", "men's haircut", "coloring", "styling", "complex coloring", "hair care", "restoration"],
    serviceExample: "Haircut — 60 min — 500 UAH",
    calendarTitle: "Booking calendar for hairdressers",
    calendarText: "See all bookings, service duration and free time.",
    howTitle: "How it works",
    howSteps: ["Create profile", "Add services", "Start getting bookings"],
    compareTitle: "Without Timviz vs with Timviz",
    without: ["messenger-only booking", "confusion"],
    with: ["calendar", "online booking", "structure"],
    telegramTitle: "Get bookings in Telegram",
    nicheTitle: "Built for hairdressers and salons",
    nicheText: "Suitable for haircuts, coloring, styling and complex long procedures.",
    socialTitle: "Professionals already use Timviz",
    socialText: "Hairdressers use Timviz to reduce manual messaging and speed up confirmations.",
    seoBlockTitle: "Client booking software for hairdressers",
    seoParagraphs: [
      "Timviz helps hairdressers run online client booking from one dashboard.",
      "You can manage services, duration, pricing and schedule in a single booking calendar.",
      "It reduces manual messaging and improves booking conversion."
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "How does online booking work for hairdressers?", a: "Clients pick a service and time, and bookings appear in your calendar." },
      { q: "Can I set haircut duration?", a: "Yes, each service has custom duration and price." },
      { q: "Is it good for solo professionals?", a: "Yes, Timviz works for solo hairdressers and teams." },
      { q: "Can I use it without a website?", a: "Yes, your Timviz page is enough to start." },
      { q: "Are Telegram notifications available?", a: "Yes, you get alerts for new and updated bookings." },
      { q: "Can I manage complex procedures?", a: "Yes, long services can be configured with accurate duration." }
    ],
    finalTitle: "Ready to increase bookings?",
    finalButton: "Create hairdresser profile",
    linksTitle: "Useful links",
    links: [
      { label: "For business", href: "/for-business" },
      { label: "For nail artists", href: "/dlya-manikyuru" },
      { label: "For barbers", href: "/dlya-barberov" },
      { label: "For cosmetologists", href: "/dlya-kosmetologov" }
    ],
    footerText: "Timviz for business · online client booking and service management",
    privacy: "Privacy policy",
    terms: "Terms of use",
    altCalendar: "Hairdresser booking calendar in Timviz",
    altService: "Hairdresser services and prices in Timviz"
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

  return (
    <main className="manicure-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
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

      <section className="business-seo-section hair-cta-inline"><a className="business-primary" href="/pro/create-account">{t.ctaAfterHero}</a></section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.problemsTitle}</h2></div>
        <div className="hair-card-grid">{t.problems.map((card) => <article key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
      </section>

      <section className="business-feature-section" id="solution">
        <div className="business-section-head"><h2>{t.solutionTitle}</h2></div>
        <div className="hair-card-grid">{t.solution.map((card) => <article key={card.title}><h3>{card.title}</h3><p>{card.text}</p><small>{card.benefit}</small></article>)}</div>
      </section>

      <section className="business-seo-section hair-cta-inline"><a className="business-primary" href="/pro/create-account">{t.ctaAfterFeatures}</a></section>

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
      <section className="business-feature-section"><div className="business-section-head"><h2>{t.nicheTitle}</h2><p>{t.nicheText}</p></div></section>
      <section className="business-feature-section"><div className="business-section-head"><h2>{t.socialTitle}</h2><p>{t.socialText}</p></div></section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.seoBlockTitle}</h2></div>
        <div className="hair-seo-text">{t.seoParagraphs.map((p) => <p key={p}>{p}</p>)}</div>
      </section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.faqTitle}</h2></div><div className="business-faq-list">{t.faq.map((item) => <details key={item.q} className="business-faq-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>

      <section className="business-final-section"><h2>{t.finalTitle}</h2><a className="business-primary" href="/pro/create-account">{t.finalButton}</a></section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.linksTitle}</h2></div><div className="business-footer-links">{t.links.map((link) => <a key={link.href} href={getLocalizedPath(language, link.href)}>{link.label}</a>)}</div></section>

      <section className="business-seo-section hair-cta-inline"><a className="business-primary" href="/pro/create-account">{t.ctaBottom}</a></section>

      <footer className="business-footer"><a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a><span>{t.footerText}</span><div className="business-footer-links"><a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a><a href={getLocalizedPath(language, "/terms")}>{t.terms}</a></div></footer>
    </main>
  );
}
