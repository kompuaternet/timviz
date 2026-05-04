import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../../lib/pro-data";
import {
  ensureTelegramWebhookConfigured,
  ensureTelegramMenuButtonConfigured,
  ensureTelegramConnectToken,
  getTelegramConnectionByProfessionalId,
  isTelegramBotConfigured,
  setTelegramConnectionSettings
} from "../../../../../lib/telegram-bot";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTelegramBotConfigured()) {
      return NextResponse.json(
        {
          error: "Telegram bot is not configured."
        },
        { status: 503 }
      );
    }

    const workspace = await getWorkspaceSnapshot(professionalId);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    await Promise.all([
      ensureTelegramWebhookConfigured().catch(() => false),
      ensureTelegramMenuButtonConfigured().catch(() => false)
    ]);

    const result = await ensureTelegramConnectToken({
      professionalId,
      businessId: workspace.business.id,
      language: workspace.professional.language,
      timezone: workspace.professional.timezone
    });

    return NextResponse.json({
      ok: true,
      deepLink: result.deepLink,
      tokenExpiresAt: result.tokenExpiresAt,
      connected: Boolean(result.connection.chatId && result.connection.connectedAt),
      chatId: result.connection.chatId || null,
      settings: {
        notificationsNewBooking: result.connection.notificationsNewBooking,
        notificationsCabinetBooking: result.connection.notificationsCabinetBooking,
        notificationsRescheduled: result.connection.notificationsRescheduled,
        notificationsCancelled: result.connection.notificationsCancelled,
        notificationsReminder: result.connection.notificationsReminder,
        notificationsToday: result.connection.notificationsToday,
        forwardingEnabled: result.connection.forwardingEnabled,
        reminderLeadMinutes: result.connection.reminderLeadMinutes
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare Telegram connection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTelegramBotConfigured()) {
      return NextResponse.json(
        {
          error: "Telegram bot is not configured."
        },
        { status: 503 }
      );
    }

    const workspace = await getWorkspaceSnapshot(professionalId);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      notificationsNewBooking: boolean;
      notificationsCabinetBooking: boolean;
      notificationsRescheduled: boolean;
      notificationsCancelled: boolean;
      notificationsReminder: boolean;
      notificationsToday: boolean;
      forwardingEnabled: boolean;
      reminderLeadMinutes: number;
    }>;

    await Promise.all([
      ensureTelegramWebhookConfigured().catch(() => false),
      ensureTelegramMenuButtonConfigured().catch(() => false)
    ]);

    let connection = await getTelegramConnectionByProfessionalId(professionalId);
    if (!connection) {
      const ensured = await ensureTelegramConnectToken({
        professionalId,
        businessId: workspace.business.id,
        language: workspace.professional.language,
        timezone: workspace.professional.timezone
      });
      connection = ensured.connection;
    }

    const nextConnection = await setTelegramConnectionSettings(connection, {
      notificationsNewBooking:
        typeof body.notificationsNewBooking === "boolean"
          ? body.notificationsNewBooking
          : undefined,
      notificationsCabinetBooking:
        typeof body.notificationsCabinetBooking === "boolean"
          ? body.notificationsCabinetBooking
          : undefined,
      notificationsRescheduled:
        typeof body.notificationsRescheduled === "boolean"
          ? body.notificationsRescheduled
          : undefined,
      notificationsCancelled:
        typeof body.notificationsCancelled === "boolean"
          ? body.notificationsCancelled
          : undefined,
      notificationsReminder:
        typeof body.notificationsReminder === "boolean"
          ? body.notificationsReminder
          : undefined,
      notificationsToday:
        typeof body.notificationsToday === "boolean"
          ? body.notificationsToday
          : undefined,
      forwardingEnabled:
        typeof body.forwardingEnabled === "boolean"
          ? body.forwardingEnabled
          : undefined,
      reminderLeadMinutes:
        typeof body.reminderLeadMinutes === "number" && Number.isFinite(body.reminderLeadMinutes)
          ? body.reminderLeadMinutes
          : undefined
    });

    const refreshed = await ensureTelegramConnectToken({
      professionalId,
      businessId: workspace.business.id,
      language: workspace.professional.language,
      timezone: workspace.professional.timezone
    });

    return NextResponse.json({
      ok: true,
      deepLink: refreshed.deepLink,
      tokenExpiresAt: refreshed.tokenExpiresAt,
      connected: Boolean(nextConnection.chatId && nextConnection.connectedAt),
      chatId: nextConnection.chatId || null,
      settings: {
        notificationsNewBooking: nextConnection.notificationsNewBooking,
        notificationsCabinetBooking: nextConnection.notificationsCabinetBooking,
        notificationsRescheduled: nextConnection.notificationsRescheduled,
        notificationsCancelled: nextConnection.notificationsCancelled,
        notificationsReminder: nextConnection.notificationsReminder,
        notificationsToday: nextConnection.notificationsToday,
        forwardingEnabled: nextConnection.forwardingEnabled,
        reminderLeadMinutes: nextConnection.reminderLeadMinutes
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update Telegram settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
