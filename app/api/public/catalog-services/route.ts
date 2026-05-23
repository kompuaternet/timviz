import { NextResponse } from "next/server";
import type { LocalizedText } from "../../../../data/mock-data";
import { getPublicSearchIndex } from "../../../../lib/public-search";
import { isSiteLanguage, type SiteLanguage } from "../../../../lib/site-language";

const CACHE_HEADER = "public, s-maxage=60, stale-while-revalidate=300";

function getParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key)?.trim() ?? "";
}

function localize(value: string, localized: Partial<Record<SiteLanguage, string>> | LocalizedText | undefined, language: SiteLanguage) {
  return localized?.[language]?.trim() || value;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = getParam(searchParams, "id");
    const requestedLanguage = getParam(searchParams, "lang");
    const language = isSiteLanguage(requestedLanguage) ? requestedLanguage : "ru";

    if (!id) {
      return NextResponse.json({ services: [] }, { headers: { "Cache-Control": CACHE_HEADER } });
    }

    const searchIndex = await getPublicSearchIndex({});
    const result = searchIndex.results.find((item) => item.id === id || item.pathId === id);

    if (!result) {
      return NextResponse.json({ services: [] }, { status: 404, headers: { "Cache-Control": "public, s-maxage=15" } });
    }

    const services = result.services.map((service) => ({
      id: service.id,
      name: localize(service.name, service.localizedName, language),
      price: service.price || 0,
      durationMinutes: service.durationMinutes || 60
    }));

    return NextResponse.json(
      { services },
      {
        headers: {
          "Cache-Control": CACHE_HEADER
        }
      }
    );
  } catch {
    return NextResponse.json(
      { services: [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30"
        }
      }
    );
  }
}
