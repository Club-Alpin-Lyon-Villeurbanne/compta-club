import React, { useState, useCallback } from "react";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import ErrorMessage from "../../ErrorMessage";
import { ExpenseRow } from "./ExpensesRow";
import { useExpenseActions } from "@/app/lib/hooks/useExpenseAction";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { Table, TableHeader, TableRow, TableHead } from "@/components/ui/table";    

interface ExpensesListProps {
    expenseReports: ExpenseReport[];
    fetchData: () => Promise<void>;
    params: { slug: string };
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ expenseReports, fetchData, params }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const { handleAction } = useExpenseActions(fetchData);

    const toggleRow = (reportId: number) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(reportId)) {
            newExpandedRows.delete(reportId);
        } else {
            newExpandedRows.add(reportId);
        }
        setExpandedRows(newExpandedRows);
    };

    if (!expenseReports || expenseReports.length === 0) {
        return <ErrorMessage message="Aucune note de frais trouvée" variant="alert" />;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <tbody>
                    {expenseReports.map((report) => (
                        <React.Fragment key={report.id}>
                            <ExpenseRow
                                report={report}
                                isExpanded={expandedRows.has(report.id)}
                                onToggle={() => toggleRow(report.id)}
                                onAction={handleAction}
                            />
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default ExpensesList;