import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Expense Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter avant chaque test en utilisant la fonction utilitaire
    await login(page);
    
    // Vérifier que la connexion a réussi
    await expect(page.locator('button:has-text("Déconnexion")')).toBeVisible({ timeout: 10000 });
  });

  test('should display expense reports', async ({ page }) => {
    // Vérifier que les notes de frais sont affichées
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    // Vérifier qu'il y a au moins 2 lignes (en-tête et données)
    const rowCount = await page.locator('tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Simuler une erreur API en utilisant un filtre invalide
    await page.selectOption('select[name="status"]', 'INVALID_STATUS');
    
    // Vérifier que le message d'erreur s'affiche
    await expect(page.locator('.text-red-500')).toBeVisible({ timeout: 10000 });
  });
}); 