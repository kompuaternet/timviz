export type ServiceTemplateLanguage = "ru" | "uk" | "en";

export type LocalizedServiceText = Record<ServiceTemplateLanguage, string>;

export type ServiceTemplate = {
  name: string;
  localizedName?: Partial<LocalizedServiceText>;
  durationMinutes?: number;
  price?: number;
};

export type CategoryTemplate = {
  key: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
  topSuggestions: ServiceTemplate[];
  popularServices: ServiceTemplate[];
};

type ServiceTranslationPair = {
  uk: string;
  en: string;
};

function normalizeServiceLabel(value: string) {
  return value.trim().toLowerCase();
}

const serviceTranslations: Record<string, ServiceTranslationPair> = {
  "Женская стрижка": { uk: "Жіноча стрижка", en: "Women's haircut" },
  "Мужская стрижка": { uk: "Чоловіча стрижка", en: "Men's haircut" },
  "Укладка волос": { uk: "Укладання волосся", en: "Hair styling" },
  "Сушка феном": { uk: "Сушіння феном", en: "Blow-dry" },
  "Детская стрижка": { uk: "Дитяча стрижка", en: "Kids haircut" },
  "Окрашивание волос": { uk: "Фарбування волосся", en: "Hair coloring" },
  "Балаяж": { uk: "Балаяж", en: "Balayage" },
  "Тонирование волос": { uk: "Тонування волосся", en: "Hair toning" },
  "Подкрашивание корней": { uk: "Підфарбування коренів", en: "Root touch-up" },
  "Мытье волос": { uk: "Миття волосся", en: "Hair wash" },
  "Бритье головы": { uk: "Гоління голови", en: "Head shave" },
  "Маникюр": { uk: "Манікюр", en: "Manicure" },
  "Педикюр": { uk: "Педикюр", en: "Pedicure" },
  "Гелевый маникюр": { uk: "Гелевий манікюр", en: "Gel manicure" },
  "Русский маникюр": { uk: "Російський манікюр", en: "Russian manicure" },
  "Мужской маникюр и педикюр": { uk: "Чоловічий манікюр і педикюр", en: "Men's manicure & pedicure" },
  "Акриловые ногти": { uk: "Акрилові нігті", en: "Acrylic nails" },
  "Дизайн ногтей": { uk: "Дизайн нігтів", en: "Nail design" },
  "Наращивание ногтей": { uk: "Нарощування нігтів", en: "Nail extensions" },
  "Ремонт ногтей": { uk: "Ремонт нігтів", en: "Nail repair" },
  "Маникюр и педикюр": { uk: "Манікюр і педикюр", en: "Manicure & pedicure" },
  "Парафиновый маникюр": { uk: "Парафіновий манікюр", en: "Paraffin manicure" },
  "Медицинский педикюр": { uk: "Медичний педикюр", en: "Medical pedicure" },
  "Детский маникюр и педикюр": { uk: "Дитячий манікюр і педикюр", en: "Kids manicure & pedicure" },
  "Коррекция формы бровей": { uk: "Корекція форми брів", en: "Eyebrow shaping" },
  "Окрашивание бровей": { uk: "Фарбування брів", en: "Eyebrow tinting" },
  "Ламинирование бровей": { uk: "Ламінування брів", en: "Brow lamination" },
  "Наращивание ресниц": { uk: "Нарощування вій", en: "Eyelash extensions" },
  "Ламинирование ресниц": { uk: "Ламінування вій", en: "Lash lift" },
  "Коррекция бровей нитью": { uk: "Корекція брів ниткою", en: "Threading eyebrows" },
  "Восковая эпиляция бровей": { uk: "Воскова депіляція брів", en: "Eyebrow waxing" },
  "Микропигментация бровей": { uk: "Мікропігментація брів", en: "Eyebrow micropigmentation" },
  "Перманентный макияж бровей": { uk: "Перманентний макіяж брів", en: "Permanent eyebrow makeup" },
  "Коррекция ресниц": { uk: "Корекція вій", en: "Lash correction" },
  "Подтяжка ресниц": { uk: "Ліфтинг вій", en: "Lash lift treatment" },
  "Удаление ресниц": { uk: "Зняття вій", en: "Lash removal" },
  "Окрашивание ресниц": { uk: "Фарбування вій", en: "Lash tinting" },
  "Уход за лицом": { uk: "Догляд за обличчям", en: "Facial treatment" },
  "Пилинг для лица": { uk: "Пілінг обличчя", en: "Facial peel" },
  "Спа-процедура для лица": { uk: "Спа-процедура для обличчя", en: "Facial spa treatment" },
  "Консультация по эстетической медицине": { uk: "Консультація з естетичної медицини", en: "Aesthetic medicine consultation" },
  "Омоложение лица": { uk: "Омолодження обличчя", en: "Facial rejuvenation" },
  "Химический пилинг": { uk: "Хімічний пілінг", en: "Chemical peel" },
  "Мезотерапия": { uk: "Мезотерапія", en: "Mesotherapy" },
  "Дарсонваль": { uk: "Дарсонваль", en: "Darsonval therapy" },
  "Микродермабразия": { uk: "Мікродермабразія", en: "Microdermabrasion" },
  "Безоперационная подтяжка лица": { uk: "Безопераційна підтяжка обличчя", en: "Non-surgical facelift" },
  "Подтяжка лица": { uk: "Підтяжка обличчя", en: "Facelift" },
  "Подтяжка шеи": { uk: "Підтяжка шиї", en: "Neck lift" },
  "Коррекция фигуры": { uk: "Корекція фігури", en: "Body contouring" },
  "Ультразвуковая кавитация": { uk: "Ультразвукова кавітація", en: "Ultrasonic cavitation" },
  "Карбокситерапия": { uk: "Карбокситерапія", en: "Carboxytherapy" },
  "Стрижка под машинку": { uk: "Стрижка машинкою", en: "Clipper haircut" },
  "Стрижка и борода": { uk: "Стрижка та борода", en: "Haircut and beard" },
  "Уход за бородой": { uk: "Догляд за бородою", en: "Beard grooming" },
  "Формирование бороды": { uk: "Формування бороди", en: "Beard shaping" },
  "Бритье бороды": { uk: "Гоління бороди", en: "Beard shave" },
  "Бритье опасной бритвой": { uk: "Гоління небезпечною бритвою", en: "Straight razor shave" },
  "Бритье головы и стрижка бороды": { uk: "Гоління голови та стрижка бороди", en: "Head shave and beard trim" },
  "Подстригание усов": { uk: "Підстригання вусів", en: "Mustache trim" },
  "Окрашивание бороды": { uk: "Фарбування бороди", en: "Beard coloring" },
  "Скин Фейд": { uk: "Скін фейд", en: "Skin fade" },
  "Классический массаж": { uk: "Класичний масаж", en: "Classic massage" },
  "Расслабляющий массаж": { uk: "Розслаблювальний масаж", en: "Relaxing massage" },
  "Массаж спины": { uk: "Масаж спини", en: "Back massage" },
  "Массаж всего тела": { uk: "Масаж усього тіла", en: "Full body massage" },
  "Лечебный массаж": { uk: "Лікувальний масаж", en: "Therapeutic massage" },
  "Антицеллюлитный массаж": { uk: "Антицелюлітний масаж", en: "Anti-cellulite massage" },
  "Глубокотканный массаж": { uk: "Глибокотканинний масаж", en: "Deep tissue massage" },
  "Лимфатический массаж": { uk: "Лімфатичний масаж", en: "Lymphatic massage" },
  "Массаж лица": { uk: "Масаж обличчя", en: "Facial massage" },
  "Массаж горячими камнями": { uk: "Масаж гарячим камінням", en: "Hot stone massage" },
  "Спортивный массаж": { uk: "Спортивний масаж", en: "Sports massage" },
  "Тайский массаж": { uk: "Тайський масаж", en: "Thai massage" },
  "Сауна": { uk: "Сауна", en: "Sauna" },
  "Скраб для тела": { uk: "Скраб для тіла", en: "Body scrub" },
  "Спа-салон для пар": { uk: "Спа для пар", en: "Couples spa session" },
  "Комната для медитации": { uk: "Кімната для медитації", en: "Meditation room" },
  "Автозагар": { uk: "Автозасмага", en: "Spray tan" },
  "Автозагар с помощью аэрографа": { uk: "Автозасмага аерографом", en: "Airbrush spray tan" },
  "Солярий": { uk: "Солярій", en: "Tanning bed" },
  "Соляная комната": { uk: "Соляна кімната", en: "Salt room" },
  "Коррекция контуров тела": { uk: "Корекція контурів тіла", en: "Body contour correction" },
  "Депиляция воском": { uk: "Воскова депіляція", en: "Wax hair removal" },
  "Лазерная эпиляция": { uk: "Лазерна епіляція", en: "Laser hair removal" },
  "Удаление волос на лице": { uk: "Видалення волосся на обличчі", en: "Facial hair removal" },
  "Депиляция подмышек воском": { uk: "Воскова депіляція пахв", en: "Underarm waxing" },
  "Депиляция зоны бикини": { uk: "Депіляція зони бікіні", en: "Bikini hair removal" },
  "Депиляция ног воском": { uk: "Воскова депіляція ніг", en: "Leg waxing" },
  "Депиляция рук воском": { uk: "Воскова депіляція рук", en: "Arm waxing" },
  "Депиляция губ воском": { uk: "Воскова депіляція верхньої губи", en: "Upper lip waxing" },
  "Депиляция живота воском": { uk: "Воскова депіляція живота", en: "Abdomen waxing" },
  "Депиляция спины воском": { uk: "Воскова депіляція спини", en: "Back waxing" },
  "IPL-эпиляция": { uk: "IPL-епіляція", en: "IPL hair removal" },
  "Электролиз": { uk: "Електроепіляція", en: "Electrolysis" },
  "Резьба": { uk: "Тридинг", en: "Threading" },
  "Сеанс татуировки": { uk: "Сеанс татуювання", en: "Tattoo session" },
  "Консультация по татуировкам": { uk: "Консультація щодо татуювань", en: "Tattoo consultation" },
  "Пирсинг носа": { uk: "Пірсинг носа", en: "Nose piercing" },
  "Прокалывание ушей": { uk: "Прокол вух", en: "Ear piercing" },
  "Пирсинг тела": { uk: "Пірсинг тіла", en: "Body piercing" },
  "Временные татуировки": { uk: "Тимчасові татуювання", en: "Temporary tattoos" },
  "Удаление татуировок": { uk: "Видалення татуювань", en: "Tattoo removal" },
  "Пирсинг пупка": { uk: "Пірсинг пупка", en: "Navel piercing" },
  "Пирсинг языка": { uk: "Пірсинг язика", en: "Tongue piercing" },
  "Пирсинг хряща": { uk: "Пірсинг хряща", en: "Cartilage piercing" },
  "Интимный пирсинг": { uk: "Інтимний пірсинг", en: "Intimate piercing" },
  "Физиотерапия": { uk: "Фізіотерапія", en: "Physiotherapy" },
  "Реабилитация": { uk: "Реабілітація", en: "Rehabilitation" },
  "Спортивная медицина": { uk: "Спортивна медицина", en: "Sports medicine" },
  "Магнитотерапия": { uk: "Магнітотерапія", en: "Magnetotherapy" },
  "Сухое иглоукалывание": { uk: "Сухе голковколювання", en: "Dry needling" },
  "Кинезитерапия": { uk: "Кінезітерапія", en: "Kinesitherapy" },
  "Терапия мягких тканей": { uk: "Терапія м'яких тканин", en: "Soft tissue therapy" },
  "Реабилитация позвоночника": { uk: "Реабілітація хребта", en: "Spine rehabilitation" },
  "Лечение лимфедемы": { uk: "Лікування лімфедеми", en: "Lymphedema treatment" },
  "Вакуумная терапия": { uk: "Вакуумна терапія", en: "Vacuum therapy" },
  "Хиропрактика": { uk: "Хіропрактика", en: "Chiropractic care" },
  "Консультация": { uk: "Консультація", en: "Consultation" },
  "Основная услуга": { uk: "Основна послуга", en: "Core service" },
  "Повторный визит": { uk: "Повторний візит", en: "Follow-up visit" },
  "Пакет услуг": { uk: "Пакет послуг", en: "Service package" },
  "Индивидуальная услуга": { uk: "Індивідуальна послуга", en: "Custom service" },
  "Диагностика": { uk: "Діагностика", en: "Diagnostics" }
};

