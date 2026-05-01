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
        "Ви додаєте послуги манікюру та тривалість, а клієнт бронює вільний час самостійно.",
        "Запис одразу потрапляє у календар, а зміни приходять у Telegram без ручних переписок."
      ],
      importanceTitle: "Чому це важливо для майстрів манікюру",
      importanceText:
        "У nail-сфері процедури мають різну тривалість, тому точний календар і швидкі нагадування напряму впливають на дохід і повторні візити.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для майстрів манікюру",
      seoIntro:
        "Timviz допомагає майстрам манікюру автоматизувати запис без переписок у чатах. Клієнт обирає процедуру та вільний слот, а майстер одразу бачить підтверджений візит у календарі.",
      seoChecklist: [
        "онлайн запис манікюр",
        "календар корекцій і повторних візитів",
        "послуги з тривалістю процедур",
        "контроль вільних вікон"
      ],
      seoOutro:
        "Такий формат зменшує пропуски, допомагає щільніше заповнювати день і підвищує частку повторних записів."
    },
    hairdressers: {
      cta: "Почати приймати записи за 2 хвилини",
      ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
      valueTitle: "Що це дає",
      valueItems: ["менше дзвінків", "більше записів", "порядок", "контроль графіка"],
      howTitle: "Як працює онлайн запис",
      howText: [
        "Перукар налаштовує стрижки, фарбування, укладки та тривалість кожної послуги.",
        "Клієнти бронюють час онлайн, а календар одразу показує завантаження дня без накладок."
      ],
      importanceTitle: "Чому це важливо для перукарів",
      importanceText:
        "У перукарській практиці короткі й довгі послуги чергуються протягом дня, тому контроль тривалості і вільних слотів критичний.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для перукарів",
      seoIntro:
        "Timviz для перукарів прибирає хаос у записах на стрижки та фарбування. Клієнт бронює зручний час сам, а майстер працює з чітким графіком без ручних підтверджень.",
      seoChecklist: [
        "онлайн запис для перукарів",
        "календар стрижок і фарбувань",
        "тривалість коротких і довгих послуг",
        "контроль завантаження зміни"
      ],
      seoOutro:
        "Сервіс прискорює підтвердження візитів, знижує накладки та дає стабільніший потік записів протягом тижня."
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
        "Timviz для барберів і барбершопів структурує запис на стрижки, бороду та комплекси. Клієнт бронює слот онлайн, а команда бачить актуальний розклад у реальному часі.",
      seoChecklist: [
        "онлайн запис барбер",
        "календар стрижок і бороди",
        "контроль щільного графіка зміни",
        "швидкі повторні записи клієнтів"
      ],
      seoOutro:
        "У результаті менше затримок, рівніша посадка по часу і вища конверсія звернень у візити."
    },
    cosmetologists: {
      cta: "Почати приймати записи за 2 хвилини",
      ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
      valueTitle: "Що це дає",
      valueItems: ["менше дзвінків", "більше записів", "порядок", "контроль графіка"],
      howTitle: "Як працює онлайн запис",
      howText: [
        "Ви додаєте процедури, тривалість і доступні години для прийому.",
        "Клієнт записується онлайн, а система фіксує візит у календарі та надсилає оновлення миттєво."
      ],
      importanceTitle: "Чому це важливо для косметологів",
      importanceText:
        "Косметологічні процедури мають різний таймінг, тому без структури легко втратити контроль над курсами і повторними візитами.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для косметологів",
      seoIntro:
        "Timviz допомагає косметологам вести записи на процедури без плутанини в чатах. Клієнти обирають зручний час онлайн, а ви контролюєте навантаження по днях і курсах.",
      seoChecklist: [
        "онлайн запис косметолог",
        "календар процедур і курсів",
        "контроль повторних візитів",
        "планування довгих і коротких сеансів"
      ],
      seoOutro:
        "Це покращує дисципліну графіка, спрощує повторні курси та зменшує навантаження на ручну комунікацію."
    },
    massage: {
      cta: "Почати приймати записи за 2 хвилини",
      ctaHint: "Без сайту • без складних налаштувань • безкоштовно",
      valueTitle: "Що це дає",
      valueItems: ["менше дзвінків", "більше записів", "порядок", "контроль графіка"],
      howTitle: "Як працює онлайн запис",
      howText: [
        "Масажист задає сеанси на 30, 60, 90 хвилин і налаштовує робочі вікна.",
        "Клієнти обирають зручний час онлайн, а записи одразу з'являються у календарі без дублювань."
      ],
      importanceTitle: "Чому це важливо для масажистів",
      importanceText:
        "У масажній практиці точна тривалість і буфери між сеансами напряму впливають на ритм дня, втому майстра та прибуток.",
      trustTitle: "Вже використовують майстри по Україні",
      seoTitle: "Програма для запису клієнтів для масажистів",
      seoIntro:
        "Timviz допомагає масажистам перейти від хаотичних заявок у месенджерах до структурованого запису. Клієнт обирає тип масажу і час, а ви керуєте щільністю дня у календарі.",
      seoChecklist: [
        "онлайн запис масаж",
        "календар сеансів 30/60/90 хв",
        "контроль буферів між сеансами",
        "менше накладок у розкладі"
      ],
      seoOutro:
        "Це дозволяє уникати накладок, краще заповнювати короткі вікна та стабільно приймати більше підтверджених сеансів."
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
        "Вы добавляете услуги маникюра и длительность, а клиент сам выбирает свободное время.",
        "Запись сразу попадает в календарь, а изменения приходят в Telegram без ручных переписок."
      ],
      importanceTitle: "Почему это важно для мастера маникюра",
      importanceText:
        "В nail-сфере услуги сильно отличаются по времени, поэтому точный календарь и уведомления напрямую влияют на загрузку и повторные визиты.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для мастеров маникюра",
      seoIntro:
        "Timviz помогает мастерам маникюра автоматизировать запись без бесконечных переписок. Клиент выбирает процедуру и свободное окно, а мастер сразу получает подтвержденный визит в календаре.",
      seoChecklist: [
        "онлайн запись маникюр",
        "календарь коррекций и повторных визитов",
        "услуги с длительностью процедур",
        "контроль свободных окон"
      ],
      seoOutro:
        "Такой формат снижает пропуски, помогает плотнее заполнять день и повышает долю повторных записей."
    },
    hairdressers: {
      cta: "Начать принимать записи за 2 минуты",
      ctaHint: "Без сайта • без сложных настроек • бесплатно",
      valueTitle: "Что это дает",
      valueItems: ["меньше звонков", "больше записей", "порядок", "контроль графика"],
      howTitle: "Как работает онлайн запись",
      howText: [
        "Парикмахер настраивает стрижки, окрашивания, укладки и длительность каждой услуги.",
        "Клиент бронирует время онлайн, а календарь сразу показывает актуальную загрузку без накладок."
      ],
      importanceTitle: "Почему это важно для парикмахеров",
      importanceText:
        "В одном дне чередуются короткие стрижки и длинные окрашивания, поэтому без структуры расписание быстро разваливается.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для парикмахеров",
      seoIntro:
        "Timviz для парикмахеров убирает хаос в записях на стрижки и окрашивания. Клиент бронирует время сам, а мастер работает по четкому графику без ручных подтверждений.",
      seoChecklist: [
        "онлайн запись для парикмахеров",
        "календарь стрижек и окрашиваний",
        "контроль коротких и длинных услуг",
        "ровная загрузка смены"
      ],
      seoOutro:
        "Сервис сокращает ручные согласования, снижает накладки и помогает стабильно наращивать количество подтвержденных визитов."
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
        "Timviz для барберов и барбершопов структурирует запись на стрижки, бороду и комплексы. Клиент бронирует слот онлайн, а команда видит актуальный график в реальном времени.",
      seoChecklist: [
        "онлайн запись барбер",
        "календарь стрижек и бороды",
        "контроль плотного графика",
        "быстрые повторные записи"
      ],
      seoOutro:
        "В итоге меньше задержек, выше загрузка кресла и больше повторных визитов благодаря прозрачному пути записи."
    },
    cosmetologists: {
      cta: "Начать принимать записи за 2 минуты",
      ctaHint: "Без сайта • без сложных настроек • бесплатно",
      valueTitle: "Что это дает",
      valueItems: ["меньше звонков", "больше записей", "порядок", "контроль графика"],
      howTitle: "Как работает онлайн запись",
      howText: [
        "Вы добавляете процедуры, длительность и рабочие окна.",
        "Клиенты записываются онлайн, а система сразу фиксирует визит и обновляет календарь."
      ],
      importanceTitle: "Почему это важно для косметологов",
      importanceText:
        "Процедуры отличаются по длительности и формату, поэтому без структуры сложно удерживать качество и повторные курсы.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для косметологов",
      seoIntro:
        "Timviz помогает косметологам вести запись на процедуры без хаоса в чатах. Клиенты выбирают удобное время онлайн, а вы контролируете загрузку по дням и курсам.",
      seoChecklist: [
        "онлайн запись косметолог",
        "календарь процедур и курсов",
        "контроль повторных визитов",
        "планирование длинных и коротких сеансов"
      ],
      seoOutro:
        "Это повышает конверсию в визиты, упрощает повторные записи по курсам и снижает нагрузку на администрирование."
    },
    massage: {
      cta: "Начать принимать записи за 2 минуты",
      ctaHint: "Без сайта • без сложных настроек • бесплатно",
      valueTitle: "Что это дает",
      valueItems: ["меньше звонков", "больше записей", "порядок", "контроль графика"],
      howTitle: "Как работает онлайн запись",
      howText: [
        "Массажист настраивает сеансы 30, 60 и 90 минут, длительность и рабочие часы.",
        "Клиенты выбирают удобный слот онлайн, а записи сразу появляются в календаре без дублей."
      ],
      importanceTitle: "Почему это важно для массажистов",
      importanceText:
        "В массажной практике важно правильно расставлять буферы между сеансами, чтобы избежать накладок и перегрузки.",
      trustTitle: "Уже используют мастера по Украине",
      seoTitle: "Программа для записи клиентов для массажистов",
      seoIntro:
        "Timviz помогает массажистам перейти от чатов к структурированной онлайн записи. Клиент выбирает тип массажа и время, а специалист управляет загрузкой в календаре в реальном времени.",
      seoChecklist: [
        "онлайн запись массаж",
        "календарь сеансов 30/60/90 минут",
        "контроль буферов между сеансами",
        "меньше накладок в расписании"
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
        "You set nail services and duration once, and clients book available time on their own.",
        "Each booking appears in your calendar instantly, with Telegram updates for changes."
      ],
      importanceTitle: "Why this matters for nail technicians",
      importanceText:
        "Nail services vary by duration, so accurate timing and visibility are key for repeat bookings and stable daily load.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for nail technicians",
      seoIntro:
        "Timviz helps nail technicians automate booking without endless chat back-and-forth. Clients choose a procedure and time slot, while you get confirmed visits directly in one calendar.",
      seoChecklist: [
        "online manicure booking",
        "calendar for corrections and repeat visits",
        "duration-based service setup",
        "free-slot control"
      ],
      seoOutro:
        "This setup reduces no-shows, fills short gaps between appointments and increases repeat booking share."
    },
    hairdressers: {
      cta: "Start taking bookings in 2 minutes",
      ctaHint: "No website • no complex setup • free",
      valueTitle: "What You Get",
      valueItems: ["fewer calls", "more bookings", "clear workflow", "schedule control"],
      howTitle: "How online booking works",
      howText: [
        "You configure haircuts, coloring, styling and duration in one dashboard.",
        "Clients book time online and your calendar updates immediately with real capacity."
      ],
      importanceTitle: "Why this matters for hairdressers",
      importanceText:
        "Hair schedules combine short and long appointments, so duration-aware planning is critical to avoid overlaps.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for hairdressers",
      seoIntro:
        "Timviz for hairdressers removes booking chaos for cuts and coloring. Clients self-book online, while professionals run a clean day plan without manual confirmations.",
      seoChecklist: [
        "online booking for hairdressers",
        "calendar for cuts and coloring",
        "short and long service control",
        "balanced shift workload"
      ],
      seoOutro:
        "You spend less time on coordination, prevent overlaps and keep chair utilization stable throughout the week."
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
        "Timviz for barbers and barbershops structures bookings for haircuts, beard work and combos. Clients book fast online, while teams keep schedules aligned in real time.",
      seoChecklist: [
        "online barber booking",
        "haircut and beard calendar",
        "dense-shift schedule control",
        "faster repeat appointments"
      ],
      seoOutro:
        "Result: fewer collisions, better daily chair utilization and stronger repeat-booking behavior."
    },
    cosmetologists: {
      cta: "Start taking bookings in 2 minutes",
      ctaHint: "No website • no complex setup • free",
      valueTitle: "What You Get",
      valueItems: ["fewer calls", "more bookings", "clear workflow", "schedule control"],
      howTitle: "How online booking works",
      howText: [
        "Add treatments, duration and working windows.",
        "Clients book online, and visits are saved to one live calendar with instant updates."
      ],
      importanceTitle: "Why this matters for cosmetologists",
      importanceText:
        "Different treatment formats need accurate timing, especially for repeat courses and high-density days.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for cosmetologists",
      seoIntro:
        "Timviz helps cosmetologists run treatment bookings without messenger chaos. Clients pick convenient time online, while specialists control workload across days and repeat courses.",
      seoChecklist: [
        "online booking for cosmetologists",
        "treatment and course calendar",
        "repeat-visit management",
        "short and long session planning"
      ],
      seoOutro:
        "This improves visit conversion, supports course continuity and reduces administrative overhead."
    },
    massage: {
      cta: "Start taking bookings in 2 minutes",
      ctaHint: "No website • no complex setup • free",
      valueTitle: "What You Get",
      valueItems: ["fewer calls", "more bookings", "clear workflow", "schedule control"],
      howTitle: "How online booking works",
      howText: [
        "Configure massage sessions for 30, 60 and 90 minutes with working windows.",
        "Clients book online and all appointments appear in one duration-aware calendar."
      ],
      importanceTitle: "Why this matters for massage therapists",
      importanceText:
        "Session length and recovery buffers directly impact daily performance, so schedule precision is essential.",
      trustTitle: "Already used by professionals across Ukraine",
      seoTitle: "Client booking software for massage therapists",
      seoIntro:
        "Timviz helps massage therapists move from fragmented chat requests to structured online booking. Clients choose massage type and time, while specialists manage workload and buffers from one calendar.",
      seoChecklist: [
        "online massage booking",
        "30/60/90-minute session calendar",
        "buffer control between sessions",
        "fewer schedule overlaps"
      ],
      seoOutro:
        "You reduce overlaps, improve slot utilization and keep bookings predictable even in dense schedules."
    }
  }
};

export function getNicheUxContent(language: SiteLanguage, key: NicheUxKey): NicheUxContent {
  return byLanguage[language][key];
}
