import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRequestLanguage } from "../../lib/request-language";
import { getLocalizedPath } from "../../lib/site-language";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  return {
    robots: {
      index: false,
      follow: true
    }
  };
}

export default async function ForBusinessPage() {
  const language = await getRequestLanguage();
  redirect(getLocalizedPath(language, "/for-business"));
}
