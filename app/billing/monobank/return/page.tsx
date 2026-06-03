import Link from "next/link";
import MonobankReturnView from "./MonobankReturnView";
import { defaultSiteLanguage, isSiteLanguage, type SiteLanguage } from "../../../../lib/site-language";

type BillingReturnPageProps = {
  searchParams?: Promise<{
    lang?: string;
    status?: string;
  }>;
};

const returnCopy: Record<SiteLanguage, { title: string; text: string; button: string }> = {
  ru: {
    title: "Оплата завершена",
    text: "Мы проверяем Premium-доступ. Обычно это занимает несколько секунд.",
    button: "Перейти в настройки"
  },
  uk: {
    title: "Оплату завершено",
    text: "Ми перевіряємо Premium-доступ. Зазвичай це займає кілька секунд.",
    button: "Перейти в налаштування"
  },
  en: {
    title: "Payment completed",
    text: "We are checking Premium access. This usually takes a few seconds.",
    button: "Go to settings"
  },
  fr: {
    title: "Paiement terminé",
    text: "Nous vérifions l’accès Premium. Cela prend généralement quelques secondes.",
    button: "Aller aux paramètres"
  },
  pl: {
    title: "Płatność zakończona",
    text: "Sprawdzamy dostęp Premium. Zwykle trwa to kilka sekund.",
    button: "Przejdź do ustawień"
  },
  cs: {
    title: "Platba dokončena",
    text: "Kontrolujeme Premium přístup. Obvykle to trvá několik sekund.",
    button: "Přejít do nastavení"
  },
  es: {
    title: "Pago completado",
    text: "Estamos comprobando el acceso Premium. Normalmente tarda unos segundos.",
    button: "Ir a ajustes"
  },
  de: {
    title: "Zahlung abgeschlossen",
    text: "Wir prüfen den Premium-Zugang. Das dauert normalerweise einige Sekunden.",
    button: "Zu den Einstellungen"
  }
};

export const dynamic = "force-dynamic";

export default async function MonobankBillingReturnPage({ searchParams }: BillingReturnPageProps) {
  const params = (await searchParams) ?? {};
  const language = isSiteLanguage(params.lang) ? params.lang : defaultSiteLanguage;
  const copy = returnCopy[language];
  const redirectHref = "/pro/settings?billing=success";

  return (
    <main className="billing-return-page" lang={language}>
      <MonobankReturnView redirectHref={redirectHref} />
      <section className="billing-return-card">
        <h1>{copy.title}</h1>
        <p>{copy.text}</p>
        <Link href={redirectHref}>{copy.button}</Link>
      </section>
    </main>
  );
}
