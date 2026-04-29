import { permanentRedirect, redirect } from "next/navigation";
import { getPublicBusinessProfile } from "../../../lib/public-business";
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
  const business = await getPublicBusinessProfile(slug);

  if (business) {
    permanentRedirect(getLocalizedPath(language, `/businesses/${business.publicPathId}`));
  }

  redirect(getLocalizedPath(language, `/salons/${slug}`));
}
