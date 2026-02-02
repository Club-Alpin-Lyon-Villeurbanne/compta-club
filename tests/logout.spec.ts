import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Logout', () => {
  test('should logout successfully', async ({ page }) => {
    // Se connecter
    await login(page);

    // Vérifier qu'on est connecté
    await expect(page.locator('button:has-text("Déconnexion")')).toBeVisible();

    // Cliquer sur le bouton de déconnexion
    await page.click('button:has-text("Déconnexion")');

    // Vérifier qu'on est redirigé vers la page de connexion
    await expect(page).toHaveURL(/.*\/$/);
    await expect(page.locator('h2')).toContainText('Connexion');
  });

  test('should not access protected pages after logout', async ({ page }) => {
    // Se connecter
    await login(page);

    // Se déconnecter
    await page.click('button:has-text("Déconnexion")');
    await expect(page).toHaveURL(/.*\/$/);

    // Tenter d'accéder à une page protégée
    await page.goto('/note-de-frais');

    // Vérifier qu'on est redirigé vers la page de connexion
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should clear session cookies on logout', async ({ page, context }) => {
    // Se connecter
    await login(page);

    // Vérifier que les cookies existent
    let cookies = await context.cookies();
    const hasAccessToken = cookies.some(c => c.name === 'access_token');
    expect(hasAccessToken).toBe(true);

    // Se déconnecter
    await page.click('button:has-text("Déconnexion")');
    await expect(page).toHaveURL(/.*\/$/);

    // Vérifier que les cookies sont supprimés
    cookies = await context.cookies();
    const accessTokenAfter = cookies.find(c => c.name === 'access_token');
    expect(accessTokenAfter?.value || '').toBe('');
  });
});
