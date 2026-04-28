import { getServiceTemplateCatalog } from "../../../lib/global-service-catalog";
import { redirect } from "next/navigation";
import { getStaffInvitationPreviewByToken } from "../../../lib/pro-data";
import ProSetupFlow from "./ProSetupFlow";

type ProSetupPageProps = {
  searchParams?: Promise<{
    invite?: string;
  }>;
};

export default async function ProSetupPage({ searchParams }: ProSetupPageProps) {
  const params = (await searchParams) ?? {};
  const inviteToken = params.invite?.trim() || "";
  const [catalog, invitation] = await Promise.all([
    getServiceTemplateCatalog(),
    inviteToken ? getStaffInvitationPreviewByToken(inviteToken) : Promise.resolve(null)
  ]);

  if (inviteToken && (!invitation || invitation.status !== "pending")) {
    redirect(`/pro/invite?token=${encodeURIComponent(inviteToken)}`);
  }

  return (
    <ProSetupFlow
      catalog={catalog}
      invitation={
        invitation
          ? {
              token: inviteToken,
              businessId: invitation.business.id,
              businessName: invitation.business.name,
              role: invitation.role,
              email: invitation.email,
              status: invitation.status
            }
          : null
      }
    />
  );
}
