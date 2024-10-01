import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
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
    const dateFilter = useStore((state) => state.dateFilter);
    const requesterFilter = useStore((state) => state.requesterFilter).toLowerCase();
    const typeFilter = useStore((state) => state.typeFilter);

    const reportFiltered = reports.filter((report) => {
        const matchesStatus = status === 'Toutes' || report.status === status;
        const matchesSearchTerm = report.event.titre.toLowerCase().includes(searchTerm);
        const matchesDate = !dateFilter || new Date(report.event.tsp).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
        const matchesRequester = !requesterFilter || 
            (report.user.firstname.toLowerCase() + " " + report.user.lastname.toLowerCase()).includes(requesterFilter);
        const matchesType = !typeFilter || 
            (typeFilter === 'don' && !report.refundRequired) || 
            (typeFilter === 'remboursement' && report.refundRequired);

        return matchesStatus && matchesSearchTerm && matchesDate && matchesRequester && matchesType;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedReports = reportFiltered.slice(startIndex, endIndex);

    return (
        <div className="inline-block min-w-full overflow-hidden rounded-lg shadow">
            <table className="min-w-full leading-normal">
                <thead>
                    <tr>
                        <th className="w-12 px-1 py-2 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                            Com.
                        </th>
                        <th className="w-1/4 px-2 py-2 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                            Note de frais
                        </th>
                        <th className="w-1/6 px-2 py-2 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                            Demandeur
                        </th>
                        <th className="w-24 px-2 py-2 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                            Date sortie
                        </th>
                        <th className="w-24 px-2 py-2 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                            Soumission
                        </th>
                        <th className="w-28 px-2 py-2 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                            Type
                        </th>
                        <th className="w-24 px-2 py-2 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase bg-gray-100 border-b-2 border-gray-200">
                            Statut
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={7} className="px-2 py-3 text-sm text-gray-600 border-b text-center">
                                Chargement des notes de frais...
                            </td>
                        </tr>
                    ) : !reportFiltered.length ? (
                        <tr>
                            <td colSpan={7} className="px-2 py-3 text-sm text-gray-600 border-b text-center">
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