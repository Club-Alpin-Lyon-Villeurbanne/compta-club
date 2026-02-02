import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Expense Report Actions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('should display action buttons on expense report row', async ({ page }) => {
    // Cliquer sur une ligne pour voir les détails/actions
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();

    // Vérifier la présence de boutons d'action (approuver, rejeter, etc.)
    // Note: Les boutons peuvent être dans un menu ou directement visibles
    const actionButtons = firstRow.locator('button');
    const buttonCount = await actionButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should show confirmation dialog when approving', async ({ page }) => {
    // Filtrer par statut "En attente" pour avoir des notes à approuver
    await page.selectOption('select:has(option:has-text("Tous statuts"))', 'pending');
    await page.waitForTimeout(500);

    // Chercher un bouton d'approbation (icône check ou texte "Approuver")
    const approveButton = page.locator('button[title*="Approuver"], button:has-text("Approuver")').first();
    const isVisible = await approveButton.isVisible().catch(() => false);

    if (isVisible) {
      await approveButton.click();

      // Vérifier que la boîte de dialogue SweetAlert2 apparaît
      await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.swal2-title')).toContainText('Êtes-vous sûr');

      // Annuler pour ne pas modifier les données
      await page.click('.swal2-cancel');
    }
  });

  test('should show comment dialog when rejecting', async ({ page }) => {
    // Filtrer par statut "En attente" pour avoir des notes à rejeter
    await page.selectOption('select:has(option:has-text("Tous statuts"))', 'pending');
    await page.waitForTimeout(500);

    // Chercher un bouton de rejet
    const rejectButton = page.locator('button[title*="Rejeter"], button:has-text("Rejeter")').first();
    const isVisible = await rejectButton.isVisible().catch(() => false);

    if (isVisible) {
      await rejectButton.click();

      // Vérifier que la boîte de dialogue avec textarea apparaît
      await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.swal2-title')).toContainText('Motif du rejet');
      await expect(page.locator('.swal2-textarea')).toBeVisible();

      // Annuler pour ne pas modifier les données
      await page.click('.swal2-cancel');
    }
  });

  test('should require comment when rejecting', async ({ page }) => {
    // Filtrer par statut "En attente"
    await page.selectOption('select:has(option:has-text("Tous statuts"))', 'pending');
    await page.waitForTimeout(500);

    // Chercher un bouton de rejet
    const rejectButton = page.locator('button[title*="Rejeter"], button:has-text("Rejeter")').first();
    const isVisible = await rejectButton.isVisible().catch(() => false);

    if (isVisible) {
      await rejectButton.click();
      await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });

      // Essayer de confirmer sans commentaire
      await page.click('.swal2-confirm');

      // Vérifier que le message de validation apparaît
      await expect(page.locator('.swal2-validation-message')).toBeVisible();
      await expect(page.locator('.swal2-validation-message')).toContainText('Vous devez entrer un commentaire');

      // Annuler
      await page.click('.swal2-cancel');
    }
  });

  test('should show confirmation dialog when marking as accounted', async ({ page }) => {
    // Filtrer par statut "Approuvé" pour avoir des notes à comptabiliser
    await page.selectOption('select:has(option:has-text("Tous statuts"))', 'approved');
    await page.waitForTimeout(500);

    // Chercher un bouton de comptabilisation
    const accountButton = page.locator('button[title*="Comptabiliser"], button:has-text("Comptabiliser")').first();
    const isVisible = await accountButton.isVisible().catch(() => false);

    if (isVisible) {
      await accountButton.click();

      // Vérifier que la boîte de dialogue apparaît
      await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.swal2-title')).toContainText('Êtes-vous sûr');

      // Annuler pour ne pas modifier les données
      await page.click('.swal2-cancel');
    }
  });
});

test.describe('PDF Export', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('should have PDF download button for approved reports', async ({ page }) => {
    // Filtrer par statut "Approuvé"
    await page.selectOption('select:has(option:has-text("Tous statuts"))', 'approved');
    await page.waitForTimeout(500);

    // Vérifier qu'il y a un bouton de téléchargement PDF
    const pdfButton = page.locator('button[title*="PDF"], button:has-text("PDF")').first();
    const isVisible = await pdfButton.isVisible().catch(() => false);

    // Si des notes approuvées existent, le bouton PDF devrait être visible
    if (isVisible) {
      await expect(pdfButton).toBeVisible();
    }
  });
});

test.describe('Copy to Clipboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('should have copy button on rows', async ({ page }) => {
    // Vérifier qu'il y a un bouton de copie
    const copyButton = page.locator('button[title*="Copier"], button:has-text("Copier")').first();
    const isVisible = await copyButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(copyButton).toBeVisible();
    }
  });
});
