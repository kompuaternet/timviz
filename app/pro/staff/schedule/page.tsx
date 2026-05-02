import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../lib/pro-data";
import { isWorkspaceSetupComplete } from "../../../../lib/pro-onboarding";
import { getBusinessStaffSnapshot } from "../../../../lib/pro-staff";
import { getTelegramConnectionByProfessionalId } from "../../../../lib/telegram-bot";
import StaffScheduleView from "../StaffScheduleView";

export default async function ProStaffSchedulePage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const [snapshot, workspace, telegramConnection] = await Promise.all([
    getBusinessStaffSnapshot(professionalId),
    getWorkspaceSnapshot(professionalId),
    getTelegramConnectionByProfessionalId(professionalId)
  ]);

  if (!workspace) {
    redirect("/pro/login");
  }

  if (!snapshot) {
    redirect("/pro/settings");
  }

  return (
    <StaffScheduleView
      professionalId={professionalId}
      snapshot={snapshot}
      showOnboardingCta={!isWorkspaceSetupComplete(workspace, Boolean(telegramConnection?.chatId))}
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
