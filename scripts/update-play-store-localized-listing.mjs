#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const packageName = "com.timviz.master";
const serviceAccountPath = path.join(repoRoot, "apps/mobile/google-play-service-account.json");
const outputRoot = path.join(repoRoot, "play-store-assets/android/localized");
const iconPath = path.join(repoRoot, "play-store-assets/android/app-icon-512.png");
const wordmarkPath = path.join(repoRoot, "apps/mobile/assets/timviz-wordmark.png");
const realScreenshotRoot = process.env.TIMVIZ_PLAY_REAL_SCREENSHOT_ROOT || "/tmp/timviz-real-raw";

const modes = new Set(process.argv.slice(2));
const shouldGenerate = !modes.has("--upload-only") && (modes.has("--generate-only") || modes.has("--upload") || modes.size === 0);
const shouldUpload = modes.has("--upload") || modes.has("--upload-only");
let wordmarkDataUri = "";
const realScreenshotDataUris = {};

const english = {
  title: "Timviz Booking Calendar",
  shortDescription: "Bookings, clients, services and premium sync for your team.",
  fullDescription: `Timviz Booking Calendar helps service businesses manage appointments, clients, services and reminders in one synchronized workspace.

Use Timviz for beauty salons, barbers, clinics, studios, consultants, private masters and teams that need a simple booking calendar on Android.

Key features:
- Calendar for daily appointments and online bookings
- Client database with visit history and notes
- Services, prices, duration and team schedule management
- Notifications and reminders for clients and staff
- Premium access synchronized with the Timviz website, iPhone and Android
- Fast mobile experience with cache and reliable account sync

Timviz connects your mobile app with the same account and data you already use on timviz.com, so premium status and business information follow the user everywhere.`,
  screenshots: {
    calendar: {
      title: "Plan bookings",
      subtitle: "Daily schedule, online bookings and reminders stay synchronized.",
      month: "June 2026",
      today: "Today",
      events: ["Haircut appointment", "New online booking", "Client reminder", "Color service", "Consultation"],
      notes: ["Anna K.", "Google Review", "Telegram sent", "Olena M.", "Maria P."],
    },
    clients: {
      title: "Know every client",
      subtitle: "History, contacts and notes are ready before each visit.",
      search: "Search clients",
      rows: [
        ["Anna K.", "Last visit: today"],
        ["Maria P.", "Prefers evening appointments"],
        ["Google Review", "New booking request"],
        ["Olena M.", "Loyal client"],
      ],
    },
    services: {
      title: "Services and prices",
      subtitle: "Keep duration, pricing and online booking settings organized.",
      rows: [
        ["Haircut", "45 min", "$25"],
        ["Color service", "120 min", "$80"],
        ["Consultation", "30 min", "$15"],
        ["Premium package", "Monthly", "$2.99"],
      ],
      online: "Online booking",
    },
    premium: {
      title: "Premium works everywhere",
      subtitle: "One subscription follows the same account on web, iPhone and Android.",
      plan: "Timviz Premium",
      price: "$2.99 / month",
      sync: ["Website", "iPhone", "Android"],
      status: "Active for this account",
      benefits: ["Account sync", "Cross-platform access", "Reliable premium status"],
    },
    featureTitle: "Booking calendar for service teams",
    featureSubtitle: "Appointments, clients, reminders and premium sync on Android.",
  },
};

