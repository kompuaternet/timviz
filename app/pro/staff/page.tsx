import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getBusinessStaffSnapshot } from "../../../lib/pro-staff";
import StaffView from "./StaffView";

type ProStaffPageProps = {
  searchParams?: Promise<{
    openAdd?: string;
  }>;
};

export default async function ProStaffPage({ searchParams }: ProStaffPageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const snapshot = await getBusinessStaffSnapshot(professionalId);

  if (!snapshot) {
    redirect("/pro/settings");
  }

  return (
    <StaffView
      professionalId={professionalId}
      snapshot={snapshot}
      initialAddOpen={params.openAdd === "1"}
    />
  );
}
