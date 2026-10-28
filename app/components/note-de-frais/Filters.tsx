import useStore from '@/app/store/useStore';
import React from "react";
import { REPORT_TYPE_FILTERS, STATUS_FILTERS, sortieFiltersApply } from "@/app/utils/expenseReport";
import { FaSearch, FaCalendarAlt, FaUser, FaGift, FaSyncAlt, FaFilter, FaTags } from 'react-icons/fa';

const SORTIE_FILTERS_HELP_ID = 'filtres-sorties-seulement';

const Filters: React.FC = () => {
    const {
        status,
        setStatus,
        searchTerm,
        setSearchTerm,
        dateFilter,
        setDateFilter,
        requesterFilter,
        setRequesterFilter,
        typeFilter,
        setTypeFilter,
        reportTypeFilter,
        setReportTypeFilter,
        resetFilters
    } = useStore();
    const sortieFiltersDisabled = !sortieFiltersApply(reportTypeFilter);
    const sortieFiltersTitle = sortieFiltersDisabled ? "La recherche et la date portent sur les sorties" : undefined;
    // Un champ désactivé ne prend pas le focus et son title ne s'affiche qu'à la souris : la raison est aussi écrite.
    const sortieFiltersHelp = sortieFiltersDisabled ? SORTIE_FILTERS_HELP_ID : undefined;

    return (
        <div className="my-2">
            <div className="flex flex-wrap items-center gap-2">
                {/* TODO: Rétablir le sélecteur "par page" une fois les ApiFilter déployés sur le backend. */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaFilter className="text-gray-400" />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        aria-label="Statut"
                        className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {STATUS_FILTERS.map(({ value, label }) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaTags className="text-gray-400" />
                    </div>
                    <select
                        value={reportTypeFilter}
                        onChange={(e) => setReportTypeFilter(e.target.value)}
                        aria-label="Type de note"
                        className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {REPORT_TYPE_FILTERS.map(({ value, label }) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaCalendarAlt className="text-gray-400" />
                    </div>
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        disabled={sortieFiltersDisabled}
                        title={sortieFiltersTitle}
                        aria-describedby={sortieFiltersHelp}
                        aria-label="Date de la sortie"
                        className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaUser className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={requesterFilter}
                        onChange={(e) => setRequesterFilter(e.target.value)}
                        placeholder="Nom du demandeur"
                        className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaGift className="text-gray-400" />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        aria-label="Don ou remboursement"
                        className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Dons et remboursements</option>
                        <option value="don">Don</option>
                        <option value="remboursement">Remboursement</option>
                    </select>
                </div>
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FaSearch className="text-gray-400" />
                    </div>
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={sortieFiltersDisabled}
                        title={sortieFiltersTitle}
                        aria-describedby={sortieFiltersHelp}
                        placeholder="Rechercher une sortie"
                        className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>
                <button
                    onClick={resetFilters}
                    className="p-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    title="Réinitialiser les filtres"
                >
                    <FaSyncAlt />
                </button>
            </div>
            {sortieFiltersDisabled && (
                <p id={SORTIE_FILTERS_HELP_ID} className="mt-2 text-sm text-gray-600">
                    La recherche et la date portent sur les sorties.
                </p>
            )}
        </div>
    );
};

export default Filters;