import { NextResponse } from "next/server";
import { getMobileProfessionalId } from "../_auth";
import { getBusinessStaffSnapshot } from "../../../../../lib/pro-staff";
import { getWorkspaceSnapshot, updateBusinessScheduleForProfessional } from "../../../../../lib/pro-data";

export async function GET(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const ownerSnapshot = await getBusinessStaffSnapshot(professionalId);
    if (ownerSnapshot) {
      return NextResponse.json(ownerSnapshot);
    }

    const workspace = await getWorkspaceSnapshot(professionalId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        id: workspace.business.id,
        name: workspace.business.name,
        currency: workspace.professional.currency || "USD"
      },
      summary: {
        totalPeople: 1,
        activeEmployees: workspace.membership.scope === "owner" ? 0 : 1
      },
      members: [
        {
          professional: {
            id: workspace.professional.id,
            firstName: workspace.professional.firstName,
            lastName: workspace.professional.lastName,
            email: workspace.professional.email,
            phone: workspace.professional.phone,
            avatarUrl: workspace.professional.avatarUrl
          },
          membership: {
            role: workspace.membership.role,
            scope: workspace.membership.scope === "owner" ? "owner" : "member",
            workScheduleMode: workspace.memberSchedule.workScheduleMode,
            workSchedule: workspace.memberSchedule.workSchedule,
            customSchedule: workspace.memberSchedule.customSchedule
          },
          stats: {
            monthBookings: 0,
            upcomingBookings: 0
          }
        }
      ]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load staff schedule.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const professionalId = getMobileProfessionalId(request);
    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    await updateBusinessScheduleForProfessional({
      professionalId,
      targetProfessionalId: typeof body.targetProfessionalId === "string" ? body.targetProfessionalId : undefined,
      workScheduleMode: body.workScheduleMode,
      workSchedule: body.workSchedule,
      customSchedule: body.customSchedule || {}
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save staff schedule.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
