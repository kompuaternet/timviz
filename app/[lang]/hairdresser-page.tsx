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
  ctaAfterFeatures: string;
  ctaBottom: string;
  ctaHint: string;
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
  telegramText: string;
  nicheTitle: string;
  nicheText: string;
  nicheItems: string[];
  dayScenarioTitle?: string;
  dayScenarioItems?: string[];
  socialTitle: string;
  socialText: string;
  trustTitle?: string;
  trustCards?: InfoCard[];
  seoBlockTitle: string;
  seoParagraphs: string[];
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalText: string;
  finalButton: string;
  linksTitle: string;
  links: Array<{ label: string; href: string }>;
  footerText: string;
  privacy: string;
  terms: string;
  altCalendar: string;
  altService: string;
  altTelegram: string;
};

const ruSeoParagraphs = [
  "Если вы парикмахер и хотите стабильно принимать запись клиентов онлайн, ключевая задача — убрать хаос из мессенджеров. Когда запись на стрижку идет через WhatsApp, Telegram и Instagram одновременно, вы тратите время не на работу, а на ручную координацию. Timviz работает как программа для записи клиентов и помогает собрать все обращения в единую систему. Клиент видит понятную форму, выбирает услугу парикмахера и доступный слот, а вы сразу получаете структурированную запись без лишних звонков.",
  "Для мастера, который ведет плотный график работы парикмахера, критично видеть реальную картину дня. Календарь записей в Timviz показывает длительность каждой процедуры, статус визита и свободные окна между клиентами. Это снижает риск накладок, когда две записи попадают в один и тот же промежуток. Вместо ручного пересчета времени вы работаете с автоматизированным расписанием, где учтены стрижка, окрашивание, укладка и сложные процедуры с индивидуальной длительностью.",
  "Timviz подходит не только как сервис онлайн-записи, но и как легкая CRM для парикмахера. В одном кабинете находятся услуги, цены, рабочие дни и поток заявок. Это особенно важно, если вы работаете без администратора и управляете всем самостоятельно. Программа для записи клиентов помогает стандартизировать процесс: клиент заранее видит цену, вы заранее видите нагрузку, а значит меньше переносов и меньше недопониманий в день приема.",
  "Онлайн запись для парикмахеров дает измеримый эффект в ежедневной работе: меньше потерянных обращений, быстрее подтверждение записи, выше дисциплина клиентов. Когда система автоматически предлагает только свободное время, запись клиентов без звонков становится реальным рабочим сценарием, а не теорией. Для салонов и частных мастеров это означает более ровную загрузку, снижение пауз между услугами и более предсказуемую выручку в течение недели.",
  "Отдельный плюс Timviz — управление услугами парикмахера с разной сложностью. В реальной практике простая мужская стрижка и сложное окрашивание требуют разного времени и подготовки. В Timviz вы настраиваете длительность, описание и стоимость каждой услуги, чтобы клиент выбирал корректный формат записи. Так программа для записи клиентов снижает операционные ошибки: меньше случаев, когда записали короткий слот под длинную процедуру.",
  "Календарь записей также решает задачу повторных визитов и планирования вперед. Вы можете быстро оценить неделю, увидеть загруженные часы и предлагать клиентам удобные альтернативы без длительной переписки. Это делает работу более профессиональной: вместо отложенных ответов у вас есть конкретные окна и понятная логика расписания. В результате запись на стрижку и другие услуги становится прозрачной и удобной как для мастера, так и для клиента.",
  "Для многих мастеров ключевой вопрос — как не пропускать новые заявки. Telegram уведомления в Timviz закрывают этот риск: вы сразу получаете сигнал о новой записи, изменении времени или подтверждении визита. Даже если вы заняты у клиента, после процедуры можно быстро открыть календарь и проверить обновления. Такая связка CRM для парикмахера и мгновенных уведомлений помогает держать сервис на высоком уровне без постоянного мониторинга нескольких чатов.",
  "Если вам нужна программа для записи клиентов, которая не требует долгого внедрения, Timviz позволяет стартовать за несколько минут. Вы создаете профиль, добавляете услуги парикмахера, задаете график работы парикмахера и делитесь ссылкой на клиентскую запись онлайн. С этого момента поток заявок идет в понятную систему, а не теряется в сообщениях. Именно так онлайн запись для парикмахеров превращается в инструмент роста, а не просто еще один канал коммуникации.",
  "Реальные сценарии работы показывают эффект очень быстро. Например, утром идут короткие мужские стрижки по 30–45 минут, в середине дня — окрашивания по 120–180 минут, вечером — укладки к мероприятиям. Без структуры эти форматы часто конфликтуют между собой. Timviz позволяет заранее задать длительность каждой услуги и автоматически предотвращает пересечения. В итоге календарь записей заполняется логично: меньше простоев, меньше переработок, больше точности и спокойствия в течение всей смены.",
  "Для салонов с несколькими специалистами важна прозрачная картина загруженности. Когда руководитель видит только разрозненные чаты, сложно управлять потоками клиентов и сменами мастеров. Timviz дает общий контур: кто загружен, где есть свободные окна, какие услуги чаще бронируют. Такая аналитика помогает улучшать расписание, запускать акции в незагруженные часы и перераспределять записи без конфликтов. Программа для записи клиентов в этом случае работает не только как календарь, но и как инструмент управленческих решений.",
  "Клиентский опыт тоже становится сильнее. Человек получает понятный путь: выбирает услугу, видит цену, длительность и подтверждает удобное время без ожидания ответа. Это снижает вероятность того, что клиент уйдет к конкуренту только потому, что не дождался обратной связи. Запись клиентов онлайн становится быстрым действием в пару кликов, а это напрямую увеличивает конверсию из интереса в визит. Для парикмахера это означает более стабильный поток и меньше маркетинговых потерь.",
  "Если подвести итог, Timviz закрывает весь цикл записи: от первой заявки до повторного визита. Онлайн запись для парикмахеров, календарь записей, программа для записи клиентов и Telegram уведомления работают в одной системе и дают мастеру реальный контроль над днем. Вы не тратите энергию на ручной хаос, а фокусируетесь на качестве услуг и росте среднего чека. Именно эта комбинация делает сервис практичным для ежедневной работы и заметно повышает вероятность, что клиент вернется снова.",
  "Для мастеров, которые развивают личный бренд, скорость и предсказуемость записи часто важнее любой рекламы. Когда клиент один раз легко записался и пришел без накладок, он чаще рекомендует специалиста знакомым. Timviz помогает закрепить этот эффект: запись на стрижку становится простой и стабильной, а график работы парикмахера — прозрачным и управляемым. Поэтому сервис полезен не только для операционки, но и как инструмент роста репутации и повторных продаж."
];

