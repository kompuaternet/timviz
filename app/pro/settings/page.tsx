import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppointmentUsageForProfessional } from "../../../lib/pro-calendar";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { DEFAULT_BOOKING_CREDITS, getJoinRequestsForOwner, getWorkspaceSnapshot } from "../../../lib/pro-data";
import { getOnboardingCtaState } from "../../../lib/pro-onboarding";
import { getTelegramConnectionByProfessionalId } from "../../../lib/telegram-bot";
import SettingsView from "./SettingsView";

type ProSettingsPageProps = {
  searchParams?: Promise<{
    section?: string;
  }>;
};

export default async function ProSettingsPage({ searchParams }: ProSettingsPageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const [workspace, telegramConnection] = await Promise.all([
    getWorkspaceSnapshot(professionalId),
    getTelegramConnectionByProfessionalId(professionalId)
  ]);

  if (!workspace) {
    redirect("/pro/login");
  }

  const usedCredits = await getAppointmentUsageForProfessional(professionalId);
  const totalCredits = workspace.professional.bookingCreditsTotal ?? DEFAULT_BOOKING_CREDITS;
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
          ownerMode: workspace.professional.ownerMode
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
        }
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
