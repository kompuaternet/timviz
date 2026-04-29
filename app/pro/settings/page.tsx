import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppointmentUsageForProfessional } from "../../../lib/pro-calendar";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { DEFAULT_BOOKING_CREDITS, getJoinRequestsForOwner, getWorkspaceSnapshot } from "../../../lib/pro-data";
import SettingsView from "./SettingsView";

export default async function ProSettingsPage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const workspace = await getWorkspaceSnapshot(professionalId);

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
    />
  );
}
