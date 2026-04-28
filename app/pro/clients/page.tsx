import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../lib/pro-data";
import { getClientsList } from "../../../lib/pro-clients";
import ClientsView from "./ClientsView";

export default async function ProClientsPage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const [workspace, clients] = await Promise.all([
    getWorkspaceSnapshot(professionalId),
    getClientsList(professionalId)
  ]);

  if (!workspace) {
    redirect("/pro/login");
  }

  return (
    <ClientsView
      professionalId={professionalId}
      accountCountry={workspace.professional.country}
      accountCurrency={workspace.professional.currency || "USD"}
      businessName={workspace.business.name}
      canManageStaff={workspace.membership.scope === "owner"}
      initialClients={clients}
    />
  );
}
