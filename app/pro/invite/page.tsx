import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getProfessionalProfileById, getStaffInvitationPreviewByToken } from "../../../lib/pro-data";
import InviteAcceptView from "./InviteAcceptView";

type ProInvitePageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function ProInvitePage({ searchParams }: ProInvitePageProps) {
  const params = (await searchParams) ?? {};
  const token = params.token?.trim() || "";
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  const [invitation, currentProfessional] = await Promise.all([
    token ? getStaffInvitationPreviewByToken(token) : Promise.resolve(null),
    professionalId ? getProfessionalProfileById(professionalId) : Promise.resolve(null)
  ]);

  return (
    <InviteAcceptView
      token={token}
      invitation={invitation}
      currentProfessionalEmail={currentProfessional?.email || ""}
    />
  );
}
