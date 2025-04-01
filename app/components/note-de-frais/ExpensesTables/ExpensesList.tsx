// ExpensesList.tsx
import React, { useState, useCallback, useEffect } from "react";
import { ExpenseReport, PaginatedResponse } from "@/app/interfaces/noteDeFraisInterface";
import { ErrorAlert } from "../../ErrorAlert";
import { ExpenseRow } from "./ExpensesRow";
import { useExpenseActions } from "@/app/lib/hooks/useExpenseAction";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { Table, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useSearchParams } from 'next/navigation';
import { axiosAuth } from '@/app/lib/axios';

interface ExpensesListProps {
    initialData: PaginatedResponse<ExpenseReport>;
    session: any; // Replace 'any' with the actual session type
    params: { slug: string };
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ 
    initialData, 
    session, 
    params 
}) => {
    const [expenseReports, setExpenseReports] = useState<ExpenseReport[]>(initialData.data);
    const [expandedRows, setExpandedRows] = useState(new Set<number>());
    const [currentPage, setCurrentPage] = useState(initialData.page);
    const [totalPages, setTotalPages] = useState(initialData.totalPages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const { handleAction: originalHandleAction } = useExpenseActions(session, params);

    const fetchExpenses = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const status = searchParams.get('status');
            const response = await axiosAuth(
                `/expense-reports?page=${page}&pageSize=10${status ? `&status=${status}` : ''}`,
                {
                    method: "get",
                }
            );
            
            if (response.status === 200) {
                const data: PaginatedResponse<ExpenseReport> = response.data;
                setExpenseReports(data.data);
                setTotalPages(data.totalPages);
                setCurrentPage(data.page);
            }
        } catch (err) {
            setError('Une erreur est survenue lors du chargement des notes de frais');
            console.error('Error fetching expenses:', err);
        } finally {
            setIsLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchExpenses(currentPage);
    }, [currentPage, searchParams]);

    const handleAction = useCallback(async (reportId: number, action: ExpenseStatus.APPROVED | ExpenseStatus.REJECTED) => {
        try {
            await originalHandleAction(reportId, action);
            // Rafraîchir la page courante après l'action
            fetchExpenses(currentPage);
        } catch (err) {
            console.error("Failed to process action:", err);
        }
    }, [originalHandleAction, currentPage, fetchExpenses]);

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
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default ExpensesList;