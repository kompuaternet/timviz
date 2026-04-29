import { permanentRedirect } from "next/navigation";
import { getPublicBusinessProfile } from "../../../lib/public-business";
import { getRequestLanguage } from "../../../lib/seo";
import { getLocalizedPath } from "../../../lib/site-language";

export const dynamic = "force-dynamic";

type BusinessRedirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BusinessRedirectPage({ params }: BusinessRedirectPageProps) {
  const { id } = await params;
  const language = await getRequestLanguage();
  const profile = await getPublicBusinessProfile(id);
  const targetId = profile?.publicPathId || id;

  permanentRedirect(getLocalizedPath(language, `/businesses/${targetId}`));
}
