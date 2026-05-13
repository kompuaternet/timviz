import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import { updateProfessionalPremiumFromPaddle, type PremiumBilling } from "../../../../lib/premium";

export const dynamic = "force-dynamic";

function isKnownPriceId(value: unknown) {
  const priceId = typeof value === "string" ? value.trim() : "";
  return Boolean(
    priceId &&
      (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY ||
        priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY)
  );
}

function getTrialUntil() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString();
}

export async function POST(request: Request) {
  let body: {
    billing?: PremiumBilling;
    priceId?: string;
    userId?: string;
    email?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionProfessionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value);

  if (!sessionProfessionalId || sessionProfessionalId !== body.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isKnownPriceId(body.priceId)) {
    return NextResponse.json({ error: "Unknown price" }, { status: 400 });
  }

  // Paddle webhooks remain the source of truth. This fallback unlocks the trial immediately
  // after the hosted checkout confirms completion, then webhook events persist exact IDs/dates.
  const updateResult = await updateProfessionalPremiumFromPaddle({
    professionalId: sessionProfessionalId,
    email: body.email,
    status: "trialing",
    premiumUntil: getTrialUntil(),
    paddlePriceId: body.priceId
  });

  console.info("[paddle] checkout completed fallback", {
    professionalId: sessionProfessionalId,
    billing: body.billing,
    priceId: body.priceId,
    updateResult
  });

  return NextResponse.json({ ok: true, updateResult });
}
