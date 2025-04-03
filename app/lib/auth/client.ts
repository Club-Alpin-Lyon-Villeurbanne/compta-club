import { COOKIE_NAMES } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchWithAutoRefresh = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  try {
    console.log('Making request to:', `${API_URL}${endpoint}`);
    
    // On récupère le token d'accès depuis les cookies
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${COOKIE_NAMES.ACCESS_TOKEN}=`));
    const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : null;
    
    if (!accessToken) {
      console.log('No access token found');
      window.location.href = '/';
      throw new Error("Non authentifié");
    }
    
    // On fait la requête avec le token dans l'en-tête
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include',
    });

    console.log('Response status:', response.status);

    // Si le token est expiré (401), on essaie de le rafraîchir
    if (response.status === 401) {
      console.log('Token expired, trying to refresh...');
      try {
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        console.log('Refresh response status:', refreshResponse.status);

        if (!refreshResponse.ok) {
          console.log('Refresh failed');
          throw new Error("Session expirée");
        }

        console.log('Refresh successful, retrying original request');
        
        // On récupère le nouveau token d'accès
        const newCookies = document.cookie.split(';');
        const newAccessTokenCookie = newCookies.find(cookie => cookie.trim().startsWith(`${COOKIE_NAMES.ACCESS_TOKEN}=`));
        const newAccessToken = newAccessTokenCookie ? newAccessTokenCookie.split('=')[1] : null;
        
        if (!newAccessToken) {
          throw new Error("Nouveau token non trouvé");
        }
        
        // On refait la requête originale avec le nouveau token
        return fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newAccessToken}`,
          },
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error during refresh:', error);
        // Si le rafraîchissement échoue, on redirige vers la page de login
        window.location.href = '/';
        throw new Error("Session expirée");
      }
    }

    return response;
  } catch (error) {
    console.error('Request error:', error);
    // En cas d'erreur réseau, on redirige vers la page de login
    window.location.href = '/';
    throw error;
  }
}; 