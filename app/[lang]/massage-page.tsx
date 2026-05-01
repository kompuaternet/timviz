import type { Metadata } from "next";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import { getNicheSlug, nicheCards, nicheKeys } from "../../lib/niche-pages";
import { getNicheUxContent } from "../../lib/niche-ux";
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
  dayScenarioTitle?: string;
  dayScenarioItems?: string[];
  sessionTitle: string;
  sessionText: string;
  howTitle: string;
  howSteps: string[];
  compareTitle: string;
  compareLeftTitle: string;
  compareRightTitle: string;
  compareLeft: string[];
  compareRight: string[];
  telegramTitle: string;
  telegramText: string;
  trustTitle?: string;
  trustCards?: InfoCard[];
  seoBlockTitle: string;
  seoParagraphs: string[];
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalText: string;
  otherTitle: string;
  privacy: string;
  terms: string;
  footerText: string;
  altCalendar: string;
  altServices: string;
  altTelegram: string;
};

const ukSeoParagraphs = [
  "Для сучасного спеціаліста онлайн запис масаж є базовим інструментом, який впливає і на стабільність графіка, і на кількість фактичних візитів. Коли клієнти пишуть у різні месенджери, частина звернень залишається без відповіді, а частина губиться у довгих чатах. Timviz переводить цей процес у структурований формат: клієнт самостійно обирає послугу, тривалість і зручний час, а майстер одразу бачить підтверджений запис у календарі. Це дозволяє зменшити рутину, швидше закривати заявки і приділяти більше уваги якості сеансів, а не ручній координації в переписках.",
  "У масажній практиці важливо точно планувати час між сеансами. Класичний масаж, релакс, лікувальний або спортивний можуть тривати 30, 60 чи 90 хвилин, а інколи ще довше. Без системи такі різні слоти створюють хаос: легко поставити клієнтів занадто щільно, не залишити буфер і отримати накладки в середині дня. Саме тому календар записів у Timviz показує не просто список бронювань, а повну картину навантаження: де є вільні вікна, які послуги займають більше часу, де краще додати паузу. Це допомагає вести день у комфортному темпі без стресу для майстра і клієнта.",
  "Частий запит спеціалістів — запис клієнтів масаж без постійних дзвінків і нескінченних уточнень. У Timviz клієнт отримує зрозумілу сторінку запису, де бачить доступні послуги, тривалість і вартість, а після вибору часу запис з'являється у вашому робочому кабінеті автоматично. Запис клієнтів онлайн стає передбачуваним процесом: менше помилок у часі, менше випадкових пропусків і менше перенесень через непорозуміння. Для масажиста це означає стабільніший потік відвідувань і менше ручної адміністративної роботи протягом усього тижня.",
  "Програма для масажиста повинна бути простою у запуску, інакше впровадження затягується на тижні. Timviz налаштовується за кілька хвилин: не потрібен окремий сайт, складні інтеграції або технічний бекграунд. Ви створюєте профіль, додаєте послуги, налаштовуєте тривалість 30, 60, 90 хвилин і відразу відкриваєте клієнтам онлайн запис масажні послуги. Далі система сама показує доступні вікна та не дає клієнту обрати час, який уже зайнятий. Такий підхід особливо корисний для приватних майстрів, які хочуть швидко перейти від хаотичних чатів до професійного клієнтського досвіду.",
  "Коли майстер працює самостійно, йому потрібна практична CRM для масажиста без перевантаження зайвими функціями. Timviz поєднує головне: календар, записи, послуги, тривалість і поточні статуси в одному інтерфейсі. Ви завжди бачите, хто записаний, на яку послугу, скільки вона триває і де ще можна додати візит. Це зменшує ризик накладок та допомагає рівномірно розподіляти навантаження протягом дня. Коли контроль у ваших руках, легше підтримувати високу якість сервісу, працювати без поспіху і не втрачати клієнтів через технічні помилки у плануванні.",
  "Ще одна сильна сторона системи — швидка реакція на зміни. У реальному графіку клієнти переносять візити, скасовують або просять інший слот, і в чатах це часто перетворюється на хаос. Timviz структурує ці оновлення: ви відразу бачите актуальний стан розкладу, а не шукаєте старі повідомлення. Telegram-сповіщення додатково підсилюють контроль: новий запис чи зміна приходить миттєво, тому рішення можна прийняти одразу. У результаті запис клієнтів онлайн стає керованим процесом, де ви працюєте проактивно, а не гасите проблеми, коли день уже перевантажений.",
  "Якщо ви працюєте з різними напрямками, наприклад лікувальний масаж, антицелюлітний, реабілітація або релакс-сесії, важливо мати гнучке керування послугами. Саме тут програма для масажиста дає відчутний результат: кожна послуга має власну тривалість і ціну, а клієнт бачить ці параметри до бронювання. Це знижує кількість непорозумінь та запитань у діректі. Коли онлайн запис масаж налаштований прозоро, клієнту простіше прийняти рішення і завершити бронювання. Для майстра це означає вищу конверсію з переглядів у реальні записи та більш прогнозований дохід щотижня.",
  "Для студій і командних форматів переваги ще помітніші. Календар записів дозволяє бачити завантаження в розрізі дня та тижня, вчасно коригувати графік і уникати пікових перевантажень. Якщо кілька спеціалістів працюють паралельно, централізована система допомагає тримати порядок у слотах і мінімізує конфлікти часу. Запис клієнтів масаж у такій моделі стає прозорим як для майстра, так і для адміністратора. Це важливо не лише для операційної стабільності, а й для репутації: клієнт бачить, що сервіс працює чітко, і з більшою ймовірністю повертається повторно.",
  "Пошукові запити на кшталт «онлайн запис масаж», «запис клієнтів масаж» або «онлайн запис масажні послуги» зазвичай роблять ті, хто хоче збільшити кількість записів без розширення ручної роботи. Timviz вирішує це на практиці: клієнт обирає послугу і час самостійно, а майстер отримує вже готовий візит у календарі. Коли CRM для масажиста поєднана з чіткою сторінкою запису і швидкими сповіщеннями, конверсія звернень у візити зростає природно. Ви витрачаєте менше часу на переписки і більше на якість сеансу та довгострокову роботу з постійними клієнтами.",
  "Додатково система допомагає краще керувати завантаженням у пікові дні. Коли ви бачите всі бронювання в одному місці, простіше вирішити, де відкрити ще один слот, а де залишити буфер між клієнтами. Для практики, де є 30-хвилинні і 90-хвилинні формати, це критично важливо: графік залишається рівним, а сервіс стабільним.",
  "Підсумовуючи, Timviz закриває ключові задачі масажного сервісу: онлайн запис масаж, контроль тривалості сеансів, структурований календар записів, швидкі Telegram-сповіщення і зручний запис клієнтів онлайн. Це інструмент, який легко впровадити сьогодні і відчути результат уже в перші дні: менше плутанини, менше накладок, більше порядку у графіку. Саме так програма для масажиста допомагає перейти від хаосу в месенджерах до системної моделі роботи, де клієнтам зручно бронювати, а вам зручно планувати, рости та стабільно приймати нові записи щодня."
];

