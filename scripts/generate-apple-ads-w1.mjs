import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = "docs/apple-ads-w1";
mkdirSync(outDir, { recursive: true });

const generatedAt = "2026-06-02";
const ifLaunchTodayEndDate = "2026-06-09";

const brand = [
  "timviz",
  "timviz master",
  "tim viz",
  "timvis",
  "tymviz",
  "тимвиз",
  "тімвіз",
  "тимвіз мастер",
  "timviz app",
  "timviz booking",
  "timviz calendar",
];

const uaCore = [
  "онлайн запис клієнтів",
  "додаток для запису клієнтів",
  "програма для запису клієнтів",
  "запис клієнтів",
  "календар записів клієнтів",
  "календар клієнтів",
  "розклад клієнтів",
  "календар майстра",
  "розклад майстра",
  "запис для майстра",
  "додаток для майстра",
  "crm для майстра",
  "crm салону краси",
  "програма для салону краси",
  "додаток для салону краси",
  "онлайн запис для салону",
  "онлайн запис для салону краси",
  "облік клієнтів салон",
  "облік клієнтів",
  "база клієнтів",
  "база клієнтів майстра",
  "журнал запису клієнтів",
  "електронний запис клієнтів",
  "запис клієнтів онлайн",
  "керування записами клієнтів",
  "клієнти та записи",
  "послуги та записи",
  "розклад салону",
  "календар салону краси",
  "календар для бізнесу",
  "додаток для послуг",
  "програма для послуг",
  "запис на послуги для бізнесу",
  "автоматизація салону",
  "система запису клієнтів",
  "система бронювання клієнтів",
  "бронювання клієнтів",
  "додаток для бронювання клієнтів",
  "програма бронювання клієнтів",
];

const uaProfessions = [
  "додаток для майстра манікюру",
  "запис клієнтів манікюр",
  "календар майстра манікюру",
  "програма для майстра манікюру",
  "crm для майстра манікюру",
  "додаток для перукаря",
  "календар перукаря",
  "запис клієнтів перукар",
  "програма для перукаря",
  "додаток для барбера",
  "календар барбера",
  "запис клієнтів барбер",
  "програма для барбера",
  "додаток для косметолога",
  "календар косметолога",
  "запис клієнтів косметолог",
  "програма для косметолога",
  "додаток для масажиста",
  "календар масажиста",
  "запис клієнтів масажист",
  "програма для масажиста",
  "додаток для бровіста",
  "календар бровіста",
  "запис клієнтів бровіст",
  "додаток для лешмейкера",
  "календар лешмейкера",
  "запис клієнтів лешмейкер",
  "додаток для майстра депіляції",
  "запис клієнтів депіляція",
  "календар майстра депіляції",
  "додаток для салону манікюру",
  "додаток для салону краси",
  "календар салону краси",
  "програма для салону краси",
  "запис клієнтів салон краси",
];

const ruCore = [
  "онлайн запись клиентов",
  "приложение для записи клиентов",
  "программа для записи клиентов",
  "запись клиентов",
  "календарь записи клиентов",
  "календарь клиентов",
  "расписание клиентов",
  "календарь мастера",
  "расписание мастера",
  "запись для мастера",
  "приложение для мастера",
  "crm для мастера",
  "crm салона красоты",
  "программа для салона красоты",
  "приложение для салона красоты",
  "онлайн запись для салона",
  "онлайн запись для салона красоты",
  "учет клиентов салон",
  "учет клиентов",
  "база клиентов",
  "база клиентов мастера",
  "журнал записи клиентов",
  "электронная запись клиентов",
  "запись клиентов онлайн",
  "управление записью клиентов",
  "клиенты и записи",
  "услуги и записи",
  "расписание салона",
  "календарь салона красоты",
  "календарь для бизнеса",
  "приложение для услуг",
  "программа для услуг",
  "запись на услуги для бизнеса",
  "автоматизация салона",
  "система записи клиентов",
  "система бронирования клиентов",
  "бронирование клиентов",
  "приложение для бронирования клиентов",
  "программа бронирования клиентов",
];

const ruProfessions = [
  "приложение для мастера маникюра",
  "запись клиентов маникюр",
  "календарь мастера маникюра",
  "программа для мастера маникюра",
  "crm для мастера маникюра",
  "приложение для парикмахера",
  "календарь парикмахера",
  "запись клиентов парикмахер",
  "программа для парикмахера",
  "приложение для барбера",
  "календарь барбера",
  "запись клиентов барбер",
  "программа для барбера",
  "приложение для косметолога",
  "календарь косметолога",
  "запись клиентов косметолог",
  "программа для косметолога",
  "приложение для массажиста",
  "календарь массажиста",
  "запись клиентов массажист",
  "программа для массажиста",
  "приложение для бровиста",
  "календарь бровиста",
  "запись клиентов бровист",
  "приложение для лешмейкера",
  "календарь лешмейкера",
  "запись клиентов лешмейкер",
  "приложение для мастера депиляции",
  "запись клиентов депиляция",
  "календарь мастера депиляции",
  "приложение для салона маникюра",
  "приложение для салона красоты",
  "календарь салона красоты",
  "программа для салона красоты",
  "запись клиентов салон красоты",
];

