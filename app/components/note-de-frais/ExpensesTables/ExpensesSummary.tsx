import React from 'react';
import { Details } from "@/app/interfaces/DetailsInterface";
import { calculateTotals, formatEuro } from '@/app/utils/helper';
import { config } from '@/app/config';
import { FaMoneyBillWave, FaBed, FaCar, FaReceipt } from 'react-icons/fa';

const ExpensesSummary: React.FC<{ details: Details }> = ({ details }) => {
    const {
        transportTotal,
        accommodationsTotal,
        othersTotal,
        totalRemboursable,
        accommodationsRemboursable
    } = calculateTotals(details);

    const SummaryItem = ({ icon, label, amount, subAmount = null }) => (
        <div className="flex items-center justify-between py-3 border-b last:border-b-0">
            <div className="flex items-center">
                {icon}
                <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{amount}</div>
                {subAmount && <div className="text-xs text-gray-500">{subAmount}</div>}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-md mt-6 overflow-hidden">
            <div className="bg-red-600 text-white px-6 py-4">
                <h3 className="text-lg font-semibold">Résumé des dépenses</h3>
            </div>
            <div className="p-6">
                <SummaryItem 
                    icon={<FaMoneyBillWave className="text-green-500" />}
                    label="Total remboursable"
                    amount={formatEuro(totalRemboursable)}
                />
                <SummaryItem 
                    icon={<FaBed className="text-blue-500" />}
                    label={`Hébergement (max ${config.NUITEE_MAX_REMBOURSABLE}€/nuitée)`}
                    amount={formatEuro(accommodationsTotal)}
                    subAmount={`dont ${formatEuro(accommodationsRemboursable)} remboursables`}
                />
                <SummaryItem 
                    icon={<FaCar className="text-yellow-500" />}
                    label="Transport"
                    amount={formatEuro(transportTotal)}
                />
                <SummaryItem 
                    icon={<FaReceipt className="text-purple-500" />}
                    label="Autres dépenses"
                    amount={formatEuro(othersTotal)}
                />
            </div>
        </div>
    );
};

export default ExpensesSummary;