import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { patch } from '../fetchClient';
import { DEJA_TRAITEE } from '../apiError';

const getSwal = () => import('sweetalert2').then(m => m.default);

// Un refus de la plateforme (4xx) dit pourquoi : « Cette demande a déjà été traitée. », message obligatoire…
function refusalReason(error: unknown): string | null {
  const status = (error as { status?: number } | null)?.status;
  if (!(error instanceof Error) || !status || status < 400 || status >= 500 || status === 401) return null;
  return error.message || null;
}

export type ExpenseAction = 'approved' | 'rejected' | 'accounted';

interface ExpenseActionsOptions {
  // Après « Cette demande a déjà été traitée. » : relit la note et donne le libellé de son statut.
  onAlreadyProcessed?: () => Promise<string | null>;
}

export function useExpenseActions(fetchData: () => Promise<unknown>, options: ExpenseActionsOptions = {}) {
  const router = useRouter();
  const busy = useRef(false);
  // L'action envoyée, de la confirmation à la relecture de la note
  const [pendingAction, setPendingAction] = useState<ExpenseAction | null>(null);

  const handleAction = async (reportId: number, action: ExpenseAction) => {
    // Une action à la fois : un second clic pendant l'envoi ne repart pas, et ne finit pas en « déjà traitée ».
    if (busy.current) return false;
    busy.current = true;
    try {
      return await runAction(reportId, action);
    } finally {
      busy.current = false;
      setPendingAction(null);
    }
  };

  const runAction = async (reportId: number, action: ExpenseAction) => {
    let Swal: Awaited<ReturnType<typeof getSwal>>;
    try {
      Swal = await getSwal();
    } catch (error) {
      // Par exemple un onglet resté ouvert pendant un déploiement : l'ancien fichier n'existe plus.
      console.error(error);
      window.alert('Une erreur est survenue. Rechargez la page puis réessayez.');
      return false;
    }

    try {
      if (action === 'approved') {
        const result = await Swal.fire({
          title: 'Êtes-vous sûr ?',
          text: 'Voulez-vous vraiment approuver cette note de frais ?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Oui, approuver',
          cancelButtonText: 'Annuler',
        });

        if (!result.isConfirmed) {
          return false;
        }
      }

      if (action === 'rejected') {
        const { value: comment } = await Swal.fire({
          title: 'Motif du rejet',
          input: 'textarea',
          inputLabel: 'Commentaire',
          inputPlaceholder: 'Entrez votre commentaire...',
          showCancelButton: true,
          confirmButtonText: 'Rejeter',
          cancelButtonText: 'Annuler',
          inputValidator: (value: string) => {
            if (!value) {
              return 'Vous devez entrer un commentaire !';
            }
          },
        });

        if (!comment) {
          return false;
        }

        setPendingAction(action);
        await patch(`/api/expense-reports/${reportId}`, {
          status: 'rejected',
          commentaireStatut: comment,
        });
      }

      if (action === 'accounted') {
        const result = await Swal.fire({
          title: 'Êtes-vous sûr ?',
          text: 'Voulez-vous vraiment comptabiliser cette note de frais ?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Oui, comptabiliser',
          cancelButtonText: 'Annuler',
        });

        if (!result.isConfirmed) {
          return false;
        }
      }
      if (action !== 'rejected') {
        setPendingAction(action);
        await patch(`/api/expense-reports/${reportId}`, {
          status: action,
        });
      }

      await fetchData();
      return true;
    } catch (error) {
      const reason = refusalReason(error);
      if (reason === DEJA_TRAITEE && options.onAlreadyProcessed) {
        const statut = await options.onAlreadyProcessed().catch(() => null);
        Swal.fire({
          title: 'Note déjà traitée',
          text: [
            'Elle a été traitée entre-temps.',
            statut ? `Elle est maintenant : ${statut}.` : null,
            action === 'rejected' ? 'Votre refus n\'a pas été envoyé.' : 'Votre action n\'a pas été enregistrée.',
          ].filter(Boolean).join(' '),
          icon: 'info',
        });
        return false;
      }
      const text = 'Une erreur est survenue lors de l\'action sur la note de frais.';
      Swal.fire({
        title: 'Erreur',
        text: reason ? `${text}\n\n${reason}` : text,
        icon: 'error',
        customClass: { htmlContainer: 'whitespace-pre-line' },
      });
      return false;
    }
  };

  return {
    handleAction,
    pendingAction,
  };
}