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
    const response = await fetch(apiUrl, {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    return response.ok;
  } catch (error) {
    console.error('Server auth check failed:', error);
    return false;
  }
}