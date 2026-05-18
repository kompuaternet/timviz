export type ServiceTemplateLanguage = "ru" | "uk" | "en" | "fr" | "pl" | "cs" | "es" | "de";

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

const serviceTranslationExtras: Record<string, Partial<Omit<LocalizedServiceText, "ru" | "uk" | "en">>> = {
  "Женская стрижка": { fr: "Coupe femme", pl: "Strzyżenie damskie", cs: "Dámský střih", es: "Corte de mujer", de: "Damenhaarschnitt" },
  "Мужская стрижка": { fr: "Coupe homme", pl: "Strzyżenie męskie", cs: "Pánský střih", es: "Corte de hombre", de: "Herrenhaarschnitt" },
  "Укладка волос": { fr: "Coiffure", pl: "Stylizacja włosów", cs: "Vlasový styling", es: "Peinado", de: "Haarstyling" },
  "Сушка феном": { fr: "Brushing", pl: "Suszenie", cs: "Vyfoukejte", es: "Blow-dry", de: "Föhnen" },
  "Детская стрижка": { fr: "Coupe enfant", pl: "Strzyżenie dziecięce", cs: "Dětský střih", es: "Corte infantil", de: "Kinderhaarschnitt" },
  "Окрашивание волос": { fr: "Coloration cheveux", pl: "Koloryzacja włosów", cs: "Barvení vlasů", es: "Tinte", de: "Haarfärben" },
  "Балаяж": { fr: "Balayage", pl: "Balayage", cs: "Balayage", es: "Balayage", de: "Balayage" },
  "Тонирование волос": { fr: "Tonification cheveux", pl: "Tonizacja włosów", cs: "Tónování vlasů", es: "Tonificación", de: "Haartonung" },
  "Подкрашивание корней": { fr: "Retouche racines", pl: "Retusz włosów", cs: "Kořenový retuš", es: "Retoque de raíces", de: "Ansatzausbesserung" },
  "Мытье волос": { fr: "Lavage des cheveux", pl: "Mycie włosów", cs: "Mytí vlasů", es: "Lavado de cabello", de: "Haarwäsche" },
  "Бритье головы": { fr: "Rasage de la tête", pl: "Golenie głowy", cs: "Holení hlavy", es: "Afeitado de cabeza", de: "Kopfrasur" },
  "Маникюр": { fr: "Manucure", pl: "Manicure", cs: "Manikúra", es: "Manicura", de: "Maniküre" },
  "Педикюр": { fr: "Pédicure", pl: "Pedicure", cs: "Pedikúra", es: "Pedicura", de: "Pediküre" },
  "Гелевый маникюр": { fr: "Manucure gel", pl: "Manicure żelowy", cs: "Gelová manikúra", es: "Manicura de gel", de: "Gel-Maniküre" },
  "Русский маникюр": { fr: "Manucure russe", pl: "Manicure rosyjski", cs: "Ruská manikúra", es: "Manicura rusa", de: "Russische Maniküre" },
  "Мужской маникюр и педикюр": { fr: "Manucure et pédicure homme", pl: "Manicure i pedicure męski", cs: "Pánská manikúra a pedikúra", es: "Manicura y pedicura masculina", de: "Herrenmaniküre und Pediküre" },
  "Акриловые ногти": { fr: "Ongles en acrylique", pl: "Paznokcie akrylowe", cs: "Akrylové nehty", es: "Uñas acrílicas", de: "Acrylnägel" },
  "Дизайн ногтей": { fr: "Nail art", pl: "Stylizacja paznokci", cs: "Nail art", es: "Diseño de uñas", de: "Nageldesign" },
  "Наращивание ногтей": { fr: "Extensions d’ongles", pl: "Przedłużanie paznokci", cs: "Prodloužení nehtů", es: "Extensiones de uñas", de: "Nagelverlängerung" },
  "Ремонт ногтей": { fr: "Réparation d’ongle", pl: "Naprawa paznokcia", cs: "Oprava nehtu", es: "Reparación de uñas", de: "Nagelreparatur" },
  "Маникюр и педикюр": { fr: "Manucure et pédicure", pl: "Manicure i pedicure", cs: "Manikúra & pedikúra", es: "Manicura y pedicura", de: "Maniküre und Pediküre" },
  "Парафиновый маникюр": { fr: "Manucure à la paraffine", pl: "Manicure parafinowy", cs: "Parafínová manikúra", es: "Manicura con parafina", de: "Paraffin-Maniküre" },
  "Медицинский педикюр": { fr: "Pédicure médicale", pl: "Pedicure medyczny", cs: "Lékařská pedikúra", es: "Pedicura médica", de: "Medizinische Pediküre" },
  "Детский маникюр и педикюр": { fr: "Manucure et pédicure pour enfants", pl: "Manicure i pedicure dziecięcy", cs: "Dětská manikúra a pedikúra", es: "Manicura y pedicura para niños", de: "Kinder-Maniküre und Pediküre" },
  "Коррекция формы бровей": { fr: "Mise en forme des sourcils", pl: "Kształtowanie brwi", cs: "Úprava obočí", es: "Modelado de cejas", de: "Augenbrauen formen" },
  "Окрашивание бровей": { fr: "Teinture des sourcils", pl: "Laminacja brwi", cs: "Barvení obočí", es: "Tinte de cejas", de: "Augenbrauen färben" },
  "Ламинирование бровей": { fr: "Stratification des sourcils", pl: "Laminowanie brwi", cs: "Laminace obočí", es: "Laminación de cejas", de: "Augenbrauenlaminierung" },
  "Наращивание ресниц": { fr: "Extensions de cils", pl: "Przedłużanie rzęs", cs: "Prodlužování řas", es: "Extensiones de pestañas", de: "Wimpernverlängerung" },
  "Ламинирование ресниц": { fr: "Rehaussement des cils", pl: "Lifting rzęs", cs: "Lash lift", es: "Levantamiento de pestañas", de: "Wimpernlifting" },
  "Коррекция бровей нитью": { fr: "Filage des sourcils", pl: "Nitkowanie brwi", cs: "Navlékání obočí", es: "Depilación de cejas", de: "Augenbrauen einfädeln" },
  "Восковая эпиляция бровей": { fr: "Épilation des sourcils", pl: "Depilacja brwi", cs: "Depilace obočí", es: "Depilación de cejas", de: "Augenbrauen wachsen" },
  "Микропигментация бровей": { fr: "Micropigmentation des sourcils", pl: "Mikropigmentacja brwi", cs: "Mikropigmentace obočí", es: "Micropigmentación de cejas", de: "Augenbrauen-Mikropigmentierung" },
  "Перманентный макияж бровей": { fr: "Maquillage permanent des sourcils", pl: "Makijaż permanentny brwi", cs: "Permanentní make-up obočí", es: "Maquillaje permanente de cejas", de: "Permanentes Augenbrauen-Make-up" },
  "Коррекция ресниц": { fr: "Correction des cils", pl: "Korekta rzęs", cs: "Korekce řas", es: "Corrección de pestañas", de: "Wimpernkorrektur" },
  "Подтяжка ресниц": { fr: "Traitement lifting des cils", pl: "Zabieg liftingu rzęs", cs: "Lish lift ošetření", es: "Tratamiento de levantamiento de pestañas", de: "Wimpernlifting-Behandlung" },
  "Удаление ресниц": { fr: "Élimination des cils", pl: "Depilacja rzęs", cs: "Odstranění řas", es: "Eliminación de pestañas", de: "Wimpernentfernung" },
  "Окрашивание ресниц": { fr: "Teinture de cils", pl: "Laminacja rzęs", cs: "Barvení řas", es: "Tinte de pestañas", de: "Wimpern färben" },
  "Уход за лицом": { fr: "Soin du visage", pl: "Zabieg na twarz", cs: "Ošetření obličeje", es: "Tratamiento facial", de: "Gesichtsbehandlung" },
  "Пилинг для лица": { fr: "Peeling du visage", pl: "Peeling twarzy", cs: "Peeling na obličej", es: "Peeling facial", de: "Gesichtspeeling" },
  "Спа-процедура для лица": { fr: "Soin spa du visage", pl: "Zabieg SPA na twarz", cs: "Lázeňské ošetření obličeje", es: "Tratamiento spa facial", de: "Gesichts-Spa-Behandlung" },
  "Консультация по эстетической медицине": { fr: "Consultation de médecine esthétique", pl: "Konsultacja medycyny estetycznej", cs: "Konzultace estetické medicíny", es: "Consulta de medicina estética", de: "Ästhetische Medizinberatung" },
  "Омоложение лица": { fr: "Rajeunissement du visage", pl: "Odmładzanie twarzy", cs: "Omlazení obličeje", es: "Rejuvenecimiento facial", de: "Gesichtsverjüngung" },
  "Химический пилинг": { fr: "Peeling chimique", pl: "Peeling chemiczny", cs: "Chemický peeling", es: "Peeling químico", de: "Chemisches Peeling" },
  "Мезотерапия": { fr: "Mésothérapie", pl: "Mezoterapia", cs: "Mezoterapie", es: "Mesoterapia", de: "Mesotherapie" },
  "Дарсонваль": { fr: "Thérapie Darsonval", pl: "Terapia darsonvalowa", cs: "Darsonvalová terapie", es: "Terapia Darsonval", de: "Darsonval-Therapie" },
  "Микродермабразия": { fr: "Microdermabrasion", pl: "Mikrodermabrazja", cs: "Mikrodermabraze", es: "Microdermoabrasión", de: "Mikrodermabrasion" },
  "Безоперационная подтяжка лица": { fr: "Lifting non chirurgical", pl: "Niechirurgiczny lifting twarzy", cs: "Nechirurgický facelift", es: "Lifting facial no quirúrgico", de: "Nicht-chirurgisches Facelift" },
  "Подтяжка лица": { fr: "Lifting", pl: "Lifting twarzy", cs: "Facelift", es: "Lifting facial", de: "Facelift" },
  "Подтяжка шеи": { fr: "Lifting du cou", pl: "Lifting szyi", cs: "Zvednutí krku", es: "Lifting de cuello", de: "Halsstraffung" },
  "Коррекция фигуры": { fr: "Contour du corps", pl: "Konturowanie ciała", cs: "Tvarování těla", es: "Contorno corporal", de: "Körperformung" },
  "Ультразвуковая кавитация": { fr: "Cavitation par ultrasons", pl: "Kawitacja ultradźwiękowa", cs: "Ultrazvuková kavitace", es: "Cavitación ultrasónica", de: "Ultraschallkavitation" },
  "Карбокситерапия": { fr: "Carboxythérapie", pl: "Karboksyterapia", cs: "Karboxyterapie", es: "Carboxiterapia", de: "Carboxytherapie" },
  "Стрижка под машинку": { fr: "Coupe de cheveux à la tondeuse", pl: "Strzyżenie maszynką", cs: "Clipper účes", es: "Corte de pelo con maquinilla", de: "Haarschneidemaschine" },
  "Стрижка и борода": { fr: "Coupe de cheveux et barbe", pl: "Strzyżenie i broda", cs: "Střih a vousy", es: "Corte de pelo y barba", de: "Haarschnitt und Bart" },
  "Уход за бородой": { fr: "Entretien de la barbe", pl: "Pielęgnacja brody", cs: "Úprava vousů", es: "Aseo de barba", de: "Bartpflege" },
  "Формирование бороды": { fr: "Mise en forme de la barbe", pl: "Kształtowanie brody", cs: "Tvarování vousů", es: "Modelado de barba", de: "Bartformung" },
  "Бритье бороды": { fr: "Rasage de la barbe", pl: "Golenie brody", cs: "Holení vousů", es: "Afeitado de barba", de: "Bartrasur" },
  "Бритье опасной бритвой": { fr: "Rasage au rasoir droit", pl: "Golenie brzytwą", cs: "Rovné holení břitvou", es: "Afeitado con navaja de afeitar", de: "Rasieren mit dem Rasiermesser" },
  "Бритье головы и стрижка бороды": { fr: "Rasage de la tête et taille de la barbe", pl: "Golenie głowy i przycinanie brody", cs: "Holení hlavy a zastřihování vousů", es: "Afeitado de cabeza y corte de barba", de: "Kopfrasur und Bartschneiden" },
  "Подстригание усов": { fr: "Taille de la moustache", pl: "Strzyżenie wąsów", cs: "Úprava kníru", es: "Recorte de bigote", de: "Schnurrbartschneiden" },
  "Окрашивание бороды": { fr: "Coloration de la barbe", pl: "Koloryzacja brody", cs: "Barvení vousů", es: "Coloración de barba", de: "Bartfärbung" },
  "Скин Фейд": { fr: "Décoloration de la peau", pl: "Blaknięcie skóry", cs: "Kůže vybledne", es: "Desvanecimiento de la piel", de: "Hautausbleichung" },
  "Классический массаж": { fr: "Massage classique", pl: "Masaż klasyczny", cs: "Klasická masáž", es: "Masaje clásico", de: "Klassische Massage" },
  "Расслабляющий массаж": { fr: "Massage relaxant", pl: "Masaż relaksacyjny", cs: "Relaxační masáž", es: "Masaje relajante", de: "Entspannungsmassage" },
  "Массаж спины": { fr: "Massage du dos", pl: "Masaż pleców", cs: "Masáž zad", es: "Masaje de espalda", de: "Rückenmassage" },
  "Массаж всего тела": { fr: "Massage complet du corps", pl: "Masaż całego ciała", cs: "Masáž celého těla", es: "Masaje de cuerpo completo", de: "Ganzkörpermassage" },
  "Лечебный массаж": { fr: "Massage thérapeutique", pl: "Masaż leczniczy", cs: "Terapeutická masáž", es: "Masaje terapéutico", de: "Therapeutische Massage" },
  "Антицеллюлитный массаж": { fr: "Massage anti-cellulite", pl: "Masaż antycellulitowy", cs: "Anticelulitidní masáž", es: "Masaje anticelulítico", de: "Anti-Cellulite-Massage" },
  "Глубокотканный массаж": { fr: "Massage des tissus profonds", pl: "Masaż tkanek głębokich", cs: "Masáž hlubokých tkání", es: "Masaje de tejido profundo", de: "Tiefengewebsmassage" },
  "Лимфатический массаж": { fr: "Massage lymphatique", pl: "Masaż limfatyczny", cs: "Lymfatická masáž", es: "Masaje linfático", de: "Lymphmassage" },
  "Массаж лица": { fr: "Massage du visage", pl: "Masaż twarzy", cs: "Masáž obličeje", es: "Masaje facial", de: "Gesichtsmassage" },
  "Массаж горячими камнями": { fr: "Massage aux pierres chaudes", pl: "Masaż gorącymi kamieniami", cs: "Masáž lávovými kameny", es: "Masaje con piedras calientes", de: "Hot-Stone-Massage" },
  "Спортивный массаж": { fr: "Massage sportif", pl: "Masaż sportowy", cs: "Sportovní masáž", es: "Masaje deportivo", de: "Sportmassage" },
  "Тайский массаж": { fr: "Massage thaïlandais", pl: "Masaż tajski", cs: "Thajská masáž", es: "Masaje tailandés", de: "Thai-Massage" },
  "Сауна": { fr: "Sauna", pl: "Sauna", cs: "Sauna", es: "Sauna", de: "Sauna" },
  "Скраб для тела": { fr: "Gommage corporel", pl: "Peeling ciała", cs: "Tělový peeling", es: "Exfoliante corporal", de: "Körperpeeling" },
  "Спа-салон для пар": { fr: "Séance spa en couple", pl: "Sesja spa dla par", cs: "Párové lázeňské sezení", es: "Sesión de spa para parejas", de: "Spa-Sitzung für Paare" },
  "Комната для медитации": { fr: "Salle de méditation", pl: "Pokój medytacyjny", cs: "Meditační místnost", es: "Sala de meditación", de: "Meditationsraum" },
  "Автозагар": { fr: "Spray bronzage", pl: "Opalenizna natryskowa", cs: "Opálení ve spreji", es: "Bronceado en spray", de: "Spray Tan" },
  "Автозагар с помощью аэрографа": { fr: "Spray bronzage à l'aérographe", pl: "Opalenizna natryskowa aerografem", cs: "Airbrush sprej opálení", es: "Bronceado en spray con aerógrafo", de: "Airbrush Spray Tan" },
  "Солярий": { fr: "Lit de bronzage", pl: "Solarium", cs: "Solárium", es: "Cama de bronceado", de: "Solarium" },
  "Соляная комната": { fr: "Salle de sel", pl: "Sala solna", cs: "Solná místnost", es: "Sala de sal", de: "Salzraum" },
  "Коррекция контуров тела": { fr: "Correction du contour du corps", pl: "Korekcja konturu ciała", cs: "Korekce kontur těla", es: "Corrección del contorno corporal", de: "Körperkonturkorrektur" },
  "Депиляция воском": { fr: "Épilation à la cire", pl: "Depilacja woskiem", cs: "Depilace voskem", es: "Depilación con cera", de: "Haarentfernung mit Wachs" },
  "Лазерная эпиляция": { fr: "Épilation laser", pl: "Depilacja laserowa", cs: "Laserové odstranění chloupků", es: "Depilación láser", de: "Laser-Haarentfernung" },
  "Удаление волос на лице": { fr: "Épilation du visage", pl: "Depilacja twarzy", cs: "Odstraňování chloupků na obličeji", es: "Depilación facial", de: "Gesichtshaarentfernung" },
  "Депиляция подмышек воском": { fr: "Épilation des aisselles", pl: "Depilacja pach", cs: "Depilace podpaží", es: "Depilación de axilas", de: "Achselentfernung" },
  "Депиляция зоны бикини": { fr: "Épilation du maillot", pl: "Depilacja okolic bikini", cs: "Depilace v oblasti bikin", es: "Depilación de bikini", de: "Bikini-Haarentfernung" },
  "Депиляция ног воском": { fr: "Épilation des jambes", pl: "Depilacja nóg", cs: "Depilace nohou", es: "Depilación de piernas", de: "Beinentfernung" },
  "Депиляция рук воском": { fr: "Épilation des bras", pl: "Depilacja ramion", cs: "Depilace paží", es: "Depilación de brazos", de: "Armentfernung" },
  "Депиляция губ воском": { fr: "Épilation de la lèvre supérieure", pl: "Depilacja górnej wargi", cs: "Depilace horního rtu", es: "Depilación de labio superior", de: "Oberlippenentfernung" },
  "Депиляция живота воском": { fr: "Épilation de l'abdomen", pl: "Depilacja brzucha", cs: "Depilace břicha", es: "Depilación de abdomen", de: "Bauchentfernung" },
  "Депиляция спины воском": { fr: "Épilation du dos", pl: "Depilacja pleców", cs: "Depilace zad voskem", es: "Depilación de espalda", de: "Rückenentfernung" },
  "IPL-эпиляция": { fr: "Épilation IPL", pl: "Depilacja IPL", cs: "IPL epilace", es: "Depilación IPL", de: "IPL-Haarentfernung" },
  "Электролиз": { fr: "Électrolyse", pl: "Elektroliza", cs: "Elektrolýza", es: "Electrólisis", de: "Elektrolyse" },
  "Резьба": { fr: "Filetage", pl: "Threading", cs: "Řezání závitů", es: "Roscado", de: "Threading" },
  "Сеанс татуировки": { fr: "Séance de tatouage", pl: "Sesja tatuażu", cs: "Sezení tetování", es: "Sesión de tatuaje", de: "Tattoo-Sitzung" },
  "Консультация по татуировкам": { fr: "Consultation de tatouage", pl: "Konsultacja tatuażu", cs: "Tetovací konzultace", es: "Consulta de tatuaje", de: "Tattoo-Beratung" },
  "Пирсинг носа": { fr: "Perçage du nez", pl: "Przekłuwanie nosa", cs: "Piercing do nosu", es: "Perforación de nariz", de: "Nasenpiercing" },
  "Прокалывание ушей": { fr: "Perçage des oreilles", pl: "Przekłuwanie uszu", cs: "Piercing do uší", es: "Perforación de oreja", de: "Ohrpiercing" },
  "Пирсинг тела": { fr: "Perçage du corps", pl: "Przekłuwanie ciała", cs: "Body piercing", es: "Perforación corporal", de: "Körperpiercing" },
  "Временные татуировки": { fr: "Tatouages temporaires", pl: "Tatuaże tymczasowe", cs: "Dočasná tetování", es: "Tatuajes temporales", de: "Temporäre Tattoos" },
  "Удаление татуировок": { fr: "Détatouage", pl: "Usuwanie tatuażu", cs: "Odstranění tetování", es: "Eliminación de tatuajes", de: "Tattooentfernung" },
  "Пирсинг пупка": { fr: "Perçage du nombril", pl: "Przekłuwanie pępka", cs: "Piercing do pupíku", es: "Perforación de ombligo", de: "Nabelpiercing" },
  "Пирсинг языка": { fr: "Perçage de la langue", pl: "Przekłuwanie języka", cs: "Piercing do jazyka", es: "Perforación de lengua", de: "Zungenpiercing" },
  "Пирсинг хряща": { fr: "Perçage du cartilage", pl: "Piercing chrząstki", cs: "Piercing do chrupavky", es: "Perforación de cartílago", de: "Knorpelpiercing" },
  "Интимный пирсинг": { fr: "Piercing intime", pl: "Piercing intymny", cs: "Intimní piercing", es: "Piercing íntimo", de: "Intimpiercing" },
  "Физиотерапия": { fr: "Physiothérapie", pl: "Fizjoterapia", cs: "Fyzioterapie", es: "Fisioterapia", de: "Physiotherapie" },
  "Реабилитация": { fr: "Rééducation", pl: "Rehabilitacja", cs: "Rehabilitace", es: "Rehabilitación", de: "Rehabilitation" },
  "Спортивная медицина": { fr: "Médecine du sport", pl: "Medycyna sportowa", cs: "Sportovní medicína", es: "Medicina deportiva", de: "Sportmedizin" },
  "Магнитотерапия": { fr: "Magnétothérapie", pl: "Magnetoterapia", cs: "Magnetoterapie", es: "Magnetoterapia", de: "Magnetfeldtherapie" },
  "Сухое иглоукалывание": { fr: "Aiguilles à sec", pl: "Suche igłowanie", cs: "Suché jehlování", es: "Punción seca", de: "Dry Needling" },
  "Кинезитерапия": { fr: "Kinésithérapie", pl: "Kinezyterapia", cs: "Kineziterapie", es: "Cinesiterapia", de: "Kinesitherapie" },
  "Терапия мягких тканей": { fr: "Thérapie des tissus mous", pl: "Terapia tkanek miękkich", cs: "Terapie měkkých tkání", es: "Terapia de tejidos blandos", de: "Weichteiltherapie" },
  "Реабилитация позвоночника": { fr: "Rééducation de la colonne vertébrale", pl: "Rehabilitacja kręgosłupa", cs: "Rehabilitace páteře", es: "Rehabilitación de la columna", de: "Wirbelsäulenrehabilitation" },
  "Лечение лимфедемы": { fr: "Traitement du lymphœdème", pl: "Leczenie obrzęku limfatycznego", cs: "Léčba lymfedému", es: "Tratamiento de linfedema", de: "Lymphödembehandlung" },
  "Вакуумная терапия": { fr: "Thérapie sous vide", pl: "Terapia próżniowa", cs: "Vakuová terapie", es: "Terapia de vacío", de: "Vakuumtherapie" },
  "Хиропрактика": { fr: "Soins chiropratiques", pl: "Chiropraktyka", cs: "Chiropraktická péče", es: "Atención quiropráctica", de: "Chiropraktische Pflege" },
  "Консультация": { fr: "Consultation", pl: "Konsultacje", cs: "Konzultace", es: "Consulta", de: "Beratung" },
  "Основная услуга": { fr: "Service de base", pl: "Usługa podstawowa", cs: "Základní služba", es: "Servicio principal", de: "Kerndienstleistung" },
  "Повторный визит": { fr: "Visite de suivi", pl: "Wizyta kontrolna", cs: "Následná návštěva", es: "Visita de seguimiento", de: "Folgebesuch" },
  "Пакет услуг": { fr: "Forfait services", pl: "Pakiet usług", cs: "Balíček služeb", es: "Paquete de servicios", de: "Servicepaket" },
  "Индивидуальная услуга": { fr: "Service personnalisé", pl: "Usługa niestandardowa", cs: "Zákaznická služba", es: "Servicio personalizado", de: "Individueller Service" },
  "Диагностика": { fr: "Diagnostic", pl: "Diagnostyka", cs: "Diagnostika", es: "Diagnóstico", de: "Diagnose" },
};

