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
  "Для сучасного спеціаліста онлайн запис косметолог уже не є додатковою опцією, а базовим інструментом щоденної роботи. Коли записи приходять у кількох месенджерах одночасно, частина звернень губиться, а день починається з хаотичних уточнень. Timviz допомагає перейти до структурованого формату: клієнт обирає послугу, час і записується самостійно, а косметолог одразу бачить візит у календарі. Такий підхід знижує кількість ручних дій, пришвидшує підтвердження і підвищує відсоток тих заявок, які реально доходять до візиту.",
  "У косметології важливо точно враховувати тривалість процедур. Чистка обличчя, пілінги, ін'єкції та апаратні сесії займають різний час і мають власну логіку підготовки. Саме тому календар записів у Timviz показує не лише список клієнтів, а повну картину дня: часові слоти, статуси, вільні вікна і фактичне навантаження. Коли розклад видно цілісно, майстру простіше уникати накладок і планувати роботу без поспіху. Це напряму впливає на якість сервісу, адже кожен візит отримує достатньо часу без стресу та затримок.",
  "Ключова проблема ручного планування полягає в розпорошеності інформації. Запис клієнтів косметолог у чатах часто не містить повної картини: деякі повідомлення губляться, а деталі процедур доводиться шукати в історії переписки. Timviz об'єднує ці дані в одному кабінеті: послуга, формат послуги, тривалість, час візиту та актуальний статус. Завдяки цьому запис клієнтів онлайн стає керованим процесом, а не серією випадкових повідомлень. Косметолог швидко розуміє, як виглядає день, і може приділити увагу не координації, а роботі з клієнтом.",
  "Ще одна перевага сервісу — гнучке налаштування послуг. Програма для косметолога дозволяє описати кожну процедуру так, як вона реально виконується у вашій практиці: окрема тривалість, параметр послуги і формат прийому. Клієнт до бронювання бачить зрозумілі умови і обирає коректний слот, а не пише кілька уточнюючих повідомлень. Для спеціаліста це означає менше скасувань через непорозуміння та більш прогнозований графік. Коли умови прозорі, легше будувати довіру та підтримувати стабільний потік записів без зайвого адміністративного навантаження.",
  "Багатьом майстрам потрібна проста CRM для косметолога без складного впровадження. Timviz запускається за кілька хвилин: не потрібен окремий сайт, технічні інтеграції чи тривале навчання. Після створення профілю ви додаєте послуги, налаштовуєте графік і отримуєте сторінку запису, яку можна одразу передати клієнтам. Далі онлайн запис косметологічні послуги працює автоматично: люди бронюють доступний час, а ви отримуєте структурований календар. Це особливо важливо для тих, хто раніше працював лише через Direct або Telegram і хоче перейти на професійний формат обслуговування.",
  "Ведення історії клієнтів також критичне для повторних візитів. Запис клієнтів косметолог часто пов'язаний з курсами процедур, контрольними оглядами та плановими повтореннями. Коли інформація зібрана в одному місці, легше відстежувати динаміку та не втрачати контекст попередніх записів. Timviz допомагає тримати порядок у цьому процесі: ви бачите, що і коли було заплановано, які візити відбулися, а які перенесено. У результаті підвищується дисципліна графіка, а клієнт отримує більш послідовний і передбачуваний досвід обслуговування.",
  "Telegram-сповіщення дають ще один рівень контролю. Коли приходить новий запис, перенос або скасування, косметолог отримує повідомлення одразу і може швидко відреагувати. Це мінімізує ризик пропустити важливу зміну в розкладі, особливо у щільні робочі дні. Для багатьох спеціалістів саме така оперативність робить запис клієнтів онлайн по-справжньому зручним: немає потреби постійно перевіряти кілька каналів. Один робочий кабінет плюс миттєві сповіщення формують чіткий ритм роботи і дозволяють утримувати високий рівень сервісу без зайвої рутини.",
  "Коли бізнес росте, система має легко масштабуватися. Програма для косметолога підходить як приватному майстру, так і студії, де працює кілька спеціалістів. Кожен бачить свій графік, а керівник отримує зрозумілу картину завантаження. Календар записів допомагає рівномірно розподіляти потік клієнтів, планувати вікна для довгих процедур і уникати конфліктів у пікові години. Такий підхід важливий не лише для комфорту команди, а й для фінансової стабільності: менше простоїв, менше накладок і більше підтверджених візитів у робочому тижні.",
  "Окремо варто враховувати, як клієнти шукають послуги в інтернеті. Багато хто вводить запит «запис клієнтів косметолог», очікуючи знайти простий і зрозумілий сервіс без складної CRM-системи. Timviz дає саме такий сценарій: людина відкриває сторінку, обирає потрібну процедуру і відразу бачить доступний час. Для косметолога це означає стабільніший потік заявок та менше ручних уточнень у чатах. Коли канал запису зрозумілий і працює цілодобово, легше вирівнювати завантаження по днях, планувати повторні візити і підтримувати якісний сервіс навіть у пікові періоди.",
  "Пошукові запити на кшталт «онлайн запис косметолог», «програма для косметолога» або «онлайн запис косметологічні послуги» зазвичай роблять спеціалісти, які хочуть системно збільшити кількість реальних прийомів. Timviz закриває саме цю задачу: клієнт не чекає відповіді в чаті, а бронює доступний час самостійно. Для майстра це означає менше ручного листування і більше контрольованих записів у графіку. Коли CRM для косметолога поєднана з календарем і зрозумілими послугами, конверсія звернень у візити зростає природно, без агресивних продажів і складних сценаріїв.",
  "У підсумку Timviz допомагає перетворити хаотичні переписки на керовану систему роботи. Ви отримуєте онлайн запис косметолог, структурований календар записів, прозорі послуги з форматом послуги і тривалістю, а також інструменти для повторних візитів. Запис клієнтів онлайн стає передбачуваним процесом, який легко підтримувати щодня. Саме так програма для косметолога дає реальний результат: більше порядку в розкладі, менше втрат заявок і вищу якість сервісу для клієнтів, які очікують зручності, швидкості та професійного підходу до запису."
];

