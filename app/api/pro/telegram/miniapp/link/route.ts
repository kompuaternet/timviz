import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../../../../lib/pro-data";
import { verifyTelegramMiniAppInitData } from "../../../../../../lib/telegram-miniapp-auth";
import { isTelegramBotConfigured, linkTelegramIdentityToProfessional } from "../../../../../../lib/telegram-bot";

function getTelegramBotToken() {
  return (
    process.env.TELEGRAM_BOOKING_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    ""
  ).trim();
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const professionalId = verifySessionValue(
      cookieStore.get(getSessionCookieName())?.value
    );

    if (!professionalId) {
      return NextResponse.json({ errorCode: "unauthorized", error: "Unauthorized" }, { status: 401 });
    }

    if (!isTelegramBotConfigured()) {
      return NextResponse.json(
        { errorCode: "bot_not_configured", error: "Telegram bot is not configured." },
        { status: 503 }
      );
    }

    const workspace = await getWorkspaceSnapshot(professionalId);
    if (!workspace) {
      return NextResponse.json({ errorCode: "workspace_missing", error: "Workspace not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Partial<{
      initData: string;
    }>;
    const initData = String(body.initData || "").trim();
    if (!initData) {
      return NextResponse.json({ errorCode: "missing_init_data", error: "Missing initData." }, { status: 400 });
    }

    const verified = verifyTelegramMiniAppInitData({
      initData,
      botToken: getTelegramBotToken()
    });

    if (!verified) {
      return NextResponse.json(
        { errorCode: "invalid_init_data", error: "Invalid Telegram initData." },
        { status: 401 }
      );
    }

    try {
      const linked = await linkTelegramIdentityToProfessional({
        professionalId,
        businessId: workspace.business.id,
        language: workspace.professional.language,
        timezone: workspace.professional.timezone,
        telegramUserId: verified.user.id,
        telegramUsername: verified.user.username,
        telegramFirstName: verified.user.firstName,
        telegramLastName: verified.user.lastName,
        telegramLanguageCode: verified.user.languageCode
      });

      return NextResponse.json({
        ok: true,
        linked: linked.linked,
        professionalId
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Link failed.";
      const isConflict = /already linked to another profile/i.test(message);
      return NextResponse.json(
        {
          errorCode: isConflict ? "already_linked_other_profile" : "link_failed",
          error: message
        },
        { status: isConflict ? 409 : 400 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to link Telegram account.";
    return NextResponse.json({ errorCode: "request_failed", error: message }, { status: 400 });
  }
}
