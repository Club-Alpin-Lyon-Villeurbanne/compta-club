import { Page } from '@playwright/test';
import { test, expect, login, rows } from './test-utils';

const statusSelect = (page: Page) => page.getByRole('combobox', { name: 'Statut' });
const typeSelect = (page: Page) => page.getByRole('combobox', { name: 'Type de note' });
const searchInput = (page: Page) => page.locator('input[placeholder="Rechercher une note de frais"]');
const row = (page: Page, text: string) => rows(page).filter({ hasText: text });

const A_VALIDER = [
  /Sortie Mont Blanc/,
  /Canyon Ardeche/,
  /Via ferrata Chamechaude/,
  /Cordelettes pour la SAE/,
  /Formation initiateur escalade/,
  /Sac <b>30 L<\/b>/,
];

function listRequests(page: Page): URL[] {
  const requests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/expense-reports') requests.push(url);
  });
  return requests;
}

test.describe('Notes hors sortie in the list', () => {
  test('should show what waits for the treasury by default, notes de sortie and notes hors sortie', async ({ page }) => {
    const requests = listRequests(page);
    await login(page, { notesHorsSortie: true });

    await expect(rows(page)).toHaveText(A_VALIDER);
    await expect(page.getByText('6 notes de frais affichées')).toBeVisible();
    await expect(statusSelect(page).locator('option:checked')).toHaveText('À valider');
    expect(requests[0].searchParams.getAll('status[]')).toEqual(['submitted', 'preapproved']);
    expect(requests[0].searchParams.has('status')).toBe(false);
    // Encore chez le responsable, ou en brouillon : la plateforme ne les envoie pas
    await expect(page.getByText('Piles pour les DVA')).toHaveCount(0);
    await expect(page.getByText('Gants pour la via ferrata')).toHaveCount(0);
  });

  test('should show the type, commission, expense date and declared amount of a note hors sortie', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    const formation = row(page, 'Formation initiateur escalade');
    // Montant figé par la plateforme : le total déclaré (245,60 €), pas le remboursable (231,40 €)
    await expect(formation.locator('td')).toHaveText([
      'Formation', '', /Formation initiateur escalade/, 'Thomas Petit', '25/01/2025', '26/01/2025',
      '245.60 €', 'Remboursement', 'Validée par le responsable',
    ]);
    await expect(formation.locator('img')).toHaveAttribute('alt', 'Escalade');

    const achat = row(page, 'Cordelettes pour la SAE');
    await expect(achat.locator('td')).toHaveText([
      'Achat', '', /Cordelettes pour la SAE/, 'Lucie Roux', '20/01/2025', '21/01/2025', '55.00 €', 'Remboursement', 'Soumis',
    ]);
    await expect(achat.locator('img')).toHaveAttribute('alt', 'Randonnée');

    const sortie = row(page, 'Sortie Mont Blanc');
    await expect(sortie.locator('td').first()).toHaveText('Sortie');
    await expect(sortie.locator('img')).toHaveAttribute('alt', 'Alpinisme');
    await expect(page.getByRole('columnheader', { name: 'Date sortie / dépense' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Don ou remb.' })).toBeVisible();
  });

  test('should link a note de sortie to its sortie, and a note hors sortie nowhere yet', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    await expect(row(page, 'Sortie Mont Blanc').getByRole('link').first()).toHaveAttribute('href', '/note-de-frais/101');
    await expect(row(page, 'Formation initiateur escalade').getByRole('link')).toHaveCount(0);
    await expect(row(page, 'Cordelettes pour la SAE').getByRole('link')).toHaveCount(0);
  });

  test('should show the text of a note hors sortie as is, without HTML', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    const sac = row(page, 'Sac <b>30 L</b>');
    await expect(sac).toContainText("Sac <b>30 L</b> & cordelette d'attache");
    await expect(sac.locator('b')).toHaveCount(0);
  });

  test('should filter by type', async ({ page }) => {
    const requests = listRequests(page);
    await login(page, { notesHorsSortie: true });
    await expect(rows(page)).toHaveText(A_VALIDER);

    await typeSelect(page).selectOption({ label: 'Formations' });
    await expect(rows(page)).toHaveText([/Formation initiateur escalade/]);
    expect(requests.at(-1)?.searchParams.get('type')).toBe('formation');

    await typeSelect(page).selectOption({ label: 'Achats' });
    await expect(rows(page)).toHaveText([/Cordelettes pour la SAE/, /Sac <b>30 L<\/b>/]);
    expect(requests.at(-1)?.searchParams.get('type')).toBe('autre');

    await typeSelect(page).selectOption({ label: 'Sorties' });
    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/, /Canyon Ardeche/, /Via ferrata Chamechaude/]);

    await typeSelect(page).selectOption({ label: 'Toutes' });
    await expect(rows(page)).toHaveText(A_VALIDER);
    expect(requests.at(-1)?.searchParams.has('type')).toBe(false);
  });

  test('should reset the type filter with the other filters', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    await typeSelect(page).selectOption({ label: 'Achats' });
    await expect(rows(page)).toHaveCount(2);

    await page.click('button[title="Réinitialiser les filtres"]');

    await expect(typeSelect(page)).toHaveValue('');
    await expect(rows(page)).toHaveText(A_VALIDER);
  });

  test('should show only the notes validated by a responsable', async ({ page }) => {
    const requests = listRequests(page);
    await login(page, { notesHorsSortie: true });

    await statusSelect(page).selectOption({ label: 'Validée par le responsable' });

    await expect(rows(page)).toHaveText([/Formation initiateur escalade/, /Sac <b>30 L<\/b>/]);
    await expect(rows(page).getByText('Validée par le responsable', { exact: true })).toHaveCount(2);
    expect(requests.at(-1)?.searchParams.get('status')).toBe('preapproved');
  });

  test('should show the notes hors sortie under the other statuses too', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    await statusSelect(page).selectOption('rejected');
    await expect(rows(page)).toHaveText([/Escalade Calanques/, /Prises pour le pan/]);

    await statusSelect(page).selectOption('approved');
    await expect(rows(page)).toHaveText([/Randonnee Vercors/, /Recyclage initiateur randonnée/]);
  });

  // Les notes comptabilisées tiennent sur deux pages : la note hors sortie est sur la seconde.
  test('should find a note hors sortie beyond the first page by type', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    await statusSelect(page).selectOption('accounted');
    await expect(rows(page).first()).toContainText('Ski de rando Beaufortain');
    await expect(page.getByText('Trousse de secours')).toHaveCount(0);

    await typeSelect(page).selectOption({ label: 'Achats' });

    await expect(rows(page)).toHaveText([/Trousse de secours/]);
  });

  // Comme dans l'API : la recherche et la date ne portent que sur les sorties.
  test('should keep the notes hors sortie when searching a sortie', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    await searchInput(page).fill('canyon');

    await expect(rows(page)).toHaveText([
      /Canyon Ardeche/,
      /Cordelettes pour la SAE/,
      /Formation initiateur escalade/,
      /Sac <b>30 L<\/b>/,
    ]);
  });

  test('should not offer the sortie PDF for a note hors sortie', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    await statusSelect(page).selectOption('approved');

    await expect(rows(page)).toHaveText([/Randonnee Vercors/, /Recyclage initiateur randonnée/]);
    await expect(row(page, 'Randonnee Vercors').getByRole('button', { name: 'Télécharger en PDF' })).toHaveCount(1);
    await expect(row(page, 'Recyclage initiateur randonnée').getByRole('button', { name: 'Télécharger en PDF' })).toHaveCount(0);
  });

  test('should copy the accounting label of a note hors sortie', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await login(page, { notesHorsSortie: true });
    const achat = row(page, 'Cordelettes pour la SAE');

    await achat.getByRole('button', { name: 'Copier le libellé comptable' }).click();

    await expect(achat.getByRole('button', { name: 'Copié !' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ROUX Lucie NDF 20/01/2025 Cordelettes pour la SAE');
  });

  test('should sort notes de sortie and notes hors sortie together', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    await expect(rows(page)).toHaveText(A_VALIDER);

    // 42 € < 55 € < 65,83 € < 90 € < 120 € < 245,60 €
    await page.getByRole('columnheader', { name: 'Montant' }).click();
    await expect(rows(page)).toHaveText([
      /Sac <b>30 L<\/b>/,
      /Cordelettes pour la SAE/,
      /Canyon Ardeche/,
      /Via ferrata Chamechaude/,
      /Sortie Mont Blanc/,
      /Formation initiateur escalade/,
    ]);

    // Sorties du 15/01, achats du 18/01 et du 20/01, formation du 25/01, sortie du 08/02
    await page.getByRole('columnheader', { name: 'Date sortie / dépense' }).click();
    await expect(rows(page)).toHaveText([
      /Sortie Mont Blanc/,
      /Canyon Ardeche/,
      /Sac <b>30 L<\/b>/,
      /Cordelettes pour la SAE/,
      /Formation initiateur escalade/,
      /Via ferrata Chamechaude/,
    ]);

    await page.getByRole('columnheader', { name: 'Type', exact: true }).click();
    await expect(rows(page)).toHaveText([
      /Cordelettes pour la SAE/,
      /Sac <b>30 L<\/b>/,
      /Formation initiateur escalade/,
      /Sortie Mont Blanc/,
      /Canyon Ardeche/,
      /Via ferrata Chamechaude/,
    ]);
  });
});
