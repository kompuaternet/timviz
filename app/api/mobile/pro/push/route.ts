import { NextResponse } from "next/server";
import { getMobileProfessionalId } from "../_auth";
import { getWorkspaceSnapshot } from "../../../../../lib/pro-data";
import {
  getMobilePushState,
  unregisterMobilePushToken,
  updateMobilePushSettings,
  upsertMobilePushToken
} from "../../../../../lib/push-notifications";
import { isPremiumAccessActive } from "../../../../../lib/premium";

function normalizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export async function GET(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const state = await getMobilePushState(professionalId);
  return NextResponse.json({ ok: true, ...state });
}

export async function POST(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const workspace = await getWorkspaceSnapshot(professionalId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }
    if (!isPremiumAccessActive(workspace.professional)) {
      return NextResponse.json({ error: "Push notifications require an active Pro subscription." }, { status: 402 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      expoPushToken?: string;
      platform?: string;
      deviceName?: string;
      language?: string;
      timezone?: string;
    };
    const expoPushToken = String(body.expoPushToken || "").trim();
    if (!expoPushToken.startsWith("ExponentPushToken[") && !expoPushToken.startsWith("ExpoPushToken[")) {
      return NextResponse.json({ error: "Invalid Expo push token." }, { status: 400 });
    }

    const token = await upsertMobilePushToken({
      professionalId,
      businessId: workspace.business.id,
      expoPushToken,
      platform: String(body.platform || ""),
      deviceName: String(body.deviceName || ""),
      language: String(body.language || workspace.professional.language || "en"),
      timezone: String(body.timezone || workspace.professional.timezone || "UTC")
    });

    const state = await getMobilePushState(professionalId);
    return NextResponse.json({
      ok: true,
      tokenId: token.id,
      ...state
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to register push notifications." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const workspace = await getWorkspaceSnapshot(professionalId);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }
    if (!isPremiumAccessActive(workspace.professional)) {
      return NextResponse.json({ error: "Push notifications require an active Pro subscription." }, { status: 402 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const state = await updateMobilePushSettings(professionalId, {
      notificationsNewBooking: normalizeBoolean(body.notificationsNewBooking),
      notificationsCabinetBooking: normalizeBoolean(body.notificationsCabinetBooking),
      notificationsRescheduled: normalizeBoolean(body.notificationsRescheduled),
      notificationsCancelled: normalizeBoolean(body.notificationsCancelled),
      notificationsReminder: normalizeBoolean(body.notificationsReminder),
      notificationsToday: normalizeBoolean(body.notificationsToday),
      reminderLeadMinutes:
        typeof body.reminderLeadMinutes === "number" && Number.isFinite(body.reminderLeadMinutes)
          ? body.reminderLeadMinutes
          : undefined
    });

    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update push notification settings." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const expoPushToken = url.searchParams.get("expoPushToken") || "";
  await unregisterMobilePushToken(professionalId, expoPushToken);
  const state = await getMobilePushState(professionalId);
  return NextResponse.json({ ok: true, ...state });
}
