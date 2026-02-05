// ExpenseRow.tsx
import React from "react";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { calculateTotals, formatEuro } from '@/app/utils/helper';
import { FaAngleDown, FaAngleUp, FaCheck, FaTimes, FaUser, FaCalendarAlt, FaMoneyBillWave, FaGift, FaFileInvoiceDollar, FaFilePdf } from "react-icons/fa";
import dayjs from "dayjs";
import { Badge } from "../Badge";
import ExpensesTable from "./ExpensesTable";

interface ExpenseRowProps {
    report: ExpenseReport;
    isExpanded: boolean;
    onToggle: () => void;
    onAction: (reportId: number, action: ExpenseStatus.APPROVED | ExpenseStatus.REJECTED | ExpenseStatus.ACCOUNTED) => void;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = React.memo(({ report, isExpanded, onToggle, onAction }) => {
    const hasDetails = report.details !== null;

    const handleDownloadPDF = React.useCallback(async () => {
        const { generateExpenseReportPDF } = await import('@/app/utils/pdfGenerator');
        generateExpenseReportPDF(report);
    }, [report]);

    return (
        <>
            <tr className="transition-colors duration-200 hover:bg-gray-50">
                <td 
                    className="px-4 py-2 text-sm cursor-pointer whitespace-nowrap"
                    onClick={onToggle}
                >
                    <div className="flex items-center">
                        {report.sortie.titre}
                        {hasDetails && (
                            isExpanded ? 
                                <FaAngleUp className="ml-2 text-blue-500" /> : 
                                <FaAngleDown className="ml-2 text-blue-500" />
                        )}
                    </div>
                </td>
                <td className="px-4 py-2 text-sm whitespace-nowrap">
                    <div className="flex items-center">
                        <FaUser className="mr-2 text-gray-400" />
                        <span className="truncate max-w-[120px]">{report.utilisateur.prenom} {report.utilisateur.nom}</span>
                    </div>
                </td>
                <td className="px-4 py-2 text-sm whitespace-nowrap">
                    <div className="flex items-center">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        {dayjs(report.sortie.heureRendezVous).format("DD/MM/YY")}
                    </div>
                </td>
                <td className="px-4 py-2 text-sm text-right whitespace-nowrap">
                    {formatEuro(calculateTotals(report.details).totalRemboursable)}
                </td>
                <td className="px-4 py-2 text-sm text-center whitespace-nowrap">
                    <div className="flex items-center justify-center">
                        {report.refundRequired ? (
                            <>
                                <FaMoneyBillWave className="mr-2 text-blue-600" />
                                <span className="text-blue-600">Remboursement</span>
                            </>
                        ) : (
                            <>
                                <FaGift className="mr-2 text-green-600" />
                                <span className="text-green-600">Don</span>
                            </>
                        )}
                    </div>
                </td>
                <td className="px-4 py-2 text-sm text-center whitespace-nowrap">
                    <Badge status={report.status} statusComment={report.commentaireStatut} />
                </td>
                <td className="px-4 py-2 text-sm text-center whitespace-nowrap">
                    {hasDetails && (
                        <div className="flex justify-center space-x-2">
                            {/* Bouton PDF pour les notes approuvées ou comptabilisées */}
                            {(report.status === ExpenseStatus.APPROVED || report.status === ExpenseStatus.ACCOUNTED) && (
                                <button
                                    onClick={handleDownloadPDF}
                                    className="p-1.5 text-red-600 transition-colors rounded hover:bg-red-50"
                                    title="Télécharger en PDF"
                                >
                                    <FaFilePdf className="w-4 h-4" />
                                </button>
                            )}
                            {(report.status === ExpenseStatus.SUBMITTED) && (
                                <>
                                    <button 
                                        className="p-1 font-bold text-white transition duration-300 ease-in-out bg-green-500 rounded-full hover:bg-green-600"
                                        onClick={() => onAction(report.id, ExpenseStatus.APPROVED)}
                                    >
                                        <FaCheck className="w-4 h-4" />
                                    </button>
                                    <button 
                                        className="p-1 font-bold text-white transition duration-300 ease-in-out bg-red-500 rounded-full hover:bg-red-600"
                                        onClick={() => onAction(report.id, ExpenseStatus.REJECTED)}
                                    >
                                        <FaTimes className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            {report.status === ExpenseStatus.APPROVED && (
                                <button 
                                    className="p-1 font-bold text-white transition duration-300 ease-in-out bg-purple-500 rounded-full hover:bg-purple-600"
                                    onClick={() => onAction(report.id, ExpenseStatus.ACCOUNTED)}
                                >
                                    <FaFileInvoiceDollar className="w-4 h-4" />
                                </button>
                            )}
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
});

ExpenseRow.displayName = 'ExpenseRow';
