import {ExpenseReport} from "@/app/interfaces/noteDeFraisInterface";
import ReportRow from './ReportRow';
import React from "react";
import useStore from "@/app/store/useStore";

interface ReportTableProps {
    reports: ExpenseReport[];
    isLoading: boolean;
}

const ReportTable: React.FC<ReportTableProps> = ({ reports, isLoading }) => {
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
                    <th className="px-1 py-1 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                        Commission
                    </th>
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
                    {isLoading ? (
                        <tr>
                            <td colSpan={4} className="px-5 py-5 text-sm text-gray-600 border-b text-center">
                                Chargement des notes de frais...
                            </td>
                        </tr>
                    ) : !reportFiltered.length ? (
                        <tr>
                            <td colSpan={4} className="px-5 py-5 text-sm text-gray-600 border-b text-center">
                                Aucune note de frais ne correspond aux critères de recherche.
                            </td>
                        </tr>
                    ) : (
                        paginatedReports.map((report) => (
                            <ReportRow key={report.id} report={report} />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ReportTable;
