import { permanentRedirect } from "next/navigation";
import { getRequestLanguage } from "../../lib/request-language";
import { getLocalizedPath } from "../../lib/site-language";

export const dynamic = "force-dynamic";

export default async function AccountDeletionRedirectPage() {
  const language = await getRequestLanguage();
  permanentRedirect(getLocalizedPath(language, "/account-deletion"));
}
