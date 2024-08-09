import React from 'react';
import { Hebergement } from "@/app/interfaces/ExpenseGroups";
import { FaFileAlt } from "react-icons/fa";

interface HebergementTableProps {
    hebergement: Hebergement[];
}

const HebergementTable: React.FC<HebergementTableProps> = ({ hebergement }) => {
    // Vérifie s'il y a des montants dépassant 60€
    const hasExceedingPrice = hebergement.some(item => {
        const priceField = item.fields.find(field => field.fieldType === 2);
        return priceField && parseFloat(priceField.value) > 60;
    });

    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-blue-700 mb-3">Hébergement</h3>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-blue-100">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type de dépense</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant (en Euros)</th>
                    {hasExceedingPrice && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant remboursable</th>
                    )}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Justificatif</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {hebergement.map((item, index) => {
                    const priceField = item.fields.find(field => field.fieldType === 2);
                    const descriptionField = item.fields.find(field => field.fieldType === 3);
                    const justificationField = item.fields.find(field => field.justificationDocument);

                    const price = priceField ? parseFloat(priceField.value) : 0;
                    const isExceeding = price > 60;
                    const remboursablePrice = isExceeding ? 60 : price; // Limite de 60€

                    return (
                        <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">Nuitée n°{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{descriptionField?.value || "Aucune description"}</td>
                            <td className={`px-6 py-4 text-right ${isExceeding ? 'text-red-600' : ''}`}>
                                {priceField?.value ? `${priceField.value}€` : "N/A"}
                            </td>
                            {hasExceedingPrice && (
                                <td className="px-6 py-4 text-right">
                                    {`${remboursablePrice}€`}
                                </td>
                            )}
                            <td className="px-6 py-4 text-center">
                                {justificationField?.justificationDocument ? (
                                    <a href={'https://www.clubalpinlyon.fr' + justificationField.justificationDocument} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                                        <FaFileAlt className="inline-block w-5 h-5" />
                                    </a>
                                ) : (
                                    "N/A"
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default HebergementTable;
