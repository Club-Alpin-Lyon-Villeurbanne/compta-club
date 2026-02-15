import { create } from "zustand";
import { ExpenseReport, PaginationMeta } from "../interfaces/noteDeFraisInterface";


interface StoreState {
    expenseReports: ExpenseReport[];
    paginationMeta: PaginationMeta | null;
    isLoading: boolean;
    status: string;
    itemsPerPage: number;
    currentPage: number;
    searchTerm: string;
    dateFilter: string;
    requesterFilter: string;
    typeFilter: string;
    setExpenseReports: (reports: ExpenseReport[]) => void;
    setPaginationMeta: (meta: PaginationMeta | null) => void;
    setIsLoading: (loading: boolean) => void;
    setStatus: (status: string) => void;
    setItemsPerPage: (items: number) => void;
    setCurrentPage: (page: number) => void;
    setSearchTerm: (term: string) => void;
    setDateFilter: (date: string) => void;
    setRequesterFilter: (requester: string) => void;
    setTypeFilter: (type: string) => void;
    resetFilters: () => void;
}

const useStore = create<StoreState>((set) => ({
    expenseReports: [],
    paginationMeta: null,
    isLoading: false,
    status: 'Toutes',
    itemsPerPage: 10,
    currentPage: 1,
    searchTerm: '',
    dateFilter: '',
    requesterFilter: '',
    typeFilter: '',
    setExpenseReports: (reports) => set({
        expenseReports: Array.isArray(reports) ? reports : []
    }),
    setPaginationMeta: (meta) => set({ paginationMeta: meta }),
    setIsLoading: (loading) => set({ isLoading: loading }),
    setStatus: (status) => set({ status, currentPage: 1 }),
    setItemsPerPage: (items) => set({ itemsPerPage: items, currentPage: 1 }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
    setDateFilter: (date) => set({ dateFilter: date, currentPage: 1 }),
    setRequesterFilter: (requester) => set({ requesterFilter: requester, currentPage: 1 }),
    setTypeFilter: (type) => set({ typeFilter: type, currentPage: 1 }),
    resetFilters: () => set({
        status: 'Toutes',
        searchTerm: '',
        dateFilter: '',
        requesterFilter: '',
        typeFilter: '',
        currentPage: 1
    }),
}));

export default useStore;
