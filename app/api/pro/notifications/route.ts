import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAppNotificationsForProfessional,
  markAppNotificationsRead
} from "../../../../lib/app-notifications";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";

async function getProfessionalId() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
}

export async function GET() {
  try {
    const professionalId = await getProfessionalId();
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const notifications = await getAppNotificationsForProfessional(professionalId, { limit: 50 });
    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load notifications." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const professionalId = await getProfessionalId();
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.map((id: unknown) => String(id || "")) : undefined;
    const result = await markAppNotificationsRead(professionalId, ids);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notifications." },
      { status: 400 }
    );
  }
}
