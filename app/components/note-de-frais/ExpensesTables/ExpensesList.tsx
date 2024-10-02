// ExpensesList.tsx
import React, { useState, useCallback } from "react";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { ErrorAlert } from "../../ErrorAlert";
import { ExpenseRow } from "./ExpensesRow";
import { useExpenseActions } from "@/app/lib/hooks/useExpenseAction";
import ExpenseStatus from "@/app/enums/ExpenseStatus";

interface ExpensesListProps {
    expenseReports: ExpenseReport[];
    fetchData: () => Promise<void>;
    session: any; // Replace 'any' with the actual session type
    params: { slug: string };
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ 
    expenseReports: initialExpenseReports, 
    fetchData, 
    session, 
    params 
}) => {
    const [expenseReports, setExpenseReports] = useState<ExpenseReport[]>(initialExpenseReports);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const { handleAction: originalHandleAction, error } = useExpenseActions(fetchData, session, params);

    const handleAction = useCallback(async (reportId: number, action: ExpenseStatus.APPROVED | ExpenseStatus.REJECT) => {
        try {
            await originalHandleAction(reportId, action);
            setExpenseReports(prevReports => 
                prevReports.map(report => 
                    report.id === reportId ? {...report, status: action} : report
                )
            );
        } catch (err) {
            console.error("Failed to process action:", err);
            // You might want to show an error message to the user here
        }
    }, [originalHandleAction]);

    const toggleRow = useCallback((id: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    return (
        <div className="w-full overflow-x-auto">
            {error && <ErrorAlert message={error} />}
            <table className="min-w-full bg-white shadow-md rounded-lg">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note de frais</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demandeur</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {expenseReports.map(report => (
                        <ExpenseRow
                            key={report.id}
                            report={report}
                            isExpanded={expandedRows.has(report.id)}
                            onToggle={() => toggleRow(report.id)}
                            onAction={handleAction}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExpensesList;