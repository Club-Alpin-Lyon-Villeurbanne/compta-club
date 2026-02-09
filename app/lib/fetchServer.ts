/**
 * Utilitaire pour effectuer des requêtes fetch côté serveur
 */

import { cookies } from 'next/headers';

/**
 * Options pour les requêtes fetch
 */
interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
  timeout?: number; // Timeout in milliseconds
}

/**
 * Effectue une requête fetch avec gestion des erreurs et des cookies
 */
export async function fetchServer<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  // Default timeout: 8 seconds
  const timeout = options.timeout ?? 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Récupérer les cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    // Construire l'URL avec les paramètres de requête
    let fullUrl = url;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      fullUrl = `${url}?${searchParams.toString()}`;
    }

    // Remove timeout from options to avoid passing it to fetch
    const { timeout: _, ...fetchOptions } = options;

    // Effectuer la requête
    const response = await fetch(fullUrl, {
      ...fetchOptions,
      headers: {
        ...options.headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur ${response.status}`);
    }

    // Retourner les données
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Le serveur met trop de temps à répondre. Veuillez réessayer.');
    }

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