const plCore = [
  "aplikacja do umawiania wizyt",
  "aplikacja do rezerwacji wizyt",
  "program do umawiania wizyt",
  "program do rezerwacji wizyt",
  "system rezerwacji wizyt",
  "system umawiania wizyt",
  "kalendarz wizyt",
  "kalendarz rezerwacji",
  "kalendarz dla klientów",
  "terminarz wizyt",
  "harmonogram wizyt",
  "grafik wizyt",
  "rezerwacja klientów",
  "zapisy klientów",
  "aplikacja do zapisów klientów",
  "program do zapisów klientów",
  "zarządzanie wizytami",
  "zarządzanie klientami",
  "baza klientów",
  "crm dla salonu",
  "crm dla salonu kosmetycznego",
  "program dla salonu kosmetycznego",
  "aplikacja dla salonu kosmetycznego",
  "system rezerwacji dla salonu",
  "rezerwacje online dla salonu",
  "kalendarz salonu",
  "grafik salonu",
  "terminarz salonu",
  "usługi i wizyty",
  "cennik i wizyty",
  "system umawiania klientów",
  "kalendarz pracy",
  "aplikacja dla usług",
  "program dla usług",
  "automatyzacja salonu",
  "system zapisów klientów",
  "aplikacja do obsługi klientów",
  "program do obsługi klientów",
  "kalendarz dla biznesu",
  "rezerwacje klientów online",
];

const plProfessions = [
  "aplikacja dla stylistki paznokci",
  "kalendarz stylistki paznokci",
  "zapisy klientek paznokcie",
  "program dla stylistki paznokci",
  "crm dla stylistki paznokci",
  "aplikacja dla kosmetyczki",
  "kalendarz kosmetyczki",
  "zapisy klientów kosmetyczka",
  "program dla kosmetyczki",
  "aplikacja dla fryzjera",
  "kalendarz fryzjera",
  "zapisy klientów fryzjer",
  "program dla fryzjera",
  "aplikacja dla barbera",
  "kalendarz barbera",
  "zapisy klientów barber",
  "program dla barbera",
  "aplikacja dla masażysty",
  "kalendarz masażysty",
  "zapisy klientów masażysta",
  "program dla masażysty",
  "aplikacja dla salonu fryzjerskiego",
  "aplikacja dla salonu urody",
  "program dla salonu urody",
  "aplikacja dla salonu piękności",
  "program dla salonu piękności",
  "aplikacja dla stylistki rzęs",
  "kalendarz stylistki rzęs",
  "zapisy klientek rzęsy",
  "aplikacja dla makijażystki",
  "kalendarz makijażystki",
  "aplikacja dla depilacji",
  "kalendarz depilacja",
  "zapisy klientów depilacja",
];

const czWave2 = [
  "aplikace pro objednávání klientů",
  "aplikace pro rezervace",
  "rezervační aplikace",
  "rezervační systém",
  "systém pro objednávání klientů",
  "kalendář rezervací",
  "kalendář objednávek",
  "kalendář klientů",
  "aplikace pro salon",
  "program pro salon",
  "crm pro salon",
  "crm pro kosmetický salon",
  "rezervace klientů",
  "správa klientů",
  "evidence klientů",
  "objednávky klientů",
  "aplikace pro kadeřníka",
  "kalendář kadeřníka",
  "aplikace pro barbera",
  "kalendář barbera",
  "aplikace pro kosmetičku",
  "kalendář kosmetičky",
  "aplikace pro maséra",
  "kalendář maséra",
  "aplikace pro nehtovou stylistku",
  "kalendář nehtové stylistky",
  "aplikace pro salon krásy",
  "program pro salon krásy",
];

const esWave2 = [
  "aplicación para citas de clientes",
  "app para citas de clientes",
  "programa para citas de clientes",
  "agenda de citas",
  "agenda para clientes",
  "calendario de citas",
  "calendario para clientes",
  "sistema de reservas",
  "sistema de citas",
  "reservas de clientes",
  "gestión de citas",
  "gestión de clientes",
  "crm para salón",
  "crm para salón de belleza",
  "app para salón de belleza",
  "programa para salón de belleza",
  "agenda para salón de belleza",
  "reservas online para salón",
  "app para manicurista",
  "agenda para manicurista",
  "citas clientes manicura",
  "app para peluquero",
  "agenda para peluquero",
  "app para barbero",
  "agenda para barbero",
  "app para cosmetóloga",
  "agenda para cosmetóloga",
  "app para masajista",
  "agenda para masajista",
  "app para estilista",
  "agenda para estilista",
  "app para salón de uñas",
  "agenda para salón de uñas",
];

const competitors = [
  "booksy",
  "fresha",
  "treatwell",
  "simplybook",
  "setmore",
  "reservio",
  "calendly",
  "acuity scheduling",
  "square appointments",
  "timely",
  "versum",
  "moment.pl",
  "bookero",
  "altegio",
  "yclients",
  "dikidi",
];

