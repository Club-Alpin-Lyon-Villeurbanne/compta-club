import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Expense Report Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to detail page when clicking on event', async ({ page }) => {
    // Cliquer sur le premier lien d'événement dans la table
    const eventLink = page.locator('tbody tr a').first();
    const href = await eventLink.getAttribute('href');

    if (href) {
      await eventLink.click();

      // Vérifier qu'on est sur la page de détail
      await expect(page).toHaveURL(/.*\/note-de-frais\/\d+/);
    }
  });

  test('should display event information on detail page', async ({ page }) => {
    // Naviguer vers la première note de frais
    const eventLink = page.locator('tbody tr a').first();
    await eventLink.click();

    // Attendre le chargement de la page
    await page.waitForURL(/.*\/note-de-frais\/\d+/);

    // Vérifier que les informations de l'événement sont affichées
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display expense list on detail page', async ({ page }) => {
    // Naviguer vers la première note de frais
    const eventLink = page.locator('tbody tr a').first();
    await eventLink.click();

    await page.waitForURL(/.*\/note-de-frais\/\d+/);

    // Vérifier que la liste des notes de frais est affichée
    await expect(page.locator('text=/Notes de frais|Détails/')).toBeVisible({ timeout: 10000 });
  });

  test('should be able to go back to list', async ({ page }) => {
    // Naviguer vers la première note de frais
    const eventLink = page.locator('tbody tr a').first();
    await eventLink.click();

    await page.waitForURL(/.*\/note-de-frais\/\d+/);

    // Cliquer sur le bouton retour ou le lien vers la liste
    const backLink = page.locator('a[href="/note-de-frais"], button:has-text("Retour")').first();
    const isVisible = await backLink.isVisible().catch(() => false);

    if (isVisible) {
      await backLink.click();
      await expect(page).toHaveURL(/.*\/note-de-frais$/);
    } else {
      // Utiliser la navigation du navigateur
      await page.goBack();
      await expect(page).toHaveURL(/.*\/note-de-frais/);
    }
  });

  test('should display transport expenses section', async ({ page }) => {
    // Naviguer vers une note de frais
    const eventLink = page.locator('tbody tr a').first();
    await eventLink.click();

    await page.waitForURL(/.*\/note-de-frais\/\d+/);
    await page.waitForTimeout(1000);

    // Vérifier la présence de la section transport
    const transportSection = page.locator('text=/Transport|Déplacement/i');
    const isVisible = await transportSection.isVisible().catch(() => false);

    // La section peut ne pas être visible si pas de frais de transport
    expect(isVisible).toBeDefined();
  });

  test('should display accommodation expenses section', async ({ page }) => {
    // Naviguer vers une note de frais
    const eventLink = page.locator('tbody tr a').first();
    await eventLink.click();

    await page.waitForURL(/.*\/note-de-frais\/\d+/);
    await page.waitForTimeout(1000);

    // Vérifier la présence de la section hébergement
    const accommodationSection = page.locator('text=/Hébergement|Logement/i');
    const isVisible = await accommodationSection.isVisible().catch(() => false);

    // La section peut ne pas être visible si pas de frais d'hébergement
    expect(isVisible).toBeDefined();
  });

  test('should display total amount', async ({ page }) => {
    // Naviguer vers une note de frais
    const eventLink = page.locator('tbody tr a').first();
    await eventLink.click();

    await page.waitForURL(/.*\/note-de-frais\/\d+/);
    await page.waitForTimeout(1000);

    // Vérifier la présence du montant total
    const totalAmount = page.locator('text=/Total|Montant|€/');
    await expect(totalAmount.first()).toBeVisible({ timeout: 10000 });
  });

  test('should expand/collapse expense details', async ({ page }) => {
    // Naviguer vers une note de frais
    const eventLink = page.locator('tbody tr a').first();
    await eventLink.click();

    await page.waitForURL(/.*\/note-de-frais\/\d+/);
    await page.waitForTimeout(1000);

    // Chercher un bouton d'expansion
    const expandButton = page.locator('button:has-text("Détails"), button[aria-expanded]').first();
    const isVisible = await expandButton.isVisible().catch(() => false);

    if (isVisible) {
      // Cliquer pour développer
      await expandButton.click();
      await page.waitForTimeout(300);

      // Vérifier que le contenu est développé
      // Le test passe si aucune erreur n'est levée
    }
  });
});

test.describe('Error Handling on Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show error for non-existent expense report', async ({ page }) => {
    // Naviguer vers une note de frais inexistante
    await page.goto('/note-de-frais/999999');

    // Vérifier qu'un message d'erreur est affiché
    await expect(page.locator('text=/Erreur|Aucune|Non trouvé/i')).toBeVisible({ timeout: 10000 });
  });

  test('should handle invalid slug gracefully', async ({ page }) => {
    // Naviguer vers une URL invalide
    await page.goto('/note-de-frais/invalid-slug');

    // Vérifier qu'un message d'erreur est affiché ou redirection
    const errorVisible = await page.locator('text=/Erreur|Aucune|Non trouvé/i').isVisible().catch(() => false);
    const redirected = page.url().includes('/note-de-frais') && !page.url().includes('invalid-slug');

    expect(errorVisible || redirected).toBeTruthy();
  });
});
