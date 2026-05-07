"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PublicCatalogCardResult } from "../../lib/public-catalog";
import type { PublicSearchIndex } from "../../lib/public-search";
import { getLocalizedPath, type SiteLanguage } from "../../lib/site-language";
import BrandLogo from "../BrandLogo";
import GlobalLanguageSwitcher from "../GlobalLanguageSwitcher";
import PublicSearch from "../PublicSearch";
import PublicHeaderAuthMenu from "../PublicHeaderAuthMenu";
import { useSiteLanguage } from "../useSiteLanguage";

type CatalogViewProps = {
  initialLanguage?: SiteLanguage;
  searchIndex: PublicSearchIndex;
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
  mapTitle: string;
  mapHint: string;
  showMap: string;
  hideMap: string;
  servicesMore: (count: number) => string;
  searchPlaceholder: string;
  mapAreaPlaceholder: string;
  searchButton: string;
  venuesTab: string;
  prosTab: string;
  allTab: string;
  expandServices: string;
  collapseServices: string;
  moreInProfile: (count: number) => string;
  minutes: string;
  hours: string;
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
    loadError: "Не удалось загрузить каталог. Обновите страницу или повторите поиск.",
    mapTitle: "Карта рядом",
    mapHint: "Точки компаний на карте",
    showMap: "Показать карту",
    hideMap: "Скрыть карту",
    servicesMore: (count) => `Посмотреть ещё ${count} услуг`,
    searchPlaceholder: "Все услуги",
    mapAreaPlaceholder: "Область карты",
    searchButton: "Поиск",
    venuesTab: "Заведения",
    prosTab: "Профессионалы",
    allTab: "Все",
    expandServices: "Развернуть",
    collapseServices: "Свернуть",
    moreInProfile: (count) => `Ещё ${count} в профиле`,
    minutes: "мин",
    hours: "ч"
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
    loadError: "Не вдалося завантажити каталог. Оновіть сторінку або повторіть пошук.",
    mapTitle: "Карта поруч",
    mapHint: "Точки компаній на карті",
    showMap: "Показати карту",
    hideMap: "Сховати карту",
    servicesMore: (count) => `Переглянути ще ${count} послуг`,
    searchPlaceholder: "Усі послуги",
    mapAreaPlaceholder: "Область карти",
    searchButton: "Пошук",
    venuesTab: "Заклади",
    prosTab: "Професіонали",
    allTab: "Усі",
    expandServices: "Розгорнути",
    collapseServices: "Згорнути",
    moreInProfile: (count) => `Ще ${count} у профілі`,
    minutes: "хв",
    hours: "год"
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
    loadError: "Could not load the catalog. Refresh the page or try your search again.",
    mapTitle: "Nearby map",
    mapHint: "Company points on map",
    showMap: "Show map",
    hideMap: "Hide map",
    servicesMore: (count) => `View ${count} more services`,
    searchPlaceholder: "All services",
    mapAreaPlaceholder: "Map area",
    searchButton: "Search",
    venuesTab: "Venues",
    prosTab: "Professionals",
    allTab: "All",
    expandServices: "Expand",
    collapseServices: "Collapse",
    moreInProfile: (count) => `${count} more in profile`,
    minutes: "min",
    hours: "h"
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

function formatServiceDuration(minutes: number, language: SiteLanguage) {
  const t = catalogCopy[language];
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return `0 ${t.minutes}`;
  }
  if (minutes >= 60 && minutes % 60 === 0) {
    return `${minutes / 60} ${t.hours}`;
  }
  return `${minutes} ${t.minutes}`;
}