const screenshotsByLanguage: Record<SiteLanguage, { day: string; week: string; month: string }> = {
  ru: { day: "/for-business/ru-day.png", week: "/for-business/ru-week.png", month: "/for-business/ru-month.png" },
  uk: { day: "/for-business/uk-day.png", week: "/for-business/uk-week.png", month: "/for-business/uk-month.png" },
  en: { day: "/for-business/en-day.png", week: "/for-business/en-week.png", month: "/for-business/en-month.png" }
};

const massagePathByLanguage: Record<SiteLanguage, string> = {
  uk: "/uk/dlya-masazhu",
  ru: "/ru/dlya-massazhistov",
  en: "/en/for-massage-therapists"
};

const copy: Record<SiteLanguage, Copy> = {
  uk: {
    home: "Головна",
    forBusiness: "Для бізнесу",
    title: "Онлайн-запис для масажистів",
    subtitle: "Приймайте записи клієнтів онлайн, керуйте сеансами і графіком без хаосу",
    ctaPrimary: "Почати приймати записи за 2 хвилини",
    ctaAfterFeatures: "Почати приймати записи за 2 хвилини",
    ctaFinal: "Почати приймати записи за 2 хвилини",
    ctaHint: "Без складних налаштувань • без сайту • безкоштовно",
    microcopy: "Без складних налаштувань • без сайту • безкоштовно",
    sampleClient: "Клієнт: Олександр К.",
    sampleService: "Релакс масаж · 90 хв",
    sampleStatus: "Статус: Підтверджено",
    problemsTitle: "Знайомо масажисту?",
    problems: [
      { title: "Клієнти пишуть у месенджери", text: "Записи залишаються в чатах і губляться." },
      { title: "Різна тривалість сеансів", text: "30, 60, 90 хвилин — складно планувати." },
      { title: "Записи плутаються", text: "Складно контролювати графік." },
      { title: "Накладки по часу", text: "Сеанси можуть накладатися." },
      { title: "Клієнти не приходять", text: "Без нагадувань клієнти забувають." },
      { title: "Немає вільних вікон", text: "Складно бачити розклад дня." }
    ],
    solutionTitle: "Timviz вирішує це",
    solutionCards: [
      { title: "Онлайн-запис 24/7", text: "Клієнти записуються самі." },
      { title: "Календар записів", text: "Усі сеанси в одному місці." },
      { title: "Послуги з тривалістю", text: "Клієнт бачить час і ціну." },
      { title: "Графік роботи", text: "Контроль робочих днів." },
      { title: "Telegram", text: "Отримуйте записи миттєво." },
      { title: "Сторінка запису", text: "Клієнти записуються самі." }
    ],
    nicheTitle: "Ідеально для масажистів",
    nicheText: "Timviz підходить для приватної практики та студій, де важливо гнучко керувати сеансами різної тривалості.",
    nicheItems: ["класичний масаж", "релакс масаж", "лікувальний масаж", "антицелюлітний", "спортивний масаж", "реабілітація"],
    nicheSample: "Класичний масаж — 60 хв — 700 грн",
    dayScenarioTitle: "Сценарій робочого дня масажиста",
    dayScenarioItems: [
      "09:00 — Лікувальний масаж — 45 хв — 750 грн: ранковий короткий слот для точного старту дня.",
      "10:00 — Класичний масаж — 60 хв — 700 грн: базовий сеанс без накладок у календарі.",
      "12:00 — Релакс масаж — 90 хв — 950 грн: довга процедура з буфером між записами.",
      "15:00 — Спортивний масаж — 60 хв — 850 грн: щільний денний слот з контрольованим таймінгом.",
      "18:00 — Антицелюлітний масаж — 75 хв — 900 грн: вечірній запис закривається онлайн."
    ],
    sessionTitle: "Керуйте сеансами різної тривалості",
    sessionText: "Налаштовуйте 30, 60, 90 хвилин і система автоматично покаже вільний час.",
    howTitle: "Як це працює",
    howSteps: ["Створіть профіль", "Додайте послуги", "Почніть приймати записи"],
    compareTitle: "Без Timviz / З Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "З Timviz",
    compareLeft: ["записи в чатах", "хаос", "накладки"],
    compareRight: ["календар", "порядок", "контроль часу", "менше переписок"],
    telegramTitle: "Отримуйте записи в Telegram",
    telegramText: "Timviz надсилає нові записи та зміни графіка в Telegram, щоб ви не втрачали важливі оновлення.",
    trustTitle: "Чому масажисти обирають Timviz",
    trustCards: [
      {
        title: "Гнучке керування тривалістю сеансів",
        text: "Сеанси на 30, 60 і 90 хвилин плануються в одному календарі без ручного перерахунку."
      },
      {
        title: "Онлайн-запис без хаосу в чатах",
        text: "Клієнт бронює час самостійно, а майстер отримує структурований візит із ціною і тривалістю."
      },
      {
        title: "Миттєва реакція на зміни",
        text: "Telegram-сповіщення допомагають швидко обробляти нові записи, переноси та скасування."
      }
    ],
    seoBlockTitle: "Програма для запису клієнтів для масажистів",
    seoParagraphs: ukSeoParagraphs,
    faqTitle: "FAQ",
    faq: [
      { q: "Як працює онлайн запис для масажиста?", a: "Клієнт обирає послугу та час, а запис автоматично з'являється у вашому календарі." },
      { q: "Чи можна налаштувати тривалість сеансів?", a: "Так, для кожної послуги можна задати 30, 60, 90 хвилин або власну тривалість." },
      { q: "Чи підходить для одного спеціаліста?", a: "Так, Timviz підходить і приватному масажисту, і команді в студії." },
      { q: "Чи є нагадування клієнтам?", a: "Так, сервіс допомагає нагадувати про запис і зменшувати кількість пропусків." },
      { q: "Чи можна працювати без сайту?", a: "Так, окремий сайт не потрібен: достатньо профілю Timviz і сторінки запису." },
      { q: "Чи підходить для різних типів масажу?", a: "Так, ви можете додати класичний, лікувальний, спортивний та інші види масажу з окремими параметрами." },
      { q: "Чи можна почати безкоштовно?", a: "Так, старт безкоштовний, а базове налаштування займає кілька хвилин." },
      { q: "Чи є Telegram-сповіщення?", a: "Так, ви отримуєте миттєві сповіщення про нові записи, переноси і скасування." }
    ],
    finalTitle: "Почніть приймати записи вже сьогодні",
    finalText: "Створіть профіль, додайте послуги та відкрийте клієнтам зручний онлайн-запис без хаосу у месенджерах.",
    otherTitle: "Інші напрямки",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами",
    altCalendar: "Календар записів для масажистів у Timviz",
    altServices: "Послуги та ціни масажиста у Timviz",
    altTelegram: "Telegram сповіщення про записи для масажистів у Timviz"
  },
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для массажистов",
    subtitle: "Принимайте записи клиентов онлайн и управляйте сеансами без хаоса",
    ctaPrimary: "Начать принимать записи за 2 минуты",
    ctaAfterFeatures: "Начать принимать записи за 2 минуты",
    ctaFinal: "Начать принимать записи за 2 минуты",
    ctaHint: "Без сложных настроек • без сайта • бесплатно",
    microcopy: "Без сложных настроек • без сайта • бесплатно",
    sampleClient: "Клиент: Александр К.",
    sampleService: "Релакс массаж · 90 мин",
    sampleStatus: "Статус: Подтверждено",
    problemsTitle: "Знакомо массажисту?",
    problems: [
      { title: "Клиенты пишут в мессенджеры", text: "Записи остаются в чатах и теряются." },
      { title: "Разная длительность сеансов", text: "30, 60, 90 минут — сложно планировать." },
      { title: "Записи путаются", text: "Сложно контролировать расписание." },
      { title: "Накладки по времени", text: "Сеансы могут накладываться." },
      { title: "Клиенты не приходят", text: "Без напоминаний клиенты забывают." },
      { title: "Нет свободных окон", text: "Сложно видеть картину дня." }
    ],
    solutionTitle: "Timviz решает это",
    solutionCards: [
      { title: "Онлайн-запись 24/7", text: "Клиенты записываются сами." },
      { title: "Календарь записей", text: "Все сеансы в одном месте." },
      { title: "Услуги с длительностью", text: "Клиент видит время и цену." },
      { title: "График работы", text: "Контроль рабочих дней." },
      { title: "Telegram", text: "Получайте записи мгновенно." },
      { title: "Страница записи", text: "Клиенты записываются сами." }
    ],
    nicheTitle: "Идеально для массажистов",
    nicheText: "Сценарии для массажной практики: короткие и длинные сеансы, повторные визиты и плотный график без накладок.",
    nicheItems: [
      "Классический массаж — 60 мин — 700 грн: базовый слот для ежедневной загрузки.",
      "Релакс массаж — 90 мин — 950 грн: длинный сеанс с корректным буфером.",
      "Лечебный массаж — 45 мин — 750 грн: удобно планировать в середине дня.",
      "Спортивный массаж — 60 мин — 850 грн: запись с фиксированной длительностью.",
      "Реабилитационный сеанс — 90 мин — 1100 грн: удобный формат для курсовых посещений."
    ],
    nicheSample: "Классический массаж — 60 мин — 700 грн",
    dayScenarioTitle: "Сценарий рабочего дня массажиста",
    dayScenarioItems: [
      "09:00 — Лечебный массаж — 45 мин — 750 грн: утренний слот с короткой длительностью.",
      "10:00 — Классический массаж — 60 мин — 700 грн: базовый прием без накладок.",
      "12:00 — Релакс массаж — 90 мин — 950 грн: длинный сеанс с автоматическим буфером.",
      "15:00 — Спортивный массаж — 60 мин — 850 грн: удобная запись в середине дня.",
      "18:00 — Антицеллюлитный массаж — 75 мин — 900 грн: вечерний слот бронируется онлайн."
    ],
    sessionTitle: "Управляйте сеансами разной длительности",
    sessionText: "Настройте 30, 60, 90 минут и система автоматически покажет свободное время.",
    howTitle: "Как это работает",
    howSteps: ["Создайте профиль", "Добавьте услуги", "Начните принимать записи"],
    compareTitle: "Без Timviz / С Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "С Timviz",
    compareLeft: ["записи в чатах", "хаос", "накладки"],
    compareRight: ["календарь", "порядок", "контроль времени", "меньше переписок"],
    telegramTitle: "Получайте записи в Telegram",
    telegramText: "Timviz отправляет новые записи и изменения расписания в Telegram без задержек.",
    trustTitle: "Почему массажисты доверяют Timviz",
    trustCards: [
      {
        title: "Гибкое управление длительностью сеансов",
        text: "Сеансы на 30, 60 и 90 минут учитываются автоматически, без ручного пересчета расписания."
      },
      {
        title: "Запись клиентов без хаоса в чатах",
        text: "Клиент выбирает услугу и время сам, а мастер получает четко структурированный визит."
      },
      {
        title: "Стабильный контроль через Telegram",
        text: "Новые записи, переносы и отмены приходят сразу, поэтому рабочий день остается управляемым."
      }
    ],
    seoBlockTitle: "Программа для записи клиентов для массажистов",
    seoParagraphs: [
      "Онлайн запись на массаж помогает специалисту выстроить стабильный поток клиентов без перегрузки переписками. Когда заявки приходят в разных мессенджерах, часть сообщений теряется, а согласование времени затягивается. Timviz решает эту задачу как сервис онлайн-записи: клиент выбирает услугу, длительность и доступный слот, а мастер получает уже структурированную запись. Благодаря этому запись клиентов онлайн становится предсказуемой и аккуратной, а рабочий день не разваливается из-за постоянных ручных уточнений.",
      "В массажной практике особенно важен контроль длительности сеансов. Процедуры на 30, 60 и 90 минут нельзя планировать «на глаз», иначе возникают накладки и пустые окна. Календарь записей в Timviz показывает реальную загрузку дня: где короткие сеансы, где длинные, где нужен буфер между клиентами. Такой подход помогает сохранить ритм и качество работы. Для клиента это тоже плюс: меньше задержек, понятный тайминг и уверенность, что прием пройдет в запланированное время.",
      "Timviz работает как программа для массажиста, где собраны услуги, цены, длительность и расписание. Клиент заранее видит стоимость и время процедуры, поэтому сокращается количество уточнений и отказов из-за неверных ожиданий. Для специалиста это означает более высокую конверсию обращения в визит. Запись клиентов массаж в таком формате становится не стихийной перепиской, а управляемым процессом, где каждый слот имеет понятную коммерческую логику.",
      "Если вы ищете CRM для массажиста без сложной настройки, Timviz запускается за несколько минут. Не нужен отдельный сайт или технический специалист: создаете профиль, настраиваете услуги и отправляете ссылку на запись. С этого момента онлайн запись массажных услуг работает 24/7. Люди могут бронировать время вне рабочего дня, а утром у вас уже есть готовые подтвержденные визиты. Это удобный способ увеличить загрузку без расширения административной команды.",
      "Реальный сценарий дня: утром — короткий лечебный сеанс на 45 минут, днем — классический массаж на 60 минут, вечером — длинный релакс на 90 минут. Без системы такие комбинации часто создают либо накладки, либо слишком большие паузы. Timviz автоматически учитывает длительность и предлагает только корректные окна для каждой услуги. В результате график становится плотнее, но при этом остается контролируемым и комфортным для специалиста.",
      "Курсовые и повторные посещения — важная часть дохода массажиста. Когда запись ведется вручную, сложно быстро подобрать клиенту следующий удобный слот и сохранить последовательность процедур. Календарь записей в Timviz помогает видеть загрузку на неделю вперед и сразу предлагать альтернативы. Это упрощает запись клиентов массаж на регулярные визиты и повышает удержание: человеку проще продолжать курс, когда система записи понятна и не требует долгих согласований.",
      "Telegram-уведомления усиливают контроль над расписанием. Новые заявки, переносы и отмены приходят мгновенно, поэтому мастер не пропускает изменения, даже если сейчас работает с клиентом. Для плотного графика это критично: один пропущенный апдейт может сломать весь день. В связке с CRM для массажиста уведомления позволяют быстро реагировать и держать расписание актуальным. Снижается риск потерь и увеличивается доля реально состоявшихся визитов.",
      "Запросы пользователей вроде «программа для массажиста», «онлайн запись массаж» и «запись клиентов онлайн» обычно означают практичную цель: меньше хаоса и больше подтвержденных сеансов. Timviz закрывает эту потребность за счет прозрачного клиентского пути и структурированного календаря. Человек видит доступное время и бронирует без ожидания ответа, а специалист получает готовую запись в системе. Это повышает конверсию и снижает административную нагрузку в ежедневной работе.",
      "Для частного мастера и небольшой студии преимущества одинаковые: стабильный график, лучшее использование времени и меньше операционных ошибок. Программа для массажиста помогает выравнивать загрузку по дням, избегать конфликтов по слотам и эффективнее работать с повторными клиентами. Когда запись клиентов онлайн организована системно, у специалиста остается больше фокуса на качестве сеанса, а не на ручных сообщениях и переносах.",
      "В итоге Timviz дает массажисту полный рабочий контур: сервис онлайн-записи, календарь с контролем длительности, гибкие услуги и мгновенные Telegram-уведомления. Это позволяет перейти от хаотичного чата к предсказуемому процессу, где каждый визит запланирован корректно. Запись клиентов массаж становится устойчивым инструментом роста, а не постоянным источником стресса для мастера и администратора.",
      "Практическая выгода видна уже в первую неделю: легче заполняются короткие окна между длинными сеансами, снижается количество отмен в последний момент и повышается дисциплина клиентов. Мастер быстрее принимает решения по переносу и реже сталкивается с двойными бронями. Для частной практики это напрямую влияет на доход, потому что каждый час рабочего времени используется эффективнее. Программа для массажиста работает как ежедневный операционный помощник, который убирает хаос и возвращает контроль над расписанием.",
      "Если смотреть на развитие в долгую, системная запись повышает ценность сервиса в глазах клиента. Людям удобно, когда можно самостоятельно выбрать время, увидеть понятную стоимость и получить подтверждение без ожидания ответа в чате. Timviz формирует именно такой опыт: прозрачный, быстрый и профессиональный. За счёт этого растет доля повторных визитов и рекомендаций, а запись клиентов онлайн становится не разовой функцией, а устойчивым каналом роста для массажиста или студии.",
      "На практике это дает простой, но сильный результат: меньше отмен, больше занятых часов и лучшее распределение нагрузки по неделе. Мастер заранее видит, где можно открыть дополнительный слот, а где стоит сохранить буфер для восстановления. Такой подход снижает выгорание и повышает качество каждой сессии. В итоге программа для массажиста работает не только на конверсию, но и на долгосрочную устойчивость практики, где клиентам комфортно, а бизнесу — прибыльно. Даже при сезонных колебаниях спроса график остается управляемым."
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "Как работает онлайн-запись для массажиста?", a: "Клиент выбирает услугу и время, а запись сразу попадает в ваш календарь." },
      { q: "Можно ли настроить длительность сеансов?", a: "Да, для каждой услуги задается отдельная длительность и цена." },
      { q: "Подходит ли сервис одному специалисту?", a: "Да, Timviz подходит и частному мастеру, и студии." },
      { q: "Можно ли работать без сайта?", a: "Да, достаточно профиля Timviz и ссылки на страницу записи." },
      { q: "Есть ли Telegram-уведомления?", a: "Да, вы получаете мгновенные уведомления о новых и измененных записях." },
      { q: "Подходит ли для разных типов массажа?", a: "Да, можно добавить разные виды массажа с разной длительностью и стоимостью." }
    ],
    finalTitle: "Запустите онлайн-запись уже сегодня",
    finalText: "Создайте профиль, добавьте услуги и откройте клиентам удобную запись без хаоса.",
    otherTitle: "Другие направления",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    altCalendar: "Календарь записей для массажистов в Timviz",
    altServices: "Услуги и цены массажиста в Timviz",
    altTelegram: "Telegram уведомления о записях для массажистов в Timviz"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    title: "Online booking for massage therapists",
    subtitle: "Accept bookings online and manage sessions without schedule chaos",
    ctaPrimary: "Start taking bookings in 2 minutes",
    ctaAfterFeatures: "Start taking bookings in 2 minutes",
    ctaFinal: "Start taking bookings in 2 minutes",
    ctaHint: "No complex setup • no website • free start",
    microcopy: "No complex setup • no website • free start",
    sampleClient: "Client: Oleksandr K.",
    sampleService: "Relax massage · 90 min",
    sampleStatus: "Status: Confirmed",
    problemsTitle: "Common massage booking issues",
    problems: [
      { title: "Clients message in chats", text: "Bookings stay in chats and get lost." },
      { title: "Different session durations", text: "30, 60, 90 minutes are hard to plan manually." },
      { title: "Bookings get mixed up", text: "Hard to control schedule clearly." },
      { title: "Time overlaps", text: "Sessions can overlap without a structured calendar." },
      { title: "Clients miss visits", text: "Without reminders no-shows grow." },
      { title: "No free-slot visibility", text: "Hard to see available windows quickly." }
    ],
    solutionTitle: "Timviz solves this",
    solutionCards: [
      { title: "24/7 online booking", text: "Clients book on their own." },
      { title: "Booking calendar", text: "All sessions in one place." },
      { title: "Duration-based services", text: "Clients see time and price." },
      { title: "Work schedule", text: "Control working days." },
      { title: "Telegram", text: "Get booking updates instantly." },
      { title: "Booking page", text: "Clients book by link on their own." }
    ],
    nicheTitle: "Perfect for massage therapists",
    nicheText: "Built for solo specialists and studios with mixed session lengths.",
    nicheItems: ["classic massage", "relax massage", "therapeutic massage", "anti-cellulite", "sports massage", "rehabilitation"],
    nicheSample: "Classic massage — 60 min — 700 UAH",
    dayScenarioTitle: "Massage therapist day scenario",
    dayScenarioItems: [
      "09:00 — Therapeutic massage — 45 min — 750 UAH: precise morning slot to start the day.",
      "10:00 — Classic massage — 60 min — 700 UAH: core session with predictable timing.",
      "12:00 — Relax massage — 90 min — 950 UAH: long treatment with automatic buffer handling.",
      "15:00 — Sports massage — 60 min — 850 UAH: daytime slot optimized without overlaps.",
      "18:00 — Anti-cellulite massage — 75 min — 900 UAH: evening booking captured online."
    ],
    sessionTitle: "Manage sessions of different length",
    sessionText: "Set 30, 60, 90 minute services and the system shows available slots automatically.",
    howTitle: "How it works",
    howSteps: ["Create profile", "Add services", "Start taking bookings"],
    compareTitle: "Without Timviz / With Timviz",
    compareLeftTitle: "Without Timviz",
    compareRightTitle: "With Timviz",
    compareLeft: ["chat-based bookings", "chaos", "overlaps"],
    compareRight: ["calendar", "structure", "time control", "fewer messages"],
    telegramTitle: "Receive bookings in Telegram",
    telegramText: "Timviz sends new bookings and schedule changes directly to Telegram.",
    trustTitle: "Why massage therapists trust Timviz",
    trustCards: [
      {
        title: "Reliable control of mixed-duration sessions",
        text: "Short and long massage services are scheduled accurately in one duration-aware calendar."
      },
      {
        title: "Stronger conversion from inquiry to booking",
        text: "Clients choose service and time instantly without waiting for manual chat confirmation."
      },
      {
        title: "Instant updates during the workday",
        text: "Telegram notifications keep you aware of new bookings and changes in real time."
      }
    ],
    seoBlockTitle: "Client booking software for massage therapists",
    seoParagraphs: [
      "Online booking for massage therapists is essential for stable schedule utilization. When requests are handled in multiple chats, appointments are often missed or confirmed too late. Timviz centralizes the process: clients select service and time on their own, and confirmed sessions appear in one calendar immediately.",
      "Massage businesses usually combine sessions of different duration: 30, 60 and 90 minutes, sometimes longer. Manual planning of mixed-length services often leads to overlaps and idle gaps. Timviz maps duration to each service and keeps booking logic consistent, so your day remains predictable.",
      "Specialists looking for massage booking software usually want fewer calls, fewer chat messages and more confirmed appointments. Timviz delivers that with a practical setup: service catalog, pricing, durations and booking statuses in one workflow. Clients understand what they book before submitting a request.",
      "For solo professionals, Timviz functions as a lightweight CRM without heavy onboarding. No separate website is required. You can launch quickly, share a booking link and start receiving online bookings 24/7. That means your booking channel works even when you are busy with current clients.",
      "A real day often includes short therapeutic sessions, standard classic massage and longer relaxation treatments. Without structured scheduling, those services create timing conflicts. Timviz maintains slot integrity and helps balance the day, reducing delays and preserving service quality.",
      "Telegram notifications increase operational responsiveness. New sessions, cancellations and reschedules are delivered instantly, so you can react before capacity is lost. This is especially valuable when the schedule is dense and each missed update affects multiple upcoming sessions.",
      "Repeat visits are a major part of massage revenue, especially for course-based or recovery plans. With a clear calendar and transparent availability, clients can rebook quickly. Timviz supports this retention loop and helps specialists build predictable recurring demand.",
      "For studios with multiple therapists, centralized booking improves coordination and staffing decisions. Managers can see utilization by day, identify bottlenecks and redistribute appointments when needed. Timviz provides visibility that supports both operations and growth.",
      "Search intent behind queries like online massage booking, booking calendar for massage therapists, or client booking software is highly practical: get more confirmed sessions with less admin friction. Timviz is designed for that intent with straightforward UX and operational controls.",
      "Booking quality also impacts client trust. Clear service duration, visible pricing and reliable confirmations make the experience professional. Clients are more likely to return when booking is fast and predictable.",
      "Another benefit is better monetization of short windows between longer sessions. Manual processes often leave these windows unused. With real-time visible availability, quick services can fill them and improve daily utilization.",
      "Overall, Timviz gives massage therapists a conversion-focused booking system: duration-based calendar, transparent services, repeat-booking support and instant Telegram alerts. It reduces manual coordination and turns fragmented requests into structured, high-quality appointments."
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "How does online booking for massage therapists work?", a: "Clients choose a service and time, and the booking appears in your calendar instantly." },
      { q: "Can I set different session durations?", a: "Yes, each massage service can have its own duration and price." },
      { q: "Is it suitable for solo specialists?", a: "Yes, Timviz works for solo professionals and small teams." },
      { q: "Can I work without a website?", a: "Yes, your Timviz profile and booking page are enough." },
      { q: "Are Telegram notifications available?", a: "Yes, you receive updates for new and changed bookings." },
      { q: "Can I add different massage types?", a: "Yes, you can configure multiple massage services with separate settings." }
    ],
    finalTitle: "Launch online booking today",
    finalText: "Create your profile, add services and open easy online booking for your clients.",
    otherTitle: "Other directions",
    privacy: "Privacy policy",
    terms: "Terms of use",
    footerText: "Timviz for business · online client booking and service management",
    altCalendar: "Massage therapist booking calendar in Timviz",
    altServices: "Massage services and pricing in Timviz",
    altTelegram: "Telegram booking notifications for massage therapists in Timviz"
  }
};

