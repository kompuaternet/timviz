import { NextResponse } from "next/server";
import { getClientIp, verifyCaptchaToken } from "../../../../../lib/auth-security";
import { signSessionValue } from "../../../../../lib/pro-auth";
import { createProfessionalSetup, getProfessionalProfileById } from "../../../../../lib/pro-data";

const defaultServiceMode = "Клиенты приходят в мое физическое заведение";

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const firstName = cleanText(body.firstName);
    const lastName = cleanText(body.lastName);
    const email = cleanText(body.email).toLowerCase();
    const password = String(body.password ?? "");
    const phone = cleanText(body.phone);
    const companyName = cleanText(body.companyName);
    const language = cleanText(body.language) || "uk";
    const country = cleanText(body.country) || "Ukraine";
    const timezone = cleanText(body.timezone) || "Europe/Kyiv";
    const currency = cleanText(body.currency) || "UAH";

    if (!firstName || !email || !password || !phone || !companyName) {
      return NextResponse.json({ error: "Required fields are missing." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must contain at least 6 characters." }, { status: 400 });
    }

    const captchaOk = await verifyCaptchaToken(body.captchaToken, getClientIp(request));
    if (!captchaOk) {
      return NextResponse.json({ error: "Complete the security check." }, { status: 400 });
    }

    const result = await createProfessionalSetup({
      account: {
        firstName,
        lastName,
        email,
        password,
        phone,
        country,
        timezone,
        language,
        currency
      },
      setup: {
        ownerMode: "owner",
        joinBusinessId: "",
        joinBusinessName: "",
        joinBusinessRole: "",
        companyName,
        website: "",
        categories: [],
        services: [],
        accountType: "solo",
        serviceMode: defaultServiceMode,
        address: "",
        addressDetails: "",
        addressLat: null,
        addressLon: null
      }
    });

    const profile = await getProfessionalProfileById(result.professionalId);
    const displayName =
      `${profile?.firstName || firstName} ${profile?.lastName || lastName}`.trim() || email;

    return NextResponse.json({
      ...result,
      token: signSessionValue(result.professionalId),
      profile: {
        id: result.professionalId,
        email: profile?.email || email,
        displayName
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
