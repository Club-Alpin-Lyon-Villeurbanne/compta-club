import { test, expect } from '@playwright/test';
import { login } from './test-utils';
import { setupExpenseReportsMocks } from './mocks/expense-reports';

test.describe('Expense Reports', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await setupExpenseReportsMocks(page);
    await page.goto('/expense-reports');
  });

  test('should display expense reports', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(2);
  });

  test('should display expense report details correctly', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).toContainText('2024-03-15');
    await expect(firstRow.locator('td').nth(1)).toContainText('Course en montagne');
    await expect(firstRow.locator('td').nth(2)).toContainText('50.00');
    await expect(firstRow.locator('td').nth(3)).toContainText('En attente');
  });

  test('should handle empty expense reports list', async ({ page }) => {
    await page.route('**/api/expense-reports', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([])
      });
    });
    await page.reload();
    await expect(page.locator('text=Aucune note de frais')).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    await page.route('**/api/expense-reports', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Erreur serveur' })
      });
    });
    await page.reload();
    await expect(page.locator('text=Une erreur est survenue')).toBeVisible();
  });
}); 