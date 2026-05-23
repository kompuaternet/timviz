"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  showAllServices: string;
  resultSummaryTitle: (count: number) => string;
  companiesForBooking: string;
  listTab: string;
  mapTab: string;
  nearYou: string;
  useMap: string;
  watchCompanies: (count: number) => string;
  onlineBookingShort: string;
  freeTimeShort: string;
  resetFilters: string;
  moreInProfile: (count: number) => string;
  goToProfile: string;
  minutes: string;
  hours: string;
};

const catalogCopy: Record<SiteLanguage, CatalogCopy> = {
  ru: {
    locale: "ru-RU",
    eyebrow: "Открытые профили Timviz",
    defaultTitle: "Поиск доступных профилей",
    searchTitle: (query) => `Поиск: ${query}`,
    heroText:
      "Некоторые мастера делают свой профиль видимым в поиске Timviz, чтобы клиентам было проще найти страницу для записи.",
    anyTime: "Любое время",
    withoutGeolocation: "Без геолокации",
    sortedByDistance: "Сортировка по расстоянию",
    pricePending: "Цена уточняется",
    chooseTime: "Есть свободное время",
    emptyTitle: "Пока ничего не найдено",
    emptyText: "Попробуйте изменить время, город или категорию.",
    backToSearch: "Вернуться к поиску",
    action: "Открыть и записаться",
    viewProfile: "Открыть карточку",
    onlineBookingEnabled: "Запись онлайн",
    onlineBookingDisabled: "Онлайн-запись выключена",
    distanceUnknown: "Геолокация не выбрана",
    distanceUnderOne: "Меньше 1 км от вас",
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
    loadError: "Не удалось загрузить профили. Обновите страницу или повторите поиск.",
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
    expandServices: "Показать услуги",
    collapseServices: "Скрыть услуги",
    showAllServices: "Показать все",
    resultSummaryTitle: (count) => `${count} ${getSlavicPlural(count, ["компания найдена", "компании найдено", "компаний найдено"])}`,
    companiesForBooking: "Компании для записи",
    listTab: "Список",
    mapTab: "Карта",
    nearYou: "Рядом с вами",
    useMap: "Использовать карту",
    watchCompanies: (count) => `↓ Смотреть ${count} ${getSlavicPlural(count, ["компанию", "компании", "компаний"])}`,
    onlineBookingShort: "Запись онлайн",
    freeTimeShort: "Есть свободное время",
    resetFilters: "Сбросить фильтры",
    moreInProfile: (count) => `Ещё ${count} в профиле`,
    goToProfile: "Перейти",
    minutes: "мин",
    hours: "ч"
  },
  uk: {
    locale: "uk-UA",
    eyebrow: "Відкриті профілі Timviz",
    defaultTitle: "Пошук доступних профілів",
    searchTitle: (query) => `Пошук: ${query}`,
    heroText:
      "Деякі майстри роблять свій профіль видимим у пошуку Timviz, щоб клієнтам було простіше знайти сторінку для запису.",
    anyTime: "Будь-який час",
    withoutGeolocation: "Без геолокації",
    sortedByDistance: "Сортування за відстанню",
    pricePending: "Ціну уточнюємо",
    chooseTime: "Є вільний час",
    emptyTitle: "Поки нічого не знайдено",
    emptyText: "Спробуйте змінити час, місто або категорію.",
    backToSearch: "Повернутися до пошуку",
    action: "Відкрити і записатися",
    viewProfile: "Відкрити картку",
    onlineBookingEnabled: "Онлайн-запис",
    onlineBookingDisabled: "Онлайн-запис вимкнено",
    distanceUnknown: "Геолокацію не вибрано",
    distanceUnderOne: "Менше 1 км від вас",
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
    loadError: "Не вдалося завантажити профілі. Оновіть сторінку або повторіть пошук.",
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
    expandServices: "Показати послуги",
    collapseServices: "Сховати послуги",
    showAllServices: "Показати всі",
    resultSummaryTitle: (count) => `${count} ${getSlavicPlural(count, ["компанію знайдено", "компанії знайдено", "компаній знайдено"])}`,
    companiesForBooking: "Компанії для запису",
    listTab: "Список",
    mapTab: "Карта",
    nearYou: "Поруч з вами",
    useMap: "Використовувати карту",
    watchCompanies: (count) => `↓ Дивитися ${count} ${getSlavicPlural(count, ["компанію", "компанії", "компаній"])}`,
    onlineBookingShort: "Онлайн-запис",
    freeTimeShort: "Є вільний час",
    resetFilters: "Скинути фільтри",
    moreInProfile: (count) => `Ще ${count} у профілі`,
    goToProfile: "Перейти",
    minutes: "хв",
    hours: "год"
  },
  en: {
    locale: "en-US",
    eyebrow: "Open Timviz profiles",
    defaultTitle: "Search available profiles",
    searchTitle: (query) => `Search: ${query}`,
    heroText:
      "Some professionals make their Timviz profile visible in search so clients can more easily find the booking page.",
    anyTime: "Any time",
    withoutGeolocation: "No geolocation",
    sortedByDistance: "Sorted by distance",
    pricePending: "Price on request",
    chooseTime: "Free time available",
    emptyTitle: "Nothing found yet",
    emptyText: "Try changing the time, city, or category.",
    backToSearch: "Back to search",
    action: "Open and book",
    viewProfile: "Open profile",
    onlineBookingEnabled: "Online booking",
    onlineBookingDisabled: "Online booking is off",
    distanceUnknown: "Geolocation not selected",
    distanceUnderOne: "Less than 1 km away",
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
    loadError: "Could not load profiles. Refresh the page or try your search again.",
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
    expandServices: "Show services",
    collapseServices: "Hide services",
    showAllServices: "Show all",
    resultSummaryTitle: (count) => `${count} compan${count === 1 ? "y" : "ies"} found`,
    companiesForBooking: "Companies to book",
    listTab: "List",
    mapTab: "Map",
    nearYou: "Near you",
    useMap: "Use map",
    watchCompanies: (count) => `↓ View ${count} compan${count === 1 ? "y" : "ies"}`,
    onlineBookingShort: "Online booking",
    freeTimeShort: "Free time available",
    resetFilters: "Reset filters",
    moreInProfile: (count) => `${count} more in profile`,
    goToProfile: "Open",
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

function formatServicesCount(value: number, language: SiteLanguage) {
  if (language === "uk") {
    return `${value} ${getSlavicPlural(value, ["послуга", "послуги", "послуг"])}`;
  }
  if (language === "ru") {
    return `${value} ${getSlavicPlural(value, ["услуга", "услуги", "услуг"])}`;
  }
  return `${value} service${value === 1 ? "" : "s"}`;
}

function normalizeServiceName(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function formatDistance(value: number | null, language: SiteLanguage) {
  const t = catalogCopy[language];

  if (value === null) {
    return t.distanceUnknown;
  }

  return value < 1 ? t.distanceUnderOne : t.distanceFromYou(value);
}

function compactAddress(value: string, language: SiteLanguage) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }

  const parts = normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 2) {
    return normalized;
  }

  const cityWords =
    language === "uk"
      ? ["місто", "м.", "київ", "дніпро", "львів", "одеса", "харків", "запоріжжя"]
      : language === "ru"
        ? ["город", "г.", "киев", "днепр", "львов", "одесса", "харьков", "запорожье"]
        : ["city", "kyiv", "dnipro", "lviv", "odesa", "kharkiv", "zaporizhzhia"];
  const streetWords =
    language === "uk"
      ? ["вулиця", "вул.", "проспект", "пр.", "площа", "провулок", "наб."]
      : language === "ru"
        ? ["улица", "ул.", "проспект", "пр.", "площадь", "переулок", "наб."]
        : ["street", "st.", "avenue", "ave", "road", "rd.", "boulevard", "blvd"];

  const hasDigit = (text: string) => /\d/.test(text);
  const containsAny = (text: string, words: string[]) =>
    words.some((word) => text.toLowerCase().includes(word));

  const streetCandidate =
    parts.find((item) => containsAny(item, streetWords) && hasDigit(item)) ??
    parts.find((item) => containsAny(item, streetWords)) ??
    parts.find((item) => hasDigit(item) && item.length <= 48) ??
    parts[0];

  const cityCandidate =
    [...parts].reverse().find((item) => containsAny(item, cityWords)) ??
    [...parts].reverse().find((item) => !hasDigit(item) && item.length <= 36) ??
    parts[parts.length - 1];

  const compact = cityCandidate && cityCandidate !== streetCandidate
    ? `${streetCandidate}, ${cityCandidate}`
    : streetCandidate;

  return compact.replace(/\s{2,}/g, " ").trim();
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

function resolveBusinessPathId(item: Pick<PublicCatalogCardResult, "id" | "pathId">) {
  const rawPathId = typeof item.pathId === "string" ? item.pathId.trim() : "";
  if (rawPathId.length > 0 && rawPathId.toLowerCase() !== "undefined") {
    return rawPathId;
  }

  return item.id;
}

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
  normalizedQuery,
  onSelect,
  onScrollToList
}: {
  language: SiteLanguage;
  results: PublicCatalogCardResult[];
  selectedId: string;
  searchLat: number | null;
  searchLon: number | null;
  normalizedQuery: string;
  onSelect: (id: string) => void;
  onScrollToList: () => void;
}) {
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const [mobileMapInteractive, setMobileMapInteractive] = useState(false);
  const [mapReady, setMapReady] = useState(false);
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

      if (window.matchMedia("(max-width: 768px)").matches) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.scrollWheelZoom.disable();
        map.doubleClickZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
      }
      setMapReady(true);
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapStateRef.current) {
        mapStateRef.current.map.remove();
        mapStateRef.current = null;
      }
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const state = mapStateRef.current;
    if (!state || typeof window === "undefined") {
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const shouldDisable = isMobile && !mobileMapInteractive;
    const interactionHandlers = [
      state.map.dragging,
      state.map.touchZoom,
      state.map.scrollWheelZoom,
      state.map.doubleClickZoom,
      state.map.boxZoom,
      state.map.keyboard
    ];

    for (const handler of interactionHandlers) {
      if (shouldDisable) {
        handler.disable();
      } else {
        handler.enable();
      }
    }
  }, [mapReady, mobileMapInteractive, results.length]);

  useEffect(() => {
    const state = mapStateRef.current;
    if (!state) {
      return;
    }

    const { L, markersLayer, markersById } = state;
    markersLayer.clearLayers();
    markersById.clear();

    for (const point of mapPoints) {
      const popupUrl = getLocalizedPath(language, `/businesses/${resolveBusinessPathId(point.item)}`);
      const matchedServices = normalizedQuery
        ? point.item.services.filter((service) =>
            normalizeServiceName(service.name).includes(normalizedQuery)
          )
        : [];
      const topService = normalizedQuery ? matchedServices[0] : null;
      const servicesCount = point.item.services.length + point.item.extraServicesCount;
      const popupHtml = `
        <a class="catalog-map-popup-card" href="${popupUrl}">
          <img src="${escapeHtml(point.item.image)}" alt="${escapeHtml(point.item.title)}" />
          <div class="catalog-map-popup-body">
            <div class="catalog-map-popup-row">
              <strong>${escapeHtml(point.item.title)}</strong>
              <span>★ ${escapeHtml(point.item.rating)} (${point.item.reviews})</span>
            </div>
            <small>${escapeHtml(formatDistance(point.item.distanceKm, language))} · ${escapeHtml(compactAddress(point.item.address, language))}</small>
            ${
              topService
                ? `<div class="catalog-map-popup-service"><b>${escapeHtml(topService.name)}</b><span>${escapeHtml(
                    formatServiceDuration(topService.durationMinutes, language)
                  )}${topService.price > 0 ? ` · ${escapeHtml(formatPrice(topService.price, language))}` : ""}</span></div>`
                : `<div class="catalog-map-popup-service"><b>${escapeHtml(formatServicesCount(servicesCount, language))}</b></div>`
            }
            <span class="catalog-map-popup-open">${escapeHtml(catalogCopy[language].goToProfile)}</span>
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
  }, [language, mapPoints, mapReady, normalizedQuery, onSelect, searchLat, searchLon]);

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
      const currentZoom = state.map.getZoom();
      state.map.setView([selected.lat as number, selected.lon as number], Math.max(Number.isFinite(currentZoom) ? currentZoom : 13, 13), {
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
  }, [datasetKey, mapPoints, mapReady, results, searchLat, searchLon, selectedId]);

  return (
    <aside className="catalog-map-full">
      <div ref={mapHostRef} className="catalog-map-canvas" aria-label={catalogCopy[language].mapHint} />
      {!mobileMapInteractive ? (
        <button type="button" className="catalog-map-use-button" onClick={() => setMobileMapInteractive(true)}>
          {catalogCopy[language].useMap}
        </button>
      ) : null}
      {results.length > 0 ? (
        <button type="button" className="catalog-map-list-button" onClick={onScrollToList}>
          {catalogCopy[language].watchCompanies(results.length)}
        </button>
      ) : null}
    </aside>
  );
}

export default function CatalogView({
  initialLanguage = "ru",
  searchIndex
}: CatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useSiteLanguage(initialLanguage, true);
  const t = catalogCopy[language];
  const [results, setResults] = useState<PublicCatalogCardResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [expandedServicesById, setExpandedServicesById] = useState<Record<string, boolean>>({});
  const [servicesByResultId, setServicesByResultId] = useState<Record<string, PublicCatalogCardResult["services"]>>({});
  const [loadingServicesById, setLoadingServicesById] = useState<Record<string, boolean>>({});
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

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
  const normalizedQuery = query.trim().toLowerCase();

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
          setResults(
            cached.results.map((item) => ({
              ...item,
              pathId: resolveBusinessPathId(item)
            }))
          );
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
        const nextResults = Array.isArray(payload.results)
          ? payload.results.map((item) => ({
              ...item,
              pathId: resolveBusinessPathId(item)
            }))
          : [];
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
    setServicesByResultId({});
    setLoadingServicesById({});
  }, [results]);

  useEffect(() => {
    if (hasCoords) {
      return;
    }
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    const autoGeoKey = "timviz.catalog.autogeo.v1";
    if (window.sessionStorage.getItem(autoGeoKey) === "done") {
      return;
    }

    window.sessionStorage.setItem(autoGeoKey, "done");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", String(position.coords.latitude));
        params.set("lon", String(position.coords.longitude));
        const nextUrl = `${getLocalizedPath(language, "/catalog")}?${params.toString()}`;
        router.replace(nextUrl, { scroll: false });
      },
      () => {
        // Permission denied or unavailable: keep current behavior.
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 120000 }
    );
  }, [hasCoords, language, router, searchParams]);

  function selectResult(id: string, scrollIntoView = false) {
    setSelectedResultId(id);
    if (scrollIntoView) {
      cardRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }

  function scrollToList() {
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToMap() {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const catalogLabel = language === "en" ? "Profiles" : language === "uk" ? "Профілі" : "Профили";
  const menuLabel = language === "en" ? "Menu" : "Меню";
  const menuSearchLabel = language === "en" ? "Search and filters" : language === "uk" ? "Пошук і фільтри" : "Поиск и фильтры";
  const menuResultsLabel = language === "en" ? "Results" : language === "uk" ? "Результати" : "Результаты";
  const menuMapLabel = language === "en" ? "Map" : language === "uk" ? "Карта" : "Карта";
  const navLabel = language === "en" ? "Profile search navigation" : language === "uk" ? "Навігація пошуку профілів" : "Навигация поиска профилей";
  async function toggleServices(result: PublicCatalogCardResult) {
    const id = result.id;
    selectResult(id);

    if (expandedServicesById[id]) {
      setExpandedServicesById((current) => ({
        ...current,
        [id]: false
      }));
      return;
    }

    if (!servicesByResultId[id]) {
      setLoadingServicesById((current) => ({ ...current, [id]: true }));
      try {
        const response = await fetch(
          `/api/public/catalog-services?id=${encodeURIComponent(resolveBusinessPathId(result))}&lang=${language}`
        );
        if (!response.ok) {
          throw new Error("Services request failed");
        }
        const payload = (await response.json()) as { services?: PublicCatalogCardResult["services"] };
        setServicesByResultId((current) => ({
          ...current,
          [id]: Array.isArray(payload.services) ? payload.services : []
        }));
      } catch {
        setServicesByResultId((current) => ({
          ...current,
          [id]: []
        }));
      } finally {
        setLoadingServicesById((current) => ({ ...current, [id]: false }));
      }
    }

    setExpandedServicesById((current) => ({
      ...current,
      [id]: true
    }));
  }

  return (
    <main className="company-page catalog-page">
      <header className="public-header company-header">
        <Link className="public-logo" href={getLocalizedPath(language)}>
          <BrandLogo />
        </Link>
        <nav className="public-nav" aria-label={navLabel}>
          <PublicHeaderAuthMenu language={language} />
          <Link href={getLocalizedPath(language, "/catalog")} className="public-login">
            {catalogLabel}
          </Link>
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

          <div className="catalog-mobile-summary">
            <div>
              <strong>{t.resultSummaryTitle(results.length)}</strong>
              <span>{hasCoords ? t.nearYou : t.distanceUnknown}</span>
            </div>
            <div className="catalog-mobile-switch" aria-label={menuResultsLabel}>
              <button type="button" className="is-active" onClick={scrollToList}>{t.listTab}</button>
              <button type="button" onClick={scrollToMap}>{t.mapTab}</button>
            </div>
          </div>

          <div className="catalog-mobile-sticky">
            <strong>{t.resultSummaryTitle(results.length)}</strong>
            <div className="catalog-mobile-switch" aria-label={menuResultsLabel}>
              <button type="button" className="is-active" onClick={scrollToList}>{t.listTab}</button>
              <button type="button" onClick={scrollToMap}>{t.mapTab}</button>
            </div>
          </div>
        </section>

        <section id="catalog-results" className="catalog-results-layout">
          <div className="catalog-results-column" ref={listRef}>
            <div className="catalog-results-toolbar">
              <div>
                <strong>{t.companiesForBooking}</strong>
                <span>{`${t.resultCount(results.length)}${hasCoords ? "" : ` · ${t.distanceUnknown.toLowerCase()}`}`}</span>
              </div>
            </div>

	            {loading ? (
	              <div className="catalog-loading-list" aria-label={t.loading}>
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="catalog-card-skeleton">
                      <span />
                      <div>
                        <b />
                        <i />
                        <i />
                      </div>
                    </div>
                  ))}
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
	                    <Link href={getLocalizedPath(language, "/catalog")} className="primary-button">{t.resetFilters}</Link>
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
                        {(() => {
                          const isExpanded = Boolean(expandedServicesById[result.id]);
                          const hasLoadedServices = Object.prototype.hasOwnProperty.call(servicesByResultId, result.id);
                          const loadedServices = hasLoadedServices ? servicesByResultId[result.id] ?? [] : result.services;
                          const isLoadingServices = Boolean(loadingServicesById[result.id]);
                          const totalServices = hasLoadedServices ? loadedServices.length : loadedServices.length + result.extraServicesCount;
                          const matchedServices = normalizedQuery
                            ? loadedServices.filter((service) =>
                                normalizeServiceName(service.name).includes(normalizedQuery)
                              )
                            : loadedServices;
                          const previewLimit = 3;
                          const canToggleServices = totalServices > 0;
                          const servicesToRender = isExpanded
                            ? matchedServices
                            : normalizedQuery
                              ? matchedServices.slice(0, previewLimit)
                              : [];
                          const servicesLabel = formatServicesCount(totalServices, language);

                          return (
                            <>
                        <div className="catalog-result-head">
                          <h2 className="company-name">{result.title}</h2>
                          <strong className="catalog-rating-badge">
                            <span aria-hidden="true">★</span>
                            {`${result.rating} · ${result.reviews}`}
                          </strong>
                        </div>

                        <div className="catalog-result-main">
                          <img className="catalog-card-image company-image" src={result.image} alt={result.title} />
                          <div className="catalog-result-copy">
                            <p className="catalog-description address">{compactAddress(result.address, language) || formatDistance(result.distanceKm, language)}</p>
                            <div className="catalog-card-facts">
                              <span>{servicesLabel}</span>
                              <span className={result.onlineBookingEnabled ? "catalog-online-status" : "catalog-offline-status"}>
                                {result.onlineBookingEnabled ? `● ${t.onlineBookingShort}` : t.onlineBookingDisabled}
                              </span>
                            </div>
                            {shouldShowAvailabilityChip(result, language) && result.available ? (
                              <span className="catalog-free-time">{t.freeTimeShort}</span>
                            ) : null}
                          </div>
                        </div>

                        {servicesToRender.length > 0 ? (
                          <div className="catalog-result-services compact">
                            {servicesToRender.map((service) => (
                                  <div key={service.id} className="catalog-result-service-row">
                                    <div>
                                      <strong>{service.name}</strong>
	                                    <span>{formatServiceDuration(service.durationMinutes, language)}</span>
	                                  </div>
                                    <span>{service.price > 0 ? formatPrice(service.price, language) : t.pricePending}</span>
                                  </div>
                                ))}
                          </div>
                        ) : isExpanded && !isLoadingServices ? (
                          <div className="catalog-result-services compact">
                            <div className="catalog-result-service-row catalog-result-service-note">
                              <div>
                                <strong>{t.emptyTitle}</strong>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="catalog-result-actions">
                          <Link
                            href={getLocalizedPath(language, `/businesses/${resolveBusinessPathId(result)}`)}
                            className="catalog-expand-button"
                          >
                            {result.onlineBookingEnabled ? t.action : t.viewProfile}
                          </Link>
                          {canToggleServices ? (
                            <button
                              type="button"
                              className="catalog-result-more catalog-result-more-button"
                              disabled={isLoadingServices}
                              onClick={() => void toggleServices(result)}
                            >
                              {isLoadingServices ? t.loading : isExpanded ? t.collapseServices : t.expandServices}
                            </button>
                          ) : null}
                        </div>
                            </>
                          );
                        })()}
                      </article>
                    ))}
                  </div>
	                )}
	              </>
	            ) : null}
          </div>

          {loading || results.length > 0 ? (
            <div id="catalog-map" className="catalog-map-column" ref={mapSectionRef}>
              {loading ? (
                <div className="catalog-map-full catalog-map-skeleton" aria-label={t.loading} />
              ) : (
                <CatalogResultsMap
                  language={language}
                  results={results}
                  selectedId={selectedResultId}
                  searchLat={lat}
                  searchLon={lon}
                  normalizedQuery={normalizedQuery}
                  onSelect={(id) => selectResult(id, true)}
                  onScrollToList={scrollToList}
                />
              )}
            </div>
          ) : null}
        </section>
      </section>
    </main>
	  );
}
