"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import PublicHeaderAuthMenu from "../PublicHeaderAuthMenu";
import { buildAdsCarryoverUrl, trackAdsEvent } from "../../lib/ads-events";
import { mobileApps } from "../../lib/mobile-apps";
import { getLocalizedPath, publicFooterLabels, type SiteLanguage } from "../../lib/site-language";

type MastersCopy = {
  navLabel: string;
  proLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  offer: string;
  primaryCta: string;
  secondaryCta: string;
  appStoreCta: string;
  proof: string;
  visualTitle: string;
  visualService: string;
  visualTime: string;
  visualStatus: string;
  nichesTitle: string;
  niches: string[];
  painsTitle: string;
  pains: string[];
  solutionTitle: string;
  solutionText: string;
  solution: string[];
  stepsTitle: string;
  steps: string[];
  formTitle: string;
  formText: string;
  formFields: string[];
  formSubmit: string;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  finalTitle: string;
  finalText: string;
  footer: string;
};

const copy: Record<SiteLanguage, MastersCopy> = {
  ru: {
    navLabel: "Реклама Timviz для мастеров",
    proLabel: "Timviz Pro",
    badge: "Для частных мастеров, салонов и небольших студий",
    title: "Онлайн-запись для частного мастера",
    subtitle:
      "Клиенты сами выбирают услугу и свободное время - без звонков, переписок и путаницы. Если у вас салон или команда, Timviz тоже подойдет.",
    offer: "500 бесплатных записей + 14 дней PRO бесплатно",
    primaryCta: "Создать страницу записи бесплатно",
    secondaryCta: "Посмотреть, как работает",
    appStoreCta: "Открыть в App Store",
    proof: "Запуск за несколько минут. Подходит solo-мастеру, кабинету и салону.",
    visualTitle: "Заявка клиента",
    visualService: "Маникюр с покрытием",
    visualTime: "Сегодня, 18:30",
    visualStatus: "Ожидает подтверждения",
    nichesTitle: "Для каких мастеров",
    niches: ["Маникюр и педикюр", "Брови и ресницы", "Барберы и парикмахеры", "Массаж", "Косметология", "Частные специалисты", "Тренеры и консультанты", "Салоны и студии"],
    painsTitle: "Что мешает частному мастеру",
    pains: ["Клиенты пишут в Direct, Telegram и Viber, а записи теряются.", "Кто-то хочет записаться ночью, пока вы не отвечаете.", "Сложно быстро показать свободные окна.", "Возникают дубли записей.", "Много переписок ради одного визита.", "Нет простой ссылки, которую можно дать клиенту или поставить в профиль."],
    solutionTitle: "Личная ссылка записи без переписок",
    solutionText:
      "Вы настраиваете услуги, длительность, цену и график. Клиент открывает ссылку, выбирает удобное время и отправляет готовую заявку. Для салона можно добавить специалистов и командное расписание.",
    solution: ["Персональная страница онлайн-записи", "Услуги, цены и длительность", "Удобный календарь мастера", "Ссылка для Instagram, Telegram, Viber и сайта", "Заявки без звонков и долгих переписок"],
    stepsTitle: "Как это работает",
    steps: ["Создайте профиль", "Добавьте услуги и график", "Отправьте ссылку клиентам", "Получайте записи онлайн"],
    formTitle: "Короткий старт",
    formText: "Регистрация уже реализована через аккаунт мастера, поэтому кнопка ведет сразу к созданию кабинета.",
    formFields: ["Имя", "Телефон или email", "Сфера деятельности"],
    formSubmit: "Начать бесплатно",
    faqTitle: "Вопросы перед запуском",
    faq: [
      { q: "Timviz подходит частному мастеру?", a: "Да. Можно создать страницу записи даже для одного специалиста без отдельного сайта или администратора." },
      { q: "Нужно ли иметь свой сайт?", a: "Нет. Timviz создает вашу страницу записи, ссылку можно отправлять клиентам." },
      { q: "Клиенты смогут сами выбирать время?", a: "Да. Клиент выбирает услугу, специалиста и свободное время." },
      { q: "Можно начать бесплатно?", a: "Да. Новым пользователям доступно 500 бесплатных записей и 14 дней PRO." },
      { q: "Можно отправить ссылку в Instagram или Telegram?", a: "Да. Ссылку можно добавить в профиль, сторис, сообщения или на сайт." },
      { q: "Подходит ли для салона с несколькими мастерами?", a: "Да. Если вы пришли как салон, можно добавить специалистов, услуги и расписание команды." }
    ],
    finalTitle: "Запустите онлайн-запись сегодня",
    finalText: "Создайте страницу записи, отправьте ссылку клиентам и перестаньте собирать расписание вручную.",
    footer: "Timviz для мастеров - онлайн-запись клиентов и календарь"
  },
  uk: {
    navLabel: "Реклама Timviz для майстрів",
    proLabel: "Timviz Pro",
    badge: "Для приватних майстрів, салонів і невеликих студій",
    title: "Онлайн-запис для приватного майстра",
    subtitle:
      "Клієнти самі обирають послугу і вільний час - без дзвінків, переписок і плутанини. Якщо у вас салон або команда, Timviz теж підійде.",
    offer: "500 безкоштовних записів + 14 днів PRO безкоштовно",
    primaryCta: "Створити сторінку запису безкоштовно",
    secondaryCta: "Подивитися, як працює",
    appStoreCta: "Відкрити в App Store",
    proof: "Запуск за кілька хвилин. Підходить solo-майстру, кабінету і салону.",
    visualTitle: "Заявка клієнта",
    visualService: "Манікюр з покриттям",
    visualTime: "Сьогодні, 18:30",
    visualStatus: "Очікує підтвердження",
    nichesTitle: "Для яких майстрів",
    niches: ["Манікюр і педикюр", "Брови і вії", "Барбери і перукарі", "Масаж", "Косметологія", "Приватні спеціалісти", "Тренери і консультанти", "Салони і студії"],
    painsTitle: "Що заважає приватному майстру",
    pains: ["Клієнти пишуть у Direct, Telegram і Viber, а записи губляться.", "Хтось хоче записатися вночі, поки ви не відповідаєте.", "Складно швидко показати вільні вікна.", "З'являються дублікати записів.", "Багато переписок заради одного візиту.", "Немає простого посилання для клієнта або профілю."],
    solutionTitle: "Особисте посилання запису без переписок",
    solutionText:
      "Ви налаштовуєте послуги, тривалість, ціну і графік. Клієнт відкриває посилання, обирає зручний час і надсилає готову заявку. Для салону можна додати спеціалістів і командний розклад.",
    solution: ["Персональна сторінка онлайн-запису", "Послуги, ціни і тривалість", "Зручний календар майстра", "Посилання для Instagram, Telegram, Viber і сайту", "Заявки без дзвінків і довгих переписок"],
    stepsTitle: "Як це працює",
    steps: ["Створіть профіль", "Додайте послуги і графік", "Надішліть посилання клієнтам", "Отримуйте записи онлайн"],
    formTitle: "Короткий старт",
    formText: "Реєстрація вже реалізована через акаунт майстра, тому кнопка веде одразу до створення кабінету.",
    formFields: ["Ім'я", "Телефон або email", "Сфера діяльності"],
    formSubmit: "Почати безкоштовно",
    faqTitle: "Питання перед запуском",
    faq: [
      { q: "Timviz підходить приватному майстру?", a: "Так. Можна створити сторінку запису навіть для одного спеціаліста без окремого сайту чи адміністратора." },
      { q: "Чи потрібен власний сайт?", a: "Ні. Timviz створює вашу сторінку запису, посилання можна надсилати клієнтам." },
      { q: "Клієнти зможуть самі обирати час?", a: "Так. Клієнт обирає послугу, спеціаліста і вільний час." },
      { q: "Можна почати безкоштовно?", a: "Так. Новим користувачам доступні 500 безкоштовних записів і 14 днів PRO." },
      { q: "Можна надіслати посилання в Instagram або Telegram?", a: "Так. Посилання можна додати в профіль, сторис, повідомлення або на сайт." },
      { q: "Підходить для салону з кількома майстрами?", a: "Так. Якщо ви прийшли як салон, можна додати спеціалістів, послуги і розклад команди." }
    ],
    finalTitle: "Запустіть онлайн-запис сьогодні",
    finalText: "Створіть сторінку запису, надішліть посилання клієнтам і перестаньте збирати розклад вручну.",
    footer: "Timviz для майстрів - онлайн-запис клієнтів і календар"
  },
  en: {
    navLabel: "Timviz ads landing for professionals",
    proLabel: "Timviz Pro",
    badge: "For independent pros, salons and small studios",
    title: "Online booking for independent specialists",
    subtitle:
      "Clients choose a service and available time themselves - without calls, chats or confusion. If you run a salon or team, Timviz works for you too.",
    offer: "500 free bookings + 14 days of PRO free",
    primaryCta: "Create a booking page for free",
    secondaryCta: "See how it works",
    appStoreCta: "Open in App Store",
    proof: "Launch in minutes. Built for solo pros, private rooms and salons.",
    visualTitle: "Client request",
    visualService: "Manicure with gel polish",
    visualTime: "Today, 18:30",
    visualStatus: "Waiting for confirmation",
    nichesTitle: "Which specialists use Timviz",
    niches: ["Nails and pedicure", "Brows and lashes", "Barbers and hairdressers", "Massage", "Cosmetology", "Independent specialists", "Trainers and consultants", "Salons and studios"],
    painsTitle: "What slows solo specialists down",
    pains: ["Clients write in Direct, Telegram and Viber, and bookings get lost.", "Someone wants to book at night while you are offline.", "It is hard to show free slots quickly.", "Duplicate bookings happen.", "One visit takes too many messages.", "There is no simple link for clients or your profile."],
    solutionTitle: "Your personal booking link",
    solutionText:
      "Set services, duration, prices and schedule. The client opens your link, picks a time and sends a structured request. For salons, you can add specialists and a team schedule.",
    solution: ["Personal online booking page", "Services, prices and duration", "Simple specialist calendar", "Link for Instagram, Telegram, Viber and websites", "Requests without calls or long chats"],
    stepsTitle: "How it works",
    steps: ["Create a profile", "Add services and schedule", "Send the link to clients", "Receive online bookings"],
    formTitle: "Short start",
    formText: "Registration already works through the professional account, so the button opens account creation directly.",
    formFields: ["Name", "Phone or email", "Business category"],
    formSubmit: "Start free",
    faqTitle: "Questions before launch",
    faq: [
      { q: "Does Timviz work for an independent specialist?", a: "Yes. You can create a booking page as a solo professional without a separate website or admin." },
      { q: "Do I need my own website?", a: "No. Timviz creates your booking page, and you can send the link to clients." },
      { q: "Can clients choose time themselves?", a: "Yes. A client selects the service, specialist and available time." },
      { q: "Can I start free?", a: "Yes. New users get 500 free bookings and 14 days of PRO." },
      { q: "Can I share the link on Instagram or Telegram?", a: "Yes. Add it to your profile, stories, messages or website." },
      { q: "Does it work for a salon with several specialists?", a: "Yes. If you came as a salon, you can add specialists, services and a team schedule." }
    ],
    finalTitle: "Launch online booking today",
    finalText: "Create your booking page, share the link with clients and stop assembling your schedule manually.",
    footer: "Timviz for professionals - client online booking and calendar"
  },
  fr: {
    navLabel: "Page publicitaire Timviz pour pros",
    proLabel: "Timviz Pro",
    badge: "Pour independants, salons et petits studios",
    title: "Reservation en ligne pour independants",
    subtitle: "Les clients choisissent le service et l'heure disponible, sans appels ni longs messages. Si vous avez un salon ou une equipe, Timviz convient aussi.",
    offer: "500 reservations gratuites + 14 jours PRO offerts",
    primaryCta: "Creer une page de reservation gratuite",
    secondaryCta: "Voir le fonctionnement",
    appStoreCta: "Ouvrir dans l'App Store",
    proof: "Lancement en quelques minutes. Pour solo, cabinet prive et salon.",
    visualTitle: "Demande client",
    visualService: "Manucure avec vernis gel",
    visualTime: "Aujourd'hui, 18:30",
    visualStatus: "En attente de confirmation",
    nichesTitle: "Quels pros utilisent Timviz",
    niches: ["Ongles et pedicure", "Sourcils et cils", "Barbiers et coiffeurs", "Massage", "Esthetique", "Specialistes independants", "Coach et consultants", "Salons et studios"],
    painsTitle: "Ce qui ralentit un independant",
    pains: ["Les clients ecrivent sur Direct, Telegram et Viber, et les rendez-vous se perdent.", "Un client veut reserver la nuit pendant que vous etes hors ligne.", "Il est difficile de montrer vite les creneaux libres.", "Des doublons apparaissent.", "Un seul rendez-vous demande trop de messages.", "Il manque un lien simple pour les clients ou le profil."],
    solutionTitle: "Votre lien personnel de reservation",
    solutionText: "Configurez services, duree, prix et planning. Le client ouvre le lien, choisit l'heure et envoie une demande structuree. Pour un salon, vous pouvez ajouter des specialistes et un planning d'equipe.",
    solution: ["Page personnelle de reservation", "Services, prix et durees", "Calendrier simple du specialiste", "Lien pour Instagram, Telegram, Viber et site", "Demandes sans appels ni longs chats"],
    stepsTitle: "Comment ca marche",
    steps: ["Creez un profil", "Ajoutez services et planning", "Envoyez le lien aux clients", "Recevez des reservations en ligne"],
    formTitle: "Demarrage court",
    formText: "L'inscription existe deja via le compte professionnel, le bouton ouvre directement la creation du compte.",
    formFields: ["Nom", "Telephone ou email", "Domaine d'activite"],
    formSubmit: "Commencer gratuitement",
    faqTitle: "Questions avant lancement",
    faq: [
      { q: "Timviz convient-il a un independant?", a: "Oui. Vous pouvez creer une page comme specialiste solo, sans site separe ni administrateur." },
      { q: "Faut-il un site web?", a: "Non. Timviz cree votre page et vous partagez le lien." },
      { q: "Les clients choisissent-ils l'heure?", a: "Oui. Le client choisit service, specialiste et heure disponible." },
      { q: "Puis-je commencer gratuitement?", a: "Oui. Les nouveaux utilisateurs ont 500 reservations gratuites et 14 jours PRO." },
      { q: "Puis-je partager le lien sur Instagram ou Telegram?", a: "Oui. Ajoutez-le au profil, stories, messages ou site." },
      { q: "Est-ce adapte a un salon?", a: "Oui. Si vous venez d'un salon, ajoutez specialistes, services et planning d'equipe." }
    ],
    finalTitle: "Lancez la reservation en ligne aujourd'hui",
    finalText: "Creez la page, partagez le lien et arretez de gerer le planning a la main.",
    footer: "Timviz pour pros - reservation client et calendrier"
  },
  pl: {
    navLabel: "Landing reklamowy Timviz dla specjalistow",
    proLabel: "Timviz Pro",
    badge: "Dla niezaleznych specjalistow, salonow i malych studiow",
    title: "Rezerwacje online dla niezaleznego specjalisty",
    subtitle: "Klienci sami wybieraja usluge i wolny termin, bez telefonow i dlugich wiadomosci. Jesli prowadzisz salon lub zespol, Timviz tez pasuje.",
    offer: "500 darmowych rezerwacji + 14 dni PRO gratis",
    primaryCta: "Utworz darmowa strone rezerwacji",
    secondaryCta: "Zobacz, jak dziala",
    appStoreCta: "Otworz w App Store",
    proof: "Start w kilka minut. Dla solo, gabinetu i salonu.",
    visualTitle: "Zapytanie klienta",
    visualService: "Manicure hybrydowy",
    visualTime: "Dzis, 18:30",
    visualStatus: "Czeka na potwierdzenie",
    nichesTitle: "Jacy specjalisci uzywaja Timviz",
    niches: ["Paznokcie i pedicure", "Brwi i rzesy", "Barberzy i fryzjerzy", "Masaz", "Kosmetologia", "Niezalezni specjalisci", "Trenerzy i konsultanci", "Salony i studia"],
    painsTitle: "Co spowalnia specjaliste solo",
    pains: ["Klienci pisza w Direct, Telegram i Viber, a zapisy sie gubia.", "Ktos chce zarezerwowac w nocy, kiedy nie odpowiadasz.", "Trudno szybko pokazac wolne terminy.", "Pojawiaja sie podwojne zapisy.", "Jedna wizyta wymaga zbyt wielu wiadomosci.", "Brakuje prostego linku dla klienta albo profilu."],
    solutionTitle: "Twoj osobisty link rezerwacji",
    solutionText: "Ustaw uslugi, czas, ceny i grafik. Klient otwiera link, wybiera termin i wysyla uporzadkowane zgloszenie. Dla salonu mozesz dodac specjalistow i grafik zespolu.",
    solution: ["Wlasna strona rezerwacji online", "Uslugi, ceny i czas", "Wygodny kalendarz specjalisty", "Link do Instagram, Telegram, Viber i strony", "Zgloszenia bez telefonow i dlugich czatow"],
    stepsTitle: "Jak to dziala",
    steps: ["Utworz profil", "Dodaj uslugi i grafik", "Wyslij link klientom", "Odbieraj rezerwacje online"],
    formTitle: "Krotki start",
    formText: "Rejestracja dziala juz przez konto specjalisty, wiec przycisk prowadzi od razu do tworzenia konta.",
    formFields: ["Imie", "Telefon lub email", "Branza"],
    formSubmit: "Zacznij za darmo",
    faqTitle: "Pytania przed startem",
    faq: [
      { q: "Czy Timviz pasuje dla niezaleznego specjalisty?", a: "Tak. Mozesz stworzyc strone rezerwacji jako solo specjalista, bez osobnej strony i administratora." },
      { q: "Czy potrzebuje wlasnej strony?", a: "Nie. Timviz tworzy strone rezerwacji, a Ty wysylasz link klientom." },
      { q: "Czy klienci sami wybieraja czas?", a: "Tak. Klient wybiera usluge, specjaliste i wolny termin." },
      { q: "Czy moge zaczac za darmo?", a: "Tak. Nowi uzytkownicy dostaja 500 darmowych rezerwacji i 14 dni PRO." },
      { q: "Czy link dziala na Instagramie lub Telegramie?", a: "Tak. Dodaj go do profilu, stories, wiadomosci lub strony." },
      { q: "Czy pasuje do salonu z kilkoma osobami?", a: "Tak. Jesli przychodzisz jako salon, mozesz dodac specjalistow, uslugi i grafik zespolu." }
    ],
    finalTitle: "Uruchom rezerwacje online dzisiaj",
    finalText: "Utworz strone, wyslij link klientom i przestan ukladac grafik recznie.",
    footer: "Timviz dla specjalistow - rezerwacje klientow i kalendarz"
  },
  cs: {
    navLabel: "Reklamni landing Timviz pro specialisty",
    proLabel: "Timviz Pro",
    badge: "Pro nezavisle specialisty, salony a mala studia",
    title: "Online rezervace pro nezavisleho specialistu",
    subtitle: "Klienti si sami vyberou sluzbu a volny cas, bez telefonatu a dlouhych zprav. Pokud mate salon nebo tym, Timviz se hodi take.",
    offer: "500 rezervaci zdarma + 14 dni PRO zdarma",
    primaryCta: "Vytvorit rezervacni stranku zdarma",
    secondaryCta: "Podivat se, jak funguje",
    appStoreCta: "Otevrit v App Store",
    proof: "Spusteni za par minut. Pro solo specialistu, kabinet i salon.",
    visualTitle: "Pozadavek klienta",
    visualService: "Manikura s gel lakem",
    visualTime: "Dnes, 18:30",
    visualStatus: "Ceka na potvrzeni",
    nichesTitle: "Jaci specialisti pouzivaji Timviz",
    niches: ["Nehty a pedikura", "Oboci a rasy", "Barberi a kadernici", "Masaze", "Kosmetika", "Nezavisli specialisti", "Treneri a konzultanti", "Salony a studia"],
    painsTitle: "Co brzdi solo specialistu",
    pains: ["Klienti pisou do Directu, Telegramu a Viberu a rezervace se ztraceji.", "Nekdo se chce objednat v noci, kdy neodpovidate.", "Je tezke rychle ukazat volna mista.", "Vznikaji duplicitni rezervace.", "Jedna navsteva znamena prilis mnoho zprav.", "Chybi jednoduchy odkaz pro klienta nebo profil."],
    solutionTitle: "Vas osobni rezervacni odkaz",
    solutionText: "Nastavte sluzby, delku, ceny a rozvrh. Klient otevre odkaz, vybere termin a posle strukturovany pozadavek. Pro salon muzete pridat specialisty a tymovy rozvrh.",
    solution: ["Osobni online rezervacni stranka", "Sluzby, ceny a delky", "Prehledny kalendar specialisty", "Odkaz pro Instagram, Telegram, Viber a web", "Pozadavky bez telefonatu a dlouhych chatu"],
    stepsTitle: "Jak to funguje",
    steps: ["Vytvorte profil", "Pridejte sluzby a rozvrh", "Poslete odkaz klientum", "Prijimejte online rezervace"],
    formTitle: "Rychly start",
    formText: "Registrace uz funguje pres profesionalni ucet, tlacitko vede primo k vytvoreni uctu.",
    formFields: ["Jmeno", "Telefon nebo email", "Obor"],
    formSubmit: "Zacit zdarma",
    faqTitle: "Otazky pred startem",
    faq: [
      { q: "Hodi se Timviz pro nezavisleho specialistu?", a: "Ano. Rezervacni stranku muzete vytvorit jako solo specialista, bez vlastniho webu nebo administratora." },
      { q: "Potrebuji vlastni web?", a: "Ne. Timviz vytvori vasi stranku a odkaz poslete klientum." },
      { q: "Mohou klienti vybrat cas sami?", a: "Ano. Klient vybere sluzbu, specialistu a volny cas." },
      { q: "Muzu zacit zdarma?", a: "Ano. Novi uzivatele maji 500 rezervaci zdarma a 14 dni PRO." },
      { q: "Muzu poslat odkaz na Instagram nebo Telegram?", a: "Ano. Pridejte ho do profilu, stories, zprav nebo webu." },
      { q: "Funguje pro salon s vice lidmi?", a: "Ano. Pokud prichazite jako salon, muzete pridat specialisty, sluzby a tymovy rozvrh." }
    ],
    finalTitle: "Spustte online rezervace jeste dnes",
    finalText: "Vytvorte stranku, poslete odkaz klientum a prestante skladat rozvrh rucne.",
    footer: "Timviz pro specialisty - rezervace klientu a kalendar"
  },
  es: {
    navLabel: "Landing de anuncios Timviz para profesionales",
    proLabel: "Timviz Pro",
    badge: "Para profesionales independientes, salones y estudios pequenos",
    title: "Reservas online para profesionales independientes",
    subtitle: "Los clientes eligen servicio y hora disponible sin llamadas ni mensajes largos. Si tienes un salon o equipo, Timviz tambien encaja.",
    offer: "500 reservas gratis + 14 dias PRO gratis",
    primaryCta: "Crear pagina de reservas gratis",
    secondaryCta: "Ver como funciona",
    appStoreCta: "Abrir en App Store",
    proof: "Lanzamiento en minutos. Para profesional solo, gabinete y salon.",
    visualTitle: "Solicitud de cliente",
    visualService: "Manicura con gel",
    visualTime: "Hoy, 18:30",
    visualStatus: "Esperando confirmacion",
    nichesTitle: "Que profesionales usan Timviz",
    niches: ["Unas y pedicura", "Cejas y pestanas", "Barberos y peluqueros", "Masaje", "Cosmetologia", "Especialistas independientes", "Entrenadores y consultores", "Salones y estudios"],
    painsTitle: "Lo que frena a un profesional solo",
    pains: ["Los clientes escriben en Direct, Telegram y Viber, y las reservas se pierden.", "Alguien quiere reservar de noche cuando no respondes.", "Es dificil mostrar huecos libres rapidamente.", "Aparecen reservas duplicadas.", "Una visita requiere demasiados mensajes.", "No hay un enlace simple para clientes o perfil."],
    solutionTitle: "Tu enlace personal de reservas",
    solutionText: "Configura servicios, duracion, precios y horario. El cliente abre el enlace, elige hora y envia una solicitud ordenada. Para un salon puedes agregar especialistas y horario de equipo.",
    solution: ["Pagina personal de reservas online", "Servicios, precios y duracion", "Calendario comodo del profesional", "Enlace para Instagram, Telegram, Viber y web", "Solicitudes sin llamadas ni chats largos"],
    stepsTitle: "Como funciona",
    steps: ["Crea un perfil", "Agrega servicios y horario", "Envia el enlace a clientes", "Recibe reservas online"],
    formTitle: "Inicio corto",
    formText: "El registro ya funciona mediante cuenta profesional, asi que el boton abre directamente la creacion de cuenta.",
    formFields: ["Nombre", "Telefono o email", "Area de actividad"],
    formSubmit: "Empezar gratis",
    faqTitle: "Preguntas antes del lanzamiento",
    faq: [
      { q: "Sirve Timviz para un profesional independiente?", a: "Si. Puedes crear una pagina de reservas trabajando solo, sin web aparte ni administrador." },
      { q: "Necesito mi propia web?", a: "No. Timviz crea tu pagina y puedes enviar el enlace a clientes." },
      { q: "Los clientes eligen la hora?", a: "Si. El cliente elige servicio, especialista y hora disponible." },
      { q: "Puedo empezar gratis?", a: "Si. Nuevos usuarios reciben 500 reservas gratis y 14 dias PRO." },
      { q: "Puedo compartir el enlace en Instagram o Telegram?", a: "Si. Ponlo en perfil, stories, mensajes o web." },
      { q: "Funciona para un salon con varios especialistas?", a: "Si. Si vienes como salon, puedes agregar especialistas, servicios y horario de equipo." }
    ],
    finalTitle: "Lanza reservas online hoy",
    finalText: "Crea tu pagina, comparte el enlace y deja de montar el horario manualmente.",
    footer: "Timviz para profesionales - reservas de clientes y calendario"
  },
  de: {
    navLabel: "Timviz Anzeigen-Landing fuer Profis",
    proLabel: "Timviz Pro",
    badge: "Fuer selbststaendige Profis, Salons und kleine Studios",
    title: "Online-Terminbuchung fuer selbststaendige Profis",
    subtitle: "Kunden waehlen Leistung und freie Zeit selbst, ohne Anrufe oder lange Chats. Wenn Sie einen Salon oder ein Team haben, passt Timviz ebenfalls.",
    offer: "500 kostenlose Buchungen + 14 Tage PRO gratis",
    primaryCta: "Buchungsseite kostenlos erstellen",
    secondaryCta: "Ansehen, wie es funktioniert",
    appStoreCta: "Im App Store offnen",
    proof: "Start in wenigen Minuten. Fuer Solo-Profi, Praxisraum und Salon.",
    visualTitle: "Kundenanfrage",
    visualService: "Manikuere mit Gel",
    visualTime: "Heute, 18:30",
    visualStatus: "Wartet auf Bestaetigung",
    nichesTitle: "Welche Profis Timviz nutzen",
    niches: ["Naegel und Pedikuere", "Brauen und Wimpern", "Barber und Friseure", "Massage", "Kosmetik", "Selbstaendige Spezialisten", "Trainer und Berater", "Salons und Studios"],
    painsTitle: "Was Solo-Profis bremst",
    pains: ["Kunden schreiben in Direct, Telegram und Viber, und Buchungen gehen verloren.", "Jemand moechte nachts buchen, waehrend Sie offline sind.", "Freie Zeiten schnell zu zeigen ist schwer.", "Doppelte Buchungen entstehen.", "Ein Termin braucht zu viele Nachrichten.", "Es fehlt ein einfacher Link fuer Kunden oder Profil."],
    solutionTitle: "Ihr persoenlicher Buchungslink",
    solutionText: "Richten Sie Leistungen, Dauer, Preise und Zeitplan ein. Der Kunde oeffnet den Link, waehlt eine Zeit und sendet eine strukturierte Anfrage. Fuer Salons koennen Sie Spezialisten und Teamplaene hinzufuegen.",
    solution: ["Persoenliche Online-Buchungsseite", "Leistungen, Preise und Dauer", "Uebersichtlicher Kalender fuer Profis", "Link fuer Instagram, Telegram, Viber und Website", "Anfragen ohne Anrufe und lange Chats"],
    stepsTitle: "So funktioniert es",
    steps: ["Profil erstellen", "Leistungen und Zeitplan hinzufuegen", "Link an Kunden senden", "Online-Buchungen erhalten"],
    formTitle: "Kurzer Start",
    formText: "Die Registrierung laeuft bereits ueber das Profi-Konto, daher oeffnet der Button direkt die Kontoerstellung.",
    formFields: ["Name", "Telefon oder E-Mail", "Taetigkeitsbereich"],
    formSubmit: "Kostenlos starten",
    faqTitle: "Fragen vor dem Start",
    faq: [
      { q: "Passt Timviz fuer selbststaendige Profis?", a: "Ja. Sie koennen als Solo-Profi eine Buchungsseite erstellen, ohne eigene Website oder Administrator." },
      { q: "Brauche ich eine eigene Website?", a: "Nein. Timviz erstellt Ihre Buchungsseite, den Link senden Sie an Kunden." },
      { q: "Koennen Kunden selbst eine Zeit waehlen?", a: "Ja. Der Kunde waehlt Leistung, Spezialist und freie Zeit." },
      { q: "Kann ich kostenlos starten?", a: "Ja. Neue Nutzer erhalten 500 kostenlose Buchungen und 14 Tage PRO." },
      { q: "Kann ich den Link auf Instagram oder Telegram teilen?", a: "Ja. Fuegen Sie ihn in Profil, Stories, Nachrichten oder Website ein." },
      { q: "Funktioniert es fuer Salons mit mehreren Personen?", a: "Ja. Wenn Sie als Salon kommen, koennen Sie Spezialisten, Leistungen und Teamplaene hinzufuegen." }
    ],
    finalTitle: "Starten Sie Online-Buchung heute",
    finalText: "Erstellen Sie die Seite, teilen Sie den Link und planen Sie Termine nicht mehr manuell.",
    footer: "Timviz fuer Profis - Kundenbuchung und Kalender"
  }
};

