import { useRouter } from 'next/navigation';
import { patch } from '../fetchClient';

const getSwal = () => import('sweetalert2').then(m => m.default);

// Un refus de la plateforme (4xx) dit pourquoi : « Cette demande a déjà été traitée. », message obligatoire…
function refusalReason(error: unknown): string | null {
  const status = (error as { status?: number } | null)?.status;
  if (!(error instanceof Error) || !status || status < 400 || status >= 500 || status === 401) return null;
  return error.message || null;
}

export function useExpenseActions(fetchData: () => Promise<void>) {
  const router = useRouter();

  const handleAction = async (reportId: number, action: 'approved' | 'rejected' | 'accounted') => {
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
        await patch(`/api/expense-reports/${reportId}`, {
          status: action,
        });
      }

      await fetchData();
      return true;
    } catch (error) {
      const reason = refusalReason(error);
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
  };
}