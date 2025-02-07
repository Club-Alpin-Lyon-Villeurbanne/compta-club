// ExpenseRow.tsx
import React from "react";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { calculateTotals, formatEuro } from '@/app/utils/helper';
import { FaAngleDown, FaAngleUp, FaCheck, FaTimes, FaUser, FaCalendarAlt, FaMoneyBillWave, FaGift } from "react-icons/fa";
import dayjs from "dayjs";
import { Badge } from "../Badge";
import ExpensesTable from "./ExpensesTable";

interface ExpenseRowProps {
    report: ExpenseReport;
    isExpanded: boolean;
    onToggle: () => void;
    onAction: (reportId: number, action: ExpenseStatus.APPROVED | ExpenseStatus.REJECTED) => void;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({ report, isExpanded, onToggle, onAction }) => {
    const hasDetails = report.details !== null;

    return (
        <>
            <tr className="hover:bg-gray-50 transition-colors duration-200">
                <td 
                    className="px-4 py-2 whitespace-nowrap text-sm cursor-pointer"
                    onClick={onToggle}
                >
                    <div className="flex items-center">
                        {report.event.titre}
                        {hasDetails && (
                            isExpanded ? 
                                <FaAngleUp className="ml-2 text-blue-500" /> : 
                                <FaAngleDown className="ml-2 text-blue-500" />
                        )}
                    </div>
                </td>
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
                    {hasDetails && report.status !== ExpenseStatus.APPROVED && report.status !== ExpenseStatus.REJECTED && (
                        <div className="flex justify-center space-x-2">
                            <button 
                                className="bg-green-500 hover:bg-green-600 text-white font-bold p-1 rounded-full transition duration-300 ease-in-out"
                                onClick={() => onAction(report.id, ExpenseStatus.APPROVED)}
                            >
                                <FaCheck className="w-4 h-4" />
                            </button>
                            <button 
                                className="bg-red-500 hover:bg-red-600 text-white font-bold p-1 rounded-full transition duration-300 ease-in-out"
                                onClick={() => onAction(report.id, ExpenseStatus.REJECTED)}
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={7} className="px-4 py-2">
                        {report.details && <ExpensesTable report={report} />}
                    </td>
                </tr>
            )}
        </>
    );
};