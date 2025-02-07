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
    const [expandedRows, setExpandedRows] = useState(new Set<number>());
    const { handleAction: originalHandleAction, error } = useExpenseActions(fetchData, session, params);

    const handleAction = useCallback(async (reportId: number, action: ExpenseStatus.APPROVED | ExpenseStatus.REJECTED) => {
        try {
            await originalHandleAction(reportId, action);
            setExpenseReports(prevReports => 
                prevReports.map((report: ExpenseReport) => 
                    report.id === reportId ? {...report, status: action} : report
                )
            );
        } catch (err) {
            console.error("Failed to process action:", err);
        }
    }, [originalHandleAction]);

    const toggleRow = useCallback((id: number) => {
        setExpandedRows(prevSet => {
            const newSet = new Set(prevSet);
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
            <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Note de frais</th>
                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Demandeur</th>
                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {expenseReports.map((report: ExpenseReport) => (
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