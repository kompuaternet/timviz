import Script from "next/script";

function getConfiguredGoogleIds() {
  return [
    process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
    process.env.NEXT_PUBLIC_GTM_ID,
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID,
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
  ]
    .map((value) => (value || "").trim())
    .filter(Boolean);
}

function isGoogleTagManagerId(value: string) {
  return /^GTM-[A-Z0-9]+$/i.test(value);
}

export function getGoogleTagManagerId() {
  return getConfiguredGoogleIds().find(isGoogleTagManagerId) || "";
}

export function getGoogleTagId() {
  return getConfiguredGoogleIds().find((value) => !isGoogleTagManagerId(value)) || "";
}

export default function GoogleTag() {
  const tagManagerId = getGoogleTagManagerId();
  const googleTagId = getGoogleTagId();

  if (!tagManagerId && !googleTagId) {
    return null;
  }

  return (
    <>
      {googleTagId ? (
        <>
          <Script
            id="timviz-google-tag-script"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
            strategy="afterInteractive"
          />
          <Script id="timviz-google-tag-config" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
              window.gtag('js', new Date());
              window.gtag('config', ${JSON.stringify(googleTagId)});
            `}
          </Script>
        </>
      ) : null}
      {tagManagerId ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${tagManagerId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      ) : null}
    </>
  );
}
