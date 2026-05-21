import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { getAppleOAuthSettings } from "../../../../../../lib/apple-oauth";

const APPLE_OAUTH_STATE_COOKIE = "rezervo_apple_oauth_state";
const APPLE_OAUTH_NONCE_COOKIE = "rezervo_apple_oauth_nonce";
const APPLE_OAUTH_RETURN_TO_COOKIE = "rezervo_apple_oauth_return_to";

function normalizeReturnTo(value: string, fallback = "/pro/workspace") {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  return trimmed;
}

function isSecureRequest(request: Request) {
  return getPublicAppUrl(request).startsWith("https://");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = normalizeReturnTo(url.searchParams.get("return_to") || "");
  let settings: ReturnType<typeof getAppleOAuthSettings>;
  try {
    settings = getAppleOAuthSettings(request);
  } catch {
    const fallback = new URL("/pro/login", getPublicAppUrl(request));
    fallback.searchParams.set("apple_error", "config");
    fallback.searchParams.set("return_to", returnTo);
    return NextResponse.redirect(fallback);
  }

  const state = randomBytes(24).toString("hex");
  const nonce = randomBytes(24).toString("hex");
  const isSecure = isSecureRequest(request);
  const sameSite = isSecure ? "none" : "lax";
  const cookieStore = await cookies();
  cookieStore.set(APPLE_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite,
    path: "/",
    secure: isSecure,
    maxAge: 60 * 10
  });
  cookieStore.set(APPLE_OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite,
    path: "/",
    secure: isSecure,
    maxAge: 60 * 10
  });
  cookieStore.set(APPLE_OAUTH_RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    sameSite,
    path: "/",
    secure: isSecure,
    maxAge: 60 * 10
  });

  const authParams = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: settings.redirectUri,
    response_type: "code id_token",
    scope: "name email",
    response_mode: "form_post",
    state,
    nonce
  });
  const authUrl = new URL("https://appleid.apple.com/auth/authorize");
  authUrl.search = authParams.toString().replace(/\+/g, "%20");

  return NextResponse.redirect(authUrl);
}
