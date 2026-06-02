import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getRequestLanguage } from "../../lib/request-language";
import { getLocalizedPath } from "../../lib/site-language";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: {
      index: false,
      follow: true
    }
  };
}

export default async function ForMastersPage() {
  const language = await getRequestLanguage();
  permanentRedirect(getLocalizedPath(language, "/for-masters"));
}
