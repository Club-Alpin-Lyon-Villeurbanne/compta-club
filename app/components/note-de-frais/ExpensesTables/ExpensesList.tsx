import React, {useState} from "react";
import {ExpenseReport} from "@/app/interfaces/noteDeFraisInterface";
import ExpensesTable from "@/app/components/note-de-frais/ExpensesTables/ExpensesTable";
import {FaAngleDown, FaAngleUp} from "react-icons/fa";
import dayjs from "dayjs";
import {Badge} from "@/app/components/note-de-frais/Badge";
import ExpenseStatus, {getExpenseStatusTranslation} from "@/app/enums/ExpenseStatus";
import {sweetModalComment} from "@/app/components/sweetModalComment";
import {axiosAuth} from "@/app/lib/axios";

interface ExpensesListProps {
    expenseReports: ExpenseReport[];
}

const ExpensesList: React.FC<ExpensesListProps> = ({expenseReports}) => {
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [comment, setComment] = useState<string>("");

    const toggleRow = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };


    /*    const patch = async (state: { status: ExpenseStatus; comment: string }) => {
            try {
                const response = await axiosAuth(
                    `/expense-report/${params.slug}/status`,
                    {
                        method: "patch",
                        data: {
                            status: state.status,
                            statusComment: state.comment,
                        },
                    }
                );
                if (response.status === 200 && session) {
                    await fetchData();
                }
            } catch (err) {
                setError("Failed to update status");
            }
        };


        const handleAction = async (
            action: ExpenseStatus.VALIDATE | ExpenseStatus.REJECT
        ) => {
            const inputComment = await sweetModalComment(comment, setComment, action);
            if (inputComment !== null) {
                if (action === ExpenseStatus.VALIDATE) {
                    validate(inputComment);
                } else if (action === ExpenseStatus.REJECT) {
                    reject(inputComment);
                }
            }
        };

        const validate = (comment: string) => {
            patch({status: ExpenseStatus.APPROVED, comment});
            setComment("");
        };

        const reject = (comment: string) => {
            patch({status: ExpenseStatus.REJECT, comment});
            setComment("");
        };*/


    // fonction pour vérifier si la note de frais a des détails
    const hasDetails = (report: ExpenseReport) => {
        return report.details !== null;
    };


    return (
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
            <tr>
                <th className="px-6 py-3 text-left">Nom de la note</th>
                <th className="px-6 py-3 text-left">Demandeur</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-right">Montant Total</th>
                <th className="px-6 py-3 text-right">Statut</th>
                <th className="px-6 py-3 text-center">Actions</th>
                <th className="px-6 py-3 text-center"></th>
            </tr>
            </thead>
            <tbody>
            {expenseReports.map(report => (
                <React.Fragment key={report.id}>
                    <tr className="bg-gray-100">
                        <td className="px-6 py-4">{report.event.titre}</td>
                        <td className="px-6 py-4">
                           {report.user.firstname + " " + report.user.lastname}
                        </td>
                        <td className="px-6 py-4">
                            {dayjs(report.event.tsp).format("DD/MM/YYYY à HH:mm")}
                        </td>
                        <td className="px-6 py-4 text-right">
                            {report.details ? (report.details?.accommodations
                                    .reduce((total, acc) => total + acc.price, 0) +
                                report.details?.transport.fuelExpense +
                                report.details?.transport.tollFee) : ("Détails manquants")}{" "}
                            €
                        </td>
                        <td className="px-6 py-4 text-right">
                            <Badge status={report.status}/>
                        </td>
                        <td className="px-6 py-4 text-center">
                            {
                                hasDetails(report) &&
                                <div className="grid grid-cols-1 gap-4 mt-6">
                                    {report.status !== ExpenseStatus.APPROVED &&
                                        report.status !== ExpenseStatus.REJECT && (
                                            <div className="flex space-x-4">
                                                <button
                                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                                    // onClick={() => handleAction(ExpenseStatus.VALIDATE)}
                                                >
                                                    Valider
                                                </button>
                                                <button
                                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-red-700 rounded-lg hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                                                    // onClick={() => handleAction(ExpenseStatus.REJECT)}
                                                >
                                                    Refuser
                                                </button>
                                            </div>
                                        )
                                    }
                                </div>
                            }

                        </td>
                        <td className="px-6 py-4 text-center">
                            {
                                hasDetails(report) && <button onClick={() => toggleRow(report.id)}>
                                    {expandedRows.includes(report.id) ? (
                                        <FaAngleUp className="inline-block w-5 h-5"/>
                                    ) : (
                                        <FaAngleDown className="inline-block w-5 h-5"/>
                                    )}
                                </button>
                            }
                        </td>
                    </tr>
                    {expandedRows.includes(report.id) && (
                        <tr>
                            <td colSpan={5}>
                                {
                                    report.details && <ExpensesTable report={report}/>
                                }
                            </td>
                        </tr>
                    )}
                </React.Fragment>
            ))}
            </tbody>
        </table>
    );
};

export default ExpensesList;
