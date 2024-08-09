import React from 'react';

import {ExpenseGroups} from "@/app/interfaces/ExpenseGroups";
import TransportTable from "@/app/components/note-de-frais/ExpensesTables/TransportTable";
import HebergementTable from "@/app/components/note-de-frais/ExpensesTables/HebergementTable";
import OtherExpensesTable from "@/app/components/note-de-frais/ExpensesTables/OtherExpensesTable";
import ExpensesSummary from "@/app/components/note-de-frais/ExpensesTables/ExpensesSummary";

export default function ExpensesTable({transport, hebergement, autres}: ExpenseGroups) {

    return <>
        <div className="container my-8 p-4 bg-white shadow-md rounded-lg max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Récapitulatif des Dépenses</h2>
            <TransportTable transport={transport} />
            <HebergementTable hebergement={hebergement} />
            <OtherExpensesTable autres={autres} />
            <ExpensesSummary expenseGroups={{transport, hebergement, autres}} />
        </div>
    </>
}
