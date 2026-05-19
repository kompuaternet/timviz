import { NextResponse } from "next/server";
import {
  getAppNotificationsForProfessional,
  markAppNotificationsRead
} from "../../../../../lib/app-notifications";
import { getMobileProfessionalId } from "../_auth";

export async function GET(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await getAppNotificationsForProfessional(professionalId, { limit: 50 });
    return NextResponse.json({ notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notifications.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.map((id: unknown) => String(id || "")) : undefined;
    const result = await markAppNotificationsRead(professionalId, ids);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update notifications.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
