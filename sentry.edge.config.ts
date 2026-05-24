import * as Sentry from "@sentry/nextjs";
import { scrubSentryData } from "./lib/sentry-scrub";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05"),
    beforeSend(event) {
      event.user = event.user?.id ? { id: event.user.id } : undefined;
      event.extra = scrubSentryData(event.extra) as Record<string, unknown> | undefined;
      event.contexts = scrubSentryData(event.contexts) as typeof event.contexts;
      event.request = scrubSentryData(event.request) as typeof event.request;
      return event;
    }
  });
}
