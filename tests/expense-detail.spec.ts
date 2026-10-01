import { test, expect } from '@playwright/test';
import { login, rows } from './test-utils';

test.describe('Expense Report Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to detail page when clicking on event', async ({ page }) => {
    await page.getByRole('link', { name: 'Sortie Mont Blanc' }).click();

    await expect(page).toHaveURL(/\/note-de-frais\/101$/);
    await expect(page.getByRole('heading', { name: 'Sortie Mont Blanc' })).toBeVisible();
  });

  test('should list the expense reports of the event', async ({ page }) => {
    await page.goto('/note-de-frais/101');

    await expect(page.getByRole('heading', { name: 'Notes de frais' })).toBeVisible();
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page)).toContainText('Jean Dupont');
    await expect(rows(page)).toContainText('120.00 €');
  });

  test('should expand and collapse expense details', async ({ page }) => {
    await page.goto('/note-de-frais/101');
    const title = page.getByRole('cell', { name: 'Sortie Mont Blanc' });
    const details = page.getByRole('heading', { name: 'Détails des Dépenses' });

    await title.click();
    await expect(details).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Transport' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hébergement' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Autres dépenses' })).toBeVisible();
    // Nuitée de 80 € plafonnée à 60 € remboursables
    await expect(page.getByText('dont 60.00 € remboursables')).toBeVisible();

    await title.click();
    await expect(details).toBeHidden();
  });
});

test.describe('Error Handling on Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show an error for an event without expense report', async ({ page }) => {
    await page.goto('/note-de-frais/999999');

    await expect(page.getByText('Aucune note de frais trouvée pour cet événement.')).toBeVisible();
  });
});