const localeContent = {
  "en-US": english,
  "en-GB": english,
  "en-AU": english,
  "en-CA": english,
  "en-IN": english,
  "en-SG": english,
  "en-ZA": english,
  uk: {
    title: "Timviz Календар Записів",
    shortDescription: "Записи, клієнти, послуги й преміум-синхронізація для команди.",
    fullDescription: `Timviz Календар Записів допомагає сервісному бізнесу керувати записами, клієнтами, послугами та нагадуваннями в одному синхронізованому робочому просторі.

Timviz підходить салонам краси, барбершопам, клінікам, студіям, консультантам, приватним майстрам і командам, яким потрібен зручний календар записів на Android.

Можливості:
- календар для щоденних записів та онлайн-бронювань
- база клієнтів з історією візитів і нотатками
- послуги, ціни, тривалість і графік команди
- сповіщення та нагадування для клієнтів і співробітників
- преміум-доступ синхронізується із сайтом Timviz, iPhone та Android
- швидка мобільна робота з кешем і надійною синхронізацією акаунта

Timviz працює з тим самим акаунтом і даними, які ви використовуєте на timviz.com, тому преміум-статус і інформація компанії доступні всюди.`,
    screenshots: {
      calendar: { title: "Плануйте записи", subtitle: "Розклад, онлайн-записи й нагадування синхронізуються.", month: "Червень 2026", today: "Сьогодні", events: ["Стрижка", "Новий онлайн-запис", "Нагадування клієнту", "Фарбування", "Консультація"], notes: ["Анна К.", "Google Review", "Telegram надіслано", "Олена М.", "Марія П."] },
      clients: { title: "Знайте кожного клієнта", subtitle: "Історія, контакти й нотатки готові перед візитом.", search: "Пошук клієнтів", rows: [["Анна К.", "Останній візит: сьогодні"], ["Марія П.", "Обирає вечірні записи"], ["Google Review", "Новий запит на запис"], ["Олена М.", "Постійний клієнт"]] },
      services: { title: "Послуги та ціни", subtitle: "Тривалість, прайс і онлайн-запис в одному місці.", rows: [["Стрижка", "45 хв", "25 $"], ["Фарбування", "120 хв", "80 $"], ["Консультація", "30 хв", "15 $"], ["Преміум пакет", "Щомісяця", "2,99 $"]], online: "Онлайн-запис" },
      premium: { title: "Преміум працює всюди", subtitle: "Одна підписка діє для акаунта на сайті, iPhone та Android.", plan: "Timviz Premium", price: "2,99 $ / місяць", sync: ["Сайт", "iPhone", "Android"], status: "Активно для акаунта", benefits: ["Синхронізація акаунта", "Доступ на всіх платформах", "Надійний преміум-статус"] },
      featureTitle: "Календар записів для сервісних команд",
      featureSubtitle: "Записи, клієнти, нагадування й преміум на Android.",
    },
  },
  "ru-RU": {
    title: "Timviz Календарь Записей",
    shortDescription: "Записи, клиенты, услуги и премиум-синхронизация для команды.",
    fullDescription: `Timviz Календарь Записей помогает сервисному бизнесу управлять записями, клиентами, услугами и напоминаниями в одном синхронизированном рабочем пространстве.

Timviz подходит салонам красоты, барбершопам, клиникам, студиям, консультантам, частным мастерам и командам, которым нужен удобный календарь записей на Android.

Возможности:
- календарь для ежедневных записей и онлайн-бронирований
- база клиентов с историей визитов и заметками
- услуги, цены, длительность и расписание команды
- уведомления и напоминания для клиентов и сотрудников
- премиум-доступ синхронизируется с сайтом Timviz, iPhone и Android
- быстрая мобильная работа с кешем и надежной синхронизацией аккаунта

Timviz использует тот же аккаунт и данные, что и timviz.com, поэтому премиум-статус и информация компании доступны везде.`,
    screenshots: {
      calendar: { title: "Планируйте записи", subtitle: "Расписание, онлайн-записи и напоминания синхронизируются.", month: "Июнь 2026", today: "Сегодня", events: ["Стрижка", "Новая онлайн-запись", "Напоминание клиенту", "Окрашивание", "Консультация"], notes: ["Анна К.", "Google Review", "Telegram отправлен", "Олена М.", "Мария П."] },
      clients: { title: "Знайте каждого клиента", subtitle: "История, контакты и заметки готовы перед визитом.", search: "Поиск клиентов", rows: [["Анна К.", "Последний визит: сегодня"], ["Мария П.", "Предпочитает вечер"], ["Google Review", "Новая заявка"], ["Олена М.", "Постоянный клиент"]] },
      services: { title: "Услуги и цены", subtitle: "Длительность, прайс и онлайн-запись в одном месте.", rows: [["Стрижка", "45 мин", "25 $"], ["Окрашивание", "120 мин", "80 $"], ["Консультация", "30 мин", "15 $"], ["Премиум пакет", "Ежемесячно", "2,99 $"]], online: "Онлайн-запись" },
      premium: { title: "Премиум работает везде", subtitle: "Одна подписка действует для аккаунта на сайте, iPhone и Android.", plan: "Timviz Premium", price: "2,99 $ / месяц", sync: ["Сайт", "iPhone", "Android"], status: "Активно для аккаунта", benefits: ["Синхронизация аккаунта", "Доступ на всех платформах", "Надежный премиум-статус"] },
      featureTitle: "Календарь записей для сервисных команд",
      featureSubtitle: "Записи, клиенты, напоминания и премиум на Android.",
    },
  },
  "fr-FR": {
    title: "Timviz Agenda Rendez-vous",
    shortDescription: "Réservations, clients, services et premium synchronisés.",
    fullDescription: `Timviz Agenda Rendez-vous aide les entreprises de services à gérer les rendez-vous, clients, prestations et rappels dans un espace de travail synchronisé.

Timviz convient aux salons de beauté, barbiers, cliniques, studios, consultants, indépendants et équipes qui veulent un calendrier de réservation simple sur Android.

Fonctionnalités:
- calendrier pour rendez-vous quotidiens et réservations en ligne
- base clients avec historique des visites et notes
- services, prix, durées et planning de l'équipe
- notifications et rappels pour clients et personnel
- accès premium synchronisé avec le site Timviz, iPhone et Android
- expérience mobile rapide avec cache et synchronisation fiable du compte

Timviz utilise le même compte et les mêmes données que timviz.com, afin que le statut premium et les informations de l'entreprise soient disponibles partout.`,
    screenshots: {
      calendar: { title: "Planifiez les rendez-vous", subtitle: "Agenda, réservations en ligne et rappels restent synchronisés.", month: "Juin 2026", today: "Aujourd'hui", events: ["Coupe de cheveux", "Nouvelle réservation", "Rappel client", "Coloration", "Consultation"], notes: ["Anna K.", "Google Review", "Telegram envoyé", "Olena M.", "Maria P."] },
      clients: { title: "Connaissez vos clients", subtitle: "Historique, contacts et notes prêts avant chaque visite.", search: "Rechercher des clients", rows: [["Anna K.", "Dernière visite: aujourd'hui"], ["Maria P.", "Préfère le soir"], ["Google Review", "Nouvelle demande"], ["Olena M.", "Cliente fidèle"]] },
      services: { title: "Services et tarifs", subtitle: "Durées, prix et réservation en ligne bien organisés.", rows: [["Coupe", "45 min", "25 $"], ["Coloration", "120 min", "80 $"], ["Consultation", "30 min", "15 $"], ["Pack Premium", "Mensuel", "2,99 $"]], online: "Réservation en ligne" },
      premium: { title: "Premium partout", subtitle: "Un abonnement suit le même compte sur web, iPhone et Android.", plan: "Timviz Premium", price: "2,99 $ / mois", sync: ["Site web", "iPhone", "Android"], status: "Actif pour ce compte", benefits: ["Synchronisation du compte", "Accès multiplateforme", "Statut premium fiable"] },
      featureTitle: "Agenda de réservation pour équipes de services",
      featureSubtitle: "Rendez-vous, clients, rappels et premium sur Android.",
    },
  },
  "fr-CA": null,
  "pl-PL": {
    title: "Timviz Kalendarz Wizyt",
    shortDescription: "Rezerwacje, klienci, usługi i premium zsynchronizowane.",
    fullDescription: `Timviz Kalendarz Wizyt pomaga firmom usługowym zarządzać wizytami, klientami, usługami i przypomnieniami w jednym zsynchronizowanym miejscu.

Timviz sprawdzi się w salonach beauty, barber shopach, klinikach, studiach, u konsultantów, specjalistów indywidualnych i zespołów, które potrzebują wygodnego kalendarza wizyt na Androidzie.

Funkcje:
- kalendarz codziennych wizyt i rezerwacji online
- baza klientów z historią wizyt i notatkami
- usługi, ceny, czas trwania i grafik zespołu
- powiadomienia i przypomnienia dla klientów oraz pracowników
- dostęp premium zsynchronizowany ze stroną Timviz, iPhone i Androidem
- szybka aplikacja mobilna z cache i stabilną synchronizacją konta

Timviz działa na tym samym koncie i danych co timviz.com, dlatego status premium oraz informacje firmy są dostępne wszędzie.`,
    screenshots: {
      calendar: { title: "Planuj wizyty", subtitle: "Grafik, rezerwacje online i przypomnienia są zsynchronizowane.", month: "Czerwiec 2026", today: "Dzisiaj", events: ["Strzyżenie", "Nowa rezerwacja online", "Przypomnienie klientowi", "Koloryzacja", "Konsultacja"], notes: ["Anna K.", "Google Review", "Telegram wysłany", "Olena M.", "Maria P."] },
      clients: { title: "Znaj każdego klienta", subtitle: "Historia, kontakty i notatki są gotowe przed wizytą.", search: "Szukaj klientów", rows: [["Anna K.", "Ostatnia wizyta: dzisiaj"], ["Maria P.", "Woli wieczorne terminy"], ["Google Review", "Nowa prośba"], ["Olena M.", "Stała klientka"]] },
      services: { title: "Usługi i ceny", subtitle: "Czas, ceny i rezerwacje online w porządku.", rows: [["Strzyżenie", "45 min", "25 $"], ["Koloryzacja", "120 min", "80 $"], ["Konsultacja", "30 min", "15 $"], ["Pakiet Premium", "Miesięcznie", "2,99 $"]], online: "Rezerwacja online" },
      premium: { title: "Premium działa wszędzie", subtitle: "Jedna subskrypcja działa na web, iPhone i Androidzie.", plan: "Timviz Premium", price: "2,99 $ / miesiąc", sync: ["Strona", "iPhone", "Android"], status: "Aktywne dla konta", benefits: ["Synchronizacja konta", "Dostęp na platformach", "Pewny status premium"] },
      featureTitle: "Kalendarz rezerwacji dla zespołów usługowych",
      featureSubtitle: "Wizyty, klienci, przypomnienia i premium na Androidzie.",
    },
  },
  "cs-CZ": {
    title: "Timviz Kalendář Rezervací",
    shortDescription: "Rezervace, klienti, služby a premium synchronizace týmu.",
    fullDescription: `Timviz Kalendář Rezervací pomáhá službám spravovat objednávky, klienty, služby a připomínky v jednom synchronizovaném pracovním prostoru.

Timviz je vhodný pro kosmetické salony, barbershopy, kliniky, studia, konzultanty, samostatné profesionály i týmy, které potřebují jednoduchý rezervační kalendář na Androidu.

Funkce:
- kalendář denních objednávek a online rezervací
- databáze klientů s historií návštěv a poznámkami
- služby, ceny, délka trvání a rozvrh týmu
- upozornění a připomínky pro klienty i personál
- premium přístup synchronizovaný s webem Timviz, iPhonem a Androidem
- rychlá mobilní aplikace s cache a spolehlivou synchronizací účtu

Timviz používá stejný účet a data jako timviz.com, takže premium stav a informace firmy jsou dostupné všude.`,
    screenshots: {
      calendar: { title: "Plánujte rezervace", subtitle: "Rozvrh, online rezervace a připomínky zůstávají synchronizované.", month: "Červen 2026", today: "Dnes", events: ["Stříhání", "Nová online rezervace", "Připomínka klientovi", "Barvení", "Konzultace"], notes: ["Anna K.", "Google Review", "Telegram odeslán", "Olena M.", "Maria P."] },
      clients: { title: "Poznejte každého klienta", subtitle: "Historie, kontakty a poznámky jsou připravené před návštěvou.", search: "Hledat klienty", rows: [["Anna K.", "Poslední návštěva: dnes"], ["Maria P.", "Preferuje večer"], ["Google Review", "Nový požadavek"], ["Olena M.", "Stálá klientka"]] },
      services: { title: "Služby a ceny", subtitle: "Délka, ceny a online rezervace přehledně.", rows: [["Stříhání", "45 min", "25 $"], ["Barvení", "120 min", "80 $"], ["Konzultace", "30 min", "15 $"], ["Premium balíček", "Měsíčně", "2,99 $"]], online: "Online rezervace" },
      premium: { title: "Premium funguje všude", subtitle: "Jedno předplatné platí na webu, iPhonu i Androidu.", plan: "Timviz Premium", price: "2,99 $ / měsíc", sync: ["Web", "iPhone", "Android"], status: "Aktivní pro účet", benefits: ["Synchronizace účtu", "Přístup na platformách", "Spolehlivý premium stav"] },
      featureTitle: "Rezervační kalendář pro týmy služeb",
      featureSubtitle: "Rezervace, klienti, připomínky a premium na Androidu.",
    },
  },
  "es-ES": {
    title: "Timviz Calendario de Citas",
    shortDescription: "Reservas, clientes, servicios y premium sincronizados.",
    fullDescription: `Timviz Calendario de Citas ayuda a negocios de servicios a gestionar citas, clientes, servicios y recordatorios en un espacio de trabajo sincronizado.

Timviz es ideal para salones de belleza, barberías, clínicas, estudios, consultores, profesionales independientes y equipos que necesitan un calendario de reservas sencillo en Android.

Funciones:
- calendario para citas diarias y reservas online
- base de clientes con historial de visitas y notas
- servicios, precios, duración y horarios del equipo
- notificaciones y recordatorios para clientes y personal
- acceso premium sincronizado con el sitio Timviz, iPhone y Android
- experiencia móvil rápida con caché y sincronización fiable de cuenta

Timviz usa la misma cuenta y los mismos datos que timviz.com, por eso el estado premium y la información del negocio están disponibles en todas partes.`,
    screenshots: {
      calendar: { title: "Planifica citas", subtitle: "Agenda, reservas online y recordatorios siempre sincronizados.", month: "Junio 2026", today: "Hoy", events: ["Corte de cabello", "Nueva reserva online", "Recordatorio al cliente", "Coloración", "Consulta"], notes: ["Anna K.", "Google Review", "Telegram enviado", "Olena M.", "Maria P."] },
      clients: { title: "Conoce a cada cliente", subtitle: "Historial, contactos y notas listos antes de cada visita.", search: "Buscar clientes", rows: [["Anna K.", "Última visita: hoy"], ["Maria P.", "Prefiere por la tarde"], ["Google Review", "Nueva solicitud"], ["Olena M.", "Cliente frecuente"]] },
      services: { title: "Servicios y precios", subtitle: "Duración, tarifas y reservas online organizadas.", rows: [["Corte", "45 min", "25 $"], ["Coloración", "120 min", "80 $"], ["Consulta", "30 min", "15 $"], ["Paquete Premium", "Mensual", "2,99 $"]], online: "Reserva online" },
      premium: { title: "Premium funciona en todas partes", subtitle: "Una suscripción sigue la misma cuenta en web, iPhone y Android.", plan: "Timviz Premium", price: "2,99 $ / mes", sync: ["Web", "iPhone", "Android"], status: "Activo para esta cuenta", benefits: ["Sincronización de cuenta", "Acceso multiplataforma", "Estado premium fiable"] },
      featureTitle: "Calendario de reservas para equipos de servicios",
      featureSubtitle: "Citas, clientes, recordatorios y premium en Android.",
    },
  },
  "es-419": null,
  "es-US": null,
  "de-DE": {
    title: "Timviz Buchungskalender",
    shortDescription: "Buchungen, Kunden, Services und Premium synchronisiert.",
    fullDescription: `Timviz Buchungskalender hilft Dienstleistungsunternehmen, Termine, Kunden, Services und Erinnerungen in einem synchronisierten Arbeitsbereich zu verwalten.

Timviz eignet sich für Beauty-Salons, Barbershops, Kliniken, Studios, Berater, selbstständige Fachkräfte und Teams, die einen einfachen Buchungskalender auf Android benötigen.

Funktionen:
- Kalender für tägliche Termine und Online-Buchungen
- Kundendatenbank mit Besuchshistorie und Notizen
- Services, Preise, Dauer und Teampläne
- Benachrichtigungen und Erinnerungen für Kunden und Mitarbeiter
- Premium-Zugriff synchronisiert mit Timviz Website, iPhone und Android
- schnelle mobile Nutzung mit Cache und zuverlässiger Konto-Synchronisierung

Timviz nutzt dasselbe Konto und dieselben Daten wie timviz.com, damit Premium-Status und Unternehmensinformationen überall verfügbar sind.`,
    screenshots: {
      calendar: { title: "Termine planen", subtitle: "Tagesplan, Online-Buchungen und Erinnerungen bleiben synchron.", month: "Juni 2026", today: "Heute", events: ["Haarschnitt", "Neue Online-Buchung", "Kundenerinnerung", "Färbung", "Beratung"], notes: ["Anna K.", "Google Review", "Telegram gesendet", "Olena M.", "Maria P."] },
      clients: { title: "Jeden Kunden kennen", subtitle: "Historie, Kontakte und Notizen vor jedem Besuch bereit.", search: "Kunden suchen", rows: [["Anna K.", "Letzter Besuch: heute"], ["Maria P.", "Bevorzugt abends"], ["Google Review", "Neue Anfrage"], ["Olena M.", "Stammkundin"]] },
      services: { title: "Services und Preise", subtitle: "Dauer, Preise und Online-Buchung übersichtlich verwalten.", rows: [["Haarschnitt", "45 Min.", "25 $"], ["Färbung", "120 Min.", "80 $"], ["Beratung", "30 Min.", "15 $"], ["Premium Paket", "Monatlich", "2,99 $"]], online: "Online-Buchung" },
      premium: { title: "Premium funktioniert überall", subtitle: "Ein Abo folgt demselben Konto auf Web, iPhone und Android.", plan: "Timviz Premium", price: "2,99 $ / Monat", sync: ["Website", "iPhone", "Android"], status: "Aktiv für dieses Konto", benefits: ["Konto-Synchronisierung", "Zugriff auf allen Plattformen", "Zuverlässiger Premium-Status"] },
      featureTitle: "Buchungskalender für Service-Teams",
      featureSubtitle: "Termine, Kunden, Erinnerungen und Premium auf Android.",
    },
  },
};

