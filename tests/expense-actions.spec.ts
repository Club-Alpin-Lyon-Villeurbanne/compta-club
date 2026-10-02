import { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { test, expect, backendReceived, login, rows } from './test-utils';

// Événements des données de test et statut de leur note :
// 101 soumise (Jean Dupont), 102 approuvée (Marie Martin), 103 rejetée, 104 comptabilisée,
// 106 soumise par le gestionnaire connecté lui-même.
const SUBMITTED_EVENT = '/note-de-frais/101';
const APPROVED_EVENT = '/note-de-frais/102';
const REJECTED_EVENT = '/note-de-frais/103';
const ACCOUNTED_EVENT = '/note-de-frais/104';
const OWN_REPORT_EVENT = '/note-de-frais/106';

const dialog = (page: Page) => page.locator('.swal2-popup');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function expectActions(page: Page, visible: string[]) {
  for (const name of ['Approuver', 'Rejeter', 'Comptabiliser', 'Télécharger en PDF']) {
    await expect(button(page, name)).toHaveCount(visible.includes(name) ? 1 : 0);
  }
}

test.describe('Expense Report Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const actionsByStatus = [
    { status: 'Soumis', event: SUBMITTED_EVENT, actions: ['Approuver', 'Rejeter'] },
    { status: 'Approuvé', event: APPROVED_EVENT, actions: ['Comptabiliser', 'Télécharger en PDF'] },
    { status: 'Rejeté', event: REJECTED_EVENT, actions: [] },
    { status: 'Comptabilisé', event: ACCOUNTED_EVENT, actions: ['Télécharger en PDF'] },
  ];

  for (const { status, event, actions } of actionsByStatus) {
    test(`should only offer the actions allowed for a report "${status}"`, async ({ page }) => {
      await page.goto(event);

      await expect(rows(page)).toContainText(status);
      await expectActions(page, actions);
    });
  }

  test('should approve after confirmation', async ({ page }) => {
    await page.goto(SUBMITTED_EVENT);
    await button(page, 'Approuver').click();
    await expect(dialog(page)).toContainText('Voulez-vous vraiment approuver cette note de frais ?');

    await page.locator('.swal2-confirm').click();

    // L'écran est rechargé avec le nouveau statut
    await expect(rows(page)).toContainText('Approuvé');
    await expectActions(page, ['Comptabiliser', 'Télécharger en PDF']);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/1', body: { status: 'approved' } },
    ]);
  });

  test('should not send anything when approval is cancelled', async ({ page }) => {
    await page.goto(SUBMITTED_EVENT);
    const patches: string[] = [];
    page.on('request', (r) => r.method() === 'PATCH' && patches.push(r.url()));

    await button(page, 'Approuver').click();
    await page.locator('.swal2-cancel').click();

    await expect(dialog(page)).toBeHidden();
    expect(patches).toEqual([]);
    await expect(rows(page)).toContainText('Soumis');
  });

  test('should require a comment to reject, then send it to the backend', async ({ page }) => {
    await page.goto(SUBMITTED_EVENT);
    await button(page, 'Rejeter').click();
    await expect(dialog(page)).toContainText('Motif du rejet');

    await page.locator('.swal2-confirm').click();
    await expect(page.locator('.swal2-validation-message')).toContainText('Vous devez entrer un commentaire');

    await page.locator('.swal2-textarea').fill('Justificatif manquant');
    await page.locator('.swal2-confirm').click();

    await expect(rows(page)).toContainText('Rejeté');
    expect(await backendReceived(page)).toEqual([
      {
        method: 'PATCH',
        path: '/notes-de-frais/1',
        body: { status: 'rejected', commentaireStatut: 'Justificatif manquant' },
      },
    ]);
  });

  test('should mark an approved report as accounted after confirmation', async ({ page }) => {
    await page.goto(APPROVED_EVENT);
    await button(page, 'Comptabiliser').click();
    await expect(dialog(page)).toContainText('Voulez-vous vraiment comptabiliser cette note de frais ?');

    await page.locator('.swal2-confirm').click();

    await expect(rows(page)).toContainText('Comptabilisé');
    await expectActions(page, ['Télécharger en PDF']);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/2', body: { status: 'accounted' } },
    ]);
  });

  test('should show an error when the backend refuses the action', async ({ page }) => {
    // Le backend refuse (422) qu'un gestionnaire décide de sa propre note
    await page.goto(OWN_REPORT_EVENT);
    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText('Une erreur est survenue lors de l\'action sur la note de frais.');
    await expect(page.locator('.swal2-icon-error')).toBeVisible();
    expect(await backendReceived(page)).toHaveLength(1);
    await expect(rows(page)).toContainText('Soumis');
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
    const pdf = readFileSync((await (await download).path())!, 'latin1');
    expect(pdf.startsWith('%PDF')).toBe(true);
    expect(pdf).toContain('Randonnee Vercors');
    expect(pdf).toContain('45.00');
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
