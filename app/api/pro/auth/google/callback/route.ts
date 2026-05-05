import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { getSessionCookieName, signSessionValue } from "../../../../../../lib/pro-auth";
import { exchangeCodeForGoogleProfile, getGoogleOAuthSettings } from "../../../../../../lib/google-oauth";
import { getTelegramStartAppLink } from "../../../../../../lib/telegram-bot";
import {
  acceptStaffInvitation,
  getProfessionalProfileByEmail,
  updateProfessionalAvatar
} from "../../../../../../lib/pro-data";

const GOOGLE_OAUTH_STATE_COOKIE = "rezervo_google_oauth_state";
const GOOGLE_OAUTH_MODE_COOKIE = "rezervo_google_oauth_mode";
const GOOGLE_OAUTH_PKCE_COOKIE = "rezervo_google_oauth_pkce";
const GOOGLE_OAUTH_INVITE_COOKIE = "rezervo_google_oauth_invite";
const GOOGLE_OAUTH_RETURN_TO_COOKIE = "rezervo_google_oauth_return_to";

function normalizeReturnTo(value: string, fallback = "/pro/workspace") {
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

function isTelegramWebViewRequest(request: Request) {
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  return userAgent.includes("telegram");
}

function resolveStartParamFromReturnTo(returnTo: string, appUrl: string) {
  try {
    const parsed = new URL(returnTo, appUrl);
    const raw =
      parsed.searchParams.get("startapp") ||
      parsed.searchParams.get("start_param") ||
      parsed.searchParams.get("tgWebAppStartParam") ||
      "";
    const normalized = raw.trim().toLowerCase();
    if (!normalized) {
      return "calendar";
    }
    if (normalized.includes("settings") || normalized.includes("setup")) return "settings";
    if (normalized.includes("notifications") || normalized.includes("inbox")) return "notifications";
    if (normalized.includes("clients")) return "clients";
    if (normalized.includes("services")) return "services";
    if (normalized.includes("staff") || normalized.includes("team") || normalized.includes("schedule")) {
      return "staff";
    }
    if (normalized.includes("support") || normalized.includes("help")) return "support";
    return "calendar";
  } catch {
    return "calendar";
  }
}

async function resolveFinalRedirectUrl(input: {
  request: Request;
  appUrl: string;
  returnTo: string;
}) {
  if (!isTelegramSourceReturn(input.returnTo, input.appUrl)) {
    return new URL(input.returnTo, input.appUrl);
  }

  if (isTelegramWebViewRequest(input.request)) {
    return new URL(input.returnTo, input.appUrl);
  }

  const startParam = resolveStartParamFromReturnTo(input.returnTo, input.appUrl);
  const deepLink = await getTelegramStartAppLink(startParam);
  if (deepLink) {
    return new URL(deepLink);
  }

  return new URL(input.returnTo, input.appUrl);
}

function clearOAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, isSecure: boolean) {
  cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
  cookieStore.set(GOOGLE_OAUTH_MODE_COOKIE, "", {
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
  cookieStore.set(GOOGLE_OAUTH_INVITE_COOKIE, "", {
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
  const mode = cookieStore.get(GOOGLE_OAUTH_MODE_COOKIE)?.value === "register" ? "register" : "login";
  const inviteToken = cookieStore.get(GOOGLE_OAUTH_INVITE_COOKIE)?.value?.trim() || "";
  const returnTo = normalizeReturnTo(
    cookieStore.get(GOOGLE_OAUTH_RETURN_TO_COOKIE)?.value?.trim() || "",
    "/pro/workspace"
  );

  if (!code || !state || !expectedState || !codeVerifier || state !== expectedState) {
    clearOAuthCookies(cookieStore, isSecure);
    const errorUrl = await resolveFinalRedirectUrl({
      request,
      appUrl,
      returnTo
    });
    errorUrl.searchParams.set("google_error", "state");
    return NextResponse.redirect(errorUrl);
  }

  try {
    const settings = getGoogleOAuthSettings(request);
    const profile = await exchangeCodeForGoogleProfile({
      code,
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      redirectUri: settings.redirectUri,
      codeVerifier
    });
    const professional = await getProfessionalProfileByEmail(profile.email);

    clearOAuthCookies(cookieStore, isSecure);

    if (professional && professional.accountStatus === "active") {
      if (profile.avatarUrl) {
        await updateProfessionalAvatar(professional.id, profile.avatarUrl).catch(() => undefined);
      }

      if (inviteToken) {
        await acceptStaffInvitation({
          professionalId: professional.id,
          invitationToken: inviteToken
        }).catch(() => undefined);
      }

      cookieStore.set(getSessionCookieName(), signSessionValue(professional.id), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 7
      });
      const finalRedirect = await resolveFinalRedirectUrl({
        request,
        appUrl,
        returnTo
      });
      return NextResponse.redirect(finalRedirect);
    }

    const createAccountUrl = new URL("/pro/create-account", appUrl);
    createAccountUrl.searchParams.set("google", "1");
    createAccountUrl.searchParams.set("email", profile.email);
    if (inviteToken) {
      createAccountUrl.searchParams.set("invite", inviteToken);
    }
    if (profile.givenName) {
      createAccountUrl.searchParams.set("firstName", profile.givenName);
    }
    if (profile.familyName) {
      createAccountUrl.searchParams.set("lastName", profile.familyName);
    }
    if (profile.locale) {
      createAccountUrl.searchParams.set("locale", profile.locale);
    }
    if (profile.avatarUrl) {
      createAccountUrl.searchParams.set("avatarUrl", profile.avatarUrl);
    }
    if (mode === "login") {
      createAccountUrl.searchParams.set("google_from", "login");
    }

    return NextResponse.redirect(createAccountUrl);
  } catch {
    clearOAuthCookies(cookieStore, isSecure);
    const errorUrl = await resolveFinalRedirectUrl({
      request,
      appUrl,
      returnTo
    });
    errorUrl.searchParams.set("google_error", "oauth");
    return NextResponse.redirect(errorUrl);
  }
}
