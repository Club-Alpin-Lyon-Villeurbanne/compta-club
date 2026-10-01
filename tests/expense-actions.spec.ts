import { test, expect, Page } from '@playwright/test';
import { login, rows } from './test-utils';

// Dans les fixtures : l'événement 101 a une note soumise (id 1), le 102 une note approuvée (id 2).
const SUBMITTED_EVENT = '/note-de-frais/101';
const APPROVED_EVENT = '/note-de-frais/102';

const dialog = (page: Page) => page.locator('.swal2-popup');

function waitForPatch(page: Page, reportId: number) {
  return page.waitForRequest(
    (r) => r.method() === 'PATCH' && r.url().endsWith(`/api/expense-reports/${reportId}`)
  );
}

test.describe('Expense Report Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should only offer the actions allowed by the status', async ({ page }) => {
    await page.goto(SUBMITTED_EVENT);
    await expect(page.getByRole('button', { name: 'Approuver', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rejeter', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comptabiliser', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Télécharger en PDF' })).toHaveCount(0);

    await page.goto(APPROVED_EVENT);
    await expect(page.getByRole('button', { name: 'Comptabiliser', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Télécharger en PDF' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approuver', exact: true })).toHaveCount(0);
  });

  test('should approve after confirmation', async ({ page }) => {
    await page.goto(SUBMITTED_EVENT);
    await page.getByRole('button', { name: 'Approuver', exact: true }).click();
    await expect(dialog(page)).toContainText('Voulez-vous vraiment approuver cette note de frais ?');

    const patch = waitForPatch(page, 1);
    await page.locator('.swal2-confirm').click();

    expect((await patch).postDataJSON()).toEqual({ status: 'approved' });
    expect((await (await patch).response())?.status()).toBe(200);
    await expect(dialog(page)).toBeHidden();
  });

  test('should not send anything when approval is cancelled', async ({ page }) => {
    await page.goto(SUBMITTED_EVENT);
    const patches: string[] = [];
    page.on('request', (r) => r.method() === 'PATCH' && patches.push(r.url()));

    await page.getByRole('button', { name: 'Approuver', exact: true }).click();
    await page.locator('.swal2-cancel').click();

    await expect(dialog(page)).toBeHidden();
    expect(patches).toEqual([]);
  });

  test('should require a comment to reject, then send it', async ({ page }) => {
    await page.goto(SUBMITTED_EVENT);
    await page.getByRole('button', { name: 'Rejeter', exact: true }).click();
    await expect(dialog(page)).toContainText('Motif du rejet');

    await page.locator('.swal2-confirm').click();
    await expect(page.locator('.swal2-validation-message')).toContainText('Vous devez entrer un commentaire');

    await page.locator('.swal2-textarea').fill('Justificatif manquant');
    const patch = waitForPatch(page, 1);
    await page.locator('.swal2-confirm').click();

    expect((await patch).postDataJSON()).toEqual({ status: 'rejected', commentaireStatut: 'Justificatif manquant' });
    await expect(dialog(page)).toBeHidden();
  });

  test('should mark an approved report as accounted after confirmation', async ({ page }) => {
    await page.goto(APPROVED_EVENT);
    await page.getByRole('button', { name: 'Comptabiliser', exact: true }).click();
    await expect(dialog(page)).toContainText('Voulez-vous vraiment comptabiliser cette note de frais ?');

    const patch = waitForPatch(page, 2);
    await page.locator('.swal2-confirm').click();

    expect((await patch).postDataJSON()).toEqual({ status: 'accounted' });
    await expect(dialog(page)).toBeHidden();
  });

  test('should show an error when the backend refuses the action', async ({ page }) => {
    await page.route('**/api/expense-reports/1', (route) =>
      route.request().method() === 'PATCH'
        ? route.fulfill({ status: 422, json: { error: 'Erreur lors de la mise à jour de la note de frais' } })
        : route.fallback()
    );
    await page.goto(SUBMITTED_EVENT);

    await page.getByRole('button', { name: 'Approuver', exact: true }).click();
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText('Une erreur est survenue lors de l\'action sur la note de frais.');
    await expect(page.locator('.swal2-icon-error')).toBeVisible();
  });
});

test.describe('PDF Export', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should download the PDF of an approved report', async ({ page }) => {
    await page.locator('select:has(option[value="Toutes"])').selectOption('approved');
    await expect(rows(page)).toHaveText([/Randonnee Vercors/]);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger en PDF' }).click();

    expect((await download).suggestedFilename()).toBe('note-de-frais-SORTIE-2025-002-Martin.pdf');
  });
});

test.describe('Copy to Clipboard', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await login(page);
  });

  test('should copy the report reference', async ({ page }) => {
    const row = rows(page).filter({ hasText: 'Sortie Mont Blanc' });

    await row.getByRole('button', { name: 'Copier le titre' }).click();

    await expect(row.getByRole('button', { name: 'Copié !' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'SORTIE MONT BLANC-JEAN DUPONT-15/01/2025-ALPINISME'
    );
  });
});
