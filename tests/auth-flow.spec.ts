import { test, expect, fillLoginForm, login, rows } from './test-utils';
import { createE2eTokens } from './mocks/fake-backend';
import { APP_URL } from '../playwright.config';

test.describe('Authentication Flow', () => {
  test('complete authentication flow', async ({ page }) => {
    await page.goto('/');

    await fillLoginForm(page);

    await expect(page).toHaveURL(/\/note-de-frais$/);
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

test.describe('Session refresh', () => {
  // Le jeton d'accès dure 1 h, le refresh token 90 jours.
  test('should refresh an expired access token when opening a page', async ({ page, context }) => {
    const expired = createE2eTokens(undefined, -60);
    await context.addCookies([
      { name: 'access_token', value: expired.token, url: APP_URL },
      { name: 'refresh_token', value: expired.refresh_token, url: APP_URL },
    ]);

    await page.goto('/note-de-frais');

    await expect(page).toHaveURL(/\/note-de-frais$/);
    // Les données arrivent : le navigateur a bien reçu le nouveau jeton
    await expect(rows(page)).toHaveCount(3);
    const accessToken = (await context.cookies()).find((c) => c.name === 'access_token')?.value;
    expect(accessToken).not.toBe(expired.token);
  });

  test('should send back to login when the refresh token is refused', async ({ page, context }) => {
    await context.addCookies([
      { name: 'access_token', value: createE2eTokens(undefined, -60).token, url: APP_URL },
      { name: 'refresh_token', value: 'revoked', url: APP_URL },
    ]);

    await page.goto('/note-de-frais');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h2')).toContainText('Connexion');
  });
});
