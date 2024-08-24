import {ExpenseReport} from "@/app/interfaces/noteDeFraisInterface";
import ReportRow from './ReportRow';
import React from "react";
import useStore from "@/app/store/useStore";

interface ReportTableProps {
    reports: ExpenseReport[];
}

const ReportTable: React.FC<ReportTableProps> = ({ reports }) => {
    const status = useStore((state) => state.status);
    const searchTerm = useStore((state) => state.searchTerm).toLowerCase();
    const itemsPerPage = useStore((state) => state.itemsPerPage);
    const currentPage = useStore((state) => state.currentPage);

    const reportFiltered = reports.filter((report) => {
        const matchesFilter = status === 'Toutes' || report.status === status;
        const matchesSearchTerm = report.event.titre.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearchTerm;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedReports = reportFiltered.slice(startIndex, endIndex);

    return (
        <div className="inline-block min-w-full overflow-hidden rounded-lg shadow">
            <table className="min-w-full leading-normal">
                <thead>
                <tr>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                        Note de frais
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                        Date de création
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                        Status
                    </th>
                </tr>
                </thead>
                <tbody>
                {
                    !paginatedReports.length ? (
                        <tr>
                            <td colSpan={3} className="px-5 py-5 text-sm text-gray-600 border-b">
                                Chargement des notes de frais...
                            </td>
                        </tr>
                    ) : (
                        paginatedReports.map((report) => (
                            <ReportRow key={report.id} report={report} />
                        ))
                    )
                }
                </tbody>
            </table>
        </div>
    );
};

export default ReportTable;
