import { createPublicKey, createVerify, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { signSessionValue } from "../../../../../lib/pro-auth";
import {
  activateProfessionalEmailByEmail,
  createProfessionalSetup,
  getProfessionalProfileByEmail,
  getProfessionalProfileById,
  updateProfessionalAvatar
} from "../../../../../lib/pro-data";

type SocialProvider = "google" | "apple";

type SocialProfile = {
  email: string;
  givenName: string;
  familyName: string;
  fullName: string;
  avatarUrl: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeLanguage(value: unknown) {
  const language = cleanText(value).toLowerCase();
  return ["uk", "ru", "en", "fr", "pl", "cs", "es", "de"].includes(language) ? language : "uk";
}

function normalizeCountry(value: unknown) {
  return cleanText(value) || "Ukraine";
}

function normalizeTimezone(value: unknown) {
  return cleanText(value) || "Europe/Kyiv";
}

function normalizeCurrency(value: unknown) {
  return cleanText(value) || "UAH";
}

function getEmailName(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Timviz";
}

function buildCompanyName(profile: SocialProfile) {
  const name = profile.givenName || profile.fullName || getEmailName(profile.email);
  return `${name} Timviz`.trim();
}

function getAllowedGoogleAudiences() {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  ]
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function splitEnvList(value: unknown) {
  return cleanText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function verifyGoogleIdentityToken(idToken: string): Promise<SocialProfile> {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    cache: "no-store"
  });
  const payload = (await response.json().catch(() => ({}))) as {
    aud?: string;
    email?: string;
    email_verified?: string | boolean;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.email) {
    throw new Error(payload.error_description || payload.error || "Google sign-in failed.");
  }

  if (payload.email_verified === false || payload.email_verified === "false") {
    throw new Error("Google email is not verified.");
  }

  const allowedAudiences = getAllowedGoogleAudiences();
  if (!allowedAudiences.length) {
    throw new Error("Google client ID is not configured.");
  }

  if (!payload.aud || !allowedAudiences.includes(payload.aud)) {
    throw new Error("Google token audience is not allowed.");
  }

  return {
    email: payload.email.trim().toLowerCase(),
    givenName: cleanText(payload.given_name),
    familyName: cleanText(payload.family_name),
    fullName: cleanText(payload.name),
    avatarUrl: cleanText(payload.picture)
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="), "base64");
}

function decodeJwtPart<T>(value: string): T {
  return JSON.parse(decodeBase64Url(value).toString("utf8")) as T;
}

async function verifyAppleIdentityToken(idToken: string, fallbackProfile: Partial<SocialProfile>): Promise<SocialProfile> {
  const [encodedHeader, encodedPayload, encodedSignature] = idToken.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Invalid Apple identity token.");
  }

  const header = decodeJwtPart<{ kid?: string; alg?: string }>(encodedHeader);
  const payload = decodeJwtPart<{
    iss?: string;
    aud?: string;
    exp?: number;
    email?: string;
    email_verified?: string | boolean;
  }>(encodedPayload);

  if (payload.iss !== "https://appleid.apple.com") {
    throw new Error("Invalid Apple token issuer.");
  }

  const allowedAudiences = [
    process.env.APPLE_BUNDLE_ID,
    process.env.MOBILE_APPLE_CLIENT_ID,
    process.env.EXPO_PUBLIC_APPLE_BUNDLE_ID,
    ...splitEnvList(process.env.APPLE_ALLOWED_AUDIENCES),
    "com.timviz.master"
  ]
    .map((item) => cleanText(item))
    .filter(Boolean);
  if (payload.aud && allowedAudiences.length && !allowedAudiences.includes(payload.aud)) {
    throw new Error("Apple token audience is not allowed.");
  }

  if (!payload.exp || payload.exp * 1000 < Date.now()) {
    throw new Error("Apple token expired.");
  }

  const keysResponse = await fetch("https://appleid.apple.com/auth/keys", { cache: "no-store" });
  const keysPayload = (await keysResponse.json().catch(() => ({}))) as { keys?: Array<Record<string, unknown>> };
  const jwk = keysPayload.keys?.find((item) => item.kid === header.kid);
  if (!jwk) {
    throw new Error("Apple public key not found.");
  }

  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();
  const publicKey = createPublicKey({ key: jwk as any, format: "jwk" });
  const isValid = verifier.verify(publicKey, decodeBase64Url(encodedSignature));
  if (!isValid) {
    throw new Error("Apple token signature is invalid.");
  }

  const email = cleanText(payload.email || fallbackProfile.email).toLowerCase();
  if (!email) {
    throw new Error("Apple did not return an email for this account.");
  }

  return {
    email,
    givenName: cleanText(fallbackProfile.givenName),
    familyName: cleanText(fallbackProfile.familyName),
    fullName: cleanText(fallbackProfile.fullName),
    avatarUrl: ""
  };
}

async function resolveSocialProfile(provider: SocialProvider, idToken: string, rawProfile: unknown) {
  const profileInput = (rawProfile && typeof rawProfile === "object" ? rawProfile : {}) as Record<string, unknown>;
  const fallbackProfile: Partial<SocialProfile> = {
    email: cleanText(profileInput.email).toLowerCase(),
    givenName: cleanText(profileInput.firstName || profileInput.givenName),
    familyName: cleanText(profileInput.lastName || profileInput.familyName),
    fullName: cleanText(profileInput.fullName),
    avatarUrl: cleanText(profileInput.avatarUrl)
  };

  if (provider === "google") {
    return verifyGoogleIdentityToken(idToken);
  }

  return verifyAppleIdentityToken(idToken, fallbackProfile);
}

async function getOrCreateSocialProfessional(input: {
  provider: SocialProvider;
  profile: SocialProfile;
  language: string;
  country: string;
  timezone: string;
  currency: string;
}) {
  const existing = await getProfessionalProfileByEmail(input.profile.email);
  if (existing?.id && existing.accountStatus === "active") {
    if (input.profile.avatarUrl) {
      await updateProfessionalAvatar(existing.id, input.profile.avatarUrl).catch(() => undefined);
    }
    return existing.id;
  }

  if (existing?.id && existing.accountStatus === "pending_email") {
    await activateProfessionalEmailByEmail(input.profile.email);
    if (input.profile.avatarUrl) {
      await updateProfessionalAvatar(existing.id, input.profile.avatarUrl).catch(() => undefined);
    }
    return existing.id;
  }

  const firstName = input.profile.givenName || input.profile.fullName || getEmailName(input.profile.email);
  const result = await createProfessionalSetup({
    account: {
      firstName,
      lastName: input.profile.familyName,
      email: input.profile.email,
      password: `social-${input.provider}-${randomUUID()}`,
      authProvider: input.provider,
      emailConfirmed: true,
      phone: "",
      country: input.country,
      timezone: input.timezone,
      language: input.language,
      currency: input.currency,
      avatarUrl: input.profile.avatarUrl
    },
    setup: {
      ownerMode: "owner",
      joinBusinessId: "",
      joinBusinessName: "",
      joinBusinessRole: "",
      companyName: buildCompanyName(input.profile),
      website: "",
      categories: [],
      services: [],
      accountType: "solo",
      serviceMode: "Клиенты приходят в мое физическое заведение",
      address: "",
      addressDetails: "",
      addressLat: null,
      addressLon: null
    }
  });

  return result.professionalId;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = cleanText(body.provider).toLowerCase() as SocialProvider;
    const idToken = cleanText(body.idToken);

    if (provider !== "google" && provider !== "apple") {
      return NextResponse.json({ error: "Unsupported social provider." }, { status: 400 });
    }

    if (!idToken) {
      return NextResponse.json({ error: "Identity token is required." }, { status: 400 });
    }

    const socialProfile = await resolveSocialProfile(provider, idToken, body.profile);
    const professionalId = await getOrCreateSocialProfessional({
      provider,
      profile: socialProfile,
      language: normalizeLanguage(body.language),
      country: normalizeCountry(body.country),
      timezone: normalizeTimezone(body.timezone),
      currency: normalizeCurrency(body.currency)
    });

    const profile = await getProfessionalProfileById(professionalId);
    const displayName =
      `${profile?.firstName || socialProfile.givenName} ${profile?.lastName || socialProfile.familyName}`.trim() ||
      profile?.email ||
      socialProfile.email;

    return NextResponse.json({
      professionalId,
      token: signSessionValue(professionalId),
      profile: {
        id: professionalId,
        email: profile?.email || socialProfile.email,
        displayName
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social sign-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
