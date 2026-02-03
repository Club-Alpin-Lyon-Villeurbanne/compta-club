import { ExpenseStatus, getExpenseStatusColor, getExpenseStatusTranslation } from "@/app/enums/ExpenseStatus";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface BadgeProps {
    status: ExpenseStatus;
    statusComment?: string;
}

const badgeClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-600',
    red: 'bg-red-50 text-red-700 ring-red-600',
    green: 'bg-green-50 text-green-700 ring-green-600',
    purple: 'bg-purple-50 text-purple-700 ring-purple-600',
    gray: 'bg-gray-50 text-gray-700 ring-gray-600',
};

export const Badge: React.FC<BadgeProps> = ({ status, statusComment }) => {
    const color = getExpenseStatusColor(status as ExpenseStatus);
    const text = getExpenseStatusTranslation(status as ExpenseStatus);
    const colorClasses = badgeClasses[color] || badgeClasses.gray;

    const badge = (
        <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colorClasses}`}>
            {text}
        </span>
    );

    if (!statusComment) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {badge}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{statusComment}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}