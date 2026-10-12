export const DEFAULT_PAGE = '/note-de-frais';
export const SESSION_EXPIRED = 'expiree';

const ORIGIN = 'http://compta-club.invalid';

/**
 * Page où revenir après la connexion : une page des notes de frais seulement, sinon le lien de connexion
 * enverrait n'importe où (redirection ouverte), ou vers une route de l'API. Le navigateur retire tabulations et retours à la ligne,
 * et lit « \ » comme « / » : « /\t/site.fr » ou « /\site.fr » mèneraient à site.fr.
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return null;
  try {
    // Forme résolue : « /..//site.fr » devient « //site.fr », que certains lecteurs prendraient pour un autre site.
    const url = new URL(value, ORIGIN);
    if (url.origin !== ORIGIN || (url.pathname !== DEFAULT_PAGE && !url.pathname.startsWith(`${DEFAULT_PAGE}/`))) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

/** « /?session=expiree&retour=%2Fnote-de-frais%2Fnote%2F202 » ; la liste, page d'arrivée par défaut, n'y figure pas. */
export function loginUrl({ expired = false, returnTo = null }: { expired?: boolean; returnTo?: string | null } = {}): string {
  const params = new URLSearchParams();
  if (expired) params.set('session', SESSION_EXPIRED);
  const path = safeReturnPath(returnTo);
  if (path && path !== DEFAULT_PAGE) params.set('retour', path);
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

/** La session a expiré pendant le travail : la connexion, puis retour à la page quittée. */
export function goToLoginAfterExpiry(): void {
  window.location.assign(loginUrl({ expired: true, returnTo: window.location.pathname }));
}
