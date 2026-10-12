import React, { useState, useCallback } from "react";
import { EventExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import ErrorMessage from "../../ErrorMessage";
import { ExpenseRow } from "./ExpensesRow";
import { useExpenseActions } from "@/app/lib/hooks/useExpenseAction";
import { getDecisionSummary } from "@/app/utils/expenseReport";
import { Table, TableHeader, TableRow, TableHead } from "@/components/ui/table";    

interface ExpensesListProps {
    expenseReports: EventExpenseReport[];
    fetchData: () => Promise<void>;
    params: { slug: string };
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ expenseReports, fetchData, params }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const { handleAction } = useExpenseActions(fetchData);

    const toggleRow = useCallback((reportId: number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(reportId)) {
                next.delete(reportId);
            } else {
                next.add(reportId);
            }
            return next;
        });
    }, []);

    if (!expenseReports || expenseReports.length === 0) {
        return <ErrorMessage message="Aucune note de frais trouvée" variant="alert" />;
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Sortie</TableHead>
                        <TableHead>Demandeur</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Don ou remb.</TableHead>
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
                                onAction={(reportId, action) => handleAction(reportId, action, undefined, getDecisionSummary(report))}
                            />
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default ExpensesList;