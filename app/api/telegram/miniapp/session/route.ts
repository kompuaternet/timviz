import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, signSessionValue } from "../../../../../lib/pro-auth";
import {
  getTelegramConnectionByTelegramUserId,
  isTelegramBotConfigured,
  touchTelegramConnection
} from "../../../../../lib/telegram-bot";
import { verifyTelegramMiniAppInitData } from "../../../../../lib/telegram-miniapp-auth";

function getTelegramBotToken() {
  return (
    process.env.TELEGRAM_BOOKING_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    ""
  ).trim();
}

export async function POST(request: Request) {
  try {
    if (!isTelegramBotConfigured()) {
      return NextResponse.json({ error: "Telegram bot is not configured." }, { status: 503 });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      initData: string;
      startParam: string;
    }>;
    const initData = String(body.initData || "").trim();
    if (!initData) {
      return NextResponse.json({ error: "Missing initData." }, { status: 400 });
    }

    const botToken = getTelegramBotToken();
    const verified = verifyTelegramMiniAppInitData({
      initData,
      botToken
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid Telegram initData." }, { status: 401 });
    }

    const connection = await getTelegramConnectionByTelegramUserId(verified.user.id);
    if (!connection) {
      return NextResponse.json(
        {
          error: "This Telegram user is not connected to Timviz yet.",
          connectRequired: true
        },
        { status: 404 }
      );
    }

    await touchTelegramConnection(connection, verified.user.languageCode || connection.language).catch(
      () => null
    );

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), signSessionValue(connection.professionalId), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60 * 60 * 24 * 7
    });

    const startParam = String(body.startParam || verified.startParam || "").trim().toLowerCase();
    const redirectPath =
      startParam === "settings" || startParam === "setup"
        ? "/pro/settings?source=telegram"
        : startParam === "clients"
          ? "/pro/clients?source=telegram"
          : startParam === "services"
            ? "/pro/services?source=telegram"
            : startParam === "staff" || startParam === "team" || startParam === "schedule"
              ? "/pro/staff/schedule?source=telegram"
              : "/pro/calendar?source=telegram";

    return NextResponse.json({
      ok: true,
      redirectPath,
      professionalId: connection.professionalId
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Telegram mini app session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
