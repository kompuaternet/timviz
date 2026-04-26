"use client";

import Link from "next/link";
import { getPublicBusinessPathId } from "../../lib/public-business-path";
import type { PublicSearchResult } from "../../lib/public-search";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";
import { useSiteLanguage } from "../useSiteLanguage";

type CatalogViewProps = {
  results: PublicSearchResult[];
  query: string;
  kind: string;
  date: string;
  time: string;
  location: string;
  hasCoords: boolean;
  initialLanguage?: SiteLanguage;
};

type CatalogCopy = {
  locale: string;
  eyebrow: string;
  defaultTitle: string;
  searchTitle: (query: string) => string;
  heroText: string;
  anyTime: string;
  withoutGeolocation: string;
  sortedByDistance: string;
  pricePending: string;
  chooseTime: string;
  emptyTitle: string;
  emptyText: string;
  backToSearch: string;
  action: string;
  viewProfile: string;
  onlineBookingEnabled: string;
  onlineBookingDisabled: string;
  distanceUnknown: string;
  distanceUnderOne: string;
  kindLabel: (kind: string) => string;
  resultType: (type: PublicSearchResult["type"]) => string;
  priceFrom: (price: string) => string;
  distanceFromYou: (value: number) => string;
  reviewCount: (count: number) => string;
  resultCount: (count: number) => string;
  availableAt: (time: string) => string;
};

