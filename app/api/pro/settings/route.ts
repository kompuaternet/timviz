import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppointmentUsageForProfessional } from "../../../../lib/pro-calendar";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import {
  DEFAULT_BOOKING_CREDITS,
  getWorkspaceSnapshot,
  updateWorkspaceSettingsForProfessional
} from "../../../../lib/pro-data";

async function getProfessionalId() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
}

async function getPayload(professionalId: string) {
  const workspace = await getWorkspaceSnapshot(professionalId);

  if (!workspace) {
    return null;
  }

  const used = await getAppointmentUsageForProfessional(professionalId);
  const total = workspace.professional.bookingCreditsTotal ?? DEFAULT_BOOKING_CREDITS;

  return {
    workspace,
    bookingCredits: {
      total,
      used,
      remaining: Math.max(0, total - used)
    }
  };
}

export async function GET() {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await getPayload(professionalId);

  if (!payload) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  return NextResponse.json(payload);
}

export async function PATCH(request: Request) {
  const professionalId = await getProfessionalId();

  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    await updateWorkspaceSettingsForProfessional(professionalId, body);
    const payload = await getPayload(professionalId);

    if (!payload) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сохранить настройки." },
      { status: 400 }
    );
  }
}
