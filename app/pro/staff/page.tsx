import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../lib/pro-data";

type ProStaffPageProps = {
  searchParams?: Promise<{
    openAdd?: string;
  }>;
};

export default async function ProStaffPage({ searchParams }: ProStaffPageProps) {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
  if (!professionalId) {
    redirect("/pro/login");
  }

  const workspace = await getWorkspaceSnapshot(professionalId);
  if (!workspace) {
    redirect("/pro/login");
  }

  if (workspace.membership.scope !== "owner") {
    redirect("/pro/schedule");
  }

  const params = (await searchParams) ?? {};
  if (params.openAdd === "1") {
    redirect("/pro/staff/members?openAdd=1");
  }

  redirect("/pro/staff/schedule");
}
