import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV ?? "development",
  enabled: !!process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
});
