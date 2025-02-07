'use client';

import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import ExpenseStatus from "@/app/enums/ExpenseStatus";

export const ModalComment = async (
    action: ExpenseStatus.REJECTED
): Promise<string | null> => {
    if (action !== ExpenseStatus.REJECTED) {
        console.error("ModalComment should only be called for REJECTED actions");
        return null;
    }

    const MySwal = withReactContent(Swal);

    const commentInput = await MySwal.fire({
        title: <i>Commentaire de rejet</i>,
        input: 'textarea',
        inputPlaceholder: 'Entrez votre commentaire ici...',
        showCancelButton: true,
        confirmButtonText: 'Suivant',
        confirmButtonColor: '#d33',
        cancelButtonText: 'Annuler',
        inputValidator: (value) => {
            if (!value) {
                return 'Le commentaire est obligatoire pour le rejet.';
            }
            return null;
        }
    });

    if (commentInput.isConfirmed && commentInput.value) {
        const result = await MySwal.fire({
            title: 'Refuser',
            text: "Voulez-vous vraiment refuser cette note de frais ?",
            showCancelButton: true,
            confirmButtonText: 'Oui, refuser',
            cancelButtonText: 'Non, annuler',
            confirmButtonColor: '#d33',
        });

        if (result.isConfirmed) {
            return commentInput.value;
        }
    }
    return null;
}

export default ModalComment;