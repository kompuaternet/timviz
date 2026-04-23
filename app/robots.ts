import type { MetadataRoute } from "next";
import { siteUrl } from "../lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/ru/", "/uk/", "/en/"],
        disallow: ["/api/", "/pro/", "/dashboard", "/booking-success/"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: "timviz.com"
  };
}
