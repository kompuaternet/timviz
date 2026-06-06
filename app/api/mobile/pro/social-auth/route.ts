import { NextResponse } from "next/server";
import {
  cleanMobileSocialText,
  createMobileSocialSession,
  resolveMobileSocialProfile,
  type MobileSocialProvider
} from "../../../../../lib/mobile-social-auth";
import { reportMobileRegistrationConversion } from "../../../../../lib/mobile-registration-conversions";
import { sendSuperadminTelegramNotification } from "../../../../../lib/telegram-bot";

function getMobileSocialRegistrationSource(body: Record<string, unknown>, request: Request) {
  const rawSource = cleanMobileSocialText(body.signupSource || body.source || body.platform).toLowerCase();
  const userAgent = cleanMobileSocialText(request.headers.get("user-agent")).toLowerCase();
  const source = rawSource || userAgent;

  if (source.includes("ios") || source.includes("iphone") || source.includes("ipad")) {
    return "мобильное приложение Apple";
  }

  if (source.includes("android")) {
    return "мобильное приложение Android";
  }

  return "мобильное приложение";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = cleanMobileSocialText(body.provider).toLowerCase() as MobileSocialProvider;
    const idToken = cleanMobileSocialText(body.idToken);

    if (provider !== "google" && provider !== "apple") {
      return NextResponse.json({ error: "Unsupported social provider." }, { status: 400 });
    }

    if (!idToken) {
      return NextResponse.json({ error: "Identity token is required." }, { status: 400 });
    }

    const socialProfile = await resolveMobileSocialProfile(provider, idToken, body.profile);
    const session = await createMobileSocialSession({
      provider,
      profile: socialProfile,
      language: body.language,
      country: body.country,
      timezone: body.timezone,
      currency: body.currency
    });

    if (session.isNewRegistration) {
      const registrationSource = getMobileSocialRegistrationSource(body, request);

      await sendSuperadminTelegramNotification({
        eventType: "user_registered",
        professionalId: session.professionalId,
        professionalName: session.profile.displayName,
        professionalEmail: session.profile.email,
        professionalPhone: "",
        registrationSource,
        ownerMode: "owner",
        businessName: session.businessName || undefined,
        workspaceReady: session.workspaceReady
      }).catch(() => undefined);

      await reportMobileRegistrationConversion({
        professionalId: session.professionalId,
        provider,
        email: session.profile.email,
        displayName: session.profile.displayName,
        businessName: session.businessName,
        registrationSource,
        workspaceReady: session.workspaceReady,
        language: session.profile.language,
        country: cleanMobileSocialText(body.country) || undefined,
        currency: cleanMobileSocialText(body.currency) || undefined,
        platform: cleanMobileSocialText(body.platform),
        request
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social sign-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
