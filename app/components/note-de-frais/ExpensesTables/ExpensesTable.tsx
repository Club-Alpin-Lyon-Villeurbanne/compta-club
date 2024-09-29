import React from 'react';
import TransportTable from "@/app/components/note-de-frais/ExpensesTables/TransportTable";
import HebergementTable from "@/app/components/note-de-frais/ExpensesTables/HebergementTable";
import OtherExpensesTable from "@/app/components/note-de-frais/ExpensesTables/OtherExpensesTable";
import ExpensesSummary from "@/app/components/note-de-frais/ExpensesTables/ExpensesSummary";
import ExpenseStatus from "@/app/enums/ExpenseStatus";
import {ExpenseReport} from "@/app/interfaces/noteDeFraisInterface";

export default function ExpensesTable({report}: { report: ExpenseReport }) {

    return <>
        <div className="container my-8 p-4 bg-white shadow-md rounded-lg max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Récapitulatif des Dépenses</h2>
            <TransportTable transport={report.details.transport} attachments={report.attachments} />
            <HebergementTable hebergement={report.details.accommodations} attachments={report.attachments} />
            <OtherExpensesTable autres={report.details.others} attachments={report.attachments} />
            <ExpensesSummary details={report.details} />

            {report.status === ExpenseStatus.APPROVED && (
                <div
                    className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mt-4"
                    role="alert"
                >
                    <p className="font-bold">Note de frais validée</p>
                    <p>Commentaire: {report.statusComment}</p>
                </div>
            )}

            {report.status === ExpenseStatus.REJECT && (
                <div
                    className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-lg mt-4"
                    role="alert"
                >
                    <p className="font-bold">Note de frais refusée</p>
                    <p>Commentaire: {report.statusComment}</p>
                </div>
            )}
        </div>
    </>
}
