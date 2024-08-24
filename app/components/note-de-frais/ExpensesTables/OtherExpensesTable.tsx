import React from 'react';
import {Autre} from "@/app/interfaces/ExpenseGroups";
import {FaFileAlt} from "react-icons/fa";

interface OtherExpensesTableProps {
    autres: Autre[];
}

const OtherExpensesTable: React.FC<OtherExpensesTableProps> = ({autres}) => {
    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-orange-700 mb-3">Autres dépenses</h3>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-orange-100">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type
                        de dépense
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant
                        (en Euros)
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Justificatif</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {autres.map((item, index) => {
                    const priceField = item.fields.find(field => field.fieldType === 2); // Trouver le prix
                    const descriptionField = item.fields.find(field => field.fieldType === 3); // Trouver la description
                    const justificationField = item.fields.find(field => field.justificationDocument); // Trouver le justificatif

                    return (
                        <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">Autre n°{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{descriptionField?.value || "Aucune description"}</td>
                            <td className="px-6 py-4 text-right">{priceField?.value ? `${priceField.value}€` : "N/A"}</td>
                            <td className="px-6 py-4 text-center">
                                {justificationField?.justificationDocument ? (
                                    <a href={'https://www.clubalpinlyon.fr' + justificationField.justificationDocument} target="_blank"
                                       rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                                        <FaFileAlt className="inline-block w-5 h-5"/>
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

export default OtherExpensesTable;
