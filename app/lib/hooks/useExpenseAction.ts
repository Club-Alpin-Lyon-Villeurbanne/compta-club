import { useState } from 'react';
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { axiosAuth } from '../axios';
import { ModalComment } from '@/app/components/ModalComment';

export const useExpenseActions = (fetchData: () => Promise<void>, session: any, params: { slug: string }) => {
    const [error, setError] = useState<string | null>(null);

    const patch = async (reportId: number, status: ExpenseStatus, comment: string) => {
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
            if (response.status === 200 && session) {
                await fetchData();
                setError(null);
            }
        } catch (err) {
            setError("Failed to update status");
            console.error("Error updating expense report status:", err);
        }
    };

    const handleAction = async (
        reportId: number,
        action: ExpenseStatus.APPROVED | ExpenseStatus.REJECT
    ) => {
        try {
            const inputComment = await ModalComment("", (comment: string) => {}, action);
            if (inputComment !== null) {
                await patch(reportId, action, inputComment);
            }
        } catch (err) {
            setError("Failed to process action");
            console.error("Error handling expense report action:", err);
        }
    };

    return { handleAction, error };
};