import { permanentRedirect } from "next/navigation";
import { getPublicBusinessProfile } from "../../../lib/public-business";
import { encodePublicBusinessPathId } from "../../../lib/public-business-path";
import { getRequestLanguage } from "../../../lib/request-language";
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
  const targetId = encodePublicBusinessPathId(profile?.publicPathId || id);

  permanentRedirect(getLocalizedPath(language, `/businesses/${targetId}`));
}
