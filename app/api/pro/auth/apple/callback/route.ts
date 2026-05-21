import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getPublicAppUrl } from "../../../../../../lib/app-url";
import { parseAppleUserProfile, verifyAppleIdentityToken } from "../../../../../../lib/apple-oauth";
import { getSessionCookieName, signSessionValue } from "../../../../../../lib/pro-auth";
import {
  activateProfessionalEmailByEmail,
  getProfessionalProfileByEmail
} from "../../../../../../lib/pro-data";

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

function clearAppleCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, isSecure: boolean) {
  const sameSite = isSecure ? "none" : "lax";
  cookieStore.set(APPLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite,
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
  cookieStore.set(APPLE_OAUTH_RETURN_TO_COOKIE, "", {
    httpOnly: true,
    sameSite,
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
  cookieStore.set(APPLE_OAUTH_NONCE_COOKIE, "", {
    httpOnly: true,
    sameSite,
    path: "/",
    secure: isSecure,
    maxAge: 0
  });
}

function redirectWithError(request: Request, error: "state" | "oauth") {
  const target = new URL("/pro/login", getPublicAppUrl(request));
  target.searchParams.set("apple_error", error);
  return NextResponse.redirect(target);
}

async function handleAppleCallback(request: Request, form: FormData) {
  const isSecure = isSecureRequest(request);
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(APPLE_OAUTH_STATE_COOKIE)?.value || "";
  const expectedNonce = cookieStore.get(APPLE_OAUTH_NONCE_COOKIE)?.value || "";
  const returnTo = normalizeReturnTo(cookieStore.get(APPLE_OAUTH_RETURN_TO_COOKIE)?.value || "");
  const state = String(form.get("state") || "").trim();
  const idToken = String(form.get("id_token") || "").trim();
  const rawUser = String(form.get("user") || "").trim();

  if (!expectedState || !state || state !== expectedState || !idToken) {
    clearAppleCookies(cookieStore, isSecure);
    return redirectWithError(request, "state");
  }

  try {
    const appleUser = parseAppleUserProfile(rawUser);
    const appleProfile = await verifyAppleIdentityToken(idToken, appleUser, expectedNonce);
    let professional = await getProfessionalProfileByEmail(appleProfile.email);

    if (professional?.accountStatus === "pending_email") {
      await activateProfessionalEmailByEmail(appleProfile.email);
      professional = await getProfessionalProfileByEmail(appleProfile.email);
    }

    clearAppleCookies(cookieStore, isSecure);

    if (professional?.id && professional.accountStatus === "active") {
      cookieStore.set(getSessionCookieName(), signSessionValue(professional.id), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 7
      });
      return NextResponse.redirect(new URL(returnTo, getPublicAppUrl(request)));
    }

    if (professional?.accountStatus === "blocked" || professional?.accountStatus === "deleted") {
      return redirectWithError(request, "oauth");
    }

    const createAccountUrl = new URL("/pro/create-account", getPublicAppUrl(request));
    createAccountUrl.searchParams.set("apple", "1");
    createAccountUrl.searchParams.set("email", appleProfile.email);
    if (appleProfile.givenName) createAccountUrl.searchParams.set("firstName", appleProfile.givenName);
    if (appleProfile.familyName) createAccountUrl.searchParams.set("lastName", appleProfile.familyName);
    return NextResponse.redirect(createAccountUrl);
  } catch {
    clearAppleCookies(cookieStore, isSecure);
    return redirectWithError(request, "oauth");
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  return handleAppleCallback(request, form);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const form = new FormData();
  for (const key of ["state", "id_token", "user"]) {
    const value = url.searchParams.get(key);
    if (value) form.set(key, value);
  }
  return handleAppleCallback(request, form);
}
