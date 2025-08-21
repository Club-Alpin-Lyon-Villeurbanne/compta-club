import { cookies } from 'next/headers';
import { COOKIE_NAMES } from './constants';

/**
 * Vérification côté serveur : lit le cookie et envoie un HEAD à l'API externe.
 * @returns Promise<boolean> - true si authentifié, false sinon
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    // Récupérer les cookies (API asynchrone)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    if (!accessToken) {
      return false;
    }
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/expense-reports`;
    // Vérifier la validité du token - Utiliser GET car HEAD retourne 500
    let response = await fetch(apiUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (response.status === 401) {
      // Token expiré, tenter rafraîchissement
      const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
      if (!refreshToken) {
        console.log('❌ Server auth check - Refresh token absent');
        return false;
      }
      // Appel à l'API externe pour rafraîchir le token
      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/token/refresh`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );
      if (!refreshRes.ok) {
        console.log('❌ Server auth check - Échec du rafraîchissement du token');
        return false;
      }
      const data = await refreshRes.json();
      const { token: newAccess, refresh_token: newRefresh } = data;
      if (!newAccess || !newRefresh) {
        console.log('❌ Server auth check - Données de rafraîchissement invalides');
        return false;
      }
      response = await fetch(apiUrl, {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${newAccess}` },
        cache: 'no-store',
      });
    }
    return response.ok;
  } catch (error) {
    console.error('Server auth check failed:', error);
    return false;
  }
}