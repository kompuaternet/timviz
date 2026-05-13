export type ProPremiumStatusInput = {
  plan?: string | null;
  premiumStatus?: string | null;
  premiumUntil?: string | null;
};

export function isProPremiumActive(input: ProPremiumStatusInput) {
  if (input.plan !== "premium") {
    return false;
  }

  if (input.premiumStatus === "active" || input.premiumStatus === "trialing") {
    return true;
  }

  if (input.premiumStatus === "canceled" && input.premiumUntil) {
    return new Date(input.premiumUntil).getTime() > Date.now();
  }

  return false;
}