const serviceTranslationIndex = new Map<string, LocalizedServiceText>();

for (const [ru, item] of Object.entries(serviceTranslations)) {
  const normalized = {
    ru,
    uk: item.uk,
    en: item.en
  } satisfies LocalizedServiceText;
  serviceTranslationIndex.set(normalizeServiceLabel(ru), normalized);
  serviceTranslationIndex.set(normalizeServiceLabel(item.uk), normalized);
  serviceTranslationIndex.set(normalizeServiceLabel(item.en), normalized);
}

function getRawServiceLocalizedEntry(name: string) {
  return serviceTranslationIndex.get(normalizeServiceLabel(name)) ?? null;
}

export function getServiceLocalizedText(
  name: string,
  localizedName?: Partial<LocalizedServiceText>
): LocalizedServiceText {
  const base = getRawServiceLocalizedEntry(name);
  return {
    ru: localizedName?.ru?.trim() || base?.ru || name,
    uk: localizedName?.uk?.trim() || base?.uk || base?.ru || name,
    en: localizedName?.en?.trim() || base?.en || base?.ru || name
  };
}

export function localizeServiceName(
  name: string,
  language: ServiceTemplateLanguage,
  localizedName?: Partial<LocalizedServiceText>
) {
  return getServiceLocalizedText(name, localizedName)[language];
}