const screenshotsByLanguage: Record<SiteLanguage, { day: string; week: string; month: string }> = {
  ru: { day: "/for-business/ru-day.png", week: "/for-business/ru-week.png", month: "/for-business/ru-month.png" },
  uk: { day: "/for-business/uk-day.png", week: "/for-business/uk-week.png", month: "/for-business/uk-month.png" },
  en: { day: "/for-business/en-day.png", week: "/for-business/en-week.png", month: "/for-business/en-month.png" }
};

const cosmetologistPathByLanguage: Record<SiteLanguage, string> = {
  uk: "/uk/dlya-kosmetologiv",
  ru: "/ru/dlya-kosmetologov",
  en: "/en/for-cosmetologists"
};

const copy: Record<SiteLanguage, Copy> = {
  uk: {
    home: "Головна",
    forBusiness: "Для бізнесу",
    title: "Онлайн-запис для косметологів",
    subtitle: "Приймайте записи клієнтів онлайн, керуйте процедурами і графіком без хаосу",
    ctaPrimary: "Почати приймати записи за 2 хвилини",
    ctaAfterFeatures: "Почати приймати записи за 2 хвилини",
    ctaFinal: "Почати приймати записи за 2 хвилини",
    ctaHint: "Без складних налаштувань • без сайту • безкоштовно",
    microcopy: "Без складних налаштувань • без сайту • безкоштовно",
    sampleClient: "Клієнт: Олена С.",
    sampleService: "Чистка обличчя · 60 хв",
    sampleStatus: "Статус: Підтверджено",
    problemsTitle: "Знайомо косметологу?",
    problems: [
      { title: "Клієнти пишуть у месенджери", text: "Записи залишаються в чатах і губляться." },
      { title: "Складні процедури", text: "Косметологічні процедури мають різну тривалість." },
      { title: "Записи плутаються", text: "Складно контролювати графік і повторні візити." },
      { title: "Клієнти не приходять", text: "Без нагадувань клієнти забувають." },
      { title: "Немає історії клієнтів", text: "Складно пам'ятати процедури і записи." },
      { title: "Немає структури", text: "Все ведеться вручну." }
    ],
    solutionTitle: "Timviz вирішує це",
    solutionCards: [
      { title: "Онлайн-запис 24/7", text: "Клієнти записуються самі." },
      { title: "Календар записів", text: "Усі процедури в одному місці." },
      { title: "Послуги з тривалістю", text: "Клієнт бачить повну інформацію." },
      { title: "Графік роботи", text: "Контроль робочих днів." },
      { title: "Telegram", text: "Миттєві сповіщення." },
      { title: "Картка клієнта", text: "Історія процедур і записів." }
    ],
    nicheTitle: "Ідеально для косметологів",
    nicheText: "Timviz підходить для щоденної косметологічної практики та студій із щільним графіком процедур.",
    nicheItems: ["чистка обличчя", "пілінги", "ін'єкції", "доглядові процедури", "апаратна косметологія"],
    nicheSample: "Чистка обличчя — 60 хв",
    dayScenarioTitle: "Сценарій робочого дня косметолога",
    dayScenarioItems: [
      "09:30 — Консультація + діагностика — 30 хв: чіткий старт дня з планом процедур.",
      "10:30 — Чистка обличчя — 60 хв: базовий прийом із фіксованим таймінгом.",
      "12:00 — Пілінг — 45 хв: коротка процедура для щільного розкладу.",
      "14:00 — Доглядовий комплекс — 90 хв: довгий слот із буфером між візитами.",
      "17:30 — Повторний курс — 40 хв: клієнт сам бронює зручний час онлайн."
    ],
    howTitle: "Як це працює",
    howSteps: ["Створіть профіль", "Додайте послуги", "Почніть приймати записи"],
    compareTitle: "Без Timviz / З Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "З Timviz",
    compareLeft: ["записи в месенджерах", "плутанина", "немає історії клієнтів"],
    compareRight: ["календар", "структура", "повторні записи", "нагадування"],
    telegramTitle: "Отримуйте записи і нагадування в Telegram",
    telegramText: "Timviz надсилає нові записи та зміни розкладу в Telegram, щоб ви не втрачали важливі оновлення.",
    trustTitle: "Чому косметологи довіряють Timviz",
    trustCards: [
      {
        title: "Контроль процедур різної тривалості",
        text: "Календар допомагає планувати короткі і довгі сеанси без накладок у графіку."
      },
      {
        title: "Прозора онлайн-запис клієнтів",
        text: "Клієнт заздалегідь бачить формат запису і тривалість, тому менше уточнень та скасувань."
      },
      {
        title: "Зручна база для повторних візитів",
        text: "Історія записів і Telegram-апдейти полегшують курсові програми та утримання клієнтів."
      }
    ],
    seoBlockTitle: "Програма для запису клієнтів для косметологів",
    seoParagraphs: ukSeoParagraphs,
    faqTitle: "FAQ",
    faq: [
      { q: "Як працює онлайн запис для косметолога?", a: "Клієнт обирає послугу і час, а запис автоматично з'являється у вашому календарі." },
      { q: "Чи можна вести історію клієнтів?", a: "Так, у картці клієнта зберігається історія процедур і візитів." },
      { q: "Чи можна налаштувати тривалість процедур?", a: "Так, для кожної послуги задається окрема тривалість і параметр послуги." },
      { q: "Чи підходить для одного спеціаліста?", a: "Так, Timviz підходить і приватному косметологу, і студії з командою." },
      { q: "Чи є нагадування клієнтам?", a: "Так, сервіс допомагає надсилати нагадування і зменшувати кількість пропущених візитів." },
      { q: "Чи можна працювати без сайту?", a: "Так, окремий сайт не потрібен: достатньо профілю Timviz і сторінки запису." },
      { q: "Чи можна почати безкоштовно?", a: "Так, старт безкоштовний, а базове налаштування займає кілька хвилин." },
      { q: "Чи підходить Timviz для повторних курсів процедур?", a: "Так, календар і історія клієнта допомагають планувати повторні записи без плутанини." }
    ],
    finalTitle: "Почніть приймати записи вже сьогодні",
    finalText: "Створіть профіль, додайте послуги та відкрийте клієнтам зручний онлайн-запис без хаосу у месенджерах.",
    otherTitle: "Інші напрямки",
    privacy: "Політика конфіденційності",
    terms: "Умови використання",
    footerText: "Timviz для бізнесу · онлайн-запис клієнтів і керування послугами",
    altCalendar: "Календар записів для косметологів у Timviz",
    altServices: "Послуги та тривалість косметолога у Timviz",
    altTelegram: "Telegram сповіщення про записи для косметологів у Timviz"
  },
  ru: {
    home: "Главная",
    forBusiness: "Для бизнеса",
    title: "Онлайн-запись для косметологов",
    subtitle: "Принимайте записи клиентов онлайн, управляйте процедурами и графиком без хаоса",
    ctaPrimary: "Начать принимать записи за 2 минуты",
    ctaAfterFeatures: "Начать принимать записи за 2 минуты",
    ctaFinal: "Начать принимать записи за 2 минуты",
    ctaHint: "Без сложных настроек • без сайта • бесплатно",
    microcopy: "Без сложных настроек • без сайта • бесплатно",
    sampleClient: "Клиент: Елена С.",
    sampleService: "Чистка лица · 60 мин",
    sampleStatus: "Статус: Подтверждено",
    problemsTitle: "Знакомо косметологу?",
    problems: [
      { title: "Клиенты пишут в мессенджеры", text: "Записи остаются в чатах и теряются." },
      { title: "Сложные процедуры", text: "Косметологические процедуры занимают разное время." },
      { title: "Записи путаются", text: "Сложно контролировать график и повторные визиты." },
      { title: "Клиенты не приходят", text: "Без напоминаний клиенты забывают." },
      { title: "Нет истории клиентов", text: "Сложно помнить процедуры и записи." },
      { title: "Нет структуры", text: "Все ведется вручную." }
    ],
    solutionTitle: "Timviz решает это",
    solutionCards: [
      { title: "Онлайн-запись 24/7", text: "Клиенты записываются сами." },
      { title: "Календарь записей", text: "Все процедуры в одном месте." },
      { title: "Услуги с длительностью", text: "Клиент видит полную информацию." },
      { title: "График работы", text: "Контроль рабочих дней." },
      { title: "Telegram", text: "Мгновенные уведомления." },
      { title: "Карточка клиента", text: "История процедур и записей." }
    ],
    nicheTitle: "Идеально для косметологов",
    nicheText: "Сценарии для косметологической практики: разные процедуры, длительность и повторные визиты в одном календаре.",
    nicheItems: [
      "Чистка лица — 60 мин: базовый визит с понятной форматом услуги и временем.",
      "Пилинг — 45 мин: короткая процедура для точечных окон в расписании.",
      "Инъекционная процедура — 30 мин: запись без перегруза графика.",
      "Уходовый комплекс — 90 мин: длинный слот с буфером между клиентами.",
      "Аппаратная косметология — 75 мин: удобное планирование повторных сеансов."
    ],
    nicheSample: "Чистка лица — 60 мин",
    dayScenarioTitle: "Сценарий рабочего дня косметолога",
    dayScenarioItems: [
      "09:30 — Консультация + диагностика — 30 мин: точный старт дня и план процедур.",
      "10:30 — Чистка лица — 60 мин: базовый прием с фиксированной длительностью.",
      "12:00 — Пилинг — 45 мин: короткий визит для плотного расписания.",
      "14:00 — Уходовый комплекс — 90 мин: длинная процедура с буфером после сеанса.",
      "17:30 — Повторный визит по курсу — 40 мин: клиент записывается сам без переписки."
    ],
    howTitle: "Как это работает",
    howSteps: ["Создайте профиль", "Добавьте услуги", "Начните принимать записи"],
    compareTitle: "Без Timviz / С Timviz",
    compareLeftTitle: "Без Timviz",
    compareRightTitle: "С Timviz",
    compareLeft: ["записи в мессенджерах", "путаница", "нет истории клиентов"],
    compareRight: ["календарь", "структура", "повторные записи", "напоминания"],
    telegramTitle: "Получайте записи и напоминания в Telegram",
    telegramText: "Timviz отправляет новые записи и изменения графика в Telegram без задержек.",
    trustTitle: "Почему косметологи выбирают Timviz",
    trustCards: [
      {
        title: "Контроль сложных процедур по времени",
        text: "Система учитывает разную длительность сеансов и помогает избегать накладок в течение дня."
      },
      {
        title: "Прозрачная запись клиентов онлайн",
        text: "Клиент заранее видит формат визита и длительность, поэтому меньше уточнений и отмен."
      },
      {
        title: "Сильная база для повторных визитов",
        text: "История записей и Telegram-уведомления упрощают курсовые программы и удержание клиентов."
      }
    ],
    seoBlockTitle: "Программа для записи клиентов для косметологов",
    seoParagraphs: [
      "Онлайн запись косметологу важна не только для удобства клиента, но и для устойчивой загрузки кабинета. Когда обращения идут через несколько мессенджеров, заявки легко теряются, а мастер тратит время на постоянные уточнения. Timviz помогает перевести поток в управляемый формат: клиент выбирает процедуру, время и сразу оставляет подтвержденную запись. За счёт этого запись клиентов онлайн становится предсказуемой, уменьшается доля случайных переносов, а расписание выглядит профессионально и понятно уже на этапе первого контакта.",
      "В косметологии разные услуги требуют разного времени и подготовки. Чистка лица, пилинги, инъекционные методики и аппаратные процедуры не могут планироваться одинаковыми слотами. Календарь записей в Timviz учитывает длительность каждой услуги и показывает фактическую картину дня: где длинные процедуры, где короткие окна, где есть перегруз. Это снижает риск накладок и помогает сохранять комфортный темп работы. Для клиента такой подход тоже важен: меньше задержек и больше уверенности, что прием начнется вовремя.",
      "Timviz работает как программа для косметолога, где в одном месте собраны услуги, длительность, статусы визитов и график. Клиент видит полную информацию до бронирования, поэтому меньше уточнений в переписке и меньше ситуаций, когда время выбрано неверно. Для специалиста это прямое повышение конверсии: запрос быстрее превращается в реальную запись. Запись клиентов косметолог становится структурированной, а администрирование занимает значительно меньше времени, чем при ручном ведении чатов и таблиц.",
      "Если вам нужна CRM для косметолога без сложного внедрения, Timviz дает быстрый старт. Не требуется отдельный сайт или технический запуск: создаете профиль, добавляете процедуры и делитесь ссылкой. С этого момента онлайн запись косметологических услуг доступна 24/7, даже когда вы не в сети. Клиенты могут записаться вечером или ночью, а утром вы видите готовый список подтвержденных визитов. Такой формат помогает заполнять расписание ровнее и уменьшает зависимость от ручной коммуникации.",
      "Реальный рабочий сценарий: утром идет короткий инъекционный прием на 30 минут, затем чистка лица на 60 минут, после обеда — уходовый комплекс на 90 минут. Без системного календаря такие сочетания часто создают накладки или пустые разрывы. Timviz автоматически показывает доступные окна с учетом длительности, поэтому запись клиентов косметолог проходит точнее. Вы получаете более плотный, но управляемый график, где меньше простоев и меньше стрессовых переносов в последний момент.",
      "Важную роль играют повторные визиты, особенно при курсах процедур. Клиенту нужно легко подобрать следующий сеанс, а специалисту — быстро увидеть подходящие слоты. Календарь записей в Timviz упрощает этот процесс: вы сразу видите загрузку на неделю и можете предложить время без долгих переписок. Это улучшает удержание клиентов и повышает LTV, потому что людям проще продолжать курс, когда запись организована прозрачно. Запись клиентов онлайн становится частью качественного сервиса, а не отдельной задачей.",
      "Telegram-уведомления дополняют систему и помогают не пропускать изменения. Новая заявка, перенос или отмена приходят мгновенно, поэтому косметолог может оперативно скорректировать день. Это особенно важно в плотном графике, где один пропущенный апдейт создает цепочку сдвигов. В связке с CRM для косметолога уведомления повышают точность работы и уменьшают риск потерь. Вы быстрее реагируете на события и сохраняете управляемость расписания без постоянного мониторинга нескольких каналов.",
      "Поисковые запросы вроде «программа для косметолога», «запись клиентов косметолог» или «онлайн запись косметологические услуги» обычно связаны с желанием увеличить количество подтвержденных визитов и сократить хаос в коммуникации. Timviz закрывает эти задачи: понятный интерфейс для клиента, структурированный календарь для мастера и четкая логика записи для всей студии. В результате путь от интереса до записи сокращается, а нагрузка на администратора снижается. Это напрямую влияет на конверсию и стабильность выручки.",
      "Для частного кабинета и небольшой студии ценность одинаковая: меньше ручной рутины, выше качество сервиса, больше контроля над временем. Программа для косметолога позволяет стандартизировать процесс записи, сохранить гибкость по процедурам и быстрее находить свободные окна. Когда запись клиентов онлайн работает системно, у специалиста освобождается ресурс на качество процедур и развитие практики. Клиенты чувствуют эту организованность и чаще возвращаются повторно.",
      "Итог: Timviz — это практичный сервис онлайн-записи, который объединяет календарь, процедуры, длительность, повторные визиты и уведомления в одной системе. Он помогает косметологу перейти от хаотичных чатов к прозрачному управлению расписанием, где каждый слот работает на результат. Запись клиентов косметолог становится предсказуемой и удобной, а бизнес получает рост конверсии и более стабильный поток посещений без перегруза команды.",
      "Дополнительно система помогает работать с загрузкой по дням недели. По статистике у многих кабинетов есть перегруженные вечерние часы и провалы в середине дня. Когда календарь показывает реальную картину, проще запускать точечные предложения на свободные окна и мягко выравнивать поток записей. Для косметолога это важный коммерческий эффект: меньше простоя оборудования, выше окупаемость рабочего времени и более стабильный план по выручке без агрессивного демпинга.",
      "С точки зрения бренда специалиста онлайн-запись тоже играет стратегическую роль. Клиент оценивает не только результат процедуры, но и то, насколько удобно было записаться. Понятная страница с услугами, длительностью и форматом услуги формирует доверие ещё до первого визита. Timviz помогает выстроить этот путь профессионально и последовательно. В итоге программа для косметолога работает как инструмент сервиса и продаж одновременно: улучшает впечатление, повышает повторяемость визитов и укрепляет лояльность аудитории.",
      "Когда запись организована системно, у косметолога освобождается время на развитие услуг: тестирование новых процедур, повышение квалификации, работу с рекомендациями. Вместо ежедневного «тушения пожаров» в чатах вы получаете управляемый поток записей и можете планировать рост. Timviz в этой логике становится не просто календарем, а частью бизнес-модели кабинета, где сервис и конверсия поддерживают друг друга и дают устойчивый результат на дистанции."
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "Как работает онлайн-запись для косметолога?", a: "Клиент выбирает услугу и время, а запись сразу появляется в календаре." },
      { q: "Можно ли вести историю клиентов?", a: "Да, в карточке клиента хранится история процедур и визитов." },
      { q: "Можно ли настроить длительность процедур?", a: "Да, для каждой услуги задается отдельная длительность и формат услуги." },
      { q: "Подходит ли Timviz для одного специалиста?", a: "Да, сервис подходит и частному мастеру, и студии." },
      { q: "Можно ли работать без сайта?", a: "Да, достаточно профиля Timviz и ссылки на страницу записи." },
      { q: "Есть ли уведомления в Telegram?", a: "Да, вы получаете уведомления о новых записях и изменениях." }
    ],
    finalTitle: "Запустите онлайн-запись уже сегодня",
    finalText: "Создайте профиль, добавьте услуги и откройте клиентам удобную запись без хаоса.",
    otherTitle: "Другие направления",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    footerText: "Timviz для бизнеса · онлайн-запись клиентов и управление услугами",
    altCalendar: "Календарь записей для косметологов в Timviz",
    altServices: "Услуги и длительность косметолога в Timviz",
    altTelegram: "Telegram уведомления о записях для косметологов в Timviz"
  },
  en: {
    home: "Home",
    forBusiness: "For business",
    title: "Online booking for cosmetologists",
    subtitle: "Accept client bookings online and manage procedures without schedule chaos",
    ctaPrimary: "Start taking bookings in 2 minutes",
    ctaAfterFeatures: "Start taking bookings in 2 minutes",
    ctaFinal: "Start taking bookings in 2 minutes",
    ctaHint: "No complex setup • no website • free start",
    microcopy: "No complex setup • no website • free start",
    sampleClient: "Client: Olena S.",
    sampleService: "Facial cleansing · 60 min",
    sampleStatus: "Status: Confirmed",
    problemsTitle: "Common cosmetology issues",
    problems: [
      { title: "Clients text in messengers", text: "Bookings stay in chats and get lost." },
      { title: "Complex procedures", text: "Different procedures require different durations." },
      { title: "Bookings get mixed up", text: "Hard to manage schedule and repeat visits." },
      { title: "Clients miss appointments", text: "Without reminders, no-shows increase." },
      { title: "No client history", text: "Hard to track previous procedures." },
      { title: "No structure", text: "Everything is managed manually." }
    ],
    solutionTitle: "Timviz solves this",
    solutionCards: [
      { title: "24/7 online booking", text: "Clients book on their own." },
      { title: "Booking calendar", text: "All procedures in one place." },
      { title: "Services with duration", text: "Clients see full service details." },
      { title: "Work schedule", text: "Control work days and windows." },
      { title: "Telegram", text: "Instant booking updates." },
      { title: "Client card", text: "Procedure and visit history." }
    ],
    nicheTitle: "Perfect for cosmetologists",
    nicheText: "Built for cosmetology specialists and studios with multi-duration procedures.",
    nicheItems: ["facial cleansing", "peelings", "injections", "care procedures", "hardware cosmetology"],
    nicheSample: "Facial cleansing — 60 min",
    dayScenarioTitle: "Cosmetologist day scenario",
    dayScenarioItems: [
      "09:30 — Consultation + diagnostics — 30 min: clear day opening with treatment planning.",
      "10:30 — Facial cleansing — 60 min: core procedure scheduled with exact duration.",
      "12:00 — Peel treatment — 45 min: short service that fits dense calendars.",
      "14:00 — Advanced care package — 90 min: long session with safe buffer.",
      "17:30 — Follow-up course visit — 40 min: repeat booking captured online without chat friction."
    ],
    howTitle: "How it works",
    howSteps: ["Create profile", "Add services", "Start taking bookings"],
    compareTitle: "Without Timviz / With Timviz",
    compareLeftTitle: "Without Timviz",
    compareRightTitle: "With Timviz",
    compareLeft: ["messenger bookings", "confusion", "no client history"],
    compareRight: ["calendar", "clear structure", "repeat bookings", "reminders"],
    telegramTitle: "Receive bookings and reminders in Telegram",
    telegramText: "Timviz sends new bookings and schedule updates directly to Telegram.",
    trustTitle: "Why cosmetologists trust Timviz",
    trustCards: [
      {
        title: "Precise control of procedure-heavy schedules",
        text: "Different treatment durations stay organized in one calendar with fewer operational errors."
      },
      {
        title: "Clear client booking path",
        text: "Clients see service details, duration and service setup before booking, improving conversion quality."
      },
      {
        title: "Better repeat-visit retention",
        text: "Structured records and instant alerts support course-based workflows and follow-up appointments."
      }
    ],
    seoBlockTitle: "Client booking software for cosmetologists",
    seoParagraphs: [
      "Online booking for cosmetologists is crucial for both schedule stability and conversion. When inquiries arrive across several messengers, key requests are missed and response time grows. Timviz centralizes this process: clients choose treatment and time on their own, and you receive structured confirmed bookings in one calendar.",
      "Cosmetology services are timing-sensitive. Facial cleansing, peel sessions, injections and аппарат-based treatments require different durations and preparation buffers. Manual planning often creates conflicts. Timviz links each service with duration and service details, then protects the booking flow from invalid time choices.",
      "Many specialists search for booking software because they need less manual coordination and more predictable appointments. Timviz offers a practical setup where service catalog, service details, durations and booking statuses are unified. Clients know what they are booking before submission, which reduces misunderstandings.",
      "For solo professionals, Timviz works as a lightweight CRM with quick onboarding. No separate website or technical launch is required. Create profile, configure procedures and share one booking link. Your online booking channel then runs 24/7 and captures demand even outside working hours.",
      "A real cosmetology day combines short and long sessions. Consultation may take 30 minutes, cleansing 60 minutes, and advanced care procedures 90 minutes or more. Without structure, this mix leads to overlaps and late starts. Timviz keeps service timing logic intact and improves operational flow.",
      "Telegram notifications improve reaction speed. New bookings, reschedules and cancellations are delivered instantly, so you can adjust the day before capacity is lost. This is especially important in high-load weeks when one missed update can cascade into multiple schedule issues.",
      "Repeat appointments are a major revenue driver in cosmetology. Course-based procedures require consistent follow-up timing. With a clear booking calendar and structured services, it is easier to secure the next visit during or right after checkout. This strengthens retention and client lifetime value.",
      "For multi-specialist studios, centralized booking improves management visibility. You can see demand distribution, identify overloaded windows and rebalance schedules across team members. Timviz supports operational decisions, not just appointment storage.",
      "Search intent behind phrases like online booking for cosmetologists, cosmetology booking calendar, or client booking software is usually transactional. Specialists want higher confirmed bookings with lower admin load. Timviz is built for exactly that outcome with clear user flow and practical controls.",
      "A transparent booking experience also strengthens trust. Clients value clear treatment details, accurate timing and reliable confirmations. When booking feels simple and professional, they are more likely to return and recommend your studio.",
      "Timviz additionally helps monetize short windows between long procedures. In manual operations these windows are often lost. With visible availability and duration-aware slots, quick treatments can fill those gaps and improve schedule utilization.",
      "Overall, Timviz gives cosmetologists a conversion-focused booking system: service-driven scheduling, clear service setup, repeat-visit support and real-time Telegram alerts. It reduces administrative friction and turns fragmented demand into predictable, high-quality appointments."
    ],
    faqTitle: "FAQ",
    faq: [
      { q: "How does online booking for cosmetologists work?", a: "Clients choose a service and time slot, and the appointment appears in your calendar." },
      { q: "Can I keep client history?", a: "Yes, Timviz stores procedure and visit history in the client card." },
      { q: "Can I set service duration?", a: "Yes, each service can have separate duration and service setup." },
      { q: "Can solo specialists use Timviz?", a: "Yes, it works well for both solo professionals and small teams." },
      { q: "Can I work without a website?", a: "Yes, your Timviz profile and booking page are enough." },
      { q: "Are Telegram notifications available?", a: "Yes, you get instant updates for new and changed bookings." }
    ],
    finalTitle: "Launch online booking today",
    finalText: "Create your profile, add services and open easy online booking for your clients.",
    otherTitle: "Other directions",
    privacy: "Privacy policy",
    terms: "Terms of use",
    footerText: "Timviz for business · online client booking and service management",
    altCalendar: "Cosmetologist booking calendar in Timviz",
    altServices: "Cosmetologist services and service setup in Timviz",
    altTelegram: "Telegram booking notifications for cosmetologists in Timviz"
  }
};

