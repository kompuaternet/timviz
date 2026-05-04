import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionValue } from "../../../../../lib/pro-auth";
import { getProfessionalProfileById } from "../../../../../lib/pro-data";
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
  const professional = professionalId ? await getProfessionalProfileById(professionalId) : null;
  const professionalFullName = [professional?.firstName, professional?.lastName]
    .map((value) => (value || "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  const professionalAvatarUrl = professional?.avatarUrl?.trim() || null;

  return NextResponse.json({
    customer: {
      authenticated: Boolean(customerSession),
      fullName: customerSession?.fullName?.trim() || null
    },
    professional: {
      authenticated: Boolean(professionalId),
      fullName: professionalFullName || null,
      avatarUrl: professionalAvatarUrl
    }
  });
}
