import { Page } from '@playwright/test';
import { test, expect, downloadedPdf, login, rows } from './test-utils';
import { textAfter } from './pdf-text';

const statusSelect = (page: Page) => page.getByRole('combobox', { name: 'Statut' });
const typeSelect = (page: Page) => page.getByRole('combobox', { name: 'Type de note' });
const searchInput = (page: Page) => page.locator('input[placeholder="Rechercher une sortie"]');
const dateInput = (page: Page) => page.locator('input[type="date"]');
const row = (page: Page, text: string) => rows(page).filter({ hasText: text });

// Les notes hors sortie arrivent en tête : le faux backend garde l'ordre de ses données.
const A_VALIDER = [
  /Cordelettes pour la SAE/,
  /Formation initiateur escalade/,
  /Sac <b>30 L<\/b>/,
  /Sortie Mont Blanc/,
  /Canyon Ardeche/,
  /Via ferrata Chamechaude/,
];

function listRequests(page: Page): URL[] {
  const requests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/api/expense-reports') requests.push(url);
  });
  return requests;
}

async function listRequest(page: Page, matches: (params: URLSearchParams) => boolean): Promise<URLSearchParams> {
  const request = await page.waitForRequest((r) => {
    const url = new URL(r.url());
    return url.pathname === '/api/expense-reports' && matches(url.searchParams);
  });
  return new URL(request.url()).searchParams;
}

