import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServiceTemplateCatalog } from "../../../lib/global-service-catalog";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../lib/pro-data";
import ServicesView from "./ServicesView";

export default async function ProServicesPage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const [workspace, catalog] = await Promise.all([
    getWorkspaceSnapshot(professionalId),
    getServiceTemplateCatalog()
  ]);

  if (!workspace) {
    redirect("/pro/login");
  }

  return (
    <ServicesView
      initialWorkspace={workspace}
      catalog={catalog}
    />
  );
}