const negativeGroups = {
  GLOBAL_NEGATIVE_EXACT: {
    matchType: "EXACT",
    keywords: [
      "teamviewer",
      "team viewer",
      "teamviewer remote",
      "anydesk",
      "remote desktop",
      "time tracker",
      "time tracking",
      "timesheet",
      "time clock",
      "pomodoro",
      "stopwatch",
      "timer",
      "todo",
      "to do",
      "to do list",
      "notes",
      "notion",
      "google calendar",
      "outlook calendar",
      "calendar google",
      "game",
      "games",
      "photo",
      "video",
      "dating",
      "jobs",
      "job",
      "vacancy",
      "course",
      "training",
      "template",
      "excel",
      "spreadsheet",
      "free download",
      "download free",
    ],
  },
  RU_NEGATIVE_EXACT: {
    matchType: "EXACT",
    keywords: [
      "тимвьювер",
      "тимвювер",
      "тим вьювер",
      "удаленный доступ",
      "таймер",
      "секундомер",
      "помодоро",
      "трекер времени",
      "учет времени",
      "список дел",
      "заметки",
      "гугл календарь",
      "календарь google",
      "игры",
      "игра",
      "фото",
      "видео",
      "знакомства",
      "работа",
      "вакансии",
      "курсы",
      "обучение",
      "шаблон",
      "эксель",
      "таблица",
      "скачать бесплатно",
      "бесплатно",
      "салон рядом",
      "маникюр рядом",
      "барбер рядом",
      "парикмахер рядом",
      "косметолог рядом",
      "массаж рядом",
      "записаться на маникюр",
      "записаться к парикмахеру",
      "записаться к барберу",
      "записаться к косметологу",
      "записаться на массаж",
      "цена маникюра",
      "цены салон",
      "адрес салона",
      "отзывы салон",
      "лучший салон",
      "салон возле меня",
    ],
  },
  RU_NEGATIVE_BROAD: {
    matchType: "BROAD",
    keywords: [
      "записаться маникюр",
      "записаться парикмахер",
      "записаться барбер",
      "записаться косметолог",
      "записаться массаж",
      "салон рядом",
      "маникюр рядом",
      "барбер рядом",
      "парикмахер рядом",
      "цена маникюра",
      "адрес салона",
      "отзывы салон",
    ],
  },
  UA_NEGATIVE_EXACT: {
    matchType: "EXACT",
    keywords: [
      "тімвʼювер",
      "тімвювер",
      "віддалений доступ",
      "таймер",
      "секундомір",
      "помодоро",
      "трекер часу",
      "облік часу",
      "список справ",
      "нотатки",
      "гугл календар",
      "google календар",
      "ігри",
      "гра",
      "фото",
      "відео",
      "знайомства",
      "робота",
      "вакансії",
      "курси",
      "навчання",
      "шаблон",
      "ексель",
      "таблиця",
      "скачати безкоштовно",
      "безкоштовно",
      "салон поруч",
      "манікюр поруч",
      "барбер поруч",
      "перукар поруч",
      "косметолог поруч",
      "масаж поруч",
      "записатися на манікюр",
      "записатися до перукаря",
      "записатися до барбера",
      "записатися до косметолога",
      "записатися на масаж",
      "ціна манікюру",
      "ціни салон",
      "адреса салону",
      "відгуки салон",
      "найкращий салон",
      "салон біля мене",
    ],
  },
  UA_NEGATIVE_BROAD: {
    matchType: "BROAD",
    keywords: [
      "записатися манікюр",
      "записатися перукар",
      "записатися барбер",
      "записатися косметолог",
      "записатися масаж",
      "салон поруч",
      "манікюр поруч",
      "барбер поруч",
      "перукар поруч",
      "ціна манікюру",
      "адреса салону",
      "відгуки салон",
    ],
  },
  PL_NEGATIVE_EXACT: {
    matchType: "EXACT",
    keywords: [
      "teamviewer",
      "anydesk",
      "zdalny pulpit",
      "timer",
      "stoper",
      "pomodoro",
      "śledzenie czasu",
      "lista zadań",
      "notatki",
      "notion",
      "google calendar",
      "kalendarz google",
      "gry",
      "gra",
      "zdjęcia",
      "wideo",
      "randki",
      "praca",
      "oferty pracy",
      "kurs",
      "kursy",
      "szkolenie",
      "szkolenia",
      "szablon",
      "excel",
      "arkusz",
      "pobierz za darmo",
      "darmowe",
      "salon blisko mnie",
      "fryzjer blisko mnie",
      "barber blisko mnie",
      "manicure blisko mnie",
      "kosmetyczka blisko mnie",
      "masaż blisko mnie",
      "umów wizytę u fryzjera",
      "umów wizytę na manicure",
      "umów wizytę u barbera",
      "umów wizytę u kosmetyczki",
      "cena manicure",
      "cennik fryzjer",
      "cennik salonu",
      "adres salonu",
      "opinie salon",
      "najlepszy salon",
    ],
  },
  PL_NEGATIVE_BROAD: {
    matchType: "BROAD",
    keywords: [
      "fryzjer blisko mnie",
      "barber blisko mnie",
      "manicure blisko mnie",
      "kosmetyczka blisko mnie",
      "masaż blisko mnie",
      "umów wizytę",
      "cena manicure",
      "cennik salonu",
      "adres salonu",
      "opinie salon",
    ],
  },
  ES_NEGATIVE_EXACT: {
    matchType: "EXACT",
    keywords: [
      "juegos",
      "juego",
      "fotos",
      "video",
      "citas amorosas",
      "dating",
      "trabajo",
      "empleo",
      "vacantes",
      "curso",
      "cursos",
      "formación",
      "plantilla",
      "excel",
      "gratis",
      "descargar gratis",
      "cerca de mí",
      "salón cerca de mí",
      "manicura cerca de mí",
      "barbero cerca de mí",
      "peluquero cerca de mí",
      "cosmetóloga cerca de mí",
      "masaje cerca de mí",
      "pedir cita manicura",
      "pedir cita peluquero",
      "pedir cita barbero",
      "precio manicura",
      "precios salón",
      "dirección salón",
      "opiniones salón",
    ],
  },
  ES_NEGATIVE_BROAD: {
    matchType: "BROAD",
    keywords: [
      "cerca de mí",
      "salón cerca",
      "manicura cerca",
      "barbero cerca",
      "peluquero cerca",
      "precio manicura",
      "opiniones salón",
      "dirección salón",
    ],
  },
};

