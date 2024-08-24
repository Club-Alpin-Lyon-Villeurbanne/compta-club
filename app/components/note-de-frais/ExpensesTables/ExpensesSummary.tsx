import React from 'react';
import { ExpenseGroups, Field } from "@/app/interfaces/ExpenseGroups";

interface ExpensesSummaryProps {
    expenseGroups: ExpenseGroups;
}

const ExpensesSummary: React.FC<ExpensesSummaryProps> = ({ expenseGroups }) => {
    const { transport, hebergement, autres } = expenseGroups;

    // Fonction pour extraire la valeur numérique d'un champ
    const getNumericValue = (field: Field | undefined): number => {
        if (field && field.value) return parseFloat(field.value)
        return 0;
    };

    // Calcul du total des transports
    const transportTotal = transport["0"] ? transport["0"].fields.reduce((acc, field) => {
        return acc + getNumericValue(field);
    }, 0) : 0;

    // Calcul du total de l'hébergement (avec une limite de 60€/nuitée si applicable)
    const hebergementTotal = hebergement.reduce((acc, item) => {
        const priceField = item.fields.find(field => field.fieldType === 2);
        const price = getNumericValue(priceField);
        const cappedPrice = price > 60 ? 60 : price; // Limite à 60€
        return acc + cappedPrice;
    }, 0);

    // Calcul du total des autres dépenses
    const autresTotal = autres.reduce((acc, item) => {
        const priceField = item.fields.find(field => field.fieldType === 2);
        return acc + getNumericValue(priceField);
    }, 0);

    // Calcul du total remboursable
    const totalRemboursable = transportTotal + hebergementTotal + autresTotal;

    // Fonction pour formater un nombre en euros avec deux décimales
    const formatEuro = (amount: number): string => `${amount.toFixed(2).replace('.', ',')}€`;

    return (
        <div className="bg-gray-50 rounded-lg mt-6">
            <h3 className="text-lg font-semibold text-red-700 mb-3 px-6 pt-4">Résumé</h3>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <tbody>
                <tr className="bg-red-100">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Total remboursable</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{formatEuro(totalRemboursable)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">Dont Hébergement (max 60€/nuitée)</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">{formatEuro(hebergementTotal)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">Transport</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">{formatEuro(transportTotal)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">Autres dépenses</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">{formatEuro(autresTotal)}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ExpensesSummary;
