import { NextResponse } from "next/server";
import { processTelegramReminders } from "../../../../lib/telegram-bot";

function isAuthorized(request: Request) {
  const expected =
    (process.env.TELEGRAM_REMINDERS_SECRET || process.env.CRON_SECRET || "").trim();

  if (!expected) {
    return true;
  }

  const url = new URL(request.url);
  const fromQuery = (url.searchParams.get("secret") || "").trim();
  const fromHeader = (request.headers.get("x-cron-secret") || "").trim();
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";

  return fromQuery === expected || fromHeader === expected || bearer === expected;
}

async function runReminders(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await processTelegramReminders();
  return NextResponse.json({ ok: true, ...stats });
}

export async function GET(request: Request) {
  return runReminders(request);
}

export async function POST(request: Request) {
  return runReminders(request);
}
