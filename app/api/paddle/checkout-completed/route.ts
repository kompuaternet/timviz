import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../lib/pro-auth";
import {
  getPremiumUntilAfterCheckout,
  getProfessionalPremiumSnapshot,
  updateProfessionalPremiumFromPaddle,
  type PremiumBilling
} from "../../../../lib/premium";

export const dynamic = "force-dynamic";

function isKnownPriceId(value: unknown) {
  const priceId = typeof value === "string" ? value.trim() : "";
  return Boolean(
    priceId &&
      (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY ||
        priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY)
  );
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

  const billing = body.billing === "yearly" ? "yearly" : "monthly";
  const existing = await getProfessionalPremiumSnapshot({
    professionalId: sessionProfessionalId,
    email: body.email
  });
  const premiumUntil = getPremiumUntilAfterCheckout({
    existingPremiumUntil: existing?.premium_until,
    billing
  });

  // Paddle webhooks remain the source of truth. This fallback unlocks the trial immediately
  // after checkout and never shortens an already active paid/trial period.
  const updateResult = await updateProfessionalPremiumFromPaddle({
    professionalId: sessionProfessionalId,
    email: body.email,
    status: "trialing",
    premiumUntil,
    paddlePriceId: body.priceId
  });

  console.info("[paddle] checkout completed fallback", {
    professionalId: sessionProfessionalId,
    billing,
    priceId: body.priceId,
    previousPremiumUntil: existing?.premium_until,
    premiumUntil,
    updateResult
  });

  return NextResponse.json({ ok: true, updateResult });
}
