import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { exchangeCodeForGoogleProfile, getGoogleOAuthSettings } from "../../../../../../lib/google-oauth";
import { getTelegramStartAppLinkSync } from "../../../../../../lib/telegram-bot";
import {
  getPublicCustomerCookieName,
  signPublicCustomerSession
} from "../../../../../../lib/public-customer-auth";

const GOOGLE_OAUTH_STATE_COOKIE = "timviz_public_google_oauth_state";
const GOOGLE_OAUTH_RETURN_TO_COOKIE = "timviz_public_google_return_to";
const GOOGLE_OAUTH_PKCE_COOKIE = "timviz_public_google_oauth_pkce";

function normalizeReturnTo(value: string, fallback = "/") {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  return trimmed;
}

function isTelegramSourceReturn(returnTo: string, appUrl: string) {
  try {
    const parsed = new URL(returnTo, appUrl);
    return parsed.pathname.startsWith("/telegram") || parsed.searchParams.get("source") === "telegram";
  } catch {
    return false;
  }
}

function extractTelegramStartParam(returnTo: string, appUrl: string) {
  try {
    const parsed = new URL(returnTo, appUrl);
    const startParam =
      parsed.searchParams.get("startapp") ||
      parsed.searchParams.get("start_param") ||
      parsed.searchParams.get("tgWebAppStartParam") ||
      "";
    return startParam.trim() || "calendar";
  } catch {
    return "calendar";
  }
}

function resolveReturnTarget(returnTo: string, appUrl: string) {
  const fallback = new URL(normalizeReturnTo(returnTo), appUrl);
  if (!isTelegramSourceReturn(returnTo, appUrl)) {
    return fallback;
  }

  const startParam = extractTelegramStartParam(returnTo, appUrl);
  const telegramLaunchLink = getTelegramStartAppLinkSync(startParam);
  if (telegramLaunchLink) {
    try {
      return new URL(telegramLaunchLink);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function clearOAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, isSecure: boolean) {
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
  cookieStore.set(GOOGLE_OAUTH_RETURN_TO_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
  cookieStore.set(GOOGLE_OAUTH_PKCE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appUrl = getPublicAppUrl(request);
  const isSecure = url.protocol === "https:";
  const code = url.searchParams.get("code")?.trim() || "";
  const state = url.searchParams.get("state")?.trim() || "";
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value || "";
  const codeVerifier = cookieStore.get(GOOGLE_OAUTH_PKCE_COOKIE)?.value || "";
  const returnTo = normalizeReturnTo(cookieStore.get(GOOGLE_OAUTH_RETURN_TO_COOKIE)?.value || "/", "/");
  const returnTarget = resolveReturnTarget(returnTo, appUrl);

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    clearOAuthCookies(cookieStore, isSecure);
    return NextResponse.redirect(returnTarget);
  }

  try {
    const settings = getGoogleOAuthSettings(request, "/api/public/auth/google/callback");
    const profile = await exchangeCodeForGoogleProfile({
      code,
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      redirectUri: settings.redirectUri,
      codeVerifier
    });

    clearOAuthCookies(cookieStore, isSecure);

    const response = NextResponse.redirect(returnTarget);
    response.cookies.set(getPublicCustomerCookieName(), signPublicCustomerSession(profile), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isSecure,
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch {
    clearOAuthCookies(cookieStore, isSecure);
    return NextResponse.redirect(returnTarget);
  }
}
