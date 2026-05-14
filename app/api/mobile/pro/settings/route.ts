import { NextResponse } from "next/server";
import { getMobileProfessionalId } from "../_auth";
import {
  DEFAULT_BOOKING_CREDITS,
  getWorkspaceSnapshot,
  updateWorkspaceSettingsForProfessional
} from "../../../../../lib/pro-data";
import { getAppointmentUsageForProfessional } from "../../../../../lib/pro-calendar";

async function getPayload(professionalId: string) {
  const workspace = await getWorkspaceSnapshot(professionalId);
  if (!workspace) return null;
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

export async function PATCH(request: Request) {
  const professionalId = getMobileProfessionalId(request);
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
      { error: error instanceof Error ? error.message : "Failed to save settings." },
      { status: 400 }
    );
  }
}
