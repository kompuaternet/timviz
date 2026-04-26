import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getPublicCustomerCookieName,
  verifyPublicCustomerSession
} from "../../../../../lib/public-customer-auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifyPublicCustomerSession(cookieStore.get(getPublicCustomerCookieName())?.value);

  return NextResponse.json({
    authenticated: Boolean(session),
    customer: session
  });
}
