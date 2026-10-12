import { Page } from '@playwright/test';
import { test, expect, backendReceived, login, rows } from './test-utils';

// Notes des données de test : 201 achat soumis sans responsable, 202 formation validée par le
// responsable (avec une ligne de voiture), 203 achat validé par le responsable, en don, 204 formation
// approuvée, 205 achat rejeté par la trésorerie, 206 achat encore chez le responsable.
const note = (id: number | string) => `/note-de-frais/note/${id}`;

const dialog = (page: Page) => page.locator('.swal2-popup');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const actionButtons = (page: Page) => page.getByRole('button', { name: /^(Approuver|Rejeter|Comptabiliser)$/ });
const status = (page: Page, label: string) => page.getByText(label, { exact: true });
const field = (page: Page, label: string) => page.locator(`dt:text-is("${label}") + dd`);
const line = (page: Page, libelle: string) =>
  page.locator('tbody tr').filter({ has: page.locator(`td:first-child:text-is("${libelle}")`) });

test.describe('Page of a note hors sortie', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { notesHorsSortie: true });
  });

  test('should open from the list and lead back to it', async ({ page }) => {
    await rows(page).filter({ hasText: 'Formation initiateur escalade' })
      .getByRole('link', { name: 'Formation initiateur escalade' }).click();

    await expect(page).toHaveURL(note(202));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Formation initiateur escalade');

    await page.getByRole('link', { name: 'Retour à la liste' }).click();
    await expect(page).toHaveURL('/note-de-frais');
    await expect(rows(page).first()).toBeVisible();
  });

  test('should show a formation, with its car line', async ({ page }) => {
    await page.goto(note(202));

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Formation initiateur escalade');
    await expect(status(page, 'Validée par le responsable')).toBeVisible();
    await expect(field(page, 'Demandeur')).toHaveText('Thomas Petit');
    await expect(field(page, 'Type')).toHaveText('Formation');
    await expect(field(page, 'Commission')).toHaveText('Escalade');
    await expect(field(page, 'Objet')).toHaveText('Formation initiateur escalade');
    await expect(field(page, 'Date de la dépense')).toHaveText('25/01/2025');
    await expect(field(page, 'Mot pour le responsable')).toHaveText('Stage validé par la commission en décembre.');
    await expect(field(page, 'Validation du responsable')).toHaveText('Validée par Hugo BLANC le 27/01/2025');
    await expect(field(page, 'Don ou remboursement')).toHaveText('Remboursement');
    await expect(field(page, 'Libellé comptable')).toHaveText('PETIT Thomas NDF 25/01/2025 Formation initiateur escalade');

    const lien = field(page, 'Lien de la formation').getByRole('link');
    await expect(lien).toHaveText('https://example.com/formation-initiateur-escalade');
    await expect(lien).toHaveAttribute('href', 'https://example.com/formation-initiateur-escalade');
    await expect(lien).toHaveAttribute('target', '_blank');
    await expect(lien).toHaveAttribute('rel', 'noopener noreferrer');

    await expect(page.getByLabel('Avertissements')).toHaveText(
      'Le stage dépasse le plafond de la commission : le remboursable est réduit.'
    );
    await expect(line(page, 'Stage').locator('td')).toHaveText(['Stage', '', '250.00 €', '']);
    await expect(line(page, 'Stage').getByRole('link')).toHaveAttribute('href', 'https://example.com/facture-stage.pdf');
    await expect(line(page, 'Voiture').locator('td')).toHaveText(['Voiture', '240 km × 0,26 €', '62.40 €', 'N/A']);
    await expect(page.locator('tfoot tr')).toHaveText([/^Total déclaré\s*312\.40 €$/, /^Total remboursable\s*287\.40 €$/]);
    await expect(page.getByLabel('Dernier refus')).toHaveCount(0);

    await expect(actionButtons(page)).toHaveText(['Approuver', 'Rejeter']);
    await expect(page.getByRole('button', { name: 'Télécharger en PDF' })).toHaveCount(0);
  });

  test('should show an achat given as a don, and open its receipt', async ({ page, context }) => {
    await context.route('https://example.com/**', (route) => route.fulfill({ contentType: 'text/plain', body: 'Facture' }));
    await page.goto(note(203));

    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Sac <b>30 L</b> & cordelette d'attache");
    await expect(page.locator('b')).toHaveCount(0);
    await expect(field(page, 'Type')).toHaveText('Achat');
    await expect(field(page, 'Commission')).toHaveText('Escalade');
    await expect(field(page, 'Date de la dépense')).toHaveText('18/01/2025');
    await expect(field(page, 'Validation du responsable')).toHaveText('Validée par Hugo BLANC le 27/01/2025');
    await expect(field(page, 'Don ou remboursement')).toHaveText('Don');
    await expect(field(page, 'Lien de la formation')).toHaveCount(0);
    await expect(page.locator('tfoot tr')).toHaveText([/^Total déclaré\s*42\.00 €$/, /^Total remboursable\s*42\.00 €$/]);

    const receipt = page.waitForEvent('popup');
    await line(page, "Sac <b>30 L</b> & cordelette d'attache").getByRole('link').click();

    expect((await receipt).url()).toBe('https://example.com/facture-203.pdf');
  });

  test('should show nothing of a validation for a note that had no responsable to validate it', async ({ page }) => {
    await page.goto(note(201));

    await expect(field(page, 'Demandeur')).toHaveText('Lucie Roux');
    await expect(status(page, 'Soumis')).toBeVisible();
    await expect(field(page, 'Validation du responsable')).toHaveCount(0);
    await expect(actionButtons(page)).toHaveText(['Approuver', 'Rejeter']);
  });

  test('should approve a note validated by the responsable, then offer to account for it', async ({ page }) => {
    await page.goto(note(202));

    await button(page, 'Approuver').click();
    await expect(dialog(page)).toContainText('Voulez-vous vraiment approuver cette note de frais ?');
    await page.locator('.swal2-confirm').click();

    await expect(status(page, 'Approuvé')).toBeVisible();
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/202', body: { status: 'approved' } },
    ]);
  });

  test('should approve a note that had no responsable to validate it', async ({ page }) => {
    await page.goto(note(201));

    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();

    await expect(status(page, 'Approuvé')).toBeVisible();
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/201', body: { status: 'approved' } },
    ]);
  });

  test('should require a comment to reject, then show the refusal', async ({ page }) => {
    await page.goto(note(203));

    await button(page, 'Rejeter').click();
    await expect(dialog(page)).toContainText('Motif du rejet');
    await page.locator('.swal2-confirm').click();
    await expect(page.locator('.swal2-validation-message')).toContainText('Vous devez entrer un commentaire');
    expect(await backendReceived(page)).toEqual([]);

    await page.locator('.swal2-textarea').fill('Merci de joindre le ticket de caisse.');
    await page.locator('.swal2-confirm').click();

    await expect(status(page, 'Rejeté')).toBeVisible();
    const refusal = page.getByLabel('Dernier refus');
    await expect(refusal).toContainText(/^Refusée par Claire FONTAINE le \d\d\/\d\d\/\d{4}/);
    await expect(refusal).toContainText('Merci de joindre le ticket de caisse.');
    await expect(actionButtons(page)).toHaveCount(0);
    expect(await backendReceived(page)).toEqual([
      {
        method: 'PATCH',
        path: '/notes-de-frais/203',
        body: { status: 'rejected', commentaireStatut: 'Merci de joindre le ticket de caisse.' },
      },
    ]);
  });

  test('should account for an approved note', async ({ page }) => {
    await page.goto(note(204));
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);

    await button(page, 'Comptabiliser').click();
    await expect(dialog(page)).toContainText('Voulez-vous vraiment comptabiliser cette note de frais ?');
    await page.locator('.swal2-confirm').click();

    await expect(status(page, 'Comptabilisé')).toBeVisible();
    await expect(actionButtons(page)).toHaveCount(0);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/204', body: { status: 'accounted' } },
    ]);
  });

  test('should show the refusal of the platform as is, then where the note stands', async ({ page }) => {
    await page.goto(note(202));
    await expect(button(page, 'Approuver')).toBeVisible();
    // Décidée entre-temps, dans un autre onglet par exemple
    expect((await page.request.patch('/api/expense-reports/202', { data: { status: 'approved' } })).ok()).toBe(true);

    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText('Cette demande a déjà été traitée.');
    await expect(page.locator('.swal2-icon-error')).toBeVisible();
    await page.locator('.swal2-confirm').click();
    await expect(status(page, 'Approuvé')).toBeVisible();
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
  });

  test('should show the rejected note with its refusal, without action', async ({ page }) => {
    await page.goto(note(205));

    await expect(status(page, 'Rejeté')).toBeVisible();
    await expect(page.getByLabel('Dernier refus')).toHaveText(/^Refusée par Claire FONTAINE le 29\/01\/2025\s*Il manque la facture\.$/);
    await expect(actionButtons(page)).toHaveCount(0);
  });

  test('should leave a note waiting for its responsable alone', async ({ page }) => {
    await page.goto(note(206));

    await expect(page.getByText('En attente de la validation du responsable de commission.')).toBeVisible();
    await expect(actionButtons(page)).toHaveCount(0);
  });

  test('should send a note de sortie to the page of its sortie', async ({ page }) => {
    await page.goto(note(1));

    await expect(page).toHaveURL('/note-de-frais/101');
  });

  test('should refuse an invalid id, and say when the note does not exist', async ({ page }) => {
    await page.goto(note('abc'));
    await expect(page.getByText('Identifiant de note invalide')).toBeVisible();

    await page.goto(note(999));
    await expect(page.getByText('Note de frais introuvable')).toBeVisible();
  });

  test('should pass on the refusals of the platform, and check the id, through the proxy', async ({ page }) => {
    const rejection = await page.request.patch('/api/expense-reports/203', { data: { status: 'rejected' } });
    expect(rejection.status()).toBe(422);
    expect(await rejection.json()).toEqual({ error: 'Un message au demandeur est obligatoire pour refuser la note.' });

    const invalid = await page.request.patch('/api/expense-reports/abc', { data: { status: 'approved' } });
    expect(invalid.status()).toBe(400);
    expect((await page.request.get('/api/expense-reports/note/0')).status()).toBe(400);
    // Seul le refus est parti vers la plateforme
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/203', body: { status: 'rejected' } },
    ]);
  });
});
