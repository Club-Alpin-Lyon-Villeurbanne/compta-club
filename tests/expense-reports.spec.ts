import { test, expect, failNextListRequest, login, rows } from './test-utils';

test.describe('Expense Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display submitted expense reports by default', async ({ page }) => {
    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/, /Canyon Ardeche/, /Via ferrata Chamechaude/]);
    await expect(page.getByText('3 notes de frais affichées')).toBeVisible();
  });

  test('should display the refundable amount of each report', async ({ page }) => {
    // Mont Blanc : 150 km × 0,20 + 15 € de péage / 3 + nuitée plafonnée à 60 € + 25 € = 120 €
    await expect(rows(page).filter({ hasText: 'Sortie Mont Blanc' })).toContainText('120.00 €');
    // Canyon : (150 + 40 + 25) € de minibus de location / 6 passagers + 30 € = 65,83 €
    await expect(rows(page).filter({ hasText: 'Canyon Ardeche' })).toContainText('65.83 €');
  });

  test('should show an error when the backend fails', async ({ page }) => {
    await expect(rows(page)).toHaveCount(3);
    await failNextListRequest(page, 500);

    // Changer de filtre relance la requête, qui échoue cette fois
    await page.selectOption('select:has(option[value="Toutes"])', 'approved');

    // Le détail renvoyé par le backend (problem+json) n'est pas affiché : seul le statut l'est.
    await expect(page.getByText('Erreur 500')).toBeVisible();
    await expect(page.locator('table')).toHaveCount(0);
  });
});
