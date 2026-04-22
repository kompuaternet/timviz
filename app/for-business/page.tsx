import type { Metadata } from "next";
import BusinessLanding from "./BusinessLanding";

export const metadata: Metadata = {
  title: "Timviz для бизнеса: онлайн-запись клиентов, CRM и календарь мастеров",
  description:
    "Зарегистрируйте бизнес в Timviz: онлайн-запись клиентов, график мастеров, услуги, база клиентов, напоминания, аналитика и поддержка салонов, мастеров и студий.",
  alternates: {
    canonical: "/for-business"
  },
  keywords: [
    "онлайн запись клиентов",
    "система записи для салона",
    "CRM для салона красоты",
    "календарь мастеров",
    "запись клиентов онлайн",
    "программа для барбершопа",
    "запись на услуги",
    "Timviz для бизнеса"
  ]
};

export default function ForBusinessPage() {
  return <BusinessLanding />;
}
