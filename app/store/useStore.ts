import { create } from "zustand";
import ExpenseStatus from "../enums/ExpenseStatus";
import { ExpenseReport } from "../interfaces/noteDeFraisInterface";


interface StoreState {
    expenseReports: ExpenseReport[];
    status: string;
    itemsPerPage: number;
    currentPage: number;
    searchTerm: string;
    dateFilter: string;
    requesterFilter: string;
    typeFilter: string;
    setExpenseReports: (reports: ExpenseReport[]) => void;
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
    status: ExpenseStatus.SUBMITTED,
    itemsPerPage: 10,
    currentPage: 1,
    searchTerm: '',
    dateFilter: '',
    requesterFilter: '',
    typeFilter: '',
    setExpenseReports: (reports) => set({ expenseReports: reports }),
    setStatus: (status) => set({ status }),
    setItemsPerPage: (items) => set({ itemsPerPage: items }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setSearchTerm: (term) => set({ searchTerm: term }),
    setDateFilter: (date) => set({ dateFilter: date }),
    setRequesterFilter: (requester) => set({ requesterFilter: requester }),
    setTypeFilter: (type) => set({ typeFilter: type }),
    resetFilters: () => set({
        status: ExpenseStatus.SUBMITTED,
        searchTerm: '',
        dateFilter: '',
        requesterFilter: '',
        typeFilter: '',
        currentPage: 1
    }),
}));

export default useStore;