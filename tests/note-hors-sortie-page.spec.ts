import { Page, Route } from '@playwright/test';
import { test, expect, backendReceived, login, rows } from './test-utils';

// Notes des données de test : 201 achat soumis sans responsable, 202 formation validée par le
// responsable (avec une ligne de voiture), 203 achat validé par le responsable, en don, 204 formation
// approuvée, 205 achat rejeté par la trésorerie, 206 achat refusé, corrigé et renvoyé, de nouveau chez
// le responsable, 207 brouillon.
const note = (id: number | string) => `/note-de-frais/note/${id}`;

const dialog = (page: Page) => page.locator('.swal2-popup');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const actionButtons = (page: Page) =>
  page.getByRole('button', { name: /^(Approuver|Rejeter|Comptabiliser|Approbation…|Refus…|Comptabilisation…)$/ });
const status = (page: Page, label: string) => page.getByText(label, { exact: true });
const summary = (page: Page) => page.getByRole('region', { name: 'Synthèse' });
const confirmation = (page: Page) => page.getByRole('status').first();
const field = (page: Page, label: string) => page.locator(`dt:text-is("${label}") + dd`);
const line = (page: Page, libelle: string) =>
  page.locator('tbody tr').filter({ has: page.locator(`td:first-child:text-is("${libelle}")`) });
const today = /\d\d\/\d\d\/\d{4}/;

// Retient le PATCH du navigateur vers compta-club jusqu'à `release()` : une réponse lente, comme en production.
async function holdPatch(page: Page, path: string) {
  let held: Route | null = null;
  let release = () => {};
  const released = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`**${path}`, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    held = route;
    await released;
    await route.continue();
  });
  return { isHeld: () => held !== null, release };
}

