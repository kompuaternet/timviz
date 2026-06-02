"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import PublicHeaderAuthMenu from "../PublicHeaderAuthMenu";
import { buildAdsCarryoverUrl, trackAdsEvent } from "../../lib/ads-events";
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
    badge: "Для мастеров, салонов и студий",
    title: "Онлайн-запись для мастеров и салонов",
    subtitle:
      "Клиенты сами выбирают услугу, специалиста и свободное время - без звонков, переписок и путаницы.",
    offer: "500 бесплатных записей + 1 месяц PRO бесплатно",
    primaryCta: "Создать страницу записи бесплатно",
    secondaryCta: "Посмотреть, как работает",
    proof: "Запуск за несколько минут. Подходит одному мастеру и команде.",
    visualTitle: "Заявка клиента",
    visualService: "Маникюр с покрытием",
    visualTime: "Сегодня, 18:30",
    visualStatus: "Ожидает подтверждения",
    nichesTitle: "Кому подходит Timviz",
    niches: ["Маникюр и педикюр", "Брови и ресницы", "Барберы и парикмахеры", "Массаж", "Косметология", "Салоны и студии", "Частные специалисты", "Тренеры и консультанты"],
    painsTitle: "Если вы узнаете себя",
    pains: ["Клиенты пишут в Direct, Telegram и Viber, а записи теряются.", "Кто-то хочет записаться ночью, пока вы не отвечаете.", "Сложно быстро показать свободные окна.", "Возникают дубли записей.", "Много переписок ради одного визита.", "Нет простой ссылки, которую можно дать клиенту."],
    solutionTitle: "Timviz берет запись на себя",
    solutionText:
      "Вы настраиваете услуги, длительность, цену и график. Клиент открывает ссылку, выбирает удобное время и отправляет готовую заявку.",
    solution: ["Персональная страница онлайн-записи", "Услуги, специалисты, цены и длительность", "Удобный календарь", "Ссылка для Instagram, Telegram, Viber и сайта", "Заявки без звонков и долгих переписок"],
    stepsTitle: "Как это работает",
    steps: ["Создайте профиль", "Добавьте услуги и график", "Отправьте ссылку клиентам", "Получайте записи онлайн"],
    formTitle: "Короткий старт",
    formText: "Регистрация уже реализована через аккаунт мастера, поэтому кнопка ведет сразу к созданию кабинета.",
    formFields: ["Имя", "Телефон или email", "Сфера деятельности"],
    formSubmit: "Начать бесплатно",
    faqTitle: "Вопросы перед запуском",
    faq: [
      { q: "Timviz подходит одному мастеру?", a: "Да. Можно создать страницу записи даже для одного специалиста." },
      { q: "Нужно ли иметь свой сайт?", a: "Нет. Timviz создает вашу страницу записи, ссылку можно отправлять клиентам." },
      { q: "Клиенты смогут сами выбирать время?", a: "Да. Клиент выбирает услугу, специалиста и свободное время." },
      { q: "Можно начать бесплатно?", a: "Да. Новым пользователям доступно 500 бесплатных записей и 1 месяц PRO." },
      { q: "Можно отправить ссылку в Instagram или Telegram?", a: "Да. Ссылку можно добавить в профиль, сторис, сообщения или на сайт." },
      { q: "Подходит ли для салона с несколькими мастерами?", a: "Да. Можно добавить специалистов, услуги и расписание." }
    ],
    finalTitle: "Запустите онлайн-запись сегодня",
    finalText: "Создайте страницу записи, отправьте ссылку клиентам и перестаньте собирать расписание вручную.",
    footer: "Timviz для мастеров - онлайн-запись клиентов и календарь"
  },
  uk: {
    navLabel: "Реклама Timviz для майстрів",
    proLabel: "Timviz Pro",
    badge: "Для майстрів, салонів і студій",
    title: "Онлайн-запис для майстрів і салонів",
    subtitle:
      "Клієнти самі обирають послугу, спеціаліста і вільний час - без дзвінків, переписок і плутанини.",
    offer: "500 безкоштовних записів + 1 місяць PRO безкоштовно",
    primaryCta: "Створити сторінку запису безкоштовно",
    secondaryCta: "Подивитися, як працює",
    proof: "Запуск за кілька хвилин. Підходить одному майстру і команді.",
    visualTitle: "Заявка клієнта",
    visualService: "Манікюр з покриттям",
    visualTime: "Сьогодні, 18:30",
    visualStatus: "Очікує підтвердження",
    nichesTitle: "Кому підходить Timviz",
    niches: ["Манікюр і педикюр", "Брови і вії", "Барбери і перукарі", "Масаж", "Косметологія", "Салони і студії", "Приватні спеціалісти", "Тренери і консультанти"],
    painsTitle: "Якщо ви впізнаєте себе",
    pains: ["Клієнти пишуть у Direct, Telegram і Viber, а записи губляться.", "Хтось хоче записатися вночі, поки ви не відповідаєте.", "Складно швидко показати вільні вікна.", "З'являються дублікати записів.", "Багато переписок заради одного візиту.", "Немає простого посилання, яке можна дати клієнту."],
    solutionTitle: "Timviz бере запис на себе",
    solutionText:
      "Ви налаштовуєте послуги, тривалість, ціну і графік. Клієнт відкриває посилання, обирає зручний час і надсилає готову заявку.",
    solution: ["Персональна сторінка онлайн-запису", "Послуги, спеціалісти, ціни і тривалість", "Зручний календар", "Посилання для Instagram, Telegram, Viber і сайту", "Заявки без дзвінків і довгих переписок"],
    stepsTitle: "Як це працює",
    steps: ["Створіть профіль", "Додайте послуги і графік", "Надішліть посилання клієнтам", "Отримуйте записи онлайн"],
    formTitle: "Короткий старт",
    formText: "Реєстрація вже реалізована через акаунт майстра, тому кнопка веде одразу до створення кабінету.",
    formFields: ["Ім'я", "Телефон або email", "Сфера діяльності"],
    formSubmit: "Почати безкоштовно",
    faqTitle: "Питання перед запуском",
    faq: [
      { q: "Timviz підходить одному майстру?", a: "Так. Можна створити сторінку запису навіть для одного спеціаліста." },
      { q: "Чи потрібен власний сайт?", a: "Ні. Timviz створює вашу сторінку запису, посилання можна надсилати клієнтам." },
      { q: "Клієнти зможуть самі обирати час?", a: "Так. Клієнт обирає послугу, спеціаліста і вільний час." },
      { q: "Можна почати безкоштовно?", a: "Так. Новим користувачам доступні 500 безкоштовних записів і 1 місяць PRO." },
      { q: "Можна надіслати посилання в Instagram або Telegram?", a: "Так. Посилання можна додати в профіль, сторис, повідомлення або на сайт." },
      { q: "Підходить для салону з кількома майстрами?", a: "Так. Можна додати спеціалістів, послуги і розклад." }
    ],
    finalTitle: "Запустіть онлайн-запис сьогодні",
    finalText: "Створіть сторінку запису, надішліть посилання клієнтам і перестаньте збирати розклад вручну.",
    footer: "Timviz для майстрів - онлайн-запис клієнтів і календар"
  },
  en: {
    navLabel: "Timviz ads landing for professionals",
    proLabel: "Timviz Pro",
    badge: "For professionals, salons and studios",
    title: "Online booking for professionals and salons",
    subtitle:
      "Clients choose a service, specialist and available time themselves - without calls, chats or confusion.",
    offer: "500 free bookings + 1 month of PRO free",
    primaryCta: "Create a booking page for free",
    secondaryCta: "See how it works",
    proof: "Launch in minutes. Built for solo pros and teams.",
    visualTitle: "Client request",
    visualService: "Manicure with gel polish",
    visualTime: "Today, 18:30",
    visualStatus: "Waiting for confirmation",
    nichesTitle: "Who Timviz is for",
    niches: ["Nails and pedicure", "Brows and lashes", "Barbers and hairdressers", "Massage", "Cosmetology", "Salons and studios", "Independent specialists", "Trainers and consultants"],
    painsTitle: "If this sounds familiar",
    pains: ["Clients write in Direct, Telegram and Viber, and bookings get lost.", "Someone wants to book at night while you are offline.", "It is hard to show free slots quickly.", "Duplicate bookings happen.", "One visit takes too many messages.", "There is no simple link to send clients."],
    solutionTitle: "Timviz handles booking for you",
    solutionText:
      "Set services, duration, prices and schedule. The client opens your link, picks a time and sends a structured request.",
    solution: ["Personal online booking page", "Services, specialists, prices and duration", "Simple appointment calendar", "Link for Instagram, Telegram, Viber and websites", "Requests without calls or long chats"],
    stepsTitle: "How it works",
    steps: ["Create a profile", "Add services and schedule", "Send the link to clients", "Receive online bookings"],
    formTitle: "Short start",
    formText: "Registration already works through the professional account, so the button opens account creation directly.",
    formFields: ["Name", "Phone or email", "Business category"],
    formSubmit: "Start free",
    faqTitle: "Questions before launch",
    faq: [
      { q: "Does Timviz work for one specialist?", a: "Yes. You can create a booking page even as a solo professional." },
      { q: "Do I need my own website?", a: "No. Timviz creates your booking page, and you can send the link to clients." },
      { q: "Can clients choose time themselves?", a: "Yes. A client selects the service, specialist and available time." },
      { q: "Can I start free?", a: "Yes. New users get 500 free bookings and 1 month of PRO." },
      { q: "Can I share the link on Instagram or Telegram?", a: "Yes. Add it to your profile, stories, messages or website." },
      { q: "Does it work for a salon with several specialists?", a: "Yes. You can add specialists, services and schedules." }
    ],
    finalTitle: "Launch online booking today",
    finalText: "Create your booking page, share the link with clients and stop assembling your schedule manually.",
    footer: "Timviz for professionals - client online booking and calendar"
  },
  fr: {
    navLabel: "Page publicitaire Timviz pour pros",
    proLabel: "Timviz Pro",
    badge: "Pour specialistes, salons et studios",
    title: "Reservation en ligne pour pros et salons",
    subtitle: "Les clients choisissent le service, le specialiste et l'heure disponible, sans appels ni longs messages.",
    offer: "500 reservations gratuites + 1 mois PRO offert",
    primaryCta: "Creer une page de reservation gratuite",
    secondaryCta: "Voir le fonctionnement",
    proof: "Lancement en quelques minutes. Pour solo et equipe.",
    visualTitle: "Demande client",
    visualService: "Manucure avec vernis gel",
    visualTime: "Aujourd'hui, 18:30",
    visualStatus: "En attente de confirmation",
    nichesTitle: "Pour qui est Timviz",
    niches: ["Ongles et pedicure", "Sourcils et cils", "Barbiers et coiffeurs", "Massage", "Esthetique", "Salons et studios", "Specialistes independants", "Coach et consultants"],
    painsTitle: "Si cela vous parle",
    pains: ["Les clients ecrivent sur Direct, Telegram et Viber, et les rendez-vous se perdent.", "Un client veut reserver la nuit pendant que vous etes hors ligne.", "Il est difficile de montrer vite les creneaux libres.", "Des doublons apparaissent.", "Un seul rendez-vous demande trop de messages.", "Il manque un lien simple a envoyer."],
    solutionTitle: "Timviz gere la reservation",
    solutionText: "Configurez services, duree, prix et planning. Le client ouvre le lien, choisit l'heure et envoie une demande structuree.",
    solution: ["Page personnelle de reservation", "Services, specialistes, prix et durees", "Calendrier pratique", "Lien pour Instagram, Telegram, Viber et site", "Demandes sans appels ni longs chats"],
    stepsTitle: "Comment ca marche",
    steps: ["Creez un profil", "Ajoutez services et planning", "Envoyez le lien aux clients", "Recevez des reservations en ligne"],
    formTitle: "Demarrage court",
    formText: "L'inscription existe deja via le compte professionnel, le bouton ouvre directement la creation du compte.",
    formFields: ["Nom", "Telephone ou email", "Domaine d'activite"],
    formSubmit: "Commencer gratuitement",
    faqTitle: "Questions avant lancement",
    faq: [
      { q: "Timviz convient-il a un solo?", a: "Oui. Vous pouvez creer une page meme pour un seul specialiste." },
      { q: "Faut-il un site web?", a: "Non. Timviz cree votre page et vous partagez le lien." },
      { q: "Les clients choisissent-ils l'heure?", a: "Oui. Le client choisit service, specialiste et heure disponible." },
      { q: "Puis-je commencer gratuitement?", a: "Oui. Les nouveaux utilisateurs ont 500 reservations gratuites et 1 mois PRO." },
      { q: "Puis-je partager le lien sur Instagram ou Telegram?", a: "Oui. Ajoutez-le au profil, stories, messages ou site." },
      { q: "Est-ce adapte a un salon?", a: "Oui. Ajoutez specialistes, services et plannings." }
    ],
    finalTitle: "Lancez la reservation en ligne aujourd'hui",
    finalText: "Creez la page, partagez le lien et arretez de gerer le planning a la main.",
    footer: "Timviz pour pros - reservation client et calendrier"
  },
  pl: {
    navLabel: "Landing reklamowy Timviz dla specjalistow",
    proLabel: "Timviz Pro",
    badge: "Dla specjalistow, salonow i studiow",
    title: "Rezerwacje online dla specjalistow i salonow",
    subtitle: "Klienci sami wybieraja usluge, specjaliste i wolny termin, bez telefonow i dlugich wiadomosci.",
    offer: "500 darmowych rezerwacji + 1 miesiac PRO gratis",
    primaryCta: "Utworz darmowa strone rezerwacji",
    secondaryCta: "Zobacz, jak dziala",
    proof: "Start w kilka minut. Dla solo i zespolow.",
    visualTitle: "Zapytanie klienta",
    visualService: "Manicure hybrydowy",
    visualTime: "Dzis, 18:30",
    visualStatus: "Czeka na potwierdzenie",
    nichesTitle: "Dla kogo jest Timviz",
    niches: ["Paznokcie i pedicure", "Brwi i rzesy", "Barberzy i fryzjerzy", "Masaz", "Kosmetologia", "Salony i studia", "Niezalezni specjalisci", "Trenerzy i konsultanci"],
    painsTitle: "Jesli brzmi znajomo",
    pains: ["Klienci pisza w Direct, Telegram i Viber, a zapisy sie gubia.", "Ktos chce zarezerwowac w nocy, kiedy nie odpowiadasz.", "Trudno szybko pokazac wolne terminy.", "Pojawiaja sie podwojne zapisy.", "Jedna wizyta wymaga zbyt wielu wiadomosci.", "Brakuje prostego linku dla klienta."],
    solutionTitle: "Timviz przejmuje rezerwacje",
    solutionText: "Ustaw uslugi, czas, ceny i grafik. Klient otwiera link, wybiera termin i wysyla uporzadkowane zgloszenie.",
    solution: ["Wlasna strona rezerwacji online", "Uslugi, specjalisci, ceny i czas", "Wygodny kalendarz", "Link do Instagram, Telegram, Viber i strony", "Zgloszenia bez telefonow i dlugich czatow"],
    stepsTitle: "Jak to dziala",
    steps: ["Utworz profil", "Dodaj uslugi i grafik", "Wyslij link klientom", "Odbieraj rezerwacje online"],
    formTitle: "Krotki start",
    formText: "Rejestracja dziala juz przez konto specjalisty, wiec przycisk prowadzi od razu do tworzenia konta.",
    formFields: ["Imie", "Telefon lub email", "Branza"],
    formSubmit: "Zacznij za darmo",
    faqTitle: "Pytania przed startem",
    faq: [
      { q: "Czy Timviz pasuje dla jednej osoby?", a: "Tak. Mozesz stworzyc strone rezerwacji nawet jako solo specjalista." },
      { q: "Czy potrzebuje wlasnej strony?", a: "Nie. Timviz tworzy strone rezerwacji, a Ty wysylasz link klientom." },
      { q: "Czy klienci sami wybieraja czas?", a: "Tak. Klient wybiera usluge, specjaliste i wolny termin." },
      { q: "Czy moge zaczac za darmo?", a: "Tak. Nowi uzytkownicy dostaja 500 darmowych rezerwacji i 1 miesiac PRO." },
      { q: "Czy link dziala na Instagramie lub Telegramie?", a: "Tak. Dodaj go do profilu, stories, wiadomosci lub strony." },
      { q: "Czy pasuje do salonu z kilkoma osobami?", a: "Tak. Mozesz dodac specjalistow, uslugi i grafiki." }
    ],
    finalTitle: "Uruchom rezerwacje online dzisiaj",
    finalText: "Utworz strone, wyslij link klientom i przestan ukladac grafik recznie.",
    footer: "Timviz dla specjalistow - rezerwacje klientow i kalendarz"
  },
  cs: {
    navLabel: "Reklamni landing Timviz pro specialisty",
    proLabel: "Timviz Pro",
    badge: "Pro specialisty, salony a studia",
    title: "Online rezervace pro specialisty a salony",
    subtitle: "Klienti si sami vyberou sluzbu, specialistu a volny cas, bez telefonatu a dlouhych zprav.",
    offer: "500 rezervaci zdarma + 1 mesic PRO zdarma",
    primaryCta: "Vytvorit rezervacni stranku zdarma",
    secondaryCta: "Podivat se, jak funguje",
    proof: "Spusteni za par minut. Pro jednotlivce i tymy.",
    visualTitle: "Pozadavek klienta",
    visualService: "Manikura s gel lakem",
    visualTime: "Dnes, 18:30",
    visualStatus: "Ceka na potvrzeni",
    nichesTitle: "Pro koho je Timviz",
    niches: ["Nehty a pedikura", "Oboci a rasy", "Barberi a kadernici", "Masaze", "Kosmetika", "Salony a studia", "Nezavisli specialisti", "Treneri a konzultanti"],
    painsTitle: "Pokud vam to zni povedome",
    pains: ["Klienti pisou do Directu, Telegramu a Viberu a rezervace se ztraceji.", "Nekdo se chce objednat v noci, kdy neodpovidate.", "Je tezke rychle ukazat volna mista.", "Vznikaji duplicitni rezervace.", "Jedna navsteva znamena prilis mnoho zprav.", "Chybi jednoduchy odkaz pro klienta."],
    solutionTitle: "Timviz resi rezervace za vas",
    solutionText: "Nastavte sluzby, delku, ceny a rozvrh. Klient otevre odkaz, vybere termin a posle strukturovany pozadavek.",
    solution: ["Osobni online rezervacni stranka", "Sluzby, specialisti, ceny a delky", "Prehledny kalendar", "Odkaz pro Instagram, Telegram, Viber a web", "Pozadavky bez telefonatu a dlouhych chatu"],
    stepsTitle: "Jak to funguje",
    steps: ["Vytvorte profil", "Pridejte sluzby a rozvrh", "Poslete odkaz klientum", "Prijimejte online rezervace"],
    formTitle: "Rychly start",
    formText: "Registrace uz funguje pres profesionalni ucet, tlacitko vede primo k vytvoreni uctu.",
    formFields: ["Jmeno", "Telefon nebo email", "Obor"],
    formSubmit: "Zacit zdarma",
    faqTitle: "Otazky pred startem",
    faq: [
      { q: "Hodi se Timviz pro jednoho specialistu?", a: "Ano. Rezervacni stranku muzete vytvorit i jako jednotlivec." },
      { q: "Potrebuji vlastni web?", a: "Ne. Timviz vytvori vasi stranku a odkaz poslete klientum." },
      { q: "Mohou klienti vybrat cas sami?", a: "Ano. Klient vybere sluzbu, specialistu a volny cas." },
      { q: "Muzu zacit zdarma?", a: "Ano. Novi uzivatele maji 500 rezervaci zdarma a 1 mesic PRO." },
      { q: "Muzu poslat odkaz na Instagram nebo Telegram?", a: "Ano. Pridejte ho do profilu, stories, zprav nebo webu." },
      { q: "Funguje pro salon s vice lidmi?", a: "Ano. Muzete pridat specialisty, sluzby a rozvrhy." }
    ],
    finalTitle: "Spustte online rezervace jeste dnes",
    finalText: "Vytvorte stranku, poslete odkaz klientum a prestante skladat rozvrh rucne.",
    footer: "Timviz pro specialisty - rezervace klientu a kalendar"
  },
  es: {
    navLabel: "Landing de anuncios Timviz para profesionales",
    proLabel: "Timviz Pro",
    badge: "Para profesionales, salones y estudios",
    title: "Reservas online para profesionales y salones",
    subtitle: "Los clientes eligen servicio, especialista y hora disponible sin llamadas ni mensajes largos.",
    offer: "500 reservas gratis + 1 mes PRO gratis",
    primaryCta: "Crear pagina de reservas gratis",
    secondaryCta: "Ver como funciona",
    proof: "Lanzamiento en minutos. Para profesionales solos y equipos.",
    visualTitle: "Solicitud de cliente",
    visualService: "Manicura con gel",
    visualTime: "Hoy, 18:30",
    visualStatus: "Esperando confirmacion",
    nichesTitle: "Para quien es Timviz",
    niches: ["Unas y pedicura", "Cejas y pestanas", "Barberos y peluqueros", "Masaje", "Cosmetologia", "Salones y estudios", "Especialistas independientes", "Entrenadores y consultores"],
    painsTitle: "Si esto te suena",
    pains: ["Los clientes escriben en Direct, Telegram y Viber, y las reservas se pierden.", "Alguien quiere reservar de noche cuando no respondes.", "Es dificil mostrar huecos libres rapidamente.", "Aparecen reservas duplicadas.", "Una visita requiere demasiados mensajes.", "No hay un enlace simple para enviar al cliente."],
    solutionTitle: "Timviz gestiona la reserva",
    solutionText: "Configura servicios, duracion, precios y horario. El cliente abre el enlace, elige hora y envia una solicitud ordenada.",
    solution: ["Pagina personal de reservas online", "Servicios, especialistas, precios y duracion", "Calendario comodo", "Enlace para Instagram, Telegram, Viber y web", "Solicitudes sin llamadas ni chats largos"],
    stepsTitle: "Como funciona",
    steps: ["Crea un perfil", "Agrega servicios y horario", "Envia el enlace a clientes", "Recibe reservas online"],
    formTitle: "Inicio corto",
    formText: "El registro ya funciona mediante cuenta profesional, asi que el boton abre directamente la creacion de cuenta.",
    formFields: ["Nombre", "Telefono o email", "Area de actividad"],
    formSubmit: "Empezar gratis",
    faqTitle: "Preguntas antes del lanzamiento",
    faq: [
      { q: "Sirve Timviz para un solo profesional?", a: "Si. Puedes crear una pagina de reservas incluso trabajando solo." },
      { q: "Necesito mi propia web?", a: "No. Timviz crea tu pagina y puedes enviar el enlace a clientes." },
      { q: "Los clientes eligen la hora?", a: "Si. El cliente elige servicio, especialista y hora disponible." },
      { q: "Puedo empezar gratis?", a: "Si. Nuevos usuarios reciben 500 reservas gratis y 1 mes PRO." },
      { q: "Puedo compartir el enlace en Instagram o Telegram?", a: "Si. Ponlo en perfil, stories, mensajes o web." },
      { q: "Funciona para un salon con varios especialistas?", a: "Si. Puedes agregar especialistas, servicios y horarios." }
    ],
    finalTitle: "Lanza reservas online hoy",
    finalText: "Crea tu pagina, comparte el enlace y deja de montar el horario manualmente.",
    footer: "Timviz para profesionales - reservas de clientes y calendario"
  },
  de: {
    navLabel: "Timviz Anzeigen-Landing fuer Profis",
    proLabel: "Timviz Pro",
    badge: "Fuer Profis, Salons und Studios",
    title: "Online-Terminbuchung fuer Profis und Salons",
    subtitle: "Kunden waehlen Leistung, Spezialist und freie Zeit selbst, ohne Anrufe oder lange Chats.",
    offer: "500 kostenlose Buchungen + 1 Monat PRO gratis",
    primaryCta: "Buchungsseite kostenlos erstellen",
    secondaryCta: "Ansehen, wie es funktioniert",
    proof: "Start in wenigen Minuten. Fuer Einzelprofis und Teams.",
    visualTitle: "Kundenanfrage",
    visualService: "Manikuere mit Gel",
    visualTime: "Heute, 18:30",
    visualStatus: "Wartet auf Bestaetigung",
    nichesTitle: "Fuer wen Timviz passt",
    niches: ["Naegel und Pedikuere", "Brauen und Wimpern", "Barber und Friseure", "Massage", "Kosmetik", "Salons und Studios", "Selbstaendige Spezialisten", "Trainer und Berater"],
    painsTitle: "Wenn Ihnen das bekannt vorkommt",
    pains: ["Kunden schreiben in Direct, Telegram und Viber, und Buchungen gehen verloren.", "Jemand moechte nachts buchen, waehrend Sie offline sind.", "Freie Zeiten schnell zu zeigen ist schwer.", "Doppelte Buchungen entstehen.", "Ein Termin braucht zu viele Nachrichten.", "Es fehlt ein einfacher Link fuer Kunden."],
    solutionTitle: "Timviz uebernimmt die Buchung",
    solutionText: "Richten Sie Leistungen, Dauer, Preise und Zeitplan ein. Der Kunde oeffnet den Link, waehlt eine Zeit und sendet eine strukturierte Anfrage.",
    solution: ["Persoenliche Online-Buchungsseite", "Leistungen, Spezialisten, Preise und Dauer", "Uebersichtlicher Kalender", "Link fuer Instagram, Telegram, Viber und Website", "Anfragen ohne Anrufe und lange Chats"],
    stepsTitle: "So funktioniert es",
    steps: ["Profil erstellen", "Leistungen und Zeitplan hinzufuegen", "Link an Kunden senden", "Online-Buchungen erhalten"],
    formTitle: "Kurzer Start",
    formText: "Die Registrierung laeuft bereits ueber das Profi-Konto, daher oeffnet der Button direkt die Kontoerstellung.",
    formFields: ["Name", "Telefon oder E-Mail", "Taetigkeitsbereich"],
    formSubmit: "Kostenlos starten",
    faqTitle: "Fragen vor dem Start",
    faq: [
      { q: "Passt Timviz fuer eine Person?", a: "Ja. Sie koennen auch als Einzelprofi eine Buchungsseite erstellen." },
      { q: "Brauche ich eine eigene Website?", a: "Nein. Timviz erstellt Ihre Buchungsseite, den Link senden Sie an Kunden." },
      { q: "Koennen Kunden selbst eine Zeit waehlen?", a: "Ja. Der Kunde waehlt Leistung, Spezialist und freie Zeit." },
      { q: "Kann ich kostenlos starten?", a: "Ja. Neue Nutzer erhalten 500 kostenlose Buchungen und 1 Monat PRO." },
      { q: "Kann ich den Link auf Instagram oder Telegram teilen?", a: "Ja. Fuegen Sie ihn in Profil, Stories, Nachrichten oder Website ein." },
      { q: "Funktioniert es fuer Salons mit mehreren Personen?", a: "Ja. Sie koennen Spezialisten, Leistungen und Zeitplaene hinzufuegen." }
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

  useEffect(() => {
    trackAdsEvent("landing_view", {
      landing: "for_masters",
      language
    });
    setSignupHref(buildAdsCarryoverUrl("/pro/create-account"));
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
        <div className="masters-form-preview" aria-hidden="true">
          {t.formFields.map((field) => (
            <span key={field}>{field}</span>
          ))}
          <a href={signupHref} onClick={() => trackCta("form_preview")}>{t.formSubmit}</a>
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
