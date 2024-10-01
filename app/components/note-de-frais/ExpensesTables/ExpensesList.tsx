import React, { useState } from "react";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import ExpensesTable from "@/app/components/note-de-frais/ExpensesTables/ExpensesTable";
import { FaAngleDown, FaAngleUp, FaCheck, FaTimes, FaUser, FaCalendarAlt, FaEuroSign, FaGift, FaMoneyBillWave } from "react-icons/fa";
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
        <div className="w-full overflow-x-auto">
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
                        <th className="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {expenseReports.map(report => (
                        <React.Fragment key={report.id}>
                            <tr className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="px-4 py-2 whitespace-nowrap text-sm">{report.event.titre}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                        <FaUser className="text-gray-400 mr-2" />
                                        <span className="truncate max-w-[120px]">{report.user.firstname} {report.user.lastname}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    <div className="flex items-center">
                                        <FaCalendarAlt className="text-gray-400 mr-2" />
                                        {dayjs(report.event.tsp).format("DD/MM/YY")}
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                    {formatEuro(calculateTotals(report.details).totalRemboursable)}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                    <div className="flex items-center justify-center">
                                        {report.refundRequired ? (
                                            <>
                                                <FaMoneyBillWave className="text-blue-600 mr-2" />
                                                <span className="text-blue-600">Remboursement</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaGift className="text-green-600 mr-2" />
                                                <span className="text-green-600">Don</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                    <Badge status={report.status} />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                    {hasDetails(report) && report.status !== ExpenseStatus.APPROVED && report.status !== ExpenseStatus.REJECT && (
                                        <div className="flex justify-center space-x-2">
                                            <button className="bg-green-500 hover:bg-green-600 text-white font-bold p-1 rounded-full transition duration-300 ease-in-out">
                                                <FaCheck className="w-4 h-4" />
                                            </button>
                                            <button className="bg-red-500 hover:bg-red-600 text-white font-bold p-1 rounded-full transition duration-300 ease-in-out">
                                                <FaTimes className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
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
                                    <td colSpan={8} className="px-4 py-2">
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