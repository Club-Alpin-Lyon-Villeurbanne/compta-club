'use client';

import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import SendingChoice from "@/app/enums/sendingChoice";

export const swalComment = async (comment: string, setComment: (comment: string) => void, action: SendingChoice.VALIDATE | SendingChoice.REJECT) => {
    const commentInput = await withReactContent(Swal).fire({
        title: <i>Commentaire</i>,
        input: 'textarea',
        inputValue: comment,
        showCancelButton: true,
        confirmButtonText: 'Suivant',
        confirmButtonColor: '#2563eb',
        cancelButtonText: 'Annuler',
    });

    if (commentInput.value) {
        setComment(commentInput.value);
        const result = await withReactContent(Swal).fire({
            title: action === SendingChoice.VALIDATE ? 'Valider' : 'Refuser',
            text: "Voulez-vous vraiment continuer ?",
            showCancelButton: true,
            confirmButtonText: 'Oui',
            cancelButtonText: 'Non',
            confirmButtonColor: action === SendingChoice.VALIDATE ? '#2563eb' : '#d33',
        });

        if (result.isConfirmed) {
            return commentInput.value;
        }
    }
    return null;
}
