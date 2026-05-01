import type { Metadata } from "next";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import { getNicheSlug, nicheCards, nicheKeys } from "../../lib/niche-pages";
import { buildMetadata } from "../../lib/seo";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";

type InfoCard = {
  title: string;
  text: string;
};

type Copy = {
  home: string;
  forBusiness: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaAfterFeatures: string;
  ctaFinal: string;
  ctaHint: string;
  microcopy: string;
  sampleClient: string;
  sampleService: string;
  sampleStatus: string;
  problemsTitle: string;
  problems: InfoCard[];
  solutionTitle: string;
  solutionCards: InfoCard[];
  nicheTitle: string;
  nicheText: string;
  nicheItems: string[];
  nicheSample: string;
  howTitle: string;
  howSteps: string[];
  compareTitle: string;
  compareLeftTitle: string;
  compareRightTitle: string;
  compareLeft: string[];
  compareRight: string[];
  telegramTitle: string;
  telegramText: string;
  seoBlockTitle: string;
  seoParagraphs: string[];
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalText: string;
  usefulLinksTitle: string;
  usefulLinks: Array<{ label: string; href: string }>;
  otherTitle: string;
  privacy: string;
  terms: string;
  footerText: string;
  altCalendar: string;
  altServices: string;
  altTelegram: string;
};

const ukSeoParagraphs = [
  "Для сучасного барбера онлайн запис барбер стає не додатковим каналом, а основою стабільного графіка. Коли клієнти пишуть у кілька месенджерів одночасно, частина звернень губиться, а майстер витрачає час на ручну координацію. Timviz працює як програма для барбершопу, що переводить запис клієнтів онлайн у структурований процес. Клієнт обирає послугу та час самостійно, а барбер отримує готовий візит у календарі. Це зменшує навантаження на адміністративні задачі, прискорює підтвердження і дає змогу більше уваги приділяти сервісу та якості роботи з клієнтом.",
  "У барберській практиці різна тривалість послуг критично впливає на завантаження. Швидка стрижка, оформлення бороди, fade або комплексні послуги мають різний таймінг, і без системи легко зробити накладку. Саме тому календар записів барбер у Timviz показує не просто список візитів, а реальну картину дня: тривалість, вільні вікна, підтвердження та зміни. Ви бачите, де є запас часу, де краще не ставити довгі послуги і як утримувати комфортний ритм без затримок. Такий підхід формує прогнозований день і зменшує стрес для майстра та клієнта.",
  "Коли запис клієнтів барбершоп ведеться вручну в чатах, легко пропустити важливі деталі: точний час, формат послуги, додаткові побажання клієнта. Timviz прибирає цю невизначеність. Усі дані зберігаються в одному місці, а структура запису залишається зрозумілою навіть у пікові години. Програма для барбершопу дозволяє налаштувати послуги, ціни та тривалість так, щоб клієнт одразу бачив умови і бронював коректний слот. У результаті запис клієнтів онлайн стає передбачуваним процесом, де менше помилок, менше переносів і менше втрат часу на повторні уточнення.",
  "Для майстра, який працює самостійно, важлива проста CRM для барбера без складного впровадження. Timviz закриває цю потребу: запуск займає кілька хвилин, не потрібен окремий сайт і не потрібні технічні налаштування. Ви створюєте профіль, додаєте послуги й відкриваєте посилання для запису. Далі клієнти бронюють час самостійно, а система збирає все в один календар. Такий формат дає швидкий старт навіть тим, хто раніше працював тільки через месенджери. При цьому онлайн запис барбер не виглядає спрощено: клієнт отримує сучасний, зручний сценарій бронювання і вищий рівень сервісу.",
  "Календар записів барбер особливо корисний, коли в день багато дрібних змін. Хтось переносить візит, хтось додає бороду до стрижки, хтось просить інший слот. У чатах це створює хаос, а в Timviz відображається як оновлений структурований розклад. Ви швидко бачите нову картину та приймаєте рішення без ручного перерахунку. Запис клієнтів барбершоп стає керованим і прозорим, а робочий день — більш дисциплінованим. Це важливо і для приватного барбера, і для команди, де кілька майстрів працюють паралельно й потрібно уникати конфліктів у часі.",
  "Telegram-сповіщення додатково підсилюють контроль. Майстер одразу отримує сигнал про новий запис, зміну або скасування, навіть коли зайнятий з клієнтом. Це допомагає не пропускати важливі оновлення та тримати високий темп без постійного перемикання між застосунками. Для багатьох це ключова частина того, як працює CRM для барбера в реальності: не просто зберігання записів, а швидка реакція на події. Коли запис клієнтів онлайн поєднаний з миттєвими сповіщеннями, зростає точність графіка і знижується ризик ситуацій, коли майстер дізнається про зміну занадто пізно.",
  "Timviz добре масштабується для барбершопів із командою. Коли кілька барберів приймають клієнтів одночасно, потрібна система, яка показує завантаження кожного майстра і загальну картину дня. Програма для барбершопу дозволяє тримати порядок у потоках запису, розподіляти візити без конфліктів і планувати робочі зміни на тиждень наперед. Запис клієнтів барбершоп переходить у формат, де керівник або адміністратор бачить реальні вузькі місця: перевантажені години, простої або неефективні слоти. Це дає основу для рішень, що прямо впливають на виручку та стабільність роботи.",
  "Пошукові запити на кшталт «онлайн запис барбер», «онлайн запис барбершоп» або «програма для барбершопу» зазвичай роблять майстри, які хочуть підвищити конверсію в реальні візити. Timviz допомагає саме в цьому: клієнту не потрібно чекати відповіді в чаті, він бачить доступний час і одразу бронює. Для барбера це означає менше ручних дій і більше підтверджених записів у графіку. Календар записів барбер працює як центральна точка контролю, де видно весь день без прогалин. Такий підхід створює професійний клієнтський досвід і допомагає формувати репутацію сервісу, в який легко й зручно записатися.",
  "Якщо підсумувати, Timviz закриває всі базові задачі, які потрібні барберу для росту: онлайн запис барбер, стабільний запис клієнтів онлайн, точний календар записів барбер, практична CRM для барбера і керування послугами в одному кабінеті. Це не перевантажена система, а робочий інструмент, що швидко впроваджується й одразу дає результат. Запис клієнтів барбершоп стає зрозумілим і передбачуваним, а майстер отримує більше контролю над часом, якістю сервісу та фінальним навантаженням. Саме це дозволяє переходити від хаосу в месенджерах до системного процесу запису без зайвих витрат.",
  "У щоденній роботі важлива не тільки кількість бронювань, а й комфортний ритм зміни. Коли інструмент правильно налаштований, майстер бачить, де є резерв часу, де потрібно додати буфер і які послуги краще ставити в конкретні години. Timviz допомагає зробити графік більш керованим і рівним: клієнти не чекають зайве, а майстер не працює в постійному авралі. Програма для барбершопу у такому форматі підтримує і сервіс, і бізнес-показники. Тому запис клієнтів онлайн перестає бути хаотичним набором повідомлень та перетворюється на повноцінну систему зростання для барбера або команди."
];