localeContent["fr-CA"] = localeContent["fr-FR"];
localeContent["es-419"] = localeContent["es-ES"];
localeContent["es-US"] = localeContent["es-ES"];

const screenshotOrder = ["calendar", "clients", "services", "premium"];
const deviceSizes = {
  phone: { width: 1080, height: 1920, dir: "phone" },
  tablet7: { width: 1200, height: 1920, dir: "tablet-7" },
  tablet10: { width: 1600, height: 2560, dir: "tablet-10" },
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(text, x, y, options = {}) {
  const size = options.size ?? 44;
  const weight = options.weight ?? 700;
  const fill = options.fill ?? "#111827";
  const maxChars = options.maxChars ?? 28;
  const lineHeight = options.lineHeight ?? Math.round(size * 1.22);
  const anchor = options.anchor ?? "start";
  const lines = wrapText(text, maxChars).slice(0, options.maxLines ?? 3);
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("")}</text>`;
}

function logo(x, y, scale = 1) {
  const s = scale;
  if (wordmarkDataUri) {
    const width = 220 * s;
    const height = Math.round(width * (352 / 1271));
    return `<image href="${wordmarkDataUri}" x="${x}" y="${y - height}" width="${width}" height="${height}" preserveAspectRatio="xMinYMid meet"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <text x="0" y="0" font-size="72" font-weight="900"><tspan fill="#111827">Tim</tspan><tspan fill="#6d3df5">viz</tspan></text>
  </g>`;
}

function background(width, height) {
  return `<rect width="${width}" height="${height}" fill="#f4f8ff"/>
  <circle cx="${width * 0.9}" cy="${height * 0.1}" r="${width * 0.23}" fill="#dff3ff"/>
  <circle cx="${width * 0.12}" cy="${height * 0.9}" r="${width * 0.2}" fill="#efe6ff"/>
  <circle cx="${width * 0.78}" cy="${height * 0.78}" r="${width * 0.12}" fill="#e9f8f1"/>`;
}

function card(x, y, width, height, radius = 28) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="#ffffff" stroke="#d8e6f7" stroke-width="2" filter="url(#shadow)"/>`;
}

