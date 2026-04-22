import CatalogView from "./CatalogView";
import { filterPublicSearchResults, getPublicSearchIndex } from "../../lib/public-search";

export const dynamic = "force-dynamic";

type CatalogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = (await searchParams) ?? {};
  const query = getParam(params, "query") ?? "";
  const kind = getParam(params, "kind") ?? "";
  const date = getParam(params, "date") ?? "";
  const time = getParam(params, "time") ?? "";
  const location = getParam(params, "location") ?? "";
  const lat = Number(getParam(params, "lat"));
  const lon = Number(getParam(params, "lon"));
  const publicParams = {
    query,
    kind,
    date,
    time,
    location,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null
  };
  const index = await getPublicSearchIndex(publicParams);
  const results = filterPublicSearchResults(index, publicParams);
  return (
    <CatalogView
      results={results}
      query={query}
      kind={kind}
      date={date}
      time={time}
      location={location}
      hasCoords={publicParams.lat !== null && publicParams.lon !== null}
    />
  );
}
