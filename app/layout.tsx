import type { Metadata } from "next";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import { buildMetadata, getRequestLanguage, seoCopy, siteUrl } from "../lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const base = buildMetadata("/", seoCopy.home[language], language);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Timviz",
      template: "%s | Timviz"
    },
    description: seoCopy.home[language].description,
    applicationName: "Timviz",
    category: "beauty and wellness booking platform",
    ...base
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getRequestLanguage();

  return (
    <html lang={language}>
      <body>
        <GlobalLanguageSwitcher />
        {children}
      </body>
    </html>
  );
}
