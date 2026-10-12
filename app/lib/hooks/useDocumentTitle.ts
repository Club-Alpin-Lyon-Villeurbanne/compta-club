import { useEffect } from 'react';

/** Titre de l'onglet tant que la page est affichée ; rien tant que `title` est nul. */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
