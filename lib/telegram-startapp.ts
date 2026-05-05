export type TelegramGoogleSignupStartPayload = {
  email: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
  avatarUrl?: string;
  inviteToken?: string;
  mode?: "login" | "register";
};

const TELEGRAM_GOOGLE_SIGNUP_PREFIX = "gsu_";
const TELEGRAM_GOOGLE_SIGNUP_MAX_LENGTH = 480;

function clampText(value: string | null | undefined, maxLength: number) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "";
  }
  return normalized.slice(0, maxLength);
}

function looksLikeEmail(value: string) {
  if (!value || value.length > 190) {
    return false;
  }
  return value.includes("@") && value.includes(".");
}

function encodeJsonToHex(json: string) {
  return Buffer.from(json, "utf8").toString("hex").toLowerCase();
}

function decodeHexToJson(hex: string) {
  return Buffer.from(hex, "hex").toString("utf8");
}

export function encodeTelegramGoogleSignupStartParam(
  input: TelegramGoogleSignupStartPayload
) {
  const email = clampText(input.email, 190);
  if (!looksLikeEmail(email)) {
    return null;
  }

  const base = {
    v: 1,
    e: email,
    f: clampText(input.firstName, 80),
    l: clampText(input.lastName, 80),
    o: clampText(input.locale, 24),
    a: clampText(input.avatarUrl, 220),
    i: clampText(input.inviteToken, 120),
    m: input.mode === "login" ? "l" : "r"
  } as const;

  const variants = [
    base,
    { ...base, a: "" },
    { ...base, a: "", l: "" },
    { ...base, a: "", l: "", f: "" },
    { ...base, a: "", l: "", f: "", o: "" },
    { ...base, a: "", l: "", f: "", o: "", i: "" }
  ];

  for (const candidate of variants) {
    const json = JSON.stringify(candidate);
    const hex = encodeJsonToHex(json);
    const startParam = `${TELEGRAM_GOOGLE_SIGNUP_PREFIX}${hex}`;
    if (startParam.length <= TELEGRAM_GOOGLE_SIGNUP_MAX_LENGTH) {
      return startParam;
    }
  }

  return null;
}

export function decodeTelegramGoogleSignupStartParam(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized.startsWith(TELEGRAM_GOOGLE_SIGNUP_PREFIX)) {
    return null;
  }

  const hex = normalized.slice(TELEGRAM_GOOGLE_SIGNUP_PREFIX.length);
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/.test(hex)) {
    return null;
  }

  try {
    const raw = JSON.parse(decodeHexToJson(hex)) as Partial<{
      v: number;
      e: string;
      f: string;
      l: string;
      o: string;
      a: string;
      i: string;
      m: "l" | "r";
    }>;

    const email = clampText(raw.e, 190);
    if (!looksLikeEmail(email)) {
      return null;
    }

    return {
      email,
      firstName: clampText(raw.f, 80) || "",
      lastName: clampText(raw.l, 80) || "",
      locale: clampText(raw.o, 24) || "",
      avatarUrl: clampText(raw.a, 220) || "",
      inviteToken: clampText(raw.i, 120) || "",
      mode: raw.m === "l" ? "login" : "register"
    } satisfies TelegramGoogleSignupStartPayload;
  } catch {
    return null;
  }
}