const catalogCopy: Record<SiteLanguage, CatalogCopy> = {
  ru: {
    locale: "ru-RU",
    eyebrow: "Каталог Timviz",
    defaultTitle: "Салоны, мастера и услуги рядом",
    searchTitle: (query) => `Поиск: ${query}`,
    heroText:
      "Ищем по названию услуги, заведения или профессионала. Если выбрано время, показываем только тех, у кого есть свободное окно.",
    anyTime: "Любое время",
    withoutGeolocation: "Без геолокации",
    sortedByDistance: "Сортировка по расстоянию",
    pricePending: "Цена уточняется",
    chooseTime: "Можно выбрать время",
    emptyTitle: "Свободных вариантов не найдено",
    emptyText: "Попробуйте выбрать другое время, убрать тип результата или искать по более короткому названию услуги.",
    backToSearch: "Вернуться к поиску",
    action: "Открыть и записаться",
    viewProfile: "Открыть карточку",
    onlineBookingEnabled: "Онлайн-запись доступна",
    onlineBookingDisabled: "Онлайн-запись выключена",
    distanceUnknown: "Расстояние после геолокации",
    distanceUnderOne: "Меньше 1 км",
    kindLabel: (kind) =>
      kind === "business"
        ? "Заведения"
        : kind === "professional"
          ? "Профессионалы"
          : kind === "procedure"
            ? "Процедуры"
            : "Все типы",
    resultType: (type) => (type === "business" ? "Заведение" : "Профессионал"),
    priceFrom: (price) => `от ${price}`,
    distanceFromYou: (value) => `${value} км от вас`,
    reviewCount: (count) => `${count} ${getSlavicPlural(count, ["отзыв", "отзыва", "отзывов"])}`,
    resultCount: (count) => `${count} ${getSlavicPlural(count, ["результат", "результата", "результатов"])}`,
    availableAt: (time) => `Свободно на ${time}`
  },
  uk: {
    locale: "uk-UA",
    eyebrow: "Каталог Timviz",
    defaultTitle: "Салони, майстри й послуги поруч",
    searchTitle: (query) => `Пошук: ${query}`,
    heroText:
      "Шукаємо за назвою послуги, закладу або професіонала. Якщо вибрано час, показуємо лише тих, у кого є вільне вікно.",
    anyTime: "Будь-який час",
    withoutGeolocation: "Без геолокації",
    sortedByDistance: "Сортування за відстанню",
    pricePending: "Ціну уточнюємо",
    chooseTime: "Можна вибрати час",
    emptyTitle: "Вільних варіантів не знайдено",
    emptyText: "Спробуйте вибрати інший час, прибрати тип результату або шукати за коротшою назвою послуги.",
    backToSearch: "Повернутися до пошуку",
    action: "Відкрити і записатися",
    viewProfile: "Відкрити картку",
    onlineBookingEnabled: "Онлайн-запис доступний",
    onlineBookingDisabled: "Онлайн-запис вимкнено",
    distanceUnknown: "Відстань після геолокації",
    distanceUnderOne: "Менше 1 км",
    kindLabel: (kind) =>
      kind === "business"
        ? "Заклади"
        : kind === "professional"
          ? "Професіонали"
          : kind === "procedure"
            ? "Процедури"
            : "Усі типи",
    resultType: (type) => (type === "business" ? "Заклад" : "Професіонал"),
    priceFrom: (price) => `від ${price}`,
    distanceFromYou: (value) => `${value} км від вас`,
    reviewCount: (count) => `${count} ${getSlavicPlural(count, ["відгук", "відгуки", "відгуків"])}`,
    resultCount: (count) => `${count} ${getSlavicPlural(count, ["результат", "результати", "результатів"])}`,
    availableAt: (time) => `Є вікно на ${time}`
  },
  en: {
    locale: "en-US",
    eyebrow: "Timviz catalog",
    defaultTitle: "Salons, professionals and services nearby",
    searchTitle: (query) => `Search: ${query}`,
    heroText:
      "Search by service, venue or professional name. When time is selected, only places with an available slot stay in the results.",
    anyTime: "Any time",
    withoutGeolocation: "No geolocation",
    sortedByDistance: "Sorted by distance",
    pricePending: "Price on request",
    chooseTime: "Choose a time",
    emptyTitle: "No available matches found",
    emptyText: "Try another time, remove the result type, or search with a shorter service name.",
    backToSearch: "Back to search",
    action: "Open and book",
    viewProfile: "Open profile",
    onlineBookingEnabled: "Online booking available",
    onlineBookingDisabled: "Online booking is off",
    distanceUnknown: "Distance after geolocation",
    distanceUnderOne: "Less than 1 km",
    kindLabel: (kind) =>
      kind === "business"
        ? "Venues"
        : kind === "professional"
          ? "Professionals"
          : kind === "procedure"
            ? "Services"
            : "All types",
    resultType: (type) => (type === "business" ? "Venue" : "Professional"),
    priceFrom: (price) => `from ${price}`,
    distanceFromYou: (value) => `${value} km away`,
    reviewCount: (count) => `${count} review${count === 1 ? "" : "s"}`,
    resultCount: (count) => `${count} result${count === 1 ? "" : "s"}`,
    availableAt: (time) => `Available at ${time}`
  }
};

function getLocalizedText(
  value: string | undefined,
  localized: Partial<Record<SiteLanguage, string>> | undefined,
  language: SiteLanguage
) {
  return localized?.[language] ?? value ?? "";
}

function getSlavicPlural(value: number, forms: [string, string, string]) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }

  return forms[2];
}

function formatDistance(value: number | null, language: SiteLanguage) {
  const t = catalogCopy[language];

  if (value === null) {
    return t.distanceUnknown;
  }

  return value < 1 ? t.distanceUnderOne : t.distanceFromYou(value);
}

