import { createHmac, timingSafeEqual } from "crypto";

export type TelegramMiniAppUser = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  languageCode: string;
};

export type TelegramMiniAppAuthPayload = {
  user: TelegramMiniAppUser;
  authDate: number;
  startParam: string;
  queryId: string;
  chatType: string;
  chatInstance: string;
};

function parseUser(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const id = Number(parsed.id);
    if (!Number.isFinite(id)) {
      return null;
    }

    return {
      id,
      firstName: String(parsed.first_name ?? "").trim(),
      lastName: String(parsed.last_name ?? "").trim(),
      username: String(parsed.username ?? "").trim(),
      languageCode: String(parsed.language_code ?? "").trim()
    } satisfies TelegramMiniAppUser;
  } catch {
    return null;
  }
}

function getDefaultMaxAgeSec() {
  const raw = Number.parseInt(process.env.TELEGRAM_MINIAPP_AUTH_MAX_AGE_SEC || "86400", 10);
  if (!Number.isFinite(raw) || raw < 0) {
    return 86_400;
  }
  return raw;
}

function safeCompareHash(leftHex: string, rightHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(leftHex) || !/^[a-f0-9]{64}$/i.test(rightHex)) {
    return false;
  }

  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function verifyTelegramMiniAppInitData(input: {
  initData: string;
  botToken: string;
  maxAgeSec?: number;
}) {
  const initData = input.initData.trim();
  const botToken = input.botToken.trim();

  if (!initData || !botToken) {
    return null;
  }

  const params = new URLSearchParams(initData);
  const incomingHash = String(params.get("hash") || "").trim().toLowerCase();
  if (!incomingHash) {
    return null;
  }

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === "hash") {
      return;
    }
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (!safeCompareHash(incomingHash, expectedHash)) {
    return null;
  }

  const authDate = Number.parseInt(String(params.get("auth_date") || ""), 10);
  if (!Number.isFinite(authDate)) {
    return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (authDate > nowSec + 60) {
    return null;
  }

  const maxAgeSec = typeof input.maxAgeSec === "number" ? input.maxAgeSec : getDefaultMaxAgeSec();
  if (maxAgeSec > 0 && nowSec - authDate > maxAgeSec) {
    return null;
  }

  const user = parseUser(params.get("user"));
  if (!user) {
    return null;
  }

  return {
    user,
    authDate,
    startParam: String(params.get("start_param") || "").trim(),
    queryId: String(params.get("query_id") || "").trim(),
    chatType: String(params.get("chat_type") || "").trim(),
    chatInstance: String(params.get("chat_instance") || "").trim()
  } satisfies TelegramMiniAppAuthPayload;
}
