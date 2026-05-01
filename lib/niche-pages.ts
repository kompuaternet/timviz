import type { SeoCopy } from "./seo";
import type { SiteLanguage } from "./site-language";

export type NicheKey = "manicure" | "hairdressers" | "barbers" | "cosmetologists" | "massage";

export const nicheSlugMap: Record<SiteLanguage, Record<NicheKey, string>> = {
  uk: {
    manicure: "dlya-manikyuru",
    hairdressers: "dlya-perukariv",
    barbers: "dlya-barberiv",
    cosmetologists: "dlya-kosmetologiv",
    massage: "dlya-masazhu"
  },
  ru: {
    manicure: "dlya-manikyura",
    hairdressers: "dlya-parikmaherov",
    barbers: "dlya-barberov",
    cosmetologists: "dlya-kosmetologov",
    massage: "dlya-massazhistov"
  },
  en: {
    manicure: "for-nail-technicians",
    hairdressers: "for-hairdressers",
    barbers: "for-barbers",
    cosmetologists: "for-cosmetologists",
    massage: "for-massage-therapists"
  }
};

export const nicheKeys: NicheKey[] = ["manicure", "hairdressers", "barbers", "cosmetologists", "massage"];

export function getNicheSlug(language: SiteLanguage, key: NicheKey) {
  return nicheSlugMap[language][key];
}

export function getNicheKeyBySlug(language: SiteLanguage, slug: string): NicheKey | null {
  return nicheKeys.find((key) => nicheSlugMap[language][key] === slug) ?? null;
}

export function getAllNicheParams() {
  return (Object.keys(nicheSlugMap) as SiteLanguage[]).flatMap((lang) =>
    nicheKeys.map((key) => ({ lang, niche: nicheSlugMap[lang][key], key }))
  );
}

type NicheCardCopy = { shortTitle: string; description: string };
type NichePageCopy = { h1: string; lead: string; body: string[] };

export const nicheCards: Record<NicheKey, Record<SiteLanguage, NicheCardCopy>> = {
  manicure: {
    uk: { shortTitle: "Для майстрів манікюру", description: "Онлайн-запис, послуги, ціни та календар для майстрів нігтьового сервісу." },
    ru: { shortTitle: "Для мастеров маникюра", description: "Онлайн-запись, услуги, цены и календарь для мастеров ногтевого сервиса." },
    en: { shortTitle: "For nail technicians", description: "Online booking, pricing and calendar management for nail professionals." }
  },
  hairdressers: {
    uk: { shortTitle: "Для перукарів", description: "Керування записами, тривалістю послуг і графіком для перукарів." },
    ru: { shortTitle: "Для парикмахеров", description: "Управление записью, длительностью услуг и графиком для парикмахеров." },
    en: { shortTitle: "For hairdressers", description: "Booking, service duration and schedule tools for hairdressers." }
  },
  barbers: {
    uk: { shortTitle: "Для барберів", description: "Щільний календар, повторні візити та швидкий онлайн-запис для барберів." },
    ru: { shortTitle: "Для барберов", description: "Плотный календарь, повторные визиты и быстрая онлайн-запись для барберов." },
    en: { shortTitle: "For barbers", description: "Keep a high-load calendar under control with quick online booking." }
  },
  cosmetologists: {
    uk: { shortTitle: "Для косметологів", description: "Плануйте довгі процедури та керуйте щоденним завантаженням без стресу." },
    ru: { shortTitle: "Для косметологов", description: "Планируйте длительные процедуры и управляйте загрузкой дня без стресса." },
    en: { shortTitle: "For cosmetologists", description: "Organize longer procedures and keep daily workload balanced." }
  },
  massage: {
    uk: { shortTitle: "Для масажистів", description: "Гнучкий розклад сесій різної тривалості та зручний онлайн-запис." },
    ru: { shortTitle: "Для массажистов", description: "Гибкое расписание сессий разной длительности и удобная онлайн-запись." },
    en: { shortTitle: "For massage therapists", description: "Flexible scheduling for sessions of different durations." }
  }
};

