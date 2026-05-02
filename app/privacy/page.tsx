import { redirect } from "next/navigation";
import { getRequestLanguage } from "../../lib/request-language";
import { getLocalizedPath } from "../../lib/site-language";

export const dynamic = "force-dynamic";

export default async function PrivacyRedirectPage() {
  const language = await getRequestLanguage();
  redirect(getLocalizedPath(language, "/privacy"));
}