function calendarMock(content, x, y, width, height) {
  const rowGap = height / 6.5;
  const colors = ["#7048f6", "#27aee4", "#25bf8f", "#f5a31a", "#7048f6"];
  let svg = card(x, y, width, height, 30);
  svg += textBlock(content.month, x + 46, y + 76, { size: 38, maxChars: 24 });
  svg += `<rect x="${x + width - 250}" y="${y + 38}" width="190" height="62" rx="31" fill="#e9f6f0"/>
    <text x="${x + width - 155}" y="${y + 78}" font-size="24" font-weight="800" fill="#08765d" text-anchor="middle">${escapeXml(content.today)}</text>`;
  for (let index = 0; index < 5; index += 1) {
    const rowY = y + 150 + index * rowGap;
    const time = ["9:00", "11:00", "13:00", "15:00", "17:00"][index];
    svg += `<line x1="${x + 46}" x2="${x + width - 46}" y1="${rowY - 22}" y2="${rowY - 22}" stroke="#e5edf7" stroke-width="2"/>
      <text x="${x + 54}" y="${rowY + 24}" font-size="24" font-weight="800" fill="#76869c">${time}</text>
      <rect x="${x + 175}" y="${rowY - 4}" width="${width - 250}" height="86" rx="24" fill="${colors[index]}"/>
      <text x="${x + 210}" y="${rowY + 34}" font-size="25" font-weight="900" fill="#ffffff">${escapeXml(content.events[index])}</text>
      <text x="${x + 210}" y="${rowY + 66}" font-size="20" font-weight="700" fill="#ffffff">${escapeXml(content.notes[index])}</text>`;
  }
  return svg;
}

