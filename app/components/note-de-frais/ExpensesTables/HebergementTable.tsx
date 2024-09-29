import React from 'react';
import { FaFileAlt } from "react-icons/fa";
import {Accommodation} from "@/app/interfaces/DetailsInterface";
import { getFileUrlByExpenseId } from '@/app/utils/helper';
import { Justificatif } from '../Justificatif';

interface HebergementTableProps {
    hebergement: Accommodation[];
    attachments: any[];
}

const HebergementTable: React.FC<HebergementTableProps> = ({ hebergement, attachments }) => {
    // Vérifie s'il y a des montants dépassant 60€
    const hasExceedingPrice = hebergement.some(item => {
        return item.price && item.price > 60;
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
                    const descriptionField = item.comment ? item.comment : "Aucune description";
                    const justificatifUrl = getFileUrlByExpenseId(attachments, item.expenseId);

                    const price = item.price ? item.price : null;
                    const isExceeding = price > 60;
                    const remboursablePrice = isExceeding ? 60 : price; // Limite de 60€

                    return (
                        <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">Nuitée n°{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{descriptionField}</td>
                            <td className={`px-6 py-4 text-right ${isExceeding ? 'text-red-600' : ''}`}>
                                {price ? `${price}€` : "N/A"}
                            </td>
                            {hasExceedingPrice && (
                                <td className="px-6 py-4 text-right">
                                    {`${remboursablePrice}€`}
                                </td>
                            )}
                            <td className="px-6 py-4 text-center"><Justificatif fileUrl={justificatifUrl}/></td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default HebergementTable;