function formatPrice(value: number, language: SiteLanguage) {
  return new Intl.NumberFormat(catalogCopy[language].locale, {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatDateTime(date: string, time: string, language: SiteLanguage) {
  const t = catalogCopy[language];
  if (!date && !time) {
    return t.anyTime;
  }

  const parts: string[] = [];

  if (date) {
    parts.push(
      new Intl.DateTimeFormat(t.locale, {
        day: "numeric",
        month: "short"
      }).format(new Date(`${date}T00:00:00`))
    );
  }

  if (time) {
    parts.push(time);
  }

  return parts.join(" · ");
}

function shouldShowAvailabilityChip(result: PublicSearchResult, language: SiteLanguage) {
  const disabledLabel = catalogCopy[language].onlineBookingDisabled;
  const candidate = getLocalizedText(
    result.availabilityLabel,
    result.localizedAvailabilityLabel,
    language
  );

  if (!candidate.trim()) {
    return false;
  }

  return !(candidate === disabledLabel && !result.onlineBookingEnabled);
}

export default function CatalogView({
  results,
  query,
  kind,
  date,
  time,
  location,
  hasCoords,
  initialLanguage = "ru"
}: CatalogViewProps) {
  const language = useSiteLanguage(initialLanguage, true);
  const t = catalogCopy[language];

  return (
    <main className="catalog-shell">
      <section className="catalog-hero">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{query ? t.searchTitle(query) : t.defaultTitle}</h1>
          <p className="hero-text">{t.heroText}</p>
        </div>

        <div className="catalog-filters">
          <span>{t.resultCount(results.length)}</span>
          <span>{t.kindLabel(kind)}</span>
          <span>{formatDateTime(date, time, language)}</span>
          <span>{hasCoords ? t.sortedByDistance : location || t.withoutGeolocation}</span>
        </div>
      </section>

      <section className="catalog-grid">
        {results.map((result, index) => (
          <article key={result.id} className={`catalog-card ${["accent-coral", "accent-forest", "accent-sand"][index % 3]}`}>
            <img className="catalog-card-image" src={result.image} alt={result.title} />
            <div className="catalog-card-top">
              <p>{getLocalizedText(result.category, result.localizedCategory, language)}</p>
              <span>{t.resultType(result.type)}</span>
            </div>

            <div>
              <h2>{result.title}</h2>
              <p className="catalog-description">
                {getLocalizedText(result.subtitle, result.localizedSubtitle, language)} · {getLocalizedText(result.address, result.localizedAddress, language)}
              </p>
            </div>

            <div className="catalog-meta">
              <strong>
                {result.services[0]
                  ? t.priceFrom(formatPrice(Math.min(...result.services.map((service) => service.price || 0)), language))
                  : t.pricePending}
              </strong>
              <span>{`${result.rating} · ${t.reviewCount(result.reviews)} · ${formatDistance(result.distanceKm, language)}`}</span>
            </div>

            <div className="chip-row">
              {shouldShowAvailabilityChip(result, language) ? (
                <span className={`chip ${result.available ? "chip-success" : "chip-muted"}`}>
                  {getLocalizedText(result.availabilityLabel, result.localizedAvailabilityLabel, language) || (time ? t.availableAt(time) : t.chooseTime)}
                </span>
              ) : null}
              <span className={`chip ${result.onlineBookingEnabled ? "chip-success" : "chip-muted"}`}>
                {result.onlineBookingEnabled ? t.onlineBookingEnabled : t.onlineBookingDisabled}
              </span>
              {result.services.slice(0, 5).map((service) => (
                <span key={service.id} className="chip">
                  {getLocalizedText(service.name, service.localizedName, language)}
                </span>
              ))}
              {result.services.length > 5 ? (
                <span className="chip">{`+${result.services.length - 5}`}</span>
              ) : null}
            </div>

            <Link
              href={
                result.id.startsWith("mock_")
                  ? getLocalizedPath(language, `/salons/${result.id.replace("mock_", "")}`)
                  : getLocalizedPath(
                      language,
                      `/businesses/${getPublicBusinessPathId({
                        id: result.id,
                        name: result.title
                      })}`
                    )
              }
              className="primary-button"
            >
              {result.onlineBookingEnabled ? t.action : t.viewProfile}
            </Link>
          </article>
        ))}
        {results.length === 0 ? (
          <div className="catalog-empty">
            <h2>{t.emptyTitle}</h2>
            <p>{t.emptyText}</p>
            <Link href={getLocalizedPath(language)} className="primary-button">{t.backToSearch}</Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