function clientsMock(content, x, y, width, height) {
  let svg = card(x, y, width, height, 30);
  svg += `<rect x="${x + 46}" y="${y + 42}" width="${width - 92}" height="70" rx="35" fill="#f6f9fd" stroke="#dfebf8"/>
    <text x="${x + 92}" y="${y + 87}" font-size="24" font-weight="800" fill="#8593a6">${escapeXml(content.search)}</text>`;
  content.rows.forEach((row, index) => {
    const rowY = y + 155 + index * 118;
    const initials = row[0].split(/\s+/).map((part) => part[0]).join("").slice(0, 2);
    svg += `<rect x="${x + 46}" y="${rowY}" width="${width - 92}" height="92" rx="28" fill="#ffffff" stroke="#e2ecf8"/>
      <circle cx="${x + 96}" cy="${rowY + 46}" r="30" fill="${["#7048f6", "#27aee4", "#25bf8f", "#f5a31a"][index]}"/>
      <text x="${x + 96}" y="${rowY + 55}" font-size="21" font-weight="900" fill="#ffffff" text-anchor="middle">${escapeXml(initials)}</text>
      <text x="${x + 145}" y="${rowY + 39}" font-size="27" font-weight="900" fill="#111827">${escapeXml(row[0])}</text>
      <text x="${x + 145}" y="${rowY + 70}" font-size="20" font-weight="700" fill="#76869c">${escapeXml(row[1])}</text>`;
  });
  return svg;
}

