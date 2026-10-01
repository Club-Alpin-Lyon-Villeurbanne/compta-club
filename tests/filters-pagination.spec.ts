import { test, expect, Page } from '@playwright/test';
import { login, rows } from './test-utils';

const statusSelect = (page: Page) => page.locator('select:has(option[value="Toutes"])');
const typeSelect = (page: Page) => page.locator('select:has(option[value="don"])');
const searchInput = (page: Page) => page.locator('input[placeholder="Rechercher une note de frais"]');
const requesterInput = (page: Page) => page.locator('input[placeholder="Nom du demandeur"]');

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/, /Canyon Ardeche/]);
  });

  test('should filter by status', async ({ page }) => {
    await statusSelect(page).selectOption('approved');

    await expect(rows(page)).toHaveText([/Randonnee Vercors/]);
  });

  test('should filter by search term', async ({ page }) => {
    await searchInput(page).fill('canyon');

    await expect(rows(page)).toHaveText([/Canyon Ardeche/]);
  });

  test('should filter by requester name', async ({ page }) => {
    await requesterInput(page).fill('Dupont');

    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/]);
  });

  test('should filter by type (don/remboursement)', async ({ page }) => {
    await statusSelect(page).selectOption('Toutes');
    await typeSelect(page).selectOption('don');

    await expect(rows(page)).toHaveText([/Escalade Calanques/]);
  });

  test('should show a message when nothing matches', async ({ page }) => {
    await searchInput(page).fill('introuvable');

    await expect(rows(page)).toHaveText([/Aucune note de frais ne correspond aux critères de recherche/]);
  });

  test('should reset all filters', async ({ page }) => {
    await statusSelect(page).selectOption('approved');
    await searchInput(page).fill('vercors');
    await requesterInput(page).fill('Martin');
    await expect(rows(page)).toHaveText([/Randonnee Vercors/]);

    await page.click('button[title="Réinitialiser les filtres"]');

    await expect(searchInput(page)).toHaveValue('');
    await expect(requesterInput(page)).toHaveValue('');
    await expect(statusSelect(page)).toHaveValue('submitted');
    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/, /Canyon Ardeche/]);
  });
});

test.describe('Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate between pages', async ({ page }) => {
    // Le faux backend contient plus de notes comptabilisées qu'une page n'en affiche
    await statusSelect(page).selectOption('accounted');
    await expect(rows(page).first()).toContainText('Ski de rando Beaufortain');
    const previous = page.getByRole('button', { name: 'Précédent' });
    const next = page.getByRole('button', { name: 'Suivant' });
    await expect(previous).toBeDisabled();

    const secondPage = page.waitForRequest((r) => r.url().includes('/api/expense-reports?page=2'));
    await next.click();
    await secondPage;

    await expect(previous).toBeEnabled();
    await expect(rows(page).first()).toContainText('Sortie archivée');
    await expect(page.getByText('Ski de rando Beaufortain')).toHaveCount(0);
  });

  test('should disable navigation when everything fits on one page', async ({ page }) => {
    await expect(rows(page)).toHaveCount(2);

    await expect(page.getByRole('button', { name: 'Précédent' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Suivant' })).toBeDisabled();
  });
});

test.describe('Column Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/, /Canyon Ardeche/]);
  });

  test('should sort by amount, then reverse the order', async ({ page }) => {
    const amountHeader = page.getByRole('columnheader', { name: 'Montant' });

    await amountHeader.click();
    await expect(rows(page)).toHaveText([/Canyon Ardeche/, /Sortie Mont Blanc/]);

    await amountHeader.click();
    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/, /Canyon Ardeche/]);
  });

  // Bug : les clés de tri de ReportTable (event.titre, user.lastname, event.tsp, createdAt,
  // event.commission.id) n'existent pas dans les données (sortie, utilisateur, dateCreation).
  // Seules les colonnes Montant, Type et Statut trient réellement.
  test.fixme('should sort by title', async ({ page }) => {
    await page.getByRole('columnheader', { name: 'Note de frais' }).click();

    await expect(rows(page)).toHaveText([/Canyon Ardeche/, /Sortie Mont Blanc/]);
  });
});
