import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getRequestLanguage } from "../../lib/request-language";
import { getLocalizedPath } from "../../lib/site-language";

type ForMastersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: {
      index: false,
      follow: true
    }
  };
}

export default async function ForMastersPage({ searchParams }: ForMastersPageProps) {
  const language = await getRequestLanguage();
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
      continue;
    }

    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  permanentRedirect(`${getLocalizedPath(language, "/for-masters")}${queryString ? `?${queryString}` : ""}`);
}
