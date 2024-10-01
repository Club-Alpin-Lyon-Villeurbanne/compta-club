import React from 'react';
import TransportTable from "@/app/components/note-de-frais/ExpensesTables/TransportTable";
import HebergementTable from "@/app/components/note-de-frais/ExpensesTables/HebergementTable";
import OtherExpensesTable from "@/app/components/note-de-frais/ExpensesTables/OtherExpensesTable";
import ExpensesSummary from "@/app/components/note-de-frais/ExpensesTables/ExpensesSummary";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { FaCheck, FaTimes, FaInfoCircle, FaCar, FaBed, FaReceipt } from 'react-icons/fa';

export default function ExpensesTable({ report }: { report: ExpenseReport }) {
    const renderStatusAlert = () => {
        if (report.status === ExpenseStatus.APPROVED) {
            return (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mt-6 flex items-start">
                    <FaCheck className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Note de frais validée</p>
                        <p className="mt-1 text-sm">{report.statusComment}</p>
                    </div>
                </div>
            );
        } else if (report.status === ExpenseStatus.REJECT) {
            return (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mt-6 flex items-start">
                    <FaTimes className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Note de frais refusée</p>
                        <p className="mt-1 text-sm">{report.statusComment}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white shadow-sm rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Détails des Dépenses</h2>

                <div className="space-y-8">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="flex items-center text-lg font-semibold text-blue-700 mb-3">
                            <FaCar className="mr-2" /> Transport
                        </h3>
                        <TransportTable transport={report.details.transport} attachments={report.attachments} />
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="flex items-center text-lg font-semibold text-green-700 mb-3">
                            <FaBed className="mr-2" /> Hébergement
                        </h3>
                        <HebergementTable hebergement={report.details.accommodations} attachments={report.attachments} />
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="flex items-center text-lg font-semibold text-purple-700 mb-3">
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