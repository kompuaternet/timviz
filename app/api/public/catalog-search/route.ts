import { NextResponse } from "next/server";
import { toPublicCatalogCardResults } from "../../../../lib/public-catalog";
import {
  filterPublicSearchResults,
  getPublicSearchIndex,
  type PublicSearchParams
} from "../../../../lib/public-search";
import { isSiteLanguage } from "../../../../lib/site-language";

const DEFAULT_CACHE_HEADER = "public, s-maxage=30, stale-while-revalidate=300";
const HOT_CACHE_HEADER = "public, s-maxage=15, stale-while-revalidate=120";

function getParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key)?.trim() ?? "";
}

function toNumberOrNull(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = getParam(searchParams, "query");
    const kind = getParam(searchParams, "kind");
    const date = getParam(searchParams, "date");
    const time = getParam(searchParams, "time");
    const location = getParam(searchParams, "location");
    const requestedLanguage = getParam(searchParams, "lang");
    const lat = toNumberOrNull(getParam(searchParams, "lat"));
    const lon = toNumberOrNull(getParam(searchParams, "lon"));
    const language = isSiteLanguage(requestedLanguage) ? requestedLanguage : "ru";

    const publicParams: PublicSearchParams = {
      query,
      kind,
      date,
      time,
      location,
      lat,
      lon
    };

    const searchIndex = await getPublicSearchIndex(publicParams);
    const filteredResults = filterPublicSearchResults(searchIndex, publicParams);
    const results = toPublicCatalogCardResults(filteredResults, language, {
      maxServicesPerCard: 5,
      maxResults: 72
    });

    const hasHeavyFilters = Boolean(query || date || time || location || kind || lat !== null || lon !== null);

    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control": hasHeavyFilters ? HOT_CACHE_HEADER : DEFAULT_CACHE_HEADER
        }
      }
    );
  } catch {
    return NextResponse.json(
      { results: [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30"
        }
      }
    );
  }
}
