export type ProPremiumStatusInput = {
  plan?: string | null;
  premiumStatus?: string | null;
  premiumUntil?: string | null;
};

export function isProPremiumActive(input: ProPremiumStatusInput) {
  if (input.plan !== "premium") {
    return false;
  }

  if (input.premiumStatus === "active") {
    return true;
  }

  if (input.premiumStatus === "trialing") {
    return isFutureDate(input.premiumUntil);
  }

  if (input.premiumStatus === "canceled" && input.premiumUntil) {
    return isFutureDate(input.premiumUntil);
  }

  return false;
}

function isFutureDate(value?: string | null) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}