export function buildMassageMetadata(lang: SiteLanguage, pathname: string): Metadata {
  const title =
    lang === "uk"
      ? "Онлайн-запис для масажистів — календар і CRM | Timviz"
      : lang === "ru"
        ? "Онлайн-запись для массажистов — календарь и CRM | Timviz"
        : "Online booking for massage therapists — calendar & CRM | Timviz";

  const description =
    lang === "uk"
      ? "Timviz — онлайн-запис для масажистів: календар сеансів, тривалість послуг, графік і Telegram-сповіщення."
      : lang === "ru"
        ? "Timviz — онлайн-запись для массажистов: календарь сеансов, длительность услуг, график и Telegram-уведомления."
        : "Timviz is online booking software for massage therapists with session calendar, durations and Telegram alerts.";

  const metadata = buildMetadata(pathname, { title, description }, lang);
  return {
    ...metadata,
    alternates: {
      canonical: `https://timviz.com${pathname}`,
      languages: {
        uk: `https://timviz.com${massagePathByLanguage.uk}`,
        ru: `https://timviz.com${massagePathByLanguage.ru}`,
        en: `https://timviz.com${massagePathByLanguage.en}`,
        "x-default": `https://timviz.com${massagePathByLanguage.en}`
      }
    }
  };
}

export default function MassageLanding({ language }: { language: SiteLanguage }) {
  const t = copy[language];
  const ux = getNicheUxContent(language, "massage");
  const screenshots = screenshotsByLanguage[language];
  const otherKeys = nicheKeys.filter((key) => key !== "massage");

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
        item: `https://timviz.com${massagePathByLanguage[language]}`
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
            <a className="business-primary" href="/pro/create-account">{ux.cta}</a>
          </div>
          <small>{ux.ctaHint}</small>
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
        <a className="business-primary" href="/pro/create-account">{ux.cta}</a>
        <small className="hair-cta-caption">{ux.ctaHint}</small>
      </section>

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{ux.valueTitle}</h2></div>
        <ul className="business-seo-list">{ux.valueItems.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="business-feature-section niche-showcase-section">
        <div className="niche-showcase-copy">
          <div className="business-section-head">
            <h2>{ux.importanceTitle}</h2>
            <p>{ux.importanceText}</p>
          </div>
          <ul className="business-seo-list">{t.nicheItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <article className="manicure-service-card niche-showcase-card">
          <img src={screenshots.week} alt={t.altServices} loading="lazy" />
          <strong>{t.nicheSample}</strong>
        </article>
      </section>

      <section className="business-seo-section">
        <h2>{t.sessionTitle}</h2>
        <p>{t.sessionText}</p>
      </section>

      <section className="business-workflow-section">
        <div>
          <h2>{ux.howTitle}</h2>
          <div className="hair-seo-text">{ux.howText.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </div>
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

      {t.dayScenarioTitle && t.dayScenarioItems?.length ? (
        <section className="business-feature-section">
          <div className="business-section-head"><h2>{t.dayScenarioTitle}</h2></div>
          <ul className="business-seo-list">{t.dayScenarioItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}

      <section className="business-seo-section">
        <h2>{t.telegramTitle}</h2>
        <p>{t.telegramText}</p>
        <img src={screenshots.month} alt={t.altTelegram} loading="lazy" className="manicure-telegram-image" />
      </section>

      {t.trustTitle && t.trustCards?.length ? (
        <section className="business-feature-section">
          <div className="business-section-head"><h2>{ux.trustTitle}</h2></div>
          <div className="hair-card-grid">
            {t.trustCards.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="business-feature-section">
        <div className="business-section-head"><h2>{ux.seoTitle}</h2></div>
        <div className="hair-seo-text">
          <p>{ux.seoIntro}</p>
          <ul className="business-seo-list">{ux.seoChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
          <p>{ux.seoOutro}</p>
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
        <a className="business-primary" href="/pro/create-account">{ux.cta}</a>
        <small className="hair-cta-caption">{ux.ctaHint}</small>
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
