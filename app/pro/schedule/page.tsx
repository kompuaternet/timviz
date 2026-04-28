import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../lib/pro-data";
import ScheduleView from "./ScheduleView";

export default async function ProSchedulePage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const workspace = await getWorkspaceSnapshot(professionalId);

  if (!workspace) {
    redirect("/pro/login");
  }

  return <ScheduleView professionalId={professionalId} />;
}
