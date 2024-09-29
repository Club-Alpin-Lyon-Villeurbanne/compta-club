import React from 'react';
import { Details } from "@/app/interfaces/DetailsInterface";
import { calculateTotals, formatEuro } from '@/app/utils/helper';


const ExpensesSummary: React.FC<{ details: Details }> = ({ details }) => {
    const {
        transportTotal,
        accommodationsTotal,
        othersTotal,
        totalRemboursable,
        accommodationsRemboursable
    } = calculateTotals(details);

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
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">Dont Hébergement (max {process.env.NEXT_PUBLIC_NUITEE_MAX_REMBOURSABLE}€/nuitée)</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">{formatEuro(accommodationsTotal)} dont {formatEuro(accommodationsRemboursable)} remboursables</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">Transport</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">{formatEuro(transportTotal)}</td>
                </tr>
                <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">Autres dépenses</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-700">{formatEuro(othersTotal)}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ExpensesSummary;
