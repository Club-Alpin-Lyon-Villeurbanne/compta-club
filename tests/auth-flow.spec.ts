import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Authentication Flow', () => {
  test('complete authentication flow', async ({ page }) => {
    // login() vérifie l'arrivée sur la liste et la présence du bouton de déconnexion
    await login(page);

    await expect(page.getByRole('heading', { name: 'Notes de frais' })).toBeVisible();
  });

  test('should maintain authentication after page refresh', async ({ page }) => {
    await login(page);

    await page.reload();

    await expect(page).toHaveURL(/\/note-de-frais$/);
    await expect(page.getByRole('heading', { name: 'Notes de frais' })).toBeVisible();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/note-de-frais');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h2')).toContainText('Connexion');
  });
});
