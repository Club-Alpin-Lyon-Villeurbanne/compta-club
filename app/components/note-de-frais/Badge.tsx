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

export const Badge: React.FC<BadgeProps> = ({ status, statusComment }) => {
    const color = getExpenseStatusColor(status as ExpenseStatus);
    const text = getExpenseStatusTranslation(status as ExpenseStatus);
    
    const badge = (
        <span
            className={`inline-flex items-center rounded-md bg-${color}-50 px-2 py-1 text-xs font-medium text-${color}-700 ring-1 ring-inset ring-${color}-600`}>
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