import { createPublicKey, createVerify } from "crypto";
import { getPublicAppUrl } from "./app-url";

export type AppleOAuthProfile = {
  email: string;
  givenName: string;
  familyName: string;
  fullName: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function splitEnvList(value: unknown) {
  return cleanText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ensureEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getAppleOAuthSettings(request?: Request) {
  const clientId = process.env.APPLE_SERVICE_ID?.trim() || ensureEnv("APPLE_CLIENT_ID");
  const redirectUri =
    process.env.APPLE_REDIRECT_URI?.trim() ||
    `${getPublicAppUrl(request)}/api/pro/auth/apple/callback`;

  if (!redirectUri.startsWith("https://") && process.env.NODE_ENV === "production") {
    throw new Error("APPLE_REDIRECT_URI must be an HTTPS URL in production.");
  }

  return {
    clientId,
    redirectUri
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="), "base64");
}

function decodeJwtPart<T>(value: string): T {
  return JSON.parse(decodeBase64Url(value).toString("utf8")) as T;
}

function getAllowedAppleAudiences() {
  return [
    process.env.APPLE_CLIENT_ID,
    process.env.APPLE_SERVICE_ID,
    process.env.APPLE_BUNDLE_ID,
    process.env.MOBILE_APPLE_CLIENT_ID,
    process.env.EXPO_PUBLIC_APPLE_BUNDLE_ID,
    ...splitEnvList(process.env.APPLE_ALLOWED_AUDIENCES),
    "com.timviz.master"
  ]
    .map((item) => cleanText(item))
    .filter(Boolean);
}

export function parseAppleUserProfile(rawUser: string) {
  if (!rawUser) return {};

  try {
    const payload = JSON.parse(rawUser) as {
      email?: string;
      name?: {
        firstName?: string;
        lastName?: string;
      };
    };
    return {
      email: cleanText(payload.email).toLowerCase(),
      givenName: cleanText(payload.name?.firstName),
      familyName: cleanText(payload.name?.lastName),
      fullName: `${cleanText(payload.name?.firstName)} ${cleanText(payload.name?.lastName)}`.trim()
    };
  } catch {
    return {};
  }
}

export async function verifyAppleIdentityToken(
  idToken: string,
  fallbackProfile: Partial<AppleOAuthProfile> = {},
  expectedNonce = ""
): Promise<AppleOAuthProfile> {
  const [encodedHeader, encodedPayload, encodedSignature] = idToken.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Invalid Apple identity token.");
  }

  const header = decodeJwtPart<{ kid?: string; alg?: string }>(encodedHeader);
  const payload = decodeJwtPart<{
    iss?: string;
    aud?: string;
    exp?: number;
    nonce?: string;
    email?: string;
    email_verified?: string | boolean;
  }>(encodedPayload);

  if (payload.iss !== "https://appleid.apple.com") {
    throw new Error("Invalid Apple token issuer.");
  }

  if (!payload.exp || payload.exp * 1000 < Date.now()) {
    throw new Error("Apple token expired.");
  }

  if (expectedNonce && payload.nonce !== expectedNonce) {
    throw new Error("Apple token nonce is invalid.");
  }

  if (payload.email_verified === false || payload.email_verified === "false") {
    throw new Error("Apple email is not verified.");
  }

  const allowedAudiences = getAllowedAppleAudiences();
  if (payload.aud && allowedAudiences.length && !allowedAudiences.includes(payload.aud)) {
    throw new Error("Apple token audience is not allowed.");
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
    fullName: cleanText(fallbackProfile.fullName)
  };
}