const ukSeoParagraphs = [
  "Для сучасного перукаря онлайн запис для перукарів уже не є додатковою опцією, а стає основою стабільного графіка. Коли клієнти пишуть у різні месенджери, частина заявок губиться, час на відповіді росте, а майстер витрачає енергію не на якість послуги, а на ручну координацію. Timviz вирішує цю проблему як програма для запису клієнтів: усі запити збираються в одному місці, клієнт одразу бачить доступний слот, а перукар працює за передбачуваним планом дня. Це дає кращий сервіс, більше підтверджених візитів і менше стресу в пікові години.",
  "Коли в роботі є різні послуги — коротка чоловіча стрижка, довге фарбування, укладка перед подією або складна процедура відновлення — без системи легко зробити накладку. Календар записів у Timviz показує не просто список клієнтів, а реальну структуру дня: тривалість кожної послуги, вільні вікна, поточні підтвердження та зміни. Завдяки цьому майстер бачить повну картину завантаження й не ставить складні послуги в занадто короткі проміжки. Запис клієнтів онлайн стає керованим процесом, де графік допомагає заробляти, а не створює хаос, а графік роботи перукаря стає передбачуваним.",
  "Багато перукарів шукають інструмент, який працює як CRM для перукаря, але без складного впровадження та навчання. Timviz дає саме такий формат: у кабінеті є послуги, ціни, тривалість, розклад і клієнтські записи. Вам не потрібно окремо вести таблиці, виписувати час у нотатки чи тримати все в голові. Програма для запису клієнтів підказує структуру: клієнт обирає потрібну послугу, система пропонує коректні вільні слоти, а ви одразу розумієте, як виглядає день. Це скорочує кількість помилок і робить обслуговування стабільно професійним.",
  "Окремий плюс для майстра — прозора комунікація з клієнтом до візиту. Коли запис робиться вручну, клієнт часто не бачить остаточної ціни, не розуміє тривалість процедури або плутає час. У Timviz це знімається на етапі вибору: опис послуги, ціна і тривалість задані наперед. Онлайн запис клієнтів у такому форматі зменшує кількість уточнень і переносів, а запис клієнтів онлайн стає зрозумілим і швидким для обох сторін. Людина одразу розуміє, на що записується, а перукар не витрачає вечір на повторні підтвердження. В результаті зростає якість сервісу і довіра до майстра як до організованого спеціаліста.",
  "Календар записів особливо важливий тим, хто працює у щільному темпі та приймає багато повторних клієнтів. За день може бути десятки дрібних змін: хтось переносить візит, хтось додає послугу, хтось просить інший час. Якщо все це вести в чатах, ризик помилки дуже високий. Timviz збирає ці зміни в єдиній системі, де видно оновлений графік без ручного перерахунку. Запис клієнтів онлайн у поєднанні з таким календарем допомагає тримати дисципліну дня, скорочує простої між візитами й дозволяє швидко пропонувати клієнтам найближчі вільні вікна без довгої переписки.",
  "Ще одна критична потреба перукаря — швидко бачити нові бронювання, не відкриваючи постійно кілька додатків. Саме тому в Timviz є Telegram-сповіщення: майстер одразу отримує сигнал про новий запис, зміну часу або скасування. Це практичний інструмент, особливо коли ви зайняті з клієнтом і не можете контролювати чат щохвилини. CRM для перукаря у зв’язці з миттєвими повідомленнями зменшує ризик пропущених заявок і дозволяє тримати сервіс на високому рівні. Клієнт бачить швидку реакцію, а ви зберігаєте фокус на роботі, а не на ручному адмініструванні.",
  "У реальному робочому дні важлива не тільки кількість записів, а й якість завантаження. Коли між клієнтами з’являються випадкові розриви, майстер втрачає час, а коли записи стоять надто щільно, зростає ризик запізнень. Timviz допомагає вирівнювати графік: календар записів показує слабкі місця, а програма для запису клієнтів дає можливість точніше налаштувати тривалість і доступні вікна. У результаті онлайн запис клієнтів працює не хаотично, а як передбачуваний потік. Це покращує ритм дня, дає стабільніший дохід і робить сервіс для клієнта більш професійним.",
  "Для салонів і команд із кількох майстрів Timviz також працює як зрозуміла програма для запису клієнтів. Кожен спеціаліст може вести свій графік, а адміністратор або керівник бачить загальну картину завантаження. Це важливо для планування робочих змін, запуску акцій та розподілу потоку клієнтів між майстрами. Онлайн запис клієнтів у такій моделі не створює хаос у спільному календарі, а навпаки, дає контроль над усією системою запису. Навіть якщо ви починаєте як приватний майстер, у майбутньому легко масштабувати роботу без переходу на інший інструмент.",
  "Також важливо, що сервіс закриває пошуковий намір за запитом «запис клієнтів перукар»: клієнт швидко обирає послугу і бронює час без зайвих кроків, а майстер отримує підтверджений візит у календарі.",
  "Сильна сторона Timviz у тому, що сервіс швидко запускається й не вимагає окремого сайту. Перукар створює профіль, додає послуги, налаштовує робочі дні та одразу може приймати записи. Клієнтська сторінка працює за посиланням: це зручно для Instagram, Telegram, Viber та будь-яких інших каналів. Запис клієнтів онлайн перестає бути хаотичним листуванням і перетворюється на зрозумілий процес із чіткими правилами. У підсумку майстер отримує більше підтверджених візитів, менше втрат і стабільніше планування доходу на тиждень або місяць.",
  "Якщо підсумувати, Timviz дає перукарю саме те, що впливає на результат: календар записів, структуровану CRM для перукаря, контроль цін і тривалості послуг, швидкі сповіщення та простий старт без технічних бар’єрів. Це не перевантажена система, а практичний сервіс, який закриває щоденні задачі майстра. Програма для запису клієнтів допомагає не лише навести порядок, а й підвищити конверсію у реальні візити. Тому онлайн запис клієнтів стає не просто зручністю для клієнта, а повноцінним інструментом росту для вашої перукарської практики. Усе працює в єдиному ритмі: від першого кліку клієнта до підтвердженого візиту у вашому календарі."
];

