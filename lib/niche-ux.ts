import type { SiteLanguage } from "./site-language";

export type NicheUxKey =
  | "manicure"
  | "hairdressers"
  | "barbers"
  | "cosmetologists"
  | "massage";

type NicheUxContent = {
  cta: string;
  ctaHint: string;
  valueTitle: string;
  valueItems: string[];
  howTitle: string;
  howText: string[];
  importanceTitle: string;
  importanceText: string;
  trustTitle: string;
  seoTitle: string;
  seoIntro: string;
  seoChecklist: string[];
  seoOutro: string;
};

const byLanguage: Record<SiteLanguage, Record<NicheUxKey, NicheUxContent>> = {
  uk: {
    manicure: {
      cta: "Почати приймати записи за 2 хвилини",
      ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
      valueTitle: "Що це дає",
      valueItems: ["менше дзвінків", "більше записів", "порядок", "контроль графіка"],
      howTitle: "Як працює онлайн запис",
      howText: [
        "Ви додаєте послуги манікюру, тривалість і ціни, а клієнт бронює вільний час самостійно.",
        "Запис одразу потрапляє у календар, а зміни приходять у Telegram без ручних переписок."
      ],
      importanceTitle: "Чому це важливо для майстрів манікюру",
      importanceText:
        "У nail-сфері процедури мають різну тривалість, тому точний календар і швидкі нагадування напряму впливають на дохід і повторні візити.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для майстрів манікюру",
      seoIntro:
        "Timviz — це практична програма для онлайн запису клієнтів у сфері манікюру. Клієнт бачить послугу, ціну, тривалість і вільний час, а ви отримуєте підтверджений візит без хаосу в месенджерах.",
      seoChecklist: [
        "онлайн запис клієнтів",
        "календар записів",
        "послуги з ціною і тривалістю",
        "контроль графіка"
      ],
      seoOutro:
        "Такий формат зменшує пропуски, допомагає заповнювати вікна між процедурами і робить запис зрозумілим для нових та постійних клієнтів."
    },
    hairdressers: {
      cta: "Почати приймати записи за 2 хвилини",
      ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
      valueTitle: "Що це дає",
      valueItems: ["менше дзвінків", "більше записів", "порядок", "контроль графіка"],
      howTitle: "Як працює онлайн запис",
      howText: [
        "Перукар налаштовує послуги: стрижки, фарбування, укладки, тривалість і вартість.",
        "Клієнти бронюють час онлайн, а календар одразу показує завантаження дня без накладок."
      ],
      importanceTitle: "Чому це важливо для перукарів",
      importanceText:
        "У перукарській практиці короткі й довгі послуги чергуються протягом дня, тому контроль тривалості і вільних слотів критичний.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для перукарів",
      seoIntro:
        "Timviz допомагає перукарям приймати записи без втрат у чатах. Клієнт сам обирає послугу і вільний слот, а майстер бачить повну картину завантаження в одному календарі.",
      seoChecklist: [
        "онлайн запис клієнтів",
        "календар записів",
        "послуги з ціною і тривалістю",
        "контроль графіка"
      ],
      seoOutro:
        "Сервіс знижує кількість ручних узгоджень, прискорює підтвердження візитів і підвищує конверсію у реальні прийоми."
    },
    barbers: {
      cta: "Почати приймати записи за 2 хвилини",
      ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
      valueTitle: "Що це дає",
      valueItems: ["менше дзвінків", "більше записів", "порядок", "контроль графіка"],
      howTitle: "Як працює онлайн запис",
      howText: [
        "Барбер додає стрижки, бороду, fade і комплекси з точною тривалістю.",
        "Клієнт бронює слот за посиланням, а ви миттєво отримуєте запис і оновлення в Telegram."
      ],
      importanceTitle: "Чому це важливо для барберів",
      importanceText:
        "Щільний барбер-графік потребує точної посадки по часу: навіть одна накладка тягне затримки на всю зміну.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для барберів",
      seoIntro:
        "Timviz дає барберам керований онлайн запис клієнтів: послуги, тривалість, ціни і графік в одному інтерфейсі. Клієнт бронює самостійно, а команда бачить актуальний розклад без ручних чатів.",
      seoChecklist: [
        "онлайн запис клієнтів",
        "календар записів",
        "послуги з ціною і тривалістю",
        "контроль графіка"
      ],
      seoOutro:
        "У результаті менше накладок, краща щоденна завантаженість і стабільніший потік повторних візитів у барбершопі."
    },
    cosmetologists: {
      cta: "Почати приймати записи за 2 хвилини",
      ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
      valueTitle: "Що це дає",
      valueItems: ["менше дзвінків", "більше записів", "порядок", "контроль графіка"],
      howTitle: "Як працює онлайн запис",
      howText: [
        "Ви задаєте процедури, ціну, тривалість і доступні години для прийому.",
        "Клієнт записується онлайн, а система фіксує візит у календарі та надсилає оновлення миттєво."
      ],
      importanceTitle: "Чому це важливо для косметологів",
      importanceText:
        "Косметологічні процедури мають різний таймінг, тому без структури легко втратити контроль над курсами і повторними візитами.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для косметологів",
      seoIntro:
        "Timviz допомагає косметологам приймати онлайн записи без плутанини. Клієнти бачать процедури, ціну і час, а ви отримуєте прогнозований розклад з урахуванням довгих і коротких сеансів.",
      seoChecklist: [
        "онлайн запис клієнтів",
        "календар записів",
        "послуги з ціною і тривалістю",
        "контроль графіка"
      ],
      seoOutro:
        "Це покращує дисципліну графіка, спрощує повторні курси і підвищує якість сервісу без складної CRM-інфраструктури."
    },
    massage: {
      cta: "Почати приймати записи за 2 хвилини",
      ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
      valueTitle: "Що це дає",
      valueItems: ["менше дзвінків", "більше записів", "порядок", "контроль графіка"],
      howTitle: "Як працює онлайн запис",
      howText: [
        "Масажист задає сеанси на 30, 60, 90 хвилин, ціни та робочі вікна.",
        "Клієнти обирають зручний час онлайн, а записи одразу з'являються у календарі без дублювань."
      ],
      importanceTitle: "Чому це важливо для масажистів",
      importanceText:
        "У масажній практиці точна тривалість і буфери між сеансами напряму впливають на ритм дня, втому майстра та прибуток.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для масажистів",
      seoIntro:
        "Timviz допомагає масажистам перейти від чатів до структурованої онлайн-запису. Клієнт бачить тип масажу, тривалість і ціну, а ви керуєте завантаженням у календарі в реальному часі.",
      seoChecklist: [
        "онлайн запис клієнтів",
        "календар записів",
        "послуги з ціною і тривалістю",
        "контроль графіка"
      ],
      seoOutro:
        "Це дозволяє уникати накладок, краще заповнювати короткі вікна і стабільно приймати більше підтверджених сеансів."
    }
  },
  ru: {
    manicure: {
      cta: "Начать принимать записи за 2 минуты",
      ctaHint: "Без сайта • без сложных настроек • бесплатно",
      valueTitle: "Что это дает",
      valueItems: ["меньше звонков", "больше записей", "порядок", "контроль графика"],
      howTitle: "Как работает онлайн запись",
      howText: [
        "Вы добавляете услуги маникюра, длительность и цены, а клиент сам выбирает свободное время.",
        "Запись сразу попадает в календарь, а изменения приходят в Telegram без ручных переписок."
      ],
      importanceTitle: "Почему это важно для мастера маникюра",
      importanceText:
        "В nail-сфере услуги сильно отличаются по времени, поэтому точный календарь и уведомления напрямую влияют на загрузку и повторные визиты.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для мастеров маникюра",
      seoIntro:
        "Timviz — это удобная программа для онлайн записи клиентов в сфере маникюра. Клиент видит услугу, цену, длительность и свободное время, а вы получаете подтвержденный визит без хаоса в мессенджерах.",
      seoChecklist: [
        "онлайн запись клиентов",
        "календарь записей",
        "услуги с ценой и длительностью",
        "контроль графика"
      ],
      seoOutro:
        "Такой формат снижает количество пропусков, помогает закрывать окна между процедурами и улучшает конверсию в повторные записи."
    },
    hairdressers: {
      cta: "Начать принимать записи за 2 минуты",
      ctaHint: "Без сайта • без сложных настроек • бесплатно",
      valueTitle: "Что это дает",
      valueItems: ["меньше звонков", "больше записей", "порядок", "контроль графика"],
      howTitle: "Как работает онлайн запись",
      howText: [
        "Парикмахер настраивает услуги, длительность и стоимость в одном кабинете.",
        "Клиент бронирует время онлайн, а календарь сразу показывает актуальную загрузку без накладок."
      ],
      importanceTitle: "Почему это важно для парикмахеров",
      importanceText:
        "В одном дне чередуются короткие стрижки и длинные окрашивания, поэтому без структуры расписание быстро разваливается.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для парикмахеров",
      seoIntro:
        "Timviz помогает парикмахерам принимать записи без потерь в чатах. Клиент выбирает услугу и время самостоятельно, а мастер видит полную картину дня в одном календаре.",
      seoChecklist: [
        "онлайн запись клиентов",
        "календарь записей",
        "услуги с ценой и длительностью",
        "контроль графика"
      ],
      seoOutro:
        "Сервис сокращает ручные согласования, повышает дисциплину визитов и помогает стабильно увеличивать количество подтвержденных записей."
    },
    barbers: {
      cta: "Начать принимать записи за 2 минуты",
      ctaHint: "Без сайта • без сложных настроек • бесплатно",
      valueTitle: "Что это дает",
      valueItems: ["меньше звонков", "больше записей", "порядок", "контроль графика"],
      howTitle: "Как работает онлайн запись",
      howText: [
        "Барбер задает услуги: стрижка, борода, fade, комплексы — с точной длительностью.",
        "Клиенты бронируют слот по ссылке, а вы получаете запись и обновления в Telegram мгновенно."
      ],
      importanceTitle: "Почему это важно для барберов",
      importanceText:
        "В плотном барбер-графике даже одна накладка тянет задержки на всю смену, поэтому контроль времени критичен.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для барберов",
      seoIntro:
        "Timviz дает барберам структурированную онлайн запись клиентов: услуги, цена, длительность и график в одном интерфейсе. Клиент записывается сам, а мастер работает по понятному расписанию без хаоса в мессенджерах.",
      seoChecklist: [
        "онлайн запись клиентов",
        "календарь записей",
        "услуги с ценой и длительностью",
        "контроль графика"
      ],
      seoOutro:
        "В итоге меньше накладок, выше ежедневная загрузка и больше повторных визитов благодаря прозрачному клиентскому пути."
    },
    cosmetologists: {
      cta: "Начать принимать записи за 2 минуты",
      ctaHint: "Без сайта • без сложных настроек • бесплатно",
      valueTitle: "Что это дает",
      valueItems: ["меньше звонков", "больше записей", "порядок", "контроль графика"],
      howTitle: "Как работает онлайн запись",
      howText: [
        "Вы добавляете процедуры, стоимость, длительность и рабочие окна.",
        "Клиенты записываются онлайн, а система сразу фиксирует визит и обновляет календарь."
      ],
      importanceTitle: "Почему это важно для косметологов",
      importanceText:
        "Процедуры отличаются по длительности и формату, поэтому без структуры сложно удерживать качество и повторные курсы.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для косметологов",
      seoIntro:
        "Timviz помогает косметологам принимать онлайн записи без путаницы. Клиенты видят процедуры, стоимость и время, а вы получаете управляемый график с учетом коротких и длинных сеансов.",
      seoChecklist: [
        "онлайн запись клиентов",
        "календарь записей",
        "услуги с ценой и длительностью",
        "контроль графика"
      ],
      seoOutro:
        "Это повышает конверсию в визиты, упрощает повторные записи по курсам и снижает нагрузку на ручную коммуникацию."
    },
    massage: {
      cta: "Начать принимать записи за 2 минуты",
      ctaHint: "Без сайта • без сложных настроек • бесплатно",
      valueTitle: "Что это дает",
      valueItems: ["меньше звонков", "больше записей", "порядок", "контроль графика"],
      howTitle: "Как работает онлайн запись",
      howText: [
        "Массажист настраивает сеансы 30, 60 и 90 минут, цены и рабочие часы.",
        "Клиенты выбирают удобный слот онлайн, а записи сразу появляются в календаре без дублей."
      ],
      importanceTitle: "Почему это важно для массажистов",
      importanceText:
        "В массажной практике важно правильно расставлять буферы между сеансами, чтобы избежать накладок и перегрузки.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для массажистов",
      seoIntro:
        "Timviz помогает массажистам перейти от чатов к структурированной онлайн записи. Клиент видит тип массажа, длительность и цену, а специалист управляет загрузкой в календаре в реальном времени.",
      seoChecklist: [
        "онлайн запись клиентов",
        "календарь записей",
        "услуги с ценой и длительностью",
        "контроль графика"
      ],
      seoOutro:
        "Система уменьшает накладки, помогает заполнять короткие окна и стабильно увеличивает количество подтвержденных сеансов."
    }
  },
  en: {
    manicure: {
      cta: "Start taking bookings in 2 minutes",
      ctaHint: "No website • no complex setup • free",
      valueTitle: "What You Get",
      valueItems: ["fewer calls", "more bookings", "clear workflow", "schedule control"],
      howTitle: "How online booking works",
      howText: [
        "You set services, duration and pricing once, and clients book available time on their own.",
        "Each booking appears in your calendar instantly, with Telegram updates for changes."
      ],
      importanceTitle: "Why this matters for nail technicians",
      importanceText:
        "Nail services vary by duration, so accurate timing and visibility are key for repeat bookings and stable daily load.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for nail technicians",
      seoIntro:
        "Timviz is practical online booking software for nail professionals. Clients see services, price, duration and free slots, while you receive confirmed appointments in one structured calendar instead of scattered chats.",
      seoChecklist: ["online client booking", "booking calendar", "services with price and duration", "schedule control"],
      seoOutro:
        "This setup reduces no-shows, helps fill short gaps between procedures and improves conversion into repeat visits."
    },
    hairdressers: {
      cta: "Start taking bookings in 2 minutes",
      ctaHint: "No website • no complex setup • free",
      valueTitle: "What You Get",
      valueItems: ["fewer calls", "more bookings", "clear workflow", "schedule control"],
      howTitle: "How online booking works",
      howText: [
        "You configure hair services, duration and pricing in one dashboard.",
        "Clients book time online and your calendar updates immediately with real capacity."
      ],
      importanceTitle: "Why this matters for hairdressers",
      importanceText:
        "Hair schedules combine short and long appointments, so duration-aware planning is critical to avoid overlaps.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for hairdressers",
      seoIntro:
        "Timviz helps hairdressers accept bookings without losing leads in messengers. Clients choose service and time themselves, while professionals get a clear day plan with pricing and duration in one place.",
      seoChecklist: ["online client booking", "booking calendar", "services with price and duration", "schedule control"],
      seoOutro:
        "You spend less time on manual coordination, confirm visits faster and keep your daily utilization more stable."
    },
    barbers: {
      cta: "Start taking bookings in 2 minutes",
      ctaHint: "No website • no complex setup • free",
      valueTitle: "What You Get",
      valueItems: ["fewer calls", "more bookings", "clear workflow", "schedule control"],
      howTitle: "How online booking works",
      howText: [
        "Set up haircut, beard and combo services with precise duration.",
        "Clients self-book by link and your schedule stays synchronized in real time."
      ],
      importanceTitle: "Why this matters for barbers",
      importanceText:
        "In high-load barber schedules, one overlap can delay the entire shift, so slot control is a core business metric.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for barbers",
      seoIntro:
        "Timviz gives barbers a conversion-focused booking flow: service structure, pricing, duration and real-time calendar updates in one interface. Clients book fast, and teams operate with less scheduling friction.",
      seoChecklist: ["online client booking", "booking calendar", "services with price and duration", "schedule control"],
      seoOutro:
        "Result: fewer collisions, better daily chair utilization and stronger repeat booking behavior."
    },
    cosmetologists: {
      cta: "Start taking bookings in 2 minutes",
      ctaHint: "No website • no complex setup • free",
      valueTitle: "What You Get",
      valueItems: ["fewer calls", "more bookings", "clear workflow", "schedule control"],
      howTitle: "How online booking works",
      howText: [
        "Add treatments with duration, price and work windows.",
        "Clients book online, and visits are saved to one live calendar with instant updates."
      ],
      importanceTitle: "Why this matters for cosmetologists",
      importanceText:
        "Different treatment formats need accurate timing, especially for repeat courses and high-density days.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for cosmetologists",
      seoIntro:
        "Timviz helps cosmetologists run structured online booking without manual chat chaos. Clients see treatment details before booking, while professionals get predictable schedules and fewer operational conflicts.",
      seoChecklist: ["online client booking", "booking calendar", "services with price and duration", "schedule control"],
      seoOutro:
        "This improves conversion quality, supports repeat-course planning and reduces admin overhead."
    },
    massage: {
      cta: "Start taking bookings in 2 minutes",
      ctaHint: "No website • no complex setup • free",
      valueTitle: "What You Get",
      valueItems: ["fewer calls", "more bookings", "clear workflow", "schedule control"],
      howTitle: "How online booking works",
      howText: [
        "Configure massage sessions for 30, 60 and 90 minutes with pricing.",
        "Clients book online and all appointments appear in one duration-aware calendar."
      ],
      importanceTitle: "Why this matters for massage therapists",
      importanceText:
        "Session length and recovery buffers directly impact daily performance, so schedule precision is essential.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for massage therapists",
      seoIntro:
        "Timviz helps massage therapists switch from fragmented chat requests to structured online booking. Clients choose service type, duration and price, while specialists manage workload and free windows from one place.",
      seoChecklist: ["online client booking", "booking calendar", "services with price and duration", "schedule control"],
      seoOutro:
        "You reduce overlaps, improve slot utilization and keep bookings predictable even in dense schedules."
    }
  }
};

export function getNicheUxContent(language: SiteLanguage, key: NicheUxKey): NicheUxContent {
  return byLanguage[language][key];
}
