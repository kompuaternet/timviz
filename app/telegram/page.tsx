import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../lib/pro-auth";
import { getPendingJoinRequestForProfessional, getWorkspaceSnapshot } from "../../lib/pro-data";
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
    source?: string;
    tgWebAppStartParam?: string;
    startapp?: string;
    start_param?: string;
  }>;
};

function resolveTelegramStartPath(value: string | null | undefined) {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) return "/pro/calendar";

  if (normalized.includes("notifications") || normalized.includes("inbox")) {
    return "/pro/calendar?panel=notifications";
  }

  if (normalized.includes("settings") || normalized.includes("setup")) {
    return "/pro/settings";
  }
  if (normalized.includes("support") || normalized.includes("help")) {
    return "/pro/settings?section=telegram";
  }
  if (normalized.includes("clients")) {
    return "/pro/clients";
  }
  if (normalized.includes("services")) {
    return "/pro/services";
  }
  if (
    normalized.includes("staff") ||
    normalized.includes("team") ||
    normalized.includes("schedule")
  ) {
    return "/pro/staff/schedule";
  }

  return "/pro/calendar";
}

export default async function TelegramPage({ searchParams }: TelegramPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialLanguage = typeof params?.lang === "string" ? params.lang : null;
  const source = typeof params?.source === "string" ? params.source : "";
  const fromTelegram = source === "telegram";
  const startParam = [params?.tgWebAppStartParam, params?.startapp, params?.start_param].find(
    (item) => typeof item === "string" && item.trim()
  );

  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value);

  if (professionalId) {
    const [workspace, pendingJoinRequest] = await Promise.all([
      getWorkspaceSnapshot(professionalId),
      getPendingJoinRequestForProfessional(professionalId)
    ]);

    if (workspace) {
      const pathname = resolveTelegramStartPath(startParam);
      const params = new URLSearchParams();
      params.set("source", "telegram");
      if (typeof startParam === "string" && startParam.trim()) {
        params.set("startapp", startParam.trim());
      }
      const signedInRedirectPath = `${pathname}?${params.toString()}`;
      if (!fromTelegram) {
        redirect(signedInRedirectPath);
      }
      return (
        <TelegramMiniAppView
          initialLanguage={initialLanguage}
          signedInRedirectPath={signedInRedirectPath}
          initialStartParam={typeof startParam === "string" ? startParam : null}
        />
      );
    }

    if (pendingJoinRequest) {
      const pendingPath = "/pro/pending?source=telegram";
      if (!fromTelegram) {
        redirect(pendingPath);
      }
      return (
        <TelegramMiniAppView
          initialLanguage={initialLanguage}
          signedInRedirectPath={pendingPath}
          initialStartParam={typeof startParam === "string" ? startParam : null}
        />
      );
    }
  }

  return (
    <TelegramMiniAppView
      initialLanguage={initialLanguage}
      signedInRedirectPath={null}
      initialStartParam={typeof startParam === "string" ? startParam : null}
    />
  );
}