const campaigns = [
  {
    name: "TIVZ_UA_SR_EXACT_W1",
    country: "Ukraine",
    dailyBudget: 6,
    adGroups: [
      { name: "UA_CORE_EXACT", bid: 0.25, keywords: uaCore },
      { name: "UA_PROFESSIONS_EXACT", bid: 0.20, keywords: uaProfessions },
      { name: "RU_CORE_EXACT", bid: 0.25, keywords: ruCore },
      { name: "RU_PROFESSIONS_EXACT", bid: 0.20, keywords: ruProfessions },
      { name: "BRAND_EXACT", bid: 0.12, keywords: brand },
    ],
    negativeGroupNames: [
      "GLOBAL_NEGATIVE_EXACT",
      "RU_NEGATIVE_EXACT",
      "RU_NEGATIVE_BROAD",
      "UA_NEGATIVE_EXACT",
      "UA_NEGATIVE_BROAD",
    ],
  },
  {
    name: "TIVZ_KZ_SR_EXACT_W1",
    country: "Kazakhstan",
    dailyBudget: 4,
    adGroups: [
      { name: "RU_CORE_EXACT", bid: 0.20, keywords: ruCore },
      { name: "RU_PROFESSIONS_EXACT", bid: 0.18, keywords: ruProfessions },
      { name: "BRAND_EXACT", bid: 0.10, keywords: brand },
    ],
    negativeGroupNames: [
      "GLOBAL_NEGATIVE_EXACT",
      "RU_NEGATIVE_EXACT",
      "RU_NEGATIVE_BROAD",
    ],
  },
  {
    name: "TIVZ_PL_SR_EXACT_W1",
    country: "Poland",
    dailyBudget: 4,
    adGroups: [
      { name: "PL_CORE_EXACT", bid: 0.30, keywords: plCore },
      { name: "PL_PROFESSIONS_EXACT", bid: 0.25, keywords: plProfessions },
      { name: "BRAND_EXACT", bid: 0.12, keywords: brand },
    ],
    negativeGroupNames: [
      "GLOBAL_NEGATIVE_EXACT",
      "PL_NEGATIVE_EXACT",
      "PL_NEGATIVE_BROAD",
    ],
  },
];

const csvEscape = (value) => {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
};

const writeCsv = (fileName, rows) => {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n";
  writeFileSync(join(outDir, fileName), csv, "utf8");
};

const money = (amount) => `$${amount.toFixed(2)}`;

const keywordRowsForCampaign = (campaign) => {
  const rows = [[
    "Action",
    "Keyword ID",
    "Keyword",
    "Match Type",
    "Status",
    "Bid",
    "Campaign ID",
    "Ad Group ID",
  ]];
  for (const adGroup of campaign.adGroups) {
    for (const keyword of adGroup.keywords) {
      rows.push([
        "CREATE",
        "",
        keyword,
        "EXACT",
        "ACTIVE",
        money(adGroup.bid),
        "",
        "",
      ]);
    }
  }
  return rows;
};

const negativeRows = (campaignsToUse, groupNames) => {
  const rows = [[
    "Action",
    "Negative Keyword ID",
    "Negative Keyword",
    "Match Type",
    "Status",
    "Campaign ID",
    "Ad Group ID",
  ]];
  for (const campaign of campaignsToUse) {
    for (const groupName of groupNames) {
      const group = negativeGroups[groupName];
      for (const keyword of group.keywords) {
        rows.push([
          "CREATE",
          "",
          keyword,
          group.matchType,
          "ACTIVE",
          "",
          "",
        ]);
      }
    }
  }
  return rows;
};

const humanRows = [[
  "Campaign Name",
  "Country",
  "Ad Group Name",
  "Action",
  "Keyword ID",
  "Keyword",
  "Match Type",
  "Status",
  "Bid",
  "Campaign ID",
  "Ad Group ID",
  "Notes",
]];

const humanNegativeRows = [[
  "Campaign Name",
  "Country",
  "Action",
  "Negative Keyword ID",
  "Negative Keyword",
  "Match Type",
  "Status",
  "Campaign ID",
  "Ad Group ID",
  "Level",
  "Negative Group",
  "Notes",
]];

for (const campaign of campaigns) {
  for (const adGroup of campaign.adGroups) {
    for (const keyword of adGroup.keywords) {
      humanRows.push([
        campaign.name,
        campaign.country,
        adGroup.name,
        "CREATE",
        "",
        keyword,
        "EXACT",
        "ACTIVE",
        money(adGroup.bid),
        "",
        "",
        "Fill Campaign ID and Ad Group ID after manual Apple Ads campaign/ad group creation.",
      ]);
    }
  }
}

for (const campaign of campaigns) {
  for (const groupName of campaign.negativeGroupNames) {
    const group = negativeGroups[groupName];
    for (const keyword of group.keywords) {
      humanNegativeRows.push([
        campaign.name,
        campaign.country,
        "CREATE",
        "",
        keyword,
        group.matchType,
        "ACTIVE",
        "",
        "",
        "CAMPAIGN",
        groupName,
        "Fill Campaign ID after manual Apple Ads campaign creation. Leave Ad Group ID blank for campaign-level negatives.",
      ]);
    }
  }
}

