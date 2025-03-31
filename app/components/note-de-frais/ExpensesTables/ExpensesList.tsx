// ExpensesList.tsx
import React, { useState, useCallback } from "react";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { ErrorAlert } from "../../ErrorAlert";
import { ExpenseRow } from "./ExpensesRow";
import { useExpenseActions } from "@/app/lib/hooks/useExpenseAction";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { Table, TableHeader, TableRow, TableHead } from "@/components/ui/table";    

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

    const handleAction = useCallback(async (reportId: number, action: ExpenseStatus.APPROVED | ExpenseStatus.REJECTED | ExpenseStatus.ACCOUNTED) => {
        try {
            const success = await originalHandleAction(reportId, action);
            if (success) {
                setExpenseReports(prevReports => 
                    prevReports.map((report: ExpenseReport) => 
                        report.id === reportId ? {...report, status: action} : report
                    )
                );
            }
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
        <div className="border rounded-md">
            {error && <ErrorAlert message={error} />}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-left">Note de frais</TableHead>
                        <TableHead className="text-left">Demandeur</TableHead>
                        <TableHead className="text-left">Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Type</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
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
            </Table>
        </div>
    );
};

export default ExpensesList;