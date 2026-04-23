import { redirect } from "next/navigation";
import { getRequestLanguage } from "../../lib/seo";
import { getLocalizedPath } from "../../lib/site-language";

export const dynamic = "force-dynamic";

type CatalogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
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

  redirect(`${getLocalizedPath(language, "/catalog")}${query.toString() ? `?${query.toString()}` : ""}`);
}
