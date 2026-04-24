import Script from "next/script";

function getGoogleTagId() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ||
    ""
  ).trim();
}

export default function GoogleTag() {
  const tagId = getGoogleTagId();

  if (!tagId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${tagId}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
