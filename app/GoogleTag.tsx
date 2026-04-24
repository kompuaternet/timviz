import Script from "next/script";

function getGoogleTagManagerId() {
  const explicitGtmId = (
    process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID ||
    process.env.NEXT_PUBLIC_GTM_ID ||
    ""
  ).trim();

  if (explicitGtmId) {
    return explicitGtmId;
  }

  const legacyTagId = (
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ||
    ""
  ).trim();

  return legacyTagId.startsWith("GTM-") ? legacyTagId : "";
}

export default function GoogleTag() {
  const tagManagerId = getGoogleTagManagerId();

  if (!tagManagerId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-tag-manager"
        strategy="beforeInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js'
          });
          (function(w,d,s,l,i){
            var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),
                dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${tagManagerId}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${tagManagerId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
