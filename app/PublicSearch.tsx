"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicSearchIndex, PublicSearchSuggestion } from "../lib/public-search";

type SearchKind = "all" | "procedure" | "business" | "professional";
type ActivePanel = "search" | "location" | "time" | null;
type PublicLanguage = "ru" | "uk" | "en";

type PublicSearchProps = {
  index: PublicSearchIndex;
  language?: PublicLanguage;
};

const searchCopy = {
  ru: {
    allServices: "Все услуги",
    searchAria: "Услуга, заведение или профессионал",
    currentLocation: "Текущее местоположение",
    myLocation: "Моё текущее местоположение",
    anyTime: "Любое время",
    search: "Поиск",
    all: "Все",
    procedures: "Процедуры",
    businesses: "Заведения",
    professionals: "Профессионалы",
    byDistance: "по расстоянию",
    nothingFound: "Ничего не нашли. Можно искать по услуге, мастеру или названию заведения.",
    locating: "Определяем...",
    geoSorted: "Результаты отсортируем по расстоянию",
    where: "Где искать?",
    whereText: "Можно включить текущее местоположение или указать город вручную.",
    useLocation: "Использовать моё местоположение",
    useLocationHint: "Если браузер разрешит доступ, отсортируем по расстоянию.",
    cityLabel: "Город или район",
    cityPlaceholder: "Например, Киев или Кривой Рог",
    choose: "Выбрать",
    anyDay: "Любой день",
    today: "Сегодня",
    tomorrow: "Завтра",
    chooseTime: "Выберите время",
    morning: "Утро",
    day: "День",
    evening: "Вечер",
    lessThanOneKm: "<1 км",
    distanceKm: (value: number) => `${value} км`,
    weekdays: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
    locale: "ru-RU"
  },
  uk: {
    allServices: "Усі послуги",
    searchAria: "Послуга, заклад або професіонал",
    currentLocation: "Поточне місцезнаходження",
    myLocation: "Моє поточне місцезнаходження",
    anyTime: "Будь-який час",
    search: "Пошук",
    all: "Усе",
    procedures: "Процедури",
    businesses: "Заклади",
    professionals: "Професіонали",
    byDistance: "за відстанню",
    nothingFound: "Нічого не знайшли. Можна шукати за послугою, майстром або назвою закладу.",
    locating: "Визначаємо...",
    geoSorted: "Результати відсортуємо за відстанню",
    where: "Де шукати?",
    whereText: "Можна увімкнути поточне місцезнаходження або вказати місто вручну.",
    useLocation: "Використати моє місцезнаходження",
    useLocationHint: "Якщо браузер дозволить доступ, відсортуємо за відстанню.",
    cityLabel: "Місто або район",
    cityPlaceholder: "Наприклад, Київ або Кривий Ріг",
    choose: "Вибрати",
    anyDay: "Будь-який день",
    today: "Сьогодні",
    tomorrow: "Завтра",
    chooseTime: "Виберіть час",
    morning: "Ранок",
    day: "День",
    evening: "Вечір",
    lessThanOneKm: "<1 км",
    distanceKm: (value: number) => `${value} км`,
    weekdays: ["пн", "вт", "ср", "чт", "пт", "сб", "нд"],
    locale: "uk-UA"
  },
  en: {
    allServices: "All services",
    searchAria: "Service, venue or professional",
    currentLocation: "Current location",
    myLocation: "My current location",
    anyTime: "Any time",
    search: "Search",
    all: "All",
    procedures: "Services",
    businesses: "Venues",
    professionals: "Professionals",
    byDistance: "by distance",
    nothingFound: "No results yet. Try a service, professional or venue name.",
    locating: "Locating...",
    geoSorted: "Results will be sorted by distance",
    where: "Where to search?",
    whereText: "Use your current location or enter a city manually.",
    useLocation: "Use my location",
    useLocationHint: "If the browser allows access, results will be sorted by distance.",
    cityLabel: "City or area",
    cityPlaceholder: "For example, Kyiv or Kryvyi Rih",
    choose: "Choose",
    anyDay: "Any day",
    today: "Today",
    tomorrow: "Tomorrow",
    chooseTime: "Choose time",
    morning: "Morning",
    day: "Day",
    evening: "Evening",
    lessThanOneKm: "<1 km",
    distanceKm: (value: number) => `${value} km`,
    weekdays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    locale: "en-US"
  }
} satisfies Record<PublicLanguage, {
  allServices: string;
  searchAria: string;
  currentLocation: string;
  myLocation: string;
  anyTime: string;
  search: string;
  all: string;
  procedures: string;
  businesses: string;
  professionals: string;
  byDistance: string;
  nothingFound: string;
  locating: string;
  geoSorted: string;
  where: string;
  whereText: string;
  useLocation: string;
  useLocationHint: string;
  cityLabel: string;
  cityPlaceholder: string;
  choose: string;
  anyDay: string;
  today: string;
  tomorrow: string;
  chooseTime: string;
  morning: string;
  day: string;
  evening: string;
  lessThanOneKm: string;
  distanceKm: (value: number) => string;
  weekdays: string[];
  locale: string;
}>;

