"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicSearchIndex, PublicSearchSuggestion } from "../lib/public-search";
import { getLocalizedPath, type SiteLanguage, withEnglishFallback, withExtraLanguageFallbacks } from "../lib/site-language";

type SearchKind = "all" | "procedure" | "business" | "professional";
type ActivePanel = "search" | "location" | "time" | null;
type PublicLanguage = SiteLanguage;

type PublicSearchProps = {
  index: PublicSearchIndex;
  language?: PublicLanguage;
  initialQuery?: string;
  initialKind?: string;
  initialLocation?: string;
  initialDate?: string;
  initialTime?: string;
  initialCoords?: { lat: number; lon: number } | null;
};

type AddressSuggestion = {
  id: string;
  label: string;
  details: string;
  lat: number;
  lon: number;
};

const searchCopy = withExtraLanguageFallbacks({
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
    searchingAddress: "Ищем адрес...",
    pickAddress: "Выбрать адрес",
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
    searchingAddress: "Шукаємо адресу...",
    pickAddress: "Вибрати адресу",
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
    searchingAddress: "Searching address...",
    pickAddress: "Pick address",
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
}, {
  fr: {
    allServices: "Tous les services",
    searchAria: "Service, lieu ou professionnel",
    currentLocation: "Position actuelle",
    myLocation: "Ma position actuelle",
    anyTime: "N’importe quand",
    search: "Rechercher",
    all: "Tout",
    procedures: "Services",
    businesses: "Lieux",
    professionals: "Professionnels",
    byDistance: "par distance",
    nothingFound: "Aucun résultat. Essayez un service, un professionnel ou un lieu.",
    locating: "Localisation...",
    geoSorted: "Les résultats seront triés par distance",
    where: "Où chercher ?",
    whereText: "Utilisez votre position ou indiquez une ville.",
    useLocation: "Utiliser ma position",
    useLocationHint: "Si le navigateur l’autorise, nous trierons par distance.",
    cityLabel: "Ville ou quartier",
    cityPlaceholder: "Par exemple, Kyiv ou Varsovie",
    searchingAddress: "Recherche d’adresse...",
    pickAddress: "Choisir l’adresse",
    choose: "Choisir",
    anyDay: "N’importe quel jour",
    today: "Aujourd’hui",
    tomorrow: "Demain",
    chooseTime: "Choisir l’heure",
    morning: "Matin",
    day: "Journée",
    evening: "Soir",
    distanceKm: (value: number) => `${value} km`,
    weekdays: ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"],
    locale: "fr-FR"
  },
  pl: {
    allServices: "Wszystkie usługi",
    searchAria: "Usługa, miejsce lub specjalista",
    currentLocation: "Aktualna lokalizacja",
    myLocation: "Moja aktualna lokalizacja",
    anyTime: "Dowolny termin",
    search: "Szukaj",
    all: "Wszystko",
    procedures: "Usługi",
    businesses: "Miejsca",
    professionals: "Specjaliści",
    byDistance: "według odległości",
    nothingFound: "Brak wyników. Spróbuj wpisać usługę, specjalistę lub miejsce.",
    locating: "Ustalanie lokalizacji...",
    geoSorted: "Wyniki posortujemy według odległości",
    where: "Gdzie szukać?",
    whereText: "Użyj aktualnej lokalizacji albo wpisz miasto.",
    useLocation: "Użyj mojej lokalizacji",
    useLocationHint: "Jeśli przeglądarka pozwoli, posortujemy według odległości.",
    cityLabel: "Miasto lub dzielnica",
    cityPlaceholder: "Na przykład Kyiv albo Warszawa",
    searchingAddress: "Szukamy adresu...",
    pickAddress: "Wybierz adres",
    choose: "Wybierz",
    anyDay: "Dowolny dzień",
    today: "Dzisiaj",
    tomorrow: "Jutro",
    chooseTime: "Wybierz godzinę",
    morning: "Rano",
    day: "Dzień",
    evening: "Wieczór",
    distanceKm: (value: number) => `${value} km`,
    weekdays: ["pon", "wt", "śr", "czw", "pt", "sob", "nd"],
    locale: "pl-PL"
  },
  cs: {
    allServices: "Všechny služby",
    searchAria: "Služba, podnik nebo profesionál",
    currentLocation: "Aktuální poloha",
    myLocation: "Moje aktuální poloha",
    anyTime: "Kdykoliv",
    search: "Hledat",
    all: "Vše",
    procedures: "Služby",
    businesses: "Podniky",
    professionals: "Profesionálové",
    byDistance: "podle vzdálenosti",
    nothingFound: "Nic jsme nenašli. Zkuste službu, profesionála nebo název podniku.",
    locating: "Zjišťujeme polohu...",
    geoSorted: "Výsledky se seřadí podle vzdálenosti",
    where: "Kde hledat?",
    whereText: "Použijte aktuální polohu nebo zadejte město.",
    useLocation: "Použít moji polohu",
    useLocationHint: "Pokud prohlížeč povolí přístup, seřadíme podle vzdálenosti.",
    cityLabel: "Město nebo čtvrť",
    cityPlaceholder: "Například Kyjev nebo Praha",
    searchingAddress: "Hledáme adresu...",
    pickAddress: "Vybrat adresu",
    choose: "Vybrat",
    anyDay: "Libovolný den",
    today: "Dnes",
    tomorrow: "Zítra",
    chooseTime: "Vyberte čas",
    morning: "Ráno",
    day: "Den",
    evening: "Večer",
    distanceKm: (value: number) => `${value} km`,
    weekdays: ["po", "út", "st", "čt", "pá", "so", "ne"],
    locale: "cs-CZ"
  },
  es: {
    allServices: "Todos los servicios",
    searchAria: "Servicio, local o profesional",
    currentLocation: "Ubicación actual",
    myLocation: "Mi ubicación actual",
    anyTime: "Cualquier hora",
    search: "Buscar",
    all: "Todo",
    procedures: "Servicios",
    businesses: "Locales",
    professionals: "Profesionales",
    byDistance: "por distancia",
    nothingFound: "No hay resultados. Prueba con un servicio, profesional o local.",
    locating: "Localizando...",
    geoSorted: "Ordenaremos los resultados por distancia",
    where: "¿Dónde buscar?",
    whereText: "Usa tu ubicación actual o escribe una ciudad.",
    useLocation: "Usar mi ubicación",
    useLocationHint: "Si el navegador lo permite, ordenaremos por distancia.",
    cityLabel: "Ciudad o zona",
    cityPlaceholder: "Por ejemplo, Kyiv o Madrid",
    searchingAddress: "Buscando dirección...",
    pickAddress: "Elegir dirección",
    choose: "Elegir",
    anyDay: "Cualquier día",
    today: "Hoy",
    tomorrow: "Mañana",
    chooseTime: "Elegir hora",
    morning: "Mañana",
    day: "Día",
    evening: "Tarde",
    distanceKm: (value: number) => `${value} km`,
    weekdays: ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"],
    locale: "es-ES"
  },
  de: {
    allServices: "Alle Leistungen",
    searchAria: "Leistung, Ort oder Profi",
    currentLocation: "Aktueller Standort",
    myLocation: "Mein aktueller Standort",
    anyTime: "Beliebige Zeit",
    search: "Suchen",
    all: "Alle",
    procedures: "Leistungen",
    businesses: "Orte",
    professionals: "Profis",
    byDistance: "nach Entfernung",
    nothingFound: "Keine Ergebnisse. Suche nach Leistung, Profi oder Ort.",
    locating: "Standort wird ermittelt...",
    geoSorted: "Ergebnisse werden nach Entfernung sortiert",
    where: "Wo suchen?",
    whereText: "Nutze deinen Standort oder gib eine Stadt ein.",
    useLocation: "Meinen Standort nutzen",
    useLocationHint: "Wenn der Browser es erlaubt, sortieren wir nach Entfernung.",
    cityLabel: "Stadt oder Bezirk",
    cityPlaceholder: "Zum Beispiel Kyiv oder Berlin",
    searchingAddress: "Adresse wird gesucht...",
    pickAddress: "Adresse wählen",
    choose: "Wählen",
    anyDay: "Beliebiger Tag",
    today: "Heute",
    tomorrow: "Morgen",
    chooseTime: "Zeit wählen",
    morning: "Morgen",
    day: "Tag",
    evening: "Abend",
    distanceKm: (value: number) => `${value} km`,
    weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    locale: "de-DE"
  }
}) satisfies Record<PublicLanguage, {
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
  searchingAddress: string;
  pickAddress: string;
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
  return localized?.[language] ?? localized?.en ?? value ?? "";
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

const locationSuggestions: Record<PublicLanguage, string[]> = withEnglishFallback<string[]>({
  ru: ["Киев", "Днепр", "Кривой Рог", "Львов", "Одесса", "Харьков"],
  uk: ["Київ", "Дніпро", "Кривий Ріг", "Львів", "Одеса", "Харків"],
  en: ["Kyiv", "Dnipro", "Kryvyi Rih", "Lviv", "Odesa", "Kharkiv"]
});

Object.assign(locationSuggestions, {
  fr: ["Kyiv", "Dnipro", "Kryvyï Rih", "Lviv", "Odessa", "Kharkiv"],
  pl: ["Kijów", "Dnipro", "Krzywy Róg", "Lwów", "Odessa", "Charków"],
  cs: ["Kyjev", "Dnipro", "Kryvyj Rih", "Lvov", "Oděsa", "Charkov"],
  es: ["Kyiv", "Dnipro", "Kryvyi Rih", "Lviv", "Odesa", "Járkiv"],
  de: ["Kyjiw", "Dnipro", "Krywyj Rih", "Lwiw", "Odessa", "Charkiw"]
});

export default function PublicSearch({
  index,
  language = "ru",
  initialQuery,
  initialKind,
  initialLocation,
  initialDate,
  initialTime,
  initialCoords
}: PublicSearchProps) {
  const router = useRouter();
  const t = searchCopy[language];
  const initialKindValue: SearchKind =
    initialKind === "procedure" || initialKind === "business" || initialKind === "professional"
      ? initialKind
      : "all";
  const hasInitialCoords =
    typeof initialCoords?.lat === "number" &&
    Number.isFinite(initialCoords.lat) &&
    typeof initialCoords?.lon === "number" &&
    Number.isFinite(initialCoords.lon);
  const initialLocationValue = (initialLocation ?? "").trim();
  const [query, setQuery] = useState((initialQuery ?? "").trim());
  const [kind, setKind] = useState<SearchKind>(initialKindValue);
  const [location, setLocation] = useState(
    initialLocationValue || (hasInitialCoords ? t.myLocation : t.currentLocation)
  );
  const [locationInput, setLocationInput] = useState(initialLocationValue);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    hasInitialCoords ? { lat: initialCoords!.lat, lon: initialCoords!.lon } : null
  );
  const [date, setDate] = useState((initialDate ?? "").trim());
  const [time, setTime] = useState((initialTime ?? "").trim());
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [geoStatus, setGeoStatus] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
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

  useEffect(() => {
    const value = locationInput.trim();
    if (value.length < 3 || activePanel !== "location") {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(
          `/api/address/search?q=${encodeURIComponent(value)}&lang=${encodeURIComponent(language)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setAddressSuggestions([]);
          return;
        }

        const payload = (await response.json()) as {
          results?: Array<{
            place_id?: number | string;
            display_name?: string;
            lat?: string;
            lon?: string;
            address?: Record<string, string>;
          }>;
        };

        const nextSuggestions =
          payload.results
            ?.map((item) => {
              const lat = Number(item.lat);
              const lon = Number(item.lon);
              if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
                return null;
              }

              const address = item.address ?? {};
              const house = address.house_number ?? "";
              const street = address.road ?? address.pedestrian ?? address.footway ?? address.neighbourhood ?? "";
              const city = address.city ?? address.town ?? address.village ?? address.municipality ?? "";
              const region = address.state ?? address.region ?? address.county ?? "";
              const country = address.country ?? "";
              const postcode = address.postcode ?? "";
              const primary = [house, street].filter(Boolean).join(" ").trim() || item.display_name || value;
              const details = [city, region, postcode, country].filter(Boolean).join(", ");

              return {
                id: String(item.place_id ?? `${lat}:${lon}:${primary}`),
                label: primary,
                details,
                lat,
                lon
              } satisfies AddressSuggestion;
            })
            .filter((item): item is AddressSuggestion => Boolean(item)) ?? [];

        setAddressSuggestions(nextSuggestions.slice(0, 6));
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          setAddressSuggestions([]);
        }
      } finally {
        setIsSearchingAddress(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activePanel, language, locationInput]);

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

    router.push(`${getLocalizedPath(language, "/catalog")}${params.toString() ? `?${params.toString()}` : ""}`);
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

  function selectAddressSuggestion(item: AddressSuggestion) {
    const label = item.details ? `${item.label}, ${item.details}` : item.label;
    setLocation(label);
    setLocationInput(label);
    setCoords({ lat: item.lat, lon: item.lon });
    setGeoStatus(t.geoSorted);
    setAddressSuggestions([]);
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

          {isSearchingAddress ? <div className="public-location-status">{t.searchingAddress}</div> : null}

          {addressSuggestions.length ? (
            <div className="public-location-suggestions">
              {addressSuggestions.map((item) => (
                <button key={item.id} type="button" onClick={() => selectAddressSuggestion(item)}>
                  <span>
                    <strong>{item.label}</strong>
                    {item.details ? <small>{item.details}</small> : null}
                  </span>
                  <em>{t.pickAddress}</em>
                </button>
              ))}
            </div>
          ) : null}

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
