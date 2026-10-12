// Refus de la plateforme quand une note a quitté l'étape de celui qui décide (deux onglets, deux trésoriers…).
export const DEJA_TRAITEE = 'Cette demande a déjà été traitée.';

const asText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/**
 * Raison d'un refus de l'API (4xx), à montrer telle quelle : « Cette demande a déjà été traitée. ».
 * Les messages des violations d'abord, que `detail` préfixe du nom du champ. Rien pour une erreur
 * serveur, dont le détail peut porter la trace ou la requête SQL ; la trace d'un 4xx n'est jamais lue.
 */
export function apiErrorMessage(status: number, body: unknown): string | null {
  if (status < 400 || status >= 500 || !body || typeof body !== 'object') return null;
  const error = body as Record<string, unknown>;

  const violations = Array.isArray(error.violations) ? error.violations : [];
  const messages = violations
    .map((violation) => asText((violation as Record<string, unknown> | null)?.message))
    .filter((message): message is string => message !== null);
  if (messages.length) return messages.join(' ');

  return asText(error.detail) ?? asText(error['hydra:description']) ?? asText(error.description);
}
