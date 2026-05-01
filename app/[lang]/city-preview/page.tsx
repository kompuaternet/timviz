import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandLogo from "../../BrandLogo";
import { getLocalizedPath, isSiteLanguage, type SiteLanguage } from "../../../lib/site-language";

type CityPreviewPageProps = {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type PreviewCopy = {
  title: string;
  text: string;
  backCatalog: string;
  backHome: string;
};

const copy: Record<SiteLanguage, PreviewCopy> = {
  ru: {
    title: "Раздел скоро откроется",
    text: "Эта городская страница пока в режиме заглушки. Мы откроем индексируемую версию после наполнения.",
    backCatalog: "Перейти в каталог",
    backHome: "На главную"
  },
  uk: {
    title: "Розділ скоро відкриється",
    text: "Ця міська сторінка поки працює як заглушка. Індексовану версію відкриємо після наповнення.",
    backCatalog: "Перейти в каталог",
    backHome: "На головну"
  },
  en: {
    title: "This section is coming soon",
    text: "This city page is currently a placeholder. We will enable an indexable version after content is ready.",
    backCatalog: "Go to catalog",
    backHome: "Go to homepage"
  }
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: CityPreviewPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) return {};

  const title =
    lang === "ru"
      ? "Городская страница в разработке | Timviz"
      : lang === "uk"
        ? "Міська сторінка в розробці | Timviz"
        : "City page in progress | Timviz";

  const description =
    lang === "ru"
      ? "Временная заглушка. Страница закрыта от индексации до публикации полного контента."
      : lang === "uk"
        ? "Тимчасова заглушка. Сторінка закрита від індексації до публікації повного контенту."
        : "Temporary placeholder. This page is set to noindex until full content is published.";

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true
      }
    },
    alternates: {
      canonical: `https://timviz.com${getLocalizedPath(lang, "/city-preview")}`
    }
  };
}

export default async function CityPreviewPage({ params, searchParams }: CityPreviewPageProps) {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) notFound();

  const language = lang as SiteLanguage;
  const t = copy[language];
  const map = (await searchParams) ?? {};
  const city = getParam(map, "city");
  const category = getParam(map, "category");

  return (
    <main className="public-home" style={{ minHeight: "100vh", paddingBottom: 56 }}>
      <header className="public-header">
        <a className="public-logo" href={getLocalizedPath(language)}><BrandLogo /></a>
      </header>
      <section className="public-hero">
        <h1>{t.title}</h1>
        <p>{t.text}</p>
        {city || category ? (
          <p style={{ marginTop: 10, fontWeight: 700 }}>
            {[category, city].filter(Boolean).join(" — ")}
          </p>
        ) : null}
        <div className="business-hero-actions" style={{ marginTop: 20 }}>
          <a className="business-secondary" href={getLocalizedPath(language, "/catalog")}>{t.backCatalog}</a>
          <a className="business-primary" href={getLocalizedPath(language)}>{t.backHome}</a>
        </div>
      </section>
    </main>
  );
}
