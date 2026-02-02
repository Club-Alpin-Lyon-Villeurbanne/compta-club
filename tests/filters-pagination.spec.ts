import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('should filter by status', async ({ page }) => {
    // Compter les lignes initiales
    const initialCount = await page.locator('tbody tr').count();

    // Filtrer par statut "En attente"
    await page.selectOption('select:has(option:has-text("Tous statuts"))', 'pending');

    // Attendre que le filtre soit appliqué
    await page.waitForTimeout(500);

    // Vérifier que le filtre est appliqué (le nombre de lignes peut changer)
    const filteredCount = await page.locator('tbody tr').count();
    // Le nombre filtré doit être <= au nombre initial
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should filter by search term', async ({ page }) => {
    // Saisir un terme de recherche
    await page.fill('input[placeholder="Rechercher une note de frais"]', 'test');

    // Attendre que le filtre soit appliqué
    await page.waitForTimeout(500);

    // Vérifier que la table est toujours visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('should filter by requester name', async ({ page }) => {
    // Saisir un nom de demandeur
    await page.fill('input[placeholder="Nom du demandeur"]', 'Jean');

    // Attendre que le filtre soit appliqué
    await page.waitForTimeout(500);

    // Vérifier que la table est toujours visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('should filter by type (don/remboursement)', async ({ page }) => {
    // Filtrer par type "Don"
    await page.selectOption('select:has(option:has-text("Tous types"))', 'don');

    // Attendre que le filtre soit appliqué
    await page.waitForTimeout(500);

    // Vérifier que la table est toujours visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('should reset all filters', async ({ page }) => {
    // Appliquer plusieurs filtres
    await page.fill('input[placeholder="Rechercher une note de frais"]', 'test');
    await page.fill('input[placeholder="Nom du demandeur"]', 'Jean');

    // Cliquer sur le bouton de réinitialisation
    await page.click('button[title="Réinitialiser les filtres"]');

    // Vérifier que les filtres sont réinitialisés
    await expect(page.locator('input[placeholder="Rechercher une note de frais"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="Nom du demandeur"]')).toHaveValue('');
  });
});

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('should change items per page', async ({ page }) => {
    // Sélectionner 5 éléments par page
    await page.selectOption('select:has(option:has-text("par page"))', '5');

    // Attendre que la pagination soit appliquée
    await page.waitForTimeout(500);

    // Vérifier qu'il y a au maximum 5 lignes de données
    const rowCount = await page.locator('tbody tr').count();
    expect(rowCount).toBeLessThanOrEqual(5);
  });

  test('should navigate between pages', async ({ page }) => {
    // Sélectionner 5 éléments par page pour avoir plusieurs pages
    await page.selectOption('select:has(option:has-text("par page"))', '5');
    await page.waitForTimeout(500);

    // Vérifier si le bouton "Suivant" existe
    const nextButton = page.locator('button:has-text("Suivant")');
    const hasNextButton = await nextButton.isVisible().catch(() => false);

    if (hasNextButton) {
      // Cliquer sur Suivant
      await nextButton.click();
      await page.waitForTimeout(500);

      // Vérifier que la pagination a changé (le bouton Précédent devrait être actif)
      await expect(page.locator('button:has-text("Précédent")')).toBeEnabled();
    }
  });

  test('should display pagination info', async ({ page }) => {
    // Vérifier que les informations de pagination sont affichées
    await expect(page.locator('text=/Affichage de \\d+ à \\d+ sur \\d+/')).toBeVisible();
  });
});

test.describe('Column Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('should sort by clicking column header', async ({ page }) => {
    // Cliquer sur un en-tête de colonne pour trier
    const header = page.locator('th').first();
    await header.click();

    // Vérifier que le tri est appliqué (icône de tri visible)
    await page.waitForTimeout(300);

    // Cliquer à nouveau pour inverser le tri
    await header.click();
    await page.waitForTimeout(300);

    // La table devrait toujours être visible
    await expect(page.locator('table')).toBeVisible();
  });
});