const defaultLocationLabels = Object.values(searchCopy).flatMap((item) => [
  item.currentLocation,
  item.myLocation
]);

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function CalendarMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3.5V7M16 3.5V7M4 10h16" />
    </svg>
  );
}

function getLocalizedText(
  value: string | undefined,
  localized: Partial<Record<PublicLanguage, string>> | undefined,
  language: PublicLanguage
) {
  return localized?.[language] ?? value ?? "";
}

function getSearchableText(
  value: string | undefined,
  localized: Partial<Record<PublicLanguage, string>> | undefined
) {
  return [value, localized?.ru, localized?.uk, localized?.en].filter(Boolean).join(" ").toLowerCase();
}

function formatDistance(
  value: number | null,
  byDistance: string,
  lessThanOneKm: string,
  distanceKm: (value: number) => string
) {
  if (value === null) {
    return byDistance;
  }

  return value < 1 ? lessThanOneKm : distanceKm(value);
}

function todayKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(value: string, locale: string, anyDay: string) {
  if (!value) {
    return anyDay;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short"
  }).format(new Date(`${value}T00:00:00`));
}

function addMonths(date: Date, value: number) {
  return new Date(date.getFullYear(), date.getMonth() + value, 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthDays(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (start.getDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - offset);

  return Array.from({ length: 35 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);

    return {
      date: day,
      key: toDateKey(day),
      day: day.getDate(),
      inMonth: day.getMonth() === month.getMonth()
    };
  });
}

function monthTitle(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric"
  }).format(date).replace(".", "");
}

const locationSuggestions: Record<PublicLanguage, string[]> = {
  ru: ["Киев", "Днепр", "Кривой Рог", "Львов", "Одесса", "Харьков"],
  uk: ["Київ", "Дніпро", "Кривий Ріг", "Львів", "Одеса", "Харків"],
  en: ["Kyiv", "Dnipro", "Kryvyi Rih", "Lviv", "Odesa", "Kharkiv"]
};

