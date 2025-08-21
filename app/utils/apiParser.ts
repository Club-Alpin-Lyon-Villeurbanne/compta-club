/**
 * Utilitaire pour parser les réponses de l'API
 */

/**
 * Parse une réponse API et extrait les données
 * Parse aussi le champ details qui est souvent une chaîne JSON
 */
export function parseApiResponse<T = any>(data: any): T[] {
  // L'API retourne directement un tableau
  if (!Array.isArray(data)) {
    return [];
  }
  
  let results = data;
  
  // Parser le champ details si c'est une chaîne JSON
  results = results.map((item: any) => {
    if (item.details && typeof item.details === 'string') {
      try {
        return {
          ...item,
          details: JSON.parse(item.details)
        };
      } catch (e) {
        console.error('Erreur lors du parsing de details:', e);
        return item;
      }
    }
    return item;
  });
  
  return results;
}

/**
 * Extrait le message d'erreur d'une réponse API
 */
export function extractApiError(errorData: any, statusCode: number): string {
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