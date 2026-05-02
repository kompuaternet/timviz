"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicCatalogCardResult } from "../../lib/public-catalog";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import PublicHeaderAuthMenu from "../PublicHeaderAuthMenu";
import { useSiteLanguage } from "../useSiteLanguage";

type CatalogViewProps = {
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
  resultType: (type: PublicCatalogCardResult["type"]) => string;
  priceFrom: (price: string) => string;
  distanceFromYou: (value: number) => string;
  reviewCount: (count: number) => string;
  resultCount: (count: number) => string;
  availableAt: (time: string) => string;
  loading: string;
  loadingText: string;
  loadError: string;
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
    availableAt: (time) => `Свободно на ${time}`,
    loading: "Загружаем результаты",
    loadingText: "Собираем свободные окна и актуальные карточки. Обычно это занимает несколько секунд.",
    loadError: "Не удалось загрузить каталог. Обновите страницу или повторите поиск."
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
    availableAt: (time) => `Є вікно на ${time}`,
    loading: "Завантажуємо результати",
    loadingText: "Збираємо вільні вікна й актуальні картки. Зазвичай це займає кілька секунд.",
    loadError: "Не вдалося завантажити каталог. Оновіть сторінку або повторіть пошук."
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
    availableAt: (time) => `Available at ${time}`,
    loading: "Loading results",
    loadingText: "Collecting available slots and fresh business cards. This usually takes a few seconds.",
    loadError: "Could not load the catalog. Refresh the page or try your search again."
  }
};

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

function shouldShowAvailabilityChip(result: PublicCatalogCardResult, language: SiteLanguage) {
  const disabledLabel = catalogCopy[language].onlineBookingDisabled;
  const candidate = result.availabilityLabel;

  if (!candidate.trim()) {
    return false;
  }

  return !(candidate === disabledLabel && !result.onlineBookingEnabled);
}

