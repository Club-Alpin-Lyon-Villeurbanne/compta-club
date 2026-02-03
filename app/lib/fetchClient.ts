/**
 * Utilitaire pour effectuer des requêtes fetch côté client
 */

/**
 * Options pour les requêtes fetch
 */
interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Effectue une requête fetch avec gestion des erreurs et redirection en cas d'authentification
 */
export async function fetchClient<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    // Construire l'URL avec les paramètres de requête
    let fullUrl = url;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      fullUrl = `${url}?${searchParams.toString()}`;
    }

    // Effectuer la requête initiale
    let response = await fetch(fullUrl, {
      ...options,
      credentials: 'include', // Inclure les cookies dans la requête
    });

    // Si le token a expiré (401), tenter un rafraîchissement puis réessayer
    if (response.status === 401) {
      // Appeler le point de terminaison de vérification/rafraîchissement
      const refreshRes = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
      });
      if (!refreshRes.ok) {
        const refreshError = await refreshRes.json().catch(() => ({}));
        throw new Error(refreshError.error || 'Non authentifié');
      }
      // Réessayer la requête initiale avec le token rafraîchi
      response = await fetch(fullUrl, {
        ...options,
        credentials: 'include',
      });
    }

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur ${response.status}`);
    }

    // Retourner les données
    return response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Effectue une requête GET
 */
export function get<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  return fetchClient<T>(url, { ...options, method: 'GET' });
}

/**
 * Effectue une requête POST
 */
export function post<T = any>(url: string, data?: any, options: FetchOptions = {}): Promise<T> {
  return fetchClient<T>(url, {
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
  return fetchClient<T>(url, {
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
  return fetchClient<T>(url, {
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
  return fetchClient<T>(url, { ...options, method: 'DELETE' });
} 