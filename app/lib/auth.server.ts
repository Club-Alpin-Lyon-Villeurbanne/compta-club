import { cookies } from 'next/headers';
import { COOKIE_NAMES } from './constants';

/**
 * Vérification côté serveur : lit le cookie et envoie un HEAD à l'API externe.
 * @returns Promise<boolean> - true si authentifié, false sinon
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    if (!accessToken) {
      return false;
    }
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/notes-de-frais`;
    let response = await fetch(apiUrl, {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (response.status === 401) {
      // Token expiré, tenter rafraîchissement
      const refreshToken = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value;
      if (!refreshToken) {
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
        return false;
      }
      const data = await refreshRes.json();
      const { token: newAccess, refresh_token: newRefresh } = data;
      if (!newAccess || !newRefresh) {
        return false;
      }
      // Sauvegarder les nouveaux tokens dans les cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      };
      cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, newAccess, cookieOptions);
      cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, newRefresh, cookieOptions);

      response = await fetch(apiUrl, {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${newAccess}` },
        cache: 'no-store',
      });
      return response.ok;
    }
    return response.ok;
  } catch (error) {
    return false;
  }
}