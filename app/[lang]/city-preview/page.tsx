import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandLogo from "../../BrandLogo";
import { getLocalizedPath, isSiteLanguage, type SiteLanguage , withEnglishFallback } from "../../../lib/site-language";

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

const copy: Record<SiteLanguage, PreviewCopy> = withEnglishFallback<PreviewCopy>({
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
});

Object.assign(copy, {
  fr: { title: "Cette section arrive bientôt", text: "Cette page de ville est encore une page temporaire. La version indexable sera activée après ajout du contenu.", backCatalog: "Aller au catalogue", backHome: "Accueil" },
  pl: { title: "Ta sekcja pojawi się wkrótce", text: "Ta strona miasta jest na razie wersją tymczasową. Wersję indeksowaną włączymy po uzupełnieniu treści.", backCatalog: "Przejdź do katalogu", backHome: "Strona główna" },
  cs: { title: "Tato sekce bude brzy otevřena", text: "Tato městská stránka je zatím dočasná. Indexovatelnou verzi zapneme po doplnění obsahu.", backCatalog: "Přejít do katalogu", backHome: "Domů" },
  es: { title: "Esta sección estará disponible pronto", text: "Esta página de ciudad es temporal. Activaremos la versión indexable cuando el contenido esté listo.", backCatalog: "Ir al catálogo", backHome: "Inicio" },
  de: { title: "Dieser Bereich kommt bald", text: "Diese Stadtseite ist derzeit ein Platzhalter. Die indexierbare Version wird nach dem Befüllen aktiviert.", backCatalog: "Zum Katalog", backHome: "Startseite" }
});

const cityPreviewSeoCopy: Record<SiteLanguage, { title: string; description: string }> = {
  ru: {
    title: "Городская страница в разработке | Timviz",
    description: "Временная заглушка. Страница закрыта от индексации до публикации полного контента."
  },
  uk: {
    title: "Міська сторінка в розробці | Timviz",
    description: "Тимчасова заглушка. Сторінка закрита від індексації до публікації повного контенту."
  },
  en: {
    title: "City page in progress | Timviz",
    description: "Temporary placeholder. This page is set to noindex until full content is published."
  },
  fr: {
    title: "Page de ville en préparation | Timviz",
    description: "Page temporaire. Elle reste en noindex jusqu'à la publication du contenu complet."
  },
  pl: {
    title: "Strona miasta w przygotowaniu | Timviz",
    description: "Tymczasowa strona. Pozostaje wyłączona z indeksowania do publikacji pełnej treści."
  },
  cs: {
    title: "Městská stránka se připravuje | Timviz",
    description: "Dočasná stránka. Do zveřejnění plného obsahu je nastavena jako noindex."
  },
  es: {
    title: "Página de ciudad en preparación | Timviz",
    description: "Página temporal. Está marcada como noindex hasta publicar el contenido completo."
  },
  de: {
    title: "Stadtseite in Vorbereitung | Timviz",
    description: "Vorübergehender Platzhalter. Die Seite bleibt bis zur Veröffentlichung vollständiger Inhalte auf noindex."
  }
};

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: CityPreviewPageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSiteLanguage(lang)) return {};

  const { title, description } = cityPreviewSeoCopy[lang];

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
