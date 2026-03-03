import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: 0.1,

  replaysSessionSampleRate: 0.01,

  replaysOnErrorSampleRate: 0.5,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
