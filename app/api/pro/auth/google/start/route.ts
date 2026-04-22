import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildGoogleAuthUrl, getGoogleOAuthSettings } from "../../../../../../lib/google-oauth";

const GOOGLE_OAUTH_STATE_COOKIE = "rezervo_google_oauth_state";
const GOOGLE_OAUTH_MODE_COOKIE = "rezervo_google_oauth_mode";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") === "register" ? "register" : "login";
    const origin = url.origin;
    const settings = getGoogleOAuthSettings(origin);
    const state = randomBytes(24).toString("hex");

    const cookieStore = await cookies();
    cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60 * 10
    });
    cookieStore.set(GOOGLE_OAUTH_MODE_COOKIE, mode, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge: 60 * 10
    });

    const authUrl = buildGoogleAuthUrl({
      clientId: settings.clientId,
      redirectUri: settings.redirectUri,
      state
    });

    return NextResponse.redirect(authUrl);
  } catch {
    return NextResponse.redirect(new URL("/pro/login?google_error=config", request.url));
  }
}
