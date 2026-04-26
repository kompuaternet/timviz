import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import CustomerAccountView from "../../account/CustomerAccountView";
import { getCustomerDashboard } from "../../../lib/customer-account";
import { verifyPublicCustomerSession, getPublicCustomerCookieName } from "../../../lib/public-customer-auth";
import { buildLanguageAlternates, buildMetadata } from "../../../lib/seo";
import { isSiteLanguage, type SiteLanguage } from "../../../lib/site-language";

export const dynamic = "force-dynamic";

type LocalizedAccountPageProps = {
  params: Promise<{
    lang: string;
  }>;
};

const accountSeoCopy: Record<SiteLanguage, { title: string; description: string }> = {
  ru: {
    title: "Личный кабинет клиента Timviz",
    description: "Управляйте своими онлайн-записями, профилем и настройками уведомлений в личном кабинете клиента Timviz."
  },
  uk: {
    title: "Особистий кабінет клієнта Timviz",
    description: "Керуйте своїми онлайн-записами, профілем і налаштуваннями сповіщень в особистому кабінеті клієнта Timviz."
  },
  en: {
    title: "Timviz customer account",
    description: "Manage your online bookings, profile and notification preferences in your Timviz customer account."
  }
};

export async function generateMetadata({
  params
}: LocalizedAccountPageProps): Promise<Metadata> {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    return {};
  }

  const metadata = buildMetadata(`/${lang}/account`, accountSeoCopy[lang], lang, { noIndex: true });
  return {
    ...metadata,
    alternates: buildLanguageAlternates("/account", lang)
  };
}

export default async function LocalizedAccountPage({ params }: LocalizedAccountPageProps) {
  const { lang } = await params;

  if (!isSiteLanguage(lang)) {
    notFound();
  }

  const cookieStore = await cookies();
  const session = verifyPublicCustomerSession(cookieStore.get(getPublicCustomerCookieName())?.value);
  const dashboard = session ? await getCustomerDashboard(session) : null;

  return (
    <CustomerAccountView
      language={lang as SiteLanguage}
      session={session}
      initialAccount={dashboard?.account ?? null}
      initialBookings={dashboard?.bookings ?? []}
    />
  );
}