function shouldShowAvailabilityChip(result: PublicCatalogCardResult, language: SiteLanguage) {
  const disabledLabel = catalogCopy[language].onlineBookingDisabled;
  const candidate = result.availabilityLabel ?? "";

  if (!candidate.trim()) {
    return false;
  }

  return !(candidate === disabledLabel && !result.onlineBookingEnabled);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type CatalogMapPoint = {
  key: string;
  lat: number;
  lon: number;
  label: string;
  primaryId: string;
  active: boolean;
  item: PublicCatalogCardResult;
};

function buildMapPoints(results: PublicCatalogCardResult[], selectedId: string): CatalogMapPoint[] {
  const pointsByCoords = new Map<string, PublicCatalogCardResult[]>();

  for (const item of results) {
    if (!Number.isFinite(item.lat) || !Number.isFinite(item.lon)) {
      continue;
    }

    const key = `${item.lat!.toFixed(5)}:${item.lon!.toFixed(5)}`;
    const list = pointsByCoords.get(key) ?? [];
    list.push(item);
    pointsByCoords.set(key, list);
  }

  return [...pointsByCoords.entries()].map(([key, list]) => {
    const activeItem = list.find((item) => item.id === selectedId) ?? list[0]!;
    const label =
      list.length > 1
        ? String(list.length)
        : (activeItem.rating || "5")
            .replace(",", ".")
            .split(".")[0] || "5";

    return {
      key,
      lat: activeItem.lat as number,
      lon: activeItem.lon as number,
      label,
      primaryId: activeItem.id,
      active: list.some((item) => item.id === selectedId),
      item: activeItem
    };
  });
}

function CatalogResultsMap({
  language,
  results,
  selectedId,
  searchLat,
  searchLon,
  onSelect
}: {
  language: SiteLanguage;
  results: PublicCatalogCardResult[];
  selectedId: string;
  searchLat: number | null;
  searchLon: number | null;
  onSelect: (id: string) => void;
}) {
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapStateRef = useRef<{
    L: typeof import("leaflet");
    map: import("leaflet").Map;
    markersLayer: import("leaflet").LayerGroup;
    userMarker: import("leaflet").CircleMarker | null;
    markersById: Map<string, import("leaflet").Marker>;
    fittedKey: string;
  } | null>(null);

  const mapPoints = useMemo(() => buildMapPoints(results, selectedId), [results, selectedId]);
  const datasetKey = useMemo(
    () => mapPoints.map((point) => `${point.lat}:${point.lon}:${point.primaryId}`).join("|"),
    [mapPoints]
  );

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapHostRef.current || mapStateRef.current) {
        return;
      }

      const L = await import("leaflet");
      if (cancelled || !mapHostRef.current) {
        return;
      }

      const map = L.map(mapHostRef.current, {
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapStateRef.current = {
        L,
        map,
        markersLayer: L.layerGroup().addTo(map),
        userMarker: null,
        markersById: new Map(),
        fittedKey: ""
      };
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapStateRef.current) {
        mapStateRef.current.map.remove();
        mapStateRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const state = mapStateRef.current;
    if (!state) {
      return;
    }

    const { L, markersLayer, markersById } = state;
    markersLayer.clearLayers();
    markersById.clear();

    for (const point of mapPoints) {
      const popupUrl = getLocalizedPath(language, `/businesses/${point.item.pathId}`);
      const topService = point.item.services[0];
      const popupHtml = `
        <a class="catalog-map-popup-card" href="${popupUrl}">
          <img src="${escapeHtml(point.item.image)}" alt="${escapeHtml(point.item.title)}" />
          <div class="catalog-map-popup-body">
            <div class="catalog-map-popup-row">
              <strong>${escapeHtml(point.item.title)}</strong>
              <span>★ ${escapeHtml(point.item.rating)} (${point.item.reviews})</span>
            </div>
            <small>${escapeHtml(formatDistance(point.item.distanceKm, language))} · ${escapeHtml(point.item.address)}</small>
            ${
              topService
                ? `<div class="catalog-map-popup-service"><b>${escapeHtml(topService.name)}</b><span>${escapeHtml(
                    formatServiceDuration(topService.durationMinutes, language)
                  )}${topService.price > 0 ? ` · ${escapeHtml(formatPrice(topService.price, language))}` : ""}</span></div>`
                : ""
            }
          </div>
        </a>
      `;

      const marker = L.marker([point.lat, point.lon], {
        icon: L.divIcon({
          className: "catalog-map-marker-wrapper",
          html: `<span class="catalog-map-marker${point.active ? " is-active" : ""}">${point.label}</span>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      });
      marker.bindPopup(popupHtml, {
        closeButton: true,
        autoPan: true,
        minWidth: 280,
        maxWidth: 340,
        className: "catalog-map-popup-shell"
      });
      marker.on("click", () => onSelect(point.primaryId));
      marker.addTo(markersLayer);
      markersById.set(point.primaryId, marker);
    }

    if (state.userMarker) {
      state.userMarker.remove();
      state.userMarker = null;
    }

    if (Number.isFinite(searchLat) && Number.isFinite(searchLon)) {
      const marker = L.circleMarker([searchLat as number, searchLon as number], {
        radius: 6,
        color: "#4f46e5",
        weight: 2,
        fillColor: "#7c7cff",
        fillOpacity: 0.9
      });
      marker.addTo(state.map);
      state.userMarker = marker;
    }
  }, [mapPoints, onSelect, searchLat, searchLon]);

  useEffect(() => {
    const state = mapStateRef.current;
    if (!state) {
      return;
    }

    const selected = results.find((item) => item.id === selectedId);
    if (selected && Number.isFinite(selected.lat) && Number.isFinite(selected.lon)) {
      const selectedMarker = state.markersById.get(selected.id);
      if (selectedMarker) {
        selectedMarker.openPopup();
      }
      state.map.setView([selected.lat as number, selected.lon as number], Math.max(state.map.getZoom(), 13), {
        animate: true
      });
      return;
    }

    const fitKey = `${datasetKey}|${searchLat ?? ""}|${searchLon ?? ""}`;
    if (state.fittedKey === fitKey) {
      return;
    }
    state.fittedKey = fitKey;

    const boundsPoints: Array<[number, number]> = mapPoints.map((point) => [point.lat, point.lon]);
    if (Number.isFinite(searchLat) && Number.isFinite(searchLon)) {
      boundsPoints.push([searchLat as number, searchLon as number]);
    }

    if (boundsPoints.length === 0) {
      state.map.setView([50.4501, 30.5234], 10, { animate: false });
      return;
    }

    if (boundsPoints.length === 1) {
      state.map.setView(boundsPoints[0], 13, { animate: false });
      return;
    }

    state.map.fitBounds(boundsPoints, {
      padding: [24, 24],
      animate: false
    });
  }, [datasetKey, mapPoints, results, searchLat, searchLon, selectedId]);

  return (
    <aside className="catalog-map-full">
      <div ref={mapHostRef} className="catalog-map-canvas" aria-label={catalogCopy[language].mapHint} />
    </aside>
  );
}

export default function CatalogView({
  initialLanguage = "ru",
  searchIndex
}: CatalogViewProps) {
  const searchParams = useSearchParams();
  const language = useSiteLanguage(initialLanguage, true);
  const t = catalogCopy[language];
  const [results, setResults] = useState<PublicCatalogCardResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [expandedServicesById, setExpandedServicesById] = useState<Record<string, boolean>>({});
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

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
    const storageKey = `timviz.catalog.v3.${params.toString()}`;
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

  useEffect(() => {
    if (!results.length) {
      setSelectedResultId("");
      return;
    }
    setSelectedResultId((current) => (current && results.some((item) => item.id === current) ? current : results[0]!.id));
  }, [results]);

  useEffect(() => {
    setExpandedServicesById({});
  }, [results]);

  function selectResult(id: string, scrollIntoView = false) {
    setSelectedResultId(id);
    if (scrollIntoView) {
      cardRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }

  const catalogLabel = language === "en" ? "Catalog" : "Каталог";
  const menuLabel = language === "en" ? "Menu" : "Меню";
  const menuSearchLabel = language === "en" ? "Search and filters" : language === "uk" ? "Пошук і фільтри" : "Поиск и фильтры";
  const menuResultsLabel = language === "en" ? "Results" : language === "uk" ? "Результати" : "Результаты";
  const menuMapLabel = language === "en" ? "Map" : language === "uk" ? "Карта" : "Карта";
  const navLabel = language === "en" ? "Catalog navigation" : language === "uk" ? "Навігація каталогу" : "Навигация каталога";
  function toggleServices(id: string) {
    setExpandedServicesById((current) => ({
      ...current,
      [id]: !current[id]
    }));
  }

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
	              <a href="#catalog-map">{menuMapLabel}</a>
	            </div>
	          </details>
	          <GlobalLanguageSwitcher mode="inline" />
	        </nav>
	      </header>

      <section className="catalog-shell">
        <section id="catalog-hero" className="catalog-hero compact">
          <PublicSearch
            index={searchIndex}
            language={language}
            initialQuery={query}
            initialKind={kind}
            initialLocation={location}
            initialDate={date}
            initialTime={time}
            initialCoords={hasCoords ? { lat: lat as number, lon: lon as number } : null}
          />

          <div className="catalog-top-meta">
            <div className="catalog-filters inline">
              <span>{t.resultCount(results.length)}</span>
              <span>{formatDateTime(date, time, language)}</span>
              <span>{hasCoords ? t.sortedByDistance : location || t.withoutGeolocation}</span>
            </div>
          </div>
        </section>

        <section id="catalog-results" className="catalog-results-layout">
          <div className="catalog-results-column">
            <div className="catalog-results-toolbar">
              <strong>{t.resultCount(results.length)}</strong>
            </div>

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
	                {results.length === 0 ? (
	                  <div className="catalog-empty">
	                    <h2>{t.emptyTitle}</h2>
	                    <p>{t.emptyText}</p>
	                    <Link href={getLocalizedPath(language)} className="primary-button">{t.backToSearch}</Link>
	                  </div>
                ) : (
                  <div className="catalog-results-grid">
                    {results.map((result) => (
                      <article
	                        key={result.id}
	                        ref={(node) => {
	                          cardRefs.current[result.id] = node;
	                        }}
                        className={`catalog-result-card ${
                          selectedResultId === result.id ? "catalog-result-card-active" : ""
                        }`}
                        onMouseEnter={() => selectResult(result.id)}
                      >
                        <div className="catalog-result-main">
                          <img className="catalog-card-image" src={result.image} alt={result.title} />
                          <div className="catalog-result-copy">
                            <div className="catalog-result-head">
                              <h2>{result.title}</h2>
                              <strong>{`${result.rating} · ${t.reviewCount(result.reviews)}`}</strong>
                            </div>
                            <p className="catalog-description">{`${formatDistance(result.distanceKm, language)} · ${result.address}`}</p>
                            <div className="chip-row compact">
                              {shouldShowAvailabilityChip(result, language) ? (
                                <span className={`chip ${result.available ? "chip-success" : "chip-muted"}`}>
                                  {result.availabilityLabel || (time ? t.availableAt(time) : t.chooseTime)}
                                </span>
                              ) : null}
                              <span className={`chip ${result.onlineBookingEnabled ? "chip-success" : "chip-muted"}`}>
                                {result.onlineBookingEnabled ? t.onlineBookingEnabled : t.onlineBookingDisabled}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="catalog-result-services compact">
                          {result.services.slice(0, expandedServicesById[result.id] ? 5 : 3).map((service) => (
                            <div key={service.id} className="catalog-result-service-row">
                              <div>
                                <strong>{service.name}</strong>
	                                <span>{formatServiceDuration(service.durationMinutes, language)}</span>
	                              </div>
                              <span>{service.price > 0 ? formatPrice(service.price, language) : t.pricePending}</span>
                            </div>
                          ))}
                        </div>

                        <div className="catalog-result-actions">
                          {result.services.length > 3 || result.extraServicesCount > 0 ? (
                            <button
                              type="button"
                              className="catalog-expand-button"
                              onClick={() => toggleServices(result.id)}
                            >
                              {expandedServicesById[result.id] ? t.collapseServices : t.expandServices}
                            </button>
                          ) : null}
                          {result.extraServicesCount > 0 ? (
                            <Link href={getLocalizedPath(language, `/businesses/${result.pathId}`)} className="catalog-result-more">
                              {t.moreInProfile(result.extraServicesCount)}
                            </Link>
                          ) : null}
                          <Link
                            href={getLocalizedPath(language, `/businesses/${result.pathId}`)}
                            className="catalog-open-link"
                          >
                            {result.onlineBookingEnabled ? t.action : t.viewProfile}
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
	                )}
	              </>
	            ) : null}
          </div>

          <div id="catalog-map" className="catalog-map-column">
            <CatalogResultsMap
              language={language}
              results={results}
              selectedId={selectedResultId}
              searchLat={lat}
              searchLon={lon}
              onSelect={(id) => selectResult(id, true)}
            />
          </div>
        </section>
      </section>
    </main>
	  );
}
