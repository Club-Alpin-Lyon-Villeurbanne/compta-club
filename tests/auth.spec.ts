import { test, expect, fillLoginForm, waitForLoginForm } from './test-utils';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Visiter la page d'accueil avant chaque test
    await page.goto('/');
  });

  test('should show login form on home page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await fillLoginForm(page, { email: 'invalid@example.com', password: 'wrongpassword' });

    await expect(page.getByText('Identifiants invalides')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  // Le formulaire HTML5 empêche la soumission : on vérifie que le navigateur bloque bien le champ.
  test('should not submit with empty fields', async ({ page }) => {
    await waitForLoginForm(page);
    await page.click('button[type="submit"]');

    const email = page.locator('input[type="email"]');
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
    await expect(page).toHaveURL(/\/$/);
  });

  test('should not submit with invalid email format', async ({ page }) => {
    await waitForLoginForm(page);
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    const email = page.locator('input[type="email"]');
    expect(await email.evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
    await expect(page).toHaveURL(/\/$/);
  });

  test('should handle server error gracefully', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 500, json: { error: 'Erreur lors de la connexion' } })
    );

    await fillLoginForm(page);

    await expect(page.getByText('Le serveur est temporairement indisponible')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
