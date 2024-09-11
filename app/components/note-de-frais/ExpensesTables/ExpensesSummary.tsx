import React from 'react';
import { Details } from "@/app/interfaces/DetailsInterface";

const formatEuro = (amount: number) => `${amount?.toFixed(2)} €`;

// Calcul le total pour chaque catégorie de dépenses
const calculateTotals = (details: Details) => {
    let transportTotal: number;

    // Calcul le total de transport selon le type de transport TODO: A modifier si on ajoute un nouveau type de transport
    switch (details.transport.type) {
        case "RENTAL_MINIBUS":
            transportTotal = (details.transport.tollFee || 0) +
                (details.transport.fuelExpense || 0) +
                (details.transport.rentalPrice || 0);
            break;
        case "PUBLIC_TRANSPORT":
            transportTotal = (details.transport.ticketPrice || 0);
            break;
        case "CLUB_MINIBUS":
            transportTotal = (details.transport.tollFee || 0) +
                (details.transport.fuelExpense || 0);
            break;
        case "PERSONAL_VEHICLE":
            transportTotal = (details.transport.tollFee || 0);
            break;
        default:
            transportTotal = 0;
    }

    // Calcul les totaux d'hébergement et autres dépenses
    const accommodationsTotal = details.accommodations.reduce((total, acc) => total + acc.price, 0);
    const othersTotal = details.others.reduce((total, other) => total + other.price, 0);

    // Calcul le montant remboursable pour les hébergements (max 60€/nuitée)
    const accommodationsRemboursable = details.accommodations.reduce((total, acc) => total + Math.min(acc.price, 60), 0);

    // Calcul le total remboursable (transport + hébergement + autres)
    const totalRemboursable = transportTotal + accommodationsRemboursable + othersTotal;

    return {
        transportTotal,
        accommodationsTotal,
        othersTotal,
        totalRemboursable,
        accommodationsRemboursable
    };
};

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
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">Dont Hébergement (max 60€/nuitée)</td>
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
