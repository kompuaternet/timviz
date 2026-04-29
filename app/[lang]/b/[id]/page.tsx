import { permanentRedirect } from "next/navigation";
import { getPublicBusinessProfile } from "../../../../lib/public-business";
import { getLocalizedPath, isSiteLanguage, type SiteLanguage } from "../../../../lib/site-language";

export const dynamic = "force-dynamic";

type LocalizedShortBusinessPageProps = {
  params: Promise<{
    lang: string;
    id: string;
  }>;
};

export default async function LocalizedShortBusinessPage({
  params
}: LocalizedShortBusinessPageProps) {
  const { lang, id } = await params;
  const language = isSiteLanguage(lang) ? (lang as SiteLanguage) : "ru";
  const profile = await getPublicBusinessProfile(id);
  const targetId = profile?.publicPathId || id;

  permanentRedirect(getLocalizedPath(language, `/businesses/${targetId}`));
}
