export function getGoogleTagManagerId() {
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
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${tagManagerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
