import { createPublicKey, createVerify, randomUUID } from "crypto";
import { signSessionValue } from "./pro-auth";
import {
  activateProfessionalEmailByEmail,
  createProfessionalSetup,
  getProfessionalProfileByEmail,
  getProfessionalProfileById,
  updateProfessionalIdentity
} from "./pro-data";

export type MobileSocialProvider = "google" | "apple";

export type MobileSocialProfile = {
  email: string;
  givenName: string;
  familyName: string;
  fullName: string;
  avatarUrl: string;
};

const TIMVIZ_IOS_GOOGLE_CLIENT_ID = "768484064485-3k8u9fjgoj2usbntj7bmg3evj6o588aj.apps.googleusercontent.com";

export function cleanMobileSocialText(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeMobileSocialLanguage(value: unknown) {
  const language = cleanMobileSocialText(value).toLowerCase();
  return ["uk", "ru", "en", "fr", "pl", "cs", "es", "de"].includes(language) ? language : "uk";
}

export function normalizeMobileSocialCountry(value: unknown) {
  return cleanMobileSocialText(value) || "Ukraine";
}

export function normalizeMobileSocialTimezone(value: unknown) {
  return cleanMobileSocialText(value) || "Europe/Kyiv";
}

export function normalizeMobileSocialCurrency(value: unknown) {
  return cleanMobileSocialText(value) || "UAH";
}

function getEmailName(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Timviz";
}

function buildCompanyName(profile: MobileSocialProfile) {
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
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    TIMVIZ_IOS_GOOGLE_CLIENT_ID
  ]
    .map((item) => cleanMobileSocialText(item))
    .filter(Boolean);
}

function splitEnvList(value: unknown) {
  return cleanMobileSocialText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function verifyGoogleIdentityToken(idToken: string): Promise<MobileSocialProfile> {
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
    givenName: cleanMobileSocialText(payload.given_name),
    familyName: cleanMobileSocialText(payload.family_name),
    fullName: cleanMobileSocialText(payload.name),
    avatarUrl: cleanMobileSocialText(payload.picture)
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="), "base64");
}

function decodeJwtPart<T>(value: string): T {
  return JSON.parse(decodeBase64Url(value).toString("utf8")) as T;
}

export async function verifyAppleIdentityToken(idToken: string, fallbackProfile: Partial<MobileSocialProfile>): Promise<MobileSocialProfile> {
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
    .map((item) => cleanMobileSocialText(item))
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

  const email = cleanMobileSocialText(payload.email || fallbackProfile.email).toLowerCase();
  if (!email) {
    throw new Error("Apple did not return an email for this account.");
  }

  return {
    email,
    givenName: cleanMobileSocialText(fallbackProfile.givenName),
    familyName: cleanMobileSocialText(fallbackProfile.familyName),
    fullName: cleanMobileSocialText(fallbackProfile.fullName),
    avatarUrl: ""
  };
}

export async function resolveMobileSocialProfile(provider: MobileSocialProvider, idToken: string, rawProfile: unknown) {
  const profileInput = (rawProfile && typeof rawProfile === "object" ? rawProfile : {}) as Record<string, unknown>;
  const fallbackProfile: Partial<MobileSocialProfile> = {
    email: cleanMobileSocialText(profileInput.email).toLowerCase(),
    givenName: cleanMobileSocialText(profileInput.firstName || profileInput.givenName),
    familyName: cleanMobileSocialText(profileInput.lastName || profileInput.familyName),
    fullName: cleanMobileSocialText(profileInput.fullName),
    avatarUrl: cleanMobileSocialText(profileInput.avatarUrl)
  };

  if (provider === "google") {
    return verifyGoogleIdentityToken(idToken);
  }

  return verifyAppleIdentityToken(idToken, fallbackProfile);
}

export async function getOrCreateMobileSocialProfessional(input: {
  provider: MobileSocialProvider;
  profile: MobileSocialProfile;
  language: string;
  country: string;
  timezone: string;
  currency: string;
}) {
  const existing = await getProfessionalProfileByEmail(input.profile.email);
  if (existing?.id && existing.accountStatus === "active") {
    const nextFirstName = existing.firstName || input.profile.givenName || input.profile.fullName || "";
    const nextLastName = existing.lastName || input.profile.familyName || "";
    if (input.profile.avatarUrl || nextFirstName !== existing.firstName || nextLastName !== existing.lastName) {
      await updateProfessionalIdentity(existing.id, {
        firstName: nextFirstName,
        lastName: nextLastName,
        avatarUrl: input.profile.avatarUrl || existing.avatarUrl || ""
      }).catch(() => undefined);
    }
    return existing.id;
  }

  if (existing?.id && existing.accountStatus === "pending_email") {
    await activateProfessionalEmailByEmail(input.profile.email);
    const nextFirstName = existing.firstName || input.profile.givenName || input.profile.fullName || "";
    const nextLastName = existing.lastName || input.profile.familyName || "";
    if (input.profile.avatarUrl || nextFirstName !== existing.firstName || nextLastName !== existing.lastName) {
      await updateProfessionalIdentity(existing.id, {
        firstName: nextFirstName,
        lastName: nextLastName,
        avatarUrl: input.profile.avatarUrl || existing.avatarUrl || ""
      }).catch(() => undefined);
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

export async function createMobileSocialSession(input: {
  provider: MobileSocialProvider;
  profile: MobileSocialProfile;
  language: unknown;
  country: unknown;
  timezone: unknown;
  currency: unknown;
}) {
  const professionalId = await getOrCreateMobileSocialProfessional({
    provider: input.provider,
    profile: input.profile,
    language: normalizeMobileSocialLanguage(input.language),
    country: normalizeMobileSocialCountry(input.country),
    timezone: normalizeMobileSocialTimezone(input.timezone),
    currency: normalizeMobileSocialCurrency(input.currency)
  });
  const profile = await getProfessionalProfileById(professionalId);
  const displayName =
    `${profile?.firstName || input.profile.givenName} ${profile?.lastName || input.profile.familyName}`.trim() ||
    profile?.email ||
    input.profile.email;

  return {
    professionalId,
    token: signSessionValue(professionalId),
    profile: {
      id: professionalId,
      email: profile?.email || input.profile.email,
      displayName
    }
  };
}
