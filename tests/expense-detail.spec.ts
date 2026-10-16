import { test, expect, login, rows } from './test-utils';

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

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sortie Mont Blanc');
    await expect(page.getByRole('heading', { name: 'Notes de frais' })).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveText(['Sortie', 'Demandeur', 'Date', 'Montant', 'Don ou remb.', 'Statut', 'Actions']);
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page)).toContainText('Jean Dupont');
    await expect(rows(page)).toContainText('120.00 €');
  });

  test('should lead back to the list, like the page of a note', async ({ page }) => {
    await page.goto('/note-de-frais/101');
    await expect(page).toHaveTitle('Sortie Mont Blanc · Compta Club');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Notes de frais', exact: true })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Retour à la liste' }).click();

    await expect(page).toHaveURL('/note-de-frais');
    await expect(rows(page).first()).toBeVisible();
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

  test('should lead back to the list from a sortie without expense report', async ({ page }) => {
    await page.goto('/note-de-frais/999999');

    await expect(page.getByText('Aucune note de frais à traiter pour cette sortie.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Actualiser la page' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Retour à la liste des notes' }).click();
    await expect(page).toHaveURL('/note-de-frais');
  });

  test('should lead back to the list, not show every note of the club, for an address without a sortie id', async ({ page }) => {
    await page.goto('/note-de-frais/note');

    await expect(page.getByText('Aucune note de frais à traiter pour cette sortie.')).toBeVisible();
    expect((await page.request.get('/api/expense-reports/note')).status()).toBe(400);
  });

  test('should name the error of a failed loading in French', async ({ page }) => {
    await page.route('**/api/expense-reports/101', (route) => route.fulfill({ status: 503, json: { error: 'Service indisponible' } }));
    await page.goto('/note-de-frais/101');

    await expect(page.getByRole('alert').filter({ hasText: 'chargement' }))
      .toHaveText(/^Erreur : Une erreur est survenue lors du chargement des données/);
    await page.getByRole('link', { name: 'Retour à la liste' }).click();
    await expect(page).toHaveURL('/note-de-frais');
  });

  for (const [name, path] of [['Aide', '/aide'], ['À propos', '/a-propos']]) {
    test(`should tell a screen reader that ${name} is the current page`, async ({ page }) => {
      await page.goto(path);

      const menu = page.getByRole('navigation');
      await expect(menu.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(menu.getByRole('link', { name: 'Notes de frais', exact: true })).not.toHaveAttribute('aria-current', 'page');
    });
  }
});
