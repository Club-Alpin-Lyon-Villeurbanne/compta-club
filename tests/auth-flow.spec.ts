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

test.describe('Back to the page after the login', () => {
  test('should open the page asked for while logged out, once logged in', async ({ page }) => {
    await page.goto('/note-de-frais/101');

    await expect(page).toHaveURL('/?retour=%2Fnote-de-frais%2F101');
    await expect(page.getByText('Votre session a expiré')).toHaveCount(0);
    await fillLoginForm(page);

    await expect(page).toHaveURL('/note-de-frais/101');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sortie Mont Blanc');
  });

  test('should say that the session expired during an action, then come back to the page', async ({ page, context }) => {
    await login(page);
    await page.goto('/note-de-frais/102');
    await expect(page.getByRole('button', { name: 'Comptabiliser', exact: true })).toBeVisible();
    await context.clearCookies();

    await page.getByRole('button', { name: 'Comptabiliser', exact: true }).click();
    await page.locator('.swal2-confirm').click();

    await expect(page).toHaveURL('/?session=expiree&retour=%2Fnote-de-frais%2F102');
    await expect(page.getByText('Votre session a expiré. Reconnectez-vous.')).toBeVisible();
    await expect(page.locator('.swal2-icon-error')).toHaveCount(0);
    await fillLoginForm(page);
    await expect(page).toHaveURL('/note-de-frais/102');
    await expect(rows(page)).toContainText('Approuvée');
  });

  test('should not follow a return address outside compta-club', async ({ page }) => {
    for (const retour of ['//example.com', '/\\example.com', 'https://example.com']) {
      await page.goto(`/?retour=${encodeURIComponent(retour)}`);
      await fillLoginForm(page);
      await expect(page).toHaveURL('/note-de-frais');
      await page.getByRole('button', { name: 'Déconnexion' }).click();
      await expect(page).toHaveURL('/');
    }
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

  test('should refresh an expired session on the home page and open the list', async ({ page, context }) => {
    const expired = createE2eTokens(undefined, -60);
    await context.addCookies([
      { name: 'access_token', value: expired.token, url: APP_URL },
      { name: 'refresh_token', value: expired.refresh_token, url: APP_URL },
    ]);

    await page.goto('/');

    // La page d'accueil renvoie un utilisateur connecté vers la liste
    await expect(page).toHaveURL(/\/note-de-frais$/);
    await expect(rows(page)).toHaveCount(3);
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
