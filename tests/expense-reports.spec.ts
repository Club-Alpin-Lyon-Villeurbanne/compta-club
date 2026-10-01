import { test, expect } from '@playwright/test';
import { login, rows } from './test-utils';

test.describe('Expense Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display submitted expense reports by default', async ({ page }) => {
    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/, /Canyon Ardeche/]);
    await expect(page.getByText('2 notes de frais affichées')).toBeVisible();
  });

  test('should display the refundable amount of each report', async ({ page }) => {
    // Mont Blanc : 150 km × 0,20 + 15 € de péage / 3 + nuitée plafonnée à 60 € + 25 € = 120 €
    await expect(rows(page).filter({ hasText: 'Sortie Mont Blanc' })).toContainText('120.00 €');
    // Canyon : (150 + 40 + 25) € de minibus de location / 6 passagers + 30 € = 65,83 €
    await expect(rows(page).filter({ hasText: 'Canyon Ardeche' })).toContainText('65.83 €');
  });

  test('should handle API error gracefully', async ({ page }) => {
    await expect(rows(page)).toHaveCount(2);
    await page.route(
      (url) => url.pathname === '/api/expense-reports',
      (route) => route.fulfill({ status: 500, json: { error: 'Erreur lors de la récupération des notes de frais' } })
    );

    // Changer de filtre relance la requête, qui échoue cette fois
    await page.selectOption('select:has(option[value="Toutes"])', 'approved');

    await expect(page.getByText('Erreur lors de la récupération des notes de frais')).toBeVisible();
  });
});
