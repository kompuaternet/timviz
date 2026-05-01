import type { MetadataRoute } from "next";
import { getAllNicheParams } from "../lib/niche-pages";
import { getBusinessDirectorySnapshot } from "../lib/pro-data";
import { getPublicBusinessPathId } from "../lib/public-business-path";
import { forBusinessFeaturePages } from "../lib/for-business-seo-pages";
import { siteUrl } from "../lib/seo";
import { getLocalizedPath, siteLanguages } from "../lib/site-language";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const directory = await getBusinessDirectorySnapshot();
  const nicheParams = getAllNicheParams();
  const staticRoutes: MetadataRoute.Sitemap = siteLanguages.flatMap((language) => [
    {
      url: `${siteUrl}${getLocalizedPath(language)}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: language === "ru" ? 1 : 0.95
    },
    {
      url: `${siteUrl}${getLocalizedPath(language, "/catalog")}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${siteUrl}${getLocalizedPath(language, "/for-business")}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...nicheParams.filter((item) => item.lang === language).map((item) => ({
      url: `${siteUrl}${getLocalizedPath(language, `/${item.niche}`)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.82
    })),
    ...forBusinessFeaturePages.map((page) => ({
      url: `${siteUrl}${getLocalizedPath(language, `/${page.slug}`)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    {
      url: `${siteUrl}${getLocalizedPath(language, "/privacy")}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${siteUrl}${getLocalizedPath(language, "/terms")}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4
    }
  ]);

  const businessRoutes: MetadataRoute.Sitemap = siteLanguages.flatMap((language) =>
    directory.businesses.map((business) => ({
      url: `${siteUrl}${getLocalizedPath(language, `/businesses/${getPublicBusinessPathId(business, directory.businesses)}`)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    }))
  );

  return [...staticRoutes, ...businessRoutes];
}