function servicesMock(content, x, y, width, height) {
  let svg = card(x, y, width, height, 30);
  svg += `<rect x="${x + 46}" y="${y + 42}" width="${width - 92}" height="76" rx="30" fill="#f1ecff"/>
    <text x="${x + 78}" y="${y + 90}" font-size="25" font-weight="900" fill="#5b35c8">${escapeXml(content.online)}</text>
    <rect x="${x + width - 160}" y="${y + 55}" width="86" height="48" rx="24" fill="#25bf8f"/>
    <circle cx="${x + width - 100}" cy="${y + 79}" r="20" fill="#ffffff"/>`;
  content.rows.forEach((row, index) => {
    const rowY = y + 155 + index * 122;
    svg += `<rect x="${x + 46}" y="${rowY}" width="${width - 92}" height="98" rx="28" fill="#ffffff" stroke="#e2ecf8"/>
      <text x="${x + 82}" y="${rowY + 40}" font-size="27" font-weight="900" fill="#111827">${escapeXml(row[0])}</text>
      <text x="${x + 82}" y="${rowY + 73}" font-size="20" font-weight="700" fill="#76869c">${escapeXml(row[1])}</text>
      <text x="${x + width - 82}" y="${rowY + 57}" font-size="27" font-weight="900" fill="#7048f6" text-anchor="end">${escapeXml(row[2])}</text>`;
  });
  return svg;
}

function premiumMock(content, x, y, width, height) {
  let svg = card(x, y, width, height, 30);
  svg += `<rect x="${x + 46}" y="${y + 46}" width="${width - 92}" height="180" rx="34" fill="#7048f6"/>
    <text x="${x + 88}" y="${y + 112}" font-size="35" font-weight="900" fill="#ffffff">${escapeXml(content.plan)}</text>
    <text x="${x + 88}" y="${y + 165}" font-size="31" font-weight="900" fill="#ffffff">${escapeXml(content.price)}</text>
    <text x="${x + 88}" y="${y + 204}" font-size="20" font-weight="800" fill="#e8dcff">${escapeXml(content.status)}</text>`;
  content.sync.forEach((item, index) => {
    const chipWidth = (width - 132) / 3;
    const chipX = x + 46 + index * (chipWidth + 20);
    svg += `<rect x="${chipX}" y="${y + 275}" width="${chipWidth}" height="80" rx="26" fill="${["#eff6ff", "#f0fdf4", "#fff7ed"][index]}" stroke="#e2ecf8"/>
      <text x="${chipX + chipWidth / 2}" y="${y + 325}" font-size="23" font-weight="900" fill="#111827" text-anchor="middle">${escapeXml(item)}</text>`;
  });
  const benefits = content.benefits ?? ["Account sync", "Cross-platform access", "Reliable premium status"];
  benefits.forEach((item, index) => {
    const rowY = y + 410 + index * 82;
    svg += `<circle cx="${x + 78}" cy="${rowY}" r="20" fill="#25bf8f"/>
      <path d="M${x + 68} ${rowY} l7 8 l15 -18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${x + 115}" y="${rowY + 8}" font-size="25" font-weight="850" fill="#111827">${escapeXml(item)}</text>`;
  });
  return svg;
}

function rawOverlayRect(frame, rawX, rawY, rawWidth, rawHeight, fill = "#f8fbff", radius = 18) {
  const x = frame.x + rawX * frame.scaleX;
  const y = frame.y + rawY * frame.scaleY;
  const width = rawWidth * frame.scaleX;
  const height = rawHeight * frame.scaleY;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"/>`;
}

