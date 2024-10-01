import React from 'react';
import { FaBed, FaInfoCircle, FaFileAlt } from "react-icons/fa";
import { Accommodation } from "@/app/interfaces/DetailsInterface";
import { getFileUrlByExpenseId } from '@/app/utils/helper';
import { Justificatif } from '../Justificatif';

interface HebergementTableProps {
    hebergement: Accommodation[];
    attachments: any[];
}

const HebergementTable: React.FC<HebergementTableProps> = ({ hebergement, attachments }) => {
    const hasExceedingPrice = hebergement.some(item => item.price && item.price > 60);

    return (
        <div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-gray-600">
                        <th className="py-2">Nuitée</th>
                        <th className="py-2">Description</th>
                        <th className="py-2 text-right">Montant</th>
                        {hasExceedingPrice && <th className="py-2 text-right">Remboursable</th>}
                        <th className="py-2 text-center">Justificatif</th>
                    </tr>
                </thead>
                <tbody>
                    {hebergement.map((item, index) => {
                        const justificatifUrl = getFileUrlByExpenseId(attachments, item.expenseId);
                        const price = item.price || 0;
                        const isExceeding = price > 60;
                        const remboursablePrice = isExceeding ? 60 : price;

                        return (
                            <tr key={index} className="border-t border-gray-200">
                                <td className="py-2 flex items-center">
                                    <FaBed className="mr-2 text-blue-500" /> N°{index + 1}
                                </td>
                                <td className="py-2">{item.comment || "Aucune description"}</td>
                                <td className={`py-2 text-right ${isExceeding ? 'text-red-600 font-semibold' : ''}`}>
                                    {price ? `${price}€` : "N/A"}
                                </td>
                                {hasExceedingPrice && (
                                    <td className="py-2 text-right">
                                        {`${remboursablePrice}€`}
                                        {isExceeding && <FaInfoCircle className="inline-block ml-1 text-blue-500" title="Montant plafonné à 60€" />}
                                    </td>
                                )}
                                <td className="py-2 text-center">
                                    <Justificatif fileUrl={justificatifUrl}/>
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