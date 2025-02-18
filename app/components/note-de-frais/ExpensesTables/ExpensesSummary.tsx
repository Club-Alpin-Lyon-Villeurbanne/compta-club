import React, { ReactNode } from 'react';
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

    interface SummaryItemProps {
        icon: ReactNode;
        label: string;
        amount: string | ReactNode;
        subAmount?: string | number | null;
      }
      
      const SummaryItem: React.FC<SummaryItemProps> = ({ icon, label, amount, subAmount = null }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
            <div className="flex items-center">
                {icon}
                <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{amount}</div>
                {subAmount && <div className="mt-1 text-xs text-gray-500">{subAmount}</div>}
            </div>
        </div>
    );

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
                <h3 className="text-lg font-semibold text-gray-800">Résumé des dépenses</h3>
            </div>
            <div className="p-6 space-y-4">
                <SummaryItem 
                    icon={<FaMoneyBillWave className="text-lg text-green-500" />}
                    label="Total remboursable"
                    amount={<span className="text-lg font-bold text-green-600">{formatEuro(totalRemboursable)}</span>}
                />
                <SummaryItem 
                    icon={<FaBed className="text-lg text-blue-500" />}
                    label={`Hébergement (max ${config.NUITEE_MAX_REMBOURSABLE}€/nuitée)`}
                    amount={formatEuro(accommodationsTotal)}
                    subAmount={`dont ${formatEuro(accommodationsRemboursable)} remboursables`}
                />
                <SummaryItem 
                    icon={<FaCar className="text-lg text-yellow-500" />}
                    label="Transport"
                    amount={formatEuro(transportTotal)}
                />
                <SummaryItem 
                    icon={<FaReceipt className="text-lg text-purple-500" />}
                    label="Autres dépenses"
                    amount={formatEuro(othersTotal)}
                />
            </div>
        </div>
    );
};

export default ExpensesSummary;