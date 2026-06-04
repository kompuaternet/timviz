import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { syncLatestMonobankSubscriptionForUser } from "../../../../../lib/monobank-subscription-sync";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";

export const dynamic = "force-dynamic";

async function refreshSubscription() {
  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value || "") || "";
  if (!professionalId) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncLatestMonobankSubscriptionForUser(professionalId);
    return NextResponse.json(result);
  } catch (error) {
    console.warn("[monobank] subscription refresh failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ ok: false, error: "Could not refresh subscription status." }, { status: 502 });
  }
}

export async function GET() {
  return refreshSubscription();
}

export async function POST() {
  return refreshSubscription();
}
