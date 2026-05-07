import type { SiteLanguage } from "./site-language";
import type { PublicSearchResult } from "./public-search";

export type PublicCatalogCardService = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
};

export type PublicCatalogCardResult = {
  id: string;
  pathId: string;
  type: "business" | "professional";
  title: string;
  subtitle: string;
  category: string;
  address: string;
  distanceKm: number | null;
  rating: string;
  reviews: number;
  available: boolean;
  availabilityLabel: string;
  image: string;
  onlineBookingEnabled: boolean;
  minPrice: number | null;
  services: PublicCatalogCardService[];
  extraServicesCount: number;
  lat: number | null;
  lon: number | null;
};

function localize(
  value: string,
  localized: Partial<Record<SiteLanguage, string>> | undefined,
  language: SiteLanguage
) {
  return localized?.[language]?.trim() || value;
}

export function toPublicCatalogCardResults(
  results: PublicSearchResult[],
  language: SiteLanguage,
  options: { maxServicesPerCard?: number; maxResults?: number } = {}
) {
  const maxServicesPerCard = Math.max(1, options.maxServicesPerCard ?? 5);
  const maxResults = Math.max(1, options.maxResults ?? 72);

  return results.slice(0, maxResults).map((result): PublicCatalogCardResult => {
    const visibleServices = result.services.slice(0, maxServicesPerCard);
    const prices = result.services
      .map((service) => service.price)
      .filter((price): price is number => Number.isFinite(price) && price > 0);

    const pathIdRaw = typeof result.pathId === "string" ? result.pathId.trim() : "";
    const safePathId =
      pathIdRaw.length > 0 && pathIdRaw.toLowerCase() !== "undefined"
        ? pathIdRaw
        : result.id;

    return {
      id: result.id,
      pathId: safePathId,
      type: result.type,
      title: result.title,
      subtitle: localize(result.subtitle, result.localizedSubtitle, language),
      category: localize(result.category, result.localizedCategory, language),
      address: localize(result.address, result.localizedAddress, language),
      distanceKm: result.distanceKm,
      rating: result.rating,
      reviews: result.reviews,
      available: result.available,
      availabilityLabel: localize(
        result.availabilityLabel,
        result.localizedAvailabilityLabel,
        language
      ),
      image: result.image,
      onlineBookingEnabled: result.onlineBookingEnabled,
      minPrice: prices.length ? Math.min(...prices) : null,
      services: visibleServices.map((service) => ({
        id: service.id,
        name: localize(service.name, service.localizedName, language),
        price: service.price || 0,
        durationMinutes: service.durationMinutes || 60
      })),
      extraServicesCount: Math.max(0, result.services.length - visibleServices.length),
      lat: result.lat ?? null,
      lon: result.lon ?? null
    };
  });
}
