/**
 * Utilitaire pour effectuer des requêtes fetch côté serveur
 */

import { cookies } from 'next/headers';

/**
 * Extrait le message d'erreur d'une réponse API
 */
function extractApiError(errorData: any, statusCode: number): string {
  // Erreurs serveur (500+)
  if (statusCode >= 500) {
    if (typeof errorData === 'string') {
      return errorData 
        ? `Erreur serveur (${statusCode}): ${errorData}`
        : `Erreur serveur (${statusCode}): Le serveur a rencontré une erreur interne`;
    }
    
    if (typeof errorData === 'object' && errorData !== null) {
      return errorData.error || 
             errorData.message || 
             `Erreur serveur (${statusCode}): Une erreur interne s'est produite`;
    }
    
    return `Erreur serveur (${statusCode}): Le serveur a rencontré une erreur interne`;
  }
  
  // Autres erreurs (400, 401, 403, 404, etc.)
  if (typeof errorData === 'string' && errorData) {
    return errorData;
  }
  
  if (typeof errorData === 'object' && errorData !== null) {
    return errorData.error || errorData.message || `Erreur ${statusCode}`;
  }
  
  return `Erreur ${statusCode}`;
}

/**
 * Options pour les requêtes fetch
 */
interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
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

    // Construire l'URL avec les paramètres de requête
    let fullUrl = url;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, value);
      });
      fullUrl = `${url}?${searchParams.toString()}`;
    }

    // Effectuer la requête
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      cache: 'no-store',
    });

    // Vérifier si la réponse est OK
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      
      const errorMessage = extractApiError(errorData, response.status);
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
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