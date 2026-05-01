import type { SeoCopy } from "./seo";
import type { SiteLanguage } from "./site-language";

export type NicheSlug =
  | "dlya-manikyuru"
  | "dlya-perukariv"
  | "dlya-barberiv"
  | "dlya-kosmetologiv"
  | "dlya-masazhu";

type NicheCardCopy = {
  shortTitle: string;
  description: string;
  icon: string;
};

type NichePageCopy = {
  h1: string;
  lead: string;
  body: string[];
};

type NicheItem = {
  slug: NicheSlug;
  card: Record<SiteLanguage, NicheCardCopy>;
  page: Record<SiteLanguage, NichePageCopy>;
  seo: Record<SiteLanguage, SeoCopy>;
};

export const nichePages: NicheItem[] = [
  {
    slug: "dlya-manikyuru",
    card: {
      uk: {
        shortTitle: "Для майстрів манікюру",
        description: "Онлайн-запис, послуги, ціни та календар для майстрів нігтьового сервісу.",
        icon: "💅"
      },
      ru: {
        shortTitle: "Для мастеров маникюра",
        description: "Онлайн-запись, услуги, цены и календарь для мастеров ногтевого сервиса.",
        icon: "💅"
      },
      en: {
        shortTitle: "For nail artists",
        description: "Online booking, pricing and calendar management for nail professionals.",
        icon: "💅"
      }
    },
    page: {
      uk: {
        h1: "Timviz для майстрів манікюру",
        lead: "Приймайте онлайн-запис 24/7, показуйте клієнтам вільні вікна та керуйте послугами без хаосу в месенджерах.",
        body: [
          "Timviz допомагає майстрам манікюру зібрати в одному місці запис, прайс і календар. Клієнт сам обирає дату, час і послугу, а ви отримуєте структуру замість постійних уточнень у чатах.",
          "У кабінеті легко налаштувати комбіновані послуги, тривалість і перерви між візитами. Це зручно для щільного графіка, коли важлива кожна година робочого дня."
        ]
      },
      ru: {
        h1: "Timviz для мастеров маникюра",
        lead: "Принимайте онлайн-запись 24/7, показывайте клиентам свободные окна и ведите услуги в одном календаре.",
        body: [
          "Timviz помогает мастерам маникюра собрать запись, прайс и рабочий график в едином кабинете. Клиенты сами выбирают услугу и время, а вы не тратите день на ручные переписки.",
          "Сервис удобно использовать для плотного расписания и повторных визитов. Вы видите загрузку дня заранее и можете гибко управлять окнами между процедурами."
        ]
      },
      en: {
        h1: "Timviz for nail artists",
        lead: "Run online booking 24/7, show available slots and manage services from one clear workspace.",
        body: [
          "Timviz helps nail artists keep bookings, service pricing and schedule in one place. Clients pick service and time on their own, so your day is less interrupted by manual chat coordination.",
          "You can configure durations, breaks and popular combinations for routine procedures. This keeps busy days predictable and improves booking flow for repeat clients."
        ]
      }
    },
    seo: {
      uk: {
        title: "Timviz для майстрів манікюру — онлайн-запис і календар",
        description: "Онлайн-запис для майстрів манікюру: календар, послуги, ціни та керування вільними вікнами в Timviz.",
        keywords: ["для майстрів манікюру", "онлайн-запис манікюр", "календар майстра манікюру", "Timviz"]
      },
      ru: {
        title: "Timviz для мастеров маникюра — онлайн-запись и календарь",
        description: "Онлайн-запись для мастеров маникюра: календарь, услуги, цены и управление свободными окнами в Timviz.",
        keywords: ["для мастеров маникюра", "онлайн-запись маникюр", "календарь мастера маникюра", "Timviz"]
      },
      en: {
        title: "Timviz for nail artists — online booking and calendar",
        description: "Online booking for nail artists with service management, pricing and calendar planning in Timviz.",
        keywords: ["nail artist booking software", "online booking nail services", "nail technician calendar", "Timviz"]
      }
    }
  },
  {
    slug: "dlya-perukariv",
    card: {
      uk: { shortTitle: "Для перукарів", description: "Керування записами, тривалістю послуг і графіком для перукарів.", icon: "✂" },
      ru: { shortTitle: "Для парикмахеров", description: "Управление записью, длительностью услуг и графиком для парикмахеров.", icon: "✂" },
      en: { shortTitle: "For hairdressers", description: "Booking, service duration and schedule tools for hairdressers.", icon: "✂" }
    },
    page: {
      uk: {
        h1: "Timviz для перукарів",
        lead: "Плануйте стрижки, фарбування та комплексні послуги без накладок у розкладі.",
        body: [
          "Перукарям важливо швидко управляти послугами різної тривалості. У Timviz ви задаєте тривалість і вартість кожної процедури, а клієнти записуються в зручні слоти онлайн.",
          "Календар показує завантаження на день, тиждень і місяць, тому легше балансувати короткі та довгі візити без перевантаження графіка."
        ]
      },
      ru: {
        h1: "Timviz для парикмахеров",
        lead: "Планируйте стрижки, окрашивания и комплексные услуги без пересечений в расписании.",
        body: [
          "Парикмахерам важно гибко работать с услугами разной длительности. В Timviz можно настроить время и стоимость каждой услуги, чтобы клиенты сразу выбирали подходящий слот.",
          "Календарь на день, неделю и месяц помогает видеть загрузку заранее и поддерживать стабильный поток записей без накладок."
        ]
      },
      en: {
        h1: "Timviz for hairdressers",
        lead: "Plan cuts, coloring and bundled services without schedule conflicts.",
        body: [
          "Hairdressers often juggle services with very different durations. Timviz lets you define service timing and pricing so clients can book accurate slots online.",
          "With daily, weekly and monthly views, you can balance quick sessions and long appointments while keeping your schedule predictable."
        ]
      }
    },
    seo: {
      uk: { title: "Timviz для перукарів — онлайн-запис і розклад", description: "Онлайн-запис для перукарів: календар, послуги та керування завантаженням робочого дня.", keywords: ["для перукарів", "онлайн-запис перукар", "календар перукаря", "Timviz"] },
      ru: { title: "Timviz для парикмахеров — онлайн-запись и расписание", description: "Онлайн-запись для парикмахеров: календарь, услуги и управление загрузкой рабочего дня.", keywords: ["для парикмахеров", "онлайн-запись парикмахер", "расписание парикмахера", "Timviz"] },
      en: { title: "Timviz for hairdressers — online booking and schedule", description: "Online booking and schedule management for hairdressers with service setup in Timviz.", keywords: ["hairdresser booking software", "hair salon schedule", "online hair appointment", "Timviz"] }
    }
  },
  {
    slug: "dlya-barberiv",
    card: {
      uk: { shortTitle: "Для барберів", description: "Щільний календар, повторні візити та швидкий онлайн-запис для барберів.", icon: "🪒" },
      ru: { shortTitle: "Для барберов", description: "Плотный календарь, повторные визиты и быстрая онлайн-запись для барберов.", icon: "🪒" },
      en: { shortTitle: "For barbers", description: "Keep a high-load calendar under control with quick online booking.", icon: "🪒" }
    },
    page: {
      uk: {
        h1: "Timviz для барберів",
        lead: "Контролюйте щільний потік записів та зменшуйте кількість дзвінків від клієнтів.",
        body: [
          "Для барберів важливий ритм і точність часу. Timviz дає клієнтам зрозумілий онлайн-запис, а вам - чіткий календар із реальними вільними слотами.",
          "Сервіс підходить для індивідуальних барберів і барбершопів: можна налаштувати набір послуг, тривалість та зручно вести повторні візити постійних клієнтів."
        ]
      },
      ru: {
        h1: "Timviz для барберов",
        lead: "Держите плотный поток записей под контролем и снижайте количество звонков от клиентов.",
        body: [
          "Для барберов важны ритм и точность тайминга. Timviz дает клиентам понятную онлайн-запись, а мастеру - четкий календарь со свободными слотами.",
          "Платформа подходит как для индивидуального барбера, так и для барбершопа: легко настроить услуги и стабильно вести повторные визиты."
        ]
      },
      en: {
        h1: "Timviz for barbers",
        lead: "Control high booking flow and reduce manual phone coordination.",
        body: [
          "Barbers rely on timing precision. Timviz gives clients a simple online booking experience while you keep a clear calendar with real-time availability.",
          "It works for solo barbers and busy barbershops alike, with flexible service setup and better consistency for repeat visits."
        ]
      }
    },
    seo: {
      uk: { title: "Timviz для барберів — онлайн-запис барбершопу", description: "Платформа онлайн-запису для барберів і барбершопів: календар, послуги та клієнти в одному кабінеті.", keywords: ["для барберів", "онлайн-запис барбершоп", "календар барбера", "Timviz"] },
      ru: { title: "Timviz для барберов — онлайн-запись барбершопа", description: "Онлайн-запись для барберов и барбершопов: календарь, услуги и клиенты в одном кабинете.", keywords: ["для барберов", "онлайн-запись барбершоп", "календарь барбера", "Timviz"] },
      en: { title: "Timviz for barbers — barbershop booking software", description: "Online booking and calendar management for barbers and barbershops in Timviz.", keywords: ["barber booking software", "barbershop online booking", "barber calendar", "Timviz"] }
    }
  },
  {
    slug: "dlya-kosmetologiv",
    card: {
      uk: { shortTitle: "Для косметологів", description: "Плануйте довгі процедури та керуйте щоденним завантаженням без стресу.", icon: "✨" },
      ru: { shortTitle: "Для косметологов", description: "Планируйте длительные процедуры и управляйте загрузкой дня без стресса.", icon: "✨" },
      en: { shortTitle: "For cosmetologists", description: "Organize longer procedures and keep daily workload balanced.", icon: "✨" }
    },
    page: {
      uk: {
        h1: "Timviz для косметологів",
        lead: "Створіть передбачуваний графік для процедур різної тривалості та складності.",
        body: [
          "У косметології важливо точно планувати час між клієнтами. Timviz дозволяє налаштувати послуги з тривалістю і ціною, щоб уникати накладок та перенесень.",
          "Завдяки онлайн-запису клієнти бронюють візит самостійно, а ви працюєте з уже впорядкованим календарем і бачите завантаження наперед."
        ]
      },
      ru: {
        h1: "Timviz для косметологов",
        lead: "Постройте предсказуемый график для процедур разной длительности и сложности.",
        body: [
          "В косметологии критична точность тайминга. Timviz помогает настраивать услуги с длительностью и стоимостью, чтобы избежать пересечений и лишних переносов.",
          "Онлайн-запись снижает ручную коммуникацию: клиенты записываются сами, а вы управляете уже структурированным календарем."
        ]
      },
      en: {
        h1: "Timviz for cosmetologists",
        lead: "Build a predictable schedule for procedures with different lengths and intensity.",
        body: [
          "Cosmetology workflows require accurate timing. Timviz lets you configure services with duration and pricing to reduce overlaps and rescheduling.",
          "Clients can book online without back-and-forth chat, while you manage a structured calendar and monitor workload in advance."
        ]
      }
    },
    seo: {
      uk: { title: "Timviz для косметологів — онлайн-запис і календар процедур", description: "Сервіс онлайн-запису для косметологів: графік процедур, ціни, послуги та керування завантаженням.", keywords: ["для косметологів", "онлайн-запис косметолог", "календар процедур", "Timviz"] },
      ru: { title: "Timviz для косметологов — онлайн-запись и календарь процедур", description: "Онлайн-запись для косметологов: график процедур, цены, услуги и управление загрузкой.", keywords: ["для косметологов", "онлайн-запись косметолог", "календарь процедур", "Timviz"] },
      en: { title: "Timviz for cosmetologists — online booking for treatments", description: "Online booking and calendar planning for cosmetologists with structured treatment scheduling.", keywords: ["cosmetologist booking software", "treatment booking calendar", "beauty clinic scheduling", "Timviz"] }
    }
  },
  {
    slug: "dlya-masazhu",
    card: {
      uk: { shortTitle: "Для масажистів", description: "Гнучкий розклад сесій різної тривалості та зручний онлайн-запис.", icon: "👐" },
      ru: { shortTitle: "Для массажистов", description: "Гибкое расписание сессий разной длительности и удобная онлайн-запись.", icon: "👐" },
      en: { shortTitle: "For massage therapists", description: "Flexible scheduling for sessions of different durations.", icon: "👐" }
    },
    page: {
      uk: {
        h1: "Timviz для масажистів",
        lead: "Керуйте короткими й довгими сесіями в одному календарі та приймайте записи онлайн.",
        body: [
          "Масажистам потрібен гнучкий інструмент для планування сесій 30, 60 або 90 хвилин. У Timviz це налаштовується для кожної послуги окремо.",
          "Клієнти бачать вільний час і записуються самі, а ви зберігаєте фокус на роботі, а не на ручному узгодженні кожного візиту."
        ]
      },
      ru: {
        h1: "Timviz для массажистов",
        lead: "Управляйте короткими и длинными сессиями в одном календаре и принимайте онлайн-записи.",
        body: [
          "Массажистам нужен гибкий график для сессий 30, 60 или 90 минут. В Timviz можно задать длительность для каждой услуги и видеть реальную загрузку дня.",
          "Клиенты бронируют свободные окна онлайн, а вы уделяете больше времени процедурам вместо ручного согласования каждого визита."
        ]
      },
      en: {
        h1: "Timviz for massage therapists",
        lead: "Manage short and long sessions in one calendar and accept online bookings with less admin work.",
        body: [
          "Massage professionals need flexible scheduling for 30, 60 or 90-minute sessions. Timviz lets you configure each service duration and keep visibility across the whole day.",
          "Clients pick available times online, so you can focus on service quality instead of manual appointment coordination."
        ]
      }
    },
    seo: {
      uk: { title: "Timviz для масажистів — онлайн-запис і графік сесій", description: "Онлайн-запис для масажистів: гнучкий календар, послуги різної тривалості та керування розкладом.", keywords: ["для масажистів", "онлайн-запис масаж", "календар масажиста", "Timviz"] },
      ru: { title: "Timviz для массажистов — онлайн-запись и график сессий", description: "Онлайн-запись для массажистов: гибкий календарь, услуги разной длительности и управление расписанием.", keywords: ["для массажистов", "онлайн-запись массаж", "календарь массажиста", "Timviz"] },
      en: { title: "Timviz for massage therapists — online booking and scheduling", description: "Online booking for massage therapists with flexible session durations and calendar management.", keywords: ["massage therapist booking software", "massage online appointments", "massage schedule calendar", "Timviz"] }
    }
  }
];

export const nichePageBySlug = Object.fromEntries(nichePages.map((item) => [item.slug, item])) as Record<NicheSlug, NicheItem>;
