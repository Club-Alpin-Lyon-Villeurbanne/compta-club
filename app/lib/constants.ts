/**
 * Constantes pour les noms des cookies
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Chemin de la page demandée, posé par middleware.ts : le layout privé y renvoie après la connexion.
export const PATH_HEADER = 'x-compta-club-path';
