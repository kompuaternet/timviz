const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MS = 3 * 60 * 1000;

type AttemptState = {
  failedAttempts: number;
  lockedUntil: number;
};

const attempts = new Map<string, AttemptState>();

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

function getState(key: string) {
  const normalizedKey = normalizeKey(key);
  const current = attempts.get(normalizedKey);

  if (!current) {
    return { normalizedKey, state: { failedAttempts: 0, lockedUntil: 0 } };
  }

  if (current.lockedUntil > 0 && current.lockedUntil <= Date.now()) {
    const resetState = { failedAttempts: 0, lockedUntil: 0 };
    attempts.set(normalizedKey, resetState);
    return { normalizedKey, state: resetState };
  }

  return { normalizedKey, state: current };
}

export function getAdminLoginLock(key: string) {
  const { state } = getState(key);
  const remainingMs = Math.max(0, state.lockedUntil - Date.now());

  return {
    isLocked: remainingMs > 0,
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    remainingMinutes: Math.ceil(remainingMs / 60000)
  };
}

export function registerAdminLoginFailure(key: string) {
  const { normalizedKey, state } = getState(key);
  const nextFailedAttempts = state.failedAttempts + 1;
  const shouldLock = nextFailedAttempts >= MAX_FAILED_ATTEMPTS;

  const nextState: AttemptState = {
    failedAttempts: shouldLock ? 0 : nextFailedAttempts,
    lockedUntil: shouldLock ? Date.now() + LOCKOUT_MS : 0
  };

  attempts.set(normalizedKey, nextState);

  return {
    failedAttempts: nextFailedAttempts,
    isLocked: shouldLock,
    lockoutMs: shouldLock ? LOCKOUT_MS : 0
  };
}

export function clearAdminLoginFailures(key: string) {
  attempts.delete(normalizeKey(key));
}

export function buildAdminLoginThrottleKey(email: string, ip: string) {
  return `${normalizeKey(email)}::${ip.trim() || "unknown"}`;
}
