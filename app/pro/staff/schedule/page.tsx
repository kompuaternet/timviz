import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import { getBusinessStaffSnapshot } from "../../../../lib/pro-staff";
import StaffScheduleView from "../StaffScheduleView";

export default async function ProStaffSchedulePage() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const snapshot = await getBusinessStaffSnapshot(professionalId);

  if (!snapshot) {
    redirect("/pro/settings");
  }

  return <StaffScheduleView professionalId={professionalId} snapshot={snapshot} />;
}
