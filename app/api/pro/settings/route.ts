import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppointmentUsageForProfessional } from "../../../../lib/pro-calendar";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import {
  DEFAULT_BOOKING_CREDITS,
  getWorkspaceSnapshot,
  updateWorkspaceSettingsForProfessional
} from "../../../../lib/pro-data";
import { sendSuperadminTelegramNotification } from "../../../../lib/telegram-bot";

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
  const total = DEFAULT_BOOKING_CREDITS;

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
    const workspaceBefore = await getWorkspaceSnapshot(professionalId);
    const hasPhotosUpdate = Array.isArray(body?.business?.photos);
    const previousPhotoIds = new Set(
      hasPhotosUpdate
        ? (workspaceBefore?.business.photos ?? []).map((photo) => String(photo.id || ""))
        : []
    );

    await updateWorkspaceSettingsForProfessional(professionalId, body);
    const payload = await getPayload(professionalId);

    if (!payload) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    if (hasPhotosUpdate) {
      const nextPhotos = Array.isArray(payload.workspace.business.photos)
        ? payload.workspace.business.photos
        : [];
      const addedPhotos = nextPhotos.filter((photo) => !previousPhotoIds.has(String(photo.id || "")));

      if (addedPhotos.length > 0) {
        const professionalName =
          `${payload.workspace.professional.firstName} ${payload.workspace.professional.lastName}`.trim() ||
          "";
        await sendSuperadminTelegramNotification({
          eventType: "photos_added",
          professionalId,
          professionalName,
          professionalEmail: payload.workspace.professional.email,
          businessId: payload.workspace.business.id,
          businessName: payload.workspace.business.name,
          photosAdded: addedPhotos.length
        }).catch(() => undefined);
      }
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Не удалось сохранить настройки." },
      { status: 400 }
    );
  }
}