const screenshotsByLanguage: Record<SiteLanguage, { day: string; week: string; month: string }> = {
  ru: { day: "/for-business/ru-day.png", week: "/for-business/ru-week.png", month: "/for-business/ru-month.png" },
  uk: { day: "/for-business/uk-day.png", week: "/for-business/uk-week.png", month: "/for-business/uk-month.png" },
  en: { day: "/for-business/en-day.png", week: "/for-business/en-week.png", month: "/for-business/en-month.png" }
};

const copy: Record<SiteLanguage, HairCopy> = {
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для парикмахеров",
    subtitle: "Принимайте записи клиентов онлайн, управляйте расписанием и не теряйте клиентов",
    cta: "Начать принимать записи за 2 минуты",
    ctaSecondary: "Посмотреть возможности",
    ctaAfterFeatures: "Начать принимать записи за 2 минуты",
    ctaBottom: "Начать принимать записи за 2 минуты",
    ctaHint: "Без сложных настроек • без сайта • бесплатно",
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
      { title: "24/7 онлайн-запись", text: "Клиенты записываются сами в любое время без звонков." },
      { title: "Календарь записей", text: "Все записи видны в одном календаре с актуальными статусами." },
      { title: "Услуги с ценой", text: "Услуги с ценой и длительностью — без путаницы." },
      { title: "Рабочие дни", text: "Настройка рабочих дней и свободных окон под ваш график." },
      { title: "Telegram уведомления", text: "Получайте записи и подтверждения в Telegram." },
      { title: "Клиентская страница", text: "Персональная страница для записи клиентов без лишних шагов." }
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
    telegramText: "Подключите Telegram-уведомления и оперативно реагируйте на новые визиты и изменения в расписании.",
    nicheTitle: "Подходит для парикмахеров и салонов",
    nicheText: "Реальные сценарии для плотного дня: система учитывает длительность, цену и формат каждой услуги.",
    nicheItems: [
      "Женская стрижка — 60 мин — 500 грн: стандартный слот без ручных расчетов.",
      "Окрашивание корней — 120 мин — 1200 грн: длинная процедура с буфером в календаре.",
      "Стрижка + укладка — 75 мин — 750 грн: запись сразу с нужной длительностью.",
      "Сложное окрашивание — 180 мин — 2500 грн: клиент видит цену и выбирает подходящий день."
    ],
    dayScenarioTitle: "Сценарий рабочего дня парикмахера",
    dayScenarioItems: [
      "09:00 — Мужская стрижка — 45 мин — 450 грн: быстрый старт дня без перегруза.",
      "10:00 — Женская стрижка — 60 мин — 500 грн: слот с точной длительностью в календаре.",
      "12:00 — Окрашивание корней — 120 мин — 1200 грн: длинная услуга с буфером между визитами.",
      "15:00 — Стрижка + укладка — 75 мин — 750 грн: клиент видит цену и время до бронирования.",
      "18:00 — Укладка — 40 мин — 450 грн: вечернее окно закрывается без ручных переписок."
    ],
    socialTitle: "Мастера уже используют Timviz",
    socialText: "Парикмахеры переходят на Timviz, чтобы сократить ручные переписки и быстрее подтверждать записи.",
    trustTitle: "Почему парикмахеры доверяют Timviz",
    trustCards: [
      {
        title: "Понятный календарь без накладок",
        text: "Разные услуги по длительности не конфликтуют: система показывает только реальные слоты."
      },
      {
        title: "Запись клиентов без звонков",
        text: "Клиенты выбирают услугу и время сами, а вы получаете уже структурированную заявку."
      },
      {
        title: "Контроль смены в реальном времени",
        text: "Telegram-уведомления помогают быстро реагировать на переносы и новые записи."
      }
    ],
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
    finalText: "Создайте профиль, добавьте услуги и начните принимать записи клиентов онлайн без лишних переписок.",
    finalButton: "Начать принимать записи за 2 минуты",
    linksTitle: "Другие направления",
    links: [
      { label: "Для мастеров маникюра", href: "/dlya-manikyura" },
      { label: "Для барберов", href: "/dlya-barberov" },
      { label: "Для косметологов", href: "/dlya-kosmetologov" },
      { label: "Для массажистов", href: "/dlya-massazhistov" }
    ],
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    altCalendar: "Календарь записей для парикмахера в Timviz",
    altService: "Услуги парикмахера и цены в Timviz",
    altTelegram: "Telegram уведомления о записях для парикмахеров в Timviz"
  },
  uk: {
    home: "Головна",
    forBusiness: "Для бізнесу",
    title: "Онлайн-запис для перукарів",
    subtitle: "Приймайте записи клієнтів онлайн, керуйте графіком і не втрачайте клієнтів",
    cta: "Почати приймати записи за 2 хвилини",
    ctaSecondary: "Почати приймати записи за 2 хвилини",
    ctaAfterFeatures: "Почати приймати записи за 2 хвилини",
    ctaBottom: "Почати приймати записи за 2 хвилини",
    ctaHint: "Без складних налаштувань • без сайту • безкоштовно",
    microcopy: "Без складних налаштувань • без сайту • безкоштовно",
    sampleClient: "Клієнт: Ольга М.",
    sampleService: "Жіноча стрижка · 60 хв · 14:30",
    sampleStatus: "Статус: Підтверджено",
    problemsTitle: "Знайомо перукарю?",
    problems: [
      { title: "Клієнти пишуть в Instagram і Telegram", text: "Записи залишаються в чатах і їх легко втратити." },
      { title: "Записи плутаються", text: "Складно зрозуміти хто і коли записаний." },
      { title: "Різна тривалість послуг", text: "Стрижка, фарбування і укладка займають різний час." },
      { title: "Накладки по часу", text: "Клієнти можуть бути записані на один і той самий час." },
      { title: "Клієнти забувають", text: "Без нагадувань клієнти не приходять." },
      { title: "Складно бачити день", text: "Немає чіткої картини графіка." }
    ],
    solutionTitle: "Timviz вирішує це",
    solution: [
      { title: "Онлайн-запис 24/7", text: "Клієнти записуються самі без дзвінків." },
      { title: "Календар записів", text: "Усі записи в одному місці." },
      { title: "Послуги з ціною", text: "Клієнт бачить ціну і час." },
      { title: "Графік роботи", text: "Контроль робочих днів." },
      { title: "Telegram", text: "Отримуйте записи миттєво." },
      { title: "Сторінка запису", text: "Клієнти записуються самі." }
    ],
    servicesTitle: "Налаштуйте послуги перукаря",
    serviceItems: ["стрижка", "жіноча стрижка", "чоловіча стрижка", "фарбування", "укладка", "складні фарбування", "догляд за волоссям", "відновлення"],
    serviceExample: "Жіноча стрижка — 60 хв — 500 грн",
    calendarTitle: "Календар записів для перукаря",
    calendarText: "Бачите всі записи, тривалість процедур і вільний час.",
    howTitle: "Як це працює",
    howSteps: ["Створіть профіль", "Додайте послуги", "Почніть приймати записи"],
    compareTitle: "Без Timviz / З Timviz",
    without: ["записи в чатах", "плутанина", "дзвінки"],
    with: ["календар", "онлайн запис", "порядок"],
    telegramTitle: "Отримуйте записи в Telegram",
    telegramText: "Підключіть Telegram-сповіщення, щоб одразу бачити нові бронювання, переноси й підтвердження.",
    nicheTitle: "Ідеально для перукарів",
    nicheText: "Timviz закриває щоденні задачі майстра з різними форматами послуг і різною тривалістю.",
    nicheItems: ["жіночі стрижки", "чоловічі стрижки", "фарбування", "укладка", "складні процедури"],
    dayScenarioTitle: "Сценарій робочого дня перукаря",
    dayScenarioItems: [
      "09:00 — Чоловіча стрижка — 45 хв — 450 грн: швидкий старт зміни без накладок.",
      "10:00 — Жіноча стрижка — 60 хв — 500 грн: точний слот із контрольованою тривалістю.",
      "12:00 — Фарбування коренів — 120 хв — 1200 грн: довга послуга з буфером у календарі.",
      "15:00 — Стрижка + укладка — 75 хв — 750 грн: клієнт бачить ціну до бронювання.",
      "18:00 — Укладка — 40 хв — 450 грн: вечірнє вікно закривається онлайн без переписок."
    ],
    socialTitle: "Майстри вже використовують Timviz",
    socialText: "Перукарі переходять на Timviz, щоб зменшити ручну комунікацію і прискорити підтвердження візитів.",
    trustTitle: "Чому перукарі довіряють Timviz",
    trustCards: [
      {
        title: "Календар без накладок",
        text: "Різна тривалість стрижок і фарбувань враховується автоматично в одному графіку."
      },
      {
        title: "Менше дзвінків і чатів",
        text: "Клієнти обирають послугу і час самостійно, а майстер отримує готовий запис."
      },
      {
        title: "Контроль змін у реальному часі",
        text: "Telegram-сповіщення допомагають швидко реагувати на нові бронювання та переноси."
      }
    ],
    seoBlockTitle: "Програма для запису клієнтів для перукарів",
    seoParagraphs: ukSeoParagraphs,
    faqTitle: "FAQ",
    faq: [
      { q: "Як працює онлайн-запис для перукаря?", a: "Клієнт обирає послугу і час, а запис одразу потрапляє в календар." },
      { q: "Чи можна налаштувати тривалість стрижок?", a: "Так, для кожної послуги задається окрема тривалість і вартість." },
      { q: "Чи підходить Timviz для одного майстра?", a: "Так, сервіс підходить приватним майстрам і невеликим студіям." },
      { q: "Чи можна працювати без сайту?", a: "Так, достатньо профілю Timviz і посилання на запис." },
      { q: "Чи є Telegram сповіщення?", a: "Так, ви отримуєте сповіщення про нові записи й зміни графіка." },
      { q: "Чи є календар записів?", a: "Так, у календарі видно всі візити та вільні вікна." },
      { q: "Чи підходить сервіс для фарбувань і складних процедур?", a: "Так, Timviz враховує різну тривалість і допомагає уникати накладок." },
      { q: "Чи можна почати безкоштовно?", a: "Так, запуск займає кілька хвилин, а старт доступний безкоштовно." }
    ],
    finalTitle: "Готові отримувати більше записів без хаосу?",
    finalText: "Створіть профіль, додайте послуги й відкрийте клієнтам онлайн-запис з прозорим графіком.",
    finalButton: "Почати приймати записи за 2 хвилини",
    linksTitle: "Інші напрямки",
    links: [
      { label: "Майстри манікюру", href: "/dlya-manikyuru" },
      { label: "Барбери", href: "/dlya-barberiv" },
      { label: "Косметологи", href: "/dlya-kosmetologiv" },
      { label: "Масажисти", href: "/dlya-masazhu" }
    ],
    footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    altCalendar: "Календар записів для перукарів у Timviz",
    altService: "Послуги перукаря та ціни у Timviz",
    altTelegram: "Telegram сповіщення про нові записи для перукарів у Timviz"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    title: "Online booking for hairdressers",
    subtitle: "Accept bookings online, manage schedule and keep clients from dropping off",
    cta: "Start taking bookings in 2 minutes",
    ctaSecondary: "See features",
    ctaAfterFeatures: "Start taking bookings in 2 minutes",
    ctaBottom: "Start taking bookings in 2 minutes",
    ctaHint: "No website needed • no complex setup • free start",
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
      { title: "24/7 online booking", text: "Clients book on their own anytime." },
      { title: "Booking calendar", text: "All appointments in one schedule." },
      { title: "Priced services", text: "Each service has duration and price." },
      { title: "Working days", text: "Set your workdays and free slots." },
      { title: "Telegram alerts", text: "Get instant booking updates." },
      { title: "Client booking page", text: "Share one page for self-booking." }
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
    telegramText: "Enable Telegram notifications to react quickly to new appointments and schedule updates.",
    nicheTitle: "Built for hairdressers and salons",
    nicheText: "Suitable for haircuts, coloring, styling and complex long procedures.",
    nicheItems: ["haircuts", "coloring", "styling", "complex procedures"],
    dayScenarioTitle: "Hairdresser day scenario",
    dayScenarioItems: [
      "09:00 — Men’s haircut — 45 min — 450 UAH: fast opening slot with predictable timing.",
      "10:00 — Women’s haircut — 60 min — 500 UAH: standard service scheduled with no overlap.",
      "12:00 — Root coloring — 120 min — 1200 UAH: long procedure with automatic calendar buffer.",
      "15:00 — Haircut + styling — 75 min — 750 UAH: client sees duration and pricing before booking.",
      "18:00 — Styling — 40 min — 450 UAH: evening slot gets filled online without chat coordination."
    ],
    socialTitle: "Professionals already use Timviz",
    socialText: "Hairdressers use Timviz to reduce manual messaging and speed up confirmations.",
    trustTitle: "Why hairdressers trust Timviz",
    trustCards: [
      {
        title: "Schedule clarity for mixed-duration services",
        text: "Short and long services stay organized in one booking calendar without time collisions."
      },
      {
        title: "Higher conversion from inquiry to booking",
        text: "Clients book their own slot instantly instead of waiting for replies in messengers."
      },
      {
        title: "Real-time control through Telegram alerts",
        text: "New bookings and reschedules arrive immediately, helping keep the workday stable."
      }
    ],
    seoBlockTitle: "Client booking software for hairdressers",
    seoParagraphs: [
      "Online booking for hairdressers is one of the biggest levers for stable daily revenue. When booking requests arrive from Instagram, Telegram and messaging apps at the same time, appointments are easy to miss and responses are delayed. Timviz converts this fragmented flow into one structured process. Clients choose service and time independently, while the hairdresser receives a clear confirmed visit in one calendar.",
      "Hairdresser schedules are complex by nature. A quick men’s haircut, a women’s haircut, root coloring, full-color treatment and styling all require different durations. If timing is handled manually, collisions and idle windows become unavoidable. Timviz solves that by attaching duration and pricing to each service and showing only valid booking slots. This keeps your workday realistic and reduces operational stress.",
      "Many specialists look for booking software because they want fewer calls and less chat coordination. Timviz provides exactly that. Service catalog, duration setup, pricing and booking statuses are managed in one place. Clients see clear service details before they book, so expectations are aligned and confirmation speed improves.",
      "For solo professionals, Timviz works as a lightweight CRM with fast onboarding. You do not need a separate website or technical setup. Create profile, add services, define working hours and publish one booking link. From that point, your booking flow runs 24/7 and supports client booking without manual back-and-forth.",
      "A practical day example illustrates the value: short haircuts in the morning, long coloring in the middle of the day, styling slots in the evening. Without a structured calendar, this pattern often creates delays and mismatched gaps. Timviz maintains service logic automatically and keeps your schedule balanced, so you can serve more clients without overloading the shift.",
      "Telegram notifications give hairdressers real-time awareness. New bookings, cancellations and reschedules appear instantly, even while you are with another client. This reduces the risk of missed updates and helps you react before a free slot turns into lost revenue. In busy salons, this speed is critical.",
      "Repeat visits are essential in hair care services. With a clear booking calendar, it is easier to secure the next appointment immediately after checkout. Clients can rebook quickly because available time is transparent. Timviz supports this retention flow and helps turn one-time visits into recurring demand.",
      "For salon teams, centralized booking creates operational consistency. Managers can see where schedules are overloaded and where there is open capacity. That visibility improves shift planning, campaign timing and slot utilization across the week. Timviz is not just a calendar; it is a practical booking operations layer.",
      "Search intent behind queries like online booking for hairdressers, client booking software, or haircut booking calendar is usually direct: increase confirmed appointments and reduce administrative noise. Timviz is designed to satisfy that intent with simple UX for clients and structured workflows for professionals.",
      "In long-term growth, reliable booking affects both conversion and brand perception. Clients remember how easy it was to book, how clear pricing was, and whether the appointment started on time. Timviz helps hairdressers deliver that professional experience consistently, which improves repeat rate and referrals.",
      "Another advantage is better control of short windows between long services. Manual scheduling often leaves these windows unused because they are difficult to coordinate quickly. With Timviz, those slots remain visible and bookable, so you can fill them with quick services and improve utilization.",
      "Overall, Timviz gives hairdressers a conversion-focused booking system: online booking flow, duration-aware calendar, structured services, and instant Telegram alerts. It reduces routine admin work and helps transform daily demand into a stable schedule with fewer errors and higher booking efficiency."
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
    finalText: "Create your profile and launch structured online booking for your hair services.",
    finalButton: "Create hairdresser profile",
    linksTitle: "Other directions",
    links: [
      { label: "For nail artists", href: "/for-nail-technicians" },
      { label: "For barbers", href: "/for-barbers" },
      { label: "For cosmetologists", href: "/for-cosmetologists" },
      { label: "For massage therapists", href: "/for-massage-therapists" }
    ],
    footerText: "Timviz for business · online client booking and service management",
    privacy: "Privacy policy",
    terms: "Terms of use",
    altCalendar: "Hairdresser booking calendar in Timviz",
    altService: "Hairdresser services and prices in Timviz",
    altTelegram: "Telegram booking notifications for hairdressers in Timviz"
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
  const screenshots = screenshotsByLanguage[language];
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
          </div>
          <small>{t.microcopy}</small>
        </div>
        <aside className="manicure-hero-card">
          <img src={screenshots.day} alt={t.altCalendar} loading="lazy" />
          <div><strong>{t.sampleClient}</strong><p>{t.sampleService}</p><span>{t.sampleStatus}</span></div>
        </aside>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.problemsTitle}</h2></div>
        <div className="hair-card-grid">{t.problems.map((card) => <article key={card.title}><h3>{card.title}</h3><p>{card.text}</p></article>)}</div>
      </section>

      <section className="business-feature-section" id="solution">
        <div className="business-section-head"><h2>{t.solutionTitle}</h2></div>
        <div className="hair-card-grid">{t.solution.map((card) => <article key={card.title}><h3>{card.title}</h3><p>{card.text}</p>{card.benefit ? <small>{card.benefit}</small> : null}</article>)}</div>
      </section>

      <section className="business-seo-section hair-cta-inline">
        <a className="business-primary" href="/pro/create-account">{t.ctaAfterFeatures}</a>
        <small className="hair-cta-caption">{t.ctaHint}</small>
      </section>

      <section className="business-screens-section">
        <div className="business-section-head"><h2>{t.servicesTitle}</h2></div>
        <div className="manicure-services-grid">
          <div className="manicure-services-list">{t.serviceItems.map((item) => <span key={item}>{item}</span>)}</div>
          <article className="manicure-service-card"><img src={screenshots.week} alt={t.altService} loading="lazy" /><strong>{t.serviceExample}</strong></article>
        </div>
      </section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.calendarTitle}</h2><p>{t.calendarText}</p></div></section>

      <section className="business-workflow-section"><div><h2>{t.howTitle}</h2></div><ol>{t.howSteps.map((step) => <li key={step}><div><strong>{step}</strong></div></li>)}</ol></section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.compareTitle}</h2></div><div className="business-compare-grid"><article><h3>{language === "en" ? "Without Timviz" : "Без Timviz"}</h3><ul>{t.without.map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>{language === "en" ? "With Timviz" : language === "uk" ? "З Timviz" : "С Timviz"}</h3><ul>{t.with.map((item) => <li key={item}>{item}</li>)}</ul></article></div></section>

      <section className="business-seo-section"><h2>{t.telegramTitle}</h2><p>{t.telegramText}</p><img src={screenshots.month} alt={t.altTelegram} loading="lazy" className="manicure-telegram-image" /></section>

      <section className="business-feature-section niche-showcase-section">
        <div className="niche-showcase-copy">
          <div className="business-section-head"><h2>{t.nicheTitle}</h2><p>{t.nicheText}</p></div>
          <ul className="business-seo-list">{t.nicheItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <article className="manicure-service-card niche-showcase-card"><img src={screenshots.week} alt={t.altService} loading="lazy" /><strong>{t.serviceExample}</strong></article>
      </section>

      {t.dayScenarioTitle && t.dayScenarioItems?.length ? (
        <section className="business-feature-section">
          <div className="business-section-head"><h2>{t.dayScenarioTitle}</h2></div>
          <ul className="business-seo-list">{t.dayScenarioItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}

      {t.trustTitle && t.trustCards?.length ? (
        <section className="business-feature-section">
          <div className="business-section-head"><h2>{t.trustTitle}</h2></div>
          <div className="hair-card-grid">
            {t.trustCards.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="business-feature-section"><div className="business-section-head"><h2>{t.socialTitle}</h2><p>{t.socialText}</p></div></section>
      )}

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{t.seoBlockTitle}</h2></div>
        <div className="hair-seo-text">{t.seoParagraphs.map((p) => <p key={p}>{p}</p>)}</div>
      </section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.faqTitle}</h2></div><div className="business-faq-list">{t.faq.map((item) => <details key={item.q} className="business-faq-item"><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>

      <section className="business-final-section"><h2>{t.finalTitle}</h2><p>{t.finalText}</p><a className="business-primary" href="/pro/create-account">{t.finalButton}</a><small className="hair-cta-caption">{t.ctaHint}</small></section>

      <section className="business-feature-section"><div className="business-section-head"><h2>{t.linksTitle}</h2></div><div className="business-footer-links">{t.links.map((link) => <a key={link.href} href={getLocalizedPath(language, link.href)}>{link.label}</a>)}</div></section>

      <footer className="business-footer"><a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a><span>{t.footerText}</span><div className="business-footer-links"><a href={getLocalizedPath(language)}>{t.home}</a><a href={getLocalizedPath(language, "/for-business")}>{t.forBusiness}</a><a href={getLocalizedPath(language, "/privacy")}>{t.privacy}</a><a href={getLocalizedPath(language, "/terms")}>{t.terms}</a></div></footer>
    </main>
  );
}