const serviceTranslationIndex = new Map<string, LocalizedServiceText>();

for (const [ru, item] of Object.entries(serviceTranslations)) {
  const extra = serviceTranslationExtras[ru] ?? {};
  const normalized = {
    ru,
    uk: item.uk,
    en: item.en,
    fr: extra.fr || item.en,
    pl: extra.pl || item.en,
    cs: extra.cs || item.en,
    es: extra.es || item.en,
    de: extra.de || item.en
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
    en: localizedName?.en?.trim() || base?.en || base?.ru || name,
    fr: localizedName?.fr?.trim() || base?.fr || base?.en || base?.ru || name,
    pl: localizedName?.pl?.trim() || base?.pl || base?.en || base?.ru || name,
    cs: localizedName?.cs?.trim() || base?.cs || base?.en || base?.ru || name,
    es: localizedName?.es?.trim() || base?.es || base?.en || base?.ru || name,
    de: localizedName?.de?.trim() || base?.de || base?.en || base?.ru || name
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
  "Парикмахерская": { ru: "Парикмахерская", uk: "Перукарня", en: "Hair salon", fr: "Salon de coiffure", pl: "Salon fryzjerski", cs: "Kadeřnictví", es: "Peluquería", de: "Friseursalon" },
  "Ногти": { ru: "Ногти", uk: "Нігті", en: "Nails", fr: "Ongles", pl: "Paznokcie", cs: "Nehty", es: "Uñas", de: "Nägel" },
  "Брови и ресницы": { ru: "Брови и ресницы", uk: "Брови та вії", en: "Brows and lashes", fr: "Sourcils et cils", pl: "Brwi i rzęsy", cs: "Obočí a řasy", es: "Cejas y pestañas", de: "Augenbrauen und Wimpern" },
  "Салон красоты": { ru: "Салон красоты", uk: "Салон краси", en: "Beauty salon", fr: "Institut de beauté", pl: "Salon beauty", cs: "Kosmetický salon", es: "Salón de belleza", de: "Kosmetikstudio" },
  "Медспа": { ru: "Медспа", uk: "Медспа", en: "Medspa", fr: "Medspa", pl: "Medspa", cs: "Medspa", es: "Medspa", de: "Medspa" },
  "Парикмахер": { ru: "Парикмахер", uk: "Перукар", en: "Hairdresser", fr: "Coiffeur", pl: "Fryzjer", cs: "Kadeřník", es: "Peluquero", de: "Friseur" },
  "Массажный салон": { ru: "Массажный салон", uk: "Масажний салон", en: "Massage studio", fr: "Salon de massage", pl: "Gabinet masażu", cs: "Masážní salon", es: "Centro de masajes", de: "Massagestudio" },
  "Спа-салон и сауна": { ru: "Спа-салон и сауна", uk: "Спа-салон і сауна", en: "Spa and sauna", fr: "Spa et sauna", pl: "Spa i sauna", cs: "Spa a sauna", es: "Spa y sauna", de: "Spa und Sauna" },
  "Салон депиляции": { ru: "Салон депиляции", uk: "Салон депіляції", en: "Hair removal salon", fr: "Salon d'épilation", pl: "Salon depilacji", cs: "Depilační salon", es: "Centro de depilación", de: "Haarentfernungsstudio" },
  "Тату и пирсинг": { ru: "Тату и пирсинг", uk: "Тату та пірсинг", en: "Tattoo and piercing", fr: "Tatouage et piercing", pl: "Tatuaż i piercing", cs: "Tetování a piercing", es: "Tatuajes y piercing", de: "Tattoo und Piercing" },
  "Студия загара": { ru: "Студия загара", uk: "Студія засмаги", en: "Tanning studio", fr: "Studio de bronzage", pl: "Studio opalania", cs: "Solární studio", es: "Centro de bronceado", de: "Sonnenstudio" },
  "Физиотерапия": { ru: "Физиотерапия", uk: "Фізіотерапія", en: "Physiotherapy", fr: "Kinésithérapie", pl: "Fizjoterapia", cs: "Fyzioterapie", es: "Fisioterapia", de: "Physiotherapie" },
  "Другая": { ru: "Другая", uk: "Інша", en: "Other", fr: "Autre", pl: "Inne", cs: "Jiné", es: "Otra", de: "Andere" }
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