type ForMastersLandingProps = {
  language: SiteLanguage;
};

export default function ForMastersLanding({ language }: ForMastersLandingProps) {
  const t = copy[language];
  const footerLabels = publicFooterLabels[language];
  const [signupHref, setSignupHref] = useState("/pro/create-account");
  const appStoreHref = mobileApps.enabled && mobileApps.ios.enabled ? mobileApps.ios.url : "";

  useEffect(() => {
    trackAdsEvent("landing_view", {
      landing: "for_masters",
      language
    });
    setSignupHref(buildAdsCarryoverUrl("/pro/create-account?source=for_masters"));
  }, [language]);

  const pricingHref = useMemo(() => getLocalizedPath(language, "/pricing"), [language]);

  function trackCta(position: string) {
    trackAdsEvent("cta_click", {
      landing: "for_masters",
      position,
      language
    });
    trackAdsEvent("sign_up_start", {
      source: "for_masters",
      position,
      language
    });
  }

  function trackAppStoreCta(position: string) {
    trackAdsEvent("cta_click", {
      landing: "for_masters",
      position,
      target: "app_store",
      language
    });
  }

  return (
    <main className="masters-landing">
      <header className="public-header masters-header">
        <Link className="public-logo" href={getLocalizedPath(language)}>
          <BrandLogo />
        </Link>
        <nav className="public-nav" aria-label={t.navLabel}>
          <PublicHeaderAuthMenu language={language} />
          <Link href={getLocalizedPath(language, "/for-business")} className="public-company-button">
            {t.proLabel}
          </Link>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="masters-hero">
        <div className="masters-hero-copy">
          <span>{t.badge}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
          <strong>{t.offer}</strong>
          <div className="masters-actions">
            <a className="masters-primary" href={signupHref} onClick={() => trackCta("hero_primary")}>
              {t.primaryCta}
            </a>
            <a className="masters-secondary" href="#how-it-works" onClick={() => trackCta("hero_secondary")}>
              {t.secondaryCta}
            </a>
            {appStoreHref ? (
              <a
                className="masters-app-store"
                href={appStoreHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackAppStoreCta("hero_app_store")}
              >
                {t.appStoreCta}
              </a>
            ) : null}
          </div>
          <small>{t.proof}</small>
        </div>
        <div className="masters-visual" aria-label={t.visualTitle}>
          <img src="/for-business/ru-week.png" alt="" aria-hidden="true" />
          <div>
            <span>{t.visualTitle}</span>
            <strong>{t.visualService}</strong>
            <p>{t.visualTime}</p>
            <em>{t.visualStatus}</em>
          </div>
        </div>
      </section>

      <section className="masters-section">
        <div className="masters-section-head">
          <span>{t.nichesTitle}</span>
          <h2>{t.nichesTitle}</h2>
        </div>
        <div className="masters-pill-grid">
          {t.niches.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="masters-section masters-split">
        <div className="masters-panel">
          <span>{t.painsTitle}</span>
          <h2>{t.painsTitle}</h2>
          <ul>
            {t.pains.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="masters-panel masters-panel-accent">
          <span>{t.solutionTitle}</span>
          <h2>{t.solutionTitle}</h2>
          <p>{t.solutionText}</p>
          <ul>
            {t.solution.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="masters-section">
        <div className="masters-section-head">
          <span>{t.stepsTitle}</span>
          <h2>{t.stepsTitle}</h2>
        </div>
        <ol className="masters-steps">
          {t.steps.map((item, index) => (
            <li key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </li>
          ))}
        </ol>
        <a className="masters-primary masters-inline-cta" href={signupHref} onClick={() => trackCta("steps")}>
          {t.formSubmit}
        </a>
      </section>

      <section className="masters-section masters-form-band">
        <div>
          <span>{t.formTitle}</span>
          <h2>{t.formTitle}</h2>
          <p>{t.formText}</p>
        </div>
        <div className="masters-form-preview">
          {t.formFields.map((field) => (
            <span key={field}>{field}</span>
          ))}
          <a href={signupHref} onClick={() => trackCta("form_preview")}>{t.formSubmit}</a>
          {appStoreHref ? (
            <a
              className="masters-form-app-store"
              href={appStoreHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackAppStoreCta("form_app_store")}
            >
              {t.appStoreCta}
            </a>
          ) : null}
        </div>
      </section>

      <section className="masters-section">
        <div className="masters-section-head">
          <span>{t.faqTitle}</span>
          <h2>{t.faqTitle}</h2>
        </div>
        <div className="masters-faq">
          {t.faq.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="masters-final">
        <h2>{t.finalTitle}</h2>
        <p>{t.finalText}</p>
        <a className="masters-primary" href={signupHref} onClick={() => trackCta("final")}>
          {t.primaryCta}
        </a>
        {appStoreHref ? (
          <a
            className="masters-app-store masters-final-app-store"
            href={appStoreHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAppStoreCta("final_app_store")}
          >
            {t.appStoreCta}
          </a>
        ) : null}
      </section>

      <footer className="public-footer masters-footer">
        <div>
          <BrandLogo />
          <p>{t.footer}</p>
        </div>
        <nav aria-label="Footer">
          <Link href={pricingHref}>{footerLabels.pricing}</Link>
          <Link href={getLocalizedPath(language, "/refund-policy")}>{footerLabels.refund}</Link>
          <Link href={getLocalizedPath(language, "/contact")}>{footerLabels.contact}</Link>
        </nav>
      </footer>
    </main>
  );
}