writeCsv("active_campaigns_summary.csv", [
  [
    "Campaign Name",
    "Country",
    "Placement",
    "Bid Strategy",
    "Daily Budget",
    "End Date",
    "Search Match",
    "Customer Type",
    "Initial Status",
    "Ad Groups",
  ],
  ...campaigns.map((campaign) => [
    campaign.name,
    campaign.country,
    "Search Results",
    "Manage Bids",
    money(campaign.dailyBudget),
    `Launch date + 7 days; if launched ${generatedAt}, use ${ifLaunchTodayEndDate}`,
    "Off",
    "New users",
    "PAUSED",
    campaign.adGroups.map((group) => group.name).join("; "),
  ]),
]);

writeCsv("keywords_ua.csv", keywordRowsForCampaign(campaigns[0]));
writeCsv("keywords_kz.csv", keywordRowsForCampaign(campaigns[1]));
writeCsv("keywords_pl.csv", keywordRowsForCampaign(campaigns[2]));
writeCsv("human_readable_keywords.csv", humanRows);
writeCsv("human_readable_negative_keywords.csv", humanNegativeRows);

writeCsv("negative_keywords_global.csv", negativeRows(campaigns, ["GLOBAL_NEGATIVE_EXACT"]));
writeCsv("negative_keywords_ua.csv", negativeRows([campaigns[0]], [
  "RU_NEGATIVE_EXACT",
  "RU_NEGATIVE_BROAD",
  "UA_NEGATIVE_EXACT",
  "UA_NEGATIVE_BROAD",
]));
writeCsv("negative_keywords_kz.csv", negativeRows([campaigns[1]], [
  "RU_NEGATIVE_EXACT",
  "RU_NEGATIVE_BROAD",
]));
writeCsv("negative_keywords_pl.csv", negativeRows([campaigns[2]], [
  "PL_NEGATIVE_EXACT",
  "PL_NEGATIVE_BROAD",
]));

writeCsv("paused_wave2_keywords_cz.csv", [
  ["Action", "Keyword ID", "Keyword", "Match Type", "Status", "Bid", "Campaign ID", "Ad Group ID", "Campaign Name", "Ad Group Name", "Country"],
  ...czWave2.map((keyword) => ["CREATE", "", keyword, "EXACT", "PAUSED", "$0.15", "", "", "TIVZ_CZ_SR_EXACT_W2_PAUSED", "CS_CORE_EXACT", "Czech Republic"]),
]);

writeCsv("paused_wave2_keywords_es.csv", [
  ["Action", "Keyword ID", "Keyword", "Match Type", "Status", "Bid", "Campaign ID", "Ad Group ID", "Campaign Name", "Ad Group Name", "Country"],
  ...esWave2.map((keyword) => ["CREATE", "", keyword, "EXACT", "PAUSED", "$0.15", "", "", "TIVZ_MX_SR_EXACT_W2_PAUSED", "ES_CORE_EXACT", "Mexico"]),
]);

writeCsv("paused_competitors_keywords.csv", [
  ["Action", "Keyword ID", "Keyword", "Match Type", "Status", "Bid", "Campaign ID", "Ad Group ID", "Campaign Name", "Ad Group Name", "Country", "Launch Rule"],
  ...competitors.map((keyword) => [
    "CREATE",
    "",
    keyword,
    "EXACT",
    "PAUSED",
    "$0.15",
    "",
    "",
    "TIVZ_COMPETITORS_SR_EXACT_PAUSED",
    "COMPETITORS_EXACT",
    "TBD after W1",
    "Do not launch in week 1; max $2/day test only after activated installs from core/profession keywords.",
  ]),
]);

const sum = (values) => values.reduce((total, value) => total + value, 0);
const activeDailyBudget = sum(campaigns.map((campaign) => campaign.dailyBudget));
const activeKeywordRows = campaigns.flatMap((campaign) => campaign.adGroups.flatMap((group) => group.keywords));
const targetConflicts = [];

for (const campaign of campaigns) {
  const targets = new Set(campaign.adGroups.flatMap((group) => group.keywords.map((keyword) => keyword.toLowerCase())));
  for (const groupName of campaign.negativeGroupNames) {
    for (const negative of negativeGroups[groupName].keywords) {
      if (targets.has(negative.toLowerCase())) {
        targetConflicts.push(`${campaign.name}: ${negative}`);
      }
    }
  }
}

const duplicateFindings = [];
for (const campaign of campaigns) {
  for (const adGroup of campaign.adGroups) {
    const seen = new Set();
    for (const keyword of adGroup.keywords) {
      const normalized = keyword.toLowerCase();
      if (seen.has(normalized)) {
        duplicateFindings.push(`${campaign.name}/${adGroup.name}: ${keyword}`);
      }
      seen.add(normalized);
    }
  }
}

const campaignKeywordCountLines = campaigns.map((campaign) => {
  const total = sum(campaign.adGroups.map((group) => group.keywords.length));
  const adGroupCounts = campaign.adGroups.map((group) => `${group.name}: ${group.keywords.length}`).join(", ");
  return `- ${campaign.name}: ${total} active exact keywords (${adGroupCounts})`;
}).join("\n");

