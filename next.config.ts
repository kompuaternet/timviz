import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  webpack(config) {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /@opentelemetry\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/
      }
    ];
    return config;
  },
  async redirects() {
    return [
      { source: "/ua", destination: "/uk", permanent: true },
      { source: "/ua/:path*", destination: "/uk/:path*", permanent: true },

      { source: "/ru/dlya-manikyuru", destination: "/ru/dlya-manikyura", permanent: true },
      { source: "/ru/dlya-perukariv", destination: "/ru/dlya-parikmaherov", permanent: true },
      { source: "/en/dlya-manikyuru", destination: "/en/for-nail-technicians", permanent: true },
      { source: "/en/dlya-perukariv", destination: "/en/for-hairdressers", permanent: true },

      { source: "/ru/dlya-barberiv", destination: "/ru/dlya-barberov", permanent: true },
      { source: "/ru/dlya-kosmetologiv", destination: "/ru/dlya-kosmetologov", permanent: true },
      { source: "/ru/dlya-masazhu", destination: "/ru/dlya-massazhistov", permanent: true },
      { source: "/ru/dlya-massazha", destination: "/ru/dlya-massazhistov", permanent: true },
      { source: "/ru/dlya-masazhistiv", destination: "/ru/dlya-massazhistov", permanent: true },

      { source: "/uk/dlya-manikyura", destination: "/uk/dlya-manikyuru", permanent: true },
      { source: "/uk/dlya-parikmaherov", destination: "/uk/dlya-perukariv", permanent: true },
      { source: "/uk/dlya-barberov", destination: "/uk/dlya-barberiv", permanent: true },
      { source: "/uk/dlya-kosmetologov", destination: "/uk/dlya-kosmetologiv", permanent: true },
      { source: "/uk/dlya-masazha", destination: "/uk/dlya-masazhu", permanent: true },
      { source: "/uk/dlya-masazhistiv", destination: "/uk/dlya-masazhu", permanent: true },
      { source: "/uk/dlya-massazhistov", destination: "/uk/dlya-masazhu", permanent: true },

      { source: "/en/dlya-manikyura", destination: "/en/for-nail-technicians", permanent: true },
      { source: "/en/dlya-parikmaherov", destination: "/en/for-hairdressers", permanent: true },
      { source: "/ru/for-hairdressers", destination: "/ru/dlya-parikmaherov", permanent: true },
      { source: "/uk/for-hairdressers", destination: "/uk/dlya-perukariv", permanent: true },
      { source: "/ru/for-barbers", destination: "/ru/dlya-barberov", permanent: true },
      { source: "/uk/for-barbers", destination: "/uk/dlya-barberiv", permanent: true },
      { source: "/ru/for-cosmetologists", destination: "/ru/dlya-kosmetologov", permanent: true },
      { source: "/uk/for-cosmetologists", destination: "/uk/dlya-kosmetologiv", permanent: true },
      { source: "/ru/for-massage-therapists", destination: "/ru/dlya-massazhistov", permanent: true },
      { source: "/uk/for-massage-therapists", destination: "/uk/dlya-masazhu", permanent: true },
      { source: "/en/dlya-barberiv", destination: "/en/for-barbers", permanent: true },
      { source: "/en/dlya-barberov", destination: "/en/for-barbers", permanent: true },
      { source: "/en/dlya-kosmetologiv", destination: "/en/for-cosmetologists", permanent: true },
      { source: "/en/dlya-kosmetologov", destination: "/en/for-cosmetologists", permanent: true },
      { source: "/en/dlya-masazhu", destination: "/en/for-massage-therapists", permanent: true },
      { source: "/en/dlya-massazha", destination: "/en/for-massage-therapists", permanent: true },
      { source: "/en/dlya-massazhistov", destination: "/en/for-massage-therapists", permanent: true },
      { source: "/en/dlya-masazhistiv", destination: "/en/for-massage-therapists", permanent: true }
    ];
  }
};

const sentryEnabled = Boolean(
  process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    process.env.SENTRY_AUTH_TOKEN
);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: {
        deleteSourcemapsAfterUpload: true
      }
    })
  : nextConfig;
