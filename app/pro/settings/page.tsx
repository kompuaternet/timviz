import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppointmentUsageForProfessional } from "../../../lib/pro-calendar";
import { getLatestMonobankSubscriptionForUser } from "../../../lib/monobank-billing";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { DEFAULT_BOOKING_CREDITS, getJoinRequestsForOwner, getWorkspaceSnapshot } from "../../../lib/pro-data";
import { getOnboardingCtaState } from "../../../lib/pro-onboarding";
import { getTelegramConnectionByProfessionalId } from "../../../lib/telegram-bot";
import SettingsView from "./SettingsView";

type ProSettingsPageProps = {
  searchParams?: Promise<{
    section?: string;
    source?: string;
    startapp?: string;
    start_param?: string;
    tgWebAppStartParam?: string;
  }>;
};

export default async function ProSettingsPage({ searchParams }: ProSettingsPageProps) {
  const params = (await searchParams) ?? {};
  const source = typeof params.source === "string" ? params.source.trim().toLowerCase() : "";
  const isTelegramSource = source === "telegram";
  const startParamRaw = [params.startapp, params.start_param, params.tgWebAppStartParam].find(
    (value) => typeof value === "string" && value.trim()
  );
  const startParam = typeof startParamRaw === "string" ? startParamRaw.trim() : "settings";
  const loginPath = isTelegramSource
    ? `/telegram?source=telegram&startapp=${encodeURIComponent(startParam || "settings")}`
    : "/pro/login";
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect(loginPath);
  }

  const [workspace, telegramConnection, monobankSubscription] = await Promise.all([
    getWorkspaceSnapshot(professionalId),
    getTelegramConnectionByProfessionalId(professionalId),
    getLatestMonobankSubscriptionForUser(professionalId)
  ]);

  if (!workspace) {
    redirect(loginPath);
  }

  const usedCredits = await getAppointmentUsageForProfessional(professionalId);
  const totalCredits = DEFAULT_BOOKING_CREDITS;
  const joinRequests = workspace.membership.scope === "owner" ? await getJoinRequestsForOwner(professionalId) : [];

  return (
    <SettingsView
      initialData={{
        professional: {
          id: workspace.professional.id,
          firstName: workspace.professional.firstName,
          lastName: workspace.professional.lastName,
          avatarUrl: workspace.professional.avatarUrl,
          email: workspace.professional.email,
          phone: workspace.professional.phone,
          country: workspace.professional.country,
          timezone: workspace.professional.timezone,
          language: workspace.professional.language,
          currency: workspace.professional.currency || "USD",
          ownerMode: workspace.professional.ownerMode,
          plan: workspace.professional.plan,
          premiumStatus: workspace.professional.premiumStatus,
          premiumUntil: workspace.professional.premiumUntil
        },
        business: workspace.business,
        membership: workspace.membership,
        services: workspace.services,
        joinRequests: joinRequests.map((request) => ({
          id: request.id,
          role: request.role,
          createdAt: request.createdAt,
          professional: request.professional
            ? {
                id: request.professional.id,
                firstName: request.professional.firstName,
                lastName: request.professional.lastName,
                email: request.professional.email,
                phone: request.professional.phone
              }
            : null
        })),
        bookingCredits: {
          total: totalCredits,
          used: usedCredits,
          remaining: Math.max(0, totalCredits - usedCredits)
        },
        monobankSubscription
      }}
      onboardingCta={getOnboardingCtaState(workspace, Boolean(telegramConnection?.chatId))}
      initialSection={
        params.section === "general" ||
        params.section === "online-booking" ||
        params.section === "services" ||
        params.section === "schedule" ||
        params.section === "telegram" ||
        params.section === "address"
          ? params.section
          : undefined
      }
    />
  );
}
