import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PricingView from "../../PricingView";
import { getSessionCookieName, verifySessionValue } from "../../../lib/pro-auth";
import { getWorkspaceSnapshot } from "../../../lib/pro-data";
import { buildPricingMetadata, pricingCopy } from "../../../lib/pricing";
import { isSiteLanguage } from "../../../lib/site-language";

type PricingPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    return {};
  }

  return buildPricingMetadata(lang);
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const cookieStore = await cookies();
  const professionalId = verifySessionValue(cookieStore.get(getSessionCookieName())?.value) || "";
  const workspace = professionalId ? await getWorkspaceSnapshot(professionalId).catch(() => null) : null;

  return (
    <PricingView
      language={lang}
      copy={pricingCopy[lang]}
      user={workspace ? { id: workspace.professional.id, email: workspace.professional.email } : null}
      paddle={{
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV || "sandbox",
        monthlyPriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY || "",
        yearlyPriceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_YEARLY || ""
      }}
    />
  );
}
