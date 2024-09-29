import { ExpenseStatus, getExpenseStatusColor, getExpenseStatusTranslation } from "@/app/enums/ExpenseStatus";

interface BadgeProps {
    status: ExpenseStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
    const color = getExpenseStatusColor(status as ExpenseStatus);
    const text = getExpenseStatusTranslation(status as ExpenseStatus);
    return (
        <span
            className={`inline-flex items-center rounded-md bg-{${color}}-50 px-2 py-1 text-xs font-medium text-{${color}}-700 ring-1 ring-inset ring-{${color}}-600`}>
            {text}
        </span>
    )
}