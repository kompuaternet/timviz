import type { Metadata } from "next";
import TelegramMiniAppView from "./telegram-mini-app-view";

export const metadata: Metadata = {
  title: "Timviz Telegram App",
  description: "Timviz mini app for Telegram users and professionals.",
  robots: {
    index: false,
    follow: false
  }
};

type TelegramPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

export default async function TelegramPage({ searchParams }: TelegramPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialLanguage = typeof params?.lang === "string" ? params.lang : null;
  return <TelegramMiniAppView initialLanguage={initialLanguage} />;
}
