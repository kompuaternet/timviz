import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../lib/pro-data";
import { getClientsList } from "../../../lib/pro-clients";
import { isWorkspaceSetupComplete } from "../../../lib/pro-onboarding";
import { getTelegramConnectionByProfessionalId } from "../../../lib/telegram-bot";
import ClientsView from "./ClientsView";

export default async function ProClientsPage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const [workspace, clients, telegramConnection] = await Promise.all([
    getWorkspaceSnapshot(professionalId),
    getClientsList(professionalId),
    getTelegramConnectionByProfessionalId(professionalId)
  ]);

  if (!workspace) {
    redirect("/pro/login");
  }

  return (
    <ClientsView
      professionalId={professionalId}
      accountCountry={workspace.professional.country || "Ukraine"}
      accountCurrency={workspace.professional.currency || "USD"}
      businessName={workspace.business.name}
      canManageStaff={workspace.membership.scope === "owner"}
      showOnboardingCta={!isWorkspaceSetupComplete(workspace, Boolean(telegramConnection?.chatId))}
      initialClients={clients}
      header={{
        viewerName: `${workspace.professional.firstName} ${workspace.professional.lastName}`.trim() || workspace.professional.email,
        viewerAvatarUrl: workspace.professional.avatarUrl,
        viewerInitials: `${workspace.professional.firstName?.[0] ?? ""}${workspace.professional.lastName?.[0] ?? ""}`.toUpperCase() || "RZ",
        publicBookingUrl: workspace.business.publicBookingUrl,
        publicBookingEnabled: workspace.business.allowOnlineBooking === true
      }}
    />
  );
}
