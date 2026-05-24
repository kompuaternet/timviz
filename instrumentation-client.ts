import * as Sentry from "@sentry/nextjs";
import { scrubSentryData } from "./lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    beforeSend(event) {
      event.user = event.user
        ? {
            id: event.user.id,
            username: event.user.username
          }
        : undefined;
      event.extra = scrubSentryData(event.extra) as Record<string, unknown> | undefined;
      event.contexts = scrubSentryData(event.contexts) as typeof event.contexts;
      event.request = scrubSentryData(event.request) as typeof event.request;
      return event;
    }
  });
}
