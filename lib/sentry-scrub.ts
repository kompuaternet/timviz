const sensitiveKeyPattern = /(email|phone|token|secret|password|authorization|cookie|customerName|customerEmail|customerPhone)/i;

export function scrubSentryData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => scrubSentryData(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[Filtered]" : scrubSentryData(entry)
    ])
  );
}
