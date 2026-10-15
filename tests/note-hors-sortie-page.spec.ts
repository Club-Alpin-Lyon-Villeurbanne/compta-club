import { Page, Route } from '@playwright/test';
import { test, expect, backendReceived, changeNoteInBackend, downloadedPdf, login, rows } from './test-utils';
import { textAfter } from './pdf-text';

// Notes des données de test : 201 achat soumis sans responsable, 202 formation validée par le
// responsable (avec une ligne de voiture), 203 achat validé par le responsable, en don, 204 formation
// approuvée, 205 achat refusé par la trésorerie, 206 achat refusé, corrigé et renvoyé, de nouveau chez
// le responsable, 207 brouillon.
const note = (id: number | string) => `/note-de-frais/note/${id}`;

const dialog = (page: Page) => page.locator('.swal2-popup');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const actionButtons = (page: Page) =>
  page.getByRole('button', { name: /^(Approuver|Refuser|Comptabiliser|Approbation…|Refus…|Comptabilisation…)$/ });
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
    await expect(page.locator('main')).toHaveCount(1);
    // On est toujours dans « Notes de frais »
    await expect(page.getByRole('link', { name: 'Notes de frais', exact: true })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('link', { name: 'Retour à la liste' }).click();
    await expect(page).toHaveURL('/note-de-frais');
    await expect(rows(page).first()).toBeVisible();
  });

  test('should leave the title of the tab to the page opened from the menu', async ({ page }) => {
    await page.goto(note(202));
    await expect(page).toHaveTitle('Note 202 : Formation initiateur escalade · Compta Club');

    await page.getByRole('navigation').getByRole('link', { name: 'Aide', exact: true }).click();

    await expect(page).toHaveURL('/aide');
    await expect(page).toHaveTitle('Aide · Compta Club');
  });

  test('should show a formation, with its car line', async ({ page }) => {
    await page.goto(note(202));

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Formation initiateur escalade');
    await expect(page.getByText('Formation · Escalade · Thomas Petit', { exact: true })).toBeVisible();
    await expect(status(page, 'Validée par le responsable')).toBeVisible();

    await expect(summary(page)).toContainText('À rembourser : 287.40 €');
    await expect(summary(page)).toContainText('312.40 € déclarés, dont 25.00 € au-delà des plafonds du club');
    await expect(summary(page)).toContainText('PETIT Thomas NDF 25/01/2025 Formation initiateur escalade');
    await expect(summary(page).getByRole('button', { name: /^(Approuver|Refuser)$/ })).toHaveText(['Approuver', 'Refuser']);

    await expect(field(page, 'Date de la formation')).toHaveText('25/01/2025');
    await expect(field(page, 'Mot du demandeur')).toHaveText('Stage validé par la commission en décembre.');
    await expect(field(page, 'Validation du responsable')).toHaveText('Validée par Hugo BLANC le 27/01/2025');
    for (const label of ['Type', 'Commission', 'Demandeur', 'Objet']) await expect(field(page, label)).toHaveCount(0);

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
    await expect(page.getByText('Achat · Escalade · Camille Faure', { exact: true })).toBeVisible();
    await expect(summary(page)).toContainText('Don : 42.00 €');
    await expect(page.locator('tfoot tr')).toHaveText([/^Total\s*42\.00 €$/]);
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

  test('should say that a note sent without valideur goes straight to the treasury', async ({ page }) => {
    await page.goto(note(201));

    await expect(page.getByText('Achat · Randonnée · Lucie Roux', { exact: true })).toBeVisible();
    await expect(status(page, 'Soumise')).toBeVisible();
    await expect(field(page, 'Validation du responsable')).toHaveText('Aucune : la note va directement à la trésorerie.');
    await expect(actionButtons(page)).toHaveText(['Approuver', 'Refuser']);
  });

  test('should approve a note validated by the responsable, say so, then offer to account for it', async ({ page }) => {
    await page.goto(note(202));

    await button(page, 'Approuver').click();
    await expect(dialog(page).locator('.swal2-title')).toHaveText('Approuver la note de Thomas Petit ?');
    await expect(dialog(page).locator('.swal2-html-container')).toHaveText('À rembourser : 287.40 €. Thomas Petit recevra un mail.');
    await expect(dialog(page).locator('.swal2-confirm')).toHaveText('Approuver');
    await page.locator('.swal2-confirm').click();

    await expect(confirmation(page)).toHaveText('Note approuvée. Un mail a été envoyé à Thomas Petit.');
    // Le bouton cliqué a disparu : le focus est sur la confirmation, pas retombé en haut de la page
    await expect(confirmation(page).locator('p')).toBeFocused();
    await expect(status(page, 'Approuvée')).toBeVisible();
    await expect(field(page, 'Décision')).toHaveText(new RegExp(`^Approuvée par la trésorerie le ${today.source}$`));
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/202', body: { status: 'approved', version: 1 } },
    ]);
  });

  test('should turn the actions off while one is sent: a second click does not leave', async ({ page }) => {
    await page.goto(note(202));
    const patch = await holdPatch(page, '/api/expense-reports/202');

    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();
    await expect.poll(patch.isHeld).toBe(true);

    await expect(actionButtons(page)).toHaveText(['Approbation…', 'Refuser']);
    for (const action of await actionButtons(page).all()) {
      await expect(action).toBeDisabled();
      await expect(action).toHaveAttribute('aria-busy', 'true');
    }
    await button(page, 'Approbation…').click({ force: true });
    await button(page, 'Refuser').click({ force: true });
    await expect(dialog(page)).toBeHidden();

    patch.release();
    await expect(confirmation(page)).toHaveText('Note approuvée. Un mail a été envoyé à Thomas Petit.');
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
    await expect(dialog(page)).toBeHidden();
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/202', body: { status: 'approved', version: 1 } },
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
    await expect(rows(page)).toContainText('Approuvée');
    // Une confirmation ouverte par le second clic attendrait encore une réponse.
    await expect(dialog(page)).toBeHidden();
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/1', body: { status: 'approved' } },
    ]);
  });

  test('should not tell that a responsable will read the refusal of a note that went straight to the treasury', async ({ page }) => {
    await page.goto(note(201));

    await button(page, 'Refuser').click();

    await expect(dialog(page)).toContainText('Message au demandeur, envoyé par mail');
    await expect(dialog(page)).not.toContainText('Le responsable de la commission');
  });

  test('should approve a note that had no responsable to validate it', async ({ page }) => {
    await page.goto(note(201));

    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();

    await expect(status(page, 'Approuvée')).toBeVisible();
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/201', body: { status: 'approved', version: 1 } },
    ]);
  });

  test('should require a message to refuse, then show the refusal signed by the treasury', async ({ page }) => {
    await page.goto(note(203));

    await button(page, 'Refuser').click();
    await expect(dialog(page).locator('.swal2-title')).toHaveText('Refuser la note');
    const message = page.getByRole('textbox', { name: 'Message au demandeur, envoyé par mail' });
    await expect(message).toHaveAttribute('placeholder', 'Ce qu\'il doit corriger ou ajouter…');
    // Validée par le responsable, la note lui reviendra
    await expect(dialog(page)).toHaveAccessibleDescription('Le responsable de la commission le verra aussi quand la note lui reviendra.');
    await expect(dialog(page).locator('.swal2-confirm')).toHaveText('Refuser');
    await message.fill('   ');
    await page.locator('.swal2-confirm').click();
    await expect(page.locator('.swal2-validation-message')).toHaveText('Écrivez le message au demandeur.');
    expect(await backendReceived(page)).toEqual([]);

    await page.locator('.swal2-textarea').fill('Merci de joindre le ticket de caisse.');
    await page.locator('.swal2-confirm').click();

    await expect(confirmation(page)).toHaveText('Note refusée. Un mail a été envoyé à Camille Faure.');
    await expect(status(page, 'Refusée')).toBeVisible();
    const refusal = page.getByLabel('Dernier refus');
    await expect(refusal).toContainText(new RegExp(`^Refusée par la trésorerie le ${today.source}`));
    await expect(refusal).not.toContainText('FONTAINE');
    await expect(refusal).toContainText('Merci de joindre le ticket de caisse.');
    await expect(actionButtons(page)).toHaveCount(0);
    expect(await backendReceived(page)).toEqual([
      {
        method: 'PATCH',
        path: '/notes-de-frais/203',
        body: { status: 'rejected', commentaireStatut: 'Merci de joindre le ticket de caisse.', version: 1 },
      },
    ]);
  });

  test('should account for an approved note', async ({ page }) => {
    await page.goto(note(204));
    await expect(field(page, 'Décision')).toHaveText('Approuvée par la trésorerie le 13/01/2025');
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);

    await button(page, 'Comptabiliser').click();
    await expect(dialog(page).locator('.swal2-title')).toHaveText('Comptabiliser la note de Lucie Roux ?');
    await expect(dialog(page).locator('.swal2-html-container')).toHaveText('À rembourser : 120.00 €. Elle sera close : plus aucune action possible.');
    await page.locator('.swal2-confirm').click();

    await expect(confirmation(page)).toHaveText('Note comptabilisée. Un mail a été envoyé à Lucie Roux.');
    await expect(status(page, 'Comptabilisée')).toBeVisible();
    await expect(actionButtons(page)).toHaveCount(0);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/204', body: { status: 'accounted', version: 1 } },
    ]);
  });

  // Décidée entre-temps, dans un autre onglet par exemple : la requête de test ne passe pas par la page.
  const decideElsewhere = async (page: Page, id: number, status: string, commentaireStatut?: string) =>
    expect((await page.request.patch(`/api/expense-reports/${id}`, { data: { status, commentaireStatut } })).ok()).toBe(true);

  test('should send nothing on a note processed elsewhere, and tell where it stands', async ({ page }) => {
    await page.goto(note(202));
    await expect(button(page, 'Approuver')).toBeVisible();
    await decideElsewhere(page, 202, 'approved');

    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText('Note déjà traitée');
    await expect(dialog(page)).toContainText(
      'Elle a été traitée entre-temps. Elle est maintenant : approuvée. Votre action n\'a pas été enregistrée.'
    );
    await expect(page.locator('.swal2-icon-info')).toBeVisible();
    await expect(page.locator('.swal2-icon-error')).toHaveCount(0);
    await page.locator('.swal2-confirm').click();
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(status(page, 'Approuvée')).toBeVisible();
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
    await expect(confirmation(page)).toHaveText('');
    // Seule la décision de l'autre onglet est arrivée
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/202', body: { status: 'approved' } },
    ]);
  });

  // La relecture d'avant l'envoi ne voit rien : la note a repris le statut affiché. La version, elle, a changé.
  test('should not approve a note refused, corrected and sent again since it was shown', async ({ page }) => {
    await page.goto(note(201));
    await expect(summary(page)).toContainText('À rembourser : 55.00 €');
    await decideElsewhere(page, 201, 'rejected', 'Il manque la facture.');
    await changeNoteInBackend(page, 201, {
      status: 'submitted',
      lignesAffichees: [{ id: 'ligne-201', nature: null, libelle: 'Cordelettes pour la SAE', detail: null, montant: 480 }],
      totalDeclare: 480,
      totalRemboursable: 480,
    });

    await button(page, 'Approuver').click();
    await expect(dialog(page).locator('.swal2-html-container')).toHaveText('À rembourser : 55.00 €. Lucie Roux recevra un mail.');
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText('Cette note a été modifiée dans un autre onglet ou sur un autre appareil.');
    await expect(page.locator('.swal2-icon-error')).toBeVisible();
    await page.locator('.swal2-confirm').click();
    await expect(confirmation(page)).toHaveText('');
    await expect(status(page, 'Soumise')).toBeVisible();
    await expect(summary(page)).toContainText('À rembourser : 480.00 €');

    // Relue, la note se décide sur ce qu'elle est devenue
    await button(page, 'Approuver').click();
    await expect(dialog(page).locator('.swal2-html-container')).toHaveText('À rembourser : 480.00 €. Lucie Roux recevra un mail.');
    await page.locator('.swal2-confirm').click();
    await expect(confirmation(page)).toHaveText('Note approuvée. Un mail a été envoyé à Lucie Roux.');
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/201', body: { status: 'rejected', commentaireStatut: 'Il manque la facture.' } },
      { method: 'PATCH', path: '/notes-de-frais/201', body: { status: 'approved', version: 1 } },
      { method: 'PATCH', path: '/notes-de-frais/201', body: { status: 'approved', version: 3 } },
    ]);
  });

  test('should not confirm an accounting already done elsewhere', async ({ page }) => {
    await page.goto(note(204));
    await expect(button(page, 'Comptabiliser')).toBeVisible();
    await decideElsewhere(page, 204, 'accounted');

    await button(page, 'Comptabiliser').click();
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText(
      'Elle a été traitée entre-temps. Elle est maintenant : comptabilisée. Votre action n\'a pas été enregistrée.'
    );
    await page.locator('.swal2-confirm').click();
    await expect(confirmation(page)).toHaveText('');
    await expect(status(page, 'Comptabilisée')).toBeVisible();
    expect(await backendReceived(page)).toHaveLength(1);
  });

  test('should not confirm an action the platform accepted without effect', async ({ page }) => {
    await page.goto(note(204));
    // L'API répond 200 à une comptabilisation sans effet ; la note relue est toujours approuvée.
    await page.route('**/api/expense-reports/204', (route) =>
      route.request().method() === 'PATCH' ? route.fulfill({ status: 200, json: {} }) : route.continue()
    );

    await button(page, 'Comptabiliser').click();
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText(
      'Elle a été traitée entre-temps. Elle est maintenant : approuvée. Votre action n\'a pas été enregistrée.'
    );
    await page.locator('.swal2-confirm').click();
    await expect(confirmation(page)).toHaveText('');
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
  });

  test('should keep the note on screen when it cannot be read again after an action', async ({ page }) => {
    await page.goto(note(204));
    await expect(button(page, 'Comptabiliser')).toBeVisible();
    // La lecture d'avant l'envoi passe, celle d'après échoue.
    let reads = 0;
    await page.route('**/api/expense-reports/note/204', (route) =>
      ++reads > 1 ? route.fulfill({ status: 503, json: { error: 'Service indisponible' } }) : route.continue()
    );

    await button(page, 'Comptabiliser').click();
    await page.locator('.swal2-confirm').click();

    await expect(confirmation(page)).toContainText('Note comptabilisée. Un mail a été envoyé à Lucie Roux.');
    await expect(confirmation(page)).toContainText('La note n\'a pas pu être relue : elle peut avoir changé depuis. Rechargez la page pour la voir à jour.');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Recyclage initiateur randonnée');
    await expect(page.getByText('Oups ! Une erreur est survenue')).toHaveCount(0);
    // Le statut affiché est peut-être périmé : plus de bouton d'action
    await expect(actionButtons(page)).toHaveCount(0);
    expect(await backendReceived(page)).toEqual([
      { method: 'PATCH', path: '/notes-de-frais/204', body: { status: 'accounted', version: 1 } },
    ]);
  });

  test('should tell that a refusal was not sent when the note was decided during the sending', async ({ page }) => {
    await page.goto(note(202));
    const sending = await holdPatch(page, '/api/expense-reports/202');

    await button(page, 'Refuser').click();
    await page.locator('.swal2-textarea').fill('Il manque le programme du stage.');
    await page.locator('.swal2-confirm').click();
    await expect.poll(sending.isHeld).toBe(true);
    await decideElsewhere(page, 202, 'approved');
    sending.release();

    await expect(dialog(page)).toContainText(
      'Elle a été traitée entre-temps. Elle est maintenant : approuvée. Votre refus n\'a pas été envoyé.'
    );
    await expect(page.locator('.swal2-icon-info')).toBeVisible();
    await page.locator('.swal2-confirm').click();
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
  });

  test('should read the note again after any other refusal of the platform', async ({ page }) => {
    await page.goto(note(202));
    await page.route('**/api/expense-reports/202', async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue();
      await decideElsewhere(page, 202, 'approved');
      await route.fulfill({ status: 403, json: { error: 'Accès refusé.' } });
    });

    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();

    await expect(dialog(page)).toContainText('Accès refusé.');
    await expect(page.locator('.swal2-icon-error')).toBeVisible();
    await page.locator('.swal2-confirm').click();
    // Relue : plus de boutons périmés
    await expect(status(page, 'Approuvée')).toBeVisible();
    await expect(actionButtons(page)).toHaveText(['Comptabiliser']);
  });

  test('should show the rejected note with its refusal, without action', async ({ page }) => {
    await page.goto(note(205));

    await expect(status(page, 'Refusée')).toBeVisible();
    await expect(page.getByLabel('Dernier refus')).toHaveText(/^Refusée par la trésorerie le 29\/01\/2025\s*Il manque la facture\.$/);
    await expect(actionButtons(page)).toHaveCount(0);
  });

  test('should recall the refusal of a corrected note, and name the responsable it waits for', async ({ page }) => {
    await page.goto(note(206));

    await expect(status(page, 'Soumise')).toBeVisible();
    await expect(page.getByText("En attente de Hugo Blanc (responsable d'Escalade). Vous pourrez l'approuver après lui.")).toBeVisible();
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
    // Ni don ni remboursement choisi
    await expect(summary(page)).toContainText('Montant : 60.00 €');
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

test.describe('PDF of a note hors sortie', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { notesHorsSortie: true });
  });

  const approve = async (page: Page) => {
    await button(page, 'Approuver').click();
    await page.locator('.swal2-confirm').click();
    await expect(confirmation(page)).toContainText('Note approuvée.');
  };

  const downloadFromSummary = async (page: Page) => {
    const download = page.waitForEvent('download');
    await summary(page).getByRole('button', { name: 'Télécharger en PDF' }).click();
    return downloadedPdf(await download);
  };

  test('should download the PDF of a formation once approved, with its car line', async ({ page }) => {
    await page.goto(note(202));
    await expect(summary(page).getByRole('button', { name: 'Télécharger en PDF' })).toHaveCount(0);
    await approve(page);

    const pdf = await downloadFromSummary(page);

    expect(pdf.fileName).toBe('note-de-frais-formation-202-PETIT.pdf');
    expect(pdf.raw.startsWith('%PDF')).toBe(true);
    expect(pdf.texts.slice(2, 6)).toEqual(['STATUT : APPROUVÉE', 'Note n° 202', 'À rembourser : 287.40 €', '312.40 € déclarés, dont 25.00 € au-delà des plafonds du club']);
    expect(textAfter(pdf.texts, 'Demandeur')).toBe('Thomas Petit');
    expect(textAfter(pdf.texts, 'Type')).toBe('Formation');
    expect(textAfter(pdf.texts, 'Commission')).toBe('Escalade');
    expect(textAfter(pdf.texts, 'Objet')).toBe('Formation initiateur escalade');
    expect(textAfter(pdf.texts, 'Date de la formation')).toBe('25/01/2025');
    expect(textAfter(pdf.texts, 'Voiture')).toBe('240 km × 0,26\u00a0€');
    expect(textAfter(pdf.texts, 'Total déclaré')).toBe('312.40 €');
    expect(textAfter(pdf.texts, 'Total remboursable')).toBe('287.40 €');
    expect(textAfter(pdf.texts, 'Validation du responsable')).toBe('Validée par Hugo BLANC le 27/01/2025');
    expect(textAfter(pdf.texts, 'Décision')).toMatch(new RegExp(`^Approuvée par la trésorerie le ${today.source}$`));
    expect(textAfter(pdf.texts, 'Libellé comptable')).toBe('PETIT Thomas NDF 25/01/2025 Formation initiateur escalade');
  });

  test('should download the PDF of an achat given as a don, its text as typed', async ({ page }) => {
    await page.goto(note(203));
    await approve(page);

    const pdf = await downloadFromSummary(page);

    expect(pdf.fileName).toBe('note-de-frais-achat-203-FAURE.pdf');
    expect(textAfter(pdf.texts, 'Type')).toBe('Achat');
    expect(textAfter(pdf.texts, 'Objet')).toBe("Sac <b>30 L</b> & cordelette d'attache");
    expect(textAfter(pdf.texts, 'Date de la dépense')).toBe('18/01/2025');
    expect(pdf.texts.slice(3, 5)).toEqual(['Note n° 203', 'Don : 42.00 €']);
  });

  test('should ring the buttons of the summary in blue under the keyboard', async ({ page }) => {
    await page.goto(note(204));
    await summary(page).getByRole('button', { name: 'Copier le libellé comptable' }).focus();

    for (const name of ['Comptabiliser', 'Télécharger en PDF']) {
      await page.keyboard.press('Tab');
      await expect(summary(page).getByRole('button', { name })).toBeFocused();
      // Anneau blue-600 (ring-2), décalé de 2 px
      expect(await page.evaluate(() => getComputedStyle(document.activeElement!).boxShadow)).toContain('rgb(37, 99, 235)');
    }
  });

  test('should download the PDF of an accounted achat, its only action', async ({ page }) => {
    await page.goto(note(208));
    await expect(summary(page)).toContainText('Remboursement : 32.50 €');
    await expect(actionButtons(page)).toHaveCount(0);
    await expect(summary(page).getByRole('button', { name: 'Télécharger en PDF' })).toBeVisible();

    const pdf = await downloadFromSummary(page);

    expect(pdf.fileName).toBe('note-de-frais-achat-208-FAURE.pdf');
    expect(pdf.texts).toContain('STATUT : COMPTABILISÉE');
    expect(pdf.texts).toContain('Remboursement : 32.50 €');
    expect(pdf.texts.join('\n')).not.toContain('À rembourser');
    expect(textAfter(pdf.texts, 'Validation du responsable')).toBe('Aucune : la note est allée directement à la trésorerie.');
    expect(textAfter(pdf.texts, 'Total')).toBe('32.50 €');
    expect(pdf.texts).not.toContain('Total remboursable');
  });
});
