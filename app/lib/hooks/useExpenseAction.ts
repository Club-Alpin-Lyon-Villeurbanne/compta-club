import { useState } from 'react';
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { axiosAuth } from '../axios';
import { ModalComment } from '@/app/components/ModalComment';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export const useExpenseActions = (fetchData: () => Promise<void>, params: { slug: string }) => {
    const [error, setError] = useState<string | null>(null);
    const MySwal = withReactContent(Swal);

    const patch = async (reportId: number, status: ExpenseStatus, comment: string = ''): Promise<boolean> => {
        try {
            const response = await axiosAuth(
                `/expense-reports/${reportId}`,
                {
                    method: "patch",
                    data: {
                        status,
                        statusComment: comment,
                    },
                }
            );
            if (response.status === 200) {
                await fetchData();
                setError(null);
                return true;
            }
            return false;
        } catch (err) {
            setError("Échec de la mise à jour du statut");
            console.error("Erreur lors de la mise à jour du statut de la note de frais:", err);
            return false;
        }
    };

    const handleAction = async (
        reportId: number,
        action: ExpenseStatus.APPROVED | ExpenseStatus.REJECTED | ExpenseStatus.ACCOUNTED
    ): Promise<boolean> => {
        try {
            if (action === ExpenseStatus.APPROVED) {
                const result = await MySwal.fire({
                    title: 'Confirmer l\'approbation',
                    text: "Voulez-vous vraiment approuver cette note de frais ?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Oui, approuver',
                    cancelButtonText: 'Annuler'
                });

                if (result.isConfirmed) {
                    return await patch(reportId, action);
                }
            } else if (action === ExpenseStatus.ACCOUNTED) {
                const result = await MySwal.fire({
                    title: 'Confirmer la comptabilisation',
                    text: "Voulez-vous vraiment marquer cette note de frais comme comptabilisée ?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Oui, comptabiliser',
                    cancelButtonText: 'Annuler'
                });

                if (result.isConfirmed) {
                    return await patch(reportId, action);
                }
            } else {
                const inputComment = await ModalComment(ExpenseStatus.REJECTED);
                if (inputComment !== null) {
                    return await patch(reportId, action, inputComment);
                }
            }
            return false;
        } catch (err) {
            setError("Échec du traitement de l'action");
            console.error("Erreur lors du traitement de l'action sur la note de frais:", err);
            return false;
        }
    };

    return { handleAction, error };
};