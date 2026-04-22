import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../lib/pro-data";
import { SERVICE_TEMPLATE_CATALOG } from "../../../lib/service-templates";
import ServicesView from "./ServicesView";

export default async function ProServicesPage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const workspace = await getWorkspaceSnapshot(professionalId);

  if (!workspace) {
    redirect("/pro/login");
  }

  return (
    <ServicesView
      initialWorkspace={workspace}
      catalog={SERVICE_TEMPLATE_CATALOG}
    />
  );
}