const screenshotsByLanguage: Record<SiteLanguage, { day: string; week: string; month: string }> = {
  ru: { day: "/for-business/ru-day.png", week: "/for-business/ru-week.png", month: "/for-business/ru-month.png" },
  uk: { day: "/for-business/uk-day.png", week: "/for-business/uk-week.png", month: "/for-business/uk-month.png" },
  en: { day: "/for-business/en-day.png", week: "/for-business/en-week.png", month: "/for-business/en-month.png" }
};

const barberPathByLanguage: Record<SiteLanguage, string> = {
  uk: "/uk/dlya-barberiv",
  ru: "/ru/dlya-barberov",
  en: "/en/for-barbers"
};

const copy: Record<SiteLanguage, Copy> = {
  uk: {
    home: "Головна",
    forBusiness: "Для бізнесу",
    title: "Онлайн-запис для барберів",
    subtitle: "Приймайте записи клієнтів онлайн, керуйте графіком і не губіть клієнтів",
    ctaPrimary: "Почати приймати записи за 2 хвилини",
    ctaSecondary: "Почати приймати записи за 2 хвилини",
    ctaAfterFeatures: "Почати приймати записи за 2 хвилини",
    ctaFinal: "Почати приймати записи за 2 хвилини",
    ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
    microcopy: "Без сайту • без складних налаштувань • безкоштовно",
    sampleClient: "Клієнт: Ігор П.",
    sampleService: "Стрижка + борода · 60 хв",
    sampleStatus: "Статус: Підтверджено",
    problemsTitle: "Знайомо барберу?",
    problems: [
      { title: "Клієнти пишуть у месенджери", text: "Записи залишаються в чатах і губляться." },
      { title: "Записи плутаються", text: "Складно зрозуміти хто записаний і коли." },
      { title: "Різна тривалість послуг", text: "Стрижка, борода і комплекс займають різний час." },
      { title: "Накладки по часу", text: "Клієнти можуть бути записані одночасно." },
      { title: "Клієнти не приходять", text: "Без нагадувань клієнти забувають." },
      { title: "Немає контролю дня", text: "Складно побачити вільні вікна." }
    ],
    solutionTitle: "Timviz вирішує це",
    solutionCards: [
      { title: "Онлайн-запис 24/7", text: "Клієнти записуються самі без дзвінків." },
      { title: "Календар записів", text: "Усі записи в одному місці." },
      { title: "Послуги з ціною", text: "Клієнт бачить ціну і час." },
      { title: "Графік роботи", text: "Контроль робочих днів." },
      { title: "Telegram", text: "Записи приходять миттєво." },
      { title: "Сторінка запису", text: "Клієнти записуються самі." }
    ],
    nicheTitle: "Ідеально для барберів і барбершопів",
    nicheText: "Timviz підходить для щільного графіка барбершопу та різних форматів чоловічих послуг.",
    nicheItems: ["чоловічі стрижки", "fade", "борода", "комплексні послуги", "укладка"],
    nicheSample: "Стрижка + борода — 60 хв — 500 грн",
    howTitle: "Як це працює",
    howSteps: ["Створіть профіль", "Додайте послуги", "Почніть приймати записи"],
    compareTitle: "Без Timviz / З Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "З Timviz",
    compareLeft: ["записи в Instagram", "плутанина", "дзвінки"],
    compareRight: ["календар", "онлайн запис", "порядок"],
    telegramTitle: "Отримуйте записи в Telegram",
    telegramText: "Timviz надсилає нові записи й зміни графіка в Telegram, щоб ви реагували без затримок.",
    seoBlockTitle: "Програма для запису клієнтів для барберів",
    seoParagraphs: ukSeoParagraphs,
    faqTitle: "FAQ",
    faq: [
      { q: "Як працює онлайн-запис для барбера?", a: "Клієнт обирає послугу й час, а запис одразу з'являється у вашому календарі." },
      { q: "Чи можна задати різну тривалість послуг?", a: "Так, для стрижки, бороди або комплексу задається окрема тривалість і ціна." },
      { q: "Чи підходить Timviz для одного барбера?", a: "Так, сервіс підходить і приватному майстру, і невеликому барбершопу." },
      { q: "Чи потрібен окремий сайт?", a: "Ні, достатньо профілю Timviz і посилання на клієнтську сторінку запису." },
      { q: "Чи є календар записів барбер?", a: "Так, ви бачите всі візити, статуси і вільні вікна в одному календарі." },
      { q: "Чи є Telegram-сповіщення?", a: "Так, ви отримуєте сповіщення про нові записи, переноси й скасування." },
      { q: "Чи можна почати безкоштовно?", a: "Так, старт безкоштовний і запуск займає кілька хвилин." },
      { q: "Чи підходить Timviz для барбершопу з командою?", a: "Так, система допомагає координувати графіки кількох майстрів без накладок." }
    ],
    finalTitle: "Запустіть онлайн-запис для барбера вже сьогодні",
    finalText: "Створіть профіль, додайте послуги та відкрийте клієнтам зручний онлайн-запис без хаосу.",
    usefulLinksTitle: "Корисні посилання",
    usefulLinks: [
      { label: "Для бізнесу", href: "/for-business" },
      { label: "Для майстрів манікюру", href: "/dlya-manikyuru" },
      { label: "Для перукарів", href: "/dlya-perukariv" },
      { label: "Для косметологів", href: "/dlya-kosmetologiv" }
    ],
    otherTitle: "Інші напрямки",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами",
    altCalendar: "Календар записів для барберів у Timviz",
    altServices: "Послуги та ціни барбера у Timviz",
    altTelegram: "Telegram сповіщення про записи для барберів у Timviz"
  },
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для барберов",
    subtitle: "Управляйте записями клиентов, графиком и услугами без хаоса в мессенджерах",
    ctaPrimary: "Начать принимать записи за 2 минуты",
    ctaSecondary: "Посмотреть возможности",
    ctaAfterFeatures: "Начать принимать записи за 2 минуты",
    ctaFinal: "Начать принимать записи за 2 минуты",
    ctaHint: "Без сложных настроек • без сайта • бесплатно",
    microcopy: "Без сложных настроек • без сайта • бесплатно",
    sampleClient: "Клиент: Игорь П.",
    sampleService: "Стрижка + борода · 60 мин",
    sampleStatus: "Статус: Подтверждено",
    problemsTitle: "Знакомо барберу?",
    problems: [
      { title: "Клиенты пишут в Instagram", text: "Записи остаются в чатах и их легко потерять." },
      { title: "Записи теряются", text: "Сложно понять кто записан и на какое время." },
      { title: "Разная длительность услуг", text: "Стрижка, борода и комплекс занимают разное время." },
      { title: "Накладки по времени", text: "Клиенты могут быть записаны одновременно." },
      { title: "Клиенты забывают", text: "Без напоминаний клиенты не приходят." },
      { title: "Нет контроля графика", text: "Сложно видеть свободные окна." }
    ],
    solutionTitle: "Timviz решает это",
    solutionCards: [
      { title: "Онлайн-запись 24/7", text: "Клиенты записываются сами без звонков." },
      { title: "Календарь записей", text: "Все записи в одном месте." },
      { title: "Услуги с ценой", text: "Клиент видит стоимость и длительность." },
      { title: "График работы", text: "Настройте рабочие дни." },
      { title: "Telegram", text: "Получайте записи мгновенно." },
      { title: "Страница записи", text: "Клиенты записываются сами." }
    ],
    nicheTitle: "Идеально для барберов",
    nicheText: "Timviz подходит для плотного графика барбершопа и разных форматов мужских услуг.",
    nicheItems: ["мужские стрижки", "борода", "комплексные услуги", "fade", "укладки"],
    nicheSample: "Стрижка + борода — 60 мин — 500 грн",
    howTitle: "Как это работает",
    howSteps: ["Создайте профиль", "Добавьте услуги", "Начните принимать записи"],
    compareTitle: "Без Timviz / С Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "С Timviz",
    compareLeft: ["записи в мессенджерах", "ручные уточнения", "накладки в графике", "потерянные сообщения"],
    compareRight: ["онлайн-запись клиентов", "единый календарь", "цены и длительность", "Telegram-уведомления"],
    telegramTitle: "Получайте записи в Telegram",
    telegramText: "Timviz отправляет новые записи и изменения графика в Telegram без задержек.",
    seoBlockTitle: "Программа для записи клиентов для барберов",
    seoParagraphs: [
      "Timviz помогает барберам принимать онлайн-запись клиентов и держать график под контролем.",
      "Сервис объединяет календарь, услуги, цены и длительность в одном кабинете.",
      "Это практичный способ уменьшить хаос в мессенджерах и повысить конверсию в реальные визиты."
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "Как работает онлайн-запись для барбера?", a: "Клиент выбирает услугу и время, а запись сразу попадает в календарь." },
      { q: "Можно ли указать разную длительность услуг?", a: "Да, для каждой услуги задается отдельная длительность и цена." },
      { q: "Подходит ли Timviz одному мастеру?", a: "Да, сервис подходит частным мастерам и небольшим барбершопам." },
      { q: "Нужен ли отдельный сайт?", a: "Нет, достаточно профиля Timviz и ссылки на страницу записи." },
      { q: "Есть ли Telegram-уведомления?", a: "Да, вы получаете уведомления о новых записях и переносах." },
      { q: "Можно ли начать бесплатно?", a: "Да, старт бесплатный, запуск занимает несколько минут." }
    ],
    finalTitle: "Запустите онлайн-запись для барбера уже сегодня",
    finalText: "Создайте профиль, добавьте услуги и откройте клиентам удобную онлайн-запись.",
    usefulLinksTitle: "Полезные ссылки",
    usefulLinks: [
      { label: "Для бизнеса", href: "/for-business" },
      { label: "Для мастеров маникюра", href: "/dlya-manikyura" },
      { label: "Для парикмахеров", href: "/dlya-parikmaherov" },
      { label: "Для косметологов", href: "/dlya-kosmetologov" }
    ],
    otherTitle: "Другие направления",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    altCalendar: "Календарь записей для барберов в Timviz",
    altServices: "Услуги и цены барбера в Timviz",
    altTelegram: "Telegram уведомления о записях для барберов в Timviz"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    title: "Online booking for barbers",
    subtitle: "Manage client bookings, schedule and services without messenger chaos",
    ctaPrimary: "Start taking bookings in 2 minutes",
    ctaSecondary: "See features",
    ctaAfterFeatures: "Start taking bookings in 2 minutes",
    ctaFinal: "Start taking bookings in 2 minutes",
    ctaHint: "No complex setup • no website • free start",
    microcopy: "No complex setup • no website • free start",
    sampleClient: "Client: Igor P.",
    sampleService: "Haircut + beard · 60 min",
    sampleStatus: "Status: Confirmed",
    problemsTitle: "Common barber issues",
    problems: [
      { title: "Clients text in Instagram", text: "Bookings stay in chats and are easy to miss." },
      { title: "Bookings get lost", text: "Hard to see who is booked and for what time." },
      { title: "Different service duration", text: "Haircut, beard and combos take different time." },
      { title: "Time overlaps", text: "Clients can end up booked at the same time." },
      { title: "Clients forget", text: "Without reminders people often no-show." },
      { title: "No schedule control", text: "Hard to spot available time slots quickly." }
    ],
    solutionTitle: "Timviz solves this",
    solutionCards: [
      { title: "24/7 online booking", text: "Clients book on their own without calls." },
      { title: "Booking calendar", text: "All bookings in one place." },
      { title: "Services with pricing", text: "Clients see duration and price upfront." },
      { title: "Work schedule", text: "Set working days and hours." },
      { title: "Telegram", text: "Get booking updates instantly." },
      { title: "Booking page", text: "Clients book by link on their own." }
    ],
    nicheTitle: "Perfect for barbers",
    nicheText: "Built for high-load barbershop schedules and mixed service durations.",
    nicheItems: ["men's haircuts", "beard", "combo services", "fade", "styling"],
    nicheSample: "Haircut + beard — 60 min — 500 UAH",
    howTitle: "How it works",
    howSteps: ["Create profile", "Add services", "Start taking bookings"],
    compareTitle: "Without Timviz / With Timviz",
    compareLeftTitle: "Without Timviz",
    compareRightTitle: "With Timviz",
    compareLeft: ["messenger-based bookings", "manual checks", "time conflicts", "lost messages"],
    compareRight: ["online bookings", "single calendar", "pricing + duration", "Telegram alerts"],
    telegramTitle: "Receive bookings in Telegram",
    telegramText: "Timviz sends new bookings and schedule updates directly to Telegram.",
    seoBlockTitle: "Client booking software for barbers",
    seoParagraphs: [
      "Timviz helps barbers accept online client bookings and manage dense schedules with less manual work.",
      "You can keep services, prices and durations structured in one booking calendar.",
      "It is a practical way to improve conversion and reduce booking errors."
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "How does online barber booking work?", a: "Clients pick a service and time, and the visit appears in your calendar." },
      { q: "Can I set different durations?", a: "Yes, each barber service has independent duration and price." },
      { q: "Is it suitable for solo barbers?", a: "Yes, Timviz works for solo specialists and barbershop teams." },
      { q: "Do I need a website?", a: "No, your Timviz profile and booking link are enough." },
      { q: "Are Telegram alerts available?", a: "Yes, you receive alerts for new and updated bookings." },
      { q: "Can I start for free?", a: "Yes, free start is available and setup takes minutes." }
    ],
    finalTitle: "Launch barber online booking today",
    finalText: "Create profile, add services and open convenient online booking for your clients.",
    usefulLinksTitle: "Useful links",
    usefulLinks: [
      { label: "For business", href: "/for-business" },
      { label: "For nail technicians", href: "/for-nail-technicians" },
      { label: "For hairdressers", href: "/for-hairdressers" },
      { label: "For cosmetologists", href: "/for-cosmetologists" }
    ],
    otherTitle: "Other directions",
    privacy: "Privacy policy",
    terms: "Terms of use",
    footerText: "Timviz for business · online client booking and service management",
    altCalendar: "Barber booking calendar in Timviz",
    altServices: "Barber services and pricing in Timviz",
    altTelegram: "Telegram booking notifications for barbers in Timviz"
  }
};

