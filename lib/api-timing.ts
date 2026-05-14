type TimingDetails = Record<string, string | number | boolean | undefined | null>;

function isApiTimingEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.TIMVIZ_API_TIMING === "1";
}

function formatDetails(details: TimingDetails) {
  const entries = Object.entries(details).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!entries.length) {
    return "";
  }

  return ` ${entries.map(([key, value]) => `${key}=${String(value)}`).join(" ")}`;
}

export function createApiTimer(label: string) {
  const startedAt = performance.now();

  return (details: TimingDetails = {}) => {
    if (!isApiTimingEnabled()) {
      return;
    }

    const durationMs = Math.round(performance.now() - startedAt);
    console.info(`[api-timing] ${label} ${durationMs}ms${formatDetails(details)}`);
  };
}