export default function CatalogView({
  initialLanguage = "ru"
}: CatalogViewProps) {
  const searchParams = useSearchParams();
  const language = useSiteLanguage(initialLanguage, true);
  const t = catalogCopy[language];
  const [results, setResults] = useState<PublicCatalogCardResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const query = useMemo(() => searchParams.get("query")?.trim() ?? "", [searchParams]);
  const kind = useMemo(() => searchParams.get("kind")?.trim() ?? "", [searchParams]);
  const date = useMemo(() => searchParams.get("date")?.trim() ?? "", [searchParams]);
  const time = useMemo(() => searchParams.get("time")?.trim() ?? "", [searchParams]);
  const location = useMemo(() => searchParams.get("location")?.trim() ?? "", [searchParams]);
  const lat = useMemo(() => {
    const raw = searchParams.get("lat");
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  }, [searchParams]);
  const lon = useMemo(() => {
    const raw = searchParams.get("lon");
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  }, [searchParams]);
  const hasCoords = lat !== null && lon !== null;

  const searchQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (kind) params.set("kind", kind);
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (location) params.set("location", location);
    params.set("lang", language);
    if (typeof lat === "number" && Number.isFinite(lat)) params.set("lat", String(lat));
    if (typeof lon === "number" && Number.isFinite(lon)) params.set("lon", String(lon));
    return params;
  }, [date, kind, language, lat, location, lon, query, time]);

  useEffect(() => {
    const params = new URLSearchParams(searchQuery);
    const storageKey = `timviz.catalog.v2.${params.toString()}`;
    const now = Date.now();
    const ttlMs = 30 * 1000;
    const cachedRaw = window.sessionStorage.getItem(storageKey);

    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as {
          createdAt?: number;
          results?: PublicCatalogCardResult[];
        };
        if (
          typeof cached.createdAt === "number" &&
          now - cached.createdAt < ttlMs &&
          Array.isArray(cached.results)
        ) {
          setResults(cached.results);
          setLoading(false);
          setLoadFailed(false);
          return;
        }
      } catch {
        window.sessionStorage.removeItem(storageKey);
      }
    }

    setLoading(true);
    setLoadFailed(false);

    const controller = new AbortController();

    fetch(`/api/public/catalog-search?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Catalog API request failed");
        }

        const payload = (await response.json()) as { results?: PublicCatalogCardResult[] };
        const nextResults = Array.isArray(payload.results) ? payload.results : [];
        setResults(nextResults);
        setLoadFailed(false);
        setLoading(false);
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            createdAt: now,
            results: nextResults
          })
        );
      })
      .catch((error) => {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }

        setResults([]);
        setLoadFailed(true);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [searchQuery]);

  const catalogLabel = language === "en" ? "Catalog" : "Каталог";
  const menuLabel = language === "en" ? "Menu" : "Меню";
  const menuSearchLabel = language === "en" ? "Search and filters" : language === "uk" ? "Пошук і фільтри" : "Поиск и фильтры";
  const menuResultsLabel = language === "en" ? "Results" : language === "uk" ? "Результати" : "Результаты";
  const navLabel = language === "en" ? "Catalog navigation" : language === "uk" ? "Навігація каталогу" : "Навигация каталога";

  return (
    <main className="company-page catalog-page">
      <header className="public-header company-header">
        <a className="public-logo" href={getLocalizedPath(language)}>
          <BrandLogo />
        </a>
        <nav className="public-nav" aria-label={navLabel}>
          <PublicHeaderAuthMenu language={language} />
          <a href={getLocalizedPath(language, "/catalog")} className="public-login">
            {catalogLabel}
          </a>
          <details className="public-menu">
            <summary>
              <span>{menuLabel}</span>
              <span className="public-burger" aria-hidden="true" />
            </summary>
            <div className="public-menu-panel">
              <a href="#catalog-hero">{menuSearchLabel}</a>
              <a href="#catalog-results">{menuResultsLabel}</a>
            </div>
          </details>
          <GlobalLanguageSwitcher mode="inline" />
        </nav>
      </header>

      <section className="catalog-shell">
        <section id="catalog-hero" className="catalog-hero">
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

        <section id="catalog-results" className="catalog-grid">
          {loading ? (
            <div className="catalog-empty">
              <h2>{t.loading}</h2>
              <p>{t.loadingText}</p>
            </div>
          ) : null}
          {loadFailed ? (
            <div className="catalog-empty">
              <h2>{t.emptyTitle}</h2>
              <p>{t.loadError}</p>
              <Link href={getLocalizedPath(language, "/catalog")} className="primary-button">{t.backToSearch}</Link>
            </div>
          ) : null}
          {!loading && !loadFailed ? (
            <>
          {results.map((result, index) => (
            <article key={result.id} className={`catalog-card ${["accent-coral", "accent-forest", "accent-sand"][index % 3]}`}>
              <img className="catalog-card-image" src={result.image} alt={result.title} />
              <div className="catalog-card-top">
                <p>{result.category}</p>
                <span>{t.resultType(result.type)}</span>
              </div>

              <div>
                <h2>{result.title}</h2>
                <p className="catalog-description">
                  {result.subtitle} · {result.address}
                </p>
              </div>

              <div className="catalog-meta">
                <strong>
                  {typeof result.minPrice === "number" && result.minPrice > 0
                    ? t.priceFrom(formatPrice(result.minPrice, language))
                    : t.pricePending}
                </strong>
                <span>{`${result.rating} · ${t.reviewCount(result.reviews)} · ${formatDistance(result.distanceKm, language)}`}</span>
              </div>

              <div className="chip-row">
                {shouldShowAvailabilityChip(result, language) ? (
                  <span className={`chip ${result.available ? "chip-success" : "chip-muted"}`}>
                    {result.availabilityLabel || (time ? t.availableAt(time) : t.chooseTime)}
                  </span>
                ) : null}
                <span className={`chip ${result.onlineBookingEnabled ? "chip-success" : "chip-muted"}`}>
                  {result.onlineBookingEnabled ? t.onlineBookingEnabled : t.onlineBookingDisabled}
                </span>
                {result.services.slice(0, 5).map((service) => (
                  <span key={service.id} className="chip">
                    {service.name}
                  </span>
                ))}
                {result.extraServicesCount > 0 ? (
                  <span className="chip">{`+${result.extraServicesCount}`}</span>
                ) : null}
              </div>

              <Link
                href={getLocalizedPath(language, `/businesses/${result.pathId}`)}
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
            </>
          ) : null}
        </section>
      </section>
    </main>
  );
}