test.describe('Page of a note hors sortie', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { notesHorsSortie: true });
  });

  test('should open from the list and lead back to it', async ({ page }) => {
    await rows(page).filter({ hasText: 'Formation initiateur escalade' })
      .getByRole('link', { name: 'Formation initiateur escalade' }).click();

    await expect(page).toHaveURL(note(202));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Formation initiateur escalade');
    await expect(page).toHaveTitle('Note 202 : Formation initiateur escalade · Compta Club');

    await page.getByRole('link', { name: 'Retour à la liste' }).click();
    await expect(page).toHaveURL('/note-de-frais');
    await expect(rows(page).first()).toBeVisible();
  });

  test('should show a formation, with its car line', async ({ page }) => {
    await page.goto(note(202));

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Formation initiateur escalade');
    await expect(page.getByText('Formation · Escalade', { exact: true })).toBeVisible();
    await expect(status(page, 'Validée par le responsable')).toBeVisible();

    await expect(summary(page)).toContainText('À rembourser : 287.40 €');
    await expect(summary(page)).toContainText('312.40 € déclarés, dont 25.00 € au-delà des plafonds du club');
    await expect(summary(page)).toContainText('Remboursement demandé');
    await expect(summary(page)).toContainText('PETIT Thomas NDF 25/01/2025 Formation initiateur escalade');
    await expect(summary(page).getByRole('button', { name: /^(Approuver|Rejeter)$/ })).toHaveText(['Approuver', 'Rejeter']);

    await expect(field(page, 'Demandeur')).toHaveText('Thomas Petit');
    await expect(field(page, 'Date de la formation')).toHaveText('25/01/2025');
    await expect(field(page, 'Mot pour le responsable')).toHaveText('Stage validé par la commission en décembre.');
    await expect(field(page, 'Validation du responsable')).toHaveText('Validée par Hugo BLANC le 27/01/2025');
    for (const label of ['Type', 'Commission', 'Objet']) await expect(field(page, label)).toHaveCount(0);

    const lien = field(page, 'Lien de la formation').getByRole('link');
    await expect(lien).toHaveText('https://example.com/formation-initiateur-escalade');
    await expect(lien).toHaveAttribute('href', 'https://example.com/formation-initiateur-escalade');
    await expect(lien).toHaveAttribute('target', '_blank');
    await expect(lien).toHaveAttribute('rel', 'noopener noreferrer');

    await expect(page.getByLabel('Avertissements')).toHaveText(
      'Le stage dépasse le plafond de la commission : le remboursable est réduit.'
    );
    await expect(line(page, 'Stage').locator('td')).toHaveText(['Stage', '', '250.00 €', '']);
    await expect(line(page, 'Stage').getByRole('link', { name: 'Justificatif : Stage (ouvre un nouvel onglet)' }))
      .toHaveAttribute('href', 'https://example.com/facture-stage.pdf');
    await expect(line(page, 'Voiture').locator('td')).toHaveText(['Voiture', '240 km × 0,26 €', '62.40 €', '—Aucun justificatif']);
    await expect(page.locator('tfoot tr')).toHaveText([/^Total déclaré\s*312\.40 €$/, /^Total remboursable\s*287\.40 €$/]);
    await expect(page.getByLabel('Dernier refus')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Télécharger en PDF' })).toHaveCount(0);
  });

  test('should show an achat given as a don, copy its label, and open its receipt', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await context.route('https://example.com/**', (route) => route.fulfill({ contentType: 'text/plain', body: 'Facture' }));
    await page.goto(note(203));

    await expect(page.getByRole('heading', { level: 1 })).toHaveText("Sac <b>30 L</b> & cordelette d'attache");
    await expect(page.locator('b')).toHaveCount(0);
    await expect(page.getByText('Achat · Escalade', { exact: true })).toBeVisible();
    await expect(summary(page)).toContainText('Don : 42.00 €');
    await expect(summary(page)).toContainText('Don au club');
    await expect(summary(page)).not.toContainText('déclarés');
    await expect(field(page, 'Date de la dépense')).toHaveText('18/01/2025');
    await expect(field(page, 'Validation du responsable')).toHaveText('Validée par Hugo BLANC le 27/01/2025');
    await expect(field(page, 'Lien de la formation')).toHaveCount(0);
    await expect(page.getByRole('columnheader', { name: 'Détail' })).toHaveCount(0);

    await summary(page).getByRole('button', { name: 'Copier le libellé comptable' }).click();
    await expect(summary(page).getByRole('status')).toHaveText('Copié');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("FAURE Camille NDF 18/01/2025 Sac <b>30 L</b> & cordelette d'attache");

    const receipt = page.waitForEvent('popup');
    await page.getByRole('link', { name: "Justificatif : Sac <b>30 L</b> & cordelette d'attache (ouvre un nouvel onglet)" }).click();
    expect((await receipt).url()).toBe('https://example.com/facture-203.pdf');
  });

  test('should say that a note sent without valideur has no responsable', async ({ page }) => {
    await page.goto(note(201));

    await expect(field(page, 'Demandeur')).toHaveText('Lucie Roux');
    await expect(status(page, 'Soumis')).toBeVisible();
    await expect(field(page, 'Validation du responsable')).toHaveText('Aucune, la commission n\'a pas de responsable.');
    await expect(actionButtons(page)).toHaveText(['Approuver', 'Rejeter']);
  });

  test('should approve a note validated by the responsable, say so, then offer to account for it', async ({ page }) => {
    await page.goto(note(202));

    await button(page, 'Approuver').click();
    await expect(dialog(page)).toContainText('Voulez-vous vraiment approuver cette note de frais ?');
    await page.locator('.swal2-confirm').click();

    await expect(confirmation(page)).toHaveText('Note approuvée. Thomas Petit a été prévenu par mail.');
    await expect(status(page, 'Approuvé')).toBeVisible();
    await expect(field(page, 'Décision')).toHaveText(new RegExp(`^Approuvée par la trésorerie le ${today.source}$`));
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/202', body: { status: 'approved' } },
    ]);
  });

  test('should turn the actions off while one is sent: a second click does not leave', async ({ page }) => {
    await page.goto(note(202));
    const patch = await holdPatch(page, '/api/expense-reports/202');

    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();
    await expect.poll(patch.isHeld).toBe(true);

    await expect(actionButtons(page)).toHaveText(['Approbation…', 'Rejeter']);
    for (const action of await actionButtons(page).all()) {
      await expect(action).toBeDisabled();
      await expect(action).toHaveAttribute('aria-busy', 'true');
    }
    await button(page, 'Approbation…').click({ force: true });
    await button(page, 'Rejeter').click({ force: true });
    await expect(dialog(page)).toBeHidden();

    patch.release();
    await expect(confirmation(page)).toHaveText('Note approuvée. Thomas Petit a été prévenu par mail.');
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
    await expect(dialog(page)).toBeHidden();
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/202', body: { status: 'approved' } },
    ]);
  });

  test('should not send twice from the page of a sortie either', async ({ page }) => {
    await page.goto('/note-de-frais/101');
    const patch = await holdPatch(page, '/api/expense-reports/1');

    await page.getByRole('button', { name: 'Approuver', exact: true }).click();
    await page.locator('.swal2-confirm').click();
    await expect.poll(patch.isHeld).toBe(true);
    await expect(dialog(page)).toBeHidden();

    await page.getByRole('button', { name: 'Approuver', exact: true }).click();
    await expect(dialog(page)).toBeHidden();

    patch.release();
    await expect(rows(page)).toContainText('Approuvé');
    // Une confirmation ouverte par le second clic attendrait encore une réponse.
    await expect(dialog(page)).toBeHidden();
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/1', body: { status: 'approved' } },
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

  test('should require a comment to reject, then show the refusal signed by the treasury', async ({ page }) => {
    await page.goto(note(203));

    await button(page, 'Rejeter').click();
    await expect(dialog(page)).toContainText('Motif du rejet');
    await page.locator('.swal2-confirm').click();
    await expect(page.locator('.swal2-validation-message')).toContainText('Vous devez entrer un commentaire');
    expect(await backendReceived(page)).toEqual([]);

    await page.locator('.swal2-textarea').fill('Merci de joindre le ticket de caisse.');
    await page.locator('.swal2-confirm').click();

    await expect(confirmation(page)).toHaveText('Note refusée. Camille Faure a été prévenu par mail.');
    await expect(status(page, 'Rejeté')).toBeVisible();
    const refusal = page.getByLabel('Dernier refus');
    await expect(refusal).toContainText(new RegExp(`^Refusée par la trésorerie le ${today.source}`));
    await expect(refusal).not.toContainText('FONTAINE');
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
    await expect(field(page, 'Décision')).toHaveText('Approuvée par la trésorerie le 13/01/2025');
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);

    await button(page, 'Comptabiliser').click();
    await expect(dialog(page)).toContainText('Voulez-vous vraiment comptabiliser cette note de frais ?');
    await page.locator('.swal2-confirm').click();

    await expect(confirmation(page)).toHaveText('Note comptabilisée. Lucie Roux a été prévenu par mail.');
    await expect(status(page, 'Comptabilisé')).toBeVisible();
    await expect(actionButtons(page)).toHaveCount(0);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/204', body: { status: 'accounted' } },
    ]);
  });

  test('should tell that the note was processed in between, and where it stands', async ({ page }) => {
    await page.goto(note(202));
    await expect(button(page, 'Approuver')).toBeVisible();
    // Décidée entre-temps, dans un autre onglet par exemple
    expect((await page.request.patch('/api/expense-reports/202', { data: { status: 'approved' } })).ok()).toBe(true);

    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText('Note déjà traitée');
    await expect(dialog(page)).toContainText(
      'Elle a été traitée entre-temps. Elle est maintenant : Approuvé. Votre action n\'a pas été enregistrée.'
    );
    await expect(page.locator('.swal2-icon-info')).toBeVisible();
    await expect(page.locator('.swal2-icon-error')).toHaveCount(0);
    await page.locator('.swal2-confirm').click();
    await expect(status(page, 'Approuvé')).toBeVisible();
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
    await expect(confirmation(page)).toHaveText('');
  });

  test('should show the rejected note with its refusal, without action', async ({ page }) => {
    await page.goto(note(205));

    await expect(status(page, 'Rejeté')).toBeVisible();
    await expect(page.getByLabel('Dernier refus')).toHaveText(/^Refusée par la trésorerie le 29\/01\/2025\s*Il manque la facture\.$/);
    await expect(actionButtons(page)).toHaveCount(0);
  });

  test('should recall the refusal of a corrected note, and name the responsable it waits for', async ({ page }) => {
    await page.goto(note(206));

    await expect(status(page, 'Soumis')).toBeVisible();
    await expect(page.getByText("En attente de Hugo Blanc (responsable d'Escalade). Vous pourrez la valider après lui.")).toBeVisible();
    await expect(page.getByLabel('Dernier refus')).toHaveCount(0);
    await expect(page.getByLabel('Refus précédent')).toHaveText(
      'Refusée par la trésorerie le 26/01, corrigée et renvoyée le 28/01 : « Il manque le ticket de caisse. »'
    );
    await expect(actionButtons(page)).toHaveCount(0);
  });

  test('should show a draft as not sent yet', async ({ page }) => {
    await page.goto(note(207));

    await expect(status(page, 'Brouillon')).toBeVisible();
    await expect(page.getByText('Pas encore envoyée par le demandeur.')).toBeVisible();
    await expect(actionButtons(page)).toHaveCount(0);
  });

  test('should send a note de sortie to the page of its sortie', async ({ page }) => {
    await page.goto(note(1));

    await expect(page).toHaveURL('/note-de-frais/101');
  });

  test('should lead back to the list from an address that is no note', async ({ page }) => {
    for (const id of ['abc', 999]) {
      await page.goto(note(id));
      await expect(page.getByText('Cette adresse ne correspond à aucune note de frais.')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Actualiser la page' })).toHaveCount(0);
    }

    await page.getByRole('link', { name: 'Retour à la liste des notes' }).click();
    await expect(page).toHaveURL('/note-de-frais');
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