export const nicheContent: Record<NicheKey, Record<SiteLanguage, NichePageCopy>> = {
  manicure: {
    uk: { h1: "Timviz для майстрів манікюру", lead: "Приймайте онлайн-запис 24/7 і керуйте послугами без хаосу в месенджерах.", body: ["Timviz допомагає майстрам манікюру зібрати запис, прайс і календар в одному місці.", "Клієнти самі обирають послугу й час, а ви отримуєте передбачуваний графік дня."] },
    ru: { h1: "Timviz для мастеров маникюра", lead: "Принимайте онлайн-запись 24/7 и управляйте услугами без хаоса в мессенджерах.", body: ["Timviz помогает мастерам маникюра собрать запись, прайс и календарь в одном кабинете.", "Клиенты выбирают услугу и время сами, а вы работаете с прозрачным расписанием."] },
    en: { h1: "Timviz for nail technicians", lead: "Run online booking 24/7 and manage services without messenger chaos.", body: ["Timviz keeps bookings, pricing and calendar planning in one workspace.", "Clients choose services and slots on their own, while you keep schedule control."] }
  },
  hairdressers: {
    uk: { h1: "Timviz для перукарів", lead: "Плануйте стрижки, фарбування та комплексні послуги без накладок.", body: ["Налаштуйте тривалість і вартість послуг, щоб клієнти записувалися у правильні слоти.", "Календар показує завантаження за день, тиждень і місяць."] },
    ru: { h1: "Timviz для парикмахеров", lead: "Планируйте стрижки, окрашивания и сложные услуги без накладок.", body: ["Гибко настраивайте длительность и стоимость услуг, чтобы клиенты попадали в правильные слоты.", "Календарь показывает загрузку на день, неделю и месяц."] },
    en: { h1: "Timviz for hairdressers", lead: "Plan cuts, coloring and complex services without scheduling conflicts.", body: ["Configure service duration and pricing so clients book accurate time slots.", "Use daily, weekly and monthly views to keep your workload balanced."] }
  },
  barbers: {
    uk: { h1: "Timviz для барберів", lead: "Контролюйте щільний потік записів і зменшуйте кількість дзвінків.", body: ["Клієнти бронюють онлайн, а ви бачите реальні вільні слоти.", "Платформа підходить для індивідуальних барберів і барбершопів."] },
    ru: { h1: "Timviz для барберов", lead: "Контролируйте плотный поток записей и уменьшайте количество звонков.", body: ["Клиенты бронируют онлайн, а вы видите реальные свободные слоты.", "Платформа подходит для индивидуальных барберов и барбершопов."] },
    en: { h1: "Timviz for barbers", lead: "Control high booking flow and reduce manual call coordination.", body: ["Clients book online while you manage a clear real-time schedule.", "Works well for solo barbers and busy barbershops."] }
  },
  cosmetologists: {
    uk: { h1: "Timviz для косметологів", lead: "Плануйте довгі процедури й уникайте накладок у графіку.", body: ["Налаштуйте процедури з тривалістю та ціною для точного планування.", "Клієнти записуються онлайн, а ви бачите завантаження наперед."] },
    ru: { h1: "Timviz для косметологов", lead: "Планируйте длинные процедуры и избегайте накладок в графике.", body: ["Настройте процедуры с длительностью и ценой для точного планирования.", "Клиенты записываются онлайн, а вы видите загрузку заранее."] },
    en: { h1: "Timviz for cosmetologists", lead: "Plan longer procedures and avoid schedule overlaps.", body: ["Configure treatment duration and pricing for accurate planning.", "Clients book online and you track workload in advance."] }
  },
  massage: {
    uk: { h1: "Timviz для масажистів", lead: "Керуйте короткими й довгими сесіями в одному календарі.", body: ["Налаштуйте тривалість кожної сесії та працюйте зі зрозумілим графіком.", "Клієнти бронюють вільний час онлайн без зайвих узгоджень."] },
    ru: { h1: "Timviz для массажистов", lead: "Управляйте короткими и длинными сессиями в одном календаре.", body: ["Настройте длительность каждой услуги и работайте с прозрачным расписанием.", "Клиенты бронируют свободное время онлайн без лишних согласований."] },
    en: { h1: "Timviz for massage therapists", lead: "Manage short and long sessions in one calendar.", body: ["Set duration per service and keep a clear schedule every day.", "Clients book available slots online with less manual coordination."] }
  }
};

export const nicheSeo: Record<NicheKey, Record<SiteLanguage, SeoCopy>> = {
  manicure: {
    uk: { title: "Timviz для майстрів манікюру — онлайн-запис і календар", description: "Онлайн-запис для майстрів манікюру: календар, послуги, ціни та керування вільними вікнами в Timviz." },
    ru: { title: "Timviz для мастеров маникюра — онлайн-запись и календарь", description: "Онлайн-запись для мастеров маникюра: календарь, услуги, цены и управление свободными окнами в Timviz." },
    en: { title: "Timviz for nail technicians — online booking and calendar", description: "Online booking for nail technicians with service management, pricing and calendar planning in Timviz." }
  },
  hairdressers: {
    uk: { title: "Timviz для перукарів — онлайн-запис і розклад", description: "Онлайн-запис для перукарів: календар, послуги та керування завантаженням робочого дня." },
    ru: { title: "Timviz для парикмахеров — онлайн-запись и расписание", description: "Онлайн-запись для парикмахеров: календарь, услуги и управление загрузкой рабочего дня." },
    en: { title: "Timviz for hairdressers — online booking and schedule", description: "Online booking and schedule management for hairdressers with service setup in Timviz." }
  },
  barbers: {
    uk: { title: "Timviz для барберів — онлайн-запис барбершопу", description: "Платформа онлайн-запису для барберів і барбершопів: календар, послуги та клієнти в одному кабінеті." },
    ru: { title: "Timviz для барберов — онлайн-запись барбершопа", description: "Онлайн-запись для барберов и барбершопов: календарь, услуги и клиенты в одном кабинете." },
    en: { title: "Timviz for barbers — barbershop booking software", description: "Online booking and calendar management for barbers and barbershops in Timviz." }
  },
  cosmetologists: {
    uk: { title: "Timviz для косметологів — онлайн-запис і календар процедур", description: "Сервіс онлайн-запису для косметологів: графік процедур, ціни, послуги та керування завантаженням." },
    ru: { title: "Timviz для косметологов — онлайн-запись и календарь процедур", description: "Онлайн-запись для косметологов: график процедур, цены, услуги и управление загрузкой." },
    en: { title: "Timviz for cosmetologists — online booking for treatments", description: "Online booking and calendar planning for cosmetologists with structured treatment scheduling." }
  },
  massage: {
    uk: { title: "Timviz для масажистів — онлайн-запис і графік сесій", description: "Онлайн-запис для масажистів: гнучкий календар, послуги різної тривалості та керування розкладом." },
    ru: { title: "Timviz для массажистов — онлайн-запись и график сессий", description: "Онлайн-запись для массажистов: гибкий календарь, услуги разной длительности и управление расписанием." },
    en: { title: "Timviz for massage therapists — online booking and scheduling", description: "Online booking for massage therapists with flexible session durations and calendar management." }
  }
};
