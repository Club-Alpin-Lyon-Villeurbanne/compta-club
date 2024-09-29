import React from 'react';
import {FaFileAlt} from "react-icons/fa";
import {Other} from "@/app/interfaces/DetailsInterface";
import { get } from 'http';
import { getFileUrlByExpenseId } from '@/app/utils/helper';
import { Justificatif } from '../Justificatif';

interface OtherExpensesTableProps {
    autres: Other[];
    attachments: any[];
}

const OtherExpensesTable: React.FC<OtherExpensesTableProps> = ({autres, attachments}) => {
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
                    const justificationUrl = getFileUrlByExpenseId(attachments, item.expenseId);
                    return (
                        <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">Autre n°{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.comment || "Aucune description"}</td>
                            <td className="px-6 py-4 text-right">{item.price ? `${item.price}€` : "N/A"}</td>
                            <td className="px-6 py-4 text-center"><Justificatif fileUrl={justificationUrl}/></td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default OtherExpensesTable;
