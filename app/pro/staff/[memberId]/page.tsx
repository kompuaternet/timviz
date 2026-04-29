import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import { getStaffMemberEditorSnapshot } from "../../../../lib/pro-staff";
import StaffMemberEditor from "../StaffMemberEditor";

type ProStaffMemberPageProps = {
  params: Promise<{
    memberId: string;
  }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function ProStaffMemberPage({ params, searchParams }: ProStaffMemberPageProps) {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const { memberId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialTab =
    resolvedSearchParams.tab === "schedule" || resolvedSearchParams.tab === "access"
      ? resolvedSearchParams.tab
      : "profile";
  const snapshot = await getStaffMemberEditorSnapshot(professionalId, memberId);

  if (!snapshot) {
    redirect("/pro/staff/members");
  }

  return <StaffMemberEditor snapshot={snapshot} initialTab={initialTab} />;
}
