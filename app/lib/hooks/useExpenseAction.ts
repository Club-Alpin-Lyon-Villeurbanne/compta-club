import { useRouter } from 'next/navigation';
import { patch } from '../fetchClient';
import Swal from 'sweetalert2';

export function useExpenseActions(fetchData: () => Promise<void>) {
  const router = useRouter();

  const handleAction = async (reportId: number, action: 'approved' | 'rejected' | 'accounted') => {
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
          statusComment: comment,
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

      await patch(`/api/expense-reports/${reportId}`, {
        status: action,
      });

      await fetchData();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'action sur la note de frais:', error);
      Swal.fire({
        title: 'Erreur',
        text: 'Une erreur est survenue lors de l\'action sur la note de frais.',
        icon: 'error',
      });
      return false;
    }
  };

  return {
    handleAction,
  };
}