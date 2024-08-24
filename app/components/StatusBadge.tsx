import React from 'react';
import { ExpenseStatus, getExpenseStatusTranslation } from "@/app/enums/ExpenseStatus";

interface StatusBadgeProps {
    status: ExpenseStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getColor = (status: ExpenseStatus) => {
        switch (status) {
            case ExpenseStatus.APPROVED:
                return 'green';
            case ExpenseStatus.REJECT:
                return 'red';
            case ExpenseStatus.VALIDATED:
                return 'blue';
            case ExpenseStatus.PENDING:
                return 'yellow';
            case ExpenseStatus.DRAFT:
                return 'gray';
            case ExpenseStatus.SUBMITTED:
                return 'indigo';
            case ExpenseStatus.VALIDATE:
                return 'purple';
            default:
                return 'gray';
        }
    };

    const color = getColor(status);

    return (
        <span className="relative inline-block px-3 py-1 font-semibold leading-tight">
            <span
                aria-hidden
                className={`absolute inset-0 bg-${color}-200 rounded-full opacity-50`}
            ></span>
            <span className={`relative text-${color}-900`}>
                {getExpenseStatusTranslation(status)}
            </span>
        </span>
    );
};

export default StatusBadge;
