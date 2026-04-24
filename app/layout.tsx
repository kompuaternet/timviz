import type { Metadata } from "next";
import GoogleTag, { getGoogleTagManagerId } from "./GoogleTag";
import GlobalLanguageSwitcher from "./GlobalLanguageSwitcher";
import { buildMetadata, getRequestLanguage, seoCopy, siteUrl } from "../lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const base = buildMetadata("/", seoCopy.home[language], language);
  const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Timviz",
      template: "%s | Timviz"
    },
    description: seoCopy.home[language].description,
    applicationName: "Timviz",
    category: "beauty and wellness booking platform",
    verification: googleSiteVerification
      ? {
          google: googleSiteVerification
        }
      : undefined,
    ...base
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getRequestLanguage();
  const tagManagerId = getGoogleTagManagerId();

  return (
    <html lang={language}>
      <head>
        {tagManagerId ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${tagManagerId}');
              `
            }}
          />
        ) : null}
      </head>
      <body>
        <GoogleTag />
        <GlobalLanguageSwitcher />
        {children}
      </body>
    </html>
  );
}
