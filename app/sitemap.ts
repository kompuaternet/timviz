import type { MetadataRoute } from "next";
import { salons } from "../data/mock-data";
import { siteUrl } from "../lib/seo";
import { getLocalizedPath, siteLanguages } from "../lib/site-language";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
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

  const salonRoutes: MetadataRoute.Sitemap = siteLanguages.flatMap((language) =>
    salons.map((salon) => ({
      url: `${siteUrl}${getLocalizedPath(language, `/salons/${salon.slug}`)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    }))
  );

  return [...staticRoutes, ...salonRoutes];
}