export default function PublicSearch({ index, language = "ru" }: PublicSearchProps) {
  const router = useRouter();
  const t = searchCopy[language];
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<SearchKind>("all");
  const [location, setLocation] = useState(t.currentLocation);
  const [locationInput, setLocationInput] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [geoStatus, setGeoStatus] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const timePresets = useMemo(
    () => [
      { label: t.anyTime, hint: "", value: "" },
      { label: t.morning, hint: "09 - 12", value: "09:00" },
      { label: t.day, hint: "12 - 17", value: "12:00" },
      { label: t.evening, hint: "17 - 00", value: "17:00" }
    ],
    [t.anyTime, t.day, t.evening, t.morning]
  );

  useEffect(() => {
    setLocation((currentLocation) => {
      if (!defaultLocationLabels.includes(currentLocation)) {
        return currentLocation;
      }

      return coords ? t.myLocation : t.currentLocation;
    });
  }, [coords, t.currentLocation, t.myLocation]);

  const counts = useMemo(
    () => ({
      procedure: index.suggestions.filter((item) => item.type === "procedure").length,
      business: index.suggestions.filter((item) => item.type === "business").length,
      professional: index.suggestions.filter((item) => item.type === "professional").length
    }),
    [index.suggestions]
  );

  const filteredSuggestions = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return index.suggestions
      .filter((item) => kind === "all" || item.type === kind)
      .filter((item) => {
        if (!normalized) {
          return true;
        }

        return [
          getSearchableText(item.title, item.localizedTitle),
          getSearchableText(item.subtitle, item.localizedSubtitle),
          getSearchableText(item.category, item.localizedCategory)
        ]
          .join(" ")
          .includes(normalized);
      })
      .slice(0, 12);
  }, [index.suggestions, kind, query]);

  const monthDays = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const selectedTimeLabel = date || time ? `${formatDateLabel(date || todayKey(0), t.locale, t.anyDay)}${time ? `, ${time}` : ""}` : t.anyTime;

  function submitSearch() {
    const params = new URLSearchParams();
    const trimmed = query.trim();

    if (trimmed) params.set("query", trimmed);
    if (kind !== "all") params.set("kind", kind);
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (locationInput.trim()) params.set("location", locationInput.trim());
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lon", String(coords.lon));
    }

    router.push(`/catalog${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function selectSuggestion(item: PublicSearchSuggestion) {
    setQuery(getLocalizedText(item.title, item.localizedTitle, language));
    setKind(item.type);
    setActivePanel(null);
  }

  function requestLocation() {
    setGeoStatus(t.locating);

    if (!navigator.geolocation) {
      setGeoStatus("");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setLocation(t.myLocation);
        setLocationInput("");
        setGeoStatus(t.geoSorted);
      },
      () => {
        setCoords(null);
        setLocation(t.currentLocation);
        setGeoStatus("");
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
  }

  function useManualLocation(value: string) {
    const nextValue = value.trim();
    if (!nextValue) {
      return;
    }

    setLocation(nextValue);
    setLocationInput(nextValue);
    setCoords(null);
    setGeoStatus("");
    setActivePanel(null);
  }

  return (
    <div className={`public-search-wrap ${activePanel ? `public-search-wrap-open public-search-wrap-${activePanel}` : ""}`}>
      <form
        className="public-search"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <label className={activePanel === "search" ? "public-search-field-active" : ""}>
          <SearchIcon />
          <input
            name="query"
            value={query}
            placeholder={t.allServices}
            aria-label={t.searchAria}
            onChange={(event) => {
              setQuery(event.target.value);
              setActivePanel("search");
            }}
            onFocus={() => setActivePanel("search")}
          />
        </label>
        <button type="button" className="public-search-location" onClick={() => setActivePanel(activePanel === "location" ? null : "location")}>
          <PinIcon />
          <span>{location}</span>
        </button>
        <button type="button" className="public-search-time" onClick={() => setActivePanel(activePanel === "time" ? null : "time")}>
          <CalendarMiniIcon />
          <span>{selectedTimeLabel}</span>
        </button>
        <button type="submit">{t.search}</button>
      </form>

      {activePanel === "search" ? (
        <div className="public-search-panel public-suggestion-panel">
          <div className="public-search-tabs">
            <button className={kind === "all" ? "active" : ""} type="button" onClick={() => setKind("all")}>{t.all}</button>
            <button className={kind === "procedure" ? "active" : ""} type="button" onClick={() => setKind("procedure")}>{t.procedures} <span>{counts.procedure}</span></button>
            <button className={kind === "business" ? "active" : ""} type="button" onClick={() => setKind("business")}>{t.businesses} <span>{counts.business}</span></button>
            <button className={kind === "professional" ? "active" : ""} type="button" onClick={() => setKind("professional")}>{t.professionals} <span>{counts.professional}</span></button>
          </div>

          <div className="public-suggestion-list">
            {filteredSuggestions.map((item) => (
              <button key={item.id} type="button" onClick={() => selectSuggestion(item)}>
                {item.image ? <img src={item.image} alt="" /> : <span className="public-suggestion-icon">{item.type === "procedure" ? "✦" : item.type === "business" ? "⌂" : "◦"}</span>}
                <span>
                  <strong>{getLocalizedText(item.title, item.localizedTitle, language)}</strong>
                  <small>{getLocalizedText(item.subtitle, item.localizedSubtitle, language)}</small>
                </span>
                <em>{formatDistance(item.distanceKm, t.byDistance, t.lessThanOneKm, t.distanceKm)}</em>
              </button>
            ))}
            {filteredSuggestions.length === 0 ? <p>{t.nothingFound}</p> : null}
          </div>
        </div>
      ) : null}

      {activePanel === "location" ? (
        <div className="public-search-panel public-location-panel">
          <div className="public-location-head">
            <strong>{t.where}</strong>
            <p>{t.whereText}</p>
          </div>

          <button type="button" className="public-location-current" onClick={requestLocation}>
            <PinIcon />
            <span>
              <strong>{t.useLocation}</strong>
              <small>{t.useLocationHint}</small>
            </span>
          </button>

          <form
            className="public-location-form"
            onSubmit={(event) => {
              event.preventDefault();
              useManualLocation(locationInput);
            }}
          >
            <label>
              <span>{t.cityLabel}</span>
              <input
                value={locationInput}
                placeholder={t.cityPlaceholder}
                onChange={(event) => {
                  setLocationInput(event.target.value);
                  setGeoStatus("");
                }}
              />
            </label>
            <button type="submit" disabled={!locationInput.trim()}>{t.choose}</button>
          </form>

          <div className="public-location-chips">
            {locationSuggestions[language].map((item) => (
              <button key={item} type="button" onClick={() => useManualLocation(item)}>
                {item}
              </button>
            ))}
          </div>

          {geoStatus ? <p className="public-location-status">{geoStatus}</p> : null}
        </div>
      ) : null}

      {activePanel === "time" ? (
        <div className="public-search-panel public-time-panel">
          <div className="public-time-calendar">
            <div className="public-time-shortcuts">
              <button type="button" className={date === todayKey(0) ? "active" : ""} onClick={() => setDate(todayKey(0))}>
                <strong>{t.today}</strong>
                <span>{formatDateLabel(todayKey(0), t.locale, t.anyDay)}</span>
              </button>
              <button type="button" className={date === todayKey(1) ? "active" : ""} onClick={() => setDate(todayKey(1))}>
                <strong>{t.tomorrow}</strong>
                <span>{formatDateLabel(todayKey(1), t.locale, t.anyDay)}</span>
              </button>
            </div>
            <div className="public-month-picker">
              <div className="public-month-head">
                <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, -1))}>‹</button>
                <strong>{monthTitle(visibleMonth, t.locale)}</strong>
                <button type="button" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>›</button>
              </div>
              <div className="public-month-weekdays">
                {t.weekdays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="public-month-grid">
                {monthDays.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    className={`${!day.inMonth ? "muted" : ""} ${date === day.key ? "active" : ""} ${day.key === todayKey(0) ? "today" : ""}`}
                    onClick={() => {
                      setDate(day.key);
                      if (monthKey(day.date) !== monthKey(visibleMonth)) {
                        setVisibleMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
                      }
                    }}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="public-time-presets">
            <span>{t.chooseTime}</span>
            {timePresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={time === preset.value ? "active" : ""}
                onClick={() => {
                  setTime(preset.value);
                  if (preset.value && !date) {
                    setDate(todayKey(0));
                  }
                }}
              >
                <strong>{preset.label}</strong>
                {preset.hint ? <small>{preset.hint}</small> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {geoStatus && activePanel !== "location" ? <div className="public-geo-status">{geoStatus}</div> : null}
    </div>
  );
}
