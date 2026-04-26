import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  clearPublicCustomerSessionCookieOptions,
  getPublicCustomerCookieName
} from "../../../../../lib/public-customer-auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const isSecure = new URL(request.url).protocol === "https:";
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    getPublicCustomerCookieName(),
    "",
    clearPublicCustomerSessionCookieOptions(isSecure)
  );
  cookieStore.set(
    getPublicCustomerCookieName(),
    "",
    clearPublicCustomerSessionCookieOptions(isSecure)
  );
  return response;
}
