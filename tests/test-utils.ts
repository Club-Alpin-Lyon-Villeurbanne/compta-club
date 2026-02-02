/**
 * Utilitaires pour les tests Playwright
 */

import { Page } from '@playwright/test';
import { setupApiMocks } from './mocks/api-handlers';

// Credentials de test (utilises par les mocks)
export const TEST_CREDENTIALS = {
  email: 'admin@clubalpinlyon.top',
  password: 'admin123',
};

/**
 * Configure les mocks API pour la page
 */
export async function setupMocks(page: Page) {
  await setupApiMocks(page);
}

/**
 * Fonction pour remplir le formulaire de connexion
 */
export async function fillLoginForm(page: Page) {
  await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
  await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
  await page.click('button[type="submit"]');
}

/**
 * Fonction pour se connecter avec mocks et attendre la redirection
 */
export async function login(page: Page) {
  await setupMocks(page);
  await page.goto('/');
  await fillLoginForm(page);
  await page.waitForURL(/.*\/note-de-frais/, { timeout: 15000 });
}

/**
 * Fonction pour se connecter sans attendre la redirection
 */
export async function loginWithoutRedirect(page: Page) {
  await setupMocks(page);
  await page.goto('/');
  await fillLoginForm(page);
}
