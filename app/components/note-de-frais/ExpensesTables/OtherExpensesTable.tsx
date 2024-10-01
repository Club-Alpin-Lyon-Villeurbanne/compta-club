import React from 'react';
import { FaReceipt, FaFileAlt } from "react-icons/fa";
import { Other } from "@/app/interfaces/DetailsInterface";
import { getFileUrlByExpenseId } from '@/app/utils/helper';
import { Justificatif } from '../Justificatif';

interface OtherExpensesTableProps {
    autres: Other[];
    attachments: any[];
}

const OtherExpensesTable: React.FC<OtherExpensesTableProps> = ({autres, attachments}) => {
    return (
        <div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-gray-600">
                        <th className="py-2">Dépense</th>
                        <th className="py-2">Description</th>
                        <th className="py-2 text-right">Montant</th>
                        <th className="py-2 text-center">Justificatif</th>
                    </tr>
                </thead>
                <tbody>
                    {autres.map((item, index) => {
                        const justificationUrl = getFileUrlByExpenseId(attachments, item.expenseId);
                        return (
                            <tr key={index} className="border-t border-gray-200">
                                <td className="py-2 flex items-center">
                                    <FaReceipt className="mr-2 text-purple-500" /> Autre n°{index + 1}
                                </td>
                                <td className="py-2">{item.comment || "Aucune description"}</td>
                                <td className="py-2 text-right">{item.price ? `${item.price}€` : "N/A"}</td>
                                <td className="py-2 text-center">
                                    <Justificatif fileUrl={justificationUrl}/>
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