export function buildBarberMetadata(lang: SiteLanguage, pathname: string): Metadata {
  const title =
    lang === "uk"
      ? "Онлайн-запис для барберів — календар і CRM | Timviz"
      : lang === "ru"
        ? "Онлайн-запись для барберов — календарь и CRM | Timviz"
        : "Online booking for barbers — calendar & CRM | Timviz";

  const description =
    lang === "uk"
      ? "Timviz — онлайн-запис для барберів: календар записів, послуги, ціни, графік роботи і Telegram-сповіщення."
      : lang === "ru"
        ? "Timviz — онлайн-запись для барберов: календарь записей, услуги, цены, график работы и Telegram-уведомления."
        : "Timviz is online booking software for barbers with booking calendar, service pricing, work schedule and Telegram alerts.";

  const metadata = buildMetadata(pathname, { title, description }, lang);
  return {
    ...metadata,
    alternates: {
      canonical: `https://timviz.com${pathname}`,
      languages: {
        uk: `https://timviz.com${barberPathByLanguage.uk}`,
        ru: `https://timviz.com${barberPathByLanguage.ru}`,
        en: `https://timviz.com${barberPathByLanguage.en}`,
        "x-default": `https://timviz.com${barberPathByLanguage.en}`
      }
    }
  };
}

