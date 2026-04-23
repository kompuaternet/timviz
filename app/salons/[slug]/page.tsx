import { redirect } from "next/navigation";
import { getRequestLanguage } from "../../../lib/seo";
import { getLocalizedPath } from "../../../lib/site-language";

export const dynamic = "force-dynamic";

type SalonPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SalonPage({ params }: SalonPageProps) {
  const { slug } = await params;
  const language = await getRequestLanguage();
  redirect(getLocalizedPath(language, `/salons/${slug}`));
}
