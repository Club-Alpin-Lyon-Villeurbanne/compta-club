/**
 * Vérification côté client : appelle l'API interne `/api/auth/check`.
 * @returns Promise<boolean> - true si authentifié, false sinon
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/check', { credentials: 'include' });
    return response.ok;
  } catch {
    return false;
  }
}