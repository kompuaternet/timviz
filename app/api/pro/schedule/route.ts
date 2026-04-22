import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import { updateBusinessScheduleForProfessional } from "../../../../lib/pro-data";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    await updateBusinessScheduleForProfessional({
      professionalId,
      workScheduleMode: body.workScheduleMode,
      workSchedule: body.workSchedule,
      customSchedule: body.customSchedule
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save schedule.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
