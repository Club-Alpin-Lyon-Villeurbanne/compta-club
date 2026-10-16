import { useEffect } from 'react';

/** Titre de l'onglet tant que la page est affichée ; rien tant que `title` est nul. */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      // En allant vers Aide ou À propos, Next a déjà posé le titre de la page suivante : il reste.
      if (document.title === title) document.title = previous;
    };
  }, [title]);
}
