import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import {
  getPublicCustomerCookieName,
  verifyPublicCustomerSession
} from "../../../../../lib/public-customer-auth";

export async function GET() {
  const cookieStore = await cookies();
  const customerSession = verifyPublicCustomerSession(
    cookieStore.get(getPublicCustomerCookieName())?.value
  );
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value);

  return NextResponse.json({
    customer: {
      authenticated: Boolean(customerSession),
      fullName: customerSession?.fullName?.trim() || null
    },
    professional: {
      authenticated: Boolean(professionalId)
    }
  });
}
