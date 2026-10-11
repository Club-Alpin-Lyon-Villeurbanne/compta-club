import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import ReportRow from './ReportRow';
import React, { useEffect, useMemo } from "react";
import useStore from "@/app/store/useStore";
import { useSortableTable } from '@/app/hooks/useSortableTable';
import SortableHeader from './SortableHeader';
import {
    getReportAmount,
    getReportCommission,
    getReportDate,
    getReportTitle,
    getReportType,
    getReportTypeLabel,
    isEventReport,
    statusesOfFilter,
} from '@/app/utils/expenseReport';

interface ReportTableProps {
    reports: ExpenseReport[];
    isLoading: boolean;
}

const ReportTable: React.FC<ReportTableProps> = ({ reports, isLoading }) => {
    const status = useStore((state) => state.status);
    const searchTerm = useStore((state) => state.searchTerm);
    const dateFilter = useStore((state) => state.dateFilter);
    const requesterFilter = useStore((state) => state.requesterFilter);
    const typeFilter = useStore((state) => state.typeFilter);
    const reportTypeFilter = useStore((state) => state.reportTypeFilter);
    const setDisplayedCount = useStore((state) => state.setDisplayedCount);

    // Valeurs affichées, pour le tri : une note hors sortie n'a pas de sortie.
    const reportsWithSortValues = useMemo(() => {
        if (!Array.isArray(reports)) return [];
        return reports.map(report => ({
            ...report,
            reportTypeLabel: getReportTypeLabel(report),
            commissionId: getReportCommission(report)?.id,
            title: getReportTitle(report),
            reportDate: getReportDate(report),
            calculatedAmount: getReportAmount(report)
        }));
    }, [reports]);

    // TODO: Supprimer ce filtrage client-side une fois les ApiFilter déployés sur le backend.
    // En attendant, on filtre dans la page courante pour que les filtres restent fonctionnels.
    const reportFiltered = useMemo(() => {
        const search = searchTerm.toLowerCase();
        const requester = requesterFilter.toLowerCase();
        const statuses = statusesOfFilter(status);
        return reportsWithSortValues.filter((report) => {
            const matchesStatus = !statuses.length || statuses.includes(report.status);
            // Comme côté serveur, la recherche et la date ne portent que sur les sorties : une note hors sortie reste.
            const eventReport = isEventReport(report);
            const matchesSearchTerm = !eventReport || report.title.toLowerCase().includes(search);
            const matchesDate = !dateFilter || !eventReport || new Date(report.reportDate ?? '').toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
            const matchesRequester = !requester ||
                (report.utilisateur.prenom.toLowerCase() + " " + report.utilisateur.nom.toLowerCase()).includes(requester);
            const matchesType = !typeFilter ||
                (typeFilter === 'don' && !report.refundRequired) ||
                (typeFilter === 'remboursement' && report.refundRequired);
            const matchesReportType = !reportTypeFilter || getReportType(report) === reportTypeFilter;

            return matchesStatus && matchesSearchTerm && matchesDate && matchesRequester && matchesType && matchesReportType;
        });
    }, [reportsWithSortValues, status, searchTerm, dateFilter, requesterFilter, typeFilter, reportTypeFilter]);

    // TODO: Supprimer ce useEffect une fois les ApiFilter déployés sur le backend.
    useEffect(() => {
        setDisplayedCount(reportFiltered.length);
    }, [reportFiltered.length, setDisplayedCount]);

    // Utiliser le hook de tri
    const { sortedData, sortConfig, handleSort } = useSortableTable(reportFiltered);

    // Vérifier que reports est bien un tableau
    if (!Array.isArray(reports)) {
        return (
            <div className="inline-block min-w-full overflow-hidden rounded-lg shadow">
                <div className="p-4 text-center text-red-600">
                    Erreur lors du chargement des données
                </div>
            </div>
        );
    }

    return (
        <div className="inline-block min-w-full overflow-hidden rounded-lg shadow">
            <table className="min-w-full leading-normal">
                <thead>
                    <tr>
                        <SortableHeader
                            label="Type"
                            sortKey="reportTypeLabel"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-20 px-2 py-2"
                        />
                        <SortableHeader
                            label="Com."
                            sortKey="commissionId"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-8 px-1 py-2"
                        />
                        <SortableHeader
                            label="Note de frais"
                            sortKey="title"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-1/3 px-2 py-2"
                        />
                        <SortableHeader
                            label="Demandeur"
                            sortKey="utilisateur.nom"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-1/6 px-2 py-2"
                        />
                        <SortableHeader
                            label="Date sortie / dépense"
                            sortKey="reportDate"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-20 px-2 py-2"
                        />
                        <SortableHeader
                            label="Soumission"
                            sortKey="dateCreation"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-20 px-2 py-2"
                        />
                        <SortableHeader
                            label="Montant"
                            sortKey="calculatedAmount"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-20 px-2 py-2"
                        />
                        <SortableHeader
                            label="Don ou remb."
                            sortKey="refundRequired"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-24 px-2 py-2"
                            align="center"
                        />
                        <SortableHeader
                            label="Statut"
                            sortKey="status"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-20 px-2 py-2"
                            align="center"
                        />
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={9} className="px-2 py-3 text-sm text-center text-gray-600 border-b">
                                Chargement des notes de frais...
                            </td>
                        </tr>
                    ) : !reportFiltered.length ? (
                        <tr>
                            <td colSpan={9} className="px-2 py-3 text-sm text-center text-gray-600 border-b">
                                Aucune note de frais ne correspond aux critères de recherche.
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((report) => (
                            <ReportRow key={report.id} report={report} />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ReportTable;
