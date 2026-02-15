import useStore from '@/app/store/useStore';
import React from "react";
import ExpenseStatus, {getExpenseStatusTranslation} from "@/app/enums/ExpenseStatus";
import { FaSearch, FaCalendarAlt, FaUser, FaGift, FaSyncAlt, FaFilter } from 'react-icons/fa';

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
        resetFilters
    } = useStore();

    return (
        <div className="flex flex-wrap items-center gap-2 my-2">
            {/* TODO: Rétablir le sélecteur "par page" une fois les ApiFilter déployés sur le backend. */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FaFilter className="text-gray-400" />
                </div>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="Toutes">Tous statuts</option>
                    {Object.values(ExpenseStatus).map((status) => (
                        <option key={status} value={status}>
                            {getExpenseStatusTranslation(status as ExpenseStatus)}
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
                    className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">Tous types</option>
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
                    placeholder="Rechercher une note de frais"
                    className="block w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
    );
};

export default Filters;