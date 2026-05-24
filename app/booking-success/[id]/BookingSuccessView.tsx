"use client";

import Link from "next/link";
import type { BookingRecord } from "../../../lib/bookings";
import { type SiteLanguage, withEnglishFallback } from "../../../lib/site-language";
import { useSiteLanguage } from "../../useSiteLanguage";

type BookingSuccessViewProps = {
  booking: BookingRecord;
  backPath?: string;
  pending?: boolean;
};

type BookingSuccessCopy = {
  locale: string;
  eyebrow: string;
  pendingEyebrow: string;
  heroText: string;
  pendingHeroText: string;
  bookingNumber: string;
  service: string;
  date: string;
  time: string;
  client: string;
  phone: string;
  storage: string;
  localStorageLabel: string;
  backToSalon: string;
  openCatalog: string;
};

const bookingSuccessCopy: Record<SiteLanguage, BookingSuccessCopy> = withEnglishFallback<BookingSuccessCopy>({
  ru: {
    locale: "ru-RU",
    eyebrow: "Запись подтверждена",
    pendingEyebrow: "Заявка отправлена",
    heroText: "Бронь сохранена. Следом сюда можно подключить Telegram-напоминания, оплату и управление статусами визита.",
    pendingHeroText: "Запись отправлена мастеру. Как только он подтвердит заявку, визит станет активным.",
    bookingNumber: "Номер брони",
    service: "Услуга",
    date: "Дата",
    time: "Время",
    client: "Клиент",
    phone: "Телефон",
    storage: "Хранилище",
    localStorageLabel: "Локальное хранилище",
    backToSalon: "Вернуться на страницу компании",
    openCatalog: "Найти ещё компанию"
  },
  uk: {
    locale: "uk-UA",
    eyebrow: "Запис підтверджено",
    pendingEyebrow: "Заявку надіслано",
    heroText: "Бронювання збережено. Далі сюди можна підключити Telegram-нагадування, оплату та керування статусами візиту.",
    pendingHeroText: "Запис надіслано майстру. Щойно він підтвердить заявку, візит стане активним.",
    bookingNumber: "Номер бронювання",
    service: "Послуга",
    date: "Дата",
    time: "Час",
    client: "Клієнт",
    phone: "Телефон",
    storage: "Сховище",
    localStorageLabel: "Локальне сховище",
    backToSalon: "Повернутися на сторінку компанії",
    openCatalog: "Знайти ще компанію"
  },
  en: {
    locale: "en-US",
    eyebrow: "Booking confirmed",
    pendingEyebrow: "Request sent",
    heroText: "Your booking has been saved. Telegram reminders, payments and visit status management can plug into this step next.",
    pendingHeroText: "Your booking request was sent to the professional. Once confirmed, the visit becomes active.",
    bookingNumber: "Booking number",
    service: "Service",
    date: "Date",
    time: "Time",
    client: "Client",
    phone: "Phone",
    storage: "Storage",
    localStorageLabel: "Local storage",
    backToSalon: "Back to business page",
    openCatalog: "Find another business"
  }
});

Object.assign(bookingSuccessCopy, {
  fr: {
    ...bookingSuccessCopy.en,
    locale: "fr-FR",
    eyebrow: "Réservation confirmée",
    pendingEyebrow: "Demande envoyée",
    heroText: "Votre réservation est enregistrée. Les rappels Telegram, les paiements et la gestion du statut pourront être ajoutés à cette étape.",
    pendingHeroText: "Votre demande a été envoyée au professionnel. Après confirmation, la visite deviendra active.",
    bookingNumber: "Numéro de réservation",
    service: "Service",
    date: "Date",
    time: "Heure",
    client: "Client",
    phone: "Téléphone",
    storage: "Stockage",
    localStorageLabel: "Stockage local",
    backToSalon: "Retour à la page de l’entreprise",
    openCatalog: "Trouver une autre entreprise"
  },
  pl: {
    ...bookingSuccessCopy.en,
    locale: "pl-PL",
    eyebrow: "Rezerwacja potwierdzona",
    pendingEyebrow: "Prośba wysłana",
    heroText: "Rezerwacja została zapisana. W tym kroku można później dodać przypomnienia Telegram, płatności i zarządzanie statusem wizyty.",
    pendingHeroText: "Prośba o rezerwację została wysłana. Po potwierdzeniu wizyta stanie się aktywna.",
    bookingNumber: "Numer rezerwacji",
    service: "Usługa",
    date: "Data",
    time: "Godzina",
    client: "Klient",
    phone: "Telefon",
    storage: "Przechowywanie",
    localStorageLabel: "Pamięć lokalna",
    backToSalon: "Wróć na stronę firmy",
    openCatalog: "Znajdź inną firmę"
  },
  cs: {
    ...bookingSuccessCopy.en,
    locale: "cs-CZ",
    eyebrow: "Rezervace potvrzena",
    pendingEyebrow: "Žádost odeslána",
    heroText: "Rezervace byla uložena. V tomto kroku lze později přidat Telegram připomenutí, platby a správu stavu návštěvy.",
    pendingHeroText: "Žádost o rezervaci byla odeslána. Po potvrzení bude návštěva aktivní.",
    bookingNumber: "Číslo rezervace",
    service: "Služba",
    date: "Datum",
    time: "Čas",
    client: "Klient",
    phone: "Telefon",
    storage: "Úložiště",
    localStorageLabel: "Místní úložiště",
    backToSalon: "Zpět na stránku firmy",
    openCatalog: "Najít další firmu"
  },
  es: {
    ...bookingSuccessCopy.en,
    locale: "es-ES",
    eyebrow: "Reserva confirmada",
    pendingEyebrow: "Solicitud enviada",
    heroText: "Tu reserva se ha guardado. En este paso se podrán añadir recordatorios de Telegram, pagos y gestión del estado de la visita.",
    pendingHeroText: "Tu solicitud de reserva fue enviada. Cuando se confirme, la visita estará activa.",
    bookingNumber: "Número de reserva",
    service: "Servicio",
    date: "Fecha",
    time: "Hora",
    client: "Cliente",
    phone: "Teléfono",
    storage: "Almacenamiento",
    localStorageLabel: "Almacenamiento local",
    backToSalon: "Volver a la página de la empresa",
    openCatalog: "Encontrar otra empresa"
  },
  de: {
    ...bookingSuccessCopy.en,
    locale: "de-DE",
    eyebrow: "Buchung bestätigt",
    pendingEyebrow: "Anfrage gesendet",
    heroText: "Deine Buchung wurde gespeichert. Telegram-Erinnerungen, Zahlungen und Statusverwaltung können später hier ergänzt werden.",
    pendingHeroText: "Deine Buchungsanfrage wurde gesendet. Nach Bestätigung wird der Besuch aktiv.",
    bookingNumber: "Buchungsnummer",
    service: "Leistung",
    date: "Datum",
    time: "Zeit",
    client: "Kunde",
    phone: "Telefon",
    storage: "Speicher",
    localStorageLabel: "Lokaler Speicher",
    backToSalon: "Zur Unternehmensseite zurück",
    openCatalog: "Weiteres Unternehmen finden"
  }
});

function formatAppointmentDate(value: string, language: SiteLanguage) {
  return new Intl.DateTimeFormat(bookingSuccessCopy[language].locale, {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export default function BookingSuccessView({ booking, backPath, pending = false }: BookingSuccessViewProps) {
  const language = useSiteLanguage();
  const t = bookingSuccessCopy[language];

  return (
    <main className="booking-success-shell">
      <section className="booking-success-card">
        <div className="booking-success-mark">✓</div>
        <p className="eyebrow">{pending ? t.pendingEyebrow : t.eyebrow}</p>
        <h1>{booking.salonName}</h1>
        <p className="hero-text">{pending ? t.pendingHeroText : t.heroText}</p>

        <div className="success-grid">
          <div className="success-row">
            <strong>{t.bookingNumber}</strong>
            <span>{booking.id}</span>
          </div>
          <div className="success-row">
            <strong>{t.service}</strong>
            <span>{booking.serviceName}</span>
          </div>
          <div className="success-row">
            <strong>{t.date}</strong>
            <span>{formatAppointmentDate(booking.appointmentDate, language)}</span>
          </div>
          <div className="success-row">
            <strong>{t.time}</strong>
            <span>{booking.appointmentTime}</span>
          </div>
          <div className="success-row">
            <strong>{t.client}</strong>
            <span>{booking.customerName}</span>
          </div>
          <div className="success-row">
            <strong>{t.phone}</strong>
            <span>{booking.customerPhone}</span>
          </div>
          <div className="success-row">
            <strong>{t.storage}</strong>
            <span>{booking.source === "supabase" ? "Supabase" : t.localStorageLabel}</span>
          </div>
        </div>

        <div className="hero-actions">
          <Link
            href={
              backPath ||
              (booking.salonSlug.startsWith("business:")
                ? `/b/${booking.salonSlug.replace(/^business:/, "")}`
                : `/salons/${booking.salonSlug}`)
            }
            className="primary-button"
          >
            {t.backToSalon}
          </Link>
          <Link href="/catalog" className="secondary-button">
            {t.openCatalog}
          </Link>
        </div>
      </section>
    </main>
  );
}