export default function BarberLanding({ language }: { language: SiteLanguage }) {
  const t = copy[language];
  const screenshots = screenshotsByLanguage[language];
  const otherKeys = nicheKeys.filter((key) => key !== "barbers");

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
        item: `https://timviz.com${barberPathByLanguage[language]}`
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
          </div>
          <small>{t.microcopy}</small>
        </div>
        <aside className="manicure-hero-card">
          <img src={screenshots.day} alt={t.altCalendar} loading="lazy" />
          <div>
            <strong>{t.sampleClient}</strong>
            <p>{t.sampleService}</p>
            <span>{t.sampleStatus}</span>
          </div>
        </aside>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.problemsTitle}</h2></div>
        <div className="hair-card-grid">
          {t.problems.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="business-feature-section" id="solution">
        <div className="business-section-head"><h2>{t.solutionTitle}</h2></div>
        <div className="hair-card-grid">
          {t.solutionCards.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="business-seo-section hair-cta-inline">
        <a className="business-primary" href="/pro/create-account">{t.ctaAfterFeatures}</a>
        <small className="hair-cta-caption">{t.ctaHint}</small>
      </section>

      <section className="business-feature-section niche-showcase-section">
        <div className="niche-showcase-copy">
          <div className="business-section-head">
            <h2>{t.nicheTitle}</h2>
            <p>{t.nicheText}</p>
          </div>
          <ul className="business-seo-list">{t.nicheItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <article className="manicure-service-card niche-showcase-card">
          <img src={screenshots.week} alt={t.altServices} loading="lazy" />
          <strong>{t.nicheSample}</strong>
        </article>
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
        <img src={screenshots.month} alt={t.altTelegram} loading="lazy" className="manicure-telegram-image" />
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.seoBlockTitle}</h2></div>
        <div className="hair-seo-text">
          {t.seoParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.otherTitle}</h2></div>
        <div className="niche-links-grid">
          {otherKeys.map((key) => {
            const card = nicheCards[key][language];
            return (
              <a className="niche-link-card" href={getLocalizedPath(language, `/${getNicheSlug(language, key)}`)} key={key}>
                <h3>{card.shortTitle}</h3>
                <p>{card.description}</p>
                <span className="niche-link-arrow" aria-hidden="true">→</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.usefulLinksTitle}</h2></div>
        <div className="business-footer-links">
          {t.usefulLinks.map((link) => (
            <a key={link.href} href={getLocalizedPath(language, link.href)}>{link.label}</a>
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
        <a className="business-primary" href="/pro/create-account">{t.ctaFinal}</a>
        <small className="hair-cta-caption">{t.ctaHint}</small>
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
