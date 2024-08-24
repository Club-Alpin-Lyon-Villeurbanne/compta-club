'use client';

import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import ExpenseStatus from "@/app/enums/ExpenseStatus";

export const sweetModalComment = async (
    comment: string,
    setComment: (comment: string) => void,
    action: ExpenseStatus.VALIDATE | ExpenseStatus.REJECT
): Promise<string | null> => {
    const commentInput = await withReactContent(Swal).fire({
        title: <i>Commentaire</i>,
        input: 'textarea',
        inputValue: comment,
        showCancelButton: true,
        confirmButtonText: 'Suivant',
        confirmButtonColor: '#2563eb',
        cancelButtonText: 'Annuler',
        inputValidator: (value) => {
            if (action === ExpenseStatus.REJECT && !value) {
                return 'Le commentaire est obligatoire pour le rejet.';
            }
            return null;
        }
    });

    if (commentInput.value !== undefined) {
        setComment(commentInput.value);
        const result = await withReactContent(Swal).fire({
            title: action === ExpenseStatus.VALIDATE ? 'Valider' : 'Refuser',
            text: "Voulez-vous vraiment continuer ?",
            showCancelButton: true,
            confirmButtonText: 'Oui',
            cancelButtonText: 'Non',
            confirmButtonColor: action === ExpenseStatus.VALIDATE ? '#2563eb' : '#d33',
        });

        if (result.isConfirmed) {
            return commentInput.value;
        }
    }
    return null;
}