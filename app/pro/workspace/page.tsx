import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";

type ProWorkspacePageProps = {
  searchParams?: Promise<{
    professionalId?: string;
  }>;
};

export default async function ProWorkspacePage({
  searchParams
}: ProWorkspacePageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const professionalId =
    params.professionalId ||
    verifySessionValue(cookieStore.get(getSessionCookieName())?.value) ||
    "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  redirect("/pro/calendar");
}
