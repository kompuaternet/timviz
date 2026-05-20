import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";

const APPLE_OAUTH_STATE_COOKIE = "rezervo_apple_oauth_state";
const APPLE_OAUTH_RETURN_TO_COOKIE = "rezervo_apple_oauth_return_to";

function normalizeReturnTo(value: string, fallback = "/pro/workspace") {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  return trimmed;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = normalizeReturnTo(url.searchParams.get("return_to") || "");
  const clientId = process.env.APPLE_CLIENT_ID || process.env.APPLE_SERVICE_ID || "";
  const redirectUri =
    process.env.APPLE_REDIRECT_URI || `${getPublicAppUrl(request)}/api/pro/auth/apple/callback`;

  if (!clientId) {
    const fallback = new URL("/pro/login", getPublicAppUrl(request));
    fallback.searchParams.set("apple_error", "config");
    fallback.searchParams.set("return_to", returnTo);
    return NextResponse.redirect(fallback);
  }

  const state = randomBytes(24).toString("hex");
  const isSecure = url.protocol === "https:";
  const cookieStore = await cookies();
  cookieStore.set(APPLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 60 * 10
  });
  cookieStore.set(APPLE_OAUTH_RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 60 * 10
  });

  const authUrl = new URL("https://appleid.apple.com/auth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code id_token");
  authUrl.searchParams.set("scope", "name email");
  authUrl.searchParams.set("response_mode", "form_post");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl);
}
