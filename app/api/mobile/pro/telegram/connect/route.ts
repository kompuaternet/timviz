import { NextResponse } from "next/server";
import { getMobileProfessionalId } from "../../_auth";
import { getWorkspaceSnapshot } from "../../../../../../lib/pro-data";
import {
  ensureTelegramBotCommandsConfigured,
  ensureTelegramConnectToken,
  ensureTelegramMenuButtonConfigured,
  ensureTelegramWebhookConfigured,
  getTelegramConnectionByProfessionalId,
  isTelegramBotConfigured,
  setTelegramConnectionSettings
} from "../../../../../../lib/telegram-bot";

function telegramPayload(result: Awaited<ReturnType<typeof ensureTelegramConnectToken>>) {
  const connection = result.connection;
  return {
    ok: true,
    deepLink: result.deepLink,
    tokenExpiresAt: result.tokenExpiresAt,
    connected: Boolean(connection.chatId && connection.connectedAt),
    chatId: connection.chatId || null,
    settings: {
      notificationsNewBooking: connection.notificationsNewBooking,
      notificationsCabinetBooking: connection.notificationsCabinetBooking,
      notificationsRescheduled: connection.notificationsRescheduled,
      notificationsCancelled: connection.notificationsCancelled,
      notificationsReminder: connection.notificationsReminder,
      notificationsToday: connection.notificationsToday,
      forwardingEnabled: connection.forwardingEnabled,
      reminderLeadMinutes: connection.reminderLeadMinutes
    }
  };
}

async function prepareTelegramConnection(professionalId: string) {
  if (!isTelegramBotConfigured()) {
    throw new Error("Telegram bot is not configured.");
  }

  const workspace = await getWorkspaceSnapshot(professionalId);
  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  await Promise.all([
    ensureTelegramBotCommandsConfigured().catch(() => false),
    ensureTelegramWebhookConfigured().catch(() => false),
    ensureTelegramMenuButtonConfigured().catch(() => false)
  ]);

  return { workspace };
}

export async function GET(request: Request) {
  const professionalId = getMobileProfessionalId(request);
  if (!professionalId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { workspace } = await prepareTelegramConnection(professionalId);
    const result = await ensureTelegramConnectToken({
      professionalId,
      businessId: workspace.business.id,
      language: workspace.professional.language,
      timezone: workspace.professional.timezone
    });

    return NextResponse.json(telegramPayload(result));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to prepare Telegram connection." },
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
    const { workspace } = await prepareTelegramConnection(professionalId);
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

    await setTelegramConnectionSettings(connection, {
      notificationsNewBooking: typeof body.notificationsNewBooking === "boolean" ? body.notificationsNewBooking : undefined,
      notificationsCabinetBooking: typeof body.notificationsCabinetBooking === "boolean" ? body.notificationsCabinetBooking : undefined,
      notificationsRescheduled: typeof body.notificationsRescheduled === "boolean" ? body.notificationsRescheduled : undefined,
      notificationsCancelled: typeof body.notificationsCancelled === "boolean" ? body.notificationsCancelled : undefined,
      notificationsReminder: typeof body.notificationsReminder === "boolean" ? body.notificationsReminder : undefined,
      notificationsToday: typeof body.notificationsToday === "boolean" ? body.notificationsToday : undefined,
      forwardingEnabled: typeof body.forwardingEnabled === "boolean" ? body.forwardingEnabled : undefined,
      reminderLeadMinutes: typeof body.reminderLeadMinutes === "number" && Number.isFinite(body.reminderLeadMinutes) ? body.reminderLeadMinutes : undefined
    });

    const result = await ensureTelegramConnectToken({
      professionalId,
      businessId: workspace.business.id,
      language: workspace.professional.language,
      timezone: workspace.professional.timezone
    });

    return NextResponse.json(telegramPayload(result));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update Telegram settings." },
      { status: 400 }
    );
  }
}
