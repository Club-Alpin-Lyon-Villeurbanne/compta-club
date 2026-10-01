import { test, expect, Page } from '@playwright/test';
import { login } from './test-utils';

async function logout(page: Page) {
  await page.getByRole('button', { name: 'Déconnexion' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should logout successfully', async ({ page }) => {
    await logout(page);

    await expect(page.locator('h2')).toContainText('Connexion');
  });

  test('should not access protected pages after logout', async ({ page }) => {
    await logout(page);

    await page.goto('/note-de-frais');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h2')).toContainText('Connexion');
  });

  test('should clear session cookies on logout', async ({ page, context }) => {
    const cookieNames = async () => (await context.cookies()).map((c) => c.name);
    expect(await cookieNames()).toEqual(expect.arrayContaining(['access_token', 'refresh_token']));

    await logout(page);

    expect(await cookieNames()).not.toContain('access_token');
    expect(await cookieNames()).not.toContain('refresh_token');
  });
});
