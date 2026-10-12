import { Page } from '@playwright/test';
import { test, expect, login, rows } from './test-utils';

// Le Chromium de test cache ses barres de défilement : on lui rend la barre classique de Windows, qui prend
// 15 px à la page. Sans elle, la table pourrait déborder de sa carte sous Windows et passer ici.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

const statusSelect = (page: Page) => page.getByRole('combobox', { name: 'Statut' });
// 40 caractères : un nom composé comme il y en a.
const LONG_REQUESTER = { id: 8, prenom: 'Marie-Christine', nom: 'DUPONT-MONTGOLFIER-LAFON' };

for (const width of [1280, 1440]) {
  test(`should fit the table in its card at ${width} px, PDF buttons included, whatever the requester`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route((url) => url.pathname === '/api/expense-reports', async (route) => {
      const response = await route.fetch();
      const list = await response.json();
      list.data = list.data.map((report: object) => ({ ...report, utilisateur: LONG_REQUESTER }));
      await route.fulfill({ response, json: list });
    });
    await login(page, { notesHorsSortie: true });
    await page.addStyleTag({ content: 'html { overflow-y: scroll }' });
    expect(await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)).toBeGreaterThan(0);

    for (const status of ['approved', 'accounted', 'Toutes']) {
      await statusSelect(page).selectOption(status);
      await expect(rows(page).getByRole('button', { name: 'Télécharger en PDF' }).first()).toBeVisible();

      const card = page.locator('table').locator('..');
      const { clientWidth, scrollWidth } = await card.evaluate((el) => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth }));
      expect(scrollWidth, status).toBeLessThanOrEqual(clientWidth);
      const cardBox = (await card.boundingBox())!;
      for (const button of await rows(page).locator('td:last-child button').all()) {
        const box = (await button.boundingBox())!;
        expect(box.x + box.width, status).toBeLessThanOrEqual(cardBox.x + cardBox.width);
      }
    }
    await expect(rows(page).first().getByTitle('Marie-Christine DUPONT-MONTGOLFIER-LAFON')).toBeVisible();
  });
}
