import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { patch } from '../fetchClient';
import { DEJA_TRAITEE } from '../apiError';
import { noteStatusPhrase } from '@/app/utils/expenseReport';

const getSwal = () => import('sweetalert2').then(m => m.default);
type SwalModule = Awaited<ReturnType<typeof getSwal>>;

// Un refus de la plateforme (4xx) dit pourquoi : « Cette demande a déjà été traitée. », message obligatoire…
function refusalReason(error: unknown): string | null {
  const status = (error as { status?: number } | null)?.status;
  if (!(error instanceof Error) || !status || status < 400 || status >= 500 || status === 401) return null;
  return error.message || null;
}

export type ExpenseAction = 'approved' | 'rejected' | 'accounted';

interface ExpenseActionsOptions {
  // Relit la note et rend son statut (null si la lecture échoue) : avant l'envoi, pour ne pas agir sur une
  // note déjà traitée ailleurs, et après, pour ne confirmer qu'une action qui a pris effet.
  reloadStatus?: () => Promise<string | null>;
}

export function useExpenseActions(fetchData: () => Promise<unknown>, options: ExpenseActionsOptions = {}) {
  const router = useRouter();
  const busy = useRef(false);
  // L'action envoyée, de la confirmation à la relecture de la note
  const [pendingAction, setPendingAction] = useState<ExpenseAction | null>(null);

  // `shownStatus` : le statut que la page affichait au clic.
  const handleAction = async (reportId: number, action: ExpenseAction, shownStatus?: string) => {
    // Une action à la fois : un second clic pendant l'envoi ne repart pas, et ne finit pas en « déjà traitée ».
    if (busy.current) return false;
    busy.current = true;
    try {
      return await runAction(reportId, action, shownStatus);
    } finally {
      busy.current = false;
      setPendingAction(null);
    }
  };

  const alreadyProcessed = (Swal: SwalModule, action: ExpenseAction, status: string | null) => {
    Swal.fire({
      title: 'Note déjà traitée',
      text: [
        'Elle a été traitée entre-temps.',
        status ? `Elle est maintenant : ${noteStatusPhrase(status)}.` : null,
        action === 'rejected' ? 'Votre refus n\'a pas été envoyé.' : 'Votre action n\'a pas été enregistrée.',
      ].filter(Boolean).join(' '),
      icon: 'info',
    });
  };

  const runAction = async (reportId: number, action: ExpenseAction, shownStatus?: string) => {
    let Swal: SwalModule;
    try {
      Swal = await getSwal();
    } catch (error) {
      // Par exemple un onglet resté ouvert pendant un déploiement : l'ancien fichier n'existe plus.
      console.error(error);
      window.alert('Une erreur est survenue. Rechargez la page puis réessayez.');
      return false;
    }

    const { reloadStatus } = options;
    try {
      let body: { status: ExpenseAction; commentaireStatut?: string } = { status: action };

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
        body = { status: 'rejected', commentaireStatut: comment };
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

      setPendingAction(action);
      if (reloadStatus && shownStatus) {
        // Traitée ailleurs pendant la confirmation : l'API accepterait sans effet ni mail une
        // comptabilisation déjà faite, rien ne part.
        const before = await reloadStatus();
        if (before !== null && before !== shownStatus) {
          alreadyProcessed(Swal, action, before);
          return false;
        }
      }

      await patch(`/api/expense-reports/${reportId}`, body);

      if (!reloadStatus) {
        await fetchData();
        return true;
      }
      const after = await reloadStatus();
      if (after !== null && after !== action) {
        alreadyProcessed(Swal, action, after);
        return false;
      }
      return true;
    } catch (error) {
      const reason = refusalReason(error);
      // Après tout refus de l'API, la page montre la note telle qu'elle est : jamais de boutons périmés.
      const status = reason && reloadStatus ? await reloadStatus().catch(() => null) : null;
      if (reason === DEJA_TRAITEE && reloadStatus) {
        alreadyProcessed(Swal, action, status);
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