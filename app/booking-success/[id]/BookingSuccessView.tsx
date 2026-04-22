"use client";

import Link from "next/link";
import type { BookingRecord } from "../../../lib/bookings";
import { useSiteLanguage, type SiteLanguage } from "../../useSiteLanguage";

type BookingSuccessViewProps = {
  booking: BookingRecord;
};

type BookingSuccessCopy = {
  locale: string;
  eyebrow: string;
  heroText: string;
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

const bookingSuccessCopy: Record<SiteLanguage, BookingSuccessCopy> = {
  ru: {
    locale: "ru-RU",
    eyebrow: "Запись подтверждена",
    heroText: "Бронь сохранена. Следом сюда можно подключить Telegram-напоминания, оплату и управление статусами визита.",
    bookingNumber: "Номер брони",
    service: "Услуга",
    date: "Дата",
    time: "Время",
    client: "Клиент",
    phone: "Телефон",
    storage: "Хранилище",
    localStorageLabel: "Локальное хранилище",
    backToSalon: "Вернуться к салону",
    openCatalog: "Открыть каталог"
  },
  uk: {
    locale: "uk-UA",
    eyebrow: "Запис підтверджено",
    heroText: "Бронювання збережено. Далі сюди можна підключити Telegram-нагадування, оплату та керування статусами візиту.",
    bookingNumber: "Номер бронювання",
    service: "Послуга",
    date: "Дата",
    time: "Час",
    client: "Клієнт",
    phone: "Телефон",
    storage: "Сховище",
    localStorageLabel: "Локальне сховище",
    backToSalon: "Повернутися до салону",
    openCatalog: "Відкрити каталог"
  },
  en: {
    locale: "en-US",
    eyebrow: "Booking confirmed",
    heroText: "Your booking has been saved. Telegram reminders, payments and visit status management can plug into this step next.",
    bookingNumber: "Booking number",
    service: "Service",
    date: "Date",
    time: "Time",
    client: "Client",
    phone: "Phone",
    storage: "Storage",
    localStorageLabel: "Local storage",
    backToSalon: "Back to salon",
    openCatalog: "Open catalog"
  }
};

function formatAppointmentDate(value: string, language: SiteLanguage) {
  return new Intl.DateTimeFormat(bookingSuccessCopy[language].locale, {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export default function BookingSuccessView({ booking }: BookingSuccessViewProps) {
  const language = useSiteLanguage();
  const t = bookingSuccessCopy[language];

  return (
    <main className="booking-success-shell">
      <section className="booking-success-card">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{booking.salonName}</h1>
        <p className="hero-text">{t.heroText}</p>

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
          <Link href={`/salons/${booking.salonSlug}`} className="primary-button">
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
