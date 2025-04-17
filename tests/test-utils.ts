/**
 * Utilitaires pour les tests Playwright
 */

// Importer les variables d'environnement du fichier .env.test.local
import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement du fichier .env.test.local
config({ path: resolve(__dirname, '../.env.test.local') });

// Valeurs par défaut pour les tests
export const TEST_CREDENTIALS = {
  email: process.env.VALID_EMAIL || 'admin@clubalpinlyon.top',
  password: process.env.VALID_PASSWORD || 'admin123',
};

/**
 * Fonction pour remplir le formulaire de connexion
 */
export async function fillLoginForm(page: any) {
  await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
  console.log('Email:', TEST_CREDENTIALS.email);
  await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
  await page.click('button[type="submit"]');
}

/**
 * Fonction pour se connecter et attendre la redirection
 */
export async function login(page: any) {
  await page.goto('/');
  await fillLoginForm(page);
  await page.waitForURL(/.*\/note-de-frais/, { timeout: 10000 });
} 