import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../lib/pro-auth";
import { getPendingJoinRequestForProfessional, getWorkspaceSnapshot } from "../../lib/pro-data";

export default async function ProPage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(
    cookieStore.get(getSessionCookieName())?.value
  );

  if (!professionalId) {
    redirect("/pro/login");
  }

  const [workspace, pendingJoinRequest] = await Promise.all([
    getWorkspaceSnapshot(professionalId),
    getPendingJoinRequestForProfessional(professionalId)
  ]);

  if (workspace) {
    redirect("/pro/calendar");
  }

  if (pendingJoinRequest) {
    redirect("/pro/pending");
  }

  redirect("/pro/login");
}