function rawOverlayText(frame, text, rawX, rawY, options = {}) {
  const x = frame.x + rawX * frame.scaleX;
  const y = frame.y + rawY * frame.scaleY;
  const size = (options.size ?? 32) * frame.scaleX;
  const fill = options.fill ?? "#111827";
  const weight = options.weight ?? 900;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(text)}</text>`;
}

function privateDataMask(sceneKey, frame) {
  let svg = "";
  if (sceneKey === "calendar") {
    svg += rawOverlayRect(frame, 352, 495, 705, 82, "#ffffff", 0);
    svg += rawOverlayText(frame, "Timviz Studio", 445, 550, { size: 34 });
  }
  if (sceneKey === "clients") {
    const rows = [
      ["Anna Kovalenko", "+38 *** *** 24 18"],
      ["Maria Petrova", "+38 *** *** 68 42"],
      ["Olena Studio", "+38 *** *** 11 09"],
      ["Client Booking", "+38 *** *** 75 30"],
      ["Review Client", "+38 *** *** 43 22"],
      ["Repeat Visit", "+38 *** *** 91 64"],
      ["New Client", "+38 *** *** 30 18"],
    ];
    svg += rawOverlayRect(frame, 70, 575, 850, 1845, "#ffffff", 0);
    const rowYs = [595, 785, 975, 1168, 1362, 1554, 1747];
    for (const [index, rowY] of rowYs.entries()) {
      svg += `<rect x="${frame.x + 76 * frame.scaleX}" y="${frame.y + rowY * frame.scaleY}" width="${792 * frame.scaleX}" height="${112 * frame.scaleY}" rx="${28 * frame.scaleX}" fill="#f8fbff" stroke="#dfe8f4" stroke-width="${2 * frame.scaleX}"/>`;
      svg += rawOverlayText(frame, rows[index][0], 102, rowY + 45, { size: 31 });
      svg += rawOverlayText(frame, rows[index][1], 102, rowY + 84, { size: 28, fill: "#718096", weight: 800 });
      svg += `<rect x="${frame.x + 770 * frame.scaleX}" y="${frame.y + (rowY + 32) * frame.scaleY}" width="${60 * frame.scaleX}" height="${56 * frame.scaleY}" rx="${18 * frame.scaleX}" fill="#f1e2ff"/>
        <text x="${frame.x + 800 * frame.scaleX}" y="${frame.y + (rowY + 70) * frame.scaleY}" font-size="${28 * frame.scaleX}" font-weight="900" fill="#7048f6" text-anchor="middle">1</text>`;
    }
  }
  if (sceneKey === "premium") {
    svg += rawOverlayRect(frame, 48, 372, 420, 42, "#f4f8ff", 0);
    svg += rawOverlayText(frame, "Timviz Studio", 48, 402, { size: 28, fill: "#718096", weight: 800 });
  }
  return svg;
}

function realScreenshotFrame(sceneKey, x, y, width, height) {
  const dataUri = realScreenshotDataUris[sceneKey];
  const clipId = `real-${sceneKey}-${Math.round(width)}-${Math.round(height)}`;
  const frame = {
    x,
    y,
    width,
    height,
    scaleX: width / 1080,
    scaleY: height / 2400,
  };
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="44" fill="#ffffff" filter="url(#shadow)"/>
    <clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="44"/></clipPath>
    <g clip-path="url(#${clipId})">
      <image href="${dataUri}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="none"/>
      ${privateDataMask(sceneKey, frame)}
    </g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="44" fill="none" stroke="#d8e6f7" stroke-width="2"/>
  </g>`;
}

function screenshotSvg(locale, sceneKey, size) {
  const localeData = localeContent[locale];
  const scene = localeData.screenshots[sceneKey];
  const { width, height } = size;
  const pad = width >= 1500 ? 128 : 86;
  const logoScale = width >= 1500 ? 1.15 : 1;
  const titleSize = width >= 1500 ? 70 : 58;
  const subtitleSize = width >= 1500 ? 36 : 31;
  const titleMax = width >= 1500 ? 30 : 24;
  const cardY = width >= 1500 ? 720 : 560;
  const cardHeight = height - cardY - (width >= 1500 ? 170 : 110);
  const cardWidth = width - pad * 2;
  const cardX = pad;
  const hasRealScreenshot = Boolean(realScreenshotDataUris[sceneKey]);
  const phoneY = width >= 1500 ? 680 : 500;
  const basePhoneWidth = width >= 1500 ? 760 : width >= 1200 ? 680 : 620;
  const maxPhoneHeight = height - phoneY - (width >= 1500 ? 150 : 80);
  const basePhoneHeight = Math.round(basePhoneWidth * (2400 / 1080));
  const phoneHeight = Math.min(basePhoneHeight, maxPhoneHeight);
  const phoneWidth = Math.round(phoneHeight * (1080 / 2400));
  const phoneX = Math.round((width - phoneWidth) / 2);
  const sceneMock = hasRealScreenshot
    ? realScreenshotFrame(sceneKey, phoneX, phoneY, phoneWidth, phoneHeight)
    : sceneKey === "calendar"
      ? calendarMock(scene, cardX, cardY, cardWidth, cardHeight)
      : sceneKey === "clients"
        ? clientsMock(scene, cardX, cardY, cardWidth, cardHeight)
        : sceneKey === "services"
          ? servicesMock(scene, cardX, cardY, cardWidth, cardHeight)
          : premiumMock(scene, cardX, cardY, cardWidth, cardHeight);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#1d3354" flood-opacity="0.12"/>
      </filter>
    </defs>
    <g font-family="Arial Unicode MS, Arial, Helvetica, sans-serif">
      ${background(width, height)}
      ${logo(pad, width >= 1500 ? 170 : 130, logoScale)}
      ${textBlock(scene.title, pad, width >= 1500 ? 340 : 290, { size: titleSize, maxChars: titleMax, lineHeight: Math.round(titleSize * 1.1) })}
      ${textBlock(scene.subtitle, pad, width >= 1500 ? 480 : 410, { size: subtitleSize, weight: 700, fill: "#718096", maxChars: width >= 1500 ? 45 : 34, lineHeight: Math.round(subtitleSize * 1.25), maxLines: 3 })}
      ${sceneMock}
    </g>
  </svg>`;
}

function featureSvg(locale, iconBase64) {
  const data = localeContent[locale];
  const { featureTitle, featureSubtitle } = data.screenshots;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#f4f8ff"/>
        <stop offset="1" stop-color="#eef4ff"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#1d3354" flood-opacity="0.16"/>
      </filter>
    </defs>
    <g font-family="Arial Unicode MS, Arial, Helvetica, sans-serif">
      <rect width="1024" height="500" fill="url(#bg)"/>
      <circle cx="905" cy="75" r="175" fill="#dff3ff"/>
      <circle cx="110" cy="445" r="155" fill="#efe6ff"/>
      <image href="data:image/png;base64,${iconBase64}" x="690" y="130" width="220" height="220" filter="url(#shadow)"/>
      ${logo(78, 115, 0.9)}
      ${textBlock(featureTitle, 78, 230, { size: 54, maxChars: 31, lineHeight: 60, maxLines: 2 })}
      ${textBlock(featureSubtitle, 78, 365, { size: 27, weight: 750, fill: "#718096", maxChars: 44, lineHeight: 34, maxLines: 2 })}
    </g>
  </svg>`;
}

