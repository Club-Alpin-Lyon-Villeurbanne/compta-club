/**
 * Utilitaires pour les tests Playwright
 */

import { Page, expect, test as base } from '@playwright/test';
import { E2E_CREDENTIALS } from './mocks/fake-backend';
import { FAKE_BACKEND_URL } from '../playwright.config';

export const TEST_CREDENTIALS = E2E_CREDENTIALS;

/**
 * `test` de Playwright, avec les pictos des commissions bloqués pour tous les tests : ils viennent
 * de clubalpinlyon.fr et les tests ne doivent pas dépendre d'internet.
 */
export const test = base.extend<{ blockExternalImages: void }>({
  blockExternalImages: [
    // Sur le contexte plutôt que la page : le blocage reste actif pendant la fermeture de la page.
    async ({ context }, use) => {
      await context.route('**/_next/image**', (route) => route.abort());
      await use();
    },
    { auto: true },
  ],
});

export { expect };

/**
 * Attendre que React ait pris en main le formulaire de connexion. Avant, un clic soumet le
 * formulaire HTML brut et une saisie n'arrive pas dans l'état React.
 */
export async function waitForLoginForm(page: Page) {
  await page.waitForFunction(() => {
    const form = document.querySelector('form');
    return !!form && Object.keys(form).some((key) => key.startsWith('__reactFiber'));
  });
}

/**
 * Remplir et soumettre le formulaire de connexion
 */
export async function fillLoginForm(page: Page, credentials = TEST_CREDENTIALS) {
  await waitForLoginForm(page);
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
}

/**
 * Se connecter par l'API (le formulaire est testé dans auth*.spec.ts) et ouvrir la liste
 */
export async function login(page: Page) {
  const response = await page.request.post('/api/auth/login', { data: TEST_CREDENTIALS });
  expect(response.ok()).toBe(true);
  await page.goto('/note-de-frais');
  await expect(page.getByRole('button', { name: 'Déconnexion' })).toBeVisible();
}

/**
 * Lignes du tableau de la page affichée
 */
export function rows(page: Page) {
  return page.locator('tbody tr');
}

async function backendSession(page: Page) {
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === 'access_token')?.value;
  if (!token) throw new Error('Pas de session : appeler login() avant');
  return { Authorization: `Bearer ${token}` };
}

/**
 * Requêtes de modification reçues par le faux backend pour la session de ce test
 */
export async function backendReceived(page: Page): Promise<{ method: string; path: string; body: unknown }[]> {
  const response = await fetch(`${FAKE_BACKEND_URL}/__e2e/received`, { headers: await backendSession(page) });
  return response.json();
}

/**
 * Faire échouer la prochaine requête de liste du faux backend avec ce statut
 */
export async function failNextListRequest(page: Page, status: number) {
  await fetch(`${FAKE_BACKEND_URL}/__e2e/fail-next-list`, {
    method: 'POST',
    headers: { ...(await backendSession(page)), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
