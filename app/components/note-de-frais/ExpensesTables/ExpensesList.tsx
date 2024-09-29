import React, { useState } from "react";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import ExpensesTable from "@/app/components/note-de-frais/ExpensesTables/ExpensesTable";
import { FaAngleDown, FaAngleUp, FaCheck, FaTimes, FaUser, FaCalendarAlt, FaEuroSign } from "react-icons/fa";
import dayjs from "dayjs";
import { Badge } from "@/app/components/note-de-frais/Badge";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { calculateTotals, formatEuro } from '@/app/utils/helper';

interface ExpensesListProps {
    expenseReports: ExpenseReport[];
}

const ExpensesList: React.FC<ExpensesListProps> = ({ expenseReports }) => {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const toggleRow = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const hasDetails = (report: ExpenseReport) => {
        return report.details !== null;
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note de frais</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demandeur</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant Total</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {expenseReports.map(report => (
                        <React.Fragment key={report.id}>
                            <tr className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-6 py-4 whitespace-nowrap">{report.event.titre}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FaUser className="text-gray-400 mr-2" />
                                        {report.user.firstname + " " + report.user.lastname}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <FaCalendarAlt className="text-gray-400 mr-2" />
                                        {dayjs(report.event.tsp).format("DD/MM/YYYY à HH:mm")}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end">
                                        {formatEuro(calculateTotals(report.details).totalRemboursable)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <Badge status={report.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {hasDetails(report) && report.status !== ExpenseStatus.APPROVED && report.status !== ExpenseStatus.REJECT && (
                                        <div className="flex justify-center space-x-2">
                                            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out flex items-center">
                                                <FaCheck className="mr-2" /> Valider
                                            </button>
                                            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out flex items-center">
                                                <FaTimes className="mr-2" /> Refuser
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {hasDetails(report) && (
                                        <button 
                                            onClick={() => toggleRow(report.id)}
                                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                                        >
                                            {expandedRows.includes(report.id) ? (
                                                <FaAngleUp className="inline-block w-5 h-5" />
                                            ) : (
                                                <FaAngleDown className="inline-block w-5 h-5" />
                                            )}
                                        </button>
                                    )}
                                </td>
                            </tr>
                            {expandedRows.includes(report.id) && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4">
                                        {report.details && <ExpensesTable report={report} />}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExpensesList;