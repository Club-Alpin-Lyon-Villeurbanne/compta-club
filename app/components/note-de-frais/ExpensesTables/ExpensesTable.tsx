import React from 'react';
import TransportTable from "@/app/components/note-de-frais/ExpensesTables/TransportTable";
import HebergementTable from "@/app/components/note-de-frais/ExpensesTables/HebergementTable";
import OtherExpensesTable from "@/app/components/note-de-frais/ExpensesTables/OtherExpensesTable";
import ExpensesSummary from "@/app/components/note-de-frais/ExpensesTables/ExpensesSummary";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import { FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';

export default function ExpensesTable({ report }: { report: ExpenseReport }) {
    const renderStatusAlert = () => {
        if (report.status === ExpenseStatus.APPROVED) {
            return (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mt-6 flex items-start">
                    <FaCheck className="text-green-500 mr-3 mt-1" />
                    <div>
                        <p className="font-bold">Note de frais validée</p>
                        <p className="mt-1">{report.statusComment}</p>
                    </div>
                </div>
            );
        } else if (report.status === ExpenseStatus.REJECT) {
            return (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mt-6 flex items-start">
                    <FaTimes className="text-red-500 mr-3 mt-1" />
                    <div>
                        <p className="font-bold">Note de frais refusée</p>
                        <p className="mt-1">{report.statusComment}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container my-8 p-6 bg-white shadow-lg rounded-xl max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Récapitulatif des Dépenses</h2>
            </div>

            <div className="space-y-8">
                <TransportTable transport={report.details.transport} attachments={report.attachments} />
                <HebergementTable hebergement={report.details.accommodations} attachments={report.attachments} />
                <OtherExpensesTable autres={report.details.others} attachments={report.attachments} />
            </div>

            <div className="mt-10">
                <ExpensesSummary details={report.details} />
            </div>

            {renderStatusAlert()}
        </div>
    );
}