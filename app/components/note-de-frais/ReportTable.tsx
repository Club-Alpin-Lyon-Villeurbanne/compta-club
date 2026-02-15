import { ExpenseReport } from "@/app/interfaces/noteDeFraisInterface";
import ReportRow from './ReportRow';
import React, { useMemo } from "react";
import useStore from "@/app/store/useStore";
import { useSortableTable } from '@/app/hooks/useSortableTable';
import SortableHeader from './SortableHeader';
import { calculateTotals } from '@/app/utils/helper';

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

    // Ajouter le montant calculé à chaque rapport pour le tri
    const reportsWithAmount = useMemo(() => {
        if (!Array.isArray(reports)) return [];
        return reports.map(report => ({
            ...report,
            calculatedAmount: calculateTotals(report.details).totalRemboursable
        }));
    }, [reports]);

    // TODO: Supprimer ce filtrage client-side une fois les ApiFilter déployés sur le backend.
    // En attendant, on filtre dans la page courante pour que les filtres restent fonctionnels.
    const reportFiltered = useMemo(() => {
        const search = searchTerm.toLowerCase();
        const requester = requesterFilter.toLowerCase();
        return reportsWithAmount.filter((report) => {
            const matchesStatus = status === 'Toutes' || report.status === status;
            const matchesSearchTerm = report.sortie.titre.toLowerCase().includes(search);
            const matchesDate = !dateFilter || new Date(report.sortie.heureRendezVous).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
            const matchesRequester = !requester ||
                (report.utilisateur.prenom.toLowerCase() + " " + report.utilisateur.nom.toLowerCase()).includes(requester);
            const matchesType = !typeFilter ||
                (typeFilter === 'don' && !report.refundRequired) ||
                (typeFilter === 'remboursement' && report.refundRequired);

            return matchesStatus && matchesSearchTerm && matchesDate && matchesRequester && matchesType;
        });
    }, [reportsWithAmount, status, searchTerm, dateFilter, requesterFilter, typeFilter]);

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
                            label="Com."
                            sortKey="event.commission.id"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-8 px-1 py-2"
                        />
                        <SortableHeader
                            label="Note de frais"
                            sortKey="event.titre"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-1/3 px-2 py-2"
                        />
                        <SortableHeader
                            label="Demandeur"
                            sortKey="user.lastname"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-1/6 px-2 py-2"
                        />
                        <SortableHeader
                            label="Date sortie"
                            sortKey="event.tsp"
                            currentSortKey={sortConfig.key}
                            sortDirection={sortConfig.direction}
                            onSort={handleSort}
                            className="w-20 px-2 py-2"
                        />
                        <SortableHeader
                            label="Soumission"
                            sortKey="createdAt"
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
                            label="Type"
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
                            <td colSpan={8} className="px-2 py-3 text-sm text-center text-gray-600 border-b">
                                Chargement des notes de frais...
                            </td>
                        </tr>
                    ) : !reportFiltered.length ? (
                        <tr>
                            <td colSpan={8} className="px-2 py-3 text-sm text-center text-gray-600 border-b">
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
