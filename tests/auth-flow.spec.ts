import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Authentication Flow', () => {
  test('complete authentication flow', async ({ page }) => {
    // Utiliser la fonction d'aide pour se connecter
    await login(page);
    
    // Vérifier que nous sommes bien sur la page des notes de frais
    await expect(page).toHaveURL(/.*\/note-de-frais/);
  });

  test('should maintain authentication after page refresh', async ({ page }) => {
    // Se connecter
    await login(page);
    
    // Rafraîchir la page
    await page.reload();
    
    // Vérifier que l'utilisateur reste sur la page des notes de frais
    await expect(page).toHaveURL(/.*\/note-de-frais/);
  });
}); 