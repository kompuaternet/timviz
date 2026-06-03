import { NextResponse } from "next/server";
import {
  cleanMobileSocialText,
  createMobileSocialSession,
  resolveMobileSocialProfile,
  type MobileSocialProvider
} from "../../../../../lib/mobile-social-auth";

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

    return NextResponse.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social sign-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
