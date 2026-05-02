import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import CatalogView from "../../catalog/CatalogView";
import { getPublicCustomerCookieName, verifyPublicCustomerSession } from "../../../lib/public-customer-auth";
import { filterPublicSearchResults, getPublicSearchIndex } from "../../../lib/public-search";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { buildLanguageAlternates, buildMetadata, seoCopy } from "../../../lib/seo";
import { isSiteLanguage, type SiteLanguage } from "../../../lib/site-language";

export const dynamic = "force-dynamic";

type LocalizedCatalogPageProps = {
  params: Promise<{
    lang: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
  searchParams
}: LocalizedCatalogPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) {
    return {};
  }

  const paramsMap = (await searchParams) ?? {};
  const query = getParam(paramsMap, "query") ?? "";
  const location = getParam(paramsMap, "location") ?? "";
  const kind = getParam(paramsMap, "kind") ?? "";
  const baseCopy = seoCopy.catalog[lang];
  const titleParts = [baseCopy.title];

  if (query) {
    titleParts.unshift(
      lang === "uk"
        ? `${query} — онлайн-запис`
        : lang === "en"
          ? `${query} — online booking`
          : `${query} — онлайн-запись`
    );
  }

  if (location) {
    titleParts.unshift(location);
  }

  const descriptionParts = [baseCopy.description];
  if (query) {
    descriptionParts.unshift(
      lang === "uk"
        ? `Результати за запитом «${query}».`
        : lang === "en"
          ? `Search results for "${query}".`
          : `Результаты по запросу «${query}».`
    );
  }
  if (location) {
    descriptionParts.push(
      lang === "uk" ? `Локація: ${location}.` : lang === "en" ? `Location: ${location}.` : `Локация: ${location}.`
    );
  }
  if (kind) {
    descriptionParts.push(lang === "uk" ? `Тип: ${kind}.` : lang === "en" ? `Type: ${kind}.` : `Тип: ${kind}.`);
  }

  const metadata = buildMetadata(
    `/${lang}/catalog`,
    {
      title: titleParts.join(" | "),
      description: descriptionParts.join(" "),
      keywords: baseCopy.keywords
    },
    lang
  );

  return {
    ...metadata,
    alternates: buildLanguageAlternates("/catalog", lang)
  };
}

export default async function LocalizedCatalogPage({
  params,
  searchParams
}: LocalizedCatalogPageProps) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const paramsMap = (await searchParams) ?? {};
  const query = getParam(paramsMap, "query") ?? "";
  const kind = getParam(paramsMap, "kind") ?? "";
  const date = getParam(paramsMap, "date") ?? "";
  const time = getParam(paramsMap, "time") ?? "";
  const location = getParam(paramsMap, "location") ?? "";
  const lat = Number(getParam(paramsMap, "lat"));
  const lon = Number(getParam(paramsMap, "lon"));
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
  const cookieStore = await cookies();
  const customerSession = verifyPublicCustomerSession(
    cookieStore.get(getPublicCustomerCookieName())?.value
  );
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value);

  return (
    <CatalogView
      results={results}
      query={query}
      kind={kind}
      date={date}
      time={time}
      location={location}
      hasCoords={publicParams.lat !== null && publicParams.lon !== null}
      isCustomerAuthenticated={Boolean(customerSession)}
      customerDisplayName={customerSession?.fullName ?? ""}
      isProAuthenticated={Boolean(professionalId)}
      initialLanguage={lang as SiteLanguage}
    />
  );
}