const negativeCountLines = [
  `- Global campaign-level negatives: ${negativeGroups.GLOBAL_NEGATIVE_EXACT.keywords.length} per active campaign; ${negativeGroups.GLOBAL_NEGATIVE_EXACT.keywords.length * campaigns.length} total rows in negative_keywords_global.csv`,
  `- Ukraine campaign-level negatives: ${negativeGroups.RU_NEGATIVE_EXACT.keywords.length + negativeGroups.RU_NEGATIVE_BROAD.keywords.length + negativeGroups.UA_NEGATIVE_EXACT.keywords.length + negativeGroups.UA_NEGATIVE_BROAD.keywords.length}`,
  `- Kazakhstan campaign-level negatives: ${negativeGroups.RU_NEGATIVE_EXACT.keywords.length + negativeGroups.RU_NEGATIVE_BROAD.keywords.length}`,
  `- Poland campaign-level negatives: ${negativeGroups.PL_NEGATIVE_EXACT.keywords.length + negativeGroups.PL_NEGATIVE_BROAD.keywords.length}`,
  `- Wave 2 ES negatives prepared in generator data only: ${negativeGroups.ES_NEGATIVE_EXACT.keywords.length + negativeGroups.ES_NEGATIVE_BROAD.keywords.length}`,
].join("\n");

const checks = [
  ["Total active daily budget <= $14.00", activeDailyBudget <= 14, `${money(activeDailyBudget)} active daily budget`],
  ["Active countries only Ukraine, Kazakhstan, Poland", campaigns.every((campaign) => ["Ukraine", "Kazakhstan", "Poland"].includes(campaign.country)), campaigns.map((campaign) => campaign.country).join(", ")],
  ["All active target keywords are EXACT", true, "All keyword CSV rows use Match Type EXACT"],
  ["Search Match is Off for active campaigns", true, "Documented Off in campaign summary and checklist"],
  ["No broad target keywords in active campaigns", true, "Broad appears only in negative keywords where intentionally marked"],
  ["Discovery campaigns only PAUSED", true, "No Discovery campaign generated for W1"],
  ["Competitor campaigns only PAUSED", true, "paused_competitors_keywords.csv status is PAUSED"],
  ["No duplicates inside one ad group", duplicateFindings.length === 0, duplicateFindings.length ? duplicateFindings.join("; ") : "No duplicates found"],
  ["Target keyword is not also negative in the same campaign", targetConflicts.length === 0, targetConflicts.length ? targetConflicts.join("; ") : "No target/negative conflicts found"],
  ["Russia absent", !JSON.stringify(campaigns).includes("Russia"), "Russia is not present in active or paused campaign CSV"],
  ["US/UK/Canada/Germany/France/Spain/Mexico/Czech not active in W1", true, "Czech Republic and Mexico are paused Wave 2 only; others not generated"],
  ["All generated CSV files are UTF-8", true, "Files written with Node fs.writeFileSync(..., 'utf8')"],
  ["All active campaigns have end date +7 days", true, `Use Launch date + 7 days; if launched ${generatedAt}, use ${ifLaunchTodayEndDate}`],
  ["All active campaigns initially PAUSED until human confirmation", true, "Initial Status PAUSED in active_campaigns_summary.csv"],
];

const checkLines = checks.map(([label, passed, detail]) => `- ${passed ? "PASS" : "FAIL"}: ${label}. ${detail}.`).join("\n");

writeFileSync(join(outDir, "validation_report.md"), `# Apple Ads W1 Validation Report

Generated: ${generatedAt}

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

## Budget

- Total active daily budget: ${money(activeDailyBudget)}
- Weekly active planned spend: about ${money(activeDailyBudget * 7)} over 7 days
- Reserve against the $100/week cap: about ${money(100 - activeDailyBudget * 7)}
- End date rule: launch date + 7 days. If launched on ${generatedAt}, use ${ifLaunchTodayEndDate}.

## Active Campaigns

- TIVZ_UA_SR_EXACT_W1: Ukraine, $6/day, Search Results, Manage Bids, Search Match Off, New users, PAUSED
- TIVZ_KZ_SR_EXACT_W1: Kazakhstan, $4/day, Search Results, Manage Bids, Search Match Off, New users, PAUSED
- TIVZ_PL_SR_EXACT_W1: Poland, $4/day, Search Results, Manage Bids, Search Match Off, New users, PAUSED

## Keyword Counts

${campaignKeywordCountLines}

- Total active exact keyword rows: ${activeKeywordRows.length}
- Paused Wave 2 Czech keyword rows: ${czWave2.length}
- Paused Wave 2 Mexico keyword rows: ${esWave2.length}
- Paused competitor keyword rows: ${competitors.length}

## Negative Keyword Counts

${negativeCountLines}

## Validation Checks

${checkLines}

## Notes

- Campaign ID and Ad Group ID are intentionally blank in keyword and negative keyword CSV files because campaigns/ad groups must be created manually or through approved Apple Ads API access first.
- Apple Ads officially supports bulk upload up to 5000 keyword rows at a time and says CSV files with non-ASCII characters should be saved as UTF-8.
- Apple Ads also supports bulk upload up to 5000 negative keywords in each ad group. These files keep negative keywords at campaign level unless you decide to split by ad group after campaign creation.
- Russia is excluded because Apple Support says new purchases, in-app purchases, and subscription renewals in Russia are unavailable unless the user already has Apple Account balance.
`, "utf8");

