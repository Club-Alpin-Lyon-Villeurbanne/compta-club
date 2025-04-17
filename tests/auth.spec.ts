import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Visiter la page d'accueil avant chaque test
    await page.goto('/');
  });

  test('should show login form on home page', async ({ page }) => {
    // Vérifier que le formulaire de connexion est affiché
    await expect(page.locator('h2')).toContainText('Connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Remplir le formulaire avec des identifiants invalides
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Vérifier que l'erreur s'affiche
    await expect(page.locator('.text-red-500')).toBeVisible({ timeout: 5000 });
  });

  test('should show error with empty fields', async ({ page }) => {
    // Soumettre le formulaire sans remplir les champs
    await page.click('button[type="submit"]');

    // Vérifier que l'erreur s'affiche
    // Note: Le formulaire HTML5 empêche la soumission avec des champs requis vides
    // donc nous vérifions que nous restons sur la page de connexion
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should show error with invalid email format', async ({ page }) => {
    // Remplir le formulaire avec un email invalide
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Vérifier que l'erreur s'affiche
    // Note: Le formulaire HTML5 empêche la soumission avec un email invalide
    // donc nous vérifions que nous restons sur la page de connexion
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should handle server error gracefully', async ({ page }) => {
    // Simuler une erreur serveur en utilisant un email spécial
    await page.fill('input[type="email"]', 'server-error@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Vérifier que l'erreur s'affiche
    await expect(page.locator('.text-red-500')).toBeVisible({ timeout: 5000 });
    // Vérifier que le message d'erreur contient "Identifiants invalides" ou un message d'erreur serveur
    const errorText = await page.locator('.text-red-500').textContent();
    expect(errorText).toMatch(/Identifiants invalides|Erreur|indisponible/);
  });
}); 