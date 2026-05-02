import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../../lib/pro-data";
import {
  ensureTelegramConnectToken,
  isTelegramBotConfigured
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
        notificationsReminder: result.connection.notificationsReminder,
        notificationsToday: result.connection.notificationsToday,
        forwardingEnabled: result.connection.forwardingEnabled
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare Telegram connection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