async function generateAssets() {
  const iconBase64 = fs.readFileSync(iconPath).toString("base64");
  if (fs.existsSync(wordmarkPath)) {
    wordmarkDataUri = `data:image/png;base64,${fs.readFileSync(wordmarkPath).toString("base64")}`;
  }
  const realScreens = {
    calendar: "01-calendar.png",
    services: "02-services.png",
    clients: "03-clients.png",
    premium: "04-more.png",
  };
  for (const [sceneKey, fileName] of Object.entries(realScreens)) {
    const filePath = path.join(realScreenshotRoot, fileName);
    if (fs.existsSync(filePath)) {
      realScreenshotDataUris[sceneKey] = `data:image/png;base64,${fs.readFileSync(filePath).toString("base64")}`;
    }
  }
  if (Object.keys(realScreenshotDataUris).length) {
    console.log(`Using real screenshots from ${realScreenshotRoot}`);
  }
  fs.mkdirSync(outputRoot, { recursive: true });
  let count = 0;
  for (const locale of Object.keys(localeContent)) {
    const localeDir = path.join(outputRoot, locale);
    fs.mkdirSync(localeDir, { recursive: true });
    await sharp(Buffer.from(featureSvg(locale, iconBase64))).png().toFile(path.join(localeDir, "feature-graphic.png"));
    count += 1;
    for (const size of Object.values(deviceSizes)) {
      const deviceDir = path.join(localeDir, size.dir);
      fs.mkdirSync(deviceDir, { recursive: true });
      for (const [index, sceneKey] of screenshotOrder.entries()) {
        const svg = screenshotSvg(locale, sceneKey, size);
        const outputPath = path.join(deviceDir, `${String(index + 1).padStart(2, "0")}-${sceneKey}.png`);
        await sharp(Buffer.from(svg)).png().toFile(outputPath);
        count += 1;
      }
    }
  }
  console.log(`Generated ${count} localized Play Store images in ${outputRoot}`);
}

function validateListingText() {
  for (const [locale, content] of Object.entries(localeContent)) {
    if (content.title.length > 30) throw new Error(`${locale} title is too long: ${content.title.length}`);
    if (content.shortDescription.length > 80) {
      throw new Error(`${locale} shortDescription is too long: ${content.shortDescription.length}`);
    }
    if (content.fullDescription.length > 4000) {
      throw new Error(`${locale} fullDescription is too long: ${content.fullDescription.length}`);
    }
  }
}

async function uploadToPlay() {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Missing Google Play service account JSON: ${serviceAccountPath}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const api = google.androidpublisher({ version: "v3", auth });
  const edit = await api.edits.insert({ packageName });
  const editId = edit.data.id;
  if (!editId) throw new Error("Google Play did not return an edit id");

  try {
    for (const [locale, content] of Object.entries(localeContent)) {
      console.log(`Updating listing ${locale}`);
      await api.edits.listings.update({
        packageName,
        editId,
        language: locale,
        requestBody: {
          title: content.title,
          shortDescription: content.shortDescription,
          fullDescription: content.fullDescription,
        },
      });

      const localeDir = path.join(outputRoot, locale);
      const imageUploads = [
        ["featureGraphic", [path.join(localeDir, "feature-graphic.png")]],
        [
          "phoneScreenshots",
          screenshotOrder.map((sceneKey, index) =>
            path.join(localeDir, "phone", `${String(index + 1).padStart(2, "0")}-${sceneKey}.png`),
          ),
        ],
        [
          "sevenInchScreenshots",
          screenshotOrder.map((sceneKey, index) =>
            path.join(localeDir, "tablet-7", `${String(index + 1).padStart(2, "0")}-${sceneKey}.png`),
          ),
        ],
        [
          "tenInchScreenshots",
          screenshotOrder.map((sceneKey, index) =>
            path.join(localeDir, "tablet-10", `${String(index + 1).padStart(2, "0")}-${sceneKey}.png`),
          ),
        ],
      ];

      for (const [imageType, files] of imageUploads) {
        await api.edits.images.deleteall({ packageName, editId, language: locale, imageType });
        for (const file of files) {
          await api.edits.images.upload({
            packageName,
            editId,
            language: locale,
            imageType,
            media: {
              mimeType: "image/png",
              body: fs.createReadStream(file),
            },
          });
        }
      }
    }

    const commit = await api.edits.commit({ packageName, editId });
    console.log(`Committed Play edit ${commit.data.id ?? editId}`);
  } catch (error) {
    await api.edits.delete({ packageName, editId }).catch(() => {});
    throw error;
  }
}

validateListingText();

if (shouldGenerate) {
  await generateAssets();
}

if (shouldUpload) {
  await uploadToPlay();
}
