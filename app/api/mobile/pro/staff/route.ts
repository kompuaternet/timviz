import { NextResponse } from "next/server";
import { getMobileProfessionalId } from "../_auth";
import { getBusinessStaffSnapshot } from "../../../../../lib/pro-staff";
import {
  createManualStaffMember,
  createStaffInvitation,
  getWorkspaceSnapshot,
  revokeStaffInvitation,
  resolveJoinRequestForOwner,
  updateBusinessScheduleForProfessional,
  updateStaffMemberByOwner
} from "../../../../../lib/pro-data";

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
    const action = typeof body.action === "string" ? body.action : "saveSchedule";

    if (action === "createMember") {
      await createManualStaffMember({
        ownerProfessionalId: professionalId,
        firstName: String(body.firstName || ""),
        lastName: typeof body.lastName === "string" ? body.lastName : "",
        role: typeof body.role === "string" ? body.role : "",
        email: typeof body.email === "string" ? body.email : "",
        phone: typeof body.phone === "string" ? body.phone : "",
        sendInvitation: body.sendInvitation === true,
        request
      });
    } else if (action === "updateMember") {
      await updateStaffMemberByOwner({
        ownerProfessionalId: professionalId,
        memberProfessionalId: String(body.memberProfessionalId || ""),
        firstName: String(body.firstName || ""),
        lastName: typeof body.lastName === "string" ? body.lastName : "",
        role: typeof body.role === "string" ? body.role : "",
        email: typeof body.email === "string" ? body.email : "",
        phone: typeof body.phone === "string" ? body.phone : ""
      });
    } else if (action === "inviteMember") {
      await createStaffInvitation({
        ownerProfessionalId: professionalId,
        memberProfessionalId: typeof body.memberProfessionalId === "string" ? body.memberProfessionalId : undefined,
        email: String(body.email || ""),
        role: String(body.role || ""),
        request
      });
    } else if (action === "revokeInvitation") {
      await revokeStaffInvitation({
        ownerProfessionalId: professionalId,
        invitationId: String(body.invitationId || "")
      });
    } else if (action === "resolveJoinRequest") {
      await resolveJoinRequestForOwner({
        ownerProfessionalId: professionalId,
        requestId: String(body.requestId || ""),
        action: body.requestAction === "reject" ? "reject" : "approve"
      });
    } else {
      await updateBusinessScheduleForProfessional({
        professionalId,
        targetProfessionalId: typeof body.targetProfessionalId === "string" ? body.targetProfessionalId : undefined,
        workScheduleMode: body.workScheduleMode,
        workSchedule: body.workSchedule,
        customSchedule: body.customSchedule || {}
      });
    }

    const snapshot = await getBusinessStaffSnapshot(professionalId);
    return NextResponse.json({ ok: true, staff: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save staff schedule.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
