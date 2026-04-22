import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import ScheduleView from "./ScheduleView";

type ProSchedulePageProps = {
  searchParams?: Promise<{
    professionalId?: string;
  }>;
};

export default async function ProSchedulePage({
  searchParams
}: ProSchedulePageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const professionalId =
    params.professionalId ||
    verifySessionValue(cookieStore.get(getSessionCookieName())?.value) ||
    "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  return <ScheduleView professionalId={professionalId} />;
}
