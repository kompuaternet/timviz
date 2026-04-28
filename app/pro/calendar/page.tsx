import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../lib/pro-data";
import CalendarDayView from "./CalendarDayView";

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type ProCalendarPageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

export default async function ProCalendarPage({
  searchParams
}: ProCalendarPageProps) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";

  if (!professionalId) {
    redirect("/pro/login");
  }

  const workspace = await getWorkspaceSnapshot(professionalId);

  if (!workspace) {
    redirect("/pro/login");
  }

  return (
    <CalendarDayView
      professionalId={professionalId}
      initialDate={params.date || formatDateKey(new Date())}
    />
  );
}