test.describe('Notes hors sortie in the list', () => {
  test('should show what waits for the treasury by default, notes de sortie and notes hors sortie', async ({ page }) => {
    const requests = listRequests(page);
    await login(page, { notesHorsSortie: true });

    await expect(rows(page)).toHaveText(A_VALIDER);
    await expect(page.getByText('6 notes de frais affichées')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Notes de frais · À valider (6)');
    await expect(statusSelect(page).locator('option:checked')).toHaveText('À valider');
    expect(requests[0].searchParams.getAll('status[]')).toEqual(['submitted', 'preapproved']);
    expect(requests[0].searchParams.has('status')).toBe(false);
    expect(requests[0].searchParams.has('type')).toBe(false);
    // Encore chez le responsable, ou en brouillon : la plateforme ne les envoie pas
    await expect(page.getByText('Piles pour les DVA')).toHaveCount(0);
    await expect(page.getByText('Gants pour la via ferrata')).toHaveCount(0);
  });

  test('should hide the counts while the list loads, where they would be the previous ones', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText('Notes de frais · À valider (6)');
    let release = () => {};
    const released = new Promise<void>((resolve) => { release = resolve; });
    await page.route((url) => url.pathname === '/api/expense-reports', async (route) => {
      await released;
      await route.continue();
    });

    await statusSelect(page).selectOption('approved');

    await expect(page.getByText('Chargement des notes de frais...')).toBeVisible();
    await expect(heading).toHaveText('Notes de frais');
    await expect(page.getByText(/de frais affichée/)).toHaveCount(0);
    release();
    await expect(heading).toHaveText('Notes de frais · Approuvée (2)');
    await expect(page.getByText('2 notes de frais affichées')).toBeVisible();
  });

  test('should name the page in its tab, and hold a single main region', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    await expect(page).toHaveTitle('Notes de frais · Compta Club');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Notes de frais', exact: true })).toHaveAttribute('aria-current', 'page');
  });

  test('should show the columns of a note hors sortie', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    // Montant : le total déclaré, et en dessous le remboursable quand les plafonds le réduisent.
    // Soumission : le dernier envoi.
    const formation = row(page, 'Formation initiateur escalade');
    await expect(formation.locator('td')).toHaveText([
      'Formation',
      '',
      /^Formation initiateur escalade\s*Escalade · Validée par Hugo BLANC le 27\/01$/,
      'Thomas Petit',
      '25/01/2025',
      '26/01/2025',
      /^312\.40 €\s*dont 287\.40 € remb\.$/,
      'Remboursement',
      'Validée par le responsable',
    ]);
    await expect(formation.locator('img')).toHaveAttribute('alt', 'Escalade');

    const achat = row(page, 'Cordelettes pour la SAE');
    await expect(achat.locator('td')).toHaveText([
      'Achat',
      '',
      /^Cordelettes pour la SAE\s*Randonnée · Directement à la trésorerie$/,
      'Lucie Roux',
      '20/01/2025',
      '23/01/2025',
      '55.00 €',
      'Remboursement',
      'Soumise',
    ]);
    await expect(achat.locator('img')).toHaveAttribute('alt', 'Randonnée');

    // Une note de sortie n'a ni ligne sous son titre, ni montant remboursable à part.
    const sortie = row(page, 'Sortie Mont Blanc');
    await expect(sortie.locator('td').first()).toHaveText('Sortie');
    await expect(sortie.locator('td').nth(2)).toHaveText('Sortie Mont Blanc');
    await expect(sortie.locator('td').nth(6)).toHaveText('120.00 €');
    await expect(sortie.locator('img')).toHaveAttribute('alt', 'Alpinisme');

    await expect(page.getByRole('columnheader', { name: 'Date', exact: true }))
      .toHaveAttribute('title', 'Date de la sortie ou de la dépense');
    await expect(page.getByRole('columnheader', { name: 'Don ou remb.' })).toBeVisible();
  });

  test('should keep the status badges aligned, with or without a PDF button, on two lines at most', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    const badge = (text: string) => row(page, text).locator('td').last().locator('span').first();

    const preapproved = await badge('Formation initiateur escalade').boundingBox();
    // Une ligne de badge fait 24 px, deux en font 40.
    expect(preapproved!.height).toBeLessThan(48);

    await statusSelect(page).selectOption('Toutes');
    await expect(row(page, 'Recyclage initiateur randonnée').getByRole('button', { name: 'Télécharger en PDF' })).toBeVisible();
    await expect(row(page, 'Formation initiateur escalade').getByRole('button', { name: 'Télécharger en PDF' })).toHaveCount(0);
    const withoutPdf = await badge('Formation initiateur escalade').boundingBox();
    const withPdf = await badge('Recyclage initiateur randonnée').boundingBox();
    expect(withoutPdf!.x).toBe(withPdf!.x);
  });

  test('should link a note de sortie to its sortie, and a note hors sortie to its page', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    await expect(row(page, 'Sortie Mont Blanc').getByRole('link').first()).toHaveAttribute('href', '/note-de-frais/101');
    // Un seul lien par ligne, le titre : le demandeur est du texte.
    for (const [text, href] of [
      ['Formation initiateur escalade', '/note-de-frais/note/202'],
      ['Cordelettes pour la SAE', '/note-de-frais/note/201'],
    ]) {
      await expect(row(page, text).getByRole('link')).toHaveCount(1);
      await expect(row(page, text).getByRole('link', { name: text })).toHaveAttribute('href', href);
    }
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
    await expect(rows(page)).toHaveText([/Prises pour le pan/, /Escalade Calanques/]);
    // Qui l'a refusée, plutôt que la validation du responsable qui la précède
    await expect(row(page, 'Prises pour le pan').locator('td').nth(2))
      .toHaveText(/^Prises pour le pan\s*Escalade · Refusée par la trésorerie le 29\/01$/);

    await statusSelect(page).selectOption('approved');
    await expect(rows(page)).toHaveText([/Recyclage initiateur randonnée/, /Randonnee Vercors/]);
  });

  // Les achats comptabilisés remplissent la première page : la note de sortie est derrière eux.
  test('should find the notes de sortie behind a page of notes hors sortie, by type', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    await statusSelect(page).selectOption('accounted');
    await expect(rows(page).first()).toContainText('Trousse de secours');
    await expect(page.getByText('Ski de rando Beaufortain')).toHaveCount(0);

    await typeSelect(page).selectOption({ label: 'Sorties' });

    await expect(rows(page).first()).toContainText('Ski de rando Beaufortain');
  });

  test('should search the sorties only', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    // La recherche part après une courte pause de saisie.
    const searched = listRequest(page, (params) => params.get('event.titre') === 'canyon');

    await searchInput(page).fill('canyon');

    expect((await searched).get('type')).toBe('sortie');
    await expect(rows(page)).toHaveText([/Canyon Ardeche/]);
  });

  // Sans `type=sortie`, les 36 notes hors sortie, toutes gardées par l'API, rempliraient la première page.
  test('should find a sortie on the first page among all statuses', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    await statusSelect(page).selectOption('Toutes');
    await expect(rows(page).first()).toContainText('Cordelettes pour la SAE');

    await searchInput(page).fill('Mont Blanc');

    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/]);
  });

  test('should filter the sorties only by date', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    const filtered = listRequest(page, (params) => params.has('event.startDate[after]'));

    await dateInput(page).fill('2025-01-15');

    expect((await filtered).get('type')).toBe('sortie');
    await expect(rows(page)).toHaveText([/Sortie Mont Blanc/, /Canyon Ardeche/]);
  });

  test('should turn off the search and the date for formations and achats', async ({ page }) => {
    await login(page, { notesHorsSortie: true });
    await searchInput(page).fill('canyon');
    await expect(rows(page)).toHaveText([/Canyon Ardeche/]);

    await typeSelect(page).selectOption({ label: 'Formations' });

    await expect(rows(page)).toHaveText([/Formation initiateur escalade/]);
    // Écrit sous les filtres, pas seulement au survol : un champ désactivé ne prend pas le focus.
    await expect(page.getByText('La recherche et la date portent sur les sorties.', { exact: true })).toBeVisible();
    for (const input of [searchInput(page), dateInput(page)]) {
      await expect(input).toBeDisabled();
      await expect(input).toHaveValue('');
      await expect(input).toHaveAttribute('title', 'La recherche et la date portent sur les sorties');
      await expect(input).toHaveAccessibleDescription('La recherche et la date portent sur les sorties.');
    }

    await typeSelect(page).selectOption({ label: 'Sorties' });
    await expect(searchInput(page)).toBeEnabled();
    await expect(dateInput(page)).toBeEnabled();
    await expect(page.getByText('La recherche et la date portent sur les sorties.', { exact: true })).toHaveCount(0);
  });

  test('should download the PDF of an approved note hors sortie from the list', async ({ page }) => {
    await login(page, { notesHorsSortie: true });

    await statusSelect(page).selectOption('approved');

    await expect(rows(page)).toHaveText([/Recyclage initiateur randonnée/, /Randonnee Vercors/]);
    await expect(row(page, 'Randonnee Vercors').getByRole('button', { name: 'Télécharger en PDF' })).toHaveCount(1);
    const download = page.waitForEvent('download');
    await row(page, 'Recyclage initiateur randonnée').getByRole('button', { name: 'Télécharger en PDF' }).click();

    const pdf = await downloadedPdf(await download);
    expect(pdf.fileName).toBe('note-de-frais-formation-204-ROUX.pdf');
    expect(pdf.raw.startsWith('%PDF')).toBe(true);
    expect(pdf.texts).toContain('STATUT : APPROUVÉE');
    expect(textAfter(pdf.texts, 'Demandeur')).toBe('Lucie Roux');
    expect(textAfter(pdf.texts, 'Objet')).toBe('Recyclage initiateur randonnée');
    expect(textAfter(pdf.texts, 'Date de la formation')).toBe('11/01/2025');
    expect(textAfter(pdf.texts, 'Stage')).toBe('120.00 €');
    expect(textAfter(pdf.texts, 'Total')).toBe('120.00 €');
    expect(textAfter(pdf.texts, 'Validation du responsable')).toBe('Aucune : la note est allée directement à la trésorerie.');
    expect(textAfter(pdf.texts, 'Libellé comptable')).toBe('ROUX Lucie NDF 11/01/2025 Recyclage initiateur randonnée');
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

    // 42 € < 55 € < 65,83 € < 90 € < 120 € < 312,40 €
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
    await page.getByRole('columnheader', { name: 'Date', exact: true }).click();
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
