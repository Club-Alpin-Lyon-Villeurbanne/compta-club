import React from 'react';
import TransportTable from "@/app/components/note-de-frais/ExpensesTables/TransportTable";
import HebergementTable from "@/app/components/note-de-frais/ExpensesTables/HebergementTable";
import OtherExpensesTable from "@/app/components/note-de-frais/ExpensesTables/OtherExpensesTable";
import ExpensesSummary from "@/app/components/note-de-frais/ExpensesTables/ExpensesSummary";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { FaCheck, FaTimes, FaInfoCircle, FaCar, FaBed, FaReceipt, FaFileInvoiceDollar } from 'react-icons/fa';

export default function ExpensesTable({ report }: { report: ExpenseReport }) {
    const renderStatusAlert = () => {
        if (report.status === ExpenseStatus.APPROVED) {
            return (
                <div className="flex items-start p-4 mt-6 text-green-700 border border-green-200 rounded-lg bg-green-50">
                    <FaCheck className="flex-shrink-0 mt-1 mr-3 text-green-500" />
                    <div>
                        <p className="font-semibold">Note de frais validée</p>
                        <p className="mt-1 text-sm">{report.statusComment}</p>
                    </div>
                </div>
            );
        } else if (report.status === ExpenseStatus.REJECTED) {
            return (
                <div className="flex items-start p-4 mt-6 text-red-700 border border-red-200 rounded-lg bg-red-50">
                    <FaTimes className="flex-shrink-0 mt-1 mr-3 text-red-500" />
                    <div>
                        <p className="font-semibold">Note de frais refusée</p>
                        <p className="mt-1 text-sm">{report.statusComment}</p>
                    </div>
                </div>
            );
        } else if (report.status === ExpenseStatus.ACCOUNTED) {
            return (
                <div className="flex items-start p-4 mt-6 text-purple-700 border border-purple-200 rounded-lg bg-purple-50">
                    <FaFileInvoiceDollar className="flex-shrink-0 mt-1 mr-3 text-purple-500" />
                    <div>
                        <p className="font-semibold">Note de frais comptabilisée</p>
                        <p className="mt-1 text-sm">{report.statusComment}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="p-6 bg-white shadow-sm rounded-xl">
                <h2 className="mb-6 text-2xl font-bold text-gray-800">Détails des Dépenses</h2>

                <div className="space-y-8">
                    <div className="p-4 rounded-lg bg-blue-50">
                        <h3 className="flex items-center mb-3 text-lg font-semibold text-blue-700">
                            <FaCar className="mr-2" /> Transport
                        </h3>
                        <TransportTable transport={report.details.transport} attachments={report.attachments} />
                    </div>

                    <div className="p-4 rounded-lg bg-green-50">
                        <h3 className="flex items-center mb-3 text-lg font-semibold text-green-700">
                            <FaBed className="mr-2" /> Hébergement
                        </h3>
                        <HebergementTable hebergement={report.details.accommodations} attachments={report.attachments} />
                    </div>

                    <div className="p-4 rounded-lg bg-purple-50">
                        <h3 className="flex items-center mb-3 text-lg font-semibold text-purple-700">
                            <FaReceipt className="mr-2" /> Autres dépenses
                        </h3>
                        <OtherExpensesTable autres={report.details.others} attachments={report.attachments} />
                    </div>
                </div>

                <div className="mt-8">
                    <ExpensesSummary details={report.details} />
                </div>

                {renderStatusAlert()}
            </div>
        </div>
    );
}