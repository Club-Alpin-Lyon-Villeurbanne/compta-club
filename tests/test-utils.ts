/**
 * Utilitaires pour les tests Playwright
 */

import { Page, expect } from '@playwright/test';
import { E2E_CREDENTIALS } from './mocks/fake-backend';

export const TEST_CREDENTIALS = E2E_CREDENTIALS;

/**
 * Fonction pour remplir le formulaire de connexion
 */
export async function fillLoginForm(page: Page, credentials = TEST_CREDENTIALS) {
  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
}

/**
 * Se connecter via le formulaire et attendre la page des notes de frais
 */
export async function login(page: Page) {
  // Les pictos des commissions viennent de clubalpinlyon.fr : on ne dépend pas d'internet.
  await page.route('**/_next/image**', (route) => route.abort());
  await page.goto('/');
  await fillLoginForm(page);
  await expect(page).toHaveURL(/\/note-de-frais$/);
  await expect(page.getByRole('button', { name: 'Déconnexion' })).toBeVisible();
}

/**
 * Lignes du tableau de la page affichée
 */
export function rows(page: Page) {
  return page.locator('tbody tr');
}
