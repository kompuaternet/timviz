import type { Metadata } from "next";
import Link from "next/link";
import { updateBookingStatusAction } from "./actions";
import { getAllBookings } from "../../lib/bookings";
import type { BookingRecord, BookingStatus } from "../../lib/bookings";
import { buildMetadata } from "../../lib/seo";

export const metadata: Metadata = buildMetadata(
  "/dashboard",
  {
    title: "Кабинет",
    description: "Внутренний рабочий кабинет Timviz."
  },
  "ru",
  { noIndex: true }
);

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long"
  }).format(new Date(`${value}T00:00:00`));
}

function getStatusLabel(status: BookingStatus) {
  if (status === "completed") {
    return "Завершена";
  }

  if (status === "cancelled") {
    return "Отменена";
  }

  return "Подтверждена";
}

type DashboardPageProps = {
  searchParams?: Promise<{
    salon?: string;
    date?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const filters = (await searchParams) ?? {};
  const bookings = await getAllBookings();

  const salonMap = new Map<string, string>();
  for (const booking of bookings) {
    if (!salonMap.has(booking.salonSlug)) {
      salonMap.set(booking.salonSlug, booking.salonName);
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    const salonMatch = filters.salon ? booking.salonSlug === filters.salon : true;
    const dateMatch = filters.date ? booking.appointmentDate === filters.date : true;
    return salonMatch && dateMatch;
  });

  const totalBookings = filteredBookings.length;
  const upcomingBookings = filteredBookings.slice(0, 6);
  const completedCount = filteredBookings.filter(
    (booking) => booking.status === "completed"
  ).length;
  const cancelledCount = filteredBookings.filter(
    (booking) => booking.status === "cancelled"
  ).length;

  const bookingsBySalon = Array.from(
    filteredBookings.reduce((map, booking) => {
      const current = map.get(booking.salonName) ?? 0;
      map.set(booking.salonName, current + 1);
      return map;
    }, new Map<string, number>())
  );

  const dayBuckets = Array.from(
    filteredBookings.reduce((map, booking) => {
      const current = map.get(booking.appointmentDate) ?? [];
      current.push(booking);
      map.set(booking.appointmentDate, current);
      return map;
    }, new Map<string, BookingRecord[]>())
  ).sort(([left], [right]) => left.localeCompare(right));

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Кабинет салона</p>
          <h1>Записи, статусы и фильтрация по дням в одной панели</h1>
          <p className="hero-text">
            Теперь dashboard уже работает как админский экран: можно отфильтровать
            записи, видеть их состояние и управлять статусами прямо из ленты.
          </p>
        </div>

        <div className="dashboard-summary">
          <div className="summary-card">
            <p>Всего записей</p>
            <strong>{totalBookings}</strong>
            <span>Учитываем текущую выборку по фильтрам</span>
          </div>
          <div className="summary-card">
            <p>Завершено</p>
            <strong>{completedCount}</strong>
            <span>База для истории визитов и повторных продаж</span>
          </div>
          <div className="summary-card">
            <p>Отменено</p>
            <strong>{cancelledCount}</strong>
            <span>Позже добавим причины и аналитику потерь</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-head">
            <div>
              <p className="surface-label">Управление бронями</p>
              <h2>Лента визитов</h2>
            </div>
            <div className="dashboard-actions">
              <Link href="/catalog" className="secondary-button">
                Новая запись
              </Link>
              <Link href="/dashboard" className="secondary-button">
                Сбросить фильтры
              </Link>
            </div>
          </div>

          <form className="filter-bar" action="/dashboard">
            <label className="field">
              <span>Салон</span>
              <select name="salon" defaultValue={filters.salon ?? ""}>
                <option value="">Все салоны</option>
                {Array.from(salonMap.entries()).map(([slug, name]) => (
                  <option key={slug} value={slug}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Дата</span>
              <input name="date" type="date" defaultValue={filters.date ?? ""} />
            </label>

            <button type="submit" className="primary-button submit-button">
              Применить
            </button>
          </form>

          {upcomingBookings.length === 0 ? (
            <p className="empty-state">
              По текущим фильтрам записей нет. Попробуй сбросить выборку или создать
              новую бронь.
            </p>
          ) : (
            <div className="booking-list">
              {upcomingBookings.map((booking) => (
                <article key={booking.id} className="booking-list-item">
                  <div className="booking-list-main">
                    <strong>{booking.customerName}</strong>
                    <span>{`${booking.serviceName} · ${booking.salonName}`}</span>
                    <span className={`status-pill status-${booking.status}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="booking-list-meta">
                    <strong>{booking.appointmentTime}</strong>
                    <span>{formatDateLabel(booking.appointmentDate)}</span>
                    <form action={updateBookingStatusAction} className="status-actions">
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="salon" value={filters.salon ?? ""} />
                      <input type="hidden" name="date" value={filters.date ?? ""} />

                      <button
                        type="submit"
                        name="status"
                        value="confirmed"
                        className="mini-action"
                      >
                        Подтв.
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="completed"
                        className="mini-action"
                      >
                        Завершить
                      </button>
                      <button
                        type="submit"
                        name="status"
                        value="cancelled"
                        className="mini-action danger-action"
                      >
                        Отменить
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="panel-head">
            <div>
              <p className="surface-label">Загрузка по салонам</p>
              <h2>Кто принимает больше всего</h2>
            </div>
          </div>

          <div className="metric-stack">
            {bookingsBySalon.length === 0 ? (
              <p className="empty-state">Здесь появится аналитика после первых бронирований.</p>
            ) : (
              bookingsBySalon.map(([salonName, count]) => (
                <div key={salonName} className="metric-row">
                  <span>{salonName}</span>
                  <strong>{count}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-timeline">
        <div className="panel-head">
          <div>
            <p className="surface-label">Календарь дня</p>
            <h2>Расклад по датам</h2>
          </div>
        </div>

        {dayBuckets.length === 0 ? (
          <p className="empty-state">
            Календарь пока пустой. После первой записи здесь появятся дни и слоты.
          </p>
        ) : (
          <div className="day-columns">
            {dayBuckets.map(([date, items]) => (
              <div key={date} className="day-card">
                <div className="day-card-head">
                  <strong>{formatDateLabel(date)}</strong>
                  <span>{`${items.length} запис.`}</span>
                </div>
                <div className="day-card-list">
                  {items.map((booking) => (
                    <div key={booking.id} className="day-slot">
                      <strong>{booking.appointmentTime}</strong>
                      <span>{booking.customerName}</span>
                      <span>{booking.serviceName}</span>
                      <span className={`status-pill status-${booking.status}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
