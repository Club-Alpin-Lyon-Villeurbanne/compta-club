import { cookies } from 'next/headers';
import { COOKIE_NAMES } from './constants';

/**
 * Vérification côté serveur : lit le cookie et envoie un HEAD à l'API externe.
 * Le rafraîchissement du jeton est fait avant, par middleware.ts : un composant serveur
 * n'a pas le droit d'écrire de cookies.
 * @returns Promise<boolean> - true si authentifié, false sinon
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
    if (!accessToken) {
      return false;
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/notes-de-frais`, {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
