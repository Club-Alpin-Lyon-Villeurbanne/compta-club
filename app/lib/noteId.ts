// L'identifiant va dans le chemin de l'URL de l'API : rien d'autre qu'un entier positif n'y passe.
export function isNoteId(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}