export function buildCosmetologistMetadata(lang: SiteLanguage, pathname: string): Metadata {
  const title =
    lang === "uk"
      ? "Онлайн-запис для косметологів — календар і CRM | Timviz"
      : lang === "ru"
        ? "Онлайн-запись для косметологов — календарь и CRM | Timviz"
        : "Online booking for cosmetologists — calendar & CRM | Timviz";

  const description =
    lang === "uk"
      ? "Timviz — онлайн-запис для косметологів: календар записів, процедури, тривалість і Telegram-сповіщення."
      : lang === "ru"
        ? "Timviz — онлайн-запись для косметологов: календарь записей, процедуры, длительность и Telegram-уведомления."
        : "Timviz is online booking software for cosmetologists with calendar, service durations, service setup and Telegram alerts.";

  const metadata = buildMetadata(pathname, { title, description }, lang);
  return {
    ...metadata,
    alternates: {
      canonical: `https://timviz.com${pathname}`,
      languages: {
        uk: `https://timviz.com${cosmetologistPathByLanguage.uk}`,
        ru: `https://timviz.com${cosmetologistPathByLanguage.ru}`,
        en: `https://timviz.com${cosmetologistPathByLanguage.en}`,
        "x-default": `https://timviz.com${cosmetologistPathByLanguage.en}`
      }
    }
  };
}

export default function CosmetologistLanding({ language }: { language: SiteLanguage }) {
  const t = copy[language];
  const ux = getNicheUxContent(language, "cosmetologists");
  const screenshots = screenshotsByLanguage[language];
  const otherKeys = nicheKeys.filter((key) => key !== "cosmetologists");

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
        item: `https://timviz.com${cosmetologistPathByLanguage[language]}`
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
