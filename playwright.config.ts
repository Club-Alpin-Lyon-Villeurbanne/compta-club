import { defineConfig, devices } from '@playwright/test';

// Ports dédiés aux E2E. Le serveur n'est jamais réutilisé : un serveur déjà lancé sur ce port
// pourrait pointer sur le vrai backend.
const APP_PORT = 3100;
export const APP_URL = `http://localhost:${APP_PORT}`;
export const FAKE_BACKEND_PORT = 4010;
export const FAKE_BACKEND_URL = `http://127.0.0.1:${FAKE_BACKEND_PORT}`;

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Un test qui ne passe qu'au 2e essai fait échouer la CI : les relances ne masquent pas l'instabilité.
  failOnFlakyTests: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/global-setup.ts',
  // Marge pour une machine chargée (beaucoup de workers en parallèle).
  expect: { timeout: 10_000 },
  use: {
    baseURL: APP_URL,
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

  // Build de production : rien n'est compilé pendant les tests (le serveur de dev saturait sous
  // la charge) et on teste ce qui part en production. Le build écrase .next : ne pas lancer
  // `pnpm dev` en même temps.
  webServer: {
    // keepAliveTimeout : sans lui, une connexion réutilisée au moment où le serveur la ferme
    // (5 s d'inactivité par défaut) échoue en ECONNRESET.
    command: `npm run build && npm run start -- --port ${APP_PORT} --keepAliveTimeout 600000`,
    timeout: 180_000,
    url: APP_URL,
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_URL: FAKE_BACKEND_URL,
      // Les erreurs provoquées par les tests ne doivent pas partir dans le Sentry de production.
      NEXT_PUBLIC_SENTRY_DSN: '',
    },
  },
});