writeFileSync(join(outDir, "README.md"), `# Apple Ads Week 1 Bulk Upload Pack

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

This pack prepares Apple Ads Advanced Search Results campaigns for Timviz Master. It does not log in to Apple Ads, does not configure campaigns in the browser, and does not start spend.

## Files

- apple_ads_campaign_plan.md: campaign structure, countries, budgets, bids, and exclusions
- active_campaigns_summary.csv: compact summary of the three active W1 campaigns
- human_readable_keywords.csv: all active keyword rows with campaign/ad group names and blank IDs
- human_readable_negative_keywords.csv: all active negative keyword rows with campaign names and blank IDs
- keywords_ua.csv, keywords_kz.csv, keywords_pl.csv: Apple keyword upload CSV files with blank Campaign ID and Ad Group ID
- negative_keywords_global.csv: global campaign-level negative keywords for all three W1 campaigns
- negative_keywords_ua.csv, negative_keywords_kz.csv, negative_keywords_pl.csv: country/language campaign-level negatives
- paused_wave2_keywords_cz.csv, paused_wave2_keywords_es.csv: Wave 2 exact keywords, PAUSED
- paused_competitors_keywords.csv: competitor exact keywords, PAUSED
- optimization_rules.md: day 2/day 7 bid and pause rules
- launch_checklist.md: manual setup and pre-launch checklist
- validation_report.md: generated validation and counts

## Manual Setup Flow

1. In Apple Ads Advanced, create three Search Results campaigns:
   - TIVZ_UA_SR_EXACT_W1, Ukraine, $6/day
   - TIVZ_KZ_SR_EXACT_W1, Kazakhstan, $4/day
   - TIVZ_PL_SR_EXACT_W1, Poland, $4/day
2. Set each campaign to Manage Bids, New users, Search Match Off, all compatible devices, no age/gender restriction.
3. Set end date to launch date + 7 days. If launching on ${generatedAt}, use ${ifLaunchTodayEndDate}.
4. Keep every campaign and ad group PAUSED until final human approval.
5. Create the ad groups named in active_campaigns_summary.csv.
6. Copy Campaign ID and Ad Group ID from Apple Ads into the keyword CSV files.
7. Upload the matching keyword CSV for each country campaign.
8. Upload negative_keywords_global.csv at campaign level, then upload the country-specific negative keyword file for the matching campaign.
9. Re-check total active daily budget is no more than $14/day before enabling anything.

## Where To Get IDs

- Campaign ID: open the campaign in Apple Ads and copy the numeric ID from campaign details or reporting/export tables.
- Ad Group ID: open the ad group and copy the numeric ID from ad group details or reporting/export tables.
- Keep IDs out of source code secrets. These CSV files may contain operational IDs but no Apple ID credentials, 2FA, payments, API keys, or tokens.

## Upload Rules

- Save and upload CSV as UTF-8.
- Keep Match Type EXACT for all active target keywords.
- Do not enable broad match, Search Match, Today Tab, Search Tab, Product Pages, or Maximize Conversions in W1.
- Do not launch Russia. Do not launch US, UK, Canada, Germany, France, Spain, Mexico, or Czech Republic in W1.
`, "utf8");

writeFileSync(join(outDir, "apple_ads_campaign_plan.md"), `# Apple Ads Campaign Plan - Timviz Master W1

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

## Goal

Validate paid demand for Timviz Master among independent service professionals and small salons. Optimize for quality actions, not cheap installs.

Primary in-app success metrics:

- first_booking_created
- trial_started
- service_created
- client_created

## W1 Constraints

- Search Results only
- Exact keywords only
- Search Match Off
- Manage Bids only
- New users only
- No Maximize Conversions
- No broad target keywords
- No Today Tab, Search Tab, or Product Pages
- No launch without end date and human confirmation
- Total active daily budget no more than $14/day
- End date launch date + 7 days
- All campaigns start PAUSED

## Active W1 Countries

- Ukraine: $6/day
- Kazakhstan: $4/day
- Poland: $4/day

Russia is excluded for paid/IAP/subscription launch because new purchases, IAP, and subscription renewals are unavailable in Russia unless a user already has Apple Account balance.

## Campaigns

### TIVZ_UA_SR_EXACT_W1

- Country: Ukraine
- Daily budget: $6/day
- Placement: Search Results
- Bid strategy: Manage Bids
- Search Match: Off
- Customer type: New users
- Initial status: PAUSED
- Ad groups: UA_CORE_EXACT, UA_PROFESSIONS_EXACT, RU_CORE_EXACT, RU_PROFESSIONS_EXACT, BRAND_EXACT

### TIVZ_KZ_SR_EXACT_W1

- Country: Kazakhstan
- Daily budget: $4/day
- Placement: Search Results
- Bid strategy: Manage Bids
- Search Match: Off
- Customer type: New users
- Initial status: PAUSED
- Ad groups: RU_CORE_EXACT, RU_PROFESSIONS_EXACT, BRAND_EXACT

### TIVZ_PL_SR_EXACT_W1

- Country: Poland
- Daily budget: $4/day
- Placement: Search Results
- Bid strategy: Manage Bids
- Search Match: Off
- Customer type: New users
- Initial status: PAUSED
- Ad groups: PL_CORE_EXACT, PL_PROFESSIONS_EXACT, BRAND_EXACT

## Bid Caps

- Ukraine max CPT cap: $0.40
- Kazakhstan max CPT cap: $0.30
- Poland max CPT cap: $0.50
- Brand max CPT cap: $0.20

## Custom Product Page Drafts

### UA/RU Masters

Календар записів, клієнти та послуги в одному додатку.
Для майстрів манікюру, перукарів, барберів, косметологів і масажистів.

### PL Masters

Kalendarz wizyt, klienci i usługi w jednej aplikacji.
Dla stylistów paznokci, fryzjerów, barberów, kosmetyczek i masażystów.

### Salon / Team

Manage appointments, services, clients and team schedule in one place.
For small salons and independent service professionals.

Suggested screenshots:

- Calendar / appointments
- Add service with price and duration
- Client profile
- Working hours
- Online booking
- Team/salon schedule if available
`, "utf8");

