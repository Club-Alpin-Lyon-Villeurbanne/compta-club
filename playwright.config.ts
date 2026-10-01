import { defineConfig, devices } from '@playwright/test';

// Ports dédiés aux E2E : on ne réutilise jamais un serveur de dev branché sur le vrai backend.
const APP_PORT = 3100;
export const FAKE_BACKEND_PORT = 4010;

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/global-setup.ts',
  // Le serveur de dev compile chaque page à la première visite.
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${APP_PORT}`,
    url: `http://localhost:${APP_PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_API_URL: `http://127.0.0.1:${FAKE_BACKEND_PORT}` },
  },
});