export function getServiceLocalizationKey(name: string) {
  const localized = getRawServiceLocalizedEntry(name);
  return normalizeServiceLabel(localized?.ru || name);
}

function withDefaults(
  services: string[],
  durationMinutes = 60,
  basePrice = 700
): ServiceTemplate[] {
  return services.map((name, index) => ({
    name,
    localizedName: getServiceLocalizedText(name),
    durationMinutes,
    price: basePrice + index * 60
  }));
}

export const SERVICE_TEMPLATE_CATALOG: CategoryTemplate[] = [
  {
    key: "Парикмахерская",
    title: "Парикмахерская",
    heroTitle: "Услуги парикмахерской",
    heroDescription:
      "Компании с похожим профилем обычно начинают с базовых стрижек, укладок и окрашивания. Выбери подходящие услуги или добавь свои.",
    topSuggestions: withDefaults(
      ["Женская стрижка", "Мужская стрижка", "Укладка волос", "Сушка феном", "Детская стрижка"],
      60,
      500
    ),
    popularServices: withDefaults(
      ["Окрашивание волос", "Балаяж", "Тонирование волос", "Подкрашивание корней", "Мытье волос", "Бритье головы"],
      90,
      650
    )
  },
  {
    key: "Ногти",
    title: "Ногти",
    heroTitle: "Услуги маникюра",
    heroDescription:
      "Компании, подобные вашей, обычно добавляют 12 и более услуг. Ознакомьтесь с нашими предложениями для вдохновения или начните добавлять свои собственные.",
    topSuggestions: withDefaults(
      ["Маникюр", "Педикюр", "Гелевый маникюр", "Русский маникюр", "Мужской маникюр и педикюр"],
      60,
      550
    ),
    popularServices: withDefaults(
      [
        "Акриловые ногти",
        "Дизайн ногтей",
        "Наращивание ногтей",
        "Ремонт ногтей",
        "Маникюр и педикюр",
        "Парафиновый маникюр",
        "Медицинский педикюр",
        "Детский маникюр и педикюр"
      ],
      75,
      650
    )
  },
  {
    key: "Брови и ресницы",
    title: "Брови и ресницы",
    heroTitle: "Услуги бровиста и lash-мастера",
    heroDescription:
      "Шаблон собран из самых частых услуг для бровей и ресниц: коррекция, окрашивание, ламинирование и наращивание.",
    topSuggestions: withDefaults(
      ["Коррекция формы бровей", "Окрашивание бровей", "Ламинирование бровей", "Наращивание ресниц", "Ламинирование ресниц"],
      45,
      500
    ),
    popularServices: withDefaults(
      [
        "Коррекция бровей нитью",
        "Восковая эпиляция бровей",
        "Микропигментация бровей",
        "Перманентный макияж бровей",
        "Коррекция ресниц",
        "Подтяжка ресниц",
        "Удаление ресниц",
        "Окрашивание ресниц"
      ],
      60,
      620
    )
  },
  {
    key: "Салон красоты",
    title: "Салон красоты",
    heroTitle: "Услуги салона красоты",
    heroDescription:
      "Для салона красоты лучше начать с набора универсальных услуг: волосы, ногти, брови и базовые уходовые процедуры.",
    topSuggestions: withDefaults(
      ["Женская стрижка", "Маникюр", "Педикюр", "Окрашивание бровей", "Уход за лицом"],
      60,
      650
    ),
    popularServices: withDefaults(
      ["Укладка волос", "Гелевый маникюр", "Коррекция формы бровей", "Пилинг для лица", "Спа-процедура для лица"],
      75,
      750
    )
  },
  {
    key: "Медспа",
    title: "Медспа",
    heroTitle: "Услуги medspa",
    heroDescription:
      "Подборка для эстетической медицины и аппаратных процедур: от консультаций до процедур по подтяжке и омоложению.",
    topSuggestions: withDefaults(
      ["Консультация по эстетической медицине", "Пилинг для лица", "Омоложение лица", "Химический пилинг", "Мезотерапия"],
      60,
      900
    ),
    popularServices: withDefaults(
      [
        "Дарсонваль",
        "Микродермабразия",
        "Безоперационная подтяжка лица",
        "Подтяжка лица",
        "Подтяжка шеи",
        "Коррекция фигуры",
        "Ультразвуковая кавитация",
        "Карбокситерапия"
      ],
      75,
      1200
    )
  },
  {
    key: "Парикмахер",
    title: "Парикмахер",
    heroTitle: "Услуги барбера и парикмахера",
    heroDescription:
      "Набор услуг для барбершопа и индивидуального мастера: стрижки, борода, бритье и уход.",
    topSuggestions: withDefaults(
      ["Мужская стрижка", "Стрижка под машинку", "Стрижка и борода", "Уход за бородой", "Формирование бороды"],
      45,
      500
    ),
    popularServices: withDefaults(
      [
        "Бритье бороды",
        "Бритье опасной бритвой",
        "Бритье головы",
        "Бритье головы и стрижка бороды",
        "Подстригание усов",
        "Окрашивание бороды",
        "Скин Фейд"
      ],
      45,
      620
    )
  },
  {
    key: "Массажный салон",
    title: "Массажный салон",
    heroTitle: "Услуги массажа",
    heroDescription:
      "Самые частые позиции для массажного кабинета: классика, расслабление, лечебные и спортивные техники.",
    topSuggestions: withDefaults(
      ["Классический массаж", "Расслабляющий массаж", "Массаж спины", "Массаж всего тела", "Лечебный массаж"],
      60,
      800
    ),
    popularServices: withDefaults(
      [
        "Антицеллюлитный массаж",
        "Глубокотканный массаж",
        "Лимфатический массаж",
        "Массаж лица",
        "Массаж горячими камнями",
        "Спортивный массаж",
        "Тайский массаж"
      ],
      75,
      950
    )
  },
  {
    key: "Спа-салон и сауна",
    title: "Спа-салон и сауна",
    heroTitle: "Спа-услуги и сауна",
    heroDescription:
      "Шаблон для spa: сауна, автозагар, spa-процедуры для лица и тела, комната для медитации и relax-зоны.",
    topSuggestions: withDefaults(
      ["Сауна", "Спа-процедура для лица", "Скраб для тела", "Спа-салон для пар", "Комната для медитации"],
      60,
      900
    ),
    popularServices: withDefaults(
      ["Автозагар", "Автозагар с помощью аэрографа", "Солярий", "Соляная комната", "Коррекция контуров тела"],
      75,
      1100
    )
  },
  {
    key: "Салон депиляции",
    title: "Салон депиляции",
    heroTitle: "Услуги депиляции",
    heroDescription:
      "Основной набор для салона удаления волос: воск, шугаринг, лазер и зоны тела.",
    topSuggestions: withDefaults(
      ["Депиляция воском", "Лазерная эпиляция", "Удаление волос на лице", "Депиляция подмышек воском", "Депиляция зоны бикини"],
      45,
      650
    ),
    popularServices: withDefaults(
      [
        "Депиляция ног воском",
        "Депиляция рук воском",
        "Депиляция губ воском",
        "Депиляция живота воском",
        "Депиляция спины воском",
        "IPL-эпиляция",
        "Электролиз",
        "Резьба"
      ],
      50,
      720
    )
  },
  {
    key: "Тату и пирсинг",
    title: "Тату и пирсинг",
    heroTitle: "Тату и пирсинг",
    heroDescription:
      "В этой категории собраны самые частые позиции для студий тату и пирсинга.",
    topSuggestions: withDefaults(
      ["Сеанс татуировки", "Консультация по татуировкам", "Пирсинг носа", "Прокалывание ушей", "Пирсинг тела"],
      60,
      900
    ),
    popularServices: withDefaults(
      [
        "Временные татуировки",
        "Удаление татуировок",
        "Пирсинг пупка",
        "Пирсинг языка",
        "Пирсинг хряща",
        "Интимный пирсинг"
      ],
      60,
      1100
    )
  },
  {
    key: "Студия загара",
    title: "Студия загара",
    heroTitle: "Услуги студии загара",
    heroDescription:
      "Компактный набор для студии загара и автобронзанта.",
    topSuggestions: withDefaults(
      ["Солярий", "Автозагар", "Автозагар с помощью аэрографа"],
      30,
      450
    ),
    popularServices: withDefaults(
      ["Скраб для тела", "Коррекция контуров тела"],
      45,
      650
    )
  },
  {
    key: "Физиотерапия",
    title: "Физиотерапия",
    heroTitle: "Услуги физиотерапии",
    heroDescription:
      "Шаблон для реабилитации и терапии: консультации, восстановление, мягкие ткани, спортивная медицина.",
    topSuggestions: withDefaults(
      ["Физиотерапия", "Реабилитация", "Спортивная медицина", "Магнитотерапия", "Сухое иглоукалывание"],
      60,
      800
    ),
    popularServices: withDefaults(
      [
        "Кинезитерапия",
        "Терапия мягких тканей",
        "Реабилитация позвоночника",
        "Лечение лимфедемы",
        "Вакуумная терапия",
        "Хиропрактика"
      ],
      60,
      900
    )
  },
  {
    key: "Другая",
    title: "Другая",
    heroTitle: "Подберите стартовые услуги",
    heroDescription:
      "Если категория нестандартная, начните с небольшого шаблона и добавляйте свои услуги по мере настройки бизнеса.",
    topSuggestions: withDefaults(["Консультация", "Основная услуга", "Повторный визит"], 45, 500),
    popularServices: withDefaults(["Пакет услуг", "Индивидуальная услуга", "Диагностика"], 60, 650)
  }
];