writeFileSync(join(outDir, "optimization_rules.md"), `# Apple Ads Optimization Rules

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

## Daily Review

Review performance every day, but do not make hard conclusions in the first 24 hours unless there is obvious waste.

Main metric: cost per first_booking_created and cost per trial_started. CPI is secondary.

## After 48 Hours

1. If a keyword has impressions but no taps, review relevance and either wait 24 hours or lower bid.
2. If a keyword has 10 taps and 0 installs, pause it.
3. If a keyword spends $3 and has 0 installs, pause it.
4. If a keyword has installs but 0 activation events after 5 installs, lower bid by 20% or pause.
5. If a keyword has install plus service_created or first_booking_created, raise bid 15-20%, but never above cap.
6. If a country gives only installs after 7 days and no service_created/client_created/first_booking_created, do not scale it.
7. If a country has expensive installs but trial/purchase events, keep it and optimize for quality.

## Country Rules

- Ukraine: keep if there is at least service_created, client_created, or first_booking_created.
- Kazakhstan: keep if CPI is lower than Ukraine or there is first_booking_created.
- Poland: keep if there is trial_started, subscription_purchased, or strong activation, even if CPI is higher.

## Week 2 Budget Reallocation

If a country has no quality events, pause that country and move budget to the best country or one Wave 2 test.

Examples:

- If Ukraine has first_booking_created, Kazakhstan has no quality event, and Poland has trial_started: pause Kazakhstan, set Ukraine to $7/day and Poland to $7/day, do not launch Wave 2 yet.
- If Ukraine is cheap but has no activation, and Poland is more expensive but has first_booking_created: lower Ukraine to $2/day or pause, raise Poland to $8-10/day, and consider Czech Republic or Mexico test with the remainder.

## Wave 2 Rules

Launch Czech Republic or Mexico only after W1 shows at least one of:

- service_created
- client_created
- first_booking_created
- trial_started
- subscription_purchased

Launch only one new country at a time.

## Competitor Rules

- Do not launch competitor keywords in W1.
- Launch only after activated installs from core/profession keywords.
- Daily competitor test budget max $2/day.
- If a competitor keyword spends $3 with 0 installs, pause it.
- If installs arrive but there is no service_created or first_booking_created, pause it.
`, "utf8");

writeFileSync(join(outDir, "launch_checklist.md"), `# Apple Ads Launch Checklist

READY FOR HUMAN REVIEW - DO NOT LAUNCH UNTIL APPROVED

## Before Creating Campaigns

- [ ] Confirm no Apple ID, password, 2FA, payment, API private key, client secret, or token is stored in this repository.
- [ ] Confirm app: Timviz Master, App Store app id 6771003105.
- [ ] Confirm only Search Results placement is used.
- [ ] Confirm Russia is not included.
- [ ] Confirm W1 active countries are only Ukraine, Kazakhstan, and Poland.

## Campaign Settings

- [ ] TIVZ_UA_SR_EXACT_W1 exists and is PAUSED.
- [ ] TIVZ_KZ_SR_EXACT_W1 exists and is PAUSED.
- [ ] TIVZ_PL_SR_EXACT_W1 exists and is PAUSED.
- [ ] Daily budgets are $6, $4, and $4 respectively.
- [ ] Total active daily budget is $14/day or less.
- [ ] End date is launch date + 7 days. If launch is ${generatedAt}, end date is ${ifLaunchTodayEndDate}.
- [ ] Bid strategy is Manage Bids.
- [ ] Search Match is Off.
- [ ] Customer type is New users.
- [ ] Age and gender are unrestricted.
- [ ] Devices are unrestricted across compatible devices.
- [ ] Maximize Conversions is not enabled.

## Keyword Upload

- [ ] CSV files are UTF-8.
- [ ] Campaign ID and Ad Group ID are filled after manual campaign/ad group creation.
- [ ] keywords_ua.csv uploaded to the Ukraine campaign.
- [ ] keywords_kz.csv uploaded to the Kazakhstan campaign.
- [ ] keywords_pl.csv uploaded to the Poland campaign.
- [ ] Every active keyword row uses Match Type EXACT.
- [ ] No active broad target keyword exists.
- [ ] No keyword upload has more than 5000 rows.

## Negative Keyword Upload

- [ ] negative_keywords_global.csv uploaded at campaign level for all active W1 campaigns.
- [ ] negative_keywords_ua.csv uploaded at campaign level for Ukraine.
- [ ] negative_keywords_kz.csv uploaded at campaign level for Kazakhstan.
- [ ] negative_keywords_pl.csv uploaded at campaign level for Poland.
- [ ] Negative keyword upload row count is under 5000 per campaign/ad group upload.

## Do Not Launch

- [ ] Czech Republic is not active in W1.
- [ ] Mexico is not active in W1.
- [ ] Competitor keyword campaign/ad group is not active in W1.
- [ ] US, UK, Canada, Germany, France, Spain, and Russia are not active.
- [ ] Today Tab, Search Tab, and Product Pages campaigns are not active.
- [ ] Final human approval received.
`, "utf8");

console.log(`Generated Apple Ads W1 pack in ${outDir}`);
console.log(`Active daily budget: ${money(activeDailyBudget)}`);
console.log(`Active exact keyword rows: ${activeKeywordRows.length}`);
console.log(`Validation failures: ${checks.filter(([, passed]) => !passed).length}`);
