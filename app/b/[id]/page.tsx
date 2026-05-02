import { permanentRedirect } from "next/navigation";
import { getPublicBusinessProfile } from "../../../lib/public-business";
import { getRequestLanguage } from "../../../lib/request-language";
import { getLocalizedPath } from "../../../lib/site-language";

export const dynamic = "force-dynamic";

type ShortBusinessPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShortBusinessPage({ params }: ShortBusinessPageProps) {
  const { id } = await params;
  const language = await getRequestLanguage();
  const profile = await getPublicBusinessProfile(id);
  const targetId = profile?.publicPathId || id;

  permanentRedirect(getLocalizedPath(language, `/businesses/${targetId}`));
}