const baseServicePriceByLocalizationKey = new Map<string, { total: number; count: number }>();

for (const category of SERVICE_TEMPLATE_CATALOG) {
  for (const service of [...category.topSuggestions, ...category.popularServices]) {
    if (typeof service.price !== "number" || !Number.isFinite(service.price) || service.price <= 0) {
      continue;
    }

    const key = getServiceLocalizationKey(service.name);
    const current = baseServicePriceByLocalizationKey.get(key) ?? { total: 0, count: 0 };
    current.total += service.price;
    current.count += 1;
    baseServicePriceByLocalizationKey.set(key, current);
  }
}

export function getTemplateBasePriceUah(serviceName: string) {
  const key = getServiceLocalizationKey(serviceName);
  const stats = baseServicePriceByLocalizationKey.get(key);
  if (!stats || stats.count === 0) {
    return null;
  }

  return Math.round(stats.total / stats.count);
}

export const categoryOptions = SERVICE_TEMPLATE_CATALOG.map((item) => item.title);

const categoryNameTranslations: Record<string, LocalizedServiceText> = {
  "Парикмахерская": { ru: "Парикмахерская", uk: "Перукарня", en: "Hair salon" },
  "Ногти": { ru: "Ногти", uk: "Нігті", en: "Nails" },
  "Брови и ресницы": { ru: "Брови и ресницы", uk: "Брови та вії", en: "Brows and lashes" },
  "Салон красоты": { ru: "Салон красоты", uk: "Салон краси", en: "Beauty salon" },
  "Медспа": { ru: "Медспа", uk: "Медспа", en: "Medspa" },
  "Парикмахер": { ru: "Парикмахер", uk: "Перукар", en: "Hairdresser" },
  "Массажный салон": { ru: "Массажный салон", uk: "Масажний салон", en: "Massage studio" },
  "Спа-салон и сауна": { ru: "Спа-салон и сауна", uk: "Спа-салон і сауна", en: "Spa and sauna" },
  "Салон депиляции": { ru: "Салон депиляции", uk: "Салон депіляції", en: "Hair removal salon" },
  "Тату и пирсинг": { ru: "Тату и пирсинг", uk: "Тату та пірсинг", en: "Tattoo and piercing" },
  "Студия загара": { ru: "Студия загара", uk: "Студія засмаги", en: "Tanning studio" },
  "Физиотерапия": { ru: "Физиотерапия", uk: "Фізіотерапія", en: "Physiotherapy" },
  "Другая": { ru: "Другая", uk: "Інша", en: "Other" }
};

export function localizeCategoryName(category: string, language: ServiceTemplateLanguage) {
  return categoryNameTranslations[category]?.[language] ?? category;
}

export function getCategoryOptions(catalog: CategoryTemplate[] = SERVICE_TEMPLATE_CATALOG) {
  return catalog.map((item) => item.title);
}

export function getCategoryTemplate(
  category: string,
  catalog: CategoryTemplate[] = SERVICE_TEMPLATE_CATALOG
) {
  return (
    catalog.find((item) => item.title === category) ??
    catalog.find((item) => item.key === "Другая") ??
    SERVICE_TEMPLATE_CATALOG.find((item) => item.key === "Другая")!
  );
}

export function getServicesForCategories(
  categories: string[],
  catalog: CategoryTemplate[] = SERVICE_TEMPLATE_CATALOG,
  language: ServiceTemplateLanguage = "ru"
) {
  return Array.from(
    new Set(
      categories.flatMap((category) => {
        const template = getCategoryTemplate(category, catalog);
        return [...template.topSuggestions, ...template.popularServices].map((service) =>
          localizeServiceName(service.name, language, service.localizedName)
        );
      })
    )
  );
}
