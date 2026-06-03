type GeocodePoint = {
  lat: number;
  lon: number;
  displayName: string;
};

const GEOCODE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const geocodeCache = new Map<string, { expiresAt: number; value: GeocodePoint | null }>();

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  ё: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};

function normalizeGeocodeQuery(query: string) {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function transliterateCyrillic(value: string) {
  return value
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
}

function buildVariants(query: string) {
  const base = query.trim().replace(/\s+/g, " ");
  const variants = [
    base,
    `${base}, Україна`,
    `${base}, Украина`,
    `${base}, Ukraine`
  ];
  const transliterated = transliterateCyrillic(base);
  if (transliterated && transliterated !== base.toLowerCase()) {
    variants.push(transliterated, `${transliterated}, Ukraine`);
  }

  return [...new Set(variants.map((value) => value.trim()).filter(Boolean))].slice(0, 6);
}

type NominatimResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

async function geocodeViaNominatim(query: string, language: "ru" | "uk" | "en") {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&accept-language=${language},uk,ru,en&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TimvizPublicCatalog/1.0 (location-geocode)"
    },
    next: { revalidate: 60 * 30 }
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as NominatimResult[];
  const first = payload[0];
  if (!first) {
    return null;
  }

  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return {
    lat,
    lon,
    displayName: first.display_name ?? query
  } satisfies GeocodePoint;
}

export async function resolveLocationPoint(query: string, language: "ru" | "uk" | "en" = "ru") {
  const normalized = normalizeGeocodeQuery(query);
  if (!normalized || normalized.length < 2) {
    return null;
  }

  const cached = geocodeCache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const variants = buildVariants(query);
  let resolved: GeocodePoint | null = null;

  for (const variant of variants) {
    // Nominatim public API is rate-limited. One lookup per search request.
    // We try several variants only until first successful coordinate response.
    resolved = await geocodeViaNominatim(variant, language);
    if (resolved) {
      break;
    }
  }

  geocodeCache.set(normalized, {
    expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS,
    value: resolved
  });
  return resolved;
}
