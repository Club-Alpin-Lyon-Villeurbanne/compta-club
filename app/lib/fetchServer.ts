/**
 * Utilitaire pour effectuer des requêtes fetch côté serveur
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Options pour les requêtes fetch
 */
interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Vérifie si l'utilisateur est authentifié et redirige vers la page de connexion si nécessaire
 * Cette fonction est destinée à être utilisée dans les server components
 */
export async function checkAuthOrRedirect(): Promise<boolean> {
  try {
    // Récupérer les cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    // Si aucun token n'est présent, rediriger vers la page de connexion
    if (!accessToken && !refreshToken) {
      redirect('/');
    }

    // Effectuer une requête HEAD vers un endpoint protégé
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports`, {
      method: 'HEAD',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Si la requête réussit, l'utilisateur est authentifié
    if (response.ok) {
      return true;
    }

    // Si le token est expiré (401) et qu'un refresh token est disponible
    if (response.status === 401 && refreshToken) {
      // Essayer de rafraîchir le token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (refreshResponse.ok) {
        // Récupérer le nouveau token
        const newCookieStore = await cookies();
        const newAccessToken = newCookieStore.get('access_token')?.value;

        if (newAccessToken) {
          // Réessayer la requête avec le nouveau token
          const newResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expense-reports`, {
            method: 'HEAD',
            headers: {
              Authorization: `Bearer ${newAccessToken}`,
            },
          });

          // Si la requête réussit, l'utilisateur est authentifié
          if (newResponse.ok) {
            return true;
          }
        }
      }
    }

    // Si on arrive ici, l'authentification a échoué, rediriger vers la page de connexion
    redirect('/');
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    redirect('/');
  }
}

/**
 * Effectue une requête fetch avec gestion des erreurs et des cookies
 */
export async function fetchServer<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    // Récupérer les cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    // Construire l'URL avec les paramètres de requête
    let fullUrl = url;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      fullUrl = `${url}?${searchParams.toString()}`;
    }
    console.log('fullUrl', fullUrl);

    // Effectuer la requête
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    // Gérer les erreurs d'authentification
    if (response.status === 401 && refreshToken) {
      // Essayer de rafraîchir le token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (refreshResponse.ok) {
        // Réessayer la requête avec le nouveau token
        const newCookieStore = await cookies();
        const newAccessToken = newCookieStore.get('access_token')?.value;
        return fetchServer<T>(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });
      }
    }

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur ${response.status}`);
    }

    // Retourner les données
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la requête fetch:', error);
    throw error;
  }
}

/**
 * Effectue une requête GET
 */
export function get<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  return fetchServer<T>(url, { ...options, method: 'GET' });
}

/**
 * Effectue une requête POST
 */
export function post<T = any>(url: string, data?: any, options: FetchOptions = {}): Promise<T> {
  return fetchServer<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Effectue une requête PUT
 */
export function put<T = any>(url: string, data?: any, options: FetchOptions = {}): Promise<T> {
  return fetchServer<T>(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Effectue une requête PATCH
 */
export function patch<T = any>(url: string, data?: any, options: FetchOptions = {}): Promise<T> {
  return fetchServer<T>(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Effectue une requête DELETE
 */
export function del<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  return fetchServer<T>(url, { ...options, method: 'DELETE' });
